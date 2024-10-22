const { ONE_SIGNAL_CONFIG } = require("../config/app.config");
const pushNotificationService = require("../services/push-notification.services");


exports.SendNotification = (req, res, next) => {
    var message = {
        app_id: ONE_SIGNAL_CONFIG.APP_ID,
        contents: { en: "Test Push Notification" },
        include_segments: ["included_player_ids"],
        include_player_ids: req.body.devices,
        content_available: true,
        small_icon: "ic_notification_icon",
        data:{
            pushTitle: "Custom Notification"
        }
    };
    pushNotificationService.sendNotification(message, (error, results) =>{
        if(error){
            return next(error);
        }
        return results.status(200).send({
            message: "Success",
            data: results,
        });
    });
};