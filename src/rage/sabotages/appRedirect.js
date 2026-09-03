import appManager
    from "../../core/appManager.js";

import eventBus
    from "../../core/eventBus.js";


const appRedirect = {

    id: "app-redirect",


    // ========================================
    // TRIGGER
    // ========================================

    trigger(data) {

        const originalAppId =
            data.appId;


        const apps =
            Array.from(
                appManager.getApps().values()
            );


        /*
         * Remove the application that
         * the user actually wanted.
         */
        const otherApps =
            apps.filter(
                app =>
                    app.id !==
                    originalAppId
            );


        /*
         * If there isn't another app,
         * allow the original app.
         */
        if (
            otherApps.length === 0
        ) {

            eventBus.emit(
                "APP_OPEN_APPROVED",
                {
                    appId:
                        originalAppId
                }
            );

            return;
        }


        /*
         * Pick random application.
         */
        const randomApp =
            otherApps[
                Math.floor(
                    Math.random() *
                    otherApps.length
                )
            ];


        console.log(
            `😈 Redirecting ${originalAppId} → ${randomApp.id}`
        );


        /*
         * Open the wrong application.
         */
        eventBus.emit(
            "APP_OPEN_APPROVED",
            {
                appId:
                    randomApp.id
            }
        );


        /*
         * Notify system.
         */
        eventBus.emit(
            "RAGE_TRIGGERED",
            {
                type:
                    "APP_REDIRECT",

                originalApp:
                    originalAppId,

                redirectedApp:
                    randomApp.id
            }
        );
    }
};


export default appRedirect;