# doc0-benchmarks

doc0 generates AI-powered, code-graph-grounded wikis from GitHub repositories and serves them with search, chat, and MCP tools. This repo is where we measure whether it's actually good.

Everything here runs on your machine and reproduces from a commit hash. We publish the numbers we are not proud of next to the ones we are.

## How these benchmarks work

Three ingredients, each versioned and inspectable:

1. **Committed corpora** — real repositories (`corpora/`) and peer-tool outputs (`corpora/peers/`) checked into this repo (or fetched deterministically via `pnpm peers:fetch`), so a benchmark run today and a benchmark run in six months start from the same bytes.
2. **Machine-verified answers via the code graph** — scores come from checking generated documentation claims against doc0's own code knowledge graph, not from vibes or an LLM's unverified opinion of itself. Where an LLM judge is used at all (claim support, comparative dimensions), it's clearly labeled and gated behind an API key — the deterministic metrics need none.
3. **Versioned baselines** — every scored run is compared against a committed baseline (`baselines/`) so regressions and improvements show up as a diff, not a vibe check.

## Results

| Date | Corpus | Metric | Score | Baseline | Delta |
|------|--------|--------|-------|----------|-------|
| — | — | — | — | — | first report pending |

## Reproduce

```bash
pnpm install
pnpm bench:grounding
```

See `docs/DESIGN.md` for the full scoring design and `docs/PLAN.md` for the implementation plan.
