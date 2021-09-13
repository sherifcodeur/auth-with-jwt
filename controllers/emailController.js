"use strict";

const nodemailer = require("nodemailer");

const sendVerificationMail = async (email, validationToken) => {
  const transport = nodemailer.createTransport({
    service: "Gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  });

  let sender = process.env.APP_NAME;

  let mailOptions = {
    from: sender,
    to: email,
    subject: `email confimration for ${sender}`,
    html: `Click <a href="${process.env.APP_URL}/verify/${validationToken}"> here </a> to validate your email . Thanks`,
  };

  await transport.sendMail(mailOptions, function (err, response) {
    if (err) {
      console.log("sending email error", err);
    } else {
      console.log("message sent");
    }
  });
};

module.exports = { sendVerificationMail };
