const mongoose = require('mongoose');

/**
 * @swagger
 * components:
 *   schemas:
 *     Task:
 *       type: object
 *       required:
 *         - title
 *         - project
 *       properties:
 *         id:
 *           type: string
 *           description: Auto-generated ID of the task
 *         title:
 *           type: string
 *           description: Title of the task
 *         description:
 *           type: string
 *           description: Detailed description of the task
 *         project:
 *           type: string
 *           description: Project ID the task belongs to
 *         assignedTo:
 *           type: string
 *           description: User ID of the person assigned to the task
 *         status:
 *           type: string
 *           enum: [to-do, in-progress, under-review, completed, invoiceable, invoiced]
 *           description: Current status of the task
 *         priority:
 *           type: string
 *           enum: [low, medium, high, urgent]
 *           description: Priority level of the task
 *         dueDate:
 *           type: string
 *           format: date
 *           description: Due date for the task
 *         estimatedHours:
 *           type: number
 *           description: Estimated hours to complete the task
 *         parent:
 *           type: string
 *           description: Parent task ID if this is a subtask
 *         subtasks:
 *           type: array
 *           items:
 *             type: string
 *           description: List of subtask IDs
 *         timeEntries:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               date:
 *                 type: string
 *                 format: date
 *               hours:
 *                 type: number
 *               description:
 *                 type: string
 *               user:
 *                 type: string
 *           description: Time entries for the task
 *         invoiceDetails:
 *           type: object
 *           properties:
 *             invoiced:
 *               type: boolean
 *             invoiceDate:
 *               type: string
 *               format: date
 *             invoiceNumber:
 *               type: string
 *           description: Invoice details if the task has been invoiced
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Date and time when the task was created
 *       example:
 *         title: Prepare Financial Statements
 *         description: Prepare Q1 financial statements for client review
 *         project: 60d0fe4f5311236168a109ca
 *         assignedTo: 60d0fe4f5311236168a109cb
 *         status: in-progress
 *         priority: high
 *         dueDate: 2023-04-15
 *         estimatedHours: 8
 */

const TaskSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: [true, 'Please add a task title'],
            trim: true,
            maxlength: [100, 'Task title cannot be more than 100 characters'],
        },
        description: {
            type: String,
            maxlength: [500, 'Description cannot be more than 500 characters'],
        },
        project: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Project',
            required: [true, 'Please specify a project for this task'],
        },
        assignedTo: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        },
        levelIndex: {
            type: Number,
            required: true,
            default: 0
        },
        department: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Department",
            required: true
        },
        status: {
            type: String,
            enum: ['pending', 'in-progress', 'under-review', 'completed', 'invoiceable', 'invoiced', 'cancelled', 'review', 'overdue'],
            default: 'pending',
        },
        wasOverdue: {
            type: Boolean,
            default: false,
        },
        priority: {
            type: String,
            enum: ['low', 'medium', 'high', 'urgent'],
            default: 'medium',
        },
        amount: {
            type: Number,
            default: 0,
        },
        taskIncentivePercentage: {
            type: Number,
            default: 4,
            min: 0,
            max: 100,
            description: 'Percentage of task amount given as incentive to task assignee (default: 4%)'
        },
        verificationIncentivePercentage: {
            type: Number,
            default: 1,
            min: 0,
            max: 100,
            description: 'Percentage of task amount given as incentive to verification staff (default: 1%)'
        },
        dueDate: {
            type: Date,
        },
        attachments: [
            {
                name: {
                    type: String,
                    required: true,
                },
                size: {
                    type: Number,
                    required: true,
                },

                fileUrl: {
                    type: String,
                    required: true,
                },
                fileType: {
                    type: String,
                },
                uploadedAt: {
                    type: Date,
                    default: Date.now,
                },
            },
        ],
        tags: {
            type: [String],
            default: []
        },

        estimatedHours: {
            type: Number,
            default: 0,
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'Please specify the user who created this task'],
        },
        parent: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Task',
        },
        subtasks: [
            {
                id: String,
                title: String,
                status: { type: String, enum: ['pending', 'in progress', 'completed'] }
            }
        ],
        timeTracking: {
            entries: [
                {
                    date: {
                        type: Date,
                        default: Date.now,
                    },
                    hours: {
                        type: Number,
                        required: [true, 'Please specify the hours spent'],
                    },
                    description: {
                        type: String,
                    },
                    user: {
                        type: mongoose.Schema.Types.ObjectId,
                        ref: 'User',
                        required: [true, 'Please specify the user for this time entry'],
                    },
                }
            ]
        },
        // attachments: [
        //     {
        //         type: mongoose.Schema.Types.ObjectId,
        //         ref: 'Document',
        //     },
        // ],
        // comments: [
        //     {
        //         text: {
        //             type: String,
        //             required: [true, 'Please add a comment text'],
        //         },
        //         user: {
        //             type: mongoose.Schema.Types.ObjectId,
        //             ref: 'User',
        //             required: [true, 'Please specify the user for this comment'],
        //         },
        //         createdAt: {
        //             type: Date,
        //             default: Date.now,
        //         },
        //     },
        // ],
        comments: [
            {
                id: {
                    type: String,
                    required: true,
                },
                text: {
                    type: String,
                    required: [true, 'Please add a comment text'],
                },
                user: {
                    id: {
                        type: String,
                        required: true,
                    },
                    name: String,
                    avatar: String,
                },
                timestamp: {
                    type: Date,
                    default: Date.now,
                },
            }
        ],
        invoiceDetails: {
            invoiced: {
                type: Boolean,
                default: false,
            },
            invoiceDate: {
                type: Date,
            },
            invoiceNumber: {
                type: String,
            },
        },
        team: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }],
        deleted: { type: Boolean, default: false },
        incentiveAwarded: { type: Boolean, default: false }, // Track if incentive already given
        tagDocuments: {
            type: Map,
            of: {
                fileName: String,
                filePath: String,
                documentType: String,
                tag: String,
                uploadedAt: Date
            },
            default: {}
        },
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    }
);

// Calculate total hours spent on a task
TaskSchema.virtual('actualHours').get(function () {
    if (!this.timeEntries || this.timeEntries.length === 0) {
        return 0;
    }

    return this.timeEntries.reduce((total, entry) => total + entry.hours, 0);
});

// Add task reference to project when a task is created
TaskSchema.post('save', async function () {
    await this.model('Project').findByIdAndUpdate(
        this.project,
        { $addToSet: { tasks: this._id } },
        { new: true, runValidators: false }
    );
});

module.exports = mongoose.model('Task', TaskSchema); 