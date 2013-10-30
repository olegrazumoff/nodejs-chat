var Util = new Object();
//Helper function for escaping input strings
Util.containsHtmlEntities = function (str) {
    return str.indexOf("<") != -1 || str.indexOf(">") != -1;
}

//Returns random color
Util.randomColor = function () {
    function random255() {
        return Math.floor(Math.random() * 255 + 1);
    }
    return "rgb(" + random255() + "," + random255() + "," + random255() + ")";
}

//-----------------------------------------------------------------------------
function User(name, color) {
    this.name = name;
    this.color = color;
}

User.newInstance = function (data) {
    return new User(data.name, data.color);
}

//-----------------------------------------------------------------------------
Chat.MAX_MESSAGES = 1000;
function Chat() {
    // latest 1000 messages
    var history = [];
    // list of currently connected users
    var users = [];

    this.onRequestCallback = function (connection) {
        // we need to know client index to remove them on 'close' event
        var index = users.push(connection) - 1;
        var userName = false;
        var userColor = false;

        console.log((new Date()) + ' Connection accepted.');

        // send back chat history
        if (history.length > 0) {
            connection.sendUTF(JSON.stringify({ type:'history', data:history}));
        }

        connection.on('message', onMessageCallback);
        connection.on('close', onCloseCallback);
    }

    // user disconnected
    var onCloseCallback = function (connection) {
        if (userName !== false && userColor !== false) {
            console.log((new Date()) + " Peer "
                + connection.remoteAddress + " disconnected.");
            // remove user from the list of connected users
            users.splice(index, 1);
            // push back user's color to be reused by another user
            colors.push(userColor);
            sendMessage("has left the chat.", userName, userColor, "system");
        }
    }

    // user sent some message
    var onMessageCallback = function (message) {
        if (message.type === 'utf8') { // accept only text
            message = message.utf8Data.trim();
            if (userName === false) { // first message sent by user is his name
                // remember user name
                if (message.length < 3 || message.length > 21 || message == "system" || containsHtmlEntities(message)) {
                    connection.sendUTF(JSON.stringify({type:"error", error:{type: "name", message:"Name should be between 3 and 21 characters, not a 'system', and should not contain '<' and '>' characters."}}));
                    return;
                }
                userName = message;
                // get random color and send it back to the user
                userColor = colors.shift();
                connection.sendUTF(JSON.stringify({ type:'name', data:{name:userName, color:userColor} }));
                console.log((new Date()) + ' User is known as: ' + userName + ' with ' + userColor + ' color.');
                // broadcast message to all connected users
                sendMessage("has entered in the chat.", userName, userColor, "system");

            } else { // log and broadcast the message
                if (message.length <= 0 || containsHtmlEntities(message)) {
                    connection.sendUTF(JSON.stringify({type:"error", error:{type: "message", message: "Message should not contain '<' and '>' characters and could not be empty."}}));
                    return;
                }
                console.log((new Date()) + ' Received Message from '
                    + userName + ': ' + message);
                sendMessage(message, userName, userColor);
            }
        }
    }

    var sendMessage = function (message, author, color, type) {
        type = type || "message";
        var obj = {
            time:(new Date()).getTime(),
            text: message,
            name:author,
            color:color,
            type: type
        };

        history.push(obj);
        history = history.slice(-maxMessages);

        var json = JSON.stringify({ type:type, data:obj });
        for (var i = 0; i < users.length; i++) {
            users[i].sendUTF(json);
        }
    }
}

var chat = new Chat();

exports.onRequest = chat.onRequestCallback;