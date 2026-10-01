/**
 * forms.js
 * ────────
 * Contact form validation and submission.
 *
 * Handles:
 *   1. Client-side validation before submission
 *   2. Submitting to Netlify Forms via fetch (no backend needed)
 *   3. Hiding the form and revealing the success state on completion
 *   4. Showing a fallback error message if the network request fails
 *
 * ── Netlify Forms setup ────────────────────────────────────────────
 * For this to work on Netlify, the <form> in contact.html needs:
 *   - name="contact"          — Netlify uses this as the form name
 *   - data-netlify="true"     — tells Netlify to process submissions
 *   - a hidden input:
 *     <input type="hidden" name="form-name" value="contact">
 *
 * The HTML already includes these (see contact.html).
 * No other configuration needed — Netlify detects it on deploy.
 *
 * Submissions appear in: Netlify dashboard → Site → Forms
 * Email notifications can be configured there too.
 *
 * ── Testing locally ────────────────────────────────────────────────
 * Netlify Forms only processes on Netlify infrastructure, not locally.
 * LOCAL_TESTING below short-circuits the fetch. Set it to false before
 * deploy.
 */

(function () {
  'use strict';

  // ── Set to false before deploying to Netlify ──────────────────
  var LOCAL_TESTING = true;

  var form    = document.getElementById('contact-form');
  var success = document.getElementById('form-success');

  // Exit silently if this script is loaded on a page without the form
  if (!form) return;

  form.addEventListener('submit', function (e) {
    e.preventDefault();

    if (!validateForm()) return;

    submitForm();
  });

  // ── Submission ─────────────────────────────────────────────────
  function submitForm() {

    if (LOCAL_TESTING) {
      showSuccess();
      return;
    }

    var submitBtn = form.querySelector('[type="submit"]');
    setSubmitting(submitBtn, true);

    fetch('/', {
      method:  'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body:    encode(new FormData(form)),
    })
      .then(function (res) {
        if (!res.ok) throw new Error('Network response was not ok');
        showSuccess();
      })
      .catch(function () {
        showNetworkError(submitBtn);
      })
      .finally(function () {
        setSubmitting(submitBtn, false);
      });
  }

  // Netlify Forms expects URL-encoded body, not multipart FormData
  function encode(data) {
    var pairs = [];
    data.forEach(function (value, key) {
      pairs.push(
        encodeURIComponent(key) + '=' + encodeURIComponent(value)
      );
    });
    return pairs.join('&');
  }

  // ── Validation ─────────────────────────────────────────────────
  function validateForm() {
    clearErrors();

    var valid = true;

    var name    = document.getElementById('name');
    var phone   = document.getElementById('phone');
    var email   = document.getElementById('email');
    var service = document.getElementById('service');

    if (!name.value.trim()) {
      showError(name, 'Please enter your name.');
      valid = false;
    }

    if (!phone.value.trim()) {
      showError(phone, 'Please enter your phone number.');
      valid = false;
    } else if (!isValidPhone(phone.value)) {
      showError(phone, 'Please enter a valid phone number.');
      valid = false;
    }

    // Email and message are optional; an email, if given, must be usable.
    if (email.value.trim() && !isValidEmail(email.value.trim())) {
      showError(email, 'Please enter a valid email address.');
      valid = false;
    }

    if (!service.value) {
      showError(service, 'Please select an option.');
      valid = false;
    }

    // Scroll the first errored field into view — important on mobile
    // where the error may be off-screen
    if (!valid) {
      var firstError = form.querySelector('.form-input--error');
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

  // Loose on purpose: NZ landlines, mobiles, 0800 and +64 all pass, as
  // long as there are enough digits to call back.
  function isValidPhone(value) {
    return value.replace(/\D/g, '').length >= 7;
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

  function clearErrors() {
    form.querySelectorAll('.form-input--error').forEach(function (el) {
      el.classList.remove('form-input--error');
      el.removeAttribute('aria-invalid');
      el.removeAttribute('aria-describedby');
    });
    form.querySelectorAll('.form-error').forEach(function (el) {
      el.remove();
    });
  }

  // ── State helpers ──────────────────────────────────────────────
  function setSubmitting(btn, isSubmitting) {
    btn.disabled    = isSubmitting;
    btn.textContent = isSubmitting ? 'Sending\u2026' : 'Send message \u2192';
  }

  function showSuccess() {
    form.hidden    = true;
    success.hidden = false;
    // Pushed to GTM as generate_lead by analytics.js
    form.dispatchEvent(new CustomEvent('aircare:lead', {
      bubbles: true, detail: { form: 'contact', step: 1, test: LOCAL_TESTING }
    }));

    // Move focus into the success block so screen readers announce it
    success.setAttribute('tabindex', '-1');
    success.focus();
  }

  function showNetworkError(btn) {
    // Remove any previous network error before inserting a new one
    var existing = form.querySelector('.form-error--network');
    if (existing) existing.remove();

    var err       = document.createElement('p');
    err.className = 'form-error form-error--network';
    err.setAttribute('role', 'alert');
    err.textContent =
      'Something went wrong \u2014 please try again, or call us on 0800 247 227.';

    // Insert above the submit button so it's seen before re-submitting
    btn.parentNode.insertBefore(err, btn);
  }

})();