const fs = require('fs');
const https = require('https');
const { Server } = require('socket.io');
require('dotenv').config();
const db = require('./config/db')
const chatHandler = require('./socket/chat');
const Tracking = require('./model/Tracking');
const { default: mongoose } = require('mongoose');
db()
const options = {
    key: fs.readFileSync("/etc/letsencrypt/live/shiftnpay.com/privkey.pem"),
    cert: fs.readFileSync("/etc/letsencrypt/live/shiftnpay.com/fullchain.pem"),
};

const server = https.createServer(options);

const io = new Server(server, {
    cors: {
        origin: '*',
        methods: '*',
    },
});

const onConnection = (socket) => {
    chatHandler(io, socket)

}

io.on('connection', onConnection);


server.listen(5001, () => console.log(`🔌 WebSocket Server running on port 5001`));