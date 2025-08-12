const mongoose = require('mongoose');

const agencySchema = new mongoose.Schema({
  vendorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  agency: { type: String, required: true },
  address_1: { type: String, required: true },
  address_2: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String, required: true },
  zip: { type: String, required: true },
}, { timestamps: true });

module.exports = mongoose.model('Agency', agencySchema);
