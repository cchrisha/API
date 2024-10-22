// // smsService.js
// const axios = require('axios');

// const sendSMS = async (phoneNumber, message) => {
//     try {
//         const response = await axios.post('https://textbelt.com/text', {
//             phone: phoneNumber,
//             message: message,
//             key: 'textbelt', // This is the free API key for testing
//         });

//         if (response.data.success) {
//             return 'Message sent successfully.';
//         } else {
//             throw new Error(response.data.error);
//         }
//     } catch (error) {
//         throw new Error('Error sending SMS: ' + error.message);
//     }
// };

// module.exports = sendSMS;
