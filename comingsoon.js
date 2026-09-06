/* The two "coming soon" tiles on the projects page are a bit — there is no
   game coming, there never was. Clicking one pops a modal that admits it,
   with a fresh punchline (and matching emoji) each time. */
(function () {
  "use strict";

  var LINES = [
    ["🤡", "“Coming soon” is a marketing lie we typed at 3am. There is no game. There is no roadmap. There is only this popup."],
    ["🕰️", "Soon™ — a unit of time between “never” and “absolutely never.” You just experienced the whole feature."],
    ["🫠", "We fully intended to build something here. Then we got bored. Which, honestly, is on brand."],
    ["🥚", "Congrats, you found the emptiest easter egg on the internet. This tile will be blank forever. Frame it."],
    ["📦", "The box is empty. It was always empty. You clicked an empty box twice, didn't you?"],
    ["🦥", "Development status: horizontal. ETA: after the heat death of the universe, pending snacks."],
    ["🧢", "That “coming soon”? Big cap. Massive cap. The cap is coming soon actually — no wait, that's a lie too."],
    ["🎈", "Breaking: the third game has been “in development” for 0 days because we never started. Stay tuned for more nothing."]
  ];

  var backdrop = document.getElementById("csBackdrop");
  var emojiEl = document.getElementById("csEmoji");
  var bodyEl = document.getElementById("csBody");
  var lastIdx = -1;

  if (!backdrop) return;

  function pick() {
    var i = Math.floor(Math.random() * LINES.length);
    if (LINES.length > 1 && i === lastIdx) i = (i + 1) % LINES.length;
    lastIdx = i;
    return LINES[i];
  }

  function open() {
    var l = pick();
    emojiEl.textContent = l[0];
    bodyEl.textContent = l[1];
    backdrop.classList.add("is-open");
    document.body.style.overflow = "hidden";
  }

  function close() {
    backdrop.classList.remove("is-open");
    document.body.style.overflow = "";
  }

  document.querySelectorAll("[data-comingsoon]").forEach(function (btn) {
    btn.addEventListener("click", open);
  });

  document.getElementById("csClose").addEventListener("click", close);
  document.getElementById("csOk").addEventListener("click", close);
  backdrop.addEventListener("click", function (e) {
    if (e.target === backdrop) close();
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && backdrop.classList.contains("is-open")) close();
  });
})();
