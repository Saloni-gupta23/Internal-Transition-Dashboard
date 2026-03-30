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

      // POST credentials to the login API
      fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ empId: emp.value.trim(), password: pwd.value })
      })
      .then(function (res) { return res.json().then(function (data) { return { status: res.status, data: data }; }); })
      .then(function (result) {
        if (result.status !== 200 || !result.data.ok) {
          if (submitBtn) {
            submitBtn.classList.remove('is-loading');
            submitBtn.textContent = originalText;
          }
          alert(result.data.error || 'Login failed. Please try again.');
          return;
        }

        // Store session token
        sessionStorage.setItem('authToken', result.data.token);
        sessionStorage.setItem('empId', result.data.empId);

        if (submitBtn) {
          submitBtn.classList.remove('is-loading');
          submitBtn.textContent = originalText;
        }
        showToast('Signed in successfully!', 'success');

        // Redirect to dashboard after toast is visible
        setTimeout(function () {
          window.location.href = 'dashboard.html';
        }, 800);
      })
      .catch(function () {
        if (submitBtn) {
          submitBtn.classList.remove('is-loading');
          submitBtn.textContent = originalText;
        }
        alert('Network error. Make sure the server is running.');
      });
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

  // Update sidebar badges with actual row counts from each panel's table
  tabs.forEach(function (tab) {
    var panelId = tab.getAttribute('data-panel');
    var panel = document.getElementById('panel-' + panelId);
    if (panel) {
      var rowCount = panel.querySelectorAll('.svc-table tbody tr').length;
      var badge = tab.querySelector('.sidebar__tab-badge');
      if (badge) badge.textContent = rowCount;
    }
  });

  /* Sidebar toggle */
  var sidebar = document.getElementById('sidebar');
  var toggleBtn = document.getElementById('sidebarToggle');
  if (sidebar && toggleBtn) {
    toggleBtn.addEventListener('click', function () {
      sidebar.classList.toggle('is-collapsed');
    });
  }

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

  /* ── Transition Cycle Modal ── */
  var overlay = document.getElementById('tcOverlay');
  var tcHead    = document.getElementById('tcHead');
  var tcGantt   = document.getElementById('tcGanttWrap');
  var tcFooter  = document.getElementById('tcFooter');
  var tcLegend  = document.getElementById('tcLegend');
  var tcClose   = document.getElementById('tcClose');

  function closeModal() {
    if (overlay) overlay.classList.remove('is-open');
  }
  if (tcClose) tcClose.addEventListener('click', closeModal);
  if (overlay) overlay.addEventListener('click', function (e) {
    if (e.target === overlay) closeModal();
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeModal();
  });

  /* Month helpers */
  var MON = ['Jan','Feb','Mar','Apr','Mai','Jun','Jul','Aug','Sep','Oct','Nov','Dez'];

  function buildMonthColumns(startDate, endDate) {
    var s = new Date(startDate);
    var e = new Date(endDate);
    // Expand range: start 2 months before, end 3 months after
    var from = new Date(s.getFullYear(), s.getMonth() - 2, 1);
    var to   = new Date(e.getFullYear(), e.getMonth() + 3, 1);
    var cols = [];
    var d = new Date(from);
    while (d < to) {
      cols.push({ year: d.getFullYear(), month: d.getMonth() });
      d = new Date(d.getFullYear(), d.getMonth() + 1, 1);
    }
    return cols;
  }

  function buildGanttPhases(startDate, endDate) {
    var s = new Date(startDate);
    var e = new Date(endDate);
    var total = e - s;
    return [
      { doi: '1 Strategic Planning',   wp: 'Service identification: Potential & Process analyses, SSC Masterplan, Service Profile', s: 0, e: 0.1, url: 'doi-strategic-planning.html' },
      { doi: '2 Budget',               wp: 'Release of service implementation', s: 0.08, e: 0.15, url: 'doi-budget.html' },
      { doi: '3 Operative Planning',   wp: 'Kick-off of transitions with SSC locations & Creation of job description, Release of recruitment', s: 0.12, e: 0.25, url: 'doi-operative-planning.html' },
      { doi: '',                        wp: 'Recruiting', s: 0.2, e: 0.45, sub: true },
      { doi: '',                        wp: 'Preparation of training material, IT & space', s: 0.3, e: 0.55, sub: true },
      { doi: '4 Execution',            wp: 'Preparation of process & documentation', s: 0.35, e: 0.55, url: 'doi-execution.html' },
      { doi: '',                        wp: 'Onboarding / Training / Knowledge transfer Cut-over', s: 0.5, e: 0.75, sub: true },
      { doi: '',                        wp: 'Hypercare / Stabilization', s: 0.7, e: 0.85, sub: true },
      { doi: '5 Monitoring',           wp: 'Tracking service effectivity & improvement', s: 0.8, e: 1.0, url: 'doi-monitoring.html' }
    ].map(function (p) {
      return {
        doi: p.doi,
        wp: p.wp,
        start: new Date(s.getTime() + total * p.s),
        end:   new Date(s.getTime() + total * p.e),
        sub: !!p.sub,
        url: p.url || ''
      };
    });
  }

  function getStatus(phaseEnd) {
    var now = new Date();
    if (now >= phaseEnd) return 'on-track';
    return 'not-started';
  }

  function openModal(row) {
    var cells = row.querySelectorAll('td');
    var vertical  = cells[2] ? cells[2].textContent : '';
    var service   = cells[3] ? cells[3].textContent : '';
    var position  = cells[4] ? cells[4].textContent : '';
    var respTSSC  = cells[5] ? cells[5].textContent : '';
    var respHQ    = cells[6] ? cells[6].textContent : '';
    var fte       = cells[7] ? cells[7].textContent : '';
    var capacity  = cells[8] ? cells[8].textContent : '';
    var startDate = cells[9] ? cells[9].textContent : '';
    var endDate   = cells[10] ? cells[10].textContent : '';

    /* ── Header ── */
    tcHead.innerHTML =
      '<div class="tc-head__row">' +
        '<div class="tc-head__left">' +
          '<h3 class="tc-head__unit">' + vertical + ' &ndash; ' + position + '</h3>' +
          '<p class="tc-head__service">Service Area: ' + service + '</p>' +
          '<div class="tc-head__labels">' +
            '<span class="tc-label tc-label--outline">Vertical: ' + vertical + '</span>' +
            '<span class="tc-label tc-label--outline">Job Position: ' + position + '</span>' +
            '<span class="tc-label tc-label--teal">' + capacity + '</span>' +
          '</div>' +
        '</div>' +
        '<div class="tc-head__right">' +
          '<div class="tc-badge tc-badge--status">Status</div>' +
          '<div class="tc-badge tc-badge--fte">Total FTE: ' + fte + '</div>' +
        '</div>' +
      '</div>';

    /* ── Gantt ── */
    var cols = buildMonthColumns(startDate, endDate);
    var phases = buildGanttPhases(startDate, endDate);

    // Group columns by year
    var years = {};
    cols.forEach(function (c) {
      if (!years[c.year]) years[c.year] = 0;
      years[c.year]++;
    });

    // Year header
    var yearRow = '<tr><td class="tc-gantt__doi-head" rowspan="5", >Degree of<br>Implementation (DOI)</td>' +
                  '<td class="tc-gantt__wp-head" rowspan="5">Work packages</td>';
    Object.keys(years).forEach(function (y) {
      yearRow += '<td class="tc-gantt__year" colspan="' + years[y] + '">' + y + '</td>';
    });
    yearRow += '<td class="tc-gantt__status-head" rowspan="2">Status</td></tr>';

    // Month header
    
    var monthRow = '<tr>';
    cols.forEach(function (c) {
      monthRow += '<td class="tc-gantt__month">' + MON[c.month] + '</td>';
    });
    monthRow += '</tr>';

    // Phase rows
    var bodyRows = '';
    var prevDoi = '';
    // Count sub-rows per DOI section for rowspan
    var doiGroups = [];
    var currentGroup = null;
    phases.forEach(function (p) {
      if (p.doi) {
        if (currentGroup) doiGroups.push(currentGroup);
        currentGroup = { doi: p.doi, count: 1 };
      } else if (currentGroup) {
        currentGroup.count++;
      }
    });
    if (currentGroup) doiGroups.push(currentGroup);

    var doiIdx = 0;
    var doiRowsLeft = 0;
    phases.forEach(function (p) {
      bodyRows += '<tr>';
      if (p.doi) {
        var g = doiGroups[doiIdx];
        var doiContent = p.url
          ? '<a href="' + p.url + '" class="tc-gantt__doi-link">' + p.doi + '</a>'
          : p.doi;
        bodyRows += '<td class="tc-gantt__doi" rowspan="' + g.count + '">' + doiContent + '</td>';
        doiIdx++;
        doiRowsLeft = g.count - 1;
      } else {
        doiRowsLeft--;
      }
      bodyRows += '<td class="tc-gantt__wp">' + p.wp + '</td>';
      cols.forEach(function (c) {
        var colStart = new Date(c.year, c.month, 1);
        var colEnd   = new Date(c.year, c.month + 1, 0);
        var barStart = p.start > colStart ? p.start : colStart;
        var barEnd   = p.end < colEnd ? p.end : colEnd;
        bodyRows += '<td class="tc-gantt__bar-cell">';
        if (barStart <= barEnd && p.start <= colEnd && p.end >= colStart) {
          var colDays = (colEnd - colStart) / 86400000;
          var left  = Math.max(0, (barStart - colStart) / 86400000 / colDays * 100);
          var right = Math.max(0, (colEnd - barEnd) / 86400000 / colDays * 100);
          bodyRows += '<div class="tc-gantt__bar tc-gantt__bar--grey" style="left:' + left + '%;right:' + right + '%"></div>';
        }
        bodyRows += '</td>';
      });
      var st = getStatus(p.end);
      bodyRows += '<td class="tc-gantt__status-cell"><span class="tc-status-dot tc-status-dot--' + st + '"></span></td>';
      bodyRows += '</tr>';
    });

    tcGantt.innerHTML = '<table class="tc-gantt"><thead>' + yearRow + monthRow + '</thead><tbody>' + bodyRows + '</tbody></table>';

    /* ── Footer boxes ── */
    tcFooter.innerHTML =
      '<div class="tc-footer__box">' +
        '<div class="tc-footer__title">Results since last update</div>' +
        '<div class="tc-footer__body"><ul style="margin:0;padding-left:14px"><li>Not yet started</li></ul></div>' +
      '</div>' +
      '<div class="tc-footer__box">' +
        '<div class="tc-footer__title">Next steps until next update</div>' +
        '<div class="tc-footer__body"></div>' +
      '</div>' +
      '<div class="tc-footer__box">' +
        '<div class="tc-footer__title">Critical open points and decisions</div>' +
        '<div class="tc-footer__body"></div>' +
      '</div>';

    /* ── Legend ── */
    tcLegend.innerHTML =
      '<span class="tc-legend__item"><span class="tc-legend__dot" style="background:#e74c3c"></span> Delivery not achievable</span>' +
      '<span class="tc-legend__item"><span class="tc-legend__dot" style="background:#f5c242"></span> Deliver under risk</span>' +
      '<span class="tc-legend__item"><span class="tc-legend__dot" style="background:#93C11C"></span> On track</span>' +
      '<span class="tc-legend__item"><span class="tc-legend__dot" style="background:#fff;border:1px solid #aaa"></span> Not started</span>' +
      '<span class="tc-legend__item"><span class="tc-legend__tri" style="border-bottom-color:#222"></span> Go live</span>' +
      '<span class="tc-legend__item"><span class="tc-legend__tri" style="border-bottom-color:#93C11C"></span> Milestone completed</span>';

    overlay.classList.add('is-open');
  }

  document.querySelectorAll('.svc-row-expand').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var row = btn.closest('tr');
      if (!row) return;

      // If already expanded, collapse it
      var existingExpand = row.nextElementSibling;
      if (existingExpand && existingExpand.classList.contains('svc-expand-row')) {
        btn.classList.remove('is-expanded');
        var inner = existingExpand.querySelector('.svc-expand-inner');
        if (inner) inner.classList.remove('is-open');
        setTimeout(function () { existingExpand.remove(); }, 450);
        return;
      }

      // Collapse any other open expansions in this table
      var table = row.closest('table');
      table.querySelectorAll('.svc-expand-row').forEach(function (er) {
        var prevBtn = er.previousElementSibling ? er.previousElementSibling.querySelector('.svc-row-expand') : null;
        if (prevBtn) prevBtn.classList.remove('is-expanded');
        var innerEl = er.querySelector('.svc-expand-inner');
        if (innerEl) innerEl.classList.remove('is-open');
        setTimeout(function () { er.remove(); }, 450);
      });

      btn.classList.add('is-expanded');

      // Build inline content (same as modal)
      var colCount = row.querySelectorAll('td').length;
      var expandRow = document.createElement('tr');
      expandRow.className = 'svc-expand-row';
      var expandTd = document.createElement('td');
      expandTd.setAttribute('colspan', colCount);
      var expandInner = document.createElement('div');
      expandInner.className = 'svc-expand-inner';
      var expandContent = document.createElement('div');
      expandContent.className = 'svc-expand-content';

      // Build header + gantt + footer + legend using openModal data
      var cells = row.querySelectorAll('td');
      var vertical  = cells[2] ? cells[2].textContent : '';
      var service   = cells[3] ? cells[3].textContent : '';
      var position  = cells[4] ? cells[4].textContent : '';
      var fte       = cells[7] ? cells[7].textContent : '';
      var capacity  = cells[8] ? cells[8].textContent : '';
      var startDate = cells[9] ? cells[9].textContent : '';
      var endDate   = cells[10] ? cells[10].textContent : '';

      /* Header */
      var headHTML =
        '<div class="tc-head">' +
          '<div class="tc-head__row">' +
            '<div class="tc-head__left">' +
              '<h3 class="tc-head__unit">' + vertical + ' &ndash; ' + position + '</h3>' +
              '<p class="tc-head__service">Service Area: ' + service + '</p>' +
              '<div class="tc-head__labels">' +
                '<span class="tc-label tc-label--outline">Vertical: ' + vertical + '</span>' +
                '<span class="tc-label tc-label--outline">Job Position: ' + position + '</span>' +
                '<span class="tc-label tc-label--teal">' + capacity + '</span>' +
              '</div>' +
            '</div>' +
            '<div class="tc-head__right">' +
              '<div class="tc-badge tc-badge--status">Status</div>' +
              '<div class="tc-badge tc-badge--fte">Total FTE: ' + fte + '</div>' +
            '</div>' +
          '</div>' +
        '</div>';

      /* Gantt */
      var cols = buildMonthColumns(startDate, endDate);
      var phases = buildGanttPhases(startDate, endDate);
      var years = {};
      cols.forEach(function (c) {
        if (!years[c.year]) years[c.year] = 0;
        years[c.year]++;
      });
      var yearRow = '<tr><td class="tc-gantt__doi-head" rowspan="5">Degree of<br>Implementation (DOI)</td>' +
                    '<td class="tc-gantt__wp-head" rowspan="5">Work packages</td>';
      Object.keys(years).forEach(function (y) {
        yearRow += '<td class="tc-gantt__year" colspan="' + years[y] + '">' + y + '</td>';
      });
      yearRow += '<td class="tc-gantt__status-head" rowspan="2">Status</td></tr>';
      var monthRow = '<tr>';
      cols.forEach(function (c) {
        monthRow += '<td class="tc-gantt__month">' + MON[c.month] + '</td>';
      });
      monthRow += '</tr>';
      var bodyRows = '';
      var doiGroups = [];
      var currentGroup = null;
      phases.forEach(function (p) {
        if (p.doi) {
          if (currentGroup) doiGroups.push(currentGroup);
          currentGroup = { doi: p.doi, count: 1 };
        } else if (currentGroup) {
          currentGroup.count++;
        }
      });
      if (currentGroup) doiGroups.push(currentGroup);
      var doiIdx = 0;
      phases.forEach(function (p) {
        bodyRows += '<tr>';
        if (p.doi) {
          var g = doiGroups[doiIdx];
          var doiContent = p.url
            ? '<a href="' + p.url + '" class="tc-gantt__doi-link">' + p.doi + '</a>'
            : p.doi;
          bodyRows += '<td class="tc-gantt__doi" rowspan="' + g.count + '">' + doiContent + '</td>';
          doiIdx++;
        }
        bodyRows += '<td class="tc-gantt__wp">' + p.wp + '</td>';
        cols.forEach(function (c) {
          var colStart = new Date(c.year, c.month, 1);
          var colEnd   = new Date(c.year, c.month + 1, 0);
          var barStart = p.start > colStart ? p.start : colStart;
          var barEnd   = p.end < colEnd ? p.end : colEnd;
          bodyRows += '<td class="tc-gantt__bar-cell">';
          if (barStart <= barEnd && p.start <= colEnd && p.end >= colStart) {
            var colDays = (colEnd - colStart) / 86400000;
            var left  = Math.max(0, (barStart - colStart) / 86400000 / colDays * 100);
            var right = Math.max(0, (colEnd - barEnd) / 86400000 / colDays * 100);
            bodyRows += '<div class="tc-gantt__bar tc-gantt__bar--grey" style="left:' + left + '%;right:' + right + '%"></div>';
          }
          bodyRows += '</td>';
        });
        var st = getStatus(p.end);
        bodyRows += '<td class="tc-gantt__status-cell"><span class="tc-status-dot tc-status-dot--' + st + '"></span></td>';
        bodyRows += '</tr>';
      });
      var ganttHTML = '<div class="tc-gantt-wrap"><table class="tc-gantt"><thead>' + yearRow + monthRow + '</thead><tbody>' + bodyRows + '</tbody></table></div>';

      /* Footer */
      var footerHTML =
        '<div class="tc-footer">' +
          '<div class="tc-footer__box">' +
            '<div class="tc-footer__title">Results since last update</div>' +
            '<div class="tc-footer__body"><ul style="margin:0;padding-left:14px"><li>Not yet started</li></ul></div>' +
          '</div>' +
          '<div class="tc-footer__box">' +
            '<div class="tc-footer__title">Next steps until next update</div>' +
            '<div class="tc-footer__body"></div>' +
          '</div>' +
          '<div class="tc-footer__box">' +
            '<div class="tc-footer__title">Critical open points and decisions</div>' +
            '<div class="tc-footer__body"></div>' +
          '</div>' +
        '</div>';

      /* Legend */
      var legendHTML =
        '<div class="tc-legend">' +
          '<span class="tc-legend__item"><span class="tc-legend__dot" style="background:#e74c3c"></span> Delivery not achievable</span>' +
          '<span class="tc-legend__item"><span class="tc-legend__dot" style="background:#f5c242"></span> Deliver under risk</span>' +
          '<span class="tc-legend__item"><span class="tc-legend__dot" style="background:#93C11C"></span> On track</span>' +
          '<span class="tc-legend__item"><span class="tc-legend__dot" style="background:#fff;border:1px solid #aaa"></span> Not started</span>' +
          '<span class="tc-legend__item"><span class="tc-legend__tri" style="border-bottom-color:#222"></span> Go live</span>' +
          '<span class="tc-legend__item"><span class="tc-legend__tri" style="border-bottom-color:#93C11C"></span> Milestone completed</span>' +
        '</div>';

      expandContent.innerHTML = headHTML + ganttHTML + footerHTML + legendHTML;
      expandInner.appendChild(expandContent);
      expandTd.appendChild(expandInner);
      expandRow.appendChild(expandTd);
      row.parentNode.insertBefore(expandRow, row.nextSibling);

      // Trigger open animation on next frame
      requestAnimationFrame(function () {
        expandInner.classList.add('is-open');
      });
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
