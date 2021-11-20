
// importing expternal dependencies

const { JsonWebTokenError } = require("jsonwebtoken");
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const crypto = require('crypto')


// importing User Model
const {User }= require('../models/User');

// importing controllers
const {sendTemplatedMail} = require('./emailController');

// variables

// 3 days (duration of cookies)
const maxAge = 3*24*60*60 ;

// expiration of VERIFICATION EMAIL link 90 days
const maxValidationDuration = "90 d";


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

             //console.log("le tokende validdation",validationToken);

             sendTemplatedMail(user.email,validationToken,"verify","Verify Email Account for");

            //store token in cookie
            res.cookie('jwt',token,{httpOnly:true,maxAge:maxAge*1000});
            // give success status and redirect to protected page
            req.flash('success', 'We sent you a link to verify your Account.');
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
                    req.flash('success', 'You need to verity your account by clicking on the link sent to you.')
                    res.status(200).render('verify',{'user':user, expressFlash: req.flash('success')});
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

            //needs to send an error expired or invalid link please retry
            if(err){

                    // if there is an expiration error we resend a link and show the message
                    if(err.message == "jwt expired"){
                        req.flash('expired', 'your link was expired - we sent you a new link please check your email account');

                        let dec = jwt.decode(theTokenToVerify);
                        console.log(dec.email);

                        // create token for validation email , token will be used in url for validation link
                        const validationToken = createTokenForEmailValidation(dec.email);

                        console.log("le tokende validdation",validationToken);

                        sendTemplatedMail(dec.email,validationToken,"verify","Verify Email Account for");

                        res.render('verify', {expressFlash: req.flash('expired')});
                    
                    // there is an other type of error we redirect home
                    }else{

                        res.redirect('/');
                    }
                    
                   
            // the jwt token is valid and has been decoded
            }else{

                    // search and update user to a validated one
                    User.findOneAndUpdate({email:decoded.email}, {validated:true} ,function(err,user){

                                // user not found or other errors we redirect home
                                if(err){

                                    console.log("user not found",err);
                                    res.redirect('/');
                                
                                // user found we redirect to login page the user has been validated
                                }else{

                                    console.log(user);
                                    res.redirect('/login');

                                }            

                            })

            }
        });
       
}


// shwows the form sending email reset link
const resetpasswordform_get = (req,res)=>{

    res.render('reset-form',{'errors':false});
}

// send email for resetting email
const resetpassword_post = async (req,res)=>{
    
    // we grab the email from request
    let {email} = req.body;

    // we check if exists in database
    User.findOne({email:email},async function(err,user) {

        if(err){

            console.log("erreur pas d user");
           
            // the error don't say that there is no user to not give info on database
            res.render('reset-form', errors= {email:"servor error please try later"})
        }else{
            // a user has been found
            if(user){

                console.log("on a un user")
                // we encode a token to be sent with the url and create date limit and add it to user
                const resetToken = user.getResetPasswordToken();

                // we save user in database
                await user.save()                

                //we send the email
                sendTemplatedMail(user.email,resetToken,"reset","Password Reset for ");

                // we notify the user that the email was sent
                res.render('reset-form', errors= {email:"email sent -> check your email"})

            // no user has been found
            }else{

                // error the email doesn't exists 
                res.render('reset-form', errors= {email:"email error - try again"})
            }
            

        }

    })


   
}

// treat the new password coming from the password reset form and the token given by email
const resetpassword = async (req,res,next)=>{

    // we take the parameters reset form the link
    const receivedToken = req.params.reset;

    // we check the validity of the token

    const resetPasswordToken = crypto.createHash("sha256").update(receivedToken).digest("hex");

      // on check if there is a user in database with this token 

      try {

         const user = await User.findOne({
           
          resetPasswordToken,
          resetPasswordExpire: { $gt: Date.now() }
        
        })

        if(!user){

         res.render('reset-form', errors= {email:"the link has expired please enter email again"})
         
        }

        user.password = req.body.password
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;
        await user.save();

        res.redirect('/login')

    }catch{

        console.log("erreur")

        res.render('reset-form', errors= {email:"servor error try again later"})
        
    }

}


// this form allows the user to enter the new password
const resetpasswordform = (req,res)=>{

    res.render('update-password',{'errors':false,'reset':req.params.reset});

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
    resetpassword,
    resetpasswordform,
}