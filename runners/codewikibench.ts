// Family 2 — CodeWikiBench evaluator-input adapter.
//
// Conforms a doc0 wiki export (a flat corpus dir of `.md` pages, same shape as
// `scoring/corpus.ts` loads) to the input format the PUBLISHED CodeWikiBench
// evaluator expects (`docs/codewikibench-pinned.md`, section (b)):
//
//   1. A flat folder of `.md` files (their parser does NOT recurse into
//      subdirectories — `os.listdir` + `isfile` only).
//   2. A `module_tree.json` in that same folder whose keys are the exact
//      hierarchy of page titles. Verified against the evaluator's own source
//      (`src/docs_parser/parse_generated_docs.py`, pinned SHA
//      5e728fb40492effb54d59041f908dbf9079fe238 — see docs/codewikibench-pinned.md):
//      `process_markdown_file` looks up `title_index[filename minus ".md"]`,
//      i.e. the module_tree key MUST equal the page's FILENAME, not its H1
//      heading. No index prefix / first-line convention is used here — we
//      always take the module_tree.json path, per the pinned doc's guidance.
//   3. Each file's markdown body is parsed with `markdown_to_json.jsonify`,
//      which builds a nested dict from the heading hierarchy — so any custom
//      MDX/JSX component tag (Tabs, Callout, Steps, ...) is invisible to it
//      and would show up as literal `<Tag>` text (or worse, break the
//      surrounding heading structure). `transpileMdx` below demotes the known
//      component set to plain markdown before a page is written out.
//
// `runners/codewikibench-dryrun.ts` is the thing that actually invokes the
// evaluator's parser end-to-end and measures how much of this survives.

import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";

import { wordCount } from "../scoring/metrics.ts";

// ---------------------------------------------------------------------------
// transpileMdx — demote known MDX/JSX components to plain markdown
// ---------------------------------------------------------------------------
//
// Adapted from doc0-commercial's `demoteMdxComponents`
// (src/workflows/utils/page-linter/transforms/mdx-to-markdown.ts, commit
// d33ff036f457700220fc8a539328ae2c1f68bf38) — same masking/matching mechanism
// (fences and inline code are masked out before scanning so component tags
// mentioned *inside* a code sample are never touched; same-name nesting is
// depth-tracked so a Callout inside a Step doesn't prematurely close the
// outer Step). Two differences from the doc0-internal original:
//
//   - `CodeGroup` is added as an eighth known tag. It has no doc0-internal
//     equivalent (confirmed absent from `src/components/mdx/` and the Plate
//     editor — aspirational only) but the evaluator's parser only understands
//     fenced code, so a CodeGroup wrapper is unwrapped exactly like
//     Steps/Tabs/Accordions, leaving the inner fences untouched.
//   - `Accordion`/`Accordions` are included too (a real Plate-editor
//     component doc0-internal supports) for defensiveness — hand-edited pages
//     can contain them even though generated pages cannot (LLM prompts
//     forbid all JSX; see doc0-commercial's `PORTABLE_MARKDOWN_GUIDELINES`).
//
// None of Tabs/Callout/Steps/Accordion/CodeGroup were found in any committed
// doc0-benchmarks corpus as of this writing (LLM-generated pages already
// arrive as plain GFM) — this function is a safety net for pages that
// bypass that guarantee (hand-edited via the Plate.js WYSIWYG editor, or a
// future corpus with different provenance), not a corrective step needed by
// today's corpora.

const FENCE_PLACEHOLDER = "\x00FENCE";
const INLINE_PLACEHOLDER = "\x00INLINE";

type KnownComponent =
  | "Callout"
  | "Steps"
  | "Step"
  | "Accordions"
  | "Accordion"
  | "Tabs"
  | "Tab"
  | "CodeGroup";

const KNOWN_NAMES: readonly KnownComponent[] = [
  "Callout",
  "Steps",
  "Step",
  "Accordions",
  "Accordion",
  "Tabs",
  "Tab",
  "CodeGroup",
];

const KNOWN_NAMES_PATTERN = KNOWN_NAMES.join("|");

