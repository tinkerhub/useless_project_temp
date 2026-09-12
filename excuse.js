/* ================================================
   BUNKVERSE — Excuse Generator Logic
   Astrology-themed random excuse system
   ================================================ */

// ─── Excuse Database ──────────────────────────────
const EXCUSES = {
  late: [
    "According to the stars, your alarm and your destiny had a disagreement last night. The alarm lost.",
    "A rare planetary alignment caused your phone's GPS to direct you to the wrong building for 45 minutes.",
    "Mercury was in retrograde and apparently that affects bus schedules too.",
    "The universe conspired to make every single traffic signal turn red exactly as you approached it.",
    "My horoscope said 'delays are inevitable today' and I took that very literally.",
    "A stray cat crossed my path and I had to wait for a good omen to cancel it out. It took 30 minutes.",
    "I was following my biorhythm cycle which clearly indicated I should arrive fashionably late.",
    "The gravitational pull of my bed was unusually strong this morning. Scientists would be interested.",
    "I was emotionally processing yesterday's class content. It took longer than expected.",
    "The stars said to move slowly today for safety reasons. I respect astronomy.",
    "My Fitbit tracked an extra 2000 steps meaning I definitely took a longer route. Unintentionally.",
    "Auto-wala said 'traffic aanu sir' and who am I to argue with that level of wisdom?"
  ],

  missed: [
    "I was attending an unofficial study session at the canteen. Educational content was discussed.",
    "My body entered a state of emergency rest mode. It's a medical condition. Google it.",
    "I was doing field research on 'the social dynamics of students who don't go to class'.",
    "The subject professor's aura was particularly intense today and I was protecting my energy.",
    "I had a vision that this class would be cancelled. I was pre-emptively correct.",
    "There was an important cricket match situation that required my immediate cultural attention.",
    "I was conducting an experiment on whether the world continues if I skip one class. Results: yes.",
    "My spirit guide indicated this was a rest day. I follow my spirit guide.",
    "I was absorbing the lesson vibrationally from the hostel room. Same thing, basically.",
    "Bus-il oru philosophical discussion started and I couldn't leave midway. Ethics.",
    "I was researching the topic independently online. YouTube counts as research.",
    "I was performing a wellness check on my pillow. It needed company."
  ],

  assignment: [
    "The Wi-Fi went down exactly when I was about to submit. The universe knew.",
    "My laptop achieved enlightenment and refused to open Microsoft Word on principle.",
    "I completed it but my pen ran out of ink in the middle and I interpreted that as a sign to stop.",
    "The dog ate my assignment. I don't have a dog. This makes it more impressive.",
    "I was working on it until 3 AM and saved it as 'final_FINAL_v2_actual_final.docx' which corrupted.",
    "I submitted it spiritually. In another dimension I have 100% submission rate.",
    "My handwriting was too powerful and the paper couldn't handle it.",
    "I was researching how to start it. The research took longer than the assignment would have.",
    "The assignment was so ahead of its time I decided to submit it next week.",
    "Electricity cut for exactly 45 minutes during my writing session. Cosmic timing.",
    "I gave it to my friend to check and he vanished. Completely vanished.",
    "My pen refused to write in protest. I respected its boundaries."
  ],

  forgot: [
    "My memory was operating at reduced capacity due to excessive dream activity last night.",
    "I distinctly remember forgetting. So technically I remembered to forget.",
    "The item was in my bag but my bag developed selective amnesia.",
    "Mercury retrograde specifically targets important items placed near the door.",
    "I left it at home as a philosophical statement about attachment to material things.",
    "My to-do list forgot to remind me. It's been reported for negligence.",
    "I packed it but in another timeline. Cross-dimensional transport issues.",
    "The burden of knowledge I carry daily caused a temporary storage overflow error.",
    "I remembered it exactly 2 minutes after leaving the house. Physics prevents going back.",
    "My subconscious knew I wouldn't need it and made the executive decision.",
    "I was holding it and then I... wasn't. Quantum uncertainty.",
    "I forgot I forgot until just now when you asked. That's technically impressive."
  ],

  bus: [
    "The bus driver decided to take a scenic route through three unfamiliar neighborhoods.",
    "The bus was running on IST — Indian Standard Time, also known as 'whenever it feels ready'.",
    "The bus stopped for 20 minutes because the driver spotted a particularly interesting cloud.",
    "There was a traffic jam caused by a cow having an existential crisis in the middle of the road.",
    "The bus I usually take eloped with another route. Very unprofessional.",
    "An auto-rickshaw challenged the bus to a race and won, forcing the bus to reconsider its route.",
    "The KSRTC bus operated on its own schedule which does not align with any known time zone.",
    "The bus took a philosophical detour. It happens. Public transport has feelings.",
    "I was in the right bus but it went to the wrong place. Or I was in the wrong bus in the right place.",
    "Bus driver anna said 'five minutes' at 7 AM. He has not arrived yet. It is now 9 AM.",
    "The bus achieved consciousness and decided it needed a break.",
    "Three buses passed but all of them were 'full' according to the conductor who had 14 people."
  ],

  sleep: [
    "My REM cycle made an administrative decision to extend itself without consulting me.",
    "I was in the middle of a very important dream and leaving would have been rude.",
    "My body calculated that 4 more hours of sleep would optimize my academic performance. It was right.",
    "The alarm rang but it was in a different room and getting up would have woken everyone. Consideration.",
    "I set 7 alarms. All 7 were snoozed. My discipline is consistent if nothing else.",
    "I closed my eyes for 'just 5 minutes' at 7 AM. It is now 11 AM. Time is relative.",
    "My pillow has developed magnetic properties. Investigation is ongoing.",
    "I was doing restorative yoga. In a horizontal position. For 4 extra hours.",
    "The subject of my dream was actually more educational than the actual class. Argument can be made.",
    "8 hours of sleep is the recommended dose. I was simply following health guidelines responsibly.",
    "Alarm went off. I turned it off. I don't remember turning it off. I have no memory of this."
  ]
};


