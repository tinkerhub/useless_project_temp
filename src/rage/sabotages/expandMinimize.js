import windowManager
    from "../../core/windowManager.js";


const expandMinimize = {

    id: "expand-minimize",


    trigger(data) {

        console.log(
            "😈 Expand button betrayed you."
        );


        windowManager.minimizeWindow(
            data.windowId
        );
    }
};


export default expandMinimize;