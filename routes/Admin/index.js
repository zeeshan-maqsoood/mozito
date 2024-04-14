const router = require("express").Router();
const { Feedback, AccountRecovery, User, Pet, Version, Admin } = require("../../models");
const cache = require("../../utils/cache");
const { requireSignin } = require("../../middlewares/adminAuth");
const Auth = require("./auth")
const Category = require("./category");
const Blog = require("./blog");
const Users = require("./users");
const Reason = require("./reason");
const Report = require("./report");
const Location = require("./location");
const Color = require("./color");
const Species = require("./species");
const SpeciesType = require("./speciesType");
const Breed = require("./breed")
const DummyProfile = require("./dummyProfile");
const PetRoute = require("./pet");
const Faq = require("./faq");
const Role = require("./role")
const App = require("./app");
const PanicReason = require("./panicReason");
const Interest = require("./interest");
const Post = require("./post")
const Panic = require("./panic")
const Friends = require("./friend")
const Notification = require("./notification")
const Feedbacks = require("./feedback")

const { random } = require("lodash");
const PushNotificationService = require('../../common/push-notification');
const {upload}=require("../../s3")
const uploadPhoto = upload("")
const {isDate} = require("../../validator/helper")

router.use("/auth", Auth);
router.use("/pet", requireSignin, PetRoute);
router.use("/category", requireSignin, Category);
router.use("/blog", requireSignin, Blog);
router.use("/user", requireSignin, Users);
router.use("/reason", requireSignin, Reason);
router.use("/report", requireSignin, Report)
router.use("/location", requireSignin, Location);
router.use("/color", requireSignin, Color)
router.use("/species", requireSignin, Species)
router.use("/speciesType", requireSignin, SpeciesType)
router.use("/breed", requireSignin, Breed);
router.use("/dummy", requireSignin, DummyProfile);
router.use("/faq", requireSignin, Faq);
router.use("/role", requireSignin, Role);
router.use("/app", requireSignin, App);
router.use("/interest", requireSignin, Interest);
router.use("/panic_reason", requireSignin, PanicReason);
router.use("/post",requireSignin,Post)
router.use("/panic",requireSignin,Panic)
router.use("/friend",requireSignin,Friends)
router.use("/notification",requireSignin,Notification)
router.use("/feedback",requireSignin,Feedbacks)

