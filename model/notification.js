const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true },
    body: { type: String, required: true },
    data: { type: Object, default: {} },
    sentAt: { type: Date, default: Date.now },
    readStatus: { type: Boolean, default: false },
    readAt: { type: Date, default: null }
});

const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification;
