const mongoose = require("mongoose");

const AssignedDocumentSchema = new mongoose.Schema({
  documentId: { type: mongoose.Schema.Types.ObjectId, ref: "VendorDocument", required: true },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: "employee", required: true },
  assignedBy: { type: mongoose.Schema.Types.ObjectId, ref: "user", required: true },
  submittedFileUrl: { type: String }, // Will be filled when the employee uploads the completed document
  status: { type: String, enum: ["Pending", "In Progress", "Completed"], default: "Pending" },
  completedAt: { type: Date }, // Timestamp when document was completed/submitted
}, { timestamps: true });

module.exports = mongoose.model("AssignedDocument", AssignedDocumentSchema);
