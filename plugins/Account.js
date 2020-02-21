const Server = require(__dirname + "/../server.js");
const server = Server.getServer();
const Client = require(__dirname + "/../client.js");
const Auth = require(__dirname + "/../auth.js");
const Command = require(__dirname + "/../command.js");

new Command("account", "acc").on("execute", e => {
    let sender = e.executor;
    let isServer = sender instanceof Server;

    let a0 = e.args[0];
    let a1 = e.args[1];
    let a2 = e.args[2];
    let a3 = e.args[3];

    if(!a0) { // /account
        if(isServer) return sender.send(`| [Príkaz] Tento príkaz nemôžes použiť!`);
        if(!sender.isLogged) return sender.send(`| [Príkaz] Nie si prihlásený!`);

        var account = Auth.getAccount(sender.name);

        return sender.send(`==== Tvoj Účet ====
Meno: ${account.name}
Heslo: ${account.password}
Prefix: ${account.prefix || "žiaden"}
Suffix: ${account.suffix || "žiaden"}
Práva: ${account.permissions.join(", ") || "žiadne"}
================`);
    }

    if(a0 == "list") { // /account list
        if(!sender.hasPermission("account.list")) return sender.send(`| [Príkaz] Na tento príkaz nemáš práva!`);
        let accounts = Auth.getAllAccounts();

        return sender.send(`==== Všetky Účty ====
${accounts.reduce((prev, curr) => {prev.push(" > " + curr.prefix + curr.name + curr.suffix); return prev}, []).join("\n")}
==============`);
    }

    if(a0 == "user") {
        let client = server.getClientByName(a1);
        if(!client) return sender.send(`| [Príkaz] ${a1} nie je pripojený!`);
        let account = Auth.getAccount(client.name);
        if(!account) return sender.send(`| [Príkaz] Účet ${a1} neexistuje!`);

        if(!a2) { // /account user <nick>
            if(!sender.hasPermission("account.user.get")) return sender.send(`| [Príkaz] Na tento príkaz nemáš práva!`);

            return sender.send(`==== Účet ${account.name} ====
Meno: ${account.name}
Heslo: ${account.password}
Prefix: ${account.prefix || "žiaden"}
Suffix: ${account.suffix || "žiaden"}
Práva: ${account.permissions.join(", ") || "žiadne"}
==============`);
        }

        if(a2 == "grant") { // /account user <nick> grant <permission>
            if(!sender.hasPermission("account.user.grant")) return sender.send(`| [Príkaz] Na tento príkaz nemáš práva!`);
            if(!a3) return client.send(`| [Príkaz] Použi "/account user <nick> grant <permission>"!`);

            account.permissions.push(a3);
            if(Auth.updateAccount(client.name, account)) {
                client.send(`| [Účet] ${sender.displayName} ti pridelil právo "${a3}"!`);
                return sender.send(`| [Príkaz] Používateľovi ${client.displayName} bolo pridelené právo "${a3}"!`);
            } else return sender.send(`| [Príkaz] Nepodarilo sa prideliť právo!`);
        }

        if(a2 == "deny") { // /account user <nick> deny <permission>
            if(!sender.hasPermission("account.user.deny")) return sender.send(`| [Príkaz] Na tento príkaz nemáš práva!`);
            if(!a3) return client.send(`| [Príkaz] Použi "/account user <nick> deny <permission>"!`);

            var id = account.permissions.indexOf(a3);

            if(id < 0) return sender.send(`| [Príkaz] Užívateľ ${client.displayName} nevlastní právo "${a3}"!`);

            account.permissions.splice(id, 1);
            if(Auth.updateAccount(client.name, account)) {
                client.send(`| [Účet] ${sender.displayName} ti odobral právo "${a3}"!`);
                return sender.send(`| [Príkaz] Používateľovi ${client.displayName} bolo odobraté právo "${a3}"!`);
            } else return sender.send(`| [Príkaz] Nepodarilo sa odobrať právo!`);
        }

        if(a2 == "prefix") { // /account user <nick> prefix <prefix>
            if(!sender.hasPermission("account.user.prefix")) return sender.send(`| [Príkaz] Na tento príkaz nemáš práva!`);
            if(!a3) return client.send(`| [Príkaz] Použi "/account user <nick> prefix <new_prefix>"!`);
            if(!a3.match(/^\w{0,16}$/)) return client.send(`| [Príkaz] Prefix musí mať 3-16 znakov a môže obsahovať a-z, 0-9 a _`);

            a3 = a3.replace(/_/g, " ");
            account.prefix = a3;
            client.displayName = account.prefix + account.name + account.suffix;
            if(Auth.updateAccount(client.name, account)) {
                client.send(`| [Účet] ${sender.displayName} ti nastavil prefix na "${a3}"!`);
                return sender.send(`| [Príkaz] Používateľovi ${client.displayName} bol nastavený prefix na "${a3}"!`);
            } else return sender.send(`| [Príkaz] Nepodarilo sa nastaviť prefix!`);
        }

        if(a2 == "suffix") { // /account user <nick> suffix <suffix>
            if(!sender.hasPermission("account.user.suffix")) return sender.send(`| [Príkaz] Na tento príkaz nemáš práva!`);
            if(!a3) return client.send(`| [Príkaz] Použi "/account user <nick> suffix <new_suffix>"!`);
            if(!a3.match(/^\w{0,16}$/)) return client.send(`| [Príkaz] Suffix musí mať 3-16 znakov a môže obsahovať a-z, 0-9 a _`);

            a3 = a3.replace(/_/g, " ");
            account.suffix = a3;
            client.displayName = account.prefix + account.name + account.suffix;
            if(Auth.updateAccount(client.name, account)) {
                client.send(`| [Účet] ${sender.displayName} ti nastavil suffix na "${a3}"!`);
                return sender.send(`| [Príkaz] Používateľovi ${client.displayName} bol nastavený suffix na "${a3}"!`);
            } else return sender.send(`| [Príkaz] Nepodarilo sa nastaviť suffix!`);
        }

        if(a2 == "delete") { // /account user <nick> delete
            if(!sender.hasPermission("account.user.delete")) return sender.send(`| [Príkaz] Na tento príkaz nemáš práva!`);

            if(Auth.updateAccount(client.name, false)) {
                client.displayName = client.name;
                client.isLogged = false;
                server.broadcast(`| [Účet] ${sender.displayName} odstránil účet ${client.name}!`);
                return sender.send(`| [Príkaz] Používateľovi ${client.displayName} bol odstránený účet!`);
            } else return sender.send(`| [Príkaz] Nepodarilo sa odstrániť účet!`);
        }

    }

    return sender.send(`| [Príkaz] Neplatný príkaz, napíš "/help" pre viac info!`);

});

