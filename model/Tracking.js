const mongoose = require('mongoose');

const TrackingSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'employee',
        required: true
    },
    jobId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'job',
        required: true
    },
    sessionDate: {
        type: Date,
        required: true,
        default: () => new Date().setHours(0, 0, 0, 0) // Start of the current day
    },
    name: {
        type: String,
    },
    startTime: {
        type: Date,
        required: true
    },
    stoppedTime: {
        type: Date,
    },
    lastStartTime: {
        type: Date,
    },
    breakLastStartTime: {
        type: Date,
    },
    isTimerRunning: {
        type: Boolean,
        default: false
    },
    elapsedTime: {
        type: Number,
        default: 0 // Total work time
    },
    count: {
        type: Number
    },
    amount: {
        type: Number
    },
    overAmount: {
        type: Number
    },
    status: {
        type: String,
        enum: ['approved', 'rejected', 'pending'],
        default: 'pending',
    },
    isOnBreak: {
        type: Boolean,
        default: false // Indicates if the user is currently on a break
    },
    totalBreakTime: {
        type: Number,
        default: 0 // Stores total break time in milliseconds
    },
    clockLogs: [{
        type: {
            type: String,
            enum: ['clock-in', 'clock-out', 'break-in', 'break-out'], // Added break-in/break-out
            required: true
        },
        time: {
            type: Date,
            required: true,
            default: Date.now
        },
        title: {
            type: String,
            required: function () { return this.type === 'break-in'; } // Required only for 'break-in'
        }
    }]
}, { timestamps: true });

const Tracking = mongoose.model('tracking', TrackingSchema);
module.exports = Tracking;