// ─── Teacher Reactions ─────────────────────────────
const TEACHER_REACTIONS = [
  {
    emoji: "😠",
    text: "SUSPICIOUS 👀",
    sub: '"Sure. Obviously. Of course." — Teacher, drily.'
  },
  {
    emoji: "🤨",
    text: "NOT CONVINCED 😒",
    sub: '"Next time try something more believable."'
  },
  {
    emoji: "🤔",
    text: "CONSIDERING IT 🤔",
    sub: '"That\'s... oddly specific. I\'ll allow it."'
  },
  {
    emoji: "😤",
    text: "REJECTED 🚫",
    sub: '"I\'ve heard better from ChatGPT."'
  },
  {
    emoji: "😂",
    text: "LAUGHING 😂",
    sub: '"That\'s actually funny. Still no attendance."'
  },
  {
    emoji: "😐",
    text: "DEAD INSIDE 😐",
    sub: '"Twenty years. I have seen everything."'
  },
  {
    emoji: "🤯",
    text: "MIND BLOWN 🤯",
    sub: '"I... don\'t even know how to respond to that."'
  },
  {
    emoji: "👁️",
    text: "WATCHING YOU 👁️",
    sub: '"I\'ll remember this. Forever."'
  }
];


// ─── Pro Tips ──────────────────────────────────────
const PRO_TIPS = [
  "Maintain eye contact while delivering the excuse. Confidence is 70% of believability.",
  "Practice in front of a mirror. If you can't convince yourself, you can't convince anyone.",
  "Start with 'Ma'am/Sir, something very serious happened...' then pause dramatically.",
  "Bring a note from home. Any note. Doesn't have to be related.",
  "Show up looking tired. This validates any sleep-related excuse automatically.",
  "If teacher asks follow-up questions, say 'It's complicated' and look away sadly.",
  "Blame technology. Phones, laptops, internet — all of them are legally unverifiable.",
  "Look genuinely regretful. You are a student who deeply values education but life was unfair.",
  "If all else fails, ask about the lesson with genuine curiosity. Redirect. Redirect. Redirect.",
  "Bring a classmate as a witness. Make sure they're briefed beforehand."
];


// ─── State ─────────────────────────────────────────
let selectedCategories = new Set(["late"]);
let selectedCategory = "late"; // fallback reference
let excuseHistory = [];

const CATEGORY_NAMES = {
  late: "⏰ Came Late",
  missed: "💀 Missed Class",
  assignment: "📝 No Assignment",
  forgot: "🧠 Forgot Something",
  bus: "🚌 Bus Delay",
  sleep: "😴 Overslept"
};

