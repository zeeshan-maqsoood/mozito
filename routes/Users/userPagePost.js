const mongoose = require('mongoose');
const { UserPagePost, UserPageModel, User } = require('../../models');
const router = require('express').Router();
const { upload } = require('../../s3');
const userPagePost = require('../../models/userPagePost');
const Upload = upload('app/userpagepost');

router.post(
  '/:id',
  Upload.fields([
    { name: 'mediaList', maxCount: 4 },
    { name: 'thumbnail', maxCount: 4 },
  ]),
  async (req, res, next) => {
    try {
      let userPagePost;
      let userPageID = mongoose.Types.ObjectId(req.params.id);
      //   const userpage = await UserPageModel.findOne({userPage:req.user._id})
      //   if (!userpage) return next({ status: 404, msg: "Your page is Not Found" })
      const { files } = req;
      const { description, isVideo } = req.body;
      let mediaList = files.mediaList.map((e, i) => {
        const thumbnail =
          isVideo === 'true' ? files.thumbnail.map((e) => e.location) : '';
        return {
          url: e.location,
          isVideo: isVideo === 'true' ? true : false,
          thumbnail_image: thumbnail[i] || thumbnail,
        };
      });
      // let mediaList = files.mediaList?.map((e,i)=>{
      //   const thumbnail = isVideo==='true'?files.thumbnail.map(e=>e.location):''
      //   return {
      //     url:e.location,
      //     isVideo:isVideo==='true'?true:false,
      //     thumbnail_image:thumbnail[i]||thumbnail
      //   }
      // })
      // console.log("req.files => ",files)
      if (!description)
        next({ status: 400, msg: 'description field is required' });
      else {
        let data = {
          description,
          mediaList,
          userPagePosts: userPageID,
        };
        // console.log("data => ",data)
        userPagePost = new UserPagePost(data);
        await userPagePost.save();
        return res.status(200).json({
          success: true,
          data: { userPagePost },
          msg: 'ok',
          status: 200,
        });
      }
    } catch (error) {
      return next(error);
    }
  }
);

router.put(
  '/:id',
  Upload.fields([
    { name: 'mediaList', maxCount: 4 },
    { name: 'thumbnail', maxCount: 4 },
  ]),
  async (req, res, next) => {
    try {
      const userPagePost = await UserPagePost.findById({ _id: req.params.id });
      if (!userPagePost) next({ status: 400, msg: 'Post not found' });
      const { files } = req;
      const { description, isVideo, removeID } = req.body;
      let posts;
      if (removeID) {
        let removeid = removeID.split(',');
        // console.log('removeid => ',removeid)
        userPagePost.mediaList = userPagePost.mediaList.filter((el) =>
          removeid.every((e) => e.toString() !== el._id.toString())
        );
      }
      // console.log("userPagePost => ",userPagePost.mediaList)
      if (description) userPagePost.description = description;
      if (files && isVideo) {
        posts = files.mediaList.map((e) => {
          const thumbnail =
            isVideo === 'true' ? files.thumbnail.map((e) => e.location) : '';
          return {
            url: e.location,
            isVideo: isVideo === 'true' ? true : false,
            thumbnail_image: thumbnail[0] || thumbnail,
          };
        });
        for (const e of posts) {
          userPagePost.mediaList.push(e);
        }
      }
      await userPagePost.save();
      return res.status(200).json({
        success: true,
        data: { userPagePost },
        msg: 'ok',
        status: 200,
      });
    } catch (error) {
      return next(error);
    }
  }
);

router.put('/like/:id', async (req, res, next) => {
  console.log(req.body, 'body');
  try {
    const userPagePost = await UserPagePost.findOne({ _id: req.params.id });
    console.log(userPagePost, 'pagepost');
    if (!userPagePost) return next({ status: 404, msg: 'Post Not Found' });
    const userPage = await UserPageModel.findOne({
      _id: userPagePost.userPagePosts,
    });
    if (!userPage) return next({ status: 404, msg: 'User Page Not Found' });
    const isLike = userPagePost.likes
      ? userPagePost.likes.find(
          (friend) => friend.user.toString() === req.user._id.toString()
        )
      : false;
    isLike
      ? userPagePost.likes.pop({ user: req.user._id })
      : userPagePost.likes.push({ user: req.user._id });

    await userPagePost.save();

    return res.status(200).json({
      success: true,
      data: { totallikes: userPagePost.likes.length },
      msg: 'ok',
      status: 200,
    });
  } catch (error) {
    return next(error);
  }
});

