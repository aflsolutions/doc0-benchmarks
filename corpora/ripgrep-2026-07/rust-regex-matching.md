# Rust Regex Matching

<details>
<summary>Relevant source files</summary>

The following files were used as context for generating this wiki page:

- [crates/searcher/src/searcher/glue.rs](https://github.com/BurntSushi/ripgrep/blob/main/crates/searcher/src/searcher/glue.rs)
- [crates/globset/src/lib.rs](https://github.com/BurntSushi/ripgrep/blob/main/crates/globset/src/lib.rs)
- [crates/core/search.rs](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/search.rs)
- [crates/globset/src/glob.rs](https://github.com/BurntSushi/ripgrep/blob/main/crates/globset/src/glob.rs)
- [README.md](https://github.com/BurntSushi/ripgrep/blob/main/README.md)
</details>

## Overview

Rust regular expression matching forms the computational core of ripgrep's high-performance search infrastructure, bridging pattern compilation with low-level execution engines like `regex-automata`. By transforming shell globs into abstract syntax tree representations and matching multi-pattern sets concurrently against paths or streams, the regex subsystem delivers optimized string and byte-oriented search capabilities.

Sources: [crates/globset/src/lib.rs:2-13](https://github.com/BurntSushi/ripgrep/blob/main/crates/globset/src/lib.rs#L2-L13)

Search workers orchestrate the interaction points between regex matchers, line buffers, and printers, while searcher glue coordinates streaming and file-slice execution. Together, these architectural components allow ripgrep to execute sophisticated regex and glob matching strategies efficiently across diverse input sources.

Sources: [crates/core/search.rs:2-8](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/search.rs#L2-L8), [crates/searcher/src/searcher/glue.rs:10-15](https://github.com/BurntSushi/ripgrep/blob/main/crates/searcher/src/searcher/glue.rs#L10-L15)

## Search Worker High Level Abstraction

### Overview

The `SearchWorker` struct coordinates the high-level interaction between the regex engine (`PatternMatcher`), the data reader (`grep::searcher::Searcher`), and output formatters (`Printer`). Designed to execute multiple searches from a single thread, a worker applies binary detection rules, delegates to preprocessor commands, or falls back to standard file and stream execution.

Sources: [crates/core/search.rs:4-8](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/search.rs#L4-L8), [crates/core/search.rs:224-229](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/search.rs#L224-L229)

### Search Worker Execution Flow

When a search is initiated against a haystack, the `SearchWorker::search` method evaluates binary detection parameters and branches across execution pathways depending on whether the source is standard input, governed by a preprocessor, or recognized as compressed.

Sources: [crates/core/search.rs:245-267](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/search.rs#L245-L267)

The complete execution path flows through the following named functions:
`SearchWorker::search()` → `SearchWorker::search_reader()` (or `SearchWorker::search_preprocessor()`, `SearchWorker::search_decompress()`, `SearchWorker::search_path()`) → `search_reader()` (or `search_path()`) → `searcher.search_reader()` (or `searcher.search_path()`).

Sources: [crates/core/search.rs:245-267](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/search.rs#L245-L267), [crates/core/search.rs:296-351](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/search.rs#L296-L351), [crates/core/search.rs:380-448](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/search.rs#L380-L448)

> [!NOTE]
> `SearchWorker::search_path` provides direct file-system paths to the searcher, allowing optimizations such as memory maps (`mmap`), whereas stream-oriented branches must fall back to reading chunks via `search_reader`.

Sources: [crates/core/search.rs:358-361](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/search.rs#L358-L361)

### Configuration and Pattern Types

The worker behavior is defined by configuration builders and underlying strategy enums that encapsulate different matcher and printer backends.

Sources: [crates/core/search.rs:39-44](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/search.rs#L39-L44), [crates/core/search.rs:193-211](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/search.rs#L193-L211)

| Enum / Struct | Variants / Fields | Purpose |
| --- | --- | --- |
| `PatternMatcher` | `RustRegex(grep::regex::RegexMatcher)`, `PCRE2(grep::pcre2::RegexMatcher)` | Encapsulates the active regular expression backend. |
| `Printer<W>` | `Standard(grep::printer::Standard<W>)`, `Summary(grep::printer::Summary<W>)`, `JSON(grep::printer::JSON<W>)` | Formats and writes search hits and metadata to the underlying stream. |
| `Config` | `preprocessor`, `preprocessor_globs`, `search_zip`, `binary_implicit`, `binary_explicit` | High-level control toggles for preprocessing, decompression, and binary filtering. |

Sources: [crates/core/search.rs:19-25](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/search.rs#L19-L25), [crates/core/search.rs:193-211](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/search.rs#L193-L211)

## Buffer Search Glue and Matcher Integration

### Overview

Stream buffering and line-by-line execution glue bridges raw I/O readers, byte slices, and regular expression matchers in `grep-searcher`. The `glue.rs` module implements specialized runner structures—specifically `ReadByLine`, `SliceByLine`, and `MultiLine`—to orchestrate search iterations, manage input buffering, detect binary data, and dispatch matched text or context lines to sinks.

Sources: [crates/searcher/src/searcher/glue.rs:10-15](https://github.com/BurntSushi/ripgrep/blob/main/crates/searcher/src/searcher/glue.rs#L10-L15), [crates/searcher/src/searcher/glue.rs:96-100](https://github.com/BurntSushi/ripgrep/blob/main/crates/searcher/src/searcher/glue.rs#L96-L100), [crates/searcher/src/searcher/glue.rs:141-147](https://github.com/BurntSushi/ripgrep/blob/main/crates/searcher/src/searcher/glue.rs#L141-L147)

### Glue Runner Execution Architecture

The execution of searches is divided according to input representation and match constraints. `ReadByLine` handles stream-based matching using a `LineBufferReader`, while `SliceByLine` and `MultiLine` execute on contiguous byte slices.

Sources: [crates/searcher/src/searcher/glue.rs:10-15](https://github.com/BurntSushi/ripgrep/blob/main/crates/searcher/src/searcher/glue.rs#L10-L15), [crates/searcher/src/searcher/glue.rs:96-100](https://github.com/BurntSushi/ripgrep/blob/main/crates/searcher/src/searcher/glue.rs#L96-L100), [crates/searcher/src/searcher/glue.rs:141-147](https://github.com/BurntSushi/ripgrep/blob/main/crates/searcher/src/searcher/glue.rs#L141-L147)

The call-chain execution flow for single-line stream searching operates through the core loop:
`ReadByLine::run()` → `self.core.begin()` → `self.fill()` (invoking `self.core.roll()`, `self.rdr.consume()`, `self.rdr.fill()`) → `self.core.match_by_line()` → `self.core.finish()`

Sources: [crates/searcher/src/searcher/glue.rs:38-51](https://github.com/BurntSushi/ripgrep/blob/main/crates/searcher/src/searcher/glue.rs#L38-L51), [crates/searcher/src/searcher/glue.rs:58-88](https://github.com/BurntSushi/ripgrep/blob/main/crates/searcher/src/searcher/glue.rs#L58-L88)

> [!WARNING]
> In `ReadByLine::fill`, if rolling the buffer consumes zero bytes and refilling adds no new bytes, the runner forcefully terminates by consuming the remaining buffer length to prevent infinite loops on leftover context.
>
> Sources: [crates/searcher/src/searcher/glue.rs:79-86](https://github.com/BurntSushi/ripgrep/blob/main/crates/searcher/src/searcher/glue.rs#L79-L86)

### Glue Runner Types and Operations

The module defines structural runners to execute search strategies based on configuration flags and matcher capabilities.

Sources: [crates/searcher/src/searcher/glue.rs:10-15](https://github.com/BurntSushi/ripgrep/blob/main/crates/searcher/src/searcher/glue.rs#L10-L15), [crates/searcher/src/searcher/glue.rs:96-100](https://github.com/BurntSushi/ripgrep/blob/main/crates/searcher/src/searcher/glue.rs#L96-L100), [crates/searcher/src/searcher/glue.rs:141-147](https://github.com/BurntSushi/ripgrep/blob/main/crates/searcher/src/searcher/glue.rs#L141-L147)

| Struct Name | Type Parameters | Purpose |
| --- | --- | --- |
| `ReadByLine` | `'s`, `M`, `R`, `S` | Manages line-oriented buffered I/O stream reading and searching via `LineBufferReader`. |
| `SliceByLine` | `'s`, `M`, `S` | Executes single-line line-by-line matching directly over a contiguous `&'s [u8]` slice. |
| `MultiLine` | `'s`, `M`, `S` | Executes multiline pattern searching over a contiguous `&'s [u8]` slice with match overlapping and context handling. |

Sources: [crates/searcher/src/searcher/glue.rs:10-15](https://github.com/BurntSushi/ripgrep/blob/main/crates/searcher/src/searcher/glue.rs#L10-L15), [crates/searcher/src/searcher/glue.rs:96-100](https://github.com/BurntSushi/ripgrep/blob/main/crates/searcher/src/searcher/glue.rs#L96-L100), [crates/searcher/src/searcher/glue.rs:141-147](https://github.com/BurntSushi/ripgrep/blob/main/crates/searcher/src/searcher/glue.rs#L141-L147)

> [!NOTE]
> `ReadByLine::new` and `SliceByLine::new` assert via `debug_assert!(!searcher.multi_line_with_matcher(&matcher))` that single-line runners are never instantiated with multi-line configurations. Conversely, `MultiLine::new` asserts the exact opposite constraint.
>
> Sources: [crates/searcher/src/searcher/glue.rs:29-30](https://github.com/BurntSushi/ripgrep/blob/main/crates/searcher/src/searcher/glue.rs#L29-L30), [crates/searcher/src/searcher/glue.rs:109-110](https://github.com/BurntSushi/ripgrep/blob/main/crates/searcher/src/searcher/glue.rs#L109-L110), [crates/searcher/src/searcher/glue.rs:156-157](https://github.com/BurntSushi/ripgrep/blob/main/crates/searcher/src/searcher/glue.rs#L156-L157)

## Glob Token Parsing to Regex Conversion

### Overview

Glob parsing converts shell glob patterns into structured token trees and compiles them into byte-oriented regular expression strings. The parsing pipeline starts at `GlobBuilder::new()` and flows through `GlobBuilder::build()` to initialize a `Parser` struct that iterates over pattern characters using a character iterator.

Sources: [crates/globset/src/glob.rs:570-576](https://github.com/BurntSushi/ripgrep/blob/main/crates/globset/src/glob.rs#L570-L576), [crates/globset/src/glob.rs:578-610](https://github.com/BurntSushi/ripgrep/blob/main/crates/globset/src/glob.rs#L578-L610), [crates/globset/src/glob.rs:791-816](https://github.com/BurntSushi/ripgrep/blob/main/crates/globset/src/glob.rs#L791-L816)

The call-chain execution flow for compiling a glob pattern operates through the sequence:
`GlobBuilder::build()` → `Parser::parse()` → character-specific handlers (`Parser::parse_star()`, `Parser::parse_class()`, `Parser::push_alternate()`, `Parser::parse_backslash()`) → `Tokens::to_regex_with()` → `new_regex()`

Sources: [crates/globset/src/glob.rs:578-610](https://github.com/BurntSushi/ripgrep/blob/main/crates/globset/src/glob.rs#L578-L610), [crates/globset/src/glob.rs:673-690](https://github.com/BurntSushi/ripgrep/blob/main/crates/globset/src/glob.rs#L673-L690), [crates/globset/src/glob.rs:823-837](https://github.com/BurntSushi/ripgrep/blob/main/crates/globset/src/glob.rs#L823-L837)

### Token Variants and Representation

The parser recognizes standard wildcard constructs and builds a vector of enum tokens representing the pattern structure.

Sources: [crates/globset/src/glob.rs:268-279](https://github.com/BurntSushi/ripgrep/blob/main/crates/globset/src/glob.rs#L268-L279)

| Token Variant | Fields / Associated Data | Purpose |
| --- | --- | --- |
| `Literal` | `char` | Matches an exact character, properly escaped for regex compilation. |
| `Any` | None | Matches any single character (or non-separator byte if `literal_separator` is enabled). |
| `ZeroOrMore` | None | Matches zero or more characters (restricted to non-separators when `literal_separator` is active). |
| `RecursivePrefix` | None | Matches leading path components or root slashes via `(?:/?|__/)` alternatives. |
| `RecursiveSuffix` | None | Matches trailing recursive paths via `/.*`. |
| `RecursiveZeroOrMore` | None | Matches recursive directory segments via `(?:/|/.*/)` patterns. |
| `Class` | `negated: bool`, `ranges: Vec<(char, char)>` | Matches character classes and negated ranges, handling invalid bounds or unclosed classes. |
| `Alternates` | `Vec<Tokens>` | Matches alternative sub-patterns enclosed in braces, such as `{a,b}`. |

Sources: [crates/globset/src/glob.rs:268-279](https://github.com/BurntSushi/ripgrep/blob/main/crates/globset/src/glob.rs#L268-L279)

### Options and Design Trade-offs

`GlobOptions` controls compilation semantics, balancing strict POSIX compatibility against performance and error reporting clarity.

Sources: [crates/globset/src/glob.rs:218-237](https://github.com/BurntSushi/ripgrep/blob/main/crates/globset/src/glob.rs#L218-L237)

| Design choice | Benefit | Cost |
| --- | --- | --- |
| Strict unclosed class error by default | Fails fast with clear syntax errors for malformed patterns. | Rejects permissive shell-style inputs unless explicitly configured. |
| Enabling `allow_unclosed_class` | Maximizes compatibility with loose POSIX glob expectations. | Degrades failure modes by treating unclosed brackets as literal text. |
| Byte-oriented regex compilation (`(?-u)`) | Correctly handles arbitrary non-UTF-8 filesystem paths and raw bytes. | Disables unicode-aware property matching inside regular expressions. |

Sources: [crates/globset/src/glob.rs:228-237](https://github.com/BurntSushi/ripgrep/blob/main/crates/globset/src/glob.rs#L228-L237), [crates/globset/src/glob.rs:673-675](https://github.com/BurntSushi/ripgrep/blob/main/crates/globset/src/glob.rs#L673-L675)

> [!WARNING]
> When `allow_unclosed_class` is enabled, failure to find a closing `]` triggers a parser rollback via saved iterator cloning (`self.chars = saved_chars`), pushing `Token::Literal('[')` instead of returning an error, and setting `found_unclosed_class = true` to prevent quadratic parsing behavior on nested brackets.
>
> Sources: [crates/globset/src/glob.rs:812-814](https://github.com/BurntSushi/ripgrep/blob/main/crates/globset/src/glob.rs#L812-L814), [crates/globset/src/glob.rs:964-1005](https://github.com/BurntSushi/ripgrep/blob/main/crates/globset/src/glob.rs#L964-L1005)

## GlobSet Matching and Strategy Dispatch

### Overview

Multi-pattern glob matching in `globset` is managed by `GlobSet`, which categorizes incoming `Glob` patterns into specialized match strategies during build time. Rather than running every path against a single monolithic regex or linear list, `GlobSet::new()` inspects each pattern's classification (`MatchStrategy`) and routes it into dedicated hash maps, Aho-Corasick automaton builders, or regex set structures. This strategy dispatch permits fast-path filtering for exact literals, basenames, file extensions, prefixes, suffixes, and required extensions before falling back to overlapping regex sets.

Sources: [crates/globset/src/lib.rs:461-553](https://github.com/BurntSushi/ripgrep/blob/main/crates/globset/src/lib.rs#L461-L553), [crates/globset/src/lib.rs:654-662](https://github.com/BurntSushi/ripgrep/blob/main/crates/globset/src/lib.rs#L654-L662)

### Call-Chain Execution Walkthrough

The compilation and execution path for building and matching across multiple glob strategies flows through specific internal functions:

1. `GlobSet::new(globs)` iterates over the provided patterns, calling `MatchStrategy::new(p)` for each individual glob.
2. Depending on the variant returned, it populates `LiteralStrategy`, `BasenameLiteralStrategy`, `ExtensionStrategy`, `MultiStrategyBuilder` (for prefix, suffix, or regex sets), or `RequiredExtensionStrategyBuilder`.
3. For regex-backed strategies, `MultiStrategyBuilder::regex_set()` invokes `new_regex_set(self.literals)` which configures `regex_automata::MatchKind::All`, builds the multi-pattern regex, and wraps pattern sets in an `ArcoolatternSet, PatternSetPoolFn>>`.
4. At runtime, `GlobSet::matches_candidate_into(path, into)` delegates to each active `GlobSetMatchStrategy` variant in `self.strats`, which executes `is_match`, `find_matches`, or `matches_into` on the underlying strategy and accumulates matching indices.
5. Finally, `into.sort()` and `into.dedup()` order and clean the accumulated indices before returning them to the caller.

Sources: [crates/globset/src/lib.rs:461-553](https://github.com/BurntSushi/ripgrep/blob/main/crates/globset/src/lib.rs#L461-L553), [crates/globset/src/lib.rs:664-706](https://github.com/BurntSushi/ripgrep/blob/main/crates/globset/src/lib.rs#L664-L706), [crates/globset/src/lib.rs:981-1012](https://github.com/BurntSushi/ripgrep/blob/main/crates/globset/src/lib.rs#L981-L1012), [crates/globset/src/lib.rs:1051-1061](https://github.com/BurntSushi/ripgrep/blob/main/crates/globset/src/lib.rs#L1051-L1061)

### Strategy Dispatch Reference

`GlobSetMatchStrategy` wraps seven distinct execution backends optimized for different structural segments of glob patterns.

Sources: [crates/globset/src/lib.rs:654-662](https://github.com/BurntSushi/ripgrep/blob/main/crates/globset/src/lib.rs#L654-L662)

| Strategy Variant | Underlying Data Structure | Matching Condition |
| --- | --- | --- |
| `Literal` | `fnv::HashMap<Vec<u8>, Vec<usize>>` | Exact full-path lookup via `candidate.path`. |
| `BasenameLiteral` | `fnv::HashMap<Vec<u8>, Vec<usize>>` | Exact file-name lookup via `candidate.basename`. |
| `Extension` | `fnv::HashMap<Vec<u8>, Vec<usize>>` | Exact extension lookup via `candidate.ext`. |
| `Prefix` | `AhoCorasick`, `Vec<usize>`, `longest: usize` | Overlapping prefix match starting at index 0 of `candidate.path_prefix()`. |
| `Suffix` | `AhoCorasick`, `Vec<usize>`, `longest: usize` | Overlapping suffix match ending at `path.len()` of `candidate.path_suffix()`. |
| `RequiredExtension` | `fnv::HashMap<Vec<u8>, Vec<(usize, Regex)>>` | Extension lookup followed by sub-pattern `Regex::is_match()` check on full path. |
| `Regex` | `Regex` (regex-automata), `Vec<usize>`, `ArcoolatternSet, ...>>` | Overlapping regex set search using pooled `PatternSet` buffers. |

Sources: [crates/globset/src/lib.rs:710-711](https://github.com/BurntSushi/ripgrep/blob/main/crates/globset/src/lib.rs#L710-L711), [crates/globset/src/lib.rs:742](https://github.com/BurntSushi/ripgrep/blob/main/crates/globset/src/lib.rs#L742), [crates/globset/src/lib.rs:780](https://github.com/BurntSushi/ripgrep/blob/main/crates/globset/src/lib.rs#L780), [crates/globset/src/lib.rs:818-822](https://github.com/BurntSushi/ripgrep/blob/main/crates/globset/src/lib.rs#L818-L822), [crates/globset/src/lib.rs:863-867](https://github.com/BurntSushi/ripgrep/blob/main/crates/globset/src/lib.rs#L863-L867), [crates/globset/src/lib.rs:908](https://github.com/BurntSushi/ripgrep/blob/main/crates/globset/src/lib.rs#L908), [crates/globset/src/lib.rs:964-976](https://github.com/BurntSushi/ripgrep/blob/main/crates/globset/src/lib.rs#L964-L976)

### Strategy Design Trade-offs

| Design choice | Benefit | Cost |
| --- | --- | --- |
| Hash map indexing for literals, basenames, and extensions | O(1) average-case lookup time bypassing automaton overhead entirely. | Higher memory footprint for distinct maps when many unique strings exist. |
| Aho-Corasick automaton for prefixes and suffixes | Matches multiple prefix or suffix patterns simultaneously in a single pass. | Requires pre-filtering candidates by `longest` byte length bounds. |
| Pooled `PatternSet` allocation (`ArcoolatternSet, ...>>`) | Amortizes allocation costs across recurring candidate matches in `RegexSetStrategy`. | Retains thread-safe synchronization overhead and requires explicit pool guard return. |
| Multiple heterogeneous strategy vectors in `GlobSet` | Executes specialized fast-path strategies before falling back to heavy regex engines. | Adds branching overhead and requires sorting/deduplicating matched indices across strategies. |

Sources: [crates/globset/src/lib.rs:311-312](https://github.com/BurntSushi/ripgrep/blob/main/crates/globset/src/lib.rs#L311-L312), [crates/globset/src/lib.rs:447-456](https://github.com/BurntSushi/ripgrep/blob/main/crates/globset/src/lib.rs#L447-L456), [crates/globset/src/lib.rs:710-711](https://github.com/BurntSushi/ripgrep/blob/main/crates/globset/src/lib.rs#L710-L711), [crates/globset/src/lib.rs:818-822](https://github.com/BurntSushi/ripgrep/blob/main/crates/globset/src/lib.rs#L818-L822), [crates/globset/src/lib.rs:964-976](https://github.com/BurntSushi/ripgrep/blob/main/crates/globset/src/lib.rs#L964-L976)

> [!NOTE]
> `RegexSetStrategy` utilizes a pooled `PatternSet` via `self.patset.get()` to retrieve a reusable match vector, and explicitly calls `PoolGuard::put(patset)` after iterating over matches to return it to the pool, preventing allocation thrashing during high-throughput path evaluation.
>
> Sources: [crates/globset/src/lib.rs:971-976](https://github.com/BurntSushi/ripgrep/blob/main/crates/globset/src/lib.rs#L971-L976), [crates/globset/src/lib.rs:986-995](https://github.com/BurntSushi/ripgrep/blob/main/crates/globset/src/lib.rs#L986-L995), [crates/globset/src/lib.rs:1002-1012](https://github.com/BurntSushi/ripgrep/blob/main/crates/globset/src/lib.rs#L1002-L1012)

## System Architecture and Performance Overview

### Overview

Ripgrep achieves its search performance by combining Rust's finite automata regex engine with parallel directory iteration and automatic searching strategies. At its core, the tool utilizes deterministic and non-deterministic finite automata directly integrated with SIMD acceleration and aggressive literal optimizations.

Sources: [README.md:188-194](https://github.com/BurntSushi/ripgrep/blob/main/README.md#L188-L194)

### Search Engine Architecture and Optimizations

The matching subsystem relies on multiple cooperative components designed to handle varying search workloads efficiently:

* **Finite Automata & UTF-8 Decoding:** Rust's regex library builds UTF-8 decoding directly into its deterministic finite automaton (DFA) engine, maintaining high performance while enforcing full Unicode support.
* **Literal Pre-filtering:** When patterns contain literal prefixes or substrings, ripgrep bypasses general automaton execution for non-matching regions using fast literal searchers.
* **RegexSet Match Evaluation:** Ignore patterns and multi-pattern searches are evaluated simultaneously using a `RegexSet`, allowing a single file path or line to be matched against numerous patterns in parallel.

Sources: [README.md:191-205](https://github.com/BurntSushi/ripgrep/blob/main/README.md#L191-L205)

> [!NOTE]
> Ripgrep automatically selects between memory maps and incremental buffering based on the target input. Memory-mapped searching is optimized for single large files, whereas incremental buffering with intermediate blocks is favored for recursive directory traversals across large file trees.
>
> Sources: [README.md:198-201](https://github.com/BurntSushi/ripgrep/blob/main/README.md#L198-L201)

## Related

- [[Matcher Interface]]
- [[Regex Options]]

