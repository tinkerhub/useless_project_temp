// ============================================
// BROKEGPT - FINANCIAL ANALYSIS
// ============================================


// --------------------------------------------
// 0. AUDIO UNLOCK (fixes "audio not playing")


const brokeGPTAudioElement = new Audio();
brokeGPTAudioElement.volume = 1.0;


let lastRoastResult = null;

function unlockBrokeGPTAudio() {

    
    brokeGPTAudioElement.src =
        "data:audio/mpeg;base64,//uQxAAAAAAAAAAAAAAAAAAAAAAAWGluZwAAAA8AAAACAAACcQCA";

    const unlockPromise =
        brokeGPTAudioElement.play();

    if (unlockPromise) {

        unlockPromise
            .then(function () {
                brokeGPTAudioElement.pause();
                brokeGPTAudioElement.currentTime = 0;
            })
            .catch(function () {
                // Ignore - some browsers don't need this at all
            });
    }
}


// --------------------------------------------
// 1. CLASSIFY BALANCE
// --------------------------------------------

function getFinancialCategory(balance) {

    if (balance <= 999) {

        return {
            category: "💀 POOR",

            messages: poorRoastMessages,

            audios: [
                "audio/poor/thani.mpeg.mp3",
                "audio/poor/aadu.mp3",
                "audio/poor/hashir.mp3",
                "audio/poor/lowlevel.mp3",
                "audio/poor/nanban.mp3",
                "audio/poor/nivin.mp3",
                
            ]
        };

    } else {

        return {
            category: "🤑 RICH",

            messages: richRoastMessages,

            audios: [
                "audio/rich/lucky.mp3",
                "audio/rich/3 kodi.mp3",
                "audio/rich/amazing.mp3",
                "audio/rich/badass.mp3",
                "audio/rich/kodikal.mp3",
                "audio/rich/mrmaru.mp3"
            ]
        };
    }
}




const poorRoastMessages = [
    "Bro, ee balance kandittu ATM thanne sorry paranju.💀",
    "Ninte balance kandu Google Pay polum 'try again later' ennu paranju. 😭",
    "Kashtam mone... ee balance vechu oru chaya polum kudikkan pattilla. ☕😢",
    "Ninte account balance-um, sunday holiday-um oru pole aanu — onnum illa. 📉",
    "Gulf-il poyittu polum ee mathiri balance kanditilla mone. Straight-a veetil poyi irikku. ✈️😅",
    "ATM-il card vachappol machine thanne 'ni ithinu vendi vannathano' ennu chodichu. 🤖💀",
    "Brode bank account ippo survival mode-il aanu.🎬😭"
];

const richRoastMessages = [
    "Brode account-il paisa undu, pakshe future illa.🍛😭",
    "Eda mone, ee balance kandu bank manager-e polum chaya kudikkan vilichu! 🤑☕",
    "Ninte account balance kandu Ambani polum oru 'like' kotukkum. 💸😎",
    "Ithra paisa kandittu account thanne proud aayi.👑",
    "Balance kandittu ATM thanne 'sir' ennu vilikkan thudangi. 🏧🙏",
    "Ee kaashinu, Kerala-il oru sqft polum vaangan pattilla, pakshe feeling billionaire aanu. 😂💰",
    "Ninte balance kandu, next flight Dubai-ku alla, Alps-inu aanu venam. ✈️🏔️",
    "Pavam RICH ennu vilikkanam, pakshe first class-il alla, sleeper class-il tanne poyikko. 🚆😅",
    "Balance kandu njan polum oru selfie eduthu, 'wealthy friend circle' kaanikkan. 📸🤑"
];




function getRandomItem(list) {

    if (!list || list.length === 0) {
        return null;
    }

    const randomIndex =
        Math.floor(Math.random() * list.length);

    return list[randomIndex];
}

// Kept as an alias so nothing else has to change name
const getRandomAudio = getRandomItem;


// --------------------------------------------
// 3. EXTRACT BALANCE FROM OCR TEXT
// --------------------------------------------

