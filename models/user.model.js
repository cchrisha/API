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
        addinfo: {
            type: String,
            required: [true, "Please enter additional information"],
        },
        walletAddress: {
            type: String,
            unique: true,
            default: null,  
        },
    },
    {
        timestamps: true,
    }
);


const User = mongoose.model("User", UserSchema);

module.exports = User;