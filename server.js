var restify = require('restify');
var mongojs = require('mongojs');
var morgan  = require('morgan');
var db      = mongojs('instagramdb', ['users', 'posts', 'comments']);
var server  = restify.createServer();
var route   = require('./app/route');

server.use(restify.acceptParser(server.acceptable));
server.use(restify.queryParser());
server.use(restify.bodyParser());
server.use(morgan('dev')); // LOGGER

// CORS
server.use(function(req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
    res.header('Access-Control-Allow-Headers', 'X-Requested-With, Content-type, Authorization, x-access-token');
    next();
});

server.opts(/\.*/, function (req, res, next) {
    res.send(200);
    return next();
});

// var users   = require('./app/controller/UserController')(server, db);
route(server, db);

server.listen(process.env.PORT || 3000, function () {
    console.log("Server started @ ",process.env.PORT || 3000);
});

module.exports = server;