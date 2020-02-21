const EventListener = require("./eventListener.js");

class Command extends EventListener {
    constructor(name, ...aliases) {
        super();
        this.name = name;
        this.aliases = aliases;
        Command.commands.push(this);
    }
    static onChat(executor, message) {
        var match = message.match(/^\/(.*?)(?: (.*))?$/);

        if(!match) return false;

        var cmd = match[1].toLowerCase();
        var args = (match[2] || "").split(" ");

        for(var command of Command.commands) {
            if(command.name == cmd || command.aliases.indexOf(cmd) > -1) {
                command.dispatchEvent("execute", { args: args, executor: executor });
                return true;
            }
        }

        return -1;
    }
}
Command.commands = [];

module.exports = Command;