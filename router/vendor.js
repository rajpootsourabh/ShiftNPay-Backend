const express = require('express')
const { registerVendor, loginVendor, createEmployeee, uploadProfileImage, getSingleVendorById, updateProfileUpdate, updateRestorauntProfile, getSingleRestorauntProfile, changePasswordByUserIdAndEmail, changePasswordById, getCount, getAllEmpTrackingData } = require('../controller/vendor')
const { verifyToken } = require('../middleware/Auth')
const { isValidationParams } = require('../middleware/jobValidation')
const vendorRouter = express.Router()

vendorRouter.post('/register', registerVendor)

vendorRouter.post('/login', loginVendor)

// this is getting single vender data
vendorRouter.get('/get-by-id/:id', [verifyToken, isValidationParams], getSingleVendorById)

// this is for profile update of user only for image
vendorRouter.post('/update-profile-image', verifyToken, uploadProfileImage)

// this is for profile update of user not image only data
vendorRouter.post('/update-profile', verifyToken, updateProfileUpdate)

// creating employee using only email
vendorRouter.post('/create-emp', createEmployeee)

// this is for resetting password
vendorRouter.post('/change-password-email-id', verifyToken, changePasswordByUserIdAndEmail)

// this is for restoraunt data apis
vendorRouter.get('/get-restoraunt-profile/:id', verifyToken, getSingleRestorauntProfile)

vendorRouter.post('/restoraunt-update', verifyToken, updateRestorauntProfile)

vendorRouter.post('/change-password', verifyToken, changePasswordById)


// this is for vender data count like emp, jobs
vendorRouter.get('/get-count/:id', verifyToken, getCount)


module.exports = vendorRouter