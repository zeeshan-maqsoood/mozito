const router = require("express").Router();
const { requireSigninUser } = require("../../middlewares/userAuth");
const { User, Report } = require("../../models");
const { idValidator } = require("../../middlewares");
const { reportValidator } = require("../../validator/appValidation");


// router.post("/report", requireSigninUser, reportValidator, async (req, res, next) => {
//     try {
//         const report = new Report(req.body);
//         report.from = req.user._id;

//         await report.save();
//         return res.status(200).json({ success: true, data: { msg: "report generated" }, msg: "ok", status: 200 });
//     } catch (error) {
//         return next(error);
//     }
// });

router.get("/blockedusers", requireSigninUser, async (req, res, next) => {
    try {
        const blockedusers = await User.findById(req.user._id).select("userBlock").populate("userBlock", "name");
        return res.status(200).json({ success: true, data: { blockedusers }, msg: "ok", status: 200 });
    } catch (error) {
        return next(error);
    }
})
router.put("/report/:id", requireSigninUser, reportValidator, async (req, res, next) => {
    try {
        const { to, reason, about } = req.body;
        about.chat = req.params.id;
        const report = new Report({ ...req.body, from: req.user._id, to, about });
        await report.save();
        return res.status(200).json({ success: true, data: { report }, msg: "ok", status: 200 });
    } catch (error) {
        return next(error);
    }
});
router.put("/block/:id", requireSigninUser, async (req, res, next) => {
    try {
        const user = await User.findById(req.user._id);
        if (req.params.id.toString() === req.user._id.toString()) {
            return next({ status: 400, msg: "you cannot blog yourself" });
        }
        if (!user) return next({ status: 404, msg: "User not Found" });
        const isBlocked = user.userBlock.find(u => u.toString() === req.params.id.toString())
        if (isBlocked) {
            return next({ status: 409, msg: "you already blocked this user" })
        }
        user.userBlock.push(req.params.id);
        await user.save();

        user.password = undefined;
        return res.status(200).json({ success: true, data: { user }, msg: "ok", status: 200 });

    } catch (error) {
        return next(error);
    }
});
router.put("/unblock/:id", requireSigninUser, async (req, res, next) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user) return next({ status: 404, msg: "User not found" });
        user.userBlock.pop(req.params.id);
        await user.save();
        return res.status(200).json({ success: true, data: { user }, msg: "ok", status: 200 });
    } catch (error) {
        return next(error);
    }
});


module.exports = router;
