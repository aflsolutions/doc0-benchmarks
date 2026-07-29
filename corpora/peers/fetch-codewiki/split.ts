// Splits a CodeWiki extraction ({sha, markdown}) into per-h2-section page
// files. CodeWiki renders a repo's whole wiki as one long page; its h2
// sections are the per-topic "pages" scored against other peers. Content
// before the first h2 becomes an "Overview" page. A _meta.json alongside the
// pages records the generation commit captured by extract.js.
//
//   npx tsx split.ts <extract.json> <outDir>
import { mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export interface CodewikiExtraction {
  sha: string;
  markdown: string;
}

function slugify(title: string): string {
  return (
    title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80) ||
    "section"
  );
}

/** Writes one `<slug>.md` per non-empty h2 section plus `_meta.json`; returns
 * the number of page files written. */
export function splitExtraction(extraction: CodewikiExtraction, outDir: string): number {
  const { sha, markdown } = extraction;
  mkdirSync(outDir, { recursive: true });
  // Refetching into an existing dir must not leave pages from removed or
  // renamed sections behind — stale files would be scanned by
  // normalizeCitations and scored downstream while _meta.json.pages only
  // counts the fresh sections.
  for (const stale of readdirSync(outDir)) {
    if (stale.endsWith(".md")) rmSync(join(outDir, stale));
  }

  interface Section {
    title: string;
    body: string[];
  }
  const sections: Section[] = [{ title: "Overview", body: [] }];
  // "## " only opens a section OUTSIDE fenced code -- shell/Ruby/Python
  // comments inside a code block would otherwise split the fence across two
  // pages and mint a spurious section.
  let inFence = false;
  for (const line of markdown.split("\n")) {
    if (line.startsWith("```")) inFence = !inFence;
    const h2 = inFence ? null : /^## (.+)$/.exec(line);
    if (h2) sections.push({ title: h2[1].trim(), body: [] });
    else sections[sections.length - 1].body.push(line);
  }

  const used = new Set<string>();
  let written = 0;
  for (const section of sections) {
    const body = section.body.join("\n").trim();
    if (!body) continue;
    let slug = slugify(section.title);
    while (used.has(slug)) slug = `${slug}-2`;
    used.add(slug);
    writeFileSync(join(outDir, `${slug}.md`), `# ${section.title}\n\n${body}\n`);
    written++;
  }

  const meta = {
    source: "codewiki.google",
    commit: sha,
    fetchedAt: new Date().toISOString(),
    pages: written,
  };
  writeFileSync(join(outDir, "_meta.json"), JSON.stringify(meta, null, 2));
  return written;
}

const isCliEntry =
  process.argv[1] !== undefined && resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isCliEntry) {
  const [jsonPath, outDir] = process.argv.slice(2);
  if (!jsonPath || !outDir) throw new Error("usage: npx tsx split.ts <extract.json> <outDir>");
  const extraction = JSON.parse(readFileSync(jsonPath, "utf-8")) as CodewikiExtraction;
  const pages = splitExtraction(extraction, outDir);
  console.log(`sha=${extraction.sha || "UNKNOWN"} pages=${pages} -> ${outDir}`);
}
