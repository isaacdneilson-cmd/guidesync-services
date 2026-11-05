# Guidesync Services — Launch Checklist

The site is built and ready. These are the one-time steps only you can do (they need your
accounts). Total time: about 45 minutes. Everything here is free except the domain.

---

## 1. Buy the domain

Buy it through **Cloudflare Registrar** (Cloudflare dashboard > Domain Registration). That
keeps the domain, DNS, email routing, and hosting in one place.

- The site is set up for **guidesync.net**. If you buy a different domain, open
  `src/content/site.mjs` and change `url` and `email` on lines 5–6. Nothing else needs to change.

## 2. Put the code on GitHub

1. Create a new repository named **`guidesync-services`** (done) (private is fine).
   The automated blog finds the repo by this name.
2. Upload the contents of this folder (not the folder itself) to the repository. On
   github.com you can drag the files into "uploading an existing file". Make sure
   `build.mjs`, `package.json`, `src/`, `content/`, `functions/`, `public/`, and
   `automation/` end up at the top level of the repo.
3. Use `main` as the branch.

## 3. Cloudflare Workers project (already created)

The site runs as a Cloudflare **Worker** with static assets. The repo includes `wrangler.jsonc`
and `worker/index.js`. Build settings (Worker > Settings > Build):

| Setting | Value |
|---|---|
| Build command | `node build.mjs` |
| Deploy command | `npx wrangler deploy` |
| Root directory | `/` |

If Cloudflare says the project is disconnected from Git, click **Manage** next to the repository
and reinstall/authorize the Cloudflare GitHub app for `guidesync-services`.
Custom domain: Worker > Settings > **Domains & Routes** > add `guidesync.net` and `www.guidesync.net`.

## 4. Turn on the captcha (Cloudflare Turnstile)

1. Cloudflare dashboard > **Turnstile** > Add widget. Name: Guidesync. Hostnames:
   `guidesync.net`, `www.guidesync.net`, and your `.workers.dev` address. Mode: **Managed**.
2. Copy the **Site key** into `src/content/site.mjs` → `turnstileSiteKey`
   (replacing the test key), and commit the change on GitHub.
3. Keep the **Secret key** for step 6.

## 5. Connect the Google Sheet

1. Create a Google Sheet named **Guidesync Leads**.
2. Extensions > **Apps Script**. Delete the sample code, paste in all of
   `google-apps-script/Code.gs`.
3. Change `SHARED_SECRET` to a long random string (32+ characters; a password generator works).
   New-lead alert emails go to `ineilson@sgosolutions.com`; change `NOTIFY_EMAIL` if you want.
4. **Deploy > New deployment > Web app**. Execute as: **Me**. Who has access: **Anyone**.
   Authorize, then copy the **Web app URL**.

The sheet fills in these columns automatically: date, first name, last name, email, phone,
industry, monthly volume, services needed, page, ad source/campaign/keyword, Google click ID,
plus `status` and `notes` columns for you to track follow-up.

## 6. Add the secret settings to Cloudflare

Worker > **Settings > Variables and Secrets** (the runtime section, NOT the build variables). Add each as type **Secret**:

| Name | Value |
|---|---|
| `TURNSTILE_SECRET_KEY` | Turnstile secret key from step 4 |
| `SHEETS_WEBHOOK_URL` | Apps Script Web app URL from step 5 |
| `SHEETS_SHARED_SECRET` | The same `SHARED_SECRET` you set in Code.gs |
| `ALLOWED_HOSTS` | `guidesync.net,www.guidesync.net` |

Saving them redeploys the Worker automatically. Submit a test lead
and confirm it appears in the sheet.

## 7. Email: contact@guidesync.net → your inbox

Cloudflare dashboard > your domain > **Email > Email Routing** > Enable. Add a custom address
`contact` → `ineilson@sgosolutions.com`, and verify the destination email.

## 8. Google setup for SEO and ads

1. **Google Search Console**: add the domain property (Cloudflare can add the DNS record for you),
   then submit `https://guidesync.net/sitemap.xml`.
2. **Google Analytics 4**: create a property and copy the Measurement ID (`G-…`) into
   `site.mjs` → `ga4Id`.
3. **Google Ads**: create a conversion action ("Submit lead form") using the
   **thank-you page URL** `/thank-you/`. Copy the conversion ID/label (`AW-…/…`) into
   `site.mjs` → `adsConversion`. The site fires it automatically after each lead.
4. Turn on **auto-tagging** in Google Ads. Each lead row will then include the Google
   click ID, campaign, and keyword that produced it.

---

## Notes for Google Ads approval

- **Disclosure:** every page says Guidesync connects businesses with processing partners
  and isn't a processor. There's also a Partner Disclosure page. Google expects this from
  lead-generation sites.
- **Peptide keywords:** Google restricts ads that promote unapproved substances. Some peptide
  terms may be flagged even though you're advertising payment processing, not peptides. Start with
  ad copy about merchant accounts and high-risk processing, and test peptide keywords in a
  separate ad group so a disapproval doesn't stop your other ads. The peptide page ranks in
  search on its own either way.
- **Main landing page for ads:** `/free-statement-review/`. Use the industry pages
  (e.g. `/industries/peptides/`) as landing pages for industry ad groups.

## How the automated blog works

A scheduled task runs on the **1st and 15th of each month at 1:23 PM Central**. It:
researches a topic, writes a new article following `automation/BLOG_PLAYBOOK.md`, checks
that the site builds, and pushes it to GitHub. Cloudflare then publishes it. It logs each post in
`automation/PUBLISH_LOG.md`. If the GitHub repo doesn't exist yet, the run makes no changes.
After step 2, there's nothing for you to do.

## Editing the site later

All the wording lives in `src/content/` (`industries.mjs`, `solutions.mjs`, `pages.mjs`,
`site.mjs`). Edit a file on GitHub and Cloudflare rebuilds the site in about a minute. To preview on
your own computer: `node build.mjs`, then open the `dist` folder with any local server.

*Have an attorney look over the Privacy Policy, Terms, and phone/text consent wording before
you launch paid ads.*
