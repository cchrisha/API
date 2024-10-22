const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

exports.userSignup = async (req, res) => {
    try {
        const { name, email, password, location, contact, profession } = req.body;
        if (!name || !email || !password || !location || !contact || !profession) {
            return res.status(400).json({ message: "All fields are required" });
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: "User with this email already exists" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await User.create({ name, email, password: hashedPassword, location, contact, profession });

        // Create JWT token with profession
        const token = jwt.sign(
            { userId: user._id, email: user.email, profession: user.profession },
            'your_jwt_secret'
        );

        res.status(201).json({
            userId: user._id,
            name: user.name,
            email: user.email,
            location: user.location,
            contact: user.contact,
            profession: user.profession,
            token
        });
    } catch (e) {
        res.status(500).json({ message: e.message });
    }
};

exports.userLogin = async (req, res) => {
    try {
        const { email, password, walletAddress } = req.body;

        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ message: "Invalid credentials" });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

        if (user.isAdmin === 1) {
            return res.status(403).json({ message: "Admin accounts are not allowed to log in." });
        }

        if (walletAddress) {
            user.walletAddress = walletAddress;
            await user.save();
        }

        const token = jwt.sign(
            { userId: user._id, email: user.email, profession: user.profession, name: user.name },
            'your_secret_key'
        );

        return res.status(200).json({ message: "Login successful", token, _id: user._id, role: "User" });
    } catch (e) {
        res.status(500).json({ message: e.message });
    }
};
