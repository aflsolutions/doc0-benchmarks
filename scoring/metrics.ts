// Ported from doc0 (commit 175c6b0e) — canonical scoring copy for published benchmarks.
//
// Adaptation note: the internal `computeStructuralMetrics` (scripts/wiki-eval/metrics.ts)
// calls two helpers that live in doc0-internal modules with no place in this
// leaf-only repo:
//   - `isNoiseTitle` (scripts/wiki-scorecard/scorecard.ts) — inlined below,
//     same commit, verbatim regexes. The rest of that file (LLM-judge
//     scorecard plumbing) is out of scope for this port.
//   - `findInvalidMermaidBlocks` (src/workflows/utils/content-validator.ts) —
//     inlined below, same commit, verbatim logic. Its `matchDiagramType`
//     dependency is ported as `scoring/mermaid-validator.ts` (a clean,
//     zero-import leaf in the original tree). The one non-portable piece is
//     the `logger.error` call on a failed `mermaid` package import — replaced
//     with `console.error` since this repo has no Sentry-backed logger; the
//     control flow (return `[]`, disabling diagram validation) is unchanged.
//     `mermaid` is a new dependency of this repo, added for this port.

import type { WikiPage } from "./corpus.ts";
import { matchDiagramType } from "./mermaid-validator.ts";

export const THIN_PAGE_MIN_WORDS = 250;
export const MIN_CITATION_DENSITY_PER_1K = 3;

const WORD = /\S+/g;
export function wordCount(s: string): number {
  return (s.match(WORD) ?? []).length;
}

// A source citation = a markdown link whose LABEL contains a file path with an
// extension. Robust to all three observed reference formats:
//   ours:     [src/router.ts:22-48](https://github.com/o/r/blob/main/src/router.ts#L22-L48)
//   deepwiki: [src/utils/url.ts:6]()                          (range in label, empty URL)
//   zread:    [router.ts](src/router.ts#L29-L52)              (range in URL, plain-filename label)
//             [hono-base.ts#L424-L442](src/hono-base.ts#L424-L442)  (inline prose ref)
// Keying off ".ext in the label" matches all four and excludes plain prose links.
const CITATION = /\[[^\]]*\.[a-z]{1,5}[^\]]*\]\([^)]*\)/gi;
export function countCitations(content: string): number {
  return (content.match(CITATION) ?? []).length;
}

// H2 (`## `) headings, the unit of within-page structure. Strip fenced code
// blocks first so a `## comment` inside a bash/markdown snippet is not counted,
// and require a space/tab after `##` so H3+ (`### `) and a bare `##` never match.
// Measured mechanism (hono 2026-06 report): vs deepwiki the gap is words-per-
// SECTION at section-count parity (126 vs 176 w/s at ~6.3 vs 6.7 H2); vs zread
// both gaps exist. avgWordsPerSection is the guard against a "lengthen" change
// that merely SPLITS prose into thinner headings (words flat, w/s collapses).
const FENCED_CODE = /```[\s\S]*?```/g;
const H2_LINE = /^##[ \t]/gm;
export function countH2Sections(content: string): number {
  return (content.replace(FENCED_CODE, "").match(H2_LINE) ?? []).length;
}

// ---------------------------------------------------------------------------
// isNoiseTitle — inlined from scripts/wiki-scorecard/scorecard.ts (same commit)
// ---------------------------------------------------------------------------

// Case-SENSITIVE: real per-endpoint page titles come uppercase ("GET /users").
// An /i flag would mis-flag prose titles like "Get Started" / "Options Configuration".
const HTTP_VERB = /^(GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS)\s/;
const IMPERATIVE_MICRO = /^(Iterate|Convert|Validate|Check|Find|Compute|Parse|Build|Reorder|Initialize|Calculate)\s+\w+(\s+\w+)?$/i;

export function isNoiseTitle(title: string): boolean {
  return HTTP_VERB.test(title) || IMPERATIVE_MICRO.test(title);
}

// ---------------------------------------------------------------------------
// findInvalidMermaidBlocks — inlined from src/workflows/utils/content-validator.ts
// (same commit). See the module header for the adaptation note (logger -> console).
// ---------------------------------------------------------------------------

/**
 * A mermaid fenced block classified as invalid by the server-side gate.
 * `code` is the raw inner block text (between the fences); `diagramType` is
 * the first-line type token or "unknown"; `reason` discriminates the failure.
 */
export interface InvalidMermaidBlock {
  code: string;
  diagramType: string;
  reason: "unknown_header" | "parse_error" | "empty";
}

/**
 * First-line diagram-type token, or "unknown" when the header is not a
 * recognized mermaid diagram type. Delegates to the shared matchDiagramType
 * helper (mermaid-validator) so both validation gates agree on what "unknown"
 * means and the check is defined in one place.
 */
function detectDiagramType(code: string): string {
  return matchDiagramType(code) ?? "unknown";
}

