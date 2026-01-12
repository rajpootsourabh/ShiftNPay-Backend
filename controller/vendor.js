const bcrypt = require('bcrypt')
const { createToken } = require("../util/createToken")
const Employee = require("../model/Employee")
const { sendMail, sendMailAddedToVender, sendMailOnceNewVendorRequestRecieved, sendInviteToVendorFromAdmin } = require("../util/mailService")
const User = require('../model/User')
require('dotenv').config()
const path = require('path')
const fs = require('fs')
const Profile = require('../model/Profile')
const Job = require('../model/Job')
const mongoose = require('mongoose')
const Category = require('../model/Category')
const Tracking = require('../model/Tracking')
const LoginLog = require('../model/loginLog');
const { getNextSequenceValue } = require('../model/Sequence')
const Membership = require('../model/membership')
const Subscription = require('../model/Subscription')
const Catalogue = require('../model/catalogue');
const Subcategory = require('../model/subcategory');
const Item = require('../model/item');
const salt = process.env.SALT
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Services = require('./../services');
const checklist = require('../model/checklist')
const onboardingEmployee = require('../model/onboardingEmployee');
const AutoApproval = require('../model/autoApproval');
const Shift = require('../model/Shift')
const moment = require('moment')
const leaveManagement = require('../model/leaveManagement')
const { getCurrentWeekMonday, calculateWeeklyHoursWithLeaves } = require('../util/functions')
const leaveManagementModel = require('../model/leaveManagement')


exports.updateExistingEmployeesWithEmpId = async (req, res) => {
    try {

        // Get all employees with undefined empId
        const employees = await Employee.find({ empId: { $exists: true } });

        // Sort employees by some criteria if needed
        employees.sort((a, b) => a.createdAt - b.createdAt); // Optional sorting

        let currentId = 111000;

        for (let employee of employees) {
            // Assign unique empId and increment
            employee.empId = currentId;
            currentId++;

            await employee.save();
        }

        //console.log('Updated existing employees with empId.');
        await mongoose.disconnect();
    } catch (error) {
        console.error('Error updating existing employees:', error);
        throw error;
    }
};




exports.registerVendor = async (req, res) => {
    // //console.log("req.body: ", req.body);
    const name = req.body.name
    const email = req.body.email
    const password = req.body.password
    const address = req.body.address
    const role = req.body.role

    try {
        const checkVendor = await User.findOne({ email: email });
        if (checkVendor) {
            return res.status(400).json({ msg: `Email ${email} already exists! Please use other`, success: false })
        }
        const checkEmployee = await Employee.findOne({ email: email });
        //console.log('checkEmployee :', checkEmployee)
        if (checkEmployee) {
            return res.status(400).json({ msg: `Email ${email} already exists as a employee! Please use other`, success: false })
        }
        const hasPass = await bcrypt.hashSync(password, parseInt(salt))
        const result = await User.create({ name: name, email: email, address: address, password: hasPass, role: role })
        if (result) {
            sendMailOnceNewVendorRequestRecieved(result, "Registration on shiftnpay.com");
            Services.NotificationService.createNotificationForAdmin(result, 'Registered as Vendor on Platform. ', { navigateTo: '/members' });
            return res.status(200).json({ msg: `Your registration has been successfully. Please wait for approval`, success: true })
        }
        return res.status(400).json({ msg: 'Failed to create vendor!', success: false })
    } catch (error) {
        //console.log("error on registerVendor: ", error);
        return res.status(500).json({ msg: error.message, err: error, success: false })
    }
}

exports.registerVendorFromAdmin = async (req, res) => {
    // //console.log("req.body: ", req.body);
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
        const checkEmployee = await Employee.findOne({ email: email });
        if (checkEmployee) {
            return res.status(400).json({ msg: `Email ${email} already exists as a employee! Please use other`, success: false })
        }
        const hasPass = await bcrypt.hashSync(password, parseInt(salt))
        const result = await User.create({ name: name, email: email, address: address, password: hasPass, role: role })
        if (result) {
            // sendMail(email, name, "Your account has been register successfully. Please wait for approval")
            sendInviteToVendorFromAdmin(result, "Registration on shiftnpay.com")
            return res.status(200).json({ msg: `Your registration has been successfully. Please wait for approval`, success: true })
        }
        return res.status(400).json({ msg: 'Failed to create vendor!', success: false })
    } catch (error) {
        //console.log("error on registerVendor: ", error);
        return res.status(500).json({ msg: error.message, err: error, success: false })
    }
}


exports.loginVendor = async (req, res) => {
    // //console.log("req.body: ", req.body);
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
        const token = createToken({ _id: checkVendor._id, email: checkVendor.email, name: checkVendor.name, address: checkVendor.address ,role :'vendor' })
        if (!token) {
            return res.status(400).json({ msg: 'Failed to create token!', success: false })
        }
        await LoginLog.create({
            userId: checkVendor._id,
            ipAddress: req.ip,
            userAgent: req.headers['user-agent'],
        });
        return res.status(200).json({ msg: 'Ok', success: true, result: checkVendor, token })
    } catch (error) {
        //console.log("error on loginVendor: ", error);
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
        //console.log("error on uploadProfileImage: ", error);
        return res.status(500).json({ msg: error.message, err: error, success: false })
    }
}

exports.updateProfileUpdate = async (req, res) => {
    const name = req.body.name
    const email = req.body.email
    const address = req.body.address
    const id = req.body._id

    try {
        //console.log("name: ", name);
        //console.log("email: ", email);
        //console.log("address: ", address);
        //console.log("id: ", id);
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
        //console.log("error on updateProfileUpdate: ", error);
        return res.status(500).json({ msg: error.message, err: error, success: false })
    }
}

