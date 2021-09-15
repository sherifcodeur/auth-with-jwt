
// User Model


//importing external dependencies
const mongoose = require('mongoose');
const {isEmail} = require('validator');
const bcrypt = require('bcrypt');


// creating user Schema
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

    validated : {

        type:Boolean,
        default:false,
    }

},
    
    
        // Make Mongoose use Unix time (seconds since Jan 1, 1970)
        { timestamps: true }

);


//mongoose hook fired before user saved in database
userSchema.pre('save',async function(next){

    const salt = await bcrypt.genSalt();

    this.password = await bcrypt.hash(this.password,salt);

    next();
})



userSchema.pre('findOneAndUpdate', async function(next) {
    const docToUpdate = await this.model.findOne(this.getQuery())
  
    if (docToUpdate.password !== this._update.password) {
        
        const salt = await bcrypt.genSalt();
      const newPassword = await bcrypt.hash(this._update.password,salt);
      this._update.password = newPassword
    }
    next();
  })


// creating model User based on the user schema
const User = mongoose.model('user',userSchema);



//exporting the model User
module.exports = { User };