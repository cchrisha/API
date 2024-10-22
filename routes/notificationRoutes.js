// routes/notificationRoutes.js
const express = require('express');
const router = express.Router();
const { createNotification, getUserNotifications } = require('../controllers/NotificationController');

// Route to create a new notification
router.post('/notifications', createNotification);

// Route to get notifications for a specific user
router.get('/notifications/:userId', getUserNotifications);

module.exports = router;
