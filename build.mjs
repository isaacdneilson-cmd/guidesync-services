// Guidesync Services static site generator. Zero dependencies: `node build.mjs` -> ./dist
import fs from 'node:fs';
import path from 'node:path';
import { site, industryNavOrder, solutionNavOrder } from './src/content/site.mjs';
import { industries } from './src/content/industries.mjs';
import { solutions } from './src/content/solutions.mjs';
import { homeFaqs, commitments, steps, volumeOptions } from './src/content/pages.mjs';
import { icon, logoMark } from './src/lib/icons.mjs';
import { esc, parseFrontMatter, renderMarkdown } from './src/lib/markdown.mjs';

const ROOT = path.dirname(new URL(import.meta.url).pathname);
const DIST = path.join(ROOT, 'dist');
const BUILD_DATE = new Date().toISOString().slice(0, 10);
const YEAR = new Date().getFullYear();

fs.rmSync(DIST, { recursive: true, force: true });
fs.mkdirSync(DIST, { recursive: true });

const sitemap = [];
const abs = (p) => site.url.replace(/\/$/, '') + p;
const ind = industryNavOrder.map((slug) => ({ slug, ...industries[slug] }));
const sol = solutionNavOrder.map((slug) => ({ slug, ...solutions[slug] }));

// ---------- Blog ----------
const BLOG_DIR = path.join(ROOT, 'content', 'blog');
const posts = (fs.existsSync(BLOG_DIR) ? fs.readdirSync(BLOG_DIR) : [])
  .filter((f) => f.endsWith('.md'))
  .map((f) => {
    const { data, body } = parseFrontMatter(fs.readFileSync(path.join(BLOG_DIR, f), 'utf8'));
    const slug = f.replace(/\.md$/, '').replace(/^\d{4}-\d{2}-\d{2}-/, '');
    const { html, headings } = renderMarkdown(body);
    const words = body.split(/\s+/).filter(Boolean).length;
    return { slug, ...data, html, headings, minutes: Math.max(3, Math.round(words / 230)) };
  })
  .filter((p) => p.title && p.date && p.date <= BUILD_DATE && p.draft !== 'true')
  .sort((a, b) => (a.date < b.date ? 1 : -1));

const fmtDate = (d) => new Date(d + 'T12:00:00Z').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' });

// ---------- Partials ----------
function header(active) {
  const indLinks = ind.map((i) => `<li><a href="/industries/${i.slug}/">${icon(i.icon)}<span>${esc(i.name)}</span></a></li>`).join('');
  const solLinks = sol.map((s) => `<li><a href="/solutions/${s.slug}/">${icon(s.icon)}<span>${esc(s.name)}</span></a></li>`).join('');
  return `
<a class="skip" href="#main">Skip to content</a>
<header class="site-header" data-header>
  <div class="container nav-wrap">
    <a class="logo" href="/" aria-label="${esc(site.name)} home">${logoMark}<span class="logo-text">Guide<b>sync</b></span></a>
    <nav class="nav" aria-label="Main" data-nav>
      <ul class="nav-list">
        <li class="nav-item has-menu">
          <button class="nav-trigger" aria-expanded="false" aria-controls="menu-solutions">Solutions ${icon('chevron', 'icon chev')}</button>
          <div class="mega" id="menu-solutions">
            <div class="mega-inner">
              <div class="mega-intro"><p class="eyebrow">Solutions</p><p>Processing built around how you sell, from approval to reconciliation.</p><a class="link-arrow" href="/solutions/">All solutions ${icon('arrow')}</a></div>
              <ul class="mega-grid">${solLinks}</ul>
            </div>
          </div>
        </li>
        <li class="nav-item has-menu">
          <button class="nav-trigger" aria-expanded="false" aria-controls="menu-industries">Industries ${icon('chevron', 'icon chev')}</button>
          <div class="mega" id="menu-industries">
            <div class="mega-inner">
              <div class="mega-intro"><p class="eyebrow">Industries</p><p>Specialized underwriting for the businesses standard processors turn away.</p><a class="link-arrow" href="/industries/">All industries ${icon('arrow')}</a></div>
              <ul class="mega-grid two">${indLinks}</ul>
            </div>
          </div>
        </li>
        <li class="nav-item"><a href="/how-it-works/"${active === 'how' ? ' aria-current="page"' : ''}>How it works</a></li>
        <li class="nav-item"><a href="/blog/"${active === 'blog' ? ' aria-current="page"' : ''}>Insights</a></li>
        <li class="nav-item"><a href="/about/"${active === 'about' ? ' aria-current="page"' : ''}>About</a></li>
      </ul>
      <a class="btn btn-primary nav-cta" href="/free-statement-review/">Free statement review</a>
    </nav>
    <button class="menu-toggle" aria-label="Open menu" aria-expanded="false" data-menu-toggle>${icon('menu')}</button>
  </div>
</header>`;
}

function footer() {
  const col = (title, items) => `<div><h3 class="foot-h">${title}</h3><ul>${items.map(([h, t]) => `<li><a href="${h}">${esc(t)}</a></li>`).join('')}</ul></div>`;
  return `
<footer class="site-footer">
  <div class="container">
    <div class="foot-top">
      <div class="foot-brand">
        <a class="logo logo-light" href="/" aria-label="${esc(site.name)} home">${logoMark}<span class="logo-text">Guide<b>sync</b></span></a>
        <p>${esc(site.tagline)} We connect complex and high-risk businesses with processing partners who say yes and stay.</p>
        <a class="foot-mail" href="mailto:${site.email}">${icon('mail')} ${site.email}</a>
      </div>
      ${col('Solutions', sol.map((s) => [`/solutions/${s.slug}/`, s.name]))}
      ${col('Industries', ind.map((i) => [`/industries/${i.slug}/`, i.name]))}
      ${col('Company', [['/how-it-works/', 'How it works'], ['/about/', 'About'], ['/blog/', 'Insights'], ['/faq/', 'FAQ'], ['/free-statement-review/', 'Free statement review']])}
    </div>
    <div class="foot-bottom">
      <p class="disclosure">${esc(site.disclosure)}</p>
      <div class="foot-legal"><span>&copy; ${YEAR} ${esc(site.name)}</span><a href="/privacy/">Privacy</a><a href="/terms/">Terms</a><a href="/partner-disclosure/">Partner disclosure</a><a href="/sitemap.xml">Sitemap</a></div>
    </div>
  </div>
</footer>`;
}

