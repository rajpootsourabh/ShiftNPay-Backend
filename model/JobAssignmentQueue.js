const mongoose = require('mongoose');

const JobAssignmentQueueSchema = new mongoose.Schema({
    jobId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'job',
        required: true,
        index: true
    },
    vendorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
        required: true
    },
    employeeQueue: [{
        employeeId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'employee'
        },
        priority: Number // Lower number = higher priority
    }],
    currentEmployeeIndex: {
        type: Number,
        default: 0
    },
    requestTime: {
        type: Date,
        default: Date.now
    },
    status: {
        type: String,
        enum: ['pending', 'accepted', 'failed', 'retrying'],
        default: 'pending'
    },
    responses: [{
        employeeId: { 
            type: mongoose.Schema.Types.ObjectId, 
            ref: 'employee' 
        },
        status: { 
            type: String, 
            enum: ['accepted', 'rejected', 'timeout'] 
        },
        respondedAt: Date,
        notes: String
    }],
    maxRetries: {
        type: Number,
        default: 1
    },
    currentRetry: {
        type: Number,
        default: 0
    },
    expiration: {
        type: Date,
        default: () => new Date(Date.now() + 7*24*60*60*1000) // 1 week default
    }
}, { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Virtual for current employee
JobAssignmentQueueSchema.virtual('currentEmployee').get(function() {
    return this.employeeQueue[this.currentEmployeeIndex]?.employeeId;
});

module.exports = mongoose.model('JobAssignmentQueue', JobAssignmentQueueSchema);