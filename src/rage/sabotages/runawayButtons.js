const runawayButtons = {

    id: "runaway-buttons",


    initialize() {

        document.addEventListener(
            "mouseover",
            (event) => {

                const target =
                    event.target.closest(
                        "[data-rage-target='runaway']"
                    );


                if (!target) {

                    return;
                }


                if (
                    Math.random() > 0.45
                ) {

                    return;
                }


                this.moveAway(
                    target,
                    event.clientX,
                    event.clientY
                );
            }
        );
    },


    trigger(data) {

        const target =
            data.target;


        if (!target) {

            return;
        }


        this.moveAway(
            target,
            data.x,
            data.y
        );
    },


    moveAway(
        element,
        mouseX,
        mouseY
    ) {

        /*
         * Make sure the element can move.
         */
        if (
            getComputedStyle(element)
                .position === "static"
        ) {

            element.style.position =
                "relative";
        }


        const rect =
            element.getBoundingClientRect();


        const centerX =
            rect.left +
            rect.width / 2;


        const centerY =
            rect.top +
            rect.height / 2;


        const directionX =
            centerX - mouseX;


        const directionY =
            centerY - mouseY;


        const length =
            Math.sqrt(
                directionX * directionX +
                directionY * directionY
            ) || 1;


        const moveDistance =
            40;


        const moveX =
            (
                directionX /
                length
            ) *
            moveDistance;


        const moveY =
            (
                directionY /
                length
            ) *
            moveDistance;


        element.style.transform =
            `translate(${moveX}px, ${moveY}px)`;
    }
};


export default runawayButtons;