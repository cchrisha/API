const mongoose = require('mongoose');

const verificationNotificationSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // Admin receiving the notification
    requester: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // User requesting verification
    message: { type: String, required: true },
    isRead: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
});

const VerificationNotification = mongoose.model('VerificationNotification', verificationNotificationSchema);

module.exports = { VerificationNotification };
