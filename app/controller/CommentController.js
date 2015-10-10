var pwdMgr          = require('../lib/password');
var config          = require('../config');
var authentication  = require('../lib/authentication');
var jwt             = require('jsonwebtoken');
var mongojs         = require('mongojs');
 
module.exports = function(server, db) {

    // readAll
    server.get('/api/comment/all', function (req, res, next) {
        db.comments.find()
                   .sort({ createdTime: 1 },
                    function (err, dbComment) {
            res.send(200, dbComment);
        });
        return next();
    });

    // readAll - post
    server.get('/api/comment/post/:id', authentication, function (req, res, next) {
        db.comments.find({ post_id: req.params.id })
                   .sort({ createdTime: 1 },
                    function (err, dbComment) {
            res.send(200, dbComment);
        });
        return next();
    });

    // create
    server.post('/api/comment/post/:id', authentication, function (req, res, next) {
        var newComment = req.params;
        newComment.post_id = req.params.id;
        newComment.user_id = req.reqUser._id;
        
        db.comments.insert(newComment, function (err, dbComment) {
            if (err) throw err;
            res.send(200, { message: 'Commented successfully!'});
        })
        return next();
    });

    
};