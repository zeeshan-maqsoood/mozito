const router = require("express").Router();
const { Post } = require("../../models")

router.get("/",async(req,res,next)=>{
    try {
        let perPage = Number(req.query.perPage || 10)
        let pageNo = Number(req.query.pageNo || 1)
        let posts = await Post.aggregate([
            {$match: {
              public: true
            }},
            {
              $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "owner",
              },
            },
            {
              $lookup: {
                from: "pets",
                localField: "pet",
                foreignField: "_id",
                as: "pet"
              }
            },
            { $unwind: { path: "$owner", preserveNullAndEmptyArrays: true } },
            { $unwind: { path: "$pet", preserveNullAndEmptyArrays: true } },
            {
              $addFields: {
                likesCount: {
                  $size: "$likes",
                },
                sharesCount: {
                  $size: "$shares",
                },
                viewsCount: {
                  $size: "$views",
                }
              }
            },
            {$project : {
              description: 1,
              content: 1,
              contetList: 1,
              likesCount: 1,
              sharesCount: 1,
              viewsCount: 1,
              recommend: 1,
              public: 1,
              active: 1,
              hidePost: 1,
              block: 1,
              createdAt: 1,
              "owner.name": 1,
              pet: {
                name: 1,
                photo: 1
              }
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
            data: { posts },
            msg: "ok",
            status: 200,
          });
    } catch (error) {
        return next(error)
    }
});

module.exports = router;