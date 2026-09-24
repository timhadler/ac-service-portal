/**
 * pm-form.js
 * ──────────
 * The two-step property manager lead form on property-managers.html.
 *
 * Why two steps:
 *   Short forms convert far better than long ones, but a B2B enquiry
 *   still needs qualifying. So step one asks for the two fields that
 *   make someone contactable (email + company) and submits them as a
 *   real lead on its own. Step two then asks the qualifying questions
 *   — portfolio size, software, region — as a separate, optional
 *   submission. If the manager abandons step two, we have still
 *   captured the lead.
 *
 *   That is also why step one does NOT advance on a failed request:
 *   showing the qualifying questions when the lead was never sent
 *   would lose the enquiry entirely. Step two is allowed to fail more
 *   softly, because by then the lead is already in.
 *
 * ── Netlify Forms setup ────────────────────────────────────────────
 * Two forms are registered, so the two submissions stay distinguishable
 * in the dashboard:
 *   - "property-managers"          — step one, the lead
 *   - "property-managers-details"  — step two, the qualifying answers
 *
 * Each needs, in the HTML:
 *   - a matching name="..." on the <form>
 *   - data-netlify="true"
 *   - a hidden <input type="hidden" name="form-name" value="...">
 *
 * Step two also carries the email and company from step one in hidden
 * inputs, so the two submissions can be matched back up.
 *
 * Submissions appear in: Netlify dashboard → Site → Forms.
 * Set up a notification there so a portfolio lead reaches Ros straight
 * away rather than sitting in the dashboard.
 *
 * ── Testing locally ────────────────────────────────────────────────
 * Netlify Forms only processes on Netlify infrastructure, not locally,
 * so the real fetch path always fails when you open the file directly.
 * LOCAL_TESTING below short-circuits it. Set it to false before deploy.
 */

