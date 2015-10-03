var restify = require('restify');
var mongojs = require('mongojs');
var db = mongojs('productsdb', ['products']);
//drop
db.dropDatabase();
//server
var server = restify.createServer();

server.use(restify.acceptParser(server.acceptable));
server.use(restify.queryParser());
server.use(restify.bodyParser());

// CORS
server.use(function(req, res, next) {
    res.header('Access-Control-Allow-Origin', "*");
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    next();
});

server.listen(process.env.PORT || 3000, function () {
    console.log("Server started @ ",process.env.PORT || 3000);
});

server.post('/product', function (req, res, next) {
    var product = req.params;
    console.log(product);
    db.products.save(product,
        function (err, data) {
            res.writeHead(200, {
                'Content-Type': 'application/json; charset=utf-8'
            });
            res.end(JSON.stringify(data));
        });
    return next();
});

server.get("/products", function (req, res, next) {
    db.products.find(function (err, products) {
        res.writeHead(200, {
            'Content-Type': 'application/json; charset=utf-8'
        });
        res.end(JSON.stringify(products));
    });
    return next();
});

module.exports = server;