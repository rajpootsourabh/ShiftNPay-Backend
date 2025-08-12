const mongoose = require('mongoose');

const TimeSpanSchema = new mongoose.Schema({
  vendorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  description: { type: String, required: true },  // text type
  unit: { type: Number, default: 0 },  
  sortOrder: { type: Number, default: 0 },  
  frequency: { 
    type: String, 
    enum: ['Days', 'Months','Years'], 
    required: true 
  },
}, { timestamps: true });

module.exports = mongoose.model('TimeSpan', TimeSpanSchema);
