var app = require('./app');
var config = require('./config');
var http = require('http');
var server = http.createServer(app);


server.listen(config.server.PUBLIC_PORT, function () {
    console.log("Web server process listening on %s:%d ", "localhost", config.server.PUBLIC_PORT);
});