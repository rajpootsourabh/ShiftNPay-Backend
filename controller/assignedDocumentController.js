const { default: mongoose } = require("mongoose");
const AssignedDocument = require("../model/AssignedDocument");
const VendorDocument = require("../model/VendorDocument");
const path = require('path');
const fs = require('fs');
const Employee = require("../model/Employee");
const User = require("../model/User");
const Services = require('./../services');


exports.assignDocument = async (req, res) => {
  const { documentId, assignedTo, assignedBy } = req.body;

  if (!documentId || !assignedTo || !assignedBy) {
    return res.status(400).json({ message: "All fields are required" });
  }

  const assignedDocument = new AssignedDocument({ documentId, assignedTo, assignedBy });
  await assignedDocument.save();

  res.json({ message: "Document assigned successfully", assignedDocument });
};

exports.getAssignedDocuments = async (req, res) => {

  try {
    let vendorId = req.payload.reqUserId;
    const documents = await AssignedDocument.find({ assignedBy: new mongoose.Types.ObjectId(vendorId) })
    .populate("documentId")
    .populate("assignedTo")
    .sort({ createdAt: -1 }); 

    return res.status(200).json(documents);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};


exports.uploadCompletedDocument = async (req, res) => {
  if (!req.files || !req.params.id) {
    return res.status(400).json({ message: "File and document ID are required" });
  }

  const file = req.files.file;
  const filePath = `uploads/${file.name}`;
  await file.mv(filePath);

  const assignedDocument = await AssignedDocument.findById(req.params.id);
  if (!assignedDocument) {
    return res.status(404).json({ message: "Assigned document not found" });
  }

  assignedDocument.submittedFileUrl = filePath;
  assignedDocument.status = "Submitted";
  await assignedDocument.save();

  res.json({ message: "Document uploaded successfully", assignedDocument });
};

// ✅ Vendor views completed documents submitted by employees
exports.getSubmittedDocuments = async (req, res) => {
  const documents = await AssignedDocument.find({ assignedBy: req.params.vendorId, status: "Submitted" })
    .populate("documentId", "name fileUrl")
    .populate("assignedTo", "name");

  res.json(documents);
};

// ✅ Vendor can download submitted documents
exports.downloadSubmittedDocument = async (req, res) => {
  const assignedDocument = await AssignedDocument.findById(req.params.id);
  if (!assignedDocument || !assignedDocument.submittedFileUrl) {
    return res.status(404).json({ message: "File not found" });
  }

  res.download(assignedDocument.submittedFileUrl);
};




exports.getAssignedDocumentsToEmployee = async (req, res) => {

  try {
    let employeeId = req.payload.reqUserId;
    const documents = await AssignedDocument.find({ assignedTo: new mongoose.Types.ObjectId(employeeId) })
    .populate("documentId")
    .populate("assignedBy")
    .sort({ createdAt: -1 }); 

    return res.status(200).json(documents);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

exports.uploadDoucmentByEmployee = async (req, res) => {
  try {
    if (!req.files || !req.files.file) {
      return res.status(400).json({ success: false, msg: "No file uploaded" });
    }
    if (!req.body.documentId) {
      return res.status(400).json({ success: false, msg: "Invalid Document Id." });
    }

    const emploeeId = req.payload.reqUserId;
    const uploadedDoc = req.files.file;

    const newDate = new Date();
    const fileName = `doc_${newDate.getTime()}_${uploadedDoc.name.replace(/\s+/g, "")}`;
    const documentPath = path.join(__dirname, "..", "assets", "documents", "vendor", fileName);

    uploadedDoc.mv(documentPath, async (err) => {
      if (err) {
        return res.status(500).json({ success: false, msg: "Failed to move file", error: err });
      }

      const fileUrl = `vendor-documents/${fileName}`;

      // **Find the assigned document and update it**
      const updatedDocument = await AssignedDocument.findOneAndUpdate(
        { _id: req.body.documentId, assignedTo: emploeeId },  // Match the document
        { 
          submittedFileUrl :fileUrl,
          status: 'Submitted'
        },
        { new: true } // Return the updated document
      );

      if (!updatedDocument) {
        return res.status(404).json({ success: false, msg: "Document not found for the assigned vendor" });
      }

      let employee = await Employee.findById({ _id: emploeeId });
          let vendor = await User.findById({ _id: updatedDocument?.assignedBy?._id });
      
          await Services.NotificationService.sendNotification(vendor._id, vendor.device_token, 'New Document Submitted!', `${employee.name} has Submitted  you a document.`);
      



      res.status(200).json({ success: true, document: updatedDocument });
    });
  } catch (error) {
    res.status(500).json({ message: error.message, error });
  }
};
