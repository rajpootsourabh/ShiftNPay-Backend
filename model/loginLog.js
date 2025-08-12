const mongoose = require('mongoose');

const loginLogSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user'
    },
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'employee'
  },
  loginTime: { type: Date, default: Date.now },
  ipAddress: { type: String },
  userAgent: { type: String },
});

const LoginLog = mongoose.model('LoginLog', loginLogSchema);

module.exports = LoginLog;
