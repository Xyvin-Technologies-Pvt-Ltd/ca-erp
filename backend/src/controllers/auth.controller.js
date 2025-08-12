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
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body
    // const { loggedTime } = req.body;
    // console.log(loggedTime);
    // let now = new Date(loggedTime);
    // const istDate = new Date(now.getTime() + 330 * 60 * 1000);
    // console.log(istDate);
    // return;
    if (!email || !password) {
      logger.warn("Login attempt with missing credentials");
      return next(
        new ErrorResponse("Please provide an email and password", 400)
      );
    }

    // Check for superadmin first
    let superadmin = await SuperAdmin.findOne({ email }).select("+password");
    if (superadmin) {
      const isMatch = await superadmin.matchPassword(password);
      if (!isMatch) {
        logger.warn(
          `Superadmin login attempt with incorrect password: ${email}`
        );
        return next(new ErrorResponse("Invalid credentials", 401));
      }
      logger.info(
        `Superadmin login successful: ${superadmin.email} (${superadmin._id})`
      );
      const token = superadmin.getSignedJwtToken();
      return res.status(200).json({
        success: true,
        token,
        data: { email: superadmin.email, superadmin: true },
      });
    }

    // Fallback to normal user login
    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      logger.warn(`Login attempt with non-existent email: ${email}`);
      return next(new ErrorResponse("Invalid credentials", 401));
    }
    if (user.status === "inactive") {
      logger.warn(`Login attempt for inactive user: ${email}`);
      return next(
        new ErrorResponse(
          "This account has been deactivated. Please contact an administrator.",
          401
        )
      );
    }
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      logger.warn(`Login attempt with incorrect password for user: ${email}`);
      return next(new ErrorResponse("Invalid credentials", 401));
    }
    logger.info(`User login successful: ${user.email} (${user._id})`);
    sendTokenResponse(user, 200, res);
  } catch (error) {
    logger.error("Login error:", error);
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
