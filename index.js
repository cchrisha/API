const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('./models/user.model.js');
const verifyToken = require('./middleware/auth');

const nodemailer = require('nodemailer');

// Configure nodemailer transporter
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'community.guild.services@gmail.com',
        pass: 'kslw rpqi rota jhrn' 
    }
});

// Function to generate a random 6-digit OTP
const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString(); // Generates a random 6-digit number
};

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
        const { name, email, password, location, contact, profession } = req.body;
        if (!name || !email || !password || !location || !contact || !profession) {
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
            profession
        });

        res.status(201).json({
            userId: user._id,
            name: user.name,
            email: user.email,
            location: user.location,
            contact: user.contact,
            profession: user.profession,
            walletAddress: user.walletAddress // Include if applicable
        });

    } catch (e) {
        res.status(500).json({ message: e.message });
    }
});

    // Get All Users
    app.get('/api/users', async (req, res) => {
        try {
            // Fetch all users from the database
            const users = await User.find({}); // Adjust the filter if needed

            // Return the list of users
            res.status(200).json(users);
        } catch (e) {
            // Handle any errors
            res.status(500).json({ message: e.message });
        }
    });

    app.put('/api/users/_id', async (req, res) => {
        try {
            const userId = req.params.id;
            const { walletAddress } = req.body;
    
            console.log("User ID:", userId);
            console.log("Wallet Address:", walletAddress);
    
            const updatedUser = await User.findByIdAndUpdate(
                userId, 
                { walletAddress }, 
                { new: true, runValidators: true }
            );
    
            if (!updatedUser) {
                return res.status(404).json({ message: 'User not found' });
            }
    
            res.status(200).json(updatedUser);
        } catch (error) {
            console.error("Error updating user:", error.message);
            res.status(500).json({ message: error.message });
        }
    });
    
    

// Login 
app.post('/api/userLogin', async (req, res) => {
    try {
        const { email, password, walletAddress } = req.body; // Add walletAddress

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

        // Update the user's wallet address if it's provided
        if (walletAddress) {
            user.walletAddress = walletAddress; // Ensure you have a walletAddress field in your User model
            await user.save(); // Save the updated user document
        }

        // Generate JWT token
        const token = jwt.sign(
            { userId: user._id, email: user.email },
            'your_secret_key',
        );

        res.status(200).json({ token, message: "Login successful" });
    } catch (e) {
        res.status(500).json({ message: e.message });
    }
});


// Get User Profile
app.get('/api/user', verifyToken, async (req, res) => {
    try {
        // Fetch the user based on the ID decoded from the token
        const user = await User.findById(req.user.userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Return user profile information
        res.status(200).json({
            userId: user._id,
            name: user.name,
            email: user.email,
            location: user.location,
            contact: user.contact,
            profession: user.profession,
            walletAddress: user.walletAddress // Include if applicable
        });
    } catch (e) {
        res.status(500).json({ message: e.message });
    }
});

// User Profile Update
app.put('/api/updateUserProfile', verifyToken, async (req, res) => {
    try {
        const {name, location, contact, profession } = req.body;
        const user = await User.findById(req.user.userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        // Only update fields if they are provided
        user.name = name || user.name;
        user.location = location || user.location;  
        user.contact = contact || user.contact;
        user.profession = profession || user.profession;

        const updatedUser = await user.save();
        res.status(200).json(updatedUser);
    } catch (e) {
        res.status(500).json({ message: e.message });
    }
});

app.put('/api/changePassword', verifyToken, async (req, res) => {
    try {
        const { oldPassword, newPassword, confirmPassword } = req.body;

        // Check if new password and confirm password match
        if (newPassword !== confirmPassword) {
            return res.status(400).json({ message: "New password and confirm password do not match" });
        }

        // Find the user by ID from the token
        const user = await User.findById(req.user.userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Verify the old password
        const isMatch = await bcrypt.compare(oldPassword, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: "Incorrect old password" });
        }

        // Hash the new password
        const hashedNewPassword = await bcrypt.hash(newPassword, 10);

        // Update the user's password
        user.password = hashedNewPassword;
        await user.save();

        res.status(200).json({ message: "Password changed successfully" });
    } catch (e) {
        res.status(500).json({ message: e.message });
    }
});

    // User Logout
    //app.post('/api/logout', verifyToken, async (req, res) => {
    //    try {
    //        const user = await User.findById(req.user.userId);
    //        if (!user) {
    //           return res.status(404).json({ message: "User not found" });
    //        }
    //        res.status(200).json({ message: "Logged out successfully" });
    //    } catch (e) {
    //        res.status(500).json({ message: e.message });
    //    }
    // });

app.post('/api/logout', verifyToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Check if user is logged in with MetaMask
        if (user.walletAddress) {
            // Perform MetaMask logout logic here if needed
            user.walletAddress = null; // Remove the wallet address from the user's profile
            await user.save();
            return res.status(200).json({ message: "Logged out successfully" });
        }

        res.status(200).json({ message: "Logged out successfully" });
    } catch (e) {
        res.status(500).json({ message: e.message });
    }
});

// Forgot Password
app.post('/api/forgotPassword', async (req, res) => {
    try {
        const { email } = req.body;

        // Find the user by email
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: "User with this email does not exist" });
        }

        // Generate a 6-digit OTP
        const otp = generateOTP();
        const otpExpiry = Date.now() + 300000; // OTP valid for 5 minutes

        // Save OTP and expiry to user document
        user.otp = otp; 
        user.otpExpiry = otpExpiry;
        await user.save();

        // Send email with the OTP
        const mailOptions = {
            from: 'community.guild.services@gmail.com',
            to: user.email,
            subject: 'Your OTP for Password Reset',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 5px;">
                    <h2 style="color: #333; text-align: center;">Password Reset OTP</h2>
                    <p>Hello ${user.name},</p> <!-- Personalized greeting -->
                    <p>Your OTP for resetting your password is:</p>
                    <div style="background-color: #f9f9f9; border: 1px solid #ccc; border-radius: 4px; padding: 10px; text-align: center; font-size: 24px; font-weight: bold; color: #333;">
                        ${otp}
                    </div>
                    <p style="margin-top: 20px;">This OTP is valid for 5 minutes. If you did not request this, please ignore this email.</p>
                    <p style="text-align: center;">Best regards,<br>Community Guild Services</p>
                </div>
            `
        };

        // Send email
        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                return res.status(500).json({ message: 'Error sending email', error: error.message });
            }
            res.status(200).json({ message: 'OTP sent to your email', info });
        });

    } catch (e) {
        res.status(500).json({ message: e.message });
    }
});

// Verify OTP and reset password
app.post('/api/verifyOtp', async (req, res) => {
    try {
        const { email, otp, newPassword } = req.body;

        // Find the user by email
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: "User with this email does not exist" });
        }

        // Check if the OTP is valid and not expired
        if (user.otp !== otp || Date.now() > user.otpExpiry) {
            return res.status(400).json({ message: "Invalid or expired OTP" });
        }

        // Hash the new password
        const hashedNewPassword = await bcrypt.hash(newPassword, 10);
        user.password = hashedNewPassword;

        // Clear OTP fields
        user.otp = undefined;
        user.otpExpiry = undefined;

        // Save the updated user document
        await user.save();

        res.status(200).json({ message: "Password reset successful" });
    } catch (e) {
        res.status(500).json({ message: e.message });
    }
});
