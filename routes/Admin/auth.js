const router = require("express").Router();
const nodemailer = require("nodemailer");
const { Admin, Role } = require("../../models");
const { body, validationResult } = require('express-validator');
const { adminValidator, adminValidatorSingin } = require("../../validator");
const { isSuperAdmin, requireSignin } = require("../../middlewares/adminAuth");
const jwt = require("jsonwebtoken");


const log4js = require("log4js");
const logger = log4js.getLogger("Admin.js");

router.get("/logedin", requireSignin, async (req, res, next) => {
    try {
        return res.status(200).json({ success: true, data: { user: req.user }, msg: "ok", status: 200 });
    } catch (error) {
        return next(error);
    }
})
router.get("/:id", requireSignin, async (req, res, next) => {
    try {
        const admin = await Admin.findById({_id:req.params.id})
        .populate("role","name features")
        .populate("addedBy","username")
        .select("-password -__v")
        if(!admin) return next({ status:404, msg:"Admin not found" })
        return res.status(200).json({ success: true, data: { admin }, msg: "ok", status: 200 });
    } catch (error) {
        return next(error)
    }
});
router.post("/super_admin", adminValidator, async (req, res, next) => {
    try {
        const ad = await Admin.findOne({ ad: true });
        if (ad) {
            return next({ status: 401, msg: "unauthorized to perform this action" })
        }
        let user;
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return next({ status: 400, errors: errors.mapped(), msg: "Validation Failed" })
        }
        user = await Admin.findOne({ email: req.body.email });
        if (user) {
            return next({ status: 409, msg: "email already in use" })
        }
        else {
            user = new Admin(req.body);
            user.ad = true;
            const roles = await Role.find();
            let newrole;
            if (roles.length && req.body.role === "super-admin") {
                newrole = new Role({ name: "super-admin", createdBy: user._id, features: [{ title: "all", path: "/all" }] })
                user.role = newrole._id;

                await newrole.save();
            }
            else {
                return next({ status: 400, msg: "not allowed" })
            }
            user.password = await user.genrateHash(user.password);
            await user.save();
            const token = jwt.sign({ _id: user._id, role: user.role }, process.env.JWT_SECRET_ADMIN);
            return res.status(200).json({ success: true, data: { user, token }, msg: "ok", status: 200 });
        }
    } catch (error) {
        return next(error);

    }
});

router.post("/signup",
    requireSignin,
    isSuperAdmin,
    adminValidator,
    async (req, res, next) => {
        try {
            let user;
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return next({ status: 400, errors: errors.mapped(), msg: "Validation Failed" })
            }
            user = await Admin.findOne({ email: req.body.email });
            if (user) {
                return next({ status: 409, msg: "email already in use please use another email" })
            }
            else if (req.body.password.length<6) {
                return next({ status: 409, msg: "Password should be of minimum 6 characters" })
            }
            else {
                user = new Admin(req.body);
                user.addedBy = req.user._id
                const transporter = nodemailer.createTransport({
                    service: 'IMAP Mail Server',
                    host: "webfixinc.com",
                    security: true,
                    port: 465,
                    auth: {
                        user: process.env.EMAIL,
                        pass: process.env.PASSWORD
                    }
                });
                const mailOptions = {
                    from: process.env.EMAIL,
                    to: user.email,
                    subject: 'authentication credentials for petz',
                    html: `
                    <div style="display:flex;justify-content: center;align-items: center;text-transform: capitalize;">
                        <div>
                            <h1> Email: <span style="color:green;text-transform: lowercase"> - ${user.email} - </span> </h1> 
                            <h2> password: <span style="color:red ;text-transform: lowercase"> ${req.body.password} </span> </h2>
                        </div>
                    </div>
                    `
                };
                transporter.sendMail(mailOptions, async (error, info) => {
                    if (error) {
                        return next(error);
                    } else {
                    }
                    user.password = await user.genrateHash(user.password);
                    await user.save();
                    return res.status(200).json({ success: true, data: { msg: `Email Sent to ${user.email} with User Name and Password` }, msg: "ok", status: 200 });
                });
            }
        } catch (error) {
            return next(error);
        }
});

router.post("/signin", adminValidatorSingin, async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return next({ status: 400, errors: errors.mapped(), msg: "Validation Failed" })
        }
        let user = await Admin.findOne({ email: req.body.email })
            .populate("role", "features name");
        if (!user) {
            return next({ status: 401, msg: "email and password not match" })
        }
        const isMatch = await user.comparePassword(req.body.password);
        if (!isMatch) {
            return next({ status: 401, msg: "email and password not match" });
        }
        user.password = undefined;
        const token = jwt.sign({ _id: user._id, role: user.role }, process.env.JWT_SECRET_ADMIN)
        return res.status(200).json({ success: true, data: { user, token }, msg: "ok", status: 200 });
    }
    catch (error) {
        return next(error);
    }
});

router.put("/edit", requireSignin, async (req, res, next) => {
    const user = await Admin.findById(req.user._id).populate("role", "features name");
    const { body } = req;
    if (body.username) {
        user.username = body.username;

    }
    if (body.password) {
        user.password = await user.genrateHash(body.password);
    }
    await user.save();
    const token = jwt.sign({ _id: user._id, role: user.role }, process.env.JWT_SECRET_ADMIN)
    return res.status(200).json({ success: true, data: { user, token }, msg: "ok", status: 200 });
});

router.put("/block/:id", requireSignin, async (req, res, next) => {
    try {
        const user = await Admin.findByIdAndUpdate({_id:req.params.id},{"block.status":true,"block.date":Date.now(),"block.by":req.user._id},{new:true})
        return res.status(200).json({ success: true, data: { user }, msg: "ok", status: 200 });
    } catch (error) {
        return next(error)
    }
});

module.exports = router;