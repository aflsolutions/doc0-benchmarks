# doc0-benchmarks

doc0 generates AI-powered, code-graph-grounded wikis from GitHub repositories and serves them with search, chat, and MCP tools. This repo is where we measure whether it's actually good.

Everything here runs on your machine and reproduces from a commit hash. We publish the numbers we are not proud of next to the ones we are.

## How these benchmarks work

Three ingredients, each versioned and inspectable:

1. **Committed corpora** — real repositories (`corpora/`) and peer-tool outputs (`corpora/peers/`) checked into this repo (or fetched deterministically via `pnpm peers:fetch`), so a benchmark run today and a benchmark run in six months start from the same bytes.
2. **Machine-verified answers via the code graph** — scores come from checking generated documentation claims against doc0's own code knowledge graph, not from vibes or an LLM's unverified opinion of itself. Where an LLM judge is used at all (claim support, comparative dimensions), it's clearly labeled and gated behind an API key — the deterministic metrics need none.
3. **Versioned baselines** — every scored run is compared against a committed baseline (`baselines/`) so regressions and improvements show up as a diff, not a vibe check.

## Results

**Latest (2026-07-29): ten never-tuned repositories, three systems, one judge.** Full population (~20,000 claim groups, 0 judge failures), fairness protocol and honesty section in the [Wave-1 three-way matrix report](docs/benchmarks/2026-07-29-wave1-three-way-matrix.md).

| Never-tuned mean (10 repos, 8 languages) | doc0 | DeepWiki | CodeWiki (Google) |
|---|---|---|---|
| Claim support | **0.856** (0.796–0.904) | 0.588 (0.378–0.776) | 0.430 (0.326–0.591) |

doc0 wins every per-repo head-to-head; its worst never-tuned repo outscores both peers' best. Three of the ten repos were a sealed holdout (selected in advance, generated last, no pipeline changes mid-wave) — the holdout mean (0.886) came in *above* the main wave (0.843).

Claim support is judge-scored (0–1, higher is better). doc0 also reports `hopVerificationRate` — the deterministic, code-graph-checked share of call-chain claims machine-verified end to end; no peer wiki tool exposes an equivalent number. Earlier snapshots (the n=40 sampled protocol, superseded by full-population judging) live in [`docs/benchmarks/`](docs/benchmarks/); see [`docs/comparison-systems.md`](docs/comparison-systems.md) for the living cross-system table.

## Reproduce

Deterministic tier — free, no API key, fully offline:

```bash
pnpm install
pnpm bench:grounding                        # both corpora
pnpm bench:grounding --corpus hono-2026-07  # one corpus
```

Judged tier — needs your own Gemini key (Google AI Studio or Vertex), costs a small real amount, and is **not** run in CI:

```bash
cp .env.example .env.local   # fill in GOOGLE_GENERATIVE_AI_API_KEY, or all three GOOGLE_VERTEX_* vars
pnpm peers:fetch              # hash-verify DeepWiki/zread pages; --allow-drift to proceed past a mismatch
pnpm bench:grounding --judged --samples 40 --seed 42
```

Which judge model you get depends on which credentials are set, not a flag — AI Studio (`gemini-2.5-flash`) and Vertex (`gemini-3.5-flash`) are **not directly comparable**; see the reproduce section of the report above for the exact rule and a rough cost estimate.

See `docs/DESIGN.md` for the full scoring design and `docs/PLAN.md` for the implementation plan.
