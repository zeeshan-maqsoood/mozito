const { PostReport,Post } = require("../../models");
const router = require("express").Router();
// const mongoose = require("mongoose")

router.post("/:id",async (req,res,next)=>{
  try {
      // console.log("req.user._id => ",req.user._id)
      // console.log("req.selected_pet._id => ",req.selected_pet._id)
      const alreadyReport = await PostReport.findOne({postID:req.params.id,fromPet:req.selected_pet._id})
      if (alreadyReport) return next({ status: 404, msg: "You already report against this Post." });
      const to_post = await Post.findById({_id:req.params.id})
      if (!to_post) return next({ status: 404, msg: "Post Not Found" });
      // const from_post = await Post.findOne({owner:req.user._id})
      // console.log("post => ",to_post)
      // console.log("post => ",from_post)
      let data={
          from:req.user._id,
          to:to_post.owner,
          fromPet:req.selected_pet._id,
          toPet:to_post.pet,
          report:req.body.report,
          postID:req.params.id
      }
      const postReport = new PostReport(data)
      await postReport.save()
      to_post.hidePost.push({
        hideBy:req.selected_pet._id,
        hide:true
      })
      await to_post.save()
    return res
    .status(200)
    .json({ success: true, data: { postReport }, msg: "ok", status: 200 });
  } catch (error) {
    return next(error);
  }
})

module.exports = router;
