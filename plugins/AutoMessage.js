const server = require(__dirname + "/../server.js").getServer();

const Messages = [
    `Chceš vedieť ako to funguje? Kontaktuj ma na IG: @jaroslav.louma`,
    `Kontakt na Admina: IG: @jaroslav.louma`,
    `Našiel si nejakú chybu? Daj mi vedieť na IG: @jaroslav.louma`,
    `Chceš ma podporiť? Môžeš poslať donate! paypal.me/jlouma`,
    `Potrebuješ pomoc? Napíš "/help"!`,
    `Zoznam príkazov nájdeš v "/help"!`,
    `Zaregistruj sa! Prináša to veľa výhod! ("/register")`,
    `Máš nejaký nápad na vylepšenie? Napíš mi na IG: @jaroslav.louma`,
    `Máš nejaký návrh čo pridať? Napíš mi na IG: @jaroslav.louma`,
    `Každých 10 minút je nejaká hádanka! Uhádni a získaj odmenu!`,
    `Mince sa dajú využiť v "/shop"!`,
    `Nick sa nastavuje pomocou "/nick meno"!`,
    `Nick si zmeníš cez "/nick meno"!`,
    `Chceš si zmeniť nick? Použi "/nick meno"!`,
    `Nevieš ako sa voláš? Daj "/me"!`,
    `Informácie o svojom účte nájdeš v "/account"!`,
    `Zabudol si heslo? Napíš mi na IG: @jaroslav.louma`,
    `Prihlásiš sa pomocou "/login"!`,
    `Nechceš aby ti niekto ukradol meno? Daj "/register"!`,
    `Môžeš začať hlasovanie pomocou "/poll create <otázka>"!`,
    `Buď aktívny a získaj VIP!`,
    `Chceš vedieť kto je pripojený? Napíš "/list"!`,
    `Všetky nadávky sú cenzúrované!`,
    `Súkromnú správu pošleš pomocou "/pm nick_komu správa"!`,
    `Server sa reštartuje každých 30 minút!`
];
var lastIndex = -1;

const Interval = setInterval(() => {

    var index = -1;
    while((index = ~~(Math.random() * Messages.length)) == lastIndex);

    lastIndex = index;
    server.broadcast(`[INFO] ${Messages[index]}`);

}, 60e3 * 2.25);

setInterval(() => {
    server.reload();
}, 60e3 * 30);

setInterval(() => {
    server.fixConnections();
}, 1e3 * 30);