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
const Shift = require("../model/Shift");
const Job = require("../model/Job");
const LoginLog = require('../model/loginLog');
const mongoose = require('mongoose')
const moment = require('moment');


exports.getAllEmploye = async (req, res) => {
    try {
        const result = await Employee.find()
        if (!result) {
            return res.status(404).json({ msg: 'No employee found!', success: false })
        }
        return res.status(200).json({ msg: 'Ok', success: true, result })
    } catch (error) {
        //console.log("error on getAllEmploye: ", error);
        return res.status(500).json({ msg: error.message, err: error, success: false })
    }
}


exports.getColleagues = async (req, res) => {
    try {
        const id = req.payload.reqUserId;


        const authUser = await Employee.findById(id)
        if (!authUser) {
            return res.status(404).json({ msg: 'No employee found!', success: false })
        }

        const result = await Employee.find({userId : authUser.userId});

       
        return res.status(200).json({ msg: 'Ok', success: true, result })
    } catch (error) {
        //console.log("error on getAllEmploye: ", error);
        return res.status(500).json({ msg: error.message, err: error, success: false })
    }
}
exports.dashboard = async (req, res) => {
    const id = req.params.id;
    const today = new Date();

    try {
        // Find the employee by ID and populate the shifts assigned to them
        const employee = await Employee.findById(id).populate({
            path: 'jobId',
            populate: {
                path: 'shift',
                model: 'shift', // make sure this matches the actual model name (case-sensitive)
                select: 'name start end userId'
            }
        });
        if (!employee) {
            return res.status(403).json({ msg: 'Forbidden Access!', success: false });
        }

        const currentTime = moment().format('HH:mm');


        // Pull first shift if available
        let currentShift = null;

        // Iterate over each assigned shift to check if the current time falls within the shift's range

        for (const job of employee.jobId) {
            const startTime = moment(job.shift.start).format('HH:mm');
            const endTime = moment(job.shift.end).format('HH:mm');

            // Check if the current time is within this shift's time range
            if (currentTime >= startTime && currentTime <= endTime) {
                currentShift = job.shift;
                break;
            }
        }

        return res.status(200).json({
            msg: 'Employee and Job count',
            success: true,
            result: currentShift
        });
    } catch (error) {
        //console.log("Error on getCount:", error);
        return res.status(500).json({ msg: error.message, err: error, success: false });
    }
};


// this api is for emp
exports.getEmpById = async (req, res) => {
    const id = req.params.id
    // //console.log("id: ", id);
    try {
        const result = await Employee.findById(id).select('-password -__v -delete').populate("jobId").populate("shift").populate("stateId")
        if (result) {
            return res.status(200).json({ msg: 'Ok', success: true, result })
        }
        return res.status(404).json({ msg: 'No empoyee found!', success: false })
    } catch (error) {
        //console.log("error on getEmpById: ", error);
        return res.status(500).json({ msg: error.message, err: error, success: false })
    }
}

exports.getEmpByVendroId = async (req, res) => {
    const id = req.payload.reqUserId
    try {
        if (!id) {
            return res.status(403).json({ msg: 'Access Denied!', success: false })
        }
        // //console.log("id: ", id);
        const checkVendor = await User.findOne({ _id: id })
        // //console.log("checkVendor: ", checkVendor);
        if (!checkVendor) {
            return res.status(403).json({ msg: 'Access Forbidden', success: false })
        }
        const employees = await Employee.find({ userId: id, delete: false }).select("-password").populate("shift")
        const result = employees.map(employee => ({
            ...employee.toObject(),
            name: `${employee.firstName} ${employee.lastName}`
        }));

        // //console.log("result: ", result);
        if (!result) {
            return res.status(404).json({ msg: 'No employee data found!', success: false })
        }
        return res.status(200).json({ msg: 'Ok', success: true, result })
    } catch (error) {
        //console.log("error on getEmpByVendroId: ", error);
        return res.status(500).json({ msg: error.message, err: error, success: false })
    }
}


// deleting emp by vender id and emp id
exports.deleteEmp = async (req, res) => {
    const id = req.params.id
    // //console.log("req.body: ", req.body);
    // //console.log("req.params: ", req.params);
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
        //console.log("error on deleteEmp: ", error);
        return res.status(500).json({ msg: error.message, err: error, success: false })
    }
}


exports.empLogin = async (req, res) => {
    // //console.log("req.body: ", req.body);
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
        const token = createToken({ _id: checkEmp._id, email: checkEmp.email, name: checkEmp.name, address: checkEmp.address, role :'employee' });

        if (token) {
            if (device_token) {
                await Employee.findOneAndUpdate({ email: email },
                    {
                        device_token
                    }
                );
            }


            let unReadNotifications = await Services.NotificationService.getUnreadNotificationCount(checkEmp._id);
            checkEmp.unReadNotifications = unReadNotifications;
            await LoginLog.deleteMany({ employeeId: checkEmp._id }); // Delete old logs

            await LoginLog.create({
                userId: checkEmp.userId,
                employeeId: checkEmp._id,
                ipAddress: req.ip,
                userAgent: req.headers['user-agent'],
            });

            return res.status(200).json({ msg: 'Your are login successfully.', success: true, result: checkEmp, token })
        }
        return res.status(400).json({ msg: 'Failed to create token!', success: false })
    } catch (error) {
        //console.log("error on empLogin: ", error);
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
        //console.log("error on resetDefaultPasswordEmpId: ", error);
        return res.status(500).json({ msg: error.message, err: error, success: false })
    }
}

