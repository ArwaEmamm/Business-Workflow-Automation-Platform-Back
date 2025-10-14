const Notification = require('../models/notification');

// ✅ 1. إنشاء إشعار جديد (يُستخدم داخليًا)
const createNotification = async (req, res) => {
  try {
    const userId = req.user.id; // من التوكن
    const { message, type, meta } = req.body;

    const newNotification = await Notification.create({
      userId,
      message,
      type,
      meta
    });

    res.status(201).json({
      message: 'Notification created successfully',
      notification: newNotification
    });
  } catch (error) {
    console.error('Error creating notification:', error);
    res.status(500).json({ message: 'Server error while creating notification' });
  }
};

// ✅ 2. جلب الإشعارات الخاصة بالمستخدم
const getUserNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    const notifications = await Notification.find({ userId }).sort({ createdAt: -1 });

    res.status(200).json({
      message: 'User notifications fetched successfully',
      count: notifications.length,
      notifications
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ message: 'Server error while fetching notifications' });
  }
};

// ✅ 3. تحديد إشعار كمقروء
const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const notification = await Notification.findById(id);

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    notification.isRead = true;
    await notification.save();

    res.status(200).json({
      message: 'Notification marked as read',
      notification
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ message: 'Server error while updating notification' });
  }
};

module.exports = {
  createNotification,
  getUserNotifications,
  markAsRead
};
