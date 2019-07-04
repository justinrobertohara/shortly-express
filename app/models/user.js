var db = require('../config');
var bcrypt = require('bcrypt-nodejs');
var Promise = require('bluebird');

// var express = require('express');

//bookshelf.js
//https://bookshelfjs.org/

//User var takes in users database which contains access to usernames and passwords

var User = db.Model.extend({
  tableName: 'users',
  // our table creates time stamps, hasTs returns an array of created at and udpated at values
  hasTimestamps: true
});

module.exports = User;