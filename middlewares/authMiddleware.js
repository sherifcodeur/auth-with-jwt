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

// middleware to protect page from non verified user - it has to be used with authmiddleware
const verifiedMiddleware = (req,res,next)=>{

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

            // we check if is verified user
            }else{

                let id = decoded.id;

                User.findById(id,(err,user)=>{

                    // err there is no user
                    if(err){

                       res.redirect('/');
                    
                    // there is a user
                    } else {

                       if(user != null){
                            // if user is verified we give access
                                                    if(user.validated){

                                                        next();
                                                    
                                                    // the user exists but is not verified
                                                    }else{

                                                        res.render('verify', { expressFlash: req.flash('success')});
                                                    }

                       }else{

                        res.redirect('/');


                       }

                        
                    }
                })

              
            }

        });

        
     // there is no token we redirect to homepage 
     }else{

        redirect('/');

     }

}


// middleware give access to user data in views if logged user - null if not authentified
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


// to protect pages from already authentified users
const visitorMiddleware = (req,res,next) =>{

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
                    console.log("par la");
                   let user = await User.findById(decodedToken.id);

                   // didn't finnd a user
                   if(user === null || user === undefined){

                        next();

                       // found user
                   }else{

                     res.locals.user = user;                    
                     // we redirect the logged user home we don't allow him to access this
                    res.redirect('/');
                   }
                   
                }
            })
    
        // the token doesn't exist we set user data to null
        }else{
    
            
            res.locals.user = null;
    
            next();
        }


}


// exporting 

module.exports = {authMiddleware ,userAuth,verifiedMiddleware,visitorMiddleware};