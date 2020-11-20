var http = require('http');
var fs = require('fs');
var url = require('url');
var cookie = require('cookie');

var app = http.createServer(function (request, response) {
  var _url = request.url;
  var cookies = cookie.parse(request.headers.cookie);

  console.log(_url);
  console.log(request.headers.cookie);

  if (_url == '/') {
    _url = '/login.html';
  }
 
  if (_url == '/favicon.ico') {
    response.writeHead(404);
    response.end();
    return;
  }
  //response.writeHead(200);
  //response.end(fs.readFileSync(__dirname + '/html/' + _url));
  response.writeHead(200, {
    'Set-Cookie':[
      'yummy_cookie=choco',
      'taste_cookie=strawberry',
      `permanent=forever; Max-Age=3600`,
      'secure=scure_value; Secure',
    ]
  });
  response.end('Cookie!!'); 
});
app.listen(3000);
