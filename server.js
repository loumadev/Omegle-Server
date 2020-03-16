const fs = require("fs");
const readline = require('readline');
const EventListener = require("./eventListener.js");
const Client = require("./client.js");
const Command = require("./command.js");
const Auth = require("./auth.js");
const Out = require("./formatting.js");

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

let server = null;

String.prototype.removeAccents = function() {
    return this.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

class Server extends EventListener {
    constructor(slots = 5) {
        super();
        this.slots = slots;
        this.customSlots = 5;
        this.clients = [];
        this.plugins = [];
        this.chatLog = "";
        this.number = 0;
        this.name = "Server";
        this.displayName = "*Server*";
        this.customData = {
            lastClient: null
        };

        this.path = __dirname;
        this.send = message => console.log(message);
        this.hasPermission = () => true;
    }
    static getServer() {
        return server;
    }
    start() {
        console.log("Starting server...");
        var status;

        (() => {
            var session = this.loadSession();
            if(session) {
                if(new Date() - new Date(session.time) < 60e3) {
                    console.log(session.chatlog);

                    for(var client of session.clients) {
                        var c = this.addClient(client.settings, client.id);

                        Server.resetClient(c);
                        c.isConnected = client.connected;
                        c.name = client.name;

                        console.log(client.connected);

                        if(client.connected) {
                            c.displayName = client.name;
                            c.loggedTime = new Date();
                        }
                    }

                    status = `Server bol úspešne obnovený!`;
                    return console.log("Last session loaded!");
                } else console.log("Invalid session found! Starting new...");
            } else console.log("Could not find last session! Starting new...");

            for(let i = 0; i < this.slots; i++) {
                this.addClient();
            }
            for(let i = 0; i < this.customSlots; i++) {
                this.addClient({ lang: "sk", topics: '["PanServer"]' });
            }
        })();

        server.loadPlugins();
        this.dispatchEvent("load", () => {
            if(status) server.broadcast(`| [Info] ${status}`);
        });
    }
    stop() {
        this.saveSession();
        this.broadcast(`| [Server] Server is stopping...`);
        this.kickAll();
        this.dispatchEvent("unload");
        process.exit();
    }
    reload() {
        this.broadcast(`| [Info] Server bude obnovený, počkajte prosím!`);
        this.saveSession();
        process.exit();

        /*for(let client of this.clients) {
            if(!client.isLogged) continue;
            var account = Auth.getAccount(client.name);
            client.displayName = account.prefix + account.name + account.suffix;
        }
        this.broadcast(`| [Info] Server bol obnovený!`);
        this.dispatchEvent("reload");*/
    }
    loadPlugins() {
        const plugins = "./plugins/";

        console.log("Loading plugins...");
        if(!fs.existsSync(plugins)) {
            console.log("Plugins folder does not exists! Creating new...");
            fs.mkdirSync(plugins);
            return console.log("Plugins folder created!");
        }
        for(var file of fs.readdirSync(plugins)) {
            let success = false;
            const path = plugins + file;

            if(fs.lstatSync(path).isDirectory()) continue;

            try {
                require(path);
                success = true;
            } catch(e) {
                Out.error("Error while loading", file, "\n", e);
            }
            this.plugins.push({ name: (file.match(/^(.*?)(?:\.|$)/m) || "")[1] || "ServerPlugin", file: file, enabled: success });
        }
        console.log(`Loaded ${this.plugins.length} plugins!`);
    }
    saveSession() {
        var session = {
            chatlog: "",
            clients: [],
            time: new Date()
        };
        for(var client of this.clients) {
            session.clients.push({ id: client.clientID, name: client.name || ("Client" + Math.floor((Math.random() * 10000))), connected: client.isConnected, settings: client.settings });
        }
        fs.writeFileSync("lastSession.json", JSON.stringify(session));
    }
    loadSession() {
        var session = {};
        try {
            session = JSON.parse(fs.readFileSync("lastSession.json"));
        } catch(e) { return false; }
        return session;
    }
    kickAll(reason = "") {
        for(var client of server.clients) {
            client.send(`| [Info] Bol si vykopnutý${reason ? " za " + reason : ""}!`);
            client.disconnect();
        }
    }
    fixConnections() {
        for(var client of this.clients) {
            if(!client.isConnected && !client.isWaiting) client.connect();
        }
    }
    getClientByName(name) {
        for(var client of this.clients) {
            if(client.name == name) return client;
        }
        return undefined;
    }
    broadcast(message, except) {
        this.dispatchEvent("broadcast", { message: message, except: except }, () => {
            for(var client of this.clients) {
                if(!client || client == except) continue;
                client.send(message);
            }
            console.log(message);
        });
    }
    static resetClient(client) {
        client.loggedTime = new Date();
        client.lastMessage = null;
        client.isLogged = false;
        client.isMuted = false;
        client.customData = {
            lastClient: null
        };
        client.hasPermission = permission => {
            if(client.isLogged) return Auth.hasPermission(Auth.getAccount(client.name), permission);
            else return false;
        }
        client.kick = reason => {
            client.send(`| [Info] Bol si vykopnutý${reason ? " za " + reason : ""}!`);
            client.disconnect();
        }
    }
    addListeners(client, clientID = null) {
        client.on(Client.CONNECTED, e => {
            if(!clientID || client.clientID != clientID) client.name = `Stranger${++this.number}`;
            client.displayName = client.name;
            Server.resetClient(client);

            client.send(`==== Vitaj ${client.displayName} ==== 
 > Vitaj v chate, kde si môžeš písať s viacerými ľuďmi naraz!
 > Tvoje meno je: "${client.name}" (Bude ti písať pred správou)!
 > Pre zmenu mena napíš "/nick <novy_nick>" (Napr: /nick Janko)!
 > Chceš sa prihlásiť? Použi "/login <nick> <heslo>"!
 > Nie si zaregistrovaný? Použi "/register <nick> <heslo> <heslo>"!
 > Pre viac príkazov napíš "/help"!
 > Ak sa budeš chcieť pripojiť znova, môžeš použiť záujem "PanServer"!
===============`);

            /*if(client.settings.topics) {
                for(var client2 of this.clients) {
                    if(client2.settings.topics && !client2.isConnected) {
                        client2.connect(client2.settings);
                        break;
                    }
                }
                this.addClient({ lang: "sk", topics: '["test1258"]' });
            }*/

            this.dispatchEvent("connection", { client: client });
        });

        client.on(Client.MESSAGE, e => {
            let message = e.data;
            let cmd = Command.onChat(client, message);

            if(message.match(/@mattymatejmatt/gmi) || message.match(/masturbujem/gmi)) {
                client.send(`| [Ban] Si zabanovaný!`);
                client.kick();
                client.connect(client.settings);
                return false;
            }

            if(message.startsWith("| [") || (!client.lastMessage && (message.match(/zozn(a|á)m/im) || message.match(/rande/im) || message.match(/\.com/im) || message.match(/kdir\./im)))) {
                setTimeout(() => {
                    client.kick();
                    client.connect(client.settings);
                    client.isMuted = true;
                }, Math.random() * 5e3);
                return false;
            }

            if(!client.lastMessage && (message.match(/snap/im) || message.match(/ig/im) || message.match(/sex/im) || message.match(/nadr(z|ž)an/im) || message.match(/18\+/im))) {
                client.send(`| [Spam] Tvoja správa nebola odoslaná!`);
                return false;
            }

            this.dispatchEvent("message", { client: client, message: message }, () => {
                client.lastMessage = new Date();

                if(cmd) Out.log(`| [§aCommand§r] §e${client.displayName}§r: §b${message}§r`);

                if(cmd == -1) return client.send(`| [Príkaz] Neznámy príkaz "${message.split(" ")[0]}"!`);
                else if(cmd) return;

                this.broadcast(`| [${client.displayName}] ${message}`, client);
            });
        });

        client.on(Client.STRANGER_DISCONNECT, e => {
            if(client.lastMessage) this.broadcast(`| [-] ${client.displayName}`, client);

            this.dispatchEvent("disconnect", { client: client, disconnected: "stranger" });
            client.reset();
            client.connect(client.settings);
        });

        client.on(Client.CLIENT_DISCONNECT, e => {
            this.dispatchEvent("disconnect", { client: client, disconnected: "client" });
            client.reset();
            client.connect(client.settings);
        });

        client.on(Client.CONNECTION_DIED, e => {
            Out.warn(`${client.name} Connection Died!`, e.data);
        });

        client.on(Client.RECAPTCHA_REQUIRED, e => {
            Out.warn(`${client.name} reCaptcha`, e.data);
        });

        client.on(Client.ERROR, e => {
            Out.error(`${client.name} Error:`, e.data);
        });

        client.on(Client.LISTENING_ERROR, e => {
            this.dispatchEvent("disconnect", { client: client, disconnect: "error" });
            this.broadcast(`| [!] ${client.displayName}`, client);
            Out.error(client.name, "Crashed", e);
        });
    }
    addClient(settings = { lang: "sk" }, clientID = null) {
        let client = new Client(`OmegleClient`, "Q7445589");

        client.settings = settings;
        client.clientID = clientID;

        this.addListeners(client, clientID);

        if(clientID) {
            client.eventsFetch();
            this.dispatchEvent("connection", { client: client });
        } else client.connect(client.settings);

        this.clients.push(client);

        return client;
    }

}
module.exports = Server;
server = new Server(10);


server.on("message", e => {
    var words1 = ["kokot", "piča", "pičus", "jebať", "jebem", "jebe", "chuj"];
    //var words2 = ["debil", "idiot"];
    for(var word of words1) {
        if(e.message.indexOf(word) > -1) {
            e.preventDefault();
            e.client.send(`| [Chat] Správa obsahuje nepovolené slovo! (${word})`);
        }
    }
});





/* Default Server Commands */

new Command("help").on("execute", e => {
    var client = e.executor;
    client.send(` 
==== Príkazy ====
 > /help - zobrazí toto menu
 > /nick <novy_nick> - zmena nicku/mena
 > /msg <nick> <správa> - súkromná správa (/pm, /dm)
 > /reply <správa> - odpovedať na poslednú súkromnú správu (/r, /re)
 > /ignore <nick> - ignorovať súkromné správy od používateľa
 > /afk - Away From Keyboard [VIP]
 > /me - zobrazí tvoj nick a ďalšie informácie
 > /list - zobrazí pripojených užívateľov
 > /register <nick> <heslo> <heslo> - možnosť registrácie (/reg)
 > /login <nick> <heslo> - možnosť prihlásenia (/l)
 > /logout - možnosť odhlásenia
 > /shop - Zobrazí ponuku obchodu
 > /ping - otestuje spojenie
 > /poll create <otázka> - začne hlasovanie [VIP]
 > /poll ano|nie - odpovedať na hlasovanie
 > /poll delete [<dôvod>] *
 > /kick <nick> [<dôvod>] *
 > /mute <nick> *
 > /unmute <nick> *
 > /stop *
 > /reload *
 > /broadcast <správa> * - Poslať verejnú správu (/bc)
 > /plugins - zobrazí načítané pluginy (/pl)
 > /coins - zobrazí aktualný počet mincí
 > /coins <nick> *
 > /coins <nick> set|add <amount> *
 > /account - zobrazí informácie o účte (/acc)
 > /account list *
 > /account user <nick> *
 > /account user <nick> grant|deny <permission> *
 > /account user <nick> prefix|suffix <new_prefix|new_suffix> *
 > /account user <nick> delete *
INFO: Príkazy s hviezdičkou potrebujú povolenie!
==============`);
});

new Command("plugins", "pl").on("execute", e => {
    e.executor.send(` 
==== Pluginy (${server.plugins.length}) ====
${server.plugins.reduce((prev, curr) => {prev.push((curr.enabled ? "" : "!") + curr.name); return prev}, []).join(", ")}
==============`);
});


new Command("list").on("execute", e => {
    e.executor.send(` 
==== Aktuálne Sloty ====
${server.clients.reduce((prev, curr) => {prev.push((curr.isWaiting ? "-" : (curr.isConnected ? "" : "!")) + (curr.displayName || "Prázdny slot") + (curr.settings.topics ? "*" : "")); return prev}, []).join(", ")}
=============`);
});

new Command("ping").on("execute", e => {
    e.executor.send(`| [Príkaz] Pong!`);
});

new Command("kick").on("execute", e => {
    let sender = e.executor;
    let nick = e.args.shift();
    let client = server.getClientByName(nick);
    let reason = e.args.join(" ");

    if(!sender.hasPermission("server.client.kick")) return sender.send(`| [Príkaz] Na tento príkaz nemáš práva!`);
    if(!nick) return sender.send(`| [Príkaz] Použi "/kick <nick>"`);
    if(!client) return sender.send(`| [Príkaz] ${nick} nie je pripojený!`);

    server.broadcast(`| ${sender.displayName} vykopol ${client.displayName}${reason ? " za " + reason: ""}!`);
    client.kick(reason);
});

new Command("mute").on("execute", e => {
    let sender = e.executor;
    let client = server.getClientByName(e.args[0]);

    if(!sender.hasPermission("server.client.mute")) return sender.send(`| [Príkaz] Na tento príkaz nemáš práva!`);
    if(e.args[0]) return sender.send(`| [Príkaz] Použi "/mute <nick>"`);
    if(!client) return sender.send(`| [Príkaz] ${e.args[0]} nie je pripojený!`);
    client.isMuted = true;
    server.broadcast(`| ${client.displayName} bol umlčaný!`);
});

new Command("unmute").on("execute", e => {
    let sender = e.executor;
    let client = server.getClientByName(e.args[0]);

    if(!sender.hasPermission("server.client.unmute")) return sender.send(`| [Príkaz] Na tento príkaz nemáš práva!`);
    if(e.args[0]) return sender.send(`| [Príkaz] Použi "/unmute <nick>"`);
    if(!client) return sender.send(`| [Príkaz] ${e.args[0]} nie je pripojený!`);
    client.isMuted = false;
    server.broadcast(`| ${client.displayName} môže zas písať!`);
});

new Command("stop").on("execute", e => {
    let sender = e.executor;

    if(!sender.hasPermission("server.control.stop")) return sender.send(`| [Príkaz] Na tento príkaz nemáš práva!`);
    server.broadcast(`| [Info] Server is stopping...`);
    server.stop();
});

new Command("reload").on("execute", e => {
    let sender = e.executor;

    if(!sender.hasPermission("server.control.reload")) return sender.send(`| [Príkaz] Na tento príkaz nemáš práva!`);
    server.reload();
});

/* Standard Input */

rl.on('line', line => {
    if(!line) return console.log(">");
    if(line.startsWith("/")) {
        let cmd = Command.onChat(server, line);

        try {
            if(cmd == -1) return console.log(eval(line.slice(1)));
        } catch(e) {
            console.log(e);
        }
        //else if(cmd) return;
    } else server.broadcast(`| [${server.displayName}] ${line}`);
});

process.on('exit', () => {
    //server.kickAll();
});



/* Begin Server */

server.start();