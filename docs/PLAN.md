# doc0-benchmarks v1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stand up the private `aflsolutions/doc0-benchmarks` repo with the ported scoring harness, committed corpora + graph indexes, the Family-1 grounding scorecard (runner + baselines + CI), the first published report, and the CodeWikiBench pinning research that feeds the Family-2 follow-on plan.

**Architecture:** A standalone public-ready TypeScript repo (no dependency on private doc0-commercial). Scoring modules are ported copies (canonical from now on); doc0-commercial ships artifacts (wiki pages, graph-index JSON, peer hash manifests) via two small internal export scripts. Deterministic metrics rerun hermetically in CI against versioned baselines; judge metrics rerun by anyone with a Gemini key.

**Tech Stack:** Node LTS, pnpm, tsx, TypeScript strict, Vitest 4, ESLint 9 flat config, `ai` (AI SDK v6) + `@ai-sdk/google` (+ optional `@ai-sdk/google-vertex`), zod.

## Global Constraints

- Repo: `aflsolutions/doc0-benchmarks`, PRIVATE at creation. Local checkout: `~/Projects/doc0-benchmarks`. MIT license.
- Zero imports from doc0-commercial; no `@/` path aliases in the new repo — relative imports only.
- No secrets ever committed; judge keys via env (`GOOGLE_GENERATIVE_AI_API_KEY`, optional `GOOGLE_VERTEX_PROJECT`/`GOOGLE_VERTEX_CLIENT_EMAIL`/`GOOGLE_VERTEX_PRIVATE_KEY`); `.env.example` documents them.
- Corpus policy: public OSS repos only (v1: hono, redis). Peer content is NEVER committed — per-page SHA-256 manifests + fetch script only.
- Scoring semantics must match the internal SP1 harness exactly at port time (same extractors, both-orders judging, unreliable-guarded bestPeer, multi-excerpt claimSupport with judgeFailures excluded). Ported tests prove it.
- Zero tolerance in the new repo: `pnpm tsc --noEmit`, `pnpm eslint . --max-warnings 0`, `pnpm vitest run` all green after every task. No `any`, no non-null `!`, no eslint-disable.
- Internal-side work (Task 4) happens in doc0-commercial on branch `feat/benchmarks-export` off `origin/main`; LOCAL commits only (no push without user instruction).
- Port source of truth: doc0-commercial branch `origin/feat/fable-improvements` (contains the review-hardened harness). Record the exact SHA in every ported file's provenance header.

---

### Task 1: Repo creation + skeleton

**Files (all in `~/Projects/doc0-benchmarks`):**
- Create: `package.json`, `tsconfig.json`, `eslint.config.mjs`, `vitest.config.ts`, `.gitignore`, `.env.example`, `LICENSE` (MIT), `README.md`, `.github/workflows/ci.yml`, `docs/` (spec + this plan carried in), `corpora/.gitkeep`, `corpora/peers/.gitkeep`, `scoring/.gitkeep`, `runners/.gitkeep`, `baselines/.gitkeep`, `docs/benchmarks/.gitkeep`, `results/.gitkeep`

**Interfaces:**
- Produces: a cloneable repo where `pnpm install && pnpm test` passes (empty suite OK via `passWithNoTests`), CI runs the three gates on PRs. Later tasks rely on `pnpm tsx <file>` execution and the `scoring/`, `runners/`, `corpora/`, `baselines/` directories.

- [ ] **Step 1: Create the repo and local checkout**

```bash
gh repo create aflsolutions/doc0-benchmarks --private --description "Public benchmarks for doc0 — reproducible corpora, machine-verified grounding scores, honest numbers." 
git clone git@github.com:aflsolutions/doc0-benchmarks.git ~/Projects/doc0-benchmarks
cd ~/Projects/doc0-benchmarks
```

- [ ] **Step 2: Write the skeleton files**

