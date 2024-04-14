require('dotenv').config();
const jwt = require('jsonwebtoken');
const User = require("../models/userModel");
const Pet = require("../models/petModel");
const GuestUser = require("../models/guestusermodel")
const GuestUserLogin = require("../models/guestuserlogins")
const userLoginService = require("../service/userlogins")
exports.requireSigninUser = (req, res, next) => {
    const token = req.headers.authorization ? req.headers.authorization.split(" ")[1] : "";
    if (!token) {
        // return next({ status: 401, msg: "please add user token" });
        return next({ status: 401, msg: "We are sorry but we are not able to authenticate you. You have to Login again in Mazito." })
    }
    jwt.verify(token, process.env.JWT_SECRET_USER, async (err, decode) => {
        if (!decode) {
            return next({ status: 401, msg: "Invalid Token" })
        }
        else {
            const user = await User.findById(decode._id)
                .populate("selected_pet","name isMixedBreed mix interest species breed color friends petBlock friendRequest gender owner panicAlert")
            if (!user) {
                // return next({ status: 401, msg: "Unauthorized" });
                return next({ status: 401, msg: "User not found." });
            }
            if(user.selected_pet){
                req.selected_pet=user.selected_pet
                // user.selected_pet
            }else{
                const pet=await Pet.findOne({owner:user._id})
                    .select("name isMixedBreed mix interest species breed color friends petBlock friendRequest gender owner panicAlert");
                if(!pet){
                    req.selected_pet=null;
                }
                else{
                    user.selected_pet=pet._id;
                    req.selected_pet=pet;
                    await user.save();
                }
            }
            let userlogindata = await userLoginService.getUserLoginSimply({user:user._id})
            let findtoken
            if(!userlogindata){
                next({ status: 401, msg: "Your token has been expired. Please login again." });
            }else{
                findtoken=userlogindata.tokens.find(e=>e.token===token)
            }
            if(findtoken){
                req.user = user
                req.token = token
                next();
            }else{
                next({ status: 401, msg: "Your token has been expired. Please login again." });
            }
        }
    });
    // if (req.headers.authorization.split(" ")[0]==="guestuser"){
    //     const verify = jwt.verify(token, process.env.JWT_GUEST_USER)
    //     if(verify) {
    //         req.user = "Guest User"
    //         req.token = token
    //         next();
    //     }
    //     else return next({ status:401, msg: "Invalid Guest User Token" })
    // }
    // else {
    //     jwt.verify(token, process.env.JWT_SECRET_USER, async (err, decode) => {
    //         if (!decode) {
    //             return next({ status: 401, msg: "Invalid Token" })
    //         }
    //         else {
    //             const user = await User.findById(decode._id)
    //                 .populate("selected_pet","name isMixedBreed mix interest species breed color friends petBlock friendRequest gender owner panicAlert")
    //             if (!user) {
    //                 // return next({ status: 401, msg: "Unauthorized" });
    //                 return next({ status: 401, msg: "User not found." });
    //             }
    //             if(user.selected_pet){
    //                 req.selected_pet=user.selected_pet
    //                 // user.selected_pet
    //             }else{
    //                 const pet=await Pet.findOne({owner:user._id})
    //                     .select("name isMixedBreed mix interest species breed color friends petBlock friendRequest gender owner panicAlert");
    //                 if(!pet){
    //                     req.selected_pet=null;
    //                 }
    //                 else{
    //                     user.selected_pet=pet._id;
    //                     req.selected_pet=pet;
    //                     await user.save();
    //                 }
    //             }
    //             let userlogindata = await userLoginService.getUserLoginSimply({user:user._id})
    //             let findtoken
    //             if(!userlogindata){
    //                 next({ status: 401, msg: "Your token has been expired. Please login again." });
    //             }else{
    //                 findtoken=userlogindata.tokens.find(e=>e.token===token)
    //             }
    //             if(findtoken){
    //                 req.user = user
    //                 req.token = token
    //                 next();
    //             }else{
    //                 next({ status: 401, msg: "Your token has been expired. Please login again." });
    //             }
    //         }
    //     });
    // }
};

exports.requireGuestUserSignin = (req, res, next) => {
    const token = req.headers.authorization ? req.headers.authorization.split(" ")[1] : "";
    if (!token) {
        return next({ status: 401, msg: "please add guest user token" });
    }
    jwt.verify(token, process.env.JWT_GUEST_USER, async (err, decode) => {
        // console.log("decode => ",decode)
        if (!decode) {
            return next({ status: 401, msg: "Invalid Guest User Token" })
        }
        else {
            const guestUser = await GuestUser.findById(decode._id)
            if (!guestUser) {
                return next({ status: 401, msg: "Guest User not found." });
            }
            let guestuserlogindata = await GuestUserLogin.findOne({guestuser:guestUser._id})
            let findtoken
            if(!guestuserlogindata){
                next({ status: 401, msg: "Guest User Your token has been expired. Please login again." });
            }else{
                findtoken=guestuserlogindata.tokens.find(e=>e.token===token)
            }
            if(findtoken){
                req.guestUser = guestUser
                req.token = token
                next();
            }else{
                next({ status: 401, msg: "Guest User Your token has been expired. Please login again." });
            }
        }
    });
};

