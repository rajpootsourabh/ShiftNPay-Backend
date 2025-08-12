const mongoose = require('mongoose');

const VendorModuleTransactionSchema = new mongoose.Schema({
  vendorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user',
    required: true
  },

  subscriptionId: {
    type: String,
    required: true // Stripe subscription ID
  },

  modules: [
    {
      type: Number, // cat values (module identifiers)
      required: true
    }
  ],

  amountTotal: {
    type: Number, // Total amount in cents
    required: true
  },

  currency: {
    type: String,
    default: 'usd'
  },

  status: {
    type: String,
    default: 'active' // Stripe status (active, incomplete, canceled, etc.)
  },

  startDate: {
    type: Date
  },

  endDate: {
    type: Date
  },

  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('VendorModuleTransaction', VendorModuleTransactionSchema);
