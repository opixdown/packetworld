# 10. Readable initial sequence numbers

- **Status:** Accepted
- **Date:** 2026-11-02

## Context

Real TCP initial sequence numbers are random 32-bit values (RFC 6528), such as 2847561093. Following `ack = seq + 1` with numbers that size is hard for beginners.

## Decision

The client's ISN is 1000 and the server's is 5000. All later sequence and acknowledgment numbers follow from them exactly (SYN and FIN count as one, data counts its bytes). The technical text states that real ISNs are random.

## Consequences

- The arithmetic is easy to follow and verify.
- Tests check the numbers stay consistent in every scenario.

## Alternatives considered

- **Random-looking values:** realistic, but obscure the lesson.
- **Relative numbers starting at 0, as Wireshark shows them:** also good; 1000/5000 make the two directions easy to tell apart.
