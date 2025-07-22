const cron = require('node-cron');
const CronJob = require('../models/CronJob');
const Project = require('../models/Project');
const { logger } = require('../utils/logger');
const ActivityTracker = require('../utils/activityTracker');

class CronService {
    constructor() {
        this.jobs = new Map();
        this.isInitialized = false;
    }

    /**
     * Initialize the cron service
     */
    async init() {
        if (this.isInitialized) return;

        try {
            logger.info('Initializing cron service...');
            
            // Load all active cron jobs from database
            const activeCronJobs = await CronJob.find({
                isActive: true,
                deleted: { $ne: true }
            }).populate('client');

            // Process missed initial runs
            const now = new Date();
            for (const cronJob of activeCronJobs) {
                if (
                    cronJob.isActive &&
                    cronJob.startDate &&
                    new Date(cronJob.startDate) <= now &&
                    (!cronJob.lastRun || new Date(cronJob.lastRun) < new Date(cronJob.startDate))
                ) {
                    logger.info(`Processing missed initial run for cron job: ${cronJob.name} (${cronJob._id})`);
                    await this.executeCronJob(cronJob);
                }
            }

            // Schedule each active cron job
            for (const cronJob of activeCronJobs) {
                this.scheduleJob(cronJob);
            }

            this.isInitialized = true;
            logger.info(`Cron service initialized with ${activeCronJobs.length} active jobs`);
        } catch (error) {
            logger.error('Error initializing cron service:', error);
        }
    }

    /**
     * Schedule a cron job
     */
    scheduleJob(cronJob) {
        try {
            // Stop existing job if it exists
            this.stopJob(cronJob._id.toString());

            // Create cron expression based on frequency
            const cronExpression = this.getCronExpression(cronJob);
            
            if (!cronExpression) {
                logger.warn(`Invalid frequency for cron job ${cronJob._id}: ${cronJob.frequency}`);
                return;
            }

            // Schedule the job
            const job = cron.schedule(cronExpression, async () => {
                await this.executeCronJob(cronJob);
            }, {
                scheduled: false
            });

            // Store the job reference
            this.jobs.set(cronJob._id.toString(), job);

            // Start the job
            job.start();

            logger.info(`Scheduled cron job: ${cronJob.name} (${cronJob._id}) with frequency: ${cronJob.frequency}`);
        } catch (error) {
            logger.error(`Error scheduling cron job ${cronJob._id}:`, error);
        }
    }

    /**
     * Stop a cron job
     */
    stopJob(cronJobId) {
        const job = this.jobs.get(cronJobId);
        if (job) {
            job.stop();
            this.jobs.delete(cronJobId);
            logger.info(`Stopped cron job: ${cronJobId}`);
        }
    }

    /**
     * Get cron expression based on frequency
     */
    getCronExpression(cronJob) {
        const startDate = new Date(cronJob.startDate);
        const day = startDate.getDate();
        const month = startDate.getMonth() + 1; // Cron months are 1-based
        const hour = startDate.getHours();
        const minute = startDate.getMinutes();

        switch (cronJob.frequency) {
            case 'weekly':
                // Run weekly on the same day of the week
                const dayOfWeek = startDate.getDay();
                return `${minute} ${hour} * * ${dayOfWeek}`;
            
            case 'monthly':
                // Run monthly on the same day of the month
                return `${minute} ${hour} ${day} * *`;
            
            case 'yearly':
                // Run yearly on the same day and month
                return `${minute} ${hour} ${day} ${month} *`;
            
            default:
                return null;
        }
    }

    /**
     * Execute a cron job and create project
     */
    async executeCronJob(cronJob) {
        try {
            // Prevent project creation for inactive cron jobs (section-only)
            if (!cronJob.isActive) {
                logger.info(`Skipping project creation for inactive cron job: ${cronJob.name} (${cronJob._id})`);
                return;
            }
            logger.info(`Executing cron job: ${cronJob.name} (${cronJob._id})`);

            // Check if it's time to run (based on nextRun date)
            const now = new Date();
            const nextRun = new Date(cronJob.nextRun);
            
            if (now < nextRun) {
                logger.info(`Cron job ${cronJob._id} not due yet. Next run: ${nextRun}`);
                return;
            }

            // Create project
            const projectData = {
                name: cronJob.name,
                description: cronJob.description || `Auto-generated project from cron job: ${cronJob.name}`,
                client: cronJob.client._id,
                status: 'planning',
                startDate: nextRun,
                createdBy: cronJob.createdBy,
            };

            // Calculate due date based on frequency
            const startDate = new Date(nextRun);
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
            cronJob.lastRun = now;
            
            // Calculate next run date
            let newNextRun = new Date(now);
            switch (cronJob.frequency) {
                case 'weekly':
                    newNextRun.setDate(newNextRun.getDate() + 7);
                    break;
                case 'monthly':
                    newNextRun.setMonth(newNextRun.getMonth() + 1);
                    break;
                case 'yearly':
                    newNextRun.setFullYear(newNextRun.getFullYear() + 1);
                    break;
            }
            
            cronJob.nextRun = newNextRun;
            await cronJob.save();

            // Track activity
            try {
                await ActivityTracker.trackCronJobExecuted(cronJob, project, cronJob.createdBy);
                logger.info(`Activity tracked for cron job execution ${cronJob._id}`);
            } catch (activityError) {
                logger.error(`Failed to track activity for cron job execution ${cronJob._id}: ${activityError.message}`);
            }

            logger.info(`Project created from cron job: ${project.name} (${project._id}) by cron job ${cronJob.name} (${cronJob._id})`);
        } catch (error) {
            logger.error(`Error executing cron job ${cronJob._id}:`, error);
        }
    }

    /**
     * Add a new cron job
     */
    async addCronJob(cronJob) {
        try {
            this.scheduleJob(cronJob);
            logger.info(`Added new cron job: ${cronJob.name} (${cronJob._id})`);
        } catch (error) {
            logger.error(`Error adding cron job ${cronJob._id}:`, error);
        }
    }

    /**
     * Update an existing cron job
     */
    async updateCronJob(cronJob) {
        try {
            this.scheduleJob(cronJob);
            logger.info(`Updated cron job: ${cronJob.name} (${cronJob._id})`);
        } catch (error) {
            logger.error(`Error updating cron job ${cronJob._id}:`, error);
        }
    }

    /**
     * Remove a cron job
     */
    async removeCronJob(cronJobId) {
        try {
            this.stopJob(cronJobId);
            logger.info(`Removed cron job: ${cronJobId}`);
        } catch (error) {
            logger.error(`Error removing cron job ${cronJobId}:`, error);
        }
    }

    /**
     * Get all scheduled jobs
     */
    getScheduledJobs() {
        return Array.from(this.jobs.keys());
    }

    /**
     * Stop all jobs
     */
    stopAllJobs() {
        for (const [jobId, job] of this.jobs) {
            job.stop();
        }
        this.jobs.clear();
        logger.info('Stopped all cron jobs');
    }
}

module.exports = new CronService(); 