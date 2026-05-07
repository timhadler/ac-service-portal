// js/prices.js
const PRICES = {
  deepClean:      '$109',
  deepCleanAdditional: '$99',
  deepCleanPlus:  '$139',
  mouldMaster:    '$189',
  ductDevil:      '$109',
  commercial:     'From $129',
  HRVFilter:      '$179',
  HRVAdditional:  '$109',
  DVSFilter:      '$119',
  DVSAdditional:  '$99',
  betterVentFilter: '$179',
  betterVentAdditional: '$109',
  smartVentFilter:      '$199',
  emergency:      '$65',
};

// js/prices.js  — add below the object
document.querySelectorAll('[data-price]').forEach(function (el) {
  const key = el.getAttribute('data-price');
  if (PRICES[key]) el.textContent = PRICES[key];
});