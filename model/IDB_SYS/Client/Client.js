const mongoose = require('mongoose');

const clientSchema = new mongoose.Schema({
   vendorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  firstName: String,
  middleInitial: String,
  lastName: String,
  phone1: String,
  phone2: String,
  dob: Date,
  status: String,
  gender: String,
  inquiryDate: Date,
  assessmentDate: Date,
  reasons: String,
  serviceStart: Date,
  serviceEnd: Date,
  email: { type: String, unique: true },
  webPassword: String,
  enableWebLogin: Boolean,
  enable2FA: Boolean,
  enableAssistedGPS: Boolean,
  hospitalDischargePrior: Date,
  erVisitPrior: Date,
  caseManager: String,
  caseManager2: String,
  caseManager3: String,
  ambulatory: String,
  physician: String,
  referralNumber: String,
  dnr: Boolean,
  diagnosisCode: String,
  diagnosisDescription: String,
  clientType: String,
  medRecordNumber: String,
  ssn: Number,
  locationId: String,
  evvId: String,
  accountingId: String,
  priority: String,
  weight: String,
  
  // Address information
  homeAddress1: String,
  homeAddress2: String,
  homeCity: String,
  homeState: String,
  homeZip: String,
  homeCountry: String,
  homeStartAddressType: String,
  homeEndAddressType: String,
  
  // Other EVV information
  otherEvvDescription: String,
  otherEvvAddress1: String,
  otherEvvAddress2: String,
  otherEvvCity: String,
  otherEvvState: String,
  otherEvvZip: String,
  otherEvvStartAddressType: String,
  otherEvvEndAddressType: String,
  
  // Billing information
  billingPayor: String,
  billingAddress1: String,
  billingAddress2: String,
  billingCity: String,
  billingState: String,
  billingZip: String,
  payor2: String,
  payor3: String,
  payor4: String,
  
  // Physician information
  physician2: String,
  physician3: String,
  physician4: String,
  
  // Vaccine information
  covidVaccinated: Boolean,
  vaccineRefused: Boolean,
  refusedReason: String,
  vaccineCard: { type: mongoose.Schema.Types.Mixed, default: null },
  vaccineType: String,
  vaccineDate: String,
  fluVaccineDate: String,
  fluVaccineStatus: String,
  fluRefusedReason: String,
  
  // Alert information
  alertNote: String,
  generationsEvvAlert: Boolean,
  alertText: String,
  
  // Documentation preferences
  enableClientSpecific1500: Boolean,
  cms1500Version: String,
  requireCaregiverSignature: Boolean,
  requireClientSignature: Boolean,
  
  // Attachments
  attachments: [mongoose.Schema.Types.Mixed],
  
  // Notes access
  careNotesAccess: String,
  woundNotesAccess: String,
  clientLoginNotes: String,
  chartingNotes: String,
  
  // Initial contact information
  initialContactName: String,
  initialContactEmail: String,
  initialContactPhone: String,
  initialContactAltPhone: String,
  initialContactWebPassword: String,
  initialContactEnableLogin: Boolean,
  initialContactEnable2FA: Boolean,
  initialContactRelation: String,
  includeOnCarePlan: Boolean,
  
  // Additional contacts
  additionalContacts: [mongoose.Schema.Types.Mixed],
  
  // Custom fields
  customFields: [{
    field: String,
    description: String,
    value: String
  }],
  
  // Location instructions
  directions: String,
  parkingInfo: String,
  accessInstructions: String,
  specialInstructions: String,
  
  // Preferences and history
  exclusions: [mongoose.Schema.Types.Mixed],
  preferences: [mongoose.Schema.Types.Mixed],
  historyItems: [mongoose.Schema.Types.Mixed],
  interruptions: [mongoose.Schema.Types.Mixed],
  
  // Billing information
  openBalance: Number,
  overdueBalance: Number,
  lastPaymentDate: Date,
  invoiceType: String,
  invoiceStatus: String,
  dateFrom: String,
  dateTo: String,
  invoices: [mongoose.Schema.Types.Mixed],
  payments: [mongoose.Schema.Types.Mixed],
  
  // Needs assessment
  needsMasterList: [mongoose.Schema.Types.Mixed],
  assignedNeeds: [mongoose.Schema.Types.Mixed],
  notes: [mongoose.Schema.Types.Mixed],
  
  // Medication administration
  enableMarDocumentation: Boolean,
  marSchedule: String,
  marTimes: String,
  requireMarSignature: Boolean,
  requirePrnReason: Boolean,
  
  // Care plans
  carePlans: [mongoose.Schema.Types.Mixed],
  
  // Reminders
  reminders: [{
    type: String,
    dueDate: Date,
    dueTime: String,
    priority: String,
    description: String,
    notes: String,
    id: Number,
    createdDate: Date,
    createdBy: String,
    completed: Boolean
  }],
  
  // Service orders
  showInactiveServiceOrders: Boolean,
  requireServiceOrder: Boolean,
  serviceOrders: [{
    serviceType: String,
    status: String,
    startDate: Date,
    endDate: Date,
    frequency: String,
    authNumber: String,
    description: String,
    physicianNotes: String,
    requireSignature: Boolean,
    id: Number,
    enteredDate: Date,
    enteredBy: String
  }],
  
  // Supervisory visits
  supervisoryVisits: [{
    visitType: String,
    status: String,
    visitDate: Date,
    supervisorName: String,
    duration: Number,
    location: String,
    purpose: String,
    notes: String,
    requireFollowUp: Boolean,
    followUpActions: String,
    completedDate: String,
    findings: String,
    id: Number,
    enteredDate: Date,
    enteredBy: String
  }],
  
  // Visit history
  visitHistory: [mongoose.Schema.Types.Mixed],
  
  // Wellness information
  wellnessResponses: mongoose.Schema.Types.Mixed,
  wellnessHistory: [mongoose.Schema.Types.Mixed],
  wellnessGroupFilter: String
}, { timestamps: true });


module.exports = mongoose.model('Client', clientSchema);