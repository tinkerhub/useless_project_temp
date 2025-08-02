const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');
const usernameMsg = document.getElementById('usernameMsg');
const passwordMsg = document.getElementById('passwordMsg');
const signupBtn = document.getElementById('signupBtn');
const form = document.getElementById('signupForm');

usernameInput.addEventListener('input', () => {
  usernameMsg.textContent = `${usernameInput.value} is weak`;
});

passwordInput.addEventListener('input', () => {
  const value = passwordInput.value;
  if (value === '12345678') {
    passwordMsg.textContent = 'Powerful! But already used by ASWIN TULASI';
  } else {
    passwordMsg.textContent = 'Your password is weak';
  }
});

// Button avoiding behavior
form.addEventListener('mousemove', (e) => {
  const btnRect = signupBtn.getBoundingClientRect();
  const mouseX = e.clientX;
  const mouseY = e.clientY;
  const offset = 60;

  if (
    mouseX > btnRect.left - offset &&
    mouseX < btnRect.right + offset &&
    mouseY > btnRect.top - offset &&
    mouseY < btnRect.bottom + offset
  ) {
    const newX = Math.random() * (window.innerWidth - 150);
    const newY = Math.random() * (window.innerHeight - 70);
    signupBtn.style.position = 'absolute';
    signupBtn.style.left = `${newX}px`;
    signupBtn.style.top = `${newY}px`;
  }
});

// Form submission leads to loading screen (if clicked)
form.addEventListener('submit', (e) => {
  e.preventDefault();
  window.location.href = 'loading.html';
});
