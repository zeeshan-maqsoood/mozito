const express = require("express");
const router = express.Router();
const { Species } = require("../../models");
const constant = require("../../constants");
const cache = require("../../utils/cache");
const { speciesValidator } = require("../../validator/adminValidation");
const {
  havePermissionOFCrud,
  isSpeciousAdder,
} = require("../../middlewares/adminAuth");
const { idValidator } = require("../../middlewares");
router.param("id", idValidator);
router.post(
  "/add",
  speciesValidator,
  havePermissionOFCrud,
  async (req, res, next) => {
    try {
      cache.del(`${constant.SPECIES}`);
      const checkExists = await Species.findOne({ name: req.body.name });
      if (checkExists) {
        return next({ status: 409, msg: "species already exist" });
      } else {
        const species = new Species(req.body);
        if (req.body.hasType === true || req.body.hasType === "true") {
          species.hasType = true;
        } else {
          species.hasType = false;
        }
        species.addedBy = req.user._id;
        await species.save();
        return res
          .status(200)
          .json({ success: true, data: { species }, msg: "ok", status: 200 });
      }
    } catch (error) {
      return next(error);
    }
  }
);

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
    count = await Species.countDocuments(filter);
    species = await Species.aggregate([
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
          foreignField: "species",
          as: "breed",
        },
      },
      {
        $lookup: {
          from: "speciestypes",
          localField: "_id",
          foreignField: "species",
          as: "types",
        },
      },
      {
        $addFields: {
          types: { $size: "$types" },
          breed: { $size: "$breed" },
        },
      },
      { $unwind: { path: "$addedBy", preserveNullAndEmptyArrays: true } },
      {
        $project: { addedBy: true, name: true, breed: true,types:true,hasType:true },
      },
      { $match: filter },
      { $skip: pageNo <= 1 ? 0 : pageNo * perPage - perPage },
      { $limit: perPage },
      { $sort: { [by]: order } },
    ]);
    // if (!obj) {
    //     speciousList = await Species.aggregate([
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
    //     await Species.populate(speciousList, { path: "addedBy", select: "username" })
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
  .delete(isSpeciousAdder, async (req, res, next) => {
    try {
      cache.del(`${constant.SPECIES}`);
      const species = await Species.findById(req.params.id);
      if (species) {
        await species.delete(req.user._id);
        return res.status(200).json({
          success: true,
          data: { msg: "Species Deleted" },
          msg: "ok",
          status: 200,
        });
      } else {
        return next({
          status: 400,
          error: errors.mapped(),
          msg: "Validation Failed",
        });
      }
    } catch (error) {
      return next(error);
    }
  })
  .put(isSpeciousAdder, speciesValidator, async (req, res, next) => {
    try {
      cache.del(`${constant.SPECIES}`);
      const species = await Species.findOne({ _id: req.params.id });
      if (!species) {
        return next({ status: 409, msg: "Species not found" });
      }
      if (req.body.hasType) {
        species.hasType = req.body.hasType;
      }

      if (req.body.name) {
        species.name = req.body.name;
      }
      await species.save();
      return res
        .status(200)
        .json({ success: true, data: { species }, msg: "ok", status: 200 });
    } catch (error) {
      return next(error);
    }
  });
module.exports = router;
