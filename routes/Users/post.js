const router = require("express").Router();
let { s3, upload, local } = require("../../s3");
const mime=require("mime-types")
const { petRequired } = require("../../middlewares/userAuth");
const {
  Post,
  Pet,
  Media,
  User,
  Notification,
  Comments,
  Friends,
  StatusModel
} = require("../../models");
const { idValidator } = require("../../middlewares");
const {
  commentValidator,
  postValidator,
} = require("../../validator/appValidation");
const { apiLimiter } = require("../../utils");
const {
  firebaseNotificationMultiUser,
  firebaseNotificationUser,
} = require("../../common/firebaseNotificationHelper");
const notificationMessages = require("../../common/notificationMessages");
const FriendsService = require("../../service/friends");
const Upload = upload("app/post");
const mongoose = require("mongoose");
const StatusService = require("../../service/status")
const UserPageModel=require('../../models/userPageModel')

router.param("id", idValidator);
// ok-hyf
router.post(
  "/createpost",
  petRequired,
  // Upload.array("files",4),
  Upload.fields([
    {name: 'files',maxCount: 4},
    {name: 'thumbnail',maxCount: 4}
  ]),
  async (req, res, next) => {
    try {
      const { files,body } = req;
      // if (!files && !body.description)
      // console.log("files => ",files.files)
      if (!files.files && !body.description)
        return next({ status: 422, msg: "unable to create post" });
      const post = new Post({ ...body });
      // make loop files
      if (files.files && files.files.length>0) {
        const contetList=files.files.map((file,i) =>{
          // console.log(`file ${[i]} =>`,file);
          // const mimetype = mime.lookup(file.originalname);
          // let isVideo=false;
          // if(mimetype){
          //   isVideo=file.contentType.split("/")[0]==="video"?true:false;
          // }
          let thumbnail
          if(files.thumbnail && files.thumbnail.length>0){
            thumbnail=files.thumbnail.map(file => file.location)
          }
          // console.log("thumbnail => ",thumbnail)
          return {
            mimetype:file.contentType,
            isVideo:body.isVideo,
            thumbnail_image:body.isVideo==='true'?thumbnail[i]:"",
            owner: req.user._id,
            pet: req.selected_pet._id,
            media: {
              key: file.key,
              url: file.location
            }
          }
        })
        
        // console.log("contetList =>",contetList);
        // console.log("thumbnail =>",thumbnail[0]);
        post.contetList=contetList;
        post.content=contetList[0];
        // if(contetList.length>0){
        //   post.content=contetList[0];
        // }
        await Media.insertMany(contetList);
        }
      //   else {
      //   const validationResult = await postValidator(req.body);
      //   if (validationResult) {
      //     return next({ status: 422, msg: validationResult });
      //   }
      // }
      // if (req.body.url) {
      //   const location = {
      //     url: req.body.url,
      //     isUrl: true,
      //   };
      //   post.location = location;
      //   post.content.mimetype = "";
      //   post.content.media = {
      //     key: "",
      //     url: "",
      //     updatedAt: Date.now(),
      //   };
      // } 
      // else {
      //   const location = {
      //     url: "",
      //     isUrl: false,
      //   };
      //   post.location = location;
      // }
      post.owner = req.user._id
      post.pet = req.selected_pet._id
      body.recommend === 'true' ? post.recommend = true : post.recommend = false
      // console.log("post => ",post)
      await post.save();
      firebaseNotificationMultiUser(
        req.selected_pet,
        req,
        // `${req.selected_pet.name} created a new post`,
        `${req.selected_pet.name} just posted something! Check it out!`,
        `${post.description}`,
        post._id,
        "singlePost"
      );
      return res
        .status(200)
        .json({ success: true, data: { post }, msg: "ok", status: 200 });
    } catch (error) {
      return next(error);
    }
  }
);


// it is deleted from user side but not from database.
//  set deleted=true deletedAt = ${timestamp}
router.delete("/delete/:id", async (req, res, next) => {
  try {
    const post = await Post.findOne({
      _id: req.params.id,
      pet: req.selected_pet._id,
    });
    if (!post) return next({ status: 404, msg: "Post Not Found" });
    let media = []
    post.contetList.map(async(e)=>{
      media.push(e.media.url)
    })
    await Media.deleteMany({
      pet: req.selected_pet._id,
      "media.url": {$in:media}
    })
    let friends = await Friends.find({from:post.pet,status:"accepted"})
        for(let i=0;i<friends.length;i++){
            await Notification.findOneAndDelete({
              fromPet:friends[i].from,
              toPet:friends[i].to,
              body:post.description
            })
        }
    await post.delete();
    return res.status(200).json({
      success: true,
      data: { msg: "post and media deleted" },
      msg: "ok",
      status: 200,
    });
  } catch (error) {
    return next(error);
  }
});

