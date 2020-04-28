//const { Builder, By, until } = require('selenium-webdriver');
const fetch = require('node-fetch');
//const HttpsProxyAgent = require('https-proxy-agent');
const EventListener = require("./eventListener.js");
const Out = require("./formatting.js");

const Event = {
    WAITING: "waiting",
    CONNECTED: "connected",
    SERVER_MESSAGE: "serverMessage",
    IDENTD_IGESTS: "identDigests",
    STATUS_INFO: "statusInfo",
    TYPING: "typing",
    STOPPED_TYPING: "stoppedTyping",
    MESSAGE: "gotMessage",
    STRANGER_DISCONNECT: "strangerDisconnected",
    CONNECTION_DIED: "connectionDied",
    RECAPTCHA_REQUIRED: "recaptchaRequired",
    ERROR: "error",
    //Custom Events
    LISTENING_ERROR: "client_listeningError",
    CLIENT_DISCONNECT: "client_clientDisconnected"
};

class OmegleClient extends EventListener {
    constructor(name = "Client", randID = OmegleClient.generateID(8)) {
        super();
        this.name = name;
        this.randID = randID;
        this.clientID = null;
        this.isConnected = false;
        this.isWaiting = false;

        this.addEventListener(Event.STRANGER_DISCONNECT, e => {
            this.clientID = null;
            this.isConnected = false;
        });

        this.addEventListener(Event.CONNECTED, e => {
            this.isConnected = true;
        });

        this.addEventListener(Event.RECAPTCHA_REQUIRED, async e => {
            Out.warn("Recaptcha!");
            /*let driver = await new Builder().forBrowser("chrome").build();
            try {
                await driver.get("https://www.omegle.com/");
                await driver.findElement(By.id("textbtn")).click();
                //await driver.click(driver.findElement(By.id("textbtn")));
                await driver.wait(until.elementLocated(By.className("rc-anchor-content")), 4000);
                await driver.findElement(By.className("rc-anchor-content")).click();
                await driver.executeScript("document.getElementById('u_0_a').click()");
            } finally {
                await driver.quit();
            }*/
        });
    }
    reset() {
        this.name = undefined;
        this.clientID = null;
        this.isConnected = false;
        this.customData = {};
    }
    send(message) {
        if(!this.isConnected) return;

        message = message.replace(/([^\\]|^)§[0-9a-fk-r]/gm, (match, group) => {
            return group;
        });

        fetch("https://front14.omegle.com/send", this.getOptions("text", `msg=${encodeURIComponent(message)}&id=${encodeURIComponent(this.clientID)}`)).then(res => res.text()).then(text => {
            //console.log(text);
            if(text != "win") Out.error(`${this.name}: Failed to send message `, text);
        }).catch(e => {
            Out.error("Send", this.name, e.message);
            this.send(message);
        });
    }
    connect(settings = { lang: "sk" }) {
        this.settings = settings;
        this.isWaiting = true;
        var str = "";
        for(var name in settings) str += `&${name}=${settings[name]}`;

        //console.log("Strating");
        fetch(`https://front14.omegle.com/start?caps=recaptcha2&firstevents=1&spid=&randid=${this.randID}${str}`, this.getOptions("json", "")).then(res => res.json()).then(json => {
            //console.log(json);
            //console.log("Connected");

            if(!Object.keys(json).length) {
                this.isWaiting = false;
                Out.error("Connect", this.name, "(Server returned empty Object)", json);
                return false;
            }

            this.clientID = json.clientID;
            this.isWaiting = false;
            this.fireEvents(json.events);
            this.eventsFetch();

            /*this.eventsFetch(data => {
                if(!data) Out.warn(this.name, "Invalid data:", data);
                else this.fireEvents(data);
            });*/
        }).catch(e => {
            this.isWaiting = false;
            Out.error("Connect", this.name, e);
            setTimeout(() => {
                this.connect(this.settings);
            }, 2000);
        });
    }
    disconnect() {
        fetch("https://front14.omegle.com/disconnect", this.getOptions("text", `id=${encodeURIComponent(this.clientID)}`)).then(res => res.text()).then(text => {
            return true;
        }).catch(e => Out.error("Disconnect", this.name, e));

        //this.reset();
        this.dispatchEvent(Event.CLIENT_DISCONNECT);
    }


    getOptions(type, body) {
        return {
            //"agent": new HttpsProxyAgent('http://165.22.41.190:80'),
            "credentials": "omit",
            "headers": {
                "accept": type == "text" ? "text/javascript, text/html, application/xml, text/xml, */*" : (type == "json" ? "application/json" : type),
                "accept-language": "sk-SK,sk;q=0.9,cs;q=0.8,en-US;q=0.7,en;q=0.6",
                "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
                "sec-fetch-mode": "cors",
                "sec-fetch-site": "same-site"
            },
            "referrer": "https://www.omegle.com/",
            "referrerPolicy": "no-referrer-when-downgrade",
            "body": body,
            "method": "POST",
            "mode": "cors"
        }
    }
    static generateID(length) {
        var str = "";
        var chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
        for(var i = 0; i < length; i++) str += chars.charAt(~~(Math.random() * chars.length));
        return str;
    }
    fireEvents(events) {
        if(!events) return;
        try {
            for(var event of events) {
                var name = event.shift();
                var content = { data: event.length == 1 ? event[0] : (!event.length ? null : event) };
                this.dispatchEvent(name, content);
            }
        } catch(e) { Out.error("Catched", "Events", this.name, events, e) }
    }
    eventsFetch() {
        /*if(this.settings.topics) 
        console.log(`${this.name} Fetching events`);*/
        fetch("https://front14.omegle.com/events", this.getOptions("json", `id=${encodeURIComponent(this.clientID)}`)).then(res => res.json()).then(json => {
            //console.log(json);

            /*callback(json);*/

            if(!json) Out.warn(this.name, "Invalid data:", json, this.isConnected, this.isWaiting);
            else this.fireEvents(json);

            if((json != null && this.isConnected) || (json instanceof Array && !json.length)) this.eventsFetch();
        }).catch(e => {
            if(this.isConnected) {
                this.eventsFetch();
                return //Out.warn("Events", "Retried", this.name, e);
            }
            this.dispatchEvent(Event.LISTENING_ERROR, { data: e });
            //this.reset();
            Out.error("Events", this.name, e);
        });
    }
}
for(var name in Event) OmegleClient[name] = Event[name];

module.exports = OmegleClient;