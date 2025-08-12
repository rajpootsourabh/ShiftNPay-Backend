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
        default: () => new Date().setHours(0, 0, 0, 0) // set to the start of the current day
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
    isTimerRunning: {
        type: Boolean,
        default: false
    },
    elapsedTime: {
        type: Number,
        default: 0
    },
    count: {
        type: Number
    },
    amount: {
        type: Number
    },
    overAmount: {
        type: Number
    }
}, { timestamps: true });

const Tracking = mongoose.model('tracking', TrackingSchema);
module.exports = Tracking;
