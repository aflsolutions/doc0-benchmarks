import { describe, it, expect } from "vitest";
import { mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { loadWikiDir } from "./corpus.ts";

describe("loadWikiDir", () => {
  it("loads .md pages with slug + content, ignoring dotfiles", async () => {
    const dir = await mkdtemp(join(tmpdir(), "corpus-"));
    await writeFile(join(dir, "overview.md"), "# Overview\nbody");
    await writeFile(join(dir, ".bakeoff-model"), "x");
    const pages = await loadWikiDir(dir);
    // slug retains the .md extension — this matches loadReferenceWiki's proven
    // upstream behavior (doc0-commercial's own corpus.test.ts asserts
    // `slug === "00-intro.md"`), not a stripped basename.
    expect(pages.map((p) => p.slug)).toEqual(["overview.md"]);
    expect(pages[0]?.content).toContain("body");
  });
});
