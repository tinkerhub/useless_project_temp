/**
 * journal.js — Scroll-driven storytelling engine for the Project Journal.
 *
 * Features:
 * - IntersectionObserver for scroll-reveal animations (.j-reveal → .is-visible)
 * - Muted autoplay for videos when they enter the viewport
 * - Section progress tracking
 */

// ─── Scroll Reveal ─────────────────────────────────────────────────
function initScrollReveal() {
  const reveals = document.querySelectorAll('.j-reveal');
  if (!reveals.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          // Once revealed, stop observing (one-shot)
          observer.unobserve(entry.target);
        }
      });
    },
    {
      threshold: 0.15,
      rootMargin: '0px 0px -60px 0px',
    }
  );

  reveals.forEach((el) => observer.observe(el));
}

// ─── Video Autoplay on Viewport Enter ───────────────────────────────
function initVideoAutoplay() {
  const videos = document.querySelectorAll('.j-video video[data-autoplay]');
  if (!videos.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        const video = entry.target;
        if (entry.isIntersecting) {
          video.play().catch(() => {
            // Browser blocked autoplay — that's fine
          });
        } else {
          video.pause();
        }
      });
    },
    { threshold: 0.3 }
  );

  videos.forEach((v) => observer.observe(v));
}

// ─── Section Progress Indicator ─────────────────────────────────────
function initSectionProgress() {
  const sections = document.querySelectorAll('[data-section]');
  const progressEl = document.getElementById('j-progress');
  if (!sections.length || !progressEl) return;

  const total = sections.length;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const idx = Array.from(sections).indexOf(entry.target) + 1;
          const pct = Math.round((idx / total) * 100);
          progressEl.style.width = `${pct}%`;
          progressEl.setAttribute('aria-valuenow', pct);
        }
      });
    },
    { threshold: 0.3 }
  );

  sections.forEach((s) => observer.observe(s));
}

// ─── Smooth scroll for anchor links ─────────────────────────────────
function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener('click', (e) => {
      e.preventDefault();
      const target = document.querySelector(anchor.getAttribute('href'));
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });
}

// ─── Image Error Handler (placeholder fallback) ─────────────────────
function initImageFallbacks() {
  document.querySelectorAll('.j-photo img, .j-meme img').forEach((img) => {
    img.addEventListener('error', () => {
      // Replace broken image with placeholder
      const wrapper = img.closest('.j-photo, .j-meme');
      if (wrapper) {
        const label = img.alt || 'Image coming soon';
        wrapper.classList.add(
          wrapper.classList.contains('j-photo')
            ? 'j-photo--missing'
            : 'j-meme--placeholder'
        );
        // Create a placeholder div
        const placeholder = document.createElement('div');
        placeholder.style.cssText = `
          aspect-ratio: 4/3;
          background: #f0ebe0;
          border: 2px dashed #c8c8c8;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'Caveat', cursive;
          font-size: 1.1rem;
          color: #9a9a9a;
          text-align: center;
          padding: 1rem;
        `;
        placeholder.textContent = label;
        img.replaceWith(placeholder);
      }
    });
  });
}

// ─── Video Error Handler (placeholder fallback) ─────────────────────
function initVideoFallbacks() {
  document.querySelectorAll('.j-video video').forEach((video) => {
    video.addEventListener('error', () => {
      const wrapper = video.closest('.j-video');
      if (wrapper) {
        const label = video.getAttribute('data-label') || 'Video coming soon';
        wrapper.classList.add('j-video--placeholder');
        wrapper.setAttribute('data-label', label);
        video.remove();
      }
    });
  });
}

// ─── Timeline Tabs Controller (Section 08) ─────────────────────────
function initTimelineTabs() {
  const tabs = document.querySelectorAll('#timeline-tabs .j-timeline-tab');
  const panels = document.querySelectorAll('.j-timeline-panel');
  if (!tabs.length || !panels.length) return;

  function switchMilestone(targetId) {
    // Switch active tab and update click CTAs
    tabs.forEach((t) => {
      const isTarget = t.getAttribute('data-tab') === targetId;
      t.classList.toggle('is-active', isTarget);
      t.setAttribute('aria-selected', isTarget ? 'true' : 'false');
      const cta = t.querySelector('.j-tab-click-cta');
      if (cta) {
        cta.textContent = isTarget ? '● VIEWING NOW' : '👉 CLICK TO VIEW';
      }
    });

    // Switch active panel
    panels.forEach((p) => p.classList.remove('is-active'));
    const targetPanel = document.getElementById(targetId);
    if (targetPanel) {
      targetPanel.classList.add('is-active');
    }
  }

  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      const targetId = tab.getAttribute('data-tab');
      switchMilestone(targetId);
    });
  });

  // Listen to bottom navigation buttons inside panels
  document.querySelectorAll('.j-timeline-nav-btn[data-target]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const targetId = btn.getAttribute('data-target');
      switchMilestone(targetId);
      const activeTab = document.querySelector(`.j-timeline-tab[data-tab="${targetId}"]`);
      if (activeTab) {
        activeTab.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    });
  });
}

