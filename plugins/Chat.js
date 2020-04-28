const server = require(__dirname + "/../server.js").getServer();
const Command = require(__dirname + "/../command.js");

new Command("msg", "pm", "dm").on("execute", e => {
    let sender = e.executor;
    let nick = e.args.shift();
    let message = e.args.join(" ");
    let client = server.getClientByName(nick);

    if(!nick || !message) return sender.send(`[Príkaz] Použi "/msg <nick> <správa>"`);

    if(!client) return sender.send(`[Príkaz] ${nick} nie je pripojený!`);

    if(client.customData.ignore.indexOf(sender) > -1) return sender.send(`${client.displayName} ťa ignoruje!`);

    sender.customData.lastClient = client;
    client.customData.lastClient = sender;

    client.send(`[${sender.displayName} => ${client.displayName}] ${message}`);
    sender.send(`[Príkaz => ${client.displayName}] Správa bola odoslaná!`);
});

new Command("r", "re", "reply").on("execute", e => {
    let sender = e.executor;
    let message = e.args.join(" ");
    let client = sender.customData.lastClient;

    if(!client) return sender.send(`[Príkaz] Nemáš komu odpovedať!`);
    if(!message) return sender.send(`[Príkaz] Použi "/r <správa>"`);

    client.customData.lastClient = sender;

    client.send(`[${sender.displayName} => ${client.displayName}] ${message}`);
    sender.send(`[Príkaz => ${client.displayName}] Správa bola odoslaná!`);
});

server.on("connection", e => {
    e.client.customData.ignore = [];
});
new Command("ignore").on("execute", e => {
    let sender = e.executor;
    let nick = e.args[0];
    let client = server.getClientByName(nick);
    var ignore = sender.customData.ignore;

    if(!nick) return sender.send(`[Príkaz] Použi "/ignore <nick>"`);
    if(!client) return sender.send(`[Príkaz] ${nick} nie je pripojený!`);

    var id = ignore.indexOf(client)

    if(id > -1) {
        ignore.splice(id, 1);
        return sender.send(`[Príkaz] ${client.displayName} už nebude ignorovaný!`);
    } else {
        ignore.push(client);
        return sender.send(`[Príkaz] ${client.displayName} bude ignorovaný!`);
    }
});

new Command("afk").on("execute", e => {
    let client = e.executor;

    if(!client.hasPermission("client.afk")) return client.send(`[Príkaz] Tento príkaz je len pre VIP!`);

    server.broadcast(`[Info] ${client.displayName} je ${(client.customData.isAfk = !client.customData.isAfk) ? "AFK" : "späť"}.`);
});
server.on("message", e => {
    let client = e.client;

    if(!client.customData.isAfk || e.message.startsWith("/afk")) return;
    client.customData.isAfk = false;
    server.broadcast(`[Info] ${client.displayName} je späť!`);
});

new Command("broadcast", "bc").on("execute", e => {
    let sender = e.executor;

    if(sender.hasPermission("server.broadcast")) {
        server.broadcast(`==== ${sender.displayName} ====
${e.args.join(" ")}
===========`, "announcement");
    }
});