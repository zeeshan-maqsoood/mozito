const { UserLogin } = require("../models");

class UserLoginService {
  constructor() {}
  static newUserLogin = (request) => {
    return new UserLogin(request);
  };
  static getUserLoginSimply = (match) => {
    return UserLogin.findOne(match);
  };
  static updateUserLogin = (match, update) => {
    return UserLogin.findOneAndUpdate(match, update, { new: true });
  };
}
module.exports = UserLoginService;
