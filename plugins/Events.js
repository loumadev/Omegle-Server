const server = require(__dirname + "/../server.js").getServer();
const Coins = require("./Coins.js");

let Events = {};

server.on("load", () => {
    server.customData.events = {
        math: {
            isRunning: false,
            answer: undefined
        },
        interval: null
    };
    Events = server.customData.events;

    Events.interval = setInterval(() => {
        var num1 = ~~(Math.random() * 60 + 1);
        var num2 = ~~(Math.random() * 20 + 1);

        Events.math.answer = num1 + num2;
        Events.math.isRunning = true;

        server.broadcast(`==== Príklad ====
 > Vypočítaj príklad do 20 sekúnd a získaj 5 Mincí!
 > ${num1} + ${num2} = ?
==========`);

        setTimeout(() => {
            server.broadcast(`==== Príklad ====
 > Čas vypršal!
 > ${num1} + ${num2} = ${Events.math.answer}
==========`);

            Events.math.isRunning = false;
            Events.math.answer = undefined;
        }, 20e3);

    }, 60e3 * 10);

});

server.on("message", e => {
    let client = e.client;
    let message = e.message;

    var answer = Events.math.answer;

    if(Events.math.isRunning) {
        if(message == answer) {
            client.send(`==== Príklad ====
 > Výsledok ${answer} je správny!
 > ${num1} + ${num2} = ${answer}
 > Získal 5 Mincí, aktuálne máš ${Coins.add(client, 5)}
==========`);
            e.preventDefault();
        }
    }
});