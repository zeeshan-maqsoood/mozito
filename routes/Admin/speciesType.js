const express = require("express");
const router = express.Router();
const { SpeciesType,Species } = require("../../models");
const constant = require("../../constants");
const cache = require("../../utils/cache");
const { speciesTypeValidator, speciesTypeValidatorUpdate } = require("../../validator/adminValidation");
const {
  havePermissionOFCrud,
  isSpeciousAdder,
} = require("../../middlewares/adminAuth");
const { idValidator } = require("../../middlewares");
router.param("id", idValidator);
// tested successfully
router.post(
  "/add",
  speciesTypeValidator,
  havePermissionOFCrud,
  async (req, res, next) => {
    try {
      cache.del(`${constant.SPECIES_TYPE}`);
      const checkExists = await SpeciesType.findOne({ name: req.body.name });
      if (checkExists) {
        return next({ status: 409, msg: "species already exist" });
      } else {
        const species = await Species.findOne({ _id: req.body.species});
        if(!species) return next({ status: 409, msg: "Species Not found" });
        species.hasType=true;
        await species.save();
        const speciesType = new SpeciesType(req.body);
        speciesType.addedBy = req.user._id;
        await speciesType.save();
        return res
          .status(200)
          .json({ success: true, data: { speciesType }, msg: "ok", status: 200 });
      }
    } catch (error) {
      return next(error);
    }
  }
);
// Tested Successfully
router.get("/all", async (req, res, next) => {
  try {
    // const query = RegExp(req.query.search || "", "i")
    // let obj = cache.get(`${constant.SPECIES}-${req.query.search}`);
    let perPage = Number(req.query.perPage || 10);
    let pageNo = Number(req.query.pageNo || 1);
    let sortBy = req.query.sortBy || "name:1";
    let sort = sortBy.split(":");
    let by, order;
    by = sort[0];
    if (sort[1] === "-1") order = -1;
    else order = 1;
    let filter = {};
    let searchValue, value;
    if (req.query.searchBy) {
      let search = req.query.searchBy.split(":");
      searchValue = search[0];
      value = RegExp(search[1], "i");
      filter[searchValue] = value;
    }
    count = await SpeciesType.countDocuments(filter);
    species = await SpeciesType.aggregate([
      {
        $lookup: {
          from: "admins",
          as: "addedBy",
          let: { addedByID: "$addedBy" },
          pipeline: [
            { $match: { $expr: { $eq: ["$_id", "$$addedByID"] } } },
            { $project: { username: 1 } },
          ],
        },
      },
      {
        $lookup: {
          from: "breeds",
          localField: "_id",
          foreignField: "speciesType",
          as: "breed",
        },
      },
      {
        $lookup: {
          from: "species",
          localField: "species",
          foreignField: "_id",
          as: "species",
        },
      },
      {
        $addFields: {
          breed: { $size: "$breed" },
        },
      },
      { $unwind: { path: "$addedBy", preserveNullAndEmptyArrays: true } },
      { $unwind: { path: "$species", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          addedBy: true,
          name: true,
          breed: true,
          species: {
            name: true,
            _id: true,
          },
        },
      },
      { $match: filter },
      { $skip: pageNo <= 1 ? 0 : pageNo * perPage - perPage },
      { $limit: perPage },
      { $sort: { [by]: order } },
    ]);
    // if (!obj) {
    //     speciousList = await SpeciesType.aggregate([
    //         {
    //             $match: {
    //                 name: query,
    //                 deleted: { $ne: true }
    //             }
    //         },
    //         {
    //             $lookup:
    //             {
    //                 from: 'breeds',
    //                 localField: '_id',
    //                 foreignField: 'species',
    //                 as: 'breed'
    //             }
    //         },
    //         {
    //             $addFields: {
    //                 breed: { $size: "$breed" }
    //             }
    //         },
    //         {$unwind:{path:"$addedBy",preserveNullAndEmptyArrays:true}},
    //         {
    //             $project: { addedBy: true, name: true, breed: true }
    //         },
    //         {$sort:{name:1}}
    //     ]);
    //     await SpeciesType.populate(speciousList, { path: "addedBy", select: "username" })
    //     obj = speciousList
    //     cache.set(`${constant.SPECIES}-${req.query.search}`, obj, 100000);
    // }
    return res.status(200).json({
      success: true,
      data: { species, count },
      msg: "ok",
      status: 200,
    });
  } catch (error) {
    return next(error);
  }
});

router
  .route("/:id")
  // Tested Successfully
  .delete( async (req, res, next) => {
    try {
      cache.del(`${constant.SPECIES}`);
      const speciesType = await SpeciesType.findById(req.params.id);
      if (speciesType) {
        await speciesType.delete(req.user._id);
        return res.status(200).json({
          success: true,
          data: { msg: "Species Type Deleted" },
          msg: "ok",
          status: 200,
        });
      }
      else{
        if (!speciesType) {
          return next({ status: 409, msg: "Species Type not found" });
        }
      }

    } catch (error) {
      return next(error);
    }
  })
  // tested Successfully
  .put(speciesTypeValidatorUpdate,async (req, res, next) => {
    try {
      const {body} = req;
      cache.del(`${constant.SPECIES}`);
      const speciesType = await SpeciesType.findOne({ _id: req.params.id});
      if (!speciesType) {
        return next({ status: 409, msg: "Species Type not found" });
      }
      if(body.name){
        speciesType.name= body.name;
      }
      if(body.species){
        speciesType.species= body.species;
      }
      await speciesType.save();
      return res
        .status(200)
        .json({ success: true, data: { speciesType }, msg: "ok", status: 200 });
    } catch (error) {
      return next(error);
    }
  });
module.exports = router;
