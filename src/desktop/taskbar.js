import appManager from "../core/appManager.js";
import eventBus from "../core/eventBus.js";


class Taskbar {

    constructor() {

        // ========================================
        // TASKBAR CONTAINER
        // ========================================

        this.container =
            document.getElementById(
                "taskbar-apps"
            );


        // Store buttons by app ID
        this.buttons = new Map();


        this.initialize();
    }


    // ========================================
    // INITIALIZE
    // ========================================

    initialize() {

        /*
         * Listen for newly registered apps.
         *
         * When an app is registered,
         * automatically create its taskbar button.
         */
        eventBus.on(
            "APP_REGISTERED",
            (data) => {

                this.addAppButton(
                    data.app
                );
            }
        );


        /*
         * Application opened.
         */
        eventBus.on(
            "APP_OPENED",
            (data) => {

                this.updateButtonState(
                    data.appId,
                    true
                );
            }
        );


        /*
         * Application closed.
         */
        eventBus.on(
            "APP_CLOSED",
            (data) => {

                this.updateButtonState(
                    data.appId,
                    false
                );
            }
        );


        /*
         * Application minimized.
         */
        eventBus.on(
            "WINDOW_MINIMIZED",
            (data) => {

                this.updateMinimizedState(
                    data.windowId,
                    true
                );
            }
        );


        /*
         * Application restored.
         */
        eventBus.on(
            "WINDOW_RESTORED",
            (data) => {

                this.updateMinimizedState(
                    data.windowId,
                    false
                );
            }
        );


        /*
         * Apps may already have been registered
         * before Taskbar initialized.
         *
         * Add those apps too.
         */
        appManager
            .getApps()
            .forEach(
                (app) => {

                    this.addAppButton(
                        app
                    );
                }
            );
    }


    // ========================================
    // ADD APP BUTTON
    // ========================================

    addAppButton(app) {

        /*
         * Safety check.
         */
        if (!app || !app.id) {

            return;
        }


        /*
         * Don't create duplicates.
         */
        if (
            this.buttons.has(app.id)
        ) {

            return;
        }


        /*
         * Create button.
         */
        const button =
            document.createElement(
                "button"
            );


        button.classList.add(
            "taskbar-app"
        );


        /*
         * Store app ID.
         */
        button.dataset.app =
            app.id;


        /*
         * Tooltip.
         */
        button.title =
            app.name;


        /*
         * App icon.
         */
        button.innerHTML = `
            <span>
                ${app.icon || "□"}
            </span>
        `;


        // ========================================
        // BUTTON CLICK
        // ========================================

        button.addEventListener(
            "click",
            () => {

                console.log(
                    `Taskbar clicked: ${app.id}`
                );


                appManager.openApp(
                    app.id
                );
            }
        );


        /*
         * Add button to taskbar.
         */
        this.container.appendChild(
            button
        );


        /*
         * Store reference.
         */
        this.buttons.set(
            app.id,
            button
        );
    }


    // ========================================
    // UPDATE RUNNING STATE
    // ========================================

    updateButtonState(
        appId,
        isRunning
    ) {

        const button =
            this.buttons.get(
                appId
            );


        if (!button) {

            return;
        }


        if (isRunning) {

            button.classList.add(
                "app-running"
            );

        } else {

            button.classList.remove(
                "app-running"
            );

            button.classList.remove(
                "app-minimized"
            );
        }
    }


    // ========================================
    // UPDATE MINIMIZED STATE
    // ========================================

    updateMinimizedState(
        appId,
        isMinimized
    ) {

        const button =
            this.buttons.get(
                appId
            );


        if (!button) {

            return;
        }


        if (isMinimized) {

            button.classList.add(
                "app-minimized"
            );

        } else {

            button.classList.remove(
                "app-minimized"
            );
        }
    }
}


// ========================================
// CREATE TASKBAR
// ========================================

const taskbar =
    new Taskbar();


export default taskbar;