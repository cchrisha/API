const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // The user receiving the notification
    message: { type: String, required: true }, // Notification message
    job: { type: mongoose.Schema.Types.ObjectId, ref: 'Job' }, // Related job
    isRead: { type: Boolean, default: false }, // To track if the notification has been read
    createdAt: { type: Date, default: Date.now } // Timestamp
});

const userTransactionSchema = new mongoose.Schema({
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // The user sending the transaction
    receiver: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // The user receiving the transaction
    amount: { type: Number, required: true }, // Amount involved in the transaction
    transactionDate: { type: Date, default: Date.now }, // Timestamp for the transaction
    status: { type: String, enum: ['completed', 'failed'], default: 'completed' }, // Status of the transaction
});

const UserTransaction = mongoose.model('UserTransaction', userTransactionSchema);
const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification, UserTransaction;

