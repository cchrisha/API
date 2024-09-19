//index.js
const express = require('express')
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs'); // For hashing and comparing passwords
const jwt = require('jsonwebtoken'); // For generating JWT tokens
const User = require('./models/user.model.js')
const verifyToken = require('./middleware/auth');
const app = express()
app.use(express.json())

// Create account (Sign up)
app.post('/api/userSignup', async (req, res) => {
    try {
        const { name, email, password } = req.body;

        // Check if user with the same email already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: "User with this email already exists" });
        }

        // Hash the password before saving the user
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create the user with hashed password
        const user = await User.create({ name, email, password: hashedPassword });

        res.status(201).json(user);
    } catch (e) {
        res.status(500).json({ message: e.message });
    }
});

// Login 
app.post('/api/userLogin', async (req, res) => {
    try {
        const { email, password } = req.body;

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
            { userId: user._id, email: user.email }, // Payload
            'your_secret_key', // Secret key (use a strong secret for production)
            { expiresIn: '1h' } // Token expiration
        );

        res.status(200).json({ token, message: "Login successful" });
    } catch (e) {
        res.status(500).json({ message: e.message });
    }
});

// User Profile
app.put('/api/updateUserProfile', verifyToken, async (req, res) => {
    try {
        const { location, contact, profession, addinfo } = req.body;

        // Find the authenticated user by ID (from the token)
        const user = await User.findById(req.user.userId);

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Update the fields
        user.location = location || user.location;
        user.contact = contact || user.contact;
        user.profession = profession || user.profession;
        user.addinfo = addinfo || user.addinfo;

        // Save the updated user profile
        const updatedUser = await user.save();

        res.status(200).json(updatedUser);
    } catch (e) {
        res.status(500).json({ message: e.message });
    }
});

// User Logout
app.post('/api/logout', verifyToken, async (req, res) => {
    try {
        // Find the authenticated user by ID
        const user = await User.findById(req.user.userId);

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        res.status(200).json({ message: "Logged out successfully" });
    } catch (e) {
        res.status(500).json({ message: e.message });
    }
});

//DB Connection
mongoose.connect("mongodb+srv://repatochrishamae:b2bZiRmYya0PmASm@authapi.2xnlj.mongodb.net/?retryWrites=true&w=majority&appName=authAPI")
.then(()=>{
    console.log("Connected to the database");
    app.listen(3001, ()=>{
        console.log('Server is running on port 3001');
    });
})
.catch(()=>{
    console.log("Connection failed");
})