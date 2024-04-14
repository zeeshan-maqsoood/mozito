const _ = require("lodash");
const { validationResult } = require("express-validator");

const express = require('express');
const router = express.Router();
const Reason = require("../../models/reportReasonModel");
const Report = require("../../models/reportModel");
const { NameValidator } = require("../../validator");
const { havePermissionOFCrud } = require("../../middlewares/adminAuth");
const log4js = require("log4js");
const logger = log4js.getLogger("reason.js");
logger.level = "all"
router.post("/create",
    NameValidator, havePermissionOFCrud,
    async (req, res, next) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return next({ status: 400, error: errors.mapped(), msg: "Validation Failed" })
            }
            const checkExists = await Reason.findOne({ name: req.body.name });
            if (checkExists) {
                return next({ status: 409, msg: "Reason already exist" })
            }
            else {
                const reason = new Reason(req.body);
                reason.createdBy = req.user._id
                await reason.save();
                return res.status(200).json({ success: true, data: { reason }, msg: "ok", status: 200 });
            }
        }
        catch (error) {
            return next(error);
        }
    });

router.get("/all", async (req, res, next) => {
    try {
        let reasonList;
        if (req.query.name) {
            const query = RegExp(req.query.name, "i");
            reasonList = await Reason.find({ name: query }).populate("createdBy", "username");
        }
        else {
            reasonList = await Reason.find({}).populate("createdBy", "username")
        }
        const reportbyReson = await Report.find({}).select({ reason: true });
        let newlist = reasonList.map(reason => {
            const total = reportbyReson.filter(li => {
                return li.reason.toString() === reason._id.toString();
            })
            return {
                _id: reason._id,
                total: total.length,
                name: reason.name,
                createdBy: reason.createdBy
            }
        });
        return res.status(200).json({ success: true, data: { reasons: newlist }, msg: "ok", status: 200 });
    } catch (error) {
        return next(error);
    }
});


router.route("/:id")
    .get(async (req, res, next) => {
        try {
            const reason = await Reason.findById(req.params.id);
            const blogscount = await Report.find({ reason: req.params.id }).countDocuments();

            if (!reason) {
                return next({ status: 404, msg: "reason not found" })
            }
            else {
                reason.totalReports = blogscount || 0;
                return res.status(200).json({ success: true, data: { reason }, msg: "ok", status: 200 });
            }
        } catch (error) {
            return next(error);
        }
    })
    .delete(havePermissionOFCrud, async (req, res, next) => {
        try {
            const reason = await Reason.findById(req.params.id);
            if (reason) {
                await Report.updateMany({}, { $pull: { reason: req.params.id } });
                await reason.remove();
                return res.status(200).json({ success: true, data: { msg: "Reason not Exists" }, msg: "ok", status: 200 });
            }
            else {
                return next({ status: 404, msg: "reason not exists" })
            }
        } catch (error) {
            return next(error)
        }
    })
    .put(NameValidator, havePermissionOFCrud, async (req, res, next) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return next({ status: 400, error: errors.mapped(), msg: "Validation Failed" })
            }
            const checkExists = await Reason.findOne({ name: req.body.name });
            if (checkExists) {
                return next({ status: 409, msg: "Reason already exist" })
            }

            let reason = await Reason.findByIdAndUpdate(
                req.params.id,
                { "name": req.body.name },
                { new: true }
            );
            if (!reason) {
                return next({ status: 404, msg: "reason not found" })
            } else {
                return res.status(200).json({ success: true, data: { reason }, msg: "ok", status: 200 });
            }
        } catch (error) {
            return next(error)
        }
    });



module.exports = router;