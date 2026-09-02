import { describe, it, expect } from "vitest";
import {
  hoistPreambles,
  neutralizeNonFinalLists,
  normalizeHeadingLevels,
  planEvaluatorInput,
  stripLeadingDetailsBlock,
  transpileMdx,
  USER_GUIDE_INDEX_SLUG,
  type EvaluatorPage,
} from "./codewikibench.ts";

// ---------------------------------------------------------------------------
// transpileMdx
// ---------------------------------------------------------------------------

describe("transpileMdx — Callout", () => {
  it("type='info' demotes to a [!NOTE] blockquote alert, tag stripped", () => {
    const result = transpileMdx(`<Callout type="info">\nThis is a note.\n</Callout>`);
    expect(result).toContain("> [!NOTE]");
    expect(result).toContain("> This is a note.");
    expect(result).not.toContain("<Callout");
    expect(result).not.toContain("</Callout>");
  });

  it("variant='warning' maps like type=", () => {
    const result = transpileMdx(`<Callout variant="warning">Watch out.</Callout>`);
    expect(result).toContain("> [!WARNING]");
    expect(result).toContain("> Watch out.");
  });

  it("carries a title onto the alert marker line", () => {
    const result = transpileMdx(`<Callout type="tip" title="Pro tip">Use the shortcut.</Callout>`);
    expect(result).toContain("> [!TIP] Pro tip");
    expect(result).toContain("> Use the shortcut.");
  });

  it("unknown/missing type defaults to [!NOTE]", () => {
    expect(transpileMdx(`<Callout>Just a note.</Callout>`)).toContain("> [!NOTE]");
    expect(transpileMdx(`<Callout type="weird">Text.</Callout>`)).toContain("> [!NOTE]");
  });
});

describe("transpileMdx — Tabs/Tab", () => {
  it("unwraps Tabs and turns each Tab into a bold label + content", () => {
    const input = `<Tabs items={["npm", "pnpm"]}>
<Tab value="npm">
Run \`npm install\`.
</Tab>
<Tab value="pnpm">
Run \`pnpm install\`.
</Tab>
</Tabs>`;
    const result = transpileMdx(input);
    expect(result).not.toContain("<Tabs");
    expect(result).not.toContain("<Tab ");
    expect(result).toContain("**npm**");
    expect(result).toContain("Run `npm install`.");
    expect(result).toContain("**pnpm**");
    expect(result).toContain("Run `pnpm install`.");
  });
});

describe("transpileMdx — Steps/Step", () => {
  it("unwraps Steps and headings each titled Step", () => {
    const input = `<Steps>
<Step title="Install">
Run the installer.
</Step>
<Step title="Configure">
Edit the config file.
</Step>
</Steps>`;
    const result = transpileMdx(input);
    expect(result).not.toContain("<Steps");
    expect(result).not.toContain("<Step ");
    expect(result).toContain("### Install");
    expect(result).toContain("Run the installer.");
    expect(result).toContain("### Configure");
    expect(result).toContain("Edit the config file.");
  });

  it("an untitled Step keeps its content as-is (no synthetic heading)", () => {
    const result = transpileMdx(`<Steps><Step>\nJust do it.\n</Step></Steps>`);
    expect(result).not.toContain("<Step");
    expect(result.trim()).toBe("Just do it.");
  });
});

describe("transpileMdx — Accordion/Accordions", () => {
  it("unwraps Accordions and headings each titled Accordion", () => {
    const input = `<Accordions type="single">
<Accordion title="FAQ 1">
Answer one.
</Accordion>
</Accordions>`;
    const result = transpileMdx(input);
    expect(result).not.toContain("<Accordions");
    expect(result).not.toContain("<Accordion ");
    expect(result).toContain("#### FAQ 1");
    expect(result).toContain("Answer one.");
  });
});

describe("transpileMdx — CodeGroup", () => {
  it("unwraps CodeGroup and leaves the inner fences untouched", () => {
    const input = `<CodeGroup>
\`\`\`ts title="a.ts"
const a = 1;
\`\`\`
\`\`\`js title="b.js"
const b = 2;
\`\`\`
</CodeGroup>`;
    const result = transpileMdx(input);
    expect(result).not.toContain("<CodeGroup");
    expect(result).not.toContain("</CodeGroup>");
    expect(result).toContain('```ts title="a.ts"\nconst a = 1;\n```');
    expect(result).toContain('```js title="b.js"\nconst b = 2;\n```');
  });
});

