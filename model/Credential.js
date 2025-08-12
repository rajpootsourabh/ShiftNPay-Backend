const mongoose = require('mongoose')

const CredentialSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    description: {
        type: String,
    },
    credential: {
        type: String,
        required: true
    }
}, { timestamps: true })

const Credential = mongoose.model('credential', CredentialSchema)
module.exports = Credential