const User = require('../models/User');
const fetch = require('node-fetch'); // Ensure you have node-fetch installed

exports.getUserTransactions = async (req, res) => {
    try {
        const user = await User.findById(req.user.userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const transactions = await fetchTransactions(user.walletAddress);

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
};

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
