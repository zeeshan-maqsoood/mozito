const { idValidator } = require("../../middlewares");
const { Notification } = require("../../models");
const router = require("express").Router();

router.param("id", idValidator);
// change this according to selected pet
router.get("/alert",async (req,res,next)=>{
  try {
    const notifications= await Notification.find({toPet:req.selected_pet._id,read:false}).countDocuments();
    return res
    .status(200)
    .json({ success: true, data: { notifications:notifications }, msg: "ok", status: 200 });
  } catch (error) {
    return next(error);
  }
})
router.get("/", async (req, res, next) => {
  try {
    const notifications = await Notification.find({ toPet: req.selected_pet._id })
    .populate("fromPet","name photo")
    .select({
        title:1,
        body:1,
        createdAt:1,
        screenId:1,
        screenName:1,
        read:1
    })
    .sort({createdAt:-1});
    return res
      .status(200)
      .json({ success: true, data: { notifications }, msg: "ok", status: 200 });
  } catch (error) {
    return next(error);
  }
});

router.put("/markasRead",async (req,res,next)=>{
    try {
    await Notification.updateMany({ toPet: req.selected_pet._id },{$set:{read:true}});
    return res.status(200).json({
        success: true,
        data: { msg:"Notification marked as read" },
        msg: "ok",
        status: 200,
      });
    } catch (error) {
        return next(error);
    }
})

router.get("/:id", async (req, res, next) => {
  try {
    const notification = await Notification.findById(req.params.id)
    .select({
        title:1,
        body:1,
        createdAt:1,
        screenId:1,
        screenName:1,
        read:1,
        toPet:1
    })
    .populate("fromPet","name photo");
    if (notification.toPet.toString() === req.selected_pet._id.toString()) {
      notification.read = true;
    }
    else{
        return next({status:409,msg:"Unauthorized"})
    }
    await notification.save();
    return res.status(200).json({
      success: true,
      data: { notification },
      msg: "ok",
      status: 200,
    });
  } catch (error) {
    return next(error);
  }
});

router.delete("/all", async (req, res, next) => {
  try {
    const notifications1 = await Notification.find({ toPet: req.selected_pet._id })
    if (!notifications1) {
      return next({ status: 404, msg: "Notifications not found." });
    }
    const notifications = await Notification.updateMany({toPet: req.selected_pet._id},{$set:{deleted:true}})
    return res.status(200).json({
      success: true,
      data: { notifications },
      msg: "ok",
      status: 200,
    });
  } catch (error) {
    return next(error);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    const notification = await Notification.findById(req.params.id)
    if (!notification) {
      return next({ status: 404, msg: "Notification not found." });
    }
    await notification.delete();
    return res.status(200).json({
      success: true,
      data: { notification },
      msg: "ok",
      status: 200,
    });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
