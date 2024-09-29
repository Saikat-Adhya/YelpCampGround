const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const CampgroundSchema = new Schema({
    title: {
        type: String,
        required: [true, "Please enter a valid title"],
    },
    price: {
        type: String,
        required: [true, "Please enter the price"], // Optionally, make price required
    },
    location:{
        type:String,
        required:[true, "Please enter City name"]
    },
    author: {
        type: Schema.Types.ObjectId,
        ref: 'User', // Reference to the User model
        required: true, // Ensures that every campground must have an author
    },
}, { timestamps: true }); // Automatically add createdAt and updatedAt fields

module.exports = mongoose.model('Campground', CampgroundSchema);