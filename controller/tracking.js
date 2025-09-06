const Employee = require("../model/Employee");
const Tracking = require("../model/Tracking");
const User = require("../model/User");
const Job = require("../model/Job");
const mongoose = require("mongoose");
const moment = require("moment");
const { calculateEarnings } = require("../util/utills");
const { calculateWeeklyHours } = require("../util/calculation");
const { getWeekStartEnd } = require("../util/functions");
const Holiday = require("../model/Holiday");
const Services = require('./../services');

exports.getSingleTrackingById = async (req, res) => {
    const id = req.params.id;
    // //console.log("req.params: ", id);
    try {
        const result = await Tracking.findById(id);
        if (result) {
            return res.status(200).json({ msg: "Ok", success: true, result });
        }
        return res.status(404).json({ msg: "No Tracking found!", success: false });
    } catch (error) {
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
            return res.status(403).json({ msg: "Unauthorized Access!", success: false });
        }

        // Get timestamps for different time periods
        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const todayMidnight = new Date();
        todayMidnight.setHours(0, 0, 0, 0);

        // First try to find running timers from last 24 hours
        let result = await Tracking.aggregate([
            {
                $match: {
                    userId: checkUser._id,
                    isTimerRunning: true,
                    $or: [
                        { startTime: { $gte: twentyFourHoursAgo } },
                        { lastStartTime: { $gte: twentyFourHoursAgo } }
                    ]
                }
            },
            {
                $sort: { createdAt: -1 }
            },
            {
                $group: {
                    _id: "$jobId",
                    latestTracking: { $first: "$$ROOT" }
                }
            },
            {
                $lookup: {
                    from: "jobs",
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
                    _id: 0,
                    jobId: "$_id",
                    userId: "$latestTracking.userId",
                    startTime: "$latestTracking.startTime",
                    endTime: "$latestTracking.endTime",
                    lastStartTime: "$latestTracking.lastStartTime",
                    isTimerRunning: "$latestTracking.isTimerRunning",
                    clockLogs: "$latestTracking.clockLogs",
                    elapsedTime: "$latestTracking.elapsedTime",
                    stoppedTime: "$latestTracking.stoppedTime",
                    count: "$latestTracking.count",
                    amount: "$latestTracking.amount",
                    overAmount: "$latestTracking.overAmount",
                    totalBreakTime: "$latestTracking.totalBreakTime",
                    createdAt: "$latestTracking.createdAt",
                    jobDetails: {
                        _id: "$jobDetails._id",
                        name: "$jobDetails.name",
                        userId: "$jobDetails.userId",
                        status: "$jobDetails.status",
                        statusByEmployee: "$jobDetails.statusByEmployee",
                        subJob: "$jobDetails.subJob"
                    }
                }
            }
        ]);

        // If no running timers from last 24 hours, check for today's timers
        if (!result || result.length === 0) {
            result = await Tracking.aggregate([
                {
                    $match: {
                        userId: checkUser._id,
                        startTime: { $gte: todayMidnight }
                    }
                },
                {
                    $sort: { createdAt: -1 }
                },
                {
                    $group: {
                        _id: "$jobId",
                        latestTracking: { $first: "$$ROOT" }
                    }
                },
                {
                    $lookup: {
                        from: "jobs",
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
                        _id: 0,
                        jobId: "$_id",
                        userId: "$latestTracking.userId",
                        startTime: "$latestTracking.startTime",
                        endTime: "$latestTracking.endTime",
                        lastStartTime: "$latestTracking.lastStartTime",
                        isTimerRunning: "$latestTracking.isTimerRunning",
                        clockLogs: "$latestTracking.clockLogs",
                        elapsedTime: "$latestTracking.elapsedTime",
                        stoppedTime: "$latestTracking.stoppedTime",
                        count: "$latestTracking.count",
                        amount: "$latestTracking.amount",
                        overAmount: "$latestTracking.overAmount",
                        totalBreakTime: "$latestTracking.totalBreakTime",
                        createdAt: "$latestTracking.createdAt",
                        jobDetails: {
                            _id: "$jobDetails._id",
                            name: "$jobDetails.name",
                            userId: "$jobDetails.userId",
                            status: "$jobDetails.status",
                            statusByEmployee: "$jobDetails.statusByEmployee",
                            subJob: "$jobDetails.subJob"
                        }
                    }
                }
            ]);
        }

        if (!result || result.length === 0) {
            return res.status(404).json({
                msg: "No timers found for today or last 24 hours!",
                success: false
            });
        }

        return res.status(200).json({
            msg: "Ok",
            success: true,
            result
        });
    } catch (error) {
        console.error("Error in getTrackingTimeByUserId: ", error);
        return res.status(500).json({
            msg: "Internal Server Error",
            error: error.message,
            success: false
        });
    }
};

