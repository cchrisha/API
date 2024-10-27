//api/models/user.model.js
const mongoose = require('mongoose');

const UserSchema = mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, "Please enter your name"],
        },
        email: {
            type: String,
            required: [true, "Please enter your email"],
            unique: true
        },
        password: {
            type: String,
            required: [true, "Please enter your password"],
        },
        location: {
            type: String,
            required: [true, "Please enter your location"], 
        },
        contact: {
            type: String,
            required: [true, "Please enter your contact"], 
        },
        profession: {
            type: String,
            required: [true, "Please enter your profession"], 
        },
        walletAddress: {
            type: String,
            unique: true,
            default: null,  
        },
        otp: {
            type: String,
            default: null, 
        },
        otpExpiry: {
            type: Date,
            default: null, 
        },
        profilePicture: {
            type: String,
            default: null, 
        },
        isAdmin: {
            type: Number,
            default: 0, // Default is 0, indicating the user is not an admin
        },
        isVerify: {
            type: Number,
            default: 0,
          },
    },
    {
        timestamps: true,
    }
);

const User = mongoose.model("User", UserSchema);

module.exports = User;
