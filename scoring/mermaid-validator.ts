// Ported from doc0 (commit 175c6b0e) — canonical scoring copy for published benchmarks.
// Only `matchDiagramType`/`VALID_DIAGRAM_TYPES` are actually consumed here (by
// metrics.ts's ported `findInvalidMermaidBlocks`); the regex-based repair
// functions (`validateMermaidBlocks` et al.) are carried along verbatim since
// this is a whole-file port of a pure, zero-import leaf module.

/** Regex-based Mermaid syntax fixer for LLM-generated markdown (server-safe, no DOM). */

export const VALID_DIAGRAM_TYPES = [
  "flowchart",
  "graph",
  "sequenceDiagram",
  "classDiagram",
  "stateDiagram",
  "erDiagram",
  "gantt",
  "pie",
  "gitgraph",
  "mindmap",
  "timeline",
  "quadrantChart",
  "xychart-beta",
  "block-beta",
  "sankey-beta",
  "packet-beta",
];

/**
 * Locate every fenced ```mermaid block in document order, returning each block's
 * full fenced text (`original`), its inner code body (`code`, the regex capture),
 * and its byte offset (`start`). Shared by `validateMermaidBlocks` here and the
 * corrective-retry sub-pass in generate-one-page, which splices a repaired block
 * back at `start` using `original.length`. The capture group is identical to the
 * one `findInvalidMermaidBlocks` uses, so `code` can be matched across the two.
 *
 * A fresh regex per call avoids shared `lastIndex` state across concurrent
 * invocations.
 */
export function scanMermaidBlocks(
  markdown: string,
): Array<{ original: string; code: string; start: number }> {
  const blocks: Array<{ original: string; code: string; start: number }> = [];
  const re = /```mermaid\s*\n([\s\S]*?)```/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(markdown)) !== null) {
    blocks.push({ original: match[0], code: match[1], start: match.index });
  }
  return blocks;
}

export function validateMermaidBlocks(markdown: string): string {
  const blocks = scanMermaidBlocks(markdown);

  if (blocks.length === 0) return markdown;

  let result = markdown;

  // Process blocks in reverse order to preserve indices
  for (let i = blocks.length - 1; i >= 0; i--) {
    const block = blocks[i];
    const fixed = fixMermaidBlock(block.code);

    if (fixed !== block.code) {
      // Replace with the regex-repaired version (quoted labels, balanced
      // brackets). Unknown-header and empty blocks are returned unchanged by
      // fixMermaidBlock and kept verbatim — the client renders them or shows
      // the source; the invalid-diagram signal is emitted upstream.
      const replacement = "```mermaid\n" + fixed + "```";
      result =
        result.slice(0, block.start) +
        replacement +
        result.slice(block.start + block.original.length);
    }
    // If fixed === block.code, no change needed
  }

  return result;
}

/**
 * Canonical VALID_DIAGRAM_TYPES entry whose name the first line starts with,
 * or null. Single source of the mermaid header check shared by both validation
 * gates (fixMermaidBlock here and detectDiagramType in content-validator).
 */
export function matchDiagramType(code: string): string | null {
  const firstLine = code.trim().split("\n")[0]?.trim().toLowerCase() ?? "";
  return VALID_DIAGRAM_TYPES.find((t) => firstLine.startsWith(t.toLowerCase())) ?? null;
}

function fixMermaidBlock(code: string): string {
  const trimmed = code.trim();
  // Empty body: nothing to repair. Keep the block verbatim so the client can
  // surface it; the invalid-diagram signal is emitted upstream.
  if (!trimmed) return code;

  if (matchDiagramType(trimmed) === null) {
    // Unknown diagram type: not regex-repairable. Keep the block verbatim
    // (non-destructive) — the client renders or shows the source.
    return code;
  }

  const quoted = quoteSpecialCharsInLabels(trimmed);
  const fixed = fixUnbalancedBrackets(quoted);

  // Remove empty lines immediately after the diagram type declaration
  const fixedLines = fixed.split("\n");
  while (fixedLines.length > 1 && fixedLines[1].trim() === "") {
    fixedLines.splice(1, 1);
  }

  // Ensure trailing newline
  const result = fixedLines.join("\n");
  return result.endsWith("\n") ? result : result + "\n";
}

/**
 * Quote unquoted special chars ({, }, (, )) inside bracket labels.
 * e.g. `A[try { await fn() }]` → `A["try { await fn() }"]`
 */
export function quoteSpecialCharsInLabels(code: string): string {
  return code
    .split("\n")
    .map((line) => {
      // Match node definitions with bracket labels: ID[label]
      // The label must NOT start with " (which means it's already quoted).
      // [^"] ensures first char isn't a quote; [^\]]* matches rest up to ].
      return line.replace(
        /([A-Za-z0-9_]+)\[([^"\]][^\]]*)\]/g,
        (_match, id: string, label: string) => {
          // Only quote if label contains special chars
          if (/[{}()]/.test(label)) {
            // Escape any existing double quotes in the label
            const escaped = label.replace(/"/g, "'");
            return `${id}["${escaped}"]`;
          }
          return _match;
        }
      );
    })
    .join("\n");
}

/** Bracket/quote pairs used in Mermaid node labels: ["..."], ("..."), {"..."} */
const BRACKET_PAIRS: Array<{ open: RegExp; close: RegExp; closer: string }> = [
  { open: /\["/g, close: /"\]/g, closer: '"]' },
  { open: /\("/g, close: /"\)/g, closer: '")' },
  { open: /\{"/g, close: /"\}/g, closer: '"}' },
];

function fixUnbalancedBrackets(code: string): string {
  return code
    .split("\n")
    .map((line) => {
      let fixed = line;
      for (const { open, close, closer } of BRACKET_PAIRS) {
        const opens = (fixed.match(open) || []).length;
        const closes = (fixed.match(close) || []).length;
        if (opens > closes) fixed += closer;
      }
      return fixed;
    })
    .join("\n");
}
