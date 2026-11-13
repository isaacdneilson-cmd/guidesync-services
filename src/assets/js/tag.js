/* Google Tag Manager / Google tag loader (equivalent of Google's inline snippet; kept external for the site's strict CSP). */
(function () {
  var me = document.currentScript;
  var id = me && me.getAttribute('data-gtm');
  if (!id) return;
  window.dataLayer = window.dataLayer || [];
  function gtag() { window.dataLayer.push(arguments); }
  window.gtag = window.gtag || gtag;
  window.dataLayer.push({ 'gtm.start': new Date().getTime(), event: 'gtm.js' });
  gtag('js', new Date());
  var s = document.createElement('script');
  s.async = true;
  s.src = 'https://www.googletagmanager.com/gtm.js?id=' + encodeURIComponent(id);
  var first = document.getElementsByTagName('script')[0];
  first.parentNode.insertBefore(s, first);
})();
