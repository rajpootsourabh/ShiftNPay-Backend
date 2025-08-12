    const mongoose = require('mongoose');
    const Schema = mongoose.Schema;

    // Define the checklist step status schema
    const StepStatusSchema = new Schema({
        stepId: { type: Schema.Types.ObjectId, ref: 'ChecklistStep', required: true }, // Reference to the step in the checklist
        document: { type: String }, // URL or path to the uploaded document
        fileSize: {
            type: String,
          },
        isClosed: { type: Boolean, default: false }, // Status of the step
        rating: { type: Number, max: 5,default:0 }, // Rating for the step (1 to 5)
    }, { timestamps: true });

    // Define the onboarding employees schema
    const OnboardingEmployeeSchema = new Schema({
        employeeId: { type: Schema.Types.ObjectId, ref: 'Employee', required: true }, // Reference to the employee
        vendorId: { type: Schema.Types.ObjectId, ref: 'User', required: true }, // Reference to the employee
        checklistId: { type: Schema.Types.ObjectId, ref: 'Checklist', required: true }, // Reference to the checklist
        stepsStatus: [StepStatusSchema], // Array of steps status
    }, { timestamps: true }); // `timestamps` adds `createdAt` and `updatedAt` fields

    module.exports = mongoose.model('OnboardingEmployee', OnboardingEmployeeSchema);