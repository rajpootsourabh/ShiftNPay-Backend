const mongoose = require('mongoose');

const MedicationsMasterList = new mongoose.Schema({
  vendorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  drugName: { type: String, required: true },
}, { timestamps: true });

module.exports = mongoose.model('Medication', MedicationsMasterList);
