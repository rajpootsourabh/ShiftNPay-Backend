const mongoose = require('mongoose');

const needSchema = new mongoose.Schema({
  vendorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  description: { type: String, required: true },
}, { timestamps: true });

module.exports = mongoose.model('Need', needSchema);
