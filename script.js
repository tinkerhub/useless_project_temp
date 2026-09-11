/* ========================================
   BISCUIT DATA
======================================== */

/* Fallback data used when data/biscuits.json
   cannot be loaded (e.g. opening via file://).
   The canonical source is data/biscuits.json. */

const FALLBACK_BISCUIT_DATA = {
    "Butter Cookies": {
        score: 72,
        time: 8.4,
        thickness: 72,
        stability: 76,
        surface: 70,
        cracks: 90,
        image: "https://static.vecteezy.com/system/resources/previews/030/739/904/non_2x/round-cookies-isolated-on-transparent-background-biscuit-top-view-cut-out-generative-ai-png.png"
    },
    "Marie Gold": {
        score: 43,
        time: 5.8,
        thickness: 43,
        stability: 52,
        surface: 60,
        cracks: 45,
        image: "https://static.vecteezy.com/system/resources/previews/024/509/639/non_2x/biscuit-isolated-on-transparent-background-created-with-generative-ai-png.png"
    },
    "Good Day": {
        score: 79,
        time: 9.5,
        thickness: 79,
        stability: 82,
        surface: 78,
        cracks: 80,
        scale: 1.3,
        image: "https://www.britannia.co.in/_next/image?url=%2Fimages%2FBiscuitTilted.png&w=640&q=75"
    },
    "Chocolate Biscuit": {
        score: 76,
        time: 8.9,
        thickness: 76,
        stability: 80,
        surface: 73,
        cracks: 78,
        image: "https://static.vecteezy.com/system/resources/previews/044/813/579/non_2x/chocolate-biscuit-isolated-on-transparent-background-free-png.png"
    },
    "Little Hearts": {
        score: 82,
        time: 10.1,
        thickness: 82,
        stability: 85,
        surface: 80,
        cracks: 82,
        image: "https://www.britannia.co.in/_next/image?url=%2Fimages%2FLittle_heart_Duo.png&w=640&q=75"
    },
    "Oreo": {
        score: 91,
        time: 11.2,
        thickness: 91,
        stability: 94,
        surface: 89,
        cracks: 93,
        image: "https://images.ctfassets.net/kvfvpz4abpco/7n3VlWuCUPBuMVzlmo9Pwe/bc74da99bbbed46fc896cb5166fc81d1/oreo-footer.png?w=1920"
    },
    "Tiger": {
        score: 67,
        time: 7.2,
        thickness: 67,
        stability: 70,
        surface: 66,
        cracks: 68,
        image: "https://www.continentalbiscuits.com.pk/wp-content/uploads/tiger_biscuit_image.png"
    },
    "50-50": {
        score: 70,
        time: 7.8,
        thickness: 70,
        stability: 73,
        surface: 71,
        cracks: 72,
        image: "https://pngimg.com/d/biscuit_PNG65.png"
    },
    "Jim Jam": {
        score: 74,
        time: 8.1,
        thickness: 74,
        stability: 77,
        surface: 75,
        cracks: 76,
        scale: 1.3,
        image: "https://png.pngtree.com/png-clipart/20231011/original/pngtree-jam-biscuits-macro-isolated-industry-picture-image_13117033.png"
    },
    "Dark Fantasy": {
        score: 87,
        time: 10.7,
        thickness: 87,
        stability: 89,
        surface: 86,
        cracks: 90,
        scale: 1.3,
        image: "https://www.pngplay.com/wp-content/uploads/15/Dark-Chocolate-Cookies-PNG-Clipart-Background.png"
    }
};

let biscuitData = {};

let testResults = [];

let lastTestedName = null;


/* ========================================
   LOAD DATA + RENDER CARDS
======================================== */

async function loadBiscuitData() {
    try {
        const res = await fetch("data/biscuits.json");
        if (!res.ok) throw new Error("Biscuit data not found");
        biscuitData = await res.json();
    } catch (err) {
        biscuitData = FALLBACK_BISCUIT_DATA;
    }

    renderBiscuits();
}

