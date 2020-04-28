const EventListener = require(__dirname + "/../eventListener.js");
const Server = require(__dirname + "/../server.js");
const server = Server.getServer();
const Client = require(__dirname + "/../client.js");
const Auth = require(__dirname + "/../auth.js");
const Command = require(__dirname + "/../command.js");
const Coins = require("./Coins.js");

new Command("shop").on("execute", e => {
    let sender = e.executor;
    let coins = Coins.get(sender);

    if(!e.args[0]) {
        return sender.send(`==== Shop ====
 > Vitaj v Shope
 > Aktuálne máš ${coins || 0} mincí!
 > Možnosť vyberieš pomocou "/shop <číslo_možnosti>"${!sender.isLogged ? '\n > Na použitie Shopu musíš byť prihlásený!' : ""}

${ShopItem.generateMenu().join("\n")}
=========`, "announcement");
    }

    if(!isNaN(e.args[0])) {
        if(!sender.isLogged) return sender.send(`[Shop] Shop sa dá použiť, iba ak si prihlásený!`);
        ShopItem.select(sender, +e.args[0]);
    }

    return sender.send(`[Príkaz] Použi "/shop"!`);

});

class ShopItem extends EventListener {
    constructor(name, cost, description = "") {
        super();
        this.name = name;
        this.cost = cost;
        this.description = description;
        ShopItem.items.push(this);
    }
    static select(client, id) {
        let coins = Coins.get(client);
        let item = ShopItem.items[--id];

        if(item) {
            if(coins < item.cost) return;
            item.dispatchEvent("buy", { client: client, item: item, messages: [] }, e => {
                Coins.add(client, -item.cost);
                client.send(`==== Shop ====
 > Obchod bol úspešný!
 > ${e.messages instanceof Array ? e.messages.join("\n > ") : e.messages}
Názov: ${item.name}
Cena: ${item.cost} Mincí
Nový zostatok: ${Coins.get(client)} Mincí
=========`, "announcement");
            });
        } else {
            return client.send(`==== Shop ====
Neplatné číslo možnosti!
=========`, "announcement");
        }
    }
    static generateMenu() {
        return ShopItem.items.reduce((prev, curr, i) => (prev.push(`${i+1}. ${curr.name} - ${curr.description} [${curr.cost} Mincí]`), prev), []);
    }
}
ShopItem.items = [];

module.exports = ShopItem;