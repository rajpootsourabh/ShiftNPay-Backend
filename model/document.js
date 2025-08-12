const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema({
  fileName: {
    type: String,
    required: true,
  },
  fileSize: {
    type: String,
    required: true,
  },
  date: {
    type: Date,
    required: true,
  },
  fileUrl: {
    type: String,
    required: true,
  },
}, { timestamps: true });

const Document = mongoose.model('Document', documentSchema);
module.exports = Document;