new Command("register", "reg").on("execute", e => {
    let client = e.executor;
    let nick = e.args[0];
    let pass1 = e.args[1];
    let pass2 = e.args[2];

    if(!(client instanceof Client)) return client.send(`| [Príkaz] Tento príkaz nemôžes použiť!`);
    if(!nick || !pass1 || !pass2) return client.send(`| [Login] Použi "/register <nick> <heslo> <heslo>"!`);
    if(!nick.match(/^\w{3,16}$/)) return client.send(`| [Login] Nick musí mať 3-16 znakov a môže obsahovať a-z, 0-9 a _`);
    if(pass1 != pass2) return client.send(`| [Login] Heslá sa nezhodujú!`);
    if(!pass1.match(/^.{5,24}$/)) return client.send(`| [Login] Heslo musí obsahovať 5-24 znakov!`);

    var account = {
        name: nick + (nick.match(/Stranger\d*/) ? "_registred" : ""),
        password: pass1.replace(/"/g, '\\"').replace(/'/g, "\\'"),
        prefix: "",
        suffix: "",
        permissions: [],
        data: {}
    };

    if(!Auth.register(account)) return client.send(`| [Login] Účet s menom "${account.name}" už existuje!`);

    client.isLogged = true;
    client.name = account.name;
    client.displayName = account.name;
    client.send(`==== Účet ====
 > Tvoj účet bol úspešne vytvorený!
 > Je registrovaný pod menom "${account.name}".
 > Meno si môžeš kedykoľvek zmeniť pomocou "/nick <meno>".
 > Pomocou mena sa budeš prihlasovať!
 > Pri ďalšej návšteve sa prihlásič pomocou "/login <meno> <heslo>".
===========`)
    server.broadcast(`| [*] ${client.displayName} sa zaregistroval!`, client);
    server.dispatchEvent("register", { client: client });
});

