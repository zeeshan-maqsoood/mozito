const router = require("express").Router();
const {
    User,
    Pet,
    Notification,
    Post
} = require("../../models")
const mongoose = require("mongoose")
const { postAndNotificationValidator } = require("../../validator/adminValidation")
const { upload } =require("../../s3")
const Upload = upload("app/post");
const mime = require("mime-types")

router.get("/users/all", async (req, res, next) => {
    try {
        const pageNo = Number(req.query.pageNo||1)
        const perPage = Number(req.query.perPage||10)
        let sortBy = req.query.sortBy || "createdAt:-1"
        let sort = sortBy.split(":")
        let by = sort[0]
        if(sort[1]==="-1")sort[1]=-1
        else sort[1]=1
        let order = sort[1]
        let users;
        let counts
        let enddate=req.query.enddate
        let startdate=req.query.startdate
        let filter = {
            ...(startdate&&enddate&&{createdAt:{$gte:startdate,$lte:enddate}})
        }
        let state = {}
        let searchValue,value
        let stateValue,statu
        if(req.query.searchBy){
            let search=req.query.searchBy.split(":")
            searchValue=search[0]
            if(search[0]==="signupSystem")searchValue="signupSystem.osName"
            else if(search[0]==="lastLoginSystem")searchValue="lastLoginSystem.osName"
            else if(search[0]==="city")searchValue="city.name"
            else if(search[0]==="state")searchValue="state.name"
            else if(search[0]==="country")searchValue="country.name"
            value=RegExp(search[1],"i")
            filter[searchValue]=value
        }
        if(req.query.status){
            let stat=req.query.status.split(":")
            if(stat[1]!=="")stateValue=stat[0],statu=true
            if(stat[1]==="false")statu=false
            state={[stateValue]:statu}
        }
            counts = await User.aggregate([
                {
                    $lookup:{
                        from:"pets" ,
                        localField: "_id",
                        foreignField:"owner" ,
                        as:"pets"
                    }
                },
                {
                    $addFields:{
                        pets:{
                            $size:"$pets"
                        },
                        createdAt:{$dateToString:{format:"%Y-%m-%d",date:"$createdAt"}}
                    }
                },
                {$lookup:{
                    from:"countries",as:"country",
                    let:{countryID:"$country"},
                    pipeline:[
                        {$match:{$expr:{$eq:["$_id","$$countryID"]}}},
                        {$project:{name:1}}
                    ]
                }},
                {$lookup:{
                    from:"states",as:"state",
                    let:{stateID:"$state"},
                    pipeline:[
                        {$match:{$expr:{$eq:["$_id","$$stateID"]}}},
                        {$project:{name:1}}
                    ]
                }},
                {$lookup:{
                    from:"cities",as:"city",
                    let:{cityID:"$city"},
                    pipeline:[
                        {$match:{$expr:{$eq:["$_id","$$cityID"]}}},
                        {$project:{name:1}}
                    ]
                }},
                {$unwind:{path:"$city"}},
                {$unwind:{path:"$state"}},
                {$unwind:{path:"$country"}},
                {$project:{
                    resetPassword:0,pet:0,password:0,deleted:0,__v:0,
                    updatedAt:0
                }},
                {$match:filter},
                {$match:state},
                {$count:"count"}
            ])
            users = await User.aggregate([
                {
                    $lookup:{
                        from:"pets" ,
                        localField: "_id",
                        foreignField:"owner" ,
                        as:"pets"
                    }
                },
                {
                    $addFields:{
                        pets:{
                            $size:"$pets"
                        },
                        createdAt:{$dateToString:{format:"%Y-%m-%d",date:"$createdAt"}}
                    }
                },
                {$lookup:{
                    from:"countries",as:"country",
                    let:{countryID:"$country"},
                    pipeline:[
                        {$match:{$expr:{$eq:["$_id","$$countryID"]}}},
                        {$project:{name:1}}
                    ]
                }},
                {$lookup:{
                    from:"states",as:"state",
                    let:{stateID:"$state"},
                    pipeline:[
                        {$match:{$expr:{$eq:["$_id","$$stateID"]}}},
                        {$project:{name:1}}
                    ]
                }},
                {$lookup:{
                    from:"cities",as:"city",
                    let:{cityID:"$city"},
                    pipeline:[
                        {$match:{$expr:{$eq:["$_id","$$cityID"]}}},
                        {$project:{name:1}}
                    ]
                }},
                {$unwind:{path:"$city"}},
                {$unwind:{path:"$state"}},
                {$unwind:{path:"$country"}},
                {$project:{
                    resetPassword:0,pet:0,password:0,deleted:0,__v:0,
                    updatedAt:0
                }},
                {$match:filter},
                {$match:state},
                {$skip:(pageNo<=1?0:(pageNo*perPage)-perPage)},
                {$limit:(perPage)},
                {$sort:{[by]:order}}
            ])
            let count1 = counts.length>0? counts[0].count : 0;
            // if(users.length===0)count1=0
            // console.log("count1 => ",count1)
        return res.status(200).json({ success: true, data: { users, count:count1 }, msg: "ok", status: 200 });
    } catch (error) {
        return next(error);
    }
});
router.get("/users/signupdevice",async(req,res,next)=>{
    try {
        let value=RegExp(req.query.devicename,"i")
        let search
        if(value)search="signupSystem.osName"
        let usercounts = await User.find({[search]:value}).countDocuments()
        // let usercounts = await User.aggregate([
        //     {
        //         $lookup:{
        //             from:"pets" ,
        //             localField: "_id",
        //             foreignField:"owner" ,
        //             as:"pets"
        //         }
        //     },
        //     {
        //         $addFields:{
        //             pets:{
        //                 $size:"$pets"
        //             },
        //             createdAt:{$dateToString:{format:"%Y-%m-%d",date:"$createdAt"}}
        //         }
        //     },
        //     {$lookup:{
        //         from:"countries",as:"country",
        //         let:{countryID:"$country"},
        //         pipeline:[
        //             {$match:{$expr:{$eq:["$_id","$$countryID"]}}},
        //             {$project:{name:1}}
        //         ]
        //     }},
        //     {$lookup:{
        //         from:"states",as:"state",
        //         let:{stateID:"$state"},
        //         pipeline:[
        //             {$match:{$expr:{$eq:["$_id","$$stateID"]}}},
        //             {$project:{name:1}}
        //         ]
        //     }},
        //     {$lookup:{
        //         from:"cities",as:"city",
        //         let:{cityID:"$city"},
        //         pipeline:[
        //             {$match:{$expr:{$eq:["$_id","$$cityID"]}}},
        //             {$project:{name:1}}
        //         ]
        //     }},
        //     {$unwind:{path:"$city"}},
        //     {$unwind:{path:"$state"}},
        //     {$unwind:{path:"$country"}},
        //     {$project:{
        //         resetPassword:0,pet:0,password:0,deleted:0,__v:0,
        //         updatedAt:0
        //     }},
        //     {$match:{[search]:value}},
        //     {$count:"count"},
        // ])
        return res.status(200).json({succes:true,data:{usercounts},msg:"ok",status:200})
    } catch (error) {
        return next(error)
    }
})
// router.get("/users/pets/:id", async (req, res, next) => {
//     try {
//         const pets = await Pet.find({ owner: req.params.id })
//             .populate("country", "name")
//             .populate("state", "name")
//             .populate("city", "name")
//             .populate("species", "name")
//             .populate("breed", "name")
//             .populate("interest", "name")
//         return res.status(200).json({ success: true, data: { pets }, msg: "ok", status: 200 });
//     } catch (error) {
//         return next(error);
//     }
// });

