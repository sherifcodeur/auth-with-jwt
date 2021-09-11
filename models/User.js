

const mongoose = require('mongoose');
const {isEmail} = require('validator');

const bcrypt = require('bcrypt');
const Schema = mongoose.Schema;






const userSchema = new Schema({

    email : {
        type:String,
        required:[true,'oui c requies roger'],
        unique:true,
        lowercase:true,
        validate:[isEmail,'entre un email valide mec']

    },

    password : {

        type:String,
        required:[true,"faut rentrer un pass"],
        minlength :[6,"pas moins de 6 carateres"]

    },


});

userSchema.post('save',function(doc,next){

    

    next();
});

userSchema.pre('save',async function(next){

    const salt = await bcrypt.genSalt();
    this.password = await bcrypt.hash(this.password,salt);

    next();
})


const User = mongoose.model('user',userSchema);


module.exports = { User };