var Elm = {
    messages: get(".messagesbox .messages"),
    textarea: get(".panel .textarea"),
    send: get("button.send"),
    msgbox: get(".messagesbox"),
    typing: get(".messagesbox .typing")
}

class Client extends EventListener {
    constructor(object) {
        super();
        this.name = object.name;
        this.displayName = object.displayName;
        this.image = object.image || "/Omegle/plugins/WebSocket/web/person.svg";
        Client.clients.push(this);
    }
    static get(name) {
        for(var client of Client.clients) {
            if(client.name == name) return client;
            return null;
        }
    }
}
Client.clients = [];

class chat extends EventListener {
    constructor() {
        super();
        this.socket = null;
        this.connected = false;
        this.clients = [];
        this.typing = [];
        this.self = null;
    }
    log(message, ...data) {
        var str = "";
        data.map(elm => {
            message += ` ${typeof elm === "string" ? elm : JSON.stringify(elm)}`;
        });
        var messages = message.split("§r");
        str = messages.reduce((prev, curr) => {
            var ends = "";
            return prev + curr.replace(/(?:[^\\]|^)§([0-9a-fk-r])/gm, (match, color) => {
                ends += "</span>";
                return `<span style="${Colors[color]}">`;
            }) + ends;
        }, "");
        //Elm.chat.innerHTML += `${str.replace(/\\§/gm, "§").replace(/\n|\r\n/gmi, "<br>")}<br>`;
        return `${str.replace(/\\§/gm, "§").replace(/\n|\r\n/gmi, "<br>")}<br>`;
    }
    connect() {
        Chat.socket = new WebSocket(`ws://94.136.148.85:3241/`);

        Chat.socket.onopen = () => {
            Chat.connected = true;

            this.dispatchEvent("open");

            /*Chat.socket.send(JSON.stringify({
                nick: nick
            }));*/
        };

        Chat.socket.onclose = (data) => {
            console.log(data);

            Chat.connected = false;
            this.dispatchEvent("close", { code: data });
        };

        Chat.socket.onerror = (error) => {
            console.error(error);
            this.dispatchEvent("error", { error: error });
        };

        Chat.socket.onmessage = (message) => {
            console.log(message);

            var Data = JSON.parse(message.data);
            let req = Data.request;
            let data = Data.data;

            this.dispatchEvent("data", { message: Data, req: req, data: data }, () => {
                if(req == "client") {
                    Chat.self = new Client(data);
                } else if(req == "clients") {
                    for(var client of data) {
                        new Client(client);
                    }
                } else if(req == "chat") {
                    newMessage(data.client, data.message);
                } else {
                    console.log(JSON.stringify(data));
                }
            });

        };
    }
    send(request, data) {
        this.socket.send(JSON.stringify({
            request: request,
            data: data
        }));
    }
}
const Chat = new chat();

const Colors = {
    "0": "color:#000000",
    "1": "color:#0000AA",
    "2": "color:#00AA00",
    "3": "color:#00AAAA",
    "4": "color:#AA0000",
    "5": "color:#AA00AA",
    "6": "color:#FFAA00",
    "7": "color:#AAAAAA",
    "8": "color:#555555",
    "9": "color:#5555FF",
    "a": "color:#55FF55",
    "b": "color:#55FFFF",
    "c": "color:#FF5555",
    "d": "color:#FF55FF",
    "e": "color:#FFFF55",
    "f": "color:#FFFFFF",

    "k": "",
    "l": "font-weight:bold",
    "m": "text-decoration:line-through",
    "n": "text-decoration:underline",
    "o": "font-style:italic",
    "r": ""
}

window.WebSocket = window.WebSocket || window.MozWebSocket;

if(!window.WebSocket) {
    throw alert("WebSocket is not supported on your browser!");
}


Elm.send.onclick = () => {
    var text = Elm.textarea.innerHTML.trim();

    Chat.send("chat", text);

    newMessage("self", text);
};



