/**
 * Created by linhnh on 1/4/15.
 */
var fs 					= require("fs");
var config				= require("./../config");

var EmailTemplates = {};

EmailTemplates[config.server.EmailType.AccountActivation] =
{
    title: "Account Activation",
    html:   fs.readFileSync("smove_modules/email_templates/email-account-activation.html").toString()
}

exports.EmailTemplates = EmailTemplates;