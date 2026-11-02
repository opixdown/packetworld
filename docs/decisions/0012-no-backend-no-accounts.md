# 12. No backend and no accounts

- **Status:** Accepted, amended by [0018](0018-optional-real-dns-lookup.md) and [0023](0023-privacy-friendly-analytics.md)
- **Date:** 2026-11-02

## Context

The first version must be fully usable without registration. A backend adds cost, privacy obligations and an operations burden for an open-source project.

## Decision

Everything runs in the browser. Explanation mode and lesson progress are stored in `localStorage` (guarded, optional). Shareable state goes in the URL.

## Consequences

- Free to host, private by default, works offline once loaded.
- Progress does not follow a learner between devices.

## Alternatives considered

- **Accounts with synced progress:** a possible later addition, not needed for learning.
