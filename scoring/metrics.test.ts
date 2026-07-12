// Ported from doc0 (commit 175c6b0e) — canonical scoring copy for published benchmarks.

import { describe, it, expect } from "vitest";
import { wordCount, countCitations, countH2Sections, computeStructuralMetrics, THIN_PAGE_MIN_WORDS } from "./metrics.ts";
import type { WikiPage } from "./corpus.ts";

const page = (over: Partial<WikiPage>): WikiPage => ({
  slug: "s", title: "T", content: "", verifiedClaimRatio: null, ...over,
});

describe("wordCount / countCitations", () => {
  it("counts whitespace-separated words", () => {
    expect(wordCount("one two  three\nfour")).toBe(4);
  });
  it("counts citations across all three formats (blob-URL, empty-paren, zread #L inline)", () => {
    const c = [
      "Sources: [src/a.ts:1-5](https://github.com/o/r/blob/main/src/a.ts#L1-L5), [src/b.ts:9]()",
      "inline ref [hono-base.ts#L424-L442](src/hono-base.ts#L424-L442) and [router.ts](src/router.ts#L29-L52)",
    ].join("\n");
    expect(countCitations(c)).toBe(4);
  });
});

describe("countH2Sections", () => {
  it("counts H2 headings, excludes H3, and ignores ## inside fenced code", () => {
    const content = [
      "## Real Section One",
      "prose here",
      "### A subsection (H3, not counted)",
      "## Real Section Two",
      "```bash",
      "## this is a shell comment, not a heading",
      "```",
    ].join("\n");
    expect(countH2Sections(content)).toBe(2);
  });
  it("returns 0 for prose with no H2 headings", () => {
    expect(countH2Sections("just some prose\nand more")).toBe(0);
  });
});

describe("computeStructuralMetrics", () => {
  it("computes avgH2Sections (one decimal) and avgWordsPerSection (total words / total sections)", async () => {
    // page A: "## S1\nalpha beta\n## S2\ngamma" -> wordCount 7 ("##","S1","alpha","beta","##","S2","gamma"), 2 H2
    // page B: "## S3\ndelta" -> wordCount 3 ("##","S3","delta"), 1 H2
    // totals: 10 words, 3 sections -> avgH2Sections (2+1)/2 = 1.5, avgWordsPerSection round(10/3) = 3
    const a = page({ content: "## S1\nalpha beta\n## S2\ngamma" });
    const b = page({ content: "## S3\ndelta" });
    const m = await computeStructuralMetrics([a, b]);
    expect(m.avgH2Sections).toBe(1.5);
    expect(m.avgWordsPerSection).toBe(3);
  });

  it("flags thin pages by WORD count, not chars", async () => {
    const thin = page({ content: "word ".repeat(THIN_PAGE_MIN_WORDS - 50) });
    const fat = page({ content: "word ".repeat(THIN_PAGE_MIN_WORDS + 50) });
    const m = await computeStructuralMetrics([thin, fat]);
    expect(m.thinPages).toBe(1);
  });

  it("counts an unparseable mermaid block as an invalid-diagram page", async () => {
    const bad = page({ content: "```mermaid\nflowchart TD\n  A --< B\n```" });
    const m = await computeStructuralMetrics([bad]);
    expect(m.invalidDiagramPages).toBe(1);
    expect(m.validDiagramPages).toBe(0);
  });
});
