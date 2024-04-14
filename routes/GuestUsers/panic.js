const router = require("express").Router()
const { Panic } = require("../../models")
const mongoose = require("mongoose")

router.get("/",async(req,res,next)=>{
    try {
        let perPage = Number(req.query.perPage || 10)
        let pageNo = Number(req.query.pageNo || 1)
        let panics = await Panic.aggregate([
            {$match: {
              type: "found"
            }},
            {
              $lookup: {
                from: "pets",
                localField: "petId",
                foreignField: "_id",
                as: "pet",
              },
            },
            {
              $lookup: {
                from: "countries",
                localField: "country",
                foreignField: "_id",
                as: "country"
              }
            },
            {
                $lookup: {
                  from: "states",
                  let:{stateID:"$state"},
                  pipeline:[
                    {$match:{
                        $expr:{
                            $eq:["$_id","$$stateID"]
                        }
                    }},
                    {$project:{
                        name:1
                    }}
                  ],
                  as: "state"
                }
            },
            {
                $lookup: {
                  from: "cities",
                  let:{cityID:"$city"},
                  pipeline:[
                    {$match:{
                        $expr:{
                            $eq:["$_id","$$cityID"]
                        }
                    }},
                    {$project:{
                        name:1
                    }}
                  ],
                  as: "city"
                }
            },
            {
                $lookup: {
                  from: "species",
                  localField: "species",
                  foreignField: "_id",
                  as: "species"
                }
            },
            {
                $lookup: {
                  from: "users",
                  let:{userID:"$createdBy"},
                  pipeline:[
                    {$match:{
                        $expr:{
                            $eq:["$_id","$$userID"]
                        }
                    }},
                    {$project:{
                        name:1
                    }}
                  ],
                  as: "createdBy"
                }
            },
            { $unwind: { path: "$pet", preserveNullAndEmptyArrays: true } },
            { $unwind: { path: "$country", preserveNullAndEmptyArrays: true } },
            { $unwind: { path: "$state", preserveNullAndEmptyArrays: true } },
            { $unwind: { path: "$city", preserveNullAndEmptyArrays: true } },
            { $unwind: { path: "$species", preserveNullAndEmptyArrays: true } },
            { $unwind: { path: "$createdBy", preserveNullAndEmptyArrays: true } },
            {$project : {
              __v:0
            }},
            {
              $sort: {
                createdAt: -1,
              },
            },
            {$skip:(pageNo-1)*perPage},
            {$limit:perPage}
        ])
        return res.status(200).json({
            success: true,
            data: { panics },
            msg: "ok",
            status: 200,
        });
    } catch (error) {
        return next(error)
    }
});

