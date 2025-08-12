    const mongoose = require('mongoose')

    const ProfileSchema = new mongoose.Schema({
        name: {
            type: String,
            default:''
        },
        image: {
            type: String,
            default:''
        },
        provins: {
            type: String,
            default:''
        },
        address: {
            type: String,
        },
        pinCode: {
            type: Number
        },
        restaurantsName: {
            type: String,
            default:''
        },
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'user'
        },
        about: {
            typs: String,
        },
        exportIn: [{
            type: String,
            default:''
        }],
        expericen: {
            type: Number
        },
        rating: {
            type: Number
        },

        industry: {
            type: String,
            default:''
        },
        year: {
            type: String,
            default:''
        },
        location: {
            type: String,
            default:''
        },
        empNumber: {
            type: String,
            default:''
        },
        mobile: {
            type: String,
            default:''
        },
        email: {
            type: String,
            default:''
        },
        contact: {
            type: String,
            default:''
        },
        webUrl: {
            type: String,
            default:''
        },
        timeHours: {
            type: String,
            default:''
        },
        description: {
            type: String,
            default:''
        },
        itemId: { // Updated field to reference Item
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Item', // Reference to the Item model
        }

        
    }, { timestamps: true })


    const Profile = mongoose.model('profile', ProfileSchema)
    module.exports = Profile