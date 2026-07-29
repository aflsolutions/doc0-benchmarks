// Fetches a repository's CodeWiki (https://codewiki.google) wiki as
// normalized per-section markdown pages. CodeWiki renders client-side, so a
// real browser is required; playwright is deliberately NOT a dependency of
// this repo -- install it locally before use:
//
//   pnpm add -D playwright && npx playwright install chromium
//
//   npx tsx fetch.ts <owner/repo> <outDir>
//
// Exit codes: 0 = pages written, 2 = repo not covered by CodeWiki (404 page),
// 1 = any other failure (playwright missing, empty extraction, ...).
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";

import { normalizeCitations } from "./normalize.ts";
import { splitExtraction, type CodewikiExtraction } from "./split.ts";

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const NAV_TIMEOUT_MS = 60_000;

// Narrow structural types for the slice of playwright this script touches, so
// `tsc --noEmit` stays clean when playwright (and its types) is not
// installed. The module specifier below is widened to `string` so the
// compiler never tries to resolve the possibly-absent package; the cast is
// checked against these shapes at the call sites instead.
interface Page {
  goto(url: string, options?: { timeout?: number }): Promise<unknown>;
  waitForLoadState(state: "networkidle", options?: { timeout?: number }): Promise<void>;
  evaluate(script: string): Promise<unknown>;
}

interface Browser {
  newPage(): Promise<Page>;
  close(): Promise<void>;
}

interface PlaywrightModule {
  chromium: { launch(options?: { headless?: boolean }): Promise<Browser> };
}

async function loadPlaywright(): Promise<PlaywrightModule> {
  const specifier: string = "playwright";
  try {
    return (await import(specifier)) as PlaywrightModule;
  } catch {
    throw new Error(
      "playwright is not installed (it is intentionally not a repo dependency).\n" +
        "Run: pnpm add -D playwright && npx playwright install chromium",
    );
  }
}

type FetchOutcome = "fetched" | "not-covered";

async function fetchCodewiki(repo: string, outDir: string): Promise<FetchOutcome> {
  const url = `https://codewiki.google/github.com/${repo}`;
  const { chromium } = await loadPlaywright();
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage();
    await page.goto(url, { timeout: NAV_TIMEOUT_MS });
    await page.waitForLoadState("networkidle", { timeout: NAV_TIMEOUT_MS });

    const bodyText = String(await page.evaluate("document.body.innerText"));
    if (bodyText.includes("404")) return "not-covered";

    // extract.js is a self-invoking expression that returns a JSON string of
    // {sha, markdown}; evaluate it as-is inside the page.
    const extractSource = readFileSync(join(SCRIPT_DIR, "extract.js"), "utf-8");
    const raw = await page.evaluate(extractSource);
    if (typeof raw !== "string") {
      throw new Error(`extract.js returned ${typeof raw}, expected a JSON string`);
    }
    const extraction = JSON.parse(raw) as CodewikiExtraction;
    if (!extraction.markdown.trim()) throw new Error(`no content extracted from ${url}`);

    const pages = splitExtraction(extraction, outDir);
    const { rewritten } = normalizeCitations(outDir);
    console.log(
      `[fetch-codewiki] ${repo}: commit=${extraction.sha || "UNKNOWN"} pages=${pages} citations_normalized=${rewritten} -> ${outDir}`,
    );
    return "fetched";
  } finally {
    await browser.close();
  }
}

async function main(): Promise<void> {
  const { positionals } = parseArgs({ allowPositionals: true });
  const [repo, outDir] = positionals;
  if (!repo || !outDir || !/^[^/\s]+\/[^/\s]+$/.test(repo)) {
    throw new Error("usage: npx tsx fetch.ts <owner/repo> <outDir>");
  }
  const outcome = await fetchCodewiki(repo, outDir);
  if (outcome === "not-covered") {
    console.error(
      `[fetch-codewiki] ${repo} is not covered by CodeWiki (404 at https://codewiki.google/github.com/${repo})`,
    );
    process.exitCode = 2;
  }
}

main().catch((e: unknown) => {
  console.error(e instanceof Error ? (e.stack ?? e.message) : String(e));
  process.exitCode = 1;
});
