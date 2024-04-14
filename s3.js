const dotenv = require("dotenv");
dotenv.config();
const AWS = require("aws-sdk");
const { v4 } = require("uuid");
const multerS3 = require("multer-s3");
const multer = require("multer");
const { Pet } = require("./models");
const {
  blogValidator,
  dummyUserProfileValidator,
  dummyPetProfileValidator,
} = require("./validator/customeValidator");
const {
  PetValidator2,
  CreateProfileValidator,
  postValidator,
  panicValidator,
} = require("./validator/appValidation");
AWS.config.update({
  accessKeyId: process.env.AWSACCESSKEY,
  secretAccessKey: process.env.AWSSECRETKEY,
});

exports.s3 = new AWS.S3();

// var storage = multer.diskStorage({
//     destination: function (req, file, cb) {
//         console.log(file);
//         const validationResult = PetValidator(req.body);
//         if (validationResult) {
//             return cb(validationResult)
//         }
//         cb(null, 'uploads/')

//     },
//     filename: function (req, file, cb) {
//         const uniqueSuffix = "user" + "-" + Date.now() + "-" + file.fieldname;
//         cb(null, file.fieldname + '-' + uniqueSuffix + "." + file.mimetype.split("/")[1])
//     }
// });

exports.local = (value) =>
  multer({
    storage: multer.diskStorage({
      destination: async function (req, file, cb) {
        let validationResult;
        switch (value) {
          case "app/pet":
            path = `${req.user._id}/pet`;
            if (!file) cb({ status: 422, msg: "photo must required" });
            validationResult = await PetValidator2(req.body);
            if (validationResult) {
              return cb({ status: 422, msg: validationResult });
            }
            break;
          case "app/user":
            path = `${req.user._id}`;
            validationResult = await CreateProfileValidator(req.body);
            if (validationResult) {
              return cb({ status: 422, msg: validationResult });
            }
            break;
          case "blog":
            validationResult = await blogValidator(req.body);
            if (validationResult) {
              return cb({
                status: 422,
                errors: validationResult,
                msg: "Validation Failed",
              });
            }
            break;
          case "app/dummy":
            const validationUserResult = await dummyUserProfileValidator(
              req.body.user
            );
            const validationPetResult = await dummyPetProfileValidator(
              req.body.pet
            );
            let errors = {};
            validationResult = {
              user: validationUserResult,
              pet: validationPetResult,
            };
            if (validationUserResult) {
              errors.user = validationUserResult;
            }
            if (validationUserResult) {
              errors.pet = validationPetResult;
            }
            if (Object.keys(errors).length > 0) {
              return cb({ status: 422, errors, msg: "Validation Failed" });
            }
            break;
          case "app/post":
            path = `${req.user._id}/post`;
            validationResult = await postValidator(req.body);
            if (validationResult) {
              return cb({ status: 422, msg: validationResult });
            }
            break;
          case "app/panic":
            // only for panic
            path = `panic`;
            validationResult = await panicValidator(req.body);
            if (validationResult) {
              return cb({ status: 422, msg: validationResult });
            }
            break;
        }
        // cb(null, { fieldName: file.fieldname, contentType: file.mimetype });
        cb(null, "uploads/");
      },
      filename: function (req, file, cb) {
        const uniqueSuffix = "user" + "-" + Date.now() + "-" + file.fieldname;
        cb(
          null,
          file.fieldname +
            "-" +
            uniqueSuffix +
            "." +
            file.mimetype.split("/")[1]
        );
      },
    }),
  });

exports.upload = (value) =>
  multer({
    storage: multerS3({
      s3: this.s3,
      bucket: process.env.AWSBUCKET,
      acl: "public-read",
      metadata: async function (req, file, cb) {
        let validationResult;
        switch (value) {
          case "app/pet":
            path = `${req.user._id}/pet`;
            if (!file) cb({ status: 422, msg: "photo must required" });
            validationResult = await PetValidator2(req.body);
            if (validationResult) {
              return cb({ status: 422, msg: validationResult });
            }
            break;
          case "app/user":
            path = `${req.user._id}`;
            validationResult = await CreateProfileValidator(req.body);
            if (validationResult) {
              return cb({ status: 422, msg: validationResult });
            }
            break;
          case "blog":
            validationResult = await blogValidator(req.body);
            if (validationResult) {
              return cb({
                status: 422,
                errors: validationResult,
                msg: "Validation Failed",
              });
            }
            break;
          case "app/dummy":
            const validationUserResult = await dummyUserProfileValidator(
              req.body.user
            );
            const validationPetResult = await dummyPetProfileValidator(
              req.body.pet
            );
            let errors = {};
            validationResult = {
              user: validationUserResult,
              pet: validationPetResult,
            };
            if (validationUserResult) {
              errors.user = validationUserResult;
            }
            if (validationUserResult) {
              errors.pet = validationPetResult;
            }
            if (Object.keys(errors).length > 0) {
              return cb({ status: 422, errors, msg: "Validation Failed" });
            }
            break;
          case "app/post || app/userpagepost":
            path = `${req.user._id}/post`;
            // validationResult = await postValidator(req.body);
            // if (validationResult) {
            //   return cb({ status: 422, msg: validationResult });
            // }
            break;
          case "app/userpage || app/status":
            path = `${req.user._id}/userpagepost`;
            break;
          case "app/panic":
            // only for panic
            path = `panic`;
            validationResult = await panicValidator(req.body);
            if (validationResult) {
              return cb({ status: 422, msg: validationResult });
            }
            break;
        }
        cb(null, { fieldName: file.fieldname, contentType: file.mimetype });
      },
      // contentType: function (req, file, cb) {
      //     console.log("file=>", file.mimetype.split("/")[1])
      //     cb(null, file.mimetype)
      // },
      contentType: multerS3.AUTO_CONTENT_TYPE,
      key: function (req, file, cb) {
        let path = "";
        let name = "";
        switch (value) {
          case "app/pet":
            path = `app/${req.user._id}/pet`;

            break;
          case "app/user":
            path = `app/${req.user._id}/user`;
            break;
          case "app/lostpet":
            path = `app/${req.user._id}/pet`;
            break;
          case "app/lostpetOther":
            path = `app/${req.user._id}/pet`;
            break;
          case "app/emergency":
            path = `app/${req.user._id}/pet`;
            break;
          case "app/petFound":
            path = `app/${req.user._id}/pet`;
            break;
          case "blog":
            path = `blog/${req.user._id}`;
            break;
          case "app/dummy":
            path = `dummy/${req.user._id}`;
            break;
          case "app/post || app/userpagepost":
            path = `app/${req.user._id}/post`;
            break;
          case "app/userpage || app/status":
            path = `app/${req.user._id}/userpagepost`;
            break;
          case "app/panic":
            path = `app/panic`;
            break;
          default:
            path = `photo`
            break;
        }
        cb(null, `${path}/${v4()}`);
      },
    }),
  });
