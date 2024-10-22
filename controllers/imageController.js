const User = require('../models/User');

exports.uploadImage = async (req, res) => {
    try {
        const imageUrl = req.file.path; 
        const user = await User.findById(req.user.userId);
        user.profilePicture = imageUrl; 
        await user.save();

        res.status(200).json({
            message: 'Image uploaded successfully',
            imageUrl: imageUrl,
        });
    } catch (e) {
        res.status(500).json({ message: e.message });
    }
};

exports.fetchProfilePicture = async (req, res) => {
    try {
        const user = await User.findById(req.user.userId); 
        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        res.status(200).json({
            profilePicture: user.profilePicture || null, 
        });
    } catch (e) {
        res.status(500).json({ message: e.message });
    }
};

exports.fetchOtherProfilePicture = async (req, res) => {
    try {
        const user = await User.findById(req.params.userId); 
        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        res.status(200).json({
            profilePictureUrl: user.profilePicture || null, 
        });
    } catch (e) {
        res.status(500).json({ message: e.message });
    }
};
