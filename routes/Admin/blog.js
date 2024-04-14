const express = require('express');
const router = express.Router();
const { validationResult } = require("express-validator");
const Blog = require("../../models/blog");
const { havePermissionOFCrud, isPoster, isAdmin } = require("../../middlewares/adminAuth");
let { s3, upload, local } = require("../../s3");
const { blogValidator } = require('../../validator/customeValidator');
const { categoryValidator } = require("../../validator")
const _ = require("lodash");
let Upload = upload("blog");
let uploadPhoto = upload("")
const { idValidator } = require("../../middlewares")
// local = local("");

router.param("id", idValidator)
router.get("/all", async (req, res, next) => {
    try {
        const perPage = Number(req.query.perPage||10)
        const pageNo = Number(req.query.pageNo||1)
        let sortBy = req.query.sortBy || "createdAt:-1"
        let sort = sortBy.split(":")
        let by,order
        by=sort[0]
        if(sort[1]==="-1")order=-1
        else order=1
        let filter = {}
        let searchValue,value
        if(req.query.searchBy){
            let search = req.query.searchBy.split(":")
            searchValue=search[0]
            if(search[0]==="category")searchValue="category.name"
            value=RegExp(search[1],"i")
            filter = {[searchValue]:value}
        }
        let blogList;
        let counts;
        counts = await Blog.aggregate([
            {$lookup:{from:"categories",as:"category",
                let:{categoryID:"$category"},
                pipeline:[
                    {$match:{$expr:{$eq:["$_id","$$categoryID"]}}},
                    {$project:{_id:1,name:1}}
                ]
            }},
            {$lookup:{from:"admins",as:"createdBy",
                let:{createdByID:"$createdBy"},
                pipeline:[
                    {$match:{$expr:{$eq:['$_id','$$createdByID']}}},
                    {$project:{_id:1,username:1}}
                ]
            }},
            {$unwind:{path:"$category",preserveNullAndEmptyArrays:true}},
            {$unwind:{path:"$createdBy",preserveNullAndEmptyArrays:true}},
            {$project:{
                photo:1,
                title:1,
                active:1,
                viewsCount:{$size:"$viewsCount"},
                helpful:{$size:"$helpful"},
                unhelpful:{$size:"$unhelpful"},
                comments:1,
                body:1,
                category:1,
                createdBy:1,
                createdAt:1,
                updatedAt:1,
                deleted:1
            }},
            {$match:filter},
            {$count:"count"}
        ])
        blogList = await Blog.aggregate([
            {$lookup:{from:"categories",as:"category",
                let:{categoryID:"$category"},
                pipeline:[
                    {$match:{$expr:{$eq:["$_id","$$categoryID"]}}},
                    {$project:{_id:1,name:1}}
                ]
            }},
            {$lookup:{from:"admins",as:"createdBy",
                let:{createdByID:"$createdBy"},
                pipeline:[
                    {$match:{$expr:{$eq:['$_id','$$createdByID']}}},
                    {$project:{_id:1,username:1}}
                ]
            }},
            {$unwind:{path:"$category",preserveNullAndEmptyArrays:true}},
            {$unwind:{path:"$createdBy",preserveNullAndEmptyArrays:true}},
            {$project:{
                photo:1,
                title:1,
                active:1,
                viewsCount:{$size:"$viewsCount"},
                helpful:{$size:"$helpful"},
                unhelpful:{$size:"$unhelpful"},
                comments:1,
                body:1,
                category:1,
                createdBy:1,
                createdAt:1,
                updatedAt:1,
                deleted:1
            }},
            {$match:filter},
            {$sort:{[by]:order}},
            {$skip:(pageNo<=1?0:(pageNo*perPage)-perPage)},
            {$limit:(perPage)}
        ])
        // if(req.query.searchBy){
        //     let search={}
        //     const part = req.query.searchBy.split(':')
        //     if(part[0]==="category") part[0]=("category.name")
        //     const query = RegExp(part[1], "i")
        //     search[part[0]] = query
        //     counts = await Blog.find()
        //     blogList = await Blog.aggregate([
        //         {$lookup:{from:"categories",as:"category",
        //             let:{categoryID:"$category"},
        //             pipeline:[
        //                 {$match:{$expr:{$eq:["$_id","$$categoryID"]}}},
        //                 {$project:{_id:1,name:1}}
        //             ]
        //         }},
        //         {$lookup:{from:"admins",as:"createdBy",
        //             let:{createdByID:"$createdBy"},
        //             pipeline:[
        //                 {$match:{$expr:{$eq:['$_id','$$createdByID']}}},
        //                 {$project:{_id:1,username:1}}
        //             ]
        //         }},
        //         {$unwind:{path:"$category"}},
        //         {$unwind:{path:"$createdBy"}},
        //         {$project:{
        //             photo:1,
        //             title:1,
        //             active:1,
        //             viewsCount:{$size:"$viewsCount"},
        //             helpful:{$size:"$helpful"},
        //             unhelpful:{$size:"$unhelpful"},
        //             comments:1,
        //             body:1,
        //             category:1,
        //             createdBy:1,
        //             createdAt:1,
        //             updatedAt:1,
        //             deleted:1
        //         }},
        //         {$match:{$or:[search]}},
        //         {$skip:(pageNo<=1?0:(pageNo*perPage)-perPage)},
        //         {$limit:(perPage)}
        //     ])
        // }
        // else if(req.query.viewsCount){
        //     counts = await Blog.find()
        //     blogList = await Blog.aggregate([
        //         {$lookup:{from:"categories",as:"category",
        //             let:{categoryID:"$category"},
        //             pipeline:[
        //                 {$match:{$expr:{$eq:["$_id","$$categoryID"]}}},
        //                 {$project:{_id:1,name:1}}
        //             ]
        //         }},
        //         {$lookup:{from:"admins",as:"createdBy",
        //             let:{createdByID:"$createdBy"},
        //             pipeline:[
        //                 {$match:{$expr:{$eq:['$_id','$$createdByID']}}},
        //                 {$project:{_id:1,username:1}}
        //             ]
        //         }},
        //         {$unwind:{path:"$category"}},
        //         {$unwind:{path:"$createdBy"}},
        //         {$project:{
        //             photo:1,
        //             title:1,
        //             active:1,
        //             viewsCount:{$size:"$viewsCount"},
        //             helpful:{$size:"$helpful"},
        //             unhelpful:{$size:"$unhelpful"},
        //             comments:1,
        //             body:1,
        //             category:1,
        //             createdBy:1,
        //             createdAt:1,
        //             updatedAt:1,
        //             deleted:1
        //         }},
        //         {$skip:(pageNo<=1?0:(pageNo*perPage)-perPage)},
        //         {$limit:(perPage)},
        //         {$sort:{viewsCount:Number(req.query.viewsCount)}}
        //     ])
        // }
        // else if(req.query.helpful){
        //     counts = await Blog.find()
        //     blogList = await Blog.aggregate([
        //         {$lookup:{from:"categories",as:"category",
        //             let:{categoryID:"$category"},
        //             pipeline:[
        //                 {$match:{$expr:{$eq:["$_id","$$categoryID"]}}},
        //                 {$project:{_id:1,name:1}}
        //             ]
        //         }},
        //         {$lookup:{from:"admins",as:"createdBy",
        //             let:{createdByID:"$createdBy"},
        //             pipeline:[
        //                 {$match:{$expr:{$eq:['$_id','$$createdByID']}}},
        //                 {$project:{_id:1,username:1}}
        //             ]
        //         }},
        //         {$unwind:{path:"$category"}},
        //         {$unwind:{path:"$createdBy"}},
        //         {$project:{
        //             photo:1,
        //             title:1,
        //             active:1,
        //             viewsCount:{$size:"$viewsCount"},
        //             helpful:{$size:"$helpful"},
        //             unhelpful:{$size:"$unhelpful"},
        //             comments:1,
        //             body:1,
        //             category:1,
        //             createdBy:1,
        //             createdAt:1,
        //             updatedAt:1,
        //             deleted:1
        //         }},
        //         {$skip:(pageNo<=1?0:(pageNo*perPage)-perPage)},
        //         {$limit:(perPage)},
        //         {$sort:{helpful:Number(req.query.helpful)}}
        //     ])
        // }
        // else if(req.query.unhelpful){
        //     counts = await Blog.find()
        //     blogList = await Blog.aggregate([
        //         {$lookup:{from:"categories",as:"category",
        //             let:{categoryID:"$category"},
        //             pipeline:[
        //                 {$match:{$expr:{$eq:["$_id","$$categoryID"]}}},
        //                 {$project:{_id:1,name:1}}
        //             ]
        //         }},
        //         {$lookup:{from:"admins",as:"createdBy",
        //             let:{createdByID:"$createdBy"},
        //             pipeline:[
        //                 {$match:{$expr:{$eq:['$_id','$$createdByID']}}},
        //                 {$project:{_id:1,username:1}}
        //             ]
        //         }},
        //         {$unwind:{path:"$category"}},
        //         {$unwind:{path:"$createdBy"}},
        //         {$project:{
        //             photo:1,
        //             title:1,
        //             active:1,
        //             viewsCount:{$size:"$viewsCount"},
        //             helpful:{$size:"$helpful"},
        //             unhelpful:{$size:"$unhelpful"},
        //             comments:1,
        //             body:1,
        //             category:1,
        //             createdBy:1,
        //             createdAt:1,
        //             updatedAt:1,
        //             deleted:1
        //         }},
        //         {$skip:(pageNo<=1?0:(pageNo*perPage)-perPage)},
        //         {$limit:(perPage)},
        //         {$sort:{unhelpful:Number(req.query.unhelpful)}}
        //     ])
        // }
        // else {
        //     counts = await Blog.find()
        //     blogList = await Blog.aggregate([
        //         {$lookup:{from:"categories",as:"category",
        //             let:{categoryID:"$category"},
        //             pipeline:[
        //                 {$match:{$expr:{$eq:["$_id","$$categoryID"]}}},
        //                 {$project:{_id:1,name:1}}
        //             ]
        //         }},
        //         {$lookup:{from:"admins",as:"createdBy",
        //             let:{createdByID:"$createdBy"},
        //             pipeline:[
        //                 {$match:{$expr:{$eq:['$_id','$$createdByID']}}},
        //                 {$project:{_id:1,username:1}}
        //             ]
        //         }},
        //         {$unwind:{path:"$category"}},
        //         {$unwind:{path:"$createdBy"}},
        //         {$project:{
        //             photo:1,
        //             title:1,
        //             active:1,
        //             viewsCount:{$size:"$viewsCount"},
        //             helpful:{$size:"$helpful"},
        //             unhelpful:{$size:"$unhelpful"},
        //             comments:1,
        //             body:1,
        //             category:1,
        //             createdBy:1,
        //             createdAt:1,
        //             updatedAt:1,
        //             deleted:1
        //         }},
        //         {$skip:(pageNo<=1?0:(pageNo*perPage)-perPage)},
        //         {$limit:(perPage)}
        //     ])
        //     // blogList = await Blog.find()
        //     //     .populate("category", "name")
        //     //     .populate("createdBy", "username")
        //     //     .limit(perPage).skip(pageNo<=1?0:(pageNo*perPage)-perPage)
        //     //     .sort({createdAt:1})
        // }
        // if (req.query.search) {
            
        //     blogList = await Blog.find({ $or: [{ title: query }, { body: query }] })
        //         .populate("category", "name")
        //         .populate("createdBy", "username")
        // }
        // let count1 = counts.length>0? counts[0].count : 0;
        let count
        if(counts.length>0)count=counts[0].count
        else count=0
        return res.status(200).json({ success: true, data: { blogs: blogList, count }, msg: "ok", status: 200 });

       // return res.status(200).json({ success: true, data: { blogs: blogList, counts:counts[0]?.count || 0 }, msg: "ok", status: 200 });
    } catch (error) {
        return next(error);
    }
})

