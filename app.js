require('dotenv').config()
var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var userRouter = require('./routes/user');
var adminRouter = require('./routes/admin');
const { hasSubscribers } = require('diagnostics_channel');
var hbs = require('express-handlebars');
var app = express();
const { allowinsecurePrototypeAcess } = require('@handlebars/allow-prototype-access');
var fileUpload = require('express-fileupload')
// var db=require('./config/connection')
var session = require('express-session');
const { log } = require('console');
// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');
app.engine('hbs', hbs.engine({ extname: 'hbs', defaultLayout: 'layout', layoutsDir: __dirname + '/views/layout/', partialsDir: __dirname + '/views/partials/' }));
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(fileUpload());
app.use(
  session({
    secret: process.env.SESSION_SECRET, // Secret used to sign the session ID cookie (can be any random string)
    cookie: { maxAge: 6000000 }, // Cookie settings
    resave: false, // Removed (deprecated option)
    saveUninitialized: false // Removed (deprecated option)
  })
);
// db.connect((err)=>{
//   if(err) console.log("connection error"+err);
//   else console.log("Database connected to 27017");
// })


app.use('/', userRouter);
app.use('/admin', adminRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  console.log("dhyeda error handling : ", err.message);
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error.hbs', { error: err });
});

module.exports = app;