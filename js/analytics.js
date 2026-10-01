/**
 * analytics.js
 * ────────────
 * Passes form events to Google Tag Manager. Included on every page.
 *
 * GTM (GTM-K83QWL5G, installed in partials/head.html) owns every tag:
 * GA4, Google Ads and all click tracking. Phone, email and booking
 * clicks need nothing from this file. GTM's Link Click triggers see
 * them directly and read the nearest data-track-location for the
 * section. This file only covers what GTM cannot see for itself: a
 * form reaching its success state, which the form scripts announce
 * with a DOM event dispatched on the <form>.
 *
 * What is pushed to the dataLayer:
 *
 *   event                 when                               form_step
 *   generate_lead         contact, callback, PM step one     1
 *   lead_details_submit   PM step two sent                   2
 *   lead_details_skip     PM "No thanks, I'm done"           2
 *
 * Every push carries all four params, so GTM's merged dataLayer state
 * never leaks a value from an earlier push:
 *
 *   form_name       the flow, constant across steps: contact, callback,
 *                   property-managers. Not the Netlify form name.
 *   form_step       1 or 2
 *   track_location  nearest data-track-location around the form, else
 *                   "untagged"
 *   test_mode       true while the form's LOCAL_TESTING is on. GTM's
 *                   lead triggers exclude these, so a short-circuited
 *                   "success" never counts as a lead.
 */

(function () {
  'use strict';

  window.dataLayer = window.dataLayer || [];

  function push(event, e) {
    var d       = e.detail || {};
    var section = e.target.closest && e.target.closest('[data-track-location]');

    window.dataLayer.push({
      event:          event,
      form_name:      d.form || '',
      form_step:      d.step || 1,
      track_location: section ? section.getAttribute('data-track-location') : 'untagged',
      test_mode:      d.test === true
    });
  }

  document.addEventListener('aircare:lead', function (e) {
    push('generate_lead', e);
  });

  document.addEventListener('aircare:lead-details', function (e) {
    push(e.detail && e.detail.action === 'skip' ? 'lead_details_skip' : 'lead_details_submit', e);
  });
})();
