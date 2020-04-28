const home = "plugins/WebSocket";
const name = "WebSocket";

const fs = require('fs');
const server = require(__dirname + "/../server.js").getServer();
const Command = require(__dirname + "/../command.js");
const Out = require(__dirname + "/../formatting.js");
const OmegleClient = require(__dirname + "/../client.js");
const SocketClient = require("./WebSocket/client.js");

const wsPort = 3241;
const wsServer = require("websocket").server;
const http = require("http");


/* HTTP Server */
var httpServer = http.createServer(function(req, res) {
    if(req.url == "/") req.url = "/page.html";
    fs.readFile(home + "/web" + req.url, (err, data) => {
        if(err) {
            res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
            res.write("404 Not Found");
            res.end();
            return false;
        }
        res.writeHead(200, { 'Content-Type': getContentType(req.url) + '; charset=utf-8' });
        res.write(data);
        res.end();
    });
});

httpServer.listen(wsPort, function() {
    Out.log(`[${name}] §aServer is listenting on port §b${wsPort}§a!`);
});


/* WebSocket Server */
var wss = new wsServer({
    httpServer: httpServer
});

/* Setup Handler */
wss.on("request", function(request) {
    Out.log(`§aNew connection from §b${request.remoteAddress}§a!`);

    //Accept request and create new Client
    let socket = request.accept(null, request.origin);
    let client = new SocketClient(socket);

    Out.log(`§aRequest accepted!`);

    //Manage Client
    client.name = `WebStranger${++server.number}`;
    server.addListeners(client, null);
    server.clients.push(client);
    client.dispatchEvent(OmegleClient.CONNECTED);

    //Send all connected clients to Client
    client.sendData("client", {
        name: client.name,
        displayName: client.displayName,
        image: client.image
    });
    var arr = [];
    for(var cl of SocketClient.clients) {
        arr.push({
            name: cl.name,
            displayName: cl.displayName,
            image: cl.image
        });
    }
    client.sendData("clients", arr);

    //Message event handler
    socket.on("message", function(message) {
        if(message.type != "utf8") return;

        //Manage data
        var Data = JSON.parse(message.utf8Data);

        let req = Data.request;
        let data = Data.data;

        //Chat event
        if(req == "chat") {
            if(!data) return false;
            client.send(`[${client.displayName}] ${data}`, "chat");
            client.dispatchEvent(OmegleClient.MESSAGE, { client: client, data: data });
        }

        /*if(data.nick) {
            Out.log(`§aNick of user: §b${data.nick}§a!`);

            if(SocketClient.getClientByNick(data.nick)) {
                Out.log(`§cUser §b${data.nick} §calready exists!`);
                client.send({ message: `<red>User ${data.nick} already exists!` });
                socket.close();
            }

            client.nick = data.nick;
            SocketClient.broadcast({ info: `<#31c700>User ${data.nick} has connected!` }, client);

        } else if(data.chat) {
            var msg = data.chat.trim();

            SocketClient.broadcast({ nick: client.nick, chat: msg }, client);
            Out.log(`§b${client.nick}: §7${msg}`);
        }*/

    });

    //Close event Handler
    socket.on("close", function(data) {
        console.log(data);
        Out.log(`§eUser §b${client.nick} §e has disconnected!`);
        client.dispatchEvent(OmegleClient.STRANGER_DISCONNECT, { client: client });
        client.flush();
        //SocketClient.broadcast({ info: `<#e05c47>User ${client.nick} has disconnected` });
    });
});


/* Omegle Server */
server.on("load", e => {

    /*if(!fs.existsSync(home)) {
    	fs.mkdirSync(home);
    }*/

});


/*server.on("chat", e => {
	let client = e.client;
	let message = e.message;

	OmegleClient.broadcast(message, client, );
});*/


/* Other */
function getContentType(filename, dismatch = "text/plain") {
    if(filename.endsWith(".htm")) return "text/html";
    else if(filename.endsWith(".html")) return "text/html";
    else if(filename.endsWith(".css")) return "text/css";
    else if(filename.endsWith(".js")) return "application/javascript";
    else if(filename.endsWith(".json")) return "application/json";
    else if(filename.endsWith(".png")) return "image/png";
    else if(filename.endsWith(".gif")) return "image/gif";
    else if(filename.endsWith(".jpg")) return "image/jpeg";
    else if(filename.endsWith(".ico")) return "image/x-icon";
    else if(filename.endsWith(".svg")) return "image/svg+xml";
    else if(filename.endsWith(".xml")) return "text/xml";
    else if(filename.endsWith(".pdf")) return "application/x-pdf";
    else if(filename.endsWith(".zip")) return "application/x-zip";
    else if(filename.endsWith(".gz")) return "application/x-gzip";
    return dismatch;
}