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
app.use(express.urlencoded({extended:true}))

app.get('/',(req,res)=>{
    res.render('home.ejs')
});
// app.get('/make',async (req,res)=>{
// const prod = await Campground.create({title:'lo',price:'fkf'})
// res.send(prod) 
// })
app.get('/campgrounds',async (req,res)=>{
    const campgrounds = await Campground.find({})
    res.render('campgrounds/index',{campgrounds});
});
app.get('/campgrounds/new',(req,res)=>{
    res.render('campgrounds/new')
});
app.post('/campgrounds', async (req, res) => {
    const campground = await Campground.create(req.body.campground);
    res.redirect(`/campgrounds/${campground._id}`)
})
app.get('/campgrounds/:id',async (req,res)=>{
    const {id} =req.params
    const campgrounds = await Campground.findById(req.params.id)
    res.render('campgrounds/show.ejs',{campgrounds});
});
app.listen(3000,()=>{
    console.log('server started at portnumber 3000');
})