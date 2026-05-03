/**
 * navigation.js
 * ─────────────
 * Handles:
 *  1. Mobile hamburger toggle
 *  2. Active link highlighting based on current page
 *  3. Closes mobile nav on link click
 */

(function () {
  'use strict';

  // ── Mobile hamburger ──────────────────────────────────────
  const hamburger = document.querySelector('.nav__hamburger');
  const mobileNav = document.getElementById('nav-mobile');

  if (hamburger && mobileNav) {
    hamburger.addEventListener('click', function () {
      const isOpen = mobileNav.classList.toggle('is-open');
      hamburger.setAttribute('aria-expanded', String(isOpen));
    });

    // Close nav when a link inside it is clicked
    mobileNav.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        mobileNav.classList.remove('is-open');
        hamburger.setAttribute('aria-expanded', 'false');
      });
    });
  }

  // ── Active link highlighting ──────────────────────────────
  // Matches the current filename against nav hrefs and marks
  // the corresponding link with aria-current="page".
  const currentFile = window.location.pathname.split('/').pop() || 'index.html';

  document.querySelectorAll('.nav__links a, .nav__mobile a').forEach(function (link) {
    const href = link.getAttribute('href');
    if (href && href === currentFile) {
      link.setAttribute('aria-current', 'page');
    }
  });

})();