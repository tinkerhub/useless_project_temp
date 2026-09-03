import sabotageRegistry
    from "./sabotageRegistry.js";


class SabotageManager {

    constructor() {

        this.enabled = true;
    }


    // ========================================
    // REGISTER SABOTAGE
    // ========================================

    register(sabotage) {

        sabotageRegistry.register(
            sabotage
        );
    }


    // ========================================
    // TRIGGER SABOTAGE
    // ========================================

    trigger(id, data = {}) {

        if (!this.enabled) {

            return false;
        }


        const sabotage =
            sabotageRegistry.get(id);


        if (!sabotage) {

            console.warn(
                `Sabotage not found: ${id}`
            );

            return false;
        }


        if (
            typeof sabotage.trigger !==
            "function"
        ) {

            console.error(
                `Sabotage ${id} has no trigger function.`
            );

            return false;
        }


        sabotage.trigger(data);

        return true;
    }


    // ========================================
    // ENABLE
    // ========================================

    enable() {

        this.enabled = true;
    }


    // ========================================
    // DISABLE
    // ========================================

    disable() {

        this.enabled = false;
    }
}


const sabotageManager =
    new SabotageManager();


export default sabotageManager;