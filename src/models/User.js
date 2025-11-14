const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, index: true },
  passwordHash: { type: String, required: true },
  role: { 
    type: String, 
    enum: ['hr_manager', 'manager', 'employee'], 
    default: 'employee',
    set: function(v) {
      // normalize role values before validation/save
      if (v === undefined || v === null) return v;
      let s = String(v).trim();
      // map legacy 'admin' value to the new 'hr_manager'
      if (s === 'admin') s = 'hr_manager';
      return s;
    }
  },
  department: String,
  isActive: { type: Boolean, default: true },
  lastLogin: Date,
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', UserSchema);
