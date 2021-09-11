

const jwt  = require ('jsonwebtoken');
const {User }= require('../models/User');


const authMiddleware = (req,res,next)=>{


    const token = req.cookies.jwt;

    if(token){

        jwt.verify(token,process.env.SECRET,(err,decoded)=>{

            if(err){

                console.log(err);
                res.redirect('/login');
            }else{

                next();
            }

        });




    }else{

        // le token n'existe meme pas on redirige vars page d'acceuil
        res.redirect('/');
    }


}


const userAuth = (req,res,next)=>{


    const token = req.cookies.jwt;

    if(token){

        // on check si c le bon token
        jwt.verify(token,process.env.SECRET, async (err,decodedToken)=>{

            // il y'a erreur , le token correspond pas
            if(err){

                res.locals.user = null;
                next();

            }else{

                res.locals.user = await User.findById(decodedToken.id);
                next();
            }
        })

    }else{


        res.locals.user = null;
        next();
    }



}


module.exports = {authMiddleware ,userAuth};