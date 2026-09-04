/* =========================================
   BACKGROUND MUSIC
========================================= */

const backgroundMusic =
    document.getElementById("backgroundMusic");

backgroundMusic.volume = 0.4;


/* Start music on FIRST interaction anywhere */

function startBackgroundMusic() {

    backgroundMusic.play()
        .then(function () {

            console.log("Background music started");

        })
        .catch(function (error) {

            console.log(
                "Music could not start:",
                error
            );

        });


    /* Remove listeners after music starts */

    document.removeEventListener(
        "click",
        startBackgroundMusic
    );

    document.removeEventListener(
        "touchstart",
        startBackgroundMusic
    );

    document.removeEventListener(
        "keydown",
        startBackgroundMusic
    );

}


/* Listen for first user interaction */

document.addEventListener(
    "click",
    startBackgroundMusic
);

document.addEventListener(
    "touchstart",
    startBackgroundMusic
);

document.addEventListener(
    "keydown",
    startBackgroundMusic
);
/* =========================================
   CLOCK
========================================= */

function updateClock() {

    const clock = document.getElementById("clock");

    const now = new Date();

    let hours = now.getHours();
    const minutes = String(now.getMinutes()).padStart(2, "0");

    const period = hours >= 12 ? "PM" : "AM";

    hours = hours % 12;

    if (hours === 0) {
        hours = 12;
    }

    clock.textContent = `${hours}:${minutes} ${period}`;
}

updateClock();

setInterval(updateClock, 1000);


/* =========================================
   START BUTTON
========================================= */

const startBtn = document.getElementById("startBtn");

const popupOverlay = document.getElementById("popupOverlay");

const popupClose = document.getElementById("popupClose");

const beginBtn = document.getElementById("beginBtn");


startBtn.addEventListener("click", function () {

    popupOverlay.classList.add("show");

});


/* =========================================
   CLOSE POPUP
========================================= */

popupClose.addEventListener("click", function () {

    popupOverlay.classList.remove("show");

});


/* =========================================
   BEGIN TEST
========================================= */

beginBtn.addEventListener("click", function () {

    alert(
        "Mallu Level Calculator coming next! 😂\n\n" +
        "Get ready to prove your Mallu-ness."
    );

});


/* =========================================
   CLOSE WINDOWS
========================================= */

const closeButtons = document.querySelectorAll(".close-btn");

closeButtons.forEach(function (button) {

    button.addEventListener("click", function () {

        const windowElement =
            button.closest(
                ".small-window, .message-window, .status-window"
            );

        if (windowElement) {

            windowElement.style.display = "none";

        }

    });

});


/* =========================================
   MAIN WINDOW CLOSE
========================================= */

const mainClose =
    document.querySelector(".main-close");

mainClose.addEventListener("click", function () {

    const mainWindow =
        document.querySelector(".main-window");

    mainWindow.style.display = "none";

});


/* =========================================
   OK BUTTON
========================================= */

const okButton =
    document.querySelector(".ok-btn");

okButton.addEventListener("click", function () {

    alert("Sheri da 👍");

});


/* =========================================
   START MENU
========================================= */

const startMenu =
    document.querySelector(".start-menu");

startMenu.addEventListener("click", function () {

    popupOverlay.classList.add("show");

});


/* =========================================
   CLICK OUTSIDE POPUP TO CLOSE
========================================= */

popupOverlay.addEventListener("click", function (event) {

    if (event.target === popupOverlay) {

        popupOverlay.classList.remove("show");

    }

});


/* =========================================
   TASKBAR ICONS
========================================= */

const taskIcons =
    document.querySelectorAll(".task-icon");

taskIcons.forEach(function (icon) {

    icon.addEventListener("click", function () {

        alert("Ithu oru decorative icon aanu 😭");

    });

});


/* =========================================
   DESKTOP ICONS
========================================= */

const desktopIcons =
    document.querySelectorAll(".desktop-icon");

desktopIcons.forEach(function (icon) {

    icon.addEventListener("click", function () {

        const name =
            icon.querySelector("span").textContent;

        alert(`${name} clicked!`);

    });

});

