const Job = require("../model/Job");



const canStartTimer = async (jobId, empId) => {
    try {
        const job = await Job.findById(jobId).populate('shift');
        if (!job) {
            throw new Error('Job not found');
        }

        if (!job.shift) {
            throw new Error('Shift not assigned to this job');
        }

        const currentTime = new Date();
        const shiftStart = new Date(job.shift.start);
        const shiftEnd = new Date(job.shift.end);

        const currentHours = currentTime.getUTCHours();
        const currentMinutes = currentTime.getUTCMinutes();
        const shiftStartHours = shiftStart.getUTCHours();
        const shiftStartMinutes = shiftStart.getUTCMinutes();
        const shiftEndHours = shiftEnd.getUTCHours();
        const shiftEndMinutes = shiftEnd.getUTCMinutes();

        const currentTotalMinutes = currentHours * 60 + currentMinutes;
        const shiftStartTotalMinutes = shiftStartHours * 60 + shiftStartMinutes;
        const shiftEndTotalMinutes = shiftEndHours * 60 + shiftEndMinutes;

        if (currentTotalMinutes >= shiftStartTotalMinutes && currentTotalMinutes <= shiftEndTotalMinutes) {
            return { isAllowed: true }; // Allow job start
        }

        return { 
            start: job.shift.start, 
            end: job.shift.end, 
            isAllowed: false, 
            message: "You cannot start the job." 
        };

    } catch (error) {
        throw new Error(error.message);
    }
};

module.exports = {
    canStartTimer
}