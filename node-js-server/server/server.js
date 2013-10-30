// http://ejohn.org/blog/ecmascript-5-strict-mode-json-and-more/
"use strict";

// Optional. You will see this name in eg. 'ps' or 'top' command
process.title = "node-chat";

// Port where we'll run the websocket server
var webSocketsServerPort = 1337;

// websocket and http servers
var webSocketServer = require("websocket").server;
var http = require("http");

// other modules
var fs = require("fs");
var url = require("url");
var chat = require("./chat");

/**
 * HTTP server
 */
var server = http.createServer(function (request, response) {
    var MIME_TYPES = {
        "/chat": "text/html",
        "/style/chat.css": "text/css",
        "/script/chat.js": "text/javascript"
    }

    var uri = url.parse(request.url).pathname;

    if (!MIME_TYPES[uri]) {
        response.writeHead(404);
        response.end("404 Not Found");
        return;
    }
    var fileName = "www" + uri;
    if (fileName.indexOf(".") == -1) {
        fileName += ".html";
    }

    console.log("Attempting to serve: " + fileName);
    response.writeHead(200, {'Content-Type': MIME_TYPES[uri]});
    fs.createReadStream(fileName).pipe(response);
});

server.listen(webSocketsServerPort, function () {
    console.log((new Date()) + " Server is listening on port " + webSocketsServerPort);
});

/**
 * WebSocket server
 */
var wsServer = new webSocketServer({
    httpServer: server
});

// This callback function is called every time someone
// tries to connect to the WebSocket server
wsServer.on('request', function (request) {
    console.log((new Date()) + ' Connection from origin ' + request.origin + '.');
    // accept connection - you should check 'request.origin' to make sure that
    // client is connecting from your website
    // (http://en.wikipedia.org/wiki/Same_origin_policy)
    var connection = request.accept(null, request.origin);
    chat.onRequest(connection);
});
