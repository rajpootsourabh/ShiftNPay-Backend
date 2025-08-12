const jwt = require('jsonwebtoken')
require('dotenv').config()
const secret = process.env.SECRET

exports.verifyToken = async (req, res, next) => {
    let token = req.headers['authorization']
    try {
        if (!token) {
            return res.status(401).json({ msg: 'Access Denied!', success: false })
        }
        let splitToken = token.split(" ")[1]
        if (!splitToken) {
            return res.status(403).json({ msg: 'Access Forbidden!', success: false })
        }
        const decodedToken = jwt.verify(splitToken, secret)
        if (!decodedToken) {
            return res.status(403).json({ msg: 'Access Forbidden!', success: false })
        }
        // //console.log(decodedToken.result)
        req.payload = decodedToken.result
        req.payload.reqUserId = decodedToken.result._id;
        //console.log(' req.payload.reqUserId : ' ,  req.payload.reqUserId)
        next()
    } catch (error) {
        //console.log("error on verifyToken: ", error);
        return res.status(500).json({ msg: error.message, err: error, success: false })
    }
}