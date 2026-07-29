// Re-downloads peer wiki pages from their public sites and verifies each
// page's content against the SHA-256 recorded at scoring time
// (corpora/peers/*.manifest.json). A mismatch means the peer's hosted
// content has changed since it was scored (or, less commonly for DeepWiki --
// see the caveat in deepwiki-*.manifest.json's _description -- a
// normalization difference between the original capture method and this
// script's HTTP-only re-fetch). Scoring against fresh content is legitimate;
// silently treating it as the originally-scored content is not, so a
// mismatch is a hard failure unless --allow-drift is passed.
//
//   pnpm peers:fetch [--allow-drift]
//
// Both DeepWiki and zread are Next.js apps that stream server-rendered page
// data via `self.__next_f.push([1, "<json-string>"])` React-Flight chunks in
// the initial HTML -- no headless browser is required, a plain HTTP GET with
// a browser User-Agent returns the full payload. zread serves ONE page's
// markdown per URL (frontmatter-tagged with the served slug, which must be
// checked against the requested slug -- zread 200s a fallback Overview page
// for unknown slugs instead of 404ing). DeepWiki instead embeds every page of
// the wiki in any single valid page load, each as its own `# Title\n...`
// chunk, so one fetch per manifest is enough.
import { readFile, readdir, mkdir, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";

const PEERS_DIR = dirname(fileURLToPath(import.meta.url));
const RESULTS_DIR = join(PEERS_DIR, "..", "..", "results", "peers");

const BROWSER_UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36";

interface PeerManifestPage {
  slug: string;
  title: string;
  url: string;
  sha256: string;
}

interface PeerManifest {
  schema_version: 1;
  peer: string;
  repo: string;
  base_url: string;
  scored_at: string;
  pages: PeerManifestPage[];
  _description?: string;
}

interface Mismatch {
  manifest: string;
  slug: string;
  url: string;
  expected_sha256: string;
  actual_sha256: string | null;
  note?: string;
}

function sha256(content: string): string {
  return createHash("sha256").update(content, "utf-8").digest("hex");
}

async function listManifests(): Promise<string[]> {
  const entries = await readdir(PEERS_DIR);
  return entries.filter((f) => f.endsWith(".manifest.json")).sort();
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** zread's backend intermittently 504s (or serves a thin, JS-less placeholder
 * that never contains the flight payload) -- retry with backoff rather than
 * treat a transient blip as a real content mismatch. Ported from
 * scrape-zread.py's `fetch()`. */
const FETCH_ATTEMPTS = 4;

async function fetchHtml(url: string): Promise<string> {
  let lastError = "";
  for (let attempt = 0; attempt < FETCH_ATTEMPTS; attempt++) {
    try {
      const res = await fetch(url, { headers: { "User-Agent": BROWSER_UA } });
      if (!res.ok) {
        lastError = `HTTP ${res.status}`;
      } else {
        const html = await res.text();
        if (html.includes("self.__next_f") && html.length > 50_000) return html;
        lastError = `thin render (${html.length} bytes)`;
      }
    } catch (err) {
      lastError = err instanceof Error ? err.message : String(err);
    }
    await sleep(3000 + 2000 * attempt);
  }
  throw new Error(`fetch failed for ${url}: ${lastError}`);
}

/** Both peer sites stream page data as React-Flight `self.__next_f.push([1,
 * "<json-string>"])` chunks. Each chunk's inner value is itself a JSON
 * string literal -- decode it once to get the raw text. A rare
 * truncated/malformed chunk must not abort the whole page (matches the
 * internal scrape-zread.py's documented gotcha), so decode failures are
 * skipped rather than thrown. */
function flightChunks(html: string): string[] {
  const out: string[] = [];
  const re = /self\.__next_f\.push\(\[1,(".*?")\]\)/gs;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    try {
      const parsed: unknown = JSON.parse(m[1]);
      if (typeof parsed === "string") out.push(parsed);
    } catch {
      continue;
    }
  }
  return out;
}

/** zread: the page body is the one flight chunk with markdown citation links
 * (`[file](path#Lx)`) and no pre-rendered React element tuples. zread 200s
 * an Overview fallback for any unknown slug -- the chunk's own
 * `slug:<requested>` frontmatter must match what we asked for, or this is a
 * fake/fallback page and must be rejected rather than silently scored. */
