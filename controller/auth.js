const {
  User,
  UserDelete,
  Pet,
  GuestUser,
  GuestUserLogin,
} = require('../models');
const UserService = require('../service/user');
const MailService = require('../service/mail');
const _ = require('lodash');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const mongoose = require('mongoose');
const PetService = require('../service/pet');
const UserLoginService = require('../service/userlogins');
const {
  firebaseNotificationUser,
} = require('../common/firebaseNotificationHelper');
const notificationMessages = require('../common/notificationMessages');
const PushNotificationService = require('../common/push-notification');
const FirestoreService = require('../service/firestore');

const appPackegeName = 'io.mazito.app';
const website = 'http://mazito.io';
// const website="http://192.168.100.39:5502";
exports.signupForUser = async (req, res, next) => {
  

  try {
    let expression = /\s+/g;
    let spaceCount = req.body.password.match(expression)
      ? req.body.password.match(expression).length
      : 0;
    if (spaceCount > 0) {
      return next({
        status: 409,
        msg: 'Please enter password without space.',
      });
    }
    let user;
    user = await UserService.getUserAggregate({ email: req.body.email });
    if (user.length > 0) {
      return next({
        status: 409,
        msg: 'Email already in use Please use another email',
      });
    } else {
      user = UserService.newUser(req.body);
      const { device } = req;
      user.current_device = user.signup_device = device.os.name || '';
      user.password = await user.genrateHash(user.password);
      await user.save();
      const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET_USER, {
        expiresIn: '1d',
      });
      console.log(token,"tokensignup")
      MailService.sendMailToUserNew(
        user.email,
        'Confirm Email',
        'confrimEmail',
        {
          token: `https://api.mazito.io/api/user/auth/verifyEmail?token=bearer ${token}`,
        }
      );
      return res.status(201).json({
        success: true,
        data: {},
        msg: 'Please check your email and tap on the link to verify your email address.',
        status: 201,
      });
    }
  } catch (error) {
    return next(error);
  }
};

exports.signupForGuestUser = async (req, res, next) => {
  try {
    let guestUser, token, user;
    guestUser = await GuestUser.findOne({ email: req.body.email });
    user = await User.findOne({ email: req.body.email });
    // console.log("guestUser => ",guestUser)
    // console.log("user => ",user)
    if (guestUser) {
      guestUser.name = req.body.name ? req.body.name : guestUser.name;
      guestUser.visitDate = Date.now();
      guestUser.online = true;
      await guestUser.save();
    } else if (user) {
      guestUser = new GuestUser({
        email: user.email,
        name: req.body.name,
        online: true,
      });
      await guestUser.save();
    } else {
      guestUser = new GuestUser({
        email: req.body.email,
        name: req.body.name,
        online: true,
      });
      await guestUser.save();
    }
    token = jwt.sign({ _id: guestUser._id }, process.env.JWT_GUEST_USER);
    let guestuserlogin = await GuestUserLogin.findOne({
      guestuser: guestUser._id,
    });
    
    if (guestuserlogin) {
      guestuserlogin.tokens = guestuserlogin.tokens.concat({ token });
      await guestuserlogin.save();
    } else {
      let guestuserlogindata = {
        guestuser: guestUser._id,
        tokens: {
          token,
        },
      };
      let guestuserlogin = new GuestUserLogin(guestuserlogindata);
      await guestuserlogin.save();
    }
    return res.status(201).json({
      success: true,
      data: { guestUser, token },
      msg: 'ok',
      status: 201,
    });
  } catch (error) {
    return next(error);
  }
};