exports.createEmployeee = async (req, res) => {
    const id = req.body.id //this is for validation that venndor is or not
    const email = req.body.email
    const isSent = req.body?.isSent
    // //console.log("isSent: ", isSent);
    try {
        const vendorDetailFound = await User.findById(id)
        if (!vendorDetailFound) {
            return res.status(404).json({ msg: 'Employee not found!', success: false })
        }


        const checkProfile = await Profile.findOne({ userId: id })

        const checkAlreadyEmp = await Employee.findOne({ email: email });
        if (checkAlreadyEmp) {
            return res.status(400).json({ msg: `Employee ${email} already exists!`, success: false })
        }


        const username = email.split('@')[0];
        let password = username + 123
        const hasPass = await bcrypt.hashSync(password, parseInt(salt))
        const empId = await getNextSequenceValue('empId');

        const result = await Employee.create({ userId: id, email: email, password: hasPass, empId })
        if (!result) {
            return res.status(400).json({ msg: 'Failed to create employee!', success: false })
        }
        if (isSent) {
            sendMailAddedToVender(email, null, `Welcome to ShiftNPay - Manage Your Time Cards Easily!`, checkProfile ? checkProfile?.restaurantsName : vendorDetailFound?.email, email, password)
        }
        return res.status(200).json({ msg: `Employee created successfully.`, success: true, result })
    } catch (error) {
        //console.log("error on createEmployeee: ", error);
        return res.status(500).json({ msg: error.message, err: error, success: false })
    }
}

exports.getSingleVendorById = async (req, res) => {
    const id = req.params.id
    try {
        // //console.log("id: ", id);
        const result = await User.findOne({ _id: id, role: 'vender' }).select("-__v -password")
        // //console.log("result: ", result);
        if (result) {
            return res.status(200).json({ msg: 'Ok', success: true, result })
        }
        return res.status(400).json({ msg: 'No user found!', success: false })
    } catch (error) {
        //console.log("error on getSingleVendorById: ", error);
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
        //console.log("error on getSingleRestorauntProfile: ", error);
        return res.status(500).json({ msg: error.message, err: error, success: false })
    }
}

exports.updateRestorauntProfile = async (req, res) => {
    const {
        id, address, provins, pinCode, restaurantsName,
        categoryId, item, year, location, empNumber, mobile,
        email, contact, industry, webUrl, timeHours, description
    } = req.body;

    const image = req.files?.image;
    const date = new Date();

    try {
        const checkUser = await User.findById(id);
        if (!checkUser) {
            return res.status(400).json({ msg: 'No user found!', success: false });
        }

        const checkProfile = await Profile.findOne({ userId: id });
        let fileName;

        if (image) {
            fileName = "restroProfile" + date.getTime() + image.name.replace(/\s+/g, '');
            const profileFilePath = path.join(__dirname, "..", "assets", "restaurantImage", fileName);

            await image.mv(profileFilePath); // Ensuring async handling

            if (checkProfile?.image) {
                const removeprofileFilePath = path.join(__dirname, "..", "assets", "restaurantImage", checkProfile.image);
                fs.unlink(removeprofileFilePath, (err) => {
                    if (err) {
                        return res.status(400).json({ msg: 'Failed to delete restaurant image.', success: false });
                    }
                });
            }
        }

        // Handle the case where itemId might be empty or invalid
        const itemId = item ? item : null;

        if (checkProfile) {
            // Update existing profile
            checkProfile.set({
                name: checkUser.name,
                provins,
                address,
                pinCode,
                restaurantsName,
                categoryId,
                year,
                location,
                empNumber,
                mobile,
                email,
                contact,
                industry,
                webUrl,
                timeHours,
                description,
                itemId: itemId, // Only set if itemId is valid
                image: fileName || checkProfile.image,
            });

            await checkProfile.save();
            return res.status(200).json({ msg: 'Restaurant profile data updated successfully.', success: true, result: checkProfile });

        } else {
            // Create new profile
            const result = await Profile.create({
                userId: id,
                name: checkUser.name,
                image: fileName || '',
                provins,
                address,
                pinCode,
                restaurantsName,
                categoryId,
                year,
                location,
                empNumber,
                mobile,
                email,
                contact,
                industry,
                webUrl,
                timeHours,
                description,
                itemId: itemId // Only set if itemId is valid
            });
            return res.status(200).json({ msg: 'Restaurant profile created successfully.', success: true, result });
        }

    } catch (error) {
        console.error("Error on updateRestorauntProfile:", error);
        return res.status(500).json({ msg: 'Server error', success: false });
    }
};

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
        //console.log("error on updateRestorauntProfile: ", error);
        return res.status(500).json({ msg: error.message, err: error, success: false })
    }
}

exports.changePasswordById = async (req, res) => {
    // //console.log("req.body: ", req.body);
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
        //console.log("error on changePasswordById: ", error);
        return res.status(500).json({ msg: error.message, err: error, success: false })
    }
}

