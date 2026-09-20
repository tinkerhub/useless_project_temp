/**
 * Notifications Module — Toast alerts and gossip warning banners
 */

let toastContainer = null;

function ensureContainer() {
  if (!toastContainer) {
    toastContainer = document.getElementById('toast-container');
    if (!toastContainer) {
      toastContainer = document.createElement('div');
      toastContainer.id = 'toast-container';
      document.body.appendChild(toastContainer);
    }
  }
  return toastContainer;
}

/**
 * Show a toast notification
 * @param {string} message - Text content
 * @param {'info'|'warning'|'danger'|'success'} type - Visual type
 * @param {number} duration - Auto-dismiss delay (ms). 0 = sticky.
 */
export function showToast(message, type = 'info', duration = 4000) {
  const container = ensureContainer();
  const toast = document.createElement('div');
  toast.className = `toast toast--${type}`;

  const icons = { info: 'ℹ️', warning: '⚠️', danger: '🚨', success: '✅' };
  toast.innerHTML = `
    <span class="toast__icon">${icons[type] || '📢'}</span>
    <span class="toast__text">${message}</span>
    <button class="toast__close" aria-label="Dismiss">✕</button>
  `;

  toast.querySelector('.toast__close').addEventListener('click', () => dismissToast(toast));
  container.appendChild(toast);

  // Animate in
  requestAnimationFrame(() => toast.classList.add('toast--visible'));

  if (duration > 0) {
    setTimeout(() => dismissToast(toast), duration);
  }

  return toast;
}

function dismissToast(toast) {
  toast.classList.remove('toast--visible');
  toast.classList.add('toast--hidden');
  setTimeout(() => toast.remove(), 350);
}

/**
 * Show a gossip detection warning for a conversation
 */
export function showGossipAlert(contactName, score, onViewReport) {
  const container = ensureContainer();
  const toast = document.createElement('div');
  toast.className = `toast toast--gossip`;

  const level = score >= 70 ? '🚨 High Risk' : score >= 40 ? '⚠️ Moderate Risk' : '🟡 Low Risk';
  toast.innerHTML = `
    <div class="toast__gossip-header">
      <span class="toast__icon">🕵️</span>
      <strong>Gossip Detected in ${contactName}</strong>
    </div>
    <p class="toast__gossip-body">Risk score: <strong>${score}%</strong> — ${level}</p>
    <div class="toast__gossip-actions">
      <button class="toast__btn toast__btn--view" id="toast-view-report">View Report</button>
      <button class="toast__btn toast__btn--dismiss">Dismiss</button>
    </div>
  `;

  toast.querySelector('.toast__btn--view').addEventListener('click', () => {
    dismissToast(toast);
    if (onViewReport) onViewReport();
  });
  toast.querySelector('.toast__btn--dismiss').addEventListener('click', () => dismissToast(toast));

  container.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add('toast--visible'));
  setTimeout(() => dismissToast(toast), 8000);
}

/**
 * Show typing indicator (returns handle to dismiss it)
 */
export function createTypingIndicator(contactName) {
  return `<div class="typing-indicator" aria-label="${contactName} is typing">
    <span></span><span></span><span></span>
  </div>`;
}
