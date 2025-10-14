const mongoose = require('mongoose');

/**
 * @swagger
 * components:
 *   schemas:
 *     Project:
 *       type: object
 *       required:
 *         - name
 *         - client
 *         - status
 *       properties:
 *         id:
 *           type: string
 *           description: Auto-generated ID of the project
 *         name:
 *           type: string
 *           description: Name of the project
 *         description:
 *           type: string
 *           description: Description of the project
 *         client:
 *           type: string
 *           description: Client ID the project belongs to
 *         manager:
 *           type: string
 *           description: User ID of the project manager
 *         team:
 *           type: array
 *           items:
 *             type: string
 *           description: List of User IDs assigned to the project
 *         status:
 *           type: string
 *           enum: [planning, in-progress, on-hold, completed, archived]
 *           description: Current status of the project
 *         startDate:
 *           type: string
 *           format: date
 *           description: Project start date
 *         dueDate:
 *           type: string
 *           format: date
 *           description: Project end date or deadline
 *         amount:
 *           type: number
 *           description: Project amount
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Date and time when the project was created
 *       example:
 *         name: Financial Audit 2023
 *         description: Annual financial audit for XYZ Corp
 *         client: 60d0fe4f5311236168a109ca
 *         manager: 60d0fe4f5311236168a109cb
 *         team: ['60d0fe4f5311236168a109cc', '60d0fe4f5311236168a109cd']
 *         status: in-progress
 *         startDate: 2023-01-15
 *         dueDate: 2023-03-31
 *         budget: 25000
 */

const ProjectSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Please add a project name'],
            trim: true,
            maxlength: [100, 'Project name cannot be more than 100 characters'],
        },
        description: {
            type: String,
            maxlength: [500, 'Description cannot be more than 500 characters'],
        },
        client: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Client',
            required: [true, 'Please specify a client for this project'],
        },
        department: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Department",
            required: true, 
        },

        manager: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        },
        team: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User',
            },
        ],
        assignedTo: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        status: {
            type: String,
            enum: ['planning', 'in-progress', 'on-hold', 'completed', 'archived'],
            default: 'planning',
        },
        startDate: {
            type: Date,
        },
        dueDate: {
            type: Date,
        },
        priority: {
            type: String,
        },
        documents: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Document',
            },
        ],
        tasks: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Task',
            },
        ],
        notes: [
            {
                content: { type: String },
                author: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'User',
                },
                createdAt: { type: Date, default: Date.now },
                deleted: { type: Boolean, default: false },
            },
        ],
        deleted: { type: Boolean, default: false },
        invoiceStatus: {
            type: String,
            enum: ['Not Created', 'Created'],
            default: 'Not Created'
        },
        amount: {
            type: Number,
            default: 0
        },
        receivedAmount: {
            type: Number,
            default: 0
        },
        balanceAmount: {
            type: Number,
            default: 0
        },
        paymentStatus: {
            type: String,
            enum: ['Not Paid', 'Partially Paid', 'Fully Paid'],
            default: 'Not Paid'
        },
        lastPaymentDate: {
            type: Date
        },
        receipts: {
            type: String,
        },
        paymentHistory: [
            {
                amount: { type: Number, required: true },
                method: { type: String, required: true },
                reference: String,
                notes: String,
                recordedBy: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'User',
                    required: true
                },
                recordedAt: {
                    type: Date,
                    default: Date.now
                }
            }
        ],

    },

    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    }
);

// Cascade delete tasks when a project is deleted
ProjectSchema.pre('remove', async function (next) {
    await this.model('Task').deleteMany({ project: this._id });
    next();
});

// Pre-save middleware to update payment status and balance
ProjectSchema.pre('save', function (next) {
    // Calculate balance amount
    this.balanceAmount = (this.amount || 0) - (this.receivedAmount || 0);

    // Update payment status
    if (this.receivedAmount <= 0) {
        this.paymentStatus = 'Not Paid';
    } else if (this.receivedAmount >= this.amount) {
        this.paymentStatus = 'Fully Paid';
    } else {
        this.paymentStatus = 'Partially Paid';
    }

    next();
});

// Virtual for progress calculation
ProjectSchema.virtual('progress').get(function () {
    if (!this.tasks || this.tasks.length === 0) {
        return 0;
    }

    const completedTasks = this.tasks.filter(task =>
        task.status === 'completed' || task.status === 'invoiced'
    ).length;

    return Math.round((completedTasks / this.tasks.length) * 100);
});

module.exports = mongoose.model('Project', ProjectSchema);