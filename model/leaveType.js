const mongoose = require('mongoose');
const { Schema } = mongoose;

const leaveTypeSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true, // Leave type name is required
        trim: true, // Trim whitespace from the string
    },
    vendorId: {
        type: Schema.Types.ObjectId,
        ref: 'User', // Reference to User table
        required: true,
    },
    description: {
        type: String,
        trim: true, // Optional description with trimmed whitespace
    },
    isActive: {
        type: Boolean,
        default: true, // Leave type is active by default
    },
    createdAt: {
        type: Date,
        default: Date.now, // Timestamp of creation
    },
    updatedAt: {
        type: Date,
        default: Date.now, // Timestamp of last update
    },
});

// Middleware to update the updatedAt field before saving
leaveTypeSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

const LeaveType = mongoose.model('LeaveType', leaveTypeSchema);

module.exports = LeaveType;
