# Closing the hono gap: citation granularity + page dedup — 2026-07-12 follow-up

Follow-up to [the 2026-07-12 grounding scorecard](2026-07-12-grounding-scorecard.md), which reported an honest loss on `honojs/hono`: doc0 0.692 claim support vs DeepWiki's 0.872, with two named defects and a fix trajectory. This report is that trajectory executed and re-measured — same source commit, same judge, same seed, same peer snapshot.

## 1. Headline

**doc0's hono claim support went from 0.692 to 0.795** after three generation-pipeline changes aimed squarely at the two defects the first report named. That is doc0's best claim-support number recorded on any corpus to date (previous best: 0.744 on redis), and it cuts the gap to DeepWiki's same-snapshot 0.872 from 18 points to under 8. Both duplicate-page defects are gone from the regenerated wiki, every citation now carries a resolvable line range, and the median cited span tightened from 17 lines to 13.

Not everything moved the right way: extractable call-chain narration dropped (29 → 16 chains), and citation *density* — while up 22% — remains well short of DeepWiki's. Both are quantified below, not hidden.

| | hono v1 (first report) | hono v2 (this report) | direction |
|---|---|---|---|
| **Claim support (judged)** | 0.692 | **0.795** | ✅ +10.3 pts |
| Precise citations / 1k words | 13.05 | 15.91 | ✅ +22% |
| Citations with line ranges | 95.5% | **100%** | ✅ |
| Median cited span (lines) | 17 | **13** | ✅ tighter |
| Duplicate JWT/JWK pages | yes (2 pages) | **none** | ✅ merged |
| Pages / sections | 26 / 8 | 23 / 7 | consolidation |
| chainsPerPage | 1.115 | 0.696 | ⚠️ regressed |
| hopVerificationRate | 29.3% | 14% | ⚠️ regressed |

## 2. What changed in the pipeline

The first report's fix trajectory named three things; all three shipped (doc0 generation commit `14d561f3`, pre-release):

1. **Citation-granularity enforcement in the lint-revise loop.** doc0's page generator already ran every draft through a deterministic linter and fed failures back for revision. Two new *error-level* rules now enforce what the page prompt always demanded: an H2 section with three or more content blocks may not collapse its citations into a single trailing `Sources:` footer, and every citation label must carry an explicit `:start-end` line range. Two softer *warning-level* nudges (per-block citation coverage, a 120-line ceiling on cited spans) report without blocking, deliberately — error-level everything would trade citation spam for density.
2. **File-overlap page deduplication at structure time.** The structure consolidator previously only compared pages whose *titles* shared tokens, which is exactly why "Authentication" and "Cryptography and Tokens" — no shared title token, near-identical source-file sets — were never compared. Candidate pairs are now also formed from relevant-file overlap (Jaccard ≥ 0.6), feeding the same merge machinery.
3. **A partition constraint in the structure prompt.** File-to-page assignment is now framed as a partition: each source file should be the primary home of exactly one page; genuinely shared files require the pages to link rather than both re-explain.

Same source tree as v1 (`honojs/hono` @ `d3f97caa`), so the before/after isolates the pipeline change from upstream drift.

## 3. Results

### Judged tier

Judge: `gemini-3.5-flash` on Vertex, seed 42, 40 samples, **0 judge failures** — identical configuration to the first report, so the v1 row and the peer rows are directly comparable. Peer numbers below are from the first report's same-day run over hash-verified peer content; peers were not re-fetched or re-judged for this follow-up.

| source | claimSupportRate |
|---|---|
| doc0 hono v1 | 0.692 |
| **doc0 hono v2** | **0.795** |
| DeepWiki (2026-07-12 snapshot) | 0.872 |
| zread (2026-07-12 snapshot) | 0.667 |

