const express = require("express")
const router = express.Router()
const {Post,Notification,PostReport,Pet,Media,Friends} = require("../../models")
const mongoose = require("mongoose")

router.get("/journey",async(req,res,next)=>{
    try {
        // let filter={}
        let perPage=Number(req.query.perPage||10)
        let pageNo=Number(req.query.pageNo||0)
        let sortBy=req.query.sortBy||"createdAt:-1"
        let by,order
        let sort=sortBy.split(":")
        by=sort[0]
        if(sort[1]==="-1")order=-1
        else order=1
        // if(req.query.searchBy){
        //     let search=req.query.searchBy.split(":")
        //     filter={[search[0]]:RegExp(search[1],"i")}
        // }
        let count=await Post.countDocuments()
        let journey=await Post.aggregate([
            {$lookup:{from:"users",as:"owner",
                let:{ownerID:"$owner"},
                pipeline:[
                    {$match:{$expr:{$eq:["$_id","$$ownerID"]}}},
                    {$project:{name:1}}
                ]
            }},
            {$lookup:{from:"pets",as:"pet",
                let:{petID:"$pet"},
                pipeline:[
                    {$match:{$expr:{$eq:["$_id","$$petID"]}}},
                    {$project:{name:1,photo:1}}
                ]
            }},
            {
                $lookup: {
                  from: "comments",
                  localField: "_id",
                  foreignField: "post",
                  as: "comments",
                },
              },
            // {$lookup:{from:"comments",as:"comments",
            //     let:{commentsID:"$comments"},
            //     pipeline:[
            //         {$match:{$expr:{$eq:["$_id","$$commentsID"]}}}
            //     ]
            // }},
            {$unwind:{path:"$owner",preserveNullAndEmptyArrays:true}},
            {$unwind:{path:"$pet",preserveNullAndEmptyArrays:true}},
            // {$unwind:{path:"$comments",preserveNullAndEmptyArrays:true}},
            {$addFields:{
                likes:{$size:"$likes"},
                shares:{$size:"$shares"},
                views:{$size:"$views"},
                commentsCount: {
                    $size: "$comments",
                },
                hidePostByUsers:{$size:{$ifNull:["$hidePost",[]]}}
            }
            },
            {$project:{__v:0,deleted:0,comments:0,hidePostAdmin:0}},
            {$sort:{[by]:order}},
            {$skip:pageNo<=1?0:(pageNo*perPage)-perPage},
            {$limit:perPage}
        ])
        return res.status(200).json({ success: true, data: { count,journey }, msg: "ok", status: 200 })
    } catch (error) {
        next(error)
    }
})

router.get("/mostlikesphotovideo",async(req,res,next)=>{
    try {
        let start=req.query.startdate
        let end=req.query.enddate
        let journey=await Post.aggregate([
            {$lookup:{from:"users",as:"owner",
                let:{ownerID:"$owner"},
                pipeline:[
                    {$match:{$expr:{$eq:["$_id","$$ownerID"]}}},
                    {$project:{name:1}}
                ]
            }},
            {$lookup:{from:"pets",as:"pet",
                let:{petID:"$pet"},
                pipeline:[
                    {$match:{$expr:{$eq:["$_id","$$petID"]}}},
                    {$project:{name:1,photo:true}}
                ]
            }},
            {
                $lookup: {
                  from: "comments",
                  localField: "_id",
                  foreignField: "post",
                  as: "comments",
                },
              },
            {$unwind:{path:"$owner",preserveNullAndEmptyArrays:true}},
            {$unwind:{path:"$pet",preserveNullAndEmptyArrays:true}},
            {$addFields:{
                likes:{$size:"$likes"},
                shares:{$size:"$shares"},
                views:{$size:"$views"},
                commentsCount: {
                    $size: "$comments",
                },
                createdAt:{ $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }
                }
            },
            {$project:{__v:0,deleted:0,comments:0}},
            {$match:{createdAt:{$lte:end,$gte:start}}}
        ])
        let array_num_repeat = []
        journey.forEach(el=>array_num_repeat.push(el.likes))
        let largest = array_num_repeat[0]
        // console.log("array_num_repeat => ",array_num_repeat)
        for (let i = 0; i < array_num_repeat.length; i++) {
            if (largest < array_num_repeat[i] ) {
                largest = array_num_repeat[i];
            }
        }
        // console.log("largest => ",largest)
        let mostlikes=await Post.aggregate([
            {$lookup:{from:"users",as:"owner",
                let:{ownerID:"$owner"},
                pipeline:[
                    {$match:{$expr:{$eq:["$_id","$$ownerID"]}}},
                    {$project:{name:1}}
                ]
            }},
            {$lookup:{from:"pets",as:"pet",
                let:{petID:"$pet"},
                pipeline:[
                    {$match:{$expr:{$eq:["$_id","$$petID"]}}},
                    {$project:{name:1,photo:true}}
                ]
            }},
            {
                $lookup: {
                  from: "comments",
                  localField: "_id",
                  foreignField: "post",
                  as: "comments",
                },
              },
            {$unwind:{path:"$owner",preserveNullAndEmptyArrays:true}},
            {$unwind:{path:"$pet",preserveNullAndEmptyArrays:true}},
            {$addFields:{
                likes:{$size:"$likes"},
                shares:{$size:"$shares"},
                views:{$size:"$views"},
                commentsCount: {
                    $size: "$comments",
                },
                createdAt:{ $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }
                }
            },
            {$project:{__v:0,deleted:0,comments:0}},
            {$match:{likes:largest}},
            {$match:{createdAt:{$lte:end,$gte:start}}}
        ])
        return res.status(200).json({ success: true, data: { mostlikes }, msg: "ok", status: 200 })
    } catch (error) {
        next(error)
    }
})