exports.singinForUser = async (req, res, next) => {
  console.log(req.body,"body")
  try {
    let token;
    // if (req.body.username==="Guest User"){
    //   token = jwt.sign({ userID: 12345 }, process.env.JWT_GUEST_USER);
    //   return res.status(200).json({
    //     success: true,
    //     data: { user: req.body.username, token },
    //     msg: "ok",
    //     status: 200,
    //   });
    // }
    let user = await UserService.getUser({ email: req.body.email });
    if (!user)
      return next({
        status: 403,
        msg: 'Incorrect Email ID/Password. Please try again',
      });
    const isMatch = await user.comparePassword(req.body.password);
    if (!isMatch)
      return next({
        status: 403,
        msg: 'Incorrect Email ID/Password. Please try again',
      });
    if (user.deleted)
      return next({
        status: 400,
        msg: 'Your Account is Deactivate.',
      });
    if (!user.isVerified) {
      token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET_USER, {
        expiresIn: '1d',
      });
    console.log(token,"tokenLogin")

      MailService.sendMailToUserNew(
        user.email,
        'Confirm Email',
        'confrimEmail',
        {
          token: `https://api.mazito.io/api/user/auth/verifyEmail?token=bearer ${token}`,
        }
      );

      return res.status(200).json({
        success: true,
        data: {},
        msg: 'Please check your email and tap on the link to verify your email address.',
        status: 200,
      });
    }
    // move to below
    // if(user.fcmToken){
    //     await PushNotificationService.notifySingleDevice({
    //       title: "Welcome back",
    //       body: `${user.name} Welcome to mazito`,
    //   }, user.fcmToken, { _id: user._id.toString(), type: "type", });
    // }
    const { device } = req;
    user.current_device = device.os.name || '';
    ++user.totalLogins;
    user.lastLoginDate = Date.now();
    user.online = true;
    [user, pet, petInComplete] = await Promise.all([
      user.save(),
      PetService.getPet({ owner: user._id }),
      PetService.getPet({ owner: user._id, stage: 1 }),
    ]);
    const responceUser = {
      email: user.email,
      isComplete: user.isComplete,
      name: user.name,
      email: user.email,
      secondaryEmail: user.secondaryEmail,
      about: user.about,
      _id: user._id,
      createdAt: user.createdAt,
      country: user.country,
      state: user.state,
      city: user.city,
      isVerified: user.isVerified,
      isPetRegister: pet ? true : false,
      deleted: user.deleted,
      Token:token
    };
    if (user.deleted) {
      await user.restore();
      const user_delete = await UserDelete.findOne({
        user: user._id,
        status: false,
      });
      user_delete.status = true;

      user_delete.restore_by = 2;
      await user_delete.save();
      await Pet.restore({ owner: user._id });
      await PushNotificationService.notifySingleDevice(
        {
          title: 'Welcome back',
          body: `${user.name} Welcome to mazito, Your account is Restored`,
        },
        user.fcmToken,
        { _id: user._id.toString(), type: 'type' }
      );
    } else if (user.fcmToken) {
      await PushNotificationService.notifySingleDevice(
        {
          title: 'Welcome back',
          body: `${user.name} Welcome to mazito`,
        },
        user.fcmToken,
        { _id: user._id.toString(), type: 'type' }
      );
    }
    if (petInComplete) {
      responceUser.inCompletePet = {
        exist: true,
        petId: petInComplete._id,
      };
    } else {
      responceUser.inCompletePet = {
        exist: false,
        petId: '',
      };
    }
    await Promise.all([
      User.populate(responceUser, { path: 'country', select: 'name' }),
      User.populate(responceUser, { path: 'city', select: 'name' }),
      User.populate(responceUser, { path: 'state', select: 'name' }),
    ]);

        let getuserlogin = await UserLoginService.getUserLoginSimply({
      user: user._id,
    });
    if (getuserlogin) {
      getuserlogin.tokens = getuserlogin.tokens.concat({ token });
      await getuserlogin.save();
    } else {
      let userlogindata = {
        user: user._id,
        tokens: {
          token,
        },
      };
      let userlogin = UserLoginService.newUserLogin(userlogindata);
      await userlogin.save();
    }
    // for firebase push notification
    // firebaseNotificationUser(pet, req, notificationMessages.friendRequestSentTitle, notificationMessages.friendRequestSentbody(req.selected_pet.name), 108, req.selected_pet._id.toString());
    token=jwt.sign({_id:user._id},process.env.JWT_SECRET_USER)

    return res.status(200).json({
      success: true,
      data: { user: responceUser, token },
      msg: 'ok',
      status: 200,
    });
  } catch (error) {
    return next(error);
  }
};

