# 20. Host on Vercel

- **Status:** Accepted
- **Date:** 2026-11-02

## Context

PacketWorld is a static site. It was first published on GitHub Pages through a workflow. The project owner wants Vercel as the main host.

## Decision

- Host the production site on Vercel at https://packetworld.vercel.app, connected to the GitHub repository so that pushes to `main` deploy to production and pull requests get preview deployments.
- Keep build settings in `vercel.json` so they are versioned with the code.
- Keep the GitHub Pages workflow as a mirror. The hash router and relative asset paths ([ADR 0011](0011-hash-router-for-static-hosting.md)) let the same build run on both without changes.

## Consequences

- Contributors see a live preview for every pull request.
- Two hosts serve the same build; the README links to Vercel as the main one.

## Alternatives considered

- **GitHub Pages only:** simpler, but no pull-request previews.
- **Netlify or Cloudflare Pages:** equivalent for a static site; Vercel was the owner's choice.
