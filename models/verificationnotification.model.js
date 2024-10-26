const mongoose = require('mongoose');

const VerificationNotificationSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // The admin who receives the notification
    message: { type: String, required: true },
    isRead: { type: Boolean, default: false }, // Track if the notification has been read
    requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // The user who made the request
    createdAt: { type: Date, default: Date.now } // Auto-set to the current date
});

const VerificationNotification = mongoose.model('VerificationNotification', VerificationNotificationSchema);

module.exports = { VerificationNotification };



// const mongoose = require('mongoose');

// const verificationNotificationSchema = new mongoose.Schema({
//     user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // User receiving the notification
//     message: { type: String, required: true }, // Notification message
//     isRead: { type: Boolean, default: false }, // To track if the notification has been read
//     createdAt: { type: Date, default: Date.now } // Timestamp
// });

// const VerificationNotification = mongoose.model('VerificationNotification', verificationNotificationSchema);

// module.exports = {VerificationNotification};