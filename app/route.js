module.exports = function(server, db) {
    // middleware
    // require('./middleware/authentication')(server, db);

    // route
    require('./controller/UserController')(server, db);
    // require('./controller/PostController')(server, db);
};