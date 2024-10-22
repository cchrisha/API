const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // The user receiving the notification
    message: { type: String, required: true }, // Notification message
    job: { type: mongoose.Schema.Types.ObjectId, ref: 'Job' }, // Related job
    isRead: { type: Boolean, default: false }, // To track if the notification has been read
    createdAt: { type: Date, default: Date.now } // Timestamp
});


const transactionNotificationSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // The user receiving the notification
    message: { type: String, required: true }, // Notification message
    transaction: { type: mongoose.Schema.Types.ObjectId, ref: 'Transaction' }, // Related transaction
    isRead: { type: Boolean, default: false }, // To track if the notification has been read
    createdAt: { type: Date, default: Date.now } // Timestamp
});


const Notification = mongoose.model('Notification', notificationSchema);
const TransactionNotification = mongoose.model('TransactionNotification', transactionNotificationSchema);

module.exports = { Notification, TransactionNotification };