// exports.singinForGuestUser = async (req, res, next) => {
//   try {
//     let token
//     let guestUser = await GuestUser.findOne({email:req.body.email})
//     if (!guestUser)
//       return next({
//         status: 401,
//         msg: "Incorrect Email ID",
//       })
//     token = jwt.sign({ _id: guestUser._id }, process.env.JWT_GUEST_USER);
//     return res.status(200).json({
//       success: true,
//       data: { guestUser, token },
//       msg: "ok",
//       status: 200,
//     });
//   } catch (error) {
//     return next(error);
//   }
// };

exports.createProfileForUser = async (req, res, next) => {
  try {
    const body = req.body;
    const secondaryEmail = body.secondaryEmail || '';
    body.secondaryEmail = body.secondaryEmail || '.@dummy.as';

    // const { file } = req
    // let photo = {
    //     updatedAt: Date.now()
    // }
    // if (file) {
    //     photo.key = file.key;
    //     photo.url = file.location;
    // } else {
    //     validationResult = await CreateProfileValidator(body);
    //     if (validationResult) {
    //         return next({ status: 422, msg: validationResult });
    //     }
    // }
    if (req.user.email === body.secondaryEmail)
      return next({
        status: 422,
        msg: 'primary and secondary email must not be the same',
      });
    let user;
    user = await UserService.getUser({
      email: {
        $ne: req.user.email,
      },
      secondaryEmail: body.secondaryEmail,
    });
    if (user)
      return next({ status: 209, msg: 'Secondary Email already registered' });
    user = await UserService.getUser({ _id: req.user._id });

    if (!user) return next({ status: 404, msg: 'user not found' });
    let password = user.password;
    user = _.extend(user, { ...body, secondaryEmail });

    // user.photo = photo;
    user.password = password;
    user.isComplete = true;
    user = await user.save();
    const responceUser = {
      name: user.name,
      email: user.email,
      secondaryEmail: secondaryEmail,
      about: user.about,
      _id: user._id,
      createdAt: user.createdAt,
      country: user.country,
      state: user.state,
      city: user.city,
      isComplete: user.isComplete,
      isVerified: user.isVerified,
    };

    await Promise.all([
      User.populate(responceUser, { path: 'country', select: 'name' }),
      User.populate(responceUser, { path: 'city', select: 'name' }),
      User.populate(responceUser, { path: 'state', select: 'name' }),
    ]);
    return res.status(200).json({
      success: true,
      data: { user: responceUser },
      msg: 'ok',
      status: 200,
    });
  } catch (error) {
    return next(error);
  }
};
exports.testing = async (req, res, next) => {
  try {
   
    return res.status(200).json({
      success: true,
      data: { user: "Trulioo" },
      msg: 'ok',
      status: 200,
    });
  } catch (error) {
    return next(error);
  }
};

