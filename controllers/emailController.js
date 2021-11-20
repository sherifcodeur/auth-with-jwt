"use strict";

const nodemailer = require("nodemailer");
const ejs = require("ejs");


let sender = process.env.APP_NAME ;


 const transport = nodemailer.createTransport({

        service: "Gmail",
        auth:{
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASSWORD,
        }
    });




const sendTemplatedMail = async (email,validationToken,typeOfEmail,topic)=>{

   

    
    let urlpart = `${process.env.APP_URL}/${typeOfEmail}/${validationToken}` ;

    ejs.renderFile(`./views/admin/emails/${typeOfEmail}.ejs`, { name: email ,appname: process.env.APP_NAME,url:urlpart }, function (err, data) {


        if(err){

            console.log(err);


        }else{

            let mailOptions = {
        
                from: sender,
                to: email,
                subject : `${topic} ${sender}`,
                html:data, 
        
        
            }

            transport.sendMail(mailOptions,function(err,response){

                if(err){
        
                    console.log("sending email error",err)
                }else{
        
                    console.log("message sent");
                }
        
        
            });



        }
    })



}


// const sendNewEmail = async (email,newpassword,typeOfEmail,topic)=>{

//     ejs.renderFile(`./views/admin/emails/${typeOfEmail}.ejs`, { email: email ,appname: process.env.APP_NAME,password:newpassword }, function (err, data) {



//         if(err){

//             console.log(err);


//         }else{

//             let mailOptions = {
        
//                 from: sender,
//                 to: email,
//                 subject : `${topic} ${sender}`,
//                 html:data, 
        
        
//             }

//             transport.sendMail(mailOptions,function(err,response){

//                 if(err){
        
//                     console.log("sending email error",err)
                    
//                 }else{
        
//                     console.log("message sent");
//                 }
        
        
//             });

//         }

//     })

// }

module.exports = {sendTemplatedMail};