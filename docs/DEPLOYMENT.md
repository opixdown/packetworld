# Deployment

PacketWorld builds to static files in `dist/`. It uses a hash router and relative asset paths, so it runs from any folder on any static host with no server configuration ([ADR 0011](decisions/0011-hash-router-for-static-hosting.md)).

```sh
npm ci
npm run build   # outputs dist/
npm run preview # serves dist/ locally to check it
```

## Vercel (main site)

The live site, https://packetworld.vercel.app, is hosted on Vercel and connected to the GitHub repository:

- Every push to `main` deploys to production.
- Every pull request gets its own preview URL.
- Build settings live in `vercel.json` (`npm ci`, `npm run build`, output `dist/`).

To host your own fork on Vercel:

1. Import the repository at https://vercel.com/new (or run `npx vercel link` in the project folder).
2. Keep the detected settings (they come from `vercel.json`) and deploy.

## GitHub Pages (mirror)

The repository includes `.github/workflows/deploy.yml`, which builds and publishes on every push to `main`.

1. Push the repository to GitHub.
2. In the repository, open **Settings → Pages** and set **Source** to **GitHub Actions**.
3. Push to `main` (or run the workflow manually from the **Actions** tab).
4. The site appears at `https://<your-username>.github.io/<repository-name>/`. For this project: https://opixdown.github.io/packetworld/

## Other hosts

Upload the contents of `dist/` to Netlify, Vercel, Cloudflare Pages, S3 or any web server. No rewrites are needed.

## After creating the repository

Update `REPO_URL` in `src/lib/site.ts` so the GitHub links in the header, footer and landing page point to your repository.
