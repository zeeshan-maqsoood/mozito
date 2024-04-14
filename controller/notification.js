const {
  firebaseNotificationUser,
} = require("../common/firebaseNotificationHelper");
const notificationMessages = require("../common/notificationMessages");
const FriendService = require("../service/friends");
const { Notification } = require("../models")

exports.notificationForUsers = async (req,res,next) => {
  try {
    let data = {
        from:req.body.from,
        to:req.body.to,
        fromPet:req.body.fromPet,
        toPet:req.body.toPet,
        body:req.body.body,
        title:req.body.title,
        screenName:req.body.screenName
    }
    const notification = new Notification(data)
    await notification.save()
    return res.status(200).json({
      success: true,
      data: { notification },
      msg: "ok",
      status: 200,
    })
  } catch (error) {
    return next(error)
  }
}