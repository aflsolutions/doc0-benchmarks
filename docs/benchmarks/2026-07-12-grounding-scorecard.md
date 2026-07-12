# Grounding scorecard — 2026-07-12

**Corpora:** `redis/redis` (37 pages), `honojs/hono` (26 pages). **Peers:** DeepWiki, zread — their own public wikis for the same two repos, fetched fresh and hash-verified on 2026-07-12. **Judge:** `gemini-3.5-flash` on Vertex (`google.vertex.chat`), seed 42, 40 samples per wiki, 0 judge failures anywhere in this run.

## 1. Headline

On **redis**, doc0's machine-judged grounding score beats both peers: **0.744** claim-support vs DeepWiki's 0.692 and zread's 0.65 — same judge, same seed, same day. On **hono**, we lose: DeepWiki's freshly regenerated wiki beats us **0.872 to 0.692**, and was judged deeper, more coherent, and broader on top of it. We're publishing both, next to each other, on purpose.

| Corpus | doc0 | DeepWiki | zread | Result |
|---|---|---|---|---|
| redis (37 pages) | **0.744** | 0.692 | 0.65 | doc0 wins |
| hono (26 pages) | 0.692 | **0.872** | 0.667 | doc0 loses to DeepWiki |

Underneath both results sits a number neither peer can produce at all, because neither builds the underlying structure: doc0 machine-verifies **26.6%** (redis) and **29.3%** (hono) of its extracted call-chain claims end-to-end against the real, exported code graph. No LLM judge, no sampling, no vibes — a deterministic lookup against a graph built while doc0 parsed the code. That's this report's structural differentiator, and it's explained in full in section 3.

The rest of this report is the detail behind both rows of that table, including a real, un-spun accounting of why hono went the other way.

## 2. What is doc0

