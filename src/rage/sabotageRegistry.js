class SabotageRegistry {

    constructor() {

        this.sabotages = new Map();
    }


    // ========================================
    // REGISTER
    // ========================================

    register(sabotage) {

        if (!sabotage || !sabotage.id) {

            console.error(
                "Cannot register invalid sabotage."
            );

            return;
        }


        if (this.sabotages.has(sabotage.id)) {

            console.warn(
                `Sabotage already registered: ${sabotage.id}`
            );

            return;
        }


        this.sabotages.set(
            sabotage.id,
            sabotage
        );


        console.log(
            `😈 Registered sabotage: ${sabotage.id}`
        );
    }


    // ========================================
    // GET
    // ========================================

    get(id) {

        return this.sabotages.get(id);
    }


    // ========================================
    // GET ALL
    // ========================================

    getAll() {

        return Array.from(
            this.sabotages.values()
        );
    }
}


const sabotageRegistry =
    new SabotageRegistry();


export default sabotageRegistry;