function renderBiscuits() {
    const grid = document.getElementById("biscuitGrid");

    grid.innerHTML = "";

    Object.keys(biscuitData).forEach(function(name) {
        const data = biscuitData[name];

        const card = document.createElement("div");
        card.className = "biscuit-card";
        card.setAttribute("onclick", "testBiscuit('" + name.replace(/'/g, "\\'") + "')");

        const scale = data.scale || 1;

        const imgArea = document.createElement("div");
        imgArea.className = "biscuit-image-area";

        const img = document.createElement("img");
        img.className = "biscuit-image";
        img.src = data.image;
        img.alt = name;
        img.style.width = (110 * scale) + "px";
        img.style.height = (110 * scale) + "px";

        imgArea.appendChild(img);

        const title = document.createElement("h3");
        title.textContent = name;

        const button = document.createElement("button");
        button.className = "test-btn";
        button.textContent = "Test Me";

        card.appendChild(imgArea);
        card.appendChild(title);
        card.appendChild(button);

        grid.appendChild(card);
    });
}


/* ========================================
   TEST BISCUIT
======================================== */

function testBiscuit(name) {
    const data = biscuitData[name];

    if (!data) return;

    document.getElementById("homeScreen").style.display = "none";

    document.getElementById("testScreen").style.display = "block";

    document.getElementById("result").style.display = "none";

    const biscuit = document.getElementById("animatedBiscuit");

    biscuit.src = data.image;

    const scale = data.scale || 1;

    biscuit.style.width = (100 * scale) + "px";
    biscuit.style.height = (100 * scale) + "px";
    biscuit.style.left = (125 + (100 - 100 * scale) / 2) + "px";

    biscuit.classList.remove("dip-animation");

    void biscuit.offsetWidth;

    biscuit.classList.add("dip-animation");

    document.getElementById("testingName").innerText =
        "Testing " + name + " ☕";

    const status = document.getElementById("statusText");

    status.innerText = "🍪 Entering tea...";

    setTimeout(() => {
        status.innerText = "☕ First dip...";
    }, 1000);

    setTimeout(() => {
        status.innerText = "☕☕ Second dip...";
    }, 2000);

    setTimeout(() => {
        status.innerText = "😰 Biscuit is getting nervous...";
    }, 3000);

    setTimeout(() => {
        status.innerText = "🔬 Analysing survival...";
    }, 4000);

    setTimeout(() => {
        showResult(name);
    }, 4500);
}


/* ========================================
   RESULT
======================================== */

function showResult(name) {
    const data = biscuitData[name];

    recordResult(name, data.score, data.time);

    document.getElementById("result").style.display = "block";

    document.getElementById("resultName").innerText =
        "🍪 " + name.toUpperCase();

    document.getElementById("resultTime").innerText =
        data.time + " seconds";

    document.getElementById("resultScore").innerText =
        data.score + "%";

    document.getElementById("resultImage").src =
        data.image;

    const resultImage = document.getElementById("resultImage");

    resultImage.style.width =
        (100 * (data.scale || 1)) + "px";
    resultImage.style.height =
        (100 * (data.scale || 1)) + "px";


    /* CATEGORY */

    let category;
    let message;
    let className;

    if (data.score >= 90) {

        category = "🟢 SURVIVAL MASTER";
        message = "This biscuit fears absolutely nothing. 😎";
        className = "green";

    } else if (data.score >= 75) {

        category = "🟢 TEA WARRIOR";
        message = "Strong enough for another dip! 💪";
        className = "green";

    } else if (data.score >= 50) {

        category = "🟡 BARELY SURVIVED";
        message = "One more dip and things could get serious. 😰";
        className = "yellow";

    } else if (data.score >= 30) {

        category = "🟠 CRITICAL";
        message = "Please rescue the biscuit immediately! 🚨";
        className = "orange";

    } else {

        category = "🔴 RIP BISCUIT";
        message = "Gone too soon. 😭";
        className = "red";
    }


    const categoryElement =
        document.getElementById("resultCategory");

    categoryElement.innerText = category;

    categoryElement.className =
        "category " + className;

    document.getElementById("resultMessage").innerText =
        message;


    /* FEATURE VALUES */

    document.getElementById("thicknessValue").innerText =
        data.thickness + "%";

    document.getElementById("stabilityValue").innerText =
        data.stability + "%";

    document.getElementById("surfaceValue").innerText =
        data.surface + "%";

    document.getElementById("crackValue").innerText =
        data.cracks + "%";


    document.getElementById("thicknessBar").style.width =
        data.thickness + "%";

    document.getElementById("stabilityBar").style.width =
        data.stability + "%";

    document.getElementById("surfaceBar").style.width =
        data.surface + "%";

    document.getElementById("crackBar").style.width =
        data.cracks + "%";


    window.scrollTo({
        top: document.getElementById("result").offsetTop - 20,
        behavior: "smooth"
    });
}


/* ========================================
   UPLOAD OWN BISCUIT
======================================== */

function handleUpload(event) {

    const file = event.target.files[0];

    if (!file) return;

    const reader = new FileReader();

    reader.onload = function(e) {

        const imageURL = e.target.result;

        const preview =
            document.getElementById("uploadedPreview");

        preview.src = imageURL;

        preview.style.display = "block";

        /*
            For now, uploaded biscuits receive
            an estimated score.

            Later you can connect OpenCV / AI
            image analysis here.
        */

        const estimatedScore =
            Math.floor(Math.random() * 31) + 60;

        const estimatedTime =
            (estimatedScore / 8).toFixed(1);

        document.getElementById("homeScreen").style.display =
            "none";

        document.getElementById("testScreen").style.display =
            "block";

        document.getElementById("result").style.display =
            "none";

        document.getElementById("testingName").innerText =
            "Analysing Your Biscuit 🔬";

        const biscuit =
            document.getElementById("animatedBiscuit");

        biscuit.src = imageURL;

        biscuit.classList.remove("dip-animation");

        void biscuit.offsetWidth;

        biscuit.classList.add("dip-animation");


        const status =
            document.getElementById("statusText");

        status.innerText =
            "🔍 Detecting biscuit shape...";


        setTimeout(() => {
            status.innerText =
                "📐 Estimating biscuit characteristics...";
        }, 1200);


        setTimeout(() => {
            status.innerText =
                "☕ Performing tea survival test...";
        }, 2400);


        setTimeout(() => {
            status.innerText =
                "🧠 Calculating survival score...";
        }, 3500);


        setTimeout(() => {

            showUploadedResult(
                imageURL,
                estimatedScore,
                estimatedTime
            );

        }, 4500);

    };

    reader.readAsDataURL(file);
}


/* ========================================
   UPLOADED RESULT
======================================== */

function showUploadedResult(image, score, time) {

    recordResult("Your Biscuit", score, Number(time));

    document.getElementById("result").style.display =
        "block";

    document.getElementById("resultImage").src =
        image;

    document.getElementById("resultName").innerText =
        "🍪 YOUR MYSTERY BISCUIT";

    document.getElementById("resultTime").innerText =
        time + " seconds";

    document.getElementById("resultScore").innerText =
        score + "%";


    let category;
    let message;
    let className;

    if (score >= 90) {

        category = "🟢 SURVIVAL MASTER";
        message = "Your biscuit is basically a tea superhero. 🦸🍪";
        className = "green";

    } else if (score >= 75) {

        category = "🟢 TEA WARRIOR";
        message = "A surprisingly strong biscuit! 💪";
        className = "green";

    } else if (score >= 50) {

        category = "🟡 BARELY SURVIVED";
        message = "It survived... somehow. 😰";
        className = "yellow";

    } else if (score >= 30) {

        category = "🟠 CRITICAL";
        message = "Get the biscuit out of the tea! 🚨";
        className = "orange";

    } else {

        category = "🔴 RIP BISCUIT";
        message = "The tea won. 😭";
        className = "red";
    }


    const categoryElement =
        document.getElementById("resultCategory");

    categoryElement.innerText = category;

    categoryElement.className =
        "category " + className;

    document.getElementById("resultMessage").innerText =
        message;


    /* Estimated image characteristics */

    const thickness =
        Math.floor(Math.random() * 30) + 65;

    const stability =
        Math.floor(Math.random() * 30) + 60;

    const surface =
        Math.floor(Math.random() * 30) + 65;

    const cracks =
        Math.floor(Math.random() * 30) + 60;


    document.getElementById("thicknessValue").innerText =
        thickness + "%";

    document.getElementById("stabilityValue").innerText =
        stability + "%";

    document.getElementById("surfaceValue").innerText =
        surface + "%";

    document.getElementById("crackValue").innerText =
        cracks + "%";


    document.getElementById("thicknessBar").style.width =
        thickness + "%";

    document.getElementById("stabilityBar").style.width =
        stability + "%";

    document.getElementById("surfaceBar").style.width =
        surface + "%";

    document.getElementById("crackBar").style.width =
        cracks + "%";


    window.scrollTo({
        top: document.getElementById("result").offsetTop - 20,
        behavior: "smooth"
    });
}


/* ========================================
   LEADERBOARD (TEA SURVIVAL CHAMPIONS)
======================================== */

function recordResult(name, score, time) {

    lastTestedName = name;

    const existing = testResults.find(function(r) {
        return r.name === name;
    });

    if (!existing) {

        testResults.push({ name: name, score: score, time: time });

    } else if (score > existing.score) {

        existing.score = score;
        existing.time = time;
    }

    renderLeaderboard();
}

function renderLeaderboard() {

    const board = document.getElementById("leaderboard");

    if (!board) return;

    board.innerHTML = "";

    if (testResults.length === 0) {

        const empty = document.createElement("div");

        empty.className = "leader empty";

        empty.textContent = "No champions yet — test a biscuit to begin! 🍪";

        board.appendChild(empty);

        return;
    }

    const sorted = testResults.slice().sort(function(a, b) {
        return b.score - a.score;
    });

    const top = sorted.slice(0, 5);

    top.forEach(function(entry, index) {

        const row = document.createElement("div");

        row.className = "leader leader-row";

        if (index === 0) row.classList.add("gold");
        if (index === 1) row.classList.add("silver");
        if (index === 2) row.classList.add("bronze");

        if (entry.name === lastTestedName) {
            row.classList.add("just-tested");
        }

        const rank = document.createElement("div");
        rank.className = "rank";
        rank.textContent = index === 0 ? "🥇" :
                           index === 1 ? "🥈" :
                           index === 2 ? "🥉" :
                           (index + 1);

        const nameEl = document.createElement("div");
        nameEl.className = "leader-name";
        nameEl.textContent = entry.name;

        const scoreEl = document.createElement("div");
        scoreEl.className = "leader-score";
        scoreEl.textContent = entry.score + "%";

        row.appendChild(rank);
        row.appendChild(nameEl);
        row.appendChild(scoreEl);

        row.style.animationDelay = (index * 120) + "ms";

        board.appendChild(row);
    });
}


/* ========================================
   GO HOME
======================================== */

function goHome() {

    document.getElementById("testScreen").style.display =
        "none";

    document.getElementById("homeScreen").style.display =
        "block";

    document.getElementById("result").style.display =
        "none";

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}


/* ========================================
   INIT
======================================== */

renderLeaderboard();

loadBiscuitData();