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
    isRead: { type: Boolean, default: false }, // To track if the notification has been read
    createdAt: { type: Date, default: Date.now } // Timestamp
});

const VerificationNotificationSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // The admin who receives the notification
    message: { type: String, required: true },
    isRead: { type: Boolean, default: false }, // Track if the notification has been read
    requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // The user who made the request
    createdAt: { type: Date, default: Date.now } // Auto-set to the current date
});

const VerificationNotification = mongoose.model('VerificationNotification', VerificationNotificationSchema);

// const transactionNotificationSchema = new mongoose.Schema({
//     walletAddress: { type: String, required: true }, // Wallet address receiving the notification
//     message: { type: String, required: true }, // Notification message
//     isRead: { type: Boolean, default: false }, // To track if the notification has been read
//     createdAt: { type: Date, default: Date.now } // Timestamp
// });


const TransactionNotification = mongoose.model('TransactionNotification', transactionNotificationSchema);
const Notification = mongoose.model('Notification', notificationSchema);

// Export both models in a single object
module.exports = { Notification, TransactionNotification, VerificationNotification };

