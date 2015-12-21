/**
 * Created by linhnh on 26/3/15.
 */
var config          = require('./../config');
var UserDB          = require('./database_schema.js').UserDB;
var ActivationDB    = require('./database_schema.js').ActivationDB;
var Common          = require('./common.js').Common;
var async           = require('async');
var bcrypt 	        = require("bcrypt");
var Email           = require('./email.js').Email;
var Providers       = require('./provider-module.js').Providers;
var async           = require('async');


var Users = new (function () {

    function getUserByEmail (email, callback) {

        var query = UserDB.findOne({email: email});

        query.exec(function (err, user) {
            if (err) {
                return callback(err, null);
            }

            return callback(null, user);

        })
    }

    function saltAndHash (pass, callback) {
        bcrypt.genSalt (10, function (err, salt) {
            bcrypt.hash (pass, salt, function (err, hash) {
                return callback (hash);
            })
        })
    }

    function clearAllUsers (callback) {
        UserDB.remove ({}, function (err) {

            if (err) {
                return callback(err);
            }

            return callback();
        });
    }

    function generateRandomUser (userDoc,callback) {

        saltAndHash(userDoc.password, function (hash) {
            userDoc.password = hash;
            var user = new UserDB (userDoc);
            user.save( function (err,saveDoc) {
                if (err) {
                    return callback(err,null);
                }

                return callback(null, saveDoc);
            })
        })

    }

    function getUserByUserName (username, callback) {

        var query = UserDB.findOne({username: username});

        query.exec(function (err, user) {
            if (err) {
                return callback(err);
            }

            if (!user) {
                return callback("User not found!");
            }

            return callback(null, user);
        })
    }

    function getUserByID (id, callback) {

        var query = UserDB.findOne({'_id': id});

        query.exec(function (err, user) {
            if (err) {
                return callback(err);
            }

            if (!user) {
                return callback("User not found!");
            }

            return callback(null, user);
        })

    }

    function registerNewUser (params, callback) {

        Common.isUserValid(params, function (err) {
            if (err) {
                return callback(err);
            }

            getUserByEmail(params.email, function (err, user) {

                if (err) {
                    return callback (err);
                }

                if (user) {
                    return callback ("Existing user!");
                }

                if (params.password) {

                } else {
                    console.log(params.username);

                    var new_user = new UserDB({username: params.username, email: params.email, password: "", given_name: "", surname: "", contact: "", role: params.role, status: config.server.UserStatus.INACTIVE});

                    new_user.save( function (err) {
                        if (err) {
                            return callback(err);
                        }

                        return callback(null, new_user);
                    })
                }
            })
        });
    }

    function requestAccountActivation (user, callback) {

        console.log("Account Activation for user %s requested".magenta, user.id);

        // Create a reset entry in the database
        var expire_date = new Date(Date.now() + config.server.system.ActivationLifeSpan * 60 * 60 * 1000);

        var user_key   = Common.generateRandomString(30);

        var newEntry = new ActivationDB({user_id: user.id, user_key: user_key, expired: expire_date});

        newEntry.save(function (err) {
            if (err) {
                return callback(err);
            }

            var url = config.server.web.activateAccountUrl + user_key;

            callback();

            Email.sendTemplateEmail(config.server.EmailType.AccountActivation,  {
                user: user,
                url: url,
                sender: {
                    email:  config.server.system.senderEmail,
                    name:   config.server.system.senderEmailName,
                    url:    config.server.WebURL
                }
            }, {email: user.email}, function(err)
            {
                if (err) {
                    console.log(err);
                }
            });

        })
    }

    function getUserByActivationKey (activation_key, callback) {
        var query = ActivationDB.findOne({user_key: activation_key});

        query.exec(function (err, entry) {
            if (err) {
                return callback(err);
            }

            if (!entry) {
                return callback ("Activation Entry not found!");
            }

            getUserByID (entry.user_id, function (err, user) {
                if (err) {
                    return callback(err);
                }

                if (!user) {
                    return callback ("User not found!");
                }

                return callback(null, user, entry);
            })
        })
    }

    function activateAccount (userID, params, callback) {

        saltAndHash(params.password, function (hash) {
            UserDB.update ({_id: userID}, {'$set': {'password': hash, 'given_name': params.given_name, 'surname': params.surname, 'contact': params.contact, 'status': config.server.UserStatus.ACTIVE}}, function (err) {

                if (err) {
                    return callback (err);
                }

                ActivationDB.find({user_id: userID}).remove().exec();

                callback();
            });
        });

    }

    function fetchUserByFilter (params, callback) {

        var filter = {};

        if (params.filter) {
            if (params.filter.surname && params.filter.surname.length) {
                var surname = ".*" + params.filter.surname + ".*";
                filter.surname = new RegExp(surname);
            }

            if (params.filter.given_name && params.filter.given_name.length) {
                var given_name      = ".*" + params.filter.given_name + ".*";
                filter.given_name   = new RegExp(given_name);
            }

            if (params.filter.email && params.filter.email.length) {
                var email      = ".*" + params.filter.email + ".*";
                filter.email   = new RegExp(email);
            }

            if (params.filter.role && params.filter.role.length) {
                filter.role    = params.filter.role;
            }

            if (params.filter.status && params.filter.status.length) {
                filter.status  = params.filter.status;
            }

        }

        async.parallel([
            function (cb) {
                var query = UserDB.find(filter).skip(params.offset).limit(params.limit);

                query.exec(function (err, users) {

                    if (err) {
                        return cb (err);
                    }

                    return cb (null, users);
                })
            },

            function (cb) {

                var query = UserDB.count(filter);

                query.exec(function (err, count) {

                    if (err) {
                        return cb (err);
                    }

                    return cb (null, count);
                })
            }
        ], function (err, results) {

            if (err) {
                return callback(err);
            }

            return callback(null, results[0], results[1]);
        });
    }

    //update user info
    function updateInfo (params, callback) {

        var query = UserDB.findOne({_id: params.id});

        query.exec(function (err, user) {
            if (err) {
                return callback(err);
            }

            if (!user) {
                return callback("User not found!");
            }

            async.series([
                function (cb) {
                    if (user.role != params.role && user.role == config.server.UserRole.PROVIDER) {

                        Providers.RemoveProvider(user.providerId, function (err) {

                            user.providerId = null;

                            return cb(err, null);
                        });

                    } else {
                        return cb (null, null);
                    }
                },

                function (cb) {
                    if (user.role != params.role && params.role == config.server.UserRole.PROVIDER) {
                        Providers.CreateProvider(function (err, newProvider) {

                            user.providerId = newProvider._id;

                            return cb (err, null);
                        });

                    } else {
                        return cb (null, null);
                    }
                }

            ], function (err, results) {

                if (err) {
                    return callback(err);
                }

                UserDB.findOneAndUpdate({ _id: params.id }, { $set: {given_name: params.given_name, surname: params.surname, role: params.role, status: params.status, providerId: user.providerId } }, function (err) {
                    return callback(err);
                });


            })

        })
    }

    var GetAvatarId = function(userId,callback) {
        UserDB.findById(userId).select('avatar').lean().exec(function (err, doc) {
            callback(err, doc);
        });
    }

    function activateUser (id, callback) {
        UserDB.findOneAndUpdate({ _id: id }, { $set: {status: config.server.UserStatus.ACTIVE} }, function (err) {
            return callback(err);
        });
    }

    function disableUser (id, callback) {
        UserDB.findOneAndUpdate({ _id: id }, { $set: {status: config.server.UserStatus.SUSPENDED} }, function (err) {
            return callback(err);
        });
    }


    this.GetAvatarId                = GetAvatarId;
    this.updateInfo                 = updateInfo;
    this.getUserByEmail             = getUserByEmail;
    this.saltAndHash                = saltAndHash;
    this.generateRandomUser         = generateRandomUser;
    this.clearAllUsers              = clearAllUsers;
    this.getUserByUserName          = getUserByUserName;
    this.getUserByID                = getUserByID;
    this.registerNewUser            = registerNewUser;
    this.requestAccountActivation   = requestAccountActivation;
    this.getUserByActivationKey     = getUserByActivationKey;
    this.activateAccount            = activateAccount;
    this.fetchUserByFilter          = fetchUserByFilter;
    this.activateUser               = activateUser;
    this.disableUser                = disableUser;
})

exports.Users = Users;