// ─── Officer Mood Switcher & Dialogue (Section 09) ───────────────────
function initOfficerMoods() {
  const btns = document.querySelectorAll('.j-officer-btn');
  const avatar = document.getElementById('j-officer-avatar');
  const label = document.getElementById('j-officer-mood-label');
  const dialogue = document.getElementById('j-officer-dialogue');
  if (!btns.length) return;

  const moodDialogues = {
    stare: '*stares into your soul without blinking* "State your purpose. Why does this computer mouse look suspicious?"',
    doubt: '*squints intensely* "A Computer Mouse that claims it was born in Japan?! Where is your bill and warranty card?!"',
    happy: '*grins widely* "Ah! A fellow nocturnal maker! Show me your serial number and proceed!"',
    pass: '*looks left and right* "Aha! ₹50 bribe?! ...I am an honest officer! *quietly pockets ₹50* ...Okay, tea charge accepted! APPROVED!"',
  };

  btns.forEach((btn) => {
    btn.addEventListener('click', () => {
      btns.forEach((b) => b.classList.remove('is-active'));
      btn.classList.add('is-active');

      const mood = btn.getAttribute('data-mood');
      const src = btn.getAttribute('data-src');

      if (avatar && src) avatar.src = src;
      if (label && mood) label.textContent = `OFFICER: ${mood.toUpperCase()}`;
      if (dialogue && moodDialogues[mood]) {
        dialogue.textContent = moodDialogues[mood];
      }
    });
  });
}

// ─── Dialogue Chip Interaction (Section 09) ─────────────────────────
function initDialogueChips() {
  const chips = document.querySelectorAll('.j-dialogue-chip');
  const dialogue = document.getElementById('j-officer-dialogue');
  if (!chips.length || !dialogue) return;

  const responses = {
    harmless: 'Officer: "Harmless?! Last week a harmless USB flash drive short-circuited my tea kettle!"',
    bribe: 'Officer: "*whispers* ₹50 is acceptable for a mouse. If you were a color printer, it would be ₹200."',
    witness: 'Officer: "The banana witness already turned black and refused to testify under oath!"',
  };

  chips.forEach((chip) => {
    chip.addEventListener('click', () => {
      const reply = chip.getAttribute('data-reply');
      if (responses[reply]) {
        dialogue.textContent = responses[reply];
        dialogue.style.animation = 'none';
        dialogue.offsetHeight; // trigger reflow
        dialogue.style.animation = 'jFadeIn 0.25s ease';
      }
    });
  });
}

// ─── Interactive "Enikku Kittathathu" Dialogue Player (Section 06) ───
function initPremamDialogueSound() {
  const btn = document.getElementById('j-dialogue-audio-btn');
  const label = document.getElementById('j-dialogue-audio-label');
  const sticky = document.getElementById('j-premam-sticky');
  if (!btn) return;

  let audio = null;
  const originalLabel = '"എനിക്ക് കിട്ടാത്തത് നിനക്കും കിട്ടണ്ടെടാ!" (PLAY DIALOGUE)';

  function getAudio() {
    if (!audio) {
      audio = new Audio('./audio/enik.mp3');
      audio.onerror = () => {
        audio = new Audio('../enik.mp3');
      };
    }
    return audio;
  }

  function playSound() {
    const a = getAudio();
    btn.classList.add('is-playing');
    if (label) label.textContent = '🔊 "എനിക്ക് കിട്ടാത്തത് നിനക്കും കിട്ടണ്ടെടാ!" (PLAYING...)';

    a.currentTime = 0;
    a.play().then(() => {
      a.onended = () => {
        btn.classList.remove('is-playing');
        if (label) label.textContent = originalLabel;
      };
    }).catch((err) => {
      console.log('Autoplay restriction or audio note:', err.message);
      btn.classList.remove('is-playing');
      if (label) label.textContent = originalLabel;
    });
  }

  btn.addEventListener('click', playSound);

  // Auto-play once when scrolled into view (if audio context allows)
  if (sticky && 'IntersectionObserver' in window) {
    let triggered = false;
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && !triggered) {
          triggered = true;
          playSound();
          observer.unobserve(sticky);
        }
      });
    }, { threshold: 0.5 });
    observer.observe(sticky);
  }
}

// ─── Camcorder Video Player (Play with sound on click) ──────────────
function initCamVideoPlayers() {
  document.querySelectorAll('.j-cam-viewport').forEach((viewport) => {
    const video = viewport.querySelector('video');
    const overlay = viewport.querySelector('.j-cam-play-overlay');
    if (!video) return;

    if (overlay) {
      overlay.addEventListener('click', (e) => {
        e.stopPropagation();
        // Pause any other playing videos so audio tracks don't overlap
        document.querySelectorAll('.j-cam-video').forEach((v) => {
          if (v !== video) {
            v.pause();
            const vp = v.closest('.j-cam-viewport');
            if (vp) vp.classList.remove('is-playing');
          }
        });

        video.muted = false; // Always unmute for sound
        video.play().then(() => {
          viewport.classList.add('is-playing');
        }).catch((err) => {
          console.warn('Playback error:', err);
        });
      });
    }

    video.addEventListener('play', () => {
      video.muted = false;
      viewport.classList.add('is-playing');
    });

    video.addEventListener('pause', () => {
      viewport.classList.remove('is-playing');
    });

    video.addEventListener('ended', () => {
      viewport.classList.remove('is-playing');
    });
  });
}

// ─── Initialize Everything ──────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initScrollReveal();
  initVideoAutoplay();
  initSectionProgress();
  initSmoothScroll();
  initImageFallbacks();
  initVideoFallbacks();
  initTimelineTabs();
  initOfficerMoods();
  initDialogueChips();
  initPremamDialogueSound();
  initCamVideoPlayers();
});

