const router = require("express").Router();
const { Pet, User } = require("../../models");

router.get("/all", async (req, res, next) => {
    try {
        const totalPet = await Pet.find({}).countDocuments();
        return res.status(200).json({ success: true, data: { totalPet }, msg: "ok", status: 200 });
    } catch (error) {
        return next(error);
    }
});

router.get("/mostfollowingaccounts", async (req, res, next) => {
    try {
        const totalPets = await Pet.aggregate([
            {$addFields:{friends:{$size:{$ifNull:["$friends",[]]}}}}
        ])
        let array_num_repeat = []
        totalPets.forEach(el=>array_num_repeat.push(el.friends))
        let largest = array_num_repeat[0]
        console.log("array_num_repeat => ",array_num_repeat)
        for (let i = 0; i < array_num_repeat.length; i++) {
            if (largest < array_num_repeat[i] ) {
                largest = array_num_repeat[i];
            }
        }
        // console.log("largest => ",largest)
        const mostfollowingaccounts = await Pet.aggregate([
            {$lookup:{
                from:"breeds",as:"breed",
                let:{breedID:"$breed"},
                pipeline:[
                    {$match:{$expr:{$eq:["$_id","$$breedID"]}}},
                    {$project:{name:1}}
                ]
            }},
            {$lookup:{
                from:"species",as:"species",
                let:{speciesID:"$species"},
                pipeline:[
                    {$match:{$expr:{$eq:["$_id","$$speciesID"]}}},
                    {$project:{name:1}}
                ]
            }},
            {$lookup:{
                from:"speciestypes",as:"speciesType",
                let:{speciesTypeID:"$speciesType"},
                pipeline:[
                    {$match:{$expr:{$eq:["$_id","$$speciesTypeID"]}}},
                    {$project:{name:1}}
                ]
            }},
            {$lookup:{
                from:"users",as:"owner",
                let:{ownerID:"$owner"},
                pipeline:[
                    {$match:{$expr:{$eq:["$_id","$$ownerID"]}}},
                    {$project:{name:1}}
                ]
            }},
            {$lookup:{
                from:"colors",as:"color",
                let:{colorID:"$color"},
                pipeline:[
                    {$match:{$expr:{$eq:["$_id","$$colorID"]}}},
                    {$project:{name:1}}
                ]
            }},
            // {$lookup:{
            //     from:"pets",as:"pet",
            //     let:{petID:"$pet"},
            //     pipeline:[
            //         {$match:{$expr:{$eq:["$_id","$$petID"]}}},
            //         {$project:{name:1}}
            //     ]
            // }},
            {$unwind:{path:"$color",preserveNullAndEmptyArrays:true}},
            {$unwind:{path:"$owner",preserveNullAndEmptyArrays:true}},
            {$unwind:{path:"$speciesType",preserveNullAndEmptyArrays:true}},
            {$unwind:{path:"$species",preserveNullAndEmptyArrays:true}},
            {$unwind:{path:"$breed",preserveNullAndEmptyArrays:true}},
            // {$unwind:{path:"$pet",preserveNullAndEmptyArrays:true}},
            {$addFields:{friends:{$size:{$ifNull:["$friends",[]]}}}},
            {$match:{friends:largest}}
        ])
        return res.status(200).json({ success: true, data: { mostfollowingaccounts }, msg: "ok", status: 200 });
    } catch (error) {
        return next(error);
    }
});

router.get("/newpets", async (req, res, next) => {
    try {
        const d = new Date();
        const d1 = new Date().setFullYear(d.getFullYear(), d.getMonth(), d.getDay() - 7);
        const pets = await Pet.find({ createdAt: { $gt: new Date(d1) } })
        return res.status(200).json({ success: true, data: { pets }, msg: "ok", status: 200 });
    } catch (error) {
        return next(error);
    }
})

module.exports = router;