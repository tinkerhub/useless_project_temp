const vscode = require('vscode');
const crypto = require('crypto');

const audioEngine = require('./audioEngine');
const aiRoast = require('./aiRoast');


/* =====================================================
   GLOBAL STATE
===================================================== */

let panel = null;

let activeDamage = 0;

let eventCount = 0;

let history = [];

let inactivityTimer = null;

let deletionTimer = null;


/* =====================================================
   CURRENT CODE STATE
===================================================== */

let activeSyntaxErrors = new Set();

let totalLines = 1;

let inactivityDamageActive = false;

let temporaryDeletionDamage = 0;


/* =====================================================
   ACTIVATE EXTENSION
===================================================== */

function activate(context) {

    console.log(
        '💀 Emotional Damage IDE activated!'
    );


    /* =================================================
       COMMAND
    ================================================= */

    const command =
        vscode.commands.registerCommand(
            'emotionalDamage.openDashboard',
            function () {

                openDashboard();

            }
        );


    context.subscriptions.push(
        command
    );


    /* =================================================
       AUTO OPEN DASHBOARD
    ================================================= */

    setTimeout(
        function () {

            openDashboard();

        },
        700
    );


    /* =================================================
       VS CODE DIAGNOSTICS
    ================================================= */

    const diagnostics =
        vscode.languages.onDidChangeDiagnostics(
            function () {

                if (!panel) {
                    return;
                }


                const editor =
                    vscode.window.activeTextEditor;


                if (!editor) {
                    return;
                }


                const diagnosticsList =
                    vscode.languages.getDiagnostics(
                        editor.document.uri
                    );


                console.log(
                    'VS Code diagnostics:',
                    diagnosticsList.length
                );

            }
        );


    context.subscriptions.push(
        diagnostics
    );
}


/* =====================================================
   DAMAGE CALCULATION
===================================================== */

function calculateActiveDamage() {

    /*
       -----------------------------------------------
       SYNTAX DAMAGE
       -----------------------------------------------

       Damage per error:

       100 / (number of lines + 1)

       Examples:

       1 line  = 50%
       2 lines = 33%
       3 lines = 25%
       4 lines = 20%
       5 lines = 17%
       10 lines = 9%

       Multiple errors stack.

       Example:

       3 lines + 2 errors

       100 / 4 = 25

       25 × 2 = 50%
    */


    let syntaxDamage = 0;


    if (
        totalLines > 0 &&
        activeSyntaxErrors.size > 0
    ) {

        const damagePerError =
            100 /
            (totalLines + 1);


        syntaxDamage =
            Math.round(
                damagePerError *
                activeSyntaxErrors.size
            );

    }


    /* =================================================
       INACTIVITY DAMAGE
    ================================================= */

    const inactivityDamage =
        inactivityDamageActive
            ? 15
            : 0;


    /* =================================================
       FINAL DAMAGE
    ================================================= */

    activeDamage =
        syntaxDamage +
        inactivityDamage +
        temporaryDeletionDamage;


    /* =================================================
       LIMIT
    ================================================= */

    activeDamage =
        Math.max(
            0,
            Math.min(
                100,
                activeDamage
            )
        );
}


/* =====================================================
   UPDATE DASHBOARD
===================================================== */

function updateDashboard() {

    if (!panel) {
        return;
    }


    calculateActiveDamage();


    panel.webview.postMessage({

        type:
            'update',

        damage:
            activeDamage,

        events:
            eventCount,

        history:
            history,

        errors:
            activeSyntaxErrors.size,

        lines:
            totalLines

    });
}


/* =====================================================
   UPDATE ACTIVE SYNTAX ERRORS
===================================================== */

async function updateSyntaxErrors(
    errors,
    language,
    lines
) {

    /* -----------------------------------------------
       SAVE NUMBER OF LINES
    ------------------------------------------------ */

    totalLines =
        Math.max(
            1,
            Number(lines) || 1
        );


    /* -----------------------------------------------
       REMOVE DUPLICATES
    ------------------------------------------------ */

    const newErrors =
        new Set(
            errors || []
        );


    const oldErrors =
        activeSyntaxErrors;


    /* -----------------------------------------------
       FIND NEW ERRORS
    ------------------------------------------------ */

    const newlyAddedErrors =
        Array.from(
            newErrors
        ).filter(
            function (error) {

                return !oldErrors.has(
                    error
                );

            }
        );


    /* -----------------------------------------------
       UPDATE ACTIVE ERRORS
    ------------------------------------------------ */

    activeSyntaxErrors =
        newErrors;


    /* -----------------------------------------------
       CREATE HISTORY FOR NEW ERRORS
    ------------------------------------------------ */

    for (
        const error of newlyAddedErrors
    ) {

        eventCount++;


        /* =============================================
           PLAY SOUND
        ============================================== */

        try {

            audioEngine.playSound(
                'syntax'
            );

        } catch (soundError) {

            console.error(
                'Sound error:',
                soundError.message
            );

        }


        /* =============================================
           AI ROAST
        ============================================== */

        let roast;


        try {

            roast =
                await aiRoast
                    .generateEmotionalDamage(
                        'syntax',
                        {
                            language:
                                language,

                            error:
                                error
                        }
                    );

        } catch (aiError) {

            console.error(
                'AI error:',
                aiError.message
            );


            roast =
                '🚨 Another syntax crime detected.';

        }


        /* =============================================
           ADD HISTORY
        ============================================== */

        history.push({

            type:
                'syntax',

            icon:
                '🚨',

            roast:
                roast,

            time:
                new Date()
                    .toLocaleTimeString()

        });


        /* ---------------------------------------------
           KEEP ONLY LAST 15
        ---------------------------------------------- */

        if (
            history.length > 15
        ) {

            history.shift();

        }

    }


    updateDashboard();
}


