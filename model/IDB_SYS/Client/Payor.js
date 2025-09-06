const mongoose = require('mongoose');

const PayorSchema = new mongoose.Schema({
  // Payor Address
  vendorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  payor: { type: String, required: true },
  payorId: { type: String },
  address1: { type: String },
  address2: { type: String },
  city: { type: String },
  state: { type: String },
  zip: { type: String },
  phone1: { type: String },
  phone2: { type: String },
  email: { type: String },
  website: { type: String },
  status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' },

  // Notes
  notes: { type: String },

  // EDI Information
  edi: {
    senderCode: { type: String },
    receiverName: { type: String },
    receiverCode: { type: String },
    receiverETIN: { type: String },
    ediVersion: { type: String },
    submitterName: { type: String },
    ediContactName: { type: String },
    submitterETIN: { type: String },
    ediContactNumber: { type: String },
    claimFilingIndicator: { type: String },
    isa05SenderIdQualifier: { type: String },
    isa07ReceiverIdQualifier: { type: String },
    stateEVV: { type: Boolean, default: false },
    evvId: { type: String },
    payorProgram: { type: String },
    providerCommercialNumber: { type: String }
  },

  // Options
  options: {
    includeServiceTaxonomyCodes: { type: Boolean, default: false },
    includeOtherProvider: { type: Boolean, default: false },
    doNotPrint2420APrv: { type: Boolean, default: false },
    includeCGNameAndNPI: { type: Boolean, default: false },
    includeClientAddress: { type: Boolean, default: false },
    removeLeadingZeros: { type: Boolean, default: false },
    addModifier76: { type: Boolean, default: false }
  },

  // Call Processing
  callProcessing: {
    overrideDefaultEVVRounding: { type: Boolean, default: false },
    roundingInterval: { type: Number, default: 0 },
    roundToScheduledTime: { type: Number, default: 0 }
  },

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Middleware to update 'updatedAt' on save
PayorSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Payor', PayorSchema);
