const router = require("express").Router();
const { Admin, User } = require("../../models");
const { isAdmin, isSuperAdmin, requireSignin } = require("../../middlewares/adminAuth");
const { updateRoleValidator } = require("../../validator");
const { idValidator } = require("../../middlewares");
const { validationResult } = require("express-validator");
router.param("id", idValidator)
router.get('/all', async (req, res, next) => {
    try {
        const perPage = Number(req.query.perPage||10)
        const pageNo = Number(req.query.pageNo||1)
        // let sortBy = req.query.sortBy || "username:1"
        let sortBy = req.query.sortBy || "createdAt:-1"
        let sort = sortBy.split(":")
        let by,order
        by=sort[0]
        if(sort[1]==="-1")order=-1
        else order=1
        let userList;
        let count
        let filter={}
        let searchValue,value
        if(req.query.searchBy){
            let search=req.query.searchBy.split(":")
            searchValue=search[0]
            if(search[0]==="role")searchValue="role.name"
            value=RegExp(search[1],"i")
            filter = {[searchValue]:value}
        }
        count = await Admin.aggregate([
            {$match:{
                "block.status":false
            }},
            {$lookup:{
                from:"roles",as:"role",
                let:{roleID:"$role"},
                pipeline:[
                    {$match:{$expr:{$eq:["$_id","$$roleID"]}}},
                    {$project:{name:1}}
                ]
            }},
            {$lookup:{
                from:"admins",as:"block.by",
                let:{byID:"$block.by"},
                pipeline:[
                    {$match:{$expr:{$eq:["$_id","$$byID"]}}},
                    {$project:{username:1}}
                ]
            }},
            {$lookup:{
                from:"admins",as:"addedBy",
                let:{addedByID:"$addedBy"},
                pipeline:[
                    {$match:{$expr:{$eq:["$_id","$$addedByID"]}}},
                    {$project:{username:1}}
                ]
            }},
            {$unwind:{path:"$role"}},
            {$unwind:{path:"$block.by",preserveNullAndEmptyArrays:true}},
            {$unwind:{path:"$addedBy",preserveNullAndEmptyArrays:true}},
            {$project:{password:0,__v:0}},
            {$match:filter},
            {$count:"count"}
        ])
        userList = await Admin.aggregate([
            {$match:{
                "block.status":false
            }},
            {$lookup:{
                from:"roles",as:"role",
                let:{roleID:"$role"},
                pipeline:[
                    {$match:{$expr:{$eq:["$_id","$$roleID"]}}},
                    {$project:{name:1}}
                ]
            }},
            {$lookup:{
                from:"admins",as:"block.by",
                let:{byID:"$block.by"},
                pipeline:[
                    {$match:{$expr:{$eq:["$_id","$$byID"]}}},
                    {$project:{username:1}}
                ]
            }},
            {$lookup:{
                from:"admins",as:"addedBy",
                let:{addedByID:"$addedBy"},
                pipeline:[
                    {$match:{$expr:{$eq:["$_id","$$addedByID"]}}},
                    {$project:{username:1}}
                ]
            }},
            {$unwind:{path:"$role"}},
            {$unwind:{path:"$block.by",preserveNullAndEmptyArrays:true}},
            {$unwind:{path:"$addedBy",preserveNullAndEmptyArrays:true}},
            {$project:{password:0,__v:0}},
            {$match:filter},
            {$skip:(pageNo<=1?0:(pageNo*perPage)-perPage)},
            {$limit:(perPage)},
            {$sort:{[by]:order}}
        ])
        // if (req.query.search) {
        //     const query = RegExp(req.query.search, "i")
        //     userList = await Admin.aggregate([
        //         {$lookup:{
        //             from:"roles",as:"role",
        //             let:{roleID:"$role"},
        //             pipeline:[
        //                 {$match:{$expr:{$eq:["$_id","$$roleID"]}}},
        //                 {$project:{name:1}}
        //             ]
        //         }},
        //         {$unwind:{path:"$role"}},
        //         {$project:{password:0}},
        //         {$match:{$or:[{email:query},{username:query},{"role.name":query}]}},
        //         {$skip:(pageNo<=1?0:(pageNo*perPage)-perPage)},
        //         {$limit:(perPage)}
        //     ])
        //     // userList = await Admin.find({ $or: [{ email: query }, { username: query },{"role.name":query}] })
        //     //     .populate("role", "name")
        //     //     .populate("addedBy", "name")
        // }
        // else if(req.query.sortByName){
        //     userList = await Admin.aggregate([
        //         {$lookup:{
        //             from:"roles",as:"role",
        //             let:{roleID:"$role"},
        //             pipeline:[
        //                 {$match:{$expr:{$eq:["$_id","$$roleID"]}}},
        //                 {$project:{name:1}}
        //             ]
        //         }},
        //         {$unwind:{path:"$role"}},
        //         {$project:{password:0}},
        //         {$skip:(pageNo<=1?0:(pageNo*perPage)-perPage)},
        //         {$limit:(perPage)},
        //         {$sort:{username:Number(req.query.sortByName)}}
        //     ])
        // }
        // else {
        //     userList = await Admin.aggregate([
        //         {$lookup:{
        //             from:"roles",as:"role",
        //             let:{roleID:"$role"},
        //             pipeline:[
        //                 {$match:{$expr:{$eq:["$_id","$$roleID"]}}},
        //                 {$project:{name:1}}
        //             ]
        //         }},
        //         {$unwind:{path:"$role"}},
        //         {$project:{password:0}},
        //         {$skip:(pageNo<=1?0:(pageNo*perPage)-perPage)},
        //         {$limit:(perPage)}
        //     ])
        //     // userList = await Admin.find().populate("role", "name")
        //     //             .limit(perPage).skip(pageNo<=1?0:(pageNo*perPage)-perPage)
        // }
        let count1 = count.length>0? count[0].count : 0;
        return res.status(200).json({ success: true, data: { users: userList, count:count1 }, msg: "ok", status: 200 });
    } catch (error) {
        return next(error);
    }
});

