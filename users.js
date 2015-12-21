/**
 * Created by linhnh on 26/3/15.
 */
var passport                = require('passport');
var login                   = require('connect-ensure-login');
var Users                   = require("./smove_modules/user-module.js").Users;
var config                  = require('./config');
var Email = require('./smove_modules/email.js').Email;
var path = require('path');


exports.generateRandomUser  = function (req, res) {

    Users.clearAllUsers (function (err) {
        if (err) {
            return res.error(err);
        }

        Users.generateRandomUser (function (err) {
            if  (err) {
                return res.error(err);
            }

            return res.success();
        })
    })

}

exports.login = [

    function(req, res, next) {
        try
        {
            var username    = req.ensureParam("username", "string");
            var password    = req.ensureParam("password", "string");
        }
        catch(e)
        {
            return res.error(e);
        }

        Users.getUserByUserName (username, function(err, user){
            if (err) {
                return res.error(err);
            }

            if (user) {
                if (user.status == config.server.UserStatus.INACTIVE) {

                    Users.requestAccountActivation (user, function (err) {
                        if (err) {
                            return res.error(err);
                        }

                        return res.error("Please activate your account. We sent the activation email to you!");

                    })

                } else if (user.status == config.server.UserStatus.SUSPENDED) {

                    return res.error("Your account has been deactivated, please contact us for further information!");

                } else {
                    return next();
                }
            } else {
                return next();
            }
        })
    },

    passport.authenticate('local'),

    function (req, res) {

        res.cookie('email_cookie', {email: req.user.email,_id: req.user._id}, { maxAge: config.server.session.maxAge });

        return res.success();

    }
]

exports.register = function (req, res) {
    console.log("registering user " + req.body);
    try {

        var params =
        {
            username:       req.ensureParam("username", "string"),
            email:          req.ensureParam("email", "string"),
            role:           req.ensureParam("role", "string", true)
        };

    }

    catch(err)
    {
        return res.error(err);
    }

    Users.registerNewUser (params, function (err, new_user) {
        if (err) {
            return res.error(err);
        }
        res.success();

        Users.requestAccountActivation (new_user, function (err) {
            if (err) {
                console.log(err);
            }
        })
    });

}

exports.logout = function (req, res) {
    req.logout();
    return res.success();
}

exports.activateAccount = function (req, res) {
    try
    {
        var key             = req.ensureParam("key");
        var username        = req.ensureParam("username", "string", true);
        var password        = req.ensureParam("password", "string", true);
        var password2       = req.ensureParam("password2", "string", true);
        var surname         = req.ensureParam("surname", "string", true);
        var given_name      = req.ensureParam("given_name", "string", true);
        var contact         = req.ensureParam("contact", "string", true);
    }
    catch(e)
    {
        return res.error(e);
    }

    Users.getUserByActivationKey (key, function (err, user, entry) {

        if (err) {
            console.log(err);
            return res.redirect('/activation-error.html');
        }

        if (password && password2) {

            if (password == password2) {

                var params = {
                    password:   password,
                    surname:    surname,
                    given_name: given_name,
                    contact:    contact
                }

                Users.activateAccount (entry.user_id, params, function (err) {
                    if (err) {
                        return res.error(err);
                    }

                    passport.authenticate('local')(req, res, function () {
                        res.cookie('email_cookie', req.user.email, { maxAge: config.server.session.maxAge });
                        return res.success();
                    });
                });

            } else {
                return res.error("Passwords are not the same!");
            }

        } else {
            return res.redirect("/account-activation.html?key=" + entry.user_key + '&username=' + user.username);
        }
    })
}

exports.getInfo = [
    function (req, res, next) {
        if (!req.isAuthenticated()) {
            return res.error("Please Log In!");
        }

        next();
    },

    function(req, res){
        return res.json(200, {
            user: req.user
        });
    }
]

exports.getAdminUser = [
    function (req, res, next) {
        if (!req.isAuthenticated()) {
            return res.error("Please Log In!");
        }

        next();
    },

    function(req, res){

        if (req.user.role != config.server.UserRole.ADMIN) {
            return res.error();
        }

        return res.json(200, {
            user: req.user
        });
    }
]

exports.getProvider = [
    function (req, res, next) {
        if (!req.isAuthenticated()) {
          return res.error("Please Log In!");
        }

        next();
    },

    function(req, res){

        if (req.user.role != config.server.UserRole.PROVIDER) {
          return res.error();
        }

        return res.json(200, {
          user: req.user
        });
    }
]

exports.getUserList = [
    function (req, res, next) {
        if (!req.isAuthenticated()) {
            return res.error("Please Log In!");
        }

        next();
    },

    function(req, res){

        if (req.user.role != config.server.UserRole.ADMIN) {
            return res.error();
        }

        try
        {
            var params = {
                offset: 	req.ensureParam("offset", null, true),
                limit: 		req.ensureParam("limit", null, true),
                filter:     req.ensureParam("filter", "object", true) || {}
            }
        }
        catch(e)
        {
            return res.error(e);
        }

        Users.fetchUserByFilter (params, function (err, users, total) {

            if (err) {
                return res.error(err);
            }

            return res.json(200, {
                users: users,
                total: total
            })
        })
    }
]

exports.disableUser = [
    function (req, res, next) {
      if (!req.isAuthenticated()) {
        return res.error("Please Log In!");
      }

      next();
    },

    function(req, res){

        if (req.user.role != config.server.UserRole.ADMIN) {
            return res.error();
        }

        try
        {
            var id  = req.ensureParam("id");
        }
        catch(e)
        {
            return res.error(e);
        }

        Users.disableUser (id, function (err) {

            if (err) {
              return res.error(err);
            }

            return res.success();

        })
    }
]

exports.activateUser = [
    function (req, res, next) {
      if (!req.isAuthenticated()) {
        return res.error("Please Log In!");
      }

      next();
    },

    function(req, res){

        if (req.user.role != config.server.UserRole.ADMIN) {
            return res.error();
        }

        try
        {
            var id  = req.ensureParam("id");
        }
        catch(e)
        {
            return res.error(e);
        }

        Users.activateUser (id, function (err) {

            if (err) {
              return res.error(err);
            }

            return res.success();

        })
    }
]


//POST /api/user/updateinfo
exports.updateInfo = [
    function (req, res, next) {
        if (!req.isAuthenticated()) {
            return res.error("Please Log In!");
        }

        next();
    },

    function(req, res){

        if (req.user.role != config.server.UserRole.ADMIN) {
            return res.error();
        }

        try
        {
            var params = {
                id:         req.ensureParam("_id", null),
                surname: 	  req.ensureParam("surname", "string"),
                given_name: req.ensureParam("given_name", "string"),
                role:       req.ensureParam("role",   "string"),
                status:     req.ensureParam("status", "string")
            }

        }
        catch(e)
        {
            return res.error(e);
        }

        Users.updateInfo(params, function (err) {
            if (err) {
                return res.error();
            }

            return res.success();
        });
    }
]

module.exports.GetAvatar = Users.GetAvatarId;
