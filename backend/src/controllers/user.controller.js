const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const User = require('../models/User');
const { ErrorResponse } = require('../middleware/errorHandler');
const { logger } = require('../utils/logger');

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       required:
 *         - name
 *         - email
 *         - password
 *         - role
 *         - department
 *         - position
 *       properties:
 *         id:
 *           type: string
 *           description: Auto-generated ID of the user
 *         name:
 *           type: string
 *           description: Full name of the user
 *         email:
 *           type: string
 *           description: Email address, must be unique
 *         password:
 *           type: string
 *           description: Password (hashed)
 *         role:
 *           type: string
 *           enum: [admin, manager, staff, finance]
 *           description: User role
 *         phone:
 *           type: string
 *           description: Phone number
 *         department:
 *           type: string
 *           description: Department (ObjectId reference)
 *         avatar:
 *           type: string
 *           description: Path to avatar image
 *         status:
 *           type: string
 *           enum: [active, inactive]
 *           default: active
 *           description: User account status
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Date and time when the user was created
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Date and time when the user was last updated
 *         position:
 *           type: string
 *           description: Position (ObjectId reference)
 *       example:
 *         _id:
 *           $oid: "67f54137ca7f2422c0e39cdb"
 *         name: Admin User
 *         email: admin@ca-erp.com
 *         password: $2y$10$weMh3okAhz92klqHh/2LSu1crgkcn3ZJiXf8qO2WLyQBFA1Sxib56
 *         role: admin
 *         phone: "7487873738"
 *         department:
 *           $oid: "686dec624d67ded62c1b1259"
 *         status: active
 *         updatedAt:
 *           $date: "2025-07-11T07:00:22.129Z"
 *         avatar: /uploads/avatars/avatar-67f54137ca7f2422c0e39cdb.png
 *         position:
 *           $oid: "686fa413e5beafed26212958"
 */

/**
 * @desc    Get all users
 * @route   GET /api/users
 * @access  Private/Admin
 */
exports.getUsers = async (req, res, next) => {
    try {
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 10;
        const startIndex = (page - 1) * limit;
        const endIndex = page * limit;
        const total = await User.countDocuments();

        const filter = {};
        if (req.query.role) {
            filter.role = req.query.role;
        }
        if (req.query.status) {
            filter.status = req.query.status;
        }
        if (req.query.department) {
            filter.department = mongoose.Types.ObjectId(req.query.department);
        }

        const users = await User.find(filter)
            .populate('department')
            .populate('position')
            .skip(startIndex)
            .limit(limit)
            .sort({ createdAt: -1 });

        const pagination = {};
        if (endIndex < total) {
            pagination.next = { page: page + 1, limit };
        }
        if (startIndex > 0) {
            pagination.prev = { page: page - 1, limit };
        }

        res.status(200).json({
            success: true,
            count: users.length,
            pagination,
            total,
            data: users,
        });
    } catch (error) {
        console.error("Error in getUsers:", error);
        next(error);
    }
};

/**
 * @desc    Get single user
 * @route   GET /api/users/:id
 * @access  Private/Admin
 */
exports.getUser = async (req, res, next) => {
    try {
        const user = await User.findById(req.params.id)
            .populate('department')
            .populate('position');

        if (!user) {
            return next(new ErrorResponse(`User not found with id of ${req.params.id}`, 404));
        }

        res.status(200).json({
            success: true,
            data: user,
        });
    } catch (error) {
        console.error("Error in getUser:", error);
        next(error);
    }
};

/**
 * @desc    Create user
 * @route   POST /api/users
 * @access  Private/Admin
 */
exports.createUser = async (req, res, next) => {
    try {

        // Check if user already exists
        // const existingUser = await User.findOne({ email: req.body.email });
        // if (existingUser) {
        //     return next(new ErrorResponse('Email already in use', 400));
        // }

        // Validate required fields first
        if (!req.body.department) {
            return next(new ErrorResponse('Department is required', 400));
        }
        if (!req.body.position) {
            return next(new ErrorResponse('Position is required', 400));
        }

        // Validate workType if provided
        if (req.body.workType && !['onsite', 'remote'].includes(req.body.workType)) {
            return next(new ErrorResponse('Work type must be either "onsite" or "remote"', 400));
        }

        // Validate ObjectIds format
        if (!mongoose.Types.ObjectId.isValid(req.body.department)) {
            return next(new ErrorResponse('Invalid department ID format', 400));
        }
        if (!mongoose.Types.ObjectId.isValid(req.body.position)) {
            return next(new ErrorResponse('Invalid position ID format', 400));
        }

        // Convert to ObjectId using the correct syntax
        const departmentId = new mongoose.Types.ObjectId(req.body.department);
        const positionId = new mongoose.Types.ObjectId(req.body.position);

        // Verify that department and position exist
        const [departmentExists, positionExists] = await Promise.all([
            mongoose.model('Department').findById(departmentId),
            mongoose.model('Position').findById(positionId)
        ]);

        if (!departmentExists) {
            return next(new ErrorResponse('Department not found', 404));
        }
        if (!positionExists) {
            return next(new ErrorResponse('Position not found', 404));
        }

        // Create user data object
        const userData = {
            ...req.body,
            department: departmentId,
            position: positionId,
            workType: req.body.workType || 'onsite',
            verificationStaff: req.body.verificationStaff || false
        };

        // Create user and populate references
        const user = await User.create(userData);
        const populatedUser = await user.populate(['department', 'position']);

        if (user.verificationStaff) {
            logger.info(`Verification staff created: ${user.email} (${user._id}) by ${req.user.name} (${req.user._id})`);
        }

        res.status(201).json({
            success: true,
            data: populatedUser
        });
    } catch (error) {
        console.error("Error in createUser:", error);
        next(error);
    }
};

