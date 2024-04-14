const express = require('express');
const router = express.Router();
const { validationResult } = require("express-validator")
const { Interest } = require("../../models");

const { NameValidator } = require("../../validator")
const { havePermissionOFCrud, isInterestAdder } = require("../../middlewares/adminAuth");
const { idValidator } = require("../../middlewares")

router.param("id", idValidator);
router.post("/add",
    NameValidator, havePermissionOFCrud,
    async (req, res, next) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return next({ status: 400, error: errors.mapped(), msg: "Validation Failed" })
            }
            const checkExists = await Interest.findOne({ name: req.body.name });
            if (checkExists) {
                return next({ status: 409, msg: "interest already exist" })
            }
            else {
                const interest = new Interest(req.body);
                interest.addedBy = req.user._id

                await interest.save();
                return res.status(200).json({ success: true, data: { interest }, msg: "ok", status: 200 });
            }
        }
        catch (error) {
            return next(error);
        }
    });

router.get("/all", async (req, res, next) => {
    try {
        let filter={}
        let perPage=Number(req.query.perPage||10)
        let pageNo=Number(req.query.pageNo||0)
        let sortBy=req.query.sortBy||"name:1"
        let by,order
        let sort=sortBy.split(":")
        by=sort[0]
        if(sort[1]==="-1")order=-1
        else order=1
        if(req.query.searchBy){
            let search=req.query.searchBy.split(":")
            filter={[search[0]]:RegExp(search[1],"i")}
        }
        let interest = await Interest.find(filter).populate({
            path:"addedBy",
            select:"username"
        }).select({__v:false})
        .skip(pageNo<=1?0:(pageNo*perPage)-perPage)
        .limit(perPage)
        .sort({[by]:order})
        let count = await Interest.countDocuments(filter)
        // if (req.query.search) {
        //     const query = RegExp(req.query.search, "i");
        //     interest = await Interest.find({ name: query });
        // } else {
        //     interest = await Interest.find({});
        // }
        // const breedList = await Breed.find();
        // //  speciousList = await Interest.find().select({ addedBy: false, __v: false });
        // const obj = speciousList.map(interest => {
        //     return {
        //         interest,
        //         breeds: breedList.filter(breed => interest._id.toString() === breed.interest.toString()).length
        //     }
        // })
        return res.status(200).json({ success: true, data: { interest,count }, msg: "ok", status: 200 });
    } catch (error) {
        next(error);
    }
});


router.route("/:id")
    .delete(isInterestAdder, async (req, res, next) => {
        try {
            const interest = await Interest.findById(req.params.id);
            if (interest) {
                await interest.remove();
                return res.status(200).json({ success: true, data: { msg: "Interest Deleted" }, msg: "ok", status: 200 });
            }
            else {
                return next({ status: 400, error: errors.mapped(), msg: "Validation Failed" })
            };
        } catch (error) {
            return next(error);
        }
    })
    .put(isInterestAdder, NameValidator, async (req, res, next) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return next({ status: 400, error: errors.mapped(), msg: "Validation Failed" })
            }

            const checkExists = await Interest.findOne({ name: req.body.name });
            if (checkExists) {
                return next({ status: 409, msg: "interest already exist" })
            }
            let interest = await Interest.findByIdAndUpdate(
                req.params.id,
                { "name": req.body.name },
                { new: true }
            );
            if (!interest) {
                return next({ status: 404, msg: "interest not found" })
            } else {
                return res.status(200).json({ success: true, data: { interest }, msg: "ok", status: 200 });
            }
        } catch (error) {
            return next(error)
        }
    });
module.exports = router;