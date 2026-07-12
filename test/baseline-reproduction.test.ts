// CI reproduction gate for Family-1's deterministic tier. Identical inputs
// (committed corpus pages + committed graph index) through PURE functions
// must yield IDENTICAL output — there is no threshold to tune here. A diff
// means the scoring code itself changed since the baseline was captured; fix
// by deliberately regenerating `baselines/v0.1-launch.baseline.json` with a
// `Why:` line in the commit message, never by loosening this assertion.
import { describe, it, expect } from "vitest";
import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { computeDeterministic, type DeterministicMetrics } from "../runners/grounding-scorecard.ts";
import { loadWikiDir } from "../scoring/corpus.ts";
import { loadGraphIndexFile } from "../scoring/graph-index.ts";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const BASELINE_PATH = join(ROOT, "baselines", "v0.1-launch.baseline.json");

interface Baseline {
  schema_version: 1;
  label: string;
  corpora: Record<string, DeterministicMetrics>;
}

describe("baseline reproduction (v0.1-launch)", () => {
  it("recomputes the exact deterministic metrics recorded in the baseline, for every corpus in it", async () => {
    const baseline = JSON.parse(await readFile(BASELINE_PATH, "utf-8")) as Baseline;
    expect(Object.keys(baseline.corpora).length).toBeGreaterThan(0);

    for (const [corpus, expected] of Object.entries(baseline.corpora)) {
      const corpusDir = join(ROOT, "corpora", corpus);
      const pages = await loadWikiDir(corpusDir);
      const graph = await loadGraphIndexFile(join(corpusDir, "_graph-index.json"));
      const recomputed = await computeDeterministic(pages, graph);
      expect(recomputed, `corpus ${corpus} diverged from baselines/v0.1-launch.baseline.json`).toEqual(expected);
    }
  });
});
