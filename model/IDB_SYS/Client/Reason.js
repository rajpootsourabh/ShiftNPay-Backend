const mongoose = require('mongoose');

const reasonSchema = new mongoose.Schema({
  vendorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  description: { type: String, required: true },  // text type
  caregiver: { type: Boolean, default: false },      // client checkbox
  client: { type: Boolean, default: false },   // caregiver checkbox
  ios: { type: Boolean, default: false },  // print on info summary checkbox
}, { timestamps: true });

module.exports = mongoose.model('Reason', reasonSchema);
