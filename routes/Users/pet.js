const router = require("express").Router();
const {
  PetValidator1,
  PetValidator2,
} = require("../../validator/appValidation");
const {
  Pet,
  Color,
  Species,
  Breed,
  User,
  Interest,
  Media,
  Friends,
} = require("../../models");
const {
  requireSigninUser,
  isOwner,
  petRequired,
} = require("../../middlewares/userAuth");
const { idValidator } = require("../../middlewares");
const _ = require("lodash");
let { s3, upload, local } = require("../../s3");
const { compact } = require("lodash");
const mongoose = require("mongoose");
const Upload = upload("app/pet");
const FriendsService = require("../../service/friends");
const {
  getAllSpecies,
  getPetGallery,
  getAllBreeds,
  createPetProfile1,
  updatePetProfile1,
  createAndUpdatePetProfile1,
  getPetByUserId,
  getBlockedPet,
  blockPetById,
  unBlockPetById,
  getMyPets,
  selectPet,
  getSinglePetById,
  deletePetByID,
  getMyPetsForPanic,
  getAllSpeciesType
} = require("../../controller/pet");
local = local("app/pet");

router.param("id", idValidator);

// ok-hyf
router.get("/species", getAllSpecies);
router.get("/speciesType/:id", getAllSpeciesType);

// ok-hyf
// species Id
router.get("/breed/:id", getAllBreeds);

// tested
router.post(
  "/createPetProfile1",
  requireSigninUser,
  PetValidator1,
  createPetProfile1
);

// for updating pet by id
router.put("/createPetProfile1/:id", requireSigninUser, updatePetProfile1);

// tested
router.put(
  "/createPetProfile2/:id",
  requireSigninUser,
  Upload.single("photo"),
  createAndUpdatePetProfile1
);
router.get("/gallery",requireSigninUser,petRequired,getPetGallery)
// tested
router.get("/by/user/:id", requireSigninUser, getPetByUserId);

// ok-hyf
// tested
//  edit all following
router.get("/blockedpets", requireSigninUser, getBlockedPet);
// ok-hyf
// change block pet according to new friend model
router.put("/block/:id", requireSigninUser, blockPetById);
// ok-hyf
// change block pet according to new friend model
router.put("/unblock/:id", requireSigninUser, unBlockPetById);

// ok-hyf
// tested
router.get("/mypets", requireSigninUser, getMyPets);
router.get("/mypetsforPanic", requireSigninUser, getMyPetsForPanic);
// not checked-hyf
// router.get("/nearby", requireSigninUser, findNearByPet);

// tested
// ok-hyf
router.put("/selectpet/:id", requireSigninUser, selectPet);

