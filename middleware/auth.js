const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
    const token = req.header('Authorization')?.split(' ')[1]; // Expecting 'Bearer <token>'

    if (!token) {
        return res.status(401).json({ message: "Access denied. No token provided." });
    }

    try {
        const decoded = jwt.verify(token, 'your_secret_key'); // Same secret used in login
        req.user = decoded;
        next();
    } catch (err) {
        res.status(400).json({ message: "Invalid token." });
    }
};

module.exports = verifyToken;
