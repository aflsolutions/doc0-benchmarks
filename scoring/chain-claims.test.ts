// Ported from doc0 (commit 175c6b0e) — canonical scoring copy for published benchmarks.

import { describe, it, expect } from "vitest";
import { extractChainClaims, verifyChainClaims, summarizeChainMetrics, bareName, edgeKey, buildGraphIndex, type ChainClaim, type GraphIndex } from "./chain-claims.ts";

describe("extractChainClaims — arrow chains", () => {
  it("extracts a backticked arrow chain of >=3 identifiers", () => {
    const md = "Adding an entry: `dictAdd()` → `dictAddRaw()` → `dictFindLinkForInsert()` walks the table.";
    const claims = extractChainClaims(md);
    expect(claims).toHaveLength(1);
    expect(claims[0].identifiers).toEqual(["dictAdd", "dictAddRaw", "dictFindLinkForInsert"]);
    expect(claims[0].kind).toBe("arrow");
  });

  it("handles ASCII arrows and Owner.method qualifiers", () => {
    const claims = extractChainClaims("`Router.add` -> `Node.insert` -> `Node.split`");
    expect(claims[0].identifiers).toEqual(["Router.add", "Node.insert", "Node.split"]);
  });

  it("ignores 2-identifier arrows and arrows inside non-mermaid code fences", () => {
    const md = "`a()` → `b()`\n```c\nptr->next->prev->self\n```";
    expect(extractChainClaims(md)).toHaveLength(0);
  });

  it("ignores arrows inside tilde (~~~) code fences", () => {
    const md = "~~~c\nptr->next->prev->self\n~~~";
    expect(extractChainClaims(md)).toHaveLength(0);
  });
});

describe("extractChainClaims — mermaid sequence diagrams", () => {
  it("reconstructs an ordered chain from consecutive ->> edges", () => {
    const md = "```mermaid\nsequenceDiagram\n  App->>Router: add\n  Router->>Node: insert\n  Node->>Store: write\n```";
    const claims = extractChainClaims(md);
    expect(claims).toHaveLength(1);
    expect(claims[0].identifiers).toEqual(["App", "Router", "Node", "Store"]);
    expect(claims[0].kind).toBe("mermaid");
  });

  it("starts a new chain when an edge does not continue the previous one", () => {
    const md = "```mermaid\nsequenceDiagram\n  A->>B: x\n  C->>D: y\n  D->>E: z\n```";
    const claims = extractChainClaims(md);
    // A->>B is only 2 identifiers (dropped); C->>D->>E is 3 (kept).
    expect(claims).toHaveLength(1);
    expect(claims[0].identifiers).toEqual(["C", "D", "E"]);
  });

  it("excludes -->> reply arrows so backward hops never splice into call chains", () => {
    const md =
      "```mermaid\nsequenceDiagram\n  App->>Router: add\n  Router-->>App: ok\n  App->>Node: insert\n  Node->>Store: write\n```";
    const claims = extractChainClaims(md);
    // App->>Router alone is 2 idents (dropped); App->>Node->>Store is kept.
    expect(claims).toHaveLength(1);
    expect(claims[0].identifiers).toEqual(["App", "Node", "Store"]);
  });

  it("parses a mermaid sequence diagram inside a tilde (~~~) fence", () => {
    const md = "~~~mermaid\nsequenceDiagram\n  App->>Router: add\n  Router->>Node: insert\n  Node->>Store: write\n~~~";
    const claims = extractChainClaims(md);
    expect(claims).toHaveLength(1);
    expect(claims[0].identifiers).toEqual(["App", "Router", "Node", "Store"]);
    expect(claims[0].kind).toBe("mermaid");
  });
});

