// Ported from doc0 (commit 175c6b0e) — canonical scoring copy for published benchmarks.
//
// Adapted for the public benchmarks repo: DB-backed loading (`loadOurWikiFromDb`)
// and doc0-internal imports have been removed — this module loads wiki pages
// from the filesystem only (`node:fs` / `node:path`).

import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";

export type WikiPage = {
  slug: string;
  title: string;
  content: string;
  verifiedClaimRatio: number | null;
};

export type ReferenceWiki = { source: string; pages: WikiPage[] };

/** Split a reference .md file into title + body. First line `# Title` → title; body is the rest. */
function parsePageFile(slug: string, raw: string): WikiPage {
  const lines = raw.split("\n");
  if (lines[0]?.startsWith("# ")) {
    return {
      slug,
      title: lines[0].slice(2).trim(),
      content: lines.slice(1).join("\n").trim(),
      verifiedClaimRatio: null,
    };
  }
  return { slug, title: slug.replace(/\.md$/, ""), content: raw.trim(), verifiedClaimRatio: null };
}

export async function loadReferenceWiki(dir: string, source: string): Promise<ReferenceWiki> {
  const files = (await readdir(dir)).filter((f) => f.endsWith(".md")).sort();
  const pages = await Promise.all(
    files.map(async (f) => parsePageFile(f, await readFile(join(dir, f), "utf-8"))),
  );
  return { source, pages };
}

export async function loadWikiDir(dir: string): Promise<WikiPage[]> {
  return (await loadReferenceWiki(dir, "ours")).pages;
}
