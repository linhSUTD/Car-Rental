var express     = require('express');
var app         = express();
var mongoose    = require('mongoose');
var config      = require('../config');



mongoose.connect(config.server.mongoDbConnectionString);


module.exports = mongoose;