function maskCode(md: string): { working: string; fences: string[]; inlines: string[] } {
  const fences: string[] = [];
  let working = md.replace(/```[\s\S]*?```/g, (match) => {
    fences.push(match);
    return `${FENCE_PLACEHOLDER}${fences.length - 1}\x00`;
  });
  // Tilde fences are valid GFM too; masked after backtick fences so a literal
  // component mentioned inside `~~~ … ~~~` is preserved verbatim.
  working = working.replace(/~~~[\s\S]*?~~~/g, (match) => {
    fences.push(match);
    return `${FENCE_PLACEHOLDER}${fences.length - 1}\x00`;
  });
  const inlines: string[] = [];
  working = working.replace(/`[^`\n]*`/g, (match) => {
    inlines.push(match);
    return `${INLINE_PLACEHOLDER}${inlines.length - 1}\x00`;
  });
  return { working, fences, inlines };
}

function unmaskCode(working: string, fences: string[], inlines: string[]): string {
  let out = working.replace(
    new RegExp(`${INLINE_PLACEHOLDER}(\\d+)\\x00`, "g"),
    (_match, idx: string) => inlines[Number(idx)] ?? "",
  );
  out = out.replace(
    new RegExp(`${FENCE_PLACEHOLDER}(\\d+)\\x00`, "g"),
    (_match, idx: string) => fences[Number(idx)] ?? "",
  );
  return out;
}

function parseAttr(attrs: string, name: string): string | undefined {
  const re = new RegExp(`\\b${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)')`);
  const m = attrs.match(re);
  if (!m) return undefined;
  return m[1] ?? m[2];
}

function calloutKeyword(type: string | undefined): string {
  switch ((type ?? "").toLowerCase()) {
    case "note":
    case "info":
      return "NOTE";
    case "tip":
    case "success":
      return "TIP";
    case "warn":
    case "warning":
      return "WARNING";
    case "error":
    case "danger":
    case "caution":
      return "CAUTION";
    case "important":
      return "IMPORTANT";
    default:
      return "NOTE";
  }
}

function toBlockquoteAlert(keyword: string, inner: string, unmask: (s: string) => string, title?: string): string {
  const trimmed = unmask(inner).trim();
  const lines = trimmed.length > 0 ? trimmed.split("\n") : [];
  const prefixed = lines.map((l) => (l.trim() === "" ? ">" : `> ${l}`)).join("\n");
  const normalizedTitle = title?.trim().replace(/\s+/g, " ") ?? "";
  const titleSuffix = normalizedTitle.length > 0 ? ` ${normalizedTitle}` : "";
  return `> [!${keyword}]${titleSuffix}${lines.length > 0 ? "\n" + prefixed : ""}`;
}

function applyTransform(tag: KnownComponent, attrsRaw: string, inner: string, unmask: (s: string) => string): string {
  const trimmedInner = inner.trim();

  switch (tag) {
    case "Callout": {
      const type = parseAttr(attrsRaw, "type") ?? parseAttr(attrsRaw, "variant");
      const title = parseAttr(attrsRaw, "title");
      return toBlockquoteAlert(calloutKeyword(type), trimmedInner, unmask, title);
    }

    // Wrapper containers: strip the outer tag, keep transformed inner as-is.
    // CodeGroup's inner content is always fenced code, already in the
    // evaluator's understood vocabulary — nothing else to do.
    case "Steps":
    case "Accordions":
    case "Tabs":
    case "CodeGroup":
      return trimmedInner;

    case "Step": {
      const title = parseAttr(attrsRaw, "title");
      return title ? `### ${title}\n\n${trimmedInner}` : trimmedInner;
    }

    case "Accordion": {
      const title = parseAttr(attrsRaw, "title") ?? "";
      return `#### ${title}\n\n${trimmedInner}`;
    }

    case "Tab": {
      const value = parseAttr(attrsRaw, "value") ?? "";
      return `**${value}**\n\n${trimmedInner}`;
    }
  }
}

function findMatchingClose(text: string, start: number, tagName: string): { closeStart: number; closeEnd: number } | null {
  const openRe = new RegExp(`<${tagName}(\\s[^>]*)?>`, "g");
  const closeRe = new RegExp(`</${tagName}\\s*>`, "g");

  let depth = 1;
  let pos = start;

  while (pos < text.length) {
    openRe.lastIndex = pos;
    closeRe.lastIndex = pos;

    const openMatch = openRe.exec(text);
    const closeMatch = closeRe.exec(text);

    if (!closeMatch) return null;

    const openFirst = openMatch !== null && openMatch.index < closeMatch.index;

    if (openFirst && openMatch !== null) {
      const isSelfClose = openMatch[0].trimEnd().endsWith("/>");
      if (!isSelfClose) depth++;
      pos = openMatch.index + openMatch[0].length;
    } else {
      depth--;
      if (depth === 0) {
        return { closeStart: closeMatch.index, closeEnd: closeMatch.index + closeMatch[0].length };
      }
      pos = closeMatch.index + closeMatch[0].length;
    }
  }

  return null;
}

