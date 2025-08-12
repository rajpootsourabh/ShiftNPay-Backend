const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const membershipSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
      unique: true,
    },
    price: {
      type: Number,
      required: true,
    },
    type: {
      type: String,
      enum: ['Gold', 'Silver', 'Bronze'],
      required: true,
    },
    paymentTerm: {
      type: String,
      enum: ['Monthly', 'Quarterly', 'Annually'],
      required: true,
    },
    planDate: {
      type: Date,
      required: true,
    },
    description: {
      type: String,
      required: false,
    },
    stripePlanId: {
      type: String,
      required: false, // This will be set after creating the plan in Stripe
    },

    stripeProductId: {
      type: String,
      required: false, // This will be set after creating the plan in Stripe
    },
    trialPeriodDays: {
      type: Number,
      default: 30, // Default to 30 days trial period
    },
  },
  {
    timestamps: true,
  }
);

const Membership = mongoose.model('Membership', membershipSchema);
module.exports = Membership;
