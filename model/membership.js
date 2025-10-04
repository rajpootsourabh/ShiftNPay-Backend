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
  },
  {
    timestamps: true,
  }
);

const Membership = mongoose.model('Membership', membershipSchema);
module.exports = Membership;
