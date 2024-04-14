const {
  isEmpty,
  isIn,
  isValidId,
  minLength,
  validateEmail,
  isDate,
  IsIdExist,
  invalidEmailMsg,
} = require("./helper");
const status = 422;
const weekDays = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
const isIdExist = new IsIdExist();

const requriedMessage=(field)=>`${field} is requried`;
const inValidIDMessage=(field)=>`${field} does not have a valid ID`
exports.signUpValidator = (req, res, next) => {
  try {
    const { body } = req;
    if (isEmpty(body.email)) return next({ status, msg: requriedMessage("Email") });
    if (!validateEmail(body.email))
      return next({ status, msg: invalidEmailMsg });
    if (isEmpty(body.password))
      return next({ status, msg: requriedMessage("Password") });
    if (!minLength(body.password, 6))
      return next({
        status,
        msg: "Password should be of minimum 6 characters",
      });
    return next();
  } catch (error) {
    return next(error);
  }
};
exports.guestUserSignUpValidator = (req, res, next) => {
  try {
    const { body } = req;
    if (isEmpty(body.email)) return next({ status, msg: requriedMessage("Email") });
    if (!validateEmail(body.email))
      return next({ status, msg: invalidEmailMsg });
    if (isEmpty(body.name))
      return next({ status, msg: requriedMessage("Name") });
    return next();
  } catch (error) {
    return next(error);
  }
};

// exports.guestUserSigninValidator = (req, res, next) => {
//   try {
//     const { body } = req;
//     if (isEmpty(body.email)) return next({ status, msg: requriedMessage("Email") });
//     if (!validateEmail(body.email))
//       return next({ status, msg: invalidEmailMsg });
//     return next();
//   } catch (error) {
//     return next(error);
//   }
// };

exports.signinValidator = (req, res, next) => {
  try {
    const { body } = req;
    // if (body.username==="Guest User") return next();
    if (isEmpty(body.email)) return next({ status, msg: requriedMessage("Email") });
    if (!validateEmail(body.email))
      return next({ status, msg: invalidEmailMsg });
    if (isEmpty(body.password))
      return next({ status, msg: requriedMessage("Password") });
    return next();
  } catch (error) {
    return next(error);
  }
};