function extractBalance(text) {

    console.log("OCR TEXT:");
    console.log(text);

    // Convert OCR text into lowercase
    const lowerText = text.toLowerCase();


    // ----------------------------------------
    // Look for balance-related words
    // ----------------------------------------

    const balanceKeywords = [
        "available balance",
        "available bal",
        "avail balance",
        "balance available",
        "current balance",
        "account balance",
        "total balance",
        "balance"
    ];


    // ----------------------------------------
    // Try to find a balance keyword
    // ----------------------------------------

    for (const keyword of balanceKeywords) {

        const keywordIndex = lowerText.indexOf(keyword);

        if (keywordIndex !== -1) {

            // Take the text after the keyword
            const textAfterKeyword =
                text.substring(keywordIndex);

            console.log(
                "Text around balance:",
                textAfterKeyword
            );


            // --------------------------------
            // Look for ₹ / Rs / INR
            // --------------------------------

            const currencyMatch =
                textAfterKeyword.match(
                    /(?:₹|rs\.?|inr)\s*([0-9][0-9,\s]*(?:\.[0-9]{1,2})?)/i
                );


            if (currencyMatch) {

                const number =
                    currencyMatch[1]
                        .replace(/,/g, "")
                        .replace(/\s/g, "");

                const balance =
                    parseFloat(number);

                if (!isNaN(balance)) {
                    return balance;
                }
            }


            // --------------------------------
            // If currency symbol was missed
            // --------------------------------

            const numberMatch =
                textAfterKeyword.match(
                    /\b([0-9]{1,3}(?:,[0-9]{2,3})*(?:\.[0-9]{1,2})?)\b/
                );


            if (numberMatch) {

                const number =
                    numberMatch[1].replace(/,/g, "");

                const balance =
                    parseFloat(number);

                if (!isNaN(balance)) {
                    return balance;
                }
            }
        }
    }


    // ----------------------------------------
    // Try currency search in entire OCR text
    // ----------------------------------------

    const fullCurrencyMatch =
        text.match(
            /(?:₹|rs\.?|inr)\s*([0-9][0-9,\s]*(?:\.[0-9]{1,2})?)/i
        );


    if (fullCurrencyMatch) {

        const number =
            fullCurrencyMatch[1]
                .replace(/,/g, "")
                .replace(/\s/g, "");

        const balance =
            parseFloat(number);

        if (!isNaN(balance)) {
            return balance;
        }
    }


    // ----------------------------------------
    // LAST RESORT: no keyword and no currency
    // symbol matched at all (common when OCR
    // misreads ₹/Rs on a photographed screen).
    //
    // Look for a decimal money-shaped number
    // anywhere in the text (e.g. "1,234.56" or
    // "0.24"). Decimal amounts are preferred
    // because they rarely appear in account
    // numbers / phone numbers / dates, so this
    // is a fairly safe guess.
    // ----------------------------------------

    const decimalNumberMatches =
        text.match(
            /\b[0-9]{1,3}(?:,[0-9]{2,3})*\.[0-9]{1,2}\b/g
        );

    if (decimalNumberMatches && decimalNumberMatches.length > 0) {

        const number =
            decimalNumberMatches[0].replace(/,/g, "");

        const balance =
            parseFloat(number);

        if (!isNaN(balance)) {

            console.log(
                "Balance found via fallback decimal match:",
                balance
            );

            return balance;
        }
    }


    // ----------------------------------------
    // Nothing found
    // ----------------------------------------

    return null;
}


// --------------------------------------------
// 4. ANALYZE IMAGE
// --------------------------------------------

async function analyzeBalanceImage(imageSource) {

    console.log("Starting OCR...");


    const result =
        await Tesseract.recognize(
            imageSource,
            "eng",
            {
                logger: function (info) {

                    console.log(info);
                }
            }
        );


    const ocrText =
        result.data.text;


    console.log("OCR completed.");
    console.log(ocrText);


    // Get balance
    const balance =
        extractBalance(ocrText);


    if (balance === null) {

        return {
            success: false,

            message:
                "Sorry 😭 BrokeGPT couldn't find your balance. Try a clearer image."
        };
    }


    // Classify balance
    const financialResult =
        getFinancialCategory(balance);


    // Pick a random Manglish roast line
    const message =
        getRandomItem(
            financialResult.messages
        );


    // Choose audio
    const audio =
        getRandomAudio(
            financialResult.audios
        );


    return {

        success: true,

        balance: balance,

        category:
            financialResult.category,

        message: message,

        audio: audio
    };
}


// --------------------------------------------
// 5. PLAY AUDIO
// --------------------------------------------