new Command("login", "l").on("execute", e => {
    let client = e.executor;
    let nick = e.args[0];
    let pass = e.args[1];

    if(!(client instanceof Client)) return client.send(`| [Príkaz] Tento príkaz nemôžes použiť!`);
    if(client.isLogged) return client.send(`| [Login] Už si prihlásený!`);
    if(!nick || !pass) return client.send(`| [Príkaz] Použi "/login <nick> <login>"!`);

    let account = Auth.login(nick, pass);

    if(account == null) return client.send(`| [Login] Účet registrovaný pod menom "${nick}" neexistuje!`);
    else if(account == false) return client.send(`| [Login] Zadané heslo nesúhlasí s účtom "${nick}"!`);

    client.isLogged = true;
    client.name = nick;
    client.displayName = account.prefix + account.name + account.suffix;

    client.send(`| [Login] Bol si úspešne prihlásený!`);
    server.broadcast(`| [+] ${client.displayName} sa prihlásil!`, client);
    server.dispatchEvent("login", { client: client });
});

new Command("logout").on("execute", e => {
    let client = e.executor;

    if(!(client instanceof Client)) return client.send(`| [Príkaz] Tento príkaz nemôžes použiť!`);
    if(!client.isLogged) return client.send(`| [Login] Nie si prihlásený!`);

    client.isLogged = false;
    client.send(`| [Login] Bol si úspešne odhlásený!`);
    server.dispatchEvent("logout", { client: client });
});

new Command("nick").on("execute", e => {
    let executor = e.executor;
    let nick = e.args.join(" ").trim().replace(/\s/g, "_");

    if(!nick.match(/^\w{3,16}$/)) return executor.send(`| [Príkaz] Nick musí mať 3-16 znakov a môže obsahovať a-z, 0-9 a _`);

    if(executor instanceof Client) {
        if(!nick) return executor.send(`| [Príkaz] Tento nick nemôžeš použiť!`);
        if(server.getClientByName(nick)) return executor.send(`| [Príkaz] Nick "${nick}" už niekto má!`);
        if(Auth.getAccount(nick)) return executor.send(`| [Login] Existuje účet registrovaný pod menom "${nick}", ak je tvoj použi "/login ${nick} <heslo>" na prihlásenie!`);

        server.broadcast(`| [Info] ${executor.displayName} si zmenil nick na ${nick}`, executor);
        executor.displayName = nick;
        executor.send(`| [Príkaz] Tvoj nick bol nastavený na "${nick}"`);

        if(executor.isLogged) {
            var account = Auth.getAccount(executor.name);
            account.name = nick;
            executor.displayName = account.prefix + account.name + account.suffix;
            if(!Auth.updateAccount(executor.name, account)) Out.error("Error");
        }

        executor.name = nick;
    }
});

new Command("me").on("execute", e => {
    let sender = e.executor;

    sender.send(`==== ${sender.name} ====
Nick: ${sender.name}
Meno: ${sender.displayName}
Prihlásený: ${sender.isLogged ? "áno" : "nie"}
Pripojený: ${sender.loggedTime}
INFO: pre viac informácií napíš "/account"
==============`);
});

class Account {
    static getData(client) {
        if(!client.isLogged) return false;
        return Auth.getAccount(client.name).data;
    }
    static updateData(client, data) {
        if(!client.isLogged) return false;

        let account = Auth.getAccount(client.name);
        account.data = {...account.data, ...data };

        return Auth.updateAccount(account.name, account);
    }
}

module.exports = Account;