const Notification = require('../models/notification');
let emailQueue = null;

try {
  const eq = require('../jobs/emailQueue');
  emailQueue = eq.emailQueue;
} catch (err) {
  console.warn('[NotificationController] Email queue not available:', err.message);
}

/**
 * Utility function to create a notification and queue an email
 * @param {ObjectId} userId - ID of the user to notify
 * @param {String} message - Notification message
 * @param {String} type - Type of notification (request-created|request-approved|request-rejected|workflow-step-assigned)
 * @param {Object} meta - Metadata (requestId, workflowId, etc.)
 * @returns {Promise<Object>} - Created notification document
 */
const createNotification = async (userId, message, type, meta = {}) => {
  try {
    if (!userId || !message || !type) {
      throw new Error('userId, message, and type are required');
    }

    const notification = await Notification.create({
      userId,
      message,
      type,
      meta
    });

    // Queue email notification job if emailQueue is available
    if (emailQueue) {
      try {
        await emailQueue.add(
          {
            userId,
            message,
            type,
            meta,
            notificationId: notification._id
          },
          {
            attempts: 3,
            backoff: {
              type: 'exponential',
              delay: 2000
            }
          }
        );
      } catch (queueErr) {
        console.warn('[Notification] Failed to queue email job:', queueErr.message);
      }
    }

    console.log(`[Notification] Created for user ${userId}: ${type}`);
    return notification;
  } catch (error) {
    console.error('[Notification] Error creating notification:', error.message);
    throw error;
  }
};

/**
 * GET /notifications - Get all notifications for logged-in user
 */
const getUserNotifications = async (req, res) => {
  try {
    const userId = req.user.id;

    const notifications = await Notification.find({ userId })
      .sort({ createdAt: -1 })
      .lean();

    res.json({
      message: 'Notifications retrieved successfully',
      count: notifications.length,
      data: notifications
    });
  } catch (error) {
    console.error('[Notification] Error fetching notifications:', error.message);
    res.status(500).json({ message: 'Error fetching notifications' });
  }
};

/**
 * GET /notifications/unread/count - Get count of unread notifications
 */
const getUnreadCount = async (req, res) => {
  try {
    const userId = req.user.id;

    const count = await Notification.countDocuments({
      userId,
      isRead: false
    });

    res.json({
      message: 'Unread count retrieved',
      unreadCount: count
    });
  } catch (error) {
    console.error('[Notification] Error counting unread:', error.message);
    res.status(500).json({ message: 'Error counting unread notifications' });
  }
};

/**
 * PATCH /notifications/:id/read - Mark a notification as read
 */
const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const notification = await Notification.findOneAndUpdate(
      { _id: id, userId },
      { isRead: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    res.json({
      message: 'Notification marked as read',
      data: notification
    });
  } catch (error) {
    console.error('[Notification] Error marking as read:', error.message);
    res.status(500).json({ message: 'Error marking notification as read' });
  }
};

/**
 * PATCH /notifications/read-all - Mark all notifications as read
 */
const markAllAsRead = async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await Notification.updateMany(
      { userId, isRead: false },
      { isRead: true }
    );

    res.json({
      message: 'All notifications marked as read',
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    console.error('[Notification] Error marking all as read:', error.message);
    res.status(500).json({ message: 'Error marking all notifications as read' });
  }
};

/**
 * DELETE /notifications/:id - Delete a notification
 */
const deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const notification = await Notification.findOneAndDelete({
      _id: id,
      userId
    });

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    res.json({ message: 'Notification deleted successfully' });
  } catch (error) {
    console.error('[Notification] Error deleting notification:', error.message);
    res.status(500).json({ message: 'Error deleting notification' });
  }
};

module.exports = {
  createNotification,
  getUserNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification
};
