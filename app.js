
// importing dependencies
const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv').config();
const cookieParser = require('cookie-parser');

const session = require('express-session');
const flash = require('express-flash');



//import middlewares
const {authMiddleware ,userAuth ,verifiedMiddleware} = require('./middlewares/authMiddleware');

// import routes
const authRoutes = require('./routes/authRoutes');


// initializing express application
const app = express();


let sessionStore = new session.MemoryStore;

// middlewares
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use(session({
  cookie: { maxAge: 60000 },
  store: sessionStore,
  saveUninitialized: true,
  resave: 'true',
  secret: 'secret'
}));
app.use(flash());

// Custom flash middleware -- from Ethan Brown's book, 'Web Development with Node & Express'
app.use(function(req, res, next){
  // if there's a flash message in the session request, make it available in the response, then delete it
  res.locals.sessionFlash = req.session.sessionFlash;
  delete req.session.sessionFlash;
  next();
});



// setting up the template engine
app.set('view engine', 'ejs');




// database connection (MongoDB) and listening on port 
const dbURI = process.env.MONGODB_URL;

mongoose.connect(dbURI, { useNewUrlParser: true, useUnifiedTopology: true, useCreateIndex:true,useFindAndModify: false })
  .then((result) => app.listen(3000))
  .catch((err) => console.log(err));




// routes

// applying userAuth middleware to all get and post routes
app.get('*', userAuth);
app.post('*', userAuth);

// non protected routes
app.get('/', (req, res) =>{ res.render('home')} );

// routes for authentified users (protected with authMiddleware)
app.get('/smoothies', [authMiddleware,verifiedMiddleware], (req, res) => res.render('smoothies')); 

// all auth routes
app.use(authRoutes.router);