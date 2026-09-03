import eventBus from "./eventBus.js";


class WindowManager {

    constructor() {

        // All currently open windows
        this.windows = new Map();

        // Used to make sure the newest window
        // appears above older windows.
        this.zIndex = 100;
    }


    /**
     * Create a new application window.
     */
    createWindow(options) {

        const {
            id,
            title = "Application",
            content = ""
        } = options;


        // Don't create duplicate windows.
        if (this.windows.has(id)) {

            this.focusWindow(id);

            return this.windows.get(id);
        }


        // Create window
        const windowElement =
            document.createElement("div");

        windowElement.classList.add("os-window");

        windowElement.dataset.windowId = id;


        // Window HTML
        windowElement.innerHTML = `

            <div class="window-header">

                <span class="window-title">
                    ${title}
                </span>

                <div class="window-controls">

                    <button
                        class="window-minimize"
                        title="Minimize"
                    >
                        −
                    </button>

                    <button
                        class="window-maximize"
                        title="Maximize"
                    >
                        □
                    </button>

                    <button
                        class="window-close"
                        title="Close"
                    >
                        ×
                    </button>

                </div>

            </div>


            <div class="window-content">
                ${content}
            </div>

        `;


        // Add to desktop
        const desktop =
            document.getElementById("desktop");

        desktop.appendChild(windowElement);


        // Position window
        const offset =
            this.windows.size * 30;

        windowElement.style.left =
            `${100 + offset}px`;

        windowElement.style.top =
            `${80 + offset}px`;


        // Store window
        this.windows.set(
            id,
            windowElement
        );


        // Bring to front
        this.focusWindow(id);


        // Setup controls
        this.setupWindowControls(
            id,
            windowElement
        );


        // Allow dragging
        this.enableDragging(
            id,
            windowElement
        );


        eventBus.emit(
            "WINDOW_CREATED",
            {
                windowId: id
            }
        );


        return windowElement;
    }


    /**
     * Setup minimize, maximize and close buttons.
     */
    setupWindowControls(
        id,
        windowElement
    ) {

        const minimize =
            windowElement.querySelector(
                ".window-minimize"
            );

        const maximize =
            windowElement.querySelector(
                ".window-maximize"
            );

        const close =
            windowElement.querySelector(
                ".window-close"
            );


        minimize.addEventListener(
            "click",
            (event) => {

                event.stopPropagation();

                this.minimizeWindow(id);

            }
        );


        maximize.addEventListener(
            "click",
            (event) => {

                event.stopPropagation();

                this.maximizeWindow(id);

            }
        );


        close.addEventListener(
            "click",
            (event) => {

                event.stopPropagation();

                this.closeWindow(id);

            }
        );


        windowElement.addEventListener(
            "mousedown",
            () => {

                this.focusWindow(id);

            }
        );
    }


    /**
     * Focus a window.
     */
    focusWindow(id) {

        const windowElement =
            this.windows.get(id);

        if (!windowElement) {
            return;
        }


        this.zIndex++;

        windowElement.style.zIndex =
            this.zIndex;
    }


    // ========================================
    // MINIMIZE
    // ========================================

    minimizeWindow(id) {

        const windowElement =
            this.windows.get(id);


        if (!windowElement) {
            return;
        }


        windowElement.classList.add(
            "window-minimized"
        );


        eventBus.emit(
            "WINDOW_MINIMIZED",
            {
                windowId: id
            }
        );
    }

    // ========================================
    // RESTORE
    // ========================================

    restoreWindow(id) {

        const windowElement =
            this.windows.get(id);


        if (!windowElement) {
            return;
        }


        windowElement.classList.remove(
            "window-minimized"
        );


        eventBus.emit(
            "WINDOW_RESTORED",
            {
                windowId: id
            }
        );
    }

    // ========================================
    // WINDOW STATE
    // ========================================

    isWindowMinimized(id) {

        const windowElement =
            this.windows.get(id);


        if (!windowElement) {
            return false;
        }


        return windowElement.classList.contains(
            "window-minimized"
        );
    }


    hasWindow(id) {

        return this.windows.has(id);
    }

    // ========================================
    // CHECK MINIMIZED
    // ========================================

    isWindowMinimized(id) {

        const windowElement =
            this.windows.get(id);


        if (!windowElement) {
            return false;
        }


        return windowElement.classList.contains(
            "window-minimized"
        );
    }

    /**
     * Maximize a window.
     */
    maximizeWindow(id) {

        const windowElement =
            this.windows.get(id);


        if (!windowElement) {
            return;
        }


        eventBus.emit(
            "WINDOW_MAXIMIZE_REQUEST",
            {
                windowId: id
            }
        );
    }

    toggleMaximize(id) {

        const windowElement =
            this.windows.get(id);

        if (!windowElement) {
            return;
        }

        windowElement.classList.toggle(
            "window-maximized"
        );
    }


    // ========================================
    // CLOSE
    // ========================================

    closeWindow(id) {

        const windowElement =
            this.windows.get(id);


        if (!windowElement) {
            return;
        }


        /*
        * Remove the physical window.
        */
        windowElement.remove();


        /*
        * Remove it from WindowManager's registry.
        */
        this.windows.delete(id);


        /*
        * Notify the rest of the OS.
        */
        eventBus.emit(
            "WINDOW_CLOSED",
            {
                windowId: id
            }
        );
    }


    /**
     * Make a window draggable.
     */
    enableDragging(
        id,
        windowElement
    ) {

        const header =
            windowElement.querySelector(
                ".window-header"
            );


        let isDragging = false;

        let offsetX = 0;
        let offsetY = 0;


        header.addEventListener(
            "mousedown",
            (event) => {

                /*
                 * Don't drag when clicking
                 * window control buttons.
                 */
                if (
                    event.target.closest(
                        ".window-controls"
                    )
                ) {
                    return;
                }


                isDragging = true;


                const rect =
                    windowElement.getBoundingClientRect();


                offsetX =
                    event.clientX - rect.left;

                offsetY =
                    event.clientY - rect.top;


                this.focusWindow(id);
            }
        );


        document.addEventListener(
            "mousemove",
            (event) => {

                if (!isDragging) {
                    return;
                }


                windowElement.style.left =
                    `${event.clientX - offsetX}px`;

                windowElement.style.top =
                    `${event.clientY - offsetY}px`;
            }
        );


        document.addEventListener(
            "mouseup",
            () => {

                isDragging = false;

            }
        );
    }
}



const windowManager =
    new WindowManager();


export default windowManager;

