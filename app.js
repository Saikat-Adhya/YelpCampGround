const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcryptjs');
const methodOverride = require('method-override');
const session = require('express-session');
const flash = require('connect-flash');
const Campground = require('./models/campground');
const User = require('./models/user'); // User model for authentication
const dotenv = require('dotenv');

dotenv.config(); //Dot ENV Config
// Connect to MongoDB
mongoose.connect(process.env.dbURI)
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.error('MongoDB connection error:', err));

// Initialize the app
const app = express();

// Set up EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'));
app.use(session({
    secret: 'your_secret_key', // Replace with your own secret
    resave: false,
    saveUninitialized: true
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());

// Passport Configuration
passport.use(new LocalStrategy(async (username, password, done) => {
    try {
        const user = await User.findOne({ username });
        if (!user) {
            return done(null, false, { message: 'Incorrect username.' });
        }
        const isMatch = await bcrypt.compare(password, user.password);
        if (isMatch) {
            return done(null, user);
        } else {
            return done(null, false, { message: 'Incorrect password.' });
        }
    } catch (err) {
        return done(err);
    }
}));

passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
    try {
        const user = await User.findById(id);
        done(null, user);
    } catch (err) {
        done(err);
    }
});

// Middleware to ensure user is authenticated
function isLoggedIn(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    res.redirect('/login');
}

// Middleware to handle flash messages globally
app.use((req, res, next) => {
    res.locals.errorMessage = req.flash('error');
    res.locals.successMessage = req.flash('success');
    res.locals.user = req.user; // Make user available in all templates
    next();
});

// Routes

// Home Page
app.get('/', (req, res) => {
    res.render('register');
});

// Register Page
app.get('/register', (req, res) => {
    res.render('register');
});

// Register Handler
app.post('/register', async (req, res) => {
    try {
        const { username, password } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({ username, password: hashedPassword });
        await newUser.save();
        res.redirect('/login');
    } catch (err) {
        console.error(err);
        res.redirect('/register');
    }
});

// Login Page
app.get('/login', (req, res) => {
    res.render('login');
});

// Login Handler with redirection to dashboard
app.post('/login', (req, res, next) => {
    passport.authenticate('local', function (err, user, info) {
        if (err) { return next(err); }
        if (!user) {
            req.flash('error', 'Incorrect username or password');
            return res.redirect('/login');
        }
        req.logIn(user, function (err) {
            if (err) { return next(err); }
            return res.redirect('/dashboard'); // Redirect to dashboard
        });
    })(req, res, next);
});

// Logout
app.get('/logout', (req, res) => {
    req.logout((err) => {
        if (err) {
            return next(err);
        }
        res.redirect('/');
    });
});

// Dashboard Route (requires authentication)
app.get('/dashboard', isLoggedIn, (req, res) => {
    // Pass the logged-in user's information to the dashboard
    res.render('dashboard', { user: req.user });
});

// Update user information (requires authentication)
app.post('/update', isLoggedIn, async (req, res) => {
    const { username, password } = req.body;
    try {
        const user = await User.findById(req.user._id);

        // Update username
        if (username) {
            user.username = username;
        }

        // Update password if provided
        if (password) {
            const hashedPassword = await bcrypt.hash(password, 10);
            user.password = hashedPassword;
        }

        await user.save();
        req.flash('success', 'User information updated successfully');
        res.redirect('/dashboard');
    } catch (err) {
        console.error(err);
        req.flash('error', 'Error updating user information');
        res.redirect('/dashboard');
    }
});

// Delete User Account (Requires authentication)
app.delete('/delete-account', isLoggedIn, async (req, res) => {
    try {
        await User.findByIdAndDelete(req.user._id); // Delete the user account
        req.logout(); // Log out the user
        req.flash('success', 'Your account has been deleted successfully.');
        res.redirect('/'); // Redirect to home or login page
    } catch (err) {
        console.error(err);
        req.flash('error', 'Error deleting account. Please try again.');
        res.redirect('/dashboard'); // Redirect back to the dashboard
    }
});

