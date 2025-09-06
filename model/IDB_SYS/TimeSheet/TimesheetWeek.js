const mongoose = require('mongoose');


const timesheetWeekSchema = new mongoose.Schema({
   vendorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  startDate: {
    type: Date,
    required: true,
  },
  endDate: {
    type: Date,
    required: true,
  },
  payrollDays: {
    type: Number,
    required: true,
    enum: [5, 6, 7], // only valid options
  },
  isLocked: {
    type: Boolean,
    default: false, // user can lock/unlock
  },
  createdAt: {
    type: Date,
    default: Date.now,
  }
});


module.exports = mongoose.model('TimesheetWeek', timesheetWeekSchema);