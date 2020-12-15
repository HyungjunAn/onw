var http = require('http');
var fs = require('fs');
var url = require('url');
var cookie = require('cookie');
var qs = require('querystring');

var map_userIdPw = new Map();
var map_roomIdPw = new Map();

var app = http.createServer(function(request, response) {
    var _url = request.url;
    
    if (_url === '/') {        
        var flist = fs.readdirSync(__dirname + '/html/');
        console.log(flist);
        login_html(request, response);        
    } else if (_url === '/lobby') {
        lobby_html(request, response);
    } else if (_url === '/game') {
        response.writeHead(200);
        response.end(`
            ${request.headers.cookie}
        `);
        //response.end(fs.readFileSync(__dirname + '/html/game.html'));
    } else if (_url === '/help') {
        response.writeHead(200);
        response.end(fs.readFileSync(__dirname + '/html/help.html'));
    } else if (_url === '/login_process') {
        login_process(request, response);        
    } else if (_url === '/lobby_process') {
        lobby_process(request, response);    
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

        if (post.login !== undefined) {
            if (!map_userIdPw.has(post.userId) || map_userIdPw.get(post.userId) !== post.userPw) {
                response.writeHead(200);
                response.end('Error!!: Wrong Nickname or Password');
                return;
            }
        } else {
            if (map_userIdPw.has(post.userId)) {
                response.writeHead(200);
                response.end('Error!!: Duple Nickname');
                return;
            }
            
            map_userIdPw.set(post.userId, post.userPw);
        }

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

        response.writeHead(302, {
            'Set-Cookie': [
                `roomId=${post.roomId}`,                
                `permanent=forever; Max-Age=3600`,
                //'secure=scure_value; Secure',
            ],
            'Location': '/game'
        });
        response.end();

        console.log(map_roomIdPw);
    });    
}

function login_html(request, response) {
    response.writeHead(200);
    response.end(
        `
        <!doctype html>
        <html>
        <head>
          <title>Login - OWN</title>
          <meta charset="utf-8">
          <!-- <link rel="stylesheet" href="style.css"> -->
        </head>
        <body>
          <h1>ONW</h1>
            <form action="http://localhost:3000/login_process" method="post">      
              <p><input type="text" name="userId" placeholder="Nickname"></p>
              <p><input type="text" name="userPw" placeholder="Password"></p>
              <p>
                <input type="submit" value="Login" name="login">
                <input type="submit" value="Register" name="register">
              </p>
            </form>
          <h2><a href="/help">도움말</a></h2>
        </body>
        </html>
        `
    );
}

function lobby_html(request, response) {
    var _cookie = cookie.parse(request.headers.cookie);
    response.writeHead(200);
    response.end(
        `
        <!doctype html>
        <html>
        <head>
          <title>Lobby - OWN</title>
          <meta charset="utf-8">
          <!-- <link rel="stylesheet" href="style.css"> -->
        </head>
        <body>
          <h1><a href="lobby.html">ONW</a></h1>
          <p>환영합니다 "${_cookie.id}"님!</p>
          <p>게임방을 만들거나 이미 만들어진 게임방에 참가할 수 있습니다.</p>
            <form action="http://localhost:3000/lobby_process" method="post">
              <p><input type="text" name="roomId" placeholder="Room Number"></p>
              <p><input type="text" name="roomPw" placeholder="Room Password"></p>      
              <p>
                <input type="submit" value="Make Room" name="makeRoom">
                <input type="submit" value="Enter Room" name="enterRoom">
              </p>
            </form>
          <h2><a href="help.html">도움말</a></h2>
        </body>
        </html>        
        `
    );
}

app.listen(3000);