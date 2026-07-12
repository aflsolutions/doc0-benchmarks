// Ported from doc0 (commit 175c6b0e) — canonical scoring copy for published benchmarks.
//
// Adaptation note: the "failure accounting" test below cites a real file+line
// range to make citation resolution succeed against `repoDir: "."`. The source
// test cited `scripts/wiki-eval/eval.ts` (a doc0-internal path that doesn't
// exist in this repo) — rewritten to cite `scoring/corpus.ts:17-26`, a real
// file in this repo with enough lines. This is a fixture-data substitution
// only; the assertions and judged logic are unchanged.

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtemp, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  extractClaimCitations,
  resolveCitation,
  resolveExcerpts,
  judgeAccuracy,
  groupClaimCitations,
  seededShuffle,
  type AccuracyJudgeFn,
  type ClaimCitation,
  type ClaimGroup,
} from "./judge-accuracy.ts";
import type { WikiPage } from "./corpus.ts";

describe("extractClaimCitations", () => {
  it("parses range-in-label (ours/deepwiki) and pairs the preceding claim", () => {
    const content = "The router compiles paths at insertion time.\nSources: [src/router.ts:22-48](url), [src/x.ts:9]()";
    const pairs = extractClaimCitations(content);
    expect(pairs).toHaveLength(2);
    expect(pairs[0]).toMatchObject({ filePath: "src/router.ts", startLine: 22, endLine: 48 });
    expect(pairs[0].claim).toContain("compiles paths");
    expect(pairs[1]).toMatchObject({ filePath: "src/x.ts", startLine: 9, endLine: 9 });
  });

  it("parses range-in-URL with repo-relative path (zread trailing + inline)", () => {
    const content = [
      "Smart router picks a strategy based on the route shape at registration.",
      "Sources: [router.ts](src/router/smart-router/router.ts#L4-L10)",
      "",
      "The base app dispatches through the middleware chain [hono-base.ts#L424-L442](src/hono-base.ts#L424-L442) on each request.",
    ].join("\n");
    const pairs = extractClaimCitations(content);
    expect(pairs).toHaveLength(2);
    expect(pairs[0]).toMatchObject({ filePath: "src/router/smart-router/router.ts", startLine: 4, endLine: 10 });
    expect(pairs[1]).toMatchObject({ filePath: "src/hono-base.ts", startLine: 424, endLine: 442 });
    expect(pairs[1].claim).toContain("dispatches through the middleware chain"); // inline: claim is the link's own line
  });
});

describe("resolveCitation", () => {
  let dir: string;
  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), "acc-"));
  });
  afterEach(async () => {
    await rm(dir, { recursive: true, force: true });
  });

  it("returns source text for an in-bounds range and null for out-of-bounds", async () => {
    await writeFile(join(dir, "f.ts"), "L1\nL2\nL3\n");
    expect(await resolveCitation(dir, { claim: "c", filePath: "f.ts", startLine: 1, endLine: 2 })).toContain("L1");
    expect(await resolveCitation(dir, { claim: "c", filePath: "f.ts", startLine: 9, endLine: 9 })).toBeNull();
    expect(await resolveCitation(dir, { claim: "c", filePath: "missing.ts", startLine: 1, endLine: 1 })).toBeNull();
  });
});