function playBrokeGPTAudio(audioPath) {

    if (!audioPath) {
        return;
    }


    console.log("Playing audio:");
    console.log(audioPath);


    // Reuse the SAME element we unlocked on click,
    // instead of `new Audio(...)`, so the browser
    // still treats this as continuing an
    // already-permitted playback session.
    brokeGPTAudioElement.src =
        audioPath;

    brokeGPTAudioElement.currentTime = 0;

    brokeGPTAudioElement.play()
        .then(function () {

            console.log("AUDIO PLAYING 🎵");

        })
        .catch(function (error) {

            console.error(
                "Audio could not play. Path tried:",
                audioPath
            );

            console.error(
                "Error name:",
                error.name
            );

            console.error(
                "Error message:",
                error.message
            );

            const mediaError =
                brokeGPTAudioElement.error;

            if (mediaError) {

                // 1 = ABORTED, 2 = NETWORK, 3 = DECODE,
                // 4 = SRC_NOT_SUPPORTED (this is what you
                // get for a 404 / wrong path / missing file)
                console.error(
                    "MediaError code:",
                    mediaError.code
                );
            }

            if (error.name === "NotAllowedError") {

                alert(
                    "Your browser blocked the audio. Please click the page once and try again."
                );

            } else {

                alert(
                    "Could not load this audio file:\n" +
                    audioPath +
                    "\n\nCheck that this file actually exists at that path relative to your HTML file (open DevTools Console for details)."
                );
            }
        });
}


// --------------------------------------------
// 5b. ROAST METER ANIMATION
// --------------------------------------------
//
// Swings the gauge needle through a few quick
// "suspense" positions, then settles on the
// real position with a bouncy overshoot, like
// a mechanical dial. Purely cosmetic — driven
// off `balance`, capped so extreme numbers
// don't break the dial.
//
// Returns the total animation time in ms, so
// the caller can time the text/audio reveal to
// land right as the needle stops moving.
// --------------------------------------------

const ROAST_METER_CAP = 100000; // ₹ at which the needle maxes out
const ROAST_METER_MIN_ANGLE = -85; // degrees, leftmost ("BROKE")
const ROAST_METER_MAX_ANGLE = 85;  // degrees, rightmost ("LOADED")

const roastMeterCaptions = [
    "calculating financial damage...",
    "consulting the broke-o-meter...",
    "cross-checking with your dignity...",
    "running the numbers (it's bad)..."
];

function animateRoastMeter(balance) {

    const needleGroup =
        document.getElementById("meterNeedleGroup");

    const caption =
        document.getElementById("meterCaption");

    if (!needleGroup) {
        return 0;
    }


    // ------------------------------------
    // Work out where the needle should end up
    // ------------------------------------

    const clampedBalance =
        Math.min(Math.max(balance, 0), ROAST_METER_CAP);

    const normalized =
        clampedBalance / ROAST_METER_CAP;

    const finalAngle =
        ROAST_METER_MIN_ANGLE +
        normalized * (ROAST_METER_MAX_ANGLE - ROAST_METER_MIN_ANGLE);


    // ------------------------------------
    // Snap back to the start with no
    // transition, in case this isn't the
    // first scan and the needle is still
    // sitting wherever it last landed
    // ------------------------------------

    needleGroup.style.transition = "none";
    needleGroup.style.transform =
        "rotate(" + ROAST_METER_MIN_ANGLE + "deg)";

    // Force a reflow so the browser registers the
    // instant jump above before we re-enable
    // transitions for the swings below
    void needleGroup.offsetWidth;


    // ------------------------------------
    // A few quick fake swings for suspense
    // before the real answer lands
    // ------------------------------------

    const suspenseSwings = [55, -70, 30, -40];
    const swingStep = 220; // ms per suspense swing

    let elapsed = 0;

    needleGroup.style.transition =
        "transform " + (swingStep / 1000) + "s ease-in-out";

    suspenseSwings.forEach(function (angle, index) {

        setTimeout(function () {

            needleGroup.style.transform =
                "rotate(" + angle + "deg)";

            if (caption) {
                caption.textContent =
                    roastMeterCaptions[
                        index % roastMeterCaptions.length
                    ];
            }

        }, elapsed);

        elapsed += swingStep;
    });


    // ------------------------------------
    // Final settle: slower, elastic overshoot
    // ------------------------------------

    const settleDuration = 900; // ms

    setTimeout(function () {

        needleGroup.style.transition =
            "transform " +
            (settleDuration / 1000) +
            "s cubic-bezier(0.34, 1.56, 0.64, 1)";

        needleGroup.style.transform =
            "rotate(" + finalAngle + "deg)";

        if (caption) {
            caption.textContent = "";
        }

    }, elapsed);


    return elapsed + settleDuration;
}


