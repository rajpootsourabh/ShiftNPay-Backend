const mongoose = require('mongoose');

const scheduleSchema = new mongoose.Schema({
 vendorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  // Client Details
  client: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Client',
    required: true
  },
  serviceOrder: {
    type: String,
    required: true
  },
  service: {
     type: mongoose.Schema.Types.ObjectId,
    ref: 'job',
    required: true
  },
   payor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Payor' // Make sure this matches your Payor model name exactly
  },

  // Caregiver Details
  caregiver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'employee',
    required: true
  },
  payrollItem: {
    type: String,
    default: ''
  },
  rate: {
    type: Number,
    default: 0
  },

  // Date/Time (Required for React Big Calendar)
  start: {
    type: Date,
    required: true
  },
  end: {
    type: Date,
    required: true
  },
  allDay: {
    type: Boolean,
    default: false
  },
  
  // Frequency
  frequency: {
    type: String,
    enum: ['none', 'daily', 'weekly', 'monthly'],
    default: 'none'
  },
  recurringWeeks: {
    type: Number,
    default: 1
  },
  monthlyDay: {
    type: Number,
    default: 1
  },
  weeklyStartDay: {
    type: String,
    default: 'Sunday'
  },
  days: {
    sunday: { type: Boolean, default: false },
    monday: { type: Boolean, default: false },
    tuesday: { type: Boolean, default: false },
    wednesday: { type: Boolean, default: false },
    thursday: { type: Boolean, default: false },
    friday: { type: Boolean, default: false },
    saturday: { type: Boolean, default: false }
  },
  recurrenceEndDate: {
    type: Date
  },

  // Status
  confirmation: {
    type: String,
    enum: ['confirmed', 'unconfirmed'],
    default: 'unconfirmed'
  },
  telephonyAlerts: {
    type: String,
    enum: ['enabled', 'disabled'],
    default: 'disabled'
  },
  mileage: {
    type: String,
    enum: ['enabled', 'disabled'],
    default: 'disabled'
  },
  clientQA: {
    type: String,
    enum: ['enabled', 'disabled'],
    default: 'disabled'
  },

  // Job Status
  jobStatus: {
    type: String,
    enum: ['scheduled', 'in-progress', 'completed', 'cancelled'],
    default: 'scheduled'
  },
  actualStartTime: {
    type: Date
  },
  actualEndTime: {
    type: Date
  },
  duration: {
    type: Number // in minutes
  },

  // Metadata
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Virtual for React Big Calendar compatibility
scheduleSchema.virtual('id').get(function() {
  return this._id.toHexString();
});


// Add a compound index to prevent duplicates
scheduleSchema.index(
  { 
    client: 1, 
    service: 1, 
    caregiver: 1, 
    start: 1, 
    end: 1 
  }, 
  { 
    unique: true,
    partialFilterExpression: {
      // Only apply uniqueness to non-cancelled schedules
      jobStatus: { $ne: 'cancelled' }
    }
  }
);


scheduleSchema.set('toJSON', {
  virtuals: true,
  transform: function(doc, ret) {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
  }
});

module.exports = mongoose.model('Schedule', scheduleSchema);
