# Comparison systems

Living table of how doc0 compares against other AI-generated-wiki tools, updated as new reports land. See `docs/benchmarks/` for the full write-up behind each row and `docs/DESIGN.md` for the scoring methodology.

**Methodology caveat, stated once, applies to every row below:** these are numbers from **our harness scoring peers' public output** — we fetch DeepWiki's and zread's live, published wikis for the same repository doc0 was measured on, hash-verify what we fetched, and run the identical scorer over all three. They are **not** DeepWiki's or zread's self-reported numbers, and they are not necessarily reproducible by anyone using a different judge model or a different day's snapshot of a peer's site (peer wikis regenerate on their own schedule — see the drift policy in `docs/benchmarks/2026-07-12-grounding-scorecard.md`, section 3).

## Grounding — measured by us, 2026-07-12

Judge: `gemini-3.5-flash` on Vertex (`google.vertex.chat`), seed 42, 40 samples per wiki, 0 judge failures.

| Corpus | System | Claim support | Citation resolution | Pages sampled by judge |
|---|---|---|---|---|
| redis/redis | **doc0** | **0.744** | 0.975 | 37 (full corpus) |
| redis/redis | DeepWiki | 0.692 | 0.975 | 44 (full corpus) |
| redis/redis | zread | 0.65 | 1.0 | 24 (full corpus) |
| honojs/hono | doc0 | 0.692 | 0.975 | 26 (full corpus) |
| honojs/hono | **DeepWiki** | **0.872** | 0.975 | 46 (full corpus) |
| honojs/hono | zread | 0.667 | 0.975 | 28 (full corpus) |

**Claim support** = share of sampled claim+citation pairs the judge confirmed the cited source excerpt actually backs. **Citation resolution** = share of those citations that pointed at a real, resolvable file:line range at all (independent of whether the claim itself checked out).

### Machine-verified call chains — doc0 only

Neither DeepWiki nor zread exposes (or, as far as we've found, builds) a code graph, so this metric has no peer row — it's doc0's structural differentiator, not a head-to-head number.

| Corpus | Chains extracted | chainsPerPage | hopVerificationRate |
|---|---|---|---|
| redis/redis | 35 | 0.946 | 26.6% |
| honojs/hono | 29 | 1.115 | 29.3% |

`hopVerificationRate` = share of extracted call-chain hops confirmed against the real, exported symbol graph (`_graph-index.json`) — a deterministic lookup, not an LLM judgment. See the full report for why the remaining hops (`edge-missing`, `name-missing`, `reversed`) are not the same thing as "wrong."

### Comparative dimensions (doc0 vs. each peer, both-orders median of 3 repeats)

| Corpus | Dimension | vs DeepWiki | vs zread |
|---|---|---|---|
| redis | Depth | better (+1) | worse (−1) |
| redis | Coherence | equal (0) | equal (0) |
| redis | Breadth | worse (−1) | better (+1) |
| redis | Citation quality | better (+2) | better (+1.5) |
| hono | Depth | worse (−1) | equal (0) |
| hono | Coherence | worse (−1) | equal (0) |
| hono | Breadth | worse (−0.5) | worse (−0.5) |
| hono | Citation quality | worse (−1.5) | worse (−0.5) |

## Precise-citation density (supplementary, hono only — see 2026-07-12 report §5)

Computed directly against the corpus and freshly-fetched peer content with the same claim-citation extractor the judged tier uses (`scoring/judge-accuracy.ts`'s `extractClaimCitations`), not (yet) part of the standard scorer's JSON output.

| System | Precise citations / 1k words | Median cited span (lines) |
|---|---|---|
| doc0 | 13.07 | 17 |
| DeepWiki | 43.2 | 8 |
| zread | 13.52 | 20 |

## External benchmarks (not yet run by us)

CodeWikiBench (ACL Findings 2026) publishes its own evaluator and competitor scores. doc0 has not been run through it yet — Family 2 of this benchmark suite (see `docs/DESIGN.md`) targets exactly that. Listed here for reference only; **do not compare these numbers directly to the claim-support numbers above** — different corpus (21 repos, 7 languages), different judge, different metric definition entirely.

| System | CodeWikiBench score | Source |
|---|---|---|
| CodeWiki-Sonnet-4 | 68.8% | published, external |
| DeepWiki | 64.1% | published, external |
| doc0 | — | not yet run |

## Change log

- **2026-07-12** — first grounding-scorecard numbers published (redis, hono). See `docs/benchmarks/2026-07-12-grounding-scorecard.md`.