exports.PetValidator1 = async (req, res, next) => {
  try {
    const { body } = req;
    if (isEmpty(body.species))
      return next({ status, msg: requriedMessage("Species") });
    if (isValidId(body.species))
      return next({ status, msg: inValidIDMessage("Species") });
    if (!(await isIdExist.speciesId(body.species)))
      return next({ status, msg: "Invalid Species" });

    if (isEmpty(body.gender))
      return next({ status, msg: requriedMessage("gender") });
    if (!isIn(body.gender, ["male", "female"]))
      return next({ status, msg: "gender must be male or female" });
    if (isEmpty(body.breed) && isEmpty(body.mix))
      return next({ status, msg: requriedMessage("Breed") });
      if(!body.mix){
        if (isValidId(body.breed))
        return next({ status, msg: inValidIDMessage("Breed") });
      }{
        body.breed === undefined;
      }
      (body.breed && body.breed !== null && body.breed !== "null") &&
        !(await isIdExist.breedId(body.breed)) &&
        next({ status, msg: "Invalid Breed" });

    if (isEmpty(body.status))
      return next({ status, msg: requriedMessage("Status") });
    if (!isIn(body.status, ["single", "paired"]))
      return next({ status, msg: "status must be single or paired" });
    if (body.lng || body.lat) {
      if (
        !body.lng ||
        isNaN(body.lng) ||
        Number(body.lng) < -108 ||
        Number(body.lng) > 180
      )
        return next({ status, msg: "Invalid Longitude" });
      if (
        !body.lat ||
        isNaN(body.lat) ||
        Number(body.lat) < -108 ||
        Number(body.lat) > 90
      )
        return next({ status, msg: "Invalid Latitude" });
      const geoLocation = {};
      geoLocation.coordinates = [Number(body.lng), Number(body.lat)];
      req.body.geoLocation = geoLocation;
    }
    return next();
  } catch (error) {
    return next(error);
  }
};
exports.PetValidator2 = async (body) => {
  if (isEmpty(body.name)) return requriedMessage("Name");

  if (isEmpty(body.dob)) return requriedMessage("D.O.B");
  if (!isDate(body.dob)) return "Invalid D.O.B";

  // if (isEmpty(body.adaptionDate)) return "adaptionDate must required";
  if (body.adaptionDate) {
    if (!isDate(body.adaptionDate)) return "Invalid adaption date";
  }

  if (isEmpty(body.color)) return requriedMessage("Color");
  if (isValidId(body.color)) return inValidIDMessage("Color");
  if (!(await isIdExist.colorId(body.color))) return "Invalid Color";
  if (body.interest) {
    // if (typeof body.interest === "string") {
    const interest = body.interest.toString().split(",");
    for (let int = 0; int < interest.length; int++) {
      const element = interest[int].toString();
      if (isValidId(element)) return "invalid interest Id";
      if (!(await isIdExist.interestId(element))) return "Invalid Interest";
    }
    body.interest = interest;
    // }
    // else {
    //     return "Invalid Interest";
    // }
  }
  return null;
};
exports.CreateProfileValidator = async (req, res, next) => {
  try {
    const { body } = req;
    if (isEmpty(body.name)) return next({ status, msg: requriedMessage("Name")});
    if (!/^[a-z A-Z]+$/.test(body.name))
      return next({ status, msg: "name should only contain letters" });
    // if (isEmpty(body.dob)) return next({status,msg:"dob must required"});
    // if (!isDate(body.dob)) return next({status,msg:"invalid date dob"});
    // if (isEmpty(body.secondaryEmail))
    //   return next({ status, msg: requriedMessage("Secondary Email") });
    if(body.secondaryEmail){
      if (!validateEmail(body.secondaryEmail))
        return next({
          status,
          msg: "Please enter a valid Secondary Email address",
        });
    }
    if (isEmpty(body.country))
      return next({ status, msg: requriedMessage("Country")});
    if (isValidId(body.country))
      return next({ status, msg: inValidIDMessage("Country") });
    if (!(await isIdExist.countryId(body.country)))
      return next({ status, msg: "Invalid Country" });

    if (isEmpty(body.state))
      return next({ status, msg: requriedMessage("State") });
    if (isValidId(body.state))
      return next({ status, msg: inValidIDMessage("State") });
    if (!(await isIdExist.stateId(body.state)))
      return next({ status, msg: "Invalid State" });

    if (isEmpty(body.city)) return next({ status, msg: requriedMessage("City") });
    if (isValidId(body.city))
      return next({ status, msg: inValidIDMessage("City") });
    if (!(await isIdExist.cityId(body.city)))
      return next({ status, msg: "Invalid City" });
    return next();
  } catch (error) {
    return next(error);
  }
};
exports.changePasswordValidator = (req, res, next) => {
  try {
    const { body } = req;
    if (isEmpty(body.password))
      return next({ status, msg: requriedMessage("Password") });
    if (isEmpty(body.newPassword))
      return next({ status, msg: requriedMessage("New Password") });
    if (!minLength(body.newPassword, 6))
      return next({
        status,
        msg: "New Password should be of minimum 6 characters",
      });

    return next();
  } catch (error) {
    return next(error);
  }
};
exports.forgotPasswordValidator = (req, res, next) => {
  try {
    const { body } = req;
    if (isEmpty(body.email)) return next({ status, msg: invalidEmailMsg });
    if (!validateEmail(body.email))
      return next({ status, msg: "Invalid email" });
    return next();
  } catch (error) {
    return next(error);
  }
};
exports.recoverPasswordValidator = (req, res, next) => {
  try {
    const { body } = req;
    if (isEmpty(body.email)) return next({ status, msg: "Email is required" });
    // if (!validateEmail(body.email))
    //   return next({ status, msg: "Invalid email" });

    if (isEmpty(body.password))
      return next({ status, msg: requriedMessage("Password") });
    if (!minLength(body.password, 6))
      return next({ status, msg: "Password must be 6 or more character" });
    // if (isEmpty(body.newPassword)) return next({ status, msg: "Password must required" });
    return next();
  } catch (error) {
    return next(error);
  }
};
exports.recoverAccountFormValidator = (req, res, next) => {
  try {
    const { body } = req;
    if (isEmpty(body.email)) return next({ status, msg: requriedMessage("Email") });
    if (!validateEmail(body.email))
      return next({ status, msg: invalidEmailMsg });

    if (isEmpty(body.password))
      return next({ status, msg: requriedMessage("Password") });
    if (!minLength(body.password, 7))
      return next({ status, msg: "Password must be 7 or more character" });
    return next();
  } catch (error) {
    return next(error);
  }
};
exports.recoverAccountValidator = async (req, res, next) => {
  try {
    const { body } = req;
    if (isEmpty(body.email)) return next({ status, msg: requriedMessage("Email") });
    if (!validateEmail(body.email))
      return next({ status, msg: invalidEmailMsg });

    // if (isEmpty(body.secondaryEmail)) return next({ status, msg: "Secondary Email must required" });
    // if (!validateEmail(body.secondaryEmail)) return next({ status, msg: "Invalid Secondary Email" });

    if (isEmpty(body.name)) return next({ status, msg: requriedMessage("Name") });
    if (!/^[a-z A-Z]+$/.test(body.name))
      return next({ status, msg: "name should only contain letter" });
    // if (isEmpty(body.dob)) return next({ status, msg: "dob must required" });
    // if (!isDate(body.dob)) return next({ status, msg: "invalid date dob" });
    if (isEmpty(body.country))
      return next({ status, msg: requriedMessage("Country") });
    if (isValidId(body.country))
      return next({ status, msg: inValidIDMessage("Country") });
    if (!(await isIdExist.countryId(body.country)))
      return next({ status, msg: "Invalid Country" });
    if (isEmpty(body.state)) return next({ status, msg: requriedMessage("State") });
    if (isValidId(body.state))
      return next({ status, msg: inValidIDMessage("State") });
    if (!(await isIdExist.stateId(body.state)))
      return next({ status, msg: "Invalid State" });
    if (isEmpty(body.city)) return next({ status, msg: requriedMessage("City") });
    if (isValidId(body.city))
      return next({ status, msg: inValidIDMessage("City") });
    if (!(await isIdExist.cityId(body.city)))
      return next({ status, msg: "Invalid City" });
    return next();
  } catch (error) {
    return next(error);
  }
};
exports.feedBackValidator = (req, res, next) => {
  try {
    const { body } = req;
    if (isEmpty(body.title)) return next({ status, msg: requriedMessage("Title") });
    if (isEmpty(body.body)) return next({ status, msg: requriedMessage("Body") });
    return next();
  } catch (error) {
    return next(error);
  }
};
exports.schduleValidator = async (req, res, next) => {
  try {
    const { body } = req;
    if (isEmpty(body.type)) return next({ status, msg: "type is required" });
    if (!isIn(body.type, ["meal", "play", "medication", "vaccination"]))
      return next({ status, msg: "invalid type" });
    if (isEmpty(body.title)) return next({ status, msg: "title is required" });
    if (isEmpty(body.repeat))
      return next({ status, msg: "repeat is required" });
    if (!isIn(body.repeat, ["1", "2", "3"]))
      return next({ status, msg: "invalid repeat" });
    if (isEmpty(body.datetime))
      return next({ status, msg: "Date Time is required" });
    if (!isDate(body.datetime))
      return next({ status, msg: "invalid DateTime" });
    // if (isEmpty(body.description))
    //   return next({ status, msg: "description is required" });
    return next();
  } catch (error) {
    return next(error);
  }
};
exports.reportValidator = async (req, res, next) => {
  try {
    const { body } = req;
    if (isEmpty(body.to)) return next({ status, msg: "to must required" });
    if (isValidId(body.to)) return next({ status, msg: "to id is not valid" });
    if (!(await isIdExist.userId(body.to)))
      return next({ status, msg: "Invalid User" });

    return next();
  } catch (error) {
    return next(error);
  }
};


