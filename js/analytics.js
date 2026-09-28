/**
 * analytics.js
 * ────────────
 * GA4 and Google Ads conversion tracking. Included on every page.
 *
 * The IDs come from site.vars (ga4_id, ads_conversion_id,
 * ads_conversion_label) via window.AIRCARE_ANALYTICS in tail.html.
 * While they are empty this script does nothing: no tag is loaded,
 * no cookie is set, nothing is sent.
 *
 * What is measured:
 *   - book_click  every click on a link to booking_url. Booking happens
 *                 off-site, so the click is the conversion we can see.
 *                 Also sent as the Ads conversion when both Ads values
 *                 are set.
 *   - generate_lead  a form reaching its success state. The form
 *                 scripts announce this with an "aircare:lead" event.
 */

(function () {
  'use strict';

  var cfg = window.AIRCARE_ANALYTICS || {};
  var tagId = cfg.ga4Id || cfg.adsId;
  if (!tagId) return;

  var s = document.createElement('script');
  s.async = true;
  s.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(tagId);
  document.head.appendChild(s);

  window.dataLayer = window.dataLayer || [];
  function gtag() { window.dataLayer.push(arguments); }
  gtag('js', new Date());
  if (cfg.ga4Id) gtag('config', cfg.ga4Id);
  if (cfg.adsId) gtag('config', cfg.adsId);

  document.addEventListener('click', function (e) {
    var link = e.target.closest && e.target.closest('a[href]');
    if (!link || !cfg.bookingUrl || link.href.indexOf(cfg.bookingUrl) !== 0) return;

    gtag('event', 'book_click', { link_url: link.href });
    if (cfg.adsId && cfg.adsLabel) {
      gtag('event', 'conversion', { send_to: cfg.adsId + '/' + cfg.adsLabel });
    }
  });

  document.addEventListener('aircare:lead', function (e) {
    gtag('event', 'generate_lead', { form_name: (e.detail && e.detail.form) || '' });
  });
})();
