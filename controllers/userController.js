const User = require('../models/User');

exports.fetchAllUsers = async (req, res) => {
    try {
        const users = await User.find({});
        res.status(200).json(users);
    } catch (e) {
        res.status(500).json({ message: e.message });
    }
};

exports.getUserProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        res.status(200).json(user);
    } catch (e) {
        res.status(500).json({ message: e.message });
    }
};

exports.updateUserProfile = async (req, res) => {
    try {
        const { name, location, contact, profession } = req.body;
        const user = await User.findById(req.user.userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        if (name) user.name = name;
        if (location) user.location = location;
        if (contact) user.contact = contact;
        if (profession) user.profession = profession;

        const updatedUser = await user.save();
        return res.status(200).json(updatedUser);
    } catch (e) {
        return res.status(500).json({ message: e.message });
    }
};
