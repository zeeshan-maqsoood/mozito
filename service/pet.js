const { Pet } = require("../models");
const mongoose = require("mongoose");
class PetService {
  constructor() {}
  static getPet = (match) => {
    return Pet.findOne(match).populate("breed", "name");
  };
  static getPetById = (id, normalizeFriend,mypetId) => {
    return Pet.aggregate([
      {
        $match: {
          _id: mongoose.Types.ObjectId(id),
        },
      },
      {
        $lookup: {
          from: "interests",
          localField: "interest",
          foreignField: "_id",
          as: "interest",
        },
      },
      {
        $lookup: {
          from: "friends",
          let: {
            pet: "$_id",
          },
          pipeline: [
            {
              $match: {
                $expr: {
                  $or: [
                    {
                      $eq: ["$$pet", "$from"],
                    },
                    {
                      $eq: ["$$pet", "$to"],
                    },
                  ],
                },
                status: "accepted",
              },
            },
          ],
          as: "friends",
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
      {
        $unwind: {
          path: "$friendRequestReceive",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $unwind: {
          path: "$friendRequestSent",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "owner",
          foreignField: "_id",
          as: "owner",
        },
      },
      {
        $unwind: {
          path: "$owner",
          preserveNullAndEmptyArrays: true,
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
        $unwind: {
          path: "$species",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "breeds",
          localField: "breed",
          foreignField: "_id",
          as: "breed",
        },
      },
      {
        $unwind: {
          path: "$breed",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "colors",
          localField: "color",
          foreignField: "_id",
          as: "color",
        },
      },
      {
        $unwind: {
          path: "$color",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "posts",
          let:{petID:"$_id"},
          pipeline:[
            {
              $match:{
                $expr:{
                  $eq:["$$petID","$pet"]
                },
                deleted:false
              }
            }
          ],
          as: "posts",
        },
      },
      // {
      //   $lookup: {
      //     from: "posts",
      //     localField: "_id",
      //     foreignField: "pet",
      //     as: "posts",
      //   },
      // },
      {
        $lookup: {
          from: "pairings",
          pipeline: [
            {
              $match: {
                to:  mongoose.Types.ObjectId(id),
                from: mongoose.Types.ObjectId(mypetId),
                paringStatus: "pending",
              },
            },
          ],
          as: "pairing",
        },
      },
      {
        $addFields: {
          isPairingSent: {
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
          totalLike: {
            $map: {
              input: "$posts",
              as: "post",
              in: {
                $size: "$$post.likes",
              },
            },
          },
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
        },
      },

      {
        $addFields:{
          friends1: {
            $map: {
              input: "$friends",
              as: "friend",
              in: "$$friend.to",
            }
          },
          friends2: {
            $map: {
              input: "$friends",
              as: "friend",
              in: "$$friend.from",
            }
          }
        }
      },
      {
        $addFields:{
          mutualfriends: {
            $setIntersection: [
              normalizeFriend,
              {
                $setIntersection: {
                  $setUnion: ["$friends1", "$friends2"],
                }
              }
            ]
          }
        }
      },
      {
        $addFields: {
          mutual: {
            // $size: {
              $filter: {
                input: "$mutualfriends",
                as: "fr",
                cond: {
                  $ne: ["$$fr", "$_id"],
                }
              }
            // }
          }
        }
      },

      {
        $project: {
          isFriend: {
            $in: ["$_id", normalizeFriend],
          },
          postsCount: {
            $size: "$posts",
          },
          isPairingSent:1,
          adaptionDate: 1,
          photo: 1,
          about: 1,
          gender: 1,
          isMixedBreed: 1,
          mix: 1,
          interest: {
            name: 1,
            _id: 1,
          },
          status: 1,
          species: {
            _id: 1,
            name: 1,
          },
          breed: {
            _id: 1,
            name: 1,
          },
          owner: {
            _id: 1,
            name: 1,
          },
          color: {
            _id: 1,
            name: 1,
          },
          createdAt: 1,
          dob: 1,
          name: 1,

          // friends1: 1,
          // friends2: 1,
          // mutualfriends: 1,
          mutual: 1,
          
          friends: {
            $size: "$friends",
          },
          totalLikes: {
            $sum: "$totalLike",
          },
          isReceiveRequest:1,
          isSendRequest:1
        },
      },
    ]);
  };
  static getSuggestion = (mypetId, normalizeFriend, notinIds, petInterest) => {
    return Pet.aggregate([
      {
        $match: {
          _id: {
            $nin: [...notinIds],
          },
          stage: 2,
        },
      },
      {
        $match: {
          interest: {
            $in: petInterest,
          },
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
      {$lookup:{
        from:"users",
        localField:"owner",
        foreignField:"_id",
        as:"owner"
      }},
      {$unwind:{
        path:"$owner",
        preserveNullAndEmptyArrays:true
      }},
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
          pairing: true,
          name: 1,
          photo: 1,
          owner:"$owner.name"
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
  };
  static newPetProfile1 = (request) => {
    return new Pet(request);
  };
  static getPetSimply = (match) => {
    return Pet.findOne(match);
  };
  static getPetsByUserId = (id) => {
    return Pet.aggregate([
      {
        $match: {
          owner: mongoose.Types.ObjectId(id),
          deleted:{
            $ne:true
          }
        },
      },
      {
        $lookup: {
          from: "interests",
          localField: "interest",
          foreignField: "_id",
          as: "interest",
        },
      },
      {
        $lookup: {
          from: "friends",
          let: {
            pet: "$_id",
          },
          pipeline: [
            {
              $match: {
                $expr: {
                  $or: [
                    {
                      $eq: ["$$pet", "$from"],
                    },
                    {
                      $eq: ["$$pet", "$to"],
                    },
                  ],
                },
                status: "accepted",
              },
            },
          ],
          as: "friends",
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "owner",
          foreignField: "_id",
          as: "owner",
        },
      },
      {
        $unwind: {
          path: "$owner",
          preserveNullAndEmptyArrays: true,
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
        $unwind: {
          path: "$species",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "breeds",
          localField: "breed",
          foreignField: "_id",
          as: "breed",
        },
      },
      {
        $unwind: {
          path: "$breed",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "colors",
          localField: "color",
          foreignField: "_id",
          as: "color",
        },
      },
      {
        $unwind: {
          path: "$color",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "posts",
          // localField: "_id",
          // foreignField: "pet",
          let:{petId:"$_id"},
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: ["$$petId", "$pet"],
                },
                deleted:false
              },
            },
          ],
          as: "posts",
        },
      },
      {
        $addFields: {
          totalLike: {
            $map: {
              input: "$posts",
              as: "post",
              in: {
                $size: "$$post.likes",
              },
            },
          },
        },
      },
      {
        $project: {
          postsCount:{
            $size:"$posts"
          },
          adaptionDate:1,
          photo: 1,
          about: 1,
          gender: 1,
          isMixedBreed: 1,
          mix: 1,
          interest: {
            name: 1,
            _id: 1,
          },
          status: 1,
          species: {
            _id: 1,
            name: 1,
          },
          breed:{
            $cond:{if:"$breed",then:"$breed.name",else:"mix"}
          },
          // breed: {
          //   _id: 1,
          //   name: 1,
          // },
          owner: {
            _id: 1,
            name: 1,
          },
          color: {
            _id: 1,
            name: 1,
          },
          createdAt: 1,
          dob: 1,
          name: 1,
          stage:1,
          friends: {
            $size: "$friends",
          },
          totalLikes:{
            $sum:"$totalLike"
          }
        },
      },
      {
        $sort:{
          stage:-1
        }
      }
    ]);
  };
  static getPetsForPanic = (id) => {
    return Pet.aggregate([
      {
        $match: {
          owner: mongoose.Types.ObjectId(id),
          deleted:{
            $ne:true
          },
          stage:2
        },
      },
      {
        $project: {
          name: 1,
        },
      },
    ]);
  };
  static getMutualPetFirends = (ids) => {
    return Pet.find({_id:{$in:ids}})
    .select("name photo")
  }
}
module.exports = PetService;
