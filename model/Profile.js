const mongoose = require('mongoose')

const ProfileSchema = new mongoose.Schema({
    name: {
        type: String
    },
    image: {
        type: String
    },
    provins: {
        type: String
    },
    address: {
        type: String,
    },
    pinCode: {
        type: Number
    },
    restaurantsName: {
        type: String
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user'
    },
    about: {
        typs: String,
    },
    exportIn: [{
        type: String
    }],
    expericen: {
        type: Number
    },
    rating: {
        type: Number
    },
}, { timestamps: true })


const Profile = mongoose.model('profile', ProfileSchema)
module.exports = Profile