(function () {
  'use strict';

  // ── Set to false before deploying to Netlify ──────────────────
  var LOCAL_TESTING = true;

  var stepOne  = document.getElementById('pm-step-1');
  var stepTwo  = document.getElementById('pm-step-2');
  var leadForm = document.getElementById('pm-form-lead');
  var detForm  = document.getElementById('pm-form-detail');
  var skipBtn  = document.getElementById('pm-form-skip');
  var success  = document.getElementById('pm-form-success');

  // Exit silently if this script is loaded on a page without the form
  if (!leadForm) return;

  // ── Step one — the capture ─────────────────────────────────────
  leadForm.addEventListener('submit', function (e) {
    e.preventDefault();

    if (!validateLead()) return;

    var btn = leadForm.querySelector('[type="submit"]');

    post(leadForm, btn, 'Request a portfolio programme →')
      .then(function () {
        carryOverToStepTwo();
        showStepTwo();
      })
      .catch(function () {
        // Deliberately does not advance — see the note at the top.
        showNetworkError(
          btn,
          'We couldn’t send that just now — please try again, or call Ros on 0800 247 227.'
        );
      });
  });

  // ── Step two — the qualification ───────────────────────────────
  detForm.addEventListener('submit', function (e) {
    e.preventDefault();

    var btn = detForm.querySelector('[type="submit"]');

    post(detForm, btn, 'Send these too →')
      .then(showSuccess)
      .catch(function () {
        // The lead is already captured, so this failure is not fatal —
        // say so plainly rather than alarming someone who is already
        // on our list.
        showNetworkError(
          btn,
          'We couldn’t send those extra details — but your enquiry is already with us, so Ros will be in touch either way.'
        );
      });
  });

  // Step two is genuinely optional; skipping goes straight to the
  // same closing state as completing it.
  if (skipBtn) {
    skipBtn.addEventListener('click', showSuccess);
  }

  // ── Submission ─────────────────────────────────────────────────
  // Returns a promise so each step decides for itself what a failure
  // means. Netlify Forms expects a URL-encoded body, not multipart.
  function post(form, btn, idleLabel) {
    setSubmitting(btn, true, idleLabel);

    if (LOCAL_TESTING) {
      setSubmitting(btn, false, idleLabel);
      return Promise.resolve();
    }

    return fetch('/', {
      method:  'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body:    encode(new FormData(form)),
    })
      .then(function (res) {
        if (!res.ok) throw new Error('Network response was not ok');
      })
      .finally(function () {
        setSubmitting(btn, false, idleLabel);
      });
  }

  function encode(data) {
    var pairs = [];
    data.forEach(function (value, key) {
      pairs.push(
        encodeURIComponent(key) + '=' + encodeURIComponent(value)
      );
    });
    return pairs.join('&');
  }

  // ── Step transitions ───────────────────────────────────────────
  function carryOverToStepTwo() {
    document.getElementById('pm-detail-email').value =
      document.getElementById('pm-email').value.trim();
    document.getElementById('pm-detail-company').value =
      document.getElementById('pm-company').value.trim();
  }

  function showStepTwo() {
    stepOne.hidden = true;
    stepTwo.hidden = false;

    // Move focus into the new step so screen readers announce the
    // confirmation rather than leaving focus on a button that is gone.
    stepTwo.setAttribute('tabindex', '-1');
    stepTwo.focus();
  }

  function showSuccess() {
    stepOne.hidden = true;
    stepTwo.hidden = true;
    success.hidden = false;

    success.setAttribute('tabindex', '-1');
    success.focus();
  }

  // ── Validation ─────────────────────────────────────────────────
  // Only step one is validated. Step two is optional by design, so
  // an empty answer there is a valid answer.
  function validateLead() {
    clearErrors(leadForm);

    var valid   = true;
    var email   = document.getElementById('pm-email');
    var company = document.getElementById('pm-company');

    if (!email.value.trim()) {
      showError(email, 'Please enter your email address.');
      valid = false;
    } else if (!isValidEmail(email.value.trim())) {
      showError(email, 'Please enter a valid email address.');
      valid = false;
    }

    if (!company.value.trim()) {
      showError(company, 'Please enter your company name.');
      valid = false;
    }

    // Scroll the first errored field into view — important on mobile
    // where the error may be off-screen
    if (!valid) {
      var firstError = leadForm.querySelector('.form-input--error');
      if (firstError) {
        firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
        firstError.focus();
      }
    }

    return valid;
  }

  function isValidEmail(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  }

  // ── Error display ──────────────────────────────────────────────
  function showError(input, message) {
    input.classList.add('form-input--error');

    // ARIA: tell screen readers the field is invalid and point to the message
    input.setAttribute('aria-invalid', 'true');
    input.setAttribute('aria-describedby', input.id + '-error');

    var err       = document.createElement('span');
    err.id        = input.id + '-error';
    err.className = 'form-error';
    err.setAttribute('role', 'alert');
    err.textContent = message;

    input.parentNode.appendChild(err);
  }

  function clearErrors(form) {
    form.querySelectorAll('.form-input--error').forEach(function (el) {
      el.classList.remove('form-input--error');
      el.removeAttribute('aria-invalid');
      el.removeAttribute('aria-describedby');
    });
    form.querySelectorAll('.form-error').forEach(function (el) {
      el.remove();
    });
  }

  function showNetworkError(btn, message) {
    // Remove any previous network error before inserting a new one
    var existing = btn.form.querySelector('.form-error--network');
    if (existing) existing.remove();

    var err       = document.createElement('p');
    err.className = 'form-error form-error--network';
    err.setAttribute('role', 'alert');
    err.textContent = message;

    // Insert above the submit button so it's seen before re-submitting
    btn.parentNode.insertBefore(err, btn);
  }

  // ── State helpers ──────────────────────────────────────────────
  function setSubmitting(btn, isSubmitting, idleLabel) {
    btn.disabled    = isSubmitting;
    btn.textContent = isSubmitting ? 'Sending…' : idleLabel;
  }

})();
