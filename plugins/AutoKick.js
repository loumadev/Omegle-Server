const server = require(__dirname + "/../server.js").getServer();
const Command = require(__dirname + "/../command.js");

server.on("connection", e => {
    let client = e.client;

    var interval = setInterval(() => {
        if(client.hasPermission("client.afk")) return true;

        var diff = new Date() - client.lastMessage;

        if(diff > 60e3 * 4) {
            if(diff > 60e3 * 5) {
                if(client.lastMessage) server.broadcast(`| [Info] ${client.displayName} bol vykopnutý za inaktivitu!`);
                client.kick("inaktivitu");
            } else {
                client.send(`==== Upozornenie ====
O minútu budeš odpojený!
Ak tomu chceš predísť buď aktívny!
===============`);
            }
        }
    }, 60e3);

    client.customData.activityInterval = interval;
});

server.on("disconnect", e => {
    clearInterval(e.client.customData.activityInterval);
});