var pwdMgr = require('../middleware/password');
var config = require('../config');
var authentication = require('../middleware/authentication');
var jwt    = require('jsonwebtoken');
 
module.exports = function(server, db) {

    // readAll
    server.get('/api/post/all', authentication, function (req, res, next) {

        db.posts.find({ user_id: req.reqUser._id }, function (err, dbPost) {
            if (err) throw err;

            if (!!dbPost) {
                res.send(200, dbUser);
            } else {
                res.send({ success: false, message: 'No post to show!', posts: dbPost });
            }
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
        
        db.posts.insert(newPost, function (err, dbPost) {
            if (err) throw err;
            res.send(200, { message: 'New file uploaded!', post: newPost });
        })
        return next();
    });

    // read post
    server.get('/api/post/:id', authentication, function (req, res, next) {
        db.posts.findOne({ _id: req.reqUser._id }, function (err, dbUser) {
            if (err) throw err;

            if (!dbUser) { // user doesnt exist
                res.send(404, {success: false, message: 'User not found.'});
                return next();
            }

            res.send(200, dbUser);
        });

        return next();
    });

    // update post
    server.put('/api/post/:id', authentication, function (req, res, next) {
        var editUser = req.params;

        if (editUser.username === 0) {
            res.send(403, { message: 'Username is required!' });
            return next();
        }

        db.users.findOne({ _id: req.reqUser._id }, function (err, dbUser) {
            if (err) throw err;

            if (!dbUser) { // user doesnt exist
                res.send(403, {success: false, message: 'User not found.'});
                return next();
            }

            if (!!editUser.username && editUser.username !== dbUser.username) {
                dbUser.username = editUser.username;
                return next();
            }

            if (!!editUser.newPassword && editUser.newPassword !== "") {
                pwdMgr.comparePassword(editUser.oldPassword, dbUser.password, function (err, isPasswordMatch) {
 
                    if (isPasswordMatch) {                    
                        dbUser.password = editUser.newPassword;
                        res.send(200, { message: "Password changed!" });
                    } else {
                        res.send(403, { message: "Authentication failed. Wrong password." });
                    }
     
                });
            }

            if (!!editUser.avatar) {
                dbUser.avatar = editUser.avatar;
            }

            db.users.update({ _id: req.reqUser._id }, function (err, dbUser) {
                if (err) throw err;
                res.send(200, { message: 'Profile updated!' });
            });
            
        });

        return next();
    });

    // delete post
    server.del('/api/post/:id', authentication, function (req, res, next) {
        db.users.findOne({ _id: req.reqUser._id }, function (err, dbUser) {
            if (err) throw err;

            if (!dbUser) { // user doesnt exist
                res.send(404, {success: false, message: 'User not found.'});
                return next();
            }

            res.send(200, dbUser);
        });

        return next();
    });
};