// Family-1 grounding scorecard.
//
// Two rerunnability tiers (see docs/DESIGN.md):
//   - deterministic (default): chain extraction + verification against the
//     committed `_graph-index.json`, plus structural metrics. Pure, offline,
//     no env keys. This is what CI reproduces byte-for-byte against
//     `baselines/`.
//   - judged (`--judged`): claimSupport (multi-excerpt, judgeFailures
//     excluded) and comparative dimensions (both-orders, unreliable cells
//     never fabricate a winner) via the Gemini judge. Requires peer pages
//     already fetched (`pnpm peers:fetch`) and a judge key
//     (GOOGLE_GENERATIVE_AI_API_KEY or the GOOGLE_VERTEX_* trio).
//
// Usage:
//   pnpm bench:grounding [--corpus <name>] [--judged] [--samples N] [--seed N]
//
// `computeDeterministic` is exported so `test/baseline-reproduction.test.ts`
// recomputes the exact same code path the CLI runs, instead of re-deriving
// the scoring logic independently.

import { execFileSync } from "node:child_process";
import { mkdir, readdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";

import {
  extractChainClaims,
  summarizeChainMetrics,
  verifyChainClaims,
  type ChainMetrics,
  type GraphIndex,
} from "../scoring/chain-claims.ts";
import { loadReferenceWiki, loadWikiDir, type ReferenceWiki, type WikiPage } from "../scoring/corpus.ts";
import { loadGraphIndexFile } from "../scoring/graph-index.ts";
import { computeStructuralMetrics, type StructuralMetrics } from "../scoring/metrics.ts";
import { judgeAccuracy, liveAccuracyJudge, type AccuracyResult } from "../scoring/judge-accuracy.ts";
import { judgeComparative, liveJudge, type ComparativeResult } from "../scoring/judge-comparative.ts";
import { judgeModel } from "../scoring/judge-model.ts";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const CORPORA_DIR = join(ROOT, "corpora");
const PEERS_MANIFEST_DIR = join(CORPORA_DIR, "peers");
const RESULTS_DIR = join(ROOT, "results");
const RESULTS_PEERS_DIR = join(RESULTS_DIR, "peers");
const RESULTS_SOURCES_DIR = join(RESULTS_DIR, "sources");

const DEFAULT_SAMPLE_N = 40;
const DEFAULT_SEED = 42;

/** Thrown for expected, actionable failures (missing peers, missing keys,
 * unreachable SHA) — main() prints `.message` alone and exits 1, no stack
 * trace noise. Anything else is a real bug and propagates. */
class GuardError extends Error {}

// ---------------------------------------------------------------------------
// Corpus metadata (corpora/<corpus>/_meta.json — written by doc0-commercial's
// export script; see docs/PLAN.md Task 4 for the exact shape).
// ---------------------------------------------------------------------------

export interface CorpusMeta {
  schema_version: 1;
  repo: string;
  generated_at: string;
  doc0_commit: string;
  source_repo_sha: string;
  models: { small: string; big: string };
  doc_mode: string;
  page_count: number;
  source_baseline: string;
}

async function loadCorpusMeta(corpus: string): Promise<CorpusMeta> {
  const raw = JSON.parse(await readFile(join(CORPORA_DIR, corpus, "_meta.json"), "utf-8")) as CorpusMeta;
  if (raw.schema_version !== 1) {
    throw new GuardError(`[grounding-scorecard] unsupported _meta.json schema_version for ${corpus}: ${String(raw.schema_version)}`);
  }
  return raw;
}

// ---------------------------------------------------------------------------
// Deterministic tier
// ---------------------------------------------------------------------------

export interface DeterministicMetrics {
  structural: StructuralMetrics;
  chains: ChainMetrics;
}

/**
 * Pure — no network, no env keys, no filesystem access beyond what the
 * caller already loaded. Identical inputs (pages + graph) always produce
 * identical output, which is exactly what the baseline-reproduction gate
 * relies on.
 */
export async function computeDeterministic(pages: WikiPage[], graph: GraphIndex): Promise<DeterministicMetrics> {
  const structural = await computeStructuralMetrics(pages);
  const perPageChains = pages.map((p) => verifyChainClaims(extractChainClaims(p.content), graph));
  const chains = summarizeChainMetrics(perPageChains);
  return { structural, chains };
}

// ---------------------------------------------------------------------------
// Judged tier
// ---------------------------------------------------------------------------

export interface JudgeRunMeta {
  model: string;
  backend: string;
  seed: number;
  samples: number;
}

export interface JudgedMetrics {
  claimSupport: { ours: AccuracyResult; peers: Record<string, AccuracyResult> };
  comparative: ComparativeResult;
  judge: JudgeRunMeta;
}

/** `<repo>-<date>` corpus dir name → the bare repo key peer manifests are
 * named after (`corpora/peers/<peer>-<repoKey>.manifest.json`). */
function repoKeyForCorpus(corpus: string): string {
  return corpus.replace(/-\d{4}-\d{2}$/, "");
}

async function pathExists(p: string): Promise<boolean> {
  try {
    await stat(p);
    return true;
  } catch {
    return false;
  }
}

async function listPeerManifestsForCorpus(corpus: string): Promise<string[]> {
  const repoKey = repoKeyForCorpus(corpus);
  const entries = await readdir(PEERS_MANIFEST_DIR);
  return entries.filter((f) => f.endsWith(`-${repoKey}.manifest.json`)).sort();
}

/** fetch-peers.ts writes each manifest's pages to
 * `results/peers/<manifest-basename>/`. A missing or empty dir means
 * `pnpm peers:fetch` hasn't run yet for this corpus. */
async function ensurePeersFetched(corpus: string, manifestFiles: string[]): Promise<void> {
  for (const manifestFile of manifestFiles) {
    const dirName = manifestFile.replace(/\.manifest\.json$/, "");
    const dir = join(RESULTS_PEERS_DIR, dirName);
    const exists = await pathExists(dir);
    const files = exists ? await readdir(dir) : [];
    if (!exists || files.length === 0) {
      throw new GuardError(
        `[grounding-scorecard] peers not fetched for ${corpus} (missing ${dir}) — run \`pnpm peers:fetch\` first.`,
      );
    }
  }
}

function requireJudgeCredentials(): void {
  const hasAiStudio = Boolean(process.env.GOOGLE_GENERATIVE_AI_API_KEY);
  const hasVertex = Boolean(
    process.env.GOOGLE_VERTEX_PROJECT && process.env.GOOGLE_VERTEX_CLIENT_EMAIL && process.env.GOOGLE_VERTEX_PRIVATE_KEY,
  );
  if (!hasAiStudio && !hasVertex) {
    throw new GuardError(
      "[grounding-scorecard] --judged requires GOOGLE_GENERATIVE_AI_API_KEY (Google AI Studio) or the " +
        "GOOGLE_VERTEX_PROJECT/GOOGLE_VERTEX_CLIENT_EMAIL/GOOGLE_VERTEX_PRIVATE_KEY trio (Vertex) — set one and retry.",
    );
  }
}

/** Ensures `results/sources/<corpus>/` holds a checkout of `meta.repo` at
 * `meta.source_repo_sha`, so `judgeAccuracy` can resolve citations against
 * it. Reuses an existing checkout if it's already at the right SHA;
 * otherwise (re-)clones. */
async function ensureSourceRepo(meta: CorpusMeta, corpus: string): Promise<string> {
  const dir = join(RESULTS_SOURCES_DIR, corpus);
  if (await pathExists(dir)) {
    try {
      const head = execFileSync("git", ["-C", dir, "rev-parse", "HEAD"], { encoding: "utf-8" }).trim();
      if (head === meta.source_repo_sha) return dir;
    } catch {
      // Not a git repo (or a stale partial clone) — fall through and re-clone.
    }
    await rm(dir, { recursive: true, force: true });
  }
  await mkdir(dirname(dir), { recursive: true });
  try {
    execFileSync("git", ["clone", "--depth", "1", `https://github.com/${meta.repo}`, dir], { stdio: "inherit" });
    execFileSync("git", ["fetch", "--depth", "1", "origin", meta.source_repo_sha], { cwd: dir, stdio: "inherit" });
    execFileSync("git", ["checkout", meta.source_repo_sha], { cwd: dir, stdio: "inherit" });
  } catch (err) {
    throw new GuardError(
      `[grounding-scorecard] could not fetch ${meta.repo}@${meta.source_repo_sha} for ${corpus} — ` +
        `${err instanceof Error ? err.message : String(err)}`,
    );
  }
  return dir;
}

interface PeerManifestHeader {
  peer: string;
}

/** Loads one peer's fetched pages as a `ReferenceWiki`, keyed by the peer
 * name recorded in its manifest (`deepwiki`, `zread`, …) — the same key used
 * for both `claimSupport.peers` and `comparative.perReference`. */
async function loadPeerReference(manifestFile: string): Promise<ReferenceWiki> {
  const manifest = JSON.parse(
    await readFile(join(PEERS_MANIFEST_DIR, manifestFile), "utf-8"),
  ) as PeerManifestHeader;
  const dirName = manifestFile.replace(/\.manifest\.json$/, "");
  return loadReferenceWiki(join(RESULTS_PEERS_DIR, dirName), manifest.peer);
}

function judgeRunMeta(seed: number, samples: number): JudgeRunMeta {
  const model = judgeModel();
  const [modelId, backend] = typeof model === "string" ? [model, "unknown"] : [model.modelId, model.provider];
  return { model: modelId, backend, seed, samples };
}

async function runJudgedTier(
  corpus: string,
  meta: CorpusMeta,
  oursPages: WikiPage[],
  manifestFiles: string[],
  sampleN: number,
  seed: number,
): Promise<JudgedMetrics> {
  const sourceDir = await ensureSourceRepo(meta, corpus);
  const peerRefs = await Promise.all(manifestFiles.map(loadPeerReference));

  const oursAccuracy = await judgeAccuracy(oursPages, sourceDir, liveAccuracyJudge, sampleN, seed);
  const peerAccuracy: Record<string, AccuracyResult> = {};
  for (const ref of peerRefs) {
    peerAccuracy[ref.source] = await judgeAccuracy(ref.pages, sourceDir, liveAccuracyJudge, sampleN, seed);
  }

  const comparative = await judgeComparative(oursPages, peerRefs, liveJudge);

  return {
    claimSupport: { ours: oursAccuracy, peers: peerAccuracy },
    comparative,
    judge: judgeRunMeta(seed, sampleN),
  };
}

// ---------------------------------------------------------------------------
// Output
// ---------------------------------------------------------------------------

export interface GroundingResult {
  schema_version: 1;
  corpus: string;
  meta: CorpusMeta;
  deterministic: DeterministicMetrics;
  judged?: JudgedMetrics;
}

function renderMarkdown(result: GroundingResult): string {
  const { structural, chains } = result.deterministic;
  const lines: string[] = [
    `# Grounding scorecard — ${result.corpus}`,
    "",
    `Repo: \`${result.meta.repo}\` @ \`${result.meta.source_repo_sha}\` ` +
      `(doc0 commit \`${result.meta.doc0_commit}\`, ${result.meta.doc_mode}, ${result.meta.page_count} pages)`,
    "",
    "## Deterministic — structural",
    "",
    "| metric | value |",
    "|---|---|",
    `| pages | ${structural.pages} |`,
    `| avgWords | ${structural.avgWords} |`,
    `| avgH2Sections | ${structural.avgH2Sections} |`,
    `| avgWordsPerSection | ${structural.avgWordsPerSection} |`,
    `| thinPages | ${structural.thinPages} |`,
    `| noisePages | ${structural.noisePages} |`,
    `| citationDensityPer1k | ${structural.citationDensityPer1k} |`,
    `| pagesBelowMinCitationDensity | ${structural.pagesBelowMinCitationDensity} |`,
    `| validDiagramPages | ${structural.validDiagramPages} |`,
    `| invalidDiagramPages | ${structural.invalidDiagramPages} |`,
    "",
    "## Deterministic — chain verification",
    "",
    "| metric | value |",
    "|---|---|",
    `| chains | ${chains.chains} |`,
    `| chainsPerPage | ${chains.chainsPerPage} |`,
    `| hopVerificationRate | ${chains.hopVerificationRate ?? "n/a"} |`,
    `| verified hops | ${chains.hopBreakdown.verified} |`,
    `| reversed hops | ${chains.hopBreakdown.reversed} |`,
    `| edge-missing hops | ${chains.hopBreakdown["edge-missing"]} |`,
    `| name-missing hops | ${chains.hopBreakdown["name-missing"]} |`,
    "",
  ];

  if (result.judged) {
    const { claimSupport, comparative, judge } = result.judged;
    lines.push(
      "## Judged — claim support",
      "",
      `Judge: \`${judge.model}\` (${judge.backend}), seed ${judge.seed}, samples ${judge.samples}`,
      "",
      "| source | sampled | claimSupportRate | citationResolutionRate | judgeFailures |",
      "|---|---|---|---|---|",
      `| ours | ${claimSupport.ours.sampled} | ${claimSupport.ours.claimSupportRate} | ` +
        `${claimSupport.ours.citationResolutionRate} | ${claimSupport.ours.judgeFailures} |`,
    );
    for (const [peer, res] of Object.entries(claimSupport.peers)) {
      lines.push(`| ${peer} | ${res.sampled} | ${res.claimSupportRate} | ${res.citationResolutionRate} | ${res.judgeFailures} |`);
    }
    lines.push("", "## Judged — comparative", "", "| peer | dimension | verdict | margin | unreliable |", "|---|---|---|---|---|");
    for (const [peer, byDim] of Object.entries(comparative.perReference)) {
      for (const [dim, verdict] of Object.entries(byDim)) {
        lines.push(`| ${peer} | ${dim} | ${verdict.verdict} | ${verdict.margin} | ${verdict.unreliable} |`);
      }
    }
    lines.push("");
  }

  return `${lines.join("\n")}\n`;
}

async function writeResultFiles(result: GroundingResult): Promise<void> {
  await mkdir(RESULTS_DIR, { recursive: true });
  const date = new Date().toISOString().slice(0, 10);
  const jsonPath = join(RESULTS_DIR, `grounding-${result.corpus}-${date}.json`);
  const mdPath = join(RESULTS_DIR, `grounding-${result.corpus}-${date}.md`);
  await writeFile(jsonPath, `${JSON.stringify(result, null, 2)}\n`);
  await writeFile(mdPath, renderMarkdown(result));
  console.log(`[grounding-scorecard] wrote ${jsonPath}`);
  console.log(`[grounding-scorecard] wrote ${mdPath}`);
}

function printSummaryTable(results: GroundingResult[]): void {
  console.table(
    results.map((r) => ({
      corpus: r.corpus,
      pages: r.deterministic.structural.pages,
      avgWords: r.deterministic.structural.avgWords,
      citationDensityPer1k: r.deterministic.structural.citationDensityPer1k,
      chainsPerPage: r.deterministic.chains.chainsPerPage,
      hopVerificationRate: r.deterministic.chains.hopVerificationRate,
      ...(r.judged
        ? {
            claimSupportOurs: r.judged.claimSupport.ours.claimSupportRate,
            claimSupportPeers: JSON.stringify(
              Object.fromEntries(Object.entries(r.judged.claimSupport.peers).map(([k, v]) => [k, v.claimSupportRate])),
            ),
          }
        : {}),
    })),
  );
}

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

interface CliOptions {
  corpus?: string;
  judged: boolean;
  samples: number;
  seed: number;
}

function parseCli(argv: string[]): CliOptions {
  const { values } = parseArgs({
    args: argv,
    options: {
      corpus: { type: "string" },
      judged: { type: "boolean", default: false },
      samples: { type: "string", default: String(DEFAULT_SAMPLE_N) },
      seed: { type: "string", default: String(DEFAULT_SEED) },
    },
  });
  return {
    corpus: values.corpus,
    judged: values.judged ?? false,
    samples: Number(values.samples ?? DEFAULT_SAMPLE_N),
    seed: Number(values.seed ?? DEFAULT_SEED),
  };
}

async function listCorpusDirs(filter?: string): Promise<string[]> {
  const entries = await readdir(CORPORA_DIR, { withFileTypes: true });
  const all = entries
    .filter((e) => e.isDirectory() && e.name !== "peers")
    .map((e) => e.name)
    .sort();
  if (filter === undefined) return all;
  if (!all.includes(filter)) {
    throw new GuardError(`[grounding-scorecard] unknown --corpus "${filter}" (available: ${all.join(", ")})`);
  }
  return [filter];
}

async function processCorpus(corpus: string, opts: CliOptions): Promise<GroundingResult> {
  const corpusDir = join(CORPORA_DIR, corpus);
  const meta = await loadCorpusMeta(corpus);
  const pages = await loadWikiDir(corpusDir);
  const graph = await loadGraphIndexFile(join(corpusDir, "_graph-index.json"));
  const deterministic = await computeDeterministic(pages, graph);

  const result: GroundingResult = { schema_version: 1, corpus, meta, deterministic };

  if (opts.judged) {
    requireJudgeCredentials();
    const manifestFiles = await listPeerManifestsForCorpus(corpus);
    await ensurePeersFetched(corpus, manifestFiles);
    result.judged = await runJudgedTier(corpus, meta, pages, manifestFiles, opts.samples, opts.seed);
  }

  return result;
}

async function main(): Promise<void> {
  const opts = parseCli(process.argv.slice(2));
  try {
    const corpora = await listCorpusDirs(opts.corpus);
    const results: GroundingResult[] = [];
    for (const corpus of corpora) {
      console.log(`[grounding-scorecard] scoring ${corpus}${opts.judged ? " (judged)" : ""}...`);
      const result = await processCorpus(corpus, opts);
      await writeResultFiles(result);
      results.push(result);
    }
    printSummaryTable(results);
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