exports.changePasswordForUser = async (req, res, next) => {
  try {
    const user = await UserService.getUser({ _id: req.user._id });
    const isMatch = await user.comparePassword(req.body.password);
    if (!isMatch) return next({ status: 401, msg: 'Incorrect Password' });
    user.password = await user.genrateHash(req.body.newPassword);
    await user.save();
    return res.status(200).json({
      success: true,
      data: { msg: 'Password Updated' },
      msg: 'ok',
      status: 200,
    });
  } catch (error) {
    return next(error);
  }
};
exports.logout = async (req, res, next) => {
  try {
    // if(req.user!=="Guest User"){
    const userId = req.user ? req.user._id.toString() : '';
    const selected_pet = req.selected_pet
      ? req.selected_pet._id.toString()
      : '';
    const user = await User.findOneAndUpdate(
      { _id: req.user._id },
      { $set: { fcmToken: '', online: false } }
    );
    if (!user) return next({ status: 404, msg: 'User not found' });
    let userlogindata = await UserLoginService.getUserLoginSimply({
      user: req.user._id,
    });
    userlogindata.tokens = userlogindata.tokens.filter((token) => {
      return token.token !== req.token;
    });
    await userlogindata.save();
    await FirestoreService.logoutUserToFirease(userId, {
      petId: selected_pet,
      ownerId: userId,
      fcmToken: '',
      updateDate: Date.now(),
    });
    // await FirestoreService.addUserToFirease(selected_pet,{petId:selected_pet,ownerId:userId,fcmToken,updateDate:Date.now()})
    // }
    return next({ status: 200, msg: 'Loged out' });
  } catch (error) {
    return next(error);
  }
};

exports.guestUserLogout = async (req, res, next) => {
  try {
    console.log('req.token => ', req.token);
    const guestuser = await GuestUser.findOneAndUpdate(
      { _id: req.guestUser._id },
      { $set: { online: false } }
    );
    if (!guestuser) return next({ status: 404, msg: 'Guest User not found' });
    let guestuserlogin = await GuestUserLogin.findOne({
      guestuser: req.guestUser._id,
    });
    guestuserlogin.tokens = guestuserlogin.tokens.filter((token) => {
      return token.token !== req.token;
    });
    await guestuserlogin.save();
    return next({ status: 200, msg: 'Guest User Loged out' });
  } catch (error) {
    return next(error);
  }
};

exports.forgotPasswordForUser = async (req, res, next) => {
  try {
    const user = await UserService.getUser({
      $or: [{ email: req.body.email }, { secondaryEmail: req.body.email }],
    });
    if (!user)
      return next({ status: 404, msg: 'User with that Email not found' });
    const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET_USER, {
      expiresIn: '1d',
    });

    var data = JSON.stringify({
      dynamicLinkInfo: {
        domainUriPrefix: 'https://mazito.page.link',
        link: `${website}/resetpassword.html?screen=resetpassword&token=Bearer ${token}`,
        androidInfo: { androidPackageName: appPackegeName },
        iosInfo: { iosBundleId: appPackegeName },
      },
    }); 
    

    var config = {
      method: 'post',
      url: `https://firebasedynamiclinks.googleapis.com/v1/shortLinks?key=${process.env.GOOGLE_WEP_API_KEY}`,
      headers: {
        'Content-Type': 'application/json',
      },
      data: data,
    };

    const responce = await axios(config);
    // console.log("responce => ",responce)
    MailService.sendMailToUserNew(
      req.body.email,
      'Reset Password',
      'resetPassword',
      {
        link: responce.data.shortLink,
        email: user.email === req.body.email.toLowerCase() ? '' : user.email,
      }
    );
    let getuserlogin = await UserLoginService.getUserLoginSimply({
      user: user._id,
    });
    if (getuserlogin) {
      getuserlogin.tokens = getuserlogin.tokens.concat({ token });
      await getuserlogin.save();
    } else {
      let userlogindata = {
        user: user._id,
        tokens: {
          token,
        },
      };
      let userlogin = UserLoginService.newUserLogin(userlogindata);
      await userlogin.save();
    }
    // console.log("token => ",token)
    return res.status(200).json({
      success: true,
      data: { msg: 'please check your email' },
      msg: 'ok',
      status: 200,
    });
  } catch (error) {
    return next(error);
  }
};

