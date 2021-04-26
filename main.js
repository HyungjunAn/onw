var http = require('http');
var fs = require('fs');
var url = require('url');
var cookie = require('cookie');
var qs = require('querystring');

var map_userIdPw = new Map();
var map_roomIdPw = new Map();
var map_idStatus = new Map();

var app = http.createServer(function(request, response) {
    var _url = request.url;
    var _cookie = {};
    var id;

    if (request.headers.cookie !== undefined) {
        _cookie = cookie.parse(request.headers.cookie);
    }

    id = _cookie.id;

    /*
    var flist = fs.readdirSync(__dirname + '/html/');
    console.log(flist);
    */

    if (id === undefined || !map_idStatus.has(id)) {
        login_process(request, response);
    } else if (_url === '/lobby' && map_idStatus.get(id) === 'lobby') {
        lobby_process(request, response, _cookie);
    } else if (_url === '/room' && map_idStatus.get(id) === 'room') {
        room_process(request, response, _cookie);        
    } else if (_url === '/help') {
        help_process(request, response);        
    } else if (_url === '/logout') {
        logout_process(request, response);
    } else {
        notFound_process(request, response);        
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

        if (body === '') {            
            response.writeHead(200);
            response.end(fs.readFileSync(__dirname + '/html/login.html'));
            return
        } else if (post.login !== undefined) {
            if (!map_userIdPw.has(post.userId) || map_userIdPw.get(post.userId) !== post.userPw) {
                response.writeHead(200);
                response.end('Error!!: Wrong Nickname or Password');
                return;
            }
        } else if (post.register !== undefined) {
            if (map_userIdPw.has(post.userId)) {
                response.writeHead(200);
                response.end('Error!!: Duple Nickname');
                return;
            }
            
            map_userIdPw.set(post.userId, post.userPw);
        } else {
            response.writeHead(200);
            response.end('Error!!: Undefined Scenario');
            return;
        }

        map_idStatus.set(post.userId, 'lobby');
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

function lobby_process(request, response, _cookie) {
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

        console.log(post);

        if (body === '') {
            response.writeHead(200);            
            response.end(fs.readFileSync(__dirname + '/html/lobby.html'));            
            return
        } else if (post.makeRoom !== undefined) {
            if (map_roomIdPw.has(post.roomId)) {
                response.end('Error!!: Duple Room Number');
                return
            }

            var obj = new Object();

            obj.pw = post.roomPw;
            obj.host = _cookie.id;
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

            map_roomIdPw.get(post.roomId).guest.add(_cookie.id);            
            console.log('Enter Room!!');
        }

        map_idStatus.get(_cookie.id) = 'room';
        response.writeHead(302, {
            'Set-Cookie': [
                `roomId=${post.roomId}`,                
                `permanent=forever; Max-Age=3600`,
                //'secure=scure_value; Secure',
            ],
            'Location': '/room'
        });
        response.end();

        console.log(map_roomIdPw);
    });    
}

function room_process(request, response, _cookie) {
    response.writeHead(200);
    response.end(`
        ${_cookie}
    `);
}

function logout_process(request, response) {
    response.writeHead(302, {
        'Set-Cookie': [
            `id=`,                
            `permanent=forever; Max-Age=3600`,
            //'secure=scure_value; Secure',
        ],
    });
    response.end();
}

function help_process(request, response) {
    response.writeHead(200);
    response.end(fs.readFileSync(__dirname + '/html/help.html'));
}        

function notFound_process(request, response) {
    response.writeHead(404);
    response.end('Not found');
}        

app.listen(3000);