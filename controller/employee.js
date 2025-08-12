const Employee = require("../model/Employee");
const User = require("../model/User");
require('dotenv').config()
const path = require('path')
const fs = require('fs')
const bcrypt = require('bcrypt');
const { createToken } = require("../util/createToken");
const Profile = require("../model/Profile");
const Services = require('./../services');
const salt = process.env.SALT

exports.getAllEmploye = async (req, res) => {
    try {
        const result = await Employee.find()
        if (!result) {
            return res.status(404).json({ msg: 'No employee found!', success: false })
        }
        return res.status(200).json({ msg: 'Ok', success: true, result })
    } catch (error) {
        console.log("error on getAllEmploye: ", error);
        return res.status(500).json({ msg: error.message, err: error, success: false })
    }
}

// this api is for emp
exports.getEmpById = async (req, res) => {
    const id = req.params.id
    // console.log("id: ", id);
    try {
        const result = await Employee.findById(id).select('-password -__v -delete').populate("jobId").populate("shift").populate("stateId")
        if (result) {
            return res.status(200).json({ msg: 'Ok', success: true, result })
        }
        return res.status(404).json({ msg: 'No empoyee found!', success: false })
    } catch (error) {
        console.log("error on getEmpById: ", error);
        return res.status(500).json({ msg: error.message, err: error, success: false })
    }
}

exports.getEmpByVendroId = async (req, res) => {
    const id = req.params.id
    try {
        if (!id) {
            return res.status(403).json({ msg: 'Access Denied!', success: false })
        }
        // console.log("id: ", id);
        const checkVendor = await User.findOne({ _id: id })
        // console.log("checkVendor: ", checkVendor);
        if (!checkVendor) {
            return res.status(403).json({ msg: 'Access Forbidden', success: false })
        }
        const result = await Employee.find({ userId: id, delete: false }).select("-password").populate("shift")
        // console.log("result: ", result);
        if (!result) {
            return res.status(404).json({ msg: 'No employee data found!', success: false })
        }
        return res.status(200).json({ msg: 'Ok', success: true, result })
    } catch (error) {
        console.log("error on getEmpByVendroId: ", error);
        return res.status(500).json({ msg: error.message, err: error, success: false })
    }
}


// deleting emp by vender id and emp id
exports.deleteEmp = async (req, res) => {
    const id = req.params.id
    // console.log("req.body: ", req.body);
    // console.log("req.params: ", req.params);
    try {
        const checkEmp = await Employee.findById(id)
        if (!checkEmp) {
            return res.status(404).json({ msg: `No employee found!`, success: false })
        }
        const result = await Employee.findByIdAndDelete(id)
        if (result) {
            return res.status(200).json({ msg: `Employee ${checkEmp?.name ? checkEmp?.name : checkEmp?.email} has been deleted successfully.`, success: true, result })
        }
        return res.status(400).json({ msg: 'Failed to delete employee', success: false })
    } catch (error) {
        console.log("error on deleteEmp: ", error);
        return res.status(500).json({ msg: error.message, err: error, success: false })
    }
}


exports.empLogin = async (req, res) => {
    // console.log("req.body: ", req.body);
    const email = req.body.email
    const device_token = req.body.device_token
    const password = req.body.password

    try {
        const checkEmp = await Employee.findOne({ email: email })
        if (!checkEmp) {
            return res.status(404).json({ msg: 'No employee data found!', success: false })
        }
        const matchPass = bcrypt.compare(password, checkEmp.password)
        if (!matchPass) {
            return res.status(400).json({ msg: 'Email or Password are incorrect!', success: false })
        }
        const token = createToken({ _id: checkEmp._id, email: checkEmp.email, name: checkEmp.name, address: checkEmp.address });

        if (token) {
            if(device_token){
                await Employee.findOneAndUpdate({ email: email },
                    {
                        device_token
                    }
                );
            }
           

            let unReadNotifications = await Services.NotificationService.getUnreadNotificationCount(checkEmp._id);
            checkEmp.unReadNotifications = unReadNotifications;
            return res.status(200).json({ msg: 'Your are login successfully.', success: true, result: checkEmp , token })
        }
        return res.status(400).json({ msg: 'Failed to create token!', success: false })
    } catch (error) {
        console.log("error on empLogin: ", error);
        return res.status(500).json({ msg: error.message, err: error, success: false })
    }
}