// ─── Category Selection (Multi-Select Support) ─────
function selectCategory(cat, btn) {
  if (selectedCategories.has(cat)) {
    if (selectedCategories.size > 1) {
      selectedCategories.delete(cat);
    } else {
      showToast("At least 1 situation must be selected!", "info", 1500);
      return;
    }
  } else {
    selectedCategories.add(cat);
  }

  // Update button active states
  document.querySelectorAll(".category-grid .category-btn").forEach(button => {
    const id = button.id.replace("catBtn-", "");
    button.classList.toggle("active", selectedCategories.has(id));
  });

  updateExcuseCategoryBadge();
}

function selectAllCategories() {
  selectedCategories = new Set(["late", "missed", "assignment", "forgot", "bus", "sleep"]);
  document.querySelectorAll(".category-grid .category-btn").forEach(button => {
    button.classList.add("active");
  });
  showToast("All 6 situations selected! Ultimate Combo Excuse incoming 🌌", "info", 2000);
  updateExcuseCategoryBadge();
}

function resetCategories(defaultCat = "late") {
  selectedCategories = new Set([defaultCat]);
  document.querySelectorAll(".category-grid .category-btn").forEach(button => {
    const id = button.id.replace("catBtn-", "");
    button.classList.toggle("active", id === defaultCat);
  });
  updateExcuseCategoryBadge();
}

function updateExcuseCategoryBadge() {
  const badge = document.getElementById("excuseCategorySummary");
  if (!badge) return;

  const labels = Array.from(selectedCategories).map(c => CATEGORY_NAMES[c] || c);
  if (selectedCategories.size > 1) {
    badge.innerHTML = `🌌 Selected <strong>${selectedCategories.size} Reasons</strong>: ${labels.join(", ")} (Cosmic Multi-Excuse Combo!)`;
    badge.style.color = "var(--cyan)";
  } else {
    badge.innerHTML = `🎯 Selected: <strong>${labels[0] || "None"}</strong> (Click more to multi-select!)`;
    badge.style.color = "var(--purple-light)";
  }
}

// ─── Counter Animation ─────────────────────────────
function runCounter(element, start, end, duration, suffix = "") {
  if (!element) return;

  const startTime = performance.now();

  function updateCounter(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);

    const value = Math.floor(
      start + (end - start) * progress
    );

    element.textContent = value + suffix;

    if (progress < 1) {
      requestAnimationFrame(updateCounter);
    }
  }

  requestAnimationFrame(updateCounter);
}