router.put("/users/block/:id", async (req, res, next) => {
    try {
        const user = await User.findByIdAndUpdate(req.params.id, { isBlocked: true, blockBy: req.user._id }, { new: true })
            .populate("country", "name")
            .populate("state", "name")
            .populate("city", "name")
            .populate("pet")
        if (!user) return next({ status: 404, msg: "user not found" });
        return res.status(200).json({ success: true, data: { user }, msg: "ok", status: 200 });
    } catch (error) {
        return next(error);
    }
});
router.put("/users/unblock/:id", async (req, res, next) => {
    try {
        const user = await User.findByIdAndUpdate(req.params.id, { isBlocked: false, unblockBy: req.user._id }, { new: true })
            .populate("country", "name")
            .populate("state", "name")
            .populate("city", "name")
            .populate("pet")
        if (!user) return next({ status: 404, msg: "user not found" });
        return res.status(200).json({ success: true, data: { user }, msg: "ok", status: 200 });
    } catch (error) {
        return next(error);
    }
});

router.route("/users/:id")
    .get(async (req, res, next) => {
        try {
            const perPage = Number(req.query.perPage||10)
            const pageNo = Number(req.query.pageNo||1)
            let sortBy = req.query.sortBy || "name:1"
            let sort = sortBy.split(":")
            let by,order
            by =sort[0]
            if(sort[1] === "-1")order=-1
            else order=1
            let filter={
                owner: req.params.id
            }
            if(req.query.searchBy){
                let search=req.query.searchBy.split(":")
                filter[search[0]]=RegExp(search[1],"i")
            }
            // let pets
            const user = await User.findById({ _id: req.params.id })
                .populate("country", "name")
                .populate("state", "name")
                .populate("city", "name")
                // .populate("pet")
                .select("-password -__v")
            const pets = await Pet.find(filter)
                .populate("country", "name")
                .populate("state", "name")
                .populate("city", "name")
                .populate("species", "name")
                .populate("speciesType", "name")
                .populate("breed", "name")
                .populate("interest", "name")
                .skip(pageNo<=1?0:(pageNo*perPage)-perPage)
                .limit(perPage)
                .sort({[by]:order})
            const count = await Pet.countDocuments(filter)
            // pets = await Pet.aggregate([
            //     {$match:{owner:mongoose.Types.ObjectId(req.params.id)}},
            //     {$lookup:{
            //         from:"breeds",as:"breed",
            //         let:{breedID:"$breed"},
            //         pipeline:[
            //             {$match:{$expr:{$eq:["$_id","$$breedID"]}}},
            //             {$project:{name:1}}
            //         ]
            //     }},
            //     {$lookup:{
            //         from:"species",as:"species",
            //         let:{speciesID:"$species"},
            //         pipeline:[
            //             {$match:{$expr:{$eq:["$_id","$$speciesID"]}}},
            //             {$project:{name:1}}
            //         ]
            //     }},
            //     {$unwind:{path:"$breed"}},
            //     {$unwind:{path:"$species"}},
            //     {$skip:(pageNo<=1?0:(pageNo*perPage)-perPage)},
            //     {$limit:(perPage)}
            // ])
            if (!user) return next({ status: 404, msg: "Profile not found" });
            return res.status(200).json({ success: true, data: { user, pets, count }, msg: "ok", status: 200 });
        } catch (error) {
            return next(error);
        }
    })

