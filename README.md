# doc0-benchmarks

doc0 generates AI-powered, code-graph-grounded wikis from GitHub repositories and serves them with search, chat, and MCP tools. This repo is where we measure whether it's actually good.

Everything here runs on your machine and reproduces from a commit hash. We publish the numbers we are not proud of next to the ones we are.

## How these benchmarks work

Three ingredients, each versioned and inspectable:

1. **Committed corpora** — real repositories (`corpora/`) and peer-tool outputs (`corpora/peers/`) checked into this repo (or fetched deterministically via `pnpm peers:fetch`), so a benchmark run today and a benchmark run in six months start from the same bytes.
2. **Machine-verified answers via the code graph** — scores come from checking generated documentation claims against doc0's own code knowledge graph, not from vibes or an LLM's unverified opinion of itself. Where an LLM judge is used at all (claim support, comparative dimensions), it's clearly labeled and gated behind an API key — the deterministic metrics need none.
3. **Versioned baselines** — every scored run is compared against a committed baseline (`baselines/`) so regressions and improvements show up as a diff, not a vibe check.

## Results

Claim support is judge-scored (0–1, higher is better); `hopVerificationRate` is the deterministic, code-graph-checked share of call-chain claims doc0 machine-verifies end to end — no peer wiki tool exposes an equivalent number. Full breakdown, honesty section, and per-dimension comparisons: [2026-07-12 grounding scorecard](docs/benchmarks/2026-07-12-grounding-scorecard.md).

| Date | Corpus | doc0 claim support | DeepWiki | zread | doc0 hopVerificationRate | Judge | Report |
|------|--------|---------------------|----------|-------|--------------------------|-------|--------|
| 2026-07-12 | redis/redis (37p) | **0.744** (win) | 0.692 | 0.65 | 26.6% | vertex · gemini-3.5-flash · seed 42 · n=40 | [report](docs/benchmarks/2026-07-12-grounding-scorecard.md) |
| 2026-07-12 | honojs/hono (26p) | 0.692 (loss vs DeepWiki) | **0.872** | 0.667 | 29.3% | vertex · gemini-3.5-flash · seed 42 · n=40 | [report](docs/benchmarks/2026-07-12-grounding-scorecard.md) |

See [`docs/comparison-systems.md`](docs/comparison-systems.md) for the living cross-system table (comparative dimensions, external CodeWikiBench rows).

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
