"use strict";

var app = require('http').createServer(handler)
var io = require('socket.io')(app);
var fs = require('fs');
var request = require('request').defaults({encoding: null});
var is = require('type-is');
var querystring = require('querystring');

app.listen(3030);

function handler(req, res) {
    fs.readFile(__dirname + '/index.html',
        function (err, data) {
            if (err) {
                res.writeHead(500);
                return res.end('Error loading index.html');
            }
            res.writeHead(200);
            res.end(data);
        });
}

function ab2str(buf) {
    return String.fromCharCode.apply(null, new Uint16Array(buf));
}

io.on('connection', function (socket) {
    socket.on('request', function (requestObject) {

        console.log('-----------');
        console.log(requestObject);

        requestObject.headers['x-forwarded-for'] = socket.request.connection.remoteAddress;

        // Cookie
        var j = request.jar();
        var cookie = request.cookie(querystring.stringify(requestObject.cookies) || 'key1=value1');
        j.setCookie(cookie, requestObject.url);

        request({
            url: requestObject.url,
            headers: requestObject.headers,
            jar: j
        }, function (error, response, body) {

            var responseObject = {
                uuid: requestObject.uuid,
                cookies: requestObject.cookies
            };

            if (is(response, ['image/*'])) {
                responseObject.data = "data:" + response.headers["content-type"] + ";base64," + new Buffer(body).toString('base64');
            } else {
                responseObject.data = ab2str(body)
            }

            socket.emit('response', responseObject);
        });
    });
});

