# 23. Privacy-friendly analytics and an approved X posting queue

- **Status:** Accepted (amends [0012](0012-no-backend-no-accounts.md))
- **Date:** 2026-11-02

## Context

The project owner wants PacketWorld to reach more people and to see whether anyone actually uses it. That needs two things the project did not have: a way to count visits, and a steady stream of posts on X without doing it all by hand.

## Decision

**Analytics.** Use Vercel Web Analytics through `@vercel/analytics`:

- It sets no cookies and stores no personal data; visits are counted in aggregate (pages, referrers, countries, devices).
- Hash routes are rewritten to paths (`/#/journey` → `/journey`) so each page is counted separately; query strings are dropped; the hidden intro-film page is not counted (`src/lib/analytics.ts`).
- It only runs on the deployed site once Web Analytics is enabled for the project in Vercel.

**Posting to X.** A GitHub Action (`.github/workflows/post-to-x.yml`) runs once a day and posts the first entry in `marketing/x-posts.json` whose status is `approved`, then marks it `posted` with its link.

- Nothing is posted automatically from a draft: a person must set `"status": "approved"`.
- CI validates the queue (length limits, statuses, media files) on every push.
- Credentials live only in GitHub repository secrets.
- Reddit and Hacker News are not automated: their rules forbid it.

## Consequences

- The site is no longer "zero data": anonymous page-view counts go to Vercel. SECURITY.md and the README say so.
- Posting depends on the owner's X developer app and its API limits.

## Alternatives considered

- **Google Analytics:** cookies and a consent banner, more data than needed.
- **A scheduling service (Buffer, Typefully):** fine too, but keeps the posts outside the repo and needs another account; the queue file keeps everything reviewable in one place.
- **Fully automatic posting:** rejected by the owner in favour of approving each post.
