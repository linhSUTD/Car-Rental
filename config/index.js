/**
 * Created by linhnh on 24/3/15.
 */

//
// The configuration options of the server
//
/**
 * General Server Configuration
 */
var PUBLIC_PORT = 4000;		//Port used by public to access the site
var PROTOCOL    = "http";
var HOST        = "localhost";
var WebURL = PROTOCOL + "://" + HOST + ":" + PUBLIC_PORT;
var path = require('path');
var mongo = {
    host: "127.0.0.1",
    port: "27017",
    user: "",
    password: "",
    dbName: "jschallenge"
};

module.exports.server = {
    mode: 'dev',

    PUBLIC_PORT: PUBLIC_PORT,

    WebURL: WebURL,

    web:
    {
        activateAccountUrl:     WebURL+"/api/activateAccount/"
    },

    system:
    {
        ActivationLifeSpan:     24,
        passwordResetLifespan:	24,
        MandrillKey:			"tluFDn_9dIdq5uKQSDwAMA",
        internalEmailUser:		"linhnh@kaist.ac.kr",
        internalEmailPass:		"OIU3_JIe1MAYGol3pkpbjw",
        internalEmailHost:		"smtp.mandrillapp.com",
        senderEmail:			"linhnh@kaist.ac.kr",
        senderEmailName:		"Admin",
        dailyCheckInterval:     24,
        lastDailyCheck:         new Date(2014, 9, 1),
        lastCurrencyUpdate:     new Date(2014, 9, 1)
    },

    mongo: mongo,

    constants: {
        poolIdleTimeout:		10000,		// after how much time will the db pool connection be forcibly returned to the pool
        keepAliveInterval:		600000,		// 5 minutes
        maxSimultaneousPaymentRequests: 10,
        maxSimultaneousElements: 20
    },

    /**
     * Session configuration
     *
     * maxAge - The maximum age in milliseconds of the session.  Use null for
     * web browser session only.  Use something else large like 3600000 * 24 * 7 * 52
     * for a year.
     * secret - The session secret that you should change to what you want
     * dbName - The database name if you're using Mongo
     */
    session: {
        maxAge: 3600000 * 24,
        secret: "Kn4bO04Ad",
        dbName: "knxadmin",
        collectionName: "sessions",
        maxAgeIfRemember: 3600000 * 24 * 14
    },

    EmailType:
    {
        AccountActivation:              0
    },

    UserStatus:
    {
        ACTIVE:     'active',
        INACTIVE:   'inactive',
        SUSPENDED:  'suspended'
    },

    UserRole:
    {
        ADMIN:      'Admin',
        PROVIDER:   'Provider',
        PUBLIC:     'Public'
    },

    mongoDbConnectionString: 'mongodb://' + mongo.host + ':' + mongo.port + '/' + mongo.dbName,


    RootDir : path.dirname('..'),
}
