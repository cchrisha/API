// routes/approutes.js
const express = require('express');
const router = express.Router();
const pushNotificationController = require('../controllers/push-notification.controllers'); // Check the import path

// Define your routes
router.get("/SendNotification", pushNotificationController.SendNotification);
router.post("/SendNotificationToDevice", pushNotificationController.SendNotificationToDevice); // Ensure this function is defined in the controller as well

module.exports = router;
