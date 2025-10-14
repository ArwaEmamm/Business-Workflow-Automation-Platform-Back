const mongoose = require('mongoose');

const WorkflowSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true, 
  },
  description: {
    type: String,
    required: false, // بدل optional نكتب false
  },

  // العلاقة مع الـUser اللي أنشأ الـWorkflow
  createdBy: {
    type: mongoose.Schema.Types.ObjectId, // بنستخدم الـObjectId
    ref: 'User', // اسم الموديل المرتبط بيه
    required: true,
  },

  steps: [
    {
      title: { type: String, required: true },
      order: { type: Number, required: true },
      assignedRole: {
        type: String,
        enum: ['admin', 'manager', 'employee'], 
        required: true,
      },
      createdAt: { type: Date, default: Date.now },
    },
  ],

  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Workflow', WorkflowSchema);
