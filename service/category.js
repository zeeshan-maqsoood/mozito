const { Category } = require("../models");
const mongoose = require("mongoose");
class CategoryService {
  constructor() {}
  static getCategoryForUser = () => {
    return Category.find({}).select("-createdBy -__v");
  };
}
module.exports = CategoryService;
