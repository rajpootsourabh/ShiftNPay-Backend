const Employee = require("../model/Employee");
const Tracking = require("../model/Tracking");
const User = require("../model/User");
const Job = require("../model/Job");
const mongoose = require("mongoose");
const moment = require("moment");
const { calculateEarnings } = require("../util/utills");
const { calculateWeeklyHours } = require("../util/calculation");
exports.getSingleTrackingById = async (req, res) => {
    const id = req.params.id;
    // console.log("req.params: ", id);
    try {
        const result = await Tracking.findById(id);
        // console.log("");
        if (result) {
            return res.status(200).json({ msg: "Ok", success: true, result });
        }
        return res.status(404).json({ msg: "No Tracking found!", success: false });
    } catch (error) {
        console.log("error on getSingleTrackingById: ", error);
        return res
            .status(500)
            .json({ msg: error.message, err: error, success: false });
    }
};

exports.getTrackingTimeByUserId = async (req, res) => {
    const id = req.params.id;
    try {
        if (!id) {
            return res.status(400).json({ msg: "Id is required!", success: false });
        }

        const checkUser = await Employee.findOne({ _id: id });
        
        if (!checkUser) {
            return res
                .status(403)
                .json({ msg: "Unauthorized Access!", success: false });
        }

        const startOfDay = new Date().setHours(0, 0, 0, 0);
        const endOfDay = new Date().setHours(23, 59, 59, 999);

        const result = await Tracking.aggregate([
            {
                $match: {
                    userId: checkUser._id,
                    startTime: { $gte: new Date(startOfDay), $lt: new Date(endOfDay) }
                }
            },
            
            {
                $group: {
                    _id: "$jobId",
                    latestTracking: { $first: "$$ROOT" }
                }
            },
            {
                $lookup: {
                    from: "jobs", // Assuming the jobs collection is named "jobs"
                    localField: "_id",
                    foreignField: "_id",
                    as: "jobDetails"
                }
            },
            {
                $unwind: "$jobDetails"
            },
            {
                $project: {
                    _id: 0, // Exclude default _id field if not needed
                    jobId: "$_id",
                    userId: "$latestTracking.userId",
                    startTime: "$latestTracking.startTime",
                    endTime: "$latestTracking.endTime",
                    lastStartTime: "$latestTracking.lastStartTime",
                    isTimerRunning: "$latestTracking.isTimerRunning",
                    elapsedTime: "$latestTracking.elapsedTime",
                    stoppedTime: "$latestTracking.stoppedTime",
                    count: "$latestTracking.count",
                    amount: "$latestTracking.amount",
                    overAmount: "$latestTracking.overAmount",
                    createdAt: "$latestTracking.createdAt",
                    jobDetails: {
                        _id: "$jobDetails._id",
                        name: "$jobDetails.name",
                        userId: "$jobDetails.userId",
                        subJob: "$jobDetails.subJob"
                    }
                }
            },
            {
                $sort: { createdAt: -1 }
            }
        ]);

        if (!result || result.length === 0) {
            return res
                .status(404)
                .json({ msg: "No time tracking found!", success: false });
        }

        return res.status(200).json({ msg: "Ok", success: true, result });
    } catch (error) {
        console.log("error on getTrackingTimeByUserId: ", error);
        return res
            .status(500)
            .json({ msg: error.message, err: error, success: false });
    }
};


exports.createTrackingTime = async (req, res) => {
    try {
        const { userId, jobId } = req.body;
        const now = new Date();

        const checkUser = await Employee.findById(userId);
        if (!checkUser) {
            return res.status(403).json({ msg: "Unauthorized Access!", success: false });
        }
        const startOfDay = new Date().setHours(0, 0, 0, 0);
        let tracking = await Tracking.findOne({ userId, jobId, sessionDate: startOfDay });

        if (!tracking) {
            tracking = new Tracking({
                userId,
                jobId,
                lastStartTime: now,
                elapsedTime: 0,
                isTimerRunning: true,
                sessionDate: startOfDay, // set to the start of the current day
                startTime: new Date(),
                elapsedTime: 0,
                overAmount: 0
            });
        } else if (!tracking.isTimerRunning) {
            // Resume tracking
            tracking.isTimerRunning = true;
            tracking.lastStartTime = now; // Set the time when it is resumed
        } else {
            // Restart tracking
            tracking.lastStartTime = now;
            tracking.elapsedTime = 0; // Reset elapsed time
        }

        await tracking.save();

        return res.status(200).json({
            msg: `Timer started successfully.`,
            success: true,
            result: tracking,
        });
    } catch (error) {
        console.error("Error in createTrackingTime: ", error);
        return res.status(500).json({ msg: "Internal Server Error", error: error.message, success: false });
    }
};

