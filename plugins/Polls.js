const server = require(__dirname + "/../server.js").getServer();
const Command = require(__dirname + "/../command.js");
const ShopItem = require("./Shop.js");
const Account = require("./Account.js");

server.on("load", () => {
    server.customData.poll = {
        isRunning: false,
        yes: [],
        no: []
    };
});
new Command("poll").on("execute", e => {
    let sender = e.executor;
    let cmd = e.args.shift().toLowerCase().removeAccents();
    let question = e.args.join(" ");
    var poll = server.customData.poll;
    var time = 45e3;

    if(cmd == "create") {
        let data = Account.getData(sender);

        if(!sender.hasPermission("poll.client.create") && !data.polls) return sender.send(`| [Príkaz] Tento príkaz je len pre VIP!`);
        if(poll.isRunning) return sender.send(`| [Poll] Hlasovanie už prebieha!`);
        if(!question) return sender.send(`| [Príkaz] Použi /poll create <otázka>`);
        if(!question.match(/^.{8,75}$/)) return sender.send(`| [Poll] Otázka musí mať 8-64 znakov!`);

        if(data.polls) {
            data.polls--;
            Account.updateData(sender, data);
        }

        question += question.match(/[?.!]$/) ? "" : "?";

        setTimeout(() => {
            if(!poll.isRunning) return;
            server.broadcast(`| [Poll] Hlasovanie končí o 5 sekúnd!`);
        }, time - 5e3);

        setTimeout(() => {
            if(!poll.isRunning) return;

            var percent = (poll.yes.length * 100) / (poll.yes.length + poll.no.length);
            server.broadcast(`==== Hlasovanie ====
 > ${question}
ÁNO: ${Math.round(percent)}% (${poll.yes.length})
NIE: ${Math.round(100-percent)}% (${poll.no.length})
============`);
            poll.isRunning = false;
            poll.yes = [];
            poll.no = [];
        }, time);

        poll.isRunning = true;

        return server.broadcast(`==== Hlasovanie ====
${sender.displayName} sa pýta:
 > ${question}
ÁNO: "/poll ano"
NIE: "/poll nie"
============`);


    } else if(cmd == "ano" || cmd == "nie") {
        cmd = cmd == "ano";

        if(poll.yes.indexOf(sender) > -1 || poll.yes.indexOf(sender) > -1) return sender.send(`| [Poll] Už si hlasoval!`);

        poll[cmd ? "yes" : "no"].push(sender);
        return sender.send(`| [Poll] Hlasoval si ${cmd ? "ÁNO" : "NIE"}!`);

    } else if(cmd == "delete") {
        if(!sender.hasPermission("poll.client.delete")) return sender.send(`| [Príkaz] Na tento príkaz nemáš práva!`);

        poll.isRunning = false;
        poll.yes = [];
        poll.no = [];

        return sender.send(`| [Poll] ${sender.displayName} zrušil hlasovanie za: ${question}!`);

    }

    return sender.send(`| [Príkaz] Neplatný príkaz, napíš "/help" pre viac info!`);
});

new ShopItem("Poll", 20, "Začať hlasovanie").on("buy", e => {
    let client = e.executor;
    var data = Account.getData(client);

    if("polls" in data) data.polls++;
    else data.polls = 1;

    Account.updateData(client, data);

    return [`Pre začatie hlasovania napíš "/poll create <otázka>"!`, `Počet hlasovaní k dispozícii: ${data.polls}`];
});