const mongoose = require('mongoose');

const leaveSchema = new mongoose.Schema({
    employee: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    leaveType: {
        type: String,
        enum: ['Sick', 'Casual', 'Emergency', 'Exam','Paid', 'Unpaid','Other'],
        required: true
    },
    startDate: {
        type: Date,
        required: true
    },
    endDate: {
        type: Date,
        required: true
    },
    duration: {
        type: Number,
    },
    reason: {
        type: String,
        trim: true
    },
    status: {
        type: String,
        enum: ['Pending', 'Approved', 'Rejected', 'Cancelled'],
        default: 'Pending'
    },
    reviewNotes: {
        type: String,
        trim: true
    },
    reviewedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    reviewedAt: {
        type: Date
    },
    attachments: [{
        name: String,
        path: String,
        uploadedAt: {
            type: Date,
            default: Date.now
        }
    }],
    approvalChain: [{
        approver: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        status: {
            type: String,
            enum: ['Pending', 'Approved', 'Rejected'],
            default: 'Pending'
        },
        comment: String,
        date: {
            type: Date,
            default: Date.now
        }
    }],
    emergencyContact: {
        name: String,
        phoneNumber: String,
        relationship: String
    },
    coveringEmployee: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    cancellationReason: {
        type: String,
        trim: true
    },
    notifications: [{
        message: String,
        date: {
            type: Date,
            default: Date.now
        },
        isRead: {
            type: Boolean,
            default: false
        }
    }]
}, {
    timestamps: true
});

// Calculate duration before saving
leaveSchema.pre('save', function(next) {
    const oneDay = 24 * 60 * 60 * 1000;
    this.duration = Math.round((this.endDate - this.startDate) / oneDay) + 1;
    next();
});

// Validate dates
leaveSchema.pre('save', function(next) {
    if (this.startDate > this.endDate) {
        throw new Error('End date cannot be before start date');
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const startDate = new Date(this.startDate);
    startDate.setHours(0, 0, 0, 0);
    if (startDate < today) {
        throw new Error('Cannot apply for leave in the past');
    }
    next();
});

// Method to check if dates overlap with existing leaves
leaveSchema.methods.checkOverlap = async function() {
    const overlappingLeave = await this.constructor.findOne({
        employee: this.employee,
        status: { $in: ['Pending', 'Approved'] },
        $or: [
            {
                startDate: { $lte: this.endDate },
                endDate: { $gte: this.startDate }
            }
        ],
        _id: { $ne: this._id }
    });
    return overlappingLeave;
};

module.exports = mongoose.model('Leave', leaveSchema); 