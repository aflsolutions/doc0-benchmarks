# fetch-codewiki

Fetches a repository's wiki from [CodeWiki](https://codewiki.google) and
converts it into per-section markdown pages with machine-checkable citations,
for peer scoring against the `codewiki-*.manifest.json` manifests one
directory up.

## Usage

playwright is deliberately **not** a dependency of this repo (it is only
needed for this one fetcher). Install it locally first:

```sh
pnpm add -D playwright && npx playwright install chromium
```

Then:

```sh
npx tsx fetch.ts <owner/repo> <outDir>
```

Exit code `2` means CodeWiki does not cover the repo (its page 404s).

## Pipeline

1. **extract.js** — runs inside the rendered page: walks the DOM into
   markdown (headings, paragraphs, lists, tables, code blocks, GitHub
   citation links) and captures the generation commit SHA CodeWiki displays.
2. **split.ts** — splits the one-page extraction into per-h2-section page
   files plus a `_meta.json` recording that commit.
3. **normalize.ts** — rewrites citations (below).

`split.ts` and `normalize.ts` are also standalone CLIs for re-running a step
on an existing extraction.

## Citation normalization

CodeWiki's citation labels are symbol names; the file path exists only inside
the GitHub URL:

```md
[SymbolName](https://github.com/o/r/blob/<sha>/src/file.ts#L10-L20)
```

`normalize.ts` rewrites each citation to

```md
`SymbolName` [src/file.ts:10-20](https://github.com/o/r/blob/<sha>/src/file.ts#L10-L20)
```

so the symbol name stays in the prose (backticked) while the appended
`[path:start-end](url)` link is machine-readable — stripping citation links
removes only the citation, never words from the sentence. Target line ranges
are preserved exactly as CodeWiki emitted them.

## Commit pinning

Each CodeWiki page displays the commit its wiki was generated from;
`extract.js` captures it and `split.ts` stores it as `commit` in
`_meta.json`. Judge peer claims against a clone of the repo checked out at
that SHA, not at the repo's current head.

## Reproducibility caveat

CodeWiki pages regenerate over time, so a re-fetch is not guaranteed to match
what was scored. The `codewiki-*.manifest.json` manifests pin the SHA-256 of
each normalized page as of their `scored_at` date; `../fetch-peers.ts`
detects drift against those hashes.
