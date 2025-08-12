const mongoose = require('mongoose')

const FeedBackSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user'
    },
    empId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'employee'
    },
    feed: {
        type: String,
    },
    rate: {
        type: Number
    }
}, { timestamps: true })

const FeedBack = mongoose.model('feedback', FeedBackSchema)
module.exports = FeedBack