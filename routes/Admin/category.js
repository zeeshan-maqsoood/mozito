const _ = require("lodash");

const express = require('express');
const { validationResult } = require("express-validator");
const router = express.Router();
const Category = require("../../models/categoryModel");
const Blog = require("../../models/blog");
const Admin = require("../../models/adminModel");
const { NameValidator } = require("../../validator")
const { havePermissionOFCrud } = require("../../middlewares/adminAuth");
const { idValidator } = require("../../middlewares")

router.param("id", idValidator)
router.post("/create",
    havePermissionOFCrud,
    NameValidator,
    async (req, res, next) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return next({ status: 400, error: errors.mapped(), msg: "Validation Failed" })
            }

            const checkExists = await Category.findOne({ name: req.body.name });
            if (checkExists) {
                return next({ status: 409, msg: "category already exist" })
            }
            else {
                const category = new Category(req.body);
                category.createdBy = req.user._id

                await category.save();
                return res.status(200).json({ success: true, data: { category }, msg: "ok", status: 200 });
            }
        }
        catch (error) {
            return next(error)
        }
    });

router.get("/all", async (req, res, next) => {
    try {
        const perPage = Number(req.query.perPage||10)
        const pageNo = Number(req.query.pageNo||1)
        // const sort1 = {
        //     name:!req.query.name?1:Number(req.query.name)
        // }
        // const sort2 = {
        //     totalBlogs:Number(req.query.totalBlogs)
        // }
        // if(req.query.sortBy){
        //     const part = req.query.sortBy.split(':')
        //     sort[part[0]] = part[1]
        // }
        // const sortByName = Number(req.query.sortByName||1)
        let categories
        let count
        let filter = {}
        let searchValue,value
        let sortBy = req.query.sortBy || "name:1"
        let sort = sortBy.split(":")
        let by,order
        by=sort[0]
        if(sort[1]==="-1")order=-1
        else order=1
        if(req.query.searchBy){
            let search = req.query.searchBy.split(":")
            searchValue = search[0]
            value = RegExp(search[1],"i")
            filter = {[searchValue]:value}
        }
        categories = await Category.aggregate([
            {$lookup:{from:"blogs",localField:"_id",foreignField:"category",as:"totalBlogs"}},
            {$lookup:{
                from:"admins",as:"createdBy",
                let:{createdByID:"$createdBy"},
                pipeline:[
                    {$match:{$expr:{$eq:["$_id","$$createdByID"]}}},
                    {$project:{username:1}}
                ]
            }},
            {$unwind:{path:"$createdBy",preserveNullAndEmptyArrays:true}},
            {$project:{name:1,createdBy:1,totalBlogs:{$size:"$totalBlogs"}}},
            {$match:filter},
            {$skip:(pageNo<=1?0:(pageNo*perPage)-perPage)},
            {$limit:(perPage)},
            {$sort:{[by]:order}}
        ])
        count = await Category.aggregate([
            {$lookup:{from:"blogs",localField:"_id",foreignField:"category",as:"totalBlogs"}},
            {$lookup:{
                from:"admins",as:"createdBy",
                let:{createdByID:"$createdBy"},
                pipeline:[
                    {$match:{$expr:{$eq:["$_id","$$createdByID"]}}},
                    {$project:{username:1}}
                ]
            }},
            {$unwind:{path:"$createdBy",preserveNullAndEmptyArrays:true}},
            {$project:{name:1,createdBy:1,totalBlogs:{$size:"$totalBlogs"}}},
            {$match:filter},
            {$count:"count"}
        ])
        // if(req.query.name){
        //     listCategory = await Category.aggregate([
        //         {$lookup:{from:"blogs",localField:"_id",foreignField:"category",as:"totalBlogs"}},
        //         {$project:{_id:1,name:1,createdBy:1,totalBlogs:{$size:"$totalBlogs"}}},
        //         {$skip:(pageNo<=1?0:(pageNo*perPage)-perPage)},
        //         {$limit:(perPage)},
        //         {$sort:{name:Number(req.query.name)}}
        //     ])
        // }
        // else if(req.query.totalBlogs){
        //     listCategory = await Category.aggregate([
        //         {$lookup:{from:"blogs",localField:"_id",foreignField:"category",as:"totalBlogs"}},
        //         {$project:{_id:1,name:1,createdBy:1,totalBlogs:{$size:"$totalBlogs"}}},
        //         {$skip:(pageNo<=1?0:(pageNo*perPage)-perPage)},
        //         {$limit:(perPage)},
        //         {$sort:{totalBlogs:Number(req.query.totalBlogs)}}
        //     ])
        // }
        // else if(req.query.searchByTitle){
        //     const queryTitle = RegExp(req.query.searchByTitle, "i")
        //     listCategory = await Category.aggregate([
        //         {$lookup:{from:"blogs",localField:"_id",foreignField:"category",as:"totalBlogs"}},
        //         {$project:{_id:1,name:1,createdBy:1,totalBlogs:{$size:"$totalBlogs"}}},
        //         {$match:{name:queryTitle}},
        //         {$skip:(pageNo<=1?0:(pageNo*perPage)-perPage)},
        //         {$limit:(perPage)}
        //     ])
        // }
        // else{
        //     listCategory = await Category.aggregate([
        //         {$lookup:{from:"blogs",localField:"_id",foreignField:"category",as:"totalBlogs"}},
        //         {$project:{_id:1,name:1,createdBy:1,totalBlogs:{$size:"$totalBlogs"}}},
        //         {$skip:(pageNo<=1?0:(pageNo*perPage)-perPage)},
        //         {$limit:(perPage)}
        //     ])
        // }
        let count1 = count.length>0? count[0].count : 0 ;
        return res.status(200).json({ success: true, data: { categories,count:count1 }, msg: "ok", status: 200 })
        // if (req.query.name) {
        //     const query = RegExp(req.query.name, "i")
        //     listCategory = await Category.find({ name: query })
        //         .populate("category", "name");
        // }
        // else {
        //     listCategory = await Category.find({})
        //         .populate("category", "name")
        //         .limit(perPage).skip(pageNo<=1?0:(pageNo*perPage)-perPage)
        // };

        // let newlist = [];
        // let blog = await Blog.find({});
        // newlist = listCategory.map((cat, i) => {
        //     const totalBlogs = blog.filter(b => b.category.toString() === cat._id.toString()).length;
        //     return { ...cat._doc, totalBlogs }
        // })
        // return res.status(200).json({ success: true, data: { categories: newlist }, msg: "ok", status: 200 });
    } catch (error) {
        return next(error);
    }
});

