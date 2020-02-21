class EventListener {
    constructor() {
        this.listeners = [];
        this.on = this.addEventListener;
    }
    addEventListener(event, callback) {
        var listener = { event, callback };
        this.listeners.push(listener);
        return listener;
    }
    dispatchEvent(type, data, callback) {
        var eventObject = {
            type: type,
            time: new Date().getTime(),
            defaultPreventable: !!callback,
            defaultPrevented: false,
            hasListener: false,
            preventDefault: function() {
                if(this.defaultPreventable) this.defaultPrevented = true;
                else throw new Error("Event " + this.type + " is not default preventable!");
            }
        };
        var returnedData = [];
        for(var key in data) {
            eventObject[key] = data[key];
        }
        for(var elm of this.listeners) {
            if(elm.event != type) continue;
            eventObject.hasListener = true;
            returnedData.push(elm.callback(eventObject));
        }
        if(!eventObject.defaultPrevented && callback) callback(returnedData.length == 1 ? returnedData[0] : returnedData);
    }
    removeEventListener(listener) {
        for(var elm of this.listeners) {
            if(elm != listener) continue;
            this.listeners.splice(this.listeners.indexOf(listener), 1);
            return true;
        }
        return false;
    }
}

module.exports = EventListener;