`package.json`:
```json
{
  "name": "doc0-benchmarks",
  "version": "0.1.0",
  "private": true,
  "license": "MIT",
  "type": "module",
  "scripts": {
    "test": "vitest run --passWithNoTests",
    "lint": "eslint . --max-warnings 0",
    "typecheck": "tsc --noEmit",
    "bench:grounding": "tsx runners/grounding-scorecard.ts",
    "peers:fetch": "tsx corpora/peers/fetch-peers.ts"
  },
  "devDependencies": {
    "@types/node": "^20.19.0",
    "eslint": "^9.0.0",
    "typescript": "^5.6.0",
    "typescript-eslint": "^8.0.0",
    "tsx": "^4.20.0",
    "vitest": "^4.0.0"
  },
  "dependencies": {
    "ai": "^6.0.0",
    "@ai-sdk/google": "^3.0.0",
    "@ai-sdk/google-vertex": "^4.0.0",
    "zod": "^3.25.0"
  }
}
```

`tsconfig.json`:
```json
{
  "compilerOptions": {
    "target": "ES2023",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "skipLibCheck": true,
    "noEmit": true,
    "allowImportingTsExtensions": true
  },
  "include": ["scoring", "runners", "corpora", "test"]
}
```

`eslint.config.mjs`:
```js
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["results/", "node_modules/"] },
  ...tseslint.configs.recommended,
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-non-null-assertion": "error",
    },
  },
);
```

`vitest.config.ts`:
```ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: { include: ["scoring/**/*.test.ts", "runners/**/*.test.ts", "test/**/*.test.ts"] },
});
```

`.gitignore`:
```
node_modules/
results/*
!results/.gitkeep
.env
.env.local
```

`.env.example`:
```
# Judge LLM — required only for judged metrics (claimSupport, comparative dims).
# Deterministic metrics need NO key.
GOOGLE_GENERATIVE_AI_API_KEY=
# Optional: run the judge on Vertex instead of AI Studio
GOOGLE_VERTEX_PROJECT=
GOOGLE_VERTEX_CLIENT_EMAIL=
GOOGLE_VERTEX_PRIVATE_KEY=
```

`.github/workflows/ci.yml`:
```yaml
name: ci
on:
  pull_request:
  push:
    branches: [main]
jobs:
  gates:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with: { version: 10 }
      - uses: actions/setup-node@v4
        with: { node-version: 22, cache: pnpm }
      - run: pnpm install --frozen-lockfile
      - run: pnpm typecheck
      - run: pnpm lint
      - run: pnpm test
```

`README.md` — write the outsider-facing skeleton now (filled further in Task 6): title, one-paragraph "what this repo is" in the gbrain-evals register ("Everything here runs on your machine and reproduces from a commit hash. We publish the numbers we are not proud of next to the ones we are."), a "How these benchmarks work" section explaining the three ingredients (committed corpora, machine-verified answers via the code graph, versioned baselines), a "Results" table stub with a "first report pending" row, and a "Reproduce" section pointing at `pnpm bench:grounding`.

`LICENSE`: standard MIT text, copyright 2026 AFL Solutions SRL.

- [ ] **Step 3: Carry the spec + plan in**

```bash
mkdir -p docs
cp <scratchpad>/benchmarks-docs/2026-07-12-doc0-benchmarks-design.md docs/DESIGN.md
cp <worktree>/docs/superpowers/plans/2026-07-12-doc0-benchmarks.md docs/PLAN.md
```
(The controller provides both absolute source paths in the dispatch.)

- [ ] **Step 4: Install + gates**

