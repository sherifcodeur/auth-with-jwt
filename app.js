
// importing dependencies
const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv').config();
const cookieParser = require('cookie-parser');


//import middlewares
const {authMiddleware ,userAuth ,verifiedMiddleware} = require('./middlewares/authMiddleware');

// import routes
const authRoutes = require('./routes/authRoutes');


// initializing express application
const app = express();

// middlewares
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());



// setting up the template engine
app.set('view engine', 'ejs');




// database connection (MongoDB) and listening on port 
const dbURI = process.env.MONGODB_URL;

mongoose.connect(dbURI, { useNewUrlParser: true, useUnifiedTopology: true, useCreateIndex:true })
  .then((result) => app.listen(3000))
  .catch((err) => console.log(err));




// routes

// applying userAuth middleware to all get and post routes
app.get('*', userAuth);
app.post('*', userAuth);

// non protected routes
app.get('/', (req, res) => res.render('home'));

// routes for authentified users (protected with authMiddleware)
app.get('/smoothies', [authMiddleware,verifiedMiddleware], (req, res) => res.render('smoothies')); 

// all auth routes
app.use(authRoutes.router);