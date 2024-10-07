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
            default: null, // Default is null, meaning no OTP set
        },
        otpExpiry: {
            type: Date,
            default: null, // Default is null, meaning no expiry set
        },
        // profilePicture: {
        //     type: String,
        //     default: null, // URL to the profile picture, default is null
        // }
    },
    {
        timestamps: true,
    }
);

const User = mongoose.model("User", UserSchema);

module.exports = User;