router.get("/mostlikespost",async(req,res,next)=>{
    try {
        let journey=await Post.aggregate([
            {$lookup:{from:"users",as:"owner",
                let:{ownerID:"$owner"},
                pipeline:[
                    {$match:{$expr:{$eq:["$_id","$$ownerID"]}}},
                    {$project:{name:1}}
                ]
            }},
            {$lookup:{from:"pets",as:"pet",
                let:{petID:"$pet"},
                pipeline:[
                    {$match:{$expr:{$eq:["$_id","$$petID"]}}},
                    {$project:{name:1,photo:true}}
                ]
            }},
            {
                $lookup: {
                  from: "comments",
                  localField: "_id",
                  foreignField: "post",
                  as: "comments",
                },
              },
            {$unwind:{path:"$owner",preserveNullAndEmptyArrays:true}},
            {$unwind:{path:"$pet",preserveNullAndEmptyArrays:true}},
            {$addFields:{
                likes:{$size:"$likes"},
                shares:{$size:"$shares"},
                views:{$size:"$views"},
                commentsCount: {
                        $size: "$comments",
                    }
                }
            },
            {$project:{__v:0,deleted:0,comments:0}}
        ])
        let array_num_repeat = []
        journey.forEach(el=>array_num_repeat.push(el.likes))
        let sum = array_num_repeat[0]
        // console.log("array_num_repeat => ",array_num_repeat)
        for (let i = 0; i < array_num_repeat.length; i++) {
            sum += array_num_repeat[i]
            // largest++
            // if (largest < array_num_repeat[i] ) {
            //     largest = array_num_repeat[i];
            // }
        }
        let avg=sum/array_num_repeat.length
        // console.log("sum => ",sum)
        // console.log("avg => ",avg)
        let perPage=Number(req.query.perPage||10)
        let pageNo=Number(req.query.pageNo||1)
        let mostlikespost=await Post.aggregate([
            {$lookup:{from:"users",as:"owner",
                let:{ownerID:"$owner"},
                pipeline:[
                    {$match:{$expr:{$eq:["$_id","$$ownerID"]}}},
                    {$project:{name:1}}
                ]
            }},
            {$lookup:{from:"pets",as:"pet",
                let:{petID:"$pet"},
                pipeline:[
                    {$match:{$expr:{$eq:["$_id","$$petID"]}}},
                    {$project:{name:1,photo:true}}
                ]
            }},
            {
                $lookup: {
                  from: "comments",
                  localField: "_id",
                  foreignField: "post",
                  as: "comments",
                },
              },
            {$unwind:{path:"$owner",preserveNullAndEmptyArrays:true}},
            {$unwind:{path:"$pet",preserveNullAndEmptyArrays:true}},
            {$addFields:{
                likes:{$size:"$likes"},
                shares:{$size:"$shares"},
                views:{$size:"$views"},
                commentsCount: {
                        $size: "$comments",
                    }
                }
            },
            {$project:{__v:0,deleted:0,comments:0}},
            {$match:{likes:{$gte:avg}}},
            {$sort:{likes:-1}},
            {$skip:(pageNo-1)*perPage},
            {$limit:perPage}
        ])
        let counts=await Post.aggregate([
            {$lookup:{from:"users",as:"owner",
                let:{ownerID:"$owner"},
                pipeline:[
                    {$match:{$expr:{$eq:["$_id","$$ownerID"]}}},
                    {$project:{name:1}}
                ]
            }},
            {$lookup:{from:"pets",as:"pet",
                let:{petID:"$pet"},
                pipeline:[
                    {$match:{$expr:{$eq:["$_id","$$petID"]}}},
                    {$project:{name:1,photo:true}}
                ]
            }},
            {
                $lookup: {
                  from: "comments",
                  localField: "_id",
                  foreignField: "post",
                  as: "comments",
                },
              },
            {$unwind:{path:"$owner",preserveNullAndEmptyArrays:true}},
            {$unwind:{path:"$pet",preserveNullAndEmptyArrays:true}},
            {$addFields:{
                likes:{$size:"$likes"},
                shares:{$size:"$shares"},
                views:{$size:"$views"},
                commentsCount: {
                        $size: "$comments",
                    }
                }
            },
            {$project:{__v:0,deleted:0,comments:0}},
            {$match:{likes:{$gte:avg}}},
            {$count:"count"}
        ])
        let count=counts[0]?counts[0].count:0
        return res.status(200).json({ success: true, data: { count,mostlikespost }, msg: "ok", status: 200 })
    } catch (error) {
        next(error)
    }
})

