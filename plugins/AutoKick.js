const server = require(__dirname + "/../server.js").getServer();
const Command = require(__dirname + "/../command.js");

const spamFilterMessages = 3;
const spamFilterDelta = 1500;
const spamFilterDuration = 1e3 * 30;

server.on("connection", e => {
    let client = e.client;

    var interval = setInterval(() => {
        if(client.hasPermission("client.afk")) return true;

        var diff = new Date() - client.lastMessage;

        if(diff > 60e3 * 4) {
            if(diff > 60e3 * 5) {
                if(client.lastMessage) server.broadcast(`[Info] ${client.displayName} bol vykopnutý za inaktivitu!`);
                client.kick("inaktivitu");
            } else {
                client.send(`==== Upozornenie ====
O minútu budeš odpojený!
Ak tomu chceš predísť buď aktívny!
===============`, "announcement");
            }
        }
    }, 60e3);

    client.customData.activityInterval = interval;
    client.customData.spamFilter = [];
});

server.on("disconnect", e => {
    clearInterval(e.client.customData.activityInterval);
});


server.on("chat", e => {
    let client = e.client;

    var data = client.customData.spamFilter;

    if(!data) data = (client.customData.spamFilter = []);

    if(data.push(new Date()) > spamFilterMessages) data.shift();

    if(data[data.length - 1] - data[0] < spamFilterDelta) {
        client.isMuted = true;
        client.send(`[Spam] Bol si umlčaný za spam!`);
        setTimeout(() => {
            client.isMuted = false;
            client.send(`[Spam] Už viac nie si umlčaný!`);
        }, spamFilterDuration);
    }
});