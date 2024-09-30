const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs'); // For hashing and comparing passwords
const jwt = require('jsonwebtoken'); // For generating JWT tokens
const User = require('./models/user.model.js');
const verifyToken = require('./middleware/auth');

const app = express();
app.use(express.json());
app.use(cors());

// Connect to MongoDB
mongoose.connect("mongodb+srv://repatochrishamae:b2bZiRmYya0PmASm@authapi.2xnlj.mongodb.net/?retryWrites=true&w=majority&appName=authAPI")
    .then(() => {
        console.log("Connected to the database");
        app.listen(3001, () => {
            console.log('Server is running on port 3001');
        });
    })
    .catch(err => {
        console.error("Connection failed:", err.message);
    });

// Create account (Sign up)
app.post('/api/userSignup', async (req, res) => {
    try {
        const { name, email, password, location, contact, profession, addinfo } = req.body;
        if (!name || !email || !password || !location || !contact || !profession || !addinfo) {
            return res.status(400).json({ message: "All fields are required" });
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: "User with this email already exists" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await User.create({
            name,
            email,
            password: hashedPassword,
            location,
            contact,
            profession,
            addinfo
        });

        res.status(201).json({ 
            userId: user._id, 
            name: user.name, 
            email: user.email,
            location: user.location,
            contact: user.contact,
            profession: user.profession,
            addinfo: user.addinfo,
            walletAddress: user.walletAddress // Include if applicable
        });
        
    } catch (e) {
        res.status(500).json({ message: e.message });
    }
});

// Login 
app.post('/api/userLogin', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validate input
        if (!email || !password) {
            return res.status(400).json({ message: "Email and password are required" });
        }

        // Check if user exists
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: "Invalid credentials" });
        }

        // Compare provided password with stored hashed password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: "Invalid credentials" });
        }

        // Generate JWT token
        const token = jwt.sign(
            { userId: user._id, email: user.email },
            process.env.JWT_SECRET, // Use environment variable for secret key
            { expiresIn: '1h' }
        );

        res.status(200).json({ token, message: "Login successful" });
    } catch (e) {
        res.status(500).json({ message: e.message });
    }
});

// User Logout
app.post('/api/logout', verifyToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        res.status(200).json({ message: "Logged out successfully" });
    } catch (e) {
        res.status(500).json({ message: e.message });
    }
});

// Get User Profile
app.get('/api/getUserProfile', verifyToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.userId).select('-password');
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        res.status(200).json(user); 
    } catch (e) {
        res.status(500).json({ message: e.message });
    }
});


// User Profile Update
app.put('/api/updateUserProfile', verifyToken, async (req, res) => {
    try {
        const { location, contact, profession, addinfo } = req.body;
        const user = await User.findById(req.user.userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        user.name = location || user.name;
        user.location = email || user.email;
        user.location = location || user.location;
        user.contact = contact || user.contact;
        user.profession = profession || user.profession;
        user.addinfo = addinfo || user.addinfo;

        const updatedUser = await user.save();
        res.status(200).json(updatedUser);
    } catch (e) {
        res.status(500).json({ message: e.message });
    }
});