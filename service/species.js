const { Species } = require("../models");
const mongoose = require("mongoose");
class SpeciesService {
  constructor() {}
  static getAllSpeciesForUser = () => {
    return Species.find()
    .select({ __v: false, addedBy: false,deleted:false,updatedAt:false,createdAt:false })
    .sort("name");
  };
}
module.exports = SpeciesService;
