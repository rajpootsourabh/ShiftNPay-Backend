const mongoose = require('mongoose');

const SkillSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'employee'
    },
    name: {
        type: String,
    },
    certifications: {
        type: String,
    },
    expireDate: {
        type: Date
    }
}, { timestamps: true })

const Skill = mongoose.model('skill', SkillSchema)
module.exports = Skill