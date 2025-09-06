const mongoose = require('mongoose');

const clientSchema = new mongoose.Schema({
  name: { type: String, required: true },
  firstName: { type: String },
  lastName: { type: String },
  specialty: { type: String },
  address1: { type: String },
  address2: { type: String },
  city: { type: String },
  state: { type: String },
  zip: { type: String, match: [/^\d{5}(-\d{4})?$/, "Invalid ZIP code format"] },
  phone: { type: String },
  altPhone: { type: String },
  fax: { type: String },
  email: { type: String, match: [/^\S+@\S+\.\S+$/, "Invalid email address"] },
  status: { type: String, enum: ["Active", "Inactive"], default: "Active" },
   vendorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

  // Right-side fields
  npi: { type: String },
  qualId: { type: String },
  qualNumber: { type: String },
  taxonomyCode: { type: String },
  taxonomyNumber: { type: String },
  providerAssignedId: { type: String },
  notes: { type: String },

  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Physician', clientSchema);