exports.getcurrentTimeOfTracker = async (req, res) => {
    try {
        const { userId, jobId } = req.params;
        const startOfDay = new Date().setHours(0, 0, 0, 0);
        let tracking = await Tracking.findOne({ userId, jobId, sessionDate: startOfDay });
        console.log('tracking : ', tracking)

        if (tracking) {
            let currentTime = tracking.elapsedTime;

            if (tracking.isTimerRunning) {
                const now = Date.now();
                const timeElapsed = (now - new Date(tracking.lastStartTime).getTime()) / 1000; // Time in seconds
                currentTime += timeElapsed;
            }

            return res.status(200).json({
                msg: "Ok",
                success: true,
                ...tracking.toObject(),
    elapsedTime: currentTime
            });
        } else {
            return res.status(404).json({ msg: "Timer not found", success: false });
        }
    } catch (error) {
        console.error("Error in getcurrentTimeOfTracker: ", error);
        return res.status(500).json({ msg: "Internal Server Error", error: error.message, success: false });
    }
};

exports.updateTrackingTime = async (req, res) => {
    try {
        const { userId, jobId } = req.body;
        const SECONDS_IN_AN_HOUR = 3600; // 1 hour = 3600 seconds
        const MAX_REGULAR_HOURS_IN_SECONDS = 40 * SECONDS_IN_AN_HOUR; // 40 hours in seconds
        const secondsInaWeek = 40 * 3600;
        const now = Date.now();
        // let totalSecondsThisWeek = await calculateWeeklyHours(
        //     userId
        // );
        // let totalWorkedSeconds = totalSecondsThisWeek[0]?.totalSeconds;
        //     totalWorkedSeconds = Math.floor(totalWorkedSeconds);

        const startOfDay = new Date().setHours(0, 0, 0, 0);
        let tracking = await Tracking.findOne({ userId, jobId, sessionDate: startOfDay });
        if (tracking) {
            const checkEmp = await Employee.findOne({ _id: tracking?.userId });
            if (!checkEmp) {
                return res.status(404).json({ msg: 'Employee data not found!', success: false })
            }
            if (tracking.isTimerRunning) {
                const timeElapsed = (now - new Date(tracking.lastStartTime).getTime()) / 1000; // Time in seconds

                tracking.elapsedTime += timeElapsed;
                tracking.isTimerRunning = false;
                tracking.stoppedTime = now;
            }

            await tracking.save();
            let amount = 0;
            let totalWorkedSeconds = Math.floor(tracking.elapsedTime);
            console.log("count: ", totalWorkedSeconds);

            

            

            console.log("totalWorkedSeconds  :", totalWorkedSeconds);
            if (totalWorkedSeconds <= secondsInaWeek) {
                console.log("calculating if working hours are less then 40 hours for the week");
                amount = calculateEarnings(checkEmp.rate, totalWorkedSeconds);
            } else {
                console.log("Calculating 40 hours base price for the week if limit exceeds");

                amount = calculateEarnings(checkEmp.rate, totalWorkedSeconds);
                console.log(`Amount (total with extra time over the allowed hours : ${totalWorkedSeconds / 3600}): `, amount);

                extraTimeWorked = totalWorkedSeconds - MAX_REGULAR_HOURS_IN_SECONDS;
                console.log(`Extra time worked: ${extraTimeWorked / 3600} hour`);


                let Overtimepayment = calculateEarnings(checkEmp.overTimeRate, extraTimeWorked);
                console.log('Amount (Extra hours): ', Overtimepayment);

                amount = Number(amount) + Number(Overtimepayment);
                console.log('Amount (including overtime): ', amount);
            }

            console.log('Amount (after everything): ', amount);

            const result = await Tracking.findByIdAndUpdate(
                { _id: tracking._id },
                { amount }
            );
            if (!result) {
                return res
                    .status(400)
                    .json({ msg: "Failed to update traking time!", success: false });
            }
            return res.status(200).json({ msg: "Timer paused successfully", success: true, result });
        } else {
            return res.status(404).json({ msg: "Timer not found", success: false });
        }
    } catch (error) {
        console.error("Error in updateTrackingTime: ", error);
        return res.status(500).json({ msg: "Internal Server Error", error: error.message, success: false });
    }
};

