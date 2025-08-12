const Employee = require("../model/Employee");
const Job = require("../model/Job");
const Tracking = require("../model/Tracking");
const User = require("../model/User");
const { checkUser, checkEmp, checkJob } = require("../util/customQuery");
const { gettingJobsByVendorId } = require("../util/gettingJobs");
const { calculateEarnings } = require("../util/utills");
const Services = require('./../services');
const mongoose = require('mongoose');

// this api for vendor
exports.getAllJobs = async (req, res) => {
    const id = req.params.id
    try {
        const checkUser = await User.findById(id)
        if (!checkUser) {
            return res.status(404).json({ msg: 'No User found!', success: false })
        }
        const result = await Job.find({ userId: id }).select("-subJob -__v -updatedAt -userId").populate('shift').sort({ createdAt: -1 })
        if (result) {
            return res.status(200).json({ msg: 'Ok', success: true, result })
        }
        return res.status(404).json({ msg: 'No jobs found!', success: false })
    } catch (error) {
        //console.log("error on getAllJobs: ", error);
        return res.status(500).json({ msg: error.message, err: error, success: false })
    }
}

exports.getSingleJobById = async (req, res) => {
    const id = req.params.id
    //console.log("req.params: ", id);
    try {
        const result = await Job.findById(id)
        // //console.log("");
        if (result) {
            return res.status(200).json({ msg: 'Ok', success: true, result })
        }
        return res.status(404).json({ msg: 'No jobs found!', success: false })
    } catch (error) {
        //console.log("error on getAllJobs: ", error);
        return res.status(500).json({ msg: error.message, err: error, success: false })
    }
}

// this api is also for vendor
exports.addJob = async (req, res) => {
    const id = req.body.id
    const name = req.body.name
    const overtimeAllowed = req.body.overtimeAllowed;
    const shift = req.body.selectedShift;
    try {
        const checkUser = await User.findById(id)
        if (!checkUser) {
            return res.status(400).json({ msg: 'No User found!', success: false })
        }
        const result = await Job.create({ userId: id, name: name,overtimeAllowed:overtimeAllowed ,shift })
        if (!result) {
            return res.status(400).json({ msg: 'Failed to create job!', success: false })
        }
        return res.status(200).json({ msg: 'Job created successfully.', success: true, result })
    } catch (error) {
        //console.log("error on addJob: ", error);
        return res.status(500).json({ msg: error.message, err: error, success: false })
    }
}

exports.assignShift = async (req, res) => {
    const {id} = req.params;
    const {shiftId ,vendorId} = req.body;
    // console.log(id,'id')
    try {
        const checkUser = await User.findById(vendorId)
        if (!checkUser) {
            return res.status(400).json({ msg: 'No User found!', success: false })
        }
        const updatedJob = await Job.findByIdAndUpdate(
            id,
            { shift: shiftId },
            { new: true } // Return the updated document
        );

        if (!updatedJob) {
            return res.status(400).json({ 
                msg: 'Failed to update job shift', 
                success: false 
            });
        }

        return res.status(200).json({ 
            msg: 'Job shift updated successfully', 
            success: true,
            result: updatedJob
        });
    } catch (error) {
        console.log("error on addJob: ", error);
        return res.status(500).json({ msg: error.message, err: error, success: false })
    }
}
// this api is also for vendor
exports.deleteJob = async (req, res) => {
    const id = req.params.id

    try {
        const result = await Job.findByIdAndDelete(id)
        if (result) {
            return res.status(200).json({ msg: `Job ${result?.name} deleted successfully.`, success: true })
        }
        return res.status(400).json({ msg: 'Failed to delete job!', success: false })
    } catch (error) {
        //console.log("error on deleteJob: ", error);
        return res.status(500).json({ msg: error.message, err: error, success: false })
    }
}

// this is for employee
exports.getAllJobsForEmployeeByVendorAndEmpId = async (req, res) => {
    const id = req.body.id
    const vendorId = req.body.vendorId
    try {
        if (!id) {
            return res.status(400).json({ msg: 'Employee id is required!', success: false })
        }
        if (!vendorId) {
            return res.status(400).json({ msg: 'Vendor id is required!', success: false })
        }

        const checkVendor = await User.findById({ _id: vendorId, role: 'vendor' })
        if (!checkVendor) {
            return res.status(403).json({ msg: 'Access Forbidden', success: false })
        }

        const checkEmp = await Employee.findOne({ _id: id, userId: vendorId })
        if (!checkEmp) {
            return res.status(403).json({ msg: 'Access Forbidden', success: false })
        }

        const result = await Job.find({ userId: vendorId })
        if (result) {
            return res.status(200).json({ msg: 'Ok', success: true, result })
        }

        return res.status(404).json({ msg: 'No job data found!', success: false })
    } catch (error) {
        //console.log("error on getAllJobsForEmployeeByVendorAndEmpId: ", error);
        return res.status(500).json({ msg: error.message, err: error, success: false })
    }
}