exports.dashboard = async (req, res) => {
    const vendorId = req.payload.reqUserId;
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));

    try {
        const checkUser = await User.findById(vendorId)
        if (!checkUser) {
            return res.status(403).json({ msg: 'Forbidden Access!', success: false })
        }
        const currentTime = moment().format('HH:mm');

        const shifts = await Shift.find({
            userId: vendorId,
        }).select('name start end');

        let currentShift = null;

        for (const shift of shifts) {
            // Extract the time from start and end in "HH:mm" format
            const startTime = moment(shift.start).format('HH:mm');
            const endTime = moment(shift.end).format('HH:mm');

            // Check if the current time is within the shift's time range
            if (currentTime >= startTime && currentTime <= endTime) {
                currentShift = shift;
                break;
            }
        }

        const activeJobs = await Job.countDocuments({
            userId: vendorId,
            status: { $ne: "closed" }
        });



        const employees = await Employee.find({ userId: vendorId });
        const employeeIds = employees.map(employee => employee._id);
        let runningJobs = await Tracking.find({
            userId: { $in: employeeIds },
            sessionDate: { $gte: startOfDay, $lte: endOfDay }
        })
            .populate('jobId')
            .populate('userId')
            .lean(); // Converts Mongoose documents to plain JavaScript objects

        runningJobs = runningJobs.filter(job => job.jobId && job.jobId !== null && job.jobId !== undefined);


        const loginLogs = await LoginLog.find({ userId: vendorId, employeeId: { $ne: null } })
            .populate('employeeId')
            .sort({ loginTime: -1 })
            .limit(10);

        const filteredLogs = loginLogs.filter(log => log.employeeId !== null);

        return res.status(200).json({
            msg: 'Employee and Job count', success: true, result: {
                currentShift, activeJobs, runningJobs, loginLogs: filteredLogs
            }
        })
    } catch (error) {
        //console.log("error on getCount: ", error);
        return res.status(500).json({ msg: error.message, err: error, success: false })
    }
}



exports.getCurrentWeekShiftSchedules = async (req, res) => {
    try {
        const userId = req.payload.reqUserId;

        if (!userId) {
            return res.status(400).json({ message: 'userId is required' });
        }

        // 1. Get current week range (Monday to Sunday)
        const weekStart = moment().utc().startOf('week').add(1, 'day'); // Monday
        const weekEnd = weekStart.clone().add(6, 'days').endOf('day'); // Sunday

        // 2. Fetch all employees with their jobs populated
        const employees = await Employee.find({ userId, delete: false })
            .select('name employeeId jobId _id')
            .populate({
                path: 'jobId',
                select: 'name shift status',
                match: { status: { $ne: 'closed' } }
            })
            .lean();

        if (!employees.length) {
            return res.status(404).json({ message: 'No active employees found' });
        }

        // 3. Get all unique shift IDs from all jobs
        const allShiftIds = [...new Set(
            employees.flatMap(employee =>
                (employee.jobId || []).flatMap(job =>
                    job.shift ? [job.shift.toString()] : []
                )
            )
        )];

        // 4. Fetch all shift details in one query
        const shifts = await Shift.find({
            _id: { $in: allShiftIds }
        }).select('start end').lean();

        // Create shift map for quick lookup
        const shiftMap = new Map(shifts.map(shift => [shift._id.toString(), shift]));

        // 5. Process each employee
        const result = [];
        for (const employee of employees) {
            // Initialize employee data
            const employeeData = {
                employeeId: employee.employeeId,
                employeeName: employee.name,
                jobs: [],
                weeklyHours: {},
                totalHours: 0,
                shiftDetails: {},
                leaves: []
            };

            // Initialize daily hours
            for (let i = 0; i < 7; i++) {
                const date = weekStart.clone().add(i, 'days');
                const dateKey = date.format('YYYY-MM-DD');
                employeeData.weeklyHours[dateKey] = 0;
                employeeData.shiftDetails[dateKey] = [];
            }

            // Process each job assigned to this employee
            for (const job of employee.jobId || []) {
                if (!job || !job.shift) continue;

                const jobData = {
                    jobId: job._id,
                    jobName: job.name
                };

                // Get the shift from our map
                const shift = shiftMap.get(job.shift.toString());
                if (!shift) continue;

                // Calculate shift duration in hours
                const shiftStart = moment(shift.start).utc();
                const shiftEnd = moment(shift.end).utc();
                const duration = shiftEnd.diff(shiftStart, 'hours', true);

                // Apply this shift pattern to each day of the week
                for (let i = 0; i < 7; i++) {
                    const currentDate = weekStart.clone().add(i, 'days');
                    const dateKey = currentDate.format('YYYY-MM-DD');

                    const dayShift = {
                        start: currentDate.clone()
                            .hour(shiftStart.hour())
                            .minute(shiftStart.minute())
                            .toISOString(),
                        end: currentDate.clone()
                            .hour(shiftEnd.hour())
                            .minute(shiftEnd.minute())
                            .toISOString(),
                        hours: duration,
                        jobId: job._id,
                        jobName: job.name
                    };

                    employeeData.shiftDetails[dateKey].push(dayShift);
                    employeeData.weeklyHours[dateKey] += duration;
                }

                employeeData.jobs.push(jobData);
            }

            // Calculate total hours
            employeeData.totalHours = Object.values(employeeData.weeklyHours)
                .reduce((sum, hours) => sum + hours, 0);

            // 6. Process leaves and sick days
            const leaveManagement = await leaveManagementModel.findOne({
                employeeId: employee._id,
                vendorId: userId
            }).populate('leaves.leaveType');

            if (leaveManagement) {
                for (const leave of leaveManagement.leaves) {
                    for (const consumedLeave of leave.consumed) {
                        if (consumedLeave.status === 'approved') {
                            const startDate = moment(consumedLeave.startDate).utc().startOf('day');
                            const endDate = moment(consumedLeave.endDate).utc().endOf('day');

                            for (let d = startDate.clone(); d.isSameOrBefore(endDate); d.add(1, 'day')) {
                                const dateKey = d.format('YYYY-MM-DD');

                                // Only process if this day is in our week and has shifts
                                if (employeeData.shiftDetails[dateKey]?.length > 0) {
                                    employeeData.leaves.push({
                                        date: dateKey,
                                        type: leave.leaveType?.name || 'Leave',
                                        isHalfDay: consumedLeave.halfDay,
                                        reason: consumedLeave.reason
                                    });

                                    // Adjust hours based on leave type
                                    if (consumedLeave.halfDay) {
                                        // Half day - reduce hours by 50%
                                        employeeData.weeklyHours[dateKey] *= 0.5;
                                        employeeData.shiftDetails[dateKey].forEach(shift => {
                                            shift.hours *= 0.5;
                                        });
                                    } else {
                                        // Full day - zero out hours
                                        employeeData.totalHours -= employeeData.weeklyHours[dateKey];
                                        employeeData.weeklyHours[dateKey] = 0;
                                        employeeData.shiftDetails[dateKey].forEach(shift => {
                                            shift.hours = 0;
                                        });
                                    }
                                }
                            }
                        }
                    }
                }
            }

            // Only include employees with shifts
            if (employeeData.totalHours > 0) {
                result.push(employeeData);
            }
        }

        res.status(200).json({
            weekStart: weekStart.toISOString(),
            weekEnd: weekEnd.toISOString(),
            employees: result
        });

    } catch (error) {
        console.error('Error in getCurrentWeekShiftSchedules:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve shift schedules',
            error: error.message,
        });
    }
};