router.put("/edit/:id", Upload.array("files",4), async (req, res, next) => {
  try {
    const post = await Post.findOne({
      _id: req.params.id,
      owner: req.user._id,
    });
    if (!post) return next({ status: 404, msg: "Post not found" });
    const { file,files } = req;
    let media = {
      updatedAt: Date.now(),
    };
    // for(let i=0;i<post.contetList.length;i++){
    //   let mediaa = await Media.find({
    //     owner:req.user._id,
    //     pet:req.selected_pet._id,
    //     "media.key":post.contetList[i].media.key
    //   })
    //   console.log("mediaa => ",mediaa)
    // }
    if (files && files.length) {

      const contetList=files.map((file,i) =>{
        // console.log(`file ${[i]} =>`,file);
        const mimetype = mime.lookup(file.originalname);
        let isVideo=false;
        if(mimetype){
          isVideo=file.contentType.split("/")[0]==="video"?true:false;
        }
        return {
          mimetype:file.contentType,
          isVideo,
          owner: req.user._id,
          pet: req.selected_pet._id,
          media: {
            key:file.key,
            url: file.location
          }
        }
      })
      for(let i=0;i<contetList.length;i++){
        post.contetList.push(contetList[i])
      }
      post.content=post.contetList[0]
      for(let i=0;i<post.contetList.length;i++){
        let mediaa = await Media.find({
          owner:req.user._id,
          pet:req.selected_pet._id,
          "media.key":post.contetList[i].media.key
        })
        if(mediaa.length===0){
          new Media({
            mimetype: post.contetList[i].mimetype,
            isVideo: post.contetList[i].isVideo,
            owner: req.user._id,
            pet: req.selected_pet._id,
            media: {
              key: post.contetList[i].media.key,
              url: post.contetList[i].media.url
            }
          }).save()
        }
      }
      // console.log("post.contetList => ",post.contetList)
      // if(contetList.length>0){
      //   post.content=contetList[0];
      // }

      // await Media.insertMany(contetList);

      // media.key = file.key;
      // media.url = file.location;
      // const mediaToStorAlbum = new Media({
      //   mimetype: file.mimetype,
      //   media,
      //   pet: req.selected_pet._id,
      //   owner: req.user._id,
      // });
      // await mediaToStorAlbum.save();
      // post.content.mimetype = file.mimetype;
      // post.content.media = media;
      
    }
    if (req.body.description) {
      post.description = req.body.description;
    }

    if (req.body.isVideo === true || req.body.isVideo === "true" ) {
      post.isVideo = true;
    }
    else{
      post.isVideo = false;
    }

    if (req.body.public === true || req.body.public === "true" ) {
      post.public = true;
    }
    else{
      post.public = false;
    }

    if (req.body.recommend === true || req.body.recommend === "true" ) {
      post.recommend = true;
    }
    else{
      post.recommend = false;
    }
    // if()
    await post.save();

    // const updatedPost = await Post.aggregate([
    //   {
    //     $match: {
    //       _id: mongoose.Types.ObjectId(req.params.id),
    //     },
    //   },
    //   {
    //     $lookup: {
    //       from: "pets",
    //       localField: "pet",
    //       foreignField: "_id",
    //       as: "pet",
    //     },
    //   },
    //   {
    //     $unwind: {
    //       path: "$pet",
    //       preserveNullAndEmptyArrays: true,
    //     },
    //   },
    //   {
    //     $lookup: {
    //       from: "comments",
    //       localField: "_id",
    //       foreignField: "post",
    //       as: "comments",
    //     },
    //   },
    //   {
    //     $project: {
    //       description: 1,
    //       public: 1,
    //       recommend: 1,
    //       content: 1,
    //       createdAt: 1,
    //       pet: {
    //         name: 1,
    //         _id: 1,
    //       },
    //       likes: {
    //         $size: "$likes",
    //       },
    //       shares: {
    //         $size: "$shares",
    //       },
    //       comments: {
    //         $size: "$comments",
    //       },
    //       Liked: {
    //         $map: {
    //           input: "$likes",
    //           as: "pet",
    //           in: "$$pet.pet",
    //         },
    //       },
    //     },
    //   },
    //   {
    //     $project: {
    //       isLiked: {
    //         $in: [mongoose.Types.ObjectId(req.selected_pet._id), "$Liked"],
    //       },
    //       description: 1,
    //       public: 1,
    //       recommend: 1,
    //       content: 1,
    //       createdAt: 1,
    //       pet: {
    //         name: 1,
    //         _id: 1,
    //       },
    //       likes: 1,
    //       shares: 1,
    //       comments: 1,
    //     },
    //   },
    // ]);

    return res.status(200).json({
      success: true,
      data: { post },
      msg: "ok",
      status: 200,
    });
  } catch (error) {
    return next(error);
  }
});

