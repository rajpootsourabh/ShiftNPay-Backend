const mongoose = require('mongoose');

const noteTypesSchema = new mongoose.Schema({
  vendorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  customField: { type: String, required: true },  // text type
  client: { type: Boolean, default: false },      // client checkbox
  caregiver: { type: Boolean, default: false },   // caregiver checkbox
  printOnInfoSummary: { type: Boolean, default: false },  // print on info summary checkbox
  sortOrder: { type: String },                    // sort order as text field
  default: { type: Boolean, default: false },     // Default as checkbox
}, { timestamps: true });

module.exports = mongoose.model('CustomFields', noteTypesSchema);
