const { UserPageModel,User } = require("../../models");
const router = require("express").Router();
const { upload } = require("../../s3")
const Upload = upload('app/userpage')
const mongoose=require('mongoose')
router.post("/",Upload.fields([
  {name: 'coverPhoto',maxCount: 1},
  {name: 'photo',maxCount: 1}
]),async (req,res,next)=>{
  try {
        let userPage
      const user = await User.findById({_id:req.user._id})
      if (!user) return next({ status: 404, msg: "User Not Found" })
      const { files } = req
      const { title,about,website,category,contactNo } = req.body
      if(!files||!files.photo||!title||!about)
        next({ status: 400, msg: "photo, title and about field is required." })
      else{
        let data={
            title,
            coverPhoto:files.coverPhoto?files.coverPhoto[0].location:'',
            photo:files.photo[0].location,
            about,
            website:website?website:'',
            category:category?category:'',
            contactNo:contactNo?contactNo:'',
            userPage:user._id
        }
        // console.log("data => ",data)
        userPage = new UserPageModel(data)
        await userPage.save()
        return res
        .status(200)
        .json({ success: true, data: { userPage }, msg: "ok", status: 200 });
    }
  } catch (error) {
    return next(error);
  }
})

router.get("/",async (req,res,next)=>{
  try {
    let liked=false
    
      const userPage = await UserPageModel.find({userPage:req.user._id})
      .select('-__v -updatedAt')
      userPage.map((data)=>{
        if(data.likedBy.includes(mongoose.Types.ObjectId(req.user._id))){
          liked=true
        }
        else{
          liked=false
        }
      })
      return res
      .status(200)
      .json({ success: true, data: { userPage,liked }, msg: "ok", status: 200 });
  } catch (error) {
    return next(error);
  }
})
 
router.put('/like/:id',async(req,res,next)=>{
  console.log("this function runs")
  console.log(mongoose.Types.ObjectId(req.user._id),"req.user")
try {
let liked=false
const pages=await UserPageModel.findById({_id:req.params.id})
if(pages.likedBy.includes(mongoose.Types.ObjectId(req.user._id))){
  
  res.status(400).json({status:false,msg:"Already Liked",status:200})
}else{
  const userpage = await UserPageModel.findOneAndUpdate(
    { _id: req.params.id },
    { $addToSet: { likedBy: req.user._id } },
    { new: true }
  );
if(!userpage){
  res.status(404).json({success:false,msg:"user page not Found",status:400})
}
liked=true
res.status(200).json({success:false,liked,status:200})
}
} catch (error) {
  
}
})
module.exports = router;