function newMessage(client, message) {
    var messages = get(Elm.messages, ".client");
    var last = messages[messages.length - 1];
    var name = last.getAttribute("name");

    message = Chat.log(message);

    if(client == "self") {

        if(name == "self") { //append
            var html = `<div class="msg" time="${new Date().getTime()}"><div class="text">${message}</div></div>`;
            get(last, ".msgs").appendChild(parseHTML(html));

        } else { //create new

            var html = `<div class="client" name="self"><div class="msgs"><div class="msg" time="${new Date().getTime()}"><div class="text">${message}</div></div></div></div>`;
            Elm.messages.appendChild(parseHTML(html));

        }

    } else {

        if(name == client) { //append
            var html = `<div class="msg" time="${new Date().getTime()}"><div class="text">${message}</div></div>`;
            get(last, ".msgs").innerHTML += html;

        } else { //create new

            var html = `<div class="client" name="${client.name}" dname="${client.displayName}"><div class="image"></div><div class="msgs"><div class="dname">${client.displayName}</div><div class="msg" time="${new Date().getTime()}"><div class="text">${message}</div></div></div></div>`;
            Elm.messages.innerHTML += html;

        }

    }

    Elm.msgbox.scroll({
        top: Elm.msgbox.scrollHeight - Elm.msgbox.offsetHeight,
        left: 0,
        behavior: 'smooth'
    });

}

function changeTyping(client, state) {

    var id = Chat.typing.indexOf(client);

    if(state) {
        if(id == -1) {
            Chat.typing.push(client);
        }
    } else {
        if(id != -1) {
            Chat.typing.splice(id, 1);
        }
    }

    /* Update DOM */

    var html = "";
    for(var [i, client] of Chat.typing.entries()) {
        html += `<div class="image" style="--i:${i};--bg:url('${client.image}')" name="${client.name}" dname="${client.displayName}"></div>`;
    }
    get(Elm.typing, ".clients").innerHTML = html;

}


Chat.connect();






Elm.control.onclick = () => {

    Elm.control.disabled = true;

    var ip = "94.136.148.85";
    var port = "3241";

    if(!ip || !port) return Chat.log(`> §4Invalid socket: "${ip}:${port}"`);

    if(Chat.connected) {

        Chat.socket.close();

    } else {

        var nick = Elm.nick.value.trim();
        if(!nick || !nick.match(/^\w{3,16}$/)) return Chat.log("> §cInvalid name:", nick, "(A-Z, 0-9, _, length: 3-16)");
        Chat.nick = nick;

        Chat.socket = new WebSocket(`ws:/${ip}:${port}`);

        Chat.log("> §7Connecting to server...");

        Chat.socket.onopen = function() {
            Chat.connected = true;
            Elm.control.disabled = false;
            Elm.textbox.disabled = false;
            Elm.status.innerHTML = "Connected!";
            Elm.control.innerHTML = "Disconnect";

            Chat.log("< §2Connection established successfully!");
            /*Chat.socket.send(JSON.stringify({
                nick: nick
            }));*/
        };

        Chat.socket.onclose = function(data) {
            Chat.connected = false;
            Elm.control.disabled = false;
            Elm.textbox.disabled = true;
            Elm.status.innerHTML = "Disconnected!";
            Elm.control.innerHTML = "Connect";

            console.log(data);
            Chat.log(`< §cDisconnected from server with code ${data.code}!`);
        };

        Chat.socket.onerror = function(error) {
            console.log(error);
            Chat.log("Error:", error);
        };

        Chat.socket.onmessage = function(message) {
            console.log(message);

            var Data = JSON.parse(message.data);
            let req = Data.request;
            let data = Data.data;

            if(req == "chat") {
                Chat.log(data /*`< <#0086d4>${data.nick}<#525252>: ${data.chat}`*/ );
            } else {
                Chat.log(JSON.stringify(data));
            }


            /*if(data.chat) {
                Chat.log(`< <#0086d4>${data.nick}<#525252>: ${data.chat}`);
            } else if(data.message) {
                Chat.log(`< <magenta>Server: ${data.message}`);
            } else if(data.info) {
                Chat.log(`< <gray>Info: ${data.info}`);
            } else {
                Chat.log(JSON.stringify(data));
            }*/
        };

    }
};

/*Elm.send.onclick = () => {
    var message = Elm.textbox.value.trim();

    if(!message) return;

    Chat.socket.send(JSON.stringify({
        request: "chat",
        data: message
    }));
    Elm.textbox.value = "";
};*/

Elm.textbox.onkeypress = e => {
    if(e.keyCode === 13) Elm.send.click();
}

setInterval(function() {
    if(Chat.connected && Chat.socket.readyState !== 1) {
        Chat.log("> §6Warning: Unable to communicate with the WebSocket server!", `(${Chat.socket.readyState})`);
    }
}, 3000);