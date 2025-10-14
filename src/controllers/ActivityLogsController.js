const ActivityLog = require('../models/ActivityLog');

const createActivityLog = async (req, res) => {
  try {
    const userId = req.user.id;
    const { action, entityType, entityId, timestamp } = req.body;

    const newLog = await ActivityLog.create({
      userId,
      action,
      entityType,
      entityId,
      timestamp: timestamp || Date.now(),
    });

    res.status(201).json({
      message: 'Activity log created successfully ✅',
      data: newLog,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getAllLogs = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied: Admins only' });
    }

    const logs = await ActivityLog.find()
      .populate('userId', 'name email role')
      .sort({ timestamp: -1 });

    res.status(200).json({
      message: 'All activity logs fetched successfully ✅',
      count: logs.length,
      data: logs,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getUserLogs = async (req, res) => {
  try {
    const userId = req.params.id; // أو ممكن نستخدم req.user.id لو للمستخدم الحالي فقط
    const logs = await ActivityLog.find({ userId }).sort({ timestamp: -1 });

    res.status(200).json({
      message: 'User activity logs fetched successfully ✅',
      count: logs.length,
      data: logs,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  createActivityLog,
  getAllLogs,
  getUserLogs,
};
