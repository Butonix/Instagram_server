var pwdMgr          = require('../middleware/password');
var config          = require('../config');
var authentication  = require('../middleware/authentication');
var jwt             = require('jsonwebtoken');
var mongojs         = require('mongojs');
 
module.exports = function(server, db) {

    // readAll
    server.get('/api/post/all', authentication, function (req, res, next) {
        db.posts.find({ $oderby: { createdTime: -1 } }, function (err, dbPost) {
            res.send(200, dbPost);
        });
        return next();
    });

    // readAll - user
    server.get('/api/post/user/:id', authentication, function (req, res, next) {
        db.posts.find({ $query: {user_id: req.params.id}, $orderby: { createdTime: -1 } }, function (err, dbPost) {
            res.send(200, dbPost);
        });
        return next();
    });

    // create
    server.post('/api/post', authentication, function (req, res, next) {
        var newPost = req.params;

        if (!newPost.image) {
            res.send(403, { message: 'Upload image failed!' });
            return next();
        }

        newPost.user_id = req.reqUser._id;
        
        db.posts.insert(newPost, function (err, dbPost) {
            if (err) throw err;
            res.send(200, { message: 'New file uploaded!', post: dbPost });
        })
        return next();
    });

    // read post
    server.get('/api/post/:id', authentication, function (req, res, next) {
        db.posts.findOne({ _id: mongojs.ObjectId(req.params.id) }, function (err, dbPost) {
            if (err) throw err;

            if (!dbPost) { // user doesnt exist
                res.send(404, {success: false, message: 'Image not found.'});
                return next();
            }

            res.send(200, dbPost);
        });

        return next();
    });

    // update post
    server.put('/api/post/:id', authentication, function (req, res, next) {
        var editPost = req.params;

        db.posts.findOne({ _id: mongojs.ObjectId(req.params.id) }, function (err, dbPost) {
            if (err) throw err;

            if (!dbPost) { // user doesnt exist
                res.send(404, {success: false, message: 'Image not found.'});
                return next();
            }

            var savePost = dbPost;

            if (!!editPost.caption) {
                savePost.caption = editPost.caption; 
            };

            db.posts.update({ _id: mongojs.ObjectId(req.params.id) }, savePost, function (err, dbPost2) {
                if (err) throw err;
                res.send(200, { success: true, message: 'Post updated!' });
            });
        });
        return next();
    });

    // delete post
    server.del('/api/post/:id', authentication, function (req, res, next) {
        db.posts.findOne({ _id: mongojs.ObjectId(req.params.id) }, function (err, dbPost) {
            if (err) throw err;

            if (!dbPost) { // user doesnt exist
                res.send(404, {success: false, message: 'Image not found.'});
                return next();
            }

            db.posts.remove({ _id: mongojs.ObjectId(req.params.id) }, function (err) {
                if (err) throw err;
                res.send(200, { success:true, message: 'Post deleted!' });
            });
        });
        return next();
    });
};