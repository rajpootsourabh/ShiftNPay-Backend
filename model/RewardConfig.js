const mongoose = require('mongoose');

const RewardConfigSchema = new mongoose.Schema({
  employerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  isActive: {
    type: Boolean,
    default: false
  },
  thresholdHours: {
    type: Number,
    default: 40,
    min: 0
  },
  rewardHours: {
    type: Number,
    default: 4,
    min: 0
  },
  weekStartDay: {
    type: Number,
    default: 1, // Monday
    enum: [0,1,2,3,4,5,6] // Sunday=0 to Saturday=6
  },
  allowVacation: {
    type: Boolean,
    default: true
  },
  allowDonations: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

module.exports = mongoose.model('RewardConfig', RewardConfigSchema);