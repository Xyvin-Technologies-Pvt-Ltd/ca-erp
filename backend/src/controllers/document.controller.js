const Document = require('../models/Document');
const Project = require('../models/Project');
const fs = require('fs');
const path = require('path');
const { ErrorResponse } = require('../middleware/errorHandler');
const { logger } = require('../utils/logger');
const ActivityTracker = require('../utils/activityTracker');

/**
 * @desc    Get all documents
 * @route   GET /api/documents
 * @access  Private
 */
exports.getDocuments = async (req, res, next) => {
    try {
        console.log('Query:', req.query, req.user.role);

        // Pagination
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 10;
        const startIndex = (page - 1) * limit;
        const endIndex = page * limit;

        // Get valid (non-deleted) projects first
        const validProjects = await Project.find({ deleted: { $ne: true } }, '_id');
        const validProjectIds = validProjects.map(p => p._id);

        // Filtering
        const filter = {};
        if (req.query.category) {
            filter.category = req.query.category;
        }
        if (req.query.project) {
            filter.project = req.query.project;
        } else {
            // Only show documents from non-deleted projects
            filter.project = { $in: validProjectIds };
        }
        if (req.query.status) {
            filter.status = req.query.status;
        }
        if (req.query.type) {
            filter.fileType = req.query.type;
        }
        if (req.query.uploadedBy) {
            filter.CreatedBy = req.query.uploadedBy;
        }

        // If user is not admin, only show documents they have access to
        if (req.user.role !== 'admin' && req.user.role !== 'manager') {
            filter.$or = [
                { createdBy: req.user.id },
                { sharedWith: req.user.id }
            ];
        }

        // Search functionality
        if (req.query.search) {
            if (filter.$or) {
                filter.$and = [
                    { $or: filter.$or },
                    {
                        $or: [
                            { name: { $regex: req.query.search, $options: 'i' } },
                            { description: { $regex: req.query.search, $options: 'i' } }
                        ]
                    }
                ];
                delete filter.$or;
            } else {
                filter.$or = [
                    { name: { $regex: req.query.search, $options: 'i' } },
                    { description: { $regex: req.query.search, $options: 'i' } }
                ];
            }
        }

        const total = await Document.countDocuments(filter);

        // Query with filters and sort
        const documents = await Document.find(filter)
            .skip(startIndex)
            .limit(limit)
            .sort({ createdAt: -1 })
            .populate({
                path: 'project',
                select: 'name projectNumber',
                match: { deleted: { $ne: true } } // Add this to filter out deleted projects
            })
            .populate({
                path: 'uploadedBy',
                select: 'name email'
            })
            .populate({
                path: 'sharedWith',
                select: 'name email'
            });

        // Filter out documents where project population failed (project was deleted)
        const validDocuments = documents.filter(doc => doc.project != null);

        // Pagination result
        const pagination = {};
        if (endIndex < total) {
            pagination.next = {
                page: page + 1,
                limit,
            };
        }
        if (startIndex > 0) {
            pagination.prev = {
                page: page - 1,
                limit,
            };
        }

        res.status(200).json({
            success: true,
            count: validDocuments.length,
            pagination,
            total: validDocuments.length,
            data: validDocuments,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get single document
 * @route   GET /api/documents/:id
 * @access  Private
 */
exports.getDocument = async (req, res, next) => {
    try {
        const document = await Document.findById(req.params.id)
            .populate({
                path: 'project',
                select: 'name projectNumber'
            })
            .populate({
                path: 'createdBy',
                select: 'name email'
            })
            .populate({
                path: 'sharedWith',
                select: 'name email'
            });

        if (!document) {
            return next(new ErrorResponse(`Document not found with id of ${req.params.id}`, 404));
        }

        // Check access - only admin, creator, and shared users can view
        if (
            req.user.role !== 'admin' && 
            req.user.role !== 'manager' && 
            document.createdBy._id.toString() !== req.user.id.toString() &&
            !document.sharedWith.some(user => user._id.toString() === req.user.id.toString())
        ) {
            return next(new ErrorResponse(`User not authorized to access this document`, 403));
        }

        res.status(200).json({
            success: true,
            data: document,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Create document
 * @route   POST /api/documents
 * @access  Private
 */
exports.createDocument = async (req, res, next) => {
    try {
        // Add user to req.body
        req.body.uploadedBy = req.user.id;
        req.body.fileUrl = `/uploads/documents/${req.file.filename}`;
        req.body.fileType = req.file.mimetype;
        req.body.name = req.file.originalname; 
        req.body.fileSize = req.file.size;
        // Check if project exists
        if (req.body.project) {
            const project = await Project.findById(req.body.project);
            if (!project) {
                return next(new ErrorResponse(`Project not found with id of ${req.body.project}`, 404));
            }
        }

        // If file was uploaded, add file info
        if (req.file) {
            req.body.file = {
                path: `/uploads/documents/${req.file.filename}`,
                originalName: req.file.originalname,
                mimeType: req.file.mimetype,
                size: req.file.size
            };
        }

        const document = await Document.create(req.body);

        // Log the document creation
        logger.info(`Document created: ${document.name} (${document._id}) by ${req.user.name} (${req.user._id})`);

         // Track activity
    try {
        await ActivityTracker.track({
          type: 'document_uploaded',
          title: 'Document Uploaded',
          description: `Document "${document.name}" was uploaded${req.body.project ? ` to project "${req.body.project}"` : ''}`,
          entityType: 'document',
          entityId: document._id,
          userId: req.user._id,
          link: `/documents/${document._id}`,
        });
        logger.info(`Activity tracked for document creation ${document._id}`);
      } catch (activityError) {
        logger.error(`Failed to track activity for document creation ${document._id}: ${activityError.message}`);
      }
        res.status(201).json({
            success: true,
            data: document,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Update document
 * @route   PUT /api/documents/:id
 * @access  Private
 */
exports.updateDocument = async (req, res, next) => {
    try {
        let document = await Document.findById(req.params.id);

        if (!document) {
            return next(new ErrorResponse(`Document not found with id of ${req.params.id}`, 404));
        }
       

        // Check access - only admin and creator can update
        if (req.user.role !== 'admin' && req.user.role !== 'manager' && document.uploadedBy.toString() !== req.user.id.toString()) {
            return next(new ErrorResponse(`User not authorized to update this document`, 403));
        }

        // Check if project exists
        if (req.body.project) {
            const project = await Project.findById(req.body.project);
            if (!project) {
                return next(new ErrorResponse(`Project not found with id of ${req.body.project}`, 404));
            }
        }
  
        // If file was uploaded, add file info and remove old file if exists
        if (req.file) {
            // Remove old file if exists
            if (document.file && document.file.path) {
                const oldFilePath = path.join(__dirname, '../../public', document.file.path);
                if (fs.existsSync(oldFilePath)) {
                    fs.unlinkSync(oldFilePath);
                }
            }
            console.log(req.file,"44444444444444444444")
            req.body.CreatedBy  = req.user.id;
            req.body.fileUrl = `/uploads/documents/${req.file.filename}`;
            req.body.fileType = req.file.mimetype;
            req.body.name = req.file.originalname;
            req.body.fileSize = req.file.size;
            // req.body.file = {
            //     path: `/uploads/documents/${req.file.filename}`,
            //     originalName: req.file.originalname,
            //     mimeType: req.file.mimetype,
            //     size: req.file.size
            // };
        }

        document = await Document.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true,
        }).populate({
            path: 'project',
            select: 'name projectNumber'
        })
            .populate({
                path: 'uploadedBy',
                select: 'name email'
            })
            .populate({
                path: 'sharedWith',
                select: 'name email'
            });

        // Log the document update
        logger.info(`Document updated: ${document.name} (${document._id}) by ${req.user.name} (${req.user._id})`);

        res.status(200).json({
            success: true,
            data: document,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Delete document
 * @route   DELETE /api/documents/:id
 * @access  Private
 */
exports.deleteDocument = async (req, res, next) => {
    try {
        const document = await Document.findById(req.params.id);

        if (!document) {
            return next(new ErrorResponse(`Document not found with id of ${req.params.id}`, 404));
        }

        // Check access - only admin and creator can delete
        if (req.user.role !== 'admin' && req.user.role !== 'manager' && document.createdBy.toString() !== req.user.id.toString()) {
            return next(new ErrorResponse(`User not authorized to delete this document`, 403));
        }

        // Remove file if exists
        if (document.file && document.file.path) {
            const filePath = path.join(__dirname, '../../public', document.file.path);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        }

        // Log the document deletion
        logger.info(`Document deleted: ${document.name} (${document._id}) by ${req.user.name} (${req.user._id})`);

        await document.deleteOne();

        res.status(200).json({
            success: true,
            data: {},
            message: 'Document deleted successfully',
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Share document with users
 * @route   PUT /api/documents/:id/share
 * @access  Private
 */
exports.shareDocument = async (req, res, next) => {
    try {
        const { userIds } = req.body;

        if (!userIds || !Array.isArray(userIds)) {
            return next(new ErrorResponse('Please provide an array of user IDs', 400));
        }

        let document = await Document.findById(req.params.id);

        if (!document) {
            return next(new ErrorResponse(`Document not found with id of ${req.params.id}`, 404));
        }

        // Check access - only admin and creator can share
        if (req.user.role !== 'admin' && req.user.role !== 'manager' && document.createdBy.toString() !== req.user.id.toString()) {
            return next(new ErrorResponse(`User not authorized to share this document`, 403));
        }

        // Update the document's sharedWith array
        document = await Document.findByIdAndUpdate(
            req.params.id,
            { sharedWith: userIds },
            {
                new: true,
                runValidators: true,
            }
        ).populate({
            path: 'sharedWith',
            select: 'name email'
        });

        // Log the document sharing
        logger.info(`Document shared: ${document.name} (${document._id}) by ${req.user.name} (${req.user._id})`);

        res.status(200).json({
            success: true,
            data: document,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Download document
 * @route   GET /api/documents/:id/download
 * @access  Private
 */
exports.downloadDocument = async (req, res, next) => {

    try {
        const document = await Document.findById(req.params.id);

        if (!document) {
            return next(new ErrorResponse(`Document not found with id of ${req.params.id}`, 404));
        }

        // Check access - only admin, creator, and shared users can download
        // if (
        //     req.user.role !== 'admin' && 
        //     req.user.role !== 'manager' &&
        //     document.createdBy.toString() !== req.user.id.toString() &&
        //     !document.sharedWith.some(userId => userId.toString() === req.user.id.toString())
        // ) {
        //     return next(new ErrorResponse(`User not authorized to download this document`, 403));
        // }

        // Check if file exists
        if (!document.fileUrl || !document.fileUrl) {
            return next(new ErrorResponse(`No file found for this document`, 404));
        }

        const filePath = path.join(__dirname, '../../public', document.fileUrl);
        console.log('📂 document.fileUrl:', document.fileUrl);
        console.log('📁 Resolved file path:', filePath);
        console.log('📂 File exists:', fs.existsSync(filePath));

        if (!fs.existsSync(filePath)) {
            return next(new ErrorResponse(`File not found`, 404));
        }

        // Log the document download
        logger.info(`Document downloaded: ${document.name} (${document._id}) by ${req.user.name} (${req.user._id})`);

        // Send the file
        res.download(filePath, document.name);
    } catch (error) {
        next(error);
    }
};