function transformComponents(text: string, unmask: (s: string) => string): string {
  const openTagRe = new RegExp(`<(${KNOWN_NAMES_PATTERN})(\\s[^>]*)?>`, "g");

  let result = "";
  let pos = 0;

  openTagRe.lastIndex = 0;
  let match = openTagRe.exec(text);

  while (match !== null) {
    const [fullMatch, tagName, attrsRawRaw] = match;
    const tagStart = match.index;
    const tagEnd = tagStart + fullMatch.length;

    const selfClose = fullMatch.trimEnd().endsWith("/>");
    const attrsRaw = selfClose ? (attrsRawRaw ?? "").replace(/\s*\/$/, "") : (attrsRawRaw ?? "");

    result += text.slice(pos, tagStart);

    if (selfClose) {
      result += applyTransform(tagName as KnownComponent, attrsRaw, "", unmask);
      pos = tagEnd;
    } else {
      const closeResult = findMatchingClose(text, tagEnd, tagName);

      if (closeResult === null) {
        // No matching closing tag — fail-safe: leave verbatim, never corrupt.
        result += fullMatch;
        pos = tagEnd;
      } else {
        const { closeStart, closeEnd } = closeResult;
        const innerContent = text.slice(tagEnd, closeStart);
        const transformedInner = transformComponents(innerContent, unmask);
        result += applyTransform(tagName as KnownComponent, attrsRaw, transformedInner, unmask);
        pos = closeEnd;
      }
    }

    openTagRe.lastIndex = pos;
    match = openTagRe.exec(text);
  }

  result += text.slice(pos);
  return result;
}

/**
 * Demote Tabs/Tab, Callout, Steps/Step, Accordions/Accordion, and CodeGroup to
 * plain markdown (headings, bold labels, GFM alert blockquotes — no leftover
 * JSX tags) so `markdown_to_json.jsonify` (the evaluator's parser) sees a
 * plain heading hierarchy instead of opaque `<Tag>` text. PURE, deterministic,
 * idempotent once no known tag remains. Fenced/inline code is masked before
 * scanning and restored unchanged — a component name mentioned inside a code
 * sample is never touched.
 */
export function transpileMdx(md: string): string {
  const { working, fences, inlines } = maskCode(md);
  const unmask = (s: string): string => unmaskCode(s, fences, inlines);
  const transformed = transformComponents(working, unmask);
  return unmask(transformed);
}

// ---------------------------------------------------------------------------
// module_tree.json — hierarchy + user_guide merge
// ---------------------------------------------------------------------------

/** Shape `parse_generated_docs.py`'s `build_index_title` expects: arbitrary
 * nesting depth via a `children` key per node; empty object = leaf. */
export interface ModuleTreeNode {
  children?: Record<string, ModuleTreeNode>;
}

export type ModuleTree = Record<string, ModuleTreeNode>;

/** The title (== filename minus ".md") the synthetic user_guide section-index
 * page is written under, absent a real page already claiming that title. */
export const USER_GUIDE_INDEX_SLUG = "user-guide";

/** First-fit uniquifier: `<slug>`, then `<slug>-user-guide`, then
 * `<slug>-user-guide-2`, `-3`, … — deterministic, never mutates `used`. */
function uniquify(candidate: string, used: ReadonlySet<string>): string {
  if (!used.has(candidate)) return candidate;
  const suffixed = `${candidate}-user-guide`;
  if (!used.has(suffixed)) return suffixed;
  let n = 2;
  while (used.has(`${suffixed}-${n}`)) n += 1;
  return `${suffixed}-${n}`;
}

export interface EvaluatorPage {
  /** Filename minus ".md" — unique within the emitted flat directory, and
   * exactly the module_tree.json key this page's content is filed under. */
  slug: string;
  content: string;
}

export interface EvaluatorInputPlan {
  tree: ModuleTree;
  /** Every file to write, `<outputDir>/<slug>.md` = `content`. Includes the
   * synthetic user_guide index page (if any user-guide pages were merged). */
  files: EvaluatorPage[];
}

function titleCase(s: string): string {
  return s
    .split(" ")
    .map((w) => (w.length > 0 ? w[0].toUpperCase() + w.slice(1) : w))
    .join(" ");
}

/**
 * Build the merged module_tree.json plan: technical pages sit flat at the
 * top level; user_guide pages (if any) nest as a prefixed subtree under a
 * synthetic "user-guide" index page. Titles/filenames that collide between
 * the two corpora are uniquified (technical wins the bare name — user_guide
 * is the corpus that's optional and newer to the merge).
 *
 * PURE — no filesystem access. `emitEvaluatorInput` is the thin I/O shell
 * around this (reads corpus dirs, applies `transpileMdx`, writes the plan).
 */
