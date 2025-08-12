const mongoose = require('mongoose')

require('dotenv').config()

module.exports = (connect) = async (req, res) => {
    try {
        const response = await mongoose.connect(process.env.MONGO_DB_URL)
        if (response) {
            //console.log("Database Connected Successfully.");
        } else {
            //console.log("Failed to connect database!");
        }
    } catch (error) {
        //console.log("Mongoose Connection Error: ", error);
    }
}