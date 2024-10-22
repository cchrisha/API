const express = require('express');
const { uploadImage, fetchProfilePicture, fetchOtherProfilePicture } = require('../controllers/imageController');
const verifyToken = require('../middleware/verifyToken');
const upload = require('../middleware/upload'); // Assuming you have a file upload middleware
const router = express.Router();

router.post('/upload', verifyToken, upload.single('image'), uploadImage);
router.get('/profile', verifyToken, fetchProfilePicture);
router.get('/:userId/profile', verifyToken, fetchOtherProfilePicture);

module.exports = router;
