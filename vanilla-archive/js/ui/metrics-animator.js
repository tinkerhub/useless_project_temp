/**
 * Useless 3.0 - Metrics Animator
 * Smoothly animates progress bars and score counters when in viewport.
 */
export class MetricsAnimator {
  constructor(sectionSelector = '#scores') {
    this.section = document.querySelector(sectionSelector);
    this.hasAnimated = false;
  }

  init() {
    if (!this.section) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && !this.hasAnimated) {
          this.animate();
          this.hasAnimated = true;
          observer.unobserve(this.section);
        }
      });
    }, { threshold: 0.25 });

    observer.observe(this.section);
  }

  animate() {
    const items = this.section.querySelectorAll('.score-item');
    items.forEach((item, index) => {
      const targetPercent = parseInt(item.getAttribute('data-score') || '0', 10);
      const fillBar = item.querySelector('.score-bar-fill');
      const valEl = item.querySelector('.score-value');

      setTimeout(() => {
        if (fillBar) {
          fillBar.style.width = `${targetPercent}%`;
        }

        // Animate counter
        let current = 0;
        const duration = 1200;
        const stepTime = 20;
        const steps = duration / stepTime;
        const increment = targetPercent / steps;

        const timer = setInterval(() => {
          current += increment;
          if (current >= targetPercent) {
            current = targetPercent;
            clearInterval(timer);
          }
          if (valEl) {
            valEl.textContent = `${Math.round(current)}%`;
          }
        }, stepTime);
      }, index * 140);
    });
  }
}
