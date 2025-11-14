const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middlewares/authMiddleware');
const {
  getUserNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification
} = require('../controllers/notificationController');

/**
 * Notification Routes (all require authentication)
 */

// GET /notifications - Get all notifications for logged-in user
router.get('/', authMiddleware, getUserNotifications);

// GET /notifications/unread/count - Get count of unread notifications
router.get('/unread/count', authMiddleware, getUnreadCount);

// PATCH /notifications/:id/read - Mark a notification as read
router.patch('/:id/read', authMiddleware, markAsRead);

// PATCH /notifications/read-all - Mark all notifications as read
router.patch('/read-all', authMiddleware, markAllAsRead);

// DELETE /notifications/:id - Delete a notification
router.delete('/:id', authMiddleware, deleteNotification);

module.exports = router;
