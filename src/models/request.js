const mongoose = require('mongoose');

const RequestSchema = new mongoose.Schema({
  workflowId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Workflow',
    required: true
  },

  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  //  بيانات الطلب الفعلية (ممكن تبقى object)
  data: {
    type: Object,
    required: true
  },

  currentStep: {
    type: Number,
    default: 1
  },

  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },

  approvals: [
    {
      stepOrder: { type: Number },
      approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      decision: { type: String, enum: ['approved', 'rejected'] },
      comment: { type: String },
      date: { type: Date, default: Date.now }
    }
  ],
 attachments: [String],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Avoid OverwriteModelError when models are re-required in watch/dev environments
module.exports = mongoose.models.Request || mongoose.model('Request', RequestSchema);
