var http = require('http');
var fs = require('fs');
var url = require('url');
var cookie = require('cookie');
var qs = require('querystring');

var app = http.createServer(function(request, response) {
    var _url = request.url;

    //var cookies = cookie.parse(request.headers.cookie);

    console.log(_url);
    console.log(request.headers.cookie);

    if (_url === '/') {
        _url = '/login.html';
        var flist = fs.readdirSync(__dirname + '/html/');
        console.log(flist);
        console.log(flist.length);
        response.end(fs.readFileSync(__dirname + '/html/' + _url));
        response.writeHead(200)
    } else if (_url === '/game') {
        var body = '';
        var post = '';

        request.on('data', function(data) {
            body += data;
            // Too much POST data, kill the connection!
            // 1e6 === 1 * Math.pow(10, 6) === 1 * 1000000 ~~~ 1MB
            if (body.length > 1e6) {
                request.connection.destroy();
            }
        });

        request.on('end', function () {
            post = qs.parse(body);
            console.log(post);

            if (post.makeRoom !== undefined) {
                response.end('Make Room!!');
            } else {
                response.end('Enter Room!!');
            }
        });

        response.writeHead(200)
    } else if (_url === 'cookie') {
        response.end(fs.readFileSync(__dirname + '/html/' + _url));
        response.writeHead(200, {
            'Set-Cookie': [
                'yummy_cookie=choco',
                'taste_cookie=strawberry',
                `permanent=forever; Max-Age=3600`,
                //'secure=scure_value; Secure',
            ]
        });
    } else {
        response.writeHead(404);
        response.end('Not found');
        return;
    }
});

app.listen(3000);