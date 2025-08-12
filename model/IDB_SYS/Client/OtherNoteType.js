const mongoose = require('mongoose');

const otherNoteTypeSchema = new mongoose.Schema({
  vendorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  description: { type: String, required: true },  // text type
  referral: { type: Boolean, default: false },      // client checkbox
  physician: { type: Boolean, default: false },   // caregiver checkbox
  caseManager: { type: Boolean, default: false },  // print on info summary checkbox
  status: { 
    type: String, 
    enum: ['Active', 'Inactive'], 
    required: true 
  },    // Default as checkbox
}, { timestamps: true });

module.exports = mongoose.model('OtherNoteType', otherNoteTypeSchema);
