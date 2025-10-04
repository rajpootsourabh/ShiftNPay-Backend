const VendorDocument = require("../model/VendorDocument");
const path = require('path');
const fs = require('fs');
const AssignedDocument = require("../model/AssignedDocument");
const Employee = require("../model/Employee");
const User = require("../model/User");
const Services = require('./../services');
const { exec } = require("child_process");

/**
 * Convert a DOCX file to a PDF using LibreOffice in headless mode.
 * @param {string} docxFilePath - Absolute path to the DOCX file.
 * @param {string} outputDir - Directory where the PDF should be saved.
 * @returns {Promise<string>} - Resolves with the path to the converted PDF file.
 */
function convertDocxToPdf(docxFilePath, outputDir) {
  return new Promise((resolve, reject) => {
    const command = `libreoffice --headless --convert-to pdf "${docxFilePath}" --outdir "${outputDir}"`;

    exec(command, (error, stdout, stderr) => {
      if (error) {
        return reject(`Conversion error: ${error.message}`);
      }
      const pdfFileName = path.basename(docxFilePath, ".docx") + ".pdf";
      const pdfFilePath = path.join(outputDir, pdfFileName);
      resolve(pdfFilePath);
    });
  });
}

exports.uploadVendorDocument = async (req, res) => {
  try {
    if (!req.files || !req.files.file) {
      return res.status(400).json({ success: false, msg: "No file uploaded" });
    }
    if (!req.body.documentId) {
      return res.status(400).json({
        success: false,
        msg: "Invalid Document Id. It should contain a value after the prefix.",
      });
    }

    const vendorId = req.payload.reqUserId;
    const uploadedDoc = req.files.file;
    const newDate = new Date();
    const originalFileName = uploadedDoc.name.replace(/\s+/g, "");

    let fileExtension = path.extname(originalFileName).toLowerCase();
    let finalFileName = `doc_${newDate.getTime()}_${originalFileName}`;
    let documentPath = path.join(__dirname, "..", "assets", "documents", "vendor", finalFileName);
    let outputDir = path.dirname(documentPath);

    uploadedDoc.mv(documentPath, async (err) => {
      if (err) {
        return res.status(500).json({
          success: false,
          msg: "Failed to move file",
          error: err,
        });
      }

      if (fileExtension === ".docx") {
        try {
          const pdfPath = await convertDocxToPdf(documentPath, outputDir);
          fs.unlinkSync(documentPath); // Remove original DOCX after conversion

          const fileSize = fs.statSync(pdfPath).size;
          const fileUrl = `vendor-documents/${path.basename(pdfPath)}`;

          const newDocument = new VendorDocument({
            fileName: path.basename(pdfPath),
            fileSize,
            date: newDate,
            docIdentity: req.body.documentId,
            fileUrl,
            uploadedBy: vendorId,
          });

          await newDocument.save();
          return res.status(201).json({ success: true, document: newDocument });
        } catch (conversionError) {
          return res.status(500).json({
            success: false,
            msg: "Failed to convert DOCX to PDF",
            error: conversionError,
          });
        }
      } else {
        const fileSize = uploadedDoc.size;
        const fileUrl = `vendor-documents/${finalFileName}`;

        const newDocument = new VendorDocument({
          fileName: finalFileName,
          fileSize,
          date: newDate,
          docIdentity: req.body.documentId,
          fileUrl,
          uploadedBy: vendorId,
        });

        await newDocument.save();
        return res.status(201).json({ success: true, document: newDocument });
      }
    });
  } catch (error) {
    return res.status(500).json({ message: error.message, error });
  }
};



exports.getVendorDocuments = async (req, res) => {
  const vendorId = req.payload.reqUserId;
  const { search = '', date = '' } = req.query;
  let query = {};
  if (search) query.fileName = new RegExp(search, 'i');
  if (date) {
    const startDate = new Date(date);
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 1); // Set endDate to the next day
    query.uploadedBy = vendorId;
    query.date = {
      $gte: startDate,
      $lt: endDate
    };
  }

  const documents = await VendorDocument.find(query);
  res.status(200).json(documents);
};

exports.updateVendorDocument = async (req, res) => {
  const { name } = req.body;

  const document = await VendorDocument.findById(req.params.id);
  if (!document) {
    return res.status(404).json({ message: "Document not found" });
  }

  document.name = name;
  await document.save();
  res.json({ message: "Document updated successfully", document });
};

exports.deleteVendorDocument = async (req, res) => {
  const { id } = req.params;
  const vendorId = req.payload.reqUserId;
  const document = await VendorDocument.findOne({ _id: id, uploadedBy: vendorId });
  if (!document) {
    return res.status(404).json({ message: "Document not found" });
  }
  await VendorDocument.findByIdAndDelete(id);
  await AssignedDocument.findOneAndDelete({ documentId: id });
  res.status(200).json({ message: 'Document deleted successfully' });
};

exports.deleteAssignedDocument = async (req, res) => {
  const { id } = req.body;
  const vendorId = req.payload.reqUserId;
  const document = await AssignedDocument.findOne({ _id: id, assignedBy: vendorId });
  if (!document) {
    return res.status(404).json({ message: "Document not found" });
  }
  await AssignedDocument.findOneAndDelete({ _id: id });
  res.status(200).json({ message: 'Document deleted successfully',status:true });
};

exports.assignDocumentToEmployee = async (req, res) => {
  try {
    const { employeeId, selectedIds } = req.body;
    const vendorId = req.payload.reqUserId;

    if (!employeeId || !selectedIds || selectedIds.length === 0) {
      return res.status(400).json({ message: 'Employee ID and at least one checklist are required' });
    }

    const assignedDocuments = selectedIds.map(documentId => ({
      documentId,
      assignedTo: employeeId,
      assignedBy: vendorId,
      submittedFileUrl: null, // Default to null
      status: "Pending",
    }));

    await AssignedDocument.insertMany(assignedDocuments);
    let employee = await Employee.findById({ _id: employeeId });
    let vendor = await User.findById({ _id: vendorId });

    await Services.NotificationService.sendNotification(employee._id, null, 'New Document Assigned!', `${vendor.name} has Assigned you a document.`);

    // Send response
    res.status(201).json({
      message: 'Documents successfully assigned to the employee!',
      assignedDocuments,
      status:true
    });

  } catch (error) {
    console.error('Error adding employee checklist:', error);
    res.status(500).json({ message: 'Server error' });
  }
};