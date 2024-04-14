
const { isEmpty, isIn, isValidId, minLength, validateEmail, isDate } = require("./helper");




exports.CreateProfileValidator = (body) => {
    const errors = {};
    if (isEmpty(body.name)) {
        errors.name = {
            msg: `name must required`,
            param: "name",
            location: "body"
        }
    }
    else {
        if (!/^[a-z A-Z]+$/.test(body.name)) {
            errors.name = {
                msg: `name should only contain letter`,
                param: "name",
                location: "body"
            }
        }
    }

    if (isEmpty(body.state)) {
        errors.state = {
            msg: `state must required`,
            param: "state",
            location: "body"
        }
    }
    else {
        if (isValidId(body.state)) {
            errors.breed = {
                msg: `breed not a valid id`,
                param: "breed",
                location: "body"
            }
        }
    }
    if (isEmpty(body.city)) {
        errors.city = {
            msg: `city must required`,
            param: "city",
            location: "body"
        }
    }
    else {
        if (isValidId(body.city)) {
            errors.city = {
                msg: `city not a valid id`,
                param: "city",
                location: "body"
            }
        }
    }
    if (isEmpty(body.dob)) {
        errors.dob = {
            msg: `dob must required`,
            param: "dob",
            location: "body"
        }
    }
    if (Object.keys(errors).length > 0) {
        return { status: 400, errors, msg: "Validation Failed" };
    }
    return null;
};

exports.blogValidator = (body) => {
    let errors = {}
    if (isEmpty(body.title)) {
        errors.title = {
            msg: `title must required`,
            param: "title",
            location: "body"
        }
    }
    // else {
    //     if (!minLength(body.title, 5)) {
    //         errors.title = {
    //             msg: `title must be grater than 5 characters`,
    //             param: "title",
    //             location: "body"
    //         }
    //     }
    // }


    if (isEmpty(body.category)) {
        errors.category = {
            msg: `category must required`,
            param: "category",
            location: "body"
        }
    }
    else {
        if (isValidId(body.category)) {
            errors.category = {
                msg: `category not a valid id`,
                param: "category",
                location: "body"
            }
        }
    }
    if (isEmpty(body.body)) {
        errors.body = {
            msg: `body must required`,
            param: "body",
            location: "body"
        }
    }
    // else {
    //     if (!minLength(body.body, 60)) {
    //         errors.body = {
    //             msg: `body must be grather than 60 characters`,
    //             param: "body",
    //             location: "body"
    //         }
    //     }
    // }

    if (Object.keys(errors).length > 0) {
        return errors;
    }
    return null;
}



exports.dummyUserProfileValidator = body => {
    const errors = {};
    user = JSON.parse(JSON.stringify(body || {}));
    if (isEmpty(user.email)) {
        errors.email = {
            msg: ` user email must required`,
            param: "user.email",
            location: "body"
        }
    }
    if (isEmpty(user.password)) {
        errors.password = {
            msg: `user password must required`,
            param: "user.password",
            location: "body"
        }
    }
    if (isEmpty(user.name)) {
        errors.name = {
            msg: `user name must required`,
            param: "user.name",
            location: "body"
        }
    }
    if (isEmpty(user.dob)) {
        errors.dob = {
            msg: `user dob must required`,
            param: "user.dob",
            location: "body"
        }
    } else {
        if (!isDate(user.dob)) {
            errors.dob = {
                msg: `Invalid User dob`,
                param: "user.dob",
                location: "body"
            }
        }
    }
    if (isEmpty(user.country)) {
        errors.country = {
            msg: `user country must required`,
            param: "country",
            location: "body"
        }
    }
    else {
        if (isValidId(user.country)) {
            errors.country = {
                msg: `Invalid Country Id`,
                param: "country",
                location: "body"
            }
        }
    }
    if (isEmpty(user.state)) {
        errors.state = {
            msg: `user state must required`,
            param: "user.state",
            location: "body"
        }
    }
    else {
        if (isValidId(user.state)) {
            errors.state = {
                msg: `Invalid State Id`,
                param: "state",
                location: "body"
            }
        }
    }
    if (isEmpty(user.city)) {
        errors.city = {
            msg: `user city must required`,
            param: "user.city",
            location: "body"
        }
    }
    else {
        if (isValidId(user.city)) {
            errors.city = {
                msg: `Invalid City Id`,
                param: "city",
                location: "body"
            }
        }
    }

    if (Object.keys(errors).length > 0) {
        return errors
    }

    return null;
}


exports.dummyPetProfileValidator = body => {
    const errors = {};
    pet = JSON.parse(JSON.stringify(body || {}));


    if (isEmpty(pet.name)) {
        errors.name = {
            msg: `pet name must required`,
            param: "name",
            location: "body"
        }
    }
    if (isEmpty(pet.dob)) {
        errors.dob = {
            msg: `pet dob must required`,
            param: "pet.dob",
            location: "body"
        }
    }
    else {
        if (!isDate(pet.dob)) {
            errors.dob = {
                msg: `Invalid pet dob`,
                param: "user.dob",
                location: "body"
            }
        }
    }
    if (isEmpty(pet.adaptionDate)) {
        errors.adaptionDate = {
            msg: `pet adaptionDate must required`,
            param: "pet.adaptionDate",
            location: "body"
        }
    }
    else {
        if (!isDate(user.adaptionDate)) {
            errors.adaptionDate = {
                msg: `Invalid Pet adaptionDate`,
                param: "user.adaptionDate",
                location: "body"
            }
        }
    }
    if (isEmpty(pet.about)) {
        errors.about = {
            msg: `pet about must required`,
            param: "pet.about",
            location: "body"
        }
    }
    if (isEmpty(pet.gender)) {
        errors.gender = {
            msg: `pet gender must required`,
            param: "pet.gender",
            location: "body"
        }
    }
    else {
        if (!isIn(pet.gender, ["male", "female"])) {
            errors.gender = {
                msg: `pet gender should be male or female`,
                param: "pet.gender",
                location: "body"
            }
        }
    }
    if (isEmpty(pet.breed)) {
        errors.breed = {
            msg: `pet breed must required`,
            param: "pet.breed",
            location: "body"
        }
    }
    else {
        if (isValidId(user.breed)) {
            errors.breed = {
                msg: `Invalid Breed Id`,
                param: "breed",
                location: "body"
            }
        }
    }
    if (isEmpty(pet.species)) {
        errors.species = {
            msg: `pet species must required`,
            param: "pet.species",
            location: "body"
        }
    }
    else {
        if (isValidId(user.species)) {
            errors.species = {
                msg: `Invalid Species Id`,
                param: "species",
                location: "body"
            }
        }
    }
    if (isEmpty(pet.color)) {
        errors.color = {
            msg: `pet color must required`,
            param: "pet.color",
            location: "body"
        }

    }
    else {
        if (isValidId(user.color)) {
            errors.color = {
                msg: `Invalid Color Id`,
                param: "color",
                location: "body"
            }
        }
    }
    if (isEmpty(pet.interest)) {
        errors.interest = {
            msg: `pet interest must required`,
            param: "pet.interest",
            location: "body"
        }
    }
    if (Object.keys(errors).length > 0) {
        return errors
    }

    return null;
}