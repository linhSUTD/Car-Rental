var express = require('express');
var router = express.Router();
var multer = require('multer');
var fs = require('fs');
var mongoose = require('./Database.js');
var path = require('path');
var config = require('../config');
var UserDB = require('./database_schema.js').UserDB;

var Grid = require('gridfs-stream');
Grid.mongo = mongoose.mongo;
var GridFs = Grid(mongoose.createConnection(config.server.mongoDbConnectionString).db);



//handling files upload
//checking authentication
router.use('/avatar', function (req, res, next) {
    console.log(req.user.email);
    if (!req.user) { 
        //return res.status(401).end();
    }
    next();
});




router.use(multer({
    dest: './uploads/',
    rename: function (fieldname, filename, req, res) {
        req.files.fieldname = fieldname;
        switch (req.originalUrl) {
            default:
                break;
            case '/upload/avatar':
                console.log('fieldname is ' + fieldname);
                console.log('filename is ' + filename);
                return req.user._id.toString() + '_avatar';
                break;
        }
    },
    onFileUploadStart: function (file, req, res) {
        console.log(file.fieldname + ' is starting ...');
    },
    onFileUploadData: function (file, data, req, res) {
        console.log(data.length + ' of ' + file.fieldname + ' arrived');
    },
    onFileUploadComplete: function (file, req, res) {
        console.log(file.fieldname + ' uploaded to  ' + file.path);
    },


}));


router.all('/avatar', function (req, res) {
    var removeTempFile = function (filepath) { 
        fs.unlink(filepath);  
    };

    var file = req.files[req.files.fieldname];
    console.log('GHEY HEY');
    console.log(JSON.stringify(req.files));
    
    //find existing userAvatar
    UserDB.findById(req.user._id).lean().select('avatar').exec(function (findErr, findDoc) {
        if (findErr) {
            removeTempFile(file.path);
            return res.status(500).end();
        }
        if (!findDoc) { 
            removeTempFile(file.path);
            return res.status(409).end();
        }

        //remove existing user avatar
        GridFs.files.findOneAndDelete({ _id: mongoose.mongo.ObjectID(findDoc.avatar) }, function (err) {
            if (err) {
                console.log(err);
                removeTempFile(file.path);
                return res.status(500).end();
            }
            var readStream = fs.createReadStream(file.path);
            var writeStream = GridFs.createWriteStream({
                filename: req.user._id.toString() + '_avatar',
                content_type: 'image/jpeg',
            });
            readStream.pipe(writeStream);
            
            writeStream.on('close', function (writeFile) {
                console.log('writing finish');
                console.log(JSON.stringify(writeFile));
                removeTempFile(file.path);
                //let;s update the user's avatar field
                UserDB.update({ _id: req.user._id }, {
                    $set: { avatar: writeFile._id }
                }).exec(function (err, doc) {
                    if (err) {
                        console.log(err);
                        return res.status(409).end();
                        
                    }
                    return res.status(200).end();
                });
            });
        });
    });

    
});


module.exports = router;