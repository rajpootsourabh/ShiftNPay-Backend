const mongoose = require('mongoose')
const JobSchema = new mongoose.Schema({
    name: {
        type: String
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user'
    },
    subJob: [{
        name: {
            type: String
        }
    }]
}, { timestamps: true })


const Job = mongoose.model('job', JobSchema)
module.exports = Job