/**
 * callback-form.js
 * ────────────────
 * The "Not sure which service you need?" callback box on services.html.
 * Two fields, name and phone, submitted as one Netlify form.
 *
 * ── Netlify Forms setup ────────────────────────────────────────────
 * Registered as "callback", kept apart from "contact" so a callback
 * request is distinguishable in the dashboard. The HTML carries:
 *   - name="callback" and data-netlify="true" on the <form>
 *   - <input type="hidden" name="form-name" value="callback">
 *   - the bot-field honeypot, as on the property managers form
 *
 * The box can be switched off with show_callback_box in site.vars. It
 * is then hidden rather than removed, so the form stays registered.
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

  var form    = document.getElementById('callback-form');
  var success = document.getElementById('callback-success');

  // Exit silently if this script is loaded on a page without the form
  if (!form) return;

  var IDLE_LABEL = 'Call me back →';

  form.addEventListener('submit', function (e) {
    e.preventDefault();

    if (!validate()) return;

    var btn = form.querySelector('[type="submit"]');

    post(btn)
      .then(showSuccess)
      .catch(function () {
        showNetworkError(
          btn,
          'We couldn’t send that just now — please try again, or call Ros on 0800 247 227.'
        );
      });
  });

  // ── Submission ─────────────────────────────────────────────────
  // Netlify Forms expects a URL-encoded body, not multipart.
  function post(btn) {
    setSubmitting(btn, true);

    if (LOCAL_TESTING) {
      setSubmitting(btn, false);
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
        setSubmitting(btn, false);
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

  // ── Validation ─────────────────────────────────────────────────
  function validate() {
    clearErrors();

    var valid = true;
    var name  = document.getElementById('callback-name');
    var phone = document.getElementById('callback-phone');

    if (!name.value.trim()) {
      showError(name, 'Please enter your name.');
      valid = false;
    }

    if (!phone.value.trim()) {
      showError(phone, 'Please enter your phone number.');
      valid = false;
    } else if (phone.value.replace(/\D/g, '').length < 7) {
      showError(phone, 'Please enter a valid phone number.');
      valid = false;
    }

    if (!valid) {
      var firstError = form.querySelector('.form-input--error');
      if (firstError) {
        firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
        firstError.focus();
      }
    }

    return valid;
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

  function showNetworkError(btn, message) {
    var existing = form.querySelector('.form-error--network');
    if (existing) existing.remove();

    var err       = document.createElement('p');
    err.className = 'form-error form-error--network';
    err.setAttribute('role', 'alert');
    err.textContent = message;

    btn.parentNode.insertBefore(err, btn);
  }

  // ── State helpers ──────────────────────────────────────────────
  function setSubmitting(btn, isSubmitting) {
    btn.disabled    = isSubmitting;
    btn.textContent = isSubmitting ? 'Sending…' : IDLE_LABEL;
  }

  function showSuccess() {
    form.hidden    = true;
    success.hidden = false;

    // Move focus into the success block so screen readers announce it
    success.setAttribute('tabindex', '-1');
    success.focus();
  }

})();
