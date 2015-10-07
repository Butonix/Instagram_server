var pwdMgr = require('../middleware/password');
var config = require('../config');
var authentication = require('../middleware/authentication');
var jwt    = require('jsonwebtoken');
var mongojs = require('mongojs');
 
module.exports = function(server, db) {

    // readAll
    server.get('/api/user/all', authentication, function (req, res, next) {
        db.users.find(function (err, dbUser) {
            res.send(200, dbUser);
        });
        return next();
    });

    // log in
    server.post('/api/user/auth', function (req, res, next) {
        var user = req.params;

        if (user.email.length === 0 || user.password.length === 0) {
            res.send(403, { message: "Invalid Credentials" });
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
                        expiresIn: 1440 // expires in 24 hours
                    });

                    res.send(200, { token: token, message: "Login successfully!" });
                } else {
                    res.send(300, { message: "Authentication failed. Wrong password." });
                }
 
            });
        });
        return next();
    });

    // log out
    server.post('/api/user/auth', function (req, res, next) {
        // var user = req.params;
    });
 
    // create
    server.post('/api/user/', function (req, res, next) {
        var user = req.params;

        if (user.email.length === 0 || user.password.length === 0 || user.username.length === 0) {
            res.send(403, { message: 'Username or password hasn\'t been input.' });
            return next();
        }

        db.users.findOne({username: user.username}, function (err, dbUser) {
            if (err) throw err;

            if (!!dbUser) {
                res.send(400, { message: 'A user with this username already exists' });
                return next();
            }

            db.users.findOne({email: user.email}, function (err, dbUser1) {
                if (err) throw err;

                if (!!dbUser1) {
                    res.send(400, { message: 'A user with this email already exists' });
                    return next();
                }

                pwdMgr.cryptPassword(user.password, function (err, hash) {
                    user.password = hash;
                    console.log("n", hash);

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
        });
        
        return next();
    });

    //read other profile
    server.get('/api/user/:username', authentication, function (req, res, next) {
        db.users.findOne({ username: req.params.username }, function (err, dbUser) {
            if (err) throw err;

            if (!dbUser) { // user doesnt exist
                res.send(404, {success: false, message: 'User not found.'});
                return next();
            }

            res.send(200, dbUser);
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

        if (editUser.username === 0) {
            res.send(403, { message: 'Username is required!' });
            return next();
        }

        db.users.findOne({ _id: mongojs.ObjectId(req.reqUser._id) }, function (err, dbUser) {
            if (err) throw err;

            if (!dbUser) { // user doesnt exist
                res.send(403, {success: false, message: 'User not found.'});
                return next();
            }

            if (!!editUser.username && editUser.username !== dbUser.username) {

                db.users.findOne({username: user.username}, function (err, dbUser2) {
                    if (err) throw err;

                    if (!!dbUser2) {
                        res.send(400, { message: 'A user with this username already exists' });
                        return next();
                    }

                    dbUser.username = editUser.username;
                });
            }

            if (!!editUser.newPassword && editUser.newPassword !== "") {
                pwdMgr.comparePassword(editUser.oldPassword, dbUser.password, function (err, isPasswordMatch) {
 
                    if (isPasswordMatch) {                    
                        dbUser.password = editUser.newPassword;
                        res.send(200, { message: "Password changed!" });
                    } else {
                        res.send(403, { message: "Authentication failed. Wrong password." });
                        return next();
                    }
     
                });
            }

            if (!!editUser.avatar) {
                dbUser.avatar = editUser.avatar;
            }

            db.users.update({ _id: mongojs.ObjectId(req.reqUser._id) }, function (err, dbUser) {
                if (err) throw err;
                res.send(200, { message: 'Profile updated!' });
            });
            
        });

        return next();
    });
};