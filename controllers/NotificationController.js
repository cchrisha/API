// controllers/NotificationController.js
const Notification = require('../models/notification/notif.model');
const User = require('../models/user.model'); // Correct path to the User model

// Controller method to create a notification
async function createNotification(req, res) {
    try {
        const { userId, message } = req.body;

        // Check for required fields
        if (!userId || !message) {
            return res.status(400).json({ message: "Missing required fields." });
        }

        // Validate that the user exists
        const userExists = await User.findById(userId);
        if (!userExists) {
            return res.status(404).json({ message: "User not found." });
        }

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