export function planEvaluatorInput(technicalPages: EvaluatorPage[], userGuidePages: EvaluatorPage[] = []): EvaluatorInputPlan {
  const tree: ModuleTree = {};
  const files: EvaluatorPage[] = [];
  const used = new Set<string>();

  for (const page of technicalPages) {
    tree[page.slug] = {};
    files.push(page);
    used.add(page.slug);
  }

  if (userGuidePages.length === 0) {
    return { tree, files };
  }

  const indexSlug = uniquify(USER_GUIDE_INDEX_SLUG, used);
  used.add(indexSlug);

  const children: Record<string, ModuleTreeNode> = {};
  for (const page of userGuidePages) {
    const finalSlug = uniquify(page.slug, used);
    used.add(finalSlug);
    children[finalSlug] = {};
    files.push({ slug: finalSlug, content: page.content });
  }

  tree[indexSlug] = { children };
  // Synthetic index page: its own H1 must read as the title-cased,
  // hyphen-to-space form of `indexSlug` so `process_markdown_file`'s
  // case-insensitive title match strips the wrapper cleanly (verified against
  // the pinned parser — see docs/codewikibench-pinned.md).
  files.push({
    slug: indexSlug,
    content: `# ${titleCase(indexSlug.replace(/-/g, " "))}\n\nDocumentation for the user-facing guide.\n`,
  });

  return { tree, files };
}

// ---------------------------------------------------------------------------
// Filesystem shell
// ---------------------------------------------------------------------------

async function loadCorpusPages(dir: string): Promise<EvaluatorPage[]> {
  const entries = (await readdir(dir)).filter((f) => f.endsWith(".md")).sort();
  return Promise.all(
    entries.map(async (f) => ({
      slug: f.slice(0, -3),
      content: transpileMdx(await readFile(join(dir, f), "utf-8")),
    })),
  );
}

export interface EmitResult {
  outputDir: string;
  /** Per-file word count (post-transpile, the exact bytes written to disk) —
   * `codewikibench-dryrun.ts`'s "words emitted" denominator. */
  files: { slug: string; words: number }[];
}

/** Reads `technicalDir` (+ optionally `userGuideDir`), transpiles every page,
 * and writes the flat evaluator-input directory (`module_tree.json` +
 * one `.md` per page) to `outputDir`. */
export async function emitEvaluatorInput(opts: {
  technicalDir: string;
  userGuideDir?: string;
  outputDir: string;
}): Promise<EmitResult> {
  const technicalPages = await loadCorpusPages(opts.technicalDir);
  const userGuidePages = opts.userGuideDir ? await loadCorpusPages(opts.userGuideDir) : [];
  const plan = planEvaluatorInput(technicalPages, userGuidePages);

  await mkdir(opts.outputDir, { recursive: true });
  await Promise.all(plan.files.map((f) => writeFile(join(opts.outputDir, `${f.slug}.md`), f.content)));
  await writeFile(join(opts.outputDir, "module_tree.json"), `${JSON.stringify(plan.tree, null, 2)}\n`);

  return {
    outputDir: opts.outputDir,
    files: plan.files.map((f) => ({ slug: f.slug, words: wordCount(f.content) })),
  };
}

// ---------------------------------------------------------------------------
// CLI — emit-only (no evaluator clone, no parser invocation; see
// codewikibench-dryrun.ts for the end-to-end run)
// ---------------------------------------------------------------------------

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const CORPORA_DIR = join(ROOT, "corpora");
const RESULTS_DIR = join(ROOT, "results");

class GuardError extends Error {}

interface CliOptions {
  corpus: string;
  userGuide?: string;
  out?: string;
}

function parseCli(argv: string[]): CliOptions {
  const { values } = parseArgs({
    args: argv,
    options: {
      corpus: { type: "string" },
      "user-guide": { type: "string" },
      out: { type: "string" },
    },
  });
  if (!values.corpus) {
    throw new GuardError("[codewikibench] --corpus <name> is required (a directory under corpora/)");
  }
  return { corpus: values.corpus, userGuide: values["user-guide"], out: values.out };
}

async function main(): Promise<void> {
  const opts = parseCli(process.argv.slice(2));
  try {
    const technicalDir = join(CORPORA_DIR, opts.corpus);
    const userGuideDir = opts.userGuide ? join(CORPORA_DIR, opts.userGuide) : undefined;
    const outputDir = opts.out ?? join(RESULTS_DIR, "codewikibench", opts.corpus, "input");

    const result = await emitEvaluatorInput({ technicalDir, userGuideDir, outputDir });
    const totalWords = result.files.reduce((sum, f) => sum + f.words, 0);
    console.log(`[codewikibench] wrote ${result.files.length} pages (${totalWords} words) + module_tree.json to ${result.outputDir}`);
  } catch (err) {
    if (err instanceof GuardError) {
      console.error(err.message);
      process.exitCode = 1;
      return;
    }
    throw err;
  }
}

const isEntryPoint = process.argv[1] !== undefined && fileURLToPath(import.meta.url) === process.argv[1];
if (isEntryPoint) {
  main().catch((err: unknown) => {
    console.error(err instanceof Error ? (err.stack ?? err.message) : String(err));
    process.exitCode = 1;
  });
}
