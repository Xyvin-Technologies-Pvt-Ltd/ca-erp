const Task = require('../models/Task');
const Project = require('../models/Project');
const User = require('../models/User');
const { ErrorResponse } = require('../middleware/errorHandler');
const { logger } = require('../utils/logger');
// const { wsInstance } = require('../server');
// const WebSocket = require('ws');
const websocketService = require('../utils/websocket');
const Notification = require('../models/Notification');
const ActivityTracker = require('../utils/activityTracker');
const webhookService = require('../services/webhookService');
const verificationService = require('../services/verificationService');
/**
 * @desc    Get all tasks
 * @route   GET /api/tasks
 * @access  Private
 */
exports.getTasks = async (req, res, next) => {
    try {
        // Pagination
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 10;
        const startIndex = (page - 1) * limit;
        const endIndex = page * limit;

        // Filtering
        const filter = {};
        if (req.query.status) {
            filter.status = req.query.status;
        }
        if (req.query.priority) {
            filter.priority = req.query.priority;
        }
        filter.deleted = { $ne: true };

        // Add project filter to only get tasks with non-deleted projects
        const validProjects = await Project.find({ deleted: { $ne: true } }, '_id');
        const validProjectIds = validProjects.map(p => p._id);

        if (req.query.project) {
            if (validProjectIds.map(id => id.toString()).includes(req.query.project)) {
                filter.project = req.query.project;
            } else {
                filter.project = null;
            }
        } else {
            filter.project = { $in: validProjectIds };
        }


        // If user is not admin, only show tasks they are assigned to
        if (req.user.role !== 'admin' && req.user.role !== 'manager') {
            filter.assignedTo = req.user.id;
        } else if (req.query.assignedTo) {
            filter.assignedTo = req.query.assignedTo;
        }

        // Due date filter
        if (req.query.dueBefore) {
            filter.dueDate = { ...filter.dueDate, $lte: new Date(req.query.dueBefore) };
        }
        if (req.query.dueAfter) {
            filter.dueDate = { ...filter.dueDate, $gte: new Date(req.query.dueAfter) };
        }
       const total = await Task.countDocuments(filter);

        // Search
        if (req.query.search) {
            filter.$or = [
                { title: { $regex: req.query.search, $options: 'i' } },
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
            sort.dueDate = 1; // Default: sort by dueDate ascending
            sort.priority = -1; // Then by priority descending
        }

        // Query with filters and sort
        const tasks = await Task.find(filter)
        .skip(startIndex)
        .limit(limit)
        .sort(sort)
        .populate({
            path: 'project',
            select: 'name projectNumber budget',
            match: { deleted: { $ne: true } }
        })
        .populate({
            path: 'assignedTo',
            select: 'name email'
        })
        .populate({
            path: 'createdBy',
            select: 'name email'
        });

    // Filter out tasks where project population failed
    const validTasks = tasks.filter(task => task.project != null);

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
        count: validTasks.length,
        pagination,
        total: total, // Use the total count from countDocuments
        data: validTasks,
    });
} catch (error) {
    next(error);
}
};

/**
 * @desc    Get single task
 * @route   GET /api/tasks/:id
 * @access  Private
 */