Run: `pnpm install && pnpm typecheck && pnpm lint && pnpm test`
Expected: all pass (test passes with no tests).

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "chore: repo skeleton — pnpm/tsx/vitest/eslint gates, CI, design docs"
git push -u origin main
```
(Push IS authorized for this new private repo — it's the repo's own mainline, not a doc0-commercial branch.)

---

### Task 2: Port the deterministic scoring core

**Files:**
- Create: `scoring/chain-claims.ts`, `scoring/chain-claims.test.ts`, `scoring/metrics.ts`, `scoring/metrics.test.ts` (if an internal test exists; else write the two tests below), `scoring/corpus.ts`, `scoring/corpus.test.ts`, `scoring/graph-index.ts`

**Interfaces:**
- Consumes: nothing (leaf modules).
- Produces (used by Tasks 3/5): `extractChainClaims(markdown)`, `verifyChainClaims(claims, index)`, `summarizeChainMetrics(perPage)`, `buildGraphIndex(nodeNames, edges)` and `GraphIndex` type from `scoring/chain-claims.ts`; `computeStructuralMetrics(pages)` from `scoring/metrics.ts`; `loadWikiDir(dir): Promise<WikiPage[]>` and `WikiPage` type from `scoring/corpus.ts`; `loadGraphIndexFile(path): Promise<GraphIndex>` from `scoring/graph-index.ts`.

- [ ] **Step 1: Port chain-claims + tests verbatim**

Source of truth (record its SHA): doc0-commercial `origin/feat/fable-improvements` — `src/lib/chain-claims.ts` and `src/lib/chain-claims.test.ts`. Copy both; changes allowed ONLY: (a) add a provenance header comment (`// Ported from doc0 (commit <sha>) — canonical scoring copy for published benchmarks.`), (b) rewrite the test's import to `./chain-claims.ts`. The module is a pure leaf — if any other import exists, STOP and report (that's drift from the expected shape, not something to patch silently).

- [ ] **Step 2: Port metrics + corpus (dir-loading only)**

- `scripts/wiki-eval/metrics.ts` → `scoring/metrics.ts` verbatim + provenance header.
- `scripts/wiki-eval/corpus.ts` → `scoring/corpus.ts`: keep `WikiPage`, `ReferenceWiki`, `loadReferenceWiki`, and rename `loadOurWikiFromDir` → `loadWikiDir`. DELETE `loadOurWikiFromDb`, `loadReferenceCorpus`'s DB branches, `DEFAULT_REFERENCE_ROOT`, and every doc0-internal import (`@/lib/supabase/*`, db-helpers). The ported file must import only `node:fs`/`node:path`.

- [ ] **Step 3: Write `scoring/graph-index.ts` (new, file-based)**

```ts
import { readFile } from "node:fs/promises";
import { buildGraphIndex, type GraphIndex } from "./chain-claims.ts";

/** Schema of corpora/<corpus>/_graph-index.json (written by doc0's internal
 * export script): node names + calls-edges with confidence. */
export interface GraphIndexFile {
  schema_version: 1;
  wiki_id: string;
  node_names: string[];
  edges: Array<{ from: string; to: string; confidence: number | null }>;
}

export async function loadGraphIndexFile(path: string): Promise<GraphIndex> {
  const raw = JSON.parse(await readFile(path, "utf-8")) as GraphIndexFile;
  if (raw.schema_version !== 1) {
    throw new Error(`unsupported graph-index schema_version: ${String(raw.schema_version)}`);
  }
  return buildGraphIndex(raw.node_names, raw.edges);
}
```

- [ ] **Step 4: Tests**

Run the ported `chain-claims.test.ts` (should pass unchanged). Add `scoring/corpus.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { loadWikiDir } from "./corpus.ts";

describe("loadWikiDir", () => {
  it("loads .md pages with slug + content, ignoring dotfiles", async () => {
    const dir = await mkdtemp(join(tmpdir(), "corpus-"));
    await writeFile(join(dir, "overview.md"), "# Overview\nbody");
    await writeFile(join(dir, ".bakeoff-model"), "x");
    const pages = await loadWikiDir(dir);
    expect(pages.map((p) => p.slug)).toEqual(["overview"]);
    expect(pages[0]?.content).toContain("body");
  });
});
```
And `scoring/graph-index.test.ts`: write a temp `_graph-index.json` with one node pair + edge, assert `loadGraphIndexFile` → `verifyChainClaims` resolves a matching hop, and that a wrong `schema_version` throws.

