const {
  Color,
  Country,
  State,
  City,
  Species,
  Breed,
  Faq,
  User,
  Version,
  Pet,
  Interest,
  Panic_Reason
} = require("../../models");
const PushNotificationService = require("../../common/push-notification");
const FirestoreService= require("../../service/firestore/index");
const {
  requireSigninUser,
  petRequired,
} = require("../../middlewares/userAuth");
const { idValidator } = require("../../middlewares");
const constant = require("../../constants");
const cache = require("../../utils/cache");
const router = require("express").Router();
const Auth = require("./auth");
const PetRoute = require("./pet");
const UserRoute = require("./user");
const FeedBack = require("./feedback");
const Panic = require("./panic");
const Schedule = require("./schedule");
const Blogs = require("./blogs");
const Friends = require("./friend");
const Pairing = require("./pairing");
const Post = require("./post");
const Notification = require("./notification");
const PostReport = require("./post_report")
const PanicReport = require("./panic_report")
const PetReport = require("./pet_report")
const UserPage = require("./userPage")
const UserPagePost = require("./userPagePost")
const Status = require("./status")

const {
  firebaseNotificationUser,
} = require("../../common/firebaseNotificationHelper");
const notificationMessages = require("../../common/notificationMessages");
const mongoose = require("mongoose");

router.use("/auth", Auth);
router.use("/pet", PetRoute);
router.use("/feedback", FeedBack);
router.use("/panic", requireSigninUser, Panic);
router.use("/schedule", requireSigninUser, petRequired, Schedule);
router.use("/blogs", Blogs);
router.use("/friend", requireSigninUser, petRequired, Friends);
router.use("/pairing", requireSigninUser, petRequired, Pairing);
router.use("/post", requireSigninUser, Post);
router.use("/notification",requireSigninUser,Notification);
router.use("/postreport",requireSigninUser,PostReport);
router.use("/panicreport",requireSigninUser,PanicReport);
router.use("/petreport",requireSigninUser,PetReport);
router.use("/userpage",requireSigninUser,UserPage)
router.use("/userpagepost",requireSigninUser,UserPagePost)
router.use("/status", requireSigninUser,Status)

router.param("id", idValidator);




router.put("/fcmToken", requireSigninUser, async (req, res, next) => {
  try {
    const fcmToken=req.body.fcmToken ? req.body.fcmToken : "";
    const userId=req.user ? req.user._id.toString() : "";
    const selected_pet = req.selected_pet ? req.selected_pet._id.toString():"";
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { fcmToken },
      { new: true }
      );
      if(selected_pet){
        const f_res=await FirestoreService.addUserToFirease(selected_pet,{petId:selected_pet,ownerId:userId,fcmToken,updateDate:Date.now()});
      }
    return res.status(200).json({
      success: true,
      data: { fcmToken: user.fcmToken },
      msg: "ok",
      status: 200,
    });
  } catch (error) {
    return next(error);
  }
});

// only for testing
router.get("/usernotification", async (req, res, next) => {
  try {
    const blog = "5fb635a2821a6608c05a2778";
    const notification = await PushNotificationService.notifySingleDevice(
      {
        title: "Test ",
        body: "Test Body ",
      },
      req.body.fcmToken,
      {
        _id: "5fb635a2821a6608c05a2778".toString(),
        type: "1",
        route: `/appuser/appuserdetail/${blog}`,
      }
    );
    return res
      .status(200)
      .json({ success: true, data: { notification }, msg: "ok", status: 200 });
  } catch (error) {
    return next(error);
  }
});



router.get("/interests", async (req, res, next) => {
  try {
    const interest = await Interest.find({}).select({ name: true }).sort({name:1});
    return res
      .status(200)
      .json({ success: true, data: { interest }, msg: "ok", status: 200 });
  } catch (error) {
    next(error);
  }
});

router.get("/panic_reason", async (req, res, next) => {
  try {
    const match = {};
    if (req.query.type) {
      match.type = req.query.type;
    }
    const reasons = await Panic_Reason.find(match).select({
      text: true,
      type: true,
    });
    return res
      .status(200)
      .json({ success: true, data: { reasons }, msg: "ok", status: 200 });
  } catch (error) {
    next(error);
  }
});

router.get("/colors", async (req, res, next) => {
  try {
    const colors = await Color.find().select({ name: true });
    return res
      .status(200)
      .json({ success: true, data: { colors }, msg: "ok", status: 200 });
  } catch (error) {
    return next(error);
  }
});
// cached
router.get("/country", async (req, res, next) => {
  try {
    const countries = await Country.find()
      .select({ __v: false, addedBy: false })
      .sort({ name: 1 });
    return res
      .status(200)
      .json({ success: true, data: { countries }, msg: "ok", status: 200 });
  } catch (error) {
    return next(error);
  }
});
// cached
router.get("/state/:id", idValidator, async (req, res, next) => {
  try {
    let states = cache.get(`${constant.STATES}-${req.params.id}`);
    if (states) {
    } else {
      states = await State.find({ country: req.params.id }).select({
        __v: false,
        addedBy: false,
      }).sort({name:1});
      states.length > 0 &&
        cache.set(`${constant.STATES}-${req.params.id}`, states, 100000);
    }
    return res
      .status(200)
      .json({ success: true, data: { states }, msg: "ok", status: 200 });
  } catch (error) {
    return next(error);
  }
});
// cached

router.get("/city/:id", idValidator, async (req, res, next) => {
  try {
    let cities = cache.get(`${constant.CITIES}-${req.params.id}`);
    if (!cities) {
      cities = await City.find({ state: req.params.id }).select({
        __v: false,
        addedBy: false,
      }).sort({name:1});
      cache.set(`${constant.CITIES}-${req.params.id}`, cities, 1000);
    }
    return res
      .status(200)
      .json({ success: true, data: { cities }, msg: "ok", status: 200 });
  } catch (error) {
    return next(error);
  }
});
// cached

router.get("/species", async (req, res, next) => {
  try {
    let species = cache.get(`${constant.SPECIES}`);
    if (!species) {
      species = await Species.find().select({ __v: false, addedBy: false,updatedAt:false });
      cache.set(`${constant.SPECIES}`, species, 100000);
    }
    return res
      .status(200)
      .json({ success: true, data: { species }, msg: "ok", status: 200 });
  } catch (error) {
    return next(error);
  }
});
// cached

router.get("/breed/:id", idValidator, async (req, res, next) => {
  try {
    let breed = cache.get(`${constant.BREED}-${req.params.id}`);
    if (!breed) {
      breed = await Breed.find({ species: req.params.id }).select({
        __v: false,
        addedBy: false,
      });
      breed.length &&
        cache.set(`${constant.BREED}-${req.params.id}`, breed, 100000);
    }
    return res
      .status(200)
      .json({ success: true, data: { breed }, msg: "ok", status: 200 });
  } catch (error) {
    return next(error);
  }
});

router.get("/faq", async (req, res, next) => {
  try {
    const faqs = await Faq.find({ active: true }).select({
      createdBy: false,
      __v: false,
      updatedAt: false,
    });
    return res
      .status(200)
      .json({ success: true, data: { faqs }, msg: "ok", status: 200 });
  } catch (error) {
    return next(error);
  }
});

router.use("/", UserRoute);

module.exports = router;
