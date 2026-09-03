const cursorDistortion = {

    id: "cursor-distortion",

    x: 0,

    y: 0,


    // ========================================
    // TRIGGER
    // ========================================

    trigger(data) {

        const distortionAmount =
            8;


        this.x +=
            (Math.random() * 2 - 1) *
            distortionAmount;

        this.y +=
            (Math.random() * 2 - 1) *
            distortionAmount;


        /*
         * Keep distortion under control.
         */

        this.x =
            Math.max(
                -30,
                Math.min(
                    30,
                    this.x
                )
            );

        this.y =
            Math.max(
                -30,
                Math.min(
                    30,
                    this.y
                )
            );


        this.apply();
    },


    // ========================================
    // APPLY DISTORTION
    // ========================================

    apply() {

        document.documentElement.style.setProperty(
            "--rage-cursor-distortion-x",
            `${this.x}px`
        );

        document.documentElement.style.setProperty(
            "--rage-cursor-distortion-y",
            `${this.y}px`
        );
    }
};


export default cursorDistortion;