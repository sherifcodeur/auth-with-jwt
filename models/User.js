
// User Model


//importing external dependencies
const mongoose = require('mongoose');
const {isEmail} = require('validator');
const bcrypt = require('bcrypt');
const crypto = require('crypto');


// creating user Schema
const Schema = mongoose.Schema;
const userSchema = new Schema({

    email : {
        type:String,
        required:[true,'email is required'],
        unique:true,
        lowercase:true,
        validate:[isEmail,'Please enter a valid email']

    },

    password : {

        type:String,
        required:[true,"Please enter a password"],
        minlength :[6,"password not less than 6 characters"]

    },

    validated : {

        type:Boolean,
        default:false,
    },

    // reset password
    resetPasswordToken:String,
    resetPasswordExpire:Date,


    // verify password
    // verifyToken:String,
    // verifyTokenExpire:Date,
    

},
    
    
        // Make Mongoose use Unix time (seconds since Jan 1, 1970)
        { timestamps: true }

);


//mongoose hook fired before user saved in database - we encrypt the password
userSchema.pre('save',async function(next){

    const salt = await bcrypt.genSalt();

    this.password = await bcrypt.hash(this.password,salt);

    next();
})


// mongoose hook fired before findOneAndUpdate we update the password if it is not the same as previous
userSchema.pre('findOneAndUpdate', async function(next) {
    const docToUpdate = await this.model.findOne(this.getQuery())
  
    if (docToUpdate.password !== this._update.password) {
        
        const salt = await bcrypt.genSalt();
      const newPassword = await bcrypt.hash(this._update.password,salt);
      this._update.password = newPassword
    }
    next();
  })


  // create a reset password token and set the user resetpasswordtoken and resetpasswordexpire
  userSchema.methods.getResetPasswordToken = function(){

    // we created a reset token randomly
    const resetToken = crypto.randomBytes(20).toString("hex");

    // we generate a hash using the previous resetToken and save it in db
    this.resetPasswordToken = crypto.createHash("sha256").update(resetToken).digest("hex");

    // we save the expiration date 10 minutes from now
    this.resetPasswordExpire = Date.now() + 30 * (60*1000) ; // thirty minutes

    // we return the resetToken
    return resetToken;
}


// creating model User based on the user schema
const User = mongoose.model('user',userSchema);



//exporting the model User
module.exports = { User };