router.get("/unblocked", async (req, res, next) => {
    try {
        const userList = await Admin.find({
            "block.status": { $ne: true }
        }).select({ password: false });
        return res.status(200).json({ success: true, data: { users: userList }, msg: "ok", status: 200 });
    } catch (error) {
        return next(error);
    }
});

router.get("/blocked", async (req, res, next) => {
    try {
        const perPage = Number(req.query.perPage||10)
        const pageNo = Number(req.query.pageNo||1)
        let sortBy = req.query.sortBy || "createdAt:1"
        let sort = sortBy.split(":")
        let by,order
        by=sort[0]
        if(sort[1]==="-1")order=-1
        else order=1
        let blockUser;
        let count
        let filter={}
        let searchValue,value
        if(req.query.searchBy){
            let search=req.query.searchBy.split(":")
            searchValue=search[0]
            if(search[0]==="role")searchValue="role.name"
            value=RegExp(search[1],"i")
            filter = {[searchValue]:value}
        }
        count=await Admin.aggregate([
            {$lookup:{
                from:"roles",as:"role",
                let:{roleID:"$role"},
                pipeline:[
                    {$match:{$expr:{$eq:["$_id","$$roleID"]}}},
                    {$project:{name:1,features:1}}
                ]
            }},
            {$lookup:{
                from:"admins",as:"block.by",
                let:{byID:"$block.by"},
                pipeline:[
                    {$match:{$expr:{$eq:["$_id","$$byID"]}}},
                    {$project:{username:1}}
                ]
            }},
            {$lookup:{
                from:"admins",as:"addedBy",
                let:{addedByID:"$addedBy"},
                pipeline:[
                    {$match:{$expr:{$eq:["$_id","$$addedByID"]}}},
                    {$project:{username:1}}
                ]
            }},
            {$unwind:{path:"$role"}},
            {$unwind:{path:"$block.by",preserveNullAndEmptyArrays:true}},
            {$unwind:{path:"$addedBy",preserveNullAndEmptyArrays:true}},
            {$match:{"block.status":true}},
            {$project:{password:0,__v:0}},
            {$match:filter},
            {$count:"count"}
        ])
        blockUser = await Admin.aggregate([
            {$lookup:{
                from:"roles",as:"role",
                let:{roleID:"$role"},
                pipeline:[
                    {$match:{$expr:{$eq:["$_id","$$roleID"]}}},
                    {$project:{name:1,features:1}}
                ]
            }},
            {$lookup:{
                from:"admins",as:"block.by",
                let:{byID:"$block.by"},
                pipeline:[
                    {$match:{$expr:{$eq:["$_id","$$byID"]}}},
                    {$project:{username:1}}
                ]
            }},
            {$lookup:{
                from:"admins",as:"addedBy",
                let:{addedByID:"$addedBy"},
                pipeline:[
                    {$match:{$expr:{$eq:["$_id","$$addedByID"]}}},
                    {$project:{username:1}}
                ]
            }},
            {$unwind:{path:"$role"}},
            {$unwind:{path:"$block.by",preserveNullAndEmptyArrays:true}},
            {$unwind:{path:"$addedBy",preserveNullAndEmptyArrays:true}},
            {$match:{"block.status":true}},
            {$project:{password:0,__v:0}},
            {$match:filter},
            {$skip:(pageNo<=1?0:(pageNo*perPage)-perPage)},
            {$limit:(perPage)},
            {$sort:{[by]:order}}
        ])
        // if(req.query.sortByName){
        //     blockUser = await Admin.aggregate([
        //         {$lookup:{
        //             from:"roles",as:"role",
        //             let:{roleID:"$role"},
        //             pipeline:[
        //                 {$match:{$expr:{$eq:["$_id","$$roleID"]}}},
        //                 {$project:{name:1,features:1}}
        //             ]
        //         }},
        //         {$match:{"block.status":true}},
        //         {$unwind:{path:"$role"}},
        //         {$project:{password:0}},
        //         {$skip:(pageNo<=1?0:(pageNo*perPage)-perPage)},
        //         {$limit:(perPage)},
        //         {$sort:{username:Number(req.query.sortByName)}}
        //     ])
        // }
        // else if(req.query.search){
        //     const query = RegExp(req.query.search,"i")
        //     blockUser = await Admin.aggregate([
        //         {$lookup:{
        //             from:"roles",as:"role",
        //             let:{roleID:"$role"},
        //             pipeline:[
        //                 {$match:{$expr:{$eq:["$_id","$$roleID"]}}},
        //                 {$project:{name:1,features:1}}
        //             ]
        //         }},
        //         {$match:{$or:[{username:query},{email:query},{"role.name":query}]}},
        //         {$match:{"block.status":true}},
        //         {$unwind:{path:"$role"}},
        //         {$project:{password:0}},
        //         {$skip:(pageNo<=1?0:(pageNo*perPage)-perPage)},
        //         {$limit:(perPage)}
        //     ])
        // }
        // else{
        //     blockUser = await Admin.aggregate([
        //         {$lookup:{
        //             from:"roles",as:"role",
        //             let:{roleID:"$role"},
        //             pipeline:[
        //                 {$match:{$expr:{$eq:["$_id","$$roleID"]}}},
        //                 {$project:{name:1,features:1}}
        //             ]
        //         }},
        //         {$match:{"block.status":true}},
        //         {$unwind:{path:"$role"}},
        //         {$project:{password:0}},
        //         {$skip:(pageNo<=1?0:(pageNo*perPage)-perPage)},
        //         {$limit:(perPage)}
        //     ])
        // }
        // const blockUser = await Admin.find({
        //     "block.status": true
        // }).select({ password: false })
        //     .populate("role", "name features")
        let count1 = count.length>0? count[0].count : 0;
        return res.status(200).json({ success: true, data: { users: blockUser,count:count1 }, msg: "ok", status: 200 });
    } catch (error) {
        return next(error);
    }
});