router.post("/create", havePermissionOFCrud, Upload.single("photo"), async (req, res, next) => {
    try {
        const blog = new Blog(req.body);
        blog.createdBy = req.user._id;
        const { file } = req
        if (!file) {
            return next({
                status: 422, errors: {
                    photo: {
                        "msg": "photo must required",
                        "param": "photo",
                        "location": "body"
                    }
                }, msg: "Validation Error"
            });
        }
        const photo = {
            key: file.key,
            url: file.location,
            updatedAt: Date.now()
        }
        blog.photo = photo;
        await blog.save();
        return res.status(200).json({ success: true, data: { blog }, msg: "ok", status: 200 });
    }
    catch (error) {
        return next(error)
    }
})

// router.post("/uploadphoto",havePermissionOFCrud, uploadPhoto.single("image"),async(req,res,next)=>{
//     try {
//         const { file } = req
//         if (!file) {
//             return next({
//                 status: 422, errors: {
//                     photo: {
//                         "msg": "image must required",
//                         "param": "image",
//                         "location": "body"
//                     }
//                 }, msg: "Validation Error"
//             });
//         }
//         return res.status(200).json({ success: true, data: { url:file.location }, msg: "ok", status: 200 });
//     } catch (error) {
//         return next(error)
//     }
// })

