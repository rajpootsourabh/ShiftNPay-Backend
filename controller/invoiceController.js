const Invoice = require("../model/InVoice");
const path = require("path");
const fs = require("fs");
const { sendInvoiceMail } = require("../util/mailService");

// Create a new invoice

exports.createInvoice = async (req, res) => {
  try {
    const { email, sender, status, name } = req.body;
    //console.log('req.body ' , req.body)
        let userId =  req.payload.reqUserId;
    if (!req.files || !req.files.file) {
      return res.status(400).json({ success: false, message: "Invoice file is required" });
    }

    const invoiceFile = req.files.file;
    const date = new Date();
    const fileName = `invoice_${date.getTime()}_${invoiceFile.name.replace(/\s+/g, '')}`;
    const uploadPath = path.join(__dirname, "..", "assets", "invoices", fileName);

    invoiceFile.mv(uploadPath, async (err) => {
      if (err) {
        return res.status(400).json({ success: false, message: "Failed to upload invoice file" });
      }

      const invoiceUrl = `${req.protocol}://${req.get("host")}/api/invoices/${fileName}`;

      const newInvoice = new Invoice({
        invoiceUrl,
        email:email,
        sender:userId,
        status,
        name : fileName
      });

      await newInvoice.save();

       sendInvoiceMail(newInvoice,userId, "New Invoice Recieved")

      res.status(201).json({ success: true, message: "Invoice created successfully", invoice: newInvoice });
    });

  } catch (error) {
    res.status(500).json({ success: false, message: "Error creating invoice", error: error.message });
  }
};

exports.getInvoices = async (req, res) => {
  try {
    let vendorId =  req.payload.reqUserId;
    const invoices = await Invoice.find({sender : vendorId}).select('_id name invoiceUrl email status updatedAt');
    res.status(200).json({ success: true, invoices });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error fetching invoices", error: error.message });
  }
};

exports.getInvoiceById = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) {
      return res.status(404).json({ success: false, message: "Invoice not found" });
    }
    res.status(200).json({ success: true, invoice });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error fetching invoice", error: error.message });
  }
};

// Update invoice status
exports.updateInvoiceStatus = async (req, res) => {
  try {
    const { status } = req.body;

    const invoice = await Invoice.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!invoice) {
      return res.status(404).json({ success: false, message: "Invoice not found" });
    }

    res.status(200).json({ success: true, message: "Invoice status updated", invoice });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error updating invoice", error: error.message });
  }
};

// Delete an invoice
exports.deleteInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findByIdAndDelete(req.params.id);

    if (!invoice) {
      return res.status(404).json({ success: false, message: "Invoice not found" });
    }

    res.status(200).json({ success: true, message: "Invoice deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error deleting invoice", error: error.message });
  }
};