router.put("/hide/:id", async (req, res, next) => {
  try {
    // console.log("req.params.id => ",req.params.id)
    const post = await Post.findById({_id:req.params.id})
    // const post = await Post.findOneAndUpdate(
    //   { _id: req.params.id, owner: req.user._id },
    //   { "hidePost.hideBy": req.selected_pet._id,"hidePost.hide":true }
    // );
    if (!post) return next({ status: 404, msg: "Post Not Found" });
    let hideby = post.hidePost.find(e=>e.hideBy.toString()===req.selected_pet._id.toString())
    // console.log("post => ",post)
    // console.log("hideby => ",hideby)
    if (hideby) return next({ status: 404, msg: "You already hide this Post." });
    post.hidePost.push({hideBy:req.selected_pet._id,hide:true})
    await post.save()
    return res.status(200).json({
      success: true,
      data: { msg: "Post Hide Successfully" },
      msg: "ok",
      status: 200,
    });
  } catch (error) {
    return next(error);
  }
});
router.put("/unhide/:id", async (req, res, next) => {
  try {
    const post = await Post.findOneAndUpdate(
      { _id: req.params.id, addedBy: req.user._id },
      { active: true }
    );
    if (!post) return next({ status: 404, msg: "Post Not Found" });
    return res.status(200).json({
      success: true,
      data: { msg: "Post UnHide Successfully" },
      msg: "ok",
      status: 200,
    });
  } catch (error) {
    return next(error);
  }
});
// ok-hyf
// router.get("/recommended", async (req, res, next) => {
//   try {
//     const friends = [
//       req.selected_pet._id,
//       ...req.selected_pet.friends.map((friend) => friend.pet),
//     ];
//     const posts = await Post.aggregate([
//       {
//         $match: {
//           pet: { $in: [...friends] },
//           recommend: true,
//         },
//       },
//       {
//         $lookup: {
//           from: "pets",
//           localField: "pet",
//           foreignField: "_id",
//           as: "pet",
//         },
//       },
//       {
//         $unwind: {
//           path: "$pet",
//           preserveNullAndEmptyArrays: true,
//         },
//       },
//       {
//         $lookup: {
//           from: "comments",
//           localField: "_id",
//           foreignField: "post",
//           as: "comments",
//         },
//       },
//       {
//         $project: {
//           description: 1,
//           public: 1,
//           recommend: 1,
//           content: 1,
//           createdAt: 1,
//           pet: {
//             name: 1,
//             _id: 1,
//           },
//           likes: {
//             $size: "$likes",
//           },
//           shares: {
//             $size: "$shares",
//           },
//           comments: {
//             $size: "$comments",
//           },
//           Liked: {
//             $map: {
//               input: "$likes",
//               as: "pet",
//               in: "$$pet.pet",
//             },
//           },
//         },
//       },
//       {
//         $project: {
//           isLiked: {
//             $in: [mongoose.Types.ObjectId(req.selected_pet._id), "$Liked"],
//           },
//           description: 1,
//           public: 1,
//           recommend: 1,
//           content: 1,
//           createdAt: 1,
//           pet: {
//             name: 1,
//             _id: 1,
//           },
//           likes: 1,
//           shares: 1,
//           comments: 1,
//         },
//       },
//       {
//         $sort: {
//           createdAt: -1,
//         },
//       },
//       // {
//       //     $skip: (pageNo === 0 || pageNo === 1 || pageNo <= 1) ? 0 : pageNo * perPage
//       // }, {
//       //     $limit: perPage || 10
//       // }
//     ]);
//     return res
//       .status(200)
//       .json({ success: true, data: { posts }, msg: "ok", status: 200 });
//   } catch (error) {
//     return next(error);
//   }
// });
// ok-hyf
router.get("/myposts", petRequired, async (req, res, next) => {
  try {
    const mypetId = req.selected_pet._id;
    const posts = await Post.aggregate([
      // {
      //   $match: {
      //     pet:mongoose.Types.ObjectId(mypetId),
      //   },
      // },
      {
        $lookup: {
          from: "pets",
          localField: "shares.pet",
          foreignField: "_id",
          as: "sharer",
        },
      },
      {
        $unwind: {
          path: "$sharer",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $match: {
          $or: [
            { pet: mongoose.Types.ObjectId(mypetId) },
            {
              "sharer._id": {
                $in: [mongoose.Types.ObjectId(mypetId)],
              },
            },
          ],
        },
      },
      {
        $lookup: {
          from: "pets",
          localField: "pet",
          foreignField: "_id",
          as: "pet",
        },
      },
      {
        $unwind: {
          path: "$pet",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $match:{
          "pet.deleted":{
            $ne:true
          }
        }
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
          from: "comments",
          // localField: "_id",
          // foreignField: "post",
          as: "comments",
          let:{commentID:"$_id"},
            pipeline:[
              {$match:{$expr:{$eq:["$post","$$commentID"]},deleted:false}}
            ]
        },
      },
      {
        $project: {
          sharer: {
            name: 1,
            _id: 1,
            date: 1,
            photo: 1,
          },
          description: 1,
          public: 1,
          recommend: 1,
          content: 1,
          createdAt: 1,
          contetList:1,
          pet: {
            name: 1,
            _id: 1,
            photo: 1,
          },
          owner: {
            name: 1,
            _id: 1,
          },
          likes: {
            $size: "$likes",
          },
          shares: {
            $size: "$shares",
          },
          comments: {
            $size: "$comments",
          },
          Liked: {
            $map: {
              input: "$likes",
              as: "pet",
              in: "$$pet.pet",
            },
          },
        },
      },
      {
        $project: {
          isLiked: {
            $in: [mongoose.Types.ObjectId(req.selected_pet._id), "$Liked"],
          },
          isDeleteAble:{
            $cond: { if: { $eq: [ "$pet._id", mongoose.Types.ObjectId(req.selected_pet._id) ] }, then: true, else: false }
          },
          description: 1,
          public: 1,
          recommend: 1,
          contetList:1,
          content: 1,
          createdAt: 1,
          owner: 1,
          pet: 1,
          likes: 1,
          shares: 1,
          comments: 1,
        },
      },
      {
        $sort: {
          createdAt: -1,
        },
      },
    ]);
    // const newPosts = posts.map(post => {
    //     const isLike = post.likes.find(pet => pet._id.toString() === req.user.pet[0].toString())
    //     post.isLiked = isLike ? true : false
    //     return post
    // });
    return res
      .status(200)
      .json({ success: true, data: { posts }, msg: "ok", status: 200 });
  } catch (error) {
    return next(error);
  }
});

router.get("/byPetId/:id", petRequired, async (req, res, next) => {
  try {
    const mypetId = req.selected_pet._id.toString();

    const normalizeFriend = await FriendsService.getNormalizeFriend(
      mypetId,
      "accepted"
    );
    const match = {
      pet: mongoose.Types.ObjectId(req.params.id)
    }
    if (
      !normalizeFriend.find(
        (friend) => friend.toString() === req.params.id.toString()
      )
    ) {
      match.public = true;
    }

    const posts = await Post.aggregate([
      {
        $match: match,
      },
      {
        $lookup: {
          from: "pets",
          localField: "pet",
          foreignField: "_id",
          as: "pet",
        },
      },
      {
        $unwind: {
          path: "$pet",
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
          from: "comments",
          // localField: "_id",
          // foreignField: "post",
          as: "comments",
          let:{postID:"$_id"},
          pipeline:[
            {$match:{
              $expr:{
                $eq:["$$postID","$post"]
              },
              deleted:false
            }}
          ]
        },
      },
      {
        $project: {
          description: 1,
          public: 1,
          recommend: 1,
          content: 1,
          createdAt: 1,
          pet: {
            name: 1,
            _id: 1,
            photo: 1,
          },
          owner: {
            name: 1,
            _id: 1,
          },
          hidePost:1,
          likes: {
            $size: "$likes",
          },
          shares: {
            $size: "$shares",
          },
          comments: {
            $size: "$comments",
          },
          Liked: {
            $map: {
              input: "$likes",
              as: "pet",
              in: "$$pet.pet",
            },
          },
        },
      },
      {
        $project: {
          isLiked: {
            $in: [mongoose.Types.ObjectId(mypetId), "$Liked"],
          },
          isFriend: {
            $in: ["$_id", normalizeFriend],
          },
          description: 1,
          public: 1,
          recommend: 1,
          content: 1,
          createdAt: 1,
          owner: 1,
          pet: 1,
          likes: 1,
          shares: 1,
          comments: 1,
          hidePost:1
        },
      },
      {$match:{
        $and:[
          {
            "hidePost.hideBy":{
              $ne:req.selected_pet._id
            }
          },
          {
            "hidePost.hide":{
              $ne:false
            }
          }
        ]
      }},
      {$sort:{
        createdAt:-1
      }}
    ]);
    // const newPosts = posts.map(post => {
    //     const isLike = post.likes.find(pet => pet._id.toString() === req.user.pet[0].toString())
    //     post.isLiked = isLike ? true : false
    //     return post
    // });
    return res
      .status(200)
      .json({ success: true, data: { posts }, msg: "ok", status: 200 });
  } catch (error) {
    return next(error);
  }
});

// ok-hyf
router.get("/journey", async (req, res, next) => {
  try {
    let totalStatus,watchedStatus,noWatchedStatus
    let posts
    let perPage = Number(req.query.perPage || 10);
    let pageNo = Number(req.query.pageNo || 1);
    if(req.user!=="Guest User"){
      const mypetId = req.selected_pet._id.toString()
      const normalizeFriend = await FriendsService.getNormalizeFriend(mypetId)
      const userPage=await UserPageModel.find()
      console.log(userPage,"userPage")
    // const friends = await Friends.find({
    //   $or: [{ from: mypetId }, { to: mypetId }],
    //   status: "accepted",
    // });
    
    // const normalizeFriend = friends.map((f) => {
    //   if (f.to.toString() === mypetId) {
    //     return mongoose.Types.ObjectId(f.from);
    //   } else {
    //     return mongoose.Types.ObjectId(f.to);
    //   }
    // });
    // console.log("nomal => ",normalizeFriend)
    const match = {};
    const match1 = {};
    // const nowDate = new Date()
    // console.log("nowDate => ",nowDate)

    if (!req.selected_pet) {
      // match1.owner={country:{$in:[req.user.country]}}
      match1["owner.country"] = mongoose.Types.Obje
      ctId(req.user.country);
      match1.public = true;
      // match1.recommend=true;
    } else {
      // match.pet = { $in: [...friends] };
      match["$or"] = [
        {
          pet: { $in: [
            // add mazito pet id 
            mongoose.Types.ObjectId("6156f131cff1a4b5e17a0460"),
            ...normalizeFriend, 
            mongoose.Types.ObjectId(mypetId),
            
          ] },
        },

        {
          "sharer._id": {
            $in: [mongoose.Types.ObjectId("6156f131cff1a4b5e17a0460"),...normalizeFriend, mongoose.Types.ObjectId(mypetId)],
          },
        },
        { public: true }
      ];
    }
      posts = await Post.aggregate([
        {
          $lookup: {
            from: "pets",
            localField: "shares.pet",
            foreignField: "_id",
            as: "sharer",
          },
        },
        {
          $unwind: {
            path: "$sharer",
            preserveNullAndEmptyArrays: true,
          },
        },
        { $match: match },
        {
          $lookup: {
            from: "pets",
            localField: "pet",
            foreignField: "_id",
            as: "pet",
          },
        },
        { $unwind: { path: "$pet", preserveNullAndEmptyArrays: true } },
        {
          $lookup: {
            from: "users",
            localField: "owner",
            foreignField: "_id",
            as: "owner",
          },
        },
        { $unwind: { path: "$owner", preserveNullAndEmptyArrays: true } },
        {
          $match: match1, 
        },
        {
          $match:{
            "pet.deleted":{
              $ne:true
            }
          }
        },
        {
          $lookup: {
            from: "comments",
            // localField: "_id",
            // foreignField: "post",
            as: "comments",
            let:{commentID:"$_id"},
            pipeline:[
              {$match:{$expr:{$eq:["$post","$$commentID"]},deleted:false}}
            ]
          },
        },
        {
          $addFields: {
            likesCount: {
              $size: "$likes",
            },
            sharesCount: {
              $size: "$shares",
            },
            commentsCount: {
              $size: "$comments",
            },
            Liked: {
              $map: {
                input: "$likes",
                as: "pet",
                in: "$$pet.pet",
              },
            },
            // shareDate:{
            //   $elemMatch:{pet:"$sharer.name"}
            // },
            // sharer: {
            //   name: 1,
            //   _id: 1,
            //   photo: 1,
            //   shareDate: "$shares.date",
            // },
          },
        },
        {
          $project: {
            sharer: {
              name: 1,
              _id: 1,
              date: 1,
              photo: 1,
            },
            contetList:1,
            isLiked: {
              $in: [mongoose.Types.ObjectId(req.selected_pet._id), "$Liked"],
            },
            description: 1,
            public: 1,
            active: 1,
            recommend: 1,
            content: 1,
            createdAt: 1,
            pet: {
              name: 1,
              _id: 1,
              photo: 1,
            },
            likesCount: 1,
            sharesCount: 1,
            commentsCount: 1,
            // comments:1,
            owner: {
              _id: 1,
              name: 1,
            },
            hidePost:1,
            // hidePostAdmin:1
            // sharer: 1,
          },
        },
        {$match:{
          $and:[
            {
              "hidePost.hideBy":{
                $ne:req.selected_pet._id
              }
            },
            {
              "hidePost.hide":{
                $ne:false
              }
            }
          ]
        }},
        // {$match:
        //   {
        //     "hidePostAdmin.hide":{
        //       $ne:true
        //     }
        //   }
        // },
        {
          $sort: {
            createdAt: -1,
          },
        },
        {$skip:(pageNo-1)*perPage},
        {$limit:perPage}
        // {
        //   $skip:
        //     pageNo === 0 || pageNo === 1 || pageNo <= 1 ? 0 : pageNo * perPage,
        // },
        // {
        //   $limit: perPage || 10,
        // },
      ]);
      totalStatus = await StatusService.getStatus(match)
      // totalStatus = await StatusModel.aggregate([
      //   {$match:match},
      //   {
      //     $lookup: {
      //       from: "pets",
      //       localField: "pet",
      //       foreignField: "_id",
      //       as: "pet",
      //     },
      //   },
      //   {
      //     $lookup: {
      //       from: "users",
      //       localField: "user",
      //       foreignField: "_id",
      //       as: "user",
      //     },
      //   },
      //   { $unwind: { path: "$pet", preserveNullAndEmptyArrays: true } },
      //   { $unwind: { path: "$user", preserveNullAndEmptyArrays: true } },
      //   {$project:{
      //     deleted:1,
      //     mediaList:{
      //       $filter:{
      //         input:"$mediaList",
      //         as:"date",
      //         cond:{$gte:["$$date.statusOffDate",nowDate]}
      //       }
      //     },
      //     "user.name":1,
      //     "pet.photo":1,
      //     "pet.name":1,
      //     createdAt:1,
      //     updatedAt:1,
      //     watched:1
      //   }},
      //   {$match:{
      //     $expr:{
      //       $gt:[{$size:"$mediaList"},0]
      //     }
      //   }}
      // ])
    }
    else {
      posts = await Post.aggregate([
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
    }
    // console.log("totalStatus--- => ",totalStatus)
    watchedStatus = totalStatus.filter(e=>e.watched===true)
    noWatchedStatus = totalStatus.filter(e=>e.watched===false)
    let status = noWatchedStatus.concat(watchedStatus)
    // console.log("status => ",status)
    return res.status(200).json({
      success: true,
      data: { status, posts },
      msg: "ok",
      status: 200,
    });
  } catch (error) {
    return next(error);
  }
});

router.get("/other/:id", async (req, res, next) => {
  try {
    const [user, posts, pets] = await Promise.all([
      User.findById(req.params.id)
        .populate("country", "name")
        .populate("state", "name")
        .populate("city", "name")
        .select("name country state city pet"),

      Post.find({ addedBy: req.params.id })
        .populate("likes", "name")
        .populate("comments", "name")
        .select("photo content description likes comments"),

      Pet.find({ owner: req.params.id, stage: { $eq: 2 } })
        .populate("species", "name")
        .populate("breed", "name")
        .populate("interest", "name")
        .populate("color", "name")
        .select(
          "-geoLocation -paringRequest -pairing -petBlock -friendRequest -updatedAt -__v -owner -isdummy"
        ),
    ]);
    const newPosts = posts.map((post) => {
      const newpost = post._doc;
      const isLike = newpost.likes.find(
        (li) => li._id.toString() === user.pet[0]._id.toString()
      );
      newpost.isLiked = isLike ? true : false;
      return newpost;
    });
    return res.status(200).json({
      success: true,
      data: { user, posts: newPosts, pets },
      msg: "ok",
      status: 200,
    });
  } catch (error) {
    return next(error);
  }
});

router.get("/likeDetails/:id", async (req, res, next) => {
  try {
    // const likes =await Post.aggregate([
    //   {
    //     $match:{
    //       _id:mongoose.Types.ObjectId(req.params.id)
    //     }
    //   },
    //   {
    //     $lookup
    //   }
    // ])
    const posts = await Post.findById(req.params.id)
      .populate("likes.pet", "name photo")
      .select({
        "likes.pet": 1,
      });
    return res.status(200).json({
      success: true,
      data: { posts },
      msg: "ok",
      status: 200,
    });
  } catch (error) {
    return next(error);
  }
});
router.get("/likeDetailsByPet/:id", async (req, res, next) => {
  try {
    const posts=await Post.find({pet:req.params.id}).distinct("likes");
    await Post.populate(posts,{path:"pet",select:"name photo"})
    return res.status(200).json({
      success: true,
      data: { posts },
      msg: "ok",
      status: 200,
    });
  } catch (error) {
    return next(error);
  }
});
// Like a post
// ok-hyf
router.put(
  "/like/:id",
  petRequired,
  // apiLimiter(1000, 2),
  async (req, res, next) => {
    try {
      const post = await Post.findOne({_id:req.params.id});
      if (!post) return next({ status: 404, msg: "Post Not Found" });
      const pet = await Pet.findOne({_id:post.pet})
      // console.log("pet => ",pet)

      const isLike = post.likes.find(
        (friend) => friend.pet.toString() === req.selected_pet._id.toString()
      );
      if (isLike) {
        post.likes.pop({ pet: req.selected_pet._id });
      } else {
        post.likes.push({ pet: req.selected_pet._id });
        if(req.user._id.toString() !== post.owner.toString()){
          firebaseNotificationUser(
            { owner: post.owner, _id: post.pet },
            req,
            `${req.selected_pet.name}, liked ${pet.name}'s post`,
            `${post.description}`,
            post._id,
            "singlePost"
            );
          }
      }
      await post.save();

      return res.status(200).json({
        success: true,
        data: { totallikes: post.likes.length },
        msg: "ok",
        status: 200,
      });
    } catch (error) {
      return next(error);
    }
  }
);

// ok-hyf

// {{devurl}}/api/user/post/comment/601269e56e8acb1f5df8bca6/null
// 601269e56e8acb1f5df8bca6 => postId
// null => parentComment if null then comment store as main comment

// {{devurl}}/api/user/post/comment/601269e56e8acb1f5df8bca6/5ff845d26b36e359194b5285
// 601269e56e8acb1f5df8bca6 => postId
// 5ff845d26b36e359194b5285 => parentCommentId if not null then comment will be store as child comment of this "5ff845d26b36e359194b5285" comment

router.param("postId", idValidator);
// ok-hyf
router.put(
  "/comment/:postId/:parentCommentId",
  petRequired,
  commentValidator,
  async (req, res, next) => {
    try {
      const [post, parentComment] = await Promise.all([
        Post.findById(req.params.postId),
        Comments.findOne({
          _id:
            req.params.parentCommentId === "null"
              ? "5ff845d26b36e359194b5285"
              : req.params.parentCommentId,
          post: req.params.postId,
        }),
      ]);
      if (!post) return next({ status: 404, msg: "Post Not Found" });
      const newcomment = new Comments({
        body: req.body.body,
        author: req.selected_pet._id,
        post: post._id,
        level: "1",
      });
      if (parentComment) {
        newcomment.parentComment = parentComment._id;
        if (parentComment.level === "2") {
          newcomment.parentComment = parentComment.parentComment;
          await Comments.findByIdAndUpdate(parentComment.parentComment, {
            $push: { comments: newcomment._id },
          });
        } else {
          parentComment.comments.push(newcomment._id);
        }
        newcomment.level = "2";
        await parentComment.save();
      }
      await newcomment.save();
      const pet = await Pet.findOne({_id:post.pet})
      if(req.user._id.toString() !== post.owner.toString() )
      firebaseNotificationUser(
        { owner: post.owner, _id: post.pet },
        req,
        `${req.selected_pet.name}, commented on ${pet.name}'s post`,
        `${newcomment.body}`,
        post._id,
        "comment"
      );

      return res.status(200).json({
        success: true,
        data: { msg: "Comment Posted" },
        msg: "ok",
        status: 200,
      });
    } catch (error) {
      return next(error);
    }
  }
);

// ok-hyf
// id=commentId
router.patch("/likeComment/:id", petRequired, async (req, res, next) => {
  try {
    const comment = await Comments.findById({ _id: req.params.id });
    if (!comment) return next({ status: 404, msg: "Not Comment Not Found" });
    const isliked = comment.likes.find(
      (cmt) => cmt.toString() === req.selected_pet._id.toString()
    );
    if (isliked) {
      comment.likes.pop(req.selected_pet._id);
    } else {
      comment.likes.push(req.selected_pet._id);
    }
    await comment.save();
    const pet = await Pet.findOne({_id:comment.author})
    firebaseNotificationUser(
      { owner: comment.owner },
      req,
      `${req.selected_pet.name}, liked ${pet.name}'s comment`,
      `${comment.body}`,
      comment.post,
      "singlePost"
    );

    return res.status(200).json({
      success: true,
      data: { likes: comment.likes.length },
      msg: "ok",
      status: 200,
    });
  } catch (error) {
    return next(error);
  }
});

// ok-hyf
// id= postId
router.get("/comments/:id", async (req, res, next) => {
  try {
    const comments = await Comments.aggregate([
      {
        $match: {
          post: mongoose.Types.ObjectId(req.params.id),
          parentComment: null,
        },
      },
      {
        $lookup: {
          from: "comments",
          let: { comments: "$comments" },
          pipeline: [
            { $match: { $expr: { $in: ["$_id", "$$comments"] }, deleted:false } },

            {
              $lookup: {
                from: "pets",
                let: { author: "$author" },
                pipeline: [
                  { $match: { $expr: { $eq: ["$_id", "$$author"] } } },
                  { $project: { name: 1, photo: 1 } },
                ],
                as: "author",
              },
            },
            { $unwind: { path: "$author", preserveNullAndEmptyArrays: true } },
            {
              $project: {
                createdAt: 1,
                author: 1,
                _id: 1,
                body: 1,
                likes: 1,
                isLiked: {
                  $in: [
                    mongoose.Types.ObjectId(req.selected_pet._id),
                    "$likes",
                  ],
                },
                deleted:1
              },
            },
          ],
          as: "comments",
        },
      },
      {
        $lookup: {
          from: "pets",
          let: { author: "$author" },
          pipeline: [
            { $match: { $expr: { $eq: ["$_id", "$$author"] } } },
            { $project: { name: 1, photo: 1 } },
          ],
          as: "author",
        },
      },
      { $unwind: { path: "$author", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          createdAt: 1,
          author: 1,
          body: 1,
          comments: 1,
          likes: 1,
          post: 1,
          isLiked: {
            $in: [mongoose.Types.ObjectId(req.selected_pet._id), "$likes"],
          },
          deleted:1
        },
      },
    ]);
    return res
      .status(200)
      .json({ success: true, data: { comments }, msg: "ok", status: 200 });
  } catch (error) {
    return next(error);
  }
});

// ok-hyf
router.delete("/comment/:id", async (req, res, next) => {
  try {
    // console.log("req.selected_pet._id => ",req.selected_pet._id)
    const comment = await Comments.findOne({
      _id: req.params.id,
      author: req.selected_pet._id,
    });
    if (!comment) return next({ status: 404, msg: "Comment not found" });
    const reply_comments = await Comments.find({parentComment:comment._id})
    const comment_notifications = await Notification.findOneAndDelete({
      body:comment.body,
      from:req.user._id,
      fromPet:req.selected_pet._id,
    })
    // console.log("comment => ",comment)
    // console.log("reply_comments => ",reply_comments)
    // console.log("comment_notifications => ",comment_notifications)
    reply_comments.length>0?reply_comments.map(e=>e.delete()):""
    await comment.delete();
    return res.status(200).json({
      success: true,
      data: { msg: "Comment deleted" },
      msg: "ok",
      status: 200,
    });
  } catch (error) {
    return next(error);
  }
});

router.put("/comment/:id", async (req, res, next) => {
  try {
    const comment = await Comments.findOne({
      _id: req.params.id,
      author: req.selected_pet._id,
    });
    if (!comment) return next({ status: 404, msg: "Comment not found" });
    if (!req.body.body) return next({ status: 404, msg: "Plz add comment" })
    comment.body = req.body.body
    await comment.save()
    return res.status(200).json({
      success: true,
      data: { comment },
      msg: "ok",
      status: 200,
    });
  } catch (error) {
    return next(error);
  }
});

// ok-hyf
router.put("/share/:id", petRequired, async (req, res, next) => {
  try {
    const post = await Post.findByIdAndUpdate(
      req.params.id,
      { $push: { shares: { pet: req.selected_pet._id } } },
      { new: true }
    );
    if (!post) return next({ status: 404, msg: "Post Not Found" });
    firebaseNotificationUser(
      { owner: post.owner },
      req,
      `${req.selected_pet.name} share your post`,
      `${post.description}`,
      post._id,
      "singlePost"
    );

    return res.status(200).json({
      success: true,
      data: { shares: post.shares.length },
      msg: "ok",
      status: 200,
    });
  } catch (error) {
    return next(error);
  }
});

router.get("/query", async (req, res, next) => {
  try {
    let searchQuery = {
      geoLocation: {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [0.0, 0.0],
          },
          $maxDistance: 10000000,
          // $minDistance: 0
        },
      },
    };
    const { query } = req;
    if (query.lng && query.lat) {
      searchQuery.geoLocation = {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [Number(query.lng), Number(query.lat)],
          },
          $maxDistance: 10000000,
          // $minDistance: 0
        },
      };
    }
    if (query.distance) {
      searchQuery.geoLocation["$near"].$maxDistance = Number(query.distance);
    }
    const posts = await Post.find(searchQuery);
    return res
      .status(200)
      .json({ success: true, data: { posts }, msg: "ok", status: 200 });
  } catch (error) {
    return next(error);
  }
});

