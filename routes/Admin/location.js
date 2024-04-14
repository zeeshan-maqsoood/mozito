const router = require("express").Router();
const { isStateAdder, isCityAdder, isAdmin, isCountryAdder } = require("../../middlewares/adminAuth");
const { stateValidator, cityValidator, NameValidator } = require("../../validator");
const { State, City, Country } = require("../../models");

const { validationResult } = require("express-validator");
const constant = require("../../constants");
const cache = require("../../utils/cache");
const Log4js = require("log4js");
const logger = Log4js.getLogger("state.js");
logger.level = "all";

router.post("/addCountry", NameValidator, async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return next({ status: 400, error: errors.mapped(), msg: "Validation Failed" })
        }
        cache.del(constant.COUNTRIES);
        let country;
        country = await Country.findOne({ name: req.body.name });
        if (country) return next({ status: 409, msg: "Country already added" })
        country = new Country(req.body);
        country.addedBy = req.user._id;
        await country.save();
        return res.status(200).json({ success: true, data: { country }, msg: "ok", status: 200 });
    } catch (error) {
        return next(error);
    }
});

router.get("/allCountries", async (req, res, next) => {
    try {
        const perPage = Number(req.query.perPage || 0);
        const pageNo = Number(req.query.pageNo || 10);
        let count;
        // let countries = cache.get(constant.COUNTRIES);
        if (req.query.search) {
            const query = RegExp(req.query.search || "", "ig")
            count = await Country.find({ $or: [{ name: query }] }).countDocuments();
            countries = await Country.aggregate()
                .match({ $or: [{ name: query }] })
                .lookup({
                    from: 'states',
                    localField: '_id',
                    foreignField: 'country',
                    as: 'states'
                })
                .addFields({
                    states: { $size: "$states" }
                })
                .project({ addedBy: true, name: true, states: true })
                .sort({ name: 1 })
                .skip((pageNo === 0 || pageNo === 1 || pageNo <= 1) ? 0 : pageNo * perPage)
                .limit(perPage || 10)
            await Country.populate(countries, { path: "addedBy", select: "username" })
        }
        else {
            count = await Country.find().countDocuments();
            countries = await Country.aggregate()
                .lookup({
                    from: 'states',
                    localField: '_id',
                    foreignField: 'country',
                    as: 'states'
                })
                .addFields({
                    states: { $size: "$states" }
                })
                .project({ addedBy: true, name: true, states: true })
                .sort({ name: 1 })
                .skip((pageNo === 0 || pageNo === 1 || pageNo <= 1) ? 0 : pageNo * perPage)
                .limit(perPage || 10)
            await Country.populate(countries, { path: "addedBy", select: "username" })
        }
        return res.status(200).json({ success: true, data: { countries, count }, msg: "ok", status: 200 });
    } catch (error) {
        return next(error);
    }
});


router.route("/country/:id")
    .put(isCountryAdder, NameValidator, async (req, res, next) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return next({ status: 400, error: errors.mapped(), msg: "Validation Failed" })
            }
            cache.del(constant.COUNTRIES);
            let country;
            country = await Country.findOneAndUpdate({ _id: req.params.id }, { name: req.body.name }, { new: true });
            if (!country) return next({ status: 404, msg: "country not found" })
            return res.status(200).json({ success: true, data: { country }, msg: "ok", status: 200 });
        } catch (error) {
            return next(error);
        }
    })
    .delete(isCountryAdder, async (req, res, next) => {
        try {
            cache.del(constant.COUNTRIES);
            const country = await Country.findById(req.params.id);
            if (!country) return next({ status: 404, msg: "country not found" });
            await country.remove();
            return res.status(200).json({ success: true, data: { msg: "country Deleted" }, msg: "ok", status: 200 });
        } catch (error) {
            return next(error);
        }
    })
    .get(async (req, res, next) => {
        try {
            const country = await Country.findOne({ _id: req.params.id }).select({ __v: false, addedBy: false });
            if (!country) return next({ status: 404, msg: "Country not Found" });
            return res.status(200).json({ success: true, data: { country }, msg: "ok", status: 200 });
        } catch (error) {
            return next(error);
        }
    })