// reset default password of employee
exports.resetDefaultPasswordEmpId = async (req, res) => {
    const id = req.body.id
    const oldPassword = req.body.oldPassword
    const newPassword = req.body.newPassword

    try {
        const checkEmp = await Employee.findById(id)
        if (!checkEmp) {
            return res.status(404).json({ msg: 'No employee data found!', success: false })
        }
        const matchPass = await bcrypt.compare(oldPassword, checkEmp.password)
        if (!matchPass) {
            return res.status(400).json({ msg: 'Wrong password!', success: false })
        }
        const hasPass = await bcrypt.hashSync(newPassword, parseInt(salt))
        const result = await Employee.findByIdAndUpdate({ _id: id }, { password: hasPass })
        if (result) {
            return res.status(200).json({ msg: `${checkEmp?.name} password has been reset successfully.`, success: true, result })
        }
        return res.status(400).json({ msg: 'Failed to reset your password! Please try again latter', success: false })
    } catch (error) {
        console.log("error on resetDefaultPasswordEmpId: ", error);
        return res.status(500).json({ msg: error.message, err: error, success: false })
    }
}

// this is udpate from vender side and put the working days with array
exports.updateEmpyFromVender = async (req, res) => {
    // console.log("req.body: ", req.body);
    // console.log("req.files: ", req.files);
    const empId = req.body?.empId
    const id = req.body?.id
    const name = req.body?.name
    const weekStart = req.body?.weekStart
    const days = req.body?.days
    const capacity = req.body?.capacity
    const rate = req.body?.rate
    const email = req.body?.email
    const address = req.body?.address
    const image = req.files?.image

    // console.log("image: ", image);

    const date = new Date()
    try {
        let daysName = days.split(',')
        const daysNameKey = daysName.map(day => ({ name: day }));
        // console.log("dayname: ", daysName);
        const checkUser = await User.findById(id)
        if (!checkUser) {
            return res.status(403).json({ msg: 'Access Forbidden', success: false })
        }
        const checkEmp = await Employee.findById(empId)
        if (!checkEmp) {
            return res.status(404).json({ msg: 'No employee data found!', success: false })
        }

        let userDate = {
            name: name,
            email: email,
            weekStart: weekStart,
            capacity: capacity,
            rate: rate,
            address: address,
            workingDays: daysNameKey
        }
        // let empProfileData;
        if (image) {
            const fileName = "empProfile" + date.getTime() + image.name.replace(/\s+/g, '')
            const profileFilePath = path.join(__dirname, "..", "assets", "empProfile", fileName)
            image.mv(profileFilePath, (err) => {
                if (err) {
                    return res.status(400).json({ success: false, msg: 'Failed to upload user profile image?' })
                }
            })

            userDate.profile = fileName

            if (checkEmp.profile) {
                const removeprofileFilePath = path.join(__dirname, "..", "assets", "empProfile", checkEmp.profile)
                fs.unlink(removeprofileFilePath, (err) => {
                    if (err) {
                        return res.status(400).json({ msg: 'Failed to delete profile image?', success: false })
                    }
                })
            }
        }
        const result = await Employee.findByIdAndUpdate(
            empId,  // Only the ID is needed here
            userDate,
            { new: true, useFindAndModify: false }  // Options to return the updated document and avoid deprecation warnings
        );
        if (result) {
            return res.status(200).json({ msg: `Employee ${name} data updated successfully.`, success: true, result })
        }
        return res.status(400).json({ msg: 'Failed to update employee data!', success: false })
    } catch (error) {
        console.log("error on updateEmpyFromVender: ", error);
        return res.status(500).json({ msg: error.message, err: error, success: false })
    }
}

// add or update profile for about
exports.updateAbount = async (req, res) => {
    const id = req.body.id
    const about = req.body.about
    try {
        const result = await Profile.findOneAndUpdate(
            { userId: id },
            { about: about },
            { new: true, upsert: true }
        );
        if (result) {
            return res.status(200).json({ msg: `Profile updated successfully.`, success: true })
        }
        return res.status(400).json({ msg: `Failed to update profile!`, success: false })
    } catch (error) {
        console.log("error on updateProfile: ", error);
        return res.status(500).json({ msg: error.message, err: error, success: false })
    }
}


