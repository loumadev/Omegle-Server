const OmegleClient = require(__dirname + "/../../client.js");

class Client extends OmegleClient {
    constructor(socket) {
        super("SocketClient", null);
        this.socket = socket;
        this.image = null;
        Client.clients.push(this);
    }
    sendData(request, data) {
        this.socket.send(JSON.stringify({
            request: request,
            data: data
        }));
    }
    send(message, type = "message", sender = {}) {
        //if(type == "chat") return;
        this.socket.send(JSON.stringify({ request: "chat", data: { client: sender.name, message: message, type: type } }));
    }
    disconnect() {
        this.socket.close();
    }
    flush() {
        Client.clients.splice(Client.clients.indexOf(this), 1);
    }
    static broadcast(object, except) {
        for(let client of Client.clients) {
            if(client == except) continue;
            client.socket.send(JSON.stringify(object));
        }
    }
    static getClientBySocket(socket) {
        for(let client of Client.clients) {
            if(client.socket == socket) return client;
        }
        return undefined;
    }
    static getClientByNick(nick) {
        for(let client of Client.clients) {
            if(client.nick == nick) return client;
        }
        return undefined;
    }
}
Client.clients = [];

Client.prototype.connect = () => null;
Client.prototype.fireEvents = () => null;
Client.prototype.eventsFetch = () => true;
Client.prototype.settings = {};

module.exports = Client;