// app user
router.get("/uncomplete", async (req, res, next) => {
    try {
        const uncompleteProfile = await User.find({ name: { $eq: null } }).countDocuments();
        return res.status(200).json({ success: true, data: { total: uncompleteProfile }, msg: "ok", status: 200 });
    } catch (error) {
        return next(error);
    }
});

router.put("/block/:id", isSuperAdmin, async (req, res, next) => {
    try {
        const block = {
            status: false,
            date: Date.now(),
            by: req.user._id
        }
        // const user= await User.findById(req.params.id);

        const user = await Admin.findByIdAndUpdate(
            req.params.id,
            {
                block
            }, { new: true })
            .populate("role", "features name")
            .select({ password: false });
        if (!user) return next({ status: 404, msg: "user not found" });
        return res.status(200).json({ success: true, data: { user }, msg: "ok", status: 200 });
    } catch (error) {
        return next(error);
    }
});

router.put("/unblock/:id", isSuperAdmin, async (req, res, next) => {
    try {
        const block = {
            status: false,
            date: Date.now(),
            by: req.user._id
        }
        const user = await Admin.findByIdAndUpdate(
            req.params.id,
            {
                block
            }, { new: true })
            .populate("role", "features name")
            .select({ password: false });
        if (!user) return next({ status: 404, msg: "user not found" });
        return res.status(200).json({ success: true, data: { user }, msg: "ok", status: 200 });
    } catch (error) {
        next(error);
    }
});

