var express = require('express');
var logger = require('morgan');
var session = require('express-session');
const cookieParser = require("cookie-parser");
const mongoose = require('mongoose')
const env = require('config');
var app = express();
var flash = require('express-flash');
var config = require('./config');

const cron = require('node-cron');
const http = require('http').Server(app);
const io = require('socket.io')(http);


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


io.on('connection', (socket) => {
  socket.on('broad message', msg => {
    io.emit('broad message', msg);
  });
});

mongoose
    .connect(config.database.url, { // 'mongodb://127.0.0.1:27017'            process.env.MONGO_URI
        useNewUrlParser: true,
        useUnifiedTopology: true,
    })
    .then(() => {
      console.log('connected to db');
      http.listen(3000, "0.0.0.0", () => {
        console.log(`Socket.IO server running at http://localhost:3000/`);
      });
    })
    .catch((err) => {
         console.log("mongodb connect error ========");
         console.error(err)
         process.exit(1)
    });

    //all models scan and broadcast to all 
const Settings = require('./model/Setting');
const MongoClient = require("mongodb").MongoClient;
var ObjectId = require('mongoose').Types.ObjectId;
    
cron.schedule('* * * * *', function () {
	console.log("Mongdb Scan Task is running every minute " + new Date());
  const client = new MongoClient('mongodb://localhost:27017/', { useUnifiedTopology: true });
	var alldatas = [];
  Settings.find({}, function (err, docs) {
    // docs is an array
    if(docs){
      docs.forEach( function(mem){
        let db = mem.dbname.trim();
        let col = mem.collectionname.trim();
        client.connect((err) => {
          var workdb = client.db(db);
          var datas = workdb.collection(col);
			    const cursor = datas.find({}).toArray(function(err, result) {
            if (err) {
              throw err;
            }
            // console.log(result);
            var fulldata = result;
            var jsontype = {
              modelname: db,
              collectionname: col,
              datas: fulldata
            };

	          io.emit('broad message', {data: jsontype});

            // alldatas.push(jsontype);
            client.close();
          // console.log(alldatas);

          });
        });
        
      });
     
    }
  });
	// io.emit('broad message', 'sdddsds');
});

