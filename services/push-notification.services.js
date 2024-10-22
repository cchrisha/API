const { ONE_SIGNAL_CONFIG } = require("../config/appconfig");
const https = require("https");

function sendNotification(data, callback) {
    var headers = {
        "Content-Type": "application/json; charset=utf-8",
        "Authorization": "Basic " + ONE_SIGNAL_CONFIG.API_KEY,
    };

    var options = {
        host: "onesignal.com", // Corrected from "onnesignal.com" to "onesignal.com"
        port: 443,
        path: "/api/v1/notifications",
        method: "POST",
        headers: headers,
    };  

    const req = https.request(options, function(res) {
        let responseData = "";
        res.on("data", function(chunk) {
            responseData += chunk; // Accumulate the response data
        });
        res.on("end", function() {
            callback(null, JSON.parse(responseData));
        });
    });


    req.on("error", function(e) {    
        return callback({
            message: e.message // Pass the error message to the callback
        });
    });

    req.write(JSON.stringify(data)); // Corrected from json.stringfy to JSON.stringify
    req.end();
}

module.exports = { // Corrected 'exprots' to 'exports'
    sendNotification
};
