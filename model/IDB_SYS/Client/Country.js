const mongoose = require('mongoose');

const countrySchema = new mongoose.Schema({
  vendorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  country: { type: String, required: true },
}, { timestamps: true });

module.exports = mongoose.model('Country', countrySchema);
