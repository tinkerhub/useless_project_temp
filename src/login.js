/**
 * login.js — Login screen controller
 * Handles identity selection, password entry, and transition to main app
 */

import { CLIENT_ACCOUNTS, generateAvatar } from './modules/contacts.js';

const SESSION_KEY = 'gg_active_user';

/**
 * Check if user is already logged in (persisted session)
 */
export function getLoggedInUser() {
  return localStorage.getItem(SESSION_KEY);
}

export function setLoggedInUser(id) {
  localStorage.setItem(SESSION_KEY, id);
}

export function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}

/**
 * Mount and run the login screen.
 * Calls `onLogin(clientId)` when authentication succeeds.
 */
export function mountLoginScreen(onLogin) {
  const screen    = document.getElementById('login-screen');
  const appRoot   = document.getElementById('app-root');
  const avatarsEl = document.getElementById('login-avatars');
  const selEl     = document.getElementById('login-selected');
  const selAvEl   = document.getElementById('login-sel-avatar');
  const selNameEl = document.getElementById('login-sel-name');
  const selAboutEl= document.getElementById('login-sel-about');
  const fieldEl   = document.getElementById('login-field');
  const passEl    = document.getElementById('login-password');
  const eyeBtn    = document.getElementById('login-eye-btn');
  const loginBtn  = document.getElementById('login-btn');
  const loginText = loginBtn.querySelector('.login-btn__text');
  const errEl     = document.getElementById('login-error');
  const changeBtn = document.getElementById('login-change-btn');
  const guestBtn  = document.getElementById('login-guest-btn');
  const selectorEl= document.getElementById('login-avatar-selector');

  let selectedId = null;

  // ── Build Avatar Cards ─────────────────────────────────────
  CLIENT_ACCOUNTS.forEach(client => {
    const { initials, color } = generateAvatar(client);
    const card = document.createElement('button');
    card.className = 'login-avatar-card';
    card.setAttribute('data-id', client.id);
    card.setAttribute('type', 'button');
    card.innerHTML = `
      <div class="login-avatar-card__avatar" style="background:${color};">${initials}</div>
      <div class="login-avatar-card__name">${client.name}</div>
    `;
    card.addEventListener('click', () => selectIdentity(client));
    avatarsEl.appendChild(card);
  });

  // ── Select Identity ────────────────────────────────────────
  function selectIdentity(client) {
    selectedId = client.id;
    const { initials, color } = generateAvatar(client);

    // Highlight card
    avatarsEl.querySelectorAll('.login-avatar-card').forEach(c => c.classList.remove('selected'));
    avatarsEl.querySelector(`[data-id="${client.id}"]`)?.classList.add('selected');

    // Show selected banner
    selAvEl.style.background = color;
    selAvEl.textContent = initials;
    selNameEl.textContent = client.name;
    selAboutEl.textContent = client.about || `📱 ${client.initials}`;
    selEl.style.display = 'flex';

    // Show password field
    fieldEl.style.display = 'flex';
    passEl.value = '';
    errEl.style.display = 'none';
    passEl.focus();

    // Activate login button
    loginBtn.disabled = false;
    loginText.textContent = `Sign in as ${client.name}`;
  }

  // ── Change Account ─────────────────────────────────────────
  changeBtn.addEventListener('click', () => {
    selectedId = null;
    selEl.style.display = 'none';
    fieldEl.style.display = 'none';
    errEl.style.display = 'none';
    passEl.value = '';
    loginBtn.disabled = true;
    loginText.textContent = 'Select an account to continue';
    avatarsEl.querySelectorAll('.login-avatar-card').forEach(c => c.classList.remove('selected'));
  });

  // ── Show/Hide Password ─────────────────────────────────────
  eyeBtn.addEventListener('click', () => {
    const isText = passEl.type === 'text';
    passEl.type = isText ? 'password' : 'text';
    eyeBtn.textContent = isText ? '👁️' : '🙈';
  });

  // ── Attempt Login ──────────────────────────────────────────
  function attemptLogin(id) {
    if (!id) return;
    const pwd = passEl.value.trim();
    if (pwd.length < 1) {
      showError('Please enter a password (any password works for demo 😄)');
      passEl.focus();
      return;
    }

    loginBtn.disabled = true;
    loginText.textContent = 'Signing in…';
    loginBtn.querySelector('.login-btn__icon').textContent = '⏳';

    // Simulate brief auth delay for feel
    setTimeout(() => {
      setLoggedInUser(id);
      transitionToApp(id);
    }, 700);
  }

  loginBtn.addEventListener('click', () => attemptLogin(selectedId));
  passEl.addEventListener('keydown', e => { if (e.key === 'Enter') attemptLogin(selectedId); });

  // ── Guest Login ────────────────────────────────────────────
  guestBtn.addEventListener('click', () => {
    setLoggedInUser('alice'); // Guest defaults to Alice
    transitionToApp('alice');
  });

  // ── Error display ──────────────────────────────────────────
  function showError(msg) {
    errEl.textContent = '⚠️ ' + msg;
    errEl.style.display = 'block';
  }

  // ── Transition ─────────────────────────────────────────────
  function transitionToApp(clientId) {
    screen.classList.add('fade-out');
    screen.addEventListener('animationend', () => {
      screen.style.display = 'none';
      appRoot.style.display = 'flex';
      appRoot.style.flexDirection = 'column';
      appRoot.style.height = '100vh';
      onLogin(clientId);
    }, { once: true });
  }
}