describe("resolveExcerpts", () => {
  let dir: string;
  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), "acc-"));
  });
  afterEach(async () => {
    await rm(dir, { recursive: true, force: true });
  });

  it("resolves every citation for a multi-hop claim, one header block per citation", async () => {
    await writeFile(join(dir, "a.ts"), Array.from({ length: 10 }, (_, i) => `a-line${i}`).join("\n"));
    await writeFile(join(dir, "b.ts"), Array.from({ length: 10 }, (_, i) => `b-line${i}`).join("\n"));
    const group: ClaimGroup = {
      claim: "A calls B via C",
      citations: [
        { filePath: "a.ts", startLine: 2, endLine: 3 },
        { filePath: "b.ts", startLine: 2, endLine: 3 },
      ],
    };
    const excerpt = await resolveExcerpts(dir, group);
    expect(excerpt).not.toBeNull();
    expect(excerpt).toContain("--- a.ts:2-3 ---");
    expect(excerpt).toContain("--- b.ts:2-3 ---");
  });

  it("caps the number of resolved excerpts at MAX_EXCERPTS_PER_CLAIM (5)", async () => {
    for (let i = 0; i < 7; i++) {
      await writeFile(join(dir, `f${i}.ts`), "x\n");
    }
    const group: ClaimGroup = {
      claim: "seven hops",
      citations: Array.from({ length: 7 }, (_, i) => ({ filePath: `f${i}.ts`, startLine: 1, endLine: 1 })),
    };
    const excerpt = await resolveExcerpts(dir, group);
    expect(excerpt).not.toBeNull();
    const headers = excerpt?.match(/--- f\d\.ts:1-1 ---/g) ?? [];
    expect(headers).toHaveLength(5);
    expect(excerpt).not.toContain("f5.ts");
    expect(excerpt).not.toContain("f6.ts");
  });

  it("clips a later excerpt once the MAX_EXCERPT_LINES_TOTAL (120) budget is exhausted", async () => {
    // Each raw citation resolves to 104 lines (startLine=10, endLine=109, with
    // the ±3/+2 context expansion resolveCitation applies). The first excerpt
    // fully fits (104 < 120); the second only has 16 lines of budget left.
    const big = Array.from({ length: 200 }, (_, i) => `line${i}`).join("\n");
    await writeFile(join(dir, "big1.ts"), big);
    await writeFile(join(dir, "big2.ts"), big);
    const group: ClaimGroup = {
      claim: "long chain",
      citations: [
        { filePath: "big1.ts", startLine: 10, endLine: 109 },
        { filePath: "big2.ts", startLine: 10, endLine: 109 },
      ],
    };
    const excerpt = await resolveExcerpts(dir, group);
    expect(excerpt).not.toBeNull();
    const parts = excerpt?.split("\n\n") ?? [];
    expect(parts).toHaveLength(2);
    const [first, second] = parts;
    const firstBodyLines = first.split("\n").length - 1; // minus the header line
    const secondBodyLines = second.split("\n").length - 1;
    expect(firstBodyLines).toBe(104); // fully included, well under the 120 budget
    expect(secondBodyLines).toBeLessThan(104); // clipped by the remaining budget
    expect(secondBodyLines).toBe(120 - firstBodyLines); // exactly what's left of the 120 total
  });
});

describe("judgeAccuracy", () => {
  let dir: string;
  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), "acc-"));
  });
  afterEach(async () => {
    await rm(dir, { recursive: true, force: true });
  });

  it("computes support + resolution rates, counting a broken citation as unresolved", async () => {
    await writeFile(join(dir, "f.ts"), "real line one\nreal line two\n");
    const pages: WikiPage[] = [{
      slug: "p",
      title: "P",
      verifiedClaimRatio: null,
      // Claim text must be >=20 chars and distinct per claim — extractClaimCitations falls
      // back to an empty claim for short lines, which would collapse both citations into a
      // single claim group and defeat the per-citation resolution assertions below.
      content: "Claim A describes the parser module in detail.\nSources: [f.ts:1-2](url)\n\nClaim B describes a file that does not exist.\nSources: [gone.ts:1]()",
    }];
    const judge: AccuracyJudgeFn = async () => "supported";
    const res = await judgeAccuracy(pages, dir, judge, 40);
    expect(res.sampled).toBe(2);
    expect(res.citationResolutionRate).toBe(0.5); // f.ts resolves, gone.ts broken
    expect(res.claimSupportRate).toBe(1); // the one resolved claim judged supported
  });
});

const cit = (claim: string, filePath: string, line: number): ClaimCitation =>
  ({ claim, filePath, startLine: line, endLine: line });

