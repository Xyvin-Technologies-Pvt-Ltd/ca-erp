const Notification = require("../models/Notification");
const { ErrorResponse } = require("../middleware/errorHandler");
const { logger } = require("../utils/logger");
const { wss } = require("../server");
const WebSocket = require("ws");

/**
 * @desc    Get all notifications for a user
 * @route   GET /api/notifications
 * @access  Private
 */
exports.getNotifications = async (req, res, next) => {
  try {
    // Pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const total = await Notification.countDocuments({ user: req.user.id });

    // Filtering
    const filter = {
      user: req.user.id,
      deleted: { $ne: true },
    };

    if (req.query.read !== undefined) {
      filter.read = req.query.read === "true";
    }

    if (req.query.type) {
      filter.type = req.query.type;
    }

    // Sort by date, newest first
    const sort = { createdAt: -1 };

    // Query with filters and sort
    const notifications = await Notification.find(filter)
      .skip(startIndex)
      .limit(limit)
      .sort(sort)
      .populate({
        path: "sender",
        select: "name email avatar",
      });

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
      count: notifications.length,
      pagination,
      total,
      data: notifications,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single notification
 * @route   GET /api/notifications/:id
 * @access  Private
 */
exports.getNotification = async (req, res, next) => {
  try {
    const notification = await Notification.findById(req.params.id).populate({
      path: "sender",
      select: "name email avatar",
    });

    if (!notification) {
      return next(
        new ErrorResponse(
          `Notification not found with id of ${req.params.id}`,
          404
        )
      );
    }

    // Check if notification belongs to user
    if (notification.user.toString() !== req.user.id) {
      return next(
        new ErrorResponse(`Not authorized to access this notification`, 403)
      );
    }

    res.status(200).json({
      success: true,
      data: notification,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create notification
 * @route   POST /api/notifications
 * @access  Private/Admin
 */
exports.createNotification = async (req, res, next) => {
  try {
    // Add sender to req.body
    req.body.sender = req.user.id;

    const notification = await Notification.create(req.body);

    // Emit to WebSocket clients
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(
          JSON.stringify({
            type: "notification",
            data: notification,
          })
        );
      }
    });

    // Log the notification creation
    logger.info(
      `Notification created for user ${req.body.user} by ${req.user.name} (${req.user._id})`
    );

    res.status(201).json({
      success: true,
      data: notification,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Mark notification as read
 * @route   PUT /api/notifications/:id/read
 * @access  Private
 */
exports.markAsRead = async (req, res, next) => {
  try {
    let notification = await Notification.findById(req.params.id);

    if (!notification) {
      return next(
        new ErrorResponse(
          `Notification not found with id of ${req.params.id}`,
          404
        )
      );
    }

    // Check if notification belongs to user
    if (notification.user.toString() !== req.user.id) {
      return next(
        new ErrorResponse(`Not authorized to update this notification`, 403)
      );
    }

    notification = await Notification.findByIdAndUpdate(
      req.params.id,
      { read: true },
      {
        new: true,
        runValidators: true,
      }
    );

    res.status(200).json({
      success: true,
      data: notification,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Mark all notifications as read
 * @route   PUT /api/notifications/read-all
 * @access  Private
 */
exports.markAllAsRead = async (req, res, next) => {
  try {
    await Notification.updateMany(
      { user: req.user.id, read: false },
      { read: true }
    );

    res.status(200).json({
      success: true,
      message: "All notifications marked as read",
    });
  } catch (error) {
    next(error);
  }
};
/**
 * @desc    Delete all notifications
 * @route   Delete /api/notifications/delete
 * @access  Private
 */
exports.deleteAllNotifications = async (req, res, next) => {
  try {
    const result = await Notification.deleteMany({ user: req.user.id });
    res.status(200).json({
      success: true,
      message: `${result.deletedCount} notifications deleted.`,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete notification
 * @route   DELETE /api/notifications/:id
 * @access  Private
 */
exports.deleteNotification = async (req, res, next) => {
  try {
    const notification = await Notification.findById(req.params.id);

    if (!notification) {
      return next(
        new ErrorResponse(
          `Notification not found with id of ${req.params.id}`,
          404
        )
      );
    }

    // Check if notification belongs to user
    if (notification.user.toString() !== req.user.id) {
      return next(
        new ErrorResponse(`Not authorized to delete this notification`, 403)
      );
    }

    await notification.deleteOne();

    res.status(200).json({
      success: true,
      data: {},
    });
  } catch (error) {
    next(error);
  }
};
