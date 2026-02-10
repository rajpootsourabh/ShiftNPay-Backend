const mongoose = require("mongoose");

const clientSchema = new mongoose.Schema(
  {
    vendorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
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
    webPassword: String,
    enableWebLogin: Boolean,
    enable2FA: Boolean,
    enableAssistedGPS: Boolean,
    hospitalDischargePrior: Date,
    erVisitPrior: Date,
    email: { type: String, default: "" },
    caseManager: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
      ref: "CaseManager",
    },
    caseManager2: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
      ref: "CaseManager",
    },
    caseManager3: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
      ref: "CaseManager",
    },
    ambulatory: String,
    physician: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
      ref: "Physician",
    },
    referredBy: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
      ref: "ReferralSource",
    },
    referralNumber: String,
    dnr: Boolean,
    diagnosisCode: String,
    diagnosisDescription: String,
    clientType: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
      ref: "ClientTypes",
    },
    medRecordNumber: String,
    ssn: String,
    locationId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
      ref: "Location",
    },
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
    covidVaccinatedAlert: { type: Boolean, default: false },
    vaccineRefusedAlert: { type: Boolean, default: false },
    alertNote: String,
    generationsEvvAlert: Boolean,
    alertText: String,

    // Documentation preferences
    enableClientSpecific1500: Boolean,
    enableUB04: Boolean,
    cms1500Version: String,
    requireCaregiverSignature: Boolean,
    requireClientSignature: Boolean,

    // Updated attachments field - no more base64
    attachments: [
      {
        description: String,
        fileName: String, // Stored filename
        originalName: String, // Original filename
        url: String, // URL to access the file
        fileSize: Number,
        fileType: String,
        uploadedAt: { type: Date, default: Date.now },
        clientAccess: {
          type: String,
          enum: ["restricted", "view", "download"],
          default: "restricted",
        },
      },
    ],

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
    customFields: [
      {
        field: String,
        description: String,
        value: String,
      },
    ],

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
    clientNeeds: [{
      needId: Number,
      required: Boolean
    }],
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
    reminders: [mongoose.Schema.Types.Mixed],

    // Service orders
    showInactiveServiceOrders: Boolean,
    requireServiceOrder: Boolean,
    serviceOrders: [
      {
        serviceType: String,
        costPerHour: Number,
        dailyHours: Number,
        unitsPerHour: Number,
        payor: String,
        patientNumber: String,
        status: String,
        diagnosisCode1: String,
        diagnosisCode2: String,
        isDefault: Boolean,
        includeModifiers: Boolean,
        startDate: Date,
        startTime: String,
        endDate: Date,
        endTime: String,
        isFlexibleTime: Boolean,
        frequencyType: String,
        recurEvery: Number,
        daysOfWeek: [String],
        isFlexibleDays: Boolean,
        frequency: String,
        authNumber: String,
        totalUnits: Number,
        totalAmount: Number,
        totalVisits: Number,
        description: String,
        physicianNotes: String,
        requireSignature: Boolean,
        autoCreateSchedules: Boolean,
        caregiver: String,
        payrollItem1: String,
        payrollItem2: String,
        id: Number,
        enteredDate: Date,
        enteredBy: String,
      },
    ],

    // Supervisory visits
    supervisoryVisits: [
      {
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
        enteredBy: String,
      },
    ],

    // Visit history
    visitHistory: [mongoose.Schema.Types.Mixed],

    // Wellness information
    wellnessResponses: mongoose.Schema.Types.Mixed,
    wellnessHistory: [mongoose.Schema.Types.Mixed],
    wellnessGroupFilter: String,
    wounds: [mongoose.Schema.Types.Mixed],

    // CMS-1500 Form Fields
    cms1500: {
      // Section 1: Insurance Type
      insuranceType: {
        type: String,
        enum: [
          "medicare",
          "medicaid",
          "tricare",
          "champva",
          "group",
          "feca",
          "other",
        ],
        default: "medicaid",
      },
      insuredId: String,

      // Section 2-4: Patient and Insured Information
      patientName: String,
      patientAddress: String,
      patientCity: String,
      patientState: String,
      patientZip: String,
      patientPhone: String,
      patientSex: { type: String, enum: ["male", "female"], default: "female" },

      insuredLastName: String,
      insuredFirstName: String,
      insuredMiddleInitial: String,
      insuredAddress: String,
      insuredCity: String,
      insuredState: String,
      insuredZip: String,
      insuredPhone: String,
      insuredPolicyNumber: String,
      insuredDob: Date,
      insuredSex: { type: String, enum: ["male", "female"] },
      insuredPlanName: String,

      // Section 5-7: Relationship and Address
      relationshipToInsured: {
        type: String,
        enum: ["self", "spouse", "child"],
        default: "self",
      },

      // Section 9-11: Other Insurance
      otherInsuredName: String,
      otherInsuredPolicy: String,
      otherClaimId: String,

      // Section 10: Condition Related To
      employmentRelated: { type: String, enum: ["Y", "N"], default: "N" },
      autoAccident: { type: String, enum: ["Y", "N"], default: "N" },
      otherAccident: { type: String, enum: ["Y", "N"], default: "N" },
      accidentState: String,

      // Section 12-13: Signatures
      patientSignatureOnFile: { type: Boolean, default: true },
      insuredSignatureOnFile: { type: Boolean, default: true },

      // Section 14-16: Dates
      currentIllnessDate: Date,
      currentIllnessQualifier: String,
      otherDate: Date,
      otherDateQualifier: String,
      unableToWorkFrom: Date,
      unableToWorkThrough: Date,

      // Section 17: Referring Provider
      referringProvider: String,
      referringProviderId: String,
      referringProviderNpi: String,

      // Section 18-19: Hospitalization and Additional Info
      hospitalizationFrom: Date,
      hospitalizationThrough: Date,
      additionalClaimInfo: String,

      // Section 20-21: Outside Lab and Diagnosis
      outsideLab: { type: String, enum: ["Y", "N"], default: "N" },
      outsideLabCharges: { type: Number, default: 0 },

      // ICD-10 Diagnosis Codes
      icd10Codes: {
        A: String,
        B: String,
        C: String,
        D: String,
        E: String,
        F: String,
        G: String,
        H: String,
        I: String,
        J: String,
        K: String,
        L: String,
      },
      icdIndicator: { type: String, default: "10" },

      // Section 22-27: Billing Information
      resubmissionCode: String,
      originalReferenceNumber: String,
      priorAuthorizationNumber: String,
      placeOfService: String,
      emg: Boolean,
      epsdt: Boolean,
      qualifier: String,
      providerNumberType: {
        type: String,
        enum: ["license", "other"],
        default: "other",
      },
      providerNumber: String,
      providerNpi: String,
      federalTaxId: String,
      taxIdType: { type: String, enum: ["SSN", "EIN"], default: "EIN" },
      patientAccountNumber: String,
      acceptAssignment: { type: Boolean, default: true },
      amountPaid: { type: Number, default: 0 },

      // Section 31-33: Provider Information
      physicianSignature: String,
      serviceFacilityName: String,
      serviceFacilityAddress: String,
      serviceFacilityNpi: String,
      serviceFacilityQualifier: String,
      serviceFacilityId: String,

      // Section 24: Service Lines (simplified for home care)
      serviceLines: [
        {
          fromDate: Date,
          toDate: Date,
          placeOfService: String,
          emg: Boolean,
          procedures: String,
          diagnosisPointer: String,
          charges: Number,
          daysOrUnits: Number,
          epsdt: Boolean,
          qualifier: String,
        },
      ],

      // Metadata
      formVersion: { type: String, default: "02/12" },
      createdDate: { type: Date, default: Date.now },
      lastModified: { type: Date, default: Date.now },
      submittedDate: Date,
      status: {
        type: String,
        enum: ["draft", "submitted", "processed", "rejected"],
        default: "draft",
      },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Client", clientSchema);
