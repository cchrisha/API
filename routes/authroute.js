const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/auth');
const User = require('./models/user.model.js');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
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
// Create account (Sign up)
app.post('/api/userSignup', async (req, res) => {
    try {
        const { name, email, password, location, contact, profession  } = req.body;
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
            profession,
            // profilePicture 
        });

        res.status(201).json({
            userId: user._id,
            name: user.name,
            email: user.email,
            location: user.location,
            contact: user.contact,
            profession: user.profession,
            // profilePicture: user.profilePicture,
            walletAddress: user.walletAddress // Include if applicable
        });

         // Create JWT token with profession
         const token = jwt.sign(
            { userId: user._id, email: user.email, profession: user.profession }, // Include profession in the token
            'your_jwt_secret', // Use your own secret key
        );
        
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

// Login 
app.post('/api/userLogin', async (req, res) => {
    try {
        const { email, password, walletAddress } = req.body;

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

         // Check if wallet address is provided and update user
         if (walletAddress && user.walletAddress !== walletAddress) {
            user.walletAddress = walletAddress; // Save the wallet address
            await user.save();
        }

        // Generate JWT token
        const token = jwt.sign(
            { userId: user._id, email: user.email, profession: user.profession }, // Payload / Include profession in the token
            'your_secret_key', // Secret key (use a strong secret for production)x
        );

        res.status(200).json({ 
            token, _id: user._id}); // Include user ID in the response 
    } catch (e) {
        res.status(500).json({ message: e.message });
    }
});

    app.post('/api/userUpdate', async (req, res) => {
        try {
        const { walletAddress } = req.body;
        const userId = req.user.id; // Assuming you have user ID from the token
    
        // Find the user and update the wallet address
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
    
        user.walletAddress = walletAddress; // Update wallet address
        await user.save();
    
        res.status(200).json({ message: "Wallet address updated successfully" });
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
            profilePicture: user.profilePicture,
            // walletAddress: user.walletAddress // Include if applicable
        });
    } catch (e) {
        res.status(500).json({ message: e.message });
    }
});

// User Profile Update
app.put('/api/updateUserProfile', verifyToken, async (req, res) => {
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
});


// Change Password (inside the app)
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

// Verify OTP
app.post('/api/verifyOtp', async (req, res) => {
    try {
        const { email, otp } = req.body;

        // Find the user by email
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: "User with this email does not exist" });
        }

        // Check if the OTP is valid and not expired
        if (user.otp !== otp || Date.now() > user.otpExpiry) {
            return res.status(400).json({ message: "Invalid or expired OTP" });
        }

        // OTP verified successfully, clear OTP fields
        user.otp = undefined;
        user.otpExpiry = undefined;
        await user.save();

        res.status(200).json({ message: "OTP verified. You can now reset your password." });

    } catch (e) {
        res.status(500).json({ message: e.message });
    }
});

// Reset password after OTP is verified
app.post('/api/resetPassword', async (req, res) => {
    try {
        const { email, newPassword } = req.body;

        // Find the user by email
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: "User with this email does not exist" });
        }

        // Hash the new password
        const hashedNewPassword = await bcrypt.hash(newPassword, 10);
        user.password = hashedNewPassword;

        // Save the updated user document
        await user.save();

        res.status(200).json({ message: "Password reset successful" });

    } catch (e) {
        res.status(500).json({ message: e.message });
    }
});

module.exports = router;