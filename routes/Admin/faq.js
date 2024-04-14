const router = require("express").Router();
const { validationResult } = require("express-validator");
const { faqValidator } = require("../../validator");
const { isFaqAdder } = require("../../middlewares/adminAuth")
const { Faq } = require("../../models");
const { idValidator } = require("../../middlewares");
const { filter } = require("lodash");
router.param("id", idValidator)
router.post("/add", faqValidator, async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return next({ status: 400, error: errors.mapped(), msg: "Validation Failed" });
        }
        const faq = new Faq(req.body);
        faq.createdBy = req.user._id;
        await faq.save();
        return res.status(200).json({ success: true, data: { faq }, msg: "ok", status: 200 });
    } catch (error) {
        return next(error);
    }
});

router.put("/update/:id", async (req, res, next) => {
    try {
        const faq = await Faq.findByIdAndUpdate(req.params.id, { ...req.body }, { new: true });
        if (!faq) return next({ status: 404, msg: "Faq not found" });
        return res.status(200).json({ success: true, data: { faq }, msg: "ok", status: 200 });
    } catch (error) {
        return next(error)
    }
})

router.get("/all", async (req, res, next) => {
    try {
        let perPage=Number(req.query.perPage||10)
        let pageNo=Number(req.query.pageNo||1)
        let sortBy=req.query.sortBy||"createdAt:-1"
        let sort=sortBy.split(":")
        let by,order
        by=sort[0]
        if(sort[1]==="-1")order=-1
        else order=1
        let filter={}
        if(req.query.searchBy){
            let search=req.query.searchBy.split(":")
            if(search[0]==="createdBy")search[0]="createdBy.username"
            filter={[search[0]]:RegExp(search[1],"i")}
        }
        // const faqs = await Faq.find(filter).populate("createdBy", "username")
        const counts = await Faq.aggregate([
            {$lookup:{
                from:"admins",as:"createdBy",
                let:{createdByID:"$createdBy"},
                pipeline:[
                    {$match:{$expr:{$eq:["$_id","$$createdByID"]}}},
                    {$project:{username:1}}
                ]
            }},
            {$unwind:{path:"$createdBy",preserveNullAndEmptyArrays:true}},
            {$match:filter},
            {$count:"count"}
        ])
        const faqs = await Faq.aggregate([
            {$lookup:{
                from:"admins",as:"createdBy",
                let:{createdByID:"$createdBy"},
                pipeline:[
                    {$match:{$expr:{$eq:["$_id","$$createdByID"]}}},
                    {$project:{username:1}}
                ]
            }},
            {$unwind:{path:"$createdBy",preserveNullAndEmptyArrays:true}},
            {$match:filter},
            {$skip:pageNo<=1?0:(pageNo*perPage)-perPage},
            {$limit:perPage},
            {$sort:{[by]:order}}
        ])
        let count
        if(counts.length>0)count=counts[0].count
        else count=0
        return res.status(200).json({ success: true, data: { count,faqs }, msg: "ok", status: 200 });
    } catch (error) {
        return next(error);
    }
});

// not used
// router.get("/all/deactive", async (req, res, next) => {
//     try {
//         const faqs = await Faq.find({ active: false }).populate("createdBy", "username");
//         return res.status(200).json({ success: true, data: { faqs }, msg: "ok", status: 200 });
//     } catch (error) {
//         return next(error);
//     }
// });
// not used
router.put("/active/:id", async (req, res, next) => {
    try {
        const faq = await Faq.findByIdAndUpdate(req.params.id, { active: true }, { new: true });
        if (!faq) return next({ status: 404, msg: "faq not found" });
        return res.status(200).json({ success: true, data: { faq }, msg: "ok", status: 200 });
    } catch (error) {
        return next(error);
    }
})

// not used
router.put("/deactive/:id", async (req, res, next) => {
    try {
        const faq = await Faq.findByIdAndUpdate(req.params.id, { active: false }, { new: true });
        if (!faq) return next({ status: 404, msg: "faq not found" });
        return res.status(200).json({ success: true, data: { faq }, msg: "ok", status: 200 });
    } catch (error) {
        return next(error);
    }
})

router.delete("/:id", isFaqAdder, async (req, res, next) => {
    try {
        const faq = await Faq.findById(req.params.id);
        if (!faq) return next({ status: 404, msg: "faq not found" });
        await faq.delete(req.user._id);
        return res.status(200).json({ success: true, data: { msg: "Faq Deleted" }, msg: "ok", status: 200 });
    } catch (error) {
        return next(error);
    }
});


module.exports = router;