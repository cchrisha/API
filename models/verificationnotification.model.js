const mongoose = require('mongoose');

const verificationNotificationSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // User receiving the notification
    message: { type: String, required: true }, // Notification message
    isRead: { type: Boolean, default: false }, // To track if the notification has been read
    // notificationType: { 
    //     type: String, 
    //     enum: ['normal', 'verify'], // Notification types
    //     default: 'normal' 
    // }, 
    createdAt: { type: Date, default: Date.now } // Timestamp
});

const VerificationNotification = mongoose.model('VerificationNotification', verificationNotificationSchema);

module.exports = {VerificationNotification};
