/**
 * Created by nguyenlinh on 5/12/15.
 */
var config          = require('./../config');
var ProviderDB      = require('./database_schema.js').ProviderDB;
var UserDB          = require('./database_schema.js').UserDB;
var Common          = require('./common.js').Common;
var async           = require('async');
var bcrypt 	        = require("bcrypt");
var Email           = require('./email.js').Email;
var Providers       = require('./provider-module.js').Providers;
var async           = require('async');

var Providers = new (function () {

    var CreateProvider = function (callback) {
        var newProvider = new ProviderDB({});
        newProvider.save(function (err, saveDoc) {
            return callback(err, saveDoc);
        });
    }

    var RemoveProvider = function (id, callback) {
        ProviderDB.findOne({ _id: id }).remove().exec(function (err) {
            return callback(err);
        });
    }

    this.RemoveProvider = RemoveProvider;
    this.CreateProvider = CreateProvider;
});

exports.Providers = Providers;
