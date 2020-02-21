const fs = require("fs");

class Auth {
    static reload() {

    }
    static register(account) {
        if(this.getAccount(account.name)) return false;

        let data = JSON.parse(fs.readFileSync("auth.json"));
        data.push(account);
        fs.writeFileSync("auth.json", JSON.stringify(data));

        return account;
    }
    static login(name, pass) {
        let account = this.getAccount(name);

        if(!account) return null;

        if(account.password == pass) return account;
        else return false;
    }
    static getAccount(name) {
        let data = JSON.parse(fs.readFileSync("auth.json"));

        for(var account of data) {
            if(account.name == name) return account;
        }

        return false;
    }
    static getAllAccounts() {
        return JSON.parse(fs.readFileSync("auth.json"));
    }
    static updateAccount(name, account) {
        if(!this.getAccount(name)) return false;

        let data = JSON.parse(fs.readFileSync("auth.json"));

        for(let i = 0; i < data.length; i++) {
            if(!account) data.splice(i, 1);
            else if(data[i].name == name) data[i] = account;
        }

        fs.writeFileSync("auth.json", JSON.stringify(data));

        return account == false ? true : account;
    }
    static hasPermission(account, permission) {
        let perms = account.permissions;
        let path = permission.split(".");
        let len = path.length;

        if(perms.indexOf(permission) > -1) return true;

        for(var i = 0; i < len + 1; i++) {
            //console.log(path, path.join("."), perms.indexOf(path.join(".")));
            if(perms.indexOf(path.join(".")) > -1) return true;
            if(perms.indexOf([...path, "*"].join(".")) > -1) return true;
            path.pop();
        }

        return false;
    }
}

module.exports = Auth;