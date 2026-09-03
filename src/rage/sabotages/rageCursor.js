import eventBus
    from "../../core/eventBus.js";


class RageCursor {

    constructor() {

        this.element = null;

        this.x = 0;
        this.y = 0;

        this.initialize();
    }


    // ========================================
    // INITIALIZE
    // ========================================

    initialize() {

        this.createCursor();

        eventBus.on(
            "POINTER_MOVE",
            (data) => {

                this.updatePosition(
                    data.x,
                    data.y
                );
            }
        );
    }


    // ========================================
    // CREATE CURSOR
    // ========================================

    createCursor() {

        this.element =
            document.createElement(
                "div"
            );

        this.element.id =
            "rage-cursor";

        this.element.innerHTML =
            "➤";

        document.body.appendChild(
            this.element
        );
    }


    // ========================================
    // UPDATE POSITION
    // ========================================

    updatePosition(x, y) {

        this.x = x;
        this.y = y;

        this.update();
    }


    // ========================================
    // UPDATE VISUAL CURSOR
    // ========================================

    update() {

        if (!this.element) {
            return;
        }

        this.element.style.left =
            `${this.x}px`;

        this.element.style.top =
            `${this.y}px`;
    }
}


const rageCursor =
    new RageCursor();


export default rageCursor;