exports.getTask = async (req, res, next) => {
    try {
        const task = await Task.findOne({ _id: req.params.id, deleted: { $ne: true } })
            .populate({
                path: 'project',
                select: 'name projectNumber client',
                populate: {
                    path: 'client',
                    select: 'name contactName'
                }
            })
            .populate({
                path: 'assignedTo',
                select: 'name email'
            })
            .populate({
                path: 'createdBy',
                select: 'name email'
            });

        if (!task) {
            return next(new ErrorResponse(`Task not found with id of ${req.params.id}`, 404));
        }

        // Check access - only admin and assigned users can view
        // if (req.user.role !== 'admin' && req.user.role !== 'finance' && task.assignedTo.toString() !== req.user.id.toString()) {
        //     return next(new ErrorResponse(`User not authorized to access this task`, 403));
        // }

        res.status(200).json({
            success: true,
            data: task,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Create task
 * @route   POST /api/tasks
 * @access  Private
 */
exports.createTask = async (req, res, next) => {
    try {
        req.body.createdBy = req.user.id;
        let project;

        if (req.file) {
            const file = {
                name: req.file.originalname,
                size: req.file.size,
                fileUrl: req.file.path.replace(/\\/g, '/'), // Normalize for web use
                fileType: req.file.mimetype,
            };
            req.body.attachments = [file]; // Store file in the attachments array
        }
        // Validate project if provided
        if (req.body.project) {
            project = await Project.findById(req.body.project);
            if (!project) {
                return next(new ErrorResponse(`Project not found with id of ${req.body.project}`, 404));
            }
        }
        // Ensure amount is a number and always present
        if ('amount' in req.body) {
            req.body.amount = parseFloat(req.body.amount);
            if (isNaN(req.body.amount) || req.body.amount < 0) {
                console.error('Invalid amount received:', req.body.amount);
                return next(new ErrorResponse('Amount must be a non-negative number', 400));
            }
        } else {
            req.body.amount = 0; // Explicitly set default if not provided
            console.warn('No amount provided, defaulting to 0');
        }

        // Validate assigned user
        if (req.body.assignedTo) {
            const user = await User.findById(req.body.assignedTo);
            if (!user) {
                return next(new ErrorResponse(`User not found with id of ${req.body.assignedTo}`, 404));
            }
        }

        // Add assigned user to project team if not already included
        if (project && req.body.assignedTo && Array.isArray(project.team) && !project.team.some(memberId => memberId.toString() === req.body.assignedTo.toString())) {
            project.team.push(req.body.assignedTo);
            await project.save();
        }

        // Generate task number if not provided
        if (!req.body.taskNumber) {
            const date = new Date();
            const year = date.getFullYear().toString().substr(-2);
            const month = (date.getMonth() + 1).toString().padStart(2, '0');

            const lastTask = await Task.findOne({}).sort({ createdAt: -1 });
            let sequence = '001';
            if (lastTask && lastTask.taskNumber) {
                const lastNumber = lastTask.taskNumber.split('-')[2];
                if (lastNumber) {
                    sequence = (parseInt(lastNumber) + 1).toString().padStart(3, '0');
                }
            }
            req.body.taskNumber = `TSK-${year}${month}-${sequence}`;
        }
        // Create task
        const task = await Task.create(req.body);
        logger.info(`Task created: ${task.title} (${task._id}) by ${req.user.name} (${req.user._id})`);

        // Create notification for assigned user
        if (task.assignedTo) {
            try {
                const notification = await Notification.create({
                    user: task.assignedTo,
                    sender: req.user.id,
                    title: `New Task Assigned: ${task.title}`,
                    message: `You have been assigned a new task "${task.title}"`,
                    type: 'TASK_ASSIGNED'
                });

                logger.info(`Notification created for user ${task.assignedTo} for task ${task._id}`);

                // Send WebSocket notification
                websocketService.sendToUser(task.assignedTo.toString(), {
                    type: 'notification',
                    data: {
                        _id: notification._id,
                        title: notification.title,
                        message: notification.message,
                        type: notification.type,
                        read: notification.read,
                        createdAt: notification.createdAt,
                        sender: {
                            _id: req.user._id,
                            name: req.user.name,
                            email: req.user.email
                        },
                        taskId: task._id,
                        taskNumber: task.taskNumber,
                        priority: task.priority,
                        status: task.status,
                        projectId: task.project?._id
                    }
                });
            } catch (notificationError) {
                logger.error(`Failed to create notification for task ${task._id}: ${notificationError.message}`);
                // Note: We don't fail the task creation if notification fails
            }
        }
            try {
                await ActivityTracker.trackTaskCreated(task, req.user._id);
                logger.info(`Activity tracked for project creation ${task._id}`);
              } catch (activityError) {
                logger.error(`Failed to track activity for project creation ${task._id}: ${activityError.message}`);
              }

        res.status(201).json({
            success: true,
            data: task,
        });
    } catch (error) {
        logger.error('Task creation error:', error);
        next(error);
    }
};

/**
 * @desc    Update task
 * @route   PUT /api/tasks/:id
 * @access  Private
 */
// Helper to format values for activity log
function formatValueForLog(value) {
    if (value === null || value === undefined) return 'none';
    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') return value.toString();
    if (value instanceof Date) return value.toISOString().split('T')[0];
    if (Array.isArray(value)) {
        if (value.length === 0) return '[]';
        if (typeof value[0] === 'object') {
            // Try to show a summary of key fields
            return '[' + value.map(v => v?.name || v?.title || v?.email || v?.id || v?._id || 'object').join(', ') + ']';
        }
        return JSON.stringify(value);
    }
    if (typeof value === 'object') {
        // Try to show key fields for known object types
        if (value.name) return value.name;
        if (value.title) return value.title;
        if (value.email) return value.email;
        if (value._id) return value._id.toString();
        // For Maps, show keys
        if (value instanceof Map) return `[${Array.from(value.keys()).join(', ')}]`;
        // For other objects, show JSON summary of keys
        return JSON.stringify(value);
    }
    return value.toString();
}

// Helper to get user name from id or object
async function getUserName(userIdOrObj) {
    if (!userIdOrObj) return '';
    if (typeof userIdOrObj === 'object' && userIdOrObj.name) return userIdOrObj.name;
    try {
        const user = await User.findById(userIdOrObj).select('name');
        return user ? user.name : userIdOrObj.toString();
    } catch {
        return userIdOrObj.toString();
    }
}

// List of fields to include in activity log (user-meaningful fields)
const ACTIVITY_FIELDS = [
    'title', 'description', 'status', 'dueDate', 'assignedTo', 'priority', 'comments', 'attachments', 'subtasks', 'amount', 'timeTracking', 'estimatedHours'
];

exports.updateTask = async (req, res, next) => {
    try {
        if (req.suppressTaskUpdateActivity) {
            // Skip generic update activity if suppressed by another action
            return res.status(200).json({ success: true, data: null });
        }
        const taskId = req.params.id;
        let task = await Task.findById(taskId)
            .populate('project', 'name')
            .populate('assignedTo', 'name email')
            .populate('createdBy', 'name email');

        if (!task) {
            return next(new ErrorResponse(`Task not found with id of ${taskId}`, 404));
        }

        // --- Begin: Handle file upload and attachments accumulation ---
        if (req.file) {
            const file = {
                name: req.file.originalname,
                size: req.file.size,
                fileUrl: req.file.path.replace(/\\/g, '/'),
                fileType: req.file.mimetype,
                uploadedAt: new Date()
            };
            // Always merge with existing attachments
            let currentAttachments = Array.isArray(task.attachments) ? [...task.attachments] : [];
            currentAttachments.push(file);
            req.body.attachments = currentAttachments;
        }
        // If attachments is a string (e.g., "[]"), convert to array
        if (typeof req.body.attachments === 'string') {
            try {
                const parsed = JSON.parse(req.body.attachments);
                req.body.attachments = Array.isArray(parsed) ? parsed : [];
            } catch {
                req.body.attachments = [];
            }
        }
        // --- End: Handle file upload and attachments accumulation ---

        // Merge original and incoming for comparison
        const originalTaskObj = task.toObject();
        const mergedTaskObj = { ...originalTaskObj, ...req.body };

        // Only compare fields that are in req.body and are user-meaningful
        const changedFields = Object.keys(req.body).filter(key => {
            if (!ACTIVITY_FIELDS.includes(key)) return false;
            const oldVal = formatValueForLog(originalTaskObj[key]);
            const newVal = formatValueForLog(mergedTaskObj[key]);
            return oldVal !== newVal;
        });

        // Update task
        task = await Task.findByIdAndUpdate(taskId, req.body, {
            new: true,
            runValidators: true,
        })
            .populate('project', 'name')
            .populate('assignedTo', 'name email')
            .populate('createdBy', 'name email');

        // Build concise, readable change summary
        let changesSummaryArr = [];
        let commentAdded = false;
        let subtaskAdded = false;
        let attachmentAdded = false;
        for (const field of changedFields) {
            let oldVal = originalTaskObj[field];
            let newVal = mergedTaskObj[field];
            if (field === 'assignedTo') {
                oldVal = await getUserName(originalTaskObj[field]);
                newVal = await getUserName(mergedTaskObj[field]);
                if (oldVal === newVal) continue;
            } else if (field === 'comments') {
                const oldArr = Array.isArray(originalTaskObj[field]) ? originalTaskObj[field] : [];
                const newArr = Array.isArray(mergedTaskObj[field]) ? mergedTaskObj[field] : [];
                if (newArr.length > oldArr.length) {
                    const added = newArr.slice(oldArr.length);
                    for (const comment of added) {
                        changesSummaryArr.push(`comment added: "${comment.text || comment.content || '[no text]'}"`);
                        commentAdded = true;
                    }
                } else if (newArr.length < oldArr.length) {
                    changesSummaryArr.push(`comments: ${oldArr.length - newArr.length} comment(s) removed`);
                    commentAdded = true;
                }
                continue;
            } else if (field === 'subtasks') {
                const oldArr = Array.isArray(originalTaskObj[field]) ? originalTaskObj[field] : [];
                const newArr = Array.isArray(mergedTaskObj[field]) ? mergedTaskObj[field] : [];
                if (newArr.length > oldArr.length) {
                    const added = newArr.slice(oldArr.length);
                    for (const subtask of added) {
                        changesSummaryArr.push(`subtask added: "${subtask.title || subtask.name || subtask.id || '[no title]'}"`);
                        subtaskAdded = true;
                    }
                } else if (newArr.length < oldArr.length) {
                    changesSummaryArr.push(`subtasks: ${oldArr.length - newArr.length} subtask(s) removed`);
                    subtaskAdded = true;
                }
                continue;
            } else if (field === 'attachments') {
                const oldArr = Array.isArray(originalTaskObj[field]) ? originalTaskObj[field] : [];
                const newArr = Array.isArray(mergedTaskObj[field]) ? mergedTaskObj[field] : [];
                if (newArr.length > oldArr.length) {
                    const added = newArr.slice(oldArr.length);
                    for (const attachment of added) {
                        changesSummaryArr.push(`attachment added: "${attachment.name || attachment.fileName || '[no name]'}"`);
                        attachmentAdded = true;
                    }
                } else if (newArr.length < oldArr.length) {
                    changesSummaryArr.push(`attachments: ${oldArr.length - newArr.length} attachment(s) removed`);
                    attachmentAdded = true;
                }
                continue;
            } else if (field === 'dueDate') {
                // Only log dueDate if it actually changed (ignore time if only date is relevant)
                const oldDate = oldVal ? new Date(oldVal) : null;
                const newDate = newVal ? new Date(newVal) : null;
                if (
                    oldDate && newDate &&
                    oldDate.getFullYear() === newDate.getFullYear() &&
                    oldDate.getMonth() === newDate.getMonth() &&
                    oldDate.getDate() === newDate.getDate()
                ) {
                    continue; // skip if only time changed
                }
                oldVal = oldDate ? oldDate.toISOString().split('T')[0] : oldVal;
                newVal = newDate ? newDate.toISOString().split('T')[0] : newVal;
                if (oldVal === newVal) continue;
            } else {
                oldVal = formatValueForLog(originalTaskObj[field]);
                newVal = formatValueForLog(mergedTaskObj[field]);
                if (oldVal === newVal) continue;
            }
            changesSummaryArr.push(`${field}: ${oldVal} → ${newVal}`);
        }
        // If a comment, subtask, or attachment was added, suppress all other changes in the summary
        if (commentAdded) {
            changesSummaryArr = changesSummaryArr.filter(s => s.startsWith('comment'));
        } else if (subtaskAdded) {
            changesSummaryArr = changesSummaryArr.filter(s => s.startsWith('subtask'));
        } else if (attachmentAdded) {
            changesSummaryArr = changesSummaryArr.filter(s => s.startsWith('attachment'));
        }
        // If only one field changed, only show that field
        if (changesSummaryArr.length === 1) {
            // already only one
        }
        // If dueDate is the only change and not meaningful, don't log
        if (changesSummaryArr.length === 0) {
            return res.status(200).json({ success: true, data: task });
        }
        const changesSummary = changesSummaryArr.join(', ');

        // Only log if there are actual changes
        if (changesSummaryArr.length > 0) {
            await ActivityTracker.track({
                type: 'task_updated',
                title: 'Task Updated',
                description: `Task "${task.title}" was updated. Changes: ${changesSummary}`,
                entityType: 'task',
                entityId: task._id,
                userId: req.user._id,
                link: `/tasks/${task._id}`,
                project: task.project?._id
            });
            // Send notification to assigned user if exists
            if (task.assignedTo) {
                try {
                    const notification = await Notification.create({
                        user: task.assignedTo,
                        sender: req.user.id,
                        title: `Task Updated: ${task.title}`,
                        message: `Task "${task.title}" has been updated.`,
                        type: 'TASK_UPDATED'
                    });
                    logger.info(`Notification created for user ${task.assignedTo} for task update ${task._id}`);
                    // Send WebSocket notification
                    websocketService.sendToUser(task.assignedTo.toString(), {
                        type: 'notification',
                        data: {
                            _id: notification._id,
                            title: notification.title,
                            message: notification.message,
                            type: notification.type,
                            read: notification.read,
                            createdAt: notification.createdAt,
                            sender: {
                                _id: req.user._id,
                                name: req.user.name,
                                email: req.user.email
                            },
                            taskId: task._id,
                            taskNumber: task.taskNumber,
                            priority: task.priority,
                            status: task.status,
                            projectId: task.project?._id
                        }
                    });
                } catch (notificationError) {
                    logger.error(`Failed to create notification for task update ${task._id}: ${notificationError.message}`);
                }
            }
        }

        // Check if task status was changed to completed and handle verification task creation
        if (req.body.status === 'completed' && originalTaskObj.status !== 'completed') {
            try {
                const verificationTask = await verificationService.handleTaskCompletion(
                    task._id, 
                    task.project, 
                    req.user.id
                );
                
                if (verificationTask) {
                    logger.info(`Verification task created for project ${task.project} after task completion via update`);
                }
            } catch (verificationError) {
                logger.error('Error handling verification task creation:', verificationError);
                // Don't fail the main request if verification fails
            }
        }

        res.status(200).json({ success: true, data: task });
    } catch (error) {
        logger.error(`Task update error: ${error.message}`);
        next(error);
    }
};

/**
 * @desc    Delete task
 * @route   DELETE /api/tasks/:id
 * @access  Private/Admin
 */
exports.deleteTask = async (req, res, next) => {
    try {
        const task = await Task.findById(req.params.id);

        if (!task) {
            return next(new ErrorResponse(`Task not found with id of ${req.params.id}`, 404));
        }

        // Remove task from project and clean up team before deleting
        const project = await Project.findById(task.project);
        if (project) {
            // Remove task from project's tasks array
            project.tasks = project.tasks.filter(taskId => taskId.toString() !== task._id.toString());
            
            // Check if assigned user has other active tasks in this project
            if (task.assignedTo) {
                const remainingTasks = await Task.countDocuments({
                    project: task.project,
                    assignedTo: task.assignedTo,
                    _id: { $ne: task._id },
                    deleted: { $ne: true }
                });
                
                // Remove user from team if no other active tasks
                if (remainingTasks === 0) {
                    project.team = project.team.filter(memberId => 
                        memberId.toString() !== task.assignedTo.toString()
                    );
                }
            }
            
            await project.save();
        }

        // Log the task deletion
        logger.info(`Task deleted: ${task.title} (${task._id}) by ${req.user.name} (${req.user._id})`);

        await task.deleteOne();

        // Log the task deletion activity
        try {
            await ActivityTracker.track({
                type: 'task_deleted',
                title: 'Task Deleted',
                description: `Task "${task.title}" was deleted`,
                entityType: 'task',
                entityId: task._id,
                userId: req.user._id,
                link: `/tasks`,
                project: task.project
            });
        } catch (activityError) {
            logger.error(`Failed to track activity for task deletion ${task._id}: ${activityError.message}`);
        }

        res.status(200).json({
            success: true,
            data: {},
            message: 'Task deleted successfully',
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Update task status
 * @route   PUT /api/tasks/:id/status
 * @access  Private
 */
exports.updateTaskStatus = async (req, res, next) => {
    try {
        const { status } = req.body;

        if (!status) {
            return next(new ErrorResponse('Please provide a status', 400));
        }

        let task = await Task.findById(req.params.id);

        if (!task) {
            return next(new ErrorResponse(`Task not found with id of ${req.params.id}`, 404));
        }

        // Check access - only admin and assigned users can update
        if (req.user.role !== 'admin' && task.assignedTo.toString() !== req.user.id.toString()) {
            return next(new ErrorResponse(`User not authorized to update this task`, 403));
        }

        // If status is completed, set completedAt date
        const updateData = {
            status,
            updatedBy: req.user.id
        };

        if (status === 'completed') {
            updateData.completedAt = Date.now();
        } else if (status === 'in-progress' && task.status === 'pending') {
            updateData.startedAt = Date.now();
        }

        task = await Task.findByIdAndUpdate(
            req.params.id,
            updateData,
            {
                new: true,
                runValidators: true,
            }
        );

        // Log the status update
        logger.info(`Task status updated for ${task.title} (${task._id}) to ${status} by ${req.user.name} (${req.user._id})`);

        // Check if task was completed and handle verification task creation
        if (status === 'completed') {
            try {
                const verificationTask = await verificationService.handleTaskCompletion(
                    task._id, 
                    task.project, 
                    req.user.id
                );
                
                if (verificationTask) {
                    logger.info(`Verification task created for project ${task.project} after task completion`);
                }
            } catch (verificationError) {
                logger.error('Error handling verification task creation:', verificationError);
                // Don't fail the main request if verification fails
            }
        }

        res.status(200).json({
            success: true,
            data: task,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Add comment to task
 * @route   POST /api/tasks/:id/comments
 * @access  Private
 */
exports.addTaskComment = async (req, res, next) => {
    try {
        const { content } = req.body;

        if (!content) {
            return next(new ErrorResponse('Please provide comment content', 400));
        }

        let task = await Task.findById(req.params.id);

        if (!task) {
            return next(new ErrorResponse(`Task not found with id of ${req.params.id}`, 404));
        }

        // Add comment
        const comment = {
            content,
            user: req.user.id,
            createdAt: Date.now()
        };

        task.comments.push(comment);
        task.updatedBy = req.user.id;

        await task.save();

        // Populate the user in the newly added comment
        const populatedTask = await Task.findById(req.params.id)
            .populate({
                path: 'comments.user',
                select: 'name email avatar'
            });

        // Get the newly added comment
        const newComment = populatedTask.comments[populatedTask.comments.length - 1];

        // Log the comment addition
        logger.info(`Comment added to task ${task.title} (${task._id}) by ${req.user.name} (${req.user._id})`);

        res.status(201).json({
            success: true,
            data: newComment,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Update task time tracking
 * @route   PUT /api/tasks/:id/time
 * @access  Private
 */
exports.updateTaskTime = async (req, res, next) => {
    try {
        const { hours, description, date } = req.body;

        if (!hours || !description) {
            return next(new ErrorResponse('Please provide hours and description', 400));
        }

        let task = await Task.findById(req.params.id);

        if (!task) {
            return next(new ErrorResponse(`Task not found with id of ${req.params.id}`, 404));
        }

        // Check access - only admin and assigned users can update
        if (req.user.role !== 'admin' && task.assignedTo.toString() !== req.user.id.toString()) {
            return next(new ErrorResponse(`User not authorized to update this task`, 403));
        }

        // Add time entry
        const timeEntry = {
            hours: parseFloat(hours),
            description,
            date: date || Date.now(),
            user: req.user.id
        };

        task.timeTracking.entries.push(timeEntry);

        // Update total actual hours
        task.timeTracking.actualHours = task.timeTracking.entries.reduce(
            (total, entry) => total + entry.hours,
            0
        );

        task.updatedBy = req.user.id;

        await task.save();
        req.suppressTaskUpdateActivity = true; // Suppress generic update activity

        // Populate the user in the newly added time entry
        const populatedTask = await Task.findById(req.params.id)
            .populate({
                path: 'timeTracking.entries.user',
                select: 'name email'
            });

        // Get the newly added time entry
        const newEntry = populatedTask.timeTracking.entries[populatedTask.timeTracking.entries.length - 1];

        // Log the time entry addition
        logger.info(`Time entry added to task ${task.title} (${task._id}) by ${req.user.name} (${req.user._id}): ${hours} hours`);

        // Activity log for time entry
        try {
            await ActivityTracker.track({
                type: 'task_time_entry',
                title: 'Time Entry Added',
                description: `Time entry of ${hours} hour(s) added to task "${task.title}": ${description}`,
                entityType: 'task',
                entityId: task._id,
                userId: req.user._id,
                link: `/tasks/${task._id}`,
                project: task.project
            });
        } catch (activityError) {
            logger.error(`Failed to track activity for time entry: ${activityError.message}`);
        }

        res.status(200).json({
            success: true,
            data: {
                entry: newEntry,
                totalActualHours: task.timeTracking.actualHours,
                estimatedHours: task.timeTracking.estimatedHours
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get tasks for current user
 * @route   GET /api/tasks/me
 * @access  Private
 */
exports.getMyTasks = async (req, res, next) => {
    try {
        // Filter tasks assigned to current user
        const filter = { assignedTo: req.user.id };

        // Status filter
        if (req.query.status) {
            filter.status = req.query.status;
        }

        // Due date filter for upcoming tasks
        if (req.query.upcoming === 'true') {
            const today = new Date();
            const nextWeek = new Date();
            nextWeek.setDate(today.getDate() + 7);

            filter.dueDate = {
                $gte: today,
                $lte: nextWeek
            };
        }

        // Overdue tasks
        if (req.query.overdue === 'true') {
            const today = new Date();
            filter.dueDate = { $lt: today };
            filter.status = { $ne: 'completed' };
        }

        const tasks = await Task.find(filter)
            .sort({ dueDate: 1, priority: -1 })
            .populate({
                path: 'project',
                select: 'name projectNumber'
            });

        res.status(200).json({
            success: true,
            count: tasks.length,
            data: tasks,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Mark task as invoiced
 * @route   PUT /api/tasks/:id/invoice
 * @access  Private/Admin
 */
exports.markTaskAsInvoiced = async (req, res, next) => {
    try {
        const { invoiceId } = req.body;

        let task = await Task.findById(req.params.id);

        if (!task) {
            return next(new ErrorResponse(`Task not found with id of ${req.params.id}`, 404));
        }

        // Only tasks with completed status can be invoiced
        if (task.status !== 'completed') {
            return next(new ErrorResponse('Only completed tasks can be marked as invoiced', 400));
        }

        task = await Task.findByIdAndUpdate(
            req.params.id,
            {
                invoiced: true,
                invoiceId,
                invoicedAt: Date.now(),
                updatedBy: req.user.id
            },
            {
                new: true,
                runValidators: true,
            }
        );

        // Log the invoiced update
        logger.info(`Task marked as invoiced: ${task.title} (${task._id}) by ${req.user.name} (${req.user._id})`);

        res.status(200).json({
            success: true,
            data: task,
        });
    } catch (error) {
        next(error);
    }
};
/**
 * @desc    Get task tag documents
 * @route   GET /api/tasks/:id/tag-documents
 * @access  Private
 */
exports.getTaskTagDocuments = async (req, res, next) => {
    try {
        const task = await Task.findById(req.params.id);
        if (!task) {
            return next(new ErrorResponse(`Task not found with id of ${req.params.id}`, 404));
        }

        res.status(200).json({
            success: true,
            data: task.tagDocuments || {}
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Upload tag document
 * @route   POST /api/tasks/:id/tag-documents
 * @access  Private
 */
exports.uploadTagDocument = async (req, res, next) => {
    try {
        console.log('Upload request received:', {
            body: req.body,
            file: req.file,
            params: req.params
        });

        if (!req.file) {
            return next(new ErrorResponse('Please upload a file', 400));
        }

        let task = await Task.findById(req.params.id);
        if (!task) {
            return next(new ErrorResponse(`Task not found with id of ${req.params.id}`, 404));
        }

        try {
            // Initialize tagDocuments if it doesn't exist
            if (!task.tagDocuments) {
                task.tagDocuments = new Map();
            }

            // Get tag and documentType from request body
            const { tag, documentType } = req.body;
            
            // Create a unique key for the document
            const documentKey = `${tag}-${documentType}`;
            
            // Store the document information
            const documentInfo = {
                fileName: req.file.originalname,
                filePath: req.file.path.replace(/\\/g, '/'),
                documentType: documentType || 'document',
                tag: tag || 'general',
                uploadedAt: new Date()
            };


            // Check if a document with this key already exists in the Map
            let isReupload = false;
            let oldFileName = null;
            if (task.tagDocuments instanceof Map && task.tagDocuments.has(documentKey)) {
                const oldDoc = task.tagDocuments.get(documentKey);
                oldFileName = oldDoc?.fileName || null;
                if (oldFileName && oldFileName !== req.file.originalname) {
                    isReupload = true;
                }
            }

            // Set the document in the Map
            task.tagDocuments.set(documentKey, documentInfo);
            task.markModified('tagDocuments');

            await task.save();
            req.suppressTaskUpdateActivity = true; // Suppress generic update activity

            // Activity log for tag document upload or re-upload
            try {
                if (isReupload && oldFileName) {
                    await ActivityTracker.track({
                        type: 'document_reuploaded',
                        title: 'Task Updated',
                        description: `Tag document re-uploaded: changed ${oldFileName} to ${req.file.originalname} for task "${task.title}"`,
                        entityType: 'task',
                        entityId: task._id,
                        userId: req.user._id,
                        link: `/tasks/${task._id}`,
                        project: task.project
                    });
                } else {
                    await ActivityTracker.track({
                        type: 'document_uploaded',
                        title: 'Task Updated',
                        description: `Tag document "${req.file.originalname}" uploaded for task "${task.title}"`,
                        entityType: 'task',
                        entityId: task._id,
                        userId: req.user._id,
                        link: `/tasks/${task._id}`,
                        project: task.project
                    });
                }
            } catch (activityError) {
                logger.error(`Failed to track activity for tag document upload: ${activityError.message}`);
            }

            res.status(200).json({
                success: true,
                data: documentInfo
            });
        } catch (saveError) {
            console.error('Error saving document:', saveError);
            return next(new ErrorResponse('Error saving document information', 500));
        }
    } catch (error) {
        console.error('Error in uploadTagDocument:', error);
        next(error);
    }
};

/**
 * @desc    Send reminder to client for document
 * @route   POST /api/tasks/:id/remind-client
 * @access  Private
 */
exports.remindClientForDocument = async (req, res, next) => {
    try {
        const { documentName, documentType, tag } = req.body;

        // Validate required fields
        if (!documentName || !documentType || !tag) {
            return next(new ErrorResponse('Document name, type, and tag are required', 400));
        }

        // Find task with project and client populated
        const task = await Task.findById(req.params.id)
            .populate({
                path: 'project',
                select: 'name client',
                populate: {
                    path: 'client',
                    select: 'name contactName contactPhone contactEmail'
                }
            });

        if (!task) {
            return next(new ErrorResponse(`Task not found with id of ${req.params.id}`, 404));
        }

        // Check if user has access to this task
        if (req.user.role !== 'admin' && req.user.role !== 'manager' && task.assignedTo.toString() !== req.user.id.toString()) {
            return next(new ErrorResponse(`User not authorized to send reminders for this task`, 403));
        }

        // Check if project has client
        if (!task.project || !task.project.client) {
            return next(new ErrorResponse('Task project does not have an associated client', 400));
        }

        const client = task.project.client;

        // Check if client has phone number
        if (!client.contactPhone) {
            return next(new ErrorResponse('Client does not have a phone number for reminders', 400));
        }

        // Prepare reminder data
        const reminderData = {
            clientName: client.name,
            phoneNumber: client.contactPhone,
            documentName,
            tag,
            documentType,
            reminderSentBy: req.user.name
        };

        // Send webhook
        const webhookResponse = await webhookService.sendClientReminder(reminderData);

        // Log the reminder activity
        logger.info(`Document reminder sent to client: ${client.name} (${client.contactPhone}) for ${documentName} by ${req.user.name} (${req.user._id})`);

        // Track activity
        await ActivityTracker.trackActivity(
            'reminder_sent',
            'Document Reminder Sent',
            `Reminder sent to ${client.name} for ${documentName}`,
            req.user.id,
            {
                taskId: task._id,
                projectId: task.project._id,
                clientId: client._id,
                documentName,
                documentType,
                tag
            }
        );

        res.status(200).json({
            success: true,
            message: 'Reminder sent successfully',
            data: {
                clientName: client.name,
                phoneNumber: client.contactPhone,
                documentName,
                reminderSentBy: req.user.name,
                reminderSentAt: new Date().toISOString()
            }
        });

    } catch (error) {
        logger.error('Error sending client reminder:', {
            error: error.message,
            taskId: req.params.id,
            userId: req.user.id,
            stack: error.stack
        });
        next(error);
    }
};

/**
 * @desc    Get all tasks (no pagination, for dashboard)
 * @route   GET /api/tasks/all
 * @access  Private
 */
exports.getAllTasksNoPagination = async (req, res, next) => {
    try {
        // Filtering (same as getTasks)
        const filter = {};
        if (req.query.status) {
            filter.status = req.query.status;
        }
        if (req.query.priority) {
            filter.priority = req.query.priority;
        }
        filter.deleted = { $ne: true };

        // Add project filter to only get tasks with non-deleted projects
        const validProjects = await require('../models/Project').find({ deleted: { $ne: true } }, '_id');
        const validProjectIds = validProjects.map(p => p._id);

        if (req.query.project) {
            if (validProjectIds.map(id => id.toString()).includes(req.query.project)) {
                filter.project = req.query.project;
            } else {
                filter.project = null;
            }
        } else {
            filter.project = { $in: validProjectIds };
        }

        // If user is not admin, only show tasks they are assigned to
        if (req.user.role !== 'admin' && req.user.role !== 'manager') {
            filter.assignedTo = req.user.id;
        } else if (req.query.assignedTo) {
            filter.assignedTo = req.query.assignedTo;
        }

        // Due date filter
        if (req.query.dueBefore) {
            filter.dueDate = { ...filter.dueDate, $lte: new Date(req.query.dueBefore) };
        }
        if (req.query.dueAfter) {
            filter.dueDate = { ...filter.dueDate, $gte: new Date(req.query.dueAfter) };
        }

        // Search
        if (req.query.search) {
            filter.$or = [
                { title: { $regex: req.query.search, $options: 'i' } },
                { description: { $regex: req.query.search, $options: 'i' } }
            ];
        }

        // Sort (optional, default by dueDate asc, priority desc)
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
            sort.dueDate = 1;
            sort.priority = -1;
        }

        // Query with filters and sort, but NO pagination/limit
        const tasks = await Task.find(filter)
            .sort(sort)
            .populate({
                path: 'project',
                select: 'name projectNumber budget',
                match: { deleted: { $ne: true } }
            })
            .populate({
                path: 'assignedTo',
                select: 'name email'
            })
            .populate({
                path: 'createdBy',
                select: 'name email'
            });

        // Filter out tasks where project population failed
        const validTasks = tasks.filter(task => task.project != null);

        res.status(200).json({
            success: true,
            count: validTasks.length,
            data: validTasks,
        });
    } catch (error) {
        next(error);
    }
};
