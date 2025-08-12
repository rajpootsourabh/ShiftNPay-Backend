const mongoose = require('mongoose');

const AutoApprovalSchema = new mongoose.Schema({
    vendorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'vendor', // assuming you have a vendor schema
        required: true
    },
    approvalType: {
        type: String,
        enum: ['weekly', 'monthly'], // can extend to more options
        required: true
    },
    dayOfWeek: {
        type: String, // for weekly (e.g., 'Monday')
    },
    dateOfMonth: {
        type: Number, // for monthly (e.g., 15th of the month)
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const AutoApproval = mongoose.model('AutoApproval', AutoApprovalSchema);
module.exports = AutoApproval;