exports.createTrackingTime = async (req, res) => {
    try {
        const { userId, jobId } = req.body;
        const now = new Date();

        // 1. Validate user
        const checkUser = await Employee.findById(userId);
        if (!checkUser) {
            return res.status(403).json({ msg: "Unauthorized Access!", success: false });
        }

        const twentyFourHoursAgo = new Date(now.getTime() - 12 * 60 * 60 * 1000);
        const startOfDay = new Date().setHours(0, 0, 0, 0);
        const endOfDay = new Date().setHours(23, 59, 59, 999);

        const holiday = await Holiday.findOne({
            vendorId: checkUser.userId,
            date: { $gte: startOfDay, $lte: endOfDay },
        });

        if (holiday) {
            return res.status(200).json({
                success: false,
                message: "Action not allowed: Today is a holiday.",
            });
        }

        // 3. Check shift constraints
        let shiftData = await Services.TrackerService.canStartTimer(jobId, checkUser._id);
        if (!shiftData.isAllowed) {
            return res.status(200).json({
                message: shiftData.message,
                success: false,
                result: shiftData,
            });
        }

        // 4. Find or create tracking record
        // First check for any active timers (regardless of day)
        let activeTracking = await Tracking.findOne({
            userId,
            jobId,
            isTimerRunning: true,
            $or: [
                { startTime: { $gte: twentyFourHoursAgo } },
                { lastStartTime: { $gte: twentyFourHoursAgo } }
            ]
        });

        if (activeTracking) {
            return res.status(200).json({
                msg: "Timer is already running for this job.",
                success: false,
                result: activeTracking
            });
        }

        // Check for paused/incomplete timers from previous sessions
        let tracking = await Tracking.findOne({
            userId,
            jobId,
            $or: [
                {
                    // Include records from the last 24 hours
                    createdAt: { $gte: new Date(Date.now() - 10 * 60 * 60 * 1000) }
                }
            ]
        }).sort({ createdAt: -1 }); // Get the most recent one

        if (!tracking) {
            // Create new tracking record with cross-day support
            tracking = new Tracking({
                userId,
                jobId,
                sessionDate: startOfDay, // Store in user's local time
                actualStartTime: now,        // Store exact UTC start time
                startTime: now,              // Current segment start time
                isTimerRunning: true,
                elapsedTime: 0,
                totalBreakTime: 0,
                clockLogs: [{
                    type: 'clock-in',
                    time: now,
                }],
            });
        } else if (!tracking.isTimerRunning) {
            // Resume tracking after a pause
            tracking.isTimerRunning = true;
            tracking.lastStartTime = now;
            tracking.clockLogs.push({
                type: 'clock-in',
                time: now,
            });


        } else {
            // Shouldn't normally get here due to activeTracking check above
            return res.status(200).json({
                msg: "Timer is already running.",
                success: false,
                result: tracking
            });
        }

        await tracking.save();

        return res.status(200).json({
            msg: `Timer started successfully.`,
            success: true,
            result: tracking,
        });
    } catch (error) {
        console.error("Error in createTrackingTime: ", error);
        return res.status(500).json({
            msg: "Internal Server Error",
            error: error.message,
            success: false
        });
    }
};

