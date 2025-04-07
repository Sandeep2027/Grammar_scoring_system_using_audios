const express = require('express');
const router = express.Router();
const db = require('../db/database');
const bcrypt = require('bcryptjs');
const svgCaptcha = require('svg-captcha');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });

const { sendOtp, sendAdminMail } = require('../utils/mailer');
const { scoreGrammar, suggestCorrections } = require('../controllers/grammar');

let otps = {};

// Home & Info Pages
router.get('/', (req, res) => res.render('home'));
router.get('/about', (req, res) => res.render('about'));
router.get('/contact', (req, res) => res.render('contact', { message: null }));

// Contact Submission
router.post('/contact', (req, res) => {
  const { email, subject, question } = req.body;
  db.run("INSERT INTO queries (email, subject, question) VALUES (?, ?, ?)", [email, subject, question]);
  sendAdminMail(subject, `${email} asked:\n${question}`);
  res.render('contact', { message: 'Successfully sent your query!' });
});

// Register
router.get('/register', (req, res) => res.render('register', { message: null }));
router.post('/register', (req, res) => {
  const { email, password } = req.body;
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  otps[email] = { otp, password };
  sendOtp(email, otp);
  res.redirect('/verify?email=' + email);
});

// OTP Verify
router.get('/verify', (req, res) => res.render('verify', { email: req.query.email, message: null }));
router.post('/verify', (req, res) => {
  const { email, code } = req.body;
  const entry = otps[email];
  if (entry && entry.otp === code) {
    bcrypt.hash(entry.password, 10, (err, hash) => {
      db.run("INSERT INTO users (email, password, verified) VALUES (?, ?, ?)", [email, hash, 1]);
      delete otps[email];
      res.redirect('/login');
    });
  } else {
    res.render('verify', { email, message: 'Invalid OTP' });
  }
});

// Login
router.get('/login', (req, res) => {
  const captcha = svgCaptcha.createMathExpr({ noise: 2 });
  req.session.captcha = captcha.text;
  res.render('login', { captcha: captcha.data, message: null });
});

router.post('/login', (req, res) => {
  const { email, password, captcha } = req.body;
  if (captcha != req.session.captcha) {
    return res.render('login', { captcha: null, message: 'Invalid CAPTCHA' });
  }
  db.get("SELECT * FROM users WHERE email = ?", [email], (err, user) => {
    if (!user) return res.render('login', { captcha: null, message: 'User not found' });
    bcrypt.compare(password, user.password, (err, match) => {
      if (match) {
        req.session.user = user;
        res.redirect('/main');
      } else {
        res.render('login', { captcha: null, message: 'Wrong password' });
      }
    });
  });
});

// Profile
router.get('/profile', (req, res) => {
  const user = req.session.user;
  if (!user) return res.redirect('/login');
  db.all("SELECT * FROM scores WHERE user_id = ?", [user.id], (err, scores) => {
    db.all("SELECT * FROM queries WHERE email = ?", [user.email], (err2, queries) => {
      res.render('profile', { user, scores, queries, message: null });
    });
  });
});

router.post('/update-password', (req, res) => {
  const { newPassword } = req.body;
  const user = req.session.user;
  bcrypt.hash(newPassword, 10, (err, hash) => {
    db.run("UPDATE users SET password = ? WHERE id = ?", [hash, user.id]);
    res.redirect('/profile');
  });
});

// Main Grammar Page
router.get('/main', (req, res) => {
  if (!req.session.user) return res.redirect('/login');
  res.render('main', { result: null, suggestions: null });
});

router.post('/main', upload.single('audio'), (req, res) => {
  const { transcript } = req.body;
  const score = scoreGrammar(transcript);
  const suggestions = suggestCorrections(transcript);
  db.run("INSERT INTO scores (user_id, transcript, grammar_score) VALUES (?, ?, ?)", [req.session.user.id, transcript, score]);
  res.render('main', { result: `Grammar Score: ${score}`, suggestions });
});

module.exports = router;
