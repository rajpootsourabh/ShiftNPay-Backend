const mongoose = require('mongoose');
const { Schema } = mongoose;

const LeaveManagementSchema = new Schema({
    employeeId: {
        type: Schema.Types.ObjectId,
        ref: 'Employee', // Reference to the Employee table
        required: true,
    },
    vendorId: {
        type: Schema.Types.ObjectId,
        ref: 'User', // Reference to the Vendor (User) table
        required: true,
    },
    leaves: [
        {
            leaveType: {
                type: Schema.Types.ObjectId,
                ref: 'LeaveType', // Reference to the LeaveType schema
                required: true,
            },
            allotted: [
                {
                    date: {
                        type: Date,
                        required: true,
                        default: Date.now,
                    },
                    count: {
                        type: Number,
                        required: true,
                    }
                }
            ],
            consumed: [
                {
                    appliedDate: {
                        type: Date,
                        required: true,
                    },
                    startDate: {
                        type: Date,
                        required: true,
                    },
                    endDate: {
                        type: Date,
                        required: true,
                    },
                    halfDay: {
                        type: Boolean,
                        default: false, // true for half-day leave, false for full-day leave
                    },
                    periodOfLeave:{
                        type: String,
                        default: '',
                    },
                    count: {
                        type: Number,
                        required: true,
                    },
                    status: {
                        type: String,
                        enum: ['pending', 'approved', 'rejected'],
                        default: 'pending',
                    },
                    reason: {
                        type: String,
                        default: '',
                    },
                    document: {
                        type: String,
                        default: '',
                    },                    
                    approvedDate: Date,
                    approvedBy: {
                        type: Schema.Types.ObjectId,
                        ref: 'User', // Vendor who approved the leave
                    }
                }
            ]
        }
    ],
    createdAt: {
        type: Date,
        default: Date.now,
    }
});

module.exports = mongoose.model('LeaveManagement', LeaveManagementSchema);
