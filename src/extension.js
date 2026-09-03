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
   ACTIVE ERROR STATE
===================================================== */

/*
   Every active syntax error is stored separately.

   Example:

   {
      "Line 1: expected ':'",
      "Line 4: expected ':'"
   }

   size = 2

   Therefore:
   2 × 25 = 50% damage
*/

let activeSyntaxErrors = new Set();


/*
   Inactivity damage is either active or inactive.
*/

let inactivityDamageActive = false;


/*
   Deletion damage is temporary.
*/

let temporaryDamage = 0;


/* =====================================================
   DAMAGE VALUES
===================================================== */

const DAMAGE = {

    syntax: 25,

    deletion: 40,

    inactivity: 15

};


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
            openDashboard
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
       REAL VS CODE DIAGNOSTICS
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


                const errors =
                    diagnosticsList
                        .filter(
                            function (diagnostic) {

                                return (
                                    diagnostic.severity ===
                                    vscode.DiagnosticSeverity.Error
                                );

                            }
                        );


                /*
                   We don't directly modify the damage here.

                   The dashboard performs its own analysis
                   and sends the complete active error list.
                */

                console.log(
                    'VS Code errors:',
                    errors.length
                );

            }
        );


    context.subscriptions.push(
        diagnostics
    );
}


/* =====================================================
   CALCULATE CURRENT DAMAGE
===================================================== */

function calculateActiveDamage() {

    /*
       Every active syntax error = 25%.

       0 errors = 0%
       1 error  = 25%
       2 errors = 50%
       3 errors = 75%
       4 errors = 100%
    */

    const syntaxDamage =
        activeSyntaxErrors.size *
        DAMAGE.syntax;


    const inactivityDamage =
        inactivityDamageActive
            ? DAMAGE.inactivity
            : 0;


    activeDamage =
        syntaxDamage +
        inactivityDamage +
        temporaryDamage;


    /*
       Maximum damage = 100%.
    */

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
            history

    });
}


/* =====================================================
   UPDATE ACTIVE SYNTAX ERRORS
===================================================== */

async function updateSyntaxErrors(
    errors,
    language
) {

    /*
       Convert incoming errors into a Set.

       This removes duplicates.

       Because our errors contain line numbers,
       different lines remain different errors.
    */

    const newErrors =
        new Set(
            errors || []
        );


    const oldErrors =
        activeSyntaxErrors;


    /*
       Find errors that were NOT present before.

       Only these count as new damage events.
    */

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


    /*
       IMPORTANT:

       Replace the complete active error list.

       If an error is fixed, it disappears here.

       Example:

       Before:
       [Line 1, Line 2]

       After fixing Line 1:
       [Line 2]

       Damage:
       50% -> 25%
    */

    activeSyntaxErrors =
        newErrors;


    /*
       Create history only for newly detected errors.
    */

    for (
        const error of newlyAddedErrors
    ) {

        eventCount++;


        /* ---------------------------------------------
           SOUND
        --------------------------------------------- */

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


        /* ---------------------------------------------
           AI ROAST
        --------------------------------------------- */

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


        /* ---------------------------------------------
           HISTORY
        --------------------------------------------- */

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


        /*
           Keep only the latest 15 events.
        */

        if (
            history.length >
            15
        ) {

            history.shift();

        }

    }


    /*
       Recalculate immediately.
    */

    calculateActiveDamage();


    updateDashboard();
}


/* =====================================================
   TRIGGER DELETION / INACTIVITY
===================================================== */

