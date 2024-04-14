const express = require('express');
const router = express.Router();
const Report = require("../../models/reportModel");
const { PostReport,PanicReport } = require("../../models/index")
const { havePermissionOFCrud } = require("../../middlewares/adminAuth");


router.get("/all", async (req, res, next) => {
    try {
        let reportist;
        if (req.query.search) {
            const query = RegExp(req.query.search, "i")
            reportist = await Report.find({ $or: [{ about: query }, { "from.name": query }, { "to.name": query }] })
                .populate("from", "name")
                .populate("to", "name")
                .populate("reason", "name");
        }
        else {
            reportist = await Report.find().select({ password: false })
                .populate("from", "name")
                .populate("to", "name")
                .populate("reason", "name");
        }
        return res.status(200).json({ success: true, data: { reports: reportist }, msg: "ok", status: 200 });
    } catch (error) {
        return next(error);
    }
});
router.put("/solve/:id", havePermissionOFCrud, async (req, res, next) => {
    try {
        const report = await Report.findByIdAndUpdate(req.params.id, { active: false, solvedBy: req.user._id }, { new: true });
        return res.status(200).json({ success: true, data: { msg: "Report marked as solve" }, msg: "ok", status: 200 });
    } catch (error) {
        return next(error);
    }
});

router.get("/post", async (req, res, next) => {
    try {
        let perPage = Number(req.query.perPage || 10)
        let pageNo = Number(req.query.pageNo || 1)
        let query = RegExp(req.query.search, "i")
        let filter = {}
        if(req.query.search){
            filter = { $or: [
                { report: query },
                { "from.name": query },
                { "to.name": query },
                { "fromPet.name": query },
                { "toPet.name": query }
            ] }
        }
        let postReport = await PostReport.aggregate([
            {$lookup:{
                from:"users",
                as:"from",
                let:{userID:"$from"},
                pipeline:[
                    {$match:{
                        $expr:{
                            $eq:["$_id","$$userID"]
                        }
                    }},
                    {$project:{name:1}}
                ]
            }},
            {$lookup:{
                from:"users",
                as:"to",
                let:{userID:"$to"},
                pipeline:[
                    {$match:{
                        $expr:{
                            $eq:["$_id","$$userID"]
                        }
                    }},
                    {$project:{name:1}}
                ]
            }},
            {$lookup:{
                from:"pets",
                as:"toPet",
                let:{petID:"$toPet"},
                pipeline:[
                    {$match:{
                        $expr:{
                            $eq:["$_id","$$petID"]
                        }
                    }},
                    {$project:{name:1}}
                ]
            }},
            {$lookup:{
                from:"pets",
                as:"fromPet",
                let:{petID:"$fromPet"},
                pipeline:[
                    {$match:{
                        $expr:{
                            $eq:["$_id","$$petID"]
                        }
                    }},
                    {$project:{name:1}}
                ]
            }},
            {$unwind:{
                path:"$from",
                preserveNullAndEmptyArrays:true
            }},
            {$unwind:{
                path:"$to",
                preserveNullAndEmptyArrays:true
            }},
            {$unwind:{
                path:"$fromPet",
                preserveNullAndEmptyArrays:true
            }},
            {$unwind:{
                path:"$toPet",
                preserveNullAndEmptyArrays:true
            }},
            {$match:filter},
            {$project:{
                __v:0
            }},
            {$sort:{createdAt:-1}},
            {$skip:(pageNo-1)*perPage},
            {$limit:perPage}
        ])
        let count = await PostReport.countDocuments()
        // let postReport = await PostReport.find()
        // .select({__v:false})
        // .populate("from","name")
        // .populate("to","name")
        // .populate("fromPet","name")
        // .populate("toPet","name")
        return res.status(200).json({ success: true, data: { count,postReport }, msg: "ok", status: 200 });
    } catch (error) {
        return next(error);
    }
});

router.get("/panic", async (req, res, next) => {
    try {
        let perPage = Number(req.query.perPage || 10)
        let pageNo = Number(req.query.pageNo || 1)
        let query = RegExp(req.query.search, "i")
        let filter = {}
        if(req.query.search){
            filter = { $or: [{ report: query }, { "from.name": query }, { "to.name": query }] }
        }
        let panicReport = await PanicReport.aggregate([
            {$lookup:{
                from:"users",
                as:"from",
                let:{userID:"$from"},
                pipeline:[
                    {$match:{
                        $expr:{
                            $eq:["$_id","$$userID"]
                        }
                    }},
                    {$project:{name:1}}
                ]
            }},
            {$lookup:{
                from:"users",
                as:"to",
                let:{userID:"$to"},
                pipeline:[
                    {$match:{
                        $expr:{
                            $eq:["$_id","$$userID"]
                        }
                    }},
                    {$project:{name:1}}
                ]
            }},
            {$lookup:{
                from:"pets",
                as:"toPet",
                let:{petID:"$toPet"},
                pipeline:[
                    {$match:{
                        $expr:{
                            $eq:["$_id","$$petID"]
                        }
                    }},
                    {$project:{name:1}}
                ]
            }},
            {$lookup:{
                from:"pets",
                as:"fromPet",
                let:{petID:"$fromPet"},
                pipeline:[
                    {$match:{
                        $expr:{
                            $eq:["$_id","$$petID"]
                        }
                    }},
                    {$project:{name:1}}
                ]
            }},
            {$unwind:{
                path:"$from",
                preserveNullAndEmptyArrays:true
            }},
            {$unwind:{
                path:"$to",
                preserveNullAndEmptyArrays:true
            }},
            {$unwind:{
                path:"$fromPet",
                preserveNullAndEmptyArrays:true
            }},
            {$unwind:{
                path:"$toPet",
                preserveNullAndEmptyArrays:true
            }},
            {$match:filter},
            {$project:{
                __v:0
            }},
            {$sort:{createdAt:-1}},
            {$skip:(pageNo-1)*perPage},
            {$limit:perPage}
        ])
        let count = await PanicReport.countDocuments()
        return res.status(200).json({ success: true, data: { count,panicReport }, msg: "ok", status: 200 });
    } catch (error) {
        return next(error);
    }
});

router.delete("/rejectpostreport/:id", async (req, res, next) => {
    try {
        let rejectPostReport = await PostReport.findOne({postID:req.params.id})
        if (!rejectPostReport) return next({ status: 404, msg: "Report of this Post is not found" });
        await rejectPostReport.delete()
        return res.status(200).json({ success: true, data: {}, msg: "Post Report Rejected.", status: 200 });
    } catch (error) {
        return next(error);
    }
});

router.delete("/rejectpanicreport/:id", async (req, res, next) => {
    try {
        let rejectPanicReport = await PanicReport.findOne({panicID:req.params.id})
        if (!rejectPanicReport) return next({ status: 404, msg: "Report of this Panic is not found" });
        await rejectPanicReport.delete()
        return res.status(200).json({ success: true, data: {}, msg: "Panic Report Rejected.", status: 200 });
    } catch (error) {
        return next(error);
    }
});

module.exports = router;