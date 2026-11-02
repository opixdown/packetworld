# Vendored: Stageshow kit

This folder is a copy of the [Stageshow](https://github.com/benjitaylor/skills/tree/main/stageshow)
React kit (MIT, © 2026 Benji Taylor, see `LICENSE`).

PacketWorld uses it **only for marketing illustrations** (the landing page hero).
The learning simulations do not depend on it; see
[ADR 0016](../../../docs/decisions/0016-stageshow-kit-for-landing-illustrations.md).

Local changes from upstream:

- `brands/` and `parts/BrandMark.*` removed. They contain third-party logo
  artwork under mixed licenses that PacketWorld does not need.
- `index.ts` and `parts/index.ts` no longer export `BrandMark`, `brandMarks`,
  `BrandName` or `BrandAsset`.
- `stageshow.css` no longer imports `parts/BrandMark.css`.
- `phone.tsx`: removed an unused `useLayoutEffect` import so the project's
  `noUnusedLocals` type check passes.

Do not edit other files here; upgrade by re-copying `kit/` and re-applying the
changes above.
