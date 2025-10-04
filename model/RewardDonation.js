const mongoose = require('mongoose');

const RewardDonationSchema = new mongoose.Schema({
  employerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employer',
    required: true
  },
  donorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: true
  },
  recipientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: true
  },
  rewardId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'WeeklyReward',
    required: true
  },
  hours: {
    type: Number,
    required: true,
    min: 0.5
  },
  message: {
    type: String,
    maxlength: 500
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  processedAt: {
    type: Date
  }
}, { timestamps: true });

module.exports = mongoose.model('RewardDonation', RewardDonationSchema);