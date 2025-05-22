const User = require('../models/User');
const { ErrorResponse } = require('../middleware/errorHandler');
const { logger } = require('../utils/logger');
const { log } = require('winston');

/**
 * @desc    Get all users
 * @route   GET /api/users
 * @access  Private/Admin
 */
exports.getUsers = async (req, res, next) => {
    try {
        // Pagination
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 10;
        const startIndex = (page - 1) * limit;
        const endIndex = page * limit;
        const total = await User.countDocuments();

        // Filtering
        const filter = {};
        if (req.query.role) {
            filter.role = req.query.role;
        }
        if (req.query.status) {
            filter.status = req.query.status;
        }
        if (req.query.department) {
            filter.department = req.query.department;
        }

        // Query with filters
        const users = await User.find(filter)
            .skip(startIndex)
            .limit(limit)
            .sort({ createdAt: -1 });

        // Pagination result
        const pagination = {};

        if (endIndex < total) {
            pagination.next = {
                page: page + 1,
                limit,
            };
        }

        if (startIndex > 0) {
            pagination.prev = {
                page: page - 1,
                limit,
            };
        }

        res.status(200).json({
            success: true,
            count: users.length,
            pagination,
            total,
            data: users,
        });
    } catch (error) {
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

        console.log( "654utityt7iiiiiiiiiiiiiiiiiiiii64646")
        const user = await User.findById(req.params.id);

        if (!user) {
            return next(new ErrorResponse(`User not found with id of ${req.params.id}`, 404));
        }

        res.status(200).json({
            success: true,
            data: user,
        });
    } catch (error) {
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
        // Check if email already exists
        const existingUser = await User.findOne({ email: req.body.email });
        if (existingUser) {
            return next(new ErrorResponse('Email already in use', 400));
        }

        const user = await User.create(req.body);

        // Log the user creation
        logger.info(`User created: ${user.email} (${user._id}) by ${req.user.name} (${req.user._id})`);

        res.status(201).json({
            success: true,
            data: user,
        });
    } catch (error) {
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
        const user = await User.findById(req.params.id);
        if (!user) {
            return next(new ErrorResponse(`User not found with id of ${req.params.id}`, 404));
        }

        // Check email uniqueness
        if (req.body.email && req.body.email !== user.email) {
            const existingEmail = await User.findOne({ email: req.body.email });
            if (existingEmail) {
                return next(new ErrorResponse('Email already in use', 400));
            }
        }
       
        const isPasswordUpdate = !!req.body.password;

       
        if (req.body.password) {
            user.password = req.body.password;
            await user.save();
            
            req.body.password = user.password;
           delete req.body.password;
        }


        // Update other fields using findByIdAndUpdate
        const updatedUser = await User.findByIdAndUpdate(
            req.params.id,
            req.body,
            {
                new: true,
                runValidators: true
            }
        );

        // Log the user update
        logger.info(`User updated: ${updatedUser.email} (${updatedUser._id})`);

        res.status(200).json({
            success: true,
            data: updatedUser,
            passwordUpdated: isPasswordUpdate
        });
    } catch (error) {
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

        // Don't allow deleting yourself
        if (user._id.toString() === req.user._id.toString()) {
            return next(new ErrorResponse('You cannot delete your own account', 400));
        }

        // Log the user deletion
        logger.info(`User deleted: ${user.email} (${user._id}) by ${req.user.name} (${req.user._id})`);

        await user.deleteOne();

        res.status(200).json({
            success: true,
            data: {},
            message: 'User deleted successfully',
        });
    } catch (error) {
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

        // Update avatar path in database
        const avatarPath = `/uploads/avatars/${req.file.filename}`;

        const updatedUser = await User.findByIdAndUpdate(
            req.params.id,
            { avatar: avatarPath },
            {
                new: true,
                runValidators: true,
            }
        );

        // Log the avatar update
        logger.info(`Avatar updated for user: ${user.email} (${user._id}) by ${req.user.name} (${req.user._id})`);

        res.status(200).json({
            success: true,
            data: updatedUser,
        });
    } catch (error) {
        next(error);
    }
}; 
exports.Allusers = async (req, res, next) => {
    try {
        const users = await User.find().sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: users.length,
            data: users,
        });
    } catch (error) {
        next(error);
    }
};