- [ ] **Step 5: Gates + commit**

```bash
pnpm typecheck && pnpm lint && pnpm test
git add -A && git commit -m "feat(scoring): port deterministic core — chain claims, metrics, corpus, graph-index loader"
git push
```

---

### Task 3: Port the judge modules (self-contained client)

**Files:**
- Create: `scoring/judge-model.ts`, `scoring/judge-comparative.ts`, `scoring/judge-comparative.test.ts`, `scoring/judge-accuracy.ts`, `scoring/judge-accuracy.test.ts`

**Interfaces:**
- Consumes: `WikiPage` from `scoring/corpus.ts`, chain types from `scoring/chain-claims.ts`.
- Produces (Task 5/6): `judgeComparative(...)`, `DIMENSIONS`, `liveJudge` from judge-comparative; `judgeAccuracy(pages, repoDir, judge, sampleN, seed)`, `liveAccuracyJudge` from judge-accuracy; `judgeModel(): LanguageModel` from judge-model.

- [ ] **Step 1: Port judge-model with a self-contained client**

Source `scripts/wiki-eval/judge-model.ts` imports doc0's `vertexChat` — replace with a local construction: default `google("<judge model id — copy the exact id the internal file pins>")` using `GOOGLE_GENERATIVE_AI_API_KEY`; if the three `GOOGLE_VERTEX_*` env vars are set, construct `createVertex({ project, googleAuthOptions: { credentials: { client_email, private_key: key.replace(/\\n/g, "\n") } }, location: "global" })` and use it instead. Keep the exported function name and judge-model id EXACTLY as internal (methodology parity). Document in the file header: published runs state which backend + model + seed was used.

- [ ] **Step 2: Port judge-comparative + judge-accuracy + tests**

Copy from `scripts/wiki-eval/judge-comparative.ts` / `judge-accuracy.ts` (+ their `.test.ts`) with only: provenance headers, relative-import rewrites (`./judge-model.ts`, `./corpus.ts`, `./chain-claims.ts`), and removal of any doc0-internal import. The both-orders logic, `aggregateCell`, unreliable-guarded `bestPeer`, `groupClaimCitations`, `resolveExcerpts`, `seededShuffle`, and the failure accounting must be byte-equivalent — the ported tests (which cover all of these, including the mixed-reliability bestPeer cases) are the proof.

- [ ] **Step 3: Gates + commit**

```bash
pnpm typecheck && pnpm lint && pnpm test
git add -A && git commit -m "feat(scoring): port judge harness — both-orders comparative + multi-excerpt accuracy, self-contained Gemini client"
git push
```

---

### Task 4: Internal export scripts + corpus artifacts (doc0-commercial side)

**Files (in doc0-commercial, branch `feat/benchmarks-export` off `origin/main`):**
- Create: `scripts/export-benchmark-corpus.ts`, `scripts/export-graph-index.ts`
- Artifacts (written INTO `~/Projects/doc0-benchmarks`): `corpora/hono-2026-07/` and `corpora/redis-2026-07/` (pages + `_meta.json` + `_graph-index.json`), `corpora/peers/deepwiki-hono.manifest.json`, `corpora/peers/deepwiki-redis.manifest.json`, `corpora/peers/zread-hono.manifest.json`, `corpora/peers/zread-redis.manifest.json`, `corpora/peers/fetch-peers.ts`