exports.assignJobToEmpy = async (req, res) => {
    const venderId = req.body.id
    const empId = req.body.empId
    const jobId = req.body.jobId
    try {

        const checkUser = await User.findById(venderId);
        if (!checkUser) {
            return res.status(403).json({ msg: 'Access Forbidden', success: false })
        }

        const checkEmp = await Employee.findById(empId)
        // if (!checkEmp.rate) {
        //     return res.status(400).json({ msg: 'Please update and fill necessary fileds of employee!', success: false })
        // }

        const checkJob = await Job.findById(jobId)
        if (!checkJob) {
            return res.status(404).json({ msg: 'No job found!', success: false })
        }
        const checkEmpJob = await Employee.findOne({ _id: empId, jobId: { $elemMatch: { $eq: jobId } } });
        if (checkEmpJob) {
            return res.status(400).json({ msg: `Job ${checkJob?.name} is already assign!`, success: false })
        }
        const result = await Employee.findByIdAndUpdate({ _id: empId }, { $push: { jobId: jobId } })
        if (result) {
            await Services.NotificationService.sendNotification(empId, checkEmp.device_token, 'New Job Assigned!', `Job ${checkJob?.name} is assigned to you by ${checkUser.name}.`);
            return res.status(200).json({ msg: `Job ${checkJob?.name} added successfully.`, success: true })
        }
        return res.status(400).json({ msg: `Failed to assign job!`, success: false })
    } catch (error) {
        //console.log("error on assignJobToEmpy: ", error);
        return res.status(500).json({ msg: error.message, err: error, success: false })
    }
}

exports.markJobCompleted = async (req, res) => {
    const { vendorId } = req.body;
    const jobId = req.params.jobId;
    const SECONDS_IN_AN_HOUR = 3600; // 1 hour = 3600 seconds
    const MAX_REGULAR_HOURS_IN_SECONDS = 40 * SECONDS_IN_AN_HOUR; // 40 hours in seconds
    const SECONDS_IN_A_WEEK = 40 * SECONDS_IN_AN_HOUR; // Weekly hours in seconds


    try {

        const checkUser = await User.findById(vendorId);
        if (!checkUser) return res.status(403).json({ msg: 'Access Forbidden', success: false });

        const jobObjectId = new mongoose.Types.ObjectId(jobId);

        const job = await Job.findByIdAndUpdate(jobObjectId, { status: 'closed' }, { new: true });
        if (!job) {
            throw new Error('Job not found');
        }

        const employees = await Employee.find({ jobId: { $in: [jobId] } });
        if (employees.length) {
            await Services.NotificationService.sendNotification(employees[0]._id, employees[0]?.device_token, 'Job is Completed!', ` ${checkUser.name} has marked the Job ${checkJob?.name} as Completed.`);

            const startOfDay = new Date().setHours(0, 0, 0, 0);
            const tracking = await Tracking.findOne({ userId: job.userId, jobId: jobObjectId, sessionDate: startOfDay });

            if (tracking) {
                const now = Date.now();

                if (tracking.isTimerRunning) {
                    const timeElapsed = (now - new Date(tracking.lastStartTime).getTime()) / 1000; // Time in seconds

                    tracking.elapsedTime += timeElapsed;
                    tracking.isTimerRunning = false;
                    tracking.stoppedTime = now;
                }

                const totalWorkedSeconds = Math.floor(tracking.elapsedTime);
                let amount = 0;

                if (totalWorkedSeconds <= SECONDS_IN_A_WEEK) {
                    amount = calculateEarnings(job.rate, totalWorkedSeconds);
                } else {
                    amount = calculateEarnings(job.rate, SECONDS_IN_A_WEEK);

                    const extraTimeWorked = totalWorkedSeconds - MAX_REGULAR_HOURS_IN_SECONDS;
                    const overtimePayment = calculateEarnings(job.overTimeRate, extraTimeWorked);

                    amount += overtimePayment;
                }

                // Update the tracking record with the calculated amount
                await Tracking.findByIdAndUpdate(tracking._id, { amount });


            }
        }
        return res.status(200).json({ msg: `Job ${checkJob?.name} has Marked Completed.`, success: true })
    } catch (error) {
        //console.log("error on assignJobToEmpy: ", error);
        return res.status(500).json({ msg: error.message, err: error, success: false })
    }
}


exports.getAllJobsByEmpId = async (req, res) => {
    const id = req.params.id

    try {
        const result = await Employee.findById(id).populate("jobId")
        if (result) {
            
            return res.status(200).json({ msg: 'Ok', success: true, result })
        }
        return res.status(404).json({ msg: 'No employee data found!', success: false })
    } catch (error) {
        //console.log("error on getAllJobsByEmpId: ", error);
        return res.status(500).json({ msg: error.message, err: error, success: false })
    }
}

exports.getActiveJobs = async (req, res) => {
    const id = req.params.id
    const { status } = req.query

    try {
        const checkEmp = await Employee.findById(id)
        if (!checkEmp) {
            return res.status(403).json({ msg: 'Access Forbiden!', success: fales })
        }
        const result = await Tracking.find({ startTime: { $exists: true }, endTime: { $exists: status == 'active' ? false : true } }).populate('jobId')
        if (result) {
            return res.status(200).json({ msg: 'Ok', success: true, result })
        }
        return res.status(404).json({ msg: 'No Jobs found!', success: false })
    } catch (error) {
        //console.log("error on getActiveJobs: ", error);
        return res.status(500).json({ msg: error.message, err: error, success: false })
    }
}