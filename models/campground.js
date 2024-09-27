const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const CampgroundSchema = new Schema({
    title:{
        type:String,
        required:[true, "Please enter Correct title"],
    },
    price: String,
    description:String,
    location:{
        type:String,
        required:[true, "Please enter City name"]
    }
});

module.exports=mongoose.model('campground',CampgroundSchema);