**Interfaces:**
- Consumes (internal): existing committed baselines `eval/wiki-scorecard/baselines/hono-e1a-2026-07-02` and `redis-e1a2-2026-07-02` (current-code corpora), `eval/wiki-scorecard/reference/` peer corpora, `scripts/wiki-eval/graph-index.ts`'s `loadGraphIndex(wikiId)` (DB), local Supabase (port 54801) holding wikis hono `8268c9be…` / redis `fe0408fc…` — the implementer verifies both wiki ids resolve before exporting and STOPS if the DB rows are gone (re-generation is a controller decision, not an implementer improvisation).
- Produces: the corpora artifacts with this exact `_meta.json` shape (consumed by Task 5's runner):
```json
{
  "schema_version": 1,
  "repo": "redis/redis",
  "generated_at": "2026-07-02",
  "doc0_commit": "<generation-time SHA from the ledger>",
  "source_repo_sha": "<commit of the OSS repo the wiki was generated from — required: claimSupport resolves citations against this exact tree. Read from the original clone (git -C /tmp/doc0-local-gen/<repo>/source rev-parse HEAD); if the clone is gone, the generation row / session ledger records it — verify, don't guess>",
  "models": { "small": "gemini-3.1-flash-lite", "big": "gemini-3.5-flash" },
  "doc_mode": "technical",
  "page_count": 37,
  "source_baseline": "eval/wiki-scorecard/baselines/redis-e1a2-2026-07-02"
}
```
and the peer manifest shape (consumed by fetch-peers):
```json
{
  "schema_version": 1,
  "peer": "deepwiki",
  "repo": "redis/redis",
  "base_url": "https://deepwiki.com/redis/redis",
  "scored_at": "2026-07-02",
  "pages": [{ "slug": "overview", "url": "<page url>", "sha256": "<hex of scored content>" }]
}
```

- [ ] **Step 1: Branch + export-benchmark-corpus.ts**

In doc0-commercial: `git checkout -b feat/benchmarks-export origin/main`. Write `scripts/export-benchmark-corpus.ts` (tsx, loads `.env.local` like sibling scripts): args `--baseline <dir> --repo <owner/name> --doc0-commit <sha> --out <corpusDir>`; copies `*.md` pages from the baseline dir (skip dotfiles/usage jsonl), writes `_meta.json` per the shape above (page_count computed, models hardcoded to the current tier pair, generated_at from the baseline dir's date suffix).

- [ ] **Step 2: export-graph-index.ts**

Args `--wiki-id <uuid> --out <file>`; calls the existing internal `loadGraphIndex`-style queries BUT emits the RAW inputs (`node_names`, `edges[{from,to,confidence}]`) as `GraphIndexFile` schema_version 1 JSON — NOT the built Map/Set (the public repo rebuilds via its own `buildGraphIndex`, keeping one canonical constructor). Reuse the two queries from `scripts/wiki-eval/graph-index.ts` verbatim.

- [ ] **Step 3: Peer manifests + fetch-peers.ts**

Write a small internal one-off (`scripts/export-peer-manifests.ts`, same branch) that walks `eval/wiki-scorecard/reference/<peer>-<repo>/` dirs, SHA-256s each page file, and writes the manifest JSONs directly into `~/Projects/doc0-benchmarks/corpora/peers/`. `base_url`/per-page `url` fields: derive from the peer's public URL scheme for that repo (deepwiki.com/<owner>/<repo>/<slug>, zread's equivalent — copy the exact URL patterns from how the reference corpora were originally fetched; they are recorded in `eval/wiki-scorecard/reference/README.md` — if absent, reconstruct from the peer sites and note it in the manifest `_description`).
Then write `corpora/peers/fetch-peers.ts` IN the benchmarks repo: reads every `*.manifest.json`, fetches each page URL, SHA-256s the fetched content, writes to `results/peers/<peer>-<repo>/<slug>.md`; on ANY hash mismatch exits non-zero listing mismatched slugs with the message "peer content changed since scoring — re-score or update the manifest". Include `--allow-drift` flag that downloads anyway but writes a `DRIFT.json` report (needed because peer sites regenerate; scoring fresh content is legitimate, silently pretending it's the scored content is not).

- [ ] **Step 4: Run the exports**

Run all exports for hono + redis (4 corpus dirs worth of artifacts + 4 manifests). Verify in the benchmarks repo: `pnpm tsx -e` snippet loading each `_graph-index.json` via `loadGraphIndexFile` succeeds; page counts match `_meta.json`.

- [ ] **Step 5: Commit both sides**

doc0-commercial (LOCAL only, no push): `git add scripts/export-benchmark-corpus.ts scripts/export-graph-index.ts scripts/export-peer-manifests.ts && git commit -m "feat(benchmarks): corpus + graph-index + peer-manifest export scripts"`.
doc0-benchmarks: `git add corpora && git commit -m "feat(corpora): hono + redis corpora with graph indexes and peer manifests" && git push`.

---

### Task 5: Family-1 runner + baselines + CI reproduction gate

**Files (doc0-benchmarks):**
- Create: `runners/grounding-scorecard.ts`, `baselines/v0.1-launch.baseline.json`, `test/baseline-reproduction.test.ts`

**Interfaces:**
- Consumes: everything from Tasks 2–4.
- Produces: `pnpm bench:grounding [--corpus <name>] [--judged] [--samples N] [--seed N]` writing `results/grounding-<corpus>-<date>.json` + a markdown summary; the versioned baseline file; a CI test asserting deterministic reproduction.

- [ ] **Step 1: Runner (deterministic tier)**

`runners/grounding-scorecard.ts`: for each corpus dir under `corpora/` (or `--corpus` filter): load pages (`loadWikiDir`), load `_graph-index.json`, compute per-corpus: `computeStructuralMetrics`, chain metrics via `extractChainClaims`+`verifyChainClaims`+`summarizeChainMetrics`. Emit `{schema_version:1, corpus, meta, deterministic:{...}}` JSON to `results/` and print a table. NO network, NO env keys needed for this tier.

- [ ] **Step 2: Runner (judged tier, `--judged`)**

When `--judged`: require peers fetched (`results/peers/` present for the corpus's manifests — else exit with "run pnpm peers:fetch first") AND source repos present — the runner ensures `results/sources/<corpus>/` exists by shallow-cloning the corpus's `repo` at `_meta.json.source_repo_sha` (`git clone --depth 1 https://github.com/<repo> … && git fetch --depth 1 origin <sha> && git checkout <sha>`; exit with a clear message if the SHA is unreachable). `judgeAccuracy` resolves citations against that tree. Then run `judgeAccuracy` on ours + each peer (same sampleN/seed), and `judgeComparative` ours-vs-each-peer; append `{judged:{claimSupport:{ours,peers…}, comparative:{…}, judge:{model,backend,seed,samples}}}` to the output JSON. Fail loud per SP1 semantics (judgeFailures surfaced, unreliable cells marked).

- [ ] **Step 3: Baseline + reproduction test**

Run the deterministic tier for both corpora; copy the deterministic blocks into `baselines/v0.1-launch.baseline.json` (`{schema_version:1, label:"v0.1-launch", corpora:{"hono-2026-07":{…},"redis-2026-07":{…}}}`). Write `test/baseline-reproduction.test.ts`: for each corpus in the baseline, recompute the deterministic metrics in-process (same calls as the runner — export the runner's compute function for this) and `expect(recomputed).toEqual(baseline)` EXACTLY (no thresholds; identical inputs + pure functions ⇒ identical outputs; a diff means scoring-code drift, which is precisely what the gate must catch — update the baseline deliberately with a `Why:` commit line when scoring changes).

- [ ] **Step 4: Gates + commit**

```bash
pnpm typecheck && pnpm lint && pnpm test   # now includes the reproduction gate
git add -A && git commit -m "feat(family-1): grounding scorecard runner, v0.1 baseline, CI reproduction gate"
git push
```

---

### Task 6: First published report (judged rerun + write-up)

**Files (doc0-benchmarks):**
- Create: `docs/benchmarks/2026-07-grounding-scorecard.md`, `docs/comparison-systems.md`; Modify: `README.md` (results table row + reproduce section)

**Interfaces:**
- Consumes: Task 5's runner; judge env keys (controller provides — prod-pillar Vertex trio or AI Studio key).

- [ ] **Step 1: Fresh judged run (this is the publication run — CONTROLLER-owned, costs judge $)**

```bash
pnpm peers:fetch                       # hash-verify or --allow-drift + note
pnpm bench:grounding --judged --samples 40 --seed 42
```
Expectation (not requirement): claimSupport ours ≈ 0.72 vs deepwiki ≈ 0.55 / zread ≈ 0.65 on redis. Whatever the fresh numbers are, THEY get published — if they diverge materially from expectations, investigate before publishing, don't massage.

- [ ] **Step 2: Write the report** per the spec's template — all six sections (headline + comparison card [SVG or a clean markdown table for v1 — SVG optional], what-is-doc0, what-is-the-benchmark incl. why machine-verified grounding beats judge-only metrics, configurations tested, results INCLUDING weak numbers [name the monorepo weakness + trajectory explicitly], reproduce-this with exact commands + which tier needs a key + judge model/backend/seed/samples/cost). Standalone: no doc0-internal jargon unglossed.

- [ ] **Step 3: comparison-systems.md** — living table: DeepWiki + zread rows (our measured numbers, with the metric-comparability warning that these are OUR harness's scores of their public output, not their self-reported numbers), CodeWikiBench published rows (CodeWiki-Sonnet-4 68.8%, DeepWiki 64.1%) marked "external, not yet run by us".

- [ ] **Step 4: README results table + commit**

```bash
git add -A && git commit -m "docs: first grounding scorecard report + comparison systems"
git push
```

---

### Task 7: CodeWikiBench pinning research (feeds the Family-2 follow-on plan)

**Files (doc0-benchmarks):**
- Create: `docs/codewikibench-pinned.md`

**Interfaces:**
- Produces: the pinned facts the Family-2 plan is generated from. Research-only — no code.

- [ ] **Step 1: Pin the evaluator.** Locate the CodeWikiBench repo (via fsoft-ai4code.github.io/CodeWiki / the ACL Findings 2026 paper). Record with links + SHAs: (a) evaluator repo + exact commit SHA to pin; (b) the input format a system-under-test must produce (file layout, page/JSON shape); (c) evaluator invocation (command, env, judge model it requires, cost expectations); (d) the 21-repo suite list with sizes (flags: which are monorepo-scale — doc0's known weak spot); (e) license terms for using their evaluator + citing their numbers; (f) the published baseline table (CodeWiki 68.8%, DeepWiki 64.1%, any others). If the evaluator is NOT publicly runnable, document that + the fallback (implement their metric per the paper, clearly labeled "our implementation of their metric").

- [ ] **Step 2: Sanity-estimate Family-2 cost** from (d): generation cost per repo at doc0's measured $/page × suite size; judge cost from (c). Write both into the doc.

- [ ] **Step 3: Commit**

```bash
git add docs/codewikibench-pinned.md && git commit -m "docs: CodeWikiBench evaluator pinned — input format, invocation, suite, licensing" && git push
```

---

## Verification (whole-plan)

1. Fresh-clone test: `git clone … && pnpm install && pnpm test` green with NO env keys (deterministic tier fully hermetic).
2. `pnpm bench:grounding` (no flags) runs offline and reproduces `baselines/v0.1-launch.baseline.json` byte-for-byte.
3. `pnpm peers:fetch` verifies hashes or fails loud; `--allow-drift` writes DRIFT.json.
4. No file in the repo imports from doc0-commercial; grep for `@/` yields nothing.
5. The report stands alone (read it as a stranger); the weak numbers are in it.
6. doc0-commercial side: `feat/benchmarks-export` has the three export scripts committed LOCALLY, not pushed.
