// controllers/NotificationController.js
const Notification = require('../models/notification/notif.model');
const User = require('../models/user.model'); // Correct the import path for User model

// Controller method to create a notification
// Controller method to create a notification
async function createNotification(req, res) {
    try {
        console.log('Incoming Request Body:', req.body); // Log the request body

        const { userId, message } = req.body;

        // Check for required fields
        if (!userId || !message) {
            console.log('userId:', userId, 'message:', message); // Log the values for debugging
            return res.status(400).json({ message: "Missing required fields." });
        }

        // Validate that the user exists
        const userExists = await User.findById(userId);
        if (!userExists) {
            return res.status(404).json({ message: "User not found." });
        }

        // Create the notification
        const notification = await Notification.create({ userId, message });
        res.status(201).json(notification);
    } catch (error) {
        console.error('Error creating notification:', error); // Log the error for debugging
        res.status(500).json({ error: 'Failed to create notification' });
    }
}



// Controller method to get notifications for a specific user
async function getUserNotifications(req, res) {
    try {
        const notifications = await Notification.find({ userId: req.params.userId });
        res.json(notifications);
    } catch (error) {
        console.error('Error retrieving notifications:', error); // Log the error for debugging
        res.status(500).json({ error: 'Failed to retrieve notifications' });
    }
}

module.exports = { createNotification, getUserNotifications };
