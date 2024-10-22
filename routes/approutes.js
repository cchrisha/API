const express = require("express");
const router = express.Router(); // Fixed: use express.Router()

const pushNotificationController = require("../controllers/push-notification.controllers");

// Define routes
router.get("/SendNotification", pushNotificationController.SendNotification);
router.post("/SendNotificationToDevice", pushNotificationController.SendNotificationToDevice);

module.exports = router; // Export the router
