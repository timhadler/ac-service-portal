/**
 * navigation.js
 * ─────────────
 * Handles:
 *  1. Mobile hamburger toggle
 *  2. Active link highlighting based on current page
 *  3. Closes mobile nav on link click, on a tap outside it, and on Escape
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
      link.addEventListener('click', closeNav);
    });

    // A tap anywhere outside the header closes the drawer. On a phone
    // that is the natural way to dismiss it; without this the drawer
    // stayed open over the page until a link or the toggle was hit.
    document.addEventListener('click', function (e) {
      if (mobileNav.classList.contains('is-open') &&
          !e.target.closest('.site-header')) {
        closeNav();
      }
    });

    // Escape closes the drawer and returns focus to the toggle, so a
    // keyboard user is never trapped behind an open menu.
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && mobileNav.classList.contains('is-open')) {
        closeNav();
        hamburger.focus();
      }
    });
  }

  function closeNav() {
    mobileNav.classList.remove('is-open');
    hamburger.setAttribute('aria-expanded', 'false');
  }

  // ── Active link highlighting ──────────────────────────────
  // Matches the current filename against nav hrefs and marks
  // the corresponding link with aria-current="page".
  //
  // The host serves foo.html at /foo, so on the live site the path has
  // no extension while every nav href still has one. Compare with the
  // extension stripped from both, or nothing but the home page ever
  // matches. (It looks fine under `python3 -m http.server`, which serves
  // the .html URLs directly — which is why this went unnoticed.)
  const bare = function (s) { return s.replace(/\.html$/, ''); };
  const currentFile = bare(window.location.pathname.split('/').pop() || 'index.html');

  // A vertical page such as commercial-clinical is not itself a nav item, but
  // it sits under Commercial, so that item is lit as the active section. The
  // test is positional rather than a hardcoded list: a nav link owns the
  // section when the current filename is that link's own name followed by a
  // hyphen. Adding commercial-office.html later needs no change here.
  //
  // The two states are deliberately different values. aria-current="page"
  // asserts that the link points at the page you are on, which is not true of
  // Commercial while you are reading the clinical page — a screen reader would
  // announce the wrong thing. aria-current="true" says "the current item in
  // this set", which is exactly the claim being made. Both get the same
  // styling; see the [aria-current] rules in css/layout.css.
  document.querySelectorAll('.nav__links a, .nav__mobile a').forEach(function (link) {
    const href = link.getAttribute('href');
    if (!href) return;

    const name = bare(href);
    if (name === currentFile) {
      link.setAttribute('aria-current', 'page');
    } else if (currentFile.indexOf(name + '-') === 0) {
      link.setAttribute('aria-current', 'true');
    }
  });

})();