router.route("/:id")
    .get(async (req, res, next) => {
        try {
            const category = await Category.findById(req.params.id);
            const blogscount = await Blog.find({ category: req.params.id }).countDocuments();
            if (!category) {
                return next({ status: 409, msg: "category not found" })
            }
            else {
                category.totalBlogs = blogscount || 0;
                return res.status(200).json({ success: true, data: { category }, msg: "ok", status: 200 });
            }
        } catch (error) {
            return next(error);
        }
    })
    .delete(havePermissionOFCrud, async (req, res, next) => {
        try {
            const category = await Category.findById(req.params.id);
            if (category) {
                await category.remove();
                return res.status(200).json({ success: true, data: { msg: "Category Deleted" }, msg: "ok", status: 200 });
            }
            else {
                return next({ status: 404, msg: "category not exists" })
            }
        } catch (error) {
            return next(error);
        }
    })
    .put(havePermissionOFCrud, NameValidator, async (req, res, next) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return next({ status: 400, error: errors.mapped(), msg: "Validation Failed" })
            }
            const checkExists = await Category.findOne({ name: req.body.name });
            if (checkExists) {
                return next({ status: 409, msg: "category already exist" })
            }

            let category = await Category.findByIdAndUpdate(
                req.params.id,
                { "name": req.body.name },
                { new: true }
            );
            if (!category) {
                return next({ status: 404, msg: "category not exists" })
            } else {
                return res.status(200).json({ success: true, data: { category }, msg: "ok", status: 200 });
            }
        } catch (error) {
            return next(error);
        }
    })
module.exports = router;