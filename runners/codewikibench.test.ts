import { describe, it, expect } from "vitest";
import { planEvaluatorInput, transpileMdx, USER_GUIDE_INDEX_SLUG, type EvaluatorPage } from "./codewikibench.ts";

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
