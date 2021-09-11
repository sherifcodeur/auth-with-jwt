const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv').config();
const cookieParser = require('cookie-parser');
const {authMiddleware ,userAuth} = require('./middlewares/authMiddleware');

const authRoutes = require('./routes/authRoutes');


const app = express();

// middleware
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));

app.use(cookieParser());

// app.use(express.urlencoded());



// view engine
app.set('view engine', 'ejs');

// database connection


const dbURI = process.env.MONGODB_URL;

mongoose.connect(dbURI, { useNewUrlParser: true, useUnifiedTopology: true, useCreateIndex:true })
  .then((result) => app.listen(3000))
  .catch((err) => console.log(err));




// routes
app.get('*',userAuth);
app.get('/', (req, res) => res.render('home'));
app.get('/smoothies', authMiddleware, (req, res) => res.render('smoothies')); 
app.use(authRoutes.router);