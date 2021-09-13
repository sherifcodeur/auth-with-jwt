// Routes for Auth

// import external dependencies
const express = require('express');

// using the router from express
const router = express.Router();

// importing Auth controllers
const authControllers = require('../controllers/authControllers');

// importing middlewares
const {visitorMiddleware} = require('../middlewares/authMiddleware');


// All the routes for Auth
router.get('/signup',visitorMiddleware,authControllers.signup_get);
router.post('/signup',authControllers.signup_post);
router.get('/login',visitorMiddleware,authControllers.login_get);
router.post('/login',authControllers.login_post);
router.get('/logout',authControllers.logout_get);

router.get('/verify/:verify',authControllers.verify_get);


// exports all the routes with router
module.exports = {router};



