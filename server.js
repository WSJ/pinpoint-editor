var express    = require('express');
var app        = express();
var morgan     = require('morgan');
var bodyParser = require('body-parser');
var fs         = require('fs');
var check      = require('./app/setup-check.js');

var port = process.env.PORT || 3001;

app.use(express.static(__dirname + '/public'));
app.use(morgan('dev'));
app.use(bodyParser.urlencoded({'extended':'true'}));
app.use(bodyParser.json());
app.use(function(req, res, next) {
	res.header("Access-Control-Allow-Origin", "*");
	res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
	next();
});

check(function(){
    require('./app/routes.js')(app);
    app.listen(port).on('error', function(err) {
        if (err.errno === 'EADDRINUSE') {
            throw('Error: Port '+port+' is already in use, which means that Pinpoint is probably already running on this computer.');
        }
    });
    console.log("I'm on port " + port);
});



