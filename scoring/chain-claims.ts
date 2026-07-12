// Ported from doc0 (commit 175c6b0e) — canonical scoring copy for published benchmarks.
//
// Chain-claim extraction + verification shared by the eval harness (paired
// depth readout) and the generation loop's chain-utilization check. Both
// consumers must share ONE definition of "chain claim" and "hop
// correctness" or the gate will pass what the eval fails.
//
// SEMANTIC RULE (all consumers): `edge-missing` is REPORTED, never treated
// as wrong. Graph recall is known-imperfect (callbacks, DI, dynamic
// dispatch), so hop verification is a RATE and no consumer may gate at 100%.

export type ChainClaim = { identifiers: string[]; kind: "arrow" | "mermaid" | "prose"; raw: string };

const MIN_CHAIN_IDENTIFIERS = 3;

// `dictAdd()` / Router.add / plain_name — backticks and trailing () optional.
const IDENT = "`?([A-Za-z_$][A-Za-z0-9_$]*(?:\\.[A-Za-z_$][A-Za-z0-9_$]*)?)(?:\\(\\))?`?";
const ARROW = "\\s*(?:→|->)\\s*";
const ARROW_CHAIN = new RegExp(`${IDENT}(?:${ARROW}${IDENT}){2,}`, "g");
// GFM fences open with ``` or ~~~; the backreference keeps them paired.
const FENCED_BLOCK = /(```|~~~)(\w*)\n([\s\S]*?)\1/g;
// Call arrows only (exactly one dash before >>). `-->>` is a reply/return
// arrow — including it would splice backward hops into forward call chains.
// The optional [+-] tolerates activation markers (->>+ / ->>-).
const MERMAID_SEQ_EDGE = /^\s*([A-Za-z_$][A-Za-z0-9_$]*)\s*->>[+-]?\s*([A-Za-z_$][A-Za-z0-9_$]*)\s*:/;
// Numbered-prose walkthrough line: "1. `dictRehash` is called…" / "3) `beta`…".
const NUMBERED_LINE = /^\s*(\d+)[.)]\s+(.*)$/;
// First backticked span on a numbered line. Captures the base identifier
// (with one optional direct dot qualifier, e.g. `Router.add`); after it,
// tolerates any mix of bracket spans and further dot segments
// (`ht_table[0]`, `arr[i][j]`, `ht[i].table[idx]`) plus a trailing `()` —
// the tail is matched but not captured, so `ht[i].table[idx]` yields "ht",
// never a later identifier on the same line. Known limit: spans with other
// operators inside the backticks (e.g. `d->ht[0].table`) do not match and
// terminate the run.
const BACKTICKED_IDENT =
  /`([A-Za-z_$][A-Za-z0-9_$]*(?:\.[A-Za-z_$][A-Za-z0-9_$]*)?)(?:\[[^\]`]*\]|\.[A-Za-z_$][A-Za-z0-9_$]*)*(?:\(\))?`/;

function cleanIdent(raw: string): string {
  return raw.trim().replace(/`/g, "").replace(/\(\)$/, "");
}

function chainsFromSequenceEdges(edges: Array<{ from: string; to: string }>): string[][] {
  const chains: string[][] = [];
  let current: string[] = [];
  for (const e of edges) {
    if (current.length > 0 && current[current.length - 1] === e.from) {
      current.push(e.to);
    } else {
      if (current.length >= MIN_CHAIN_IDENTIFIERS) chains.push(current);
      current = [e.from, e.to];
    }
  }
  if (current.length >= MIN_CHAIN_IDENTIFIERS) chains.push(current);
  return chains;
}

export function extractChainClaims(markdown: string): ChainClaim[] {
  const out: ChainClaim[] = [];

  // Mermaid sequence diagrams first, then strip ALL fences so code-block
  // arrows (C `ptr->next`) never masquerade as prose chains.
  for (const m of markdown.matchAll(FENCED_BLOCK)) {
    const [, , lang, body] = m;
    if (lang === "mermaid" && body.includes("sequenceDiagram")) {
      const edges: Array<{ from: string; to: string }> = [];
      for (const line of body.split("\n")) {
        const em = MERMAID_SEQ_EDGE.exec(line);
        if (em) edges.push({ from: em[1], to: em[2] });
      }
      for (const chain of chainsFromSequenceEdges(edges)) {
        out.push({ identifiers: chain, kind: "mermaid", raw: m[0].slice(0, 300) });
      }
    }
  }
  const prose = markdown.replace(FENCED_BLOCK, "");

  for (const m of prose.matchAll(ARROW_CHAIN)) {
    const identifiers = m[0].split(/→|->/).map(cleanIdent).filter((s) => s.length > 0);
    if (identifiers.length >= MIN_CHAIN_IDENTIFIERS) {
      out.push({ identifiers, kind: "arrow", raw: m[0].slice(0, 300) });
    }
  }

  // Numbered-prose walkthroughs (v1.1): the dominant format the model uses
  // for the required call-chain walkthrough ("1. `dictRehash` is called…").
  // A run = >=3 numbered lines with strictly increasing numbers, each carrying
  // at least one backticked identifier (the first is the step); a numbered
  // line without a backticked identifier terminates the run — ordinary
  // numbered lists die there. Over-capture is tolerated by design: verification
  // classifies non-code chains out, and utilization requires LCS >= 3 against
  // an injected chain.
  let run: Array<{ n: number; ident: string; raw: string }> = [];
  const flushRun = (): void => {
    if (run.length >= MIN_CHAIN_IDENTIFIERS) {
      out.push({
        identifiers: run.map((r) => r.ident),
        kind: "prose",
        raw: run.map((r) => r.raw).join("\n").slice(0, 300),
      });
    }
    run = [];
  };
  for (const line of prose.split("\n")) {
    if (line.trim() === "") continue; // blank lines tolerated inside a run
    const m = NUMBERED_LINE.exec(line);
    if (!m) {
      flushRun();
      continue;
    }
    const n = Number(m[1]);
    const ident = BACKTICKED_IDENT.exec(m[2]);
    const increasing = run.length === 0 || n > run[run.length - 1].n;
    if (!ident || !increasing) {
      flushRun();
      // a numbered line WITH an identifier but non-increasing number can
      // START a new run; one without an identifier cannot.
      if (ident && !increasing) run = [{ n, ident: ident[1], raw: line.trim() }];
      continue;
    }
    run.push({ n, ident: ident[1], raw: line.trim() });
  }
  flushRun();
  return out;
}

export type GraphIndex = { nodeNames: Set<string>; edges: Map<string, number | null> };
export type HopStatus = "verified" | "reversed" | "edge-missing" | "name-missing";
export type VerifiedHop = { from: string; to: string; status: HopStatus; confidence: number | null };
export type VerifiedChain = { claim: ChainClaim; nonCode: boolean; hops: VerifiedHop[] };
export type ChainMetrics = {
  pages: number; chains: number; chainsPerPage: number;
  hopVerificationRate: number | null;
  hopBreakdown: Record<HopStatus, number>;
};

const MIN_RESOLVED_FOR_CODE_CHAIN = 2;

export function bareName(identifier: string): string {
  const segments = identifier.split(".");
  return segments[segments.length - 1].toLowerCase();
}

export function edgeKey(from: string, to: string): string {
  return `${bareName(from)}->${bareName(to)}`;
}

export type GraphEdgeInput = { from: string; to: string; confidence?: number | null };

/**
 * Smart constructor for `GraphIndex`. `edges` keys MUST be produced by
 * `edgeKey()` — a key built any other way silently reads back as
 * "edge-missing" in `verifyChainClaims` instead of erroring, so hand-rolled
 * `GraphIndex` object literals are an easy way to introduce a false negative.
 * This factory owns that normalization (and the raw node names' `bareName`
 * normalization) so callers never key/name it wrong. When the same
 * (from, to) pair appears more than once, keeps the entry with the higher
 * confidence — matching the dedup semantics of the eval's DB-backed loader.
 */
export function buildGraphIndex(nodeNames: Iterable<string>, edges: GraphEdgeInput[]): GraphIndex {
  const names = new Set<string>();
  for (const name of nodeNames) names.add(bareName(name));

  const edgeMap = new Map<string, number | null>();
  for (const e of edges) {
    const key = edgeKey(e.from, e.to);
    const confidence = e.confidence ?? null;
    const prev = edgeMap.get(key);
    if (prev === undefined || (confidence ?? 0) > (prev ?? 0)) edgeMap.set(key, confidence);
  }
  return { nodeNames: names, edges: edgeMap };
}

export function verifyChainClaims(claims: ChainClaim[], graph: GraphIndex): VerifiedChain[] {
  return claims.map((claim) => {
    const resolved = claim.identifiers.filter((id) => graph.nodeNames.has(bareName(id)));
    if (resolved.length < MIN_RESOLVED_FOR_CODE_CHAIN) {
      return { claim, nonCode: true, hops: [] };
    }
    const hops: VerifiedHop[] = [];
    for (let i = 0; i + 1 < claim.identifiers.length; i++) {
      const from = claim.identifiers[i];
      const to = claim.identifiers[i + 1];
      const fromKnown = graph.nodeNames.has(bareName(from));
      const toKnown = graph.nodeNames.has(bareName(to));
      if (!fromKnown || !toKnown) {
        hops.push({ from, to, status: "name-missing", confidence: null });
      } else if (graph.edges.has(edgeKey(from, to))) {
        hops.push({ from, to, status: "verified", confidence: graph.edges.get(edgeKey(from, to)) ?? null });
      } else if (graph.edges.has(edgeKey(to, from))) {
        hops.push({ from, to, status: "reversed", confidence: graph.edges.get(edgeKey(to, from)) ?? null });
      } else {
        hops.push({ from, to, status: "edge-missing", confidence: null });
      }
    }
    return { claim, nonCode: false, hops };
  });
}

export function summarizeChainMetrics(perPage: VerifiedChain[][]): ChainMetrics {
  const hopBreakdown: Record<HopStatus, number> = {
    verified: 0, reversed: 0, "edge-missing": 0, "name-missing": 0,
  };
  let chains = 0;
  let hopsTotal = 0;
  for (const page of perPage) {
    for (const chain of page) {
      if (chain.nonCode) continue;
      chains += 1;
      for (const hop of chain.hops) {
        hopBreakdown[hop.status] += 1;
        hopsTotal += 1;
      }
    }
  }
  return {
    pages: perPage.length,
    chains,
    chainsPerPage: perPage.length === 0 ? 0 : Number((chains / perPage.length).toFixed(3)),
    hopVerificationRate: hopsTotal === 0 ? null : Number((hopBreakdown.verified / hopsTotal).toFixed(3)),
    hopBreakdown,
  };
}