exports.getCurrentMonthShiftSchedules = async (req, res) => {
    try {
        const vendorId = req.payload.reqUserId;

        // Calculate the start and end dates for the current month
        const startOfMonth = moment().startOf('month').toDate();
        const endOfMonth = moment().endOf('month').toDate();

        // Step 1: Fetch all employees and their shifts
        const employeesWithShifts = await Employee.aggregate([
            {
                $match: {
                    userId: new mongoose.Types.ObjectId(vendorId),
                },
            },
            {
                $lookup: {
                    from: 'shifts',
                    localField: 'shift',
                    foreignField: '_id',
                    as: 'shifts',
                },
            },
            {
                $unwind: {
                    path: '$shifts',
                    preserveNullAndEmptyArrays: true,
                },
            },
            {
                $group: {
                    _id: '$_id',
                    name: {
                        $first: {
                            $concat: ['$firstName', ' ', '$lastName'], // Combine firstName and lastName
                        },
                    },
                    shifts: { $push: '$shifts' },
                },
            },
        ]);

        // Step 2: Fetch leaves for the current month
        const consumedLeaves = await leaveManagement.aggregate([
            {
                $match: {
                    vendorId: new mongoose.Types.ObjectId(vendorId),
                },
            },
            {
                $unwind: '$leaves',
            },
            {
                $unwind: '$leaves.consumed',
            },
            {
                $match: {
                    'leaves.consumed.startDate': { $gte: startOfMonth, $lte: endOfMonth },
                },
            },
            {
                $lookup: {
                    from: 'employees',
                    localField: 'employeeId',
                    foreignField: '_id',
                    as: 'employeeInfo',
                },
            },
            {
                $unwind: '$employeeInfo',
            },
            {
                $lookup: {
                    from: 'leavetypes',
                    localField: 'leaves.leaveType',
                    foreignField: '_id',
                    as: 'leaveTypeInfo',
                },
            },
            {
                $unwind: '$leaveTypeInfo',
            },
            {
                $project: {
                    _id: 1,
                    employeeId: '$employeeId',
                    employeeName: {
                        $concat: ['$employeeInfo.firstName', ' ', '$employeeInfo.lastName'],
                    },
                    leaveType: '$leaveTypeInfo.name',
                    startDate: '$leaves.consumed.startDate',
                    endDate: '$leaves.consumed.endDate',
                    reason: '$leaves.consumed.reason',
                },
            },
        ]);

        // Step 3: Prepare data for each date in the month
        const daysInMonth = moment().daysInMonth();
        const monthlySummary = {};

        for (let day = 1; day <= daysInMonth; day++) {
            const date = moment().startOf('month').add(day - 1, 'days').format('YYYY-MM-DD');
            const employeesOnShift = [];
            const employeesOnLeave = [];

            // Filter shifts for this day
            employeesWithShifts.forEach((employee) => {
                employee.shifts.forEach((shift) => {
                    const shiftDate = moment(shift.date).format('YYYY-MM-DD');

                    employeesOnShift.push({
                        employeeId: employee._id,
                        name: employee.name,
                        shift: shift,
                    });
                });
            });

            // Filter leaves for this day
            consumedLeaves.forEach((leave) => {
                const leaveStartDate = moment(leave.startDate).format('YYYY-MM-DD');
                const leaveEndDate = moment(leave.endDate).format('YYYY-MM-DD');
                if (date >= leaveStartDate && date <= leaveEndDate) {
                    employeesOnLeave.push({
                        employeeId: leave.employeeId,
                        name: leave.employeeName,
                        leaveType: leave.leaveType,
                        reason: leave.reason,
                    });
                }
            });

            monthlySummary[date] = {
                date,
                employeeCount: employeesOnShift.length,
                holidayCount: employeesOnLeave.length,
                shifts: employeesOnShift,
                holidays: employeesOnLeave,
            };
        }

        res.status(200).json({
            success: true,
            message: 'Monthly shift schedules and leave summary retrieved successfully',
            data: monthlySummary,
        });
    } catch (error) {
        console.error('Error fetching monthly shift schedule summary:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve monthly shift schedules and leave summary',
            error: error.message,
        });
    }
};