[doc0](https://github.com/aflsolutions) generates AI-written documentation wikis from GitHub repositories. Point it at a repo and it clones the code, parses it with tree-sitter into an AST-based symbol graph (functions, classes, call edges — not just a file listing), and uses that structure to ground an LLM's generated documentation pages in the actual codebase rather than in the model's guess about what the codebase probably looks like. The output is a searchable, browsable docs site with AI chat, backed by the same graph.

The part that matters for this repo: doc0 keeps the symbol graph it builds during parsing. Every "A calls B, which calls C" narrative in a generated page can, in principle, be checked against that graph after the fact — a hop either exists as a real edge in the parsed code, or it doesn't. Most AI-wiki generators (including both peers measured here) don't expose this structure at all, which means a claim like "this function calls that one" is something a reader has to take on faith, or go check by hand. doc0 can check it automatically, and this benchmark does.

doc0 is a commercial product built by aflsolutions. This repository is not the product — it's the trust artifact: a standalone, reproducible place to check specific quantitative claims about doc0's output quality against committed bytes, rather than against marketing copy. Everything in `corpora/`, `scoring/`, and `baselines/` is designed to be cloned and rerun by someone with no access to doc0's database, pipeline, or account.

Org: [github.com/aflsolutions](https://github.com/aflsolutions).

## 3. What is this benchmark

This benchmark measures one thing: **is the documentation doc0 generates actually grounded in the code it claims to describe, and how does that compare to what similar AI-wiki tools produce for the same repository?** It's built and maintained by aflsolutions, ported from the internal harness used to develop doc0 itself (same extractors, same judging logic — see `docs/DESIGN.md` for the exact provenance).

It runs in two tiers with very different trust properties, and every report states plainly which numbers came from which tier.

### Deterministic tier — free, offline, no API key, byte-reproducible

This tier extracts every "call chain" claim from a generated wiki page — arrow notation (`dictAdd() → dictExpand() → dictRehash()`), mermaid sequence diagrams, and numbered prose walkthroughs — and checks each hop against a graph index exported at generation time (`_graph-index.json`: a list of known symbol names plus the edges between them, with confidence scores). Each hop lands in one of four buckets:

- **verified** — the edge exists in the graph, in the claimed direction.
- **reversed** — the edge exists, but backwards (A calls B is claimed; the graph has B calls A).
- **edge-missing** — both ends of the hop are known symbols, but no edge connects them in the graph.
- **name-missing** — one or both ends of the hop aren't a symbol the graph recognizes at all.

**`hopVerificationRate`** is `verified / (all four buckets combined)`. Read honestly, this is a lower bound, not an error rate: `edge-missing` doesn't mean the claim is false, it means the code graph's edge extraction hasn't captured that particular call (callbacks, dependency injection, and dynamic dispatch are known blind spots for any static call-graph tool, doc0's included) — the scoring code's own comment is explicit that this bucket is *reported, never treated as wrong*, and no consumer is allowed to gate on 100%. What `hopVerificationRate` gives you is the fraction of chain claims a stranger can confirm purely mechanically, with zero trust required in doc0, the LLM that wrote the page, or an LLM judge. Nobody else in this comparison can produce this number at all, because DeepWiki and zread don't export (or, as far as we can tell, build) anything equivalent to a code graph.

This tier also computes plain structural metrics — average words per page, words per section, citation density (citing markdown links per 1,000 words), thin/noise-page counts, and mermaid-diagram validity. All of it runs against the corpora committed in `corpora/`, needs no network access, and CI reruns it on every pull request, asserting an *exact* match against `baselines/v0.1-launch.baseline.json` — not a threshold, a byte-for-byte reproduction. If this tier's numbers ever drift between two runs on the same commit, that's a bug in the scorer, full stop.

### Judged tier — reproducible with your own Gemini key, costs a few dollars

Two things a graph lookup can't tell you: whether a citation's excerpt actually *supports* the claim it's attached to (claim support), and how a wiki reads relative to a peer's on softer axes like depth, coherence, breadth, and citation quality (comparative). Both need a judge with language understanding, so both use an LLM — clearly labeled as such, gated behind an API key, and never blended into the deterministic numbers above.

- **`claimSupportRate`** — for each of 40 sampled claim+citation pairs (deterministic seeded sample, not the top 40), the judge reads the claim and the actual source excerpt at the cited line range and says supported/unsupported. `citationResolutionRate` is a companion sanity check: what fraction of those 40 citations pointed at real, resolvable file:line ranges at all (i.e., not a broken or hallucinated reference) — a wiki can have a high resolution rate and a low support rate (real citations that don't actually back the claim) or vice versa, and both numbers are reported so the two failure modes don't get conflated into one score.
- **Comparative dimensions** (depth, coherence, breadth, citation quality) — the judge sees a capped, page-count-stable sample of each wiki (12 pages, ~6,000 characters each) and gives a verdict per dimension. Every comparison runs in **both orders** (doc0 shown as "Wiki A" and as "Wiki B", both ways) to cancel position bias, repeated 3 times, and a dimension is flagged `unreliable` and *excluded from any ranking* if more than a third of its judge calls errored out — a judge outage can't quietly fabricate a result.
- **`judgeFailures`** is counted and reported, never silently dropped into the denominator as either a pass or a fail. Every number in this report ran with `judgeFailures: 0` — every judge call in this run actually succeeded.

Why bother with the graph-verified metric at all if a judge can just read the page? Because an LLM judge has its own known blind spots — a claim that requires chasing a call through three files can look "unsupported" to a judge skimming only the nearest citation, judges carry order/position bias (the both-orders design above exists specifically to cancel one of these), and a judge can reward citation *volume* over citation *correctness*. The graph check has none of that: it's a string/graph lookup against ground truth that was extracted mechanically during parsing, so it's free, instant, and byte-identical on every rerun. Neither tier is a substitute for the other — the deterministic tier tells you how much of doc0's own structural claims a stranger can confirm without trusting anyone; the judged tier is the only way to get a claim-support number comparable across three different products' generated prose.

### Corpus provenance

Every corpus directory (`corpora/<repo>-<date>/`) carries a `_meta.json` recording exactly what produced it: the source repo, the exact commit SHA of that repo at generation time (`source_repo_sha`), the doc0 commit that generated it (`doc0_commit`), the small/big-tier model IDs actually used, the doc mode, and the page count. The `_graph-index.json` sitting alongside it is the full exported symbol graph used for chain verification — 1,169 node names / 460 edges for hono, 6,693 node names / 13,405 edges for redis — so chain verification is hermetic for anyone who clones this repo: no doc0 database, no doc0 account, nothing but the committed files.

Peer content is never redistributed in this repo — only a per-page SHA-256 manifest per peer (`corpora/peers/<peer>-<repo>.manifest.json`). `pnpm peers:fetch` re-downloads each peer's live pages and hard-fails if any page's hash no longer matches the manifest — because peer sites regenerate their wikis on their own schedule, and a hash mismatch is a genuine finding (their content changed) that must not be silently papered over. Passing `--allow-drift` proceeds anyway and writes the mismatch list to a gitignored `results/peers/DRIFT.json` for the record. Concretely, for this report: the original peer manifests (captured 2026-06-25 for both hono peers) no longer matched what DeepWiki and zread serve today, so all four peer manifests — DeepWiki × 2 repos, zread × 2 repos — were re-scored fresh on 2026-07-12, the same day this judge run happened. The judged numbers above compare doc0 against what these tools serve *today*, not a stale June snapshot — which, as it happens, is directly relevant to the hono result below.

## 4. Configurations tested

**doc0**, as shipped, `technical` doc mode, both corpora on the standard tiered pipeline (small tier `gemini-3.1-flash-lite`, big tier `gemini-3.5-flash`, both EU-resident Vertex):

| Corpus | doc0 commit | Generated | Source SHA | Pages |
|---|---|---|---|---|
| redis-2026-07 | `175c6b0e` | 2026-07-02 | `5b22a09918743ba72952e35e431db23eb3d19605` | 37 |
| hono-2026-07 | `9e2ff6d6` | 2026-07-12 | `d3f97caa29bba1f1ae31a4e023c25224aa2a4261` | 26 |

**Peers**, as fetched — each peer's own default, public wiki for the same two repos, no doc0-side configuration involved:

| Peer | redis pages | hono pages | Fetched |
|---|---|---|---|
| DeepWiki | 44 | 46 | 2026-07-12 |
| zread | 24 | 28 | 2026-07-12 (zread-hono manifest also drops 3 non-documentation "site meta" pages — latest-updates, issues-and-feedback, about-contributors — that zread no longer serves as parseable content) |

This is **not** a controlled "same settings, same prompt" comparison — DeepWiki and zread are different products with their own defaults and no shared configuration surface with doc0. It's doc0's shipped default against each peer's shipped default, on the same two repositories, stated plainly as exactly that.

## 5. Results

### redis-2026-07 — doc0 wins

**Deterministic**

| metric | value |
|---|---|
| avgWords / page | 970 |
| avgWordsPerSection | 154 |
| citationDensityPer1k | 16.14 |
| chainsPerPage | 0.946 |
| **hopVerificationRate** | **0.266** (26.6%) |
| hop breakdown | verified 29 · reversed 2 · edge-missing 48 · name-missing 30 |

**Judged**

| source | claimSupportRate | citationResolutionRate |
|---|---|---|
| doc0 | **0.744** | 0.975 |
| DeepWiki | 0.692 | 0.975 |
| zread | 0.65 | 1.0 |

**Comparative** (doc0 = "Wiki A" in both directions; median of 3 repeats × both orders)

| Dimension | vs DeepWiki | vs zread |
|---|---|---|
| Depth | **better** (+1) | worse (−1) |
| Coherence | equal (0) | equal (0) |
| Breadth | worse (−1) | **better** (+1) |
| Citation quality | **better** (+2) | **better** (+1.5) |

Two rationales, quoted in full because the reasoning is more informative than the verdict alone:

> **Depth, vs DeepWiki (better, +1):** "Wiki A provides significantly more depth by explaining the low-level mechanics, data structures, and design intents (such as the specific use of non-tcache allocations in defragmentation and the exact steps of the ASM state machine) compared to Wiki B's higher-level, command-focused summaries."

> **Citation quality, vs zread (better, +1.5):** "Wiki A is better because it consistently provides specific line-range citations (e.g., `[src/acl.c:23-28]`) at the end of each subsection, whereas Wiki B's citations are coarser, pointing only to broad file regions (e.g., `[src/ae.h#L1-L119]`)."

It's not a clean sweep even here: DeepWiki's redis wiki is judged broader (44 pages including subsystems like the new Array Data Type and Client-Side Caching that doc0's 37-page sample doesn't cover) and roughly as coherent. doc0 wins on the metric this report leads with — claim support — plus depth and citation quality against both peers, and loses breadth to DeepWiki.

### hono-2026-07 — doc0 loses to DeepWiki

**Deterministic**

| metric | value |
|---|---|
| avgWords / page | 859 |
| avgWordsPerSection | 120 |
| citationDensityPer1k | 35.89 |
| chainsPerPage | 1.115 |
| **hopVerificationRate** | **0.293** (29.3%) |
| hop breakdown | verified 22 · reversed 3 · edge-missing 23 · name-missing 27 |

**Judged**

| source | claimSupportRate | citationResolutionRate |
|---|---|---|
| doc0 | 0.692 | 0.975 |
| **DeepWiki** | **0.872** | 0.975 |
| zread | 0.667 | 0.975 |

**Comparative**

| Dimension | vs DeepWiki | vs zread |
|---|---|---|
| Depth | worse (−1) | equal (0) |
| Coherence | worse (−1) | equal (0) |
| Breadth | worse (−0.5) | worse (−0.5) |
| Citation quality | worse (−1.5) | worse (−0.5) |

#### Where we lose — the honest accounting

DeepWiki's hono wiki was regenerated between our peer manifest's original 2026-06-25 capture and this report's 2026-07-12 re-score — every one of its 46 pages changed content (same page count, different bytes) — and the fresh version beats doc0 on grounding (0.872 vs 0.692) while also being judged unanimously deeper, more coherent, and broader. Against zread the picture is closer to even: depth and coherence are called `equal`, and zread's own depth rationale is, if anything, complimentary toward doc0 — "Wiki A provides significantly deeper explanations of internal mechanisms, such as the step-by-step cryptographic call chains for signed cookies and JWT verification, whereas Wiki B focuses more on high-level usage, installation, and routing patterns" — even though the aggregated median verdict landed at `equal`, not `better`.

**Two real defects, verified directly against the corpus, not just asserted:**

1. **Redundant pages.** doc0's `authentication.md` and `cryptography-and-tokens.md` both re-explain the same JWT/JWK internals in detail — same signing/verification pipeline, same `crypto.subtle` mechanics — and go further into a genuinely near-duplicate worked example: `authentication.md`'s "Configuration and Usage Example" and `cryptography-and-tokens.md`'s "Worked Example: JWT Authentication" are both a `jwt({ secret, alg: 'HS256' })` middleware setup against an `/auth/*` route reading `c.get('jwtPayload')` — different route names, same code. The judge caught exactly this: "Wiki A is slightly less coherent because it splits highly overlapping topics into separate pages (such as 'Authentication' and 'Cryptography and Tokens' which both heavily cover JWT/JWK internals), whereas Wiki B organizes these into a single, unified 'Core Framework' page."
2. **Citation convention.** doc0 cites once per section — a single wide-span "Sources:" line at the end of a subsection, covering several paragraphs at once. DeepWiki cites per claim, inline, with a tight line range right next to the sentence it supports. Measuring precisely (same extractor the judged tier uses, run directly against both corpora): DeepWiki's hono wiki carries **43.2 precise (line-range-resolvable) citations per 1,000 words** against doc0's **13.07**, and its median cited span is **8 lines** against doc0's **17**. zread, for reference, sits close to doc0 on this specific metric (13.52/1k, median span 20) — this gap is specifically a DeepWiki citation-granularity advantage, not a "DeepWiki always cites tighter than everyone" pattern. The judge's own citation-quality rationale says the same thing in prose: "Wiki B provides precise inline source citations with exact line-range links (e.g., `package.json:38-171`) for almost every claim, whereas Wiki A only lists source files in collapsible headers and appends general file-level or broad line-range links at the end of sections."

**Some of the gap is measurement artifact, not real quality — disclosed, not hidden behind it.** A hand-verified spot check of 6 of the 40 seed-42 claim samples found doc0-side scoring noise in roughly 2 of them: one where the extractor attached a shared table-footer citation to the wrong table row (an attribution bug in *our scoring harness*, not in the wiki), and one where the harness's claim-extraction fallback grabbed a bare code line with no real surrounding claim and fed it to the judge as if it were one. Correcting for that puts doc0's true hono claim-support rate a few points above the reported 0.692 — but even generously adjusted, it doesn't close a 17-point gap to DeepWiki's 0.872. The loss is real; only part of its size is an artifact, and we're naming which part.

**Fix trajectory:** merge `authentication.md` and `cryptography-and-tokens.md` (or split the JWT/JWK material along a cleaner boundary that doesn't duplicate the worked example); move citations to per-claim inline links instead of one wide footer per section; fix the two harness extractor bugs found in the spot check so future claim-support samples aren't scored against a table-footer misattribution or a bare-line false claim.

## 6. Reproduce this

### Deterministic tier — free, no key, offline

```bash
git clone <this repo>
cd doc0-benchmarks
pnpm install
pnpm bench:grounding                       # both corpora
pnpm bench:grounding --corpus hono-2026-07 # one corpus
```

This reruns chain extraction + verification against the committed `_graph-index.json` files and recomputes every structural metric above with zero network access — works with every judge-related env var unset. `results/grounding-<corpus>-<run-date>.json` and a matching `.md` land in the gitignored `results/` directory. CI runs this same tier on every PR and diffs it against `baselines/v0.1-launch.baseline.json` (exact match, not a threshold).

### Judged tier — your own Gemini key, small real cost

```bash
cp .env.example .env.local   # fill in GOOGLE_GENERATIVE_AI_API_KEY, or all three GOOGLE_VERTEX_* vars
pnpm peers:fetch              # re-fetch + hash-verify DeepWiki/zread; add --allow-drift if their content has moved on since our manifest and you want to proceed anyway
pnpm bench:grounding --judged --samples 40 --seed 42
```

Judge backend and model are selected by **credential presence**, not a flag: set only `GOOGLE_GENERATIVE_AI_API_KEY` and you get Google AI Studio's `gemini-2.5-flash`; set all three `GOOGLE_VERTEX_*` variables and you get Vertex's `gemini-3.5-flash` (`global` location) instead — Vertex is what produced every judged number in this report (`backend: google.vertex.chat`, `model: gemini-3.5-flash`, `seed: 42`, `samples: 40`). **An AI-Studio-judged rerun uses a materially different underlying model and is not directly comparable to the numbers published here** — treat it as its own baseline, not a reproduction of this one.

**Rough cost:** a full `--judged` run across both corpora makes on the order of 350 judge calls — roughly 120 claim-support calls (40 samples × 3 sources) per corpus, plus 48 comparative calls per corpus (4 dimensions × 2 peers × 3 repeats × 2 orders, each pushing a ~12-page/~6,000-char-per-page digest of both wikis). Comparative calls carry the bulk of the token volume. At list pricing for `gemini-3.5-flash`, this comes out to low-single-digit dollars for the whole two-corpus run — cheap enough to rerun per report, not cheap enough (or fast enough) to run on every PR, which is why CI only re-runs the deterministic tier.