/* =====================================================
   DELETION PUNISHMENT
===================================================== */

async function triggerDeletion(
    deletedLines
) {

    eventCount++;


    /*
       Deleting a lot of code causes
       temporary additional damage.
    */

    temporaryDeletionDamage =
        Math.min(
            40,
            temporaryDeletionDamage + 40
        );


    /* -----------------------------------------------
       RESET PREVIOUS DELETION TIMER
    ------------------------------------------------ */

    if (
        deletionTimer
    ) {

        clearTimeout(
            deletionTimer
        );

    }


    /* -----------------------------------------------
       REMOVE DELETION DAMAGE AFTER 8 SEC
    ------------------------------------------------ */

    deletionTimer =
        setTimeout(
            function () {

                temporaryDeletionDamage = 0;

                updateDashboard();

            },
            8000
        );


    /* -----------------------------------------------
       SOUND
    ------------------------------------------------ */

    try {

        audioEngine.playSound(
            'deletion'
        );

    } catch (error) {

        console.error(
            'Sound error:',
            error.message
        );

    }


    /* -----------------------------------------------
       AI ROAST
    ------------------------------------------------ */

    let roast;


    try {

        roast =
            await aiRoast
                .generateEmotionalDamage(
                    'deletion',
                    {
                        lines:
                            deletedLines
                    }
                );

    } catch (error) {

        roast =
            '🎻 You deleted code. Somewhere, a variable is crying.';

    }


    /* -----------------------------------------------
       HISTORY
    ------------------------------------------------ */

    history.push({

        type:
            'deletion',

        icon:
            '🎻',

        roast:
            roast,

        time:
            new Date()
                .toLocaleTimeString()

    });


    if (
        history.length > 15
    ) {

        history.shift();

    }


    updateDashboard();
}


/* =====================================================
   INACTIVITY PUNISHMENT
===================================================== */

async function triggerInactivity() {

    /*
       Prevent repeated inactivity
       punishments.
    */

    if (
        inactivityDamageActive
    ) {

        return;

    }


    inactivityDamageActive =
        true;


    eventCount++;


    /* -----------------------------------------------
       SOUND
    ------------------------------------------------ */

    try {

        audioEngine.playSound(
            'inactivity'
        );

    } catch (error) {

        console.error(
            'Sound error:',
            error.message
        );

    }


    /* -----------------------------------------------
       AI ROAST
    ------------------------------------------------ */

    let roast;


    try {

        roast =
            await aiRoast
                .generateEmotionalDamage(
                    'inactivity'
                );

    } catch (error) {

        roast =
            '🥱 You stopped coding. Even the IDE fell asleep.';

    }


    /* -----------------------------------------------
       HISTORY
    ------------------------------------------------ */

    history.push({

        type:
            'inactivity',

        icon:
            '🥱',

        roast:
            roast,

        time:
            new Date()
                .toLocaleTimeString()

    });


    if (
        history.length > 15
    ) {

        history.shift();

    }


    updateDashboard();
}


/* =====================================================
   RESET EVERYTHING
===================================================== */

function resetEverything() {

    activeDamage = 0;

    eventCount = 0;

    history = [];

    activeSyntaxErrors =
        new Set();

    totalLines = 1;

    inactivityDamageActive =
        false;

    temporaryDeletionDamage =
        0;


    if (
        inactivityTimer
    ) {

        clearTimeout(
            inactivityTimer
        );

        inactivityTimer = null;

    }


    if (
        deletionTimer
    ) {

        clearTimeout(
            deletionTimer
        );

        deletionTimer = null;

    }


    updateDashboard();
}


/* =====================================================
   INACTIVITY TIMER
===================================================== */

function restartInactivityTimer() {

    if (
        inactivityTimer
    ) {

        clearTimeout(
            inactivityTimer
        );

    }


    inactivityTimer =
        setTimeout(
            function () {

                if (panel) {

                    triggerInactivity();

                }

            },
            30000
        );
}


/* =====================================================
   OPEN DASHBOARD
===================================================== */

