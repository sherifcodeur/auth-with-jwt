// importing expternal dependencies
const { render } = require("ejs");
const { JsonWebTokenError } = require("jsonwebtoken");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

// importing User Model
const { User } = require("../models/User");

// importing controllers
const { sendVerificationMail } = require("./emailController");

// variables

// 3 days (duration of cookies)
const maxAge = 3 * 24 * 60 * 60;

// expiration of validation link 30 days
const maxValidationDuration = "30 d";

// function to handle validation form errors and return them
const handleErrors = (err) => {
  // we initialize the errors
  let errors = { email: "", password: "" };

  // error if email already exists (for signup)
  if (err.code === 11000) {
    errors.email = "email deja existant";

    return errors;
  }

  //validation errors - rules in the user schema for fields (for signup)
  if (err.message.includes("user validation failed")) {
    Object.values(err.errors).forEach(({ properties }) => {
      errors[properties.path] = properties.message;
    });

    return errors;
  }

  // email not in database (log in)
  if (err.message.includes("incorrect email")) {
    errors.email = "incorrect email";
  }

  // incorrect password for that email (log in)
  if (err.message.includes("incorrect password")) {
    errors.password = "incorrect password";
  }

  return errors;
};

// triggered by get route signup - renders the form for signing up
const signup_get = (req, res) => {
  res.render("signup", { errors: false });
};

// post route - treat the signup form
const signup_post = async (req, res) => {
  // grab email and password from form
  const { email, password } = req.body;

  // create user , save it in database and create cookie with jwt token inside
  try {
    // create and save user in database
    const user = await User.create({ email, password });

    // create token using the user id returned by database
    const token = createToken(user._id);

    // create token for validation email , token will be used in url for validation link
    const validationToken = createTokenForEmailValidation(user.email);

    console.log("le tokende validdation", validationToken);

    sendVerificationMail(user.email, validationToken);

    //store token in cookie
    res.cookie("jwt", token, { httpOnly: true, maxAge: maxAge * 1000 });
    // give success status and redirect to protected page
    res.status(201).redirect("/smoothies");
  } catch (error) {
    console.log(error);

    // if error handle signup or login errors
    const errors = handleErrors(error);

    // sends error http status and send errors to view
    res.status(400).render("signup", { errors: errors });
  }
};

// triggered by get route login and renders login form with no errors
const login_get = (req, res) => {
  res.render("login", { errors: false });
};

// post route -treat the login form
const login_post = async (req, res) => {
  // grab the email and pasword
  const { email, password } = req.body;

  // we search for user in database
  try {
    const user = await User.findOne({ email });

    // there is a user with this email in database
    if (user) {
      // we compare password entered and password in database (comparing the bcrypt)
      const auth = await bcrypt.compare(password, user.password);

      // the password entered is valid
      if (auth) {
        // creating token and adding it to cookies
        const token = createToken(user._id);
        res.cookie("jwt", token, { httpOnly: true, maxAge: maxAge * 1000 });

        //send succes http code and sends to protected route with user data
        res.status(200).render("smoothies", { user: user });

        // not the good password
      } else {
        throw Error("incorrect password");
      }

      // there is no user with this email in database
    } else {
      throw Error("incorrect email");
    }

    // we catch errors , handle them and sends them back to login form
  } catch (error) {
    const errors = handleErrors(error);

    res.status(400).render("login", { errors: errors });
  }
};

// logout form application
const logout_get = (req, res) => {
  // we grab jwt token from cookies
  const token = req.cookies.jwt;

  // if token exists we set it to nothing with 1ms duration (cannnot delete cookie directly)
  if (token) {
    res.cookie("jwt", "", { maxAge: 1 });

    // sends to homepage
    res.redirect("/");
  }
};

//verify the link from email verification
const verify_get = (req, res) => {
  let theTokenToVerify = req.params.verify;

  let { email } = jwt.decode(theTokenToVerify);

  User.findOneAndUpdate(
    { email: email },
    { validated: true },
    function (err, user) {
      if (err) {
        console.log("erreur trouver user", err);
        res.redirect("/");
      } else {
        console.log(user);
        res.redirect("/login");
      }
    }
  );
};

// create token with jwt and secret sentence and expiration date for cookie
const createToken = (id) => {
  return jwt.sign({ id }, process.env.SECRET, {
    expiresIn: maxAge,
  });
};

const createTokenForEmailValidation = (email) => {
  return jwt.sign({ email }, process.env.SECRETVALIDATION, {
    expiresIn: maxValidationDuration,
  });
};

// exporting

module.exports = {
  signup_get,
  signup_post,
  login_get,
  login_post,
  logout_get,
  verify_get,
};
