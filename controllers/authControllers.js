const { render } = require("ejs");
const { JsonWebTokenError } = require("jsonwebtoken");
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

const {User }= require('../models/User');



const handleErrors = (err)=>{

    //console.log(err.message,err.code);

    let errors = {email:'',password:''};


    if(err.code === 11000){


        errors.email = "email deja existant";

        return errors;
    }




    if(err.message.includes("user validation failed")){

        Object.values(err.errors).forEach(( {properties})=>{

            errors[properties.path] = properties.message;

        });

        return errors;
    }

    if(err.message.includes('incorrect email')){

        errors.email = "incorrect email";

       
    }

    if(err.message.includes('incorrect password')){

        errors.password = "incorrect password";

       
    }

        return errors;

}


const signup_get = (req,res)=>{

    res.render('signup',{'errors':false});

}


const signup_post = async (req,res)=>{

        
        const {email,password} = req.body;

        try {
            const user = await User.create({email,password});
            const token = createToken(user._id);
            res.cookie('jwt',token,{httpOnly:true,maxAge:maxAge*1000});

            res.status(201).redirect('/smoothies');
            
        } catch (error) {

           
            const errors = handleErrors(error);
            console.log(errors);
            res.status(400).render('signup',{'errors':errors});
            
        }

}


const login_get = (req,res)=>{

    res.render('login',{'errors':false});
}


const login_post = async (req,res)=>{

        
    const {email,password} = req.body;



    try {
        const user = await User.findOne({email});

        if(user){

            console.log("y a un user");
            
            const auth = await bcrypt.compare(password,user.password);

            console.log("auth,auth",auth);

            if(auth){

                const token = createToken(user._id);
                        res.cookie('jwt',token,{httpOnly:true,maxAge:maxAge*1000});

                        
                        res.status(200).render('smoothies',{'user':user});

            }else{
        
                throw Error('incorrect password');
            }

            
        }else{

            throw Error('incorrect email');
        }
        
        
    } catch (error) {

       console.log(error.message);
         const errors = handleErrors(error);
        // console.log(errors);
         res.status(400).render('login',{'errors':errors});
        
    }

}

const logout_get = (req,res)=>{

    console.log("we logout");

    const token = req.cookies.jwt;

    if(token){

        res.cookie('jwt','',{maxAge:1});
        res.redirect('/');
    }

}

// environ 3 jours
const maxAge = 3*24*60*60 ;
const createToken = (id)=>{

    

    return jwt.sign({id},process.env.SECRET,{

        expiresIn:maxAge,
    });
}


module.exports = {

    signup_get,
    signup_post,
    login_get,
    login_post,
    logout_get
}