/**
 * Detect mermaid blocks that fail server-side validation, in document order.
 * Three failure classes:
 *  - "empty"          — blank body after trimming.
 *  - "unknown_header" — first line isn't a recognized diagram type.
 *  - "parse_error"    — recognized header but the real mermaid parser rejects
 *                       the body (the dominant flowchart failure, e.g. a
 *                       broken edge `A --< B` under a valid `flowchart TD`).
 *
 * Browser-API failures in Node (ReferenceError / DOMPurify — classDiagram,
 * stateDiagram need DOM globals) are NOT treated as invalid: those blocks
 * render fine client-side, so they are excluded from the result.
 */
export async function findInvalidMermaidBlocks(
  markdown: string,
): Promise<InvalidMermaidBlock[]> {
  const mermaidBlockRe = /```mermaid\s*\n([\s\S]*?)```/g;
  const blocks: string[] = [];
  let match: RegExpExecArray | null;
  while ((match = mermaidBlockRe.exec(markdown)) !== null) {
    blocks.push(match[1]);
  }
  if (blocks.length === 0) return [];

  let mermaid: { parse: (text: string) => Promise<unknown> };
  try {
    const mod = await import("mermaid");
    mod.default.initialize({ startOnLoad: false, securityLevel: "loose" });
    mermaid = { parse: mod.default.parse.bind(mod.default) };
  } catch (importErr) {
    // `mermaid` is a hard dependency — a failed dynamic import is a real defect,
    // not a routine skip. It silently disables ALL diagram validation (no parse
    // gate, no invalid-block signal), so it's surfaced loudly.
    console.error(
      "[metrics] Mermaid module failed to load; diagram validation disabled",
      importErr instanceof Error ? importErr.message : String(importErr),
    );
    return [];
  }

  const invalid: InvalidMermaidBlock[] = [];
  for (const code of blocks) {
    const trimmed = code.trim();
    if (trimmed === "") {
      invalid.push({ code, diagramType: "unknown", reason: "empty" });
      continue;
    }
    const diagramType = detectDiagramType(code);
    if (diagramType === "unknown") {
      invalid.push({ code, diagramType, reason: "unknown_header" });
      continue;
    }
    try {
      await mermaid.parse(trimmed);
    } catch (err) {
      const isBrowserApiError =
        err instanceof ReferenceError ||
        (err instanceof Error && err.message.includes("DOMPurify"));
      if (isBrowserApiError) continue;
      invalid.push({ code, diagramType, reason: "parse_error" });
    }
  }
  return invalid;
}

export type StructuralMetrics = {
  pages: number;
  avgWords: number;
  avgH2Sections: number;
  avgWordsPerSection: number;
  thinPages: number;
  noisePages: number;
  citationDensityPer1k: number;
  pagesBelowMinCitationDensity: number;
  validDiagramPages: number;
  invalidDiagramPages: number;
};

export async function computeStructuralMetrics(pages: WikiPage[]): Promise<StructuralMetrics> {
  if (pages.length === 0) {
    return {
      pages: 0, avgWords: 0, avgH2Sections: 0, avgWordsPerSection: 0,
      thinPages: 0, noisePages: 0,
      citationDensityPer1k: 0, pagesBelowMinCitationDensity: 0,
      validDiagramPages: 0, invalidDiagramPages: 0,
    };
  }
  let totalWords = 0;
  let totalCitations = 0;
  let totalH2 = 0;
  let thinPages = 0;
  let noisePages = 0;
  let pagesBelowMinDensity = 0;
  let validDiagramPages = 0;
  let invalidDiagramPages = 0;

  for (const p of pages) {
    const words = wordCount(p.content);
    const cites = countCitations(p.content);
    totalWords += words;
    totalCitations += cites;
    totalH2 += countH2Sections(p.content);
    if (words < THIN_PAGE_MIN_WORDS) thinPages += 1;
    if (isNoiseTitle(p.title)) noisePages += 1;
    const density = words === 0 ? 0 : (cites / words) * 1000;
    if (density < MIN_CITATION_DENSITY_PER_1K) pagesBelowMinDensity += 1;

    const invalid = await findInvalidMermaidBlocks(p.content);
    const hasMermaid = p.content.includes("```mermaid");
    if (invalid.length > 0) invalidDiagramPages += 1;
    else if (hasMermaid) validDiagramPages += 1;
  }

  return {
    pages: pages.length,
    avgWords: Math.round(totalWords / pages.length),
    // avgH2Sections keeps one decimal — the lever moves it by ~half a section
    // and rounding to int would mask that. avgWordsPerSection = total words over
    // total sections (a wiki-wide ratio): if a "lengthen" change only splits
    // prose, total words stay flat while this number falls toward the peers'.
    avgH2Sections: Number((totalH2 / pages.length).toFixed(1)),
    avgWordsPerSection: Math.round(totalWords / Math.max(totalH2, 1)),
    thinPages,
    noisePages,
    citationDensityPer1k: Number(((totalCitations / Math.max(totalWords, 1)) * 1000).toFixed(2)),
    pagesBelowMinCitationDensity: pagesBelowMinDensity,
    validDiagramPages,
    invalidDiagramPages,
  };
}
