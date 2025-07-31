const Client = require('../models/Client');
const Project = require('../models/Project');
const { ErrorResponse } = require('../middleware/errorHandler');
const { logger } = require('../utils/logger');

/**
 * @desc    Get all clients
 * @route   GET /api/clients
 * @access  Private
 */
exports.getClients = async (req, res, next) => {
    try {
        // Pagination
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 10;
        const startIndex = (page - 1) * limit;

        // Filtering
        const filter = {};
        if (req.query.status) {
            filter.status = req.query.status;
        }
        if (req.query.industry) {
            filter.industry = req.query.industry;
        }

        // Search
        if (req.query.search) {
            filter.$or = [
                { name: { $regex: req.query.search, $options: 'i' } },
                { contactName: { $regex: req.query.search, $options: 'i' } },
                { contactEmail: { $regex: req.query.search, $options: 'i' } }
            ];
        }

        // Sort
        const sort = {};
        if (req.query.sort) {
            const fields = req.query.sort.split(',');
            fields.forEach(field => {
                if (field.startsWith('-')) {
                    sort[field.substring(1)] = -1;
                } else {
                    sort[field] = 1;
                }
            });
        } else {
            sort.createdAt = -1;
        }

        // Get total count
        const total = await Client.countDocuments(filter);

        // Execute query
        const clients = await Client.find(filter)
            .sort(sort)
            .skip(startIndex)
            .limit(limit)
            .lean();

        // Get unique industries and statuses for filters
        const industries = await Client.distinct('industry');
        const statuses = await Client.distinct('status');

        res.status(200).json({
            success: true,
            data: clients,
            total,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            },
            filters: {
                industries,
                statuses
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get single client
 * @route   GET /api/clients/:id
 * @access  Private
 */
exports.getClient = async (req, res, next) => {
    try {
        const client = await Client.findById(req.params.id).populate({
            path: 'createdBy',
            select: 'name email'
        });

        if (!client) {
            return next(new ErrorResponse(`Client not found with id of ${req.params.id}`, 404));
        }

        res.status(200).json({
            success: true,
            data: client,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Create client
 * @route   POST /api/clients
 * @access  Private
 */
// Updated createClient function
exports.createClient = async (req, res, next) => {
  try {
    console.log("Call");
    
    console.log('CreateClient req.body:', req.body);

    const allowedFields = [
      'name', 'contactName', 'contactEmail', 'contactPhone', 'website', 'industry', 'notes', 'status',
      'country', 'state', 'city', 'pin', 'gstin', 'pan', 'cin', 'currencyFormat', 'directors'
    ];

    const clientData = {};
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        clientData[field] = req.body[field];
      }
    });

    // Validate directors
    // if (!clientData.directors || !Array.isArray(clientData.directors) || clientData.directors.length < 2) {
    //   return next(new ErrorResponse('At least 2 valid directors are required', 400));
    // }

    // Ensure directors are trimmed and non-empty
    clientData.directors = clientData.directors
      .map(d => d ? d.trim() : '')
      .filter(d => d !== '');

    // if (clientData.directors.length < 2) {
    //   return next(new ErrorResponse('At least 2 valid directors are required', 400));
    // }

    clientData.createdBy = req.user.id;

    const existingClient = await Client.findOne({ name: clientData.name });
    if (existingClient) {
      return next(new ErrorResponse(`Client with name ${clientData.name} already exists`, 400));
    }

    const client = await Client.create(clientData);
    console.log('Created client with directors:', client.directors);

    logger.info(`Client created: ${client.name} (${client._id}) by ${req.user.name} (${req.user._id})`);

    res.status(201).json({
      success: true,
      data: client,
    });
  } catch (error) {
    console.error('Error creating client:', error);
    next(error);
  }
};
/**
 * @desc    Update client
 * @route   PUT /api/clients/:id
 * @access  Private
 */
// Updated updateClient function
exports.updateClient = async (req, res, next) => {
    console.log('UpdateClient req.body:', req.body);
  try {
    let client = await Client.findById(req.params.id);
    if (!client) {
      return next(new ErrorResponse(`Client not found with id of ${req.params.id}`, 404));
    }

    console.log('UpdateClient req.body:', req.body);

    const allowedFields = [
      'name', 'contactName', 'contactEmail', 'contactPhone', 'website', 'industry', 'notes', 'status',
      'country', 'state', 'city', 'pin', 'gstin', 'pan', 'cin', 'currencyFormat', 'directors'
    ];

    const updateData = {};
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    });
console.log('req.body.directors:', req.body.directors);
    // Validate directors if provided
    if (updateData.directors) {
      if (!Array.isArray(updateData.directors) || updateData.directors.length < 2) {
        return next(new ErrorResponse('At least 2 valid directors are required', 400));
      }
      updateData.directors = updateData.directors
        .map(d => d ? d.trim() : '')
        .filter(d => d !== '');
      if (updateData.directors.length < 2) {
        return next(new ErrorResponse('At least 2 valid directors are required', 400));
      }
    }

    if (updateData.name && updateData.name !== client.name) {
      const existingClient = await Client.findOne({ name: updateData.name });
      if (existingClient) {
        return next(new ErrorResponse(`Client with name ${updateData.name} already exists`, 400));
      }
    }

    client = await Client.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    });

    console.log('Updated client with directors:', client.directors);

    logger.info(`Client updated: ${client.name} (${client._id}) by ${req.user.name} (${req.user._id})`);

    res.status(200).json({
      success: true,
      data: client,
    });
  } catch (error) {
    console.error('Error updating client:', error);
    next(error);
  }
};

/**
 * @desc    Delete client
 * @route   DELETE /api/clients/:id
 * @access  Private/Admin
 */
exports.deleteClient = async (req, res, next) => {
    try {
        const client = await Client.findById(req.params.id);

        if (!client) {
            return next(new ErrorResponse(`Client not found with id of ${req.params.id}`, 404));
        }

        // Check if client has associated projects
        const projectCount = await Project.countDocuments({ client: req.params.id });
        if (projectCount > 0) {
            return next(new ErrorResponse(`Cannot delete client with ${projectCount} associated projects`, 400));
        }

        // Log the client deletion
        logger.info(`Client deleted: ${client.name} (${client._id}) by ${req.user.name} (${req.user._id})`);

        await client.deleteOne();

        res.status(200).json({
            success: true,
            data: {},
            message: 'Client deleted successfully',
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Upload client logo
 * @route   PUT /api/clients/:id/logo
 * @access  Private
 */
exports.uploadLogo = async (req, res, next) => {
    try {
        const client = await Client.findById(req.params.id);

        if (!client) {
            return next(new ErrorResponse(`Client not found with id of ${req.params.id}`, 404));
        }

        if (!req.file) {
            return next(new ErrorResponse('Please upload a file', 400));
        }

        // Update logo path in database
        const logoPath = `/uploads/logos/${req.file.filename}`;

        const updatedClient = await Client.findByIdAndUpdate(
            req.params.id,
            { logo: logoPath },
            {
                new: true,
                runValidators: true,
            }
        );

        // Log the logo update
        logger.info(`Logo updated for client: ${client.name} (${client._id}) by ${req.user.name} (${req.user._id})`);

        res.status(200).json({
            success: true,
            data: updatedClient,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get client projects
 * @route   GET /api/clients/:id/projects
 * @access  Private
 */
exports.getClientProjects = async (req, res, next) => {
    try {
        const client = await Client.findById(req.params.id);

        if (!client) {
            return next(new ErrorResponse(`Client not found with id of ${req.params.id}`, 404));
        }

        const projects = await Project.find({ client: req.params.id })
            .populate({
                path: 'createdBy',
                select: 'name email'
            })
            .populate({
                path: 'assignedTo',
                select: 'name email'
            });

        res.status(200).json({
            success: true,
            count: projects.length,
            data: projects,
        });
    } catch (error) {
        next(error);
    }
}; 