describe("groupClaimCitations", () => {
  it("groups citations sharing the same claim text", () => {
    const groups = groupClaimCitations([cit("A calls B via C", "a.ts", 1), cit("A calls B via C", "b.ts", 9), cit("other", "c.ts", 2)]);
    expect(groups).toHaveLength(2);
    expect(groups[0].citations).toHaveLength(2);
  });

  it("does not group empty-fallback claims — one single-citation group each", () => {
    // Empty claim = extraction found no substantial claim line; two such citations
    // share text only by accident and must not merge into one judged data point.
    const groups = groupClaimCitations([cit("", "a.ts", 1), cit("", "b.ts", 2)]);
    expect(groups).toHaveLength(2);
    expect(groups[0].citations).toHaveLength(1);
    expect(groups[1].citations).toHaveLength(1);
  });
});

describe("seededShuffle", () => {
  it("is deterministic for a given seed and differs across seeds", () => {
    const arr = [1, 2, 3, 4, 5, 6, 7, 8];
    expect(seededShuffle(arr, 42)).toEqual(seededShuffle(arr, 42));
    expect(seededShuffle(arr, 42)).not.toEqual(seededShuffle(arr, 43));
    expect([...seededShuffle(arr, 42)].sort((a, b) => a - b)).toEqual(arr);
  });
});

describe("judgeAccuracy — per-page grouping", () => {
  let dir: string;
  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), "acc-"));
  });
  afterEach(async () => {
    await rm(dir, { recursive: true, force: true });
  });

  it("keeps identical claim text on different pages as separate judged claims", async () => {
    await writeFile(join(dir, "a.ts"), "page one source line\n");
    await writeFile(join(dir, "b.ts"), "page two source line\n");
    // Same boilerplate claim sentence on two pages, citing unrelated files — must
    // NOT merge into one group with two citations (that collapses two data points
    // into one and feeds the judge unrelated excerpts under a single claim).
    const claim = "The middleware exposes a configurable handler entry point.";
    const pages: WikiPage[] = [
      { slug: "p1", title: "P1", verifiedClaimRatio: null, content: `${claim}\nSources: [a.ts:1](url)` },
      { slug: "p2", title: "P2", verifiedClaimRatio: null, content: `${claim}\nSources: [b.ts:1](url)` },
    ];
    const judgedExcerpts: string[] = [];
    const judge: AccuracyJudgeFn = async ({ sourceExcerpt }) => {
      judgedExcerpts.push(sourceExcerpt);
      return "supported";
    };
    const res = await judgeAccuracy(pages, dir, judge, 40, 42);
    expect(res.sampled).toBe(2); // two groups, one per page
    expect(judgedExcerpts).toHaveLength(2);
    const all = judgedExcerpts.join("\n");
    expect(all).toContain("a.ts:1-1");
    expect(all).toContain("b.ts:1-1");
    // neither judge call saw both files' excerpts merged together
    for (const e of judgedExcerpts) {
      expect(e.includes("a.ts:1-1") && e.includes("b.ts:1-1")).toBe(false);
    }
  });
});

describe("judgeAccuracy — failure accounting", () => {
  it("counts judge failures separately instead of scoring them unsupported", async () => {
    const pages = [{
      slug: "p", title: "P", verifiedClaimRatio: null,
      content: "The parser delegates to the tokenizer for splitting [a.ts:1](x/a.ts#L1)",
    }];
    // repoDir fixture: use the repo itself — cite a real file so resolution succeeds.
    const realPages = [{ ...pages[0], content: "Eval entry parses CLI args before loading corpora [scoring/corpus.ts:17-26](scoring/corpus.ts#L17-L26)" }];
    const failing = async (): Promise<"supported" | "unsupported"> => { throw new Error("api down"); };
    const res = await judgeAccuracy(realPages, ".", failing, 40, 42);
    expect(res.judgeFailures).toBe(1);
    expect(res.claimSupportRate).toBe(0); // no successful judgments — rate over zero successes
    expect(res.seed).toBe(42);
  });
});
