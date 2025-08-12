const mongoose = require('mongoose')

const ShiftSchema = new mongoose.Schema({
    name: {
        type: String
    },
    start: {
        type: Date
    },
    end: {
        type: Date
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user'
    }
}, { timestamps: true })

const Shift = mongoose.model('shift', ShiftSchema)
module.exports = Shift