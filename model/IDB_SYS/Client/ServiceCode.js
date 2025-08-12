const mongoose = require('mongoose');

const serviceCodeSchema = new mongoose.Schema({
  description: {
    type: String,
    required: true,
    maxlength: 23
  },
  shortDesc: {
    type: String,
  },
  procedureCode: {
    type: String,
  },
  type: {
    type: String,
    enum: ['Service', 'Mileage'],
    required: true
  },
  cost: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['Active', 'Inactive'],
    default: 'Active'
  },
  billedPerVisit: {
    type: String,
    enum: ['Hourly', 'Flat Rate'],
    default: 'Hourly'
  },
  // Payroll Export
  adpIncludeInAdjustedDed: {
    type: Boolean,
    default: false
  },
  overridePaychexFlex: {
    type: Boolean,
    default: false
  },
  // Payplus Export
  payplusExport: {
    regularCode: {
      type: String,
      maxlength: 3
    },
    overtimeCode: {
      type: String,
      maxlength: 3
    },
    holidayCode: {
      type: String,
      maxlength: 3
    },
    type: {
      type: String,
      enum: ['Service', 'Mileage']
    }
  },
  // CMS 1500 fields
  mod1: { type: String },
  mod2: { type: String },
  mod3: { type: String },
  mod4: { type: String },
  tos: { type: String },
  supplementalInfo: { type: String },
  // UB04
  revCode: { type: String },
  // Other EVV system
  otherEVVSystem: {
    type: Boolean,
    default: false
  },
  taxonomyCode: {
    type: String
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('ServiceCode', serviceCodeSchema);