function openDashboard() {

    if (panel) {

        panel.reveal(
            vscode.ViewColumn.One
        );

        return;

    }


    panel =
        vscode.window.createWebviewPanel(

            'emotionalDamageDashboard',

            '💀 Emotional Damage IDE',

            vscode.ViewColumn.One,

            {
                enableScripts:
                    true,

                retainContextWhenHidden:
                    true
            }

        );


    panel.webview.html =
        getDashboardHTML(
            panel.webview
        );


    /* =================================================
       RECEIVE WEBVIEW MESSAGES
    ================================================= */

    panel.webview.onDidReceiveMessage(
        async function (message) {


            /* =========================================
               SYNTAX ERRORS
            ========================================== */

            if (
                message.command ===
                'syntaxErrors'
            ) {

                await updateSyntaxErrors(

                    message.errors || [],

                    message.language ||
                        'unknown',

                    message.lines ||
                        1

                );

            }


            /* =========================================
               DELETION
            ========================================== */

            else if (
                message.command ===
                'deletion'
            ) {

                await triggerDeletion(
                    message.lines || 1
                );

            }


            /* =========================================
               INACTIVITY
            ========================================== */

            else if (
                message.command ===
                'inactivity'
            ) {

                await triggerInactivity();

            }


            /* =========================================
               TYPING
            ========================================== */

            else if (
                message.command ===
                'typing'
            ) {

                /*
                   Typing means the user is active.
                   Remove inactivity punishment.
                */

                inactivityDamageActive =
                    false;


                restartInactivityTimer();


                updateDashboard();

            }


            /* =========================================
               RESET
            ========================================== */

            else if (
                message.command ===
                'reset'
            ) {

                resetEverything();

            }

        }
    );


    /* =================================================
       PANEL CLOSED
    ================================================= */

    panel.onDidDispose(
        function () {

            panel = null;


            if (
                inactivityTimer
            ) {

                clearTimeout(
                    inactivityTimer
                );

                inactivityTimer =
                    null;

            }


            if (
                deletionTimer
            ) {

                clearTimeout(
                    deletionTimer
                );

                deletionTimer =
                    null;

            }

        }
    );


    updateDashboard();
}


/* =====================================================
   NONCE
===================================================== */

function getNonce() {

    return crypto
        .randomBytes(16)
        .toString('hex');

}


/* =====================================================
   DASHBOARD HTML
===================================================== */