exports.LostPetValidatforOther2 = (req, res, next) => {
  try {
    const { body } = req;
    if (isEmpty(body.name))
      return next({ status: 422, msg: "owner name must required" });
    if (isEmpty(body.contactNo))
      return next({ status: 422, msg: "owner contactNo must required" });
    if (isEmpty(body.email))
      return next({ status: 422, msg: "owner email must required" });
    if (!validateEmail(body.email))
      return next({ status: 422, msg: "please provide valid email" });
    return next();
  } catch (error) {
    return next(error);
  }
};

exports.closeAlert = (req, res, next) => {
  try {
    const { body } = req;
    if (isEmpty(body.reason))
      return next({ status: 422, msg: "reason must required" });
    return next();
  } catch (error) {
    return next(error);
  }
};

exports.postValidator = (body) => {
  // if (isEmpty(body.description)) return "Description must required";
  if (body.lng || body.lat) {
    if (
      !body.lng ||
      isNaN(body.lng) ||
      Number(body.lng) < -108 ||
      Number(body.lng) > 180
    )
      return "Invalid Longitude";
    if (
      !body.lat ||
      isNaN(body.lat) ||
      Number(body.lat) < -108 ||
      Number(body.lat) > 90
    )
      return "Invalid Latitude";
    const geoLocation = {};
    geoLocation.coordinates = [Number(body.lng), Number(body.lat)];
    body.geoLocation = geoLocation;
  }
  return null;
};
exports.panicValidator = async (body) => {
  if (isEmpty(body.type)) return "Panic type is required";
  else {
    if (body.petId == "null" || body.petId == null || !body.petId)  {
      body.petId = undefined;
    }
    if (body.type === "lost") {
      if (isEmpty(body.date)) return "lastseen must required";
      if (!isDate(body.date)) return "Invalid lastseen";
      if (isEmpty(body.location)) return "location must required";
      // if lost pet other then contactNo behave as a owner contactNo
      if (isEmpty(body.detail)) return "detail must required";

      if (body.petId) {
        if (isValidId(body.petId)) return "pet id is not valid";
        if (!(await isIdExist.petId(body.petId))) return "Pet not found";
      } else {
        //lost pet other
        if (isEmpty(body.country)) return "country must required";
        if (isValidId(body.country)) return "country id is not valid";
        if (!(await isIdExist.countryId(body.country)))
          return "Invalid Country";

        if (isEmpty(body.state)) return "state must required";
        if (isValidId(body.state)) return "state id is not valid";
        if (!(await isIdExist.stateId(body.state))) return "Invalid State";

        if (isEmpty(body.city)) return "city must required";
        if (isValidId(body.city)) return "city id is not valid";
        if (!(await isIdExist.cityId(body.city))) return "Invalid City";
        // if (body.other) {
        // if (isEmpty(body.species))
        //   return  "species must required";
        // if (isValidId(body.species))
        //   return  "species not a valid id";
        // if (!(await isIdExist.speciesId(body.species)))
        //   return  "Invalid Species";
        // if (isEmpty(body.petOwner ? body.petOwner.name : ""))
          // return "owner name must required";
        // if (isEmpty(body.petOwner ? body.petOwner.email : ""))
          // return "owner email must required";
        if (isEmpty(body.petOwner ? body.petOwner.contactNo : ""))
          return "Contact No must required";

        // if (isEmpty(body.owner ? body.owner.contactNo : ""))
        //   return "owner Contact No must required";
        // if (isEmpty(body.color)) return "color must required";
        // if (isValidId(body.color)) return "color not a valid id";
        // if (isEmpty(body.pet ? body.pet.name : ""))
        //   return "pet name must required";
        if (isEmpty(body.pet ? body.pet.age : ""))
          return "pet age must required";
        // }
      }
    } else if (body.type === "found") {
      if (isEmpty(body.location)) return "location must required";

      // if (isEmpty(body.color)) return "color must required";
      // if (isValidId(body.color)) return "color not a valid id";
      // if (!(await isIdExist.colorId(body.color))) return "Invalid Color";
      if (!body.foundByMe) {
        if (isEmpty(body.founder ? body.founder.name : ""))
          return "founder name must required";
      }
      if (isEmpty(body.founder ? body.founder.contactNo : ""))
        return "Founder contact no must required";
      if (isEmpty(body.detail)) return "detail must required";

      // if (isEmpty(body.founder ? body.founder.contactNo : ""))
      //   return "founder Contact No must required";
      if (isEmpty(body.country)) return "country must required";
      if (isValidId(body.country)) return "country id is not valid";
      if (!(await isIdExist.countryId(body.country))) return "Invalid Country";

      if (isEmpty(body.state)) return "state must required";
      if (isValidId(body.state)) return "state id is not valid";
      if (!(await isIdExist.stateId(body.state))) return "Invalid State";

      if (isEmpty(body.city)) return "city must required";
      if (isValidId(body.city)) return "city id is not valid";
      if (!(await isIdExist.cityId(body.city))) return "Invalid City";

      // if (isEmpty(body.species))
      //   return "species must required";
      // if (isValidId(body.species))
      //   return "species not a valid id";

      // return "found"
    } else if (body.type === "emergency") {
      // may be required in future
      // if (isEmpty(body.date)) return "date must required";
      // if (!isDate(body.date)) return "Invalid date date";

      // if lost pet other then contactNo behave as a owner contactNo
      if (isEmpty(body.petOwner ? body.petOwner.contactNo : ""))
        return "contact no must required";
      if (isEmpty(body.detail)) return "detail must required";
      if (body.petId) {
        if (isValidId(body.petId)) return "pet id is not valid";
        if (!(await isIdExist.petId(body.petId))) return "Pet not found";
      } else {
        //lost pet other
        if (isEmpty(body.country)) return "country must required";
        if (isValidId(body.country)) return "country id is not valid";
        if (!(await isIdExist.countryId(body.country)))
          return "Invalid Country";

        if (isEmpty(body.state)) return "state must required";
        if (isValidId(body.state)) return "state id is not valid";
        if (!(await isIdExist.stateId(body.state))) return "Invalid State";

        if (isEmpty(body.city)) return "city must required";
        if (isValidId(body.city)) return "city id is not valid";
        if (!(await isIdExist.cityId(body.city))) return "Invalid City";
        // if (body.other) {
        if (isEmpty(body.species)) return "species must required";
        if (isValidId(body.species)) return "species not a valid id";
        if (!(await isIdExist.speciesId(body.species)))
          return "Invalid Species";
        // if (isEmpty(body.petOwner ? body.petOwner.name : ""))
        //   return "owner name must required";
        // if (isEmpty(body.petOwner ? body.petOwner.email : ""))
        //   return "owner email must required";
        // if (isEmpty(body.owner ? body.owner.contactNo : ""))
        //   return "owner Contact No must required";
        // if (isEmpty(body.color)) return "color must required";
        // if (isValidId(body.color)) return "color not a valid id";
        // if (isEmpty(body.pet ? body.pet.name : ""))
        //   return "pet name must required";
        if (isEmpty(body.pet ? body.pet.age : ""))
          return "pet age must required";
        // }
      }
      // return "emergency"
    } else {
      return "Panic type must be lost/found/emergency";
    }
  }
  return null;
};
exports.commentValidator = (req, res, next) => {
  try {
    const { body } = req;
    if (isEmpty(body.body))
      return next({ status: 422, msg: "comment text must required" });
    return next();
  } catch (error) {
    return next(error);
  }
};
