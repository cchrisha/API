const express = require('express');
const { fetchAllUsers, getUserProfile, updateUserProfile } = require('../controllers/userController');
const verifyToken = require('../middleware/verifyToken');
const router = express.Router();

router.get('/', fetchAllUsers);
router.get('/profile', verifyToken, getUserProfile);
router.put('/update', verifyToken, updateUserProfile);

module.exports = router;
