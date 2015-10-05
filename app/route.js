var UserController      = require('./controller/UserController');
// var PostController      = require('./controller/PostController');
// var CommentController   = require('./controller/CommentController');

module.exports = function(server, db) {
    // middleware
    // require('./middleware/authentication')(server, db);

    // User routes
    server.post('/api/user/auth', UserController.actionLogin);
    server.get('/api/user/auth', UserController.actionLogout);

    server.get('/api/user/all', UserController.readAll);

    server.post('/api/user', UserController.actionCreate);
    server.get('/api/user', UserController.actionRead);
    server.put('/api/user', UserController.actionUpdate);

    // Post routes
    server.get('/api/post/all', PostController.actionReadAll);

    server.post('/api/post', PostController.actionCreate);
    server.get('/api/post/:id', PostController.actionRead);
    server.put('/api/post/:id', PostController.actionUpdate);
    server.del('/api/post/:id', PostController.actionDelete);

    // Comment routes
    server.post('/api/post/:id/comment', CommentController.actionCreate);
    server.get('/api/post/:id/comment', CommentController.actionReadAll);

    // Follow routes
    server.get('/api/user/followers', FollowController.readFollowers);
    server.post('/api/user/followings', CommentController.readFollowings);

    server.post('/api/user/follow/:id', FollowController.actionFollow);
    server.put('/api/user/follow/:id', FollowController.actionUnfollow);
};