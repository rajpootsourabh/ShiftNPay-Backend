const express = require('express')
const { register, loginSuperAdmin, getAllVendor, approveVendor, getCount } = require('../controller/superAdmin')
const { verifyToken } = require('../middleware/Auth')
const superRouter = express.Router()


superRouter.get('/get-all-vendor', getAllVendor)


superRouter.post('/super-admin-register', register)

superRouter.post('/login-super-admin', loginSuperAdmin)


superRouter.put('/vendor-approval/:id', verifyToken, approveVendor)


// this is for getting count of each table
superRouter.get('/get-count/:id', verifyToken, getCount)

module.exports = superRouter