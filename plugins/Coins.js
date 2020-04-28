const Server = require(__dirname + "/../server.js");
const server = Server.getServer();
const Client = require(__dirname + "/../client.js");
const Auth = require(__dirname + "/../auth.js");
const Command = require(__dirname + "/../command.js");

var setDefaultValue = e => {
    let client = e.client;
    let account = Auth.getAccount(client.name);

    if(!("data" in account)) account.data = {};

    Auth.updateAccount(account.name, account);

    if(Coins.get(client) == undefined) {
        Coins.set(client, 10);
    }
}

server.on("register", setDefaultValue);
server.on("login", setDefaultValue);

new Command("coins").on("execute", e => {
    let sender = e.executor;

    let a0 = e.args[0];
    let a1 = e.args[1];
    let a2 = e.args[2];

    if(!a0) { // /coins
        if(sender instanceof Server) return sender.send(`[Príkaz] Tento príkaz nemôžeš použiť!`);
        if(!sender.isLogged) return sender.send(`[Coins] Na použitie tohto príkazu sa musíš prihlásiť! /login`);
        return sender.send(`[Coins] Aktuálne množstvo mincí: ${Coins.get(sender)}`);
    }

    if(a0) {

        let client = server.getClientByName(a0);

        if(!client) return sender.send(`[Coins] ${a0} nie je pripojený!`);
        if(Coins.get(client) == undefined) return sender.send(`[Coins] ${client.displayName} nemá učet alebo sa vyskytla chyba v databáze!`);

        if(!a1) {
            if(!sender.hasPermission("coins.get")) return sender.send(`[Príkaz] Na tento príkaz nemáš práva!`);
            return sender.send(`[Coins] ${client.displayName} má ${Coins.get(client)} mincí.`);
        }

        if(a1 == "set") {
            if(!sender.hasPermission("coins.set")) return sender.send(`[Príkaz] Na tento príkaz nemáš práva!`);
            if(!+a2) return sender.send(`[Príkaz] Použi /coins <nick> set <amount>!`);

            return sender.send(`[Coins] Množstvo mincí ${client.displayName} bolo nastavené na ${Coins.set(client, +a2)}.`);
        }

        if(a1 == "add") {
            if(!sender.hasPermission("coins.add")) return sender.send(`[Príkaz] Na tento príkaz nemáš práva!`);
            if(!+a2) return sender.send(`[Príkaz] Použi /coins <nick> add <amount>!`);

            return sender.send(`[Coins] ${client.displayName} má ${Coins.add(client, +a2)} mincí.`);
        }

    }

    return sender.send(`[Príkaz] Neplatný príkaz! Napíš /help pre viac info.`);

});

class Coins {
    static get(client) {
        let name = client instanceof Client ? client.name : client;
        let account = Auth.getAccount(name);

        if(!account) return undefined;
        if(!("coins" in account.data)) return undefined;

        return account.data.coins;
    }
    static set(client, amount) {
        let name = client instanceof Client ? client.name : client;
        let account = Auth.getAccount(name);

        if(!account) return false;

        account.data.coins = amount;

        Auth.updateAccount(account.name, account);

        return account.data.coins;
    }
    static add(client, amount) {
        let name = client instanceof Client ? client.name : client;
        let account = Auth.getAccount(name);

        if(!account) return false;

        account.data.coins = (account.data.coins || 0) + amount;

        Auth.updateAccount(account.name, account);

        return account.data.coins;
    }
}

module.exports = Coins;