// this is udpate from vender side and put the working days with array
exports.updateEmpyFromVender = async (req, res) => {
    // //console.log("req.body: ", req.body);
    // //console.log("req.files: ", req.files);
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

    // //console.log("image: ", image);

    const date = new Date()
    try {
        let daysName = days.split(',')
        const daysNameKey = daysName.map(day => ({ name: day }));
        // //console.log("dayname: ", daysName);
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
            rate: rate ?? 0,
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
        //console.log("error on updateEmpyFromVender: ", error);
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
        //console.log("error on updateProfile: ", error);
        return res.status(500).json({ msg: error.message, err: error, success: false })
    }
}


exports.deleteJobFromEmp = async (req, res) => {
    // //console.log("req.body: ", req.body);
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
        //console.log("error on deleteJobFromEmp: ", error);
        return res.status(500).json({ msg: error.message, err: error, success: false })
    }
}

exports.getProfile = async (req, res) => {
    const { id } = req.params;

    try {
        // Fetch the employee by ID
        const employee = await Employee.findById(id);

        if (!employee) {
            return res.status(404).json({ message: 'Employee not found' });
        }
        const result = await Shift.find({ userId: employee._id }).select("-__v -updatedAt -userId").sort({ createdAt: -1 })

        employee.shift = result.length ? result[0] : {};
        res.status(200).json(employee);
    } catch (error) {
        console.error('Error fetching employee profile:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.updateProfile = async (req, res) => {
    const { id } = req.params;
    const formData = req.body.updateData;

    //console.log('formData.rate :L ' ,formData.rate)
    // Create an object to hold the updates
    let updates = {};

    // Check and add only the fields present in the request body to the updates object
    if (formData.name) updates.name = formData.name;
    // if (formData.email) updates.email = formData.email;
    if (formData.mobile) updates.mobile = formData.mobile;
    if (formData.address) updates.address = formData.address;
    if (formData.city) updates.city = formData.city;
    if (formData.lane) updates.lane = formData.lane;
    if (formData.stateId) updates.stateId = formData.stateId;
    if (formData.zip) updates.zip = formData.zip;
    if (formData.jobTitle) updates.jobTitle = formData.jobTitle;
    if (formData.department) updates.department = formData.department;
    if (formData.employeeId) updates.employeeId = formData.employeeId;
    if (formData.hireDate) updates.hireDate = formData.hireDate;
    if (formData.empStatus) updates.empStatus = formData.empStatus;
    if (formData.payPeriod) updates.payPeriod = formData.payPeriod;
    // if (formData.overTimeRate) updates.overTimeRate = formData.overTimeRate;
    if (formData.rate) updates.rate = formData.rate ?? 0;
    if (formData.timeOff) updates.timeOff = formData.timeOff;
    if (formData.shiftPreferences) updates.shiftPreferences = formData.shiftPreferences;
    if (formData.certifications) updates.certifications = formData.certifications;
    if (formData.skills) updates.skills = formData.skills;
    if (formData.firstName) updates.firstName = formData.firstName;
    if (formData.lastName) updates.lastName = formData.lastName;
    if (formData.middleName) updates.middleName = formData.middleName;
    if (formData.ssnNo) updates.ssnNo = formData.ssnNo;

    if (formData.availabilityPreference) updates.availabilityPreference = formData.availabilityPreference;

    try {
        const checkEmp = await Employee.findById(id);
        if (!checkEmp) {
            return res.status(404).json({ msg: 'No employee data found!', success: false });
        }

        const result = await Employee.findByIdAndUpdate(id, updates, { new: true });
        if (result) {
            return res.status(200).json({ msg: 'Employee data updated successfully.', success: true });
        }
        return res.status(400).json({ msg: 'Failed to update employee data!', success: false });

    } catch (error) {
        //console.log('error on updateEmp:', error);
        return res.status(500).json({ msg: error.message, err: error, success: false });
    }
};


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
        //console.log("error on forgotPassword: ", error);
        return res.status(500).json({ msg: error.message, err: error, success: false })
    }
}


exports.updateProfileEmp = async (req, res) => {

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
        //console.log("error on updateProfileEmp: ", error);
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
        //console.log("error on updateProfileEmp: ", error);
        return res.status(500).json({ msg: error.message, err: error, success: false })
    }
}


