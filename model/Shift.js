const mongoose = require('mongoose');

const ShiftSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Shift name is required']
    },
    start: {
        type: Date,
        required: [true, 'Start time is required']
    },
    end: {
        type: Date,
        required: [true, 'End time is required'],
        validate: {
            validator: function(end) {
                return end > this.start;
            },
            message: 'End time must be after start time'
        }
    },
    timezone: {
        type: String,
        required: [true, 'Timezone is required'],
        default: '"America/Chicago"',
        enum: {
            values: Intl.supportedValuesOf('timeZone'),
            message: '{VALUE} is not a supported timezone'
        }
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
        required: true
    },
    // Store UTC equivalents for easy querying
    utcStart: {
        type: Date
    },
    utcEnd: {
        type: Date
    }
}, { timestamps: true });

// Middleware to convert local times to UTC before saving
ShiftSchema.pre('save', function(next) {
    if (this.isModified('start') || this.isModified('timezone')) {
        this.utcStart = convertToUTC(this.start, this.timezone);
    }
    if (this.isModified('end') || this.isModified('timezone')) {
        this.utcEnd = convertToUTC(this.end, this.timezone);
    }
    next();
});

// Helper function to convert local time to UTC
function convertToUTC(date, timezone) {
    const options = {
        timeZone: timezone,
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        second: 'numeric',
        hour12: false
    };
    
    const formatted = new Date(date).toLocaleString('en-US', options);
    return new Date(formatted);
}

// Virtual for local start time (computed on demand)
ShiftSchema.virtual('localStart').get(function() {
    return convertToLocal(this.start, this.timezone);
});

// Virtual for local end time (computed on demand)
ShiftSchema.virtual('localEnd').get(function() {
    return convertToLocal(this.end, this.timezone);
});

// Helper function to convert UTC to local time
function convertToLocal(date, timezone) {
    return new Date(date.toLocaleString('en-US', { timeZone: timezone }));
}

const Shift = mongoose.model('shift', ShiftSchema);
module.exports = Shift;