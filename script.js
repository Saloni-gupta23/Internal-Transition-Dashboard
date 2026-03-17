// Password visibility toggle (eye open ↔ eye slash)
const password = document.getElementById('password');
const eyeBtn = document.querySelector('.btn-eye');

if (eyeBtn && password) {
  eyeBtn.addEventListener('click', () => {
    const isVisible = eyeBtn.classList.toggle('is-visible');
    password.type = isVisible ? 'text' : 'password';
    eyeBtn.setAttribute('aria-label', isVisible ? 'Hide password' : 'Show password');
  });
}

// ===========================
// Dark mode toggle
// ===========================
(function () {
  const toggle = document.getElementById('darkToggle');
  const STORAGE_KEY = 'dark-mode';

  // Apply saved preference on load (before paint)
  function applyPreference() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'on') {
      document.body.classList.add('dark-mode');
    } else if (saved === 'off') {
      document.body.classList.remove('dark-mode');
    } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      // Follow OS preference if no manual choice was saved
      document.body.classList.add('dark-mode');
    }
  }

  applyPreference();

  if (toggle) {
    toggle.addEventListener('click', () => {
      const isDark = document.body.classList.toggle('dark-mode');
      localStorage.setItem(STORAGE_KEY, isDark ? 'on' : 'off');
    });
  }
})();

// Basic client-side validation demo
const form = document.getElementById('loginForm');
form?.addEventListener('submit', (e) => {
  e.preventDefault();
  const emp = document.getElementById('empId');
  const pwd = document.getElementById('password');

  // simple check UI
  const invalid = [];
  if (!emp.value.trim()) invalid.push('Employee ID is required.');
  if (!pwd.value.trim()) invalid.push('Password is required.');

  // clear previous styles
  [emp, pwd].forEach(i => i.style.borderColor = '#007982');

  if (invalid.length) {
    [emp, pwd].forEach(i => {
      if (!i.value.trim()) i.style.borderColor = '#007982';
    });
    alert(invalid.join('\n'));
    return;
  }

  // Mock “success”
  // Replace with your real auth call.
  alert('Logged in (demo). You can hook this up to your backend.');
});

// Forgot password demo
// document.getElementById('forgotLink')?.addEventListener('click', (e) => {
//   e.preventDefault();
//   alert('Forgot Password (demo): connect this link to your recovery flow.');
// });
