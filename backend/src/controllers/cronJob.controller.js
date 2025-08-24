const CronJob = require('../models/CronJob');
const Project = require('../models/Project');
const Client = require('../models/Client');
const { ErrorResponse } = require('../middleware/errorHandler');
const { logger } = require('../utils/logger');
const ActivityTracker = require('../utils/activityTracker');
const cronService = require('../services/cronService');

/**
 * @desc    Get all cron jobs for a client
 * @route   GET /api/cronjobs
 * @access  Private
 */
exports.getCronJobs = async (req, res, next) => {
    try {
        const filter = { deleted: { $ne: true } };
        
        if (req.query.client) {
            filter.client = req.query.client;
        }
        
        if (req.query.section) {
            filter.section = req.query.section;
        }

        const cronJobs = await CronJob.find(filter)
            .populate({
                path: 'client',
                select: 'name contactName contactEmail'
            })
            .populate({
                path: 'createdBy',
                select: 'name email'
            })
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: cronJobs.length,
            data: cronJobs,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get single cron job
 * @route   GET /api/cronjobs/:id
 * @access  Private
 */
exports.getCronJob = async (req, res, next) => {
    try {
        const cronJob = await CronJob.findById(req.params.id)
            .populate({
                path: 'client',
                select: 'name contactName contactEmail'
            })
            .populate({
                path: 'createdBy',
                select: 'name email'
            });

        if (!cronJob) {
            return next(new ErrorResponse(`Cron job not found with id of ${req.params.id}`, 404));
        }

        if (cronJob.deleted) {
            return next(new ErrorResponse(`Cron job not found with id of ${req.params.id}`, 404));
        }

        res.status(200).json({
            success: true,
            data: cronJob,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Create cron job
 * @route   POST /api/cronjobs
 * @access  Private
 */
exports.createCronJob = async (req, res, next) => {
    try {
        // Add user to req.body
        req.body.createdBy = req.user.id;

        // Validate required fields
        if (!req.body.name || !req.body.client || !req.body.section || !req.body.startDate || !req.body.frequency) {
            return next(new ErrorResponse('Missing required fields: name, client, section, startDate, frequency', 400));
        }

        // Validate frequency
        const validFrequencies = ['weekly', 'monthly', 'yearly'];
        if (!validFrequencies.includes(req.body.frequency)) {
            return next(new ErrorResponse('Invalid frequency. Must be one of: weekly, monthly, yearly', 400));
        }

        // Validate start date
        const startDate = new Date(req.body.startDate);
        if (isNaN(startDate.getTime())) {
            return next(new ErrorResponse('Invalid start date', 400));
        }

        // Check if client exists
        if (req.body.client) {
            const client = await Client.findById(req.body.client);
            if (!client) {
                return next(new ErrorResponse(`Client not found with id of ${req.body.client}`, 404));
            }
        }

        // Calculate next run date
        req.body.nextRun = startDate;

        const cronJob = await CronJob.create(req.body);

        // Add to cron service if active
        if (cronJob.isActive) {
            await cronService.addCronJob(cronJob);
        }

        // Log the cron job creation
        logger.info(`Cron job created: ${cronJob.name} (${cronJob._id}) by ${req.user.name} (${req.user._id})`);

        // Track activity
        try {
            await ActivityTracker.trackCronJobCreated(cronJob, req.user._id);
            logger.info(`Activity tracked for cron job creation ${cronJob._id}`);
        } catch (activityError) {
            logger.error(`Failed to track activity for cron job creation ${cronJob._id}: ${activityError.message}`);
        }

        res.status(201).json({
            success: true,
            data: cronJob,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Update cron job
 * @route   PUT /api/cronjobs/:id
 * @access  Private
 */
exports.updateCronJob = async (req, res, next) => {
    try {
        let cronJob = await CronJob.findById(req.params.id);
        
        if (!cronJob) {
            return next(new ErrorResponse(`Cron job not found with id of ${req.params.id}`, 404));
        }

        if (cronJob.deleted) {
            return next(new ErrorResponse(`Cron job not found with id of ${req.params.id}`, 404));
        }

        // Check if client exists
        if (req.body.client) {
            const client = await Client.findById(req.body.client);
            if (!client) {
                return next(new ErrorResponse(`Client not found with id of ${req.body.client}`, 404));
            }
        }

        // Update next run date if start date is changed
        if (req.body.startDate) {
            req.body.nextRun = new Date(req.body.startDate);
        }

        cronJob = await CronJob.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true,
        }).populate({
            path: 'client',
            select: 'name contactName contactEmail'
        }).populate({
            path: 'createdBy',
            select: 'name email'
        });

        // Update in cron service
        await cronService.updateCronJob(cronJob);

        // Log the cron job update
        logger.info(`Cron job updated: ${cronJob.name} (${cronJob._id}) by ${req.user.name} (${req.user._id})`);

        res.status(200).json({
            success: true,
            data: cronJob,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Delete cron job
 * @route   DELETE /api/cronjobs/:id
 * @access  Private
 */
exports.deleteCronJob = async (req, res, next) => {
    try {
        const cronJob = await CronJob.findById(req.params.id);

        if (!cronJob) {
            return next(new ErrorResponse(`Cron job not found with id of ${req.params.id}`, 404));
        }

        if (cronJob.deleted) {
            return next(new ErrorResponse(`Cron job not found with id of ${req.params.id}`, 404));
        }

        // Soft delete
        cronJob.deleted = true;
        await cronJob.save();

        // Remove from cron service
        await cronService.removeCronJob(cronJob._id);

        // Log the cron job deletion
        logger.info(`Cron job deleted: ${cronJob.name} (${cronJob._id}) by ${req.user.name} (${req.user._id})`);

        res.status(200).json({
            success: true,
            data: {},
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Execute cron job and create project
 * @route   POST /api/cronjobs/:id/execute
 * @access  Private
 */
exports.executeCronJob = async (req, res, next) => {
    try {
        const cronJob = await CronJob.findById(req.params.id)
            .populate('client');

        if (!cronJob) {
            return next(new ErrorResponse(`Cron job not found with id of ${req.params.id}`, 404));
        }

        if (cronJob.deleted) {
            return next(new ErrorResponse(`Cron job not found with id of ${req.params.id}`, 404));
        }

        // Prevent project creation for inactive cron jobs (section-only)
        if (!cronJob.isActive) {
            return res.status(400).json({
                success: false,
                error: 'This is a section-only cron job and cannot create a project.'
            });
        }

        // Prevent execution before the start date
        const now = new Date();
        if (now < cronJob.startDate) {
            return res.status(400).json({
                success: false,
                error: 'Cannot execute before the start date.'
            });
        }

        // Prevent duplicate initial execution
        if (cronJob.lastRun && new Date(cronJob.lastRun) >= new Date(cronJob.startDate)) {
            return res.status(400).json({
                success: false,
                error: 'Initial project has already been created.'
            });
        }

        // Create project
        const projectData = {
            name: cronJob.name,
            description: cronJob.description || `Auto-generated project from cron job: ${cronJob.name}`,
            client: cronJob.client._id,
            status: 'planning',
            startDate: cronJob.nextRun,
            createdBy: req.user.id,
        };

        // Calculate due date based on frequency
        const startDate = new Date(cronJob.nextRun);
        let dueDate = new Date(startDate);
        
        switch (cronJob.frequency) {
            case 'weekly':
                dueDate.setDate(dueDate.getDate() + 7);
                break;
            case 'monthly':
                dueDate.setMonth(dueDate.getMonth() + 1);
                break;
            case 'yearly':
                dueDate.setFullYear(dueDate.getFullYear() + 1);
                break;
        }
        
        projectData.dueDate = dueDate;

        const project = await Project.create(projectData);

        // Update cron job
        cronJob.lastRun = new Date();
        
        // Calculate next run date
        let nextRun = new Date(cronJob.lastRun);
        switch (cronJob.frequency) {
            case 'weekly':
                nextRun.setDate(nextRun.getDate() + 7);
                break;
            case 'monthly':
                nextRun.setMonth(nextRun.getMonth() + 1);
                break;
            case 'yearly':
                nextRun.setFullYear(nextRun.getFullYear() + 1);
                break;
        }
        
        cronJob.nextRun = nextRun;
        await cronJob.save();

        // Log the project creation
        logger.info(`Project created from cron job: ${project.name} (${project._id}) by cron job ${cronJob.name} (${cronJob._id})`);

        // Track activity
        try {
            await ActivityTracker.trackProjectCreated(project, req.user._id);
            logger.info(`Activity tracked for project creation from cron job ${project._id}`);
        } catch (activityError) {
            logger.error(`Failed to track activity for project creation from cron job ${project._id}: ${activityError.message}`);
        }

        res.status(200).json({
            success: true,
            data: {
                project,
                cronJob,
                message: 'Project created successfully from cron job'
            },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get sections for a client
 * @route   GET /api/cronjobs/sections/:clientId
 * @access  Private
 */
exports.getSections = async (req, res, next) => {
    try {
        const sections = await CronJob.distinct('section', {
            client: req.params.clientId,
            deleted: { $ne: true }
        });

        res.status(200).json({
            success: true,
            data: sections,
        });
    } catch (error) {
        next(error);
    }
}; 