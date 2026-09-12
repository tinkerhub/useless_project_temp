const API_URL = "http://127.0.0.1:8000";


// PAGES

const landing = document.getElementById("landing");
const uploadPage = document.getElementById("uploadPage");
const processingPage = document.getElementById("processingPage");
const resultsPage = document.getElementById("resultsPage");


// BUTTONS

const startButton =
    document.getElementById("startButton");

const analyzeButton =
    document.getElementById("analyzeButton");

const newExpedition =
    document.getElementById("newExpedition");


// FILE

const videoInput =
    document.getElementById("videoInput");

const selectedFile =
    document.getElementById("selectedFile");


// PROCESSING

const processingText =
    document.getElementById("processingText");

const progress =
    document.getElementById("progress");


// SHOW PAGE

function showPage(page) {

    landing.classList.add("hidden");
    uploadPage.classList.add("hidden");
    processingPage.classList.add("hidden");
    resultsPage.classList.add("hidden");

    page.classList.remove("hidden");
}


// START

startButton.addEventListener(
    "click",
    () => {

        showPage(uploadPage);

    }
);


// FILE SELECTED

videoInput.addEventListener(
    "change",
    () => {

        const file = videoInput.files[0];

        if (!file) {
            return;
        }

        selectedFile.textContent =
            `📹 ${file.name}`;

        selectedFile.classList.remove(
            "hidden"
        );

        analyzeButton.classList.remove(
            "hidden"
        );

    }
);


// ANALYZE

analyzeButton.addEventListener(
    "click",
    analyzeVideo
);


async function analyzeVideo() {

    const file =
        videoInput.files[0];

    if (!file) {
        return;
    }


    showPage(processingPage);


    const messages = [
        "Locating athlete...",
        "Following tiny legs...",
        "Measuring unnecessary distance...",
        "Counting rest breaks...",
        "Analyzing ant velocity...",
        "Calculating crumb expenditure...",
        "Evaluating terrain...",
        "Judging athletic performance...",
        "Preparing completely legitimate statistics..."
    ];


    let messageIndex = 0;

    processingText.textContent =
        messages[0];


    const messageTimer =
        setInterval(() => {

            messageIndex++;

            if (
                messageIndex <
                messages.length
            ) {

                processingText.textContent =
                    messages[messageIndex];

            }

        }, 1200);


    let progressValue = 0;

    const progressTimer =
        setInterval(() => {

            progressValue =
                Math.min(
                    progressValue + 3,
                    90
                );

            progress.style.width =
                `${progressValue}%`;

        }, 300);


    const formData =
        new FormData();

    formData.append(
        "video",
        file
    );


    try {

        const response =
            await fetch(
                `${API_URL}/analyze`,
                {
                    method: "POST",
                    body: formData
                }
            );


        if (!response.ok) {

            const error =
                await response.json();

            throw new Error(
                error.detail ||
                "Analysis failed"
            );

        }


        const data =
            await response.json();


        clearInterval(messageTimer);
        clearInterval(progressTimer);


        progress.style.width =
            "100%";


        setTimeout(() => {

            displayResults(data);

            showPage(resultsPage);

        }, 500);


    } catch (error) {

        clearInterval(messageTimer);
        clearInterval(progressTimer);

        console.error(error);

        alert(
            "The ant escaped.\n\n" +
            error.message
        );

        showPage(uploadPage);

    }

}


// DISPLAY RESULTS

