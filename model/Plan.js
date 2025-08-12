const mongoose = require('mongoose')

const PlanSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    type: {
        type: String,
        required: String
    },
    price: {
        type: Number,
        required: true
    },
    duration: {
        type: Number,
        required: true
    },
    durationType: {
        type: String,
        required: true
    }
}, { timestamps: true })

const Plan = mongoose.model('plan', PlanSchema)
module.exports = Plan