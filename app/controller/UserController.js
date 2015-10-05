var pwdMgr = require('../middleware/password');
 
module.exports = function (server, db) {

    server.get('/api/user/all', function (req, res, next) {

        db.users.find(function (err, dbUser) {
            res.writeHead(200, {'Content-Type': 'application/json; charset=utf-8'});
            res.end(JSON.stringify(dbUser));
        });
        return next();
    });
 
    server.post('/api/user/', function (req, res, next) {
        var user = req.params;

        if (user.email.length === 0 || user.password.length === 0) {
            res.writeHead(403, { 'Content-Type': 'application/json; charset=utf-8' });
            res.end(JSON.stringify({ message: 'Username or password hasn\'t been input.' }));
            return next();
        }

        db.users.findOne({email: user.email}, function(err, user) {
            if (err) throw err;

            if (!!user) {
                res.writeHead(403, { 'Content-Type': 'application/json; charset=utf-8' });
                res.end(JSON.stringify({ message: 'Input username has been used.' }));
                return next();
            }

            pwdMgr.cryptPassword(user.password, function (err, hash) {
                user.password = hash;
                console.log("n", hash);

                db.users.insert(user,
                    function (err, dbUser) {
                        if (err) { // duplicate key error
                            if (err.code == 11000) /* http://www.mongodb.org/about/contributors/error-codes/*/ {
                                res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
                                res.end(JSON.stringify({ error: err, message: "A user with this email already exists" }));
                            }
                        } else {
                            res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
                            res.end(JSON.stringify({ message: 'Registered successfully', username: username }));
                        }
                    }
                );
            });
        });
        
        return next();
    });
 
    server.post('/api/user/auth', function (req, res, next) {
        var user = req.params;

        if (user.email.trim().length === 0 || user.password.trim().length === 0) {
            res.writeHead(403, { 'Content-Type': 'application/json; charset=utf-8' });
            res.end(JSON.stringify({ error: "Invalid Credentials" }));
        }
        console.log("in");

        db.users.findOne({ email: user.email }, function (err, dbUser) {

            pwdMgr.comparePassword(user.password, dbUser.password, function (err, isPasswordMatch) {
 
                if (isPasswordMatch) {
                    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
                    res.end(JSON.stringify({ message: "Login successfully" }));
                } else {
                    res.writeHead(403, { 'Content-Type': 'application/json; charset=utf-8' });
                    res.end(JSON.stringify({ message: "Invalid User" }));
                }
 
            });
        });
        return next();
    });
};