const { ONE_SIGNAL_CONFIG } = require("../config/app.config");

async function SendNotification(data, callback){
    var headers = {
        "Content-Type": "application/json; charset=utf-8",
        "Authorization": "Basic " + ONE_SIGNAL_CONFIG.REST_API_KEY,
    };

    var options = {
        host: "onnesignal.com",
        port: 443,
        path: "/api/v1/notifications",
        method: "POST",
        headers: headers,
    };  

    var https = require("https");
    var req = https.request(options, function(res) {
        res.on("data", function(data) {
            console.log(JSON.parse(data));

            return callback(null, JSON.parse(data));
        });
    });

    res.on("error", function(e) {
        return callback({
        message: e
        });
    });
    
    req.write(json.stringfy(data));
    req.end();
}

module.exprots = {
    SendNotification
}