// router.put('/comments/:id', async (req, res, next) => {
//   console.log(req.body, 'body');
//   try {
//     const userPagePost = await UserPagePost.findOne({ _id: req.params.id });
//     console.log(userPagePost, 'pagepost');
//     if (!userPagePost) return next({ status: 404, msg: 'Post Not Found' });
//     const userPage = await UserPageModel.findOne({
//       _id: userPagePost.userPagePosts,
//     });
//     if (!userPage) return next({ status: 404, msg: 'User Page Not Found' });
//     // const comment = userPagePost.comments
//     //   ? userPagePost.comments.find(
//     //       (friend) => friend.user.toString() === req.user._id.toString()
//     //     )
//     //   : false;

//        userPagePost.comments.push({ user: req.user._id,message:req.body.message })
//       //  userPagePost.comments.push({ user: req.user._id });
//     await userPagePost.save();

//     return res.status(200).json({
//       success: true,
//       data: { comments: userPagePost.comments },
//       msg: 'ok',
//       status: 200,
//     });
//   } catch (error) {
//     return next(error);
//   }
// });
router.put('/comments/:id', async (req, res, next) => {
  try {
    const userPagePostId = await userPagePost.findById({ _id: req.params.id });
    if (!userPagePostId) {
      res.status(400).send({
        success: false,
        msg: 'Not Post Found',
        status: 400,
      });
    } else {
    
      const parentComment = userPagePostId.parentComment;
   const userPageId=userPagePostId.userPagePosts
const userId=await UserPageModel.findById(userPageId).populate("userPage").exec()
// console.log(userId,"userId")
        parentComment.push({ body: req.body.message, pageId: mongoose.Types.ObjectId(userPageId)});
        
    
      await userPagePostId.save()
      res.status(200).send({
        success: true,
        data: { userPagePostId },
        msg: 'Ok',
        status: 200,
      });
    }
  } catch (error) {}
  //  try {
  //   const userPagePostcomment=await UserPagePost.findById({_id:req.params.id}).select("userPagePosts description").exec()
  // //  console.log(userPagePostcomment,"comment")
  //   if (!userPagePostcomment) {
  //     res.status(400).send({
  //       success:false,
  //       message:"No Comment Found",

  //     })
  //   }if (userPagePostcomment) {
  //     const userPage=await UserPageModel.findById({_id:userPagePostcomment.userPagePosts})
  //     // console.log(userPage)
  //     res.status(200).send({
  //       success:true,
  //       data:{userPage,userPagePostcomment},
  //       status:200
  //     })
  //   }

  //  } catch (error) {

  //  }
});
// router.get('/comments/:id', async (req, res, next) => {

//   try {
//     const userPagePost = await UserPagePost.findOne({ _id: req.params.id });

//     if (!userPagePost) return next({ status: 404, msg: 'Post Not Found' });
//     const userPage = await UserPageModel.findOne({
//       _id: userPagePost.userPagePosts,
//     });
//     if (!userPage) return next({ status: 404, msg: 'User Page Not Found' });
//     // const comment = userPagePost.comments
//     //   ? userPagePost.comments.find(
//     //       (friend) => friend.user.toString() === req.user._id.toString()
//     //     )
//     //   : false;

//     //  userPagePost.comments.push({ user: req.user._id });
//     // await userPagePost.save();

//     return res.status(200).json({
//       success: true,
//       data: { comments: userPagePost.comments },
//       msg: 'ok',
//       status: 200,
//     });
//   } catch (error) {
//     return next(error);
//   }
// });
router.delete('/:id', async (req, res, next) => {
  try {
    const userPagePost = await UserPagePost.findById({ _id: req.params.id });
    if (!userPagePost) next({ status: 400, msg: 'Post not found' });
    else {
      await userPagePost.delete();
      return res.status(200).json({
        success: true,
        data: { userPagePost },
        msg: 'post deleted',
        status: 200,
      });
    }
  } catch (error) {
    return next(error);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const userPagePost = await UserPagePost.aggregate([
      { $match: { userPagePosts: mongoose.Types.ObjectId(req.params.id) } },
      {
        $lookup: {
          from: 'userpages',
          let: { userPagePostsId: '$userPagePosts' },
          pipeline: [
            { $match: { $expr: { $eq: ['$_id', '$$userPagePostsId'] } } },
            { $project: { _id: 1, name: 1 } },
          ],
          as: 'userPage',
        },
      },
      {
        $unwind: '$userPage',
      },
      {
        $addFields: {
          likes: {
            $size: { $ifNull: ['$likes', []] },
          },
        },
      },
      {
        $project: {
          updatedAt: false,
          __v: false,
        },
      },
    ]);

    const modifiedUserPagePost = userPagePost.map((post) => {
      console.log(post.likes);
      return {
        ...post,
        isLiked:
          JSON.stringify(post.userPage._id) ===
            JSON.stringify(post.userPagePosts) && post.likes > 0
            ? true
            : false,
      };
    });

    return res.status(200).json({
      success: true,
      data: { userPagePost: modifiedUserPagePost },
      msg: 'ok',
      status: 200,
    });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
