/* Guidesync Services — site behavior. No inline scripts (strict CSP). */
(function () {
  'use strict';
  var body = document.body;

  // ---------- Analytics (only loads when IDs are configured) ----------
  var ga = body.getAttribute('data-ga');
  var ads = body.getAttribute('data-ads');
  window.dataLayer = window.dataLayer || [];
  function gtag() { window.dataLayer.push(arguments); }
  window.gtag = gtag;
  if (ga || ads) {
    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(ga || ads.split('/')[0]);
    document.head.appendChild(s);
    gtag('js', new Date());
    if (ga) gtag('config', ga);
    if (ads) gtag('config', ads.split('/')[0]);
  }
  // Fire conversion on the thank-you page (used as the Google Ads conversion page).
  if (body.classList.contains('thanks')) {
    if (ads) gtag('event', 'conversion', { send_to: ads });
    if (ga) gtag('event', 'generate_lead', { currency: 'USD', value: 1 });
  }

  // ---------- Capture ad/UTM parameters for lead attribution ----------
  var KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'gclid', 'gbraid', 'wbraid'];
  var params = new URLSearchParams(location.search);
  var attrib = {};
  try { attrib = JSON.parse(sessionStorage.getItem('gs_attrib') || '{}'); } catch (e) { attrib = {}; }
  var found = false;
  KEYS.forEach(function (k) { if (params.get(k)) { attrib[k] = params.get(k).slice(0, 150); found = true; } });
  if (!attrib.landing) { attrib.landing = location.pathname; }
  if (!attrib.referrer && document.referrer && document.referrer.indexOf(location.host) === -1) attrib.referrer = document.referrer.slice(0, 200);
  try { if (found || !sessionStorage.getItem('gs_attrib')) sessionStorage.setItem('gs_attrib', JSON.stringify(attrib)); } catch (e) {}

  // ---------- Mobile nav ----------
  var toggle = document.querySelector('[data-menu-toggle]');
  var nav = document.querySelector('[data-nav]');
  if (toggle && nav) {
    toggle.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      toggle.setAttribute('aria-expanded', open);
      toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
      body.style.overflow = open ? 'hidden' : '';
    });
  }

  // ---------- Mega menus (click/touch + keyboard) ----------
  var triggers = document.querySelectorAll('.nav-trigger');
  triggers.forEach(function (btn) {
    btn.addEventListener('click', function (e) {
      e.preventDefault();
      var item = btn.parentElement;
      var open = !item.classList.contains('open');
      document.querySelectorAll('.has-menu.open').forEach(function (el) { el.classList.remove('open'); el.querySelector('.nav-trigger').setAttribute('aria-expanded', 'false'); });
      item.classList.toggle('open', open);
      btn.setAttribute('aria-expanded', open);
    });
  });
  document.addEventListener('click', function (e) {
    if (!e.target.closest('.has-menu')) document.querySelectorAll('.has-menu.open').forEach(function (el) { el.classList.remove('open'); el.querySelector('.nav-trigger').setAttribute('aria-expanded', 'false'); });
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') document.querySelectorAll('.has-menu.open').forEach(function (el) { el.classList.remove('open'); var t = el.querySelector('.nav-trigger'); t.setAttribute('aria-expanded', 'false'); t.focus(); });
  });

  // ---------- Industry tabs ----------
  document.querySelectorAll('[data-tabs]').forEach(function (wrap) {
    var tabs = Array.prototype.slice.call(wrap.querySelectorAll('[role="tab"]'));
    function select(tab, focus) {
      tabs.forEach(function (t) {
        var on = t === tab;
        t.setAttribute('aria-selected', on);
        t.tabIndex = on ? 0 : -1;
        var panel = document.getElementById(t.getAttribute('aria-controls'));
        if (panel) panel.hidden = !on;
      });
      if (focus) tab.focus();
    }
    tabs.forEach(function (tab, i) {
      tab.addEventListener('click', function () { select(tab); });
      tab.addEventListener('keydown', function (e) {
        var n = null;
        if (e.key === 'ArrowDown' || e.key === 'ArrowRight') n = tabs[(i + 1) % tabs.length];
        if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') n = tabs[(i - 1 + tabs.length) % tabs.length];
        if (e.key === 'Home') n = tabs[0];
        if (e.key === 'End') n = tabs[tabs.length - 1];
        if (n) { e.preventDefault(); select(n, true); }
      });
    });
  });

  // ---------- Lead forms ----------
  var EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  document.querySelectorAll('[data-lead-form]').forEach(function (form) {
    form.started.value = String(Date.now());
    form.page.value = location.pathname;
    form.utm.value = JSON.stringify(attrib);
    var status = form.querySelector('.form-status');
    var btn = form.querySelector('button[type="submit"]');
    var startedTyping = false;
    form.addEventListener('input', function (e) {
      var f = e.target.closest('.field, .consent');
      if (f) f.classList.remove('invalid');
      if (!startedTyping && ga) { startedTyping = true; gtag('event', 'form_start'); }
    });

    function validate() {
      var ok = true;
      ['first_name', 'last_name', 'phone', 'industry', 'services'].forEach(function (n) {
        var el = form[n];
        var bad = !el.value.trim() || (n === 'phone' && el.value.replace(/\D/g, '').length < 10);
        el.closest('.field').classList.toggle('invalid', bad);
        if (bad) ok = false;
      });
      var em = !EMAIL.test(form.email.value.trim());
      form.email.closest('.field').classList.toggle('invalid', em);
      if (em) ok = false;
      var c = !form.consent.checked;
      form.consent.closest('.consent').classList.toggle('invalid', c);
      if (c) ok = false;
      return ok;
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      status.className = 'form-status';
      status.textContent = '';
      if (!validate()) {
        status.className = 'form-status error';
        status.textContent = 'Please complete the highlighted fields.';
        var first = form.querySelector('.invalid input, .invalid select, .invalid textarea');
        if (first) first.focus();
        return;
      }
      var token = form.querySelector('[name="cf-turnstile-response"]');
      if (!token || !token.value) {
        status.className = 'form-status error';
        status.textContent = 'Please complete the security check above.';
        return;
      }
      btn.disabled = true;
      var label = btn.innerHTML;
      btn.textContent = 'Sending…';
      fetch(form.action, { method: 'POST', body: new FormData(form), headers: { Accept: 'application/json' } })
        .then(function (r) { return r.json().catch(function () { return { ok: false }; }).then(function (j) { return { status: r.status, j: j }; }); })
        .then(function (res) {
          if (res.j && res.j.ok) {
            status.className = 'form-status ok';
            status.textContent = 'Thank you! Redirecting…';
            location.href = '/thank-you/';
          } else {
            throw new Error((res.j && res.j.error) || 'Something went wrong.');
          }
        })
        .catch(function (err) {
          status.className = 'form-status error';
          status.textContent = (err && err.message) || 'Something went wrong. Please email contact@guidesync.net.';
          btn.disabled = false;
          btn.innerHTML = label;
          if (window.turnstile) try { window.turnstile.reset(form.querySelector('.cf-turnstile')); } catch (x) {}
        });
    });
  });
})();