The mechanism is exactly the one the first report predicted: the judge confirms a claim when the cited excerpt actually contains the evidence. Wide section-footer citations made the judge hunt through 17+ line spans that often covered a *different* paragraph's claim; per-block citations with tight ranges put the evidence where the citation points. Note the first report's spot check estimated ~2/6 of v1's misses were scoring-harness artifacts — that artifact rate applies to both runs equally, so the +10.3 delta is a like-for-like improvement.

### Deterministic tier

| metric | v1 | v2 |
|---|---|---|
| pages | 26 | 23 |
| avgWords / page | 859 | 887 |
| precise citations / 1k words | 13.05 | 15.91 |
| median cited span | 17 | 13 |
| line-ranged share of citations | 95.5% | 100% |
| chains extracted | 29 | 16 |
| hopVerificationRate | 0.293 | 0.14 |

Precise-citation numbers computed with the same extractor as the first report (`scoring/judge-accuracy.ts`'s `extractClaimCitations`, run directly over both committed corpora — reproducible offline).

### Structure: the duplicate pages are gone

v1 carried `authentication.md` and `cryptography-and-tokens.md`, both re-explaining JWT/JWK internals down to a near-identical worked example. v2 has a single `cryptography-and-jwt.md`. The consolidation also merged v1's three platform pages (`edge-workers`, `local-runtimes`, `serverless-adapters`) into one `platform-adapters.md`, and the freed page budget went to the core engine: v2 dedicates four pages to the router subsystem (`router-architecture`, `trie-router`, `regexp-router`, `specialized-routers`) plus a proper `request-lifecycle.md` — a more architecture-first structure than v1's flatter topic list.

## 4. The honest accounting — what regressed and what's still short

**Call-chain narration dropped.** 29 → 16 extractable chains; verified hops 22 → 6. Digging into the corpora: mermaid diagram volume is flat (179 → 175 diagram edges), but numbered step-lists that name backticked functions — the extractor's richest chain source — fell 106 → 75. The citation-dense writing style appears to displace some function-name step narration; additionally, v2's only qualifying auto-detected process page was dropped by a pre-existing overlap-dedup pass, where v1 had one. Two caveats before reading this as a hard trade-off: this is a single generation run (page-level LLM variance between runs is real and uncontrolled here), and the hop-verification *denominator* shrank along with the numerator. It goes on the fix list with the same discipline as the citation gap did: measured, named, next.

**Citation density is better but not DeepWiki-level.** 15.91/1k vs DeepWiki's 43.2/1k. The error-level rules enforce a floor (no single-footer sections, ranges everywhere); per-block coverage is deliberately warning-level, so density rose 22% rather than 3×. DeepWiki writes shorter blocks with a citation on nearly every one; matching that means either promoting the per-block rule to error level (risking citation spam and lint-loop cost) or a deeper style change. Deferred, deliberately, with eyes open.

**Fewer pages is not a regression — but it is a trade.** 23 pages vs 26. The merges are why the coherence defect is gone; a reader who wants three separate serverless-platform pages loses that granularity. The judge treated consolidation as a coherence win on v1's evidence; we agree, and note it.

## 5. Reproduce this

Deterministic (free, offline):

```sh
pnpm install
pnpm bench:grounding --corpus hono-2026-07-v2
pnpm vitest run test/baseline-reproduction.test.ts   # CI pins these numbers
```

Judged (your own Gemini key, ~$1–2):

```sh
export GOOGLE_GENERATIVE_AI_API_KEY=...   # or the GOOGLE_VERTEX_* trio
pnpm bench:grounding --corpus hono-2026-07-v2 --judged --samples 40 --seed 42
```

Corpus provenance: `corpora/hono-2026-07-v2/_meta.json` — 23 pages generated from `honojs/hono` @ `d3f97caa` by doc0 commit `14d561f3`, small tier `gemini-3.1-flash-lite`, big tier `gemini-3.5-flash`. The graph index (`_graph-index.json`, 1169 nodes / 460 edges) is identical to v1's, as expected — neither the source tree nor the graph extractor changed.
