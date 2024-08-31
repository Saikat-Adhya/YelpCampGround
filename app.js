const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const Campground = require('./models/campground');

mongoose.connect('mongodb://localhost:27017/yelp_camp');
const db = mongoose.connection
db.on("error",console.error.bind(console,"connection error:"));
db.once("open",()=>{
    console.log("database connected");
})
const app = express();

app.set('view engine', 'ejs');
app.set('views',path.join(__dirname,'views'))

app.get('/',(req,res)=>{
    res.render('home.ejs')
});
app.get('/make',async (req,res)=>{
const prod = await Campground.create({title:'lo',price:'fkf'})
res.send(prod) 
})
app.listen(3000,()=>{
    console.log('server started at portnumber 3000');
})