exports.handleBreakTime = async (req, res) => {
    try {
        const { userId, jobId, action, title } = req.body;
        const now = new Date();

        // Get current date at midnight (00:00:00)
        const todayMidnight = new Date();
        todayMidnight.setHours(0, 0, 0, 0);

        // Get yesterday at midnight (00:00:00)
        const yesterdayMidnight = new Date(todayMidnight);
        yesterdayMidnight.setDate(yesterdayMidnight.getDate() - 1);

        // 1. Find active timer that started yesterday or today
        let tracking = await Tracking.findOne({
            userId,
            jobId,
            isTimerRunning: true,
            $or: [
                {
                    // Timers that started yesterday and are still running
                    startTime: {
                        $gte: yesterdayMidnight,
                        $lt: todayMidnight
                    }
                },
                {
                    // Timers that started today and are running
                    startTime: { $gte: todayMidnight }
                }
            ]
        }).sort({ createdAt: -1 });

        if (!tracking) {
            // Check if there's any timer running beyond our window
            const oldTracking = await Tracking.findOne({
                userId,
                jobId,
                isTimerRunning: true
            });

            if (oldTracking) {
                return res.status(400).json({
                    msg: "Cannot take break - timer was started before yesterday midnight",
                    success: false
                });
            }
            return res.status(404).json({
                msg: "No active tracking found since yesterday midnight!",
                success: false
            });
        }

        // 2. Handle break actions
        if (action === "break-in") {
            if (tracking.isOnBreak) {
                return res.status(400).json({
                    msg: "Already on break!",
                    success: false
                });
            }

            tracking.clockLogs.push({
                type: "break-in",
                time: now,
                title: title
            });
            tracking.breakLastStartTime = now;
            tracking.isOnBreak = true;
            await tracking.save();

            return res.status(200).json({
                msg: "Break started successfully.",
                success: true,
                result: tracking
            });

        } else if (action === "break-out") {
            if (!tracking.isOnBreak) {
                return res.status(400).json({
                    msg: "Not currently on a break!",
                    success: false
                });
            }

            const lastBreakIn = tracking.clockLogs
                .filter(log => log.type === "break-in")
                .pop();

            if (!lastBreakIn) {
                return res.status(400).json({
                    msg: "No break-in record found!",
                    success: false
                });
            }

            const breakDuration = (now - new Date(tracking.breakLastStartTime)) / 1000;
            tracking.clockLogs.push({
                type: "break-out",
                time: now
            });
            tracking.totalBreakTime += breakDuration;
            tracking.isOnBreak = false;
            await tracking.save();

            return res.status(200).json({
                msg: `Break ended. Total break time: ${(tracking.totalBreakTime / 60).toFixed(2)} minutes`,
                success: true,
                result: tracking
            });

        } else {
            return res.status(400).json({
                msg: "Invalid action!",
                success: false
            });
        }

    } catch (error) {
        console.error("Error in handleBreakTime: ", error);
        return res.status(500).json({
            msg: "Internal Server Error",
            error: error.message,
            success: false
        });
    }
};



exports.getcurrentTimeOfTracker = async (req, res) => {
    try {
        const { userId, jobId } = req.params;

        // Get timestamp for 24 hours ago
        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const todayMidnight = new Date();
        todayMidnight.setHours(0, 0, 0, 0);
        // Find active timer running within last 24 hours
        let tracking = await Tracking.findOne({
            userId,
            jobId,
            isTimerRunning: true,
            $or: [
                {
                    // Timers that started within last 24 hours
                    startTime: { $gte: twentyFourHoursAgo }
                },
                {
                    // Or were last active within last 24 hours
                    lastStartTime: { $gte: twentyFourHoursAgo }
                }
            ]
        }).sort({ createdAt: -1 }); // Get the most recent one

        if (!tracking) {

            tracking = await Tracking.findOne({
                userId,
                jobId,
                startTime: { $gte: todayMidnight }
            }).sort({ createdAt: -1 });



        }

        let currentTime = tracking?.elapsedTime || 0;
        if (tracking?.isTimerRunning) {
            const now = Date.now();
            const lastStart = new Date(tracking.lastStartTime || tracking.startTime).getTime();
            currentTime += (now - lastStart) / 1000;
        }

        return res.status(200).json({
            msg: "Ok",
            success: true,
            ...(tracking ? tracking.toObject ? tracking.toObject() : tracking : {}),
            elapsedTime: currentTime
        });




        // Calculate current elapsed time


    } catch (error) {
        console.error("Error in getcurrentTimeOfTracker: ", error);
        return res.status(500).json({
            msg: "Internal Server Error",
            error: error.message,
            success: false
        });
    }
};