router.put("/updateCategory/:id", havePermissionOFCrud, categoryValidator, async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return next({ status: 400, error: errors.mapped(), msg: "Validation Failed" })
        }
        const blog = await Blog.findByIdAndUpdate(req.params.id, { category: req.body.category }, { new: true }).populate("category", "name")
        if (!blog) return next({ status: 404, msg: "Blog not found" });
        return res.status(200).json({ success: true, data: { blog }, msg: "ok", status: 200 });
    } catch (error) {
        return next(error)
    }
});

router.route("/:id")
    .get(async (req, res, next) => {
        try {
            const blog = await Blog.findById(req.params.id)
                .populate("category", "name")
                .populate("createdBy", "username");
            if (!blog) {
                return next({ status: 404, msg: "blog not found" })
            }
            else {
                await blog.save();
                return res.status(200).json({ success: true, data: { blog }, msg: "ok", status: 200 });
            }
        } catch (error) {
            return next(error);
        }
    })
    .delete(havePermissionOFCrud, isPoster, async (req, res, next) => {
        try {
            const blog = await Blog.findById(req.params.id);
            if (!blog) return next({ status: 404, msg: "blog not found" });
            await blog.delete(req.user._id);
            return res.status(200).json({ success: true, data: { msg: "Blog Deleted" }, msg: "ok", status: 200 });
            // s3.deleteObjects({
            //     Bucket: process.env.AWSBUCKET,
            //     Delete: {
            //         Objects: [
            //             {
            //                 Key: blog.photo.key,
            //             },
            //         ],
            //     }
            // }, (err, data) => {
            //     return res.status(200).json({ success: true, data: { msg: "Blog Deleted" }, msg: "ok", status: 200 });
            // })

        } catch (error) {
            return next(error);
        }
    })
    .put(havePermissionOFCrud, isPoster, Upload.single("photo"), async (req, res, next) => {
        try {
            let blog = await Blog.findById(req.params.id);
            if (!blog) {
                return next({ status: 404, msg: "blog not found" })
            } else {
                const { file } = req
                if (file) {
                    s3.deleteObjects({
                        Bucket: process.env.AWSBUCKET,
                        Delete: {
                            Objects: [
                                {
                                    Key: blog.photo.key,
                                },
                            ],
                        }
                    }, (err, data) => {

                    })
                    let photo = {
                        updatedAt: Date.now()
                    }
                    photo.key = file.key;
                    photo.url = file.location;
                    blog.photo = photo;
                } else {
                    const validationResult = blogValidator(req.body);
                    if (validationResult) {
                        return next({ status: 422, msg: validationResult });
                    }
                }
                blog = _.extend(blog, req.body)
                await blog.save();
                return res.status(200).json({ success: true, data: { blog }, msg: "ok", status: 200 });
            }
        } catch (error) {
            return next(error);
        }
    })

module.exports = router;