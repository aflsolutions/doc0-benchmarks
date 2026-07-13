// Family 2 — free parser dry-run.
//
// MANUAL SMOKE TEST, NOT part of `pnpm test` / CI. This script:
//   1. Clones the CodeWikiBench evaluator at the SHA pinned in
//      `docs/codewikibench-pinned.md` (5e728fb4…) into `results/codewikibench/evaluator`
//      (gitignored — the evaluator repo ships no LICENSE file, so its source
//      is never vendored/copied into this repo; it's an external pinned
//      dependency invoked at the pinned SHA, exactly per the pinned doc's
//      recommendation).
//   2. Emits this repo's evaluator-input directory via `codewikibench.ts`'s
//      `emitEvaluatorInput` (the same adapter `pnpm bench:codewikibench` uses).
//   3. Runs THEIR parser (`src/docs_parser/parse_generated_docs.py`) over that
//      directory as a python child process — the free (no judge LLM, no API
//      key) half of the evaluator pipeline. Judging (judge.py, real $) is
//      out of scope for this script.
//   4. Reports pages emitted vs. parsed (any silently-skipped page is a
//      correctness bug in the adapter — exits 1 with the skipped list) and
//      the retained-word fraction: words surviving anywhere in the parsed
//      `structured_docs.json` tree, divided by words in the emitted (already
//      transpiled) markdown. This fraction is the thing Task 6's
//      parser-safe-lint (later work) is expected to raise toward ~99%; this
//      script's job is only to MEASURE it honestly, not to improve it.
//
// Python environment: the evaluator's own `requirements.txt` pins 106
// packages for its FULL pipeline (judge, rubric generation, MCP tools, cloud
// SDKs, …) — none of which `parse_generated_docs.py` imports. Reading its
// source (see docs/codewikibench-pinned.md) confirms the parser only needs
// `markdown_to_json` and `pydantic` (plus stdlib `json`/`os`/`argparse`). This
// script creates a throwaway venv under `results/codewikibench/venv`
// (gitignored) and installs ONLY those two packages, pinned to the exact
// versions the evaluator's own requirements.txt declares (parsed from the
// clone at runtime, so a version bump upstream is picked up automatically
// rather than silently drifting from what they actually tested against).
// Verified locally against system python3 (3.9.6) + `python3 -m venv` — no
// Python version requirement beyond what pydantic 2.11.7 itself needs
// (3.8+).
//
// Usage:
//   pnpm bench:codewikibench-dryrun --corpus hono-2026-07-v2
//   pnpm bench:codewikibench-dryrun --corpus <technical> --user-guide <user_guide>
//
// Requires: git and python3 on PATH. Network access (clone + PyPI install).

