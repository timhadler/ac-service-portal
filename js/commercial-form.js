/**
 * commercial-form.js
 * ──────────────────
 * The two-step commercial quote form, shared by the hub page and the
 * three vertical sub-pages.
 *
 * Why two steps:
 *   Step one captures a contactable lead (premises type, suburb,
 *   email) and submits it on its own. Step two then asks the
 *   qualifying questions — the important one being units per site,
 *   without which a quote cannot be produced at all. If the visitor
 *   abandons step two we still have someone to call.
 *
 *   Step one therefore does NOT advance on a failed request: showing
 *   the qualifying questions when the lead never sent would lose the
 *   enquiry. Step two fails more softly, because by then the lead is in.
 *
 * ── Premises type on sub-pages ─────────────────────────────────────
 * Each sub-page sets a hidden input (name="premises") to its own
 * vertical and omits the select, so the field arrives pre-filled.
 * The hub renders the select instead. Both submit the same field name.
 *
 * ── Netlify Forms setup ────────────────────────────────────────────
 * Two forms are registered so the two submissions stay distinguishable:
 *   - "commercial-quote"          — step one, the lead
 *   - "commercial-quote-details"  — step two, the qualifying answers
 *
 * These are deliberately separate from the property manager page's
 * "property-managers" forms. Lead values differ between the two
 * audiences and mixing them corrupts both sets of conversion figures.
 *
 * Each needs, in the HTML: a matching name="..." on the <form>,
 * data-netlify="true", and a hidden <input name="form-name" value="...">.
 *
 * ── Testing locally ────────────────────────────────────────────────
 * Netlify Forms only processes on Netlify infrastructure, so the real
 * fetch path always fails when the file is opened directly.
 * LOCAL_TESTING short-circuits it. Set it to false before deploy.
 */

(function () {
  'use strict';

  // ── Set to false before deploying to Netlify ──────────────────
  var LOCAL_TESTING = true;

  var stepOne  = document.getElementById('comm-step-1');
  var stepTwo  = document.getElementById('comm-step-2');
  var leadForm = document.getElementById('comm-form-lead');
  var detForm  = document.getElementById('comm-form-detail');
  var skipBtn  = document.getElementById('comm-form-skip');
  var success  = document.getElementById('comm-form-success');

  // Exit silently if this script is loaded on a page without the form
  if (!leadForm) return;

  // ── Step one — the capture ─────────────────────────────────────
  leadForm.addEventListener('submit', function (e) {
    e.preventDefault();

    if (!validateLead()) return;

    var btn = leadForm.querySelector('[type="submit"]');

    post(leadForm, btn, 'Request a quote →')
      .then(function () {
        carryOverToStepTwo();
        showStepTwo();
      })
      .catch(function () {
        // Deliberately does not advance — see the note at the top.
        showNetworkError(
          btn,
          'We couldn’t send that just now — please try again, or call us on 0800 247 227.'
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
        // The lead is already captured, so this failure is not fatal.
        showNetworkError(
          btn,
          'We couldn’t send those extra details — but your enquiry is already with us, so we’ll be in touch either way.'
        );
      });
  });

  // Step two is genuinely optional; skipping lands on the same close.
  if (skipBtn) {
    skipBtn.addEventListener('click', showSuccess);
  }

  // ── Submission ─────────────────────────────────────────────────
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

  // Netlify Forms expects a URL-encoded body, not multipart FormData
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
  // Carries the identifying answers from step one into step two's
  // hidden fields so the two submissions can be matched up.
  function carryOverToStepTwo() {
    copy('comm-email',    'comm-detail-email');
    copy('comm-suburb',   'comm-detail-suburb');
    copy('comm-premises', 'comm-detail-premises');
  }

  function copy(fromId, toId) {
    var from = document.getElementById(fromId);
    var to   = document.getElementById(toId);
    if (from && to) to.value = from.value.trim();
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
  // Only step one is validated. Step two is optional by design, so an
  // empty answer there is a valid answer.
  function validateLead() {
    clearErrors(leadForm);

    var valid  = true;
    var email  = document.getElementById('comm-email');
    var suburb = document.getElementById('comm-suburb');
    // Present on the hub only — the sub-pages pre-fill it as a hidden
    // input, so there is nothing for the visitor to get wrong.
    var premises = leadForm.querySelector('select#comm-premises');

    if (premises && !premises.value) {
      showError(premises, 'Please choose the type of premises.');
      valid = false;
    }

    if (!suburb.value.trim()) {
      showError(suburb, 'Please tell us the suburb.');
      valid = false;
    }

    if (!email.value.trim()) {
      showError(email, 'Please enter your email address.');
      valid = false;
    } else if (!isValidEmail(email.value.trim())) {
      showError(email, 'Please enter a valid email address.');
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
