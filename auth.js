/**
 * Created by linhnh on 26/3/15.
 */
var passport        = require('passport');
var LocalStrategy   = require('passport-local').Strategy
var config          = require('./config')
var bcrypt          = require("bcrypt");
var Users           = require("./smove_modules/user-module.js").Users;



passport.use(new LocalStrategy(function (username, password, done){
    Users.getUserByUserName (username, function (err, user) {
        if (err) {
            return done(err);
        }
        if (!user) {
            return done(null, false);
        }

        bcrypt.compare(password, user.password, function(err, res) {
            if (err) return done(null, false);

            if (!res)
            {
                return done(null, false);
            }
            else
            {
                return done(null, user);
            }
        })
    })
}));


passport.serializeUser(function (user, done) {
    done(null, user._id);
});

passport.deserializeUser(function (id, done) {

    Users.getUserByID (id, function (err, user) {
        done (err, user);
    })
});