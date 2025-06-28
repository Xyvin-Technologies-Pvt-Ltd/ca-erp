const Department = require('../models/department.model');
const catchAsync = require('../utils/catchAsync');
const { createError } = require('../utils/errors');


// Get all departments
const getAllDepartments = catchAsync(async (req, res) => {
    const departments = await Department.find()
        .populate('manager', 'firstName lastName email');
    
    res.status(200).json({
        status: 'success',
        data: departments
    });
});

// Get department by ID
const getDepartment = catchAsync(async (req, res) => {
    const department = await Department.findById(req.params.id)
        .populate('manager', 'firstName lastName email');
    
    if (!department) {
        throw createError(404, 'Department not found');
    }

    res.status(200).json({
        status: 'success',
        data: department
    });
});

// Generate department code
const generateDepartmentCode = async () => {
    const departments = await Department.find({})
        .sort({ code: -1 })
        .limit(1);

    if (!departments || departments.length === 0) {
        return 'DEP001';
    }

    const latestCode = departments[0].code;
    const number = parseInt(latestCode.replace('DEP', '')) + 1;
    return `DEP${number.toString().padStart(3, '0')}`;
};

// Create new department
const createDepartment = catchAsync(async (req, res) => {
    const code = await generateDepartmentCode();
    const department = await Department.create({
        ...req.body,
        code
    });

    await department.populate('manager', 'firstName lastName email');

    res.status(201).json({
        status: 'success',
        data: department
    });
});

// Update department
const updateDepartment = catchAsync(async (req, res) => {
    const department = await Department.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true, runValidators: true }
    ).populate('manager', 'firstName lastName email');

    if (!department) {
        throw createError(404, 'Department not found');
    }

    res.status(200).json({
        status: 'success',
        data: department
    });
});

// Delete department
const deleteDepartment = catchAsync(async (req, res) => {
    const department = await Department.findByIdAndDelete(req.params.id);
    
    if (!department) {
        throw createError(404, 'Department not found');
    }

    res.status(200).json({
        status: 'success',
        message: 'Department deleted successfully'
    });
});

// Get next department code
const getNextDepartmentCode = catchAsync(async (req, res) => {
    const code = await generateDepartmentCode();
    res.status(200).json({
        status: 'success',
        data: { code }
    });
});

module.exports = {
    getAllDepartments,
    getDepartment,
    createDepartment,
    updateDepartment,
    deleteDepartment,
    getNextDepartmentCode
}; 