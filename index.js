
    const express = require('express');
    const cors = require('cors');
    const mongoose = require('mongoose');
    const bcrypt = require('bcryptjs');
    const jwt = require('jsonwebtoken');
    const User = require('./models/user.model.js');
    const verifyToken = require('./middleware/auth');
    const cloudinary = require('cloudinary').v2;
    const jobRoutes = require('./routes/jobroutes'); 

    const nodemailer = require('nodemailer');
    const app = express();
    app.use(express.json());
    app.use(jobRoutes); 
    app.use(cors());

        // Configure nodemailer transporter
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: 'community.guild.services@gmail.com',
            pass: 'kslw rpqi rota jhrn' 
        }
    });

    // Configure Cloudinary with your credentials
    cloudinary.config({
        cloud_name: 'dx5reijcv',
        api_key: '965642287997112',
        api_secret: 'ZAKzzFiwyo_ggjVEFvmzZ6hIHVU',
    });
    
    const multer = require('multer');
    const { CloudinaryStorage } = require('multer-storage-cloudinary');
    
    // Set up Cloudinary storage
    const storage = new CloudinaryStorage({
        cloudinary: cloudinary,
        params: {
            folder: 'pfp', 
            allowedFormats: ['jpg', 'png', 'jpeg', 'gif'], 
        },
    });
    
    // Initialize multer with Cloudinary storage
    const upload = multer({ storage: storage });


    // Function to generate a random 6-digit OTP
    const generateOTP = () => {
        return Math.floor(100000 + Math.random() * 900000).toString(); 
    };

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

    // Image Upload 
    app.post('/api/uploadImage',verifyToken, upload.single('image'), async (req, res) => {
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
    });

    // Fetch Profile Picture
    app.get('/api/profilePicture', verifyToken, async (req, res) => {
        try {
            const userId = req.user.userId || req.user._id; 
            const user = await User.findById(userId); 

            if (!user) {
                return res.status(404).json({ message: 'User not found.' });
            }

            res.status(200).json({
                profilePicture: user.profilePicture || null, 
            });
        } catch (e) {
            res.status(500).json({ message: e.message });
        }
    });

    // Fetch Other Profile Picture
    app.get('/api/users/:userId/profilePicture', verifyToken, async (req, res) => {
        try {
            const userId = req.params.userId; // Get userId from request parameters
            const user = await User.findById(userId); // Find user by ID

            if (!user) {
                return res.status(404).json({ message: 'User not found.' });
            }

            res.status(200).json({
                data: {
                    profilePictureUrl: user.profilePicture || null, // Adjust according to your database schema
                },
            });
        } catch (e) {
            res.status(500).json({ message: e.message });
        }
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
                profession,
                isAdmin: 0, 
                isVerify: 0
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

        app.get('/api/users/:identifier', async (req, res) => {
            const identifier = req.params.identifier;
        
            try {
                let user;
        
                // Check if the identifier is a valid ObjectId (i.e., user ID)
                if (identifier.match(/^[0-9a-fA-F]{24}$/)) {
                    // Fetch user by ID
                    user = await User.findById(identifier, 'name email location contact profession isVerify');
                } else {
                    // Fetch user by username
                    user = await User.findOne({ name: identifier }, 'name email location contact profession isVerify');
                }
        
                if (user) {
                    // User found, return success response
                    res.status(200).json({
                        status: 'success',
                        message: 'User fetched successfully',
                        data: user
                    });
                } else {
                    // User not found
                    res.status(404).json({
                        status: 'failed',
                        message: 'User not found',
                    });
                }
            } catch (e) {
                // Handle any errors and return failure response
                res.status(500).json({
                    status: 'failed',
                    message: e.message,
                });
            }
        });
        
        app.get('/api/isUserVerify', async (req, res) => {
            try {
                const { verified } = req.query; // Get query parameter
        
                // Construct filter based on query parameter
                const filter = verified === 'true' ? { isVerify: 1 } : {}; // Only get verified users if the query is set
        
                // Fetch users based on the filter
                const users = await User.find(filter);
        
                // Transform the user data
                const transformedUsers = users.map(user => ({
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    isVerified: user.isVerify === 1,
                }));
        
                // Return the list of users with verification status
                res.status(200).json(transformedUsers);
            } catch (e) {
                // Handle any errors
                res.status(500).json({ message: e.message });
            }
        });
        

        app.post('/api/adminLogin', async (req, res) => {
            const { email, password } = req.body;
        
            try {
                const user = await User.findOne({ email });
                if (!user) return res.status(400).json({ message: 'Invalid credentials' });
        
                const isMatch = await bcrypt.compare(password, user.password);
                if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });
        
                // Check if user is admin
                if (user.isAdmin !== 1) {
                    return res.status(403).json({ message: "You're not an admin" });
                }
        
                // Generate JWT token
                const token = jwt.sign({ userId: user._id, email: user.email }, 'your_secret_key'); 
        
                // Send success response
                res.status(200).json({
                    success: true, // Indicate the operation was successful
                    token: token,
                    userId: user._id,
                    isAdmin: user.isAdmin
                });
            } catch (err) {
                res.status(500).json({ message: err.message });
            }
        });
        

        app.put('/api/users', verifyToken, async (req, res) => {
            const { walletAddress } = req.body; // Get wallet address from request body
            
            try {
                // Check if the wallet address already exists for another user
                const existingUser = await User.findOne({ walletAddress });
                if (existingUser) {
                    return res.status(400).json({ message: 'Wallet address already in use by another account.' });
                }
        
                // Update the user's wallet address
                const user = await User.findByIdAndUpdate(
                    req.user.userId, // Use the ID from the token
                    { walletAddress, updatedAt: new Date() }, // Update walletAddress and timestamp
                    { new: true, runValidators: true } // Return the updated document and validate
                );
        
                // Check if user was found and updated
                if (!user) {
                    return res.status(404).json({ message: 'User not found' });
                }
        
                res.status(200).json(user); // Return the updated user
            } catch (e) {
                res.status(500).json({ message: e.message });
            }
        });

        

        app.get('/api/userGetTransac', verifyToken, async (req, res) => {
            try {
                // Fetch the user based on the ID decoded from the token
                const user = await User.findById(req.user.userId);
                if (!user) {
                    return res.status(404).json({ message: "User not found" });
                }
        
                // Fetch transactions for the user's wallet address
                const transactions = await fetchTransactions(user.walletAddress);
        
                // Return user profile information along with transactions
                res.status(200).json({
                    userId: user._id,
                    name: user.name,
                    email: user.email,
                    location: user.location,
                    contact: user.contact,
                    profession: user.profession,
                    profilePicture: user.profilePicture,
                    walletAddress: user.walletAddress,
                    transactions: transactions.map(tx => ({
                        From: tx.sender,
                        To: tx.recipient,
                        Amount: tx.amount
                    }))
                });
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
                    walletAddress: user.walletAddress // Include if applicable
                });
            } catch (e) {
                res.status(500).json({ message: e.message });
            }
        });

        async function fetchTransactions(walletAddress) {
            const etherscanApiKey = '5KEE4GXQSGWAFCJ6CWBJPMQ5BV3VQ33IX1';
            const url = `https://api-sepolia.etherscan.io/api?module=account&action=txlist&address=${walletAddress}&startblock=0&endblock=99999999&sort=desc&apikey=${etherscanApiKey}`;
            
            try {
                const response = await fetch(url);
                const data = await response.json();
        
                if (data.status === '1') {
                    return data.result.map(tx => ({
                        sender: tx.from,
                        recipient: tx.to,
                        amount: (parseInt(tx.value) / Math.pow(10, 18)).toFixed(4) // Convert from Wei to ETH
                    }));
                } else {
                    console.error('Etherscan API error:', data);
                    return [];
                }
            } catch (error) {
                console.error('Error fetching transactions:', error);
                return [];
            }
        }
        
    // Login 
    app.post('/api/userLogin', async (req, res) => {
        try {
            const { email, password, walletAddress } = req.body; // Add walletAddress

            // Check if user exists
            const user = await User.findOne({ email });
            if (!user) {
                return res.status(400).json({ 
                    message: "Invalid credentials", 
                    success: false 
                });
            }

            // Compare provided password with stored hashed password
            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) {
                return res.status(400).json({ 
                    message: "Invalid credentials", 
                    success: false 
                });
            }

            // Check if the user is an admin and reject login if true
            if (user.isAdmin === 1) {
                return res.status(403).json({ 
                    message: "Admin accounts are not allowed to log in.", 
                    success: false 
                });
            }

            // Update the user's wallet address if it's provided
            if (walletAddress) {
                user.walletAddress = walletAddress; // Ensure you have a walletAddress field in your User model
                await user.save(); // Save the updated user document
            }

            // Generate JWT token for regular user
            const token = jwt.sign(
                { 
                    userId: user._id, 
                    email: user.email, 
                    profession: user.profession,
                    name: user.name // Include name here
                }, 
                'your_secret_key'
            );  

        // Return success response for regular user, including user name
        return res.status(200).json({ 
            message: "Login successful", 
            success: true, 
            token, 
            _id: user._id, 
            role: "User",
            isVerify: user.isVerify,
            name: user.name // Include user name here
        });

    } catch (e) {
        res.status(500).json({ 
            message: e.message, 
            success: false 
        });
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

    app.patch('/api/users/verify/:id', async (req, res) => {
        const userId = req.params.id;
        const { isVerify } = req.body;

        try {
            // Find the user by ID
            const user = await User.findById(userId);
            
            // Check if user exists
            if (!user) {
                return res.status(404).json({ message: 'User not found' });
            }
            
            // Update the isVerify field
            user.isVerify = isVerify; // Update the field based on the request body
            
            // Save the updated user
            const updatedUser = await user.save();
            return res.status(200).json(updatedUser);
            
        } catch (error) {
            res.status(500).json({ message: 'Error updating user', error });
        }
    });
        app.put('/api/users/verify', verifyToken, async (req, res) => {
            const { isVerify } = req.body; // Get the verification status from the request body

            try {
                // Use the user ID from the token (req.user.userId) to find the user
                const user = await User.findById(req.user.userId); 
                
                // Check if user exists
                if (!user) {
                    return res.status(404).json({ message: 'User not found' });
                }

                // Update the isVerify field
                user.isVerify = isVerify; // Update the field based on the request body

                // Save the updated user
                const updatedUser = await user.save();
                return res.status(200).json(updatedUser);
                
            } catch (error) {
                res.status(500).json({ message: 'Error updating user', error });
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
        
        app.post('/api/adminLogout', verifyToken, async (req, res) => {
            try {
                const user = await User.findById(req.user.userId);
                if (!user) {
                    return res.status(404).json({ message: "User not found" });
                }
        
                // Optionally, you can check if the user is an admin before logging out
                if (user.isAdmin !== 1) {
                    return res.status(403).json({ message: "Unauthorized: Admins only" });
                }
        
                // Optionally, if you're managing sessions, you could invalidate the session here
        
                res.status(200).json({ message: "Logged out successfully" });
            } catch (e) {
                res.status(500).json({ message: e.message });
            }
        });
        

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

    app.delete('/api/users/:id', async (req, res) => {
        const userId = req.params.id;
    
        try {
        const deletedUser = await User.findByIdAndDelete(userId);
    
        if (!deletedUser) {
            return res.status(404).json({ message: 'User not found' });
        }
    
        res.json({ message: 'User deleted successfully' });
        } catch (error) {
        res.status(500).json({ message: 'Error deleting user', error });
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
    app.post('/api/transactions', async (req, res) => {
        const { senderId, receiverId, amount } = req.body;

        // Process the transaction (pseudo code)
        const transactionResult = await processTransaction(senderId, receiverId, amount);

        if (transactionResult.success) {
            // Fetch receiver's email from the database
            const receiver = await getUserById(receiverId);
            const sender = await getUserById(senderId); // Fetch sender's details to get your email
            const transactionDetails = `You received an amount of ${amount} from ${sender.email}.`;

            // Send response with transaction details
            res.status(200).json({
                message: 'Transaction successful.',
                transactionDetails: transactionDetails,
                receiverEmail: receiver.email // Include receiver email if needed
            });
        } else {
            res.status(400).json({ message: 'Transaction failed.' });
        }
    });


    // const express = require('express');
// const mongoose = require('mongoose');
// const authRoutes = require('./routes/authRoutes');
// const userRoutes = require('./routes/userRoutes');
// const imageRoutes = require('./routes/imageRoutes');
// const transactionRoutes = require('./routes/transactionRoutes');
// const app = express();

// app.use(express.json());

// // Connect to MongoDB
// mongoose.connect('mongodb+srv://repatochrishamae:b2bZiRmYya0PmASm@authapi.2xnlj.mongodb.net/?retryWrites=true&w=majority&appName=authAPI', {
//     useNewUrlParser: true,
//     useUnifiedTopology: true,
// });

// // Use routes
// app.use('/api/auth', authRoutes);
// app.use('/api/users', userRoutes);
// app.use('/api/images', imageRoutes);
// app.use('/api/transactions', transactionRoutes); // Add this line

// // Start server
// const PORT = process.env.PORT || 3001;
// app.listen(PORT, () => {
//     console.log(`Server is running on port ${PORT}`)z;
// });
