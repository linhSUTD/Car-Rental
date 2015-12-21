var config              = require('./config');
var express             = require('express');
var app                 = express();
var path                = require('path');
var logger              = require('morgan');
var http                = require('http');
var expressSession      = require('express-session');
var MongoStore          = require('connect-mongo')(expressSession);
var mongoose            = require('./smove_modules/Database.js');
var cookieParser        = require('cookie-parser');
var bodyParser          = require('body-parser');
var methodOverride      = require('method-override');
var json                = require('json');
var users               = require('./users');
var cars                = require('./cars');

var passport            = require('passport');
var Upload              = require('./smove_modules/upload.js');
var fs                  = require('fs');

/* Upload large file to mongodb */
var Grid                = require('gridfs-stream');
Grid.mongo = mongoose.mongo;
ROOTDIR = __dirname;
var GridFs              = Grid(mongoose.createConnection(config.server.mongoDbConnectionString).db);




var sessionStorage = new MongoStore({
    db: config.server.mongo.dbName,
    host: config.server.mongo.host,
    port: config.server.mongo.port,
    username: config.server.mongo.user,
    password: config.server.mongo.password,
    collection: config.server.session.collectionName
});

var app = express();

//cross origin
app.use(function (req, res, next) {
    res.header('Access-Control-Allow-Origin', "*");
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
    //        res.header('Access-Control-Allow-Headers', 'Content-Type');
    res.header("Access-Control-Allow-Headers", "X-Requested-With");
    res.header('Access-Control-Allow-Credentials', true);

    res.header('Cache-control', 'no-cache, no-store, private');
    res.header('Pragma', 'no-cache');
    res.header('Expires', '-1');

    next();
});
app.use(logger('dev'));

app.use(bodyParser.json());

app.use(bodyParser.urlencoded({
    extended: true
}));

app.use(methodOverride());

app.use(cookieParser());

app.sessionObject = {
    secret:     config.server.session.secret,
    store:      sessionStorage,
    key:        "jschallenge",
    cookie:     { maxAge: config.server.session.maxAge },
    maxAge:     config.server.session.maxAge,
    resave:     true,
    saveUninitialized: true
};

app.use(expressSession(app.sessionObject));


app.use(passport.initialize());
app.use(passport.session());




console.log("JSChallenge Server started on port %d ", config.server.PUBLIC_PORT);

http.ServerResponse.prototype.success = function(data)
{
    data = data || {};
    data.success = true;
    this.json(data);
};

//Return 400 HTTP code with a error json message
http.ServerResponse.prototype.error = function(code, err)
{
    // [ 1, "Error message" ]
    if (Array.isArray(code))
    {

        err = code[1];
        code = code[0];
    }
    // { error: "Error message", code: 1 }
    else if (typeof code == "object" && code.error && code.code)
    {
        err = code.error;
        code = code.code;
    }

    var msg = err || ""; //util.format.apply(this, arguments);
    if(config.server.DEBUG)
    {

        console.debug((err && err.stack) || msg)
    }

    if(msg.toString().indexOf("Error: ER") != -1)
    {
        msg = config.server.DEBUG ? msg : "Invalid Request";
        code = 400;
    }

    this.status(400);
    this.json({ error: msg.toString(), errorCode: code });
};


http.IncomingMessage.prototype.ensureParam = function(name, type, optional)
{
    var val = this.params[name] || this.body[name]||this.query[name];

    if (!optional && (val === null || val === undefined || val === "")) throw "Non-optional paramater '"+name+"' is missing";
    if (type && val != null)
    {
        var t = type.toLowerCase();
        if (t == "array")
        {
            if (!Array.isArray(val)) throw "Paramater '"+name+"' is expected to be of type Array";
        }
        else
        if (typeof val != t) throw "Parameter '"+name+"' is expected to be of type "+type;
    }
    return val;
}

app.use(express.static(path.join(__dirname, '/app')));

require('./auth');




//handle files upload
app.use('/upload',Upload);

//serving avatar
app.get('/avatar/:id', function (req, res) {
    var sendAnonymous = function (){
        var readStream = fs.createReadStream(path.join(__dirname + '/app/images/anonymous.png'));
        readStream.pipe(res);
        return null;
    }

    var userId = req.params.id;
    console.log('request avar for id ' + userId);
    if (!userId) {

    }

    users.GetAvatar(userId, function (userErr, userDoc) {
        if (userErr || !userDoc) {
            console.log(userErr);
            return sendAnonymous();
        }

        console.log('avatar: '+ userDoc.avatar);

        GridFs.files.findOne({ "_id": mongoose.mongo.ObjectID( userDoc.avatar )}, function (err, file) {

            if (err) {
                console.log(err);
                return sendAnonymous();
            }

            if (file) {
                console.log(file);
                var readStream = GridFs.createReadStream({ _id: file._id });
                readStream.pipe(res);
            } else {
                console.log('not found');
                return sendAnonymous();
            }
        //console.log('file stream ' + JSON.stringify(readStream));

        });
    });


});


/* User-Related APIs */
app.get('/api/user/generateRandomUser',      users.generateRandomUser);
app.post('/api/user/login',                  users.login);
app.post('/api/user/register',               users.register);
app.get('/api/user/logout',                  users.logout);
app.all('/api/activateAccount/:key',         users.activateAccount);
app.get('/api/user/getinfo',                 users.getInfo);

/* Admin-User APIs */
app.get('/api/admin/getinfo',                users.getAdminUser);
app.post('/api/admin/getUserList',           users.getUserList);
app.post('/api/admin/disableUser',           users.disableUser);
app.post('/api/admin/activateUser',          users.activateUser);
app.post('/api/user/updateinfo',             users.updateInfo);


/* Provider-User APIs */
app.get('/api/provider/getinfo',             users.getProvider);


/* Car-Related APIs */
app.post('/api/car/searchpark',              cars.SearchPark);
app.post('/api/car/addcar',                  cars.AddCar);
app.get('/api/car/search/nearby',            cars.GetNearByCar);
app.post('/api/car/buildpark/',              cars.BuildParkingLot);
app.post('/api/car/editCar',                 cars.editCar);

app.post('/api/car/getlist/provider',        cars.GetListByProvider);
app.post('/api/car/getlist/park',            cars.GetListByPark);
app.post('/api/car/relocate',                cars.RelocateCar);

module.exports = app;
