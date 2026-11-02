# Security policy

PacketWorld is a static website with no backend and no accounts. The deployed site counts page views with Vercel Web Analytics, which uses no cookies and stores no personal data (ADR 0023). Its simulations never send real network requests. The one exception is the opt-in **Look it up for real** button, which sends a DNS-over-HTTPS query for the shown hostname to Cloudflare (1.1.1.1) or Google (8.8.8.8), as stated next to the button. The **Load the real page** button loads the shown website in a sandboxed frame (scripts and forms disabled, no referrer); that site sees the visit like any other.

## Reporting a vulnerability

If you find a security issue (for example a cross-site scripting problem through URL parameters, or a compromised dependency), please **do not open a public issue**. Use GitHub's **Report a vulnerability** button on the repository's Security tab, which creates a private advisory visible only to maintainers.

Please include steps to reproduce and the affected version or commit. We aim to acknowledge reports within a week.

## Scope

- In scope: the PacketWorld web application and its build pipeline.
- Out of scope: the simulated addresses and domains shown in the app. They come from documentation ranges (RFC 5737) and are not real systems.