async function triggerPunishment(
    type,
    details
) {

    details =
        details || {};


    /* =================================================
       DELETION
    ================================================= */

    if (
        type === 'deletion'
    ) {

        eventCount++;


        temporaryDamage =
            Math.min(
                100,
                temporaryDamage +
                DAMAGE.deletion
            );


        /*
           Reset deletion timer.
        */

        if (
            deletionTimer
        ) {

            clearTimeout(
                deletionTimer
            );

        }


        /*
           Deletion damage disappears
           after 8 seconds.
        */

        deletionTimer =
            setTimeout(
                function () {

                    temporaryDamage = 0;

                    updateDashboard();

                },
                8000
            );

    }


    /* =================================================
       INACTIVITY
    ================================================= */

    if (
        type === 'inactivity'
    ) {

        /*
           Don't repeatedly punish the same
           inactivity period.
        */

        if (
            inactivityDamageActive
        ) {

            return;

        }


        inactivityDamageActive =
            true;


        eventCount++;

    }


    /* =================================================
       SOUND
    ================================================= */

    try {

        audioEngine.playSound(
            type
        );

    } catch (soundError) {

        console.error(
            'Sound error:',
            soundError.message
        );

    }


    /* =================================================
       AI ROAST
    ================================================= */

    let roast;


    try {

        roast =
            await aiRoast
                .generateEmotionalDamage(
                    type,
                    details
                );

    } catch (aiError) {

        console.error(
            'AI error:',
            aiError.message
        );


        roast =
            '💀 Emotional damage detected.';

    }


    /* =================================================
       ICON
    ================================================= */

    let icon = '💀';


    if (
        type === 'deletion'
    ) {

        icon = '🎻';

    }


    if (
        type === 'inactivity'
    ) {

        icon = '🥱';

    }


    /* =================================================
       ADD HISTORY
    ================================================= */

    history.push({

        type:
            type,

        icon:
            icon,

        roast:
            roast,

        time:
            new Date()
                .toLocaleTimeString()

    });


    if (
        history.length >
        15
    ) {

        history.shift();

    }


    updateDashboard();
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
       RECEIVE MESSAGES
    ================================================= */

    panel.webview.onDidReceiveMessage(
        async function (message) {


            /* =========================================
               ALL ACTIVE SYNTAX ERRORS
            ========================================== */

            if (
                message.command ===
                'syntaxErrors'
            ) {

                await updateSyntaxErrors(
                    message.errors || [],
                    message.language ||
                        'unknown'
                );

            }


            /* =========================================
               DELETION
            ========================================== */

            if (
                message.command ===
                'deletion'
            ) {

                await triggerPunishment(
                    'deletion',
                    {
                        lines:
                            message.lines
                    }
                );

            }


            /* =========================================
               INACTIVITY
            ========================================== */

            if (
                message.command ===
                'inactivity'
            ) {

                await triggerPunishment(
                    'inactivity'
                );

            }


            /* =========================================
               USER STARTED TYPING
            ========================================== */

            if (
                message.command ===
                'typing'
            ) {

                /*
                   Typing cancels inactivity damage.
                */

                inactivityDamageActive =
                    false;


                restartInactivityTimer();


                updateDashboard();

            }


            /* =========================================
               RESET
            ========================================== */

            if (
                message.command ===
                'reset'
            ) {

                activeDamage = 0;

                eventCount = 0;

                history = [];

                activeSyntaxErrors =
                    new Set();

                inactivityDamageActive =
                    false;

                temporaryDamage = 0;


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


                updateDashboard();

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

                    panel.webview.postMessage({

                        type:
                            'inactivityWarning'

                    });


                    triggerPunishment(
                        'inactivity'
                    );

                }

            },
            30000
        );
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

    width: 52px;

    height: 52px;

    display: flex;

    align-items: center;

    justify-content: center;

    border-radius: 16px;

    font-size: 27px;

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

    font-size: 25px;
}


.subtitle {

    margin-top: 3px;

    color: #a99db5;

    font-size: 12px;
}