exports.resetPasswordForUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await UserService.getUser({ email: email });
    if (!user) {
      return next({
        status: 404,
        msg: 'user not create account with this email',
      });
      // return next({ status: 404, msg: "user not found" });
    }
    user.password = await user.genrateHash(password);
    await user.save();
    user.password = undefined;
    user.resetPassword = undefined;
    user.lastLoginSystem = undefined;
    user.signupSystem = undefined;
    user.totalLogins = undefined;

    // console.log("req.user => ",req.user)
    // console.log("req.token => ",req.token)

    let userlogindata = await UserLoginService.getUserLoginSimply({
      user: req.user._id,
    });
    userlogindata.tokens = userlogindata.tokens.filter((token) => {
      return token.token !== req.token;
    });
    await userlogindata.save();
    // console.log("userlogindata => ",userlogindata)
    return res.status(200).json({
      success: true,
      data: {
        msg: 'congratulation your password is changed, Now sign in to access your account.',
      },
      msg: 'ok',
      status: 200,
    });
  } catch (error) {
    return next(error);
  }
};

exports.getUser = async (req, res, next) => {
  try {
    const userId = mongoose.Types.ObjectId(req.user._id);
    const user = await UserService.getUserinfo(
      {
        _id: userId,
      },
      userId
    );
    if (!user[0]) return next({ status: 404, msg: 'User not found' });
    return res.status(200).json({
      success: true,
      data: { user: user[0] },
      msg: 'ok',
      status: 200,
    });
  } catch (error) {
    return next(error);
  }
};

exports.resendEmailForUser = async (req, res, next) => {
  try {
    const user = await UserService.getUser({
      email: req.params.email,
      isVerified: false,
    });
    if (!user)
      return next({
        status: 400,
        msg: 'User already verified or User not found',
      });

    const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET_USER);
    MailService.sendMailToUserNew(user.email, 'Confirm Email', 'confrimEmail', {
      token: `https://api.mazito.io/api/user/auth/verifyEmail?token=bearer ${token}`,
    });

    return res.status(200).json({
      success: true,
      data: { msg: `please check mailbox ` },
      msg: 'ok',
      status: 200,
    });
  } catch (error) {
    return next(error);
  }
};
exports.verifyEmailForUser = async (req, res, next) => {
  try {
    const user = await UserService.updateUser(
      { _id: req.user._id },
      {
        isVerified: true,
        verifiedAt: Date.now(),
      }
    );
    if (!user) return next({ status: 404, msg: 'User not found' });

    const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET_USER, {
      expiresIn: '1d',
    });
    var data = JSON.stringify({
      dynamicLinkInfo: {
        domainUriPrefix: 'https://mazito.page.link',
        link: `${website}/verify.html?screen=createProfile&token=Bearer ${token}`,
        androidInfo: { androidPackageName: appPackegeName },
        iosInfo: { iosBundleId: appPackegeName },
      },
    });

    var config = {
      method: 'post',
      url: `https://firebasedynamiclinks.googleapis.com/v1/shortLinks?key=${process.env.GOOGLE_WEP_API_KEY}`,
      headers: {
        'Content-Type': 'application/json',
      },
      data: data,
    };

    const responce = await axios(config);

    console.log('responce.data', responce.data);
    return res.redirect(responce.data.shortLink);
  } catch (error) {
    return next(error);
  }
};

exports.deleteUser = async (req, res, next) => {
  try {
    const { body } = req;
    if (!body.reason) return next({ status: 404, msg: 'Reason Required' });
    if (req.user._id.toString() === req.params.id.toString()) {
      const user = await User.findOne(req.user._id);
      if (!user) return next({ status: 404, msg: 'user not found' });
      const query = { owner: req.user._id };
      const user_delete = new UserDelete({
        user: req.user._id,
        delete_by: 2,
        reason: body.reason,
        status: false,
        delete_type: 2,
      });
      await user_delete.save();
      await Pet.delete(query, req.user._id);
      await user.delete();
      return res.status(200).json({
        success: true,
        data: { msg: 'profile deleted' },
        msg: 'ok',
        status: 200,
      });
    } else {
      return next({ status: 401, msg: 'unable to delete this profile' });
    }
  } catch (error) {
    return next(error);
  }
};
