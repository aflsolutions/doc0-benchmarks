// Ported from doc0 (commit 175c6b0e) — canonical scoring copy for published benchmarks.

import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { generateObject } from "ai";
import { z } from "zod";
import type { WikiPage } from "./corpus.ts";
import { judgeModel } from "./judge-model.ts";

export type ClaimCitation = { claim: string; filePath: string; startLine: number; endLine: number };
export type SupportVerdict = "supported" | "unsupported" | "citation_broken";
export type AccuracyJudgeFn = (args: { claim: string; sourceExcerpt: string }) => Promise<"supported" | "unsupported">;
export type AccuracyResult = {
  sampled: number; claimSupportRate: number; citationResolutionRate: number;
  judgeFailures: number; seed: number;
};

const LINK = /\[([^\]]+?)\]\(([^)]*)\)/g;       // [label](url)
const LINK_STRIP = /\[[^\]]*\]\([^)]*\)/g;       // remove links, leaving prose

export function parseRef(
  label: string,
  url: string,
): { filePath: string; startLine: number; endLine: number } | null {
  let start: number | undefined;
  let end: number | undefined;
  const urlRange = /#L(\d+)(?:-L?(\d+))?/.exec(url);
  if (urlRange) {
    start = Number(urlRange[1]);
    end = urlRange[2] ? Number(urlRange[2]) : start;
  } else {
    const labelRange = /:(\d+)(?:-(\d+))?\s*$/.exec(label.trim());
    if (labelRange) {
      start = Number(labelRange[1]);
      end = labelRange[2] ? Number(labelRange[2]) : start;
    }
  }
  if (start === undefined || end === undefined) return null;

  const labelPath = label.replace(/#.*$/, "").replace(/:\d+(?:-\d+)?\s*$/, "").trim();
  const urlPath = url.replace(/#.*$/, "").replace(/^\//, "").trim();
  const urlIsHttp = /^https?:\/\//i.test(url.trim());
  let filePath: string;
  if (labelPath.includes("/")) filePath = labelPath;                  // ours, deepwiki
  else if (!urlIsHttp && urlPath.includes("/")) filePath = urlPath;   // zread
  else if (/\.[a-z0-9]+$/i.test(labelPath)) filePath = labelPath;     // bare filename in label
  else if (!urlIsHttp && /\.[a-z0-9]+$/i.test(urlPath)) filePath = urlPath;
  else return null;
  if (!/\.[a-z0-9]+/i.test(filePath)) return null;
  return { filePath, startLine: start, endLine: end };
}

export function extractClaimCitations(content: string): ClaimCitation[] {
  const lines = content.split("\n");
  const out: ClaimCitation[] = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const linkRe = new RegExp(LINK.source, "g");
    const refsOnLine: Array<{ filePath: string; startLine: number; endLine: number }> = [];
    let m: RegExpExecArray | null;
    while ((m = linkRe.exec(line)) !== null) {
      const ref = parseRef(m[1], m[2]);
      if (ref) refsOnLine.push(ref);
    }
    if (refsOnLine.length === 0) continue;

    // Inline case: the claim is this line's prose (links stripped). Trailing
    // "Sources:" case: the nearest preceding substantial non-Sources line.
    let claim = /^\s*Sources:/.test(line) ? "" : line.replace(LINK_STRIP, "").trim();
    if (claim.length < 20) {
      for (let j = i - 1; j >= 0; j--) {
        if (/^\s*Sources:/.test(lines[j])) continue;
        const t = lines[j].replace(LINK_STRIP, "").trim();
        if (t.length >= 20) {
          claim = t;
          break;
        }
      }
    }
    for (const r of refsOnLine) out.push({ claim: claim.slice(0, 500), ...r });
  }
  return out;
}

export async function resolveCitation(repoDir: string, c: ClaimCitation): Promise<string | null> {
  let text: string;
  try {
    text = await readFile(join(repoDir, c.filePath), "utf-8");
  } catch {
    return null;
  }
  const lines = text.split("\n");
  if (c.startLine < 1 || c.endLine > lines.length || c.startLine > c.endLine) return null;
  const from = Math.max(0, c.startLine - 3);
  const to = Math.min(lines.length, c.endLine + 2);
  return lines.slice(from, to).join("\n");
}

export type ClaimGroup = { claim: string; citations: Array<{ filePath: string; startLine: number; endLine: number }> };

export function groupClaimCitations(cites: ClaimCitation[]): ClaimGroup[] {
  const out: ClaimGroup[] = [];
  const byClaim = new Map<string, ClaimGroup>();
  for (const c of cites) {
    const citation = { filePath: c.filePath, startLine: c.startLine, endLine: c.endLine };
    // Empty-fallback claims (extraction found no substantial claim line) share text
    // only by accident — grouping them would merge unrelated citations into one
    // judged data point. Emit one single-citation group per such citation instead.
    if (c.claim.trim() === "") {
      out.push({ claim: c.claim, citations: [citation] });
      continue;
    }
    let g = byClaim.get(c.claim);
    if (!g) {
      g = { claim: c.claim, citations: [] };
      byClaim.set(c.claim, g);
      out.push(g);
    }
    g.citations.push(citation);
  }
  return out;
}

// Deterministic shuffle (mulberry32 PRNG + Fisher-Yates). Date/Math.random are
// unacceptable here: the sampled claim set must be reproducible from the seed.
export function seededShuffle<T>(arr: T[], seed: number): T[] {
  let a = seed >>> 0;
  const rand = (): number => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

const MAX_EXCERPTS_PER_CLAIM = 5;
const MAX_EXCERPT_LINES_TOTAL = 120;

/**
 * Resolve EVERY citation attached to a claim and concatenate the excerpts with
 * file:line headers. A multi-hop claim ("A calls B which calls C") cites lines
 * in several files; the old single-excerpt resolver showed the judge only hop
 * A, structurally inviting "unsupported" for correct chains.
 */
export async function resolveExcerpts(repoDir: string, group: ClaimGroup): Promise<string | null> {
  const parts: string[] = [];
  let linesUsed = 0;
  for (const c of group.citations.slice(0, MAX_EXCERPTS_PER_CLAIM)) {
    const excerpt = await resolveCitation(repoDir, { claim: group.claim, ...c });
    if (excerpt === null) continue;
    const lines = excerpt.split("\n");
    const budget = MAX_EXCERPT_LINES_TOTAL - linesUsed;
    if (budget <= 0) break;
    const clipped = lines.slice(0, budget);
    linesUsed += clipped.length;
    parts.push(`--- ${c.filePath}:${c.startLine}-${c.endLine} ---\n${clipped.join("\n")}`);
  }
  return parts.length === 0 ? null : parts.join("\n\n");
}

export async function judgeAccuracy(
  pages: WikiPage[],
  repoDir: string,
  judge: AccuracyJudgeFn,
  sampleN = 40,
  seed = 42,
): Promise<AccuracyResult> {
  // Group WITHIN a page only: identical claim text on different pages (boilerplate
  // rows, repeated section intros) refers to unrelated code — merging across pages
  // would feed the judge unrelated excerpts under one claim and collapse N
  // citations into a single data point. Within-page same-text merging stays: that
  // IS the multi-hop case this resolver exists for.
  const groups = pages.flatMap((p) => groupClaimCitations(extractClaimCitations(p.content)));
  const sampled = seededShuffle(groups, seed).slice(0, sampleN);
  let resolved = 0;
  let supported = 0;
  let judgeFailures = 0;
  for (const g of sampled) {
    const excerpt = await resolveExcerpts(repoDir, g);
    if (excerpt === null) continue;
    resolved += 1;
    try {
      if ((await judge({ claim: g.claim, sourceExcerpt: excerpt })) === "supported") supported += 1;
    } catch (err) {
      judgeFailures += 1;
      console.warn("[wiki-eval] accuracy judge call failed (excluded from rate):", err);
    }
  }
  const judged = resolved - judgeFailures;
  return {
    sampled: sampled.length,
    claimSupportRate: judged <= 0 ? 0 : Number((supported / judged).toFixed(3)),
    citationResolutionRate: sampled.length === 0 ? 0 : Number((resolved / sampled.length).toFixed(3)),
    judgeFailures,
    seed,
  };
}

const supportSchema = z.object({ supported: z.boolean() });
export const liveAccuracyJudge: AccuracyJudgeFn = async ({ claim, sourceExcerpt }) => {
  // NOTE — EU residency: this call sends source code excerpts to Google AI Studio
  // (`gemini-2.5-flash`), a US (non-EU) endpoint. Use this judge for PUBLIC repos only.
  // Running it against a private customer clone via --repo-dir would send customer source
  // out of the EU, breaching the project's data-residency rule. WIKI_EVAL_JUDGE_PROVIDER=vertex
  // sends the same public-repo content to the configured Vertex project/location instead.
  //
  // Errors propagate — the caller (judgeAccuracy) counts them as judgeFailures and
  // excludes them from the denominator instead of silently scoring them "unsupported",
  // which would conflate API outages with genuine claim/code mismatches.
  const { object } = await generateObject({
    model: judgeModel(),
    schema: supportSchema,
    prompt: `Does the source code excerpt SUPPORT the documentation claim? Answer supported=true only if the code substantiates the claim.

CLAIM: ${claim}

SOURCE EXCERPT:
${sourceExcerpt}`,
    // Two real hangs during Phase-2 validation: an unbounded call stalls the whole eval
    // run and never reaches the judgeFailures accounting above.
    abortSignal: AbortSignal.timeout(60_000),
  });
  return object.supported ? "supported" : "unsupported";
};
