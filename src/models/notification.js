const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  message: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['request-created', 'request-approved', 'request-rejected', 'workflow-step-assigned'],
    default: 'request-created',
    index: true
  },
  meta: {
    type: Object,
    default: {}
  },
  isRead: {
    type: Boolean,
    default: false,
    index: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// TTL index: auto-delete documents 30 days after createdAt
NotificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 2592000 });

module.exports = mongoose.model('Notification', NotificationSchema);
