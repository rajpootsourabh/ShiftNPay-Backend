const mongoose = require("mongoose");

const InvoiceSchema = new mongoose.Schema(
    {
        invoiceUrl: {
            type: String,
            required: true,
        },
        email: {
            type: String,
            required: true,
        },
        sender: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'user'
        },
        status: {
            type: String,
            enum: ["pending", "paid", "canceled"],
            default: "pending",
        },
        name: {
            type: String,
            required: true,
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model("Invoice", InvoiceSchema);
