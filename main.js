var http = require('http');
var fs = require('fs');
var url = require('url');
var cookie = require('cookie');
var qs = require('querystring');

var map_userIdPw = new Map();
var map_roomIdPw = new Map();

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
        response.writeHead(200);
        response.end(fs.readFileSync(__dirname + '/html/' + _url));        
    } else if (_url === '/lobby') {        
        response.writeHead(200);
        response.end(fs.readFileSync(__dirname + '/html/lobby.html'));        
    } else if (_url === '/login_process') {
        login_process(request, response);        
    } else if (_url === '/lobby_process') {
        lobby_process(request, response);        
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

function login_process(request, response) {
    var body = '';

    request.on('data', function (data) {
        body += data;
        // Too much POST data, kill the connection!
        // 1e6 === 1 * Math.pow(10, 6) === 1 * 1000000 ~~~ 1MB
        if (body.length > 1e6) {
            request.connection.destroy();
        }
    });

    request.on('end', function () {
        var post = qs.parse(body);
        var ret;
        console.log(post);

        if (map_userIdPw.has(post.userId)) {
            response.writeHead(200);
            response.end('Error!!: Duple Nickname');            
            return;
        }

        map_userIdPw.set(post.userId, post.userPw);

        response.writeHead(302, {
            'Set-Cookie': [
                `id=${post.userId}`,
                `permanent=forever; Max-Age=3600`,
                //'secure=scure_value; Secure',
            ],
            'Location': '/lobby'
        });        
        response.end();
    });    
}

function lobby_process(request, response) {
    var body = '';

    request.on('data', function (data) {
        body += data;
        // Too much POST data, kill the connection!
        // 1e6 === 1 * Math.pow(10, 6) === 1 * 1000000 ~~~ 1MB
        if (body.length > 1e6) {
            request.connection.destroy();
        }
    });

    request.on('end', function () {
        var post = qs.parse(body);
        var ret;
        console.log(post);

        if (post.makeRoom !== undefined) {
            if (map_roomIdPw.has(post.roomId)) {
                response.end('Error!!: Duple Room Number');
                return
            }

            var obj = new Object();

            obj.pw = post.roomPw;
            obj.host = "host_ahj";
            obj.guest = new Set([obj.host]);
            map_roomIdPw.set(post.roomId, obj)
            
            console.log('Make Room!!');
        } else {
            if (!map_roomIdPw.has(post.roomId)) {
                response.writeHead(200);
                response.end('Error!!: There is no Room');
                return
            }

            if (map_roomIdPw.get(post.roomId).pw !== post.roomPw) {
                response.writeHead(200);
                response.end('Error!!: Wrong Password');
                return
            }

            map_roomIdPw.get(post.roomId).guest.add("guest_ahj");            
            console.log('Enter Room!!');
        }

        response.writeHead(200);
        response.end('Room');

        console.log(map_roomIdPw);
    });    
}

app.listen(3000);