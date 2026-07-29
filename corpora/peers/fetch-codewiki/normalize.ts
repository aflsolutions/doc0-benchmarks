// Normalizes CodeWiki citations WITHOUT destroying prose. CodeWiki's citation
// labels are symbol names with the file path present only in the GitHub URL:
//
//   [SymbolName](https://github.com/o/r/blob/<sha>/src/file.ts#L10-L20)
//
// That is rewritten to
//
//   `SymbolName` [src/file.ts:10-20](https://github.com/o/r/blob/<sha>/src/file.ts#L10-L20)
//
// so the symbol name stays in the sentence (backticked) while the appended
// [path:start-end](url) link is machine-readable. A scorer that strips
// citation links then removes only the citation, leaving the prose intact.
// Target line ranges are preserved exactly as CodeWiki emitted them.
//
//   npx tsx normalize.ts <pagesDir>
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const CITE =
  /\[([^\]]+?)\]\((https:\/\/github\.com\/[^/)]+\/[^/)]+\/blob\/[0-9a-f]{7,40}\/([^)#]+)#L(\d+)(?:-L?(\d+))?)\)/g;

/** A label that is already `path:start[-end]` came from a previous
 * normalization pass — rewriting it again would stack path tokens into the
 * prose and change page hashes on every rerun. */
const ALREADY_NORMALIZED_LABEL = /^\S+:\d+(?:-\d+)?$/;

export interface NormalizeResult {
  files: number;
  rewritten: number;
}

/** Rewrites every GitHub blob citation in the directory's `.md` files in
 * place; returns how many files were scanned and citations rewritten. */
export function normalizeCitations(dir: string): NormalizeResult {
  let files = 0;
  let rewritten = 0;
  for (const file of readdirSync(dir)) {
    if (!file.endsWith(".md")) continue;
    const path = join(dir, file);
    const src = readFileSync(path, "utf-8");
    let count = 0;
    const out = src.replace(
      CITE,
      (match: string, label: string, url: string, filePath: string, l1: string, l2: string | undefined) => {
        if (ALREADY_NORMALIZED_LABEL.test(label.trim())) return match;
        count++;
        const range = l2 && l2 !== l1 ? `${l1}-${l2}` : l1;
        const name = label.replace(/`/g, "").trim();
        return `\`${name}\` [${filePath}:${range}](${url})`;
      },
    );
    if (count > 0) {
      writeFileSync(path, out);
      rewritten += count;
    }
    files++;
  }
  return { files, rewritten };
}

const isCliEntry =
  process.argv[1] !== undefined && resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isCliEntry) {
  const dir = process.argv[2];
  if (!dir) throw new Error("usage: npx tsx normalize.ts <pagesDir>");
  const { files, rewritten } = normalizeCitations(dir);
  console.log(`${dir}: ${files} files, ${rewritten} citations normalized`);
}
