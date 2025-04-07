const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'pittalasandeep124@gmail.com',
    pass: 'your-app-password'
  }
});

module.exports.sendOtp = (email, otp) => {
  return transporter.sendMail({
    from: 'pittalasandeep124@gmail.com',
    to: email,
    subject: 'OTP Verification',
    text: `Your OTP code is: ${otp}`
  });
};

module.exports.sendAdminMail = (subject, body) => {
  return transporter.sendMail({
    from: 'pittalasandeep124@gmail.com',
    to: 'sandeeppittala124@gmail.com',
    subject,
    text: body
  });
};
