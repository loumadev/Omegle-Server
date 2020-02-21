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
 > Možnosť vyberieš pomocou "/shop <číslo_možnosti>"

${ShopItem.generateMenu()}
=========`);
    }

    if(e.args[0] == "1") {

    }

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
        let item = ShopItem.items[+ --id];

        if(item) {
            if(coins < item.cost) return;
            item.dispatchEvent("buy", { client: client, item: item }, message => {
                Coins.add(-item.cost);
                client.send(`==== Shop ====
 > Obchod bol úspešný!
 > ${message instanceof Array ? message.join("\n > ") : message}
Názov: ${item.name}
Cena: ${item.cost} Mincí
Nový zostatok: ${Coins.get(client)} Mincí
=========`);
            });
        } else return;
    }
    static generateMenu() {
        return ShopItem.items.reduce((prev, curr, i) => prev += `${i+1}. ${curr.name} - ${curr.description} [${curr.cost} Mincí]`, "");
    }
}
ShopItem.items = [];

module.exports = ShopItem;