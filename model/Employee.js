const mongoose = require('mongoose')
const { v4: uuidv4 } = require('uuid');

const EmployeeSchema = new mongoose.Schema({
    name: {
        type: String,
        default:''
    },
    firstName: {
        type: String,
        default:''
    },
    lastName: {
        type: String,
        default:''
    },
    middleName: {
        type: String,
        default:''
    },
    ssnNo: {
        type: String,
        default:''
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
        type: Number,
        default: ""
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
        default:''
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
        default:''
    },
    department: {
        type: String,
        default:''
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
        default: 1.5,
    },
    wage: {
        type: Number,
    },
    timeOff: {
        type: String,
        default:''
    },
    device_token: {
        type: String,
        default:''
    },
    availabilityPreference: {
        type: String,
        default: 'flexible',
    },
    empId: {
        type: Number,
        unique: true,
    },
    shiftPreferences: {
        type: String,
        default:''
    },
    certifications: {
        type: String,
        default:''
    },
    skills: {
        type: String,
        default:''
    },
    is_online: {
        type: Boolean,
        default: false
    },
    roomId:{
        type:String,
        default:null
    }

}, { timestamps: true })

const Employee = mongoose.model('employee', EmployeeSchema)
module.exports = Employee