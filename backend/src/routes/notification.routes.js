const express = require('express');
const router = express.Router();
const {
    getNotifications,
    getNotification,
    createNotification,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    deleteAllNotifications
} = require('../controllers/notification.controller');

const { protect, authorize } = require('../middleware/auth');

/**
 * @swagger
 * /api/notifications:
 *   get:
 *     summary: Get all notifications for the current user
 *     description: Retrieve a list of all notifications. Can be filtered by read status and type.
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Number of notifications per page
 *       - in: query
 *         name: read
 *         schema:
 *           type: boolean
 *         description: Filter by read status
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *         description: Filter by notification type
 *     responses:
 *       200:
 *         description: Successful operation
 *       401:
 *         description: Unauthorized
 */
router.route('/')
    .get(protect, getNotifications)
    .post(protect,  createNotification);

router.route('/read-all')
    .put(protect, markAllAsRead);

router.route('/:id')
    .get(protect, getNotification)
    .put(protect, markAsRead)
    .delete(protect, deleteNotification);
router.route('/delete-all').delete(protect,deleteAllNotifications)
module.exports = router;
