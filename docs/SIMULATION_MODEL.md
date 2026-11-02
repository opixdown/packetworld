# Simulation model

Everything PacketWorld shows comes from one pure function:

```ts
buildJourney(config: Partial<JourneyConfig>): Journey
```

The same config always produces the same journey, including which packets random loss hits. There are no real network requests.

## Config

| Field | Meaning | Default |
|---|---|---|
| `url` | The address to "open". `http://` skips TLS and uses port 80; an IPv4 literal skips DNS. | `https://example.com` |
| `dnsCache` | `cold`, `tld-cached`, `resolver-cached`, `os-cached`, `browser-cached` | `cold` |
| `scenario` | `normal`, `dns-nxdomain`, `syn-lost`, `synack-lost`, `ack-lost`, `server-timeout`, `tls-invalid-cert`, `http-404` | `normal` |
| `latencyMs` | One-way latency between client and web server | 30 |
| `lossPercent` | Chance that any one transmission is lost | 0 |
| `serverTimeMs` | Time the server spends building the HTML response | 20 |
| `seed` | Changes which packets random loss hits, nothing else | 1 |

## Events

A journey is an ordered list of `SimEvent`s. There are two kinds:

- **packet**: a `Packet` travels `from` → `to`. Its `fate` is `delivered`, `lost` (disappears in transit) or `ignored` (arrives, nobody answers).
- **local**: something happens on one machine: a cache lookup, a certificate check, a timer expiring.

Every event has:

- `stage`: `dns`, `tcp`, `tls` or `http`
- `title`, plus `beginner` and `technical` narration
- `t` and `duration`: simulated start time and length in ms
- `tone`: `info`, `success`, `warning` or `error`
- `onStart` / `onEnd`: patches to the `WorldState`. `onEnd` is skipped for packets that are lost or ignored, so a lost SYN never moves the server to SYN-RECEIVED.

## World state

```ts
interface WorldState {
  tcpClient: TcpState        // CLOSED · SYN-SENT · ESTABLISHED
  tcpServer: TcpState        // LISTEN · SYN-RECEIVED · ESTABLISHED
  tls: 'none' | 'negotiating' | 'secure' | 'failed' | 'not-used'
  resolvedIp: string | null
  browser: 'blank' | 'resolving' | 'connecting' | 'securing' | 'waiting' | 'html' | 'rendered' | 'error'
  error: { title, code, detail } | null
  httpStatus: number | null
  resources: string[]        // 'html', 'css' – drives the browser preview
}
```

The world at any moment is computed by folding patches, so any step can be shown instantly and stepping backwards is exact.

## Packets and layers

A `Packet` carries `layers`, outermost first, each with named fields:

- **IPv4**: source, destination, protocol, TTL, total length. NAT notes explain the public address.
- **UDP** or **TCP**: ports; for TCP also sequence and acknowledgment numbers, flags, window and options.
- The application layer: **DNS** (transaction ID, flags, question, answer/authority/additional sections), **TLS** (record type, handshake fields), **HTTP** (method, path, headers, raw message).

Helpers in `sim/builder.ts` and `sim/stages/segment.ts` build these, so values stay consistent across every packet.

## The clock

`JourneyBuilder.now` is the simulated time. Sending a delivered packet moves `now` to its arrival time; a local event adds its duration. Two exceptions model real behaviour:

- **Same flight.** `packet(…, { at })` lets several packets leave together (the server's TLS flight; the client's Finished and HTTP GET).
- **No waiting for your own ACK.** After the final handshake ACK the clock goes back to the ACK's departure, because the client may send data immediately.

One-way latencies: client↔server is configurable; client↔resolver 8 ms, resolver↔root 12 ms, resolver↔TLD 18 ms, resolver↔authoritative 24 ms.

## Loss and retransmission

`JourneyBuilder.reliable()` sends a packet until it is delivered. A loss is either forced by the scenario or rolled from the seeded generator. After each loss the sender waits for its retransmission timer, which doubles every time (RFC 6298):

| What | Initial timer | Source |
|---|---|---|
| DNS query from the client | 1 s | Real stub defaults vary (glibc: 5 s) |
| Resolver query to a nameserver | 800 ms | Typical adaptive resolver behaviour |
| TCP SYN | 1 s | RFC 6298 initial RTO |
| TCP data after the handshake | max(200 ms, 3 × RTT) | RFC 6298 after one RTT sample; Linux minimum 200 ms |

Random loss is capped at three losses per packet so every journey ends. TCP-level special cases (lost SYN-ACK, lost final ACK, silent server) are modelled explicitly in `stages/tcp.ts`.

## Adding a protocol step

1. Decide which stage it belongs to and write it in the matching `stages/*.ts` file. Keep sequence numbers flowing: read them from the previous stage's result and return the updated ones.
2. Build packets with the existing helpers (`segment()`, `ipv4()`, `udp()`, `tcp()`), never with hand-written field lists for shared layers.
3. Write both narrations. Follow [CONTENT_GUIDE.md](CONTENT_GUIDE.md).
4. Use `onStart` / `onEnd` for anything the UI shows as state.
5. Add a test in `src/sim/journey.test.ts`. The sequence-number checker runs on every scenario automatically.
6. If you simplify anything, document it in [ACCURACY.md](ACCURACY.md).
