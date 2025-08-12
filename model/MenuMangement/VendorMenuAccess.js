const mongoose = require('mongoose');

const vendorModuleAccessSchema = new mongoose.Schema({
  vendorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  activeModules: [
    {
      cat: { type: Number, required: true },
      routes: [String],
    },
  ],
  isTrial: { type: Boolean, default: false },
  trialEndDate: { type: Date },
  hasUsedTrial: { type: Boolean, default: false },
  stripeCustomerId: { type: String },
  stripeSubscriptionId: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('VendorModuleAccess', vendorModuleAccessSchema);