function extractZreadMarkdown(html: string, expectedSlug: string): string | null {
  const candidates = flightChunks(html).filter(
    (ch) => (ch.match(/\]\([^)]*#L\d/g)?.length ?? 0) > 2 && !ch.includes('["$","'),
  );
  if (candidates.length === 0) return null;
  const md = candidates[0];
  const slugMatch = /^---\nslug:(\S+)/.exec(md);
  if (!slugMatch || slugMatch[1] !== expectedSlug) return null;
  return md.replace(/^---\n[\s\S]*?\n---\n+/, "").trim();
}

async function fetchZreadPage(page: PeerManifestPage): Promise<string> {
  const urlSlug = page.url.split("/").pop() ?? "";
  const html = await fetchHtml(page.url);
  const md = extractZreadMarkdown(html, urlSlug);
  if (md === null) {
    throw new Error(`no matching zread page content found at ${page.url} (fallback page or unparseable chunk)`);
  }
  const body = md.startsWith("# ") ? md : `# ${page.title}\n\n${md}`;
  return `${body.trimEnd()}\n`;
}

/** DeepWiki embeds every page of the wiki in a single load's flight payload,
 * each as its own `# Title\n...` chunk -- fetch once per manifest (using the
 * first page's URL as the entry point) and index by title. */
function extractDeepwikiPagesByTitle(html: string): Map<string, string> {
  const byTitle = new Map<string, string>();
  for (const chunk of flightChunks(html)) {
    if (!chunk.startsWith("# ")) continue;
    const title = chunk.slice(2).split("\n")[0].trim();
    byTitle.set(title, `${chunk.trim()}\n`);
  }
  return byTitle;
}

async function main(): Promise<void> {
  const { values } = parseArgs({
    options: { "allow-drift": { type: "boolean", default: false } },
  });
  const allowDrift = values["allow-drift"];

  const manifestFiles = await listManifests();
  if (manifestFiles.length === 0) {
    throw new Error(`no *.manifest.json files found in ${PEERS_DIR}`);
  }

  const mismatches: Mismatch[] = [];
  const missingCodewiki: Array<{ manifest: string; command: string }> = [];
  for (const manifestFile of manifestFiles) {
    const manifest = JSON.parse(await readFile(join(PEERS_DIR, manifestFile), "utf-8")) as PeerManifest;
    const dirName = manifestFile.replace(/\.manifest\.json$/, "");
    const outDir = join(RESULTS_DIR, dirName);
    await mkdir(outDir, { recursive: true });

    if (manifest.peer === "codewiki") {
      // CodeWiki renders client-side, so its pages come from the playwright
      // pipeline in fetch-codewiki/ (extraction + citation normalization),
      // never from an HTTP fetch here — a raw fetch would hash rendered-app
      // scaffolding, not the normalized markdown these manifests pin.
      // Verify-only: hash whatever that pipeline already wrote.
      const fetched = (await readdir(outDir)).filter((f) => f.endsWith(".md"));
      if (fetched.length === 0) {
        // A silent skip would let this run print success while the judged
        // runner later rejects the same empty directory (ensurePeersFetched)
        // — missing pages are a hard failure with the exact fix command.
        missingCodewiki.push({
          manifest: manifestFile,
          command: `npx tsx corpora/peers/fetch-codewiki/fetch.ts ${manifest.repo} ${outDir}`,
        });
        continue;
      }
      for (const page of manifest.pages) {
        const content = await readFile(join(outDir, `${page.slug}.md`), "utf-8").catch(() => null);
        const actual = content === null ? null : sha256(content);
        if (actual !== page.sha256) {
          mismatches.push({
            manifest: manifestFile,
            slug: page.slug,
            url: page.url,
            expected_sha256: page.sha256,
            actual_sha256: actual,
            note: content === null ? "page missing from fetch-codewiki output" : undefined,
          });
        }
      }
      continue;
    }

    let deepwikiByTitle: Map<string, string> | null = null;
    if (manifest.peer === "deepwiki" && manifest.pages.length > 0) {
      const entryHtml = await fetchHtml(manifest.pages[0].url);
      deepwikiByTitle = extractDeepwikiPagesByTitle(entryHtml);
    }

    for (const page of manifest.pages) {
      let content: string | null = null;
      let note: string | undefined;
      try {
        if (manifest.peer === "zread") {
          content = await fetchZreadPage(page);
        } else if (manifest.peer === "deepwiki" && deepwikiByTitle) {
          content = deepwikiByTitle.get(page.title) ?? null;
          if (content === null) note = "page title not found in fetched wiki bundle";
        } else {
          // Unknown peer type: no site-specific extractor yet -- best-effort
          // raw fetch, so a new peer's manifest doesn't hard-crash the run.
          content = await fetchHtml(page.url);
        }
      } catch (err) {
        note = err instanceof Error ? err.message : String(err);
      }

      if (content !== null) {
        await writeFile(join(outDir, `${page.slug}.md`), content);
      }
      const actual = content === null ? null : sha256(content);
      if (actual !== page.sha256) {
        mismatches.push({
          manifest: manifestFile,
          slug: page.slug,
          url: page.url,
          expected_sha256: page.sha256,
          actual_sha256: actual,
          note,
        });
      }
    }
    console.log(`[fetch-peers] ${manifestFile}: ${manifest.pages.length} pages -> ${outDir}`);
  }

  if (missingCodewiki.length > 0) {
    console.error(
      "[fetch-peers] codewiki pages are browser-extracted and have not been fetched yet " +
        "(needs playwright; see corpora/peers/fetch-codewiki/README.md). Run, then rerun peers:fetch to verify:",
    );
    for (const { command } of missingCodewiki) {
      console.error(`  ${command}`);
    }
    process.exitCode = 1;
    return;
  }

  if (mismatches.length > 0) {
    if (allowDrift) {
      await mkdir(RESULTS_DIR, { recursive: true });
      const report = { generated_at: new Date().toISOString(), mismatches };
      await writeFile(join(RESULTS_DIR, "DRIFT.json"), `${JSON.stringify(report, null, 2)}\n`);
      console.warn(
        `[fetch-peers] --allow-drift: ${mismatches.length} page(s) changed since scoring; wrote ${join(RESULTS_DIR, "DRIFT.json")}`,
      );
      return;
    }
    console.error("peer content changed since scoring — re-score or update the manifest");
    for (const m of mismatches) {
      console.error(`  ${m.manifest} :: ${m.slug} (${m.url})${m.note ? ` -- ${m.note}` : ""}`);
    }
    process.exitCode = 1;
    return;
  }
  console.log("[fetch-peers] all peer pages match their scored SHA-256.");
}

main().catch((e: unknown) => {
  console.error(e instanceof Error ? (e.stack ?? e.message) : String(e));
  process.exitCode = 1;
});
