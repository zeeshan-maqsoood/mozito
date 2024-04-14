const express = require('express');
const router = express.Router();
const { validationResult } = require("express-validator")
const Color = require("../../models/colorModel");
const { NameValidator } = require("../../validator")
const { havePermissionOFCrud, isAdder, isColorAdder } = require("../../middlewares/adminAuth");
const cache = require("../../utils/cache");
const constant = require("../../constants")
router.post("/add",
    NameValidator, havePermissionOFCrud,
    async (req, res, next) => {
        try {
            cache.del(constant.COLORS);
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return next({ status: 400, error: errors.mapped(), msg: "Validation Failed" })
            }
            const checkExists = await Color.findOne({ name: req.body.name });
            if (checkExists) {
                return next({ status: 409, msg: "color already exist" })
            }
            else {
                const color = new Color(req.body);
                color.addedBy = req.user._id;
                await color.save();
                return res.status(200).json({ success: true, data: { color }, msg: "ok", status: 200 });
            }
        }
        catch (error) {
            return next(error);
        }
    })

router.get("/all", async (req, res, next) => {
    try {

        // let colors = cache.get(constant.COLORS)
        // let count=cache.get(constant.COUNT)
        let perPage=Number(req.query.perPage||10)
        let pageNo=Number(req.query.pageNo||1)
        let filters = {}
        if(req.query.name){
            filters={name:RegExp(req.query.name,"i")}
        }
        // if(req.query.search&&(perPage||pageNo)){
        //     filters={name:RegExp(req.query.search,"i")}
        //     colors = await Color.find(filters).select({ __v: false, addedBy: false })
        //                 .skip(pageNo<=1?0:(pageNo*perPage)-perPage)
        //                 .limit(perPage)
        //     count=await Color.countDocuments(filters)
        // }
        // if (!colors||(perPage||pageNo)) {
            let colors = await Color.find(filters).select({ __v: false, addedBy: false })
                        .skip(pageNo<=1?0:(pageNo*perPage)-perPage)
                        .limit(perPage)
            let count=await Color.countDocuments(filters)
            // cache.set(constant.COLORS, colors, 10000)
            // cache.set(constant.COUNT,count,10000)
        // }
        // if (req.query.search) {
        //     const query = RegExp(req.query.search, "i");
        //     colors = await Color.find({ name: query }).select({ __v: false, addedBy: false });
        // }
        // else {
        //     if (!colors) {
        //         colors = await Color.find({}).select({ __v: false, addedBy: false });
        //         cache.set(constant.COLORS, colors, 10000);
        //     }
        // }
        return res.status(200).json({ success: true, data: { count,colors }, msg: "ok", status: 200 });
    } catch (error) {
        return next(error);
    }
});


router.route("/:id")
    .delete(isColorAdder, async (req, res, next) => {
        try {
            cache.del(constant.COLORS);
            const color = await Color.findById(req.params.id);
            if (color) {
                // await Blog.updateMany({}, { $pull: { color: req.params.id } });
                await color.remove();
                return res.status(200).json({ success: true, data: { msg: "Color Deleted" }, msg: "ok", status: 200 });
            }
            else {
                return next({ status: 400, error: errors.mapped(), msg: "Validation Failed" })
            }
        } catch (error) {
            return next(error);
        }
    })
    .put(isColorAdder, NameValidator, async (req, res, next) => {
        try {
            cache.del(constant.COLORS);
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return next({ status: 400, error: errors.mapped(), msg: "Validation Failed" })
            }
            const checkExists = await Color.findOne({ name: req.body.name });
            if (checkExists) {
                return next({ status: 409, msg: "color already exist" })
            }

            let color = await Color.findByIdAndUpdate(
                req.params.id,
                { "name": req.body.name },
                { new: true }
            );
            if (!color) {
                return next({ status: 404, msg: "color not found" })
            } else {
                return res.status(200).json({ success: true, data: { color }, msg: "ok", status: 200 });
            }
        } catch (error) {
            return next(error)
        }
    })
module.exports = router;