function leadForm({ id = 'lead', industry = '', heading = 'Get your free statement review', sub = 'Takes about two minutes. A specialist will reach out within one business day.' } = {}) {
  const opts = ind.map((i) => `<option value="${esc(i.name)}"${i.name === industry ? ' selected' : ''}>${esc(i.name)}</option>`).join('');
  return `
<form class="lead-form" id="${id}" action="/api/lead" method="post" novalidate data-lead-form>
  <div class="form-head"><h2 class="form-title">${esc(heading)}</h2><p>${esc(sub)}</p></div>
  <div class="grid-2">
    <label class="field"><span>First name</span><input name="first_name" autocomplete="given-name" required maxlength="60"></label>
    <label class="field"><span>Last name</span><input name="last_name" autocomplete="family-name" required maxlength="60"></label>
  </div>
  <div class="grid-2">
    <label class="field"><span>Business email</span><input type="email" name="email" autocomplete="email" required maxlength="120"></label>
    <label class="field"><span>Phone</span><input type="tel" name="phone" autocomplete="tel" required maxlength="25" inputmode="tel"></label>
  </div>
  <div class="grid-2">
    <label class="field"><span>Industry</span><select name="industry" required><option value="">Select your industry</option>${opts}<option value="Other">Other</option></select></label>
    <label class="field"><span>Monthly card volume</span><select name="monthly_volume"><option value="">Optional: select range</option>${volumeOptions.map((v) => `<option>${esc(v)}</option>`).join('')}</select></label>
  </div>
  <label class="field"><span>What services do you need?</span><textarea name="services" rows="3" required maxlength="1500" placeholder="e.g. I was shut down by my processor and need a new merchant account, or I want my statement reviewed for lower rates."></textarea></label>
  <div class="hp" aria-hidden="true"><label>Company website<input name="company_website" tabindex="-1" autocomplete="off"></label></div>
  <input type="hidden" name="page" value="">
  <input type="hidden" name="utm" value="">
  <input type="hidden" name="started" value="">
  <label class="consent"><input type="checkbox" name="consent" value="yes" required><span>I agree that ${esc(site.name)} and its processing partners may contact me by phone, text, and email about merchant services, including with automated technology. Consent is not a condition of purchase. Msg &amp; data rates may apply. Reply STOP to opt out. See our <a href="/privacy/">Privacy Policy</a>.</span></label>
  <div class="cf-turnstile" data-sitekey="${esc(site.turnstileSiteKey)}" data-theme="light" data-size="flexible"></div>
  <button class="btn btn-primary btn-block" type="submit">Request my free review ${icon('arrow')}</button>
  <p class="form-status" role="status" aria-live="polite"></p>
  <p class="form-secure">${icon('lock')} Your information is encrypted and only shared with our processing partners.</p>
</form>`;
}