function displayResults(data) {

    document.getElementById(
        "activityTitle"
    ).textContent =
        data.title;


    document.getElementById(
        "activityDescription"
    ).textContent =
        data.description;


    document.getElementById(
        "distance"
    ).textContent =
        data.distance;


    document.getElementById(
        "movingTime"
    ).textContent =
        formatTime(
            data.moving_time
        );


    document.getElementById(
        "averageSpeed"
    ).textContent =
        data.average_speed;


    document.getElementById(
        "maxSpeed"
    ).textContent =
        data.max_speed;


    document.getElementById(
        "steps"
    ).textContent =
        data.estimated_steps.toLocaleString();


    document.getElementById(
        "stops"
    ).textContent =
        data.stops;


    document.getElementById(
        "calories"
    ).textContent =
        data.calories;


    document.getElementById(
        "terrainScore"
    ).textContent =
        data.terrain_score;


    document.getElementById(
        "fitnessScore"
    ).textContent =
        data.fitness_score;


    document.getElementById(
        "longestStop"
    ).textContent =
        data.longest_stop;


    drawRoute(
        data.trajectory
    );


    displayAchievements(
        data.achievements
    );

}


// FORMAT TIME

function formatTime(seconds) {

    if (seconds < 60) {

        return `${seconds.toFixed(1)}s`;

    }


    const minutes =
        Math.floor(seconds / 60);

    const remaining =
        Math.floor(seconds % 60);

    return `${minutes}m ${remaining}s`;

}


// DRAW ROUTE

function drawRoute(trajectory) {

    if (
        !trajectory ||
        trajectory.length === 0
    ) {
        return;
    }


    const svg =
        document.getElementById(
            "routeSvg"
        );

    const path =
        document.getElementById(
            "routePath"
        );

    const startPoint =
        document.getElementById(
            "startPoint"
        );

    const finishPoint =
        document.getElementById(
            "finishPoint"
        );


    const width = 1000;
    const height = 600;


    let minX = Infinity;
    let maxX = -Infinity;

    let minY = Infinity;
    let maxY = -Infinity;


    trajectory.forEach(
        point => {

            minX =
                Math.min(
                    minX,
                    point.x
                );

            maxX =
                Math.max(
                    maxX,
                    point.x
                );

            minY =
                Math.min(
                    minY,
                    point.y
                );

            maxY =
                Math.max(
                    maxY,
                    point.y
                );

        }
    );


    const padding = 70;


    const dataWidth =
        Math.max(
            maxX - minX,
            1
        );

    const dataHeight =
        Math.max(
            maxY - minY,
            1
        );


    const scaleX =
        (width - padding * 2) /
        dataWidth;

    const scaleY =
        (height - padding * 2) /
        dataHeight;


    const scale =
        Math.min(
            scaleX,
            scaleY
        );


    function transform(point) {

        return {

            x:
                padding +
                (point.x - minX) *
                scale,

            y:
                padding +
                (point.y - minY) *
                scale

        };

    }


    let pathData = "";


    trajectory.forEach(
        (point, index) => {

            const position =
                transform(point);


            if (index === 0) {

                pathData +=
                    `M ${position.x} ${position.y}`;

            } else {

                pathData +=
                    ` L ${position.x} ${position.y}`;

            }

        }
    );


    path.setAttribute(
        "d",
        pathData
    );


    const start =
        transform(
            trajectory[0]
        );


    const finish =
        transform(
            trajectory[
                trajectory.length - 1
            ]
        );


    startPoint.setAttribute(
        "cx",
        start.x
    );

    startPoint.setAttribute(
        "cy",
        start.y
    );


    finishPoint.setAttribute(
        "cx",
        finish.x
    );

    finishPoint.setAttribute(
        "cy",
        finish.y
    );

}


// ACHIEVEMENTS

function displayAchievements(
    achievements
) {

    const container =
        document.getElementById(
            "achievementList"
        );


    container.innerHTML = "";


    achievements.forEach(
        achievement => {

            const badge =
                document.createElement(
                    "div"
                );

            badge.className =
                "achievement";


            badge.textContent =
                `🏆 ${achievement}`;


            container.appendChild(
                badge
            );

        }
    );

}


// NEW EXPEDITION

newExpedition.addEventListener(
    "click",
    () => {

        videoInput.value = "";

        selectedFile.classList.add(
            "hidden"
        );

        analyzeButton.classList.add(
            "hidden"
        );

        progress.style.width =
            "0%";

        showPage(uploadPage);

    }
);