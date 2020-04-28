const EventListener = require(__dirname + "/../eventListener.js");
const server = require(__dirname + "/../server.js").getServer();
const Coins = require("./Coins.js");


class ChatEvent extends EventListener {
    constructor() {
        super();
        ChatEvent.events.push(this);
    }
    cancel() {
        ChatEvent.runningEvent = null;
    }
}
ChatEvent.runningEvent = null;
ChatEvent.events = [];
ChatEvent.interval = setInterval(() => {
    var index = ~~(Math.random() * ChatEvent.events.length);
    var event = ChatEvent.events[index];

    ChatEvent.runningEvent = event;
    event.dispatchEvent("start");
}, 60e3 * 10);

server.on("chat", e => {
    if(!ChatEvent.runningEvent) return;
    ChatEvent.runningEvent.dispatchEvent("chat", { client: e.client, message: e.message, event: e });
});



const math0 = new ChatEvent();
math0.on("start", e => {
    var num1 = ~~(Math.random() * 60 + 10);
    var num2 = ~~(Math.random() * 40 + 10);

    math0.num1 = num1;
    math0.num2 = num2;
    math0.answer = num1 + num2;

    server.broadcast(`==== Príklad ====
 > Vypočítaj príklad do 20 sekúnd a získaj 5 Mincí!
 > ${num1} + ${num2} = ?
==========`, "announcement");

    setTimeout(() => {
        server.broadcast(`==== Príklad ====
 > Čas vypršal!
 > ${num1} + ${num2} = ${math0.answer}
==========`, "announcement");
        math0.cancel();
    }, 20e3);
});
math0.on("chat", e => {
    let client = e.client;
    let message = e.message;

    var answer = math0.answer;

    if(message == answer) {
        client.send(`==== Príklad ====
 > Výsledok ${message} je správny!
 > ${math0.num1} + ${math0.num2} = ${answer}
 > ${client.isLogged ? "Získal 5 Mincí, aktuálne máš " + Coins.add(client, 5) + " Mincí" : "Na to aby si získal mince, musíš byť prihlásený!"}
==========`, "announcement");
        server.broadcast(`[Príklad] ${client.displayName} vypočítal príklad!`, client);
        e.event.preventDefault();
    }

});


const math1 = new ChatEvent();
math1.on("start", e => {
    var num1 = ~~(Math.random() * 600 + 100);
    var num2 = ~~(Math.random() * 400 + 100);

    math1.num1 = num1;
    math1.num2 = num2;
    math1.answer = num1 + num2;

    server.broadcast(`==== Príklad ====
 > Vypočítaj príklad do 20 sekúnd a získaj 10 Mincí!
 > ${num1} + ${num2} = ?
==========`, "announcement");

    setTimeout(() => {
        server.broadcast(`==== Príklad ====
 > Čas vypršal!
 > ${num1} + ${num2} = ${math1.answer}
==========`, "announcement");
        math1.cancel();
    }, 20e3);
});
math1.on("chat", e => {
    let client = e.client;
    let message = e.message;

    var answer = math1.answer;

    if(message == answer) {
        client.send(`==== Príklad ====
 > Výsledok ${message} je správny!
 > ${math1.num1} + ${math1.num2} = ${answer}
 > ${client.isLogged ? "Získal 10 Mincí, aktuálne máš " + Coins.add(client, 10) + " Mincí" : "Na to aby si získal mince, musíš byť prihlásený!"}
==========`, "announcement");
        server.broadcast(`[Príklad] ${client.displayName} vypočítal príklad!`, client);
        e.event.preventDefault();
    }

});





/*server.on("load", () => {
    server.customData.events = {
        math: {
            isRunning: false,
            answer: undefined
        },
        interval: null
    };
    Events = server.customData.events;

    Events.interval = setInterval(() => {
        var num1 = ~~(Math.random() * 60 + 10);
        var num2 = ~~(Math.random() * 40 + 10);

        Events.math.num1 = num1;
        Events.math.num2 = num2;
        Events.math.answer = num1 + num2;
        Events.math.isRunning = true;

        server.broadcast(`==== Príklad ====
 > Vypočítaj príklad do 20 sekúnd a získaj 5 Mincí!
 > ${num1} + ${num2} = ?
==========`, "announcement");

        setTimeout(() => {
            server.broadcast(`==== Príklad ====
 > Čas vypršal!
 > ${num1} + ${num2} = ${Events.math.answer}
==========`, "announcement");

            Events.math.isRunning = false;
            Events.math.answer = undefined;
        }, 20e3);

    }, 60e3 * 10);

});

server.on("chat", e => {
    let client = e.client;
    let message = e.message;

    var answer = Events.math.answer;

    if(Events.math.isRunning) {
        if(message == answer) {
            client.send(`==== Príklad ====
 > Výsledok ${answer} je správny!
 > ${Events.math.num1} + ${Events.math.num2} = ${answer}
 > ${client.isLogged ? "Získal 5 Mincí, aktuálne máš " + Coins.add(client, 5) + " Mincí" : "Na to aby si získal mince, musíš byť prihlásený!"}
==========`, "announcement");
            server.broadcast(`[Príklad] ${client.displayName} vypočítal príklad!`, client);
            e.preventDefault();
        }
    }
});*/