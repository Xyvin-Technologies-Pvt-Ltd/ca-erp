const mongoose = require('mongoose');

const positionSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Position title is required'],
        trim: true,
        minlength: [2, 'Position title must be at least 2 characters long'],
        maxlength: [100, 'Position title cannot exceed 100 characters']
    },
    code: {
        type: String,
        required: [true, 'Position code is required'],
        unique: true,
        trim: true
    },
    department: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Department',
        required: [true, 'Department is required']
    },
    description: {
        type: String,
        required: [true, 'Position description is required']
    },
    responsibilities: [{
        type: String,
        required: [true, 'At least one responsibility is required']
    }],
    requirements: [{
        type: String,
        required: [true, 'At least one requirement is required']
    }],
    employmentType: {
        type: String,
        enum: ['Full-time', 'Part-time', 'Contract', 'Intern'],
        default: 'Full-time'
    },
    level: {
        type: Number,
        min: 1
    },
    isActive: {
        type: Boolean,
        default: true
    },
    maxVacancies: {
        type: Number,
        default: 1
    },
    currentOccupancy: {
        type: Number,
        default: 0,
        min: 0
    },
    maxPositions: {
        type: Number,
        required: [true, 'Maximum number of positions is required'],
        min: [1, 'Maximum positions must be at least 1']
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

positionSchema.virtual('employees', {
    ref: 'Employee',
    localField: '_id',
    foreignField: 'position',
    count: true
});

positionSchema.virtual('availableVacancies').get(function() {
    return this.maxVacancies - this.currentOccupancy;
});

positionSchema.virtual('employeeCount').get(function() {
    return this.currentOccupancy;
});

positionSchema.pre('save', function(next) {
    if (this.currentOccupancy > this.maxPositions) {
        const err = new Error('Current occupancy cannot exceed maximum positions');
        err.status = 400;
        return next(err);
    }
    next();
});

positionSchema.pre('save', async function(next) {
    if (this.isModified('code')) {
        const existingPosition = await this.constructor.findOne({ code: this.code });
        if (existingPosition && existingPosition._id.toString() !== this._id.toString()) {
            next(new Error('Position code must be unique'));
        }
    }
    if (this.isNew || this.isModified('employees')) {
        const Employee = mongoose.model('User');
        const count = await Employee.countDocuments({ position: this._id });
        this.currentOccupancy = count;
    }
    next();
});

positionSchema.pre('deleteOne', { document: true }, async function(next) {
    const currentCount = await mongoose.model('User').countDocuments({ position: this._id });
    if (currentCount > 0) {
        next(new Error('Cannot delete position with active employees'));
    }
    next();
});

const Position = mongoose.model('Position', positionSchema);

module.exports = Position; 