/**
 * @desc    Update user
 * @route   PUT /api/users/:id
 * @access  Private/Admin
 */
exports.updateUser = async (req, res, next) => {
    try {

        const existingUser = await User.findById(req.params.id);
        if (!existingUser) {
            return next(new ErrorResponse('User not found', 404));
        }

        if (req.body.email && req.body.email !== existingUser.email) {
            const emailExists = await User.findOne({ email: req.body.email });
            if (emailExists) {
                return next(new ErrorResponse('Email already in use', 400));
            }
        }

        // Validate required fields
        if (!req.body.department) {
            return next(new ErrorResponse('Department is required', 400));
        }
        if (!req.body.position) {
            return next(new ErrorResponse('Position is required', 400));
        }
        if (req.body.workType && !['onsite', 'remote'].includes(req.body.workType)) {
            return next(new ErrorResponse('Work type must be either "onsite" or "remote"', 400));
        }

        // Validate ObjectIds
        // if (!mongoose.Types.ObjectId.isValid(req.body.department)) {
        //     return next(new ErrorResponse('Invalid department ID', 400));
        // }
        // if (!mongoose.Types.ObjectId.isValid(req.body.position)) {
        //     return next(new ErrorResponse('Invalid position ID', 400));
        // }

        const updateData = {
            ...req.body,
            department: (req.body.department),
            position: (req.body.position)
        };

        if (req.body.password) {
            const salt = await bcrypt.genSalt(10);
            updateData.password = await bcrypt.hash(req.body.password, salt);
        }

        // First verify that department and position exist
        const [departmentExists, positionExists] = await Promise.all([
            mongoose.model('Department').findById(updateData.department),
            mongoose.model('Position').findById(updateData.position)
        ]);

        if (!departmentExists || !positionExists) {
            return next(new ErrorResponse('Department or Position not found', 404));
        }

        const user = await User.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true, runValidators: true }
        ).populate(['department', 'position']);

        if (!user) {
            return next(new ErrorResponse('Failed to update user', 500));
        }

        if (req.body.verificationStaff !== undefined && req.body.verificationStaff !== existingUser.verificationStaff) {
            const status = req.body.verificationStaff ? 'activated' : 'deactivated';
            logger.info(`Verification staff status ${status} for user: ${user.email} (${user._id}) by ${req.user.name} (${req.user._id})`);
        }

        res.status(200).json({
            success: true,
            data: user
        });
    } catch (error) {
        console.error("Error in updateUser:", error);
        next(error);
    }
};

/**
 * @desc    Delete user
 * @route   DELETE /api/users/:id
 * @access  Private/Admin
 */
exports.deleteUser = async (req, res, next) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return next(new ErrorResponse(`User not found with id of ${req.params.id}`, 404));
        }

        if (user._id.toString() === req.user._id.toString()) {
            return next(new ErrorResponse('You cannot delete your own account', 400));
        }

        logger.info(`User deleted: ${user.email} (${user._id}) by ${req.user.name} (${req.user._id})`);
        await user.deleteOne();

        res.status(200).json({
            success: true,
            data: {},
            message: 'User deleted successfully',
        });
    } catch (error) {
        console.error("Error in deleteUser:", error);
        next(error);
    }
};

/**
 * @desc    Upload user avatar
 * @route   PUT /api/users/:id/avatar
 * @access  Private/Admin
 */
exports.uploadAvatar = async (req, res, next) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return next(new ErrorResponse(`User not found with id of ${req.params.id}`, 404));
        }

        if (!req.file) {
            return next(new ErrorResponse('Please upload a file', 400));
        }

        const avatarPath = `/uploads/avatars/${req.file.filename}`;
        const updatedUser = await User.findByIdAndUpdate(
            req.params.id,
            { avatar: avatarPath },
            { new: true, runValidators: true }
        );

        logger.info(`Avatar updated for user: ${user.email} (${user._id}) by ${req.user.name} (${req.user._id})`);

        res.status(200).json({
            success: true,
            data: updatedUser,
        });
    } catch (error) {
        console.error("Error in uploadAvatar:", error);
        next(error);
    }
};

/**
 * @desc    Get all users without pagination
 * @route   GET /api/users/all
 * @access  Private/Admin
 */
exports.Allusers = async (req, res, next) => {
    try {
        const users = await User.find().populate('department').populate('position').sort({ createdAt: -1 });
        res.status(200).json({
            success: true,
            count: users.length,
            data: users,
        });
    } catch (error) {
        console.error("Error in Allusers:", error);
        next(error);
    }
};

/**
 * @desc    Get verification staff members
 * @route   GET /api/users/verification-staff
 * @access  Private/Admin/Manager
 */
exports.getVerificationStaff = async (req, res, next) => {
    try {
        const verificationStaff = await User.find({ verificationStaff: true })
            .populate('department')
            .populate('position')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: verificationStaff.length,
            data: verificationStaff,
        });
    } catch (error) {
        console.error("Error in getVerificationStaff:", error);
        next(error);
    }
};