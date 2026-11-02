# 9. TLS 1.3 with HTTP/1.1 for the main example

- **Status:** Accepted
- **Date:** 2026-11-02

## Context

The main HTTPS example must be modern (TLS 1.3) and readable. HTTP/2 and HTTP/3 are binary and multiplexed, which is hard to show in a first journey.

## Decision

The ClientHello offers ALPN `h2, http/1.1` as a real browser would; the simulated server selects `http/1.1` in EncryptedExtensions. TLS 1.3 is used throughout. HTTP/2 and HTTP/3 are explained in lessons and on the roadmap.

## Consequences

- Requests and responses are shown as readable text.
- Many real servers would choose h2; the inspector notes this.

## Alternatives considered

- **HTTP/2:** realistic, but frames and HPACK obscure the request/response idea.
- **TLS 1.2:** familiar from older material, but outdated, and it would teach two round trips as normal.