exports.requireSigninUserOptional = (req, res, next) => {
    const token = req.headers.authorization ? req.headers.authorization.split(" ")[1] : "";
    if (!token) {
        req.user = {_id:"5a894e5fc902ab6ea97f5eaa"};
        return next()
    }
    jwt.verify(token, process.env.JWT_SECRET_USER, async (err, decode) => {
        if (!decode) {
            req.user = {_id:"5a894e5fc902ab6ea97f5eaa"};
            return next()
        }
        else {
            const user = await User.findById(decode._id)
                .populate("pet","name isMixedBreed mix interest species breed color friends petBlock friendRequest gender ")
            if (!user) {
                req.user = {_id:"5a894e5fc902ab6ea97f5eaa"};
                return next();
            }
            if(user.pet){
                req.selected_pet=user.pet
            }else{
                const pet=await Pet.findOne({owner:user._id})
                    .select("name isMixedBreed mix interest species breed color friends petBlock friendRequest gender panicAlert");
                if(!pet){
                    req.selected_pet=null;
                }
                else{
                    user.selected_pet=pet._id;
                    req.selected_pet=pet;
                    await user.save();
                }
            }
            req.user = user;
            next();
        }
    });
};


exports.requireSigninUserByBody = (req, res, next) => {
    const token = req.body.token ? req.body.token.split(" ")[1] : "";
    if (!token) {
        return next({ status: 401, msg: "Unauthorized" })
    }
    jwt.verify(token, process.env.JWT_SECRET_USER, async (err, decode) => {
        if (!decode) {
            return next({ status: 401, msg: "Invalid Token" })
        }
        else {
            const user = await User.findById(decode._id)
                .populate("pet","name isMixedBreed mix interest species breed color friends petBlock friendRequest gender ")
            if (!user) {
                return next({ status: 401, msg: "Unauthorized" });
            }
            if(user.pet){
                req.selected_pet=user.pet
            }else{
                const pet=await Pet.findOne({owner:user._id})
                    .select("name isMixedBreed mix interest species breed color friends petBlock friendRequest gender panicAlert");
                if(!pet){
                    req.selected_pet=null;
                }
                else{
                    user.selected_pet=pet._id;
                    req.selected_pet=pet;
                    await user.save();
                }
            }
            let userlogindata = await userLoginService.getUserLoginSimply({user:user._id})
            let findtoken=userlogindata.tokens.find(e=>e.token===token)
            // console.log("findtoken => ",findtoken)
            if(findtoken){
                req.user = user
                req.token = token
                next();
            }else{
                next({ status: 401, msg: "token expire" });
            }
        }
    });
};

exports.requireSigninUserParams = (req, res, next) => {
    const token = req.query.token ? req.query.token.split(" ")[1] : "";
    if (!token) {
        return next({ status: 401, msg: "Unauthorized" })
    }
    jwt.verify(token, process.env.JWT_SECRET_USER, async (err, decode) => {
        if (!decode) {
            return next({ status: 401, msg: "Invalid Token" })
        }
        else {
            const user = await User.findById(decode._id)
                .populate("selected_pet","name isMixedBreed mix interest species breed color friends petBlock friendRequest gender panicAlert")
            if (!user) {
                return next({ status: 401, msg: "Unauthorized" });
            }
            if(user.pet){
                req.selected_pet=user.pet
            }else{
                const pet=await Pet.findOne({owner:user._id})
                    .select("name isMixedBreed mix interest species breed color friends petBlock friendRequest gender panicAlert");
                if(!pet){
                    req.selected_pet=null;
                }
                else{
                    user.selected_pet=pet._id;
                    req.selected_pet=pet;
                    await user.save();
                }
            }
            req.user = user;
            next();
        }
    });
};
exports.petRequired=(req,res,next)=>{
    try {
        // console.log("user => ",req.user)
        if(req.user==="Guest User") return next({status:405,msg:"Please create account first"})
      if(!req.selected_pet) return next({status:422,msg:"Pet is required to perform this action"})
      else{
        return next();
      }
    } catch (error) {
      return next(error)
    }
  }

exports.isOwner = async (req, res, next) => {
    try {
        const pet = await Pet.findById(req.params.id);
        if (!pet) return next({ status: 404, msg: "pet not found" });
        if (pet.owner.toString() === req.user._id.toString()) {
            return next()
        }
        else {
            next({ status: 401, msg: "unauthorized to perform this action" });
        }
    } catch (error) {
        next(error);
    }
}