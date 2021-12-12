// Routes for Auth

// import external dependencies
const express = require('express');

// using the router from express
const router = express.Router();

// importing Auth controllers
const authControllers = require('../controllers/authControllers');

// importing middlewares
const {visitorMiddleware,authMiddleware} = require('../middlewares/authMiddleware');


// All the routes for Auth
router.get('/signup',visitorMiddleware,authControllers.signup_get);
router.post('/signup',authControllers.signup_post);
router.get('/login',visitorMiddleware,authControllers.login_get);
router.post('/login',authControllers.login_post);
router.get('/logout',authControllers.logout_get);

router.get('/verify/:verify',authMiddleware,authControllers.verify_get);

router.get('/reset-password',authControllers.resetpasswordform_get);
router.post('/reset-password',authControllers.resetpassword_post);


router.get('/reset/:reset',authControllers.resetpasswordform);
router.post('/reset/:reset',authControllers.resetpassword);



// exports all the routes with router
module.exports = {router};