// Campground Routes

// List all campgrounds (requires authentication)
app.get('/campgrounds', isLoggedIn, async (req, res) => {
    try {
        const campgrounds = await Campground.find({ author: req.user._id }); // Only fetch campgrounds created by the user
        res.render('campgrounds/index', { campgrounds, user: req.user }); // Pass user to the template
    } catch (err) {
        console.error(err);
        req.flash('error', 'Error fetching campgrounds.');
        res.redirect('/'); // Redirect or handle the error appropriately
    }
});

// Form to add new campground (Requires authentication)
app.get('/campgrounds/new', isLoggedIn, (req, res) => {
    res.render('campgrounds/new');
});

// Create new campground (Requires authentication)
app.post('/campgrounds', isLoggedIn, async (req, res) => {
    try {
        const campgroundData = { ...req.body.campground, author: req.user._id }; // Include the author's ID
        const campgrounds = await Campground.create(campgroundData);
        res.redirect(`/campgrounds/${campgrounds._id}`);
    } catch (err) {
        console.error(err);
        req.flash('error', 'Error creating campground.');
        res.redirect('/campgrounds/new');
    }
});

// Show a single campground
app.get('/campgrounds/:id', isLoggedIn, async (req, res) => {
    try {
        const campgrounds = await Campground.findById(req.params.id);
        // Check if the logged-in user is the author
        if (!campgrounds || !campgrounds.author.equals(req.user._id)) {
            req.flash('error', 'You do not have permission to view this campground.');
            return res.redirect('/campgrounds');
        }
        res.render('campgrounds/show', { campgrounds });
    } catch (err) {
        console.error(err);
        req.flash('error', 'Error fetching campground.');
        res.redirect('/campgrounds');
    }
});

// Edit campground form (Requires authentication)
app.get('/campgrounds/:id/edit', isLoggedIn, async (req, res) => {
    try {
        const campgrounds = await Campground.findById(req.params.id);
        // Check if the logged-in user is the author
        if (!campgrounds || !campgrounds.author.equals(req.user._id)) {
            req.flash('error', 'You do not have permission to edit this campground.');
            return res.redirect('/campgrounds');
        }
        res.render('campgrounds/edit', { campgrounds});
    } catch (err) {
        console.error(err);
        req.flash('error', 'Error fetching campground for editing.');
        res.redirect('/campgrounds');
    }
});

// Update a campground (Requires authentication)
app.put('/campgrounds/:id', isLoggedIn, async (req, res) => {
    const { id } = req.params;
    try {
        const campgrounds = await Campground.findById(id);
        // Check if the logged-in user is the author
        if (!campgrounds || !campgrounds.author.equals(req.user._id)) {
            req.flash('error', 'You do not have permission to update this campground.');
            return res.redirect('/campgrounds');
        }
        await Campground.findByIdAndUpdate(id, { ...req.body.campground });
        res.redirect(`/campgrounds/${campgrounds._id}`);
    } catch (err) {
        console.error(err);
        req.flash('error', 'Error updating campground.');
        res.redirect('/campgrounds');
    }
});

// Delete a campground (Requires authentication)
app.delete('/campgrounds/:id', isLoggedIn, async (req, res) => {
    const { id } = req.params;
    try {
        const campgrounds = await Campground.findById(id);
        // Check if the logged-in user is the author
        if (!campgrounds || !campgrounds.author.equals(req.user._id)) {
            req.flash('error', 'You do not have permission to delete this campground.');
            return res.redirect('/campgrounds');
        }
        await Campground.findByIdAndDelete(id);
        req.flash('success', 'Campground deleted successfully.');
        res.redirect('/campgrounds');
    } catch (err) {
        console.error(err);
        req.flash('error', 'Error deleting campground.');
        res.redirect('/campgrounds');
    }
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