router.get("/mostlikedpost",async(req,res,next)=>{
    try {
        let journey=await Post.aggregate([
            {$lookup:{from:"users",as:"owner",
                let:{ownerID:"$owner"},
                pipeline:[
                    {$match:{$expr:{$eq:["$_id","$$ownerID"]}}},
                    {$project:{name:1}}
                ]
            }},
            {$lookup:{from:"pets",as:"pet",
                let:{petID:"$pet"},
                pipeline:[
                    {$match:{$expr:{$eq:["$_id","$$petID"]}}},
                    {$project:{name:1,photo:true}}
                ]
            }},
            {
                $lookup: {
                  from: "comments",
                  localField: "_id",
                  foreignField: "post",
                  as: "comments",
                },
              },
            {$unwind:{path:"$owner",preserveNullAndEmptyArrays:true}},
            {$unwind:{path:"$pet",preserveNullAndEmptyArrays:true}},
            {$addFields:{
                likes:{$size:"$likes"},
                shares:{$size:"$shares"},
                views:{$size:"$views"},
                commentsCount: {
                        $size: "$comments",
                    }
                }
            },
            {$project:{__v:0,deleted:0,comments:0}}
        ])
        let array_num_repeat = []
        journey.forEach(el=>array_num_repeat.push(el.likes))
        let largest = array_num_repeat[0]
        // console.log("array_num_repeat => ",array_num_repeat)
        for (let i = 0; i < array_num_repeat.length; i++) {
            // largest += array_num_repeat[i]
            // largest++
            if (largest < array_num_repeat[i] ) {
                largest = array_num_repeat[i];
            }
        }
        // console.log("largest => ",largest)
        let mostlikedpost=await Post.aggregate([
            {$lookup:{from:"users",as:"owner",
                let:{ownerID:"$owner"},
                pipeline:[
                    {$match:{$expr:{$eq:["$_id","$$ownerID"]}}},
                    {$project:{name:1}}
                ]
            }},
            {$lookup:{from:"pets",as:"pet",
                let:{petID:"$pet"},
                pipeline:[
                    {$match:{$expr:{$eq:["$_id","$$petID"]}}},
                    {$project:{name:1,photo:true}}
                ]
            }},
            {
                $lookup: {
                  from: "comments",
                  localField: "_id",
                  foreignField: "post",
                  as: "comments",
                },
              },
            {$unwind:{path:"$owner",preserveNullAndEmptyArrays:true}},
            {$unwind:{path:"$pet",preserveNullAndEmptyArrays:true}},
            {$addFields:{
                likes:{$size:"$likes"},
                shares:{$size:"$shares"},
                views:{$size:"$views"},
                commentsCount: {
                        $size: "$comments",
                    }
                }
            },
            {$project:{__v:0,deleted:0,comments:0}},
            {$match:{likes:largest}}
        ])
        return res.status(200).json({ success: true, data: { mostlikedpost }, msg: "ok", status: 200 })
    } catch (error) {
        next(error)
    }
})

