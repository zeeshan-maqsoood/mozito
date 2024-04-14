const { Panic,PanicReport,User } = require("../../models");
const router = require("express").Router();

router.post("/:id",async (req,res,next)=>{
  try {
      const to_panic = await Panic.findById({_id:req.params.id})
      if (!to_panic) return next({ status: 404, msg: "Panic Not Found" });
      const user = await User.findById({_id:to_panic.createdBy})
      if (!user) return next({ status: 404, msg: "User createPanic not found" });
      // console.log("panic => ",to_panic)
      let data={
          from:req.user._id,
          to:to_panic.createdBy,
          fromPet:req.selected_pet._id,
          toPet:user.selected_pet,
          report:req.body.report,
          panicID:req.params.id
      }
      const panicReport = new PanicReport(data)
      await panicReport.save()
      to_panic.hidePanic.push({
        hideBy:req.user._id,
        hide:true
      })
      await to_panic.save()
    return res
    .status(200)
    .json({ success: true, data: { panicReport }, msg: "ok", status: 200 });
  } catch (error) {
    return next(error);
  }
})

module.exports = router;
