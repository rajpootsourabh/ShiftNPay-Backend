const mongoose = require('mongoose');

const WeeklyRewardSchema = new mongoose.Schema({
  employerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  employeeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'employee',
    required: true
  },
  weekStartDate: {
    type: Date,
    required: true
  },
  weekEndDate: {
    type: Date,
    required: true
  },
  totalWorkedHours: {
    type: Number,
    required: true,
    min: 0
  },
  bonusHours: {
    type: Number,
    default: 0,
    min: 0
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'redeemed', 'expired'],
    default: 'approved'
  },
  redeemedAt: {
    type: Date
  },
  redemptionType: {
    type: String,
    enum: ['vacation', 'donation', 'other'],
  },
  redeemedHours: {
    type: Number,
    default: 0,
    min: 0
  },
  remainingHours: {
    type: Number,
    default: function() { return this.bonusHours },
    min: 0
  }
}, { timestamps: true });



module.exports = mongoose.model('WeeklyReward', WeeklyRewardSchema);