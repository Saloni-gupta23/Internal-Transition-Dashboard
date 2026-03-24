/* ===========================
   Barba.js – smooth page transitions
   =========================== */

// Google reCAPTCHA onload callback (explicit render mode)
function onRecaptchaLoad() {
  var box = document.getElementById('recaptchaBox');
  if (box && window.grecaptcha && !box.hasChildNodes()) {
    grecaptcha.render(box, {
      sitekey: '6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI'
    });
  }
}

// Utility: wait for a given number of milliseconds
function delay(ms) {
  return new Promise(function (resolve) { setTimeout(resolve, ms); });
}

// ===========================
// Page-specific initialisers
// ===========================

/** Login page (index.html) */
function initLoginPage() {
  // Password visibility toggle
  var password = document.getElementById('password');
  var eyeBtn = document.querySelector('.btn-eye');

  if (eyeBtn && password) {
    eyeBtn.addEventListener('click', function () {
      var isVisible = eyeBtn.classList.toggle('is-visible');
      password.type = isVisible ? 'text' : 'password';
      eyeBtn.setAttribute('aria-label', isVisible ? 'Hide password' : 'Show password');
    });
  }

  // Form validation
  var form = document.getElementById('loginForm');
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var emp = document.getElementById('empId');
      var pwd = document.getElementById('password');

      var invalid = [];
      if (!emp.value.trim()) invalid.push('Employee ID is required.');
      if (!pwd.value.trim()) invalid.push('Password is required.');

      [emp, pwd].forEach(function (i) { i.style.borderColor = ''; });

      if (invalid.length) {
        [emp, pwd].forEach(function (i) {
          if (!i.value.trim()) i.style.borderColor = '#E86A6A';
        });
        alert(invalid.join('\n'));
        return;
      }

      var submitBtn = form.querySelector('.btn-primary');
      var originalText = submitBtn ? submitBtn.textContent : '';

      if (submitBtn) {
        submitBtn.classList.add('is-loading');
        submitBtn.textContent = 'Signing in';
      }

      setTimeout(function () {
        if (submitBtn) {
          submitBtn.classList.remove('is-loading');
          submitBtn.textContent = originalText;
        }
        showToast('Signed in successfully!', 'success');
      }, 1200);
    });
  }
}

/** Forgot / Reset password page (forgot.html) */
function initForgotPage() {
  var form = document.getElementById('forgotForm');
  var email = document.getElementById('email');
  var info = document.getElementById('info');

  if (!form) return;

  function showMessage(html, ok) {
    if (typeof ok === 'undefined') ok = true;
    info.style.display = 'block';
    info.className = ok ? 'notice' : 'notice notice--error';
    info.innerHTML = html;
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var value = email.value.trim();
    email.style.borderColor = '';

    if (!value) {
      email.style.borderColor = '#E86A6A';
      showMessage('Please enter your email address.', false);
      email.focus();
      return;
    }

    var valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
    if (!valid) {
      email.style.borderColor = '#E86A6A';
      showMessage("That doesn\u2019t look like a valid email address.", false);
      return;
    }

    showMessage('If an account exists for <b>' + value + '</b>, a reset link has been sent. Check your inbox (and spam). <br><br><a href="reset-password.html" style="color:var(--brand-blue);font-weight:600">Reset Password Now &rarr;</a>');
  });
}