// --------------------------------------------
// 6. DISPLAY RESULT
// --------------------------------------------

function displayBrokeGPTResult(result) {

    const resultSection =
        document.getElementById("resultSection");

    const resultCard =
        document.querySelector(".result-card");

    const balanceText =
        document.getElementById("balanceText");

    const categoryText =
        document.getElementById("categoryText");

    const roastMessage =
        document.getElementById("roastMessage");

    const shareButton =
        document.getElementById("shareButton");


    // ----------------------------------------
    // Reset the reveal state from any previous run
    // ----------------------------------------

    [balanceText, categoryText].forEach(
        function (el) {
            el.classList.remove("show");
        }
    );

    roastMessage.classList.remove("show");
    roastMessage.textContent = "";

    categoryText.classList.remove("glitch-text");

    if (resultCard) {
        resultCard.classList.remove("glitch-active");
    }

    if (shareButton) {
        shareButton.style.display = "none";
    }


    // ----------------------------------------
    // If balance was not found
    // ----------------------------------------
    // (no need for meter suspense here - go
    // straight to the message)

    if (!result.success) {

        balanceText.innerText =
            "Balance: Not Found 😭";

        categoryText.innerText =
            "🤷 UNKNOWN";

        resultSection.style.display =
            "block";

        requestAnimationFrame(function () {

            [balanceText, categoryText].forEach(
                function (el) {
                    el.classList.add("show");
                }
            );

            roastMessage.classList.add("show");

            typewriterEffect(
                roastMessage,
                result.message,
                25
            );

        });

        return;
    }


    // ----------------------------------------
    // Fill in the text NOW, but it stays
    // invisible (see .reveal-text CSS) until
    // the roast meter finishes its animation
    // ----------------------------------------

    balanceText.innerText =
        "Available Balance: ₹" +
        result.balance;

    categoryText.innerText =
        result.category;


    // Keep this result around so the share
    // button can build the card later
    lastRoastResult = result;


    // ----------------------------------------
    // Show result section (meter is visible
    // and starts swinging immediately; the
    // text below it is still hidden)
    // ----------------------------------------

    resultSection.style.display =
        "block";

    const meterDuration =
        animateRoastMeter(result.balance);


    // ----------------------------------------
    // Once the needle settles: reveal balance
    // + category, fire the category effect
    // (confetti / glitch), play audio, then
    // type out the roast line. The share
    // button appears once typing finishes.
    // ----------------------------------------

    setTimeout(function () {

        [balanceText, categoryText].forEach(
            function (el) {
                el.classList.add("show");
            }
        );

        triggerCategoryEffect(
            result.category,
            resultCard,
            categoryText
        );

        if (result.audio) {

            playBrokeGPTAudio(
                result.audio
            );
        }

        roastMessage.classList.add("show");

        typewriterEffect(
            roastMessage,
            result.message,
            25,
            function () {

                if (shareButton) {
                    shareButton.style.display =
                        "inline-block";
                }

            }
        );

    }, meterDuration);
}


// --------------------------------------------
// 6b. TYPEWRITER EFFECT
// --------------------------------------------

function typewriterEffect(element, text, speedMs, onDone) {

    element.textContent = "";

    let index = 0;

    // Build the string ourselves instead of doing
    // element.innerText += char, which reads the
    // RENDERED text back on every tick — and a
    // trailing space is often collapsed away by
    // the browser right before the next character
    // lands, silently eating spaces from the output.
    let builtText = "";

    function typeNextChar() {

        if (index < text.length) {

            builtText +=
                text.charAt(index);

            element.textContent =
                builtText;

            index++;

            setTimeout(typeNextChar, speedMs);

        } else if (onDone) {

            onDone();
        }
    }

    typeNextChar();
}


// --------------------------------------------
// 6c. CATEGORY EFFECT (confetti / glitch)
// --------------------------------------------

