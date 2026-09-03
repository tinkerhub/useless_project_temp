/**
 * Stores the current state of the RagebaitOS rage system.
 */

class RageState {

    constructor() {

        // Current rage level
        this.rage = 0;

        // Total number of rage events
        this.rageEvents = 0;
    }


    /**
     * Add rage.
     */
    addRage(amount) {

        this.rage += amount;

        // Prevent rage from going above 100
        if (this.rage > 100) {
            this.rage = 100;
        }

        this.rageEvents++;

        console.log(
            `🔥 Rage increased by ${amount}. Current rage: ${this.rage}`
        );
    }


    /**
     * Get current rage.
     */
    getRage() {
        return this.rage;
    }


    /**
     * Get number of rage events.
     */
    getRageEvents() {
        return this.rageEvents;
    }
}


const rageState = new RageState();

export default rageState;