exports.notificationsUnreadCount = async (req, res) => {
    try {
        const { id } = req.body;
        const checkEmp = await Employee.findById(id);
        if (!checkEmp) {
            return res.status(404).json({ msg: 'No employee found!', success: false })
        }

        let unReadNotifications = await Services.NotificationService.getUnreadNotificationCount(checkEmp._id);
        return res.status(200).json({ msg: `Success`, success: true, unReadNotifications })
    } catch (error) {
        //console.log("error on updateProfileEmp: ", error);
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
        //console.log("error on updateProfileEmp: ", error);
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
        //console.log("error on updateProfileEmp: ", error);
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

        const result = await Services.NotificationService.sendNotification(checkUser._id, checkEmp.device_token, 'Test Notification', 'Test Description', {});

        if (result) {
            return res.status(200).json({ msg: `Success`, success: true })
        }
        return res.status(400).json({ msg: 'Failed', success: false })
    } catch (error) {
        //console.log("error on updateProfileEmp: ", error);
        return res.status(500).json({ msg: error.message, err: error, success: false })
    }
}

exports.testNotificationCreate = async (req, res) => {
    try {
        const { id } = req.params;
        const checkEmp = await Employee.findById(id);
        if (!checkEmp) {
            return res.status(404).json({ msg: 'No employee found!', success: false })
        }

        const result = await Services.NotificationService.sendNotification(checkEmp._id, checkEmp.device_token, 'Test Notification', 'This is a test notification description. this is used for testing purpose only.', {});

        if (result) {
            return res.status(200).json({ msg: `Success`, success: true })
        }
        return res.status(400).json({ msg: 'Failed', success: false })
    } catch (error) {
        //console.log("error on updateProfileEmp: ", error);
        return res.status(500).json({ msg: error.message, err: error, success: false })
    }
}

exports.assignedJobs = async (req, res) => {
    const id = req.payload.reqUserId;
    try {
        const employee = await Employee.findById(id).select('jobId');

        if (!employee) {
            return res.status(404).json({ msg: 'No employee found!', success: false });
        }

        await employee.populate({
            path: 'jobId',
            select: 'status name _id statusByEmployee',
        });
        const { jobId } = employee;
        return res.status(200).json({ msg: 'Ok', success: true, result: jobId });

    } catch (error) {
        return res.status(500).json({ msg: error.message, err: error, success: false });
    }
}


exports.closeAssignedJob = async (req, res) => {
    const { jobId } = req.params;
    const id = req.payload.reqUserId;
    try {
        const job = await Job.findByIdAndUpdate(
            jobId,
            { statusByEmployee: 'closed' },
            { new: true }
        );

        if (!job) {
            return res.status(404).json({ msg: 'Job not found!', success: false });
        }

        const employee = await Employee.findById(id);

        if (!employee) {
            return res.status(404).json({ msg: 'No employee found!', success: false });
        }


        let vendor = await User.findOne({ _id: job.userId });
        //console.log(vendor);
        await Services.NotificationService.sendNotification(vendor._id, vendor?.device_token, 'Job is Completed!', ` ${employee.name} has marked the Job ${job?.name} as Completed from his Side. Please Check the Job for further Actions.`);

        return res.status(200).json({ msg: 'Job closed successfully!', success: true, job });
    } catch (error) {
        console.error("Error in closeJob: ", error);
        return res.status(500).json({ msg: 'Server Error', err: error.message, success: false });
    }
};

exports.getTrackingRequestStatus = async (req, res) => {

    let { reqUserId } = req.payload;
    try {
        const result = await Employee.aggregate([
            {
                $match: { _id: new mongoose.Types.ObjectId(reqUserId) }
            },
            {
                $lookup: {
                    from: "trackings",              // The collection name for the Tracking schema
                    localField: "_id",              // Employee _id corresponds to the userId in Tracking
                    foreignField: "userId",         // Field in Tracking that refers to Employee
                    as: "trackingData"              // Alias to store tracking data
                }
            },
            {
                $unwind: "$trackingData"  // Flatten the trackingData array to filter the data
            },
            {
                $lookup: {
                    from: "jobs",                   // The collection name for Jobs schema
                    localField: "trackingData.jobId", // JobId from tracking data
                    foreignField: "_id",             // _id in Jobs schema
                    as: "jobData"                    // Alias to store job data
                }
            },
            {
                $project: {
                    employeeId: "$_id",            // Include employee id
                    employeeName: {                     // Concatenate first name and last name
                        $concat: ["$firstName", " ", "$lastName"]
                    },         // Include employee name
                    trackingData: 1,               // Include tracking data
                    jobData: 1                     // Include job data
                }
            },
            {
                $sort: {
                    'trackingData.createdAt': -1
                }
            }
        ]);


        return res.status(200).json({ msg: "Ok", success: true, result });
    } catch (error) {
        //console.log("Error fetching employee job tracking: ", error);
        return res.status(500).json({ msg: error.message, err: error, success: false });
    }
};