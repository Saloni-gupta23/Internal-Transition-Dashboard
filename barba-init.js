/* ===========================
   Barba.js – smooth page transitions
   =========================== */

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

    showMessage('If an account exists for <b>' + value + '</b>, a reset link has been sent. Check your inbox (and spam).');
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
