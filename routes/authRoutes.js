

const express = require('express');

const router = express.Router();

const authControllers = require('../controllers/authControllers');



router.get('/signup',authControllers.signup_get);
router.post('/signup',authControllers.signup_post);
router.get('/login',authControllers.login_get);
router.post('/login',authControllers.login_post);
router.get('/logout',authControllers.logout_get);



module.exports = {router};



