const Position = require('../models/Position');
const catchAsync = require('../utils/catchAsync');
const { createError } = require('../utils/errors');

// Get all positions
const getAllPositions = catchAsync(async (req, res) => {
    const positions = await Position.find()
        .populate('department', 'name');
    res.status(200).json({
        status: 'success',
        data: positions
    });
});

// Get position by ID
const getPosition = catchAsync(async (req, res) => {
    const position = await Position.findById(req.params.id)
        .populate('department', 'name');
    if (!position) {
        throw createError(404, 'Position not found');
    }
    res.status(200).json({
        status: 'success',
        data: position
    });
});

// Generate position code
const generatePositionCode = async () => {
    const latest = await Position.find({})
        .sort({ code: -1 })
        .limit(1);
    if (!latest || latest.length === 0) {
        return 'POS001';
    }
    const latestCode = latest[0].code;
    const number = parseInt(latestCode.replace('POS', '')) + 1;
    return `POS${number.toString().padStart(3, '0')}`;
};

// Create new position
const createPosition = catchAsync(async (req, res) => {
    const code = await generatePositionCode();
    const position = await Position.create({
        ...req.body,
        code
    });
    await position.populate('department', 'name');
    res.status(201).json({
        status: 'success',
        data: position
    });
});

// Update position
const updatePosition = catchAsync(async (req, res) => {
    const position = await Position.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true, runValidators: true }
    ).populate('department', 'name');
    if (!position) {
        throw createError(404, 'Position not found');
    }
    res.status(200).json({
        status: 'success',
        data: position
    });
});

// Delete position
const deletePosition = catchAsync(async (req, res) => {
    const position = await Position.findByIdAndDelete(req.params.id);
    if (!position) {
        throw createError(404, 'Position not found');
    }
    res.status(200).json({
        status: 'success',
        message: 'Position deleted successfully'
    });
});

// Get next position code
const getNextPositionCode = catchAsync(async (req, res) => {
    const code = await generatePositionCode();
    res.status(200).json({
        status: 'success',
        data: { code }
    });
});

module.exports = {
    getAllPositions,
    getPosition,
    createPosition,
    updatePosition,
    deletePosition,
    getNextPositionCode
}; 