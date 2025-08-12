const mongoose = require('mongoose')

const AdminSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    firstName: {
        type: String,
    },
    middleName: {
        type: String,
    },
    lastName: {
        type: String,
    },
    image: {
        type: String,
    }

}, { timestamps: true })

const Admin = mongoose.model("admin", AdminSchema)
module.exports = Admin