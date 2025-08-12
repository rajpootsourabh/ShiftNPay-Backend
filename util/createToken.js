const jwt = require('jsonwebtoken')
require('dotenv').config()
const secret = process.env.SECRET

exports.createToken = (result) => {
    return jwt.sign({ result }, secret, { expiresIn: '7d' })
}


exports.generateOTP = () => {
    return Math.floor(1000 + Math.random() * 9000); // Generates a 4-digit OTP
}