exports.overTimeCalculations = async (req, res) => {
    try {
        let { reqUserId } = req.payload;
        const users = await Employee.find({ userId: reqUserId }).select('_id'); // Get only the IDs of the employees
        const userIds = users.map(user => user._id); // Extract the array of IDs

        const data = await Tracking.aggregate([
            {
                $match: {
                    userId: { $in: userIds }, // Ensure we only get data for the specified user IDs
                },
            },
            {
                $lookup: {
                    from: 'jobs', // The collection where job details are stored
                    localField: 'jobId', // Field in Tracking collection
                    foreignField: '_id', // Field in jobs collection
                    as: 'jobDetails', // Alias for the lookup result
                },
            },
            {
                $unwind: {
                    path: '$jobDetails'
                },
            },
            {
                $lookup: {
                    from: 'employees', // The collection where employee details are stored
                    localField: 'userId', // Field in Tracking collection
                    foreignField: '_id', // Field in employees collection
                    as: 'employeeDetails', // Alias for the lookup result
                },
            },
            {
                $unwind: {
                    path: '$employeeDetails',
                    preserveNullAndEmptyArrays: true, // Include documents with no matching employee details
                },
            },
            {
                $group: {
                    _id: {
                        date: { $dateToString: { format: '%Y-%m-%d', date: '$startTime' } },
                        jobId: '$jobId',
                    },
                    jobName: { $first: '$jobDetails.name' },
                    firstName: { $first: '$employeeDetails.firstName' },
                    lastName: { $first: '$employeeDetails.lastName' },
                    employeeId: { $first: '$employeeDetails.empId' },
                    ssnNo: { $first: '$employeeDetails.ssnNo' },
                    totalDuration: { $first: '$elapsedTime' },
                    totalBreakDuration: { $first: '$totalBreakTime' },
                },
            },
            {
                $addFields: {
                    formattedDate: {
                        $dateToString: {
                            format: '%d %b %Y', // Convert to "2 Feb 2025" format
                            date: { $dateFromString: { dateString: '$_id.date' } },
                        },
                    },
                    originalDate: { $dateFromString: { dateString: '$_id.date' } }, // Convert for sorting
                },
            },
            {
                $project: {
                    _id: 0,
                    jobName: 1,
                    firstName: 1,
                    lastName: 1,
                    employeeId: 1,
                    originalDate: 1,
                    rate: 1,
                    ssnNo: 1,
                    date: '$formattedDate',
                    totalDuration: 1,
                    totalBreakDuration: 1
                },
            },
            {
                $sort: { originalDate: -1 },
            },
        ]);

        return res.status(200).json({ msg: "Ok", success: true, data: data });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};


exports.getCategoriesList = async (req, res) => {
    try {
        const categories = await Category.find({ status: 'Active' }).exec();
        res.status(200).json(categories);
    } catch (error) {
        console.error('Error fetching categories:', error.message);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

exports.subscriptionPlans = async (req, res) => {
    try {
        const plans = await Membership.aggregate([
            {
                $lookup: {
                    from: 'subscriptions',
                    localField: '_id',
                    foreignField: 'membershipId',
                    as: 'subscriptions'
                }
            },
            {
                $addFields: {
                    activeSubscriberCount: {
                        $size: {
                            $filter: {
                                input: '$subscriptions',
                                as: 'subscription',
                                cond: { $eq: ['$$subscription.status', 'Active'] }
                            }
                        }
                    }
                }
            },
            {
                $project: {
                    title: 1,
                    price: 1,
                    type: 1,
                    paymentTerm: 1,
                    planDate: 1,
                    description: 1,
                    activeSubscriberCount: 1,
                    monthlyPrice: {
                        $cond: {
                            if: { $eq: ['$paymentTerm', 'Monthly'] },
                            then: '$price',
                            else: {
                                $cond: {
                                    if: { $eq: ['$paymentTerm', 'Quarterly'] },
                                    then: { $divide: ['$price', 3] },
                                    else: { $divide: ['$price', 12] }
                                }
                            }
                        }
                    },
                    yearlyPrice: {
                        $cond: {
                            if: { $eq: ['$paymentTerm', 'Monthly'] },
                            then: { $multiply: ['$price', 12] },
                            else: {
                                $cond: {
                                    if: { $eq: ['$paymentTerm', 'Quarterly'] },
                                    then: { $multiply: ['$price', 4] },
                                    else: '$price'
                                }
                            }
                        }
                    }
                }
            }
        ]);
        res.status(200).json(plans);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch plans.', error: error.message });
    }
};

exports.createCheckoutSession = async (req, res) => {
    const { planId } = req.body;

    // Fetch the plan details from your database
    const plan = await Membership.findById(planId);

    if (!plan) {
        return res.status(404).json({ message: 'Plan not found' });
    }
    //console.log('plan : ', plan)
    try {
        // Create a Stripe Checkout session
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [{
                price: plan.stripePlanId, // Use the Stripe price ID for recurring payments
                quantity: 1,
            }],
            mode: 'subscription', // Set to 'payment' for one-time payments
            success_url: `${process.env.CLIENT_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${process.env.CLIENT_URL}/cancel`,
        });

        res.json({ id: session.id });
    } catch (error) {
        res.status(500).json({ message: 'Failed to create checkout session', error: error.message });
    }
};

exports.handleSuccessStripe = async (req, res) => {
    const { sessionId } = req.body;
    let { reqUserId } = req.payload;
    //console.log('reqUserId : ', reqUserId)
    if (!sessionId) {
        return res.status(400).json({ message: 'Session ID is required.' });
    }

    try {
        const session = await stripe.checkout.sessions.retrieve(sessionId, {
            expand: ['line_items'],
        });

        const subscriptionId = session.subscription;
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);

        const membershipPlan = await Membership.findOne({ stripePlanId: subscription.items.data[0].price.id });

        if (!membershipPlan) {
            return res.status(404).json({ message: 'Membership plan not found.' });
        }
        //console.log('subscription : ', subscription)
        const newSubscription = new Subscription({
            membershipId: membershipPlan._id,
            userId: reqUserId,
            stripeSubscriptionId: subscription.id,
            startDate: new Date(subscription.current_period_start * 1000),
            endDate: new Date(subscription.current_period_end * 1000),
            currentPeriodStart: new Date(subscription.current_period_start * 1000),
            currentPeriodEnd: new Date(subscription.current_period_end * 1000),
            isTrial: subscription.trial_end ? subscription.trial_end * 1000 > Date.now() : false,
            trialEndDate: subscription.trial_end ? new Date(subscription.trial_end * 1000) : null,
            json_response: JSON.stringify(subscription)
        });

        await newSubscription.save();

        res.status(200).json({ message: 'Subscription created successfully!', subscription: newSubscription });
    } catch (error) {
        console.error('Error creating subscription:', error.message);
        res.status(500).json({ message: 'Failed to create subscription.', error: error.message });
    }

}

