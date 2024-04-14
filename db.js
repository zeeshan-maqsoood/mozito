const mongoose = require('mongoose');
const config= require("./config");
const connectDB = async () => {
    try {
        await mongoose.connect(config.db.PROD, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            useFindAndModify: false,
            useCreateIndex: true
        })
        console.log(`DB connected`)
    }
    catch (e) {
        mongoose.connection.on("error", (err) => {
            console.log(`DB not Connected ${err.message}`)
        })
    }
}

mongoose.set('debug', true);
module.exports = connectDB;