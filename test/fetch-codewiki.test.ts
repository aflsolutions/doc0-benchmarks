// Pins the two rerun-safety behaviors of the fetch-codewiki pipeline:
// normalization must be idempotent (rerunning the advertised CLI must not
// change prose or page hashes), and splitting must not leave pages from
// removed sections behind when refetching into an existing directory.
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { normalizeCitations } from "../corpora/peers/fetch-codewiki/normalize.ts";
import { splitExtraction } from "../corpora/peers/fetch-codewiki/split.ts";

const SHA = "2f3d998c85f10b8ff88a3dca9f24bacf11c3a250";
const CITE_URL = `https://github.com/acme/widgets/blob/${SHA}/src/registry.ts#L10-L20`;
const SINGLE_LINE_URL = `https://github.com/acme/widgets/blob/${SHA}/src/types.ts#L5`;

let dir: string;

beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), "fetch-codewiki-test-"));
});

afterEach(() => {
  rmSync(dir, { recursive: true, force: true });
});

describe("normalizeCitations", () => {
  it("rewrites symbol-labeled GitHub blob citations to prose-preserving form", () => {
    writeFileSync(join(dir, "page.md"), `The [Registry](${CITE_URL}) resolves [WidgetKind](${SINGLE_LINE_URL}).\n`);
    const { rewritten } = normalizeCitations(dir);
    expect(rewritten).toBe(2);
    expect(readFileSync(join(dir, "page.md"), "utf-8")).toBe(
      `The \`Registry\` [src/registry.ts:10-20](${CITE_URL}) resolves \`WidgetKind\` [src/types.ts:5](${SINGLE_LINE_URL}).\n`,
    );
  });

  it("is idempotent: a second run rewrites nothing and leaves content byte-identical", () => {
    writeFileSync(join(dir, "page.md"), `The [Registry](${CITE_URL}) wires widgets.\n`);
    normalizeCitations(dir);
    const afterFirst = readFileSync(join(dir, "page.md"), "utf-8");
    const second = normalizeCitations(dir);
    expect(second.rewritten).toBe(0);
    expect(readFileSync(join(dir, "page.md"), "utf-8")).toBe(afterFirst);
  });
});

describe("splitExtraction", () => {
  it("does not treat '## ' inside fenced code as a section heading", () => {
    const markdown = 'intro\n\n## Real Section\n\nbefore\n\n```\n## not a heading\necho done\n```\n\nafter';
    const pages = splitExtraction({ sha: SHA, markdown }, dir);
    expect(pages).toBe(2);
    const section = readFileSync(join(dir, "real-section.md"), "utf-8");
    expect(section).toContain("## not a heading");
    expect((section.match(/^```/gm) ?? []).length).toBe(2);
  });


  it("removes stale pages from a previous fetch before writing the new sections", () => {
    splitExtraction({ sha: SHA, markdown: "intro\n\n## Kept Section\n\nbody\n\n## Removed Section\n\nold body" }, dir);
    expect(readdirSync(dir).filter((f) => f.endsWith(".md")).sort()).toEqual([
      "kept-section.md",
      "overview.md",
      "removed-section.md",
    ]);

    const pages = splitExtraction({ sha: SHA, markdown: "intro\n\n## Kept Section\n\nnewer body" }, dir);
    expect(pages).toBe(2);
    expect(readdirSync(dir).filter((f) => f.endsWith(".md")).sort()).toEqual(["kept-section.md", "overview.md"]);
  });
});
