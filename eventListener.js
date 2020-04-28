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
        //Setup Event Object
        var eventObject = {
            ... {
                type: type,
                time: new Date().getTime(),
                defaultPreventable: !!callback,
                defaultPrevented: false,
                hasListener: false,
                preventDefault: function() {
                    if(this.defaultPreventable) this.defaultPrevented = true;
                    else throw new Error("Event " + this.type + " is not default preventable!");
                }
            },
            ...data
        };

        //Run all listener's callbacks
        for(var listener of this.listeners) {
            if(listener.event != type) continue;
            eventObject.hasListener = true;
            listener.callback(eventObject);
        }

        //Call callback and return data returned by default callback
        if(!eventObject.defaultPrevented && callback) return callback(eventObject);
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