router.post("/addState", stateValidator, async (req, res, next) => {
    try {
        const keys = cache.keys();
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return next({ status: 400, error: errors.mapped(), msg: "Validation Failed" })
        }
        cache.del(constant.COUNTRIES);
        keys.forEach(value => {
            value.startsWith(constant.STATES) && cache.del(value);
        });
        let state;
        state = await State.findOne({ name: req.body.name });
        if (state) return next({ status: 409, msg: "State already added" })
        state = new State(req.body);
        state.addedBy = req.user._id;
        await state.save();
        return res.status(200).json({ success: true, data: { state }, msg: "ok", status: 200 });
    } catch (error) {
        return next(error);
    }
})
router.get("/allState", async (req, res, next) => {
    try {
        let states;
        const perPage = Number(req.query.perPage || 0);
        const pageNo = Number(req.query.pageNo || 10);
        const query = RegExp(req.query.search || "", "i");
        // states = await State.aggregate([
        //     {
        //         $match: {
        //             name: query
        //         }
        //     },
        //     {
        //         $lookup:
        //         {
        //             from: 'cities',
        //             localField: '_id',
        //             foreignField: 'state',
        //             as: 'cities'
        //         }
        //     },
        //     {
        //         $addFields: {
        //             cities: { $size: "$cities" }
        //         }
        //     },
        //     {
        //         $project: { addedBy: true, name: true, cities: true }
        //     },
        //     {
        //         $sort: { name: 1 }
        //     },
        //     {
        //         $skip: (pageNo === 0 || pageNo === 1 || pageNo <= 1) ? 0 : pageNo * perPage
        //     },
        //     {
        //         $limit: perPage || 10
        //     }
        // ]);
        states = await State.find({ name: query })
            .sort({ name: 1 })
            .skip((pageNo === 0 || pageNo === 1 || pageNo <= 1) ? 0 : pageNo * perPage)
            .limit(perPage || 10)
        // const cities = await City.find().select("state name");
        // let newlist = states.map(state => {
        //     const total = cities.filter(li => {
        //         // return li.state.toString() === state._id.toString()
        //         console.log(state._id.toString(), "=== ", li.state.toString())
        //         return state._id.toString() === li.state.toString();
        //     })
        //     return {
        //         _id: state._id,
        //         total: total.length,
        //         name: state.name
        //     }
        // })

        let count = await State.find({ name: query }).countDocuments()
        await State.populate(states, { path: "addedBy", select: "username" })
        return res.status(200).json({ success: true, data: { states, count }, msg: "ok", status: 200 });
    } catch (error) {
        return next(error);
    }
});
router.get("/statebycountry/:country", async (req, res, next) => {
    try {
        let states = cache.get(`${constant.STATES}-${req.params.country}`);
        if (!states) {
            states = await State.find({ country: req.params.country });
            cache.set(`${constant.STATES}-${req.params.country}`);
        }
        return res.status(200).json({ success: true, data: { states }, msg: "ok", status: 200 });

    } catch (error) {
        return next(error);
    }
})
router.route("/state/:id")
    .put(isStateAdder, NameValidator, async (req, res, next) => {
        try {
            const keys = cache.keys()
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return next({ status: 400, error: errors.mapped(), msg: "Validation Failed" })
            }
            cache.del(constant.COUNTRIES);
            keys.forEach(value => {
                value.startsWith(constant.STATES) && cache.del(value);
            });
            let state;
            state = await State.findOne({ name: req.body.name });
            if (state) return next({ status: 409, msg: "State already added" })
            state = await State.findByIdAndUpdate(req.params.id, { name: req.body.name }, { new: true });
            return res.status(200).json({ success: true, data: { state }, msg: "ok", status: 200 });
        } catch (error) {
            return next(error);
        }
    })
    .delete(isStateAdder, async (req, res, next) => {
        try {
            const keys = cache.keys()
            cache.del(constant.COUNTRIES);
            keys.forEach(value => {
                value.startsWith(constant.STATES) && cache.del(value);
            });
            const state = await State.findById(req.params.id);
            if (!state) return next({ status: 404, msg: "state not found" });
            await state.remove();
            return res.status(200).json({ success: true, data: { msg: "State Deleted" }, msg: "ok", status: 200 });
        } catch (error) {
            return next(error);
        }
    })
    .get(async (req, res, next) => {
        try {
            const state = await State.findOne({ _id: req.params.id }).select({ __v: false, addedBy: false });
            if (!state) return next({ status: 404, msg: "State not Found" });
            return res.status(200).json({ success: true, data: { state }, msg: "ok", status: 200 });
        } catch (error) {
            return next(error);
        }
    })