function triggerCategoryEffect(category, resultCard, categoryText) {

    const isRich =
        category.indexOf("RICH") !== -1;

    if (isRich) {

        if (typeof confetti === "function") {

            confetti({
                particleCount: 140,
                spread: 80,
                startVelocity: 45,
                origin: { y: 0.6 }
            });

            // second smaller burst for a bit more flair
            setTimeout(function () {

                confetti({
                    particleCount: 60,
                    spread: 100,
                    origin: { y: 0.55 }
                });

            }, 250);
        }

    } else {

        if (resultCard) {

            resultCard.classList.add("glitch-active");

            setTimeout(function () {
                resultCard.classList.remove("glitch-active");
            }, 550);
        }

        if (categoryText) {

            categoryText.classList.add("glitch-text");

            setTimeout(function () {
                categoryText.classList.remove("glitch-text");
            }, 450);
        }
    }
}


// --------------------------------------------
// 7. MAIN FUNCTION
// --------------------------------------------

async function runBrokeGPTAnalysis(imageSource) {

    try {

        console.log(
            "BrokeGPT analysis started..."
        );


        const result =
            await analyzeBalanceImage(
                imageSource
            );


        displayBrokeGPTResult(
            result
        );


    } catch (error) {

        console.error(
            "Analysis error:",
            error
        );


        alert(
            "Something went wrong while analyzing the image. 😭"
        );
    }
}


// --------------------------------------------
// 8. SHARE CARD (screenshot via html2canvas)
// --------------------------------------------

function generateShareCard() {

    if (!lastRoastResult) {
        return;
    }

    const shareCard =
        document.getElementById("shareCard");

    const shareButton =
        document.getElementById("shareButton");

    if (!shareCard || typeof html2canvas !== "function") {
        return;
    }


    // ----------------------------------------
    // Fill in the offscreen template
    // ----------------------------------------

    const isRich =
        lastRoastResult.category.indexOf("RICH") !== -1;

    document.getElementById("shareCardEmoji").innerText =
        isRich ? "🤑" : "💀";

    document.getElementById("shareCardCategory").innerText =
        lastRoastResult.category;

    document.getElementById("shareCardBalance").innerText =
        "Balance: ₹" + lastRoastResult.balance;

    document.getElementById("shareCardRoast").innerText =
        lastRoastResult.message;


    // ----------------------------------------
    // Show a "generating..." state on the button
    // ----------------------------------------

    const originalButtonText =
        shareButton ? shareButton.innerText : "";

    if (shareButton) {
        shareButton.innerText = "📸 GENERATING...";
        shareButton.disabled = true;
    }


    // ----------------------------------------
    // Capture, then download (and use the
    // native share sheet on mobile if available)
    // ----------------------------------------

    html2canvas(shareCard, {
        backgroundColor: null,
        scale: 2
    }).then(function (canvas) {

        canvas.toBlob(function (blob) {

            if (!blob) {
                return;
            }

            const fileName =
                "brokegpt-roast.png";

            const file =
                new File([blob], fileName, { type: "image/png" });


            // Prefer the native share sheet on mobile
            if (
                navigator.canShare &&
                navigator.canShare({ files: [file] })
            ) {

                navigator.share({
                    files: [file],
                    title: "BrokeGPT Roast",
                    text: "I just got roasted by BrokeGPT 💀"
                }).catch(function () {
                    // user cancelled the share sheet - ignore
                });

            } else {

                // Fallback: trigger a plain download
                const url =
                    URL.createObjectURL(blob);

                const link =
                    document.createElement("a");

                link.href = url;
                link.download = fileName;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);

                setTimeout(function () {
                    URL.revokeObjectURL(url);
                }, 5000);
            }

            if (shareButton) {
                shareButton.innerText = originalButtonText;
                shareButton.disabled = false;
            }

        }, "image/png");

    }).catch(function (error) {

        console.error("Could not generate share card:", error);

        if (shareButton) {
            shareButton.innerText = originalButtonText;
            shareButton.disabled = false;
        }

        alert("Couldn't generate the share image 😭 try again.");
    });
}


const shareButtonElement =
    document.getElementById("shareButton");

if (shareButtonElement) {

    shareButtonElement.addEventListener(
        "click",
        generateShareCard
    );
}