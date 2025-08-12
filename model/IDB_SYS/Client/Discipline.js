const mongoose = require('mongoose');

const disciplineSchema = new mongoose.Schema({
  vendorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  uniqueId: { type: String, required: true },
  description: { type: String, required: true },
}, { timestamps: true });

module.exports = mongoose.model('Discipline', disciplineSchema);
