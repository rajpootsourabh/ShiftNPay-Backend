const mongoose = require('mongoose');

const RewardRedemptionSchema = new mongoose.Schema({
  rewardId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'WeeklyReward',
    required: true
  },
  employerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user',
    required: true
  },
  employeeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'employee',
    required: true
  },
  redemptionType: {
    type: String,
    enum: ['vacation', 'payout', 'donation'],
    required: true
  },
  // Common fields for all redemption types
  hoursRedeemed: {
    type: Number,
    required: true,
    min: 0.5,
    validate: {
      validator: function(v) {
        return v % 0.5 === 0; // Only allow 0.5 hour increments
      },
      message: props => `${props.value} must be in 0.5 hour increments`
    }
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'processed'],
    default: 'pending'
  },
  requestMessage: {
    type: String,
    maxlength: 500
  },
  // Fields specific to vacation redemption
  vacationDetails: {
    startDate: Date,
    endDate: Date,
    notes: String
  },
  // Fields specific to payout redemption
  payoutDetails: {
    paymentMethod: {
      type: String,
      enum: ['bank_transfer', 'paypal', 'other']
    },
    accountDetails: {
      // Simplified for example - adjust based on your payment processing needs
      accountNumber: String,
      routingNumber: String
    }
  },
  // Fields specific to donation redemption
  donationDetails: {
    recipientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'employee'
    },
    recipientEmail: {
      type: String,
      match: [/.+\@.+\..+/, 'Please enter a valid email']
    },
    recipientName: String,
    recipientPhone: String,
    message: String
  },
  // Admin processing fields
  processedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user'
  },
  processedAt: Date,
  rejectionReason: String
}, { 
  timestamps: true,
  // Ensure we can't redeem more hours than available
  statics: {
    async validateRedemption(rewardId, hours) {
      const reward = await this.model('WeeklyReward').findById(rewardId);
      if (!reward) throw new Error('Reward not found');
      if (reward.status !== 'approved') throw new Error('Reward not available for redemption');
      if (reward.bonusHours < hours) throw new Error('Not enough bonus hours available');
      return true;
    }
  }
});

// Middleware to update WeeklyReward status when redemption is approved
RewardRedemptionSchema.pre('save', async function(next) {
  if (this.isModified('status') && this.status === 'approved') {
    const WeeklyReward = mongoose.model('WeeklyReward');
    const reward = await WeeklyReward.findById(this.rewardId);
    
    const newRedeemedHours = (reward.redeemedHours || 0) + this.hoursRedeemed;
    const remainingHours = reward.bonusHours - newRedeemedHours;
    
    let newStatus = reward.status;
    if (remainingHours <= 0) {
      newStatus = 'redeemed';
    } else if (newRedeemedHours > 0) {
      newStatus = 'partially_redeemed';
    }
    
    await WeeklyReward.findByIdAndUpdate(this.rewardId, {
      redeemedHours: newRedeemedHours,
      remainingHours: remainingHours,
      status: newStatus,
      redemptionType: this.redemptionType,
      redeemedAt: new Date()
    });
  }
  next();
});
module.exports = mongoose.model('RewardRedemption', RewardRedemptionSchema);