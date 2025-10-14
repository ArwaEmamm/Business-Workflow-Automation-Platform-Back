const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  message: {
    type: String,
    required: true
  },
  type: {
    type: String, // e.g. 'request_created', 'approval', 'rejection', 'comment'
    default: 'notification'
  },
  meta: {
    type: mongoose.Schema.Types.Mixed // اختياري: تقدر تحط { requestId: '...', workflowId: '...' }
  },
  isRead: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Notification', NotificationSchema);
