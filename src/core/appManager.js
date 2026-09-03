import eventBus from "./eventBus.js";
import windowManager from "./windowManager.js";


class AppManager {

    constructor() {

        // ========================================
        // APPLICATION REGISTRY
        // ========================================

        this.apps = new Map();


        // ========================================
        // RUNNING APPLICATIONS
        // ========================================

        this.runningApps = new Set();


        this.initialize();
    }


    // ========================================
    // INITIALIZE
    // ========================================

    initialize() {

        /*
         * Rage Engine approved an application.
         */
        eventBus.on(
            "APP_OPEN_APPROVED",
            (data) => {

                this.launchApp(
                    data.appId
                );
            }
        );


        /*
         * WindowManager tells us that
         * an application window was closed.
         */
        eventBus.on(
            "WINDOW_CLOSED",
            (data) => {

                const appId =
                    data.windowId;


                /*
                 * Remove application from
                 * running applications.
                 */
                this.runningApps.delete(
                    appId
                );


                /*
                 * Tell the rest of the OS.
                 */
                eventBus.emit(
                    "APP_CLOSED",
                    {
                        appId: appId
                    }
                );
            }
        );
    }


    // ========================================
    // REGISTER APP
    // ========================================

    registerApp(app) {

        if (!app || !app.id) {

            console.error(
                "Cannot register invalid application."
            );

            return;
        }


        if (this.apps.has(app.id)) {

            console.warn(
                `Application already registered: ${app.id}`
            );

            return;
        }


        this.apps.set(
            app.id,
            app
        );


        console.log(
            `Registered app: ${app.id}`
        );


        /*
         * Tell other systems that a new
         * application is available.
         */
        eventBus.emit(
            "APP_REGISTERED",
            {
                app: app
            }
        );
    }


    // ========================================
    // OPEN APP
    // ========================================

    openApp(appId) {

        const app =
            this.apps.get(appId);


        if (!app) {

            console.error(
                `App not found: ${appId}`
            );

            return;
        }


        /*
         * If already running,
         * restore and focus it.
         */
        if (
            this.runningApps.has(appId)
        ) {

            windowManager.restoreWindow(
                appId
            );

            windowManager.focusWindow(
                appId
            );

            return;
        }


        /*
         * New application.
         *
         * Ask Rage Engine for permission.
         */
        eventBus.emit(
            "APP_OPEN_REQUEST",
            {
                appId: appId
            }
        );
    }


    // ========================================
    // LAUNCH APP
    // ========================================

    launchApp(appId) {

        const app =
            this.apps.get(appId);


        if (!app) {

            console.error(
                `Cannot launch app: ${appId}`
            );

            return;
        }


        /*
         * Safety check.
         */
        if (
            this.runningApps.has(appId)
        ) {

            windowManager.restoreWindow(
                appId
            );

            windowManager.focusWindow(
                appId
            );

            return;
        }


        /*
         * Create the application's window.
         */
        windowManager.createWindow({

            id: app.id,

            title: app.name,

            content:
                app.render()
        });


        /*
         * Application is now running.
         */
        this.runningApps.add(
            appId
        );


        /*
         * Tell the OS.
         */
        eventBus.emit(
            "APP_OPENED",
            {
                appId: appId
            }
        );
    }


    // ========================================
    // CLOSE APP
    // ========================================

    closeApp(appId) {

        /*
         * AppManager does NOT manually
         * change runningApps here.
         *
         * WindowManager closes the window.
         *
         * WINDOW_CLOSED then comes back here.
         */
        windowManager.closeWindow(
            appId
        );
    }


    // ========================================
    // CHECK RUNNING
    // ========================================

    isRunning(appId) {

        return this.runningApps.has(
            appId
        );
    }


    // ========================================
    // GET APPS
    // ========================================

    getApps() {

        return this.apps;
    }
}


const appManager =
    new AppManager();


export default appManager;