/*
* Twitify.
*
* Twifity is a node.js service to find out if a given 
* twitter handle already exists or not. The service is live on 
* Inbox Messenger (http://www.inboxtheapp.com/) under @twitify handle.
* 
* Author: @tiggreen. @tigran on Inbox.
*
*/

// Seting up all necessary modules.
// We will be using Express.js web framework (http://expressjs.com/) for this service.
var express       = require('express');
var jsonParser    = require('body-parser');
var request       = require('request');

// Creating a new Express instance for our app.
var app = express();

// This guy will help us to easily parse and access req.body.
app.use(jsonParser.urlencoded({ extended: true }));
app.use(jsonParser.json());


// Setting up all necessary tokens for correct Authorization.
var inbox_token  = '';
var twitter_token = '';

if (!inbox_token.length || !inbox_token) {
	throw new Error('Hold on! Where is your Inbox server token?'); 
};

if (!twitter_token.length || !twitter_token) {
	throw new Error('Oh snap! I think you forgot your twitter token.'); 
};

// Heroku dynamically assigns a port, so we can't set the port to a fixed number. 
var port = process.env.PORT || 8080;

var router = express.Router();        

router.get('/', function(req, res) {
  res.json({ message: 'Hello! This is the Twitify bot speaking.' });
});

router.post('/', function(req, res) {

	// type == 12 case is the new conversation creation request. So let's say hello.
	if (req.body.type == 12) {
		var message = 'Hi @' + req.body.sender.username + 
					  '. I am Twitify. Send me any Twitter handle and I' +
					  ' will tell you whether it already exists or not.'
    	replyBack(message, req.body.sender.username);
  	};

  	// type = 21 when the user sends a text request a regular message  	
  	if (req.body.type == 21) {
    	checkTheHandle(req.body.data.text, req.body.sender.username);
   	};

  // So far we are good so let's reply back.
  res.status(200).json({reply:true})
});

app.use('/', router);

app.listen(port);
console.log('The server is running on ' + port + ' port.');


function checkTheHandle(text, username) {
	if (!text.length || text.split(' ').length > 1) {
		message = 'Twitter handle is one word only.'
		replyBack(message, username);
	// If the given handle is valid we can pursue and check its availability.
	} else {

		var options = {
		  url: 'https://api.twitter.com/1.1/users/show.json?screen_name=' + text,
		  headers: {
		      'Authorization': 'bearer ' + twitter_token,
		      'Content-Type' : 'application/json'
		  }
		};

		function callback(error, response, body) {
		  json = JSON.parse(body);

		  console.log(json.name);
		  console.log(response.statusCode);

		  if (response.statusCode == 200 && json.name) {
		  	replyBack('@' + text + ' is not available :(', username);

		  } else if (response.statusCode == 404 && !json.name) {
		  	replyBack('@' + text + ' is available. Yaaaay!', username);

		  } else if (response.statusCode == 403 && !json.name) {
		  	replyBack('@' + text + ' has been suspended.', username);

		  } else {
		    replyBack('Sorry! Something went wrong. Try again.', username);
		  }
		}
		request.get(options,callback);
	}
};

// Send a message to the user.
function replyBack(message, username) {
  var options = {
    url: 'https://devs.inboxtheapp.com/message',
    headers: {
        'Authorization': 'bearer ' + inbox_token
    },
    json: {
      to: username,
      text: message
    }
  };
  function callback(error, response, body) {};
  request.post(options, callback);
};