function faqBlock(faqs) {
  return `<div class="faq-list">${faqs.map(([q, a]) => `<details class="faq"><summary>${esc(q)}${icon('chevron', 'icon chev')}</summary><div class="faq-a"><p>${esc(a)}</p></div></details>`).join('')}</div>`;
}
const faqSchema = (faqs) => ({ '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: faqs.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })) });
const crumbSchema = (items) => ({ '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: items.map(([name, p], i) => ({ '@type': 'ListItem', position: i + 1, name, item: abs(p) })) });
const crumbs = (items) => `<nav class="crumbs" aria-label="Breadcrumb"><ol>${items.map(([n, p], i) => (i === items.length - 1 ? `<li aria-current="page">${esc(n)}</li>` : `<li><a href="${p}">${esc(n)}</a></li>`)).join('')}</ol></nav>`;

const orgSchema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  '@id': abs('/#org'),
  name: site.name,
  url: abs('/'),
  logo: abs('/assets/img/logo.png'),
  email: site.email,
  description: site.description,
  areaServed: { '@type': 'Country', name: 'United States' },
};

function ctaBand(text = 'Ready to simplify your payments?', sub = 'Get a free, no-obligation statement review and a call with a payments specialist.') {
  return `<section class="cta-band"><div class="container cta-inner"><div><h2>${esc(text)}</h2><p>${esc(sub)}</p></div><a class="btn btn-light" href="/free-statement-review/">Get my free review ${icon('arrow')}</a></div></section>`;
}

function layout({ title, description, pathname, body, schema = [], active = '', ogType = 'website', noindex = false, bodyClass = '', fullTitle = false, priority = '0.7', lastmod = BUILD_DATE }) {
  const t = fullTitle ? title : `${title} | ${site.name}`;
  const canonical = abs(pathname);
  if (!noindex) sitemap.push({ loc: canonical, priority, lastmod });
  const ld = [orgSchema, ...schema].map((s) => `<script type="application/ld+json">${JSON.stringify(s).replace(/</g, '\\u003c')}</script>`).join('\n');
  return `<!doctype html>
<html lang="en-US">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(t)}</title>
<meta name="description" content="${esc(description)}">
<link rel="canonical" href="${canonical}">
${noindex ? '<meta name="robots" content="noindex, follow">' : '<meta name="robots" content="index, follow, max-image-preview:large">'}
<meta name="theme-color" content="#0B1B33">
<meta property="og:type" content="${ogType}">
<meta property="og:site_name" content="${esc(site.name)}">
<meta property="og:title" content="${esc(t)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${canonical}">
<meta property="og:image" content="${abs('/assets/img/og.png')}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="icon" href="/favicon-32.png" sizes="32x32" type="image/png">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<link rel="alternate" type="application/rss+xml" title="${esc(site.name)} Insights" href="/blog/feed.xml">
${site.gtmId ? `<script src="/assets/js/tag.js?v=${BUILD_DATE}" data-gtm="${esc(site.gtmId)}"></script>` : ''}
<link rel="stylesheet" href="/assets/css/styles.css?v=${BUILD_DATE}">
<script src="/assets/js/main.js?v=${BUILD_DATE}" defer></script>
${body.includes('cf-turnstile') ? '<script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer></script>' : ''}
${ld}
</head>
<body class="${bodyClass}" data-ga="${esc(site.ga4Id)}" data-ads="${esc(site.adsConversion)}">
${header(active)}
<main id="main">
${body}
</main>
${footer()}
</body>
</html>`;
}

function write(p, html) {
  const file = path.join(DIST, p.endsWith('/') ? p + 'index.html' : p);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, html);
}

const postCard = (p) => `<article class="post-card"><a href="/blog/${p.slug}/"><p class="post-meta"><span class="tag">${esc(p.category || 'Insights')}</span> ${fmtDate(p.date)}</p><h3>${esc(p.title)}</h3><p>${esc(p.description || '')}</p><span class="link-arrow">Read article ${icon('arrow')}</span></a></article>`;

// ---------- Home ----------
{
  const tabs = ind.map((i, n) => `<button role="tab" id="tab-${i.slug}" aria-controls="panel-${i.slug}" aria-selected="${n === 0}" tabindex="${n === 0 ? 0 : -1}" class="tab">${icon(i.icon)}<span>${esc(i.name)}</span></button>`).join('');
  const panels = ind.map((i, n) => `<div role="tabpanel" id="panel-${i.slug}" aria-labelledby="tab-${i.slug}" class="tab-panel"${n === 0 ? '' : ' hidden'}>
    <div class="panel-copy"><p class="eyebrow">${esc(i.name)}</p><h3>${esc(i.h1)}</h3><p>${esc(i.lede)}</p>
      <ul class="checks">${i.solutions.slice(0, 3).map(([t]) => `<li>${icon('check')}${esc(t)}</li>`).join('')}</ul>
      <div class="btn-row"><a class="btn btn-primary" href="/industries/${i.slug}/">Explore ${esc(i.name)} ${icon('arrow')}</a></div></div>
    <div class="panel-side"><p class="panel-side-h">Common challenges</p><ul>${i.challenges.map(([t, d]) => `<li><strong>${esc(t)}</strong><span>${esc(d)}</span></li>`).join('')}</ul></div>
  </div>`).join('');

  const body = `
<section class="hero">
  <div class="hero-bg" aria-hidden="true"></div>
  <div class="container hero-grid">
    <div class="hero-copy">
      <p class="pill">${icon('shield')} High-risk &amp; complex merchant services</p>
      <h1>Complex payments, <span class="grad">made simple.</span></h1>
      <p class="hero-lede">Declined, shut down, or overpaying? Guidesync connects high-risk and hard-to-place businesses with processing partners who approve your industry, price it fairly, and keep you processing.</p>
      <div class="btn-row"><a class="btn btn-primary btn-lg" href="/free-statement-review/">Get a free statement review ${icon('arrow')}</a><a class="btn btn-ghost btn-lg" href="#industries">See industries we serve</a></div>
      <ul class="hero-points"><li>${icon('check')}No cost, no obligation</li><li>${icon('check')}Card + ACH</li><li>${icon('check')}A dedicated specialist</li></ul>
    </div>
    <div class="hero-visual" aria-hidden="true">
      <div class="glass card-main">
        <div class="cm-head"><span class="dot"></span><span>Your approval path</span><span class="cm-tag">In progress</span></div>
        <ol class="cm-steps">
          <li class="done">${icon('check')}<div><b>Business profile received</b><span>Industry: Peptides</span></div></li>
          <li class="done">${icon('check')}<div><b>Statement reviewed</b><span>Hidden fees identified</span></div></li>
          <li class="done">${icon('check')}<div><b>Partner matched</b><span>Category-approved sponsor bank</span></div></li>
          <li class="now"><span class="spin"></span><div><b>Specialist call scheduled</b><span>Custom setup &amp; pricing</span></div></li>
        </ol>
      </div>
      <div class="glass chip chip-a">${icon('lock')}<span>PCI-focused partners</span></div>
      <div class="glass chip chip-b">${icon('layers')}<span>Card &amp; ACH rails</span></div>
    </div>
  </div>
</section>

<section class="assure">
  <div class="container assure-row">
    <div>${icon('search')}<span><b>$0</b> statement review</span></div>
    <div>${icon('scale')}<span><b>Transparent</b> pricing</span></div>
    <div>${icon('doc')}<span><b>Month-to-month</b> terms</span></div>
    <div>${icon('user')}<span><b>1</b> dedicated specialist</span></div>
    <div>${icon('layers')}<span><b>${ind.length}+</b> specialized industries</span></div>
  </div>
</section>

<section class="section">
  <div class="container">
    <div class="section-head center"><p class="eyebrow">Why businesses come to us</p><h2>Payments get complicated. Getting help shouldn't.</h2><p>Most processors are built for low-risk, predictable businesses. If yours is anything else, you have probably run into one of these.</p></div>
    <div class="cards-3">
      <div class="card problem">${icon('x', 'icon ic-bad')}<h3>Declined or shut down</h3><p>Payment apps and big banks close accounts the moment your industry is flagged, often holding your funds for months.</p><p class="fix">${icon('check')}<span>We match you with partners whose banks <b>knowingly approve</b> your category.</span></p></div>
      <div class="card problem">${icon('x', 'icon ic-bad')}<h3>Overpaying without knowing it</h3><p>Junk fees, rate creep, and confusing statements hide what you actually pay to accept cards.</p><p class="fix">${icon('check')}<span>A <b>free statement review</b> shows your true effective rate and every hidden fee.</span></p></div>
      <div class="card problem">${icon('x', 'icon ic-bad')}<h3>Systems that don't fit</h3><p>Off-the-shelf setups force you into workarounds for recurring billing, invoices, reporting, and reconciliation.</p><p class="fix">${icon('check')}<span>Partners <b>design the setup</b> around how you take, report, and reconcile payments.</span></p></div>
    </div>
  </div>
</section>

<section class="section alt" id="industries">
  <div class="container">
    <div class="section-head"><p class="eyebrow">Industries</p><h2>Specialists for the industries others turn away</h2><p>Pick your industry to see the challenges we solve and how our partners underwrite it.</p></div>
    <div class="tabs" data-tabs>
      <div class="tab-list" role="tablist" aria-label="Industries">${tabs}</div>
      <div class="tab-panels">${panels}</div>
    </div>
    <p class="center mt"><a class="link-arrow" href="/industries/">View all industries ${icon('arrow')}</a></p>
  </div>
</section>

<section class="section">
  <div class="container">
    <div class="section-head"><p class="eyebrow">Solutions</p><h2>Everything you need to get paid, in one relationship</h2></div>
    <div class="cards-sol">${sol.map((s) => `<a class="card sol-card" href="/solutions/${s.slug}/"><span class="ic-wrap">${icon(s.icon)}</span><h3>${esc(s.name)}</h3><p>${esc(s.short)}</p><span class="link-arrow">Learn more ${icon('arrow')}</span></a>`).join('')}</div>
  </div>
</section>

<section class="section dark">
  <div class="container">
    <div class="section-head center"><p class="eyebrow light">How it works</p><h2>Three steps to simpler payments</h2></div>
    <ol class="steps">${steps.map(([t, d], n) => `<li class="step"><span class="step-n">0${n + 1}</span><h3>${esc(t)}</h3><p>${esc(d)}</p></li>`).join('')}</ol>
    <p class="center mt"><a class="btn btn-light" href="/free-statement-review/">Start step one ${icon('arrow')}</a></p>
  </div>
</section>

<section class="section">
  <div class="container split">
    <div class="section-head"><p class="eyebrow">Our partner standards</p><h2>What every business we refer can expect</h2><p>We only work with processing partners that commit to treating complex businesses like long-term clients, not liabilities.</p><a class="btn btn-primary" href="/how-it-works/">How we vet partners ${icon('arrow')}</a></div>
    <div class="commit-grid">${commitments.map(([ic, t, d]) => `<div class="commit">${icon(ic)}<h3>${esc(t)}</h3><p>${esc(d)}</p></div>`).join('')}</div>
  </div>
</section>

<section class="section alt">
  <div class="container narrow">
    <div class="section-head center"><p class="eyebrow">FAQ</p><h2>Common questions</h2></div>
    ${faqBlock(homeFaqs)}
    <p class="center mt"><a class="link-arrow" href="/faq/">See all FAQs ${icon('arrow')}</a></p>
  </div>
</section>

${posts.length ? `<section class="section"><div class="container"><div class="section-head row"><div><p class="eyebrow">Insights</p><h2>Guides for complex businesses</h2></div><a class="link-arrow" href="/blog/">All articles ${icon('arrow')}</a></div><div class="cards-3">${posts.slice(0, 3).map(postCard).join('')}</div></div></section>` : ''}

<section class="section form-section" id="get-started">
  <div class="container split">
    <div class="section-head"><p class="eyebrow">Get started</p><h2>Find out what you should be paying</h2><p>Send us a few details. A specialist will review your situation, explain your options in plain English, and show you exactly where you are losing money.</p>
      <ul class="checks big"><li>${icon('check')}Free, no-obligation review</li><li>${icon('check')}Built for high-risk and complex businesses</li><li>${icon('check')}Card and ACH options</li><li>${icon('check')}A real person, not a call center</li></ul></div>
    ${leadForm({ id: 'lead-home' })}
  </div>
</section>`;

  write('/', layout({
    title: 'High-Risk Merchant Services, Simplified | Guidesync Services',
    fullTitle: true,
    description: site.description,
    pathname: '/',
    body,
    priority: '1.0',
    schema: [{ '@context': 'https://schema.org', '@type': 'WebSite', '@id': abs('/#website'), url: abs('/'), name: site.name, publisher: { '@id': abs('/#org') } }, faqSchema(homeFaqs)],
  }));
}

// ---------- Industry pages ----------
for (const i of ind) {
  const p = `/industries/${i.slug}/`;
  const related = ind.filter((x) => x.slug !== i.slug).slice(0, 4);
  const relPosts = posts.filter((x) => (x.industry || '').toLowerCase() === i.slug || (x.category || '') === i.name).slice(0, 3);
  const body = `
<section class="page-hero">
  <div class="hero-bg" aria-hidden="true"></div>
  <div class="container page-hero-grid">
    <div>
      ${crumbs([['Home', '/'], ['Industries', '/industries/'], [i.name, p]])}
      <p class="pill">${icon(i.icon)} ${esc(i.name)} merchant services</p>
      <h1>${esc(i.h1)}</h1>
      <p class="hero-lede">${esc(i.lede)}</p>
      <ul class="hero-points"><li>${icon('check')}Free statement review</li><li>${icon('check')}Category-approved partners</li><li>${icon('check')}Dedicated specialist</li></ul>
      <div class="glass hero-trust"><p class="ht-h">What you get</p><ul><li>${icon('search')}<span><b>Free statement review</b>Your true effective rate and hidden fees</span></li><li>${icon('shield')}<span><b>The right partner</b>Banks that knowingly approve your category</span></li><li>${icon('user')}<span><b>A dedicated specialist</b>One named contact, not a call center</span></li></ul></div>
    </div>
    ${leadForm({ id: 'lead-top', industry: i.name, heading: `Get a ${i.noun} processing review` })}
  </div>
</section>
<section class="section">
  <div class="container narrow-wide">
    <div class="prose-lead"><h2>Why ${esc(i.noun)} businesses struggle to stay processing</h2><p>${esc(i.why)}</p></div>
    <div class="two-col">
      <div class="card"><h3 class="col-h bad">${icon('x')} The challenges</h3><ul class="feature-list">${i.challenges.map(([t, d]) => `<li><strong>${esc(t)}</strong><p>${esc(d)}</p></li>`).join('')}</ul></div>
      <div class="card good-card"><h3 class="col-h good">${icon('check')} How we help</h3><ul class="feature-list">${i.solutions.map(([t, d]) => `<li><strong>${esc(t)}</strong><p>${esc(d)}</p></li>`).join('')}</ul></div>
    </div>
  </div>
</section>
<section class="section alt">
  <div class="container split">
    <div class="section-head"><p class="eyebrow">Be ready to apply</p><h2>What underwriters look for</h2><p>Having these ready speeds up approval and improves your terms. Your specialist will walk you through anything you are missing.</p></div>
    <ul class="checklist card">${i.checklist.map((c) => `<li>${icon('check')}${esc(c)}</li>`).join('')}</ul>
  </div>
</section>
<section class="section">
  <div class="container narrow">
    <div class="section-head center"><p class="eyebrow">FAQ</p><h2>${esc(i.name)} payment processing questions</h2></div>
    ${faqBlock(i.faqs)}
  </div>
</section>
${relPosts.length ? `<section class="section alt"><div class="container"><div class="section-head"><h2>Related insights</h2></div><div class="cards-3">${relPosts.map(postCard).join('')}</div></div></section>` : ''}
<section class="section ${relPosts.length ? '' : 'alt'}">
  <div class="container"><div class="section-head"><h2>Other industries we serve</h2></div>
  <div class="mini-grid">${related.map((r) => `<a class="mini" href="/industries/${r.slug}/">${icon(r.icon)}<span>${esc(r.name)}</span>${icon('arrow', 'icon arr')}</a>`).join('')}</div></div>
</section>
${ctaBand(`Keep your ${i.noun} business processing with confidence`)}`;
  write(p, layout({
    title: i.title, description: i.meta, pathname: p, body, priority: '0.9',
    schema: [
      { '@context': 'https://schema.org', '@type': 'Service', name: i.title, serviceType: 'Merchant services referral', description: i.meta, provider: { '@id': abs('/#org') }, areaServed: { '@type': 'Country', name: 'United States' }, url: abs(p) },
      faqSchema(i.faqs),
      crumbSchema([['Home', '/'], ['Industries', '/industries/'], [i.name, p]]),
    ],
  }));
}

// Industries index
write('/industries/', layout({
  title: 'High-Risk Industries We Serve', description: 'Merchant services for peptides, nutraceuticals, subscriptions, high-ticket coaching, e-commerce, travel, med spas, moving, ticketing, and B2B.', pathname: '/industries/', priority: '0.8',
  schema: [crumbSchema([['Home', '/'], ['Industries', '/industries/']])],
  body: `<section class="page-hero slim"><div class="hero-bg" aria-hidden="true"></div><div class="container">${crumbs([['Home', '/'], ['Industries', '/industries/']])}<h1>Industries we serve</h1><p class="hero-lede">Every industry carries different risks. Our processing partners underwrite each one on its own terms, so approval is built to last.</p></div></section>
<section class="section"><div class="container"><div class="ind-grid">${ind.map((i) => `<a class="card ind-card" href="/industries/${i.slug}/"><span class="ic-wrap">${icon(i.icon)}</span><h2>${esc(i.name)}</h2><p>${esc(i.short)}</p><span class="link-arrow">Learn more ${icon('arrow')}</span></a>`).join('')}</div>
<div class="note card"><h2>Don't see your industry?</h2><p>Our partners work across many more categories than we list here. Tell us about your business and we will let you know if there is a fit.</p><a class="btn btn-primary" href="/free-statement-review/">Ask about my industry ${icon('arrow')}</a></div></div></section>${ctaBand()}`,
}));

// ---------- Solution pages ----------
for (const s of sol) {
  const p = `/solutions/${s.slug}/`;
  const body = `
<section class="page-hero">
  <div class="hero-bg" aria-hidden="true"></div>
  <div class="container page-hero-grid">
    <div>${crumbs([['Home', '/'], ['Solutions', '/solutions/'], [s.name, p]])}
      <p class="pill">${icon(s.icon)} ${esc(s.name)}</p><h1>${esc(s.h1)}</h1><p class="hero-lede">${esc(s.lede)}</p>
      <ul class="hero-points"><li>${icon('check')}No cost, no obligation</li><li>${icon('check')}Transparent pricing</li><li>${icon('check')}Dedicated specialist</li></ul><div class="glass hero-trust"><p class="ht-h">What you get</p><ul><li>${icon('search')}<span><b>Free statement review</b>Your true effective rate and hidden fees</span></li><li>${icon('shield')}<span><b>The right partner</b>Banks that knowingly approve your category</span></li><li>${icon('user')}<span><b>A dedicated specialist</b>One named contact, not a call center</span></li></ul></div></div>
    ${leadForm({ id: 'lead-top' })}
  </div>
</section>
<section class="section"><div class="container narrow-wide"><div class="prose-lead"><p>${esc(s.intro)}</p></div>
<div class="commit-grid four">${s.points.map(([t, d], n) => `<div class="commit">${icon(['check', 'shield', 'scale', 'bolt'][n] || 'check')}<h3>${esc(t)}</h3><p>${esc(d)}</p></div>`).join('')}</div></div></section>
<section class="section alt"><div class="container"><div class="section-head"><h2>Industries we support</h2></div><div class="mini-grid">${ind.map((r) => `<a class="mini" href="/industries/${r.slug}/">${icon(r.icon)}<span>${esc(r.name)}</span>${icon('arrow', 'icon arr')}</a>`).join('')}</div></div></section>
<section class="section"><div class="container narrow"><div class="section-head center"><p class="eyebrow">FAQ</p><h2>${esc(s.name)} questions</h2></div>${faqBlock(s.faqs)}</div></section>
${ctaBand()}`;
  write(p, layout({
    title: s.title, description: s.meta, pathname: p, body, priority: '0.9',
    schema: [
      { '@context': 'https://schema.org', '@type': 'Service', name: s.name, serviceType: 'Merchant services referral', description: s.meta, provider: { '@id': abs('/#org') }, areaServed: { '@type': 'Country', name: 'United States' }, url: abs(p) },
      faqSchema(s.faqs), crumbSchema([['Home', '/'], ['Solutions', '/solutions/'], [s.name, p]]),
    ],
  }));
}
write('/solutions/', layout({
  title: 'Merchant Processing Solutions', description: 'High-risk merchant accounts, credit card processing, ACH and eCheck, recurring billing, and free statement reviews for complex businesses.', pathname: '/solutions/', priority: '0.8',
  schema: [crumbSchema([['Home', '/'], ['Solutions', '/solutions/']])],
  body: `<section class="page-hero slim"><div class="hero-bg" aria-hidden="true"></div><div class="container">${crumbs([['Home', '/'], ['Solutions', '/solutions/']])}<h1>Solutions</h1><p class="hero-lede">From approval to reconciliation, our partners build processing around how your business actually works.</p></div></section>
<section class="section"><div class="container"><div class="ind-grid">${sol.map((s) => `<a class="card ind-card" href="/solutions/${s.slug}/"><span class="ic-wrap">${icon(s.icon)}</span><h2>${esc(s.name)}</h2><p>${esc(s.short)}</p><span class="link-arrow">Learn more ${icon('arrow')}</span></a>`).join('')}</div></div></section>${ctaBand()}`,
}));

// ---------- Free statement review (primary ad landing page) ----------
{
  const faqs = solutions['statement-review-rate-reduction'].faqs;
  write('/free-statement-review/', layout({
    title: 'Free Merchant Statement Review & Specialist Call', description: 'Find out what you really pay to accept cards. Free, no-obligation statement review and call with a payments specialist for high-risk and complex businesses.', pathname: '/free-statement-review/', priority: '0.9', bodyClass: 'lp',
    schema: [faqSchema(faqs)],
    body: `
<section class="page-hero lp-hero">
  <div class="hero-bg" aria-hidden="true"></div>
  <div class="container page-hero-grid">
    <div>
      <p class="pill">${icon('search')} Free &amp; no obligation</p>
      <h1>Get a free statement review and a call with a payments specialist</h1>
      <p class="hero-lede">Whether you have been declined, shut down, or just suspect you are overpaying, a specialist will review your situation and show you a clear path forward.</p>
      <ul class="checks big light">
        <li>${icon('check')}Your true effective rate, in plain numbers</li>
        <li>${icon('check')}Hidden fees and downgrades identified</li>
        <li>${icon('check')}Matched with a partner that approves your industry</li>
        <li>${icon('check')}Partners with access at the payment-switch level, so pricing can be aggressive</li>
      </ul>
    </div>
    ${leadForm({ id: 'lead-lp', heading: 'Request your free review' })}
  </div>
</section>
<section class="section"><div class="container"><ol class="steps light-steps">${steps.map(([t, d], n) => `<li class="step"><span class="step-n">0${n + 1}</span><h3>${esc(t)}</h3><p>${esc(d)}</p></li>`).join('')}</ol></div></section>
<section class="section alt"><div class="container narrow"><div class="section-head center"><h2>Questions about the review</h2></div>${faqBlock(faqs)}</div></section>`,
  }));
}

// ---------- How it works ----------
write('/how-it-works/', layout({
  title: 'How It Works', active: 'how', description: 'How Guidesync connects complex and high-risk businesses with the right merchant processing partner, from free statement review to approval.', pathname: '/how-it-works/', priority: '0.8',
  body: `<section class="page-hero slim"><div class="hero-bg" aria-hidden="true"></div><div class="container">${crumbs([['Home', '/'], ['How it works', '/how-it-works/']])}<h1>How Guidesync works</h1><p class="hero-lede">We make the complicated part of payments simple: finding a processor that will approve your business, price it fairly, and keep you processing.</p></div></section>
<section class="section"><div class="container"><ol class="steps light-steps">${steps.map(([t, d], n) => `<li class="step"><span class="step-n">0${n + 1}</span><h3>${esc(t)}</h3><p>${esc(d)}</p></li>`).join('')}</ol></div></section>
<section class="section alt"><div class="container split"><div class="section-head"><p class="eyebrow">What partners do next</p><h2>Learn. Design. Build.</h2><p>Once you are introduced, your processing partner follows a consultative process instead of selling you a package.</p></div>
<div class="timeline">
<div class="tl"><span>1</span><div><h3>Learn your operation</h3><p>How you take payments today, where money gets stuck, and how your books are reconciled.</p></div></div>
<div class="tl"><span>2</span><div><h3>Design the setup</h3><p>Terminals, online checkout, invoicing, recurring billing, ACH, and reporting chosen to fit your workflow.</p></div></div>
<div class="tl"><span>3</span><div><h3>Build and support</h3><p>Underwriting, onboarding, and a named specialist for changes and questions after you go live.</p></div></div>
</div></div></section>
<section class="section"><div class="container split"><div class="section-head"><p class="eyebrow">Partner standards</p><h2>How we choose who we refer you to</h2><p>${esc(site.disclosure)}</p><a href="/partner-disclosure/" class="link-arrow">Read our partner disclosure ${icon('arrow')}</a></div>
<div class="commit-grid">${commitments.map(([ic, t, d]) => `<div class="commit">${icon(ic)}<h3>${esc(t)}</h3><p>${esc(d)}</p></div>`).join('')}</div></div></section>${ctaBand()}`,
}));

// ---------- FAQ ----------
{
  const all = [...homeFaqs, ...sol.flatMap((s) => s.faqs), ...ind.flatMap((i) => i.faqs.slice(0, 1))];
  const seen = new Set();
  const uniq = all.filter(([q]) => (seen.has(q) ? false : seen.add(q)));
  write('/faq/', layout({
    title: 'Merchant Services FAQ', description: 'Answers about high-risk merchant accounts, statement reviews, ACH, recurring billing, terminations, and how Guidesync works.', pathname: '/faq/', priority: '0.7',
    schema: [faqSchema(uniq)],
    body: `<section class="page-hero slim"><div class="hero-bg" aria-hidden="true"></div><div class="container">${crumbs([['Home', '/'], ['FAQ', '/faq/']])}<h1>Frequently asked questions</h1><p class="hero-lede">Straight answers about high-risk processing, pricing, and getting approved.</p></div></section>
<section class="section"><div class="container narrow">${faqBlock(uniq)}</div></section>${ctaBand('Still have questions?', 'Talk to a specialist. The review is free and there is no obligation.')}`,
  }));
}

// ---------- About ----------
write('/about/', layout({
  title: 'About Guidesync Services', active: 'about', description: 'Guidesync Services helps complex and high-risk businesses find processing partners who approve their industry, price it fairly, and stay.', pathname: '/about/', priority: '0.6',
  body: `<section class="page-hero slim"><div class="hero-bg" aria-hidden="true"></div><div class="container">${crumbs([['Home', '/'], ['About', '/about/']])}<h1>We guide complex businesses to payments that work</h1><p class="hero-lede">Guidesync exists because too many good businesses get treated as problems by the payments industry.</p></div></section>
<section class="section"><div class="container narrow prose">
<p>If you sell peptides, supplements, subscriptions, high-ticket programs, travel, or any of dozens of other "high-risk" categories, you already know the pattern: a fast approval from a payment app, a few good months, and then a frozen account and held funds. Or a processor that approves you but quietly charges far more than it should.</p>
<p>Guidesync was built to break that pattern. We take the time to understand your business, arrange a free review of what you pay today, and connect you with processing partners whose banks <strong>knowingly approve</strong> your industry. Our partners design setups around how you actually operate, explain pricing line by line, and give you a dedicated specialist instead of a call center.</p>
<h2>What we believe</h2>
<ul><li><strong>High risk is not bad business.</strong> It is a category that needs the right partner.</li><li><strong>Pricing should be understandable.</strong> If you cannot explain your statement, something is wrong.</li><li><strong>Stability beats speed.</strong> The best approval is the one that is still active a year later.</li></ul>
<h2>How we are paid</h2>
<p>Our service is free to businesses. ${esc(site.disclosure)} We may receive compensation from processing partners when a business we refer is approved. That never changes the price you are quoted.</p>
<p><a class="btn btn-primary" href="/free-statement-review/">Get your free review ${icon('arrow')}</a></p>
</div></section>`,
}));

// ---------- Blog ----------
write('/blog/', layout({
  title: 'Insights: High-Risk Payments & Merchant Services', active: 'blog', description: 'Guides and news on high-risk merchant accounts, chargebacks, card-brand rules, processing fees, and industry-specific payment challenges.', pathname: '/blog/', priority: '0.8',
  body: `<section class="page-hero slim"><div class="hero-bg" aria-hidden="true"></div><div class="container">${crumbs([['Home', '/'], ['Insights', '/blog/']])}<h1>Insights</h1><p class="hero-lede">Practical guides on high-risk processing, fees, chargebacks, and the rules that affect how you get paid.</p></div></section>
<section class="section"><div class="container">${posts.length ? `<div class="cards-3">${posts.map(postCard).join('')}</div>` : '<p>New articles are on the way.</p>'}</div></section>${ctaBand()}`,
}));

for (const p of posts) {
  const url = `/blog/${p.slug}/`;
  const more = posts.filter((x) => x.slug !== p.slug).slice(0, 3);
  const indLink = ind.find((i) => i.slug === p.industry);
  write(url, layout({
    title: p.title, description: p.description || '', pathname: url, ogType: 'article', active: 'blog', priority: '0.6', lastmod: p.updated || p.date,
    schema: [
      { '@context': 'https://schema.org', '@type': 'BlogPosting', headline: p.title, description: p.description, datePublished: p.date, dateModified: p.updated || p.date, author: { '@type': 'Organization', name: p.author || `${site.name} Editorial Team` }, publisher: { '@id': abs('/#org') }, mainEntityOfPage: abs(url), image: abs('/assets/img/og.png'), keywords: Array.isArray(p.tags) ? p.tags.join(', ') : p.tags },
      crumbSchema([['Home', '/'], ['Insights', '/blog/'], [p.title, url]]),
    ],
    body: `<section class="page-hero slim post-hero"><div class="hero-bg" aria-hidden="true"></div><div class="container narrow">${crumbs([['Home', '/'], ['Insights', '/blog/'], [p.title, url]])}<p class="post-meta light"><span class="tag">${esc(p.category || 'Insights')}</span> ${fmtDate(p.date)} · ${p.minutes} min read</p><h1>${esc(p.title)}</h1><p class="hero-lede">${esc(p.description || '')}</p></div></section>
<section class="section"><div class="container post-grid">
<article class="prose">${p.html}
<div class="post-cta card"><h2>Get a second opinion on your processing</h2><p>A specialist will review your statement for free and show you your options${indLink ? ` for your ${esc(indLink.noun)} business` : ''}.</p><a class="btn btn-primary" href="/free-statement-review/">Get my free review ${icon('arrow')}</a></div>
<p class="post-disclaimer">This article is for general information only and is not legal, tax, or financial advice. Card-brand rules and regulations change; confirm requirements with your processor or advisor.</p>
</article>
<aside class="post-aside">${p.headings.length > 1 ? `<div class="toc card"><p class="toc-h">In this article</p><ol>${p.headings.map((h) => `<li><a href="#${h.id}">${esc(h.text)}</a></li>`).join('')}</ol></div>` : ''}
${indLink ? `<a class="mini" href="/industries/${indLink.slug}/">${icon(indLink.icon)}<span>${esc(indLink.name)} processing</span>${icon('arrow', 'icon arr')}</a>` : ''}
<a class="btn btn-primary btn-block" href="/free-statement-review/">Free statement review</a></aside>
</div></section>
${more.length ? `<section class="section alt"><div class="container"><div class="section-head"><h2>Keep reading</h2></div><div class="cards-3">${more.map(postCard).join('')}</div></div></section>` : ''}`,
  }));
}

// RSS
fs.writeFileSync(path.join(DIST, 'blog', 'feed.xml'), `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom"><channel><title>${esc(site.name)} Insights</title><link>${abs('/blog/')}</link><atom:link href="${abs('/blog/feed.xml')}" rel="self" type="application/rss+xml"/><description>Guides on high-risk payments and merchant services.</description><language>en-us</language>
${posts.slice(0, 30).map((p) => `<item><title>${esc(p.title)}</title><link>${abs(`/blog/${p.slug}/`)}</link><guid>${abs(`/blog/${p.slug}/`)}</guid><pubDate>${new Date(p.date + 'T12:00:00Z').toUTCString()}</pubDate><description>${esc(p.description || '')}</description></item>`).join('\n')}
</channel></rss>`);

// ---------- Legal / utility ----------
const legal = (p, title, desc, html) => write(p, layout({ title, description: desc, pathname: p, priority: '0.3', body: `<section class="page-hero slim"><div class="hero-bg" aria-hidden="true"></div><div class="container">${crumbs([['Home', '/'], [title, p]])}<h1>${esc(title)}</h1><p class="hero-lede">Last updated ${fmtDate(BUILD_DATE)}</p></div></section><section class="section"><div class="container narrow prose">${html}</div></section>` }));

legal('/privacy/', 'Privacy Policy', 'How Guidesync Services collects, uses, and shares information submitted through this website.', `
<p>This Privacy Policy explains how ${esc(site.name)} ("Guidesync," "we," "us") collects, uses, and shares information when you visit this website or submit a form.</p>
<h2>Information we collect</h2>
<ul><li><strong>Information you provide:</strong> your name, email address, phone number, industry, monthly processing volume range, and a description of the services you need.</li><li><strong>Automatically collected information:</strong> device and browser data, pages viewed, referring pages, and campaign parameters (such as UTM tags and ad click identifiers), collected through cookies and similar technologies.</li><li><strong>Security data:</strong> we use Cloudflare Turnstile to protect our forms from bots. Turnstile processes limited device and interaction signals for this purpose.</li></ul>
<h2>How we use information</h2>
<ul><li>To respond to your request and arrange a statement review and specialist call.</li><li>To share your information with our processing partners so they can evaluate your business and contact you.</li><li>To measure and improve our website and advertising, including through Google Analytics and Google Ads.</li><li>To protect against fraud, spam, and abuse.</li></ul>
<h2>How we share information</h2>
<p>We share the information you submit with merchant processing partners for the purpose of evaluating and providing merchant services to you. We may receive compensation from those partners. We also share information with service providers who help us operate this website (such as hosting, security, analytics, and form storage providers). We may disclose information when required by law. We do not sell your information to data brokers.</p>
<h2>Communications</h2>
<p>If you consent, we and our processing partners may contact you by phone, text message, and email, including with automated technology. You can opt out of text messages by replying STOP, and out of emails by using the unsubscribe link or emailing us. Consent is not a condition of purchase.</p>
<h2>Cookies and advertising</h2>
<p>We may use cookies from Google to measure site usage and ad performance. You can control cookies through your browser settings and manage Google ad personalization at <a href="https://adssettings.google.com" target="_blank" rel="noopener">adssettings.google.com</a>.</p>
<h2>Data security and retention</h2>
<p>We use encryption in transit and reasonable safeguards to protect your information. We keep lead information only as long as needed for the purposes above or as required by law. Please do not submit card numbers, bank account numbers, or full merchant statements through our website forms.</p>
<h2>Your choices</h2>
<p>You may request access to, correction of, or deletion of your information by emailing <a href="mailto:${site.email}">${site.email}</a>. Depending on where you live, you may have additional rights under state privacy laws.</p>
<h2>Children</h2><p>This website is intended for businesses and is not directed to children under 13.</p>
<h2>Changes</h2><p>We may update this policy. The "last updated" date above shows when it was last changed.</p>
<h2>Contact</h2><p>Email <a href="mailto:${site.email}">${site.email}</a>.</p>`);

legal('/terms/', 'Terms of Use', 'Terms governing use of the Guidesync Services website.', `
<p>By using this website you agree to these Terms of Use.</p>
<h2>Our service</h2><p>${esc(site.disclosure)} Information on this site is general in nature and is not legal, tax, or financial advice. Pricing, approval, reserves, and terms are determined solely by processing partners and their sponsor banks.</p>
<h2>No guarantee</h2><p>We do not guarantee approval, specific rates, savings, or timelines. Any examples are illustrative.</p>
<h2>Your submissions</h2><p>You agree that information you submit is accurate and that you are authorized to submit it on behalf of your business.</p>
<h2>Acceptable use</h2><p>You may not use automated means to submit forms, scrape content, or interfere with the website's security.</p>
<h2>Third-party services</h2><p>Your relationship with any processing partner is governed by that partner's own agreements. We are not responsible for third-party services.</p>
<h2>Limitation of liability</h2><p>To the fullest extent permitted by law, ${esc(site.name)} is not liable for indirect, incidental, or consequential damages arising from use of this website or any referral.</p>
<h2>Governing law</h2><p>These terms are governed by the laws of the State of Texas.</p>
<h2>Contact</h2><p>Email <a href="mailto:${site.email}">${site.email}</a>.</p>`);

legal('/partner-disclosure/', 'Partner Disclosure', 'How Guidesync Services works with merchant processing partners and how we are compensated.', `
<p>${esc(site.disclosure)}</p>
<p>When you submit a request, we review your information and share it with one or more processing partners who we believe are a good fit for your business. Those partners perform underwriting, set pricing and terms, and provide the merchant services.</p>
<p>Our service is free to you. We may receive referral compensation from processing partners when a business we refer is approved. Compensation does not increase the pricing you are offered.</p>
<p>Questions? Email <a href="mailto:${site.email}">${site.email}</a>.</p>`);

write('/thank-you/', layout({
  title: 'Thank You', description: 'Your request was received.', pathname: '/thank-you/', noindex: true, bodyClass: 'thanks',
  body: `<section class="page-hero slim"><div class="hero-bg" aria-hidden="true"></div><div class="container narrow center"><div class="big-check">${icon('check')}</div><h1>Thanks, your request is in.</h1><p class="hero-lede">A payments specialist will contact you within one business day to schedule your call and explain how to securely share your statement.</p></div></section>
<section class="section"><div class="container narrow"><div class="card"><h2>While you wait</h2><ul class="checks"><li>${icon('check')}Find your most recent one to three monthly merchant statements.</li><li>${icon('check')}Note any recent declines, holds, or terminations.</li><li>${icon('check')}Do not email card or bank account numbers. Your specialist will provide a secure way to share documents.</li></ul><p class="mt"><a class="link-arrow" href="/blog/">Read our latest insights ${icon('arrow')}</a></p></div></div></section>`,
}));

write('/404.html', layout({
  title: 'Page Not Found', description: 'The page you were looking for does not exist.', pathname: '/404.html', noindex: true,
  body: `<section class="page-hero slim"><div class="hero-bg" aria-hidden="true"></div><div class="container narrow center"><h1>Page not found</h1><p class="hero-lede">The page you were looking for has moved or does not exist.</p><div class="btn-row center-row"><a class="btn btn-light" href="/">Back to home</a><a class="btn btn-ghost" href="/free-statement-review/">Free statement review</a></div></div></section>`,
}));

// ---------- SEO files ----------
fs.writeFileSync(path.join(DIST, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemap.map((u) => `  <url><loc>${u.loc}</loc><lastmod>${u.lastmod}</lastmod><priority>${u.priority}</priority></url>`).join('\n')}
</urlset>`);
fs.writeFileSync(path.join(DIST, 'robots.txt'), `User-agent: *\nAllow: /\nDisallow: /api/\nDisallow: /thank-you/\n\nSitemap: ${abs('/sitemap.xml')}\n`);

// ---------- Static assets ----------
function copyDir(src, dst) {
  if (!fs.existsSync(src)) return;
  fs.mkdirSync(dst, { recursive: true });
  for (const f of fs.readdirSync(src)) {
    const s = path.join(src, f), d = path.join(dst, f);
    fs.statSync(s).isDirectory() ? copyDir(s, d) : fs.copyFileSync(s, d);
  }
}
copyDir(path.join(ROOT, 'public'), DIST);
copyDir(path.join(ROOT, 'src', 'assets'), path.join(DIST, 'assets'));

console.log(`Built ${sitemap.length} indexable pages, ${posts.length} blog posts -> dist/`);
