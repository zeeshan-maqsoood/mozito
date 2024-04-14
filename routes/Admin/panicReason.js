const express = require("express");
const router = express.Router();
const { validationResult } = require("express-validator");
const { Panic_Reason } = require("../../models");
const { havePermissionOFCrud } = require("../../middlewares/adminAuth");
const { idValidator } = require("../../middlewares");
const { reasonValidator } = require("../../validator/adminValidation");

router.param("id", idValidator);
router.post(
  "/add",
  havePermissionOFCrud,
  reasonValidator,
  async (req, res, next) => {
    try {
      const checkExists = await Panic_Reason.findOne({ text: req.body.text });
      if (checkExists) {
        return next({ status: 409, msg: "interest already exist" });
      }
      const reason = new Panic_Reason(req.body);
      reason.addedBy = req.user._id;
      await reason.save();
      return res
        .status(200)
        .json({ success: true, data: { reason }, msg: "ok", status: 200 });
    } catch (error) {
      return next(error);
    }
  }
);

router.get("/all", async (req, res, next) => {
  try {
      const query = RegExp(req.query.search || "", "i");
      reasons = await Panic_Reason.find({text:query});
    return res
      .status(200)
      .json({ success: true, data: { reasons }, msg: "ok", status: 200 });
  } catch (error) {
    next(error);
  }
});

router
  .route("/:id")
  .delete(async (req, res, next) => {
    try {
      const reason = await Panic_Reason.findById(req.params.id);
      if (!reason) {
          return next({status:404,msg:"Reason Not Found"})
    }
    await reason.delete(req.user._id);
    return res.status(200).json({
      success: true,
      data: { msg: "Reason Deleted" },
      msg: "ok",
      status: 200,
    });
    } catch (error) {
      return next(error);
    }
  })
  .put( async (req, res, next) => {
    try {
      let interest = await Panic_Reason.findByIdAndUpdate(
        req.params.id,
        { ...req.body },
        { new: true }
      );
      if (!interest) {
        return next({ status: 404, msg: "interest not found" });
      } else {
        return res
          .status(200)
          .json({ success: true, data: { interest }, msg: "ok", status: 200 });
      }
    } catch (error) {
      return next(error);
    }
  });
module.exports = router;