// ok-hyf
// id==postId
router.get("/:id", async (req, res, next) => {
  try {
    // console.log("req.params.id => ",req.params.id)
    const posts = await Post.aggregate([
      {
        $match: {
          _id: mongoose.Types.ObjectId(req.params.id),
        },
      },
      {
        $lookup: {
          from: "pets",
          localField: "pet",
          foreignField: "_id",
          as: "pet",
        },
      },
      {
        $unwind: {
          path: "$pet",
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
          from: "comments",
          // localField: "_id",
          // foreignField: "post",
          as: "comments",
          let:{commentID:"$_id"},
            pipeline:[
              {$match:{$expr:{$eq:["$post","$$commentID"]},deleted:false}}
            ]
        },
      },
      {$addFields:{
        likes: {
          $size: "$likes",
        },
        shares: {
          $size: "$shares",
        },
        comments: {
          $size: "$comments",
        },
        Liked: {
          $map: {
            input: "$likes",
            as: "pet",
            in: "$$pet.pet",
          },
        },
      }},
      // {
      //   $project: {
      //     description: 1,
      //     public: 1,
      //     recommend: 1,
      //     content: 1,
      //     createdAt: 1,
      //     pet: {
      //       name: 1,
      //       photo:1,
      //       _id: 1,
      //     },
      //     likes: {
      //       $size: "$likes",
      //     },
      //     shares: {
      //       $size: "$shares",
      //     },
      //     comments: {
      //       $size: "$comments",
      //     },
      //     Liked: {
      //       $map: {
      //         input: "$likes",
      //         as: "pet",
      //         in: "$$pet.pet",
      //       },
      //     },
      //     owner: {
      //       _id: 1,
      //       name: 1,
      //     },
      //     contetList:1,
      //     hidePost:1
      //   }
      // },
      {
        $project: {
          isLiked: {
            $in: [mongoose.Types.ObjectId(req.selected_pet._id), "$Liked"],
          },
          description: 1,
          public: 1,
          recommend: 1,
          content: 1,
          createdAt: 1,
          pet: {
            name: 1,
            photo:1,
            _id: 1,
          },
          owner: {
            _id: 1,
            name: 1,
          },
          likes: 1,
          shares: 1,
          comments: 1,
          contetList:1,
          hidePost:1,
          deleted:1
        },
      },
    ]);
    // console.log("post => ",posts)
    let hidepost = posts[0]?posts[0].hidePost.filter(ob=>String(ob.hideBy)==String(req.selected_pet._id)):[]
    // if (posts.deleted) return next({ status: 404, msg: "Post has been deleted" });
    if (!posts.length) return next({ status: 404, msg: "Post has been deleted" });
    if (hidepost.length>0) return next({ status: 404, msg: "You already report agiants this post" });
    // console.log("p => ",hidepost)
    // console.log("ss => ",req.selected_pet._id)
    return res.status(200).json({
      success: true,
      data: { post: posts[0] },
      msg: "ok",
      status: 200,
    });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
