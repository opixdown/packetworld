# Content guide

Words are half of PacketWorld. This guide covers the two explanation levels, lessons, quizzes and packet descriptions.

## Two voices

Every event and packet has a **beginner** and a **technical** explanation. They describe the same thing at different depths; neither may contradict the other.

### Beginner

- Write for a curious 14-year-old or a non-technical adult. No acronym without saying what it does.
- Lead with what happens, then why it matters: "Your browser asks the server: can we talk?"
- One real-life comparison where it genuinely helps (a phone call, a passport, a post office). Never stretch an analogy past where it holds, and never let it teach something false.
- Short sentences. Second person ("your browser") is fine.

### Technical

- Write for a developer who wants protocol detail: field names, flags, state names, RFC numbers.
- State facts precisely: `seq=1000`, `RD=1`, `ESTABLISHED`, "RTO 1 s per RFC 6298".
- Mention the real-world variation when our simplified value is one of many ("real defaults vary; glibc uses 5 s").
- No hype, no hedging. If something is simplified, say how.

## Learn more, read less

- The text shown by default (the event's `beginner` text) should be **one or two sentences**. If it needs more, move the rest into `why` or `analogy`.
- Every local step should have a `why`, and an `analogy` when a good one exists. They appear behind the "Why?" and "Real-life example" buttons.
- Add any new word a 16-year-old may not know to `src/content/glossary.ts`, with a one-sentence definition. It is then underlined and clickable everywhere automatically.

## Packet explanations

Each packet has `what` (what it does) and `why` (why it matters), plus an optional beginner `analogy`. The inspector shows them under "What it does", "Why it matters" and "Real-life comparison".

## Lessons

Each lesson in `src/content/lessons.ts` has:

| Field | Guidance |
|---|---|
| `intro` | Two sentences: the problem this layer solves. |
| `labHint` | One sentence telling the learner what to try first. |
| `simple` | Three short paragraphs, plain language. |
| `technical` | Three short paragraphs with real terminology and references. |
| `quiz` | Three questions (see below). |

Prose supports `**bold**` and `` `code` `` only.

## Quizzes

- Test understanding, not memorised trivia: "what happens if…", "which part tells the server…".
- Four options, one clearly correct. Wrong options should be plausible misconceptions, not jokes.
- Every question has an explanation that teaches, shown whether the answer was right or wrong.

## Style

- Sentence case for titles and buttons.
- Use real protocol names and capitalisation: TCP, SYN-ACK, TLS 1.3, HTTP/1.1, HTTP/3, QUIC.
- Numbers with units and a space: `30 ms`, `1 s`, `517 bytes`.
- Prefer "server", "browser" and "your computer" over "host" and "endpoint" in beginner text.
- Never imply that the simulation contacted a real server.

## Accuracy check before merging

- Does every number agree with the packets around it (ports, seq/ack, sizes)?
- Would a protocol engineer object to any sentence in the technical text?
- Would a beginner learn anything false from the beginner text or the analogy?
- Is the simplification documented in [ACCURACY.md](ACCURACY.md)?
