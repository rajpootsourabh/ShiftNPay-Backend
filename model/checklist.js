const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Define the step schema
const StepSchema = new Schema({
    title: {
        type: String,
        required: true,
    },
}, { timestamps: true });

// Define the checklist schema
const ChecklistSchema = new Schema({
    title: {
        type: String,
        required: true,
    },
    vendorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    steps: [StepSchema], // Array of steps
}, { timestamps: true }); // `timestamps` adds `createdAt` and `updatedAt` fields

module.exports = mongoose.model('Checklist', ChecklistSchema);
