var pwdMgr          = require('../lib/password');
var config          = require('../config');
var authentication  = require('../lib/authentication');
var jwt             = require('jsonwebtoken');
var mongojs         = require('mongojs');
var cloudinary      = require('cloudinary');
 
module.exports = function(server, db) {
    cloudinary.config(config.cloudinary);

    // readAll
    server.get('/api/user/all', function (req, res, next) {
        db.users.find(function (err, dbUser) {
            res.send(200, dbUser);
        });
        return next();
    });

    // log in
    server.post('/api/user/auth', function (req, res, next) {
        var user = req.params;

        if (user.email.length === 0 || user.password.length === 0) {
            res.send(403, { message: 'Username or password hasn\'t been input.' });
            return next();
        }

        db.users.findOne({ email: user.email }, function (err, dbUser) {
            if (err) throw err;

            if (!dbUser) {
                res.send(403, { message: 'Authentication failed. User not found.' });
                return next();
            }

            pwdMgr.comparePassword(user.password, dbUser.password, function (err, isPasswordMatch) {
 
                if (isPasswordMatch) {                    
                    var token = jwt.sign(dbUser, config.secret, {
                        expiresInMinutes: 1440 // expires in 24 hours
                    });

                    res.send(200, { token: token, message: "Login successfully!", user: {username: dbUser.username} });
                } else {
                    res.send(300, { message: "Authentication failed. Wrong password." });
                }
 
            });
        });
        return next();
    });

    // check Authenticate
    server.get('/api/user/auth', authentication, function (req, res, next) {
        sendUser = {};
        sendUser.userid             = req.reqUser._id;
        sendUser.username           = req.reqUser.username;
        sendUser.avatar             = req.reqUser.avatar;
        sendUser.countFollowers     = req.reqUser.followers.length;
        sendUser.countFollowings    = req.reqUser.followings.length;

        db.posts.find({ user_id: req.reqUser._id }).count(function (err, result) {
            sendUser.countPosts = result;
            res.send(200, {success: true, message: 'Authenticate successfully!', user: sendUser});
        });

        return next();
    });

 
    // create
    server.post('/api/user/', function (req, res, next) {
        var user = req.params;

        if (user.email.length === 0 || user.password.length === 0) {
            res.send(403, { message: 'Username or password hasn\'t been input.' });
            return next();
        }

        db.users.findOne({email: user.email}, function (err, dbUser) {
            if (err) throw err;

            if (!!dbUser) {
                res.send(400, { message: 'A user with this email already exists' });
                return next();
            }

            pwdMgr.cryptPassword(user.password, function (err, hash) {
                user.password = hash;
                console.log("n", hash);

                // set default value
                user.username = "Instagram User";
                user.avatar = "";
                user.followers = [];
                user.followings = [];

                db.users.insert(user, function (err, dbUser2) {
                    if (err) { // duplicate key error
                        if (err.code == 11000) /* http://www.mongodb.org/about/contributors/error-codes/*/ {
                            res.send(400, { error: err, message: "A user with this email already exists" });
                        }
                    } else {
                        res.send(200, { message: 'Registered successfully!' });
                    }
                });
            });
        });        
        return next();
    });

    //read other profile
    server.get('/api/user/:id', authentication, function (req, res, next) {
        db.users.findOne({ _id: mongojs.ObjectId(req.params.id) }, function (err, dbUser) {
            if (err) throw err;

            if (!dbUser) { // user doesnt exist
                res.send(404, {success: false, message: 'User not found.'});
                return next();
            }

            var sendUser = {};
            sendUser.userid             = dbUser._id;
            sendUser.username           = dbUser.username;
            sendUser.avatar             = dbUser.avatar;
            sendUser.countFollowers     = dbUser.followers.length;
            sendUser.countFollowings    = dbUser.followings.length;

            db.posts.find({ user_id: dbUser._id }).count(function (err, result) {
                sendUser.countPosts = result;
                res.send(200, sendUser);
            });

        });

        return next();
    });

    // read profile
    server.get('/api/user', authentication, function (req, res, next) {
        db.users.findOne({ _id: mongojs.ObjectId(req.reqUser._id) }, function (err, dbUser) {
            if (err) throw err;

            if (!dbUser) { // user doesnt exist
                res.send(404, {success: false, message: 'User not found.'});
                return next();
            }

            res.send(200, dbUser);
        });

        return next();
    });

    // update profile
    server.put('/api/user', authentication, function (req, res, next) {
        var editUser = req.params;

        db.users.findOne({ _id: mongojs.ObjectId(req.reqUser._id) }, function (err, dbUser) {
            if (err) throw err;

            if (!dbUser) { // user doesnt exist
                res.send(404, {success: false, message: 'User not found.'});
                return next();
            }

            var saveUser = dbUser;

            if (!!editUser.username && editUser.username !== dbUser.username) {
                saveUser.username = editUser.username;
            }

            if (!!editUser.newPassword && editUser.newPassword !== "") {
                pwdMgr.comparePassword(editUser.oldPassword, dbUser.password, function (err, isPasswordMatch) {
 
                    if (isPasswordMatch) {                    
                        saveUser.password = editUser.newPassword;
                        res.send(200, { message: "Password changed!" });
                    } else {
                        res.send(403, { message: "Authentication failed. Wrong password." });
                        return next();
                    }
     
                });
            }

            if (!!req.files.image) {
                cloudinary.uploader.upload(req.files.image.path, function (dbFile) {
                    editUser.avatar = dbFile.url;
                });
            }

            db.users.update({ _id: mongojs.ObjectId(req.reqUser._id) }, saveUser, function (err, dbUser2) {
                if (err) throw err;
                var sendUser = {};
                sendUser.userid         = req.reqUser._id;
                sendUser.username       = dbUser.username;
                sendUser.avatar         = dbUser.avatar;
                res.send(200, { message: 'Profile updated!', user: sendUser });
            });
            
        });

        return next();
    });

    // see followers list
    server.get('/api/followers', authentication, function (req, res, next) {
        db.users.findOne({ _id: mongojs.ObjectId(req.reqUser._id) }, function (err, dbUser) {
            if (err) throw err;
            res.send(200, dbUser.followers);
        });
        return next();
    });

    // see followees list
    server.get('/api/followings', authentication, function (req, res, next) {
        db.users.findOne({ _id: mongojs.ObjectId(req.reqUser._id) }, function (err, dbUser) {
            if (err) throw err;
            res.send(200, dbUser.followings);
        });
        return next();
    });

    // see followers list - other
    server.get('/api/followers/user/:id', authentication, function (req, res, next) {
        db.users.findOne({ _id: mongojs.ObjectId(req.params.id) }, function (err, dbUser) {
            if (err) throw err;

            if (!dbUser) {
                res.send(404, { message: "User not found!" });
                return next();
            }

            res.send(200, dbUser.followers);
        });
        return next();
    });

    // see followees list - other
    server.get('/api/followings/user/:id', authentication, function (req, res, next) {
        db.users.findOne({ _id: mongojs.ObjectId(req.params.id) }, function (err, dbUser) {
            if (err) throw err;

            if (!dbUser) {
                res.send(404, { message: "User not found!" });
                return next();
            }

            res.send(200, dbUser.followings);
        });
        return next();
    });

    // Check follow
    server.post('/api/follow/user/:id', authentication, function (req, res, next) {
        db.users.findOne({ _id: mongojs.ObjectId(req.params.id) }, function (err, dbUser) {
            if (err) throw err;

            if (!dbUser) {
                res.send(404, { message: "User not found!" });
                return next();
            }

            var saveUser = dbUser;
            saveUser.followers.push(req.reqUser._id);
            db.users.update({ _id: mongojs.ObjectId(req.params.id) }, saveUser, function (err) {
                if (err) throw err;
            });
        });

        db.users.findOne({ _id: mongojs.ObjectId(req.reqUser._id) }, function (err, dbUser) {
            if (err) throw err;

            if (!dbUser) {
                res.send(404, { message: "User not found!" });
                return next();
            }

            var saveUser = dbUser;
            saveUser.followings.push(req.params.id);            
            db.users.update({ _id: mongojs.ObjectId(req.reqUser._id) }, saveUser, function (err) {
                if (err) throw err;
                res.send(200, { success: true, message: 'Add followings successfully!' });
            });
        });
        return next();
    });

    // UnCheck follow
    server.put('/api/follow/user/:id', authentication, function (req, res, next) {
        db.users.findOne({ _id: mongojs.ObjectId(req.params.id) }, function (err, dbUser) {
            if (err) throw err;

            if (!dbUser) {
                res.send(404, { message: "User not found!" });
                return next();
            }

            var saveUser = dbUser;
            saveUser.followers.splice(saveUser.followers.indexOf(req.reqUser._id), 1);
            db.users.update({ _id: mongojs.ObjectId(req.params.id) }, saveUser, function (err) {
                if (err) throw err;
            });
        });

        db.users.findOne({ _id: mongojs.ObjectId(req.reqUser._id) }, function (err, dbUser) {
            if (err) throw err;

            if (!dbUser) {
                res.send(404, { message: "User not found!" });
                return next();
            }

            var saveUser = dbUser;
            saveUser.followings.splice(saveUser.followings.indexOf(req.params.id), 1);
            db.users.update({ _id: mongojs.ObjectId(req.reqUser._id) }, saveUser, function (err) {
                if (err) throw err;
                res.send(200, { success: true, message: 'Remove followings successfully!' });
            });
        });
        return next();
    });

    // delete post
    // server.del('/api/user/all', function (req, res, next) {

    //         db.users.remove(function (err) {
    //             console.log("delete all user");
    //             res.send({message: "delete"});
    //         });

    //     return next();
    // });
};