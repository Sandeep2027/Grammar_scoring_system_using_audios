const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const path = require('path');
const multer = require('multer');
const fs = require('fs');

const app = express();
const uploadsDir = './uploads';
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir);

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({ secret: 'mySecret', resave: false, saveUninitialized: true }));

const routes = require('./routes/index');
app.use('/', routes);

app.listen(3000, () => console.log('Server running at http://localhost:3000'));