describe("transpileMdx — nesting, fences, and fail-safety", () => {
  it("handles a Callout nested inside a Step (inner-first recursion, no premature close)", () => {
    const input = `<Steps>
<Step title="Deploy">
Before you deploy:
<Callout type="warning">
Back up the database first.
</Callout>
</Step>
</Steps>`;
    const result = transpileMdx(input);
    expect(result).toContain("### Deploy");
    expect(result).toContain("> [!WARNING]");
    expect(result).toContain("> Back up the database first.");
    expect(result).not.toContain("<Callout");
    expect(result).not.toContain("<Step");
  });

  it("leaves a component tag mentioned inside a fenced code block untouched", () => {
    const input = "Use it like this:\n\n```mdx\n<Callout type=\"info\">Example</Callout>\n```\n";
    const result = transpileMdx(input);
    expect(result).toContain('<Callout type="info">Example</Callout>');
    expect(result).toContain("```mdx");
  });

  it("leaves a component tag mentioned inside inline code untouched", () => {
    const input = "The `<Tab value=\"x\">` tag opens a tab.";
    const result = transpileMdx(input);
    expect(result).toBe(input);
  });

  it("is idempotent once no known tag remains", () => {
    const once = transpileMdx(`<Callout type="tip">Do it.</Callout>`);
    expect(transpileMdx(once)).toBe(once);
  });

  it("leaves an unclosed component tag untouched (fail-safe, never corrupts)", () => {
    const input = `<Callout type="info">\nNever closed.`;
    expect(transpileMdx(input)).toBe(input);
  });

  it("passes plain markdown through unchanged", () => {
    const input = "# Title\n\nJust a paragraph with `inline code` and a [link](https://example.com).\n";
    expect(transpileMdx(input)).toBe(input);
  });
});

// ---------------------------------------------------------------------------
// stripLeadingDetailsBlock — emission-path source-files scaffolding removal
// ---------------------------------------------------------------------------

describe("stripLeadingDetailsBlock", () => {
  it("strips the leading details block after the H1, rest byte-identical", () => {
    const details = `<details>
<summary>Relevant source files</summary>

The following files were used as context for generating this wiki page:

- [src/context.ts](https://github.com/o/r/blob/main/src/context.ts)
</details>`;
    const rest = "Intro paragraph before the first section.\n\n## Section A\n\nBody A.\n";
    const input = `# HTTP Utilities\n\n${details}\n\n${rest}`;
    expect(stripLeadingDetailsBlock(input)).toBe(`# HTTP Utilities\n\n${rest}`);
  });

  it("strips a leading details block when there is no H1 (doc0-internal page shape)", () => {
    const input = `<details>\n<summary>Relevant source files</summary>\n\n- [a.ts](x)\n</details>\n\nBody.\n`;
    expect(stripLeadingDetailsBlock(input)).toBe("Body.\n");
  });

  it("does NOT strip a details block in the middle of the page body", () => {
    const input = `# Title\n\nIntro prose first.\n\n<details>\n<summary>Expand</summary>\n\nHidden extras.\n</details>\n\n## Section\n\nBody.\n`;
    expect(stripLeadingDetailsBlock(input)).toBe(input);
  });

  it("leaves a page without any details block unchanged", () => {
    const input = "# Title\n\nIntro.\n\n## Section A\n\nBody A.\n";
    expect(stripLeadingDetailsBlock(input)).toBe(input);
  });

  it("strips only the ONE leading block — a second details block later survives", () => {
    const input = `# Title\n\n<details>\n<summary>Relevant source files</summary>\n\n- [a.ts](x)\n</details>\n\nIntro.\n\n<details>\n<summary>More</summary>\n\nExtra.\n</details>\n`;
    const result = stripLeadingDetailsBlock(input);
    expect(result).toBe(`# Title\n\nIntro.\n\n<details>\n<summary>More</summary>\n\nExtra.\n</details>\n`);
  });
});

