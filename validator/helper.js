const { Country, State, City, Species, Breed, Pet, Color, Interest, User,SpeciesType } = require("../models")
const mongoose = require("mongoose");

exports.isEmpty = (value) => {
    const newvalue = value || "";
    return !newvalue.length;
}
exports.invalidEmailMsg = "Please enter a valid email address"
exports.isIn = (value, arr) => {
    const newvalue = value || "";
    return arr.find(v => v == newvalue);
}
exports.isValidId = (id) => {
    return !mongoose.isValidObjectId(id);
};
exports.minLength = (value, length) => {
    return value.length >= length
}
exports.validateEmail = (email) => {
    const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(String(email).toLowerCase());
}
exports.isDate = (value) => {
    const date = new Date(value); 
    if (Object.prototype.toString.call(date) === "[object Date]") {
        // it is a date
        if (isNaN(date.getTime())) {  // d.valueOf() could also work
            return false
            // date is not valid
        } else {
            return true
            // date is valid
        }
    } else {
        return false
        // not a date
    }


    // return !!date.getMonth();
}
exports.IsIdExist = class IsIdExist {
    async countryId(id) {
        return Country.findById(id)
    }
    async stateId(id) {
        return State.findById(id)
    }
    async cityId(id) {
        return City.findById(id)
    }
    async speciesId(id) {
        return Species.findById(id)
    }
    async speciesTypeId(id) {
        return SpeciesType.findById(id)
    }
    async breedId(id) {
        return Breed.findById(id)
    }
    async interestId(id) {
        return Interest.findById(id)
    }
    async colorId(id) {
        return Color.findById(id)
    }
    async petId(id) {
        return Pet.findById(id)
    }
    async userId(id) {
        return User.findById(id)
    }
}