exports.getFromatedData = async (req, res) => {
    const { userId } = req.params;
    try {
        const trackingData = await Tracking.find({ userId })
            .select("-__v -jobId")
            .sort({ createdAt: -1 })
            .populate("jobId");
        // const result = await Tracking.find({ userId: id }).select("-__v -jobId").sort({ createdAt: -1 }).populate('jobId')

        const formattedData = trackingData.map((item) => {
            const start = moment(item.startTime);
            const end = moment(item.endTime);
            const duration = moment.duration(end.diff(start));

            const hours = Math.floor(duration.asHours());
            const minutes = duration.minutes();
            const seconds = duration.seconds();

            return {
                ...item._doc,
                duration: `${hours} hours, ${minutes} minutes, ${seconds} seconds`,
            };
        });

        return res.status(200).json({ result: formattedData });
    } catch (error) {
        console.error("Error fetching tracking data:", error);
        return res.status(500).json({ msg: error.message, success: false });
    }
};

exports.getAllEmpTrackingData = async (req, res) => {
    try {
        const result = await Tracking.find();
        if (result) {
            return res.status(200).json({ msg: "Ok", success: true, result });
        }
        return res
            .status(400)
            .json({ msg: "No tracking data found!", success: false });
    } catch (error) {
        console.log("error on getAllEmpTrackingData: ", error);
        return res
            .status(500)
            .json({ msg: error.message, err: error, success: false });
    }
};

exports.getAllEmpTrackingIds = async (req, res) => {
    const startDate = req.query.startDate;
    const endDate = req.query.endDate;
    const ids = req.params.id;

    try {
        if (!ids || ids.length === 0) {
            return res
                .status(400)
                .json({ msg: "Please select employee!", success: false });
        }

        // Ensure ids are in array format
        const idsArray = Array.isArray(ids) ? ids : ids.split(",");

        let query = {
            userId: { $in: idsArray.map((id) => id.trim()) }, // Trim to remove any extra spaces
        };

        if (startDate && endDate) {
            query.createdAt = { $gte: new Date(startDate), $lte: new Date(endDate) };
        }

        const result = await Tracking.find(query).populate({
            path: "userId",
            select: "name _id shift rate",
            populate: { path: "shift", select: "name" },
        });
        if (result && result.length > 0) {
            return res
                .status(200)
                .json({ msg: "Data exported successfully.", success: true, result });
        }

        return res
            .status(400)
            .json({ msg: "No Tracking data found!", success: false });
    } catch (error) {
        console.log("error on getAllEmpTrackingIds: ", error);
        return res
            .status(500)
            .json({ msg: error.message, err: error, success: false });
    }
};

exports.getWeekHourByEmpId = async (req, res) => {
    const id = req.params.id;
    try {
        const checkEmp = await Employee.findById(id);
        if (!checkEmp) {
            return res
                .status(404)
                .json({ msg: "Employee not found!", success: false });
        }

        const result = await calculateWeeklyHours(checkEmp._id);
        console.log("result: ", result);
        if (result) {
            return res.status(200).json({ msg: "Ok", success: true, result });
        }
        return res
            .status(400)
            .json({ msg: "No tracking data found!", success: false });
    } catch (error) {
        console.log("error on getWeekHourByEmpId: ", error);
        return res
            .status(500)
            .json({ msg: error.message, err: error, success: false });
    }
};
