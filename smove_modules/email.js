/**
 * Created by linhnh on 1/4/15.
 */
var config              = require('./../config');
var EmailTemplates	    = require("./email-template.js").EmailTemplates;
var EmailQueueDB        = require('./database_schema.js').EmailQueueDB;
var async 				= require("async");
var util 				= require("util");
var fs 					= require("fs");
var emailjs				= require("emailjs");
var utf8                = require("utf8");



var Email = new (function()
{
    /**
     * Send e-mail via Mandrill
     * @param html
     * @param subject
     * @param to
     * @param [callback]
     * @param [attachments]
     * @param [dontQueue]
     * @param {senderInfo}
     * @param emailTemplate
     */
    function sendEmail(html, subject, to, callback, attachments, dontQueue, emailTemplate)
    {
        if (!to) {
            return callback && callback();
        }
        //to is not array and to.email == undefined
        if(!(to instanceof Array) && !to.email ){
            return callback && callback();
        }

        var recipients = null;
        if(to instanceof Array)
            recipients = to;
        else recipients = [to];

        var json =
        {
            key: config.server.system.MandrillKey,
            message:
            {
                html:			html,
                text:			html,
                subject:		subject,
                from_email:		config.server.system.senderEmail,
                from_name:		config.server.system.senderEmailName,
                to:				recipients,
                track_opens:	true,
                track_clicks:	true,
                auto_text:		false,
                preserve_recipients: false,
                attachments:	attachments
            },
            async: true
        };


        var internalMessage = {
            text: html,
            from: (config.server.system.senderEmailName) + " <" + config.server.system.senderEmail + ">",
            to: recipients.map(function(recipient)
            {
                return recipient.name + " <" + recipient.email + ">"
            }).join(","),
            subject: subject,
            attachment:	(attachments || []).map(function(attachment)
            {
                return {
                    type: attachment.type,
                    name: attachment.name,
                    data: attachment.content
                }
            })
        }

        internalMessage.attachment.push({data: html,alternative: true});

        function sendInternal(cb)
        {

            var server = emailjs.server.connect({
                user:       config.server.system.internalEmailUser,
                password:   config.server.system.internalEmailPass,
                host:       config.server.system.internalEmailHost
            })

            server.send(internalMessage, function(err, message)
            {
                if(err) return cb(err);

                console.log("Internal Email sent to: " + internalMessage.to);

                cb();
            })

        }


        if (dontQueue)
        {
            // in case we just want to send this email withouting queuing it up in the database

            sendInternal(function(err)
            {
                if (err) return callback && callback(err);
                callback && callback();
            });

        }
        else
        {

            var newEmail = new EmailQueueDB({create_date: new Date(), message: JSON.stringify(internalMessage), type: emailTemplate});

            newEmail.save(function(err) {
                if (err) {
                    return callback (err);
                }

                sendInternal(function(err){
                    if (err) {
                        return callback (err);
                    }

                    var id = newEmail.id;

                    EmailQueueDB.find({ _id: id }).remove().exec();

                    callback();
                })
            })
        }
    }

    /**
     * Ftch all unsent emails from the database and send them out in batches
     * @param callback
     */
    function resendQueuedEmails(callback)
    {
        var now = new Date().getTime();

        var query = EmailQueueDB.find({});

        query.exec(function (err, emails) {
            if (err) {
                return callback(err);
            }

            async.eachLimit(emails, config.server.constant.maxSimultaneousElements, function (email, next) {

                var created = new Date(email.created_date).getTime();

                if (now - created < 1000 * 60 * 60) return next();

                var server = emailjs.server.connect({
                    host: config.server.system.internalEmailHost
                });

                var message = JSON.parse(email.message);

                server.send(message, function(err, message)
                {
                    if(err) console.error("Error while resending email: ", err);

                    if (!err)
                    {
                        EmailQueueDB.remove({_id: email.id});
                    }

                    next();
                })
            }, callback);

        })
    }


    /**
     * Create E-mail object from template
     * @param template
     * @param params
     */
    function createEmailFromTemplate(template, params)
    {

        var email =
        {
            title: 	template.title,
            html:	template.html
        };


        // process e-mail template (depending on aux data supplied)
        if (params.user)
            email.html = email.html
                .replace(/\[USERNAME\]/g, 	params.user.username.split('@')[0] || params.user.email.split('@')[0])
                .replace(/\[NAME\]/g, 		params.user.surname)
                .replace(/\[EMAIL\]/g, 		params.user.email)

        if (params.sender)
        {
            email.html = email.html.replace(/\[CONTACT_EMAIL\]/g,	    params.sender.email);
            email.html = email.html.replace(/\[SENDER_EMAIL_NAME\]/g,	params.sender.name);
            email.html = email.html.replace(/\[SENDER_HOME_URL\]/g,	    params.sender.url);
        }

        if (params.url)
            email.html = email.html
                .replace(/\[URL\]/g, 	params.url);

        if (params.password)
            email.html = email.html
                .replace(/\[PASSWORD\]/g, params.password);

        if (params.transaction)
            email.html = email.html
                .replace(/\[TRANSACTION_ID\]/g, params.transaction.id);

        if(params.secret)
            email.html = email.html.replace(/\[SECRET\]/g, params.secret);

        return email;
    }


    /**
     * Create and send email from template
     * @param type
     * @param params
     * @param publisherId
     * @param to
     * @param [callback]
     * @param [attachments]
     */
    function sendTemplateEmail(type, params, to, callback, attachments)
    {

        var template = EmailTemplates[type];

        if (!template) return callback && callback("Invalid e-mail template type: " + type);

        var email = createEmailFromTemplate(template, params);

        sendEmail(email.html, email.title, to, callback, attachments, false, type);
    }


    // Interface
    this.sendEmail						= sendEmail;
    this.createEmailFromTemplate		= createEmailFromTemplate;
    this.sendTemplateEmail				= sendTemplateEmail;
    this.resendQueuedEmails				= resendQueuedEmails;
})();


exports.Email = Email;



