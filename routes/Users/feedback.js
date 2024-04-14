const router = require("express").Router();
const { requireSigninUser } = require("../../middlewares/userAuth");
const { Feedback } = require("../../models");
const { feedBackValidator } = require("../../validator/appValidation");
router.post("/", requireSigninUser, feedBackValidator, async (req, res, next) => {
    try {
        const { title, body } = req.body;
        const feedback = new Feedback({
            title, body, user: req.user._id
        });
        await feedback.save();
        return res.status(200).json({ success: true, data: { feedback }, msg: "ok", status: 200 });
    } catch (error) {
        return next(error);
    }
})

module.exports = router;