const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const subscriptionSchema = new Schema(
  {
    membershipId: {
      type: Schema.Types.ObjectId,
      ref: 'Membership',
      required: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'user', // Replace with the appropriate user model reference
      required: true,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ['Active', 'Inactive', 'Expired'],
      default: 'Active',
    },
    isTrial: {
      type: Boolean,
      default: false,
    },
    trialEndDate: {
      type: Date,
      required: false,
    },
    json_response:{
      type: String,
    }
  },
  {
    timestamps: true,
  }
);

const Subscription = mongoose.model('Subscription', subscriptionSchema);
module.exports = Subscription;
