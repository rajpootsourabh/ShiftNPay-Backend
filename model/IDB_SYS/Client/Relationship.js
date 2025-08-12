const mongoose = require('mongoose');

const RelationshipSchema = new mongoose.Schema({
  vendorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  relation: { type: String, required: true },
}, { timestamps: true });

module.exports = mongoose.model('Relationship', RelationshipSchema);
