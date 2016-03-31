var express = require('express');
var app = express();
var api = require('instagram-node').instagram();
var request = require('request');
var RSS = require('rss');
var feedOptions = {
  'title': "An RSS feed",
  'feed_url':"localhost/rss",
  'feed_url':"localhost",
  'custom_namespaces': {
    'media': 'localhost'
  },
};


var feed = new RSS(feedOptions);


var keys = require("./keys");
console.log(keys);
api.use({ client_id: keys.client_id,
         client_secret: keys.client_secret });

var redirect_uri = 'http://localhost:8080/login';
var rss_uri = 'http://localhost:8080/rss';
var token = '';

app.get('/', function (req, res) {
  res.send('Hello World!');
});

app.listen(8080, function () {
  console.log('Example app listening on port 8080!');
});

exports.authorize_user = function(req, res) {
  res.redirect(api.get_authorization_url(redirect_uri, { scope: ['likes'], state: 'a state' }));
};

exports.handleauth = function(req, res) {
  api.authorize_user(req.query.code, redirect_uri, function(err, result) {
    if (err) {
      console.log("authing....");
      console.log(err.body);
      res.send("Didn't work");
    } else {
      token = result.access_token;
      console.log('Yay! Access token is ' + result.access_token);
      res.redirect(rss_uri);
    }
  });
};

exports.rss = function(req, res) {
  console.log("RENDERING RSS");
  var payload = {
    'uri':"https://api.instagram.com/v1/users/self/media/recent/?count=10&access_token="+token,
    'json': true
  };
  request(payload, function(error, response, body) {
    console.log(body.meta);
    if(body.meta.code){
      if(body.meta.code == 400){
        res.redirect(api.get_authorization_url(redirect_uri, { scope: ['likes'], state: 'a state' }));
        console.log("missing token, rebooting");
      }
      if(body.meta.code == 200){
        // console.log(body.data);
        for (item of body.data) {
          // console.log(item);
          feed.item({
              title:  "A TITLE",
              url: item.link, // link to the item
              custom_elements: [
                {'media:content': {
                  _attr: {
                    url: item.images.standard_resolution.url,
                    type: item.type,
                  }
                }},
              ]
          });
        }
        res.set('Content-Type', 'text/xml');
        res.send(feed.xml({indent: true}));
      }
    }
    // res.send("COMPLETE " +  body);
  });
  // res.send(token);
};

app.get('/authorize_user', exports.authorize_user);
// This is your redirect URI
app.get('/login', exports.handleauth);
app.get('/rss', exports.rss);
