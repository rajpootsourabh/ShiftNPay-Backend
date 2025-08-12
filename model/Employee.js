const mongoose = require('mongoose')
const { v4: uuidv4 } = require('uuid');

const EmployeeSchema = new mongoose.Schema({
    name: {
        type: String,
    },
    email: {
        type: String
    },
    profile: {
        type: String
    },
    weekStart: {
        type: String
    },
    workingDays: [
        {
            name: { type: String }
        }
    ],
    capacity: {
        type: Number
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user'
    },
    password: {
        type: String
    },
    delete: {
        type: Boolean,
        default: false
    },
    rate: {
        type: Number
    },
    rateType: {
        type: String,
        default: 'day',
        enum: ['day', 'hour']
    },
    address: {
        type: String
    },
    mobile: {
        type: Number
    },
    city: {
        type: String,
    },
    lane: {
        type: String
    },
    stateId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'state'
    },
    zip: {
        type: String
    },
    jobId: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'job'
    }],
    shift: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'shift'
    }],
    jobTitle: {
        type: String,
    },
    department: {
        type: String,
    },
    employeeId: {
        type: String,
        default: uuidv4
    },
    hireDate: {
        type: Date,
    },
    empStatus: {
        type: String,
        default: 'active',
        enum: ['active', 'terminated', 'leave']
    },
    payPeriod: {
        type: String,
        default: 'weekly',
        enum: ['weekly', 'monthly', 'bi-weekly']
    },
    overTimeRate: {
        type: Number,
    },
    wage: {
        type: Number,
    },
    timeOff: {
        type: String,
    },
    device_token: {
        type: String,
    },
    availabilityPreference: {
        type: String,
        default: 'flexible',
    }
}, { timestamps: true })

const Employee = mongoose.model('employee', EmployeeSchema)
module.exports = Employee