exports.deleteJobFromEmp = async (req, res) => {
    // console.log("req.body: ", req.body);
    const id = req.body.id
    const jobId = req.body.jobId
    try {
        const checkEmp = await Employee.findOne({ _id: id })
        if (!checkEmp) {
            return res.status(404).json({ msg: 'No employee found!', success: false })
        }
        const result = await Employee.findByIdAndUpdate(
            { _id: id },
            { $pull: { jobId: jobId } }
        )
        if (result) {
            return res.status(200).json({ msg: 'Job removed successfully.', success: true, result })
        }
        return res.status(400).json({ msg: 'Failed to delete job!', success: false })
    } catch (error) {
        console.log("error on deleteJobFromEmp: ", error);
        return res.status(500).json({ msg: error.message, err: error, success: false })
    }
}


exports.updateEmp = async (req, res) => {
    // console.log("req.body: ", req.body);
    const id = req.body.id
    const name = req.body?.name
    const email = req.body?.email
    const mobile = req.body?.mobile
    const address = req.body?.address
    const city = req.body.city
    const lane = req.body.lane
    const stateId = req.body.state
    const zip = req.body.zip
    // const profile = req.files?.profile
    const jobTitle = req.body.jobTitle
    const department = req.body.department
    const employeeId = req.body.employeeId
    const hireDate = req.body.hireDate
    const empStatus = req.body.empStatus
    const payPeriod = req.body.payPeriod
    const overTimeRate = req.body.overTimeRate
    const wage = req.body.wage
    const timeOff = req.body.timeOff
    const availabilityPreference = req.body.availabilityPreference


    try {

        const checkEmp = await Employee.findById(id)
        if (!checkEmp) {
            return res.status(404).json({ msg: 'No employee data found!', success: false })
        }

        /* let userDate = {
            name: name,
            mobile: mobile,
            address: address,
            city: city,
            rate: rate,
            address: address,
            lane: lane,
            zip: zip,
            stateId: stateId,
            jobTitle: jobTitle,
            department: department,
            employeeId: employeeId,
            hireDate: hireDate,
            empStatus: empStatus,
            payPeriod: payPeriod,
            overTimeRate: overTimeRate,
            wage: wage,
            timeOff: timeOff,
            availabilityPreference: availabilityPreference,
        }

        if (profile) {
            const fileName = "empProfile" + date.getTime() + profile.name.replace(/\s+/g, '')
            const profileFilePath = path.join(__dirname, "..", "assets", "empProfile", fileName)
            profile.mv(profileFilePath, (err) => {
                if (err) {
                    return res.status(400).json({ success: false, msg: 'Failed to upload user profile image?' })
                }
            })

            userDate.profile = fileName

            if (checkEmp.profile) {
                const removeprofileFilePath = path.join(__dirname, "..", "assets", "empProfile", checkEmp.profile)
                fs.unlink(removeprofileFilePath, (err) => {
                    if (err) {
                        return res.status(400).json({ msg: 'Failed to delete profile image?', success: false })
                    }
                })
            }
        } */
        const result = await Employee.findByIdAndUpdate({ _id: id }, { name: name, email: email, mobile: mobile, address: address, city: city, lane: lane, stateId: stateId, zip: zip, jobTitle: jobTitle, department: department, employeeId: employeeId, hireDate: hireDate, empStatus: empStatus, payPeriod: payPeriod, overTimeRate: overTimeRate, wage: wage, timeOff: timeOff, availabilityPreference: availabilityPreference })
        if (result) {
            return res.status(200).json({ msg: `Employee data updated successfully.`, success: true })
        }
        return res.status(400).json({ msg: `Failed to update employee data!`, success: false })

    } catch (error) {
        console.log("error on updateEmp: ", error);
        return res.status(500).json({ msg: error.message, err: error, success: false })
    }
}


exports.forgotPassword = async (req, res) => {
    const email = req.body.email
    const password = req.body.password

    try {
        const checkEmp = await Employee.findOne({ email: email })
        if (!checkEmp) {
            return res.status(200).json({ msg: 'No employee data found!', success: false })
        }
        const hasPass = await bcrypt.hashSync(password, parseInt(salt))
        const result = await Employee.findOneAndUpdate({ email: email }, { password: hasPass })
        if (result) {
            return res.status(200).json({ msg: `${checkEmp?.name} password has been reset successfully.`, success: true, result })
        }
    } catch (error) {
        console.log("error on forgotPassword: ", error);
        return res.status(500).json({ msg: error.message, err: error, success: false })
    }
}