router.post("/mazitopet", Upload.array("files",4), postAndNotificationValidator, async (req, res, next) => {
    try {
        const { body } = req
        const users = await User.find()
        let notificationsList = []
        const { files } = req
        users.map(e=>{
            notificationsList.push({
                to: e._id,
                toPet: e.selected_pet,
                fromPet: "6156f131cff1a4b5e17a0460",
                title: body.title,
                body: body.body
            })
        })
        
        await Notification.insertMany(notificationsList)
        const post = new Post({
            description: body.body,
            pet: "6156f131cff1a4b5e17a0460",
            public: true
        })
        if (files.length>0) {
            const contetList=files.map((file,i) =>{
                console.log(`file ${[i]} =>`,file);
                const mimetype = mime.lookup(file.originalname);
                let isVideo=false;
                if(mimetype){
                    isVideo=file.contentType.split("/")[0]==="video"?true:false;
                }
                return {
                    mimetype:file.contentType,
                    isVideo,
                    media: {
                        key:file.key,
                        url: file.location
                    }
                }
            })
            console.log("contetList =>",contetList);
            post.contetList=contetList;
            if(contetList.length>0){
                post.content=contetList[0];
            }
        }
        await post.save()
        return res.status(200).json({ success: true, data: {}, msg: "Notifications and public post created successfully", status: 200 });
    } catch (error) {
        return next(error);
    }
});

// router.delete("/del", async (req, res, next) => {
//     try {
//         let del_n=await Notification.deleteMany({title:"From Admin"})
//         let del_p=await Post.deleteMany({description:"Mazito Post"})
//         return res.status(200).json({ success: true, data: {del_n,del_p}, msg: "ok", status: 200 });
//     } catch (error) {
//         return next(error);
//     }
// });

module.exports = router;