// ─── Main Generator ────────────────────────────────
function generateExcuse() {

  const btn = document.getElementById("generateBtn");
  const ball = document.getElementById("crystalBall");

  if (!btn || !ball) {
    console.error("BUNKVERSE: Required elements not found.");
    return;
  }

  btn.disabled = true;
  btn.textContent = "⏳ Consulting the Stars...";
  ball.classList.add("generating");

  setTimeout(function () {

    try {
      const activeCats = Array.from(selectedCategories);
      let excuse = "";

      if (activeCats.length === 1) {
        // Single category
        const cat = activeCats[0];
        const excuseList = EXCUSES[cat] || EXCUSES.late;
        excuse = excuseList[Math.floor(Math.random() * excuseList.length)];
      } else {
        // Multi-select combo excuse!
        const excusesPicked = [];
        activeCats.forEach(cat => {
          const list = EXCUSES[cat] || [];
          if (list.length > 0) {
            excusesPicked.push(list[Math.floor(Math.random() * list.length)]);
          }
        });

        if (excusesPicked.length === 2) {
          excuse = `${excusesPicked[0]} Furthermore, ${excusesPicked[1]}`;
        } else {
          excuse = `Cosmic Chain Reaction: ${excusesPicked[0]} On top of that, ${excusesPicked[1]} And finally, ${excusesPicked[2] || excusesPicked[0]}`;
        }
      }

      // Random believability (drops with more wild excuses)
      const maxBelief = Math.max(5, 40 - (activeCats.length - 1) * 8);
      const believability = Math.floor(Math.random() * maxBelief) + 3;

      // Random teacher reaction
      const reaction =
        TEACHER_REACTIONS[
        Math.floor(Math.random() * TEACHER_REACTIONS.length)
        ];

      // Random pro tip
      const proTip =
        PRO_TIPS[
        Math.floor(Math.random() * PRO_TIPS.length)
        ];


      // ─── Excuse Text ─────────────────────────────
      const excuseDisplay =
        document.getElementById("excuseTextDisplay");

      if (excuseDisplay) {
        excuseDisplay.textContent = '"' + excuse + '"';
      }


      // ─── Star Rating ─────────────────────────────
      let stars;

      if (believability > 30) {
        stars = "⭐⭐⭐";
      } else if (believability > 20) {
        stars = "⭐⭐";
      } else {
        stars = "⭐";
      }

      const starRating =
        document.getElementById("starRating");

      if (starRating) {
        starRating.textContent = stars;
      }


      // ─── Category Label ──────────────────────────
      const catLabels = {
        late: "Came Late",
        missed: "Missed Class",
        assignment: "No Assignment",
        forgot: "Forgot Something",
        bus: "Bus Delay",
        sleep: "Overslept"
      };

      const categoryDisplay =
        document.getElementById("excuseCategoryDisplay");

      if (categoryDisplay) {
        categoryDisplay.textContent =
          "Category: " + catLabels[selectedCategory];
      }


      // ─── Believability ───────────────────────────
      const bPct =
        document.getElementById("believabilityPct");

      if (bPct) {

        bPct.textContent = "0%";

        if (believability > 30) {
          bPct.style.color = "var(--gold)";
        } else if (believability > 15) {
          bPct.style.color = "var(--red-light)";
        } else {
          bPct.style.color = "var(--red)";
        }

        runCounter(
          bPct,
          0,
          believability,
          800,
          "%"
        );
      }


      // ─── Believability Bar ───────────────────────
      setTimeout(function () {

        const bar =
          document.getElementById("believabilityBar");

        if (!bar) return;

        if (believability > 30) {
          bar.className = "progress-fill gold";
        } else {
          bar.className = "progress-fill red";
        }

        bar.style.width = believability + "%";

      }, 100);


      // ─── Believability Label ─────────────────────
      const bLabels = [
        "Impossible 💀",
        "Unlikely 🤔",
        "Marginal 😬",
        "Maybe 👀",
        "Surprisingly plausible 🤯"
      ];

      let beliefLabel;

      if (believability > 30) {
        beliefLabel = bLabels[4];
      } else if (believability > 20) {
        beliefLabel = bLabels[3];
      } else if (believability > 12) {
        beliefLabel = bLabels[2];
      } else if (believability > 6) {
        beliefLabel = bLabels[1];
      } else {
        beliefLabel = bLabels[0];
      }

      const beliefLabelElement =
        document.getElementById("believabilityLabel");

      if (beliefLabelElement) {
        beliefLabelElement.textContent = beliefLabel;
      }


      // ─── Teacher Reaction ────────────────────────
      const teacherEmoji =
        document.getElementById("teacherReactionEmoji");

      const teacherText =
        document.getElementById("teacherReactionText");

      const teacherSub =
        document.getElementById("teacherReactionSub");

      if (teacherEmoji) {
        teacherEmoji.textContent = reaction.emoji;
      }

      if (teacherText) {
        teacherText.textContent = reaction.text;
      }

      if (teacherSub) {
        teacherSub.textContent = reaction.sub;
      }


      // ─── Pro Tip ─────────────────────────────────
      const proTipElement =
        document.getElementById("proTip");

      if (proTipElement) {
        proTipElement.textContent = proTip;
      }


      // ─── Gallery Media ───────────────────────────
      loadExcuseMedia();


      // ─── History ────────────────────────────────
      addToHistory(
        excuse,
        catLabels[selectedCategory],
        believability
      );


      // ─── Show Result ────────────────────────────
      const resultEl =
        document.getElementById("excuseResult");

      if (resultEl) {

        resultEl.classList.add("visible");

        resultEl.scrollIntoView({
          behavior: "smooth",
          block: "start"
        });
      }


    } catch (error) {

      console.error(
        "BUNKVERSE Excuse Generator Error:",
        error
      );

      alert(
        "Oops! The cosmic excuse machine malfunctioned 🔮😂\n\n" +
        "Check the browser console for details."
      );

    }


    // ─── Reset Button ─────────────────────────────
    btn.disabled = false;

    btn.innerHTML =
      '<span class="btn-icon">🔮</span> GENERATE MY EXCUSE';

    ball.classList.remove("generating");
    ball.textContent = "🔮";

  }, 1200);
}


