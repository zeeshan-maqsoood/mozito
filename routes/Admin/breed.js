const express = require('express');
const router = express.Router();
const { validationResult } = require("express-validator")
const Breed = require("../../models/breedModel");
const Species = require("../../models/speciesModel");
// const { breedValidator } = require("../../validator")
const { breedValidator,breedValidatorUpdate } = require("../../validator/adminValidation");

const { havePermissionOFCrud, isBreedAdder } = require("../../middlewares/adminAuth");
const constant = require("../../constants");
const cache = require("../../utils/cache");
const { idValidator } = require('../../middlewares');
router.param("id", idValidator)
router.post("/add",
    breedValidator, havePermissionOFCrud,
    async (req, res, next) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return next({ status: 400, error: errors.mapped(), msg: "Validation Failed" })
            }
            const keys = cache.keys();
            cache.del(`${constant.SPECIES}`);
            keys.forEach(value => {
                value.startsWith(constant.BREED) && cache.del(value);
            });
            const checkExists = await Breed.findOne({ name: req.body.name });
            if (checkExists) {
                return next({ status: 409, msg: "breed already exist" })
            }
            else {
                const species = await Species.findOne({ _id: req.body.species});
                if(!species) return next({ status: 409, msg: "Species Not found" });
                const breed = new Breed(req.body);
                breed.addedBy = req.user._id;

                await breed.save();
                return res.status(200).json({ success: true, data: { breed }, msg: "ok", status: 200 });
            }
        }
        catch (error) {
            return next(error);
        }
    })
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
            // if(search[0]==="addedBy")search[0]="addedBy.username"
            filter={[search[0]]:RegExp(search[1],"i")}
        }
        let breeds = await Breed.find(filter)
        .populate("species", "name")
        .populate("addedBy","username")
        .select({ __v: false })
        .skip(pageNo<=1?0:(pageNo*perPage)-perPage)
        .limit(perPage)
        .sort({[by]:order})
        let count=await Breed.countDocuments(filter)
        // if(breeds.length===0)count=0
        // if (req.query.search) {
        //     const query = RegExp(req.query.search, "i");
        //     breeds = await Breed.find({ name: query })
        //         .populate("species", "name")
        //         .populate("addedBy", "username")
        //         .select({ __v: false })
        // } else {
        //     breeds = await Breed.find({})
        //         .populate("species", "name")
        //         .select({ __v: false })
        // }
        return res.status(200).json({ success: true, data: { breeds,count }, msg: "ok", status: 200 });
    } catch (error) {
        return next(error);
    }
});

router.get("/by/species/:id", async (req, res, next) => {
    try {
        cache.del(`${constant.SPECIES}`);
        const keys = cache.keys();
        keys.forEach(value => {
            value.startsWith(constant.BREED) && cache.del(value);
        });
        const breeds = await Breed.find({ species: req.params.id });
        return res.status(200).json({ success: true, data: { breeds }, msg: "ok", status: 200 });
    } catch (error) {
        return next(error);
    }
})
router.route("/:id")
    .get(async (req, res, next) => {
        try {
            const breed = await Breed.findById(req.params.id);
            if (!breed) return next({ status: 404, msg: "breed not found" });
            return res.status(200).json({ success: true, data: { breed }, msg: "ok", status: 200 });
        } catch (error) {
            return next(error);
        }
    })
    .delete(isBreedAdder, async (req, res, next) => {
        try {
            cache.del(`${constant.SPECIES}`);
            const keys = cache.keys();
            keys.forEach(value => {
                value.startsWith(constant.BREED) && cache.del(value);
            });
            const breed = await Breed.findById(req.params.id);
            if (breed) {
                // await Blog.updateMany({}, { $pull: { breed: req.params.id } });
                await breed.delete(req.user._id);
                return res.status(200).json({ success: true, data: { msg: "breed deleted" }, msg: "ok", status: 200 });
            }
            else {
                return next({ status: 400, error: errors.mapped(), msg: "Validation Failed" })
            }
        } catch (error) {
            return next(error);
        }
    })
    .put(isBreedAdder, breedValidatorUpdate, async (req, res, next) => {
        try {
            const errors = validationResult(req);
            const {body} = req;
            cache.del(`${constant.SPECIES}`);
            const keys = cache.keys();
            keys.forEach(value => {
                value.startsWith(constant.BREED) && cache.del(value);
            });
            // const checkExists = await Breed.findOne({ name: req.body.name });
            // if (checkExists) {
            //     return next({ status: 409, msg: "breed already exist" })
            // }
            // let breed = await Breed.findByIdAndUpdate(
            //     req.params.id,
            //     { "name": req.body.name },
            //     { new: true }
            // );
            let breed = await Breed.findById(req.params.id);
            if (!breed) {
              return next({ status: 404, msg: "breed not found" });
            }
            if (body.name) {
              breed.name = body.name;
            }
            if (body.species) {
              breed.species = body.species;
            }
            if (body.speciesType && body.speciesType !==null && body.speciesType !== "null") {
                breed.speciesType = body.speciesType;
            }
            else {
                breed.speciesType=undefined;
            }
            await breed.save();
            return res.status(200).json({ success: true, data: { breed }, msg: "ok", status: 200 });
        } catch (error) {
            return next(error)
        }
    })
module.exports = router;