Connection.SERVER = "127.0.0.1:1337";
Connection.CHECK_INTERVAL = 3000;
Connection.STATUS_MESSAGES = {
    CONNECTING:"Connecting...",
    WS_NOT_SUPPORTED:"Sorry, but your browser doesn't support WebSockets.",
    CONNECTION_PROBLEM:"Sorry, but there's some problem with your connection or the server is down.",
    ENTER_NAME:"Enter your name:"
}

Chat.init = function () {
    return new Chat();
}

//-----------------------------------------------------------------------------
var Util = new Object();
Util.constructColoredName = function (user) {
    var span = document.createElement("span");
    span.style.color = user.color;
    span.appendChild(span.ownerDocument.createTextNode(user.name));
    return span;
}
Util.formatDate = function (date) {
    return (date.getHours() < 10 ? '0' + date.getHours() : date.getHours()) + ":"
        + (date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes()) + ":"
        + (date.getSeconds() < 10 ? '0' + date.getSeconds() : date.getSeconds());
}

//-----------------------------------------------------------------------------
function Input(keyPressCallback) {
    var input = document.getElementById("input");

    init();

    function init () {
        input.addEventListener("keypress", keyPressCallback, false);
    }

    this.disable = function () {
        input.setAttribute("disabled", "disabled");
    }

    this.enable = function () {
        input.removeAttribute("disabled");
        input.focus();
    }

    this.getValue = function () {
        return input.value;
    }

    this.resetValue = function () {
        input.value = "";
    }
}

//-----------------------------------------------------------------------------
function Status() {
    var status = document.getElementById("status");
    var prevStatusNodes = new Array();

    this.loggedIn = function (user) {
        this.message("You are logged in as ");
        status.appendChild(Util.constructColoredName(user));
    }

    this.restore = function () {
        if (prevStatusNodes && prevStatusNodes.length > 0) {
            while (status.childNodes.length >= 1) {
                status.removeChild(status.firstChild);
            }
            for (var i in prevStatusNodes) {
                status.appendChild(prevStatusNodes[i]);
            }
            status.style.color = "black";
            prevStatusNodes.length = 0;
        }
    }

    this.message = function (text) {
        while (status.childNodes.length >= 1) {
            status.removeChild(status.firstChild);
        }
        status.appendChild(status.ownerDocument.createTextNode(text));
    }

    this.error = function (text) {
        while (status.childNodes.length >= 1) {
            prevStatusNodes.push(status.firstChild);
            status.removeChild(status.firstChild);
        }
        status.appendChild(status.ownerDocument.createTextNode(text));
        status.style.color = "red";
    }

}

//-----------------------------------------------------------------------------
function Content() {
    var content = document.getElementById("content");
    var scrollDifference = content.scrollHeight - content.scrollTop;

    function constructMessageRow(message) {
        var p = document.createElement("p");
        p.class = "history";
        p.appendChild(p.ownerDocument.createTextNode("[" + Util.formatDate(message.date) + "] "));
        p.appendChild(Util.constructColoredName(message.user));
        p.appendChild(p.ownerDocument.createTextNode(": " + message.text));
        return p;
    }

    function constructSystemMessageRow(message) {
        var p = document.createElement("p");
        p.class = "history";
        p.appendChild(p.ownerDocument.createTextNode("[" + Util.formatDate(message.date) + "] system: "));
        p.appendChild(Util.constructColoredName(message.user));
        p.appendChild(p.ownerDocument.createTextNode(" " + message.text));
        return p;
    }

    function scrollDown(row) {
        // should scroll down, only when scroll position was at bottom
        var isScroll = content.scrollTop == (content.scrollHeight - scrollDifference);
        content.appendChild(row);
        if (isScroll) {
            content.scrollTop = content.scrollHeight - scrollDifference;
        }
    }

    this.addMessage = function (message) {
        scrollDown(constructMessageRow(message));
    }

    this.addSystemMessage = function (message) {
        scrollDown(constructSystemMessageRow(message));
    }

}

//-----------------------------------------------------------------------------
Connection.MESSAGE_TYPES = {
    NAME:"name",
    MESSAGE:"message",
    HISTORY:"history",
    ERROR:"error",
    SYSTEM:"system"
}

Connection.HISTORY_TYPES = {
    MESSAGE:"message",
    SYSTEM:"system"
}

function Connection(onOpenCallback, onMessageCallback, onErrorCallback) {
    var connection;

    init();

    function init() {
        if (!window.WebSocket) {
            onErrorCallback();
            return;
        }

        connection = new WebSocket("ws://" + Connection.SERVER);
        connection.onopen = onOpenCallback;
        connection.onerror = onErrorCallback;
        connection.onmessage = onMessageCallback;

        setInterval(checkConnection, Connection.CHECK_INTERVAL);
    }

    function checkConnection() {
        if (connection.readyState !== 1) {
            onErrorCallback();
        }
    }

    this.send = function (text) {
        connection.send(text);
    }

}

//-----------------------------------------------------------------------------
function Chat() {
    var user;
    var content = new Content();
    var status = new Status();
    var input = new Input(sendMessageCallback);
    var connection;
    var str = "str";
    var messageHandlers = {
        "name":handleNameType,
        "history":handleHistoryType,
        "message":handleMessageType,
        "error":handleErrorType,
        "system":handleSystemType
    }

    init();

    function init () {
        status.message(Connection.STATUS_MESSAGES.CONNECTING);
        input.disable();
        connection = new Connection(onOpenCallback, onMessageCallback, onErrorCallback);
    }

    function sendMessageCallback(e) {
        if (e.keyCode === 13) {
            status.restore();
            var message = input.getValue();
            if (!message) {
                return;
            }
            connection.send(message);
            input.resetValue();
            input.disable();
        }
    }

    function onOpenCallback() {
        input.enable();
        status.message(Connection.STATUS_MESSAGES.ENTER_NAME);
    }

    function onErrorCallback(error) {
        input.disable();
        status.error(Connection.STATUS_MESSAGES.CONNECTION_PROBLEM);
    }

    function onMessageCallback(message) {
        try {
            var json = JSON.parse(message.data);
        } catch (e) {
            console.log("This doesn't look like a valid JSON: ", message.data);
            return;
        }
        input.enable();
        if(typeof messageHandlers[json.type] !== 'function') {
            console.log("Unknown JSON type: ", json);
            return;
        }
        messageHandlers[json.type](json);
    }

    function handleErrorType(json) {
        status.error(json.error.message);
    }

    function handleMessageType(json) {
        content.addMessage(Message.newInstance(json.data));
    }

    function handleSystemType(json) {
        content.addSystemMessage(Message.newInstance(json.data));
    }

    function handleHistoryType(json) {
        // insert every single message to the chat window
        for (var i = 0; i < json.data.length; i++) {
            switch (json.data[i].type) {
                case Connection.HISTORY_TYPES.SYSTEM:
                    content.addSystemMessage(Message.newInstance(json.data[i]));
                    break;
                case Connection.HISTORY_TYPES.MESSAGE:
                    content.addMessage(Message.newInstance(json.data[i]));
                    break;
                default:
                    console.log("Unknown JSON type: ", json);
            }
        }
    }

    function handleNameType(json) {
        user = User.newInstance(json.data);
        status.loggedIn(user);
    }
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
function Message(user, date, text) {
    this.user = user;
    this.date = date;
    this.text = text;
}

Message.newInstance = function (data) {
    return new Message(User.newInstance(data), new Date(data.time), data.text);
}