const express = require("express")
const router = express.Router()
const {
    Feedback,
    User,
    Notification,
    Pet
} = require("../../models")
const mongoose = require("mongoose")
const nodemailer = require("nodemailer")

router.get("/", async (req, res, next) => {
    try {
        let pageNo=Number(req.query.pageNo||1)
        let perPage=Number(req.query.perPage||10)
        let sortBy=req.query.sortBy||"createdAt:-1"
        let sort=sortBy.split(":")
        let by,order
        by=sort[0]
        sort[1]==="-1"?order=-1:order=1
        let filter={}
        if(req.query.searchBy){
            let search=req.query.searchBy.split(":")
            if(search[0]==="user")search[0]="user.name"
            filter={[search[0]]:RegExp(search[1],"i")}
        }
        const feedback = await Feedback.aggregate([
            {$lookup:{
                from:"users",as:"user",
                let:{userID:"$user"},
                pipeline:[
                    {$match:{$expr:{$eq:["$_id","$$userID"]}}},
                    {$project:{name:1,email:1}}
                ]
            }},
            {$unwind:{
                path:"$user",preserveNullAndEmptyArrays:true
            }},
            {$match:filter},
            {$skip:pageNo<=1?0:(pageNo*perPage)-perPage},
            {$limit:perPage},
            {$sort:{[by]:order}}
        ])
        const counts = await Feedback.aggregate([
            {$lookup:{
                from:"users",as:"user",
                let:{userID:"$user"},
                pipeline:[
                    {$match:{$expr:{$eq:["$_id","$$userID"]}}},
                    {$project:{name:1,email:1}}
                ]
            }},
            {$unwind:{
                path:"$user",preserveNullAndEmptyArrays:true
            }},
            {$match:filter},
            {$count:"count"}
        ])
        let count
        if(counts.length>0)count=counts[0].count
        else count=0
        return res.status(200).json({ success: true, data: { count,feedback }, msg: "ok", status: 200 });
    } catch (error) {
        return next(error);
    }
});

router.post("/replytouser/:id", async (req, res, next) => {
    try {
        let filter = {_id:mongoose.Types.ObjectId(req.params.id)}
        
        let feedback = await Feedback.findOne(filter)
        let mazitoPet = await Pet.findById({_id:"6156f131cff1a4b5e17a0460"})
        if(!feedback) return next({ status: 404, msg: "feedback is not found" })
        let user = await User.findOne({_id:feedback.user})
        if(!user) return next({ status: 404, msg: "User not found or deleted." })
        // console.log("feedback => ",feedback)
        let { body } = req
        if(!body.body) return next({ msg:"body is required" })
        let notification = new Notification({
            to:user._id,
            fromPet:mazitoPet._id,
            toPet:user.selected_pet,
            title:`Message From Mazito Admin of your ${feedback.title} feedback.`,
            body:body.body
        })
        await notification.save()
        let transporter = nodemailer.createTransport({
            service: "IMAP Mail Server",
            host: "mail.mazito.io",
            security: true,
            port: 465,
            auth: {
                user: process.env.ADMIN_EMAIL,
                pass: process.env.ADMIN_PASSWORD
            }
        })
        // console.log("notification.title => ",notification.title)
        let mailOptions = {
            from: process.env.ADMIN_EMAIL,
            to: user.email,
            // to:"moizrasheed2019@outlook.com",
            subject: notification.title,
            html: body.body
        }
        transporter.sendMail(mailOptions).then(() => {
            console.log(`${notification.title} mail sent to ${user.email}`);
        })
        .catch((err) => {
            console.error("error from [Mail]", err);
        })
        return res.status(200).json({ success: true, data: { notification }, msg: "ok", status: 200 });
    } catch (error) {
        return next(error);
    }
});

module.exports=router