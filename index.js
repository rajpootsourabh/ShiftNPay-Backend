const express = require('express');
const http = require('http'); // Import http module to create server
const { Server } = require('socket.io');
require('dotenv').config();
const cors = require('cors');
const upload = require('express-fileupload');
const db = require('./config/db');
const path = require('path');
const chatHandler = require('./socket/chat');
const superRouter = require('./router/adminSuper');
const vendorRouter = require('./router/vendor');
const planRouter = require('./router/plan');
const empRouter = require('./router/employee');
const jobRouter = require('./router/job');
const trackRouter = require('./router/tracking');
const invoiceRoutes = require('./router/invoiceRoutes');
const credentialRouter = require('./router/credential');
const feedRouter = require('./router/feedBack');
const shiftRouter = require('./router/shift');
const stateRouter = require('./router/state');
const leaveRouter = require('./router/leaves');
const rewardRoutes = require('./router/rewardRoutes.js');
const IDB_SYS = require('./router/idb_sys.js');
const Tracking = require('./model/Tracking');
const Employee = require('./model/Employee');
const { default: mongoose } = require('mongoose');


db();

const app = express();
const server = http.createServer(app); // Create an HTTP server
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: '*',
  },
});

app.use(cors({ origin: '*', methods: '*' }));
app.use(express.json());
app.use(upload());

app.use(express.static(__dirname + 'assets'));
app.use('/images', express.static(__dirname + '/assets'));
app.use('/documents', express.static(__dirname + '/assets/documents'));
app.use('/vendor-documents', express.static(__dirname + '/assets/documents/vendor'));
app.use('/invoices', express.static(__dirname + '/assets/invoices'));

app.use('/v1/admin', superRouter);
app.use('/v1/plan', planRouter);
app.use('/v1/emp', empRouter);
app.use('/v1/vendor', vendorRouter);
app.use('/v1/vendor/invoices', invoiceRoutes);
app.use('/v1/job', jobRouter);
app.use('/v1/tracking', trackRouter);
app.use('/v1/credentials', credentialRouter);
app.use('/v1/feed', feedRouter);
app.use('/v1/shift', shiftRouter);
app.use('/v1/state', stateRouter);
app.use('/v1/leaves', leaveRouter);
app.use('/v1/rewards', rewardRoutes);
app.use('/v1/vendor', IDB_SYS);

app.use(express.static(path.join(__dirname, 'build')));

// ---------------------- SOCKET.IO LOGIC ----------------------

const connectedUsers = new Map(); // { userId: Set(socketIds) }
const reloadingUsers = new Map(); // { userId: timestamp }


const onConnection = (socket) => {
  chatHandler(io, socket)

}

io.on('connection', onConnection);


// io.on('connection', (socket) => {
//     const userId = socket.handshake.query.userId; 

//     if (userId) {
//         // If user already has connections, add new socketId
//         if (!connectedUsers.has(userId)) {
//             connectedUsers.set(userId, new Set());
//         }
//         connectedUsers.get(userId).add(socket.id);
        
//         console.log(`User ${userId} connected on socket ${socket.id}`);

//         // If user reconnects, check if it's within 5 sec
//         if (reloadingUsers.has(userId)) {
//             const disconnectTime = reloadingUsers.get(userId);
//             if (Date.now() - disconnectTime <= 5000) {
//                 console.log(`User ${userId} reconnected within 5 sec, skipping timer stop.`);
//             }
//             reloadingUsers.delete(userId); // Clean up
//         }
//     }

//     // Handle page reload
//     socket.on("pageReloading", ({ userId }) => {
//         console.log(`User ${userId} is reloading.`);
//         reloadingUsers.set(userId, Date.now()); // Mark as reloading
//     });

//     // Handle user disconnect
//     socket.on('disconnect', async () => {
//         try {
//             const userId = [...connectedUsers.entries()]
//                 .find(([_, sockets]) => sockets.has(socket.id))?.[0];

//             if (!userId) return console.log(`Unknown socket disconnected: ${socket.id}`);

//             console.log(`User ${userId} disconnected from socket ${socket.id}`);

//             // Remove this socket from the user’s active connections
//             const userSockets = connectedUsers.get(userId);
//             userSockets.delete(socket.id);
            
//             // If user still has active sockets, do nothing
//             if (userSockets.size > 0) {
//                 console.log(`User ${userId} still active on other devices.`);
//                 return;
//             }

//             console.log(`User ${userId} completely disconnected. Waiting 5s to check reconnection...`);
//             reloadingUsers.set(userId, Date.now()); 

//             setTimeout(async () => {
//                 if (reloadingUsers.has(userId)) {
//                     console.log(`User ${userId} did not reconnect in time, stopping timer.`);
//                     stopTimerForUser(userId);
//                     reloadingUsers.delete(userId);
//                 }
//             }, 5000);

//         } catch (error) {
//             console.error('Error in stop_timer:', error);
//         }
//     });
// });


async function stopTimerForUser(userId) {
    try {
        const startOfDay = new Date().setHours(0, 0, 0, 0);
        const tracking = await Tracking.findOne({ 
            userId: new mongoose.Types.ObjectId(userId),
            sessionDate: startOfDay 
        });
        const now = Date.now();

        if (!tracking || !tracking.isTimerRunning) {
            console.log(`No running timer found for user ${userId}.`);
            return;
        }
        if (tracking.isOnBreak == true) {  
            const totalBreakTime = (now - new Date(tracking.breakLastStartTime).getTime()) / 1000;
            tracking.clockLogs.push({ type: "break-out", time: now });
            tracking.totalBreakTime += totalBreakTime;
            tracking.isOnBreak = false;
            console.log(`user is on break stopping the break for user ${userId}.`);
        }

        const timeElapsed = (now - new Date(tracking.lastStartTime).getTime()) / 1000;
        tracking.elapsedTime += timeElapsed;
        tracking.isTimerRunning = false;
        tracking.stoppedTime = now;
        tracking.clockLogs.push({ type: 'clock-out', time: now });

        await tracking.save();
        console.log(`Timer stopped for user: ${userId}`);
    } catch (error) {
        console.error(`Error stopping timer for user ${userId}:`, error);
    }
}


// import("./cron/cronScheduler.js");
// import("./cron/jobSchedulerCron.js");

// ------------------------------------------------------------

const port = process.env.PORT || 5000;
server.listen(port, () => console.log(`Server running on port ${port}`));
