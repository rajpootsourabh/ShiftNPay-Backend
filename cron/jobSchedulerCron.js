const cron = require('node-cron');
const JobAssignmentQueue = require('../model/JobAssignmentQueue');

// Run every minute
cron.schedule('* * * * *', async () => {
    try {
        console.log('Running job assignment queue check...');
        const now = new Date();
        const FIFTEEN_MIN = 15 * 60 * 1000;

        const queues = await JobAssignmentQueue.find({
            status: { $in: ['pending', 'retrying'] },
            requestTime: { $lte: new Date(now - FIFTEEN_MIN) }
        }).populate('jobId');

        for (const queue of queues) {
            console.log(`Processing timeout for job ${queue.jobId._id}`);

            queue.responses.push({
                employeeId: queue.currentEmployee,
                status: 'timeout',
                respondedAt: now
            });

            await processNextEmployee(queue, queue.jobId._id);

            // Save changes
            await queue.save();

            console.log(`Job ${queue.jobId._id} moved to next employee`);
        }

    } catch (err) {
        console.error('Job scheduler error:', err);
    }
});

async function processNextEmployee(queue, jobId) {
    queue.currentEmployeeIndex++;
    queue.requestTime = new Date();

    if (queue.currentEmployeeIndex >= queue.employeeQueue.length) {
        if (queue.currentRetry < queue.maxRetries) {
            queue.currentEmployeeIndex = 0;
            queue.currentRetry++;
            queue.status = 'retrying';
        } else {
            queue.status = 'failed';
        }
    }

    await queue.save();

    if (queue.status === 'pending' || queue.status === 'retrying') {
        // await notifyEmployee(queue.currentEmployee, jobId);
    }
}

// Cleanup expired queues daily at midnight
// cron.schedule('0 0 * * *', async () => {
//     try {
//         const expired = await JobAssignmentQueue.deleteMany({
//             expiration: { $lte: new Date() }
//         });
//         console.log(`Cleaned up ${expired.deletedCount} expired job queues`);
//     } catch (err) {
//         console.error('Queue cleanup error:', err);
//     }
// });