const readline = require('readline');
const Client = require("./client.js");

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

let client1, client2, randomID = Client.generateID(8);

console.log(randomID);

function chatServer() {
    setTimeout(() => {
        client1 = new Client("Client1", randomID);
        client2 = new Client("Client2", randomID);
        client1.connect();

        client1.on(Client.CONNECTED, e => {
            console.log("------------");
            console.log(`${client1.name}: Connected!`)
            client2.connect();
        });

        client2.on(Client.CONNECTED, e => {
            console.log(`${client2.name}: Connected!`)
        });

        client1.on(Client.MESSAGE, e => {
            console.log(`${client1.name}: ${e.data}`);
            client2.send(e.data);
        });

        client2.on(Client.MESSAGE, e => {
            console.log(`${client2.name}: ${e.data}`);
            client1.send(e.data);
        });

        client1.on(Client.STRANGER_DISCONNECT, e => {
            console.log(`${client1.name}: Disconnected!`);
            client2.disconnect();
            //process.exit(0);
            chatServer();
        });

        client2.on(Client.STRANGER_DISCONNECT, e => {
            console.log(`${client2.name}: Disconnected!`);
            client1.disconnect();
            //process.exit(0);
            chatServer();
        });

        client1.on(Client.RECAPTCHA_REQUIRED, e => {
            console.log(`${client1.name}: reCaptcha`, e.data);
        });
        client2.on(Client.RECAPTCHA_REQUIRED, e => {
            console.log(`${client2.name}: reCaptcha`, e.data);
        });
    }, 1000);
}

chatServer();

/*client.on(Client.WAITING, e => console.log(`Client: Waiting`));
client.on(Client.CONNECTED, e => console.log(`Client: Connected`));
client.on(Client.SERVER_MESSAGE, e => console.log(`Server: ${e.data}`));
client.on(Client.MESSAGE, e => console.log(`Stranger: ${e.data}`));
client.on(Client.TYPING, e => console.log(`Client: Stranger is typing`));
client.on(Client.STOPPED_TYPING, e => console.log(`Client: Stranger stopped typing`));*/

rl.on('line', line => {
    var args = line.split(" ");
    var cmd = args.shift();
    if(!cmd.startsWith("/")) client1.send(line);
    else if(cmd == "/disconnect") client1.disconnect();
    else if(cmd == "/connect") client1.connect();
    else console.log("unknown command");
});