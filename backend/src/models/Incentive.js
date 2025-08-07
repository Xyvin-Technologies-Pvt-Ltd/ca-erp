const mongoose = require('mongoose');

const IncentiveSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    taskId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Task',
        required: false
    },
    projectId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Project',
        required: false
    },
    taskAmount: {
        type: Number,
        required: false
    },
    incentiveAmount: {
        type: Number,
        required: true
    },
    date: {
        type: Date,
        default: Date.now
    },
    incentiveType: {
        type: String,
        enum: ['Task', 'Verification'],
        required: true
    }
}, { timestamps: true });

module.exports = mongoose.model('Incentive', IncentiveSchema);