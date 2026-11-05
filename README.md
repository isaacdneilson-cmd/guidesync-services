# Guidesync Services website

Static marketing and lead-generation site for Guidesync Services, deployed on Cloudflare Pages.

- `build.mjs`: zero-dependency static site generator (`node build.mjs` → `dist/`)
- `src/content/`: all page copy (industries, solutions, FAQs, site settings)
- `content/blog/`: blog posts in Markdown (published automatically twice a month)
- `functions/api/lead.js`: secure lead endpoint (Turnstile check → Google Sheets)
- `google-apps-script/Code.gs`: Google Sheets intake script
- `public/_headers`: security headers (CSP, HSTS, etc.)
- `automation/`: blog automation playbook and publish log

See **SETUP.md** for launch steps.
