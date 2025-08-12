const bcrypt = require('bcrypt')
const { createToken } = require("../util/createToken")
const Employee = require("../model/Employee")
const { sendMail, sendMailAddedToVender } = require("../util/mailService")
const User = require('../model/User')
require('dotenv').config()
const path = require('path')
const fs = require('fs')
const Profile = require('../model/Profile')
const Job = require('../model/Job')
const mongoose = require('mongoose')
const Tracking = require('../model/Tracking')

const salt = process.env.SALT


exports.registerVendor = async (req, res) => {
    // console.log("req.body: ", req.body);
    const name = req.body.name
    const email = req.body.email
    const password = req.body.password
    const address = req.body.address
    const role = req.body.role

    try {
        const checkVendor = await User.findOne({ email: email })
        if (checkVendor) {
            return res.status(400).json({ msg: `Email ${email} already exists! Please use other`, success: false })
        }
        const hasPass = await bcrypt.hashSync(password, parseInt(salt))
        const result = await User.create({ name: name, email: email, address: address, password: hasPass, role: role })
        if (result) {
            // sendMail(email, name, "Your account has been register successfully. Please wait for approval")
            sendMail(email, name, "Registration on shiftnpay.com")
            return res.status(200).json({ msg: `Your registration has been successfully. Please wait for approval`, success: true })
        }
        return res.status(400).json({ msg: 'Failed to create vendor!', success: false })
    } catch (error) {
        console.log("error on registerVendor: ", error);
        return res.status(500).json({ msg: error.message, err: error, success: false })
    }
}

exports.loginVendor = async (req, res) => {
    // console.log("req.body: ", req.body);
    const email = req.body.email
    const password = req.body.password
    
    
    try {
        const checkVendor = await User.findOne({ email: email });
        if (!checkVendor) {
            return res.status(404).json({ msg: `User not found! Please register first.`, success: false })
        }
        if (!checkVendor.status) {
            return res.status(404).json({ msg: `Please wait for approval.`, success: false })
        }

        const matchPass = await bcrypt.compare(password, checkVendor.password)
        if (!matchPass) {
            return res.status(400).json({ msg: 'Email or Password are incorrect!', success: false })
        }
        const token = createToken({ _id: checkVendor._id, email: checkVendor.email, name: checkVendor.name, address: checkVendor.address })
        if (!token) {
            return res.status(400).json({ msg: 'Failed to create token!', success: false })
        }
        return res.status(200).json({ msg: 'Ok', success: true, result: checkVendor, token })
    } catch (error) {
        console.log("error on loginVendor: ", error);
        return res.status(500).json({ msg: error.message, err: error, success: false })
    }
}


// uploading image of profile
exports.uploadProfileImage = async (req, res) => {
    const id = req.body.id
    const image = req.files?.image

    const date = new Date()


    try {
        const checkVendor = await User.findById(id)
        if (!checkVendor) {
            return res.status(403).json({ msg: 'Access Forbidden', success: false })
        }

        const fileName = "userProfile" + date.getTime() + image.name.replace(/\s+/g, '')
        const profileFilePath = path.join(__dirname, "..", "assets", "profile", fileName)
        image.mv(profileFilePath, (err) => {
            if (err) {
                return res.status(400).json({ success: false, msg: 'Failed to upload user profile image?' })
            }
        })
        if (checkVendor?.image) {
            const removeprofileFilePath = path.join(__dirname, "..", "assets", "profile", checkVendor.image)
            fs.unlink(removeprofileFilePath, (err) => {
                if (err) {
                    return res.status(400).json({ msg: 'Failed to delete profile image?', success: false })
                }
            })
        }
        checkVendor.image = fileName

        const result = await User.findByIdAndUpdate({ _id: id }, { image: fileName })
        if (result) {
            return res.status(200).json({ msg: `${checkVendor?.name} profile has been updated successfully.`, success: true, result })
        }

        return res.status(400).json({ msg: `${checkVendor?.name} failed to upload profile image!`, success: false })

    } catch (error) {
        console.log("error on uploadProfileImage: ", error);
        return res.status(500).json({ msg: error.message, err: error, success: false })
    }
}

