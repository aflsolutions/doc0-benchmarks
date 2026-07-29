# Fuzzing Integration

<details>
<summary>Relevant source files</summary>

The following files were used as context for generating this wiki page:

- [crates/globset/src/lib.rs](https://github.com/BurntSushi/ripgrep/blob/main/crates/globset/src/lib.rs)
- [crates/globset/src/glob.rs](https://github.com/BurntSushi/ripgrep/blob/main/crates/globset/src/glob.rs)
- [crates/ignore/src/gitignore.rs](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/gitignore.rs)
- [crates/ignore/src/walk.rs](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/walk.rs)
</details>

## Overview

Fuzzing integration plays a critical role in testing the robustness, safety, and correctness of ripgrep's pattern matching and file traversal engines. By subjecting complex parser logic, regex compilation pipelines, and directory walkers to arbitrary byte sequences, fuzzing helps uncover edge cases such as unclosed character classes, dangling escape sequences, malformed alternation groups, and unexpected path normalization inputs.

Sources: [crates/globset/src/lib.rs:105-110](https://github.com/BurntSushi/ripgrep/blob/main/crates/globset/src/lib.rs#L105-L110), [crates/globset/src/glob.rs:74-81](https://github.com/BurntSushi/ripgrep/blob/main/crates/globset/src/glob.rs#L74-L81), [crates/ignore/src/gitignore.rs:103-117](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/gitignore.rs#L103-L117), [crates/ignore/src/walk.rs:1445-1528](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/walk.rs#L1445-L1528)

## Glob Syntax Parsing Target Analysis

### Overview

Fuzzing integration for glob pattern parsing relies on the `arbitrary` feature enabled on the [`Glob`](https://github.com/BurntSushi/ripgrep/blob/main/crates/globset/src/glob.rs#L74-L81) struct and its constituent [`GlobOptions`](https://github.com/BurntSushi/ripgrep/blob/main/crates/globset/src/glob.rs#L218-L237) and [`Token`](https://github.com/BurntSushi/ripgrep/blob/main/crates/globset/src/glob.rs#L268-L279) types. This permits fuzz engines to generate structurally random token sequences and options flags directly, testing whether the translation pipeline maintains invariant safety when converting arbitrary abstract syntax representations back into executable regular expressions.

Sources: [crates/globset/src/glob.rs:74-81](https://github.com/BurntSushi/ripgrep/blob/main/crates/globset/src/glob.rs#L74-L81), [crates/globset/src/glob.rs:218-237](https://github.com/BurntSushi/ripgrep/blob/main/crates/globset/src/glob.rs#L218-L237), [crates/globset/src/glob.rs:268-279](https://github.com/BurntSushi/ripgrep/blob/main/crates/globset/src/glob.rs#L268-L279)

### Token Parsing and Escape Handling

The parsing engine processes raw glob input strings via a peekable character iterator embedded in `Parser`. As characters are consumed, special metacharacters trigger specific token builder methods:

- `?` → pushing `Token::Any`
- `*` → parsing star tokens
- `[` → parsing character classes (subject to `allow_unclosed_class`)
- `{` → pushing alternate groups
- `}` → popping alternate groups
- `,` → parsing commas
- `\` → parsing backslashes

Sources: [crates/globset/src/glob.rs:791-816](https://github.com/BurntSushi/ripgrep/blob/main/crates/globset/src/glob.rs#L791-L816), [crates/globset/src/glob.rs:823-837](https://github.com/BurntSushi/ripgrep/blob/main/crates/globset/src/glob.rs#L823-L837)

The control flow for escape character handling during parsing processes checks `self.opts.backslash_escape`, bumping the next character or returning an error if the escape is dangling. When `backslash_escape` is disabled on systems where `\` is a path separator, it normalizes backslashes to literal forward slashes (`/`); otherwise, it treats them as literal backslashes.

Sources: [crates/globset/src/glob.rs:887-899](https://github.com/BurntSushi/ripgrep/blob/main/crates/globset/src/glob.rs#L887-L899)

> [!WARNING]
> When `allow_unclosed_class` is enabled, encountering an unclosed character class sets `self.found_unclosed_class = true` and rolls back parsing to treat the opening `[` as a literal `[`. This internal state flag prevents quadratic time complexity explosions when fuzzing deep repetition inputs like `[[[[[[[[[[[[[[[[[[[[[[[...]`.

Sources: [crates/globset/src/glob.rs:805-813](https://github.com/BurntSushi/ripgrep/blob/main/crates/globset/src/glob.rs#L805-L813), [crates/globset/src/glob.rs:962-1006](https://github.com/BurntSushi/ripgrep/blob/main/crates/globset/src/glob.rs#L962-L1006)

### Glob Tokens and Regex Translation Reference

The parser maps input patterns into discrete token variants, which are subsequently lowered into regex strings via token-to-regex conversion logic.

| Token Variant | Underlying Representation | Regex Translation Behavior |
| :--- | :--- | :--- |
| `Token::Literal(char)` | `char` | Escaped literal sequence via character escaping helpers |
| `Token::Any` | None | `[^/]` if `literal_separator` option is enabled; otherwise `.` |
| `Token::ZeroOrMore` | None | `[^/]*` if `literal_separator` option is enabled; otherwise `.*` |
| `Token::RecursivePrefix` | None | `(?:/?|.*/)` |
| `Token::RecursiveSuffix` | None | `/.*` |
| `Token::RecursiveZeroOrMore` | None | `(?:/|/.*/)` |
| `Token::Class` | `{ negated: bool, ranges: Vec<(char, char)> }` | Character class bracket expression `[...]` with optional `^` negation |
| `Token::Alternates` | `Vec<Tokens>` | Non-capturing alternation group `(?:pat1|pat2|...)` |

Sources: [crates/globset/src/glob.rs:268-279](https://github.com/BurntSushi/ripgrep/blob/main/crates/globset/src/glob.rs#L268-L279), [crates/globset/src/glob.rs:692-763](https://github.com/BurntSushi/ripgrep/blob/main/crates/globset/src/glob.rs#L692-L763)

## GlobSet Matching and Strategy Execution

### Overview

When compiling a collection of glob patterns into a [`GlobSet`](https://github.com/BurntSushi/ripgrep/blob/main/crates/globset/src/lib.rs#L306-L312), the crate classifies each pattern to determine the most specific, performant matching strategy available. This avoids running full regular expression evaluations for paths that can be resolved via exact string lookups, prefix/suffix checks, or hash-indexed extensions.

Sources: [crates/globset/src/lib.rs:461-514](https://github.com/BurntSushi/ripgrep/blob/main/crates/globset/src/lib.rs#L461-L514), [crates/globset/src/glob.rs:51-68](https://github.com/BurntSushi/ripgrep/blob/main/crates/globset/src/glob.rs#L51-L68)

### Strategy Selection and Translation Pipeline

During set construction, the builder iterates over input globs, inspects their structural classification, and populates dedicated strategy builders. The control flow for building these strategies iterates through input patterns, assigns them to appropriate strategy builders (`LiteralStrategy`, `BasenameLiteralStrategy`, `ExtensionStrategy`, prefix/suffix builders, required extension builders, or regex set strategies), and finalizes them into execution-ready strategy enums.

Sources: [crates/globset/src/lib.rs:461-553](https://github.com/BurntSushi/ripgrep/blob/main/crates/globset/src/lib.rs#L461-L553), [crates/globset/src/glob.rs:51-68](https://github.com/BurntSushi/ripgrep/blob/main/crates/globset/src/glob.rs#L51-L68)

| Match Strategy Variant | Underlying Data Structure | Matching Condition |
| :--- | :--- | :--- |
| `Literal` | `fnv::HashMap<Vec<u8>, Vec<usize>>` | Entire file path matches literal byte vector |
| `BasenameLiteral` | `fnv::HashMap<Vec<u8>, Vec<usize>>` | File path basename matches literal byte vector |
| `Extension` | `fnv::HashMap<Vec<u8>, Vec<usize>>` | File path extension matches literal byte vector |
| `Prefix` | `AhoCorasick` + `Vec<usize>` | Overlapping Aho-Corasick prefix search starting at index 0 |
| `Suffix` | `AhoCorasick` + `Vec<usize>` | Overlapping Aho-Corasick suffix search ending at path length |
| `RequiredExtension` | `fnv::HashMap<Vec<u8>, Vec<(usize, Regex)>>` | Extension matches hash table, followed by path regex verification |
| `Regex` | `Regex` (regex-automata) + `PoolatternSet>` | Overlapping regex set search via candidate path bytes |

Sources: [crates/globset/src/lib.rs:653-662](https://github.com/BurntSushi/ripgrep/blob/main/crates/globset/src/lib.rs#L653-L662)

> [!NOTE]
> For `RegexSetStrategy`, matching borrows a `PatternSet` from an `ArcoolatternSet, ...>>` via `self.patset.get()`, clears it, performs matching via `which_overlapping_matches`, and returns the guard to the pool via `PoolGuard::put(patset)` after collecting matches. This amortizes allocation overhead across high-throughput candidate evaluations.

Sources: [crates/globset/src/lib.rs:964-1012](https://github.com/BurntSushi/ripgrep/blob/main/crates/globset/src/lib.rs#L964-L1012)

### Design Trade-Offs in GlobSet Architecture

| Design Choice | Benefit | Cost |
| :--- | :--- | :--- |
| **Stratified matching strategies** (Hash maps for literals/extensions, Aho-Corasick for prefix/suffix, regex sets as fallback) | O(1) or linear-time filtering bypasses expensive regex engines for simple patterns. | Increased memory footprint and complex builder dispatch logic during set construction. |
| **`Candidate` path normalization wrapper** | Amortizes path parsing, normalization, basename extraction, and extension splitting across multiple globs. | Callers must construct and pass [`Candidate`](https://github.com/BurntSushi/ripgrep/blob/main/crates/globset/src/lib.rs#L598-L603) explicitly for optimal reuse. |
| **Pooled `PatternSet` instances in `RegexSetStrategy`** | Eliminates repeated heap allocations for matching bitsets during regex set execution. | Introduces lock/pool contention overhead and thread-safety constraints (`Send + Sync + UnwindSafe`). |

Sources: [crates/globset/src/lib.rs:461-553](https://github.com/BurntSushi/ripgrep/blob/main/crates/globset/src/lib.rs#L461-L553), [crates/globset/src/lib.rs:598-638](https://github.com/BurntSushi/ripgrep/blob/main/crates/globset/src/lib.rs#L598-L638), [crates/globset/src/lib.rs:964-1012](https://github.com/BurntSushi/ripgrep/blob/main/crates/globset/src/lib.rs#L964-L1012)

## Gitignore Rule Parsing and Evaluation

### Overview

The `gitignore` module implements the gitignore specification entirely from scratch, bypassing any dependency on external `git` command-line binaries. Parsing raw `.gitignore` lines involves managing escape sequences, whitelisting toggles (`!`), directory-only constraints (`/` suffixes), and absolute path matching semantics.

Sources: [crates/ignore/src/gitignore.rs:1-8](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/gitignore.rs#L1-L8)

### Call-Chain Execution Walkthrough: Adding and Evaluating Lines

When parsing and evaluating gitignore rules, execution flows through a precise sequence of builder operations and matching checks:

`GitignoreBuilder::add` reads files via a `BufReader` and processes each line by passing it to `add_line`, which strips comments (`#`) and trailing whitespace, inspects for escaped bangs or hashes, toggles whitelisting and directory-only flags, and compiles the resulting pattern via `GlobBuilder`.

Sources: [crates/ignore/src/gitignore.rs:403-539](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/gitignore.rs#L403-L539)

During path evaluation, execution proceeds via:
Methods such as `matched` invoke path stripping via `strip` to remove root prefixes and `./` components, acquire a pooled match vector from the internal pool, construct a `Candidate`, execute `matches_candidate_into` on the underlying `GlobSet`, and iterate through the matching indices in reverse precedence order to determine if the path is ignored or whitelisted.

Sources: [crates/ignore/src/gitignore.rs:202-282](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/gitignore.rs#L202-L282)

### Gitignore Rule Parsing Properties

| Property / Prefix | Parsing Condition | Semantic Effect |
| :--- | :--- | :--- |
| **Comment** | `line.starts_with("#")` | Ignores line entirely. |
| **Whitelist** | `line.starts_with("!")` | Marks `glob.is_whitelist = true`, allowing matching paths to be explicitly re-included. |
| **Absolute Path** | `line.starts_with("/")` | Treats pattern as anchored to the gitignore root, restricting wildcard matching across `/`. |
| **Directory-Only** | `line.as_bytes().last() == Some(&b'/')` | Sets `glob.is_only_dir = true`, ensuring pattern only matches directory entries. |
| **Doublestar Injection** | `!is_absolute && !line.chars().any(\|c\| c == '/')` | Prepends `**/` so the pattern matches anywhere in the tree hierarchy unless a doublestar prefix already exists. |

Sources: [crates/ignore/src/gitignore.rs:465-519](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/gitignore.rs#L465-L519)

> [!NOTE]
> When a glob ends with `/**`, `GitignoreBuilder::add_line` automatically appends `/*` to force matching everything inside the target directory while excluding the directory itself, aligning with standard gitignore behavior.

Sources: [crates/ignore/src/gitignore.rs:523-525](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/gitignore.rs#L523-L525)

### Design Trade-Offs in Gitignore Evaluation

| Design Choice | Benefit | Cost |
| :--- | :--- | :--- |
| **In-memory glob transformation & regex compilation** | Complete independence from external git processes with high-speed glob evaluation. | Complex string rewriting rules for relative paths, escaped characters, and trailing slashes. |
| **Reverse-order match iteration (`matches.iter().rev()`)** | Correctly honors gitignore precedence where later rules override earlier ones. | Requires iterating through all matching candidate indices instead of returning on first hit. |
| **Path prefix stripping (`Gitignore::strip`)** | Normalizes candidate paths against arbitrary root directories and leading `./` components. | Path manipulation overhead on every `matched` call if paths do not align with root. |

Sources: [crates/ignore/src/gitignore.rs:271-315](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/gitignore.rs#L271-L315), [crates/ignore/src/gitignore.rs:458-539](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/gitignore.rs#L458-L539)

## Directory Walk Matching and Filtering

### Overview

File traversal state and filtering logic govern how recursive directory iterators traverse directory hierarchies while respecting ignore stacks, depth boundaries, filesize limits, and parallel worker queues. The traversal machinery handles both single-threaded execution via `Walk` and multi-threaded work-stealing execution via `WalkParallel`.

Sources: [crates/ignore/src/walk.rs:1116-1124](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/walk.rs#L1116-L1124), [crates/ignore/src/walk.rs:1396-1415](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/walk.rs#L1396-L1415)

### Call-Chain Execution Walkthrough: Sequential and Parallel Traversal

During sequential iteration, entry processing follows a strict execution path through filtering and state management checks:

Iterators implemented via `Iterator for Walk` poll underlying event iterators, inspect directory and file events, execute skip checks to evaluate ignore matchers, verify stdout redirection constraints, check filesize limits, apply custom entry predicates, and update ignore state stacks.

Sources: [crates/ignore/src/walk.rs:1147-1181](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/walk.rs#L1147-L1181), [crates/ignore/src/walk.rs:1221-1251](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/walk.rs#L1221-L1251)

In parallel traversal mode (`WalkParallel::visit`), work distribution and task execution flow through worker pool initialization, thread spawning, and work-stealing queues where workers pop or steal tasks from local and sibling deques to process directories concurrently.

Sources: [crates/ignore/src/walk.rs:1445-1527](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/walk.rs#L1445-L1527), [crates/ignore/src/walk.rs:1691-1707](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/walk.rs#L1691-L1707)

### Traversal Filter Rules and Precedence

| Filter Stage | Evaluation Condition | Action on Match |
| :--- | :--- | :--- |
| **1. Glob Overrides** | Path matches user-defined override glob | Skips path if override is an ignore glob; continues if whitelist. |
| **2. Ignore Files** | Evaluated against `.ignore`, `.gitignore`, `.git/info/exclude`, global git | Skips path if ignored; continues if whitelisted. |
| **3. File Type Matcher** | Path checked against configured file types (non-directory) | Skips path if file type does not match. |
| **4. Hidden Files** | Path component starts with `.` (when hidden filtering enabled) | Skips path unless explicitly whitelisted. |
| **5. Max Filesize** | File size exceeds `max_filesize` limit (non-directory) | Skips path. |
| **6. Custom Filter** | User closure `Filter(ent)` returns `false` | Skips path and prevents descending into directories. |

Sources: [crates/ignore/src/walk.rs:454-486](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/walk.rs#L454-L486)

> [!NOTE]
> `skip_entry` performs trivial skipping checks (such as ignore stack evaluation and stdout redirection checks) before executing expensive operations like `stat` or cross-filesystem checks. This protects remote or slow virtual filesystems from unnecessary on-demand downloads.

Sources: [crates/ignore/src/walk.rs:1147-1162](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/walk.rs#L1147-L1162)

### Design Trade-Offs in Directory Traversal

| Design Choice | Benefit | Cost |
| :--- | :--- | :--- |
| **LIFO Work-Stealing Deques (`Deque::new_lifo`)** | Enforces depth-first traversal, preventing memory exhaustion on wide directory trees with numerous ignore files. | Stealing batches across threads requires atomic coordination and introduces synchronization overhead. |
| **Explicit `WalkEvent::Exit` Tracking** | Accurately models directory hierarchy nesting and ignore stack popping during iteration. | Requires wrapping underlying iterators in `WalkEventIter` to intercept depth transitions. |
| **Lazy CWD Discovery & Caching** | Avoids redundant environment calls when constructing builders and matchers. | Requires thread-safe once-lock synchronization (`OnceLock`) across shared walker configurations. |

Sources: [crates/ignore/src/walk.rs:1656-1660](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/walk.rs#L1656-L1660), [crates/ignore/src/walk.rs:1259-1312](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/walk.rs#L1259-L1312), [crates/ignore/src/walk.rs:1078-1100](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/walk.rs#L1078-L1100)

## Panic Prevention and Error Recovery

### Overview

Robust error handling and panic prevention across the `globset` and `ignore` modules ensure that malformed inputs, unclosed syntax constructs, and hostile patterns fail gracefully via structured error returns rather than crashing the runtime. Both parsing engines implement dedicated safeguards against quadratic parsing overheads and invalid state transitions.

Sources: [crates/globset/src/lib.rs:155-196](https://github.com/BurntSushi/ripgrep/blob/main/crates/globset/src/lib.rs#L155-L196), [crates/globset/src/glob.rs:811-814](https://github.com/BurntSushi/ripgrep/blob/main/crates/globset/src/glob.rs#L811-L814)

### Error Recovery and Unclosed Character Classes

When parsing glob patterns, the parser guards against malformed character classes and alternate groups. By default, an unclosed character class (such as `[` or `[abc`) returns an `ErrorKind::UnclosedClass` error. However, when `allow_unclosed_class` is enabled in `GlobOptions`, the parser rolls back its character iterator state, flags `found_unclosed_class`, and treats the opening `[` as a literal character.

Sources: [crates/globset/src/glob.rs:811-814](https://github.com/BurntSushi/ripgrep/blob/main/crates/globset/src/glob.rs#L811-L814), [crates/globset/src/glob.rs:984-1005](https://github.com/BurntSushi/ripgrep/blob/main/crates/globset/src/glob.rs#L984-L1005)

> [!WARNING]
> When `allow_unclosed_class` is enabled and an unclosed character class is encountered, `found_unclosed_class` is permanently set to `true` for that parser instance. This prevents the parser from attempting to parse subsequent character classes, defending against quadratic time complexity attacks on adversarial inputs like `[[[[[[[[[[[[[[[[[[[[[[[...`.

Sources: [crates/globset/src/glob.rs:811-814](https://github.com/BurntSushi/ripgrep/blob/main/crates/globset/src/glob.rs#L811-L814), [crates/globset/src/glob.rs:996-1000](https://github.com/BurntSushi/ripgrep/blob/main/crates/globset/src/glob.rs#L996-L1000)

### Error Kinds and Boundary Enforcement

The `globset` crate defines structured error variants via `ErrorKind` to categorize parsing and compilation failures.

| Error Kind | Trigger Condition |
| :--- | :--- |
| `UnclosedClass` | Character class missing closing `]` (when unclosed classes are disallowed). |
| `InvalidRange(char, char)` | Character range starts with a lexicographically larger character than it ends with (e.g., `[z-a]`). |
| `UnopenedAlternates` | A closing `}` or comma is found without a matching `{`. |
| `UnclosedAlternates` | An opening `{` is found without a matching `}`. |
| `Regex(String)` | Underlying regular expression compilation fails via `regex_automata`. |

Sources: [crates/globset/src/lib.rs:164-196](https://github.com/BurntSushi/ripgrep/blob/main/crates/globset/src/lib.rs#L164-L196)

> [!NOTE]
> `GitignoreBuilder` enables `allow_unclosed_class` by default during initialization to match established gitignore file semantics, prioritizing compatibility with loose POSIX glob patterns over strict syntax error reporting.

Sources: [crates/ignore/src/gitignore.rs:342-343](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/gitignore.rs#L342-L343), [crates/ignore/src/gitignore.rs:564-568](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/gitignore.rs#L564-L568)

## Related

- [[Glob Pattern Parsing]]