exports.updateTrackingTime = async (req, res) => {
    try {
        const { userId, jobId } = req.body;
        const SECONDS_IN_AN_HOUR = 3600;
        const MAX_REGULAR_HOURS_IN_SECONDS = 40 * SECONDS_IN_AN_HOUR;
        const secondsInaWeek = 40 * 3600;
        const now = new Date();

        // 1. Validate user
        const checkUser = await Employee.findById(userId);
        if (!checkUser) {
            return res.status(403).json({ msg: "Unauthorized Access!", success: false });
        }

        // 2. Check for holidays (using user's local time)
        const userLocalDate = new Date(now.toLocaleString('en-US', { timeZone: checkUser.timeZone || 'UTC' }));
        const startOfLocalDay = new Date(userLocalDate.setHours(0, 0, 0, 0));

        // const holiday = await Holiday.findOne({
        //     vendorId: checkUser.userId,
        //     date: { $gte: startOfLocalDay, $lte: endOfLocalDay },
        // });

        // if (holiday) {
        //     return res.status(200).json({
        //         success: false,
        //         message: "Action not allowed: Today is a holiday.",
        //     });
        // }

        // 3. Find active timer - first check current day, then previous day if not found
        let tracking = await Tracking.findOne({
            userId,
            jobId,
            isTimerRunning: true,
            // stoppedTime: { $exists: false },
            sessionDate: startOfLocalDay
        });

        // If no active timer found for current day, check previous day
        if (!tracking) {
            const previousDay = new Date(startOfLocalDay);
            previousDay.setDate(previousDay.getDate() - 1);

            tracking = await Tracking.findOne({
                userId,
                jobId,
                isTimerRunning: true,
                // stoppedTime: { $exists: false },
                sessionDate: previousDay
            });

            // // If found from previous day, update sessionDate to current day
            // if (tracking) {
            //     tracking.sessionDate = startOfLocalDay;
            //     tracking.clockLogs.push({
            //         type: 'clock-out',
            //         time: new Date(previousDay.setHours(23, 59, 59, 999)),
            //     });

            // }
        }

        // If still no active timer found
        if (!tracking) {
            return res.status(404).json({
                msg: "No active timer found to stop",
                success: false
            });
        }

        // 4. Validate employee data
        const checkEmp = await Employee.findOne({ _id: tracking.userId });
        if (!checkEmp) {
            return res.status(404).json({
                msg: 'Employee data not found!',
                success: false
            });
        }

        // 5. Stop the timer and calculate elapsed time
        if (tracking.isTimerRunning) {
            const timeElapsed = (now - new Date(tracking.lastStartTime || tracking.startTime)) / 1000;
            tracking.elapsedTime += timeElapsed;
            tracking.isTimerRunning = false;
            tracking.stoppedTime = now;
            tracking.clockLogs.push({
                type: 'clock-out',
                time: now,
                localTime: userLocalDate
            });

            // Update calendar days if crossing midnight
            const currentLocalDate = new Date(userLocalDate.setHours(0, 0, 0, 0));
            if (!tracking.calendarDays?.some(day => day.getTime() === currentLocalDate.getTime())) {
                tracking.calendarDays = tracking.calendarDays || [];
                tracking.calendarDays.push(currentLocalDate);
            }
        }

        // 6. Calculate payment
        let amount = 0;
        let totalWorkedSeconds = Math.floor(tracking.elapsedTime);

        if (totalWorkedSeconds <= secondsInaWeek) {
            amount = calculateEarnings(checkEmp.rate, totalWorkedSeconds);
        } else {
            amount = calculateEarnings(checkEmp.rate, MAX_REGULAR_HOURS_IN_SECONDS);
            const extraTimeWorked = totalWorkedSeconds - MAX_REGULAR_HOURS_IN_SECONDS;
            const Overtimepayment = calculateEarnings(checkEmp.overTimeRate, extraTimeWorked);
            amount = Number(amount) + Number(Overtimepayment);
        }

        // 7. Update tracking record
        tracking.amount = amount;
        const result = await tracking.save();

        return res.status(200).json({
            msg: "Timer stopped successfully",
            success: true,
            result
        });

    } catch (error) {
        console.error("Error in updateTrackingTime: ", error);
        return res.status(500).json({
            msg: "Internal Server Error",
            error: error.message,
            success: false
        });
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
        //console.log("error on getAllEmpTrackingData: ", error);
        return res
            .status(500)
            .json({ msg: error.message, err: error, success: false });
    }
};

