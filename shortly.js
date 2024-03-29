var express = require('express');
var util = require('./lib/utility');
var partials = require('express-partials');
var bodyParser = require('body-parser');
var session = require('express-session');

var db = require('./app/config');
var Users = require('./app/collections/users');
var User = require('./app/models/user');
var Links = require('./app/collections/links');
var Link = require('./app/models/link');
var Click = require('./app/models/click');

var app = express();

app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.use(partials());
// Parse JSON (uniform resource locators)
app.use(bodyParser.json());
// Parse forms (signup/login)
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(__dirname + '/public'));

//connect session to app
app.use(
  session({
    secret: 'knock knock',
    resave: false,
    saveUninitialized: true
  })
);

/* create checkUser fn, pass into all server routes that require login */

const checkUser = (req, res, next) => {
  if (req.username) {
    next();
  }
  res.redirect('/signup');
};

app.get('/', checkUser, function(req, res) {
  res.render('index');
});

app.get('/create', function(req, res) {
  res.render('index');
});

app.get('/links', function(req, res) {
  Links.reset()
    .fetch()
    .then(function(links) {
      res.status(200).send(links.models);
    });
});

app.post('/links', function(req, res) {
  var uri = req.body.url;

  if (!util.isValidUrl(uri)) {
    console.log('Not a valid url: ', uri);
    return res.sendStatus(404);
  }

  new Link({ url: uri }).fetch().then(function(found) {
    if (found) {
      res.status(200).send(found.attributes);
    } else {
      util.getUrlTitle(uri, function(err, title) {
        if (err) {
          console.log('Error reading URL heading: ', err);
          return res.sendStatus(404);
        }

        Links.create({
          url: uri,
          title: title,
          baseUrl: req.headers.origin
        }).then(function(newLink) {
          res.status(200).send(newLink);
        });
      });
    }
  });
});

/************************************************************/
// Write your authentication routes here
/************************************************************/
/* build pages for login and sign up, and add routes to process the form data using POST actions. */
app.get('/signup', (req, res) => {
  res.status(200);
  res.render('signup');
});

app.post('/signup', (req, res) => {
  var usernameReq = req.body.username;
  var passwordReq = req.body.password;
  console.log('*******req.body ', req.body);

  Users.create({ username: usernameReq, password: passwordReq })
    .then(() => {
      res.status(202);
      console.log(`we have successfully created a new user ${usernameReq} with the password ${passwordReq}`);
      res.render('index');
    })
    .catch(err => {
      console.log(err);
    });
});

app.get('/login', (req, res) => {
  console.log('Successful Login');
  res.render('index');
});

app.post('/login', (req, res) => {
  var usernameReq = req.body.username;
  var pwReq = req.body.password;

  db.knex
    .select('username', 'password')
    .from('users')
    .where({
      username: usernameReq,
      password: pwReq
    })
    .then(data => {
      req.session.regenerate(() => {
        req.session.username = usernameReq;
        res.redirect('/');
      });
    })
    .catch(err => {
      if (err) {
        console.log(err);
        res.redirect('/signup');
      }
    });
});

/************************************************************/
// Handle the wildcard route last - if all other routes fail
// assume the route is a short code and try and handle it here.
// If the short-code doesn't exist, send the user to '/'
/************************************************************/

app.get('/*', function(req, res) {
  new Link({ code: req.params[0] }).fetch().then(function(link) {
    if (!link) {
      res.redirect('/');
    } else {
      var click = new Click({
        linkId: link.get('id')
      });

      click.save().then(function() {
        link.set('visits', link.get('visits') + 1);
        link.save().then(function() {
          return res.redirect(link.get('url'));
        });
      });
    }
  });
});

module.exports = app;