router.get("/allcities", async (req, res, next) => {
    try {
        const perPage = Number(req.query.perPage || 0);
        const pageNo = Number(req.query.pageNo || 10);
        let cities;
        let count;
        if (req.query.search) {
            const query = RegExp(req.query.search || "", "ig")
            count = await City.find({ $or: [{ name: query }] }).countDocuments();
            cities = await City.find({ $or: [{ name: query }] }).select({ password: false })
                .select({ addedBy: false, __v: false })
                .populate("state", "name")
                .sort({ name: 1 })
                .skip((pageNo === 0 || pageNo === 1 || pageNo <= 1) ? 0 : pageNo * perPage)
                .limit(perPage || 10);
        }
        else {
            count = await City.find().countDocuments();
            cities = await City.find().select({ password: false })
                .select({ addedBy: false, __v: false })
                .populate("state", "name")
                .sort({ name: 1 })
                .skip((pageNo === 0 || pageNo === 1 || pageNo <= 1) ? 0 : pageNo * perPage)
                .limit(perPage || 10);
        }

        return res.status(200).json({ success: true, data: { cities, count }, msg: "ok", status: 200 });
    } catch (error) {
        return next(error);
    }
});

router.post("/addCity", cityValidator, async (req, res, next) => {
    try {
        const keys = cache.keys()
        cache.del(constant.COUNTRIES);

        keys.forEach(value => {
            value.startsWith(constant.STATES) && cache.del(value);
        });
        keys.forEach(value => {
            value.startsWith(constant.CITIES) && cache.del(value);
        });
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return next({ status: 400, error: errors.mapped(), msg: "Validation Failed" })
        }
        let city;
        city = await City.findOne({ name: req.body.name });
        if (city) return next({ status: 409, msg: "city already added to state" })
        city = new City(req.body);
        city.addedBy = req.user._id;
        await city.save();
        return res.status(200).json({ success: true, data: { city }, msg: "ok", status: 200 });
    } catch (error) {
        return next(error);
    }
});

router.get("/citybystate/:state", async (req, res, next) => {
    try {
        const cities = await City.find({ state: req.params.state });
        return res.status(200).json({ success: true, data: { cities }, msg: "ok", status: 200 });

    } catch (error) {
        return next(error);
    }
})
router.route("/city/:id")
    .put(isCityAdder, NameValidator, async (req, res, next) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return next({ status: 400, error: errors.mapped(), msg: "Validation Failed" })
            }
            let city;
            city = await City.findOne({ name: req.body.name });
            city = await City.findByIdAndUpdate(req.params.id, { ...req.body }, { new: true });
            return res.status(200).json({ success: true, data: { city }, msg: "ok", status: 200 });
        } catch (error) {
            return next(error);
        }
    })
    .delete(isCityAdder, async (req, res, next) => {
        try {
            const city = await City.findById(req.params.id);
            if (!city) return next({ status: 404, msg: "city not found" });
            await city.remove();
            return res.status(200).json({ success: true, data: { msg: "City Deleted" }, msg: "ok", status: 200 });
        } catch (error) {
            return next(error);
        }
    })
    .get(async (req, res, next) => {
        try {
            const city = await City.findOne({ _id: req.params.id }).select({ __v: false, addedBy: false });
            if (!city) return next({ status: 404, msg: "City not Found" })
            return res.status(200).json({ success: true, data: { city }, msg: "ok", status: 200 });
        } catch (error) {
            return next(error);
        }
    })

module.exports = router;