exports.getAllEmpTrackingIds = async (req, res) => {
    let startDate = req.query.startDate;
    let endDate = req.query.endDate;
    let { reqUserId } = req.payload;
    const ids = req.params.id;

    try {
        if (!ids || ids.length === 0) {
            return res
                .status(400)
                .json({ msg: "Please select employee!", success: false });
        }

        if (startDate) {
            startDate = new Date(startDate);
            startDate.setHours(0, 0, 0, 0); // Start of the day
        }

        if (endDate) {
            endDate = new Date(endDate);
            endDate.setHours(23, 59, 59, 999); // End of the day
        }
        const idsArray = Array.isArray(ids) ? ids : ids.split(",");


        const data = await Tracking.aggregate([
            {
                $match: {
                    sessionDate: {
                        $gte: new Date(startDate), // Start date from frontend
                        $lte: new Date(endDate),   // End date from frontend
                    },
                    userId: { $in: idsArray.map(id => new mongoose.Types.ObjectId(id)) },
                },
            },
            {
                $lookup: {
                    from: 'jobs',
                    localField: 'jobId',
                    foreignField: '_id',
                    as: 'jobDetails',
                },
            },
            { $unwind: { path: '$jobDetails' } },
            {
                $lookup: {
                    from: 'employees',
                    localField: 'userId',
                    foreignField: '_id',
                    as: 'employees',
                },
            },
            // Stage 3: Unwind employees array
            {
                $unwind: {
                    path: '$employees',
                    preserveNullAndEmptyArrays: true,
                },
            },
            {
                $group: {
                    _id: {
                        date: {
                            $dateToString: { format: '%Y-%m-%d', date: '$startTime' }, // Store date in YYYY-MM-DD format
                        },
                        jobId: '$jobId',
                    },
                    jobName: { $first: '$jobDetails.name' },
                    firstName: { $first: '$employees.firstName' },
                    lastName: { $first: '$employees.lastName' },
                    employeeId: { $first: '$employees.empId' },
                    ssnNo: { $first: '$employees.ssnNo' },
                    totalDuration: { $first: '$elapsedTime' },
                    totalBreakDuration: { $first: '$totalBreakTime' },
                    clockLogs: { $first: '$clockLogs' },
                },
            },
            {
                $addFields: {
                    employeeName: {
                        $concat: [
                            { $ifNull: ["$firstName", ""] },
                            " ",
                            { $ifNull: ["$lastName", ""] }
                        ]
                    },
                    originalDate: {
                        $dateFromString: { dateString: '$_id.date' }, // Convert _id.date back to a Date object
                    },
                    formattedDate: {
                        $dateToString: {
                            format: '%d %b %Y', // Format as "2 Feb 2025"
                            date: { $dateFromString: { dateString: '$_id.date' } },
                        },
                    },
                },
            },
            {
                $project: {
                    _id: 0,
                    date: '$formattedDate', // Display formatted date
                    jobName: 1,
                    originalDate: 1,
                    employeeName: 1,
                    employeeId: 1,
                    clockLogs: 1,
                    ssnNo: 1,
                    totalDuration: 1,
                    totalBreakDuration: 1,
                    totalAmount: 1,
                },
            },
            { $sort: { originalDate: -1 } }, // Sort by the original date (latest first)
        ]);
        if (data && data.length > 0) {
            return res
                .status(200)
                .json({ msg: "Data exported successfully.", success: true, result: data });
        }

        return res
            .status(400)
            .json({ msg: "No Tracking data found!", success: false });
    } catch (error) {
        //console.log("error on getAllEmpTrackingIds: ", error);
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
        //console.log("result: ", result);
        if (result) {
            return res.status(200).json({ msg: "Ok", success: true, result });
        }
        return res
            .status(400)
            .json({ msg: "No tracking data found!", success: false });
    } catch (error) {
        //console.log("error on getWeekHourByEmpId: ", error);
        return res
            .status(500)
            .json({ msg: error.message, err: error, success: false });
    }
};