exports.updateProfileUpdate = async (req, res) => {
    const name = req.body.name
    const email = req.body.email
    const address = req.body.address
    const id = req.body._id

    try {
        // console.log("name: ", name);
        // console.log("email: ", email);
        // console.log("address: ", address);
        // console.log("id: ", id);
        const checkUser = await User.findById(id)
        if (!checkUser) {
            return res.status(403).json({ msg: 'Access Forbidden!', success: false })
        }

        const result = await User.findByIdAndUpdate({ _id: id }, { name: name, email: email, address: address })
        if (result) {
            return res.status(200).json({ msg: `${name} has been updated successfully.`, success: true, result })
        }
        return res.status(400).json({ msg: `Failed to update ${checkVendor?.name} your profile!`, success: false })
        // return res.status(400).json({ msg: 'Ok', success: false })
    } catch (error) {
        console.log("error on updateProfileUpdate: ", error);
        return res.status(500).json({ msg: error.message, err: error, success: false })
    }
}

exports.createEmployeee = async (req, res) => {
    const id = req.body.id //this is for validation that venndor is or not
    const email = req.body.email
    const isSent = req.body?.isSent
    // console.log("isSent: ", isSent);
    try {
        const checkVendor = await User.findById(id)
        if (!checkVendor) {
            return res.status(404).json({ msg: 'Vendor not found!', success: false })
        }

        const checkProfile = await Profile.findOne({ userId: id })

        const checkAlreadyEmp = await Employee.findOne({ email: email, userId: id });
        if (checkAlreadyEmp) {
            return res.status(400).json({ msg: `Employee ${email} already exists!`, success: false })
        }

        const username = email.split('@')[0];
        let password = username + 123
        const hasPass = await bcrypt.hashSync(password, parseInt(salt))
        const result = await Employee.create({ userId: id, email: email, password: hasPass })
        if (!result) {
            return res.status(400).json({ msg: 'Failed to create employee!', success: false })
        }
        if (isSent) {
            sendMailAddedToVender(email, null, `You have invited by ${checkVendor.name} from your job & task`, checkProfile ? checkProfile?.restaurantsName : checkVendor?.email, email, password)
        }
        return res.status(200).json({ msg: `Employee created successfully.`, success: true, result })
    } catch (error) {
        console.log("error on createEmployeee: ", error);
        return res.status(500).json({ msg: error.message, err: error, success: false })
    }
}

exports.getSingleVendorById = async (req, res) => {
    const id = req.params.id
    try {
        // console.log("id: ", id);
        const result = await User.findOne({ _id: id, role: 'vender' }).select("-__v -password")
        // console.log("result: ", result);
        if (result) {
            return res.status(200).json({ msg: 'Ok', success: true, result })
        }
        return res.status(400).json({ msg: 'No user found!', success: false })
    } catch (error) {
        console.log("error on getSingleVendorById: ", error);
        return res.status(500).json({ msg: error.message, err: error, success: false })
    }
}

// this is for restoraunt data function

exports.getSingleRestorauntProfile = async (req, res) => {
    const id = req.params.id
    try {
        const checkUser = await User.findById(id)
        if (!checkUser) {
            return res.status(404).json({ msg: 'No user data found!', success: false })
        }
        const result = await Profile.findOne({ userId: id })
        if (result) {
            return res.status(200).json({ msg: 'Ok', success: true, result })
        }
        return res.status(404).json({ msg: 'No restoraunt profile data found!', success: false })
    } catch (error) {
        console.log("error on getSingleRestorauntProfile: ", error);
        return res.status(500).json({ msg: error.message, err: error, success: false })
    }
}

