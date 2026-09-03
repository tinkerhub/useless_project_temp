/**
 * RagebaitOS Event Bus
 *
 * Allows different parts of the operating system
 * to communicate without directly depending on each other.
 */

class EventBus {

    constructor() {
        this.events = {};
    }


    /**
     * Listen for an event.
     */
    on(eventName, callback) {

        if (!this.events[eventName]) {
            this.events[eventName] = [];
        }

        this.events[eventName].push(callback);
    }


    /**
     * Stop listening for an event.
     */
    off(eventName, callback) {

        if (!this.events[eventName]) {
            return;
        }

        this.events[eventName] =
            this.events[eventName].filter(
                listener => listener !== callback
            );
    }


    /**
     * Send an event.
     */
    emit(eventName, data = {}) {

        if (!this.events[eventName]) {
            return;
        }

        this.events[eventName].forEach(callback => {
            callback(data);
        });
    }
}


// Create one shared Event Bus
const eventBus = new EventBus();

export default eventBus;