import { execFileSync } from "node:child_process";
import { mkdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";

import { wordCount } from "../scoring/metrics.ts";
import { emitEvaluatorInput } from "./codewikibench.ts";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const CORPORA_DIR = join(ROOT, "corpora");
const RESULTS_DIR = join(ROOT, "results");
const CODEWIKIBENCH_DIR = join(RESULTS_DIR, "codewikibench");
const EVALUATOR_DIR = join(CODEWIKIBENCH_DIR, "evaluator");
const VENV_DIR = join(CODEWIKIBENCH_DIR, "venv");

// Pinned per docs/codewikibench-pinned.md section (a). `main` has no
// released tag; this SHA is the tip of `main` at research time.
const EVALUATOR_REPO_URL = "https://github.com/FSoft-AI4Code/CodeWikiBench.git";
const EVALUATOR_PINNED_SHA = "5e728fb40492effb54d59041f908dbf9079fe238";

class GuardError extends Error {}

async function pathExists(p: string): Promise<boolean> {
  try {
    await stat(p);
    return true;
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// Evaluator clone (reuse-if-at-pinned-SHA, same pattern as grounding-scorecard's
// ensureSourceRepo)
// ---------------------------------------------------------------------------

async function ensureEvaluatorRepo(): Promise<string> {
  if (await pathExists(EVALUATOR_DIR)) {
    try {
      const head = execFileSync("git", ["-C", EVALUATOR_DIR, "rev-parse", "HEAD"], { encoding: "utf-8" }).trim();
      if (head === EVALUATOR_PINNED_SHA) return EVALUATOR_DIR;
    } catch {
      // Not a git repo (or a stale partial clone) — fall through and re-clone.
    }
    await rm(EVALUATOR_DIR, { recursive: true, force: true });
  }
  await mkdir(CODEWIKIBENCH_DIR, { recursive: true });
  try {
    execFileSync("git", ["clone", EVALUATOR_REPO_URL, EVALUATOR_DIR], { stdio: "inherit" });
    execFileSync("git", ["checkout", EVALUATOR_PINNED_SHA], { cwd: EVALUATOR_DIR, stdio: "inherit" });
  } catch (err) {
    throw new GuardError(
      `[codewikibench-dryrun] could not clone/checkout CodeWikiBench@${EVALUATOR_PINNED_SHA} — ${err instanceof Error ? err.message : String(err)}`,
    );
  }
  return EVALUATOR_DIR;
}

// ---------------------------------------------------------------------------
// Minimal python env — only what parse_generated_docs.py actually imports
// ---------------------------------------------------------------------------

interface PythonEnv {
  pythonExe: string;
  markdownToJsonVersion: string;
  pydanticVersion: string;
}

function extractPin(requirementsTxt: string, pkg: string): string {
  const re = new RegExp(`^${pkg}==(\\S+)$`, "m");
  const m = requirementsTxt.match(re);
  if (!m) {
    throw new GuardError(
      `[codewikibench-dryrun] could not find a pinned "${pkg}==" line in the evaluator's requirements.txt — ` +
        "has their pin format changed? Inspect the clone before proceeding.",
    );
  }
  return m[1];
}

async function ensurePythonEnv(evaluatorDir: string): Promise<PythonEnv> {
  const requirementsTxt = await readFile(join(evaluatorDir, "requirements.txt"), "utf-8");
  const markdownToJsonVersion = extractPin(requirementsTxt, "markdown_to_json");
  const pydanticVersion = extractPin(requirementsTxt, "pydantic");

  if (!(await pathExists(VENV_DIR))) {
    try {
      execFileSync("python3", ["-m", "venv", VENV_DIR], { stdio: "inherit" });
    } catch (err) {
      throw new GuardError(
        `[codewikibench-dryrun] "python3 -m venv" failed — is python3 installed and on PATH? ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }

  const pythonExe = join(VENV_DIR, "bin", "python3");
  const pipExe = join(VENV_DIR, "bin", "pip");
  try {
    execFileSync(
      pipExe,
      ["install", "--quiet", `markdown_to_json==${markdownToJsonVersion}`, `pydantic==${pydanticVersion}`],
      { stdio: "inherit" },
    );
  } catch (err) {
    throw new GuardError(
      `[codewikibench-dryrun] pip install failed (markdown_to_json==${markdownToJsonVersion}, pydantic==${pydanticVersion}) — ${err instanceof Error ? err.message : String(err)}`,
    );
  }

  return { pythonExe, markdownToJsonVersion, pydanticVersion };
}

function runParser(pythonExe: string, evaluatorDir: string, inputDir: string, outputDir: string): void {
  const parserScript = join(evaluatorDir, "src", "docs_parser", "parse_generated_docs.py");
  try {
    execFileSync(pythonExe, [parserScript, "--input-dir", inputDir, "--output-dir", outputDir], { stdio: "inherit" });
  } catch (err) {
    throw new GuardError(
      `[codewikibench-dryrun] the evaluator's parser exited non-zero — ${err instanceof Error ? err.message : String(err)}`,
    );
  }
}

// ---------------------------------------------------------------------------
// structured_docs.json traversal — untyped JSON in, `unknown` + guards out
// (their pydantic DocPage schema is title/description/content/metadata/subpages;
// we don't need our own copy of that type, just enough structure to walk it)
// ---------------------------------------------------------------------------

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

/** Every string anywhere in the parsed tree (titles, descriptions, content,
 * metadata) — matches the brief's "words surviving in the parsed tree", not
 * narrowed to just `content`, since a page's title/description are also part
 * of what the evaluator actually sees. */
function collectWords(node: unknown): number {
  if (typeof node === "string") return wordCount(node);
  if (Array.isArray(node)) return node.reduce((sum: number, v: unknown) => sum + collectWords(v), 0);
  if (isRecord(node)) return Object.values(node).reduce((sum: number, v: unknown) => sum + collectWords(v), 0);
  return 0;
}

/** Maps every DocPage's `title` (== the emitted slug, for real pages — see
 * codewikibench.ts's header comment on why module_tree.json keys are
 * filenames, not H1 text) to that DocPage node, at any depth. First
 * occurrence wins on a duplicate title (shouldn't happen — slugs are unique
 * by construction). Does NOT include the root DocPage's own title (that's
 * the corpus/project name, never one of our emitted slugs). */
function indexByTitle(root: unknown): Map<string, unknown> {
  const index = new Map<string, unknown>();
  function walk(node: unknown): void {
    if (!isRecord(node)) return;
    if (typeof node.title === "string" && !index.has(node.title)) {
      index.set(node.title, node);
    }
    if (Array.isArray(node.subpages)) {
      for (const sub of node.subpages) walk(sub);
    }
  }
  if (isRecord(root) && Array.isArray(root.subpages)) {
    for (const sub of root.subpages) walk(sub);
  }
  return index;
}

// ---------------------------------------------------------------------------
// Report
// ---------------------------------------------------------------------------

interface PageRow {
  slug: string;
  wordsEmitted: number;
  wordsParsed: number;
}

interface DryRunResult {
  schema_version: 1;
  corpus: string;
  userGuide?: string;
  evaluator: { repo: string; sha: string };
  pagesEmitted: number;
  pagesParsed: number;
  skipped: string[];
  wordsEmitted: number;
  wordsParsed: number;
  retainedWordFraction: number;
  pages: PageRow[];
}

function renderMarkdown(result: DryRunResult): string {
  const lines: string[] = [
    `# CodeWikiBench free-parser dry-run — ${result.corpus}`,
    "",
    `Evaluator: \`${result.evaluator.repo}\` @ \`${result.evaluator.sha}\`` + (result.userGuide ? ` · user_guide: \`${result.userGuide}\`` : ""),
    "",
    "| metric | value |",
    "|---|---|",
    `| pages emitted | ${result.pagesEmitted} |`,
    `| pages parsed (title matched) | ${result.pagesParsed} |`,
    `| skipped | ${result.skipped.length} |`,
    `| words emitted | ${result.wordsEmitted} |`,
    `| words parsed | ${result.wordsParsed} |`,
    `| retained-word fraction | ${result.retainedWordFraction.toFixed(4)} |`,
    "",
  ];
  if (result.skipped.length > 0) {
    lines.push("## Skipped pages (silently dropped by the evaluator's parser)", "", ...result.skipped.map((s) => `- ${s}`), "");
  }
  lines.push(
    "## Per-page retained fraction",
    "",
    "| slug | words emitted | words parsed | fraction |",
    "|---|---|---|---|",
    ...[...result.pages]
      .sort((a, b) => a.wordsParsed / Math.max(a.wordsEmitted, 1) - b.wordsParsed / Math.max(b.wordsEmitted, 1))
      .map((p) => `| ${p.slug} | ${p.wordsEmitted} | ${p.wordsParsed} | ${(p.wordsParsed / Math.max(p.wordsEmitted, 1)).toFixed(2)} |`),
    "",
  );
  return `${lines.join("\n")}\n`;
}

async function writeResultFiles(result: DryRunResult): Promise<void> {
  await mkdir(RESULTS_DIR, { recursive: true });
  const date = new Date().toISOString().slice(0, 10);
  const jsonPath = join(RESULTS_DIR, `codewikibench-dryrun-${result.corpus}-${date}.json`);
  const mdPath = join(RESULTS_DIR, `codewikibench-dryrun-${result.corpus}-${date}.md`);
  await writeFile(jsonPath, `${JSON.stringify(result, null, 2)}\n`);
  await writeFile(mdPath, renderMarkdown(result));
  console.log(`[codewikibench-dryrun] wrote ${jsonPath}`);
  console.log(`[codewikibench-dryrun] wrote ${mdPath}`);
}

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

interface CliOptions {
  corpus: string;
  userGuide?: string;
}

function parseCli(argv: string[]): CliOptions {
  const { values } = parseArgs({
    args: argv,
    options: {
      corpus: { type: "string" },
      "user-guide": { type: "string" },
    },
  });
  if (!values.corpus) {
    throw new GuardError("[codewikibench-dryrun] --corpus <name> is required (a directory under corpora/)");
  }
  return { corpus: values.corpus, userGuide: values["user-guide"] };
}

async function main(): Promise<void> {
  const opts = parseCli(process.argv.slice(2));
  try {
    const technicalDir = join(CORPORA_DIR, opts.corpus);
    const userGuideDir = opts.userGuide ? join(CORPORA_DIR, opts.userGuide) : undefined;
    if (!(await pathExists(technicalDir))) {
      throw new GuardError(`[codewikibench-dryrun] unknown corpus "${opts.corpus}" (no such directory under corpora/)`);
    }

    console.log(`[codewikibench-dryrun] ensuring evaluator repo @ ${EVALUATOR_PINNED_SHA}...`);
    const evaluatorDir = await ensureEvaluatorRepo();

    console.log("[codewikibench-dryrun] ensuring python env (markdown_to_json + pydantic only)...");
    const pythonEnv = await ensurePythonEnv(evaluatorDir);
    console.log(`[codewikibench-dryrun] python env ready: markdown_to_json==${pythonEnv.markdownToJsonVersion}, pydantic==${pythonEnv.pydanticVersion}`);

    const corpusRunDir = join(CODEWIKIBENCH_DIR, opts.corpus);
    const inputDir = join(corpusRunDir, "input");
    const parsedDir = join(corpusRunDir, "parsed");

    console.log(`[codewikibench-dryrun] emitting evaluator input to ${inputDir}...`);
    const emitted = await emitEvaluatorInput({ technicalDir, userGuideDir, outputDir: inputDir });
    const wordsEmitted = emitted.files.reduce((sum, f) => sum + f.words, 0);

    console.log(`[codewikibench-dryrun] running the evaluator's parser...`);
    runParser(pythonEnv.pythonExe, evaluatorDir, inputDir, parsedDir);

    const structuredDocs: unknown = JSON.parse(await readFile(join(parsedDir, "structured_docs.json"), "utf-8"));
    const parsedByTitle = indexByTitle(structuredDocs);

    const pages: PageRow[] = emitted.files.map((f) => {
      const node = parsedByTitle.get(f.slug);
      return { slug: f.slug, wordsEmitted: f.words, wordsParsed: node !== undefined ? collectWords(node) : 0 };
    });
    const skipped = emitted.files.filter((f) => !parsedByTitle.has(f.slug)).map((f) => f.slug);
    const wordsParsed = collectWords(structuredDocs);

    const result: DryRunResult = {
      schema_version: 1,
      corpus: opts.corpus,
      userGuide: opts.userGuide,
      evaluator: { repo: EVALUATOR_REPO_URL, sha: EVALUATOR_PINNED_SHA },
      pagesEmitted: emitted.files.length,
      pagesParsed: emitted.files.length - skipped.length,
      skipped,
      wordsEmitted,
      wordsParsed,
      retainedWordFraction: wordsEmitted > 0 ? wordsParsed / wordsEmitted : 0,
      pages,
    };

    await writeResultFiles(result);

    console.log(
      `[codewikibench-dryrun] ${result.pagesParsed}/${result.pagesEmitted} pages parsed, ` +
        `retained-word fraction ${result.retainedWordFraction.toFixed(4)}`,
    );

    if (skipped.length > 0) {
      throw new GuardError(
        `[codewikibench-dryrun] ${skipped.length} page(s) silently skipped by the evaluator's parser: ${skipped.join(", ")}`,
      );
    }
  } catch (err) {
    if (err instanceof GuardError) {
      console.error(err.message);
      process.exitCode = 1;
      return;
    }
    throw err;
  }
}

const isEntryPoint = process.argv[1] !== undefined && fileURLToPath(import.meta.url) === process.argv[1];
if (isEntryPoint) {
  main().catch((err: unknown) => {
    console.error(err instanceof Error ? (err.stack ?? err.message) : String(err));
    process.exitCode = 1;
  });
}