exports.updateRestorauntProfile = async (req, res) => {
    const id = req.body.id
    const image = req.files?.image
    const address = req.body.address
    const provins = req.body.provins
    const pinCode = req.body.pinCode
    const restaurantsName = req.body.restaurantsName

    const date = new Date()

    try {
        const checkUser = await User.findById(id)
        if (!checkUser) {
            return res.status(400).json({ msg: 'No use found!', success: false })
        }
        const checkProfile = await Profile.findOne({ userId: id })
        if (checkProfile) {
            if (image) {
                const fileName = "restroProfile" + date.getTime() + image.name.replace(/\s+/g, '')
                const profileFilePath = path.join(__dirname, "..", "assets", "restaurantImage", fileName)
                image.mv(profileFilePath, (err) => {
                    if (err) {
                        return res.status(400).json({ success: false, msg: 'Failed to upload restoraunt profile image?' })
                    }
                })
                if (checkProfile?.image) {
                    const removeprofileFilePath = path.join(__dirname, "..", "assets", "restaurantImage", checkProfile.image)
                    fs.unlink(removeprofileFilePath, (err) => {
                        if (err) {
                            return res.status(400).json({ msg: 'Failed to delete restoraunt image?', success: false })
                        }
                    })
                }
                checkProfile.image = fileName
                await checkProfile.save()
            }
            // console.log("userId: ", id);
            // const result = await Profile.findByIdAndUpdate({ userId: id }, { name: checkUser?.name, provins: provins, address: address, pinCode: pinCode, restaurantsName: restaurantsName })
            const result = await Profile.findOneAndUpdate(
                { userId: id },
                {
                    name: checkUser?.name,
                    provins: provins,
                    address: address,
                    pinCode: pinCode,
                    restaurantsName: restaurantsName
                },
                { new: true, runValidators: true }
            );
            // console.log("result: ", result);
            if (result) {
                return res.status(200).json({ msg: 'Restoraunt profile data updated successfully.', success: true, result })
            }
            return res.status(400).json({ msg: 'Failed to update restoraunt profile data!', success: false })
        } else {
            let fileName;
            if (image) {
                fileName = "restroProfile" + date.getTime() + image.name.replace(/\s+/g, '')
                const profileFilePath = path.join(__dirname, "..", "assets", "restaurantImage", fileName)
                image.mv(profileFilePath, (err) => {
                    if (err) {
                        return res.status(400).json({ success: false, msg: 'Failed to upload restoraunt profile image?' })
                    }
                })
            }
            const result = await Profile.create({ userId: id, name: checkUser?.name, image: fileName ? fileName : '', provins: provins, address: address, pinCode: pinCode, restaurantsName: restaurantsName })
            if (result) {
                return res.status(200).json({ msg: 'Restoraunt profile created successfully.', success: true, result })
            }
            return res.status(400).json({ msg: 'Failed to create restoraunt profile data!', success: false })
        }

    } catch (error) {
        console.log("error on updateRestorauntProfile: ", error);
        return res.status(500).json({ msg: error.message, err: error, success: false })
    }
}

exports.changePasswordByUserIdAndEmail = async (req, res) => {
    const id = req.body.id
    const email = req.body.email
    const password = req.body.password
    try {
        const checkUser = await User.findOne({ _id: id, email: email })
        if (!checkUser) {
            return res.status(403).json({ msg: 'Forbidden Access!', success: false })
        }
        const hasPass = await bcrypt.hashSync(password, parseInt(salt))
        const result = await User.findByIdAndUpdate({ _id: id, email: email }, { password: hasPass })
        if (result) {
            return res.status(200).json({ msg: `${checkUser?.name} your password has been successfully changed.`, success: true, result })
        }
        return res.status(400).json({ msg: `${checkUser?.name} failed to change your password!`, success: false })
    } catch (error) {
        console.log("error on updateRestorauntProfile: ", error);
        return res.status(500).json({ msg: error.message, err: error, success: false })
    }
}


// change password
exports.changePasswordById = async (req, res) => {
    // console.log("req.body: ", req.body);
    const id = req.body.id
    const password = req.body.password

    try {
        const checkUser = await User.find({ _id: id })
        if (!checkUser) {
            return res.status(403).json({ msg: 'Forbidden Access!', success: false })
        }
        const hasPass = await bcrypt.hashSync(password, parseInt(salt))
        const result = await User.findByIdAndUpdate({ _id: id }, { password: hasPass })
        if (result) {
            return res.status(200).json({ msg: 'Password change successfully.', success: true, result })
        }
        return res.status(400).json({ msg: 'Failed to change password!', success: false })
    } catch (error) {
        console.log("error on changePasswordById: ", error);
        return res.status(500).json({ msg: error.message, err: error, success: false })
    }
}

exports.getCount = async (req, res) => {
    const id = req.params.id
    try {
        const checkUser = await User.findById(id)
        if (!checkUser) {
            return res.status(403).json({ msg: 'Forbidden Access!', success: false })
        }
        const countEmp = await Employee.countDocuments({ userId: id })
        const countJob = await Job.countDocuments({ userId: id })
        const activeInActiveEmp = await Employee.aggregate([
            {
                $match: { userId: new mongoose.Types.ObjectId(id) }
            },
            {
                $facet: {
                    active: [
                        { $match: { jobId: { $exists: true, $not: { $size: 0 } } } },
                        { $count: "count" }
                    ],
                    inactive: [
                        { $match: { $or: [{ jobId: { $exists: false } }, { jobId: { $size: 0 } }] } },
                        { $count: "count" }
                    ]
                }
            },
            {
                $project: {
                    active: { $arrayElemAt: ["$active.count", 0] },
                    inactive: { $arrayElemAt: ["$inactive.count", 0] }
                }
            }
        ]);
        return res.status(200).json({ msg: 'Employee and Job count', success: true, result: { countEmp, countJob, activeInActiveEmp } })
    } catch (error) {
        console.log("error on getCount: ", error);
        return res.status(500).json({ msg: error.message, err: error, success: false })
    }
}

