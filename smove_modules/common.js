/**
 * Created by linhnh on 26/3/15.
 */
var crypto          = require('crypto');
var async           = require('async');
var bcrypt 	        = require("bcrypt");


var Common = new (function () {

    function isEmailValid (email)
    {
        if (!email) return false;
        var filter = /^([a-zA-Z0-9_\.\-])+\@(([a-zA-Z0-9\-])+\.)+([a-zA-Z0-9]{2,4})+$/;
        return filter.test(email);
    };


    function isUserValid (user, callback)
    {

        if (!user)
        {
            callback && callback("Invalid user object");
            return false;
        }

        if (!isEmailValid(user.email))
        {
            return callback && callback("E-Mail address is not valid");
        }

        return callback && callback();
    }

    function generateRandomString (length)
    {
        var charset = "QWERTYUIOPLKJHGFDSAZXCVBNMqwertyuioplkjhgfdsazxcvbnm1234567890";
        var s = new Array(length);
        for (var i = 0; i < length; i++)
            s[i] = charset.charAt((Math.random() * charset.length) | 0);
        return s.join("");
    }

    this.isEmailValid           = isEmailValid;
    this.isUserValid            = isUserValid;
    this.generateRandomString   = generateRandomString;

});


exports.Common = Common;
