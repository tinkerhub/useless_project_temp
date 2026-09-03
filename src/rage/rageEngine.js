import eventBus from "../core/eventBus.js";
import windowManager
    from "../core/windowManager.js";

import rageState from "./rageState.js";

import sabotageManager
    from "./sabotageManager.js";

import appRedirect
    from "./sabotages/appRedirect.js";

import keyboardCorruption
    from "./sabotages/keyboardCorruption.js";

import wordReverse
    from "./sabotages/wordReverse.js";

import expandMinimize
    from "./sabotages/expandMinimize.js";

import clickDrift
    from "./sabotages/clickDrift.js";

import cursorDistortion
    from "./sabotages/cursorDistortion.js";

import runawayButtons
    from "./sabotages/runawayButtons.js";

class RageEngine {

    constructor() {

        this.enabled = true;

        this.sabotageChance = 1.0;

        this.registerSabotages();

        this.initialize();
    }


    // ========================================
    // REGISTER SABOTAGES
    // ========================================

    registerSabotages() {

        sabotageManager.register(
            appRedirect
        );

        sabotageManager.register(
            keyboardCorruption
        );

        sabotageManager.register(
            wordReverse
        );
        sabotageManager.register(
            expandMinimize
        );
        sabotageManager.register(
            clickDrift
        );

        sabotageManager.register(
            cursorDistortion
        );

        sabotageManager.register(
            runawayButtons
        );


        /*
        * Runaway buttons need a persistent
        * mouseover listener.
        */
        runawayButtons.initialize();
    }


    // ========================================
    // INITIALIZE
    // ========================================

    initialize() {

        /*
         * Application opening.
         */

        eventBus.on(
            "APP_OPEN_REQUEST",
            (data) => {

                this.handleAppOpen(
                    data
                );
            }
        );


        /*
         * Generic UI click.
         */

        eventBus.on(
            "UI_CLICK",
            (data) => {

                this.handleUIClick(
                    data
                );
            }
        );


        /*
         * Keyboard input.
         */

        eventBus.on(
            "KEYBOARD_INPUT",
            (data) => {

                this.handleKeyboardInput(
                    data
                );
            }
        );


        /*
         * Window maximize request.
         */

        eventBus.on(
            "WINDOW_MAXIMIZE_REQUEST",
            (data) => {

                this.handleMaximize(
                    data
                );
            }
        );
        /*
        * Normal maximize approved.
        */

        eventBus.on(
            "WINDOW_MAXIMIZE_APPROVED",
            (data) => {

                this.approveMaximize(
                    data
                );
            }
        );
        eventBus.on(
            "POINTER_MOVE",
            (data) => {

                this.handlePointerMove(
                    data
                );
            }
        );
    }

    

    // ========================================
    // SHOULD SABOTAGE?
    // ========================================

    shouldSabotage() {

        if (!this.enabled) {

            return false;
        }


        return (
            Math.random() <
            this.sabotageChance
        );
    }


    // ========================================
    // APP OPEN
    // ========================================

    handleAppOpen(data) {

        const appId =
            data.appId;


        /*
         * No sabotage.
         */

        if (
            !this.shouldSabotage()
        ) {

            eventBus.emit(
                "APP_OPEN_APPROVED",
                {
                    appId: appId
                }
            );

            return;
        }


        /*
         * Rage happened.
         */

        rageState.addRage(5);


        console.log(
            `😈 Rage triggered while opening: ${appId}`
        );


        /*
         * Ask App Redirect sabotage
         * to handle the event.
         */

        const triggered =
            sabotageManager.trigger(
                "app-redirect",
                {
                    appId: appId
                }
            );


        /*
         * If sabotage handled the event,
         * don't open the original app.
         */

        if (triggered) {

            return;
        }


        /*
         * Fallback.
         */

        eventBus.emit(
            "APP_OPEN_APPROVED",
            {
                appId: appId
            }
        );
    }


    // ========================================
    // UI CLICK
    // ========================================

    handleUIClick(data) {

        if (
            !this.shouldSabotage()
        ) {

            return;
        }


        rageState.addRage(1);


        sabotageManager.trigger(
            "click-drift",
            data
        );
    }


    // ========================================
    // KEYBOARD INPUT
    // ========================================

    handleKeyboardInput(data) {

        /*
         * Word reversal gets its own chance.
         */

        if (
            this.shouldSabotage()
        ) {

            rageState.addRage(1);

            sabotageManager.trigger(
                "word-reverse",
                data
            );
        }


        /*
         * Keyboard corruption gets
         * an independent chance.
         */

        if (
            this.shouldSabotage()
        ) {

            rageState.addRage(1);

            sabotageManager.trigger(
                "keyboard-corruption",
                data
            );
        }
    }


    // ========================================
    // MAXIMIZE
    // ========================================

    handleMaximize(data) {

        if (
            !this.shouldSabotage()
        ) {

            eventBus.emit(
                "WINDOW_MAXIMIZE_APPROVED",
                data
            );

            return;
        }


        rageState.addRage(3);


        sabotageManager.trigger(
            "expand-minimize",
            data
        );
    }
    approveMaximize(data) {

        windowManager.toggleMaximize(
            data.windowId
        );
    }
    handlePointerMove(data) {

        if (
            !this.shouldSabotage()
        ) {

            return;
        }


        rageState.addRage(1);


        sabotageManager.trigger(
            "cursor-distortion",
            data
        );
    }
}


// ========================================
// CREATE ENGINE
// ========================================

const rageEngine =
    new RageEngine();


export default rageEngine;