// Ported from doc0 (commit 175c6b0e) — canonical scoring copy for published benchmarks.

import { describe, it, expect } from "vitest";
import {
  medianVerdict, judgeComparative, sampleForJudge, aggregateCell,
  DIMENSIONS, type JudgeFn, type Verdict,
} from "./judge-comparative.ts";
import type { WikiPage, ReferenceWiki } from "./corpus.ts";

describe("medianVerdict", () => {
  it("takes the median margin and derives the verdict from its sign", () => {
    const v = (margin: number, rationale = "r"): Verdict => ({
      verdict: margin < 0 ? "worse" : margin > 0 ? "better" : "equal",
      margin, rationale,
    });
    expect(medianVerdict([v(-2), v(-1), v(1)]).margin).toBe(-1);
    expect(medianVerdict([v(-2), v(-1), v(1)]).verdict).toBe("worse");
  });
});

describe("sampleForJudge", () => {
  it("is page-count-stable: samples at most maxPages, independent of page length", () => {
    const pages: WikiPage[] = Array.from({ length: 20 }, (_, i) => ({
      slug: `p${i}`, title: `P${i}`, content: "x".repeat(500), verifiedClaimRatio: null,
    }));
    const out = sampleForJudge(pages, 3);
    expect(out).toContain("## P0");
    expect(out).toContain("## P2");
    expect(out).not.toContain("## P3"); // 4th page never sampled
  });
  it("caps each page at perPageChars and marks the truncation, not a global budget", () => {
    const pages: WikiPage[] = [
      { slug: "a", title: "A", content: "x".repeat(1000), verifiedClaimRatio: null },
    ];
    const out = sampleForJudge(pages, 12, 100);
    expect(out).toContain("[page truncated for judge]");
    expect(out.length).toBeLessThan(300); // ~100 body chars, nowhere near the full 1000
  });
});

const mkPages = (n: number): WikiPage[] =>
  Array.from({ length: n }, (_, i) => ({ slug: `p${i}`, title: `P${i}`, content: "word ".repeat(50), verifiedClaimRatio: null }));
const refs: ReferenceWiki[] = [{ source: "deepwiki", pages: mkPages(3) }];

describe("judgeComparative — both orders", () => {
  it("calls the judge twice per repeat, once per order, and averages", async () => {
    const seenOrders: boolean[] = [];
    const judge: JudgeFn = async ({ oursIsA }) => {
      seenOrders.push(oursIsA);
      return { verdict: "better", margin: oursIsA ? 2 : 1, rationale: "r" };
    };
    const res = await judgeComparative(mkPages(3), refs, judge, 1);
    expect(seenOrders).toEqual(expect.arrayContaining([true, false]));
    expect(seenOrders).toHaveLength(2 * DIMENSIONS.length);
    const cell = res.perReference.deepwiki.depth;
    expect(cell.margins).toEqual([1.5]); // mean of 2 and 1
    expect(cell.judgeFailures).toBe(0);
    expect(cell.unreliable).toBe(false);
  });

  it("excludes failed calls and marks the cell UNRELIABLE past 1/3 failures", async () => {
    const judge: JudgeFn = async () => { throw new Error("boom"); };
    const res = await judgeComparative(mkPages(3), refs, judge, 1);
    const cell = res.perReference.deepwiki.depth;
    expect(cell.judgeFailures).toBe(2);
    expect(cell.unreliable).toBe(true);
    expect(cell.margin).toBe(0);
  });

  it("exposes the judged sample detail", async () => {
    const judge: JudgeFn = async () => ({ verdict: "equal", margin: 0, rationale: "r" });
    const res = await judgeComparative(mkPages(20), refs, judge, 1);
    expect(res.sampleDetail.ours).toHaveLength(12); // DEFAULT_MAX_PAGES
    expect(res.sampleDetail.ours[0]).toMatchObject({ slug: "p0", truncated: false });
    expect(res.sampleDetail.references.deepwiki).toHaveLength(3);
  });
});

describe("aggregateCell", () => {
  it("takes the median of repeat means and borrows the closest run's rationale", () => {
    const runs: Verdict[] = [
      { verdict: "worse", margin: -2, rationale: "worst" },
      { verdict: "equal", margin: 0, rationale: "mid" },
    ];
    const cell = aggregateCell(runs, [-2, -1, 0], 0, 6);
    expect(cell.margin).toBe(-1);
    expect(cell.verdict).toBe("worse");
    expect(cell.margins).toEqual([-2, -1, 0]);
  });
});

describe("judgeComparative — bestPeer", () => {
  const v = (margin: number, rationale = "r"): Verdict => ({
    verdict: margin < 0 ? "worse" : margin > 0 ? "better" : "equal",
    margin, rationale,
  });

  it("picks the reference we trail by the most among RELIABLE cells", async () => {
    const ours = mkPages(1);
    const twoRefs: ReferenceWiki[] = [
      { source: "deepwiki", pages: mkPages(1) },
      { source: "zread", pages: mkPages(1) },
    ];
    // deepwiki always -2 (we trail badly); zread always 0 (equal). Both reliable.
    const judge: JudgeFn = async ({ referenceSource }) =>
      referenceSource === "deepwiki" ? v(-2) : v(0);
    const res = await judgeComparative(ours, twoRefs, judge, 3);
    expect(res.perReference.deepwiki.depth.unreliable).toBe(false);
    expect(res.perReference.zread.depth.unreliable).toBe(false);
    expect(res.bestPeer.depth?.source).toBe("deepwiki");
    expect(res.bestPeer.depth?.verdict.margin).toBe(-2);
  });

  it("excludes an unreliable cell from the ranking even when its fabricated margin looks toughest", async () => {
    const ours = mkPages(1);
    const twoRefs: ReferenceWiki[] = [
      { source: "shaky", pages: mkPages(1) },
      { source: "solid", pages: mkPages(1) },
    ];
    // "shaky" fails every call for depth (fabricated equal/margin:0, unreliable).
    // "solid" always succeeds with margin +1 (we're ahead of it) — reliable.
    // Without the fix, shaky's fabricated 0 < solid's +1, so shaky would
    // incorrectly win the "toughest" ranking.
    const judge: JudgeFn = async ({ dimension, referenceSource }) => {
      if (dimension === "depth" && referenceSource === "shaky") throw new Error("judge outage");
      return v(1);
    };
    const res = await judgeComparative(ours, twoRefs, judge, 3);
    expect(res.perReference.shaky.depth.unreliable).toBe(true);
    expect(res.perReference.solid.depth.unreliable).toBe(false);
    expect(res.bestPeer.depth?.source).toBe("solid");
    expect(res.bestPeer.depth?.verdict.unreliable).toBe(false);
  });

  it("reports no bestPeer for a dimension when every reference is unreliable", async () => {
    const ours = mkPages(1);
    const twoRefs: ReferenceWiki[] = [
      { source: "deepwiki", pages: mkPages(1) },
      { source: "zread", pages: mkPages(1) },
    ];
    // Every call for "depth" fails, for both references — no reliable cell exists.
    const judge: JudgeFn = async ({ dimension }) => {
      if (dimension === "depth") throw new Error("judge outage");
      return v(0);
    };
    const res = await judgeComparative(ours, twoRefs, judge, 3);
    expect(res.perReference.deepwiki.depth.unreliable).toBe(true);
    expect(res.perReference.zread.depth.unreliable).toBe(true);
    expect(res.bestPeer.depth).toBeUndefined();
    // Sanity: a dimension where calls succeed still gets a bestPeer.
    expect(res.bestPeer.coherence).toBeDefined();
  });
});
