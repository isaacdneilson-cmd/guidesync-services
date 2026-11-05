# Guidesync Insights — Automated Blog Playbook

This file is the instruction set for the automated writer that publishes a new article to
`content/blog/` twice a month. The owner has asked for **no approval step**: the writer
researches, writes, validates the build, and pushes to `main`. Cloudflare Pages deploys
automatically. Because nobody reviews posts before they go live, the guardrails below are
mandatory.

## Goal

Each post should (1) rank for a search phrase a high-risk or complex merchant would type,
(2) be genuinely useful and accurate, and (3) lead naturally to the free statement review at
`/free-statement-review/`.

## Choosing a topic

Rotate through these lanes, and do not repeat the lane used in the previous post
(check the newest file in `content/blog/`):

1. **Industry deep-dive** for one of our industry pages: peptides, nutraceuticals,
   subscription billing, high-ticket coaching, e-commerce, travel, med spas, moving &
   logistics, events & ticketing, B2B & wholesale. Peptides is the top business priority:
   cover it at least once every 3 posts.
2. **News and rule changes** that affect merchants: card-brand rules (Visa, Mastercard),
   chargeback programs, FTC rules (e.g. negative option / click-to-cancel), CFPB actions,
   state surcharging and dual-pricing laws, interchange news, FDA actions that affect
   peptide or supplement sellers. Search the web for news from the last 30 days first.
3. **Policy and political climate**, written strictly as neutral, factual analysis of what a
   policy change means for merchants (e.g. interchange legislation, tariffs affecting
   e-commerce, regulatory shifts). Never take a side, endorse or criticize a party or
   politician, or speculate about outcomes.
4. **Evergreen how-to** on transaction challenges: chargebacks, reserves, MATCH list,
   descriptors, PCI, ACH vs card, effective rate, terminations, Level 2/3 data.

Before writing, list existing slugs in `content/blog/` and avoid duplicating a topic. Pick a
specific long-tail target keyword (e.g. "nutraceutical merchant account reserve",
"why was my merchant account terminated") and use it in the title, description, first
paragraph, and one H2.

## Accuracy rules (non-negotiable)

- Use WebSearch/WebFetch to verify every specific fact, figure, date, threshold, or rule.
  Prefer primary sources (visa.com, mastercard.com, ftc.gov, fda.gov, consumerfinance.gov,
  federalregister.gov, state legislature sites). If a fact cannot be verified, leave it out.
- Paraphrase everything. Never copy sentences from sources. At most one short quote
  (under 15 words) per source, and usually none.
- Do not invent statistics, case studies, customer stories, testimonials, or quotes.
- Never promise approval, rates, savings, or timelines. Never name or imply our processing
  partner. Never mention "Blue Sage" or any partner by name.
- Do not give legal or tax advice; describe rules and tell readers to confirm with their
  processor or advisor (the page template adds a disclaimer automatically).
- Peptides, supplements, health: never describe therapeutic benefits, dosing, or claim a
  product treats anything. Write about payments, compliance, and underwriting only.
- Do not write about cannabis/CBD, gambling, crypto, adult, firearms, or online pharmacy
  topics (Google Ads certification categories the owner is avoiding for now).
- Neutral, professional tone. No fear-mongering, no competitor bashing, no naming of
  competitor processors except widely known aggregators (Stripe, Square, PayPal) when
  factually relevant.

## Format

Create `content/blog/YYYY-MM-DD-<slug>.md` (today's date, slug = short keyword phrase,
lowercase, hyphens). Front matter must be exactly:

```
---
title: <55–70 characters, includes target keyword>
description: <140–160 characters, includes target keyword>
date: YYYY-MM-DD
category: <one of: Peptides, Nutraceuticals, Subscriptions, High-Ticket, E-commerce, Travel, Med Spas, Moving & Logistics, Events & Ticketing, B2B, Chargebacks, Fees & Pricing, Regulation & News, Compliance>
industry: <matching industry slug from the list below, or omit the line>
tags: [keyword one, keyword two, keyword three]
author: Guidesync Editorial Team
---
```

Industry slugs: `peptides`, `nutraceuticals`, `subscription-billing`,
`high-ticket-coaching`, `ecommerce`, `travel`, `med-spas`, `moving-logistics`,
`event-ticketing`, `b2b-wholesale`.

Body (Markdown only, no raw HTML):
- 900–1,400 words. Short paragraphs. 4–7 `##` sections; `###` allowed.
- Open with the reader's problem in 2–3 sentences. No "In today's fast-paced world."
- Include at least one numbered or bulleted checklist.
- Include 2–3 internal links using root-relative URLs, e.g.
  `[peptide merchant accounts](/industries/peptides/)`,
  `[high-risk merchant accounts](/solutions/high-risk-merchant-accounts/)`,
  `[free statement review](/free-statement-review/)`, or another blog post `/blog/<slug>/`.
- For news posts, link 1–3 primary sources with full https URLs.
- End with a short "bottom line" section that points to the free statement review.
  Do not add your own CTA box; the template adds one.

## Publish steps

1. Write the file.
2. Run `node build.mjs`. It must finish without errors and the post must appear in
   `dist/blog/<slug>/index.html`. Fix any problem before continuing.
3. Commit only the new Markdown file (dist/ is git-ignored):
   `git add content/blog/<file>.md && git commit -m "Blog: <title>"`
4. `git push origin main`.
5. Append one line to `automation/PUBLISH_LOG.md`: `YYYY-MM-DD | <slug> | <lane> | <target keyword>`
   and include it in the same commit (or a follow-up commit) before pushing.
