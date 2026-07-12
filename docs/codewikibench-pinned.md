# CodeWikiBench — pinned facts for Family-2

Research date: 2026-07-12. This file is the input to the Family-2 implementation plan (`docs/PLAN.md` Task 7). Every claim below is sourced; nothing is guessed. Where the evaluator's own tooling is broken or silent on a question, that is called out explicitly rather than papered over.

**Paper**: Hoang, Le-Anh, Le, Bui. *"CodeWiki: Evaluating AI's Ability to Generate Holistic Documentation for Large-Scale Codebases."* Findings of ACL 2026, pp. 5812–5827. [aclanthology.org/2026.findings-acl.288](https://aclanthology.org/2026.findings-acl.288/) · [arXiv:2510.24428](https://arxiv.org/abs/2510.24428) (preprint, v6). Project page: [fsoft-ai4code.github.io/CodeWiki](https://fsoft-ai4code.github.io/CodeWiki/).

---

## (a) Evaluator repo + pinned commit

- **Repo**: [github.com/FSoft-AI4Code/CodeWikiBench](https://github.com/FSoft-AI4Code/CodeWikiBench) ("Comprehensive Benchmarking System for CodeWiki"). Python (84.3%) + Shell (12.7%) + TeX (3.0%). 11 stars, single contributor (`anhnh2002`), 3 commits total.
- **Pin this commit**: `5e728fb40492effb54d59041f908dbf9079fe238` (`main`, "update readme to include bench dataset link", pushed 2025-11-23). This is the tip of `main` and the entire history (`d329ad9` first commit → `e652337` adjust examples → `5e728fb` HEAD) — there is no released tag/version to pin instead.
- **Verified runnable**: cloned to a scratch dir and inspected directly (not taking the README's word for it). It is real, structured Python — `src/judge/judge.py`, `src/docs_parser/*.py`, `src/rubrics_generator/*.py`, `src/tools/docs_navigator.py`, plus a worked example (`examples/OpenHands/`) with real input/output JSON at every pipeline stage. `requirements.txt` pins 106 packages (pydantic-ai, anthropic, openai, google-genai, groq, cohere, mistralai, boto3, mcp, temporalio, logfire, …). The clone was deleted after inspection per instructions.
- **Companion generator repo** (not what we pin, but the thing whose output shape you're matching): [github.com/FSoft-AI4Code/CodeWiki](https://github.com/FSoft-AI4Code/CodeWiki).

## (b) Input format a system-under-test must produce

The evaluator does **not** consume raw markdown directly — it consumes two derived JSON artifacts per system, built by `src/docs_parser/parse_generated_docs.py`. That parser is what doc0's Family-2 adapter (`runners/codewikibench.ts`) must feed.

**Step 1 — produce a flat folder of `.md` files**, one per doc page, using one of two conventions the parser understands (`process_markdown_file` in `parse_generated_docs.py`):

1. **Indexed filename/first-line convention** (no `module_tree.json`): the file's first line must be `<index> - <title>` (e.g. a file whose first line is `1.2 - Core Agent System`), where `<index>` is a dot-separated path like `1.2` giving its position in the hierarchy. No index prefix (no `-`) → the file is silently skipped.
2. **`module_tree.json` convention** (what CodeWiki itself emits): drop a `module_tree.json` in the same folder describing the hierarchy by title; each `.md` file's *filename* (minus `.md`) must exactly match a title key in that tree. This is the convention doc0 should use, since doc0's own page/section hierarchy already exists — just serialize it as `module_tree.json` (arbitrary nesting depth via a `children` key per node) rather than reverse-engineering the index-prefix convention.
3. Each file's markdown body is parsed with `markdown_to_json.jsonify(...)`, matched to its own H1 (case-insensitively) to strip the redundant title wrapper, and any `"On this page"` TOC key is dropped.

**Step 2 — run the parser**, producing two files per doc-set:

```bash
python docs_parser/parse_generated_docs.py --input-dir <folder_of_md_files> --output-dir <out_dir>
# writes <out_dir>/docs_tree.json        (structure-only skeleton, leaf strings replaced by "<detail_content>")
# writes <out_dir>/structured_docs.json  (full nested content, same shape, real markdown-derived text/dicts/lists)
```

Concrete example, from the shipped `examples/OpenHands/codewiki/` fixture — `docs_tree.json` (skeleton; every leaf string is elided):

```json
{
  "title": "docs",
  "description": "Documentation for docs",
  "subpages": [
    {
      "title": "overview",
      "path": "[\"subpages\", 0]",
      "content": {
        "OpenHands Repository Overview": {
          "Purpose": "<detail_content>",
          "End-to-End Architecture": { "System Data Flow": "<detail_content>" },
          "Core Module Documentation": { "Frontend Modules": "<detail_content>", "...": "..." },
          "Key Features": "<detail_content>",
          "Getting Started": "<detail_content>"
        }
      }
    }
  ]
}
```

and the matching `structured_docs.json` (real content at the same paths, e.g. `subpages[0].content["OpenHands Repository Overview"]["Purpose"]` holds the actual paragraph text; nested lists hold `"**[Frontend Core](frontend_core.md)** - ..."`-style linked bullets; embedded mermaid fences are preserved verbatim as string values).

**No separate "manifest" beyond `module_tree.json`.** The pydantic `DocPage` model (`title`, `description`, `content: dict`, `metadata: dict`, `subpages: list[DocPage]`) is the entire schema; `structured_docs.json` is just that model dumped to JSON, and `docs_tree.json` is the same tree with all leaf values replaced by depth-limited placeholders. Both files must exist side by side — `AgentDeps.__init__` (`src/tools/docs_navigator.py`) raises `FileNotFoundError` if either is missing.

## (c) Evaluator invocation

**Directory convention (not obvious from the README, verified by reading `config.py` / `run_evaluation_pipeline.sh`):** all commands run from `src/`, against a `data/<repo_name>/` working tree that is **not part of the repo** — it's `.gitignore`d (`data/` is in `.gitignore`) and you create it yourself:

```
data/<repo_name>/
├── rubrics/combined_rubrics.json      # ground-truth criteria, generated once from OFFICIAL docs — reused across every system evaluated on that repo
└── <reference>/                       # one folder per system-under-test, e.g. "deepwiki", "codewiki", "doc0"
    ├── docs_tree.json
    ├── structured_docs.json
    └── evaluation_results/<model>.json  # written by judge.py
```

`--reference <name>` is **not** "ground-truth reference docs" despite the flag's help text — it's the folder name holding the *system being scored* (confirmed by reading `judge/judge.py::run()`: `docs_path = data/<repo>/<reference>/`). The rubrics (the actual ground truth, derived once from the repo's official docs) live in a sibling `rubrics/` folder and are reused unchanged for every system you evaluate on that repo — this is exactly what makes an apples-to-apples doc0 vs. CodeWiki vs. DeepWiki comparison possible: reuse their published rubrics, don't regenerate.

**Exact commands** (from `src/`, after placing doc0's `docs_tree.json`/`structured_docs.json` under `data/<repo>/doc0/` and the repo's existing `combined_rubrics.json` under `data/<repo>/rubrics/`):

```bash
# single judge model
python judge/judge.py --repo-name OpenHands --reference doc0 --model gemini-2.5-flash \
  --use-tools --batch-size 5 --enable-retry --max-retries 2

# full pipeline: 3 judge models (paper's exact panel) + combine + visualize
bash ./run_evaluation_pipeline.sh --repo-name OpenHands --reference doc0 \
  --models gemini-2.5-flash,gpt-oss-120b,kimi-k2-instruct \
  --batch-size 5 --combination-method average --visualize
```

**Judge LLM — fully configurable, but not "bring your own API key" out of the box.** `src/config.py` / `src/utils.py::get_llm()` wrap every model call in `pydantic_ai.models.openai.OpenAIChatModel` pointed at an **OpenAI-compatible base URL**, defaulting to `BASE_URL=http://localhost:4000` (the canonical LiteLLM-proxy default) and `API_KEY=sk-1234` (LiteLLM's placeholder key) — this is written assuming you run your own LiteLLM proxy in front of whichever real providers back the model names. There is no direct Anthropic/Google/OpenAI SDK call site for judging; `--model` is just a string forwarded to `chat.completions.create(model=...)` against `BASE_URL`. **Env required**: `API_KEY`, `MODEL` (fallback default), `BASE_URL`, `EMBEDDING_MODEL` (unused by judging, only by an embeddings helper). To actually run it you must either stand up a LiteLLM proxy config mapping `gemini-2.5-flash` / `gpt-oss-120b` / `kimi-k2-instruct` to real backends, or point `BASE_URL`/`API_KEY` at an OpenAI-compatible gateway that already serves those three model-name strings (e.g. OpenRouter, with provider-prefixed slugs) and drop `--model` accordingly.

**Judge model, per the paper (Appendix G.1), used for the published numbers**: Gemini 2.5 Flash, GPT-OSS-120B, Kimi K2 Instruct — all temperature 0.0, binary 0/1 leaf scoring, `--batch-size` concurrency default 5, tool-augmented (`docs_navigator` tool lets the judge agent fetch full section content on demand instead of stuffing the whole doc into context — the per-leaf prompt embeds only the **skeleton** `docs_tree.json`, not `structured_docs.json`, keeping the fixed per-call prompt cost bounded regardless of repo size). `MAX_TOKENS_PER_TOOL_RESPONSE = 36_000` truncates any single tool response; `OpenAIChatModelSettings(max_tokens=36000, timeout=300)`.

**Cost/runtime — the evaluator's own tracker is dead code, so its printed "$0.00" is meaningless.** `judge.py::run()` prints `Total tokens used` / `Total cost` at the end, but every call site hardcodes `input_tokens = 0; output_tokens = 0` (token counting was never wired up — see `evaluate_single_requirement` / `re_evaluate_single_requirement`, both literally comment `# Token counting would need to be implemented separately`). **Do not trust or report any cost number the tool itself prints.** See (h) for an independent estimate.

**Expected runtime** (our derivation, not published): leaf-requirement count per repo ranges 46–96 in the paper's own Table 1 (denominators of the "Coverage" column: OpenHands 67, svelte 96, puppeteer 82, ml-agents 46, logstash 57, wazuh 46, electron 92). At `--batch-size 5`, that's 10–20 sequential batches per judge model per repo, each batch involving a tool-augmented agent turn (typically 1–2 LLM round-trips) plus a fixed 1s inter-batch sleep. Ballpark 5–12 minutes per judge model per repo, ~15–35 minutes for the full 3-model panel per repo (excludes the LiteLLM-proxy/provider-side latency variance).

## (d) Full repository suite

The **HuggingFace dataset** (`anhnh2002/codewikibench`, queried directly via the `datasets-server.huggingface.co` rows API rather than trusting the README prose) enumerates **22 repositories**, each with `repo_url` + exact `commit_id`. Note: the project page and GitHub README both say "21 repositories" for the headline 68.79%/64.06% figures, but the dataset itself ships 22 rows — see the discrepancy note below (f). Sizes below are GitHub API `size` (repo storage in KB, a proxy — not LOC) except where the paper published exact LOC (marked `[paper LOC]`); monorepo flags are verified by inspecting file/package layout at the pinned commit, not guessed.

| Repo (owner/name) | Language | Size | Monorepo-scale? |
|---|---|---|---|
| `chartjs/Chart.js` | JavaScript | 43.6 MB | No (pnpm-workspace.yaml present but single active package) |
| `FluentValidation/FluentValidation` | C# | 20.0 MB | No |
| `All-Hands-AI/OpenHands` (org since renamed `OpenHands/OpenHands`) | Python | 353.99 MB · **229,909 LOC** `[paper LOC]` | No (frontend+backend split, not a package monorepo) |
| `electron/electron` | C++ | 208.9 MB · **184,234 LOC** `[paper LOC]` | No (huge, but single package) |
| `git-ecosystem/git-credential-manager` | C# | 7.4 MB | No |
| `microsoft/graphrag` | Python | 206.2 MB | No |
| `nlohmann/json` | C++ | 266.2 MB | No (single-header library) |
| `tursodatabase/libsql` | Rust/C | 206.6 MB | **Yes** — Cargo workspace, 13 members (`bindings/c`, `bindings/wasm`, `bottomless`, `libsql`, `libsql-ffi`, `libsql-server`, `vendored/rusqlite`, …) |
| `elastic/logstash` | Java | 135.0 MB · **117,485 LOC** `[paper LOC]` | No (core, not verified multi-module at root) |
| `marktext/marktext` | TypeScript | 87.5 MB | No |
| `material-components/material-components-android` | Java | 183.3 MB | No (single Gradle `lib/` module, not per-component) |
| `mermaid-js/mermaid` | TypeScript | 273.9 MB | **Yes** — pnpm workspace, `packages/{mermaid, mermaid-example-diagram, mermaid-layout-elk, mermaid-zenuml, parser, tiny, examples}` |
| `Unity-Technologies/ml-agents` | C# | 3,027.6 MB · **86,106 LOC** `[paper LOC]` | Possible — mixed C#/Python/Unity-project layout (not confirmed as a package workspace, but multi-language/multi-component scale) |
| `puppeteer/puppeteer` | TypeScript | 1,478.9 MB · **136,302 LOC** `[paper LOC]` | **Yes** — pnpm workspace, `packages/{browsers, ng-schematics, puppeteer, puppeteer-core, testserver}` |
| `qmk/qmk_firmware` | C | 535.6 MB | **Yes** (different flavor) — `keyboards/` contains 1,000+ near-identical per-device subdirectories (GitHub API page cap; real count is thousands) plus `modules/`; not a package-manager workspace but the same "many small near-duplicate subprojects dilute ingest scope" shape |
| `RasaHQ/rasa` | Python | 1,716.0 MB | No (not confirmed multi-package at root) |
| `storybookjs/storybook` | TypeScript | 1,061.0 MB | **Yes**, most severe in the suite — Nx/Yarn workspace under `code/` (`code/{addons, builders, core, frameworks, lib, presets, renderers, sandbox}`, `code/nx.json`) |
| `sumatrapdfreader/sumatrapdf` | C | 354.6 MB | No (single C++ app; has an unrelated `go.mod`/`go.work` for a small internal Go tool, not the app itself) |
| `sveltejs/svelte` | JavaScript | 121.5 MB · **124,576 LOC** `[paper LOC]` | No — `pnpm-workspace.yaml` present but `packages/` has only `svelte` at this commit (not the historical multi-package Svelte 3/4 layout) |
| `trinodb/trino` | Java | 317.7 MB | **Yes** — Maven multi-module, `plugin/` alone has 61 connector modules, plus `core/`, `client/`, `lib/`, `service/`, `testing/` |
| `wazuh/wazuh` | C/C++ | 532.9 MB · **1,446,730 LOC** `[paper LOC]` | **Yes** — multi-component (`api/`, `framework/`, `packages/`, `ruleset/`, `src/`, `tools/`), also the suite's largest repo by LOC |
| `x64dbg/x64dbg` | C++ | 64.7 MB | No (not confirmed multi-module) |

**Monorepo-scale summary**: 6 of 22 flagged outright (`libsql`, `mermaid`, `puppeteer`, `qmk_firmware`, `storybook`, `trino`), 1 borderline (`wazuh`, multi-component but not a package workspace), 1 possible-but-unconfirmed (`ml-agents`). This directly matters for doc0 — the known weak spot is monorepo-scale ingest-scope pollution (examples/vendored/fixtures diluting the entry-point scoring; see `project_monorepo_ingest_scope_pollution` — the Next.js-monorepo regression), and `storybook` (Nx workspace, dozens of packages) and `trino` (61-module Maven monorepo) are the two repos most likely to reproduce that failure mode in Family-2. Expect these to be the honest "weak rows" the report names explicitly, per the DESIGN.md honesty posture.

## (e) License — evaluator, benchmark data, and citing published numbers

- **`FSoft-AI4Code/CodeWikiBench`**: GitHub API reports `license: null`. Direct file listing at the pinned commit confirms **no `LICENSE` file exists** (`.gitignore`, `README.md`, `count_lines_of_code.py`, `examples/`, `requirements.txt`, `src/` — nothing else at root).
- **`FSoft-AI4Code/CodeWiki`** (the generator, for context): same check, same result — `license: null`, no `LICENSE` file in the root listing either.
- **HuggingFace dataset** (`anhnh2002/codewikibench`) license note, verbatim: *"This dataset aggregates documentation from multiple open-source projects. Please refer to each repository's original license for usage terms."* — this covers the *documentation content* they scraped from each project, not the benchmark/evaluator code itself.
- **Paper**: no license, terms-of-use, or ethics/copyright section anywhere in the ACL Findings paper or arXiv preprint (checked both full texts for "license", "copyright", "terms of use", "ethic" — zero hits). The paper's only stated intent is *"We open-source CodeWiki to foster future research and community adoption"* / *"To support future research, we publicly release both CodeWiki and CodeWikiBench."*

**Verdict:**
1. **Citing their published numbers** (CodeWiki-Sonnet-4 68.79%, DeepWiki 64.06%, etc., with a source link) is fine — these are factual/numeric results from a paper the authors explicitly published "to support future research" and comparison; citing scores from a public paper in a comparison table is standard academic and industry practice, not a copyright concern (facts and short comparative citations aren't the kind of "expression" copyright protects, and the stated purpose of the release is exactly this kind of reuse).
2. **Running their evaluator code** to produce a comparable doc0 score is a greyer area precisely *because* there is no LICENSE file: absent an explicit grant, source code defaults to "all rights reserved" under copyright law, and GitHub's own ToS only guarantees the right to view/fork, not to reuse. In practice this is extremely common for research-benchmark repos (nobody enforces it against good-faith comparative use, and the paper's stated purpose is community adoption) — but it means doc0-benchmarks should **not vendor/copy their `.py` files into our own repo** (that would be redistributing unlicensed code under our own repo's terms). Recommendation for the Family-2 runner: treat the evaluator as an **external pinned dependency invoked at the pinned SHA** (clone-at-runtime or a git submodule pointing at `5e728fb4`, never a committed copy of their source), matching the DESIGN.md instruction to "pin its repo SHA; do not reimplement their scoring." If this becomes a prominent public marketing comparison rather than a research report, it would be worth a one-line email to the authors (contact emails are in the paper) noting the reuse — cheap insurance, not a blocker.

## (f) Published baseline table (verbatim, with source)

Two different scopes appear across their materials and should not be conflated:

**Table 1 in the paper body** (source: [aclanthology.org/2026.findings-acl.288](https://aclanthology.org/2026.findings-acl.288/), also mirrored on the [project page](https://fsoft-ai4code.github.io/CodeWiki/)) reports **4 systems across 7 representative repositories** (its own text: *"We curate a benchmark of 7 open-source repositories"*), and its "Average" row is the number everyone quotes as the headline 21-repo figure:

| Repository | Language | LOC | OpenDeepWiki | deepwiki-open | DeepWiki | CodeWiki (Sonnet-4) | CodeWiki Improvement vs. DeepWiki |
|---|---|---|---|---|---|---|---|
| All-Hands-AI–OpenHands | Python | 229,909 | 58.12 ± 3.21 (42/67) | 61.35 ± 2.98 (45/67) | 73.04 ± 2.54 (54/67) | **82.45 ± 2.65 (59/67)** | +9.41 |
| sveltejs–svelte | JavaScript | 124,576 | 55.23 ± 3.85 (61/96) | 57.89 ± 3.62 (64/96) | 68.51 ± 3.31 (76/96) | **71.96 ± 3.73 (80/96)** | +3.45 |
| puppeteer–puppeteer | TypeScript | 136,302 | 51.82 ± 4.15 (48/82) | 54.67 ± 3.94 (51/82) | 64.46 ± 3.72 (60/82) | **83.00 ± 3.37 (74/82)** | +18.54 |
| Unity-Technologies–ml-agents | C# | 86,106 | 62.45 ± 4.28 (32/46) | 65.12 ± 4.05 (34/46) | 74.80 ± 3.69 (39/46) | **79.78 ± 5.02 (42/46)** | +4.98 |
| elastic–logstash | Java | 117,485 | 41.25 ± 4.52 (28/57) | 44.18 ± 4.31 (31/57) | 54.80 ± 4.10 (38/57) | **57.90 ± 3.43 (38/57)** | +3.10 |
| wazuh–wazuh | C | 1,446,730 | 32.56 ± 5.82 (18/46) | 35.89 ± 5.45 (21/46) | **68.68 ± 4.74 (39/46)** | 64.17 ± 5.44 (34/46) | −4.51 |
| electron–electron | C++ | 184,234 | 28.45 ± 3.95 (35/92) | 31.22 ± 3.78 (38/92) | **44.10 ± 3.12 (54/92)** | 42.30 ± 3.26 (48/92) | −1.80 |
| **Average** | | | **47.13 ± 4.25** | **50.05 ± 4.02** | **64.06 ± 3.60** | **68.79 ± 3.84** | **+4.73** |

Per-language-category breakdown (from the [GitHub README](https://github.com/FSoft-AI4Code/CodeWiki) / project page, same underlying 7-repo run): High-Level (Python/JS/TS) CodeWiki 79.14% vs. DeepWiki 68.67% (+10.47); Managed (C#/Java) 68.84% vs. 64.80% (+4.04); Systems (C/C++) 53.24% vs. 56.39% (−3.15); Overall 68.79% vs. 64.06% (+4.73).

**Discrepancy worth flagging, not resolving on their behalf**: the paper's own RQ1 section says *"we curate a benchmark of 7 open-source repositories,"* yet the project page and README describe the 68.79%/64.06% headline as measured *"across 21 repositories"* (or, per our own dataset query, 22 rows are actually published). The 7-repo table's average is numerically identical to the "21-repo" headline (68.79 / 64.06 to two decimals) — either the wider run exists but only the 7-repo detail table made the paper, or the "21/22 repositories" framing on the marketing site overstates what Table 1 actually evaluates. We don't have visibility into which; the report should cite Table 1's 7-repo scores as what's actually verifiable line-by-line, and describe 68.79%/64.06% as "the paper's reported overall average" without implying we've seen all 21/22 rows.

**Judge-model panel used for these numbers** (Appendix G.1): Gemini 2.5 Flash, GPT-OSS-120B, Kimi K2 Instruct (temp 0.0 each), combined by the pipeline's `average` method — this is the exact panel doc0's Family-2 run should reuse for a fair comparison, not a different/cheaper judge substitute.

## (g) Runnability verdict

**The evaluator IS publicly runnable** — no fallback/reimplementation needed. Confirmed by direct inspection of a fresh clone (not README-trusting): real, complete Python source for parsing, rubric generation, and LLM-judged evaluation, with a full worked example (`examples/OpenHands/`) showing every intermediate artifact end to end. The only real friction is operational, not a runnability blocker: (1) it expects an OpenAI-compatible LiteLLM-proxy-style endpoint, not direct provider SDKs — supply `BASE_URL`/`API_KEY` for a gateway that serves the three judge model names; (2) the repo's own cost/token accounting is dead code (see (c)) — don't trust its printed cost; (3) `--reference` and the `data/` directory layout are undocumented beyond the README's happy path and had to be reverse-engineered from `judge.py`/`config.py` (documented in (c) above so the Family-2 adapter doesn't have to re-derive it).

## (h) Family-2 cost estimate

**Generation cost** (doc0 side, per project memory: measured ~$1.30–$2.40/repo for wiki generation): **22 repos** in the published dataset (or 21 if the report ultimately narrows to the paper's own repos — see (f)) → **≈ $28.60–$52.80** for a full-suite generation pass. This matches the DESIGN.md ~$50–80 budget expectation with headroom for retries/escalations to the big tier.

**Evaluator judge cost** (our own estimate — the tool's built-in tracker cannot be trusted, per (c)/(g)). Methodology: per leaf-requirement judge call, the agent's context is system prompt (~300 tok) + full `docs_tree.json` skeleton (~2,000–6,000 tok, repeated on every leaf call since it's re-sent each time) + the requirement text (~100 tok), plus a tool-augmented round-trip (`docs_navigator` returns ~500–3,000 tok of actual section content, capped at 36,000 tok) and a final ~150–400 tok JSON verdict. Call it ~8,000 input + ~500 output tokens per leaf, per judge model, as a working estimate.

| | value |
|---|---|
| Leaves per repo (paper's own range) | 46–96, ~70 avg |
| Tokens per leaf per judge model | ~8,000 in + ~500 out |
| Tokens per repo per judge model | ~560,000 in + ~35,000 out |
| Judge panel | Gemini 2.5 Flash + GPT-OSS-120B + Kimi K2 Instruct (paper's panel) |
| Rough blended cost per repo (all 3 judges) | **~$0.50–$3** (Flash and GPT-OSS-120B are cheap per-token; Kimi K2 via most hosts is the pricier of the three — exact figure depends entirely on which backend/proxy serves the three model names, since pricing isn't fixed by the evaluator itself) |
| **Full 22-repo suite, judge cost only** | **≈ $11–$66** |

**Combined Family-2 total estimate: roughly $40–$120** (generation $29–$53 + judging $11–$66), an order of magnitude below the generation-only $50–80 DESIGN.md figure once judging is added, but still well inside it if judging lands at the low end. No rubric-regeneration cost is included because Family-2 reuses the CodeWikiBench repos' already-published `rubrics/combined_rubrics.json` per repo rather than regenerating rubrics from official docs (same rubric set the CodeWiki/DeepWiki baseline numbers were scored against — required for the comparison to be apples-to-apples). Runtime: ~15–35 minutes per repo for the full 3-judge panel (see (c)) → roughly 5.5–13 hours of judge wall-clock for all 22 repos if run sequentially; trivially parallelizable across repos since each is an independent `data/<repo>/` tree.
