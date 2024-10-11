//api/index
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const jobRoutes = require('./routes/jobroutes');
const authroute = require('./routes/authroute');  

const app = express();
app.use(express.json());
app.use(jobRoutes);
app.use(authroute);
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

