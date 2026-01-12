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
 *         - createdBy
 *       properties:
 *         id:
 *           type: string
 *         title:
 *           type: string
 *         description:
 *           type: string
 *         project:
 *           type: string
 *         assignedTo:
 *           type: string
 *         createdBy:
 *           type: string
 *         status:
 *           type: string
 *           enum: [pending, in-progress, under-review, completed, invoiceable, invoiced, cancelled, review]
 *         rating:
 *           type: number
 *           minimum: 0
 *           maximum: 10
 *         priority:
 *           type: string
 *           enum: [low, medium, high, urgent]
 *         amount:
 *           type: number
 *         taskIncentivePercentage:
 *           type: number
 *         verificationIncentivePercentage:
 *           type: number
 *         dueDate:
 *           type: string
 *           format: date
 *         attachments:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               name: { type: string }
 *               size: { type: number }
 *               fileUrl: { type: string }
 *               fileType: { type: string }
 *               uploadedAt: { type: string, format: date-time }
 *         tags:
 *           type: array
 *           items:
 *             type: string
 *         comments:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               id: { type: string }
 *               text: { type: string }
 *               user:
 *                 type: object
 *                 properties:
 *                   id: { type: string }
 *                   name: { type: string }
 *                   avatar: { type: string }
 *               timestamp: { type: string, format: date-time }
 *         team:
 *           type: array
 *           items:
 *             type: string
 *         deleted:
 *           type: boolean
 *         incentiveAwarded:
 *           type: boolean
 *         tagDocuments:
 *           type: object
 *           additionalProperties:
 *             type: object
 *             properties:
 *               fileName: { type: string }
 *               filePath: { type: string }
 *               documentType: { type: string }
 *               tag: { type: string }
 *               uploadedAt: { type: string, format: date-time }
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *       example:
 *         title: Project Verification Task
 *         project: 60d0fe4f5311236168a109ca
 *         assignedTo: 60d0fe4f5311236168a109cb
 *         createdBy: 60d0fe4f5311236168a109cc
 *         status: completed
 *         rating: 8.5
 *         priority: high
 *         dueDate: 2023-04-15
 *         amount: 1500
 *         taskIncentivePercentage: 4
 *         verificationIncentivePercentage: 1
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
        status: {
            type: String,
            enum: ['pending', 'in-progress', 'under-review', 'completed', 'invoiceable', 'invoiced', 'cancelled', 'review'],
            default: 'pending',
        },
        rating: {
            type: Number,
            default: 0,
            min:0,
            max:10,
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
        { new: true }
    );
});

module.exports = mongoose.model('Task', TaskSchema); 