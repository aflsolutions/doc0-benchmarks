import { describe, it, expect } from "vitest";
import { mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { loadGraphIndexFile, type GraphIndexFile } from "./graph-index.ts";
import { verifyChainClaims, type ChainClaim } from "./chain-claims.ts";

async function writeGraphIndexFile(overrides: Partial<GraphIndexFile> = {}): Promise<string> {
  const dir = await mkdtemp(join(tmpdir(), "graph-index-"));
  const path = join(dir, "_graph-index.json");
  const file: GraphIndexFile = {
    schema_version: 1,
    wiki_id: "test-wiki",
    node_names: ["dictAdd", "dictAddRaw"],
    edges: [{ from: "dictAdd", to: "dictAddRaw", confidence: 0.9 }],
    ...overrides,
  };
  await writeFile(path, JSON.stringify(file));
  return path;
}

describe("loadGraphIndexFile", () => {
  it("loads a graph-index file that verifyChainClaims resolves a matching hop against", async () => {
    const path = await writeGraphIndexFile();
    const graph = await loadGraphIndexFile(path);

    const claim: ChainClaim = { identifiers: ["dictAdd", "dictAddRaw"], kind: "arrow", raw: "dictAdd -> dictAddRaw" };
    const [verified] = verifyChainClaims([claim], graph);
    expect(verified.nonCode).toBe(false);
    expect(verified.hops[0]?.status).toBe("verified");
    expect(verified.hops[0]?.confidence).toBe(0.9);
  });

  it("throws on an unsupported schema_version", async () => {
    const dir = await mkdtemp(join(tmpdir(), "graph-index-"));
    const path = join(dir, "_graph-index.json");
    await writeFile(
      path,
      JSON.stringify({ schema_version: 2, wiki_id: "test-wiki", node_names: [], edges: [] }),
    );
    await expect(loadGraphIndexFile(path)).rejects.toThrow(/unsupported graph-index schema_version/);
  });
});
