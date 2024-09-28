const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const Campground = require('./models/campground');
const methodOveride = require('method-override');

const dbURI = 'mongodb+srv://admin:admin@cluster0.bjezc.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0'; // Replace with your actual URI

mongoose.connect(dbURI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.error('MongoDB connection error:', err));
// mongoose.connect('mongodb+srv://admin:admin@cluster0.bjezc.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0');
// const db = mongoose.connection
// db.on("error",console.error.bind(console,"connection error:"));
// db.once("open",()=>{
//     console.log("database connected");
// })
const app = express();

app.set('view engine', 'ejs');
app.set('views',path.join(__dirname,'views'))
app.use(express.urlencoded({extended:true}));
app.use(methodOveride('_method'));

app.get('/',(req,res)=>{
    res.render('home.ejs')
});
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
app.get('/campgrounds/:id/edit',async(req,res)=>{
    const campgrounds = await Campground.findById(req.params.id)
    res.render('campgrounds/edit.ejs',{campgrounds});
});
app.put('/campgrounds/:id',async(req,res)=>{
    const {id} = req.params;
    const campground = await Campground.findByIdAndUpdate(id,{...req.body.campground});
    res.redirect(`/campgrounds/${campground._id}`)
});
app.delete('/campgrounds/:id',async(req,res)=>{
    const {id}= req.params;
    await Campground.findByIdAndDelete(id);
    res.redirect('/campgrounds')
})
const PORT= 3000;
app.listen(PORT,()=>{
    console.log(`server started at portnumber ${PORT}`);
})