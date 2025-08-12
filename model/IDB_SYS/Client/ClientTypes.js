const mongoose = require('mongoose');

const clientTypesSchema = new mongoose.Schema({
  vendorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  description: { type: String, required: true },
  shortDescription: { type: String, required: true },
}, { timestamps: true });

module.exports = mongoose.model('ClientTypes', clientTypesSchema);