router.get("/recoveryRequest", requireSignin, async (req, res, next) => {
    try {
        const requests = await AccountRecovery.find()
            .populate("country", "name")
            .populate("state", "name")
            .populate("city", "name")
        return res.status(200).json({ success: true, data: { requests }, msg: "ok", status: 200 });

    } catch (error) {
        return next(error);
    }
})
router.delete("/clearcache", requireSignin, (req, res, next) => {
    try {
        const keys = cache.keys();
        cache.flushAll();
        cache.flushStats();
        return res.status(200).json({ success: true, data: { msg: "cache deleted", keys }, msg: "ok", status: 200 });

    } catch (error) {
        return next(error);
    }
})
router.get("/dashboard", requireSignin, async (req, res, next) => {
    try {
        let petstartdate=isDate(req.query.petstartdate)?new Date(req.query.petstartdate) :false;
        let petenddate=isDate(req.query.petenddate)?new Date(req.query.petenddate) : false;
        let startdate=isDate(req.query.startdate)?new Date(req.query.startdate) :false;
        let enddate=isDate(req.query.enddate)?new Date(req.query.enddate) : false;
        let statusstartdate=isDate(req.query.statusstartdate)?new Date(req.query.statusstartdate) :false;
        let statusenddate=isDate(req.query.statusenddate)?new Date(req.query.statusenddate) : false;
        let status=req.query.status
        const petdbquery={}
        const dbquery={}
        const statusdbquery={}
        if(petstartdate&&petenddate)petdbquery.createdAt={$gte:petstartdate,$lte:petenddate.setHours(23, 59, 59)}
        if(startdate&&enddate)dbquery.createdAt={$gte:startdate,$lte:enddate.setHours(23, 59, 59)}
        if(statusstartdate&&statusenddate)statusdbquery.createdAt={$gte:statusstartdate,$lte:statusenddate.setHours(23, 59, 59)}
        if(status==="unCompleteProfiles")statusdbquery.isComplete=false
        if(status==="blockedUsers")statusdbquery.isBlocked=true
        if(status==="activeUsers")statusdbquery.isBlocked=false
        if(status==="dailyVisits")statusdbquery.lastLoginDate={ "$gt": new Date().setHours(0) }
        if(status==="newUsers")statusdbquery.createdAt={ "$gt": new Date().setHours(0) }
        // console.log
        // ("startdate => ",startdate)
        // console.log
        // ("enddate => ",enddate)
        if(req.query.speciesID)petdbquery.species=req.query.speciesID
        const totalusers = await User.find(dbquery).countDocuments()
        const users = await User.find(statusdbquery).countDocuments()
        const pets = await Pet.find(petdbquery).countDocuments()
        
        // 12/1/2021

        // const users = await User.find().countDocuments();
        const unCompleteProfiles = await User.find({ isComplete: false }).countDocuments();
        const blockedUser = await User.find({ isBlocked: true }).countDocuments();
        const activeUsers = await User.find({ isBlocked: false }).countDocuments();
        const dailyVisits = await User.find({ lastLoginDate: { "$gt": new Date().setHours(0) } }).countDocuments();
        const newUsers = await User.find({ createdAt: { "$gt": new Date().setHours(0) } }).countDocuments();
        const onlineUser = await User.find({ online: true }).countDocuments()
        // const pets = await Pet.find().countDocuments();
        
        // 12/1/2021

        // const petsbyGroup = await Pet.aggregate()
        //     .group({
        //         _id: {
        //             month: { $month: "$createdAt" },
        //             day: { $dayOfMonth: "$createdAt" },
        //             year: { $year: "$createdAt" }
        //         },
        //         count: { $sum: 1 }
        //     })
        // const onlineUser = random(0, 3);
        // return res.status(200).json({ success: true, data: { totalusers,users,onlineUser,pets }, msg: "ok", status: 200 });
        return res.status(200).json({
            success: true,
            data: {
                totalusers,
                users,
                unCompleteProfiles,
                blockedUser,
                activeUsers,
                dailyVisits,
                newUsers,
                onlineUser,
                pets
            },
            msg: "ok", 
            status: 200
        });
    } catch (error) {
        return next(error);
    }
})
router.get("/petBySpecies",requireSignin,async (req,res,next)=>{
    try {
        let species = req.query.speciesID
        const countPets = await Pet.find({species}).countDocuments()
        return res.status(200).json({success:true, data:{countPets},msg:"ok",status:200})
        // const countPets = await Pet.aggregate([
        //     {$lookup:{from:"users",localField:"owner",foreignField:"_id",as:"owner"}}
        // ])
        // let arr=[],array_num_repeat = []
        // countPets.forEach(el=>arr.push(el.owner))
        // arr.forEach(el=>array_num_repeat.push(arr.filter(x=>x === el).length))
        // console.log("hello => ",arr[array_num_repeat.indexOf(Math.max(...array_num_repeat))])
        // return res.status(200).json({success:true, data:{countPets},msg:"ok",status:200})
    } catch (error) {
        return next(error)
    }
})
router.put("/fcmToken", requireSignin, async (req, res, next) => {
    try {
        const user = await Admin.findByIdAndUpdate(req.user.id, { fcmToken: req.body.fcmToken ? req.body.fcmToken : "" }, { new: true })
        return res.status(200).json({ success: true, data: { fcmToken: user.fcmToken }, msg: "ok", status: 200 });
    } catch (error) {
        return next(error);
    }
});
// const sleep = () => {
//     return new Promise((resolve, reject) => {
//         setTimeout(() => {
//             resolve("ok")
//         }, 5000)
//     })
// }
router.get("/adminnotification", requireSignin, async (req, res, next) => {
    try {
        // await sleep()

        const blog = "5fb635a2821a6608c05a2778"
        const notification = await PushNotificationService.notifySingleDevice({
            title: 'Test ',
            body: 'Test Body '
        }, req.user.fcmToken, { _id: req.user._id.toString(), type: '1', route: `https://admin.mazito.io/appuser/appuserdetail/${blog}` });
        return res.status(200).json({ success: true, data: { notification }, msg: "ok", status: 200 });

    } catch (error) {
        return next(error);
    }
})
router.post("/androidapkversion", async (req, res, next) => {
    try {
        const version = new Version(req.body);
        await version.save()
        return res.status(200).json({ success: true, data: { version }, msg: "ok", status: 200 });

    } catch (error) {
        return next(error);
    }
})
router.get("/androidapkversion", async (req, res, next) => {
    try {
        const version = await Version.find().sort({ createdAt: -1 });
        return res.status(200).json({ success: true, data: { version }, msg: "ok", status: 200 });
    } catch (error) {
        return next(error);
    }
})

router.post("/uploadphoto", uploadPhoto.single("image"),async(req,res,next)=>{
    try {
        const { file } = req
        if (!file) {
            return next({
                status: 422, errors: {
                    photo: {
                        "msg": "image must required",
                        "param": "image",
                        "location": "body"
                    }
                }, msg: "Validation Error"
            });
        }
        return res.status(200).json({ success: true, data: { url:file.location }, msg: "ok", status: 200 });
    } catch (error) {
        return next(error)
    }
})

module.exports = router;