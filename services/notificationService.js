const admin = require('firebase-admin');
const path = require('path');
const Notification = require('./../model/notification');
const serviceAccount = require(path.resolve(__dirname, './../config/google-services.json'));
const mongoose = require('mongoose');
const Admin = require('../model/Admin');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const sendNotification = async (userId, token, title, body, data = {}) => {

    try {
        const notification = new Notification({
            userId: new mongoose.Types.ObjectId(userId),
            title: title,
            body: body,
            data: data,
            sentAt: new Date(),
            readStatus: false,
            readAt: null
        });
        await notification.save();
        if (token) {

            const message = {
                notification: {
                    title: title,
                    body: body
                },
                data: data,
                token: token
            };

            const response = await admin.messaging().send(message);
            console.log('Successfully sent message:', response);
           
        return response;

        }
        
    } catch (error) {
        console.error('Error sending message:', error);
        throw error;
    }
};

const getNotificationsByUser = async (userId) => {
    try {
        const notifications = await Notification.find({ userId: new mongoose.Types.ObjectId(userId) }).sort({ sentAt: -1 });
        return notifications;
    } catch (error) {
        console.error('Error fetching notifications:', error);
        throw error;
    }
};

const markAllAsRead = async (userId) => {
    try {
        const result = await Notification.updateMany(
            { userId: new mongoose.Types.ObjectId(userId), readStatus: false },
            { readStatus: true, readAt: new Date() },
            { new: true }
        );
        return result;
    } catch (error) {
        console.error('Error marking notifications as read:', error);
        throw error;
    }
};

const getUnreadNotificationCount = async (userId) => {
    try {
        const count = await Notification.countDocuments({
            userId: new mongoose.Types.ObjectId(userId),
            readStatus: false
        });
        return count;
    } catch (error) {
        console.error('Error getting unread notification count:', error);
        throw error;
    }
};


const createNotificationForAdmin = async (vendor, message,data={}) => {

    try {
        const admin = await Admin.find();
        const notification = new Notification({
            userId: admin[0]._id,
            title: vendor.name,
            body: message,
            data: data,
            sentAt: new Date(),
            readStatus: false,
            readAt: null
        });
        await notification.save();
        
    } catch (error) {
        console.error('Error sending message:', error);
        throw error;
    }
};





module.exports = {
    sendNotification,
    getNotificationsByUser,
    markAllAsRead,
    getUnreadNotificationCount,
    createNotificationForAdmin
};
