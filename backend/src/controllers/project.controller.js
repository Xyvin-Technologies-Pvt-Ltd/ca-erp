const Project = require('../models/Project');
const Task = require('../models/Task');
const Client = require('../models/Client');
const Invoice = require('../models/Invoice'); // Add this import
const { ErrorResponse } = require('../middleware/errorHandler');
const { logger } = require('../utils/logger');
const ActivityTracker = require('../utils/activityTracker');

/**
 * @desc    Get all projects
 * @route   GET /api/projects
 * @access  Private
 */
exports.getProjects = async (req, res, next) => {
    try {
        // Pagination
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 10;
        const startIndex = (page - 1) * limit;
        const endIndex = page * limit;

        // Filtering
        const filter = { deleted: { $ne: true } };
        if (req.query.status) {
            filter.status = req.query.status;
        }
        if (req.query.client) {
            filter.client = req.query.client;
        }
        if (req.query.assignedTo) {
            filter.assignedTo = req.query.assignedTo;
        }
        const total = await Project.countDocuments(filter);

        // If user is not admin, only show projects they are assigned to
        // if (req.user.role !== 'admin' && req.user.role !== 'finance' && req.user.role !== 'manager' ) {
        //     filter.assignedTo = req.user.id;
        // }

        // Search
        if (req.query.search) {
            filter.$or = [
                { name: { $regex: req.query.search, $options: 'i' } },
                { description: { $regex: req.query.search, $options: 'i' } }
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

        // Query with filters and sort
        const projects = await Project.find(filter)
            .skip(startIndex)
            .limit(limit)
            .sort(sort)
            .populate({
                path: 'client',
                select: 'name contactName contactEmail'
            })
            .populate({
                path: 'assignedTo',
                select: 'name email avatar'
            })
            .populate({
                path: 'createdBy',
                select: 'name email'
            })
            .populate({
                path: 'documents',
                select: 'name fileUrl category uploadedBy createdAt deleted',
                populate: {
                    path: 'uploadedBy',
                    select: 'name email',
                },
            });;

 if (req.query.includeInvoiceStatus) {
            const projectsWithInvoiceStatus = await Promise.all(
                projects.map(async (project) => {
                    const projectObj = project.toObject();
                    
                    // First check if the project already has an invoiceStatus
                    if (project.invoiceStatus === 'Created') {
                        projectObj.invoiceStatus = 'Created';
                        return projectObj;
                    }

                    // If not, check for invoice in the Invoice collection
                    const invoice = await Invoice.findOne({
                        'items': {
                            $elemMatch: {
                                'projectId': project._id
                            }
                        }
                    });

                    projectObj.invoiceStatus = invoice ? 'Created' : 'Not Created';
                    
                    // If invoice exists, update the project's invoice status
                    if (invoice && project.invoiceStatus !== 'Created') {
                        await Project.findByIdAndUpdate(project._id, {
                            invoiceStatus: 'Created'
                        });
                    }

                    return projectObj;
                })
            );
            
            const data = {
                success: true,
                count: projectsWithInvoiceStatus.length,
                pagination: {
                    page,
                    limit,
                    total
                },
                projects: projectsWithInvoiceStatus
            };
            
            return res.status(200).json(data);
        }

            
        // 🧠 Add completion stats for each project
        const projectsWithStats = await Promise.all(projects.map(async (project) => {
            const taskIds = project.tasks || [];
            const totalTasks = taskIds.length;

            let completedTasks = 0;
            if (totalTasks > 0) {
                completedTasks = await Task.countDocuments({
                    _id: { $in: taskIds },
                    status: 'completed',
                });
            }

            const completionPercentage = totalTasks > 0
                ? Math.round((completedTasks / totalTasks) * 100)
                : 0;

            const projectObj = project.toObject();
            projectObj.totalTasks = totalTasks;
            projectObj.completedTasks = completedTasks;
            projectObj.completionPercentage = completionPercentage;

            return projectObj;
        }));

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
            count: projects.length,
            pagination,
            total,
            data: projectsWithStats,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get single project
 * @route   GET /api/projects/:id
 * @access  Private
 */
exports.getProject = async (req, res, next) => {
    try {
        const project = await Project.findById(req.params.id)
            .populate({
                path: 'client',
                select: 'name contactName contactEmail'
            })
            .populate({
                path: 'assignedTo',
                select: 'name email avatar'
            })
            .populate({
                path: 'createdBy',
                select: 'name email avatar'
            })
            .populate({
                path: 'team',
                model: 'User', // 👈 Ensures it's pulling from User collection
                select: 'name email role department avatar', // ⬅️ Add any fields you want
            })
            .populate({
                path: 'documents',
                match: { deleted: false },
                select: 'name fileUrl category uploadedBy createdAt deleted',
                populate: {
                    path: 'uploadedBy',
                    select: 'name email',
                },
            })
            .populate({
                path: 'notes.author',
                select: 'name email role avatar', // or whichever fields you want
            });

        if (!project) {
            return next(new ErrorResponse(`Project not found with id of ${req.params.id}`, 404));
        }
        if (project.deleted) {
            return next(new ErrorResponse(`Project not found with id of ${req.params.id}`, 404));
        }
        // // Check access - only admin and assigned users can view
        // if (req.user.role !== 'admin' && project.assignedTo.toString() !== req.user.id.toString()) {
        //     return next(new ErrorResponse(`User not authorized to access this project`, 403));
        // }

        const projectObject = project.toObject(); // Convert Mongoose doc to plain object
        // 🧠 Calculate task completion stats
        const taskIds = project.tasks; // array of ObjectId
        const totalTasks = taskIds.length;

        let completedTasks = 0;
        if (totalTasks > 0) {
            completedTasks = await Task.countDocuments({
                _id: { $in: taskIds },
                status: 'completed',
            });
        }

        const completionPercentage = totalTasks > 0
            ? Math.round((completedTasks / totalTasks) * 100)
            : 0;

        projectObject.totalTasks = totalTasks;
        projectObject.completedTasks = completedTasks;
        projectObject.completionPercentage = completionPercentage;
        // Remove budget if user is not admin or finance
        if (!['admin','manager', 'finance'].includes(req.user.role)) {
            delete projectObject.budget;
        }

        res.status(200).json({
            success: true,
            data: projectObject,
        });

    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Create project
 * @route   POST /api/projects
 * @access  Private
 */
exports.createProject = async (req, res, next) => {
    try {
        // Add user to req.body
        req.body.createdBy = req.user.id;
        console.log(req.body)
        // Check if client exists
        if (req.body.client) {
            const client = await Client.findById(req.body.client);
            if (!client) {
                return next(new ErrorResponse(`Client not found with id of ${req.body.client}`, 404));
            }
        }

        // Generate project number if not provided
        if (!req.body.projectNumber) {
            const date = new Date();
            const year = date.getFullYear().toString().substr(-2);
            const month = (date.getMonth() + 1).toString().padStart(2, '0');

            const lastProject = await Project.findOne({})
                .sort({ createdAt: -1 });

            let sequence = '001';
            if (lastProject && lastProject.projectNumber) {
                const lastNumber = lastProject.projectNumber.split('-')[2];
                if (lastNumber) {
                    sequence = (parseInt(lastNumber) + 1).toString().padStart(3, '0');
                }
            }

            req.body.projectNumber = `PRJ-${year}${month}-${sequence}`;
        }
  
        
        const project = await Project.create(req.body);

        // Log the project creation
        logger.info(`Project created: ${project.name} (${project._id}) by ${req.user.name} (${req.user._id})`);
         // Track activity
    try {
        await ActivityTracker.trackProjectCreated(project, req.user._id);
        logger.info(`Activity tracked for project creation ${project._id}`);
      } catch (activityError) {
        logger.error(`Failed to track activity for project creation ${project._id}: ${activityError.message}`);
      }

        res.status(201).json({
            success: true,
            data: project,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Update project
 * @route   PUT /api/projects/:id
 * @access  Private
 */
exports.updateProject = async (req, res, next) => {
    try {
      logger.info(`Starting project update for ID: ${req.params.id} by user: ${req.user.name} (${req.user._id})`);
      console.log('Request body:', JSON.stringify(req.body, null, 2));
  
      let project = await Project.findById(req.params.id);
      if (!project) {
        return next(new ErrorResponse(`Project not found with id of ${req.params.id}`, 404));
      }
  
      // Check access - only admin and assigned users can update
      const isAdmin = req.user.role === 'admin';
      const isManager = req.user.role === 'manager';
      // console.log(isTeamMember, "isTeamMember")
      const isTeamMember = project.team && Array.isArray(project.team) && 
  project.team.some(teamMember => 
      teamMember && teamMember.toString() === req.user.id.toString()
  );

      if (!isAdmin && !isTeamMember && !isManager) {
          return next(new ErrorResponse("User not authorized to access this project", 403));
      }
  
      // Check if client exists
      if (req.body.client) {
        const client = await Client.findById(req.body.client);
        console.log('Client found:', client);
        if (!client) {
          return next(new ErrorResponse(`Client not found with id of ${req.body.client}`, 404));
        }
      }
  
      // Handle notes if provided
      if (req.body.notes && Array.isArray(req.body.notes)) {
        req.body.notes = req.body.notes.map(note => ({
          ...note,
          author: req.user._id,
          createdAt: note.createdAt || new Date(),
        }));
      }
  
      // Check for changed fields
      const originalProject = project.toObject();
      const changedFields = Object.keys(req.body).filter(key => {
        if (key === 'notes') return false; // Skip notes for comparison
        if (typeof originalProject[key] === 'object' && originalProject[key] && req.body[key]) {
          return originalProject[key].toString() !== req.body[key].toString();
        }
        return originalProject[key] !== req.body[key];
      });
      logger.debug(`Changed fields: ${JSON.stringify(changedFields)}, req.body: ${JSON.stringify(req.body)}`);
      console.log('changedFields before tracking:', changedFields);
  
      // Update project
      project = await Project.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true,
      }).populate({
        path: 'client',
        select: 'name contactName contactEmail',
      }).populate({
        path: 'assignedTo',
        select: 'name email avatar',
      });
  
      // Log the project update
      logger.info(`Project updated: ${project.name} (${project._id}) by ${req.user.name} (${req.user._id})`);
  
      // Track activity for project update
      try {
        if (changedFields.length > 0) {
          const changesSummary = changedFields.map(field => {
            const oldValue = originalProject[field] ? originalProject[field].toString() : 'none';
            const newValue = req.body[field] ? req.body[field].toString() : 'none';
            return `${field}: ${oldValue} → ${newValue}`;
          }).join(', ');
          await ActivityTracker.track({
            type: 'project_updated',
            title: 'Project Updated',
            description: `Project "${project.name}" was updated. Changes: ${changesSummary}`,
            entityType: 'project',
            entityId: project._id,
            userId: req.user._id,
            link: `/projects/${project._id}`,
          });
          logger.info(`Activity tracked for project update ${project._id}`);
        } else {
          logger.debug(`No activity tracked for project ${project._id}: No significant changes detected`);
        }
      } catch (activityError) {
        logger.error(`Failed to track activity for project update ${project._id}: ${activityError.message}`);
      }
  
      res.status(200).json({
        success: true,
        data: project,
      });
    } catch (error) {
      logger.error(`Project update error: ${error.message}`);
      next(error);
    }
  };

/**
 * @desc    Delete project
 * @route   DELETE /api/projects/:id
 * @access  Private/Admin
 */
exports.deleteProject = async (req, res, next) => {
    try {
        const project = await Project.findById(req.params.id);

        if (!project) {
            return next(new ErrorResponse(`Project not found with id of ${req.params.id}`, 404));
        }

        // Check if project has associated tasks
        const taskCount = await Task.countDocuments({ project: req.params.id });
        if (taskCount > 0) {
            return next(new ErrorResponse(`Cannot delete project with ${taskCount} associated tasks`, 400));
        }

        // Log the project deletion
        logger.info(`Project deleted: ${project.name} (${project._id}) by ${req.user.name} (${req.user._id})`);

        await project.deleteOne();

        res.status(200).json({
            success: true,
            data: {},
            message: 'Project deleted successfully',
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get project tasks
 * @route   GET /api/projects/:id/tasks
 * @access  Private
 */
exports.getProjectTasks = async (req, res, next) => {
    try {
        console.log(req.params.id,"4444444444444444444444444")
        const project = await Project.findById(req.params.id);

        if (!project) {
            return next(new ErrorResponse(`Project not found with id of ${req.params.id}`, 404));
        }
        // const page = parseInt(req.query.page, 10) || 1;
        // const limit = parseInt(req.query.limit, 10) || 10;
        // const startIndex = (page - 1) * limit;
        // const endIndex = page * limit;

        // Check access - only admin and assigned users can view
        // if (req.user.role !== 'admin' && project.assignedTo.toString() !== req.user.id.toString()) {
        //     return next(new ErrorResponse(User not authorized to access this project, 403));
        // }

        const isAdmin = req.user.role === 'admin';
        const isManager = req.user.role === 'manager';
        // console.log(isTeamMember, "isTeamMember")
        const isTeamMember = project.team && 
            project.team.some(teamMember => 
                teamMember.toString() === req.user.id.toString()
            );

        if (!isAdmin && !isTeamMember && !isManager) {
            return next(new ErrorResponse("User not authorized to access this project", 403));
        }

        // Filtering
        const filter = { project: req.params.id, deleted: false };

        if (req.query.status) {
            filter.status = req.query.status;
        }
        if (req.query.assignedTo) {
            filter.assignedTo = req.query.assignedTo;
        }
        if (req.query.priority) {
            filter.priority = req.query.priority;
        }

        //pagination
       
        // const total = await Task.countDocuments(filter);


        const tasks = await Task.find(filter)
            .sort({ dueDate: 1, priority: -1 })
            // .skip(startIndex)
            // .limit(limit)
            .populate({
                path: 'assignedTo',
                select: 'name email avatar'
            })
            .populate({
                path: 'createdBy',
                select: 'name email'
            });

        //      const pagination = {};

        //     if (endIndex < total) {
        //         pagination.next = {
        //             page: page + 1,
        //             limit,
        //         };
        //     }

        //     if (startIndex > 0) {
        //         pagination.prev = {
        //             page: page - 1,
        //             limit,
        //     };
        // }


        res.status(200).json({
            success: true,
            count: tasks.length,
            // pagination,
            // total,
            data: tasks,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Update project status
 * @route   PUT /api/projects/:id/status
 * @access  Private
 */
exports.updateProjectStatus = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { status } = req.body; // Assuming status is passed in the request body

        // Check if the status is valid (you can add additional checks here)
        const validStatuses = ['Not Started', 'In Progress', 'Completed'];
        if (!validStatuses.includes(status)) {
            return next(new ErrorResponse('Invalid status value', 400));
        }

        // Find project by ID
        let project = await Project.findById(id);

        if (!project) {
            return next(new ErrorResponse(`Project not found with id of ${id}`, 404));
        }

        // Check if the user is authorized to update the project (admin or assigned user)
       

        const isAdmin = req.user.role === 'admin';
        const isManager = req.user.role === 'manager';
        // console.log(isTeamMember, "isTeamMember")
        const isTeamMember = project.team && Array.isArray(project.team) && 
    project.team.some(teamMember => 
        teamMember && teamMember.toString() === req.user.id.toString()
    );

        if (!isAdmin && !isTeamMember && !isManager) {
            return next(new ErrorResponse("User not authorized to access this project", 403));
        }
        // Update the project status
        project.status = status;

        // Save the updated project
        project = await project.save();

        // Log the project status update
        logger.info(`Project status updated: ${project.name} (${project._id}) to ${status} by ${req.user.name} (${req.user._id})`);

        // Send success response
        res.status(200).json({
            success: true,
            data: project,
        });
    } catch (error) {
        next(error);
    }
};

exports.updateProjectInvoiceStatus = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { invoiceNumber, invoiceDate } = req.body;

        const project = await Project.findByIdAndUpdate(
            id,
            {
                status: 'completed', // Keep it as completed
                invoiceStatus: 'Created',
                invoiceNumber,
                invoiceDate,
                updatedAt: new Date()
            },
            { 
                new: true,
                runValidators: true 
            }
        ).populate({
            path: 'client',
            select: 'name contactName contactEmail'
        });

        if (!project) {
            return next(new ErrorResponse(`Project not found with id of ${id}`, 404));
        }

        // Log the invoice status update
        logger.info(`Project invoice status updated: ${project.name} (${project._id}) by ${req.user.name}`);

        res.status(200).json({
            success: true,
            data: project
        });
    } catch (error) {
        next(error);
    }
};