exports.getMonthlyTracking = async (req, res) => {
    const { year, month } = req.params;
    const { userId, isVendor } = req.body;
    let { reqUserId } = req.payload;

    try {
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0); // Last day of the month
        endDate.setHours(23, 59, 59, 999);
        let userIds = [new mongoose.Types.ObjectId(userId)]; // Default to the provided userId

        // If the request is coming from a vendor, fetch employee IDs
        if (isVendor) {
            const employees = await Employee.find({ userId: reqUserId }, '_id'); // Fetch employee IDs for this vendor
            userIds = employees.map(employee => employee._id); // Extract employee IDs into an array
            //console.log('userids', userIds)
        }

        const trackingData = await Tracking.aggregate([
            {
                $match: {
                    startTime: { $gte: startDate, $lte: endDate },
                    userId: { $in: userIds }, // Match for userId or employee IDs
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
                $group: {
                    _id: {
                        day: { $dayOfMonth: '$startTime' },
                        month: { $month: '$startTime' },
                        year: { $year: '$startTime' },
                        jobId: '$jobId', // Group by jobId or any unique job identifier
                    },
                    jobName: { $first: '$jobDetails.name' }, // Include job name from jobDetails
                    totalDuration: { $sum: '$elapsedTime' },
                    totalAmount: { $sum: '$amount' },
                    startTime: { $first: '$startTime' }, // Assuming you need startTime for each job
                    stoppedTime: { $first: '$stoppedTime' }, // Assuming you need stoppedTime for each job
                },
            },
            {
                $project: {
                    _id: 0,
                    date: '$_id',
                    jobName: 1,
                    totalDuration: 1,
                    totalAmount: 1,
                    startTime: 1,
                    stoppedTime: 1,
                },
            },
        ]);

        res.json(trackingData);
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
};

exports.getWeeklyTracking = async (req, res) => {
    const { year, week } = req.params;
    const { userId, isVendor } = req.body;
    const { reqUserId } = req.payload;

    //console.log('req.payload : ', req.payload);

    let userIds = [new mongoose.Types.ObjectId(userId)];
    const { startDate, endDate } = getWeekStartEnd(year, week);
    //console.log({ startDate, endDate }, '{ startDate, endDate }')
    try {
        if (isVendor) {
            const employees = await Employee.find({ userId: reqUserId }, '_id'); // Fetch employee IDs for this vendor
            userIds = employees.map(employee => employee._id); // Extract employee IDs into an array
            //console.log('userids', userIds)
        }

        const trackingData = await Tracking.aggregate([
            {
                $match: {
                    startTime: { $gte: startDate, $lte: endDate },
                    userId: { $in: userIds }, // Match for userId or employee IDs
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
                    path: '$jobDetails'  // To include documents with no matching job details
                },
            },
            {
                $group: {
                    _id: {
                        day: { $dayOfMonth: '$startTime' },
                        month: { $month: '$startTime' },
                        year: { $year: '$startTime' },
                        jobId: '$jobId', // Group by jobId or any unique job identifier
                    },
                    jobName: { $first: '$jobDetails.name' }, // Include job name from jobDetails
                    totalDuration: { $sum: '$elapsedTime' },
                    totalAmount: { $sum: '$amount' },
                    startTime: { $first: '$startTime' }, // Assuming you need startTime for each job
                    stoppedTime: { $first: '$stoppedTime' }, // Assuming you need stoppedTime for each job
                },
            },
            {
                $project: {
                    _id: 0,
                    date: '$_id',
                    jobName: 1,
                    totalDuration: 1,
                    totalAmount: 1,
                    startTime: 1,
                    stoppedTime: 1,
                },
            },
        ]);


        res.json(trackingData);
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
};

exports.getAllWeeklyTrackings = async (req, res) => {
    try {
        let { userId } = req.body;
        const user = await Employee.findById(userId);

        const data = await Tracking.aggregate([
            {
                $match: {
                    userId: new mongoose.Types.ObjectId(userId),
                },
            },
            {
                $lookup: {
                    from: 'jobs',
                    localField: 'jobId',
                    foreignField: '_id',
                    as: 'jobDetails',
                },
            },
            { $unwind: { path: '$jobDetails' } },
            {
                $lookup: {
                    from: 'employees',
                    localField: 'userId',
                    foreignField: '_id',
                    as: 'employeeDetails',
                },
            },
            { $unwind: { path: '$employeeDetails', preserveNullAndEmptyArrays: true } },
            {
                $group: {
                    _id: {
                        date: {
                            $dateToString: { format: '%Y-%m-%d', date: '$startTime' }, // Store date in YYYY-MM-DD format
                        },
                        jobId: '$jobId',
                    },
                    jobName: { $first: '$jobDetails.name' },
                    firstName: { $first: '$employeeDetails.firstName' },
                    lastName: { $first: '$employeeDetails.lastName' },
                    employeeId: { $first: '$employeeDetails.empId' },
                    ssnNo: { $first: '$employeeDetails.ssnNo' },
                    totalDuration: { $sum: '$elapsedTime' },
                    totalBreakDuration: { $sum: '$totalBreakTime' },
                    totalAmount: { $sum: '$amount' },
                    sessionDate: { $first: '$startTime' },
                },
            },
            {
                $addFields: {
                    employeeName: {
                        $concat: [
                            { $ifNull: ["$firstName", ""] },
                            " ",
                            { $ifNull: ["$lastName", ""] }
                        ]
                    },
                    originalDate: {
                        $dateFromString: { dateString: '$_id.date' }, // Convert _id.date back to a Date object
                    },
                    formattedDate: {
                        $dateToString: {
                            format: '%d %b %Y', // Format as "2 Feb 2025"
                            date: { $dateFromString: { dateString: '$_id.date' } },
                        },
                    },
                },
            },
            {
                $project: {
                    _id: 0,
                    date: '$formattedDate', // Display formatted date
                    jobName: 1,
                    originalDate: 1,
                    employeeName: 1,
                    employeeId: 1,
                    ssnNo: 1,
                    sessionDate: 1,
                    totalDuration: 1,
                    totalBreakDuration: 1,
                    totalAmount: 1,
                },
            },
            { $sort: { originalDate: -1 } }, // Sort by the original date (latest first)
        ]);

        return res.status(200).json({
            msg: "Ok",
            success: true,
            data: data,
            overTimeRate: user.overTimeRate,
            rate: user.rate,
        });
    } catch (error) {
        //console.log(error.message);
        res.status(500).json({ error: error.message });
    }
};



exports.getAllMonthlyTrackings = async (req, res) => {
    try {
        const trackingData = await Tracking.aggregate([
            {
                $match: {
                    userId: req.body.userId,
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
                    path: '$jobDetails',
                    preserveNullAndEmptyArrays: true, // To include documents with no matching job details
                },
            },
            {
                $group: {
                    _id: {
                        month: { $month: '$startTime' },
                        year: { $year: '$startTime' },
                        jobId: '$jobId', // Group by jobId or any unique job identifier
                    },
                    jobName: { $first: '$jobDetails.name' }, // Include job name from jobDetails
                    totalDuration: { $sum: '$elapsedTime' },
                    totalAmount: { $sum: '$amount' },
                    startTime: { $first: '$startTime' },
                    stoppedTime: { $first: '$stoppedTime' },
                },
            },
            {
                $project: {
                    _id: 0,
                    month: '$_id.month',
                    year: '$_id.year',
                    jobName: 1,
                    totalDuration: 1,
                    totalAmount: 1,
                    startTime: 1,
                    stoppedTime: 1,
                },
            },
            {
                $sort: {
                    year: -1,
                    month: -1,
                },
            },
        ]);

        res.json(trackingData);
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
};


exports.getLastSixMonthsElapsedTime = async (req, res) => {
    let { userId } = req.params;
    try {
        const monthlyData = await Tracking.aggregate([
            {
                $match: {
                    userId: new mongoose.Types.ObjectId(userId),
                    sessionDate: {
                        $gte: new Date(new Date().setMonth(new Date().getMonth() - 6)),
                    },
                },
            },
            {
                $group: {
                    _id: {
                        year: { $year: "$sessionDate" },
                        month: { $month: "$sessionDate" },
                    },
                    totalElapsedSeconds: { $sum: "$elapsedTime" },
                },
            },
            {
                $project: {
                    month: {
                        $let: {
                            vars: {
                                monthsArray: [
                                    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
                                    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
                                ],
                            },
                            in: { $arrayElemAt: ["$$monthsArray", { $subtract: ["$_id.month", 1] }] },
                        },
                    },
                    year: "$_id.year",
                    totalElapsedHours: {
                        $round: [{ $divide: ["$totalElapsedSeconds", 3600] }, 2],
                    },
                },
            },
            {
                $sort: { "year": 1, "month": 1 }, // Ensures correct order
            },
        ]);


        res.status(200).json(monthlyData);
    } catch (error) {
        console.error("Error calculating monthly elapsed time:", error);
        res.status(500).json({ message: "Server Error", error });
    }
};

