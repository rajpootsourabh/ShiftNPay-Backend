const VendorDocument = require("../model/VendorDocument");
const mongoose = require('mongoose');
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
  const { search = '', date = '', includeSystemForms = 'false' } = req.query;
  let query = {};
  
  // Only include system forms when explicitly requested (for Assign Document modal)
  if (includeSystemForms === 'true') {
    query.$or = [
      { uploadedBy: null }, // System onboarding forms
      { uploadedBy: vendorId } // Vendor's uploaded docs
    ];
  } else {
    // Default: only show vendor's uploaded documents
    query.uploadedBy = vendorId;
  }
  
  if (search) query.fileName = new RegExp(search, 'i');
  if (date) {
    const startDate = new Date(date);
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 1);
    query.date = {
      $gte: startDate,
      $lt: endDate
    };
  }

  // Sort: system forms first (by docIdentity), then uploaded docs (by date desc)
  const documents = await VendorDocument.find(query)
    .sort({ uploadedBy: 1, docIdentity: 1, date: -1 });
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
      return res.status(400).json({ message: 'Employee ID and at least one document are required' });
    }

    // Check for duplicates - prevent assigning same document to same employee
    const existingAssignments = await AssignedDocument.find({
      documentId: { $in: selectedIds },
      assignedTo: employeeId
    });

    const existingDocIds = existingAssignments.map(a => a.documentId.toString());
    const newDocIds = selectedIds.filter(id => !existingDocIds.includes(id));

    if (newDocIds.length === 0) {
      return res.status(400).json({ 
        message: 'All selected documents are already assigned to this employee',
        status: false
      });
    }

    const assignedDocuments = newDocIds.map(documentId => ({
      documentId,
      assignedTo: employeeId,
      assignedBy: vendorId,
      submittedFileUrl: null,
      status: "Pending",
    }));

    await AssignedDocument.insertMany(assignedDocuments);
    let employee = await Employee.findById({ _id: employeeId });
    let vendor = await User.findById({ _id: vendorId });

    await Services.NotificationService.sendNotification(employee._id, null, 'New Document Assigned!', `${vendor.name} has assigned you ${newDocIds.length} document(s).`);

    res.status(201).json({
      message: `${newDocIds.length} document(s) successfully assigned. ${existingDocIds.length > 0 ? `${existingDocIds.length} duplicate(s) skipped.` : ''}`,
      assignedDocuments,
      status: true,
      skipped: existingDocIds.length
    });

  } catch (error) {
    console.error('Error adding employee checklist:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Seed predefined onboarding forms as VendorDocuments (called once per vendor)
exports.seedOnboardingForms = async (req, res) => {
  try {
    const vendorId = req.payload.reqUserId;
    
    const onboardingForms = [
      { _id: new mongoose.Types.ObjectId("65e0000000000000000f0001"), code: "1020", name: "Employment Application" },
      { _id: new mongoose.Types.ObjectId("65e0000000000000000f0002"), code: "1021", name: "Equal Employment Opportunity" },
      { _id: new mongoose.Types.ObjectId("65e0000000000000000f0003"), code: "1050", name: "Skills Checklist" },
      { _id: new mongoose.Types.ObjectId("65e0000000000000000f0004"), code: "1060", name: "Request for Reference" },
      { _id: new mongoose.Types.ObjectId("65e0000000000000000f0005"), code: "1070", name: "Background Check Authorization" },
      { _id: new mongoose.Types.ObjectId("65e0000000000000000f0006"), code: "1204", name: "Care Associate Availability" },
      { _id: new mongoose.Types.ObjectId("65e0000000000000000f0007"), code: "1010", name: "Employee Personal Action" },
      { _id: new mongoose.Types.ObjectId("65e0000000000000000f0008"), code: "1201", name: "Handbook Acknowledgement" },
      { _id: new mongoose.Types.ObjectId("65e0000000000000000f0009"), code: "1202", name: "Orientation Acknowledgement" },
      { _id: new mongoose.Types.ObjectId("65e0000000000000000f000a"), code: "1203", name: "Orientation Curriculum" },
      { _id: new mongoose.Types.ObjectId("65e0000000000000000f000b"), code: "1220", name: "Abuse & Neglect Policy" },
      { _id: new mongoose.Types.ObjectId("65e0000000000000000f000c"), code: "1530", name: "Care Associate Schedule Acknowledgement" },
      { _id: new mongoose.Types.ObjectId("65e0000000000000000f000d"), code: "1600", name: "Emergency Contact Information" },
      { _id: new mongoose.Types.ObjectId("65e0000000000000000f000e"), code: "1720", name: "Hepatitis B Consent" },
      { _id: new mongoose.Types.ObjectId("65e0000000000000000f000f"), code: "1740", name: "Pre-Employment Drug Consent" },
      { _id: new mongoose.Types.ObjectId("65e0000000000000000f0010"), code: "2900", name: "ID Agreement" },
      { _id: new mongoose.Types.ObjectId("65e0000000000000000f0011"), code: "4000", name: "Nondisclosure / Noncompete" },
      { _id: new mongoose.Types.ObjectId("65e0000000000000000f0012"), code: "I-9", name: "I-9 Employment Eligibility" },
      { _id: new mongoose.Types.ObjectId("65e0000000000000000f0013"), code: "W-4", name: "W-4 Tax Form" },
    ];

    // Check if forms already exist
    const existingCount = await VendorDocument.countDocuments({
      _id: { $in: onboardingForms.map(f => f._id) }
    });

    if (existingCount === onboardingForms.length) {
      return res.status(200).json({ 
        message: 'Onboarding forms already seeded', 
        status: true,
        count: existingCount 
      });
    }

    // Insert forms that don't exist yet
    const docsToInsert = [];
    for (const form of onboardingForms) {
      const exists = await VendorDocument.findById(form._id);
      if (!exists) {
        docsToInsert.push({
          _id: form._id,
          fileName: form.name,
          docIdentity: form.code,
          fileSize: "0 KB",
          date: new Date(),
          fileUrl: `/forms/${form.code.toLowerCase().replace(/\s+/g, '-')}.pdf`,
          uploadedBy: null // System document
        });
      }
    }

    if (docsToInsert.length > 0) {
      await VendorDocument.insertMany(docsToInsert, { ordered: false });
    }

    res.status(201).json({ 
      message: 'Onboarding forms seeded successfully', 
      status: true,
      inserted: docsToInsert.length 
    });

  } catch (error) {
    console.error('Error seeding onboarding forms:', error);
    res.status(500).json({ message: 'Server error', status: false });
  }
};