const mongoose = require('mongoose');

const SalesRepSchema = new mongoose.Schema({
  vendorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  status: { 
    type: String, 
    enum: ['Active', 'Inactive'], 
    required: true 
  },
}, { timestamps: true });

module.exports = mongoose.model('SalesRep', SalesRepSchema);
