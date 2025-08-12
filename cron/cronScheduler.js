const mongoose = require('mongoose');
const cron = require('node-cron');
const Shift = require('./../model/Shift');  // Adjust path as needed
const Job = require('./../model/Job');
const Employee = require('./../model/Employee');
const { shiftStartReminderToEmployee } = require('../util/mailService');
const RewardConfig = require('../model/RewardConfig');
const Tracking = require('../model/Tracking');
const WeeklyReward = require('../model/WeeklyReward');


// Cron job runs every minute
cron.schedule('* * * * *', async () => {
    try {
        const now = new Date();
        const tenMinutesLater = new Date(now.getTime() + 10 * 60000); // 10 minutes from now
        
        const formatTime = (date) => date.getHours().toString().padStart(2, '0') + ":" + date.getMinutes().toString().padStart(2, '0');
        
        const tenMinutesLaterTime = formatTime(tenMinutesLater);
        console.log("current time.", now);
        
        const shifts = await Shift.find().lean(); // Use `.lean()` for performance
        
        const upcomingShifts = shifts.filter(shift => {
            const shiftTime = formatTime(new Date(shift.start)); // Extract only hour and minute
            return shiftTime === tenMinutesLaterTime; // Match exactly on minute level
        });

        if (shifts.length === 0) {
            console.log("No upcoming shifts in 10 minutes.", tenMinutesLaterTime);
            return;
        }

        for (const shift of upcomingShifts) {
            const jobs = await Job.find({ shift: shift._id });
            for (const job of jobs) {
                if (!job.userId) continue; // Skip if no user is assigned

                const employees = await Employee.find({ jobId: job._id });

                for (const employee of employees) {
                    shiftStartReminderToEmployee(employee,`Shift Reminder for ${job.name}` ,job.name ,tenMinutesLaterTime )
                    console.log(`Notification: ${employee.name}, your shift "${shift.name}" starts at ${shift.start}`);
                }

            }
        }
    } catch (error) {
        console.error("Error in cron job:", error);
    }
});


cron.schedule('30 23 * * 0', async () => {
    try {
        console.log('Starting weekly reward calculation...');
        
        // Get current week's Monday 00:00 to Friday 23:59
        const now = new Date();
        const day = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
        const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Adjust to Monday
        const monday = new Date(now);
        monday.setDate(diff);
        monday.setHours(0, 0, 0, 0);
        
        const friday = new Date(monday);
        friday.setDate(monday.getDate() + 4); // Friday is 4 days after Monday
        friday.setHours(23, 59, 59, 999);

        console.log(`Calculating rewards for week ${monday.toDateString()} to ${friday.toDateString()}`);

        // Find all active reward configurations
        const activeConfigs = await RewardConfig.find({ isActive: true });

        for (const config of activeConfigs) {
            // Find all employees for this employer
            const employees = await Employee.find({ userId: config.employerId });

            for (const employee of employees) {
                // Get all approved tracking records for this employee from Monday to Friday
                const timeEntries = await Tracking.find({
                    userId: employee._id,
                    sessionDate: { $gte: monday, $lte: friday },
                    // status: 'approved'
                });

                // Calculate total worked time (in seconds)
                let totalWorkedSeconds = 0;
                let totalBreakSeconds = 0;

                timeEntries.forEach(entry => {
                    // Add elapsed time (in seconds)
                    totalWorkedSeconds += entry.elapsedTime || 0;
                    
                    // Subtract break time (in seconds) - assuming totalBreakTime is in milliseconds
                    // Convert milliseconds to seconds by dividing by 1000
                    totalBreakSeconds += (entry.totalBreakTime || 0) / 1000;
                });

                // Calculate net worked time (worked time minus break time)
                const netWorkedSeconds = Math.max(0, totalWorkedSeconds - totalBreakSeconds);
                const netWorkedHours = netWorkedSeconds / 3600; // Convert seconds to hours
                const roundedHours = Math.round(netWorkedHours * 100) / 100; // Round to 2 decimal places

                const workedHours = roundedHours || 0;
                const bonusHours = workedHours >= config.thresholdHours
                  ? (workedHours / config.thresholdHours) * config.rewardHours
                  : 0;


                // Create or update weekly reward record
                await WeeklyReward.findOneAndUpdate(
                    {
                        employerId: config.employerId,
                        employeeId: employee._id,
                        weekStartDate: monday,
                        weekEndDate: friday
                    },
                    {
                        totalWorkedHours: roundedHours,
                        bonusHours: bonusHours,
                        status: 'approved',
                    },
                    { upsert: true, new: true }
                );

                console.log(`Processed ${employee.name}: 
                    ${roundedHours} net hours (${totalWorkedSeconds/3600} hrs worked - ${totalBreakSeconds/3600} hrs break), 
                    ${bonusHours} bonus hours`);
            }
        }

        console.log('Weekly reward calculation completed successfully.');
    } catch (error) {
        console.error('Error in reward calculation cron job:', error);
    }
});
console.log("Cron job started...");
