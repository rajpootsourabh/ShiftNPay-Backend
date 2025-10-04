const mongoose = require('mongoose');

const employeeChecklistSchema = new mongoose.Schema({
  employeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true }, // Reference to Employee
  vendorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // Reference to Employee
  assignedChecklists: [{
    checklistId: { type: mongoose.Schema.Types.ObjectId, ref: 'Checklist', required: true }, // Reference to Checklist
    document: { type: String }, // Path/URL of the uploaded document related to the checklist
    rating: { type: Number, min: 0, max: 5 }, // Rating (0-5 stars)
    status: { type: String, enum: ['Open', 'Completed', 'In Progress'], default: 'Open' }, // Checklist status
    assignedOn: { type: Date, default: Date.now }, // Date the checklist was assigned
  }],
  createdOn: { type: Date, default: Date.now }
});

// Model
const EmployeeChecklist = mongoose.model('EmployeeChecklist', employeeChecklistSchema);

module.exports = EmployeeChecklist;
