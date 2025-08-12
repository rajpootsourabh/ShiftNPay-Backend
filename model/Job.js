const mongoose = require('mongoose')
const JobSchema = new mongoose.Schema({
    name: {
        type: String
    },
    overtimeAllowed: {
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
    }],
    status: {
        type:String
    },
    statusByEmployee: {
        type:String
    },
    shift: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'shift'
        },
}, { timestamps: true })


const Job = mongoose.model('job', JobSchema)
module.exports = Job