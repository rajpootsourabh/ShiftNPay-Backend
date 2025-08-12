const mongoose = require('mongoose');

const reminderList = new mongoose.Schema({
  vendorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  description: { type: String, required: true }, 
  caregiver: { type: Boolean, default: false },  
  client: { type: Boolean, default: false },
  defaultVal: { type: Boolean, default: false },
  autoRemind: { type: Boolean, default: false },
  sortOrder: { type: String, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model('ReminderList', reminderList);
