// models/EmployeeMenuAccess.js
const mongoose = require('mongoose');

const EmployeeMenuAccessSchema = new mongoose.Schema({
  empId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'employee',
    required: true,
    unique: true
  },
  category: [{
    type: String,
    required: true
  }],
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('EmployeeMenuAccess', EmployeeMenuAccessSchema);