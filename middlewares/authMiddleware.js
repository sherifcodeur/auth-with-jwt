// middleware pour authentification


// importing external dependencies
const jwt  = require ('jsonwebtoken');

// importing model User
const {User }= require('../models/User');


// middleware to protect pages - routes - if applied people don't have access to them if they are not authentified
const authMiddleware = (req,res,next)=>{

    // grab token from cookies
    const token = req.cookies.jwt;

    // if token exists 
    if(token){

        // we verify authenticity of token
        jwt.verify(token,process.env.SECRET,(err,decoded)=>{

            // if error we redirect to login page
            if(err){

                console.log(err);

                res.redirect('/login');

            // we allow access
            }else{

                next();
            }

        });



    // token doesn't exist we redirect to homepage
    }else{

        
        res.redirect('/');
    }


}


// middleware give access to user data if logged user - null if not authentified
const userAuth = (req,res,next)=>{

    

    // grab token
    const token = req.cookies.jwt;

    // if token exists
    if(token){

        // check if it is the good token - if present decode the token
        jwt.verify(token,process.env.SECRET, async (err,decodedToken)=>{

            // the token is not verified we set the user data to null
            if(err){
                
                res.locals.user = null;
                next();

            // the cookie exists we grab user data in database using its id (retrieved from the decoded token)
            }else{

                let user = await User.findById(decodedToken.id);
                res.locals.user = user;

                next();
            }
        })

    // the token doesn't exist we set user data to null
    }else{

        
        res.locals.user = null;

        next();
    }



};


// exporting 

module.exports = {authMiddleware ,userAuth};