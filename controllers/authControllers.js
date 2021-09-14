
// importing expternal dependencies
const { render } = require("ejs");
const { JsonWebTokenError } = require("jsonwebtoken");
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');


// importing User Model
const {User }= require('../models/User');

// importing controllers
const {sendVerificationMail, sendTemplatedMail} = require('./emailController');

// variables

// 3 days (duration of cookies)
const maxAge = 3*24*60*60 ;

// expiration of VERIFICATION EMAIL link 30 days
const maxValidationDuration = "30 s";

//expiration of link for reset password
const maxValidationForReset = "30 m";


// function to handle validation form errors and return them
const handleErrors = (err)=>{

    
    // we initialize the errors 
    let errors = {email:'',password:''};

    // error if email already exists (for signup)
    if(err.code === 11000){

        errors.email = "email deja existant";

        return errors;
    }


    //validation errors - rules in the user schema for fields (for signup)
    if(err.message.includes("user validation failed")){

        Object.values(err.errors).forEach(( {properties})=>{

            errors[properties.path] = properties.message;

        });

        return errors;
    }

    // email not in database (log in)
    if(err.message.includes('incorrect email')){

        errors.email = "incorrect email";
       
    }

    // incorrect password for that email (log in)
    if(err.message.includes('incorrect password')){

        errors.password = "incorrect password";
       
    }

    return errors;

}



// triggered by get route signup - renders the form for signing up
const signup_get = (req,res)=>{

    res.render('signup',{'errors':false});

}


// post route - treat the signup form
const signup_post = async (req,res)=>{
    

        // grab email and password from form
        const {email,password} = req.body;

        // create user , save it in database and create cookie with jwt token inside
        try {
            // create and save user in database
            const user = await User.create({email,password});

            // create token using the user id returned by database
            const token = createToken(user._id);
            

            // create token for validation email , token will be used in url for validation link
             const validationToken = createTokenForEmailValidation(user.email);

             console.log("le tokende validdation",validationToken);

             sendTemplatedMail(user.email,validationToken,"verify","Verify Email Account for");

            //store token in cookie
            res.cookie('jwt',token,{httpOnly:true,maxAge:maxAge*1000});
            // give success status and redirect to protected page
           
            res.status(201).redirect('/smoothies');
            
        } catch (error) {

            console.log(error);

           // if error handle signup or login errors
            const errors = handleErrors(error);
            
            // sends error http status and send errors to view
            res.status(400).render('signup',{'errors':errors});
            
        }

}

// triggered by get route login and renders login form with no errors
const login_get = (req,res)=>{

    res.render('login',{'errors':false});
}



// post route -treat the login form
const login_post = async (req,res)=>{

    // grab the email and pasword    
    const {email,password} = req.body;


    // we search for user in database
    try {
        const user = await User.findOne({email});

        // there is a user with this email in database
        if(user){

            
            // we compare password entered and password in database (comparing the bcrypt)
            const auth = await bcrypt.compare(password,user.password);

           
            // the password entered is valid
            if(auth){

                // creating token and adding it to cookies
                const token = createToken(user._id);
                res.cookie('jwt',token,{httpOnly:true,maxAge:maxAge*1000});

                //send succes http code and sends to protected route with user data 
                if(user.validated){

                    res.status(200).render('smoothies',{'user':user});
                }else{

                    res.status(200).render('verify',{'user':user});
                }
                

            // not the good password
            }else{
        
                throw Error('incorrect password');
            }

        // there is no user with this email in database    
        }else{

            throw Error('incorrect email');

        }
        
    // we catch errors , handle them and sends them back to login form    
    } catch (error) {
       
         const errors = handleErrors(error);
       
         res.status(400).render('login',{'errors':errors});
        
    }

}


// logout form application
const logout_get = (req,res)=>{

    // we grab jwt token from cookies
    const token = req.cookies.jwt;

    // if token exists we set it to nothing with 1ms duration (cannnot delete cookie directly)
    if(token){

        res.cookie('jwt','',{maxAge:1});

        // sends to homepage
        res.redirect('/');
    }

}

//verify the link from email verification
const verify_get = (req,res)=>{

        let theTokenToVerify = req.params.verify;

        jwt.verify(theTokenToVerify,process.env.SECRETVALIDATION,function(err,decoded){

            //needs to send an error expired or invlaid link please retry
            if(err){

                    console.log(err);
                    res.redirect('/');

            }else{


                    User.findOneAndUpdate({email:decoded.email}, {validated:true} ,function(err,user){

                                if(err){

                                    console.log("erreur trouver user",err);
                                    res.redirect('/');

                                }else{

                                    console.log(user);
                                    res.redirect('/login');

                                }            

                            })




            }
        });



       
}


// shwows the form for reset password
const resetpasswordform_get = (req,res)=>{

    res.render('reset-form',{'errors':false});
}

// treat the form and sends email for resetting password when clicked
const resetpassword_post = (req,res)=>{
    
    // we grab the email from request
    let {email} = req.body;

    // we check if exists in database
    User.findOne({email:email},function(err,user) {

        if(err){

            console.log("erreur pas d user");
        }else{

            // we encode a token to be sent with the url
            let tokenForPasswordReset = createTokenForResetLink(email);

            //we send the email
            sendTemplatedMail(user.email,tokenForPasswordReset,"reset","Password Reset for ");

            // we need to send to some page
            res.status(204).send();

        }

    })


    


    


   
}

// treat the incoming click of the link already sent by email- reset password and send it by email
const resetpassword_get = (req,res)=>{

    // we take the parameters reset form the link

    // we check the validity of the token


    // with decode values we see if it still valid in time 

    // if valid in time we reset password and send it to user email

    // else we say than link is no more valid and ask to send new nofication link

}


// create token with jwt and secret sentence and expiration date for cookie
const createToken = (id)=>{    

    return jwt.sign({id},process.env.SECRET,{

        expiresIn:maxAge,
    });
}


// we create token for email validation -verification
const createTokenForEmailValidation = (email)=>{

    return jwt.sign({email},process.env.SECRETVALIDATION,{

        expiresIn:maxValidationDuration,
    });
}


// we create token for reset link
const createTokenForResetLink = (email)=>{

    return jwt.sign({email},process.env.SECRETVALIDATION,{

        expiresIn:maxValidationForReset,
    });
}




// exporting 

module.exports = {

    signup_get,
    signup_post,
    login_get,
    login_post,
    logout_get,
    verify_get,
    resetpasswordform_get,
    resetpassword_post,
    resetpassword_get,
}