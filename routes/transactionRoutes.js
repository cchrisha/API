const express = require('express');
const { getUserTransactions } = require('../controllers/transactionController');
const verifyToken = require('../middleware/verifyToken');
const router = express.Router();

router.get('/transactions', verifyToken, getUserTransactions);

module.exports = router;
