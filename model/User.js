const mongoose = require('mongoose')

const UserSchema = new mongoose.Schema({
    name: {
        type: String,
        requird: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    address: {
        type: String,
        required: true
    },
    status: {
        type: Boolean,
        default: false
    },
    image: {
        type: String,
    },
    role: {
        type: String,
        default: 'vender'
    },
    is_online: {
        type: Boolean,
        default: false
    },
    roomId:{
        type:String,
        default:null
    }

}, { timestamps: true })

const User = mongoose.model('user', UserSchema)

module.exports = User