router.get("/:id",async(req,res,next)=>{
    try {
        let perPage = Number(req.query.perPage || 10)
        let pageNo = Number(req.query.pageNo || 1)
        let panic = await Panic.aggregate([
            {$match:{
                _id:mongoose.Types.ObjectId(req.params.id),
                type:"found"
            }},
            {
              $lookup: {
                from: "pets",
                localField: "petId",
                foreignField: "_id",
                as: "pet",
              },
            },
            {
              $lookup: {
                from: "countries",
                localField: "country",
                foreignField: "_id",
                as: "country"
              }
            },
            {
                $lookup: {
                  from: "states",
                  let:{stateID:"$state"},
                  pipeline:[
                    {$match:{
                        $expr:{
                            $eq:["$_id","$$stateID"]
                        }
                    }},
                    {$project:{
                        name:1
                    }}
                  ],
                  as: "state"
                }
            },
            {
                $lookup: {
                  from: "cities",
                  let:{cityID:"$city"},
                  pipeline:[
                    {$match:{
                        $expr:{
                            $eq:["$_id","$$cityID"]
                        }
                    }},
                    {$project:{
                        name:1
                    }}
                  ],
                  as: "city"
                }
            },
            {
                $lookup: {
                  from: "species",
                  localField: "species",
                  foreignField: "_id",
                  as: "species"
                }
            },
            {
                $lookup: {
                  from: "users",
                  let:{userID:"$createdBy"},
                  pipeline:[
                    {$match:{
                        $expr:{
                            $eq:["$_id","$$userID"]
                        }
                    }},
                    {$project:{
                        name:1
                    }}
                  ],
                  as: "createdBy"
                }
            },
            { $unwind: { path: "$pet", preserveNullAndEmptyArrays: true } },
            { $unwind: { path: "$country", preserveNullAndEmptyArrays: true } },
            { $unwind: { path: "$state", preserveNullAndEmptyArrays: true } },
            { $unwind: { path: "$city", preserveNullAndEmptyArrays: true } },
            { $unwind: { path: "$species", preserveNullAndEmptyArrays: true } },
            { $unwind: { path: "$createdBy", preserveNullAndEmptyArrays: true } },
            {
                $project: {
                    date: 1,
                    country: {
                      $cond: {
                        if: "$country",
                        then: "$country.name",
                        else: "",
                      },
                    },
                    detail: 1,
                    age: { $ifNull: ["$pet.age", ""] },
                    state: {
                      $cond: { if: "$state", then: "$state.name", else: "" },
                    },
                    city: {
                      $cond: { if: "$city", then: "$city.name", else: "" },
                    },
                    color: 1,
                    pet: {
                      name: 1,
                    },
                    petOwner: 1,
                    founder: 1,
                    contactNo: 1,
                    date: 1,
                    owner: 1,
                    other: 1,
                    type: 1,
                    createdAt: 1,
                    location: 1,
                    images: 1,
                    species: { $ifNull: ["$species.name", ""] },
                    breed: { $ifNull: ["$breed", ""] },
                    closed: 1,
                    createdBy:1
                  },
            }
        ])
        let otherPanics = await Panic.aggregate([
            {$match:{
                type:"found",
                _id: { $nin: [mongoose.Types.ObjectId(req.params.id)] }
            }},
            {
              $lookup: {
                from: "pets",
                localField: "petId",
                foreignField: "_id",
                as: "pet",
              },
            },
            {
              $lookup: {
                from: "countries",
                localField: "country",
                foreignField: "_id",
                as: "country"
              }
            },
            {
                $lookup: {
                  from: "states",
                  let:{stateID:"$state"},
                  pipeline:[
                    {$match:{
                        $expr:{
                            $eq:["$_id","$$stateID"]
                        }
                    }},
                    {$project:{
                        name:1
                    }}
                  ],
                  as: "state"
                }
            },
            {
                $lookup: {
                  from: "cities",
                  let:{cityID:"$city"},
                  pipeline:[
                    {$match:{
                        $expr:{
                            $eq:["$_id","$$cityID"]
                        }
                    }},
                    {$project:{
                        name:1
                    }}
                  ],
                  as: "city"
                }
            },
            {
                $lookup: {
                  from: "species",
                  localField: "species",
                  foreignField: "_id",
                  as: "species"
                }
            },
            {
                $lookup: {
                  from: "users",
                  let:{userID:"$createdBy"},
                  pipeline:[
                    {$match:{
                        $expr:{
                            $eq:["$_id","$$userID"]
                        }
                    }},
                    {$project:{
                        name:1
                    }}
                  ],
                  as: "createdBy"
                }
            },
            { $unwind: { path: "$pet", preserveNullAndEmptyArrays: true } },
            { $unwind: { path: "$country", preserveNullAndEmptyArrays: true } },
            { $unwind: { path: "$state", preserveNullAndEmptyArrays: true } },
            { $unwind: { path: "$city", preserveNullAndEmptyArrays: true } },
            { $unwind: { path: "$species", preserveNullAndEmptyArrays: true } },
            { $unwind: { path: "$createdBy", preserveNullAndEmptyArrays: true } },
            {$project : {
              __v:0
            }},
            {
                $sort: {
                  createdAt: -1,
                },
            },
            {$skip:(pageNo-1)*perPage},
            {$limit:perPage}
        ])
        return res.status(200).json({
            success: true,
            data: {
                panic: panic[0],
                otherPanics
            },
            msg: "ok",
            status: 200,
        });
    } catch (error) {
        return next(error)
    }
});

module.exports = router;