describe("verifyChainClaims", () => {
  const claim = (ids: string[]): ChainClaim => ({ identifiers: ids, kind: "arrow", raw: ids.join(" -> ") });
  const graph: GraphIndex = buildGraphIndex(
    ["dictAdd", "dictAddRaw", "insert", "split"],
    [
      { from: "dictAdd", to: "dictAddRaw", confidence: 1 },
      { from: "split", to: "insert", confidence: 0.5 },
    ],
  );

  it("classifies verified, reversed, edge-missing, and name-missing hops", () => {
    const [v] = verifyChainClaims([claim(["dictAdd", "dictAddRaw", "insert", "ghost"])], graph);
    expect(v.nonCode).toBe(false);
    expect(v.hops.map((h) => h.status)).toEqual(["verified", "edge-missing", "name-missing"]);
    expect(v.hops[0].confidence).toBe(1);
  });

  it("flags reversed edges", () => {
    const [v] = verifyChainClaims([claim(["insert", "split", "insert"])], graph);
    expect(v.hops[0].status).toBe("reversed"); // split->insert exists, insert->split does not
  });

  it("marks chains with <2 resolvable names as non-code and skips hops", () => {
    const [v] = verifyChainClaims([claim(["Home", "Docs", "Page"])], graph);
    expect(v.nonCode).toBe(true);
    expect(v.hops).toHaveLength(0);
  });

  it("MIN_RESOLVED_FOR_CODE_CHAIN boundary: resolved === 1 stays non-code", () => {
    // Only "dictAdd" resolves; "unknownB"/"unknownC" don't — 1 resolved, below the threshold.
    const [v] = verifyChainClaims([claim(["dictAdd", "unknownB", "unknownC"])], graph);
    expect(v.nonCode).toBe(true);
    expect(v.hops).toHaveLength(0);
  });

  it("MIN_RESOLVED_FOR_CODE_CHAIN boundary: resolved === 2 is treated as a code chain", () => {
    // "dictAdd" and "dictAddRaw" resolve; "unknownC" doesn't — exactly 2 resolved, at the threshold.
    const [v] = verifyChainClaims([claim(["dictAdd", "dictAddRaw", "unknownC"])], graph);
    expect(v.nonCode).toBe(false);
    expect(v.hops.length).toBeGreaterThan(0);
  });
});

describe("summarizeChainMetrics", () => {
  const claim = (ids: string[]): ChainClaim => ({ identifiers: ids, kind: "arrow", raw: ids.join(" -> ") });
  const graph: GraphIndex = buildGraphIndex(
    ["dictAdd", "dictAddRaw", "insert", "split"],
    [
      { from: "dictAdd", to: "dictAddRaw", confidence: 1 },
      { from: "split", to: "insert", confidence: 0.5 },
    ],
  );

  it("computes chains/page and hop verification rate over code chains only", () => {
    const verified = verifyChainClaims([claim(["dictAdd", "dictAddRaw", "insert"])], graph);
    const nonCode = verifyChainClaims([claim(["Home", "Docs", "Page"])], graph);
    const m = summarizeChainMetrics([verified, nonCode, []]);
    expect(m.pages).toBe(3);
    expect(m.chains).toBe(1);
    expect(m.chainsPerPage).toBeCloseTo(0.333, 2);
    expect(m.hopVerificationRate).toBe(0.5); // 1 verified of 2 hops
    expect(m.hopBreakdown["edge-missing"]).toBe(1);
  });

  it("returns null rate when no code chains exist (never divide by zero)", () => {
    expect(summarizeChainMetrics([[]]).hopVerificationRate).toBeNull();
  });

  it("returns chainsPerPage 0 (not NaN) for zero pages", () => {
    const m = summarizeChainMetrics([]);
    expect(m.pages).toBe(0);
    expect(m.chains).toBe(0);
    expect(m.chainsPerPage).toBe(0);
    expect(m.hopVerificationRate).toBeNull();
  });
});

describe("bareName", () => {
  it("lowercases and takes the final dot segment", () => {
    expect(bareName("Router.add")).toBe("add");
    expect(bareName("dictAdd")).toBe("dictadd");
  });
});

describe("edgeKey", () => {
  it("combines bareName of both ends with ->", () => {
    expect(edgeKey("dictAdd", "dictAddRaw")).toBe("dictadd->dictaddraw");
    expect(edgeKey("split", "insert")).toBe("split->insert");
  });
});

