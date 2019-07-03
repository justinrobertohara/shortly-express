var db = require('../config');
var bcrypt = require('bcrypt-nodejs');
var Promise = require('bluebird');
var bodyParser = require('bodyParser');
var express = require('express');

var app = express();
app.use(express.bodyParser());
app.use(express.cookieParser('here is our string'))

// console.log('this is our app in user.js******', app);


//Allow users to register for a new account, or to login
//Build pages for login and sign up
//And add routes to process the form data using POST actions.

var User = db.Model.extend({

});

module.exports = User;