exports.getCatalogues = async (req, res) => {
    try {
        const catalogues = await Catalogue.find();
        res.status(200).json(catalogues);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch catalogues.', error: error.message });
    }
};

// Get subcategories by catalogue ID
exports.getSubcategories = async (req, res) => {
    try {
        const { catalogueId } = req.params;
        const catalogue = await Catalogue.findById(catalogueId).populate('subcategories');
        if (!catalogue) {
            return res.status(404).json({ message: 'Catalogue not found.' });
        }
        res.status(200).json(catalogue.subcategories);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch subcategories.', error: error.message });
    }
};

// Get items by subcategory ID
exports.getItems = async (req, res) => {
    try {
        const { subcategoryId } = req.params;
        const subcategory = await Subcategory.findById(subcategoryId).populate('items');
        if (!subcategory) {
            return res.status(404).json({ message: 'Subcategory not found.' });
        }
        res.status(200).json(subcategory.items);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch items.', error: error.message });
    }
};

exports.getReverseCategoryData = async (req, res) => {
    try {
        const itemId = req.params.itemId;

        // Fetch the item
        const item = await Item.findById(itemId);
        if (!item) {
            return res.status(404).json({ message: 'Item not found' });
        }
        //console.log('item:-----------------', item);
        // Fetch the subcategory associated with this item
        const subcategory = await Subcategory.findOne({ items: itemId });
        if (!subcategory) {
            return res.status(404).json({ message: 'Subcategory not found' });
        }

        // Fetch the catalogue associated with this subcategory
        const catalogue = await Catalogue.findOne({ subcategories: subcategory._id });
        if (!catalogue) {
            return res.status(404).json({ message: 'Catalogue not found' });
        }

        // Respond with item, subcategory, and catalogue data
        res.json({
            item,
            subcategory,
            catalogue
        });
    } catch (error) {
        console.error('Error fetching data:', error);
        res.status(500).json({ message: 'Server error' });
    }
}



exports.notificationsList = async (req, res) => {
    try {
        const { id } = req.body;
        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({ msg: 'No User found!', success: false })
        }

        const result = await Services.NotificationService.getNotificationsByUser(user._id);
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
        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({ msg: 'No User found!', success: false })
        }

        let unReadNotifications = await Services.NotificationService.getUnreadNotificationCount(user._id);
        return res.status(200).json({ msg: `Success`, success: true, unReadNotifications })
    } catch (error) {
        //console.log("error on updateProfileEmp: ", error);
        return res.status(500).json({ msg: error.message, err: error, success: false })
    }
}


exports.notificationsMarkAllAsRead = async (req, res) => {
    try {
        const { id } = req.body;
        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({ msg: 'No User found!', success: false })
        }

        const result = await Services.NotificationService.markAllAsRead(user._id);
        if (result) {
            return res.status(200).json({ msg: `Success`, success: true })
        }
        return res.status(400).json({ msg: 'Failed', success: false })
    } catch (error) {
        //console.log("error on updateProfileEmp: ", error);
        return res.status(500).json({ msg: error.message, err: error, success: false })
    }
}


exports.createChecklist = async (req, res) => {
    try {
        const { title, steps } = req.body;
        let vendorId = req.payload.reqUserId;
        // Validate the request body
        if (!title || !vendorId || !steps) {
            return res.status(400).json({ message: 'Title, vendorId, and steps are required' });
        }

        // Create a new checklist document
        const newChecklist = new checklist({
            title,
            vendorId,
            steps,
        });

        // Save the checklist to the database
        await newChecklist.save();

        // Respond with success
        res.status(201).json({
            message: 'Checklist created successfully',
            data: newChecklist,
        });
    } catch (error) {
        console.error('Error creating checklist:', error);
        res.status(500).json({ message: 'Server error' });
    }
};