.live {

    padding: 8px 13px;

    border-radius: 30px;

    background:
        rgba(65,210,120,.10);

    border:
        1px solid
        rgba(100,240,150,.25);

    color: #7df3a6;

    font-size: 11px;
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
   MAIN
===================================================== */

.main {

    display: grid;

    grid-template-columns:
        minmax(0, 2fr)
        minmax(280px, 1fr);

    gap: 18px;
}


/* =====================================================
   PANEL
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

    padding: 14px 17px;

    display: flex;

    align-items: center;

    justify-content:
        space-between;

    border-bottom:
        1px solid
        rgba(255,255,255,.07);
}


.panelTitle {

    font-weight: 800;

    font-size: 13px;
}


/* =====================================================
   SELECT
===================================================== */

select {

    border:
        1px solid
        rgba(255,255,255,.1);

    border-radius: 9px;

    background:
        #211a2b;

    color: white;

    padding:
        7px 10px;

    outline: none;
}


/* =====================================================
   EDITOR
===================================================== */

.editor {

    display: flex;

    height: 470px;

    background:
        #0a080d;
}


.lineNumbers {

    width: 52px;

    padding:
        17px 10px;

    text-align: right;

    color: #574d61;

    font-family:
        Consolas,
        monospace;

    font-size: 13px;

    line-height: 21px;

    user-select: none;

    border-right:
        1px solid
        rgba(255,255,255,.05);
}


textarea {

    flex: 1;

    padding: 17px;

    border: 0;

    outline: 0;

    resize: none;

    background:
        transparent;

    color: #e8e0ef;

    font-family:
        Consolas,
        "Courier New",
        monospace;

    font-size: 14px;

    line-height: 21px;

    tab-size: 4;
}


textarea::selection {

    background:
        rgba(139,92,246,.4);
}


/* =====================================================
   FOOTER
===================================================== */

.editorFooter {

    padding:
        11px 15px;

    display: flex;

    justify-content:
        space-between;

    align-items: center;

    color: #786d82;

    font-size: 11px;

    border-top:
        1px solid
        rgba(255,255,255,.06);
}


button {

    border: 0;

    border-radius: 9px;

    padding:
        8px 13px;

    cursor: pointer;

    color: white;

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

    padding: 20px;
}


.monitorTitle {

    color: #9d91a8;

    font-size: 11px;

    text-transform:
        uppercase;
}


.bigDamage {

    margin:
        18px 0;

    text-align: center;

    font-size: 62px;

    font-weight: 900;

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

    height: 9px;

    overflow: hidden;

    border-radius: 20px;

    background:
        #28212f;
}


.progressBar {

    width: 0%;

    height: 100%;

    border-radius: 20px;

    background:
        linear-gradient(
            90deg,
            #8b5cf6,
            #ec4899
        );

    transition:
        width .25s ease;
}


.watching {

    margin-top: 18px;

    padding: 10px;

    text-align: center;

    border-radius: 10px;

    color: #73e6a0;

    background:
        rgba(80,220,120,.08);
}


/* =====================================================
   HISTORY
===================================================== */

.history {

    margin-top: 18px;

    max-height: 280px;

    overflow-y: auto;

    padding: 15px;
}


.historyItem {

    margin-bottom: 10px;

    padding: 11px;

    border-radius: 11px;

    background:
        #17121e;

    border-left:
        3px solid
        #a276f7;
}


.historyType {

    color: #a88bdf;

    font-size: 10px;

    font-weight: 800;
}


.historyText {

    margin-top: 5px;

    color: #d1c8d8;

    font-size: 11px;

    white-space: pre-wrap;
}


.empty {

    padding: 30px;

    text-align: center;

    color: #655b6c;

    font-size: 11px;
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
            Current Damage
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


            <div class="progress">

                <div
                    id="progressBar"
                    class="progressBar"
                ></div>

            </div>


            <div class="watching">
                🟢 SYSTEM WATCHING
            </div>

        </div>

    </div>


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
   DAMAGE DISPLAY
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


    bigDamage.classList.remove(
        'pulse'
    );


    void bigDamage.offsetWidth;


    bigDamage.classList.add(
        'pulse'
    );


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
            .split('\n')
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

        ')':
            '(',

        ']':
            '[',

        '}':
            '{'

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


    /*
       Bracket error.
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


    const rows =
        text.split('\n');


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


        /*
           Python statements that
           require a colon.
        */

        const pattern =
            /^(def|class|if|elif|else|for|while|try|except|finally|with)\b/;


        if (
            pattern.test(row)
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

    }


    return errors;
}


/* =====================================================
   JAVASCRIPT CHECKER
===================================================== */

function checkJavaScript(text) {

    const errors = [];


    /*
       Bracket errors.
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


    const rows =
        text.split('\n');


    for (
        let i = 0;
        i < rows.length;
        i++
    ) {

        const row =
            rows[i].trim();


        /*
           Function declaration.
        */

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


        /*
           console.log error.
        */

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

    }


    return errors;
}


/* =====================================================
   SHOW ERROR
===================================================== */

function showError(error) {

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
        ' error' +
        (
            lastErrors.length === 1
                ? ''
                : 's'
        ) +
        ' detected. The IDE is judging you.';

}


/* =====================================================
   HIDE ERROR
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


    /*
       Empty editor.
    */

    if (
        text.trim() === ''
    ) {

        errors = [];

    }

    else if (
        language.value ===
        'python'
    ) {

        errors =
            checkPython(
                text
            );

    }

    else {

        errors =
            checkJavaScript(
                text
            );

    }


    /*
       Remove duplicate errors.
    */

    errors =
        Array.from(
            new Set(
                errors
            )
        );


    /*
       Store frontend copy.
    */

    lastErrors =
        errors;


    /*
       Send COMPLETE active error list
       to backend.
    */

    vscode.postMessage({

        command:
            'syntaxErrors',

        language:
            language.value,

        errors:
            errors

    });


    /*
       Show first error in banner.
    */

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

    const currentLines =
        code.value
            .split('\n')
            .length;


    const deleted =
        previousLines -
        currentLines;


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
        currentLines;
}


/* =====================================================
   FRONTEND INACTIVITY TIMER
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

        updateLineNumbers();


        detectDeletion();


        restartTimer();


        /*
           Typing automatically removes
           inactivity damage.
        */

        vscode.postMessage({

            command:
                'typing'

        });


        if (
            analysisTimer
        ) {

            clearTimeout(
                analysisTimer
            );

        }


        /*
           Small delay prevents analysis
           on every single keystroke.
        */

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
   RESET
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
   RECEIVE BACKEND UPDATE
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

            /*
               BACKEND IS THE SINGLE
               SOURCE OF TRUTH.
            */

            setDamage(
                data.damage || 0
            );


            events.textContent =
                data.events || 0;


            renderHistory(
                data.history || []
            );


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
   HISTORY
===================================================== */

function renderHistory(items) {

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

function escapeHTML(text) {

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


    if (panel) {

        panel.dispose();

        panel = null;

    }

}


module.exports = {

    activate,

    deactivate

};