// ─── Load Gallery Media Safely ────────────────────
function loadExcuseMedia() {
  let media = {};

  try {
    if (typeof getCategoryMedia === 'function') {
      media = getCategoryMedia('excuse');
    } else if (window.Storage && typeof window.Storage.get === 'function') {
      media = window.Storage.get('gallery_excuse', {}) || {};
    } else {
      const saved = window.localStorage.getItem('bunkverse_gallery_excuse');
      if (saved) media = JSON.parse(saved);
    }
  } catch (error) {
    console.warn("Gallery media could not be loaded:", error);
    media = {};
  }


  const memeBox =
    document.getElementById("excuseMemeImage");

  const videoBox =
    document.getElementById("excuseMemeVideo");

  const dialogueBox =
    document.getElementById("excuseDialogue");


  // Image
  if (memeBox && media.image) {

    memeBox.innerHTML =
      '<img src="' +
      media.image +
      '" alt="Excuse Meme" ' +
      'style="width:100%;border-radius:var(--radius);' +
      'max-height:300px;object-fit:cover;">';

  }


  // Video
  if (videoBox && media.video) {

    videoBox.innerHTML =
      '<video src="' +
      media.video +
      '" controls ' +
      'style="width:100%;border-radius:var(--radius);' +
      'max-height:300px;"></video>';

  }


  // Dialogue
  if (dialogueBox && media.dialogue) {

    dialogueBox.innerHTML =
      '<em>"' +
      media.dialogue +
      '"</em>';

  }
}


// ─── Media Tab Switcher ────────────────────────────
function switchExcuseTab(tabEl, tabId) {

  document
    .querySelectorAll(".media-tab")
    .forEach(function (tab) {
      tab.classList.remove("active");
    });

  document
    .querySelectorAll(".media-tab-content")
    .forEach(function (content) {
      content.classList.remove("active");
    });

  if (tabEl) {
    tabEl.classList.add("active");
  }

  const selectedTab =
    document.getElementById(tabId);

  if (selectedTab) {
    selectedTab.classList.add("active");
  }
}


// ─── Excuse History ───────────────────────────────
function addToHistory(
  excuse,
  category,
  believability
) {

  excuseHistory.unshift({
    excuse: excuse,
    category: category,
    believability: believability,
    time: new Date().toLocaleTimeString()
  });

  if (excuseHistory.length > 10) {
    excuseHistory.pop();
  }

  renderHistory();
}


// ─── Render History ───────────────────────────────
function renderHistory() {

  const list =
    document.getElementById("excuseHistoryList");

  const section =
    document.getElementById("historySection");

  if (!list || !section) {
    return;
  }


  if (excuseHistory.length === 0) {

    section.style.display = "none";

    return;
  }


  section.style.display = "block";


  list.innerHTML =
    excuseHistory
      .map(function (item, index) {

        const shortExcuse =
          item.excuse.length > 80
            ? item.excuse.substring(0, 80) + "..."
            : item.excuse;

        return `
          <div class="history-item">

            <div class="history-num">
              ${index + 1}
            </div>

            <div style="flex:1;">

              <div
                style="
                  font-size:0.82rem;
                  color:var(--text-primary);
                  margin-bottom:2px;
                "
              >
                "${shortExcuse}"
              </div>

              <div
                style="
                  font-size:0.75rem;
                  color:var(--text-muted);
                "
              >
                ${item.category}
                •
                ${item.believability}% believable
                •
                ${item.time}
              </div>

            </div>

          </div>
        `;
      })
      .join("");
}


// ─── Clear History ────────────────────────────────
function clearHistory() {

  excuseHistory = [];

  renderHistory();
}


// ─── Page Initialization ──────────────────────────
document.addEventListener(
  "DOMContentLoaded",
  function () {

    const lateButton =
      document.getElementById("catBtn-late");

    if (lateButton) {

      selectCategory(
        "late",
        lateButton
      );

    }

  }
);