router.get("/petowner",async(req,res,next)=>{
    try {
        let petowner = await User.aggregate([
            {$lookup:{from:"pets",localField:"_id",foreignField:"owner",as:"petowner"}},
            {$addFields:{petowner:{$size:"$petowner"}}},
            {$project:{petowner:1}}
        ])
        let array_num_repeat = []
        petowner.forEach(el=>array_num_repeat.push(el.petowner))
        let largest = array_num_repeat[0]
        for (let i = 0; i < array_num_repeat.length; i++) {
            if (largest < array_num_repeat[i] ) {
                largest = array_num_repeat[i];
            }
        }
        let mostpetowner = await User.aggregate([
            {$lookup:{from:"pets",localField:"_id",foreignField:"owner",as:"petowner"}},
            {$addFields:{petowner:{$size:"$petowner"}}},
            {$project:{petowner:1,name:1}},
            {$match:{petowner:largest}}
        ])
        return res.status(200).json({ success: true, data: { mostpetowner }, msg: "ok", status: 200 })
    } catch (error) {
        return next(error)
    }
})

// app user
router.get("/newusers", async (req, res, next) => {
    try {
        const d = new Date();
        const d1 = new Date().setFullYear(d.getFullYear(), d.getMonth(), d.getDay() - 7);
        const users = await User.find({ createdAt: { $gt: new Date(d1) } })
        return res.status(200).json({ success: true, data: { users }, msg: "ok", status: 200 });
    } catch (error) {
        return next(error);
    }
});

router.put("/updateRole/:id", requireSignin, updateRoleValidator, isSuperAdmin, async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return next({ status: 400, errors: errors.mapped(), msg: "Validation Failed" })
        }
        const user = await Admin.findByIdAndUpdate(req.params.id, { role: req.body.role }, { new: true })
            .select({ password: false })
            .populate("role", "name")
            .populate("addedBy", "name")
        if (!user) return next({ status: 404, msg: "User not found" });
        return res.status(200).json({ success: true, data: { user }, msg: "ok", status: 200 });

    } catch (error) {
        return next(error);
    }
})

router.get('/signupdevice',async(req,res,next)=>{
    try {
        const Android_user=await User.find({signup_device:"Android"}).countDocuments()
        const iOS_user=await User.find({signup_device:"iOS"}).countDocuments()
        return res.status(200).json({ success: true, data: { Android_user,iOS_user }, msg: "ok", status: 200 })
    } catch (error) {
        return next(error)
    }
})

router.get('/:id',async(req,res,next)=>{
    try {
        const admin=await Admin.findById({_id:req.params.id})
        .populate("role","name features")
        .populate("block.by","username")
        .select("-password -__v")
        return res.status(200).json({ success: true, data: { admin }, msg: "ok", status: 200 })
    } catch (error) {
        return next(error)
    }
})

module.exports = router;