function getDashboardHTML(webview) {

    const nonce =
        getNonce();


    return `<!DOCTYPE html>

<html>

<head>

<meta charset="UTF-8">

<meta
    http-equiv="Content-Security-Policy"
    content="
        default-src 'none';
        style-src 'unsafe-inline';
        script-src 'nonce-${nonce}';
    "
>

<meta
    name="viewport"
    content="width=device-width, initial-scale=1"
>


<style>

/* =====================================================
   GLOBAL
===================================================== */

* {
    box-sizing: border-box;
}


body {

    margin: 0;

    padding: 24px;

    min-height: 100vh;

    font-family:
        -apple-system,
        BlinkMacSystemFont,
        "Segoe UI",
        sans-serif;

    color: #f7f2ff;

    background:
        radial-gradient(
            circle at 10% 0%,
            #38205b,
            transparent 35%
        ),
        radial-gradient(
            circle at 90% 20%,
            #572047,
            transparent 30%
        ),
        #0d0912;
}


/* =====================================================
   HEADER
===================================================== */

.header {

    display: flex;

    justify-content:
        space-between;

    align-items: center;

    margin-bottom: 18px;
}


.brand {

    display: flex;

    align-items: center;

    gap: 14px;
}


.logo {

    width: 60px;

    height: 60px;

    display: flex;

    align-items: center;

    justify-content: center;

    border-radius: 17px;

    font-size: 31px;

    background:
        linear-gradient(
            135deg,
            #8b5cf6,
            #ec4899
        );

    box-shadow:
        0 10px 35px
        rgba(139,92,246,.35);
}


h1 {

    margin: 0;

    font-size: 28px;
}


.subtitle {

    margin-top: 4px;

    color: #a99db5;

    font-size: 13px;
}


.live {

    padding:
        9px 15px;

    border-radius:
        30px;

    background:
        rgba(65,210,120,.10);

    border:
        1px solid
        rgba(100,240,150,.25);

    color:
        #7df3a6;

    font-size:
        11px;
}


/* =====================================================
   ERROR BANNER
===================================================== */

#damageBanner {

    display: none;

    margin-bottom: 20px;

    padding: 22px 25px;

    border-radius: 20px;

    background:
        linear-gradient(
            135deg,
            rgba(255,35,100,.25),
            rgba(100,20,80,.35)
        );

    border:
        2px solid
        #ff4f86;

    box-shadow:
        0 0 35px
        rgba(255,50,120,.35);
}


#damageBanner.show {

    display: block;

    animation:
        flashDamage .55s
        infinite alternate;
}


#damageTitle {

    font-size: 22px;

    font-weight: 900;

    color: #ff80a4;
}


#damageMessage {

    margin-top: 8px;

    white-space: pre-wrap;

    line-height: 1.5;

    color: #f7dce6;

    font-size: 14px;
}


#damageScore {

    margin-top: 12px;

    font-size: 13px;

    font-weight: 800;

    color: #ffd0df;
}


@keyframes flashDamage {

    from {

        transform:
            scale(1);

        box-shadow:
            0 0 20px
            rgba(255,50,120,.25);

    }

    to {

        transform:
            scale(1.012);

        box-shadow:
            0 0 55px
            rgba(255,50,120,.75);

    }

}


/* =====================================================
   STATS
===================================================== */

.stats {

    display: grid;

    grid-template-columns:
        repeat(3, 1fr);

    gap: 12px;

    margin-bottom: 18px;
}


.stat {

    padding: 17px;

    border-radius: 17px;

    background:
        rgba(255,255,255,.055);

    border:
        1px solid
        rgba(255,255,255,.08);
}


.statLabel {

    color: #877b91;

    font-size: 10px;

    text-transform:
        uppercase;
}


.statValue {

    margin-top: 5px;

    font-size: 29px;

    font-weight: 900;
}


.purple {
    color: #b794ff;
}


.pink {
    color: #ff82b1;
}


.green {
    color: #72e7a0;
}


/* =====================================================
   MAIN LAYOUT
===================================================== */

.main {

    display: grid;

    grid-template-columns:
        minmax(0, 2fr)
        minmax(280px, 1fr);

    gap: 18px;
}


/* =====================================================
   PANELS
===================================================== */

.panel {

    overflow: hidden;

    border-radius: 18px;

    background:
        rgba(20,16,27,.88);

    border:
        1px solid
        rgba(255,255,255,.08);

    box-shadow:
        0 20px 60px
        rgba(0,0,0,.25);
}


.panelHeader {

    padding:
        14px 17px;

    display: flex;

    align-items: center;

    justify-content:
        space-between;

    border-bottom:
        1px solid
        rgba(255,255,255,.07);
}


.panelTitle {

    font-weight:
        800;

    font-size:
        13px;
}


/* =====================================================
   SELECT
===================================================== */

select {

    border:
        1px solid
        rgba(255,255,255,.1);

    border-radius:
        9px;

    background:
        #211a2b;

    color:
        white;

    padding:
        7px 10px;

    outline:
        none;
}


/* =====================================================
   CODE EDITOR
===================================================== */

.editor {

    display:
        flex;

    height:
        470px;

    background:
        #0a080d;
}


.lineNumbers {

    width:
        52px;

    padding:
        17px 10px;

    text-align:
        right;

    color:
        #574d61;

    font-family:
        Consolas,
        monospace;

    font-size:
        13px;

    line-height:
        21px;

    user-select:
        none;

    border-right:
        1px solid
        rgba(255,255,255,.05);
}


textarea {

    flex:
        1;

    padding:
        17px;

    border:
        0;

    outline:
        0;

    resize:
        none;

    background:
        transparent;

    color:
        #e8e0ef;

    font-family:
        Consolas,
        "Courier New",
        monospace;

    font-size:
        14px;

    line-height:
        21px;

    tab-size:
        4;
}


textarea::selection {

    background:
        rgba(139,92,246,.4);
}


/* =====================================================
   EDITOR FOOTER
===================================================== */

.editorFooter {

    padding:
        11px 15px;

    display:
        flex;

    justify-content:
        space-between;

    align-items:
        center;

    color:
        #786d82;

    font-size:
        11px;

    border-top:
        1px solid
        rgba(255,255,255,.06);
}


button {

    border:
        0;

    border-radius:
        9px;

    padding:
        8px 13px;

    cursor:
        pointer;

    color:
        white;

    background:
        #2a2233;
}


button:hover {

    background:
        #3b3047;
}


.reset {

    background:
        linear-gradient(
            135deg,
            #7048bd,
            #c13d80
        );
}


/* =====================================================
   MONITOR
===================================================== */

.monitor {

    padding:
        20px;
}


.monitorTitle {

    color:
        #9d91a8;

    font-size:
        11px;

    text-transform:
        uppercase;
}


.bigDamage {

    margin:
        18px 0;

    text-align:
        center;

    font-size:
        62px;

    font-weight:
        900;

    background:
        linear-gradient(
            90deg,
            #a78bfa,
            #f472b6
        );

    -webkit-background-clip:
        text;

    color:
        transparent;

    transition:
        transform .15s ease;
}


.bigDamage.pulse {

    transform:
        scale(1.08);
}


.progress {

    height:
        9px;

    overflow:
        hidden;

    border-radius:
        20px;

    background:
        #28212f;
}


.progressBar {

    width:
        0%;

    height:
        100%;

    border-radius:
        20px;

    background:
        linear-gradient(
            90deg,
            #8b5cf6,
            #ec4899
        );

    transition:
        width .25s ease;
}


#damageExplanation {

    text-align:
        center;

    color:
        #786d82;

    font-size:
        11px;

    margin-top:
        -8px;

    margin-bottom:
        16px;
}


#errorInfo {

    text-align:
        center;

    margin-top:
        12px;

    color:
        #a99db5;

    font-size:
        11px;
}


.watching {

    margin-top:
        18px;

    padding:
        10px;

    text-align:
        center;

    border-radius:
        10px;

    color:
        #73e6a0;

    background:
        rgba(80,220,120,.08);
}


/* =====================================================
   HISTORY
===================================================== */

.history {

    margin-top:
        18px;

    max-height:
        320px;

    overflow-y:
        auto;

    padding:
        15px;
}


.historyItem {

    margin-bottom:
        10px;

    padding:
        11px;

    border-radius:
        11px;

    background:
        #17121e;

    border-left:
        3px solid
        #a276f7;
}


.historyType {

    color:
        #a88bdf;

    font-size:
        10px;

    font-weight:
        800;
}


.historyText {

    margin-top:
        5px;

    color:
        #d1c8d8;

    font-size:
        11px;

    white-space:
        pre-wrap;
}


.empty {

    padding:
        30px;

    text-align:
        center;

    color:
        #655b6c;

    font-size:
        11px;
}


/* =====================================================
   RESPONSIVE
===================================================== */

@media(max-width: 850px) {

    .main {

        grid-template-columns:
            1fr;
    }


    .stats {

        grid-template-columns:
            1fr;
    }

}

</style>

</head>


<body>


<!-- ==================================================
     HEADER
=================================================== -->

<div class="header">

    <div class="brand">

        <div class="logo">
            💀
        </div>


        <div>

            <h1>
                Emotional Damage IDE
            </h1>


            <div class="subtitle">
                Your code doesn't need debugging.
                It needs therapy.
            </div>

        </div>

    </div>


    <div class="live">
        ● LIVE MONITORING
    </div>

</div>


<!-- ==================================================
     ERROR BANNER
=================================================== -->

<div id="damageBanner">

    <div id="damageTitle">
        🚨 EMOTIONAL DAMAGE DETECTED 🚨
    </div>


    <div id="damageMessage">
        The IDE is disappointed in you.
    </div>


    <div id="damageScore">
        💀 EMOTIONAL DAMAGE: 0%
    </div>

</div>


<!-- ==================================================
     STATS
=================================================== -->

<div class="stats">


    <div class="stat">

        <div class="statLabel">
            Current Code Damage
        </div>


        <div
            id="damage"
            class="statValue pink"
        >
            0%
        </div>

    </div>


    <div class="stat">

        <div class="statLabel">
            Damage Events
        </div>


        <div
            id="events"
            class="statValue purple"
        >
            0
        </div>

    </div>


    <div class="stat">

        <div class="statLabel">
            System Status
        </div>


        <div class="statValue green">
            WATCHING
        </div>

    </div>

</div>


<!-- ==================================================
     MAIN
=================================================== -->

<div class="main">


<!-- ==================================================
     CODE EDITOR
=================================================== -->

<div class="panel">


    <div class="panelHeader">

        <div class="panelTitle">
            💻 Live Code Arena
        </div>


        <select id="language">

            <option value="python">
                Python
            </option>


            <option value="javascript">
                JavaScript
            </option>

        </select>

    </div>


    <div class="editor">


        <div
            id="lineNumbers"
            class="lineNumbers"
        >
            1
        </div>


        <textarea
            id="code"
            spellcheck="false"
            placeholder="Start typing...

Try:

def hello()

print('Hello')

The IDE is watching... 💀"
        ></textarea>

    </div>


    <div class="editorFooter">

        <span id="editorStatus">
            🟢 Ready to judge your code
        </span>


        <button
            id="reset"
            class="reset"
        >
            🔄 Reset
        </button>

    </div>

</div>


<!-- ==================================================
     RIGHT SIDE
=================================================== -->

<div>


    <!-- DAMAGE MONITOR -->

    <div class="panel">

        <div class="monitor">


            <div class="monitorTitle">
                Current Emotional Damage
            </div>


            <div
                id="bigDamage"
                class="bigDamage"
            >
                0%
            </div>


            <div
                id="damageExplanation"
            >
                Damage decreases as your code grows.
            </div>


            <div class="progress">

                <div
                    id="progressBar"
                    class="progressBar"
                ></div>

            </div>


            <div id="errorInfo">
                0 active errors
            </div>


            <div class="watching">
                🟢 SYSTEM WATCHING
            </div>

        </div>

    </div>


    <!-- HISTORY -->

    <div class="panel history">


        <div class="panelHeader">

            <div class="panelTitle">
                📜 Disappointment History
            </div>

        </div>


        <div id="history">

            <div class="empty">

                No emotional damage yet.

                <br><br>

                Start coding...

            </div>

        </div>

    </div>

</div>

</div>


<script nonce="${nonce}">

/* =====================================================
   VS CODE API
===================================================== */

const vscode =
    acquireVsCodeApi();


/* =====================================================
   ELEMENTS
===================================================== */

const code =
    document.getElementById(
        'code'
    );


const lines =
    document.getElementById(
        'lineNumbers'
    );


const language =
    document.getElementById(
        'language'
    );


const banner =
    document.getElementById(
        'damageBanner'
    );


const bannerTitle =
    document.getElementById(
        'damageTitle'
    );


const bannerMessage =
    document.getElementById(
        'damageMessage'
    );


const bannerScore =
    document.getElementById(
        'damageScore'
    );


const damage =
    document.getElementById(
        'damage'
    );


const bigDamage =
    document.getElementById(
        'bigDamage'
    );


const progressBar =
    document.getElementById(
        'progressBar'
    );


const events =
    document.getElementById(
        'events'
    );


const historyContainer =
    document.getElementById(
        'history'
    );


const editorStatus =
    document.getElementById(
        'editorStatus'
    );


const reset =
    document.getElementById(
        'reset'
    );


const errorInfo =
    document.getElementById(
        'errorInfo'
    );


const damageExplanation =
    document.getElementById(
        'damageExplanation'
    );


/* =====================================================
   FRONTEND STATE
===================================================== */

let previousLines = 1;

let lastErrors = [];

let analysisTimer = null;

let inactivityTimer = null;

let currentDamage = 0;

let targetDamage = 0;

let bannerVisible = false;


/* =====================================================
   DAMAGE ANIMATION
===================================================== */

function animateDamage() {

    if (
        currentDamage ===
        targetDamage
    ) {

        return;

    }


    const difference =
        targetDamage -
        currentDamage;


    /*
       Move faster when the difference
       is large and slower when close.
    */

    const step =
        Math.max(
            1,
            Math.ceil(
                Math.abs(
                    difference
                ) / 6
            )
        );


    if (
        difference > 0
    ) {

        currentDamage +=
            step;

    }

    else {

        currentDamage -=
            step;

    }


    if (
        difference > 0 &&
        currentDamage >
        targetDamage
    ) {

        currentDamage =
            targetDamage;

    }


    if (
        difference < 0 &&
        currentDamage <
        targetDamage
    ) {

        currentDamage =
            targetDamage;

    }


    updateDamageDisplay();


    requestAnimationFrame(
        animateDamage
    );
}


/* =====================================================
   UPDATE DAMAGE DISPLAY
===================================================== */

function updateDamageDisplay() {

    const value =
        Math.round(
            currentDamage
        );


    damage.textContent =
        value + '%';


    bigDamage.textContent =
        value + '%';


    progressBar.style.width =
        value + '%';


    if (
        bannerVisible
    ) {

        bannerScore.textContent =
            '💀 EMOTIONAL DAMAGE: ' +
            value +
            '%';

    }

}


/* =====================================================
   SET DAMAGE
===================================================== */

function setDamage(value) {

    targetDamage =
        Math.max(
            0,
            Math.min(
                100,
                Number(value) || 0
            )
        );


    animateDamage();
}


/* =====================================================
   LINE NUMBERS
===================================================== */

function updateLineNumbers() {

    const count =
        code.value
            .split('\\n')
            .length;


    let output = '';


    for (
        let i = 1;
        i <= count;
        i++
    ) {

        output +=
            i +
            '<br>';

    }


    lines.innerHTML =
        output;
}


/* =====================================================
   BRACKET CHECK
===================================================== */

function checkBrackets(text) {

    const stack = [];


    const pairs = {

        ')': '(',

        ']': '[',

        '}': '{'

    };


    for (
        let i = 0;
        i < text.length;
        i++
    ) {

        const character =
            text[i];


        if (
            character === '(' ||
            character === '[' ||
            character === '{'
        ) {

            stack.push(
                character
            );

        }


        else if (
            character === ')' ||
            character === ']' ||
            character === '}'
        ) {

            if (
                stack.length === 0
            ) {

                return [
                    'Unmatched closing bracket'
                ];

            }


            if (
                stack.pop() !==
                pairs[character]
            ) {

                return [
                    'Mismatched bracket'
                ];

            }

        }

    }


    if (
        stack.length > 0
    ) {

        return [
            'Missing closing bracket'
        ];

    }


    return [];
}


/* =====================================================
   PYTHON CHECKER
===================================================== */

function checkPython(text) {

    const errors = [];


    const rows =
        text.split('\\n');


    /*
       Check every line separately.

       This is important because we want
       multiple errors at the same time.
    */

    for (
        let i = 0;
        i < rows.length;
        i++
    ) {

        const originalRow =
            rows[i];


        const row =
            originalRow.trim();


        if (!row) {
            continue;
        }


        /* ---------------------------------------------
           Python blocks that require :
        ---------------------------------------------- */

        const blockPattern =
            /^(def|class|if|elif|else|for|while|try|except|finally|with)\\b/;


        if (
            blockPattern.test(row)
        ) {

            if (
                !row.endsWith(':')
            ) {

                errors.push(

                    'Line ' +
                    (i + 1) +
                    ': expected ":"'

                );

            }

        }


        /* ---------------------------------------------
           Python function parentheses
        ---------------------------------------------- */

        if (
            row.startsWith(
                'def '
            )
        ) {

            if (
                !row.includes('(') ||
                !row.includes(')')
            ) {

                errors.push(

                    'Line ' +
                    (i + 1) +
                    ': invalid function declaration'

                );

            }

        }


        /* ---------------------------------------------
           Python print missing )
        ---------------------------------------------- */

        if (
            row.includes(
                'print('
            ) &&
            !row.includes(')')
        ) {

            errors.push(

                'Line ' +
                (i + 1) +
                ': missing ")"'

            );

        }

    }


    /*
       Check brackets.

       Only add the bracket error if
       it is not already present.
    */

    const bracketErrors =
        checkBrackets(
            text
        );


    bracketErrors.forEach(
        function (error) {

            errors.push(
                error
            );

        }
    );


    return errors;
}


/* =====================================================
   JAVASCRIPT CHECKER
===================================================== */

function checkJavaScript(text) {

    const errors = [];


    const rows =
        text.split('\\n');


    for (
        let i = 0;
        i < rows.length;
        i++
    ) {

        const row =
            rows[i].trim();


        if (!row) {
            continue;
        }


        /* ---------------------------------------------
           Function declaration
        ---------------------------------------------- */

        if (
            row.startsWith(
                'function '
            )
        ) {

            if (
                !row.includes('(') ||
                !row.includes(')')
            ) {

                errors.push(

                    'Line ' +
                    (i + 1) +
                    ': invalid function declaration'

                );

            }

        }


        /* ---------------------------------------------
           console.log
        ---------------------------------------------- */

        if (
            row.includes(
                'console.log('
            ) &&
            !row.includes(')')
        ) {

            errors.push(

                'Line ' +
                (i + 1) +
                ': missing ")"'

            );

        }


        /* ---------------------------------------------
           if / for / while
        ---------------------------------------------- */

        const controlPattern =
            /^(if|for|while|switch|catch)\\b/;


        if (
            controlPattern.test(row)
        ) {

            if (
                !row.includes('{') &&
                !row.endsWith('{') &&
                !row.endsWith(';')
            ) {

                errors.push(

                    'Line ' +
                    (i + 1) +
                    ': possible missing "{"'

                );

            }

        }

    }


    const bracketErrors =
        checkBrackets(
            text
        );


    bracketErrors.forEach(
        function (error) {

            errors.push(
                error
            );

        }
    );


    return errors;
}


/* =====================================================
   SHOW ERROR BANNER
===================================================== */

function showError(
    error
) {

    bannerVisible =
        true;


    banner.classList.add(
        'show'
    );


    if (
        language.value ===
        'python'
    ) {

        bannerTitle.textContent =
            '🚨 PYTHON CRIME DETECTED 🚨';

    }

    else {

        bannerTitle.textContent =
            '🚨 JAVASCRIPT CRIME DETECTED 🚨';

    }


    bannerMessage.textContent =
        error;


    bannerScore.textContent =
        '💀 EMOTIONAL DAMAGE: ' +
        Math.round(
            currentDamage
        ) +
        '%';


    editorStatus.textContent =
        '🔴 ' +
        lastErrors.length +
        (
            lastErrors.length === 1
                ? ' error'
                : ' errors'
        ) +
        ' detected. The IDE is judging you.';

}


/* =====================================================
   HIDE ERROR BANNER
===================================================== */

function hideError() {

    bannerVisible =
        false;


    banner.classList.remove(
        'show'
    );


    bannerMessage.textContent =
        'The IDE is disappointed in you.';


    bannerScore.textContent =
        '💀 Emotional damage cleared.';


    editorStatus.textContent =
        '🟢 Code looks clean. The IDE is reluctantly impressed.';

}


/* =====================================================
   ANALYZE CODE
===================================================== */

function analyze() {

    const text =
        code.value;


    let errors = [];


    /* -----------------------------------------------
       EMPTY EDITOR
    ------------------------------------------------ */

    if (
        text.trim() === ''
    ) {

        errors = [];

    }


    /* -----------------------------------------------
       PYTHON
    ------------------------------------------------ */

    else if (
        language.value ===
        'python'
    ) {

        errors =
            checkPython(
                text
            );

    }


    /* -----------------------------------------------
       JAVASCRIPT
    ------------------------------------------------ */

    else {

        errors =
            checkJavaScript(
                text
            );

    }


    /* -----------------------------------------------
       REMOVE DUPLICATES
    ------------------------------------------------ */

    errors =
        Array.from(
            new Set(
                errors
            )
        );


    /* -----------------------------------------------
       CURRENT NUMBER OF LINES
    ------------------------------------------------ */

    const currentLineCount =
        text
            .split('\\n')
            .length;


    /* -----------------------------------------------
       SAVE FRONTEND ERRORS
    ------------------------------------------------ */

    lastErrors =
        errors;


    /* -----------------------------------------------
       SEND COMPLETE ERROR LIST
       TO BACKEND
    ------------------------------------------------ */

    vscode.postMessage({

        command:
            'syntaxErrors',

        language:
            language.value,

        errors:
            errors,

        lines:
            currentLineCount

    });


    /* -----------------------------------------------
       ERROR BANNER
    ------------------------------------------------ */

    if (
        errors.length > 0
    ) {

        showError(
            errors[0]
        );

    }

    else {

        hideError();

    }

}


/* =====================================================
   DELETION DETECTION
===================================================== */

function detectDeletion() {

    const currentLineCount =
        code.value
            .split('\\n')
            .length;


    const deleted =
        previousLines -
        currentLineCount;


    if (
        deleted >= 3
    ) {

        vscode.postMessage({

            command:
                'deletion',

            lines:
                deleted

        });

    }


    previousLines =
        currentLineCount;
}


/* =====================================================
   INACTIVITY TIMER
===================================================== */

function restartTimer() {

    if (
        inactivityTimer
    ) {

        clearTimeout(
            inactivityTimer
        );

    }


    inactivityTimer =
        setTimeout(
            function () {

                vscode.postMessage({

                    command:
                        'inactivity'

                });

            },
            30000
        );

}


/* =====================================================
   CODE INPUT
===================================================== */

code.addEventListener(
    'input',
    function () {

        /* ---------------------------------------------
           Update line numbers
        ---------------------------------------------- */

        updateLineNumbers();


        /* ---------------------------------------------
           Detect deletion
        ---------------------------------------------- */

        detectDeletion();


        /* ---------------------------------------------
           Restart inactivity timer
        ---------------------------------------------- */

        restartTimer();


        /* ---------------------------------------------
           Tell backend user is active
        ---------------------------------------------- */

        vscode.postMessage({

            command:
                'typing'

        });


        /* ---------------------------------------------
           Wait briefly before analysis
        ---------------------------------------------- */

        if (
            analysisTimer
        ) {

            clearTimeout(
                analysisTimer
            );

        }


        analysisTimer =
            setTimeout(
                function () {

                    analyze();

                },
                150
            );

    }
);


/* =====================================================
   LANGUAGE CHANGE
===================================================== */

language.addEventListener(
    'change',
    function () {

        lastErrors = [];

        analyze();

    }
);


/* =====================================================
   RESET BUTTON
===================================================== */

reset.addEventListener(
    'click',
    function () {

        code.value = '';

        previousLines = 1;

        lastErrors = [];

        currentDamage = 0;

        targetDamage = 0;

        bannerVisible = false;


        banner.classList.remove(
            'show'
        );


        updateLineNumbers();


        setDamage(0);


        vscode.postMessage({

            command:
                'reset'

        });


        restartTimer();

    }
);


/* =====================================================
   RECEIVE BACKEND DATA
===================================================== */

window.addEventListener(
    'message',
    function (event) {

        const data =
            event.data;


        if (
            data.type ===
            'update'
        ) {

            /* -----------------------------------------
               Backend is source of truth
            ------------------------------------------ */

            setDamage(
                data.damage || 0
            );


            /* -----------------------------------------
               Events
            ------------------------------------------ */

            events.textContent =
                data.events || 0;


            /* -----------------------------------------
               History
            ------------------------------------------ */

            renderHistory(
                data.history || []
            );


            /* -----------------------------------------
               ACTIVE ERRORS
            ------------------------------------------ */

            const errorCount =
                data.errors || 0;


            errorInfo.textContent =
                errorCount +
                (
                    errorCount === 1
                        ? ' active error'
                        : ' active errors'
                );


            /* -----------------------------------------
               DAMAGE EXPLANATION
            ------------------------------------------ */

            if (
                errorCount > 0 &&
                data.lines
            ) {

                const damagePerError =
                    Math.round(
                        100 /
                        (data.lines + 1)
                    );


                damageExplanation.textContent =
                    damagePerError +
                    '% per error • ' +
                    data.lines +
                    ' lines';

            }

            else {

                damageExplanation.textContent =
                    'Damage decreases as your code grows.';

            }


            /* -----------------------------------------
               BANNER SCORE
            ------------------------------------------ */

            if (
                bannerVisible
            ) {

                bannerScore.textContent =
                    '💀 EMOTIONAL DAMAGE: ' +
                    (data.damage || 0) +
                    '%';

            }

        }

    }
);


/* =====================================================
   HISTORY RENDERING
===================================================== */

function renderHistory(
    items
) {

    if (
        items.length === 0
    ) {

        historyContainer.innerHTML =
            '<div class="empty">' +
            'No emotional damage yet.' +
            '<br><br>' +
            'Start coding...' +
            '</div>';

        return;

    }


    let html = '';


    const reversed =
        items
            .slice()
            .reverse();


    reversed.forEach(
        function (item) {

            html +=

                '<div class="historyItem">' +

                    '<div class="historyType">' +

                        item.icon +
                        ' ' +
                        item.type.toUpperCase() +
                        ' • ' +
                        item.time +

                    '</div>' +

                    '<div class="historyText">' +

                        escapeHTML(
                            item.roast
                        ) +

                    '</div>' +

                '</div>';

        }
    );


    historyContainer.innerHTML =
        html;

}


/* =====================================================
   ESCAPE HTML
===================================================== */

function escapeHTML(
    text
) {

    const div =
        document.createElement(
            'div'
        );


    div.textContent =
        text || '';


    return div.innerHTML;

}


/* =====================================================
   INITIALIZE
===================================================== */

updateLineNumbers();

setDamage(0);

restartTimer();


</script>

</body>

</html>`;
}


/* =====================================================
   DEACTIVATE
===================================================== */

function deactivate() {

    if (
        inactivityTimer
    ) {

        clearTimeout(
            inactivityTimer
        );

        inactivityTimer =
            null;

    }


    if (
        deletionTimer
    ) {

        clearTimeout(
            deletionTimer
        );

        deletionTimer =
            null;

    }


    if (panel) {

        panel.dispose();

        panel = null;

    }

}


module.exports = {

    activate,

    deactivate

};