// ok-hyf
// correct search (use  mongodb search -> more faster) for later
router.get(
  "/search",
  requireSigninUser,
  petRequired,
  async (req, res, next) => {
    try {
      // console.log("req.user => ",req.user)
      const query = RegExp(req.query.search || "", "ig");
      const mypetId = req.selected_pet._id.toString();
      const normalizeFriend = await FriendsService.getNormalizeFriend(
        mypetId,
        "accepted"
      );
      // const sendRequestFriend = await FriendsService.getNormalizeFriend(
      //   mypetId,
      //   "pending"
      // );
      // console.log("normalizeFriend => ",normalizeFriend)
      // console.log("sendRequestFriend => ",sendRequestFriend)

      // const normalizeFriend = req.selected_pet.friends.map((friend) =>
      //   mongoose.Types.ObjectId(friend.pet)
      // );
      // const pets = await Pet.aggregate([
      //   {
      //     $match: {
      //       _id: {
      //         $nin: [mongoose.Types.ObjectId(req.selected_pet._id)],
      //       },
      //       name: query,
      //     },
      //   },
      //   {
      //     $project: {
      //       name: 1,
      //       _id: 1,
      //       friends: {
      //         $map: {
      //           input: "$friends",
      //           as: "friend",
      //           in: "$$friend.pet",
      //         },
      //       },
      //     },
      //   },
      //   {
      //     $project: {
      //       name: 1,
      //       mutual: {
      //         $size: {
      //           $setIntersection: ["$friends", normalizeFriend],
      //         },
      //       },
      //       isFriend: {
      //         $in: [mongoose.Types.ObjectId(req.selected_pet._id), "$friends"],
      //       },
      //     },
      //   },
      // ]);

      const pets = await Pet.aggregate([
        {$lookup:{
          from: "friends",
          let: {
            petID: "$_id"
          },
          pipeline:[
            {
              $match:{
                $expr:{
                  $and:[
                    {$eq:["$$petID","$to"]},
                    {$eq:[mypetId,"$from"]}
                  ]
                },
                status:"blocked"
              }
            },
            {$project:{
              status:1
            }}
          ],
          as:"friendz"
        }},
        {$unwind:{
          path:"$friendz",
          preserveNullAndEmptyArrays:true
        }},
        {
          $match: {
            _id: {
              $nin: [mongoose.Types.ObjectId(req.selected_pet._id)],
            },
            name: query,
            stage: 2,
            deleted:{
              $ne:true
            }
          },
        },
        {
          $addFields: {
            petId: {
              $cond: {
                if: {
                  $eq: [mongoose.Types.ObjectId(mypetId), "$from"],
                },
                then: "$to",
                else: "$from",
              },
            },
          },
        },
        {
          $lookup: {
            from: "friends",
            let: {
              toPet: "$petId",
            },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      {
                        $ne: [mongoose.Types.ObjectId(mypetId), "$from"],
                      },
                      {
                        $ne: [mongoose.Types.ObjectId(mypetId), "$to"],
                      },
                    ],
                  },
                },
              },
              {
                $match: {
                  $expr: {
                    $or: [
                      {
                        $eq: ["$$toPet", "$from"],
                      },
                      {
                        $eq: ["$$toPet", "$to"],
                      },
                    ],
                  },
                  status: "accepted",
                },
              },
              {
                $addFields: {
                  topet: "$$toPet",
                },
              },
            ],
            as: "friends",
          },
        },
        {
          $lookup: {
            from: "pairings",
            let: {
              petId: "$petId",
            },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $or: [
                      {
                        from: mongoose.Types.ObjectId(mypetId),
                      },
                      {
                        to: mongoose.Types.ObjectId(mypetId),
                      },
                    ],
                  },
                },
              },
              {
                $match: {
                  $expr: {
                    $or: [
                      {
                        $eq: ["$from", "$$petId"],
                      },
                      {
                        $eq: ["$to", "$$petId"],
                      },
                    ],
                  },
                  pairingStatus: "accepted",
                },
              },
              {
                $addFields: {
                  petId: "$$petId",
                },
              },
            ],
            as: "pairing",
          },
        },
        {$lookup:{
          from: "users",
          localField: "owner",
          foreignField: "_id",
          as:"owner"
        }},
        {$unwind:{
          path:"$owner",
          preserveNullAndEmptyArrays:true
        }},
        {
          $lookup: {
            from: "friends",
            let: {
              petID: "$_id",
            },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $or: [
                      {
                        $eq: ["$from", "$$petID"]
                      },
                      {
                        $eq: ["$to", "$$petID"]
                      },
                    ],
                  },
                },
              },
              {$sort:{
                createdAt:-1
              }}
            ],
            as: "friendwa",
          },
        },
        {
          $lookup: {
            from: "friends",
            let: {
              petID: "$_id",
            },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      {
                        $eq: ["$from", "$$petID"]
                      },
                      {
                        $eq: ["$to", mongoose.Types.ObjectId(mypetId)]
                      },
                      {
                        $eq: ["$status", "pending"]
                      }
                    ],
                  },
                },
              }
            ],
            as: "friendRequestReceive",
          },
        },
        {
          $lookup: {
            from: "friends",
            let: {
              petID: "$_id",
            },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      {
                        $eq: ["$from", mongoose.Types.ObjectId(mypetId)]
                      },
                      {
                        $eq: ["$to", "$$petID"]
                      },
                      {
                        $eq: ["$status", "pending"]
                      }
                    ],
                  },
                },
              }
            ],
            as: "friendRequestSent",
          },
        },
        {$unwind:{
          path:"$friendRequestReceive",
          preserveNullAndEmptyArrays:true
        }},
        {$unwind:{
          path:"$friendRequestSent",
          preserveNullAndEmptyArrays:true
        }},
        {$addFields:{
          frnds: {
            $map: {
              input: {
                $filter: {
                  input: "$friendwa",
                  as: "frnd",
                  cond: {$or:[
                    {$eq:["$$frnd.from",mongoose.Types.ObjectId(mypetId)]},
                    {$eq:["$$frnd.to",mongoose.Types.ObjectId(mypetId)]}
                  ]}
                }
              },
              as: "friend",
              in: {
                "_id":"$$friend._id",
                "status":"$$friend.status",
                "from":"$$friend.from",
                "to":"$$friend.to",
                "createdAt":"$$friend.createdAt",
              }
            },
          }
        }},
        {$addFields:{
          frnd:{$arrayElemAt:["$frnds",0]}
        }},
        {$addFields:{
          isFriend:{
            $cond:{ if:{
              $eq: [ "$frnd.status", "accepted" ]
            },
            then: true,
            else: false
           }
          },
          // isFriendReq:{
          //   $cond:{if:{
          //     $eq: [ "$frnd.status", "pending" ]
          //     },
          //     then:true,
          //     else:false
          //   }
          // },
          isReceiveRequest:{
            $cond:{if:{
              $eq: [ "$friendRequestReceive.status", "pending" ]
              },
              then:true,
              else:false
            }
          },
          isSendRequest:{
            $cond:{if:{
              $eq: [ "$friendRequestSent.status", "pending" ]
              },
              then:true,
              else:false
            }
          }
        }},
        {
          $project: {
            // friends: 1,
            friends1: {
              $map: {
                input: "$friends",
                as: "friend",
                in: "$$friend.to",
              },
            },
            friends2: {
              $map: {
                input: "$friends",
                as: "friend",
                in: "$$friend.from",
              },
            },
            // friendwas: {
            //   $map: {
            //     input: {
            //       $filter: {
            //         input: "$friendwa",
            //         as: "frnd",
            //         cond: "$$frnd.from"
            //       }
            //     },
            //     as: "hobbym",
            //     in: {
            //       name: "$$hobbym.name",
            //       type: "$$hobbym.type"
            //     }
            //   }
            // },
            pairing: true,
            name: 1,
            owner: "$owner.name",
            photo: 1,
            friendz:1,
            // frnd:1,
            isFriend:1,
            // isFriendReq:1,
            isReceiveRequest:1,
            isSendRequest:1,
            // friendRequestSent:1
            // friendRequestReceive:1
            // friendwa:1
          },
        },
        {
          $addFields: {
            friends: {
              $setIntersection: [
                normalizeFriend,
                {
                  $setIntersection: {
                    $setUnion: ["$friends1", "$friends2"],
                  },
                },
              ],
            },
            IsPairedWithMe: {
              $cond: {
                if: {
                  $gt: [
                    {
                      $size: "$pairing",
                    },
                    0,
                  ],
                },
                then: true,
                else: false,
              },
            },
          },
        },
        {
          $addFields: {
            mutual: {
              $size: {
                $filter: {
                  input: "$friends",
                  as: "fr",
                  cond: {
                    $ne: ["$$fr", "$_id"],
                  },
                },
              },
            },
          },
        },
        {
          $project: {
            friends1: false,
            friends2: false,
            pairing: false,
            friends: false,
          },
        },
        {
          $limit: 10,
        },
      ]);
      // console.log("pets => ",pets[0]._id)
      // let sendRequest = false
      // let Friend = false
      // for(let i=0;i<sendRequestFriend.length;i++){
      //   if(String(sendRequestFriend[i])===String(pets[0]._id)){
      //     sendRequest = true
      //   }
      // }
      // for(let i=0;i<normalizeFriend.length;i++){
      //   if(String(normalizeFriend[i])===String(pets[0]._id)){
      //     Friend = true
      //   }
      // }
      // console.log("sendRequest => ",sendRequest)
      // console.log("friend => ",Friend)
      return res
        .status(200)
        .json({ success: true, data: { pets }, msg: "ok", status: 200 })
        // .json({ success: true, data: { pets,sendRequest,Friend }, msg: "ok", status: 200 });
    } catch (error) {
      return next(error);
    }
  }
);

// test it when friend send and receive request is completed
router
  .route("/:id")
  // tested
  .get(requireSigninUser, getSinglePetById)
  // tested
  .delete(requireSigninUser, deletePetByID);
module.exports = router;