/** Reset password page (reset-password.html) */
function initResetPage() {
  var form = document.getElementById('resetForm');
  var newPw = document.getElementById('newPassword');
  var confirmPw = document.getElementById('confirmPassword');
  var info = document.getElementById('info');
  var strengthMeter = document.querySelector('.pw-strength');
  var strengthLabel = document.getElementById('strengthLabel');
  if (!form) return;

  // ---- Google reCAPTCHA v2 ----
  // Render reCAPTCHA explicitly so it works after Barba.js transitions
  var recaptchaBox = document.getElementById('recaptchaBox');
  if (recaptchaBox && window.grecaptcha && window.grecaptcha.render) {
    try {
      grecaptcha.render(recaptchaBox, {
        sitekey: '6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI'
      });
    } catch (e) { /* already rendered */ }
  }

  // --- Password strength meter ---
  function getStrength(pw) {
    var score = 0;
    if (pw.length >= 8) score++;
    if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) score++;
    if (/\d/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;
    return score;
  }
  var strengthLabels = ['', 'Weak', 'Fair', 'Good', 'Strong'];

  if (newPw) {
    newPw.addEventListener('input', function () {
      var level = getStrength(newPw.value);
      if (strengthMeter) strengthMeter.setAttribute('data-level', newPw.value ? level : 0);
      if (strengthLabel) strengthLabel.textContent = newPw.value ? strengthLabels[level] : '';
    });
  }

  // --- Eye toggle for both password fields ---
  var eyeBtns = form.querySelectorAll('.btn-eye');
  eyeBtns.forEach(function (btn) {
    btn.addEventListener('click', function () {
      var targetId = btn.getAttribute('data-target');
      var input = document.getElementById(targetId);
      if (!input) return;
      var isVisible = btn.classList.toggle('is-visible');
      input.type = isVisible ? 'text' : 'password';
      btn.setAttribute('aria-label', isVisible ? 'Hide password' : 'Show password');
    });
  });

  // --- Message helper ---
  function showMessage(html, ok) {
    if (typeof ok === 'undefined') ok = true;
    info.style.display = 'block';
    info.className = ok ? 'notice' : 'notice notice--error';
    info.innerHTML = html;
  }

  // --- Form submission ---
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var pw = newPw.value;
    var cpw = confirmPw.value;

    // Clear previous styles
    [newPw, confirmPw].forEach(function (i) { if (i) i.style.borderColor = ''; });

    if (!pw) {
      newPw.style.borderColor = '#E86A6A';
      showMessage('Please enter a new password.', false);
      newPw.focus();
      return;
    }
    if (pw.length < 8) {
      newPw.style.borderColor = '#E86A6A';
      showMessage('Password must be at least 8 characters.', false);
      newPw.focus();
      return;
    }
    if (!cpw) {
      confirmPw.style.borderColor = '#E86A6A';
      showMessage('Please confirm your password.', false);
      confirmPw.focus();
      return;
    }
    if (pw !== cpw) {
      confirmPw.style.borderColor = '#E86A6A';
      showMessage('Passwords do not match.', false);
      confirmPw.focus();
      return;
    }
    if (!window.grecaptcha || !grecaptcha.getResponse()) {
      showMessage('Please complete the reCAPTCHA verification.', false);
      return;
    }

    // Simulate success
    var submitBtn = form.querySelector('.btn-primary');
    var originalText = submitBtn ? submitBtn.textContent : '';
    if (submitBtn) {
      submitBtn.classList.add('is-loading');
      submitBtn.textContent = 'Resetting';
    }

    setTimeout(function () {
      if (submitBtn) {
        submitBtn.classList.remove('is-loading');
        submitBtn.textContent = originalText;
      }
      showMessage('Your password has been reset successfully! You can now <a href="index.html" style="color:var(--brand-blue);font-weight:600">log in</a> with your new password.');
    }, 1200);
  });
}

/** Dashboard page – sidebar tab click reveals detail panels */
function initDashboardPage() {
  var tabs = document.querySelectorAll('.sidebar__tab');
  var panels = document.querySelectorAll('.detail-panel');
  var empty = document.getElementById('dashEmpty');
  if (!tabs.length) return;

  var pinned = null; // tracks the clicked/pinned tab id

  function showPanel(id) {
    panels.forEach(function (p) { p.classList.remove('is-visible'); });
    if (empty) empty.style.display = 'none';
    var target = document.getElementById('panel-' + id);
    if (target) target.classList.add('is-visible');
    tabs.forEach(function (t) {
      t.classList.toggle('is-active', t.getAttribute('data-panel') === id);
    });
  }

  tabs.forEach(function (tab) {
    tab.addEventListener('click', function () {
      var id = tab.getAttribute('data-panel');
      if (pinned === id) {
        // clicking the same tab again deselects it
        pinned = null;
        panels.forEach(function (p) { p.classList.remove('is-visible'); });
        tabs.forEach(function (t) { t.classList.remove('is-active'); });
        if (empty) empty.style.display = '';
      } else {
        pinned = id;
        showPanel(id);
      }
    });
  });
}

/** Dark-mode toggle (shared across all pages) */
function initDarkMode() {
  var toggle = document.getElementById('darkToggle');
  var STORAGE_KEY = 'dark-mode';

  var saved = localStorage.getItem(STORAGE_KEY);
  if (saved === 'on') {
    document.body.classList.add('dark-mode');
  } else if (saved === 'off') {
    document.body.classList.remove('dark-mode');
  } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    document.body.classList.add('dark-mode');
  }

  if (toggle) {
    toggle.addEventListener('click', function () {
      var isDark = document.body.classList.toggle('dark-mode');
      localStorage.setItem(STORAGE_KEY, isDark ? 'on' : 'off');
    });
  }
}

// ===========================
// Toast notification system
// ===========================
function showToast(message, type) {
  var old = document.querySelector('.toast');
  if (old) old.remove();

  var toast = document.createElement('div');
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
  requestAnimationFrame(function () { toast.classList.add('toast--visible'); });

  setTimeout(function () {
    toast.classList.add('toast--exit');
    toast.addEventListener('animationend', function () { toast.remove(); });
  }, 3000);
}

// ===========================
// Route to the right init
// ===========================
function initCurrentPage() {
  initDarkMode();

  var ns = document.querySelector('[data-barba-namespace]');
  var namespace = ns ? ns.getAttribute('data-barba-namespace') : '';

  if (namespace === 'login')  initLoginPage();
  if (namespace === 'forgot') initForgotPage();
  if (namespace === 'reset')  initResetPage();
  if (namespace === 'dashboard') initDashboardPage();
}

// ===========================
// Wave-curtain transition helpers
// ===========================