// ---------------------------------------------------------------------------
// planEvaluatorInput — module_tree.json hierarchy + user_guide merge
// ---------------------------------------------------------------------------

function page(slug: string, content = `# ${slug}\n\nbody`): EvaluatorPage {
  return { slug, content };
}

describe("planEvaluatorInput — technical only", () => {
  it("puts every technical page flat at the top level, keyed by slug", () => {
    const plan = planEvaluatorInput([page("overview"), page("routing")]);
    expect(plan.tree).toEqual({ overview: {}, routing: {} });
    expect(plan.files.map((f) => f.slug).sort()).toEqual(["overview", "routing"]);
  });

  it("emits no synthetic user-guide page when none is merged", () => {
    const plan = planEvaluatorInput([page("overview")]);
    expect(plan.files.some((f) => f.slug === USER_GUIDE_INDEX_SLUG)).toBe(false);
  });
});

describe("planEvaluatorInput — merged with user_guide", () => {
  it("nests user_guide pages as a prefixed subtree under a synthetic index page", () => {
    const plan = planEvaluatorInput([page("overview"), page("routing")], [page("getting-started"), page("faq")]);

    expect(plan.tree.overview).toEqual({});
    expect(plan.tree.routing).toEqual({});
    expect(plan.tree[USER_GUIDE_INDEX_SLUG]).toBeDefined();
    expect(plan.tree[USER_GUIDE_INDEX_SLUG]?.children).toEqual({
      "getting-started": {},
      faq: {},
    });

    const indexFile = plan.files.find((f) => f.slug === USER_GUIDE_INDEX_SLUG);
    expect(indexFile).toBeDefined();
    expect(indexFile?.content).toContain("# User Guide");

    expect(plan.files.map((f) => f.slug).sort()).toEqual(
      ["overview", "routing", "getting-started", "faq", USER_GUIDE_INDEX_SLUG].sort(),
    );
  });

  it("uniquifies a user_guide page whose slug collides with a technical page", () => {
    const plan = planEvaluatorInput([page("overview")], [page("overview")]);

    // Technical keeps the bare slug at the top level.
    expect(plan.tree.overview).toEqual({});
    // The colliding user_guide page is uniquified inside the subtree.
    expect(plan.tree[USER_GUIDE_INDEX_SLUG]?.children).toEqual({ "overview-user-guide": {} });

    const slugs = plan.files.map((f) => f.slug);
    expect(slugs.filter((s) => s === "overview")).toHaveLength(1); // no duplicate filenames
    expect(slugs).toContain("overview-user-guide");
  });

  it("keeps uniquifying through repeated collisions (-user-guide, then -user-guide-2, ...)", () => {
    const plan = planEvaluatorInput(
      [page("overview"), page("overview-user-guide")],
      [page("overview")],
    );
    expect(plan.tree[USER_GUIDE_INDEX_SLUG]?.children).toEqual({ "overview-user-guide-2": {} });
  });

  it("uniquifies the synthetic index slug itself if a technical page is already named 'user-guide'", () => {
    const plan = planEvaluatorInput([page("overview"), page(USER_GUIDE_INDEX_SLUG)], [page("faq")]);
    const wrapperKeys = Object.keys(plan.tree).filter((k) => k !== "overview" && k !== USER_GUIDE_INDEX_SLUG);
    expect(wrapperKeys).toHaveLength(1);
    expect(plan.tree[wrapperKeys[0] ?? ""]?.children).toEqual({ faq: {} });
  });

  it("every emitted filename is unique across technical + user_guide + the index page", () => {
    const plan = planEvaluatorInput(
      [page("overview"), page("routing")],
      [page("overview"), page("routing"), page("faq")],
    );
    const slugs = plan.files.map((f) => f.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });
});

// ---------------------------------------------------------------------------
// hoistPreambles
// ---------------------------------------------------------------------------

describe("hoistPreambles", () => {
  it("hoists an intro paragraph under an H1 with H2 children into ## Overview", () => {
    const out = hoistPreambles("# Page\n\nIntro words.\n\n## First Section\n\nBody.\n");
    expect(out).toContain("# Page\n\n## Overview\n\nIntro words.");
    expect(out.indexOf("## Overview")).toBeLessThan(out.indexOf("## First Section"));
  });

  it("hoists a preamble under an H2 with H3 children into ### Overview", () => {
    const out = hoistPreambles("# P\n\n## Section\n\nPreamble.\n\n### Child\n\nLeaf.\n");
    expect(out).toContain("## Section\n\n### Overview\n\nPreamble.");
  });

  it("leaves leaf sections untouched", () => {
    const md = "# P\n\n## Leaf\n\nJust a paragraph.\n\n1. item\n";
    expect(hoistPreambles(md)).toBe(md);
  });

  it("leaves a childful section with no preamble untouched", () => {
    const md = "# P\n\n## Section\n\n### Child\n\nBody.\n";
    expect(hoistPreambles(md)).toBe(md);
  });

  it("ignores heading-looking lines inside fences, as content and as boundary", () => {
    const md = "# P\n\nIntro.\n\n```sh\n# not a heading\n## also not\n```\n\n## Real Child\n\nBody.\n";
    const out = hoistPreambles(md);
    expect(out).toContain("# P\n\n## Overview\n\nIntro.");
    // The fence stays verbatim inside the hoisted preamble.
    expect(out).toContain("```sh\n# not a heading\n## also not\n```");
    expect(out.match(/## Overview/g)).toHaveLength(1);
  });

  it("falls back to Introduction when a sibling child is already titled Overview", () => {
    const out = hoistPreambles("# P\n\nIntro.\n\n## Overview\n\nReal overview.\n");
    expect(out).toContain("# P\n\n## Introduction\n\nIntro.");
  });

  it("hoists every childful section independently", () => {
    const out = hoistPreambles(
      "# P\n\nTop intro.\n\n## A\n\nA preamble.\n\n### A1\n\nLeaf.\n\n## B\n\nB leaf only.\n",
    );
    expect(out).toContain("# P\n\n## Overview\n\nTop intro.");
    expect(out).toContain("## A\n\n### Overview\n\nA preamble.");
    // B is a leaf: untouched.
    expect(out).toContain("## B\n\nB leaf only.");
  });

  // The pinned parser splits each section on headings at EXACTLY parent+1 and
  // discards everything before the first one it finds. A first child that
  // skips a level (H1 straight to H3, the shape of the committed
  // redis cluster-routing page) is never a key, so a synthetic ## Overview
  // would swallow it and lose the preamble again, while a synthetic ### would
  // be skipped over together with the child. The skip is normalized away
  // first, so the preamble lands under a leaf key beside its real sibling.
  it("hoists a preamble whose first child skips a level into a leaf sibling", () => {
    const out = hoistPreambles("# P\n\nIntro.\n\n### Child\n\nBody.\n\n## Sec\n\nS.\n");
    expect(out).toBe("# P\n\n## Overview\n\nIntro.\n\n## Child\n\nBody.\n\n## Sec\n\nS.\n");
  });

  it("checks the synthetic title against the promoted sibling", () => {
    const out = hoistPreambles("# P\n\nIntro.\n\n### Overview\n\nReal.\n");
    expect(out).toBe("# P\n\n## Introduction\n\nIntro.\n\n## Overview\n\nReal.\n");
  });
});

// ---------------------------------------------------------------------------
// normalizeHeadingLevels
// ---------------------------------------------------------------------------

describe("normalizeHeadingLevels", () => {
  it("promotes a child that skips a level to exactly parent+1", () => {
    expect(normalizeHeadingLevels("# P\n\n### Child\n\nBody.\n\n## Sec\n\nS.\n")).toBe(
      "# P\n\n## Child\n\nBody.\n\n## Sec\n\nS.\n",
    );
  });

  it("re-levels descendants relative to their promoted parent", () => {
    expect(normalizeHeadingLevels("# P\n\n### A\n\n##### A1\n\n## B\n")).toBe(
      "# P\n\n## A\n\n### A1\n\n## B\n",
    );
  });

  it("makes a shallower heading after a skip a sibling of the skipped one, never its parent", () => {
    // H4 under H2 skips H3; the H3 that follows closes the H4 and is H2's
    // child too, so both come out at level 3.
    expect(normalizeHeadingLevels("# P\n\n## S\n\n#### Deep\n\nD.\n\n### Next\n\nN.\n")).toBe(
      "# P\n\n## S\n\n### Deep\n\nD.\n\n### Next\n\nN.\n",
    );
  });

  it("leaves a well-formed ladder byte-identical", () => {
    const md = "# P\n\nIntro.\n\n## A\n\n### A1\n\nLeaf.\n\n## B\n\nB.\n";
    expect(normalizeHeadingLevels(md)).toBe(md);
  });

  it("starts the ladder at the page's first heading level", () => {
    expect(normalizeHeadingLevels("## Top\n\n#### Child\n")).toBe("## Top\n\n### Child\n");
  });

  it("never touches heading-looking lines inside fences", () => {
    const md = "# P\n\n```sh\n#### not a heading\n```\n\n### Child\n";
    expect(normalizeHeadingLevels(md)).toBe("# P\n\n```sh\n#### not a heading\n```\n\n## Child\n");
  });
});

describe("neutralizeNonFinalLists", () => {
  it("escapes a list followed by a paragraph, keeps the words verbatim", () => {
    const out = neutralizeNonFinalLists("## S\n\n1. First step.\n2. Second step.\n\nAfter-list paragraph.\n");
    expect(out).toContain("1\\. First step.");
    expect(out).toContain("2\\. Second step.");
    expect(out).toContain("After-list paragraph.");
  });

  it("keeps a section-final list as a real list", () => {
    const md = "## S\n\nLead-in.\n\n1. Only list.\n2. Still fine.\n";
    expect(neutralizeNonFinalLists(md)).toBe(md);
  });

  it("escapes the first of two lists, keeps the second", () => {
    const out = neutralizeNonFinalLists("## S\n\n1. A.\n\nBetween.\n\n- B.\n");
    expect(out).toContain("1\\. A.");
    expect(out).toContain("\nBetween.");
    expect(out).toContain("\n- B.");
    expect(out).not.toContain("\\- B.");
  });

  it("escapes nested markers of a non-final list block", () => {
    const out = neutralizeNonFinalLists("## S\n\n- Parent.\n  1. Child.\n\nTail paragraph.\n");
    expect(out).toContain("\\- Parent.");
    expect(out).toContain("  1\\. Child.");
  });

  it("treats each heading span independently", () => {
    const out = neutralizeNonFinalLists("## A\n\n1. NonFinal.\n\nTail.\n\n## B\n\n1. Final.\n");
    expect(out).toContain("1\\. NonFinal.");
    expect(out).toContain("\n1. Final.");
  });

  it("never touches list-looking lines inside fences", () => {
    const md = "## S\n\n```txt\n1. not a list\n- neither\n```\n\nTail.\n";
    expect(neutralizeNonFinalLists(md)).toBe(md);
  });
});

describe("neutralizeNonFinalLists — tight lists", () => {
  it("escapes a tight list (lead-in directly above the markers) when content follows", () => {
    const out = neutralizeNonFinalLists(
      "## S\n\nThe check sequence is:\n1. First check.\n2. Second check.\n\nSources: [x.ts:1-2](y)\n",
    );
    expect(out).toContain("The check sequence is:");
    expect(out).toContain("1\\. First check.");
    expect(out).toContain("2\\. Second check.");
    expect(out).toContain("Sources: [x.ts:1-2](y)");
  });

  it("keeps a tight section-final block untouched", () => {
    const md = "## S\n\nMechanism:\n1. Detect.\n2. Rewrite.\n";
    expect(neutralizeNonFinalLists(md)).toBe(md);
  });
});

describe("neutralizeNonFinalLists — trailing Sources line", () => {
  it("escapes a span-final list whose block ends with a Sources paragraph", () => {
    const out = neutralizeNonFinalLists(
      "## S\n\nOnion model:\n\n1. Receive context.\n2. Dispatch next.\nSources: [x.ts:1-2](y)\n",
    );
    expect(out).toContain("1\\. Receive context.");
    expect(out).toContain("2\\. Dispatch next.");
    expect(out).toContain("Sources: [x.ts:1-2](y)");
  });

  it("keeps a trailing list whose continuations are indented", () => {
    const md = "## S\n\nLead.\n\n- Parent.\n  1. Child one.\n  2. Child two.\n";
    expect(neutralizeNonFinalLists(md)).toBe(md);
  });
});
