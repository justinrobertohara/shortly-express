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

app.get('/', function(req, res) {
  res.render('index');
  console.log('we have logged into the index');
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
  res.render('signup');
});

app.post('/signup', (req, res) => {
  var user = req.body.username;
  var pw = req.body.password;

  new User({ username: user, password: pw }).fetch().then(success => {
    // if (success) {
    //   req
    // } else {
    // }
  });
});

// app.post('/signup', (req, res) => {
//   db.knex('users').insert({
//     username: req.body.username,
//     password: req.body.password
//   }).then((data) => {
//     res.status(200);
//     req.session.regenerate(() => {
//       request.session.user = req.body.username;
//       res.redirect('/');
//     })
//   }).catch((err) => {
//     res.send('Error, try again: ', err);
//     res.status(404);
//   })
// });

app.get('/login', (req, res) => {
  res.render('login');
});

app.post('/login', (req, res) => {
  var username = req.body.username;
  var pw = req.body.password;
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
