const mongoose = require('mongoose');

const locationSchema = new mongoose.Schema({
  vendorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

  overrideCompanyInfo: { type: Boolean, default: false },

  location: { 
    type: String, 
    required: true, 
    maxlength: 3, 
    trim: true 
  },

  description: { type: String },

  overrideTimezone: { type: Boolean, default: false },
  evvTimezone: { type: String },

  providerId: { type: String },
  companyName: { type: String },

  taxId: { type: String },
  address: { type: String },

  city: { type: String },
  state: { type: String },
  zip: { type: String }, 

  phone: { type: String },
  payrollId: { type: String },

}, { timestamps: true });

module.exports = mongoose.model('Location', locationSchema);