// Multi-keyframe definitions: each is a series of { path, at } stops
// where `at` is a normalised position 0…1 along the total duration.
var waveEnter = [
  { at: 0,    path: 'M 0 100 V 100 Q 50 100 100 100 V 100 Z' },   // hidden below
  { at: 0.45, path: 'M 0 100 V 40  Q 50 -10 100 40  V 100 Z' },   // big curve sweeps up
  { at: 1,    path: 'M 0 100 V 0   Q 50 0   100 0   V 100 Z' }    // fully covers
];

var waveExit = [
  { at: 0,    path: 'M 0 100 V 0   Q 50 0   100 0   V 100 Z' },   // fully covers
  { at: 0.5,  path: 'M 0 100 V 0   Q 50 80  100 0   V 100 Z' },   // curve peels down
  { at: 1,    path: 'M 0 100 V 100 Q 50 100 100 100 V 100 Z' }     // hidden below
];

/**
 * Parse the numeric values out of an SVG path string.
 */
function parseNums(p) { return p.match(/-?\d+\.?\d*/g).map(Number); }

/**
 * Attempt a cubic-bezier(0.4, 0, 0.2, 1) approximation (Material "standard").
 * Gives a soft start and decelerated finish — much smoother than pure cubic.
 */
function smoothEase(t) {
  // Fast approximation of cubic-bezier(.4,0,.2,1)
  // Using a combination of quad + quint for a natural feel
  return t < 0.5
    ? 2.4 * t * t * t           // slow ramp-up (softer than 4t³)
    : 1 - Math.pow(-2 * t + 2, 2.6) / 2;  // decelerated coast
}

/**
 * Animate an SVG path through multiple keyframe stops in one
 * continuous rAF loop.  No seams between stages.
 */
function animatePathMulti(pathEl, stops, duration) {
  return new Promise(function (resolve) {
    // Pre-parse all numeric arrays and build a template from the last stop
    var parsed = stops.map(function (s) { return { at: s.at, nums: parseNums(s.path) }; });
    var template = stops[stops.length - 1].path.replace(/-?\d+\.?\d*/g, '@@');
    var start = null;

    function interpolate(t) {
      // Find which two stops we sit between
      var a = parsed[0], b = parsed[parsed.length - 1];
      for (var k = 0; k < parsed.length - 1; k++) {
        if (t >= parsed[k].at && t <= parsed[k + 1].at) {
          a = parsed[k];
          b = parsed[k + 1];
          break;
        }
      }
      // Local progress within this segment
      var seg = (b.at - a.at) || 1;
      var local = (t - a.at) / seg;
      // Apply smooth easing to the local segment too
      local = smoothEase(local);

      var i = 0;
      return template.replace(/@@/g, function () {
        var v = a.nums[i] + (b.nums[i] - a.nums[i]) * local;
        i++;
        return (Math.round(v * 100) / 100);  // two-decimal precision
      });
    }

    function tick(ts) {
      if (!start) start = ts;
      var raw = Math.min((ts - start) / duration, 1);
      var eased = smoothEase(raw);              // global ease over full duration

      pathEl.setAttribute('d', interpolate(eased));

      if (raw < 1) {
        requestAnimationFrame(tick);
      } else {
        pathEl.setAttribute('d', stops[stops.length - 1].path);
        resolve();
      }
    }

    requestAnimationFrame(tick);
  });
}

// ===========================
// Barba.js initialisation
// ===========================
function startBarba() {
  var overlay  = document.querySelector('.transition-overlay');
  var pathEl   = overlay ? overlay.querySelector('.transition-overlay__path') : null;

  barba.init({
    prevent: function (data) {
      if (data.el && data.el.getAttribute('target')) return true;
      return false;
    },

    transitions: [{
      name: 'wave-curtain',

      leave: function (data) {
        var current = data.current.container;

        // Content fade-out
        current.classList.add('barba-leave-active');

        if (!pathEl) return delay(600);

        // Reset to hidden
        pathEl.setAttribute('d', waveEnter[0].path);

        // Single continuous wave sweep up (no seams)
        return animatePathMulti(pathEl, waveEnter, 700);
      },

      enter: function (data) {
        var next = data.next.container;

        // Content fade-in
        next.classList.add('barba-enter-active');

        if (!pathEl) return delay(650);

        // Single continuous wave peel away
        return animatePathMulti(pathEl, waveExit, 650);
      },

      after: function (data) {
        data.next.container.classList.remove('barba-enter-active');

        // Reset overlay for next transition
        if (pathEl) pathEl.setAttribute('d', waveEnter[0].path);

        // Re-grab overlay from new DOM (barba replaces content)
        var newOverlay = document.querySelector('.transition-overlay');
        var newPath    = newOverlay ? newOverlay.querySelector('.transition-overlay__path') : null;
        if (newPath) {
          pathEl = newPath;
          overlay = newOverlay;
        }
      }
    }]
  });

  barba.hooks.after(function () {
    initCurrentPage();
  });
}

// ===========================
// Boot everything on first load
// ===========================
document.addEventListener('DOMContentLoaded', function () {
  initCurrentPage();
  startBarba();
});
