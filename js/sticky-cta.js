/**
 * sticky-cta.js
 * ─────────────
 * Slides the fixed mobile CTA bar (.sticky-cta) out of the way while it
 * would only get in the way:
 *
 *  1. While the form its first button points at (href="#...") is on
 *     screen. The bar exists to bring that form within one tap; once the
 *     form is in view it repeats it, and covers the bottom of the form.
 *  2. While any form field has focus. A fixed bottom bar rides up with
 *     the on-screen keyboard and sits over the field being typed into.
 *
 * The bar is display: none above the mobile breakpoint, so on desktop
 * this toggles a class on an element nobody can see. The hiding itself
 * is CSS (.sticky-cta.is-hidden in css/components.css).
 *
 * Generic on purpose: it reads its target from the markup, so any page
 * that includes a sticky CTA partial and this script gets the same
 * behaviour without a change here.
 */

(function () {
  'use strict';

  const bar = document.querySelector('.sticky-cta');
  if (!bar) return;

  const link = bar.querySelector('a[href^="#"]');
  const target = link && document.querySelector(link.getAttribute('href'));

  let targetInView = false;
  let fieldFocused = false;

  function update() {
    bar.classList.toggle('is-hidden', targetInView || fieldFocused);
  }

  if (target && 'IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) {
      targetInView = entries[0].isIntersecting;
      update();
    }).observe(target);
  }

  const isField = function (el) {
    return el && el.matches && el.matches('input, select, textarea');
  };

  document.addEventListener('focusin', function (e) {
    if (isField(e.target)) { fieldFocused = true; update(); }
  });

  document.addEventListener('focusout', function (e) {
    if (isField(e.target)) { fieldFocused = false; update(); }
  });

})();
