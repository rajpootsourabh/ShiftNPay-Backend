const mongoose = require('mongoose');

const CaseManagerSchema = new mongoose.Schema({
  vendorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  Agency: { type: mongoose.Schema.Types.ObjectId, ref: 'Agency', required: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  phone: { type: String, required: true },
  ext: { type: String, required: true },
  phone2: { type: String, required: true },
  fax: { type: String, default: 0 },  
  email: {
        type: String,
        required: true,
        unique: true
    }, 
  status: { 
    type: String, 
    enum: ['Active', 'Inactive'], 
    required: true 
  },
}, { timestamps: true });

module.exports = mongoose.model('CaseManager', CaseManagerSchema);
