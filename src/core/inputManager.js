import eventBus from "./eventBus.js";


class InputManager {

    constructor() {

        this.initialize();
    }


    // ========================================
    // INITIALIZE
    // ========================================

    initialize() {

        this.setupMouseInput();

        this.setupKeyboardInput();
    }


    // ========================================
    // MOUSE
    // ========================================

    setupMouseInput() {

        document.addEventListener(
            "click",
            (event) => {

                eventBus.emit(
                    "UI_CLICK",
                    {
                        target: event.target,
                        x: event.clientX,
                        y: event.clientY,
                        originalEvent: event
                    }
                );
            }
        );


        document.addEventListener(
            "mousemove",
            (event) => {

                eventBus.emit(
                    "POINTER_MOVE",
                    {
                        x: event.clientX,
                        y: event.clientY,
                        originalEvent: event
                    }
                );
            }
        );
    }


    // ========================================
    // KEYBOARD
    // ========================================

    setupKeyboardInput() {

        document.addEventListener(
            "keydown",
            (event) => {

                eventBus.emit(
                    "KEYBOARD_INPUT",
                    {
                        key: event.key,
                        code: event.code,
                        target: event.target,
                        originalEvent: event
                    }
                );
            }
        );
    }
}


const inputManager =
    new InputManager();


export default inputManager;