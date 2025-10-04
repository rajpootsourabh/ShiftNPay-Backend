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

        const now = new Date();
        const shiftStart = new Date(job.shift.start);
        const shiftEnd = new Date(job.shift.end);
        console.log('shiftStart :',shiftStart)
        console.log('shiftEnd :',shiftEnd)
        console.log('now :',now)
        const currentHours = now.getHours();
        const currentMinutes = now.getMinutes();
        const startHours = shiftStart.getHours();
        const startMinutes = shiftStart.getMinutes();
        const endHours = shiftEnd.getHours();
        const endMinutes = shiftEnd.getMinutes();

        const currentTotal = currentHours * 60 + currentMinutes;
        const startTotal = startHours * 60 + startMinutes;
        const endTotal = endHours * 60 + endMinutes;

        // Check if dates are different (overnight shift)
        const isOvernight = shiftStart.getDate() !== shiftEnd.getDate();

        let isWithinShift;
        if (isOvernight) {
            // For overnight shifts, valid if current time is after start OR before end
            isWithinShift = currentTotal >= startTotal || currentTotal <= endTotal;
        } else {
            // For same-day shifts, valid if between start and end
            isWithinShift = currentTotal >= startTotal && currentTotal <= endTotal;
        }

        if (isWithinShift) {
            return { isAllowed: true };
        }

        return { 
            start: job.shift.start, 
            end: job.shift.end, 
            isAllowed: false, 
            message: "You cannot start the job. As you shift is not started."
        };

    } catch (error) {
        throw new Error(error.message);
    }
};

// // Helper function to format time as "HH:MM AM/PM"
// function formatTime(date) {
//     return date.toLocaleTimeString('en-US', { 
//         hour: '2-digit', 
//         minute: '2-digit',
//         hour12: true 
//     });
// }

module.exports = {
    canStartTimer
}