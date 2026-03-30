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
// Interactive background parallax
// ===========================
(function () {
  var prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReduced) return;

  var layers = [
    { sel: '.bg-decor__blob--teal',   strength: 18 },
    { sel: '.bg-decor__blob--green',  strength: 14 },
    { sel: '.bg-decor__blob--accent', strength: 10 },
    { sel: '.bg-decor__ring--1',      strength: 8 },
    { sel: '.bg-decor__ring--2',      strength: 12 },
    { sel: '.bg-decor__corner--tl',   strength: 6 },
    { sel: '.bg-decor__corner--br',   strength: 6 },
  ];

  var items = layers.map(function (l) {
    return { el: document.querySelector(l.sel), s: l.strength };
  }).filter(function (i) { return i.el; });

  if (!items.length) return;

  var mx = 0, my = 0, cx = 0, cy = 0, raf;

  document.addEventListener('mousemove', function (e) {
    mx = (e.clientX / window.innerWidth  - 0.5) * 2;
    my = (e.clientY / window.innerHeight - 0.5) * 2;
    if (!raf) raf = requestAnimationFrame(lerp);
  });

  function lerp() {
    cx += (mx - cx) * 0.06;
    cy += (my - cy) * 0.06;

    for (var i = 0; i < items.length; i++) {
      var dx = (cx * items[i].s).toFixed(1);
      var dy = (cy * items[i].s).toFixed(1);
      items[i].el.style.setProperty('--px', dx + 'px');
      items[i].el.style.setProperty('--py', dy + 'px');
    }

    if (Math.abs(mx - cx) > 0.001 || Math.abs(my - cy) > 0.001) {
      raf = requestAnimationFrame(lerp);
    } else {
      raf = null;
    }
  }
})();

// Dark mode is handled by barba-init.js initDarkMode()
// Removed from here to prevent double-toggle on pages that load both scripts.

// ===========================
// Login Authentication System
// ===========================
// Demo credentials (for testing purposes)
const DEMO_CREDENTIALS = {
  'E001': { password: 'password123', name: 'John Doe', email: 'john.doe@company.com' },
  'E002': { password: 'password123', name: 'Jane Smith', email: 'jane.smith@company.com' },
  'E003': { password: 'password123', name: 'Admin User', email: 'admin@company.com' },
  'EMP001': { password: 'demo', name: 'Demo User', email: 'demo@company.com' }
};

const form = document.getElementById('loginForm');
if (form) {
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const empIdInput = document.getElementById('empId');
    const passwordInput = document.getElementById('password');
    const submitBtn = form.querySelector('.btn-primary');

    // Validation
    const invalid = [];
    if (!empIdInput.value.trim()) invalid.push('Employee ID is required.');
    if (!passwordInput.value.trim()) invalid.push('Password is required.');

    // Clear previous error styling
    [empIdInput, passwordInput].forEach(i => i.style.borderColor = '');

    if (invalid.length) {
      [empIdInput, passwordInput].forEach(i => {
        if (!i.value.trim()) i.style.borderColor = '#E86A6A';
      });
      alert(invalid.join('\n'));
      return;
    }

    const empId = empIdInput.value.trim();
    const password = passwordInput.value;

    // Show loading state
    const originalText = submitBtn.textContent;
    if (submitBtn) {
      submitBtn.classList.add('is-loading');
      submitBtn.textContent = 'Signing in...';
      submitBtn.disabled = true;
    }

    // Simulate API delay for better UX
    setTimeout(() => {
      // Check credentials against demo data
      const user = DEMO_CREDENTIALS[empId];
      
      if (!user || user.password !== password) {
        // Reset button state
        if (submitBtn) {
          submitBtn.classList.remove('is-loading');
          submitBtn.textContent = originalText;
          submitBtn.disabled = false;
        }
        empIdInput.style.borderColor = '#E86A6A';
        passwordInput.style.borderColor = '#E86A6A';
        showToast('Invalid Employee ID or Password', 'error');
        return;
      }

      // Generate auth token
      const authToken = 'token_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
      
      // Store in sessionStorage (required for dashboard auth guard)
      sessionStorage.setItem('authToken', authToken);
      sessionStorage.setItem('empId', empId);
      sessionStorage.setItem('userName', user.name);
      sessionStorage.setItem('userEmail', user.email);

      // Reset button state
      if (submitBtn) {
        submitBtn.classList.remove('is-loading');
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
      }

      showToast('Signed in successfully! Redirecting...', 'success');
      
      // Redirect to dashboard after a short delay
      setTimeout(() => {
        window.location.href = 'dashboard.html';
      }, 800);
    }, 1200); // 1.2 second delay to simulate API call
  });
}

/* ===========================
   Toast notification system
   =========================== */
function showToast(message, type) {
  // Remove any existing toast
  const old = document.querySelector('.toast');
  if (old) old.remove();

  const toast = document.createElement('div');
  toast.className = 'toast toast--' + (type || 'info');
  toast.setAttribute('role', 'status');
  toast.setAttribute('aria-live', 'polite');

  toast.innerHTML =
    '<svg class="toast__icon" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
      '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>' +
      '<polyline points="22 4 12 14.01 9 11.01"></polyline>' +
    '</svg>' +
    '<span>' + message + '</span>';

  document.body.appendChild(toast);

  // Trigger entrance animation
  requestAnimationFrame(function () {
    toast.classList.add('toast--visible');
  });

  // Auto-dismiss after 3 seconds
  setTimeout(function () {
    toast.classList.add('toast--exit');
    toast.addEventListener('animationend', function () {
      toast.remove();
    });
  }, 3000);
}
