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
        },
        contact: {
            type: String,
        },
        profession: {
            type: String,
        },
        bio: {
            type: String,
        },
    },
    {
        timestamps: true,
    }
);

const User = mongoose.model("User", UserSchema);

module.exports = User;