exports.updateProfileEmp = async (req, res) => {
    // console.log("req.body: ", req.body);
    // console.log("req.files: ", req.files);
    const id = req.body.id
    const profile = req.files?.profile

    const date = new Date()

    try {
        const checkEmp = await Employee.findById(id)

        if (!profile) {
            return res.status(400).json({ msg: `Profile image is required!`, success: false })
        }


        const fileName = "empProfile" + date.getTime() + profile.name.replace(/\s+/g, '')
        const profileFilePath = path.join(__dirname, "..", "assets", "empProfile", fileName)
        profile.mv(profileFilePath, (err) => {
            if (err) {
                return res.status(400).json({ success: false, msg: 'Failed to upload user profile image?' })
            }
        })

        if (checkEmp.profile) {
            const removeprofileFilePath = path.join(__dirname, "..", "assets", "empProfile", checkEmp.profile)
            fs.unlink(removeprofileFilePath, (err) => {
                if (err) {
                    return res.status(400).json({ msg: 'Failed to delete profile image?', success: false })
                }
            })
        }

        const result = await Employee.findByIdAndUpdate({ _id: id }, { profile: fileName })
        if (result) {
            return res.status(200).json({ msg: `Profile image updated successfully.`, success: true, result })
        }
        return res.status(400).json({ msg: 'Failed to update profile image', success: false })
    } catch (error) {
        console.log("error on updateProfileEmp: ", error);
        return res.status(500).json({ msg: error.message, err: error, success: false })
    }
}

exports.notificationsList = async (req, res) => {
    try {
        const { id } = req.body;
        const checkEmp = await Employee.findById(id);
        if (!checkEmp) {
            return res.status(404).json({ msg: 'No employee found!', success: false })
        }

        const result = await Services.NotificationService.getNotificationsByUser(checkEmp._id);
        if (result) {
            return res.status(200).json({ msg: `Success`, success: true, result })
        }
        return res.status(400).json({ msg: 'Failed', success: false })
    } catch (error) {
        console.log("error on updateProfileEmp: ", error);
        return res.status(500).json({ msg: error.message, err: error, success: false })
    }
}
exports.notificationsMarkAllAsRead = async (req, res) => {
    try {
        const { id } = req.body;
        const checkEmp = await Employee.findById(id);
        if (!checkEmp) {
            return res.status(404).json({ msg: 'No employee found!', success: false })
        }

        const result = await Services.NotificationService.markAllAsRead(checkEmp._id);
        if (result) {
            return res.status(200).json({ msg: `Success`, success: true })
        }
        return res.status(400).json({ msg: 'Failed', success: false })
    } catch (error) {
        console.log("error on updateProfileEmp: ", error);
        return res.status(500).json({ msg: error.message, err: error, success: false })
    }
}

exports.notificationsMarkAllAsRead = async (req, res) => {
    try {
        const { id } = req.body;
        const checkEmp = await Employee.findById(id);
        if (!checkEmp) {
            return res.status(404).json({ msg: 'No employee found!', success: false })
        }

        const result = await Services.NotificationService.markAllAsRead(checkEmp._id);
        if (result) {
            return res.status(200).json({ msg: `Success`, success: true })
        }
        return res.status(400).json({ msg: 'Failed', success: false })
    } catch (error) {
        console.log("error on updateProfileEmp: ", error);
        return res.status(500).json({ msg: error.message, err: error, success: false })
    }
}

exports.notificationsTest = async (req, res) => {
    try {
        const { id } = req.body;
        const checkEmp = await Employee.findById(id);
        if (!checkEmp) {
            return res.status(404).json({ msg: 'No employee found!', success: false })
        }

        const result = await Services.NotificationService.sendNotification(checkUser._id,checkUser.device_token,'Test Notification','Test Description',{});

        if (result) {
            return res.status(200).json({ msg: `Success`, success: true })
        }
        return res.status(400).json({ msg: 'Failed', success: false })
    } catch (error) {
        console.log("error on updateProfileEmp: ", error);
        return res.status(500).json({ msg: error.message, err: error, success: false })
    }
}

