const express = require("express");
const { createInvoice, getInvoices, getInvoiceById, updateInvoiceStatus, deleteInvoice } = require("../controller/invoiceController");
const { verifyToken } = require("../middleware/Auth");

const router = express.Router();

router.post("/send-invoice",verifyToken, createInvoice);
router.get("/",verifyToken, getInvoices);
router.get("/:id", getInvoiceById);
router.put("/:id/status", updateInvoiceStatus);
router.delete("/:id", deleteInvoice);

module.exports = router;
