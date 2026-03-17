// Password visibility toggle
const password = document.getElementById('password');
const eyeBtn = document.querySelector('.btn-eye');

if (eyeBtn && password) {
  let visible = false;
  eyeBtn.addEventListener('click', () => {
    visible = !visible;
    password.type = visible ? 'text' : 'password';
    eyeBtn.setAttribute('aria-label', visible ? 'Hide password' : 'Show password');
    // swap eye icon style (stroke width tweak)
    eyeBtn.style.color = visible ? '#007982' : '#000000';
  });
}

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
