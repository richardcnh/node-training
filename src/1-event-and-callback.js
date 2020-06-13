'use strict';

const http = require('http');
http.createServer(function(req, res) {
    let postData = '';
    req.setEncoding('utf8');
    req.on('data', function(trunk) {
        postData += trunk;
    });

    req.on('end', function() {
        res.end(postData);
    });
}).listen(8080);

console.log('Server started, listenning port: 8080');
