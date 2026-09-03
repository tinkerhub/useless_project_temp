const clickDrift = {

    id: "click-drift",

    offsetX: 0,

    offsetY: 0,


    // ========================================
    // TRIGGER
    // ========================================

    trigger(data) {

        const driftAmount =
            15;


        this.offsetX +=
            (Math.random() * 2 - 1) *
            driftAmount;

        this.offsetY +=
            (Math.random() * 2 - 1) *
            driftAmount;


        /*
         * Prevent the fake cursor
         * from drifting too far away.
         */

        this.offsetX =
            Math.max(
                -50,
                Math.min(
                    50,
                    this.offsetX
                )
            );

        this.offsetY =
            Math.max(
                -50,
                Math.min(
                    50,
                    this.offsetY
                )
            );


        this.apply();
    },


    // ========================================
    // APPLY DRIFT
    // ========================================

    apply() {

        document.documentElement.style.setProperty(
            "--rage-cursor-offset-x",
            `${this.offsetX}px`
        );

        document.documentElement.style.setProperty(
            "--rage-cursor-offset-y",
            `${this.offsetY}px`
        );
    }
};


export default clickDrift;