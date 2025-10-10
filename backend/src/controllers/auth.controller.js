const User = require("../models/User");
const SuperAdmin = require("../models/SuperAdmin");
const { ErrorResponse } = require("../middleware/errorHandler");
const { logger } = require("../utils/logger");

/**
 * @desc    Register a new user
 * @route   POST /api/auth/register
 * @access  Public
 */
exports.register = async (req, res, next) => {
  try {
    const { name, email, password, role, department, phone } = req.body;

    // Check if email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return next(new ErrorResponse("Email already in use", 400));
    }

    // Create the user
    const user = await User.create({
      name,
      email,
      password,
      role: role || "staff", // Default to staff role
      department,
      phone,
    });

    // Generate token
    const token = user.getSignedJwtToken();

    // Log the registration
    logger.info(`New user registered: ${user.email} with role ${user.role}`);

    // Send token in response
    sendTokenResponse(user, 201, res);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Login user
 * @route   POST /api/auth/login
 * @access  Public
 */
// In authController.js
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return next(new ErrorResponse("Please provide an email and password", 400));
    }

    // Check superadmin first
    let user = await SuperAdmin.findOne({ email }).select("+password");
    let isSuperadmin = false;

    if (!user) {
      user = await User.findOne({ email }).select("+password");
      if (!user) {
        return next(new ErrorResponse("Invalid credentials", 401));
      }
    } else {
      isSuperadmin = true;
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return next(new ErrorResponse("Invalid credentials", 401));
    }

    // ✅ Determine expiration based on login time
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();

    let expiresIn;

    if (hours < 13) {
      const expiry = new Date();
      expiry.setHours(13, 0, 0, 0); // Expire at 1:00 PM
      const secondsToExpire = Math.max(1, Math.floor((expiry - now) / 1000));
      expiresIn = `${secondsToExpire}s`;

    } else if (hours === 13 && minutes === 0) {
      expiresIn = "1s"; // Exact 1 PM → expire immediately

    } else if (hours < 17 || (hours === 17 && minutes <= 30)) {
      const expiry = new Date();
      expiry.setHours(17, 30, 0, 0); // Expire at 5:30 PM
      const secondsToExpire = Math.max(1, Math.floor((expiry - now) / 1000));
      expiresIn = `${secondsToExpire}s`;

    } else {
      const expiry = new Date();
      expiry.setHours(23, 59, 59, 999); // Expire at end of day
      const secondsToExpire = Math.max(1, Math.floor((expiry - now) / 1000));
      expiresIn = `${secondsToExpire}s`;
    }

    // Generate token with session-based expiry
    const token = user.getSignedJwtToken(expiresIn);

    res.status(200).json({
      success: true,
      token,
      expiresIn,
      data: {
        email: user.email,
        role: user.role,
        superadmin: isSuperadmin || false,
      },
    });

  } catch (error) {
    next(error);
  }
};



/**
 * @desc    Get current logged in user
 * @route   GET /api/auth/me
 * @access  Private
 */
exports.getMe = async (req, res, next) => {
  try {
    // Check if user is superadmin
    if (req.user.superadmin) {
      return res.status(200).json({
        success: true,
        data: {
          email: req.user.email,
          superadmin: true,
        },
      });
    }

    // Get regular user
    const user = await User.findById(req.user.id);
    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Logout user / clear cookie
 * @route   GET /api/auth/logout
 * @access  Private
 */
exports.logout = async (req, res, next) => {
  try {
    res.status(200).json({
      success: true,
      data: {},
      message: "User logged out successfully",
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update password
 * @route   PUT /api/auth/updatepassword
 * @access  Private
 */
exports.updatePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return next(
        new ErrorResponse("Please provide current and new passwords", 400)
      );
    }

    const user = await User.findById(req.user.id).select("+password");

    // Check current password
    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      return next(new ErrorResponse("Current password is incorrect", 401));
    }

    // Update password
    user.password = newPassword;
    await user.save();

    // Log the password update
    logger.info(`Password updated for user: ${user.email} (${user._id})`);

    // Send token response
    sendTokenResponse(user, 200, res);
  } catch (error) {
    next(error);
  }
};

// Helper function to send token response
const sendTokenResponse = (user, statusCode, res) => {
  // Create token
  const token = user.getSignedJwtToken();

  // Remove password from output
  user.password = undefined;

  res.status(statusCode).json({
    success: true,
    token,
    data: user,
  });
};