exports.getAllChecklists = async (req, res) => {
    try {
        let vendorId = req.payload.reqUserId;
        const checklists = await checklist.find({ vendorId: new mongoose.Types.ObjectId(vendorId) });
        return res.status(200).json(checklists);
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

exports.updateCheckList = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, steps } = req.body;

        try {
            const updatedChecklist = await checklist.findByIdAndUpdate(
                id,
                { title, steps },
                { new: true, runValidators: true }
            );

            if (!updatedChecklist) {
                return res.status(404).json({ message: 'Checklist not found' });
            }

            res.status(200).json(updatedChecklist);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

exports.getAssignedChecklists = async (req, res) => {
    try {
        const vendorId = req.payload.reqUserId;
        if (!vendorId) {
            return res.status(400).json({ message: 'Vendor ID is required' });
        }

        // Fetch onboarding records for the given vendor ID
        const onboardingRecords = await onboardingEmployee.find({ vendorId })
            .populate({
                path: 'checklistId',
                select: 'title steps', // Include fields from the Checklist schema
                populate: {
                    path: 'steps.stepId', // Populate the steps in the checklist
                    strictPopulate: false
                },
            });

        // Check if records were found
        if (!onboardingRecords.length) {
            return res.status(200).json({ message: 'No assigned checklists found for this vendor', data: [] });
        }

        // Create an array to hold the onboarding records with populated employee details
        const onboardingRecordsWithDetails = [];

        // Loop through each onboarding record
        for (const record of onboardingRecords) {
            // Fetch employee details
            const employee = await Employee.findById(record.employeeId);
            //console.log(employee)
            const totalRatings = record.stepsStatus.reduce((acc, step) => acc + (step.rating || 0), 0);
            const ratingCount = record.stepsStatus.length;
            const overallRating = ratingCount > 0 ? (totalRatings / ratingCount).toFixed(2) : 0; // Calculate average


            // Add the populated details to the onboarding record
            onboardingRecordsWithDetails.push({
                employee: employee,
                checklist: record.checklistId,
                stepsStatus: record.stepsStatus,
                _id: record._id,
                overallRating,
                updatedAt: record.updatedAt
            });
        }

        // Respond with the assigned checklists and populated employee details
        res.status(200).json({
            message: 'Assigned checklists and employee details retrieved successfully',
            data: onboardingRecordsWithDetails,
        });
    } catch (error) {
        console.error('Error fetching assigned checklists:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.addEmployeeChecklist = async (req, res) => {
    try {
        const { employeeId, checklistId } = req.body;
        const vendorId = req.payload.reqUserId;

        if (!employeeId || !checklistId || checklistId.length === 0) {
            return res.status(400).json({ message: 'Employee ID and at least one checklist are required' });
        }

        // Loop through each checklist ID to create an entry in the OnboardingEmployee schema
        const onboardingEntries = [];
        for (const id of checklistId) {
            // Find the checklist details if needed (e.g., steps)
            const checklistModel = await checklist.findById(id);

            if (!checklistModel) {
                return res.status(404).json({ message: `Checklist with ID ${id} not found` });
            }

            // Initialize stepsStatus for each checklist
            const stepsStatus = checklistModel.steps.map(step => ({
                stepId: step._id, // Ensure step has _id or adjust accordingly
                document: null, // Default to null or adjust as needed
                isClosed: false,
                rating: null // Default to null or adjust as needed
            }));

            // Create an onboarding entry
            onboardingEntries.push({
                employeeId,
                vendorId,
                checklistId: id,
                stepsStatus
            });
        }

        // Insert the entries into the OnboardingEmployee schema
        await onboardingEmployee.insertMany(onboardingEntries);

        // Send response
        res.status(201).json({
            message: 'Employee checklists successfully added!',
            data: onboardingEntries
        });
    } catch (error) {
        console.error('Error adding employee checklist:', error);
        res.status(500).json({ message: 'Server error' });
    }
};


exports.deleteOnboardingCheckList = async (req, res) => {
    try {
        const { id } = req.body;
        const vendorId = req.payload.reqUserId;
        //console.log({ id, vendorId });
        if (!id) {
            return res.status(400).json({ message: 'Onboarding ID is required' });
        }

        const deletedRecord = await onboardingEmployee.findByIdAndDelete(id);

        if (!deletedRecord) {
            return res.status(404).json({ message: 'Onboarding record not found' });
        }

        res.status(200).json({ message: 'Onboarding record deleted successfully' });
    } catch (error) {
        console.error('Error deleting onboarding record:', error);
        res.status(500).json({ message: 'Server error' });
    }
};


exports.updateEmployeeChecklistSteps = async (req, res) => {
    try {
        const { employeeId, checklistId } = req.body;
        const vendorId = req.payload.reqUserId;

        // Initialize an empty array for stepsStatus
        const stepsStatus = [];

        // Loop through req.body to populate stepsStatus array
        Object.keys(req.body).forEach(key => {
            const match = key.match(/^stepsStatus\[(\d+)\]\[(\w+)\]$/);
            if (match) {
                const idx = parseInt(match[1], 10);
                const field = match[2];

                // Initialize stepsStatus entry if it doesn't exist
                if (!stepsStatus[idx]) {
                    stepsStatus[idx] = {};
                }

                // Set default rating to 1 if not provided or less than 1
                if (field === 'rating' && (req.body[key] < 1 || req.body[key] === undefined)) {
                    stepsStatus[idx][field] = 0; // Set default rating
                } else {
                    stepsStatus[idx][field] = req.body[key];
                }
            }
        });

        // Log to confirm the structure of stepsStatus
        //console.log('Parsed stepsStatus:', stepsStatus);

        // Find or create employee checklist record
        let employeeChecklist = await onboardingEmployee.findOne({ employeeId, vendorId });

        if (!employeeChecklist) {
            employeeChecklist = new onboardingEmployee({
                employeeId,
                vendorId,
                checklistId,
                stepsStatus,
            });
        } else {
            // Update existing record
            employeeChecklist.stepsStatus = stepsStatus;
        }

        // Process uploaded files if applicable
        if (req.files) {
            for (let idx = 0; idx < stepsStatus.length; idx++) {
                const fileFieldName = `stepsStatus[${idx}][document]`;
                if (req.files[fileFieldName]) {
                    const file = req.files[fileFieldName];
                    const date = new Date();
                    const fileName = `checklist-${date.getTime()}${path.extname(file.name)}`.replace(/\s+/g, '');
                    const filePath = path.join(__dirname, '..', 'assets', 'documents', fileName);
                    const fileSize = file.size;
                    // Save the file
                    await file.mv(filePath);

                    // Ensure stepsStatus has a document field to update
                    if (stepsStatus[idx]) {
                        employeeChecklist.stepsStatus[idx].document = fileName; // Update document path
                        employeeChecklist.stepsStatus[idx].fileSize = fileSize;
                    }
                }

            }
        }
        //console.log(employeeChecklist, ' employeeChecklist')
        // Save the checklist record after processing files
        await employeeChecklist.save();
        res.status(200).json({ message: 'Checklist updated successfully' });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ message: 'Error updating checklist', error });
    }
};


exports.getEmployeesJobsTrackingRequest = async (req, res) => {
    let { reqUserId } = req.payload;
    try {
        const myPassedId = reqUserId;
        const result = await Employee.aggregate([
            {
                $match: { userId: new mongoose.Types.ObjectId(myPassedId) }
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
                $unwind: "$jobData"  // Flatten the trackingData array to filter the data
            },
            {
                $project: {
                    employeeId: "$_id",            // Include employee id
                    employeeName: {                     // Concatenate first name and last name
                        $concat: ["$firstName", " ", "$lastName"]
                    },           // Include employee name
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


exports.trackerRequestApprove = async (req, res) => {
    const { trackingId } = req.body;
    const { reqUserId } = req.payload;
    try {
        const trackingRequest = await Tracking.findById({ _id: trackingId });

        if (!trackingRequest) {
            return res.status(404).json({ message: 'Tracking request not found' });
        }
        trackingRequest.status = "approved";
        // await trackingRequest.save();
        //console.log(trackingRequest);
        if (trackingRequest.status == 'approved') {
            let employee = await Employee.findById({ _id: trackingRequest.userId });
            let vendor = await User.findById({ _id: reqUserId });
            await Services.NotificationService.sendNotification(employee._id, null, 'Time Card Approved!', `Your Time Card for date  ${moment(trackingRequest?.sessionDate).format('MMMM Do YYYY ')} is approved by ${vendor.name}.`);
        }
        trackingRequest.save();

        res.status(200).json({ message: 'Tracking request approved', trackingRequest });
    } catch (error) {
        res.status(500).json({ message: 'Error approving tracking request', error });
    }
};

exports.handleTimeTrackerRequest = async (req, res) => {
    try {
        const { vendorId, trackingRequest } = req.body;
        const autoApproval = await AutoApproval.findOne({ vendorId });
        if (!autoApproval) {
            return res.status(404).json({ message: "No auto-approval settings found" });
        }

        let shouldAutoApprove = false;
        const currentDate = new Date(trackingRequest.sessionDate);

        // Check if the auto-approval criteria match the current request
        if (autoApproval.approvalType === 'weekly') {
            const dayOfWeek = currentDate.toLocaleString('en-US', { weekday: 'long' });
            if (dayOfWeek === autoApproval.dayOfWeek) {
                shouldAutoApprove = true;
            }
        } else if (autoApproval.approvalType === 'monthly') {
            if (currentDate.getDate() === autoApproval.dateOfMonth) {
                shouldAutoApprove = true;
            }
        }

        if (shouldAutoApprove) {
            // Auto-approve the request
            trackingRequest.status = 'approved';
            await trackingRequest.save();

            return res.status(200).json({ message: 'Request auto-approved', trackingRequest });
        } else {
            // Proceed with normal manual approval flow
            return res.status(200).json({ message: 'Manual approval required', trackingRequest });
        }

    } catch (error) {
        res.status(500).json({ message: 'Error processing request', error });
    }
};

exports.getEmployeeList = async (req, res) => {
    try {
        
        const result = await Employee.FindOne([
            {
                $match: { userId: req.user._id }
            }
        ]);


        return res.status(200).json({ msg: "Ok", success: true, result });
    } catch (error) {
        //console.log("Error fetching employee job tracking: ", error);
        return res.status(500).json({ msg: error.message, err: error, success: false });
    }
}

// exports.getEmployeeList = async (req, res) => {
//     try {
//         const result = await Employee.find({ userId: req.user._id }); // <-- find, not FindOne
//         return res.status(200).json({ msg: "Ok", success: true, result });
//     } catch (error) {
//         return res.status(500).json({ msg: error.message, err: error, success: false });
//     }
// };



exports.getProfile = async (req, res) => {
    try {
        
        return res.status(200).json({ msg: "Ok", success: true, user : req.user});
    } catch (error) {
        //console.log("Error fetching employee job tracking: ", error);
        return res.status(500).json({ msg: error.message, err: error, success: false });
    }
}