router.get("/:id",async(req,res,next)=>{
    try {
        let filter={_id:mongoose.Types.ObjectId(req.params.id)}
        let singlePost=await Post.aggregate([
            {$match:filter},
            {$lookup:{from:"users",as:"owner",
                let:{ownerID:"$owner"},
                pipeline:[
                    {$match:{$expr:{$eq:["$_id","$$ownerID"]}}},
                    {$project:{name:1}}
                ]
            }},
            {$lookup:{from:"pets",as:"pet",
                let:{petID:"$pet"},
                pipeline:[
                    {$match:{$expr:{$eq:["$_id","$$petID"]}}},
                    {$project:{name:1,photo:true}}
                ]
            }},
            {$unwind:{path:"$owner",preserveNullAndEmptyArrays:true}},
            {$unwind:{path:"$pet",preserveNullAndEmptyArrays:true}},
            {$project:{__v:0,deleted:0}}
        ])
        if(singlePost.length>0) return res.status(200).json({ success: true, data: { singlePost }, msg: "ok", status: 200 })
        else return res.status(200).json({ success: true, data: {}, msg: "This Post has been deleted.", status: 200 })
    } catch (error) {
        next(error)
    }
})

router.delete("/:id",async(req,res,next)=>{
    try {
        let id=mongoose.Types.ObjectId(req.params.id)
        let post = await Post.findById({_id:id}).populate("pet","name")
        let postreport = await PostReport.findOne({postID:id})
        let mazitoPet = await Pet.findById({_id:"6156f131cff1a4b5e17a0460"})
        if (!post) return next({ status: 404, msg: "Post Not Found" });
        if (!postreport) return next({ status: 404, msg: "Post report Not Found" });
        
        for(let i=0;i<post.contetList.length;i++){
            await Media.findOneAndDelete({
              owner:post.owner,
              pet:post.pet,
              "media.key":post.contetList[i].media.key
            })
        }
        let friends = await Friends.find({from:post.pet,status:"accepted"})
        for(let i=0;i<friends.length;i++){
            await Notification.findOneAndDelete({
              fromPet:friends[i].from,
              toPet:friends[i].to,
              body:post.description
            })
        }
        let notification = new Notification({
            from:postreport.from,
            to:postreport.to,
            fromPet:mazitoPet._id,
            toPet:postreport.toPet,
            title:"Delete By Admin",
            body:`Your ${post.description} Post of ${post.pet.name} Pet is wrong.`
        })
        await notification.save()
        await post.delete()
        await postreport.delete()
        return res.status(200).json({ success: true, data: {}, msg: "Post deleted.", status: 200 })
    } catch (error) {
        next(error)
    }
})

router.put("/block/:id",async(req,res,next)=>{
    try {
        let blockpost = await Post.findByIdAndUpdate({_id:req.params.id},{block:true},{new:true})
        return res.status(200).json({ success: true, data: { blockpost }, msg: "ok", status: 200 })
    } catch (error) {
        return next(error)
    }
})
// router.put("/hide/:id",async(req,res,next)=>{
//     try {
//         const post = await Post.findById({_id:req.params.id})
//         if (!post) return next({ status: 404, msg: "Post Not Found" });
//         post.hidePostAdmin.push({hideBy:req.user._id,hide:true})
//         await post.save()
//         return res.status(200).json({ success: true, data: { post }, msg: "ok", status: 200 })
//     } catch (error) {
//         next(error)
//     }
// })
// router.put("/unhide/:id",async(req,res,next)=>{
//     try {
//         const post = await Post.findById({_id:req.params.id})
//         if (!post) return next({ status: 404, msg: "Post Not Found" });
//         post.hidePostAdmin = []
//         await post.save()
//         return res.status(200).json({ success: true, data: { post }, msg: "ok", status: 200 })
//     } catch (error) {
//         next(error)
//     }
// })

module.exports=router