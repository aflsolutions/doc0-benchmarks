# doc0-benchmarks — Public Benchmark Repo Design

**Date:** 2026-07-12
**Status:** Approved design (user-confirmed 2026-07-12), pre-implementation.
**Decisions (user):** v1 = Family 1 (grounding scorecard) + Family 2 (CodeWikiBench); prod-pillar Vertex creds for generation runs; repo `aflsolutions/doc0-benchmarks`, PRIVATE → flipped public at first polished report; peer corpora via fetch-script + per-page hashes (no redistribution); scoring code COPIED into the public repo as its canonical home (approach A — no npm package, no dependency on private doc0-commercial).
**Spec home note:** this file lives untracked in the doc0-commercial worktree; the implementation's first task commits it into `doc0-benchmarks/docs/` (its real home), mirroring how prior cross-repo SP docs were carried.

## Why

A public, reproducible benchmark suite is doc0's trust artifact — the same play gbrain-evals runs: committed corpora, machine-verifiable answers, versioned baselines, standalone reports, and an explicit publish-the-bad-numbers posture. doc0 is unusually well-positioned: the SP1 harness already measures grounding better than anything peers publish, the comparative numbers already exist (claimSupport 0.718 vs DeepWiki 0.55 / zread 0.65, same-run same-judge), and CodeWikiBench (ACL Findings 2026) provides an external anchor with published competitor scores (CodeWiki-Sonnet-4 68.8%, DeepWiki 64.1%).

## Repo fundamentals

- `aflsolutions/doc0-benchmarks`, private at creation; the public flip IS the launch moment (first report polished, numbers verified).
- Tooling: pnpm + tsx + Vitest 4 + TypeScript strict + ESLint 9 flat config (doc0 conventions; NOT bun). Node LTS. MIT license.
- README written for a skeptical outsider ("how to check our work instead of taking our word"), gbrain-evals register: plain-English metric explanations, the honesty section up front.
- Zero dependency on doc0-commercial (private). Anything requiring doc0's DB or pipeline runs INTERNALLY and ships artifacts into this repo (see Boundary section).

## Layout

```
corpora/
  <repo>-<date>/            # committed doc0-generated wikis: <slug>.md pages
    _meta.json              # generation metadata: model IDs (small/big tier), generation
                            #   SHA (doc0-commercial commit), date, page count, doc mode
    _graph-index.json       # exported GraphIndex (node names + edges w/ confidence) —
                            #   makes chain verification hermetic for any cloner
  peers/
    <peer>-<repo>-<date>.manifest.json   # per-page SHA-256 of the peer wiki AS SCORED
    fetch-peers.ts          # re-downloads peer wikis from their public sites, verifies
                            #   hashes, writes to results/peers/ (gitignored)
scoring/                    # canonical scorer code (ported from the internal SP1 harness)
  chain-claims.ts           # arrow/mermaid/numbered-prose extractors + graph verification
  judge-comparative.ts      # both-orders comparative judging, CellVerdict w/ unreliable
                            #   discriminant honored in bestPeer
  judge-accuracy.ts         # multi-excerpt claimSupport w/ judgeFailures accounting
  judge-model.ts            # judge client: caller-supplied Gemini key (AI Studio or
                            #   Vertex), judge model + seed PINNED per report
  metrics.ts                # deterministic structural metrics (citations/1k, words/section,
                            #   chainsPerPage, hopVerificationRate)
  corpus.ts                 # wiki + peer corpus loaders
  *.test.ts                 # ported unit tests for all of the above
runners/
  grounding-scorecard.ts    # Family 1: full scorecard over corpora/ + fetched peers
  codewikibench.ts          # Family 2: conforms doc0 wikis to the CodeWikiBench
                            #   evaluator input format; invokes their published evaluator
baselines/
  <label>.baseline.json     # versioned deterministic-metric snapshots + thresholds
docs/
  benchmarks/               # published reports (see Report template)
  comparison-systems.md     # living cross-system numbers table w/ metric-comparability notes
results/                    # gitignored transient output
```

## Family 1 — grounding scorecard

Two rerunnability tiers, stated explicitly in every report:
- **Deterministic (anyone, offline, free):** chain extraction + verification against the committed `_graph-index.json`, citation density, structural metrics. CI re-runs these on every PR and asserts byte-stable reproduction against `baselines/` thresholds — the "zero regression" story.
- **Judged (anyone with a Gemini API key):** claimSupport (multi-excerpt, judgeFailures excluded from denominator) and comparative dimensions (both-orders, unreliable cells never fabricate a winner). Judge model + seed pinned in the report; peer pages fetched + hash-verified first.

First report headline: machine-verified claim support — doc0 0.72 vs DeepWiki 0.55 vs zread 0.65 (re-measured fresh at publication with the pinned judge; the internal numbers are the expectation, not the citation).

Corpus policy: public OSS repos only (v1: hono, redis — already generated; more later). Never private/customer repos. Peers scored on the SAME repos, fetched from their public sites.

## Family 2 — CodeWikiBench

- Internal step (doc0-commercial side): generate doc0 wikis for the CodeWikiBench repo suite (21 repos, 7 languages) via prod-pillar creds; export page sets + graph indexes into `corpora/`. Budget expectation ~$50–80 generation; caps/monitoring per the usual dogfooding discipline (usage telemetry on, per-run cost check).
- Public-repo step: `runners/codewikibench.ts` adapts doc0 wiki output to the evaluator's expected input and runs the PUBLISHED CodeWikiBench evaluator (pin its repo SHA; do not reimplement their scoring). Implementation plan must pin: their input format, evaluator invocation, judge/model requirements, and license for including their scaffolding.
- Report publishes doc0's score in their table next to CodeWiki 68.8% / DeepWiki 64.1%, per-repo breakdown INCLUDING weak rows. The known monorepo weakness gets named explicitly with the fix trajectory (honesty posture).

## Internal/public boundary (what ships from doc0-commercial)

Stays internal: generation itself, DB access, the export scripts (`export-corpus.ts`, `export-graph-index.ts` — new, small, live in doc0-commercial `scripts/`), internal dev-loop harness (`scripts/wiki-eval/` remains for day-to-day work).
Ships as artifacts: generated wiki pages, `_meta.json`, `_graph-index.json`, peer manifests.
Copied once with provenance noted in file headers: the scoring modules listed above. The public copy is canonical for published numbers from then on; internal harness may drift for dev purposes without affecting published methodology.

## Report template (every published report)

Adopted from the gbrain-evals discipline — standalone, no internal jargon:
1. Headline: one-sentence verdict + comparison card (SVG) + what-changed paragraph.
2. What is doc0 (3–4 paragraphs for a stranger; link out, don't duplicate the site).
3. What is the benchmark: who built it, what's measured, why this metric, what failure mode it stresses.
4. Configurations tested: every scored config explained — what pipeline feature it exercises, why it matters on this benchmark.
5. Results incl. the bad numbers, with the honesty note pattern.
6. Reproduce-this section: exact commands, what's deterministic vs judge-dependent, expected costs.

## Error handling & testing

- Scoring modules keep their ported unit tests; CI: tsc --noEmit, eslint --max-warnings 0, vitest run, plus the baseline-reproduction gate (deterministic metrics over committed corpora must match `baselines/` within thresholds — exact match expected; thresholds exist for float formatting only).
- Judge runners fail LOUD: judgeFailures counted and reported, unreliable cells flagged and excluded from rankings, never silently averaged (SP1 discipline, already in the ported code).
- fetch-peers verifies SHA-256 per page and hard-fails on mismatch with a clear "peer content changed since scoring — re-score or update manifest" message (peer sites regenerate; a hash mismatch is a finding, not an error to paper over).
- No secrets in the repo, ever: judge keys via env only; `.env.example` documents them.

## Non-goals (v1)

- Family 3 (agent-benchmark via MCP multi-adapter) — separate release; its blockers (4 MCP fixes, runner model constraints) tracked on feat/codegraph-benchmark.
- Retrieval qrels / recall@k benches for doc0 MCP search — natural v2 alongside Family 3.
- npm-packaging the scorer; CI badges/website; automation of the public flip.
- Re-benchmarking model alternatives (SP4 settled the model; this repo measures the product).

## Estimates

Repo skeleton + scoring port + Family-1 runner + baselines + CI: ~1–2 days subagent-driven. Family-2: ~1 day internal generation/export + ~1 day adapter/report (evaluator-dependent). First report writing: ~half day. Generation spend: ~$50–80 (pillar).