describe("buildGraphIndex", () => {
  const claim = (ids: string[]): ChainClaim => ({ identifiers: ids, kind: "arrow", raw: ids.join(" -> ") });

  it("produces a GraphIndex that verifyChainClaims resolves a hop against", () => {
    const graph = buildGraphIndex(
      ["dictAdd", "dictAddRaw", "dictFindLinkForInsert"],
      [{ from: "dictAdd", to: "dictAddRaw", confidence: 0.9 }],
    );
    const [v] = verifyChainClaims([claim(["dictAdd", "dictAddRaw", "dictFindLinkForInsert"])], graph);
    expect(v.nonCode).toBe(false);
    expect(v.hops[0].status).toBe("verified");
    expect(v.hops[0].confidence).toBe(0.9);
    // The second hop has no matching edge — edge-missing, not a false verify.
    expect(v.hops[1].status).toBe("edge-missing");
  });

  it("bareNames node names on the way in", () => {
    const graph = buildGraphIndex(["Router.add"], []);
    expect(graph.nodeNames.has("add")).toBe(true);
  });

  it("keeps the higher-confidence entry when the same (from, to) pair is inserted twice", () => {
    const graph = buildGraphIndex(
      ["a", "b"],
      [
        { from: "a", to: "b", confidence: 0.2 },
        { from: "a", to: "b", confidence: 0.9 },
      ],
    );
    expect(graph.edges.get(edgeKey("a", "b"))).toBe(0.9);
  });
});

describe("extractChainClaims — numbered-prose walkthroughs", () => {
  it("extracts a numbered walkthrough taking the first backticked identifier per line", () => {
    const md = [
      "### Rehashing Execution Walkthrough:",
      "1. `dictRehash` is called with a step count `n`.",
      "2. The code iterates through buckets in `ht_table[0]` starting at `rehashidx`.",
      "3. For each non-empty bucket, `rehashEntriesInBucketAtIndex` is called.",
    ].join("\n");
    const claims = extractChainClaims(md);
    expect(claims).toHaveLength(1);
    expect(claims[0].kind).toBe("prose");
    expect(claims[0].identifiers).toEqual(["dictRehash", "ht_table", "rehashEntriesInBucketAtIndex"]);
  });

  it("tolerates blank lines, N) style, and non-consecutive increasing numbers", () => {
    const md = "1) `alpha` starts.\n\n3) `beta` continues.\n\n7) `gamma` finishes.";
    const claims = extractChainClaims(md);
    expect(claims).toHaveLength(1);
    expect(claims[0].identifiers).toEqual(["alpha", "beta", "gamma"]);
  });

  it("terminates the run at a numbered line without a backticked identifier and at non-increasing numbers", () => {
    const md = "1. `a` x\n2. plain text step\n3. `b` y\n4. `c` z";
    // run 1 dies at line 2 (1 step < 3); run restarts at 3 -> only 2 steps -> nothing extracted
    expect(extractChainClaims(md).filter((c) => c.kind === "prose")).toHaveLength(0);
    const md2 = "2. `a`\n1. `b`\n2. `c`"; // non-increasing breaks the run
    expect(extractChainClaims(md2).filter((c) => c.kind === "prose")).toHaveLength(0);
  });

  it("ignores numbered lines inside code fences (already stripped) and lists without backticks", () => {
    const md = "```\n1. `x`\n2. `y`\n3. `z`\n```\n1. one\n2. two\n3. three";
    expect(extractChainClaims(md).filter((c) => c.kind === "prose")).toHaveLength(0);
  });

  it("still extracts arrow and mermaid claims alongside prose", () => {
    const md = "`a()` → `b()` → `c()`\n1. `p` s\n2. `q` t\n3. `r` u";
    const kinds = extractChainClaims(md).map((c) => c.kind).sort();
    expect(kinds).toEqual(["arrow", "prose"]);
  });

  it("survives a step line whose only span is multi-bracket, capturing the base identifier", () => {
    const md = "1. `dictScan` starts.\n2. Each bucket `arr[i][j]` is visited.\n3. `dictNext` advances.";
    const claims = extractChainClaims(md);
    expect(claims).toHaveLength(1);
    expect(claims[0].identifiers).toEqual(["dictScan", "arr", "dictNext"]);
  });

  it("captures the FIRST span's base identifier when brackets and dots interleave", () => {
    const md = "1. `ht[i].table[idx]` is scanned by `dictScan`.\n2. `expand` grows it.\n3. `rehash` finishes.";
    const claims = extractChainClaims(md);
    expect(claims).toHaveLength(1);
    expect(claims[0].identifiers).toEqual(["ht", "expand", "rehash"]);
  });

  it("extracts a run restarted at a non-increasing number when the restarted run reaches 3 steps", () => {
    const md = "5. `a` x\n1. `b` y\n2. `c` z\n3. `d` w";
    const claims = extractChainClaims(md).filter((c) => c.kind === "prose");
    expect(claims).toHaveLength(1);
    expect(claims[0].identifiers).toEqual(["b", "c", "d"]);
  });
});
