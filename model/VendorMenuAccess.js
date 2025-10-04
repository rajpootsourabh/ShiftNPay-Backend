const mongoose = require('mongoose');

const VendorMenuAccessSchema = new mongoose.Schema({
  vendorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user',
    required: true,
    unique: true
  },
  category: [
    {
      name: {
        type: String,
        required: true
      },
      subcategories: [
        {
          type: String
        }
      ]
    }
  ],
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin'
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('VendorMenuAccess', VendorMenuAccessSchema);
