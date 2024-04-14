const router = require("express").Router();
const { validationResult } = require("express-validator");
const { isAdmin } = require("../../middlewares/adminAuth");

const { roleValidator } = require("../../validator")
const { Role } = require("../../models");

router.get("/all", async (req, res, next) => {
    try {
        const perPage = Number(req.query.perPage||10)
        const pageNo = Number(req.query.pageNo||1)
        let roles,count
        let filter={}
        let searchValue,value
        let sortBy = req.query.sortBy || "name:1"
        let sort = sortBy.split(":")
        let by,order
        by=sort[0]
        if(sort[1]==="-1")order=-1
        else order=1
        if(req.query.searchBy){
            let search = req.query.searchBy.split(":")
            searchValue=search[0]
            if(search[0]==="createdBy")searchValue="createdBy.username"
            value=RegExp(search[1],"i")
            filter={[searchValue]:value}
        }
        count = await Role.countDocuments(filter)
        .populate("createdBy", "username")
        .select({ __v: false })
        roles = await Role.find(filter)
        .populate("createdBy", "username")
        .select({ __v: false })
        .skip(pageNo<=1?0:(pageNo*perPage)-perPage)
        .limit(perPage)
        .sort({[by]:order})
        // if (req.query.search) {
        //     const query = RegExp(req.query.search, "i");
        //     roles = await Role.find({ name: query })
        //         .populate("createdBy", "username")
        //         .select({ __v: false })
        // } else {
        //     roles = await Role.find({})
        //         .populate("createdBy", "username")
        //         .select({ __v: false })
        //         .skip(pageNo<=1?0:(pageNo*perPage)-perPage)
        //         .limit(perPage)
        // }
        return res.status(200).json({ success: true, data: { roles,count }, msg: "ok", status: 200 });
    } catch (error) {
        return next(error);
    }
});
router.post("/create", roleValidator, isAdmin, async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return next({ status: 400, error: errors.mapped(), msg: "Validation Failed" })
        }
        const isExist = await Role.findOne({ name: req.body.name });
        if (isExist) return next({ status: 409, msg: "role name already exists" });
        const role = new Role(req.body);
        role.createdBy = req.user._id;
        await role.save();
        return res.status(200).json({ success: true, data: { role }, msg: "ok", status: 200 });
    } catch (error) {
        return next(error);
    }
});

router.put("/active/:id", isAdmin, async (req, res, next) => {
    try {
        const role = await Role.findByIdAndUpdate(req.params.id, { isActive: true }, { new: true });
        if (!role) return next({ status: 404, msg: "role not found" });
        return res.status(200).json(role);
    } catch (error) {
        return next(error);
    }
});
router.put("/deactive/:id", isAdmin, async (req, res, next) => {
    try {
        const role = await Role.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
        if (!role) return next({ status: 404, msg: "role not found" });
        return res.status(200).json(role);
    } catch (error) {
        return next(error);
    }
});
router.route("/:id")
    .get(async (req, res, next) => {
        try {
            const role = await Role.findById(req.params.id).populate("createdBy", "username");
            if (!role) return next({ status: 404, msg: "role not found" });
            return res.status(200).json(role);
        } catch (error) {
            return next(error);
        }
    })
    .put(isAdmin, async (req, res, next) => {
        try {
            const isExist = await Role.findOne({ name: req.body.name });
            // if(isExist) return next({status:409,msg: "role name already exists"});
            const role = await Role.findByIdAndUpdate(
                req.params.id,
                req.body,
                { new: true }
            )
            return res.status(200).json(role);
        } catch (error) {
            return next(error);
        }
    })
    .delete(isAdmin, async (req, res, next) => {
        try {
            await Role.findByIdAndDelete(req.params.id);
            return res.status(200).json({ msg: "Role deleted" })
        } catch (error) {
            return next(error);
        }
    });


module.exports = router;