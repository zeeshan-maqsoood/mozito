const { Pet,PetReport,User } = require("../../models");
const router = require("express").Router();

router.post("/:id",async (req,res,next)=>{
  try {
      const to_pet = await Pet.findById({_id:req.params.id})
      if (!to_pet) return next({ status: 404, msg: "Pet Not Found" });
    //   const user = await User.findById({_id:to_pet.owner})
    //   if (!user) return next({ status: 404, msg: "User pet not found" });
      let data={
          from:req.user._id,
          to:to_pet.owner,
          fromPet:req.selected_pet._id,
          toPet:to_pet._id,
          report:req.body.report
      }
      const petReport = new PetReport(data)
      await petReport.save()
    return res
    .status(200)
    .json({ success: true, data: { petReport }, msg: "ok", status: 200 });
  } catch (error) {
    return next(error);
  }
})

module.exports = router;
