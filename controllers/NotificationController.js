// controllers/NotificationController.js
const Notification = require('../models/notification/notif.model');

// Controller method to create a notification
async function createNotification(req, res) {
    try {
        const { userId, message } = req.body;
        const notification = await Notification.create({ userId, message });
        res.status(201).json(notification);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create notification' });
    }
}

// Controller method to get notifications for a specific user
async function getUserNotifications(req, res) {
    try {
        const notifications = await Notification.find({ userId: req.params.userId });
        res.json(notifications);
    } catch (error) {
        res.status(500).json({ error: 'Failed to retrieve notifications' });
    }
}

module.exports = { createNotification, getUserNotifications };
