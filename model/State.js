const mongoose = require('mongoose');

const StateSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user'
    },
    name: {
        type: String,
        required: true
    },
    weekHours: {
        type: Number,
        required: true
    },
    dayHours: {
        type: Number,
    }
}, { timestamps: true })

const State = mongoose.model('state', StateSchema)
module.exports = State