var express = require('express');
var logger = require('morgan');
var session = require('express-session');
const cookieParser = require("cookie-parser");
const mongoose = require('mongoose')
const env = require('config');
var app = express();
var flash = require('express-flash');
var config = require('./config');
/**
 * Store database credentials in a separate config.js file
 * Load the file/module and its values
 * For MongoDB, we basically store the connection URL in config file
 */

/**
 * setting up the templating view engine
 */ 
app.set('view engine', 'ejs');
app.use(express.static(__dirname + '/assets'));
app.use(cookieParser(env.get('myprivatekey')));
app.use(session({
  secret: env.get('myprivatekey'),
  resave: true,
  saveUninitialized: true,
  cookie: { maxAge: 1000*60*60*24,
    secure: false // change to true when site is live with https
  }
}))

/**
 * import routes/index.js
 * import routes/users.js
 */ 
var index = require('./routes/index');
var user = require('./routes/users');
var data = require('./routes/data');
var setting = require('./routes/setting');
/**
 * Express Validator Middleware for Form Validation
 */ 
var expressValidator = require('express-validator');
app.use(expressValidator());

/**
 * body-parser module is used to read HTTP POST data
 * it's an express middleware that reads form's input 
 * and store it as javascript object
 */ 
var bodyParser = require('body-parser');
/**
 * bodyParser.urlencoded() parses the text as URL encoded data 
 * (which is how browsers tend to send form data from regular forms set to POST) 
 * and exposes the resulting object (containing the keys and values) on req.body.
 */ 
app.use(bodyParser.urlencoded({ extended: true }));
app.use(logger('dev'));
app.use(bodyParser.json());


/**
 * This module let us use HTTP verbs such as PUT or DELETE 
 * in places where they are not supported
 */ 
var methodOverride = require('method-override');

/**
 * using custom logic to override method
 * 
 * there are other ways of overriding as well
 * like using header & using query value
 */ 
app.use(methodOverride(function (req, res) {
  if (req.body && typeof req.body === 'object' && '_method' in req.body) {
    // look in urlencoded POST bodies and delete it
    var method = req.body._method;
    delete req.body._method;
    return method;
  }
}));

/**
 * This module shows flash messages
 * generally used to show success or error messages
 * 
 * Flash messages are stored in session
 * So, we also have to install and use 
 * cookie-parser & session modules
 */ 

app.use(flash());

app.use('/', index);
app.use('/user', user);
app.use('/data', data);
app.use('/setting', setting);

mongoose
   .connect(config.database.url, { // 'mongodb://127.0.0.1:27017'            process.env.MONGO_URI
        useNewUrlParser: true,
        useUnifiedTopology: true,
    })
    .then(() => {
        console.log('connected to db');
        app.listen(3000, function(){
        console.log('Server running at port 3000: http://127.0.0.1:3000')
      });
    }).catch((err) => {
         console.log("mongodb connect error ========");
         console.error(err)
         process.exit(1)
    })

