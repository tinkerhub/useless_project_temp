// Shared typewriter + zigzag-lettering helper for every game's title-card
// opening screen. Plain script (not a module) so it works whether the game
// itself loads as a module (Poo-zzle) or a classic script (5 Star, Cheetah).
window.glTypewriter = function (titleEl, titleText, rulesEl, rulesText, titleSpeed, rulesSpeed) {
  titleSpeed = titleSpeed || 90;
  rulesSpeed = rulesSpeed || 20;

  function typeInto(el, text, speed, onDone) {
    el.textContent = "";
    el.classList.add("gl-typing");
    let i = 0;
    let wordEl = null;
    const timer = setInterval(() => {
      const ch = text[i];
      if (ch === " ") {
        el.appendChild(document.createTextNode(" "));
        wordEl = null;
      } else {
        if (!wordEl) {
          wordEl = document.createElement("span");
          wordEl.className = "gl-word";
          el.appendChild(wordEl);
        }
        const span = document.createElement("span");
        span.className = "gl-zig";
        span.textContent = ch;
        wordEl.appendChild(span);
      }
      i++;
      if (i >= text.length) {
        clearInterval(timer);
        el.classList.remove("gl-typing");
        if (onDone) onDone();
      }
    }, speed);
  }

  typeInto(titleEl, titleText, titleSpeed, () => {
    if (rulesEl && rulesText) typeInto(rulesEl, rulesText, rulesSpeed);
  });
};
