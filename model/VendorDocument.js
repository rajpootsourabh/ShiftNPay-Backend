const mongoose = require("mongoose");

const VendorDocumentSchema = new mongoose.Schema({
  fileName: {
    type: String,
    required: true,
  },
  docIdentity: {
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
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
});

module.exports = mongoose.model("VendorDocument", VendorDocumentSchema);
