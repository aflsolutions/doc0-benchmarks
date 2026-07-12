import { readFile } from "node:fs/promises";
import { buildGraphIndex, type GraphIndex } from "./chain-claims.ts";

/** Schema of corpora/<corpus>/_graph-index.json (written by doc0's internal
 * export script): node names + calls-edges with confidence. */
export interface GraphIndexFile {
  schema_version: 1;
  wiki_id: string;
  node_names: string[];
  edges: Array<{ from: string; to: string; confidence: number | null }>;
}

export async function loadGraphIndexFile(path: string): Promise<GraphIndex> {
  const raw = JSON.parse(await readFile(path, "utf-8")) as GraphIndexFile;
  if (raw.schema_version !== 1) {
    throw new Error(`unsupported graph-index schema_version: ${String(raw.schema_version)}`);
  }
  return buildGraphIndex(raw.node_names, raw.edges);
}
