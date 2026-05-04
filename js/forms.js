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
 * While developing locally, submissions will hit the catch() block.
 * To test the success flow locally, temporarily uncomment the two
 * lines marked below inside submitForm().
 */

(function () {
  'use strict';

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

    // ── Local testing: uncomment these two lines to skip the fetch ──
    showSuccess();
    return;

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

    var fname   = document.getElementById('fname');
    var email   = document.getElementById('email');
    var service = document.getElementById('service');
    var msg     = document.getElementById('msg');

    if (!fname.value.trim()) {
      showError(fname, 'Please enter your first name.');
      valid = false;
    }

    if (!email.value.trim()) {
      showError(email, 'Please enter your email address.');
      valid = false;
    } else if (!isValidEmail(email.value.trim())) {
      showError(email, 'Please enter a valid email address.');
      valid = false;
    }

    if (!service.value) {
      showError(service, 'Please select an option.');
      valid = false;
    }

    if (!msg.value.trim()) {
      showError(msg, 'Please add a message.');
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