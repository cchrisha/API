const mongoose = require('mongoose');

const verificationNotificationSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // The user receiving the notification
    message: { type: String, required: true }, // Notification message
    isRead: { type: Boolean, default: false }, // To track if the notification has been read
    createdAt: { type: Date, default: Date.now } // Timestamp
});

const VerificationNotification = mongoose.model('VerificationNotification', verificationNotificationSchema);

module.exports = {VerificationNotification};
