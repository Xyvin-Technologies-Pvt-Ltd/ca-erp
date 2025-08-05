const mongoose = require('mongoose');

/**
 * @swagger
 * components:
 *   schemas:
 *     CronJob:
 *       type: object
 *       required:
 *         - name
 *         - client
 *         - frequency
 *         - startDate
 *       properties:
 *         name:
 *           type: string
 *           description: Name of the cron job
 *         client:
 *           type: string
 *           description: Client ID the cron job belongs to
 *         frequency:
 *           type: string
 *           enum: [weekly, monthly, yearly]
 *           description: Frequency of project creation
 *         startDate:
 *           type: string
 *           format: date
 *           description: Start date for the cron job
 *         isActive:
 *           type: boolean
 *           description: Whether the cron job is active
 *         lastRun:
 *           type: string
 *           format: date-time
 *           description: Last time the cron job was executed
 *         nextRun:
 *           type: string
 *           format: date-time
 *           description: Next scheduled run time
 *         createdBy:
 *           type: string
 *           description: User ID who created the cron job
 */

const CronJobSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Please add a cron job name'],
            trim: true,
            maxlength: [100, 'Cron job name cannot be more than 100 characters'],
        },
        client: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Client',
            required: [true, 'Please specify a client for this cron job'],
        },
        frequency: {
            type: String,
            enum: ['weekly', 'monthly', 'yearly'],
            required: [true, 'Please specify frequency'],
        },
        startDate: {
            type: Date,
            required: [true, 'Please specify start date'],
        },
        isActive: {
            type: Boolean,
            default: true,
        },
        lastRun: {
            type: Date,
        },
        nextRun: {
            type: Date,
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        description: {
            type: String,
            maxlength: [500, 'Description cannot be more than 500 characters'],
        },
        section: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Section',
            required: true,
        },
        deleted: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    }
);

// Index for efficient querying
CronJobSchema.index({ client: 1, isActive: 1, nextRun: 1 });
CronJobSchema.index({ deleted: 1 });

// Virtual for calculating next run date
CronJobSchema.virtual('nextRunDate').get(function() {
    if (!this.lastRun) {
        return this.startDate;
    }
    
    const lastRun = new Date(this.lastRun);
    let nextRun = new Date(lastRun);
    
    switch (this.frequency) {
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
    
    return nextRun;
});

module.exports = mongoose.model('CronJob', CronJobSchema); 