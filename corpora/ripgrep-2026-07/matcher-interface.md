# Matcher Interface

<details>
<summary>Relevant source files</summary>

The following files were used as context for generating this wiki page:

- [crates/searcher/src/searcher/glue.rs](https://github.com/BurntSushi/ripgrep/blob/main/crates/searcher/src/searcher/glue.rs)
- [crates/matcher/src/lib.rs](https://github.com/BurntSushi/ripgrep/blob/main/crates/matcher/src/lib.rs)
- [crates/globset/src/lib.rs](https://github.com/BurntSushi/ripgrep/blob/main/crates/globset/src/lib.rs)
- [crates/core/search.rs](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/search.rs)
- [crates/searcher/src/searcher/core.rs](https://github.com/BurntSushi/ripgrep/blob/main/crates/searcher/src/searcher/core.rs)
- [crates/searcher/src/searcher/mod.rs](https://github.com/BurntSushi/ripgrep/blob/main/crates/searcher/src/searcher/mod.rs)
</details>

## Overview

The matcher interface provides a low-level text search abstraction designed to empower pattern matching across diverse regular expression and substring implementations. At its core, the system relies on an internal iteration or push model of searching where matcher implementations drive execution and invoke callbacks upon discovering matches, overcoming limitations in Rust's type system and supporting complex engines without sacrificing performance. Sources: [crates/matcher/src/lib.rs:1-35](https://github.com/BurntSushi/ripgrep/blob/main/crates/matcher/src/lib.rs#L1-L35)

> [!NOTE]
> The matcher interface acts as a foundational bridge between raw byte processing and higher-level search execution, cleanly separating pattern compilation and matching semantics from stream I/O and formatting logic. Sources: [crates/matcher/src/lib.rs:1-35](https://github.com/BurntSushi/ripgrep/blob/main/crates/matcher/src/lib.rs#L1-L35)

## Core Matcher Trait and Types

The search abstraction is anchored by the `Matcher` trait alongside supporting types that manage match ranges, capture groups, errors, and line-oriented matching conditions. Rather than enforcing external iteration, matchers drive execution through internal iteration methods such as `try_find_iter_at`, invoking caller-supplied closures for each discovered match. Sources: [crates/matcher/src/lib.rs:14-20](https://github.com/BurntSushi/ripgrep/blob/main/crates/matcher/src/lib.rs#L14-L20)

Sources: [crates/matcher/src/lib.rs:533-546](https://github.com/BurntSushi/ripgrep/blob/main/crates/matcher/src/lib.rs#L533-L546)

> [!NOTE]
> Implementors of the `Matcher` trait only require two mandatory methods: `find_at` and `new_captures`. All other searching, iteration, replacement, and shortest-match routines provide default implementations built on top of these primitives. Sources: [crates/matcher/src/lib.rs:535-546](https://github.com/BurntSushi/ripgrep/blob/main/crates/matcher/src/lib.rs#L535-L546)

The crate defines primitive structures representing match boundaries, line terminators, excluded byte sets, capture containers, and line match kinds.

Sources: [crates/matcher/src/lib.rs:43-531](https://github.com/BurntSushi/ripgrep/blob/main/crates/matcher/src/lib.rs#L43-L531)

| Type | Description | Key Methods / Variants | Sources: [crates/matcher/src/lib.rs:43-531](https://github.com/BurntSushi/ripgrep/blob/main/crates/matcher/src/lib.rs#L43-L531) |
| :--- | :--- | :--- | :--- |
| `Match` | Contiguous byte range `[start, end]` enforcing `start <= end`. | `new`, `zero`, `start`, `end`, `with_start`, `with_end`, `offset`, `len`, `is_empty` | Sources: [crates/matcher/src/lib.rs:43-156](https://github.com/BurntSushi/ripgrep/blob/main/crates/matcher/src/lib.rs#L43-L156) |
| `LineTerminator` | End-of-line marker (single byte or CRLF sequence). | `byte`, `crlf`, `is_crlf`, `as_byte`, `as_bytes`, `is_suffix` | Sources: [crates/matcher/src/lib.rs:183-266](https://github.com/BurntSushi/ripgrep/blob/main/crates/matcher/src/lib.rs#L183-L266) |
| `ByteSet` | Bitset covering 256 bytes indicating non-matching bytes. | `empty`, `full`, `add`, `add_all`, `remove`, `remove_all`, `contains` | Sources: [crates/matcher/src/lib.rs:275-362](https://github.com/BurntSushi/ripgrep/blob/main/crates/matcher/src/lib.rs#L275-L362) |
| `NoCaptures` | Always-empty capturing group implementation for matchers without captures. | `new`, `len`, `get` | Sources: [crates/matcher/src/lib.rs:463-488](https://github.com/BurntSushi/ripgrep/blob/main/crates/matcher/src/lib.rs#L463-L488) |
| `NoError` | Error type for matchers guaranteed never to fail. | Implements `std::error::Error`, `std::fmt::Display`, and `From<NoError> for std::io::Error` | Sources: [crates/matcher/src/lib.rs:490-516](https://github.com/BurntSushi/ripgrep/blob/main/crates/matcher/src/lib.rs#L490-L516) |
| `LineMatchKind` | Line search classification (`Confirmed` or `Candidate`). | `Confirmed(usize)`, `Candidate(usize)` | Sources: [crates/matcher/src/lib.rs:517-531](https://github.com/BurntSushi/ripgrep/blob/main/crates/matcher/src/lib.rs#L517-L531) |

> [!WARNING]
> The `NoError` error type's `Display` implementation and its `From` conversion into `std::io::Error` both panic with a bug message. They are designed for matchers that statically cannot produce errors and should never be formatted or converted. Sources: [crates/matcher/src/lib.rs:490-516](https://github.com/BurntSushi/ripgrep/blob/main/crates/matcher/src/lib.rs#L490-L516)

The `Captures` trait normalizes access to capturing groups across diverse underlying engines. Index `0` is strictly guaranteed to correspond to the overall match range. Sources: [crates/matcher/src/lib.rs:364-461](https://github.com/BurntSushi/ripgrep/blob/main/crates/matcher/src/lib.rs#L364-L461)

The `Matcher` trait exposes associated types `type Captures: Captures;` and `type Error: std::fmt::Display;`. Its execution orchestration relies on methods like `try_find_iter_at`, which drives search progression through consecutive non-overlapping matches:

```rust
pub trait Matcher {
    type Captures: Captures;
    type Error: std::fmt::Display;

    fn find_at(
        &self,
        haystack: &[u8],
        at: usize,
    ) -> Result<Option<Match>, Self::Error>;

    fn new_captures(&self) -> Result<Self::Captures, Self::Error>;
    // ...
}
```
Sources: [crates/matcher/src/lib.rs:546-584](https://github.com/BurntSushi/ripgrep/blob/main/crates/matcher/src/lib.rs#L546-L584)

When executing match iteration via `try_find_iter_at`, control flows through a loop that handles empty match progression and closure dispatch:

1. `try_find_iter_at()` initializes `last_end` to `at` and `last_match` to `None`. Sources: [crates/matcher/src/lib.rs:692-702](https://github.com/BurntSushi/ripgrep/blob/main/crates/matcher/src/lib.rs#L692-L702)
2. Checks if `last_end > haystack.len()`; if so, returns `Ok(Ok(()))`. Sources: [crates/matcher/src/lib.rs:704-707](https://github.com/BurntSushi/ripgrep/blob/main/crates/matcher/src/lib.rs#L704-L707)
3. Invokes `self.find_at(haystack, last_end)?` to locate the next match `m`. Sources: [crates/matcher/src/lib.rs:708-711](https://github.com/BurntSushi/ripgrep/blob/main/crates/matcher/src/lib.rs#L708-L711)
4. If `m.start == m.end`, detects an empty match: advances `last_end` to `m.end + 1` to guarantee progress, and skips re-accepting empty matches immediately following `last_match`. Otherwise, sets `last_end = m.end`. Sources: [crates/matcher/src/lib.rs:712-724](https://github.com/BurntSushi/ripgrep/blob/main/crates/matcher/src/lib.rs#L712-L724)
5. Updates `last_match = Some(m.end)` and executes `matched(m)`: if `Ok(true)`, continues iteration; if `Ok(false)`, terminates; if `Err(err)`, returns `Ok(Err(err))`. Sources: [crates/matcher/src/lib.rs:725-731](https://github.com/BurntSushi/ripgrep/blob/main/crates/matcher/src/lib.rs#L725-L731)

> [!TIP]
> Matcher references (`&'a M`) also implement `Matcher` by delegating all method calls directly to the underlying matcher implementation, enabling seamless passing of matcher references into combinators and search drivers. Sources: [crates/matcher/src/lib.rs:1133-1379](https://github.com/BurntSushi/ripgrep/blob/main/crates/matcher/src/lib.rs#L1133-L1379)

## Glob Pattern Matching Abstractions

The `GlobSet` subsystem in the `globset` crate provides simultaneous multi-strategy pattern matching against a single candidate path. When a collection of glob patterns is built via `GlobSet::new`, each individual glob is analyzed and mapped to one of seven specialized match strategies based on its syntactic structure. This approach optimizes the execution path by routing lookups through hash maps, Aho-Corasick automaton finders, or regex engines depending on what the pattern requires. Sources: [crates/globset/src/lib.rs:306-312](https://github.com/BurntSushi/ripgrep/blob/main/crates/globset/src/lib.rs#L306-L312)

Sources: [crates/globset/src/lib.rs:461-553](https://github.com/BurntSushi/ripgrep/blob/main/crates/globset/src/lib.rs#L461-L553)

The globset engine classifies patterns into distinct variants during set construction. Each variant implements a strategy for evaluating candidates efficiently.

Sources: [crates/globset/src/lib.rs:654-662](https://github.com/BurntSushi/ripgrep/blob/main/crates/globset/src/lib.rs#L654-L662)

| Strategy Variant | Internal Data Structure | Purpose and Matching Rule | Sources: [crates/globset/src/lib.rs:654-662](https://github.com/BurntSushi/ripgrep/blob/main/crates/globset/src/lib.rs#L654-L662) |
| :--- | :--- | :--- | :--- |
| `Literal` | `fnv::HashMap<Vec<u8>, Vec<usize>>` | Matches full candidate paths against exact byte strings. | Sources: [crates/globset/src/lib.rs:655](https://github.com/BurntSushi/ripgrep/blob/main/crates/globset/src/lib.rs#L655) |
| `BasenameLiteral` | `fnv::HashMap<Vec<u8>, Vec<usize>>` | Matches file basenames against exact byte strings, ignoring leading directory components. | Sources: [crates/globset/src/lib.rs:656](https://github.com/BurntSushi/ripgrep/blob/main/crates/globset/src/lib.rs#L656) |
| `Extension` | `fnv::HashMap<Vec<u8>, Vec<usize>>` | Matches file extensions against exact byte strings. | Sources: [crates/globset/src/lib.rs:657](https://github.com/BurntSushi/ripgrep/blob/main/crates/globset/src/lib.rs#L657) |
| `Prefix` | `PrefixStrategy` (Aho-Corasick + `Vec<usize>`) | Finds overlapping prefix matches where the match starts at byte index `0`. | Sources: [crates/globset/src/lib.rs:658](https://github.com/BurntSushi/ripgrep/blob/main/crates/globset/src/lib.rs#L658) |
| `Suffix` | `SuffixStrategy` (Aho-Corasick + `Vec<usize>`) | Finds overlapping suffix matches where the match ends at `path.len()`. | Sources: [crates/globset/src/lib.rs:659](https://github.com/BurntSushi/ripgrep/blob/main/crates/globset/src/lib.rs#L659) |
| `RequiredExtension` | `RequiredExtensionStrategy` (HashMap of regexes) | Matches paths that share a specific file extension and satisfy an additional regex constraint. | Sources: [crates/globset/src/lib.rs:660](https://github.com/BurntSushi/ripgrep/blob/main/crates/globset/src/lib.rs#L660) |
| `Regex` | `RegexSetStrategy` (Regex + Pool) | Fallback strategy using regex automata and a pool of `PatternSet` objects for complex patterns. | Sources: [crates/globset/src/lib.rs:661](https://github.com/BurntSushi/ripgrep/blob/main/crates/globset/src/lib.rs#L661) |

When compiling a collection of globs into a `GlobSet`, control flows through a parsing, classification, and aggregation pipeline:

1. `GlobSet::new()` takes an iterator of items implementing `AsRef<Glob>`, initializes a peekable iterator, and returns an empty set immediately if no patterns are present. Sources: [crates/globset/src/lib.rs:461-469](https://github.com/BurntSushi/ripgrep/blob/main/crates/globset/src/lib.rs#L461-L469)
2. Allocates strategy builders (`LiteralStrategy`, `BasenameLiteralStrategy`, `ExtensionStrategy`, `MultiStrategyBuilder` for prefixes/suffixes/regexes, and `RequiredExtensionStrategyBuilder`). Sources: [crates/globset/src/lib.rs:471-478](https://github.com/BurntSushi/ripgrep/blob/main/crates/globset/src/lib.rs#L471-L478)
3. Iterates over each glob pattern, matching its derived `MatchStrategy` variant in a `match` block. Depending on the variant, it calls `.add(i, ...)` on the corresponding strategy builder, mapping the global glob index `i`. Sources: [crates/globset/src/lib.rs:479-514](https://github.com/BurntSushi/ripgrep/blob/main/crates/globset/src/lib.rs#L479-L514)
4. After collecting all patterns, non-empty strategy builders are finalized and built (e.g. `prefixes.prefix()`, `regexes.regex_set()?`, `required_exts.build()?`), producing `GlobSetMatchStrategy` instances that are pushed into a vector. Sources: [crates/globset/src/lib.rs:526-550](https://github.com/BurntSushi/ripgrep/blob/main/crates/globset/src/lib.rs#L526-L550)
5. Returns `Ok(GlobSet { len, strats })`, packaging the total count and populated strategies for subsequent matching operations. Sources: [crates/globset/src/lib.rs:552-553](https://github.com/BurntSushi/ripgrep/blob/main/crates/globset/src/lib.rs#L552-L553)

> [!NOTE]
> `Candidate` path creation via `Candidate::new` normalizes input paths, extracts file basenames, and parses file extensions upfront. This amortizes path decomposition costs across all strategies when checking a single path against a `GlobSet`. Sources: [crates/globset/src/lib.rs:592-638](https://github.com/BurntSushi/ripgrep/blob/main/crates/globset/src/lib.rs#L592-L638)

| Design Choice | Benefit | Cost | Sources: [crates/globset/src/lib.rs:461-1013](https://github.com/BurntSushi/ripgrep/blob/main/crates/globset/src/lib.rs#L461-L1013) |
| :--- | :--- | :--- | :--- |
| **Stratified matching engine separation** | Avoids running heavy regex engines on paths that can be filtered instantly by exact hash lookups or Aho-Corasick prefix/suffix checks. | Increased complexity during set construction and additional memory overhead to maintain multiple specialized collections. | Sources: [crates/globset/src/lib.rs:461-553](https://github.com/BurntSushi/ripgrep/blob/main/crates/globset/src/lib.rs#L461-L553) |
| **Pooling `PatternSet` instances in `RegexSetStrategy`** | Amortizes allocation costs across multiple search calls when evaluating regex-based glob sets. | Introduces interior synchronization or guard mechanisms (`Arcool<...>>`) to manage pooled instances safely across threads. | Sources: [crates/globset/src/lib.rs:964-1013](https://github.com/BurntSushi/ripgrep/blob/main/crates/globset/src/lib.rs#L964-L1013) |
| **Path normalization during `Candidate` construction** | Ensures consistent matching semantics regardless of redundant separators or path formatting differences. | Incurs a small upfront allocation and processing cost per path before matching begins. | Sources: [crates/globset/src/lib.rs:592-638](https://github.com/BurntSushi/ripgrep/blob/main/crates/globset/src/lib.rs#L592-L638) |

## Searcher Integration with Matcher Traits

Connecting matcher instances to low-level execution drivers is handled through glue primitives defined in `grep-searcher` that bridge abstract `Matcher` trait implementations with concrete line buffers, memory slices, and sinks. The searcher engine orchestrates three primary glue driver structs: `ReadByLine`, `SliceByLine`, and `MultiLine`. Each struct wraps a core execution engine (`Core<'s, M, S>`) along with input readers or slices to process text streams according to configuration rules and matcher capabilities. Sources: [crates/searcher/src/searcher/glue.rs:10-15](https://github.com/BurntSushi/ripgrep/blob/main/crates/searcher/src/searcher/glue.rs#L10-L15)

Sources: [crates/searcher/src/searcher/glue.rs:96-100](https://github.com/BurntSushi/ripgrep/blob/main/crates/searcher/src/searcher/glue.rs#L96-L100), [crates/searcher/src/searcher/glue.rs:141-147](https://github.com/BurntSushi/ripgrep/blob/main/crates/searcher/src/searcher/glue.rs#L141-L147)

Sources: [crates/searcher/src/searcher/glue.rs:10-36](https://github.com/BurntSushi/ripgrep/blob/main/crates/searcher/src/searcher/glue.rs#L10-L36), [crates/searcher/src/searcher/glue.rs:97-115](https://github.com/BurntSushi/ripgrep/blob/main/crates/searcher/src/searcher/glue.rs#L97-L115), [crates/searcher/src/searcher/glue.rs:142-164](https://github.com/BurntSushi/ripgrep/blob/main/crates/searcher/src/searcher/glue.rs#L142-L164)

| Glue Driver Struct | Input Type | Multi-Line Support | Primary Purpose | Sources: [crates/searcher/src/searcher/glue.rs:10-164](https://github.com/BurntSushi/ripgrep/blob/main/crates/searcher/src/searcher/glue.rs#L10-L164) |
| :--- | :--- | :--- | :--- | :--- |
| `ReadByLine` | `LineBufferReader<'s, R>` (`R: std::io::Read`) | No (`debug_assert!(!searcher.multi_line_with_matcher(&matcher))`) | Streams and searches I/O readers line-by-line while managing internal buffer rolling and consumption. | Sources: [crates/searcher/src/searcher/glue.rs:11-36](https://github.com/BurntSushi/ripgrep/blob/main/crates/searcher/src/searcher/glue.rs#L11-L36) |
| `SliceByLine` | `&'s [u8]` (Memory Slice) | No (`debug_assert!(!searcher.multi_line_with_matcher(&matcher))`) | Searches contiguous byte slices line-by-line without buffer allocation overhead. | Sources: [crates/searcher/src/searcher/glue.rs:97-115](https://github.com/BurntSushi/ripgrep/blob/main/crates/searcher/src/searcher/glue.rs#L97-L115) |
| `MultiLine` | `&'s [u8]` (Memory Slice) | Yes (`debug_assert!(searcher.multi_line_with_matcher(&matcher))`) | Handles multi-line matching across line boundaries with adjacent match grouping, context sinking, and inverted matching. | Sources: [crates/searcher/src/searcher/glue.rs:142-164](https://github.com/BurntSushi/ripgrep/blob/main/crates/searcher/src/searcher/glue.rs#L142-L164) |

When executing a line-buffered stream search, control flows through the `ReadByLine` lifecycle methods to initialize search state, pull buffered chunks, and finalize output:

1. `ReadByLine::run()` invokes `self.core.begin()?` to initialize the sink and emit any leading headers or state. Sources: [crates/searcher/src/searcher/glue.rs:38-39](https://github.com/BurntSushi/ripgrep/blob/main/crates/searcher/src/searcher/glue.rs#L38-L39)
2. Enters a `while self.fill()?` loop that feeds data into the active search buffer. Sources: [crates/searcher/src/searcher/glue.rs:40](https://github.com/BurntSushi/ripgrep/blob/main/crates/searcher/src/searcher/glue.rs#L40)
3. Inside `fill()`, `self.core.roll(self.rdr.buffer())` rolls unprocessed bytes, `self.rdr.consume(consumed)` updates read offsets, and `self.rdr.fill()` pulls fresh data from the underlying I/O reader. Sources: [crates/searcher/src/searcher/glue.rs:58-68](https://github.com/BurntSushi/ripgrep/blob/main/crates/searcher/src/searcher/glue.rs#L58-L68)
4. If binary data is detected and quitting is configured, `fill()` terminates early; otherwise, `self.core.match_by_line(self.rdr.buffer())` runs the matcher against the current buffer slice. Sources: [crates/searcher/src/searcher/glue.rs:41](https://github.com/BurntSushi/ripgrep/blob/main/crates/searcher/src/searcher/glue.rs#L41), [crates/searcher/src/searcher/glue.rs:69-86](https://github.com/BurntSushi/ripgrep/blob/main/crates/searcher/src/searcher/glue.rs#L69-L86)
5. Upon loop completion or break, `self.core.finish(...)` is called with absolute and binary byte offsets to flush remaining statistics and close the sink. Sources: [crates/searcher/src/searcher/glue.rs:47-50](https://github.com/BurntSushi/ripgrep/blob/main/crates/searcher/src/searcher/glue.rs#L47-L50)

> [!NOTE]
> `MultiLine::sink` delays reporting matches to group adjacent matches that start and end on the same line into a single sink event. If `last_match.end() >= line.start()`, the driver grows the existing match rather than sinking duplicate lines. Sources: [crates/searcher/src/searcher/glue.rs:223-248](https://github.com/BurntSushi/ripgrep/blob/main/crates/searcher/src/searcher/glue.rs#L223-L248)

| Design Choice | Benefit | Cost | Sources: [crates/searcher/src/searcher/glue.rs:11-256](https://github.com/BurntSushi/ripgrep/blob/main/crates/searcher/src/searcher/glue.rs#L11-L256) |
| :--- | :--- | :--- | :--- |
| **Separating `ReadByLine`, `SliceByLine`, and `MultiLine` drivers** | Optimizes execution paths specifically for stream buffering versus in-memory slice scanning and single-line versus multi-line patterns. | Duplicates control flow scaffolding across distinct driver structs. | Sources: [crates/searcher/src/searcher/glue.rs:11-150](https://github.com/BurntSushi/ripgrep/blob/main/crates/searcher/src/searcher/glue.rs#L11-L150) |
| **Delayed match sinking in `MultiLine`** | Prevents sinking the same line multiple times when adjacent or overlapping matches occur on a single line. | Requires maintaining `last_match` state buffers and conditional branch evaluation per match. | Sources: [crates/searcher/src/searcher/glue.rs:223-256](https://github.com/BurntSushi/ripgrep/blob/main/crates/searcher/src/searcher/glue.rs#L223-L256) |
| **Initial binary detection range capping (`DEFAULT_BUFFER_CAPACITY`)** | Avoids scanning entire massive files for binary indicators upfront, speeding up large file search startup. | Binary indicators located deep inside un-matched initial blocks may be missed until a match occurs further down. | Sources: [crates/searcher/src/searcher/glue.rs:168-171](https://github.com/BurntSushi/ripgrep/blob/main/crates/searcher/src/searcher/glue.rs#L168-L171) |

## Line Execution and Core Algorithm

The searcher core coordinates line-by-line matching, fast path acceleration, context window accumulation, and sink event dispatching. When `Core::match_by_line` is invoked, it evaluates whether the fast line matching path can be used, dispatching to `match_by_line_fast` or falling back to `match_by_line_slow`. Sources: [crates/searcher/src/searcher/core.rs:170-183](https://github.com/BurntSushi/ripgrep/blob/main/crates/searcher/src/searcher/core.rs#L170-L183)

When executing high-performance line scanning via the fast path, control flows through specific candidate detection and verification functions:

1. `Core::match_by_line()` evaluates `self.is_line_by_line_fast()` and invokes `self.match_by_line_fast(buf)?`. Sources: [crates/searcher/src/searcher/core.rs:174-175](https://github.com/BurntSushi/ripgrep/blob/main/crates/searcher/src/searcher/core.rs#L174-L175)
2. Inside `match_by_line_fast()`, a loop calls `self.find_by_line_fast(buf)?` to scan through the remaining slice positions. Sources: [crates/searcher/src/searcher/core.rs:392](https://github.com/BurntSushi/ripgrep/blob/main/crates/searcher/src/searcher/core.rs#L392), [crates/searcher/src/searcher/core.rs:400](https://github.com/BurntSushi/ripgrep/blob/main/crates/searcher/src/searcher/core.rs#L400)
3. `find_by_line_fast()` queries the underlying matcher via `self.matcher.find_candidate_line(&buf[pos..])`, returning either a confirmed match offset or a candidate offset. Sources: [crates/searcher/src/searcher/core.rs:488](https://github.com/BurntSushi/ripgrep/blob/main/crates/searcher/src/searcher/core.rs#L488)
4. If a `LineMatchKind::Candidate(i)` is returned, `lines::locate(...)` isolates the line range and `self.is_match(&buf[line])?` validates whether the candidate is a true positive. Sources: [crates/searcher/src/searcher/core.rs:505-513](https://github.com/BurntSushi/ripgrep/blob/main/crates/searcher/src/searcher/core.rs#L505-L513)
5. Upon confirmation, `match_by_line_fast()` triggers context collection (`after_context_by_line` and `before_context_by_line`) and invokes `self.sink_matched(buf, &line)?` to dispatch the match event to the sink. Sources: [crates/searcher/src/searcher/core.rs:403-414](https://github.com/BurntSushi/ripgrep/blob/main/crates/searcher/src/searcher/core.rs#L403-L414)

Sources: [crates/searcher/src/searcher/core.rs:170-183](https://github.com/BurntSushi/ripgrep/blob/main/crates/searcher/src/searcher/core.rs#L170-L183), [crates/searcher/src/searcher/core.rs:385-427](https://github.com/BurntSushi/ripgrep/blob/main/crates/searcher/src/searcher/core.rs#L385-L427), [crates/searcher/src/searcher/core.rs:475-519](https://github.com/BurntSushi/ripgrep/blob/main/crates/searcher/src/searcher/core.rs#L475-L519)

> [!WARNING]
> If `stop_on_nonmatch` is enabled and a match has previously occurred, `match_by_line_fast` aborts fast execution and returns `FastMatchResult::SwitchToSlow` to enforce non-matching stop semantics accurately. Sources: [crates/searcher/src/searcher/core.rs:393-395](https://github.com/BurntSushi/ripgrep/blob/main/crates/searcher/src/searcher/core.rs#L393-L395)

Sources: [crates/searcher/src/searcher/core.rs:14-18](https://github.com/BurntSushi/ripgrep/blob/main/crates/searcher/src/searcher/core.rs#L14-L18), [crates/searcher/src/searcher/core.rs:491-515](https://github.com/BurntSushi/ripgrep/blob/main/crates/searcher/src/searcher/core.rs#L491-L515)

| Variant / Constant | Type / Value | Purpose | Sources: [crates/searcher/src/searcher/core.rs:14-515](https://github.com/BurntSushi/ripgrep/blob/main/crates/searcher/src/searcher/core.rs#L14-L515) |
| :--- | :--- | :--- | :--- |
| `FastMatchResult::Continue` | Enum variant | Indicates fast matching completed successfully for the buffer and execution should continue. | Sources: [crates/searcher/src/searcher/core.rs:15](https://github.com/BurntSushi/ripgrep/blob/main/crates/searcher/src/searcher/core.rs#L15) |
| `FastMatchResult::Stop` | Enum variant | Signals that the search sink requested a stop or limit was reached, halting search execution. | Sources: [crates/searcher/src/searcher/core.rs:16](https://github.com/BurntSushi/ripgrep/blob/main/crates/searcher/src/searcher/core.rs#L16) |
| `FastMatchResult::SwitchToSlow` | Enum variant | Directs the search core to fall back from fast matching to the slow line-by-line matcher. | Sources: [crates/searcher/src/searcher/core.rs:17](https://github.com/BurntSushi/ripgrep/blob/main/crates/searcher/src/searcher/core.rs#L17) |
| `LineMatchKind::Confirmed(i)` | Enum variant | Represents an absolute match offset confirmed directly by the underlying matcher engine. | Sources: [crates/searcher/src/searcher/core.rs:491-496](https://github.com/BurntSushi/ripgrep/blob/main/crates/searcher/src/searcher/core.rs#L491-L496) |
| `LineMatchKind::Candidate(i)` | Enum variant | Represents a candidate match offset that requires secondary verification via `is_match`. | Sources: [crates/searcher/src/searcher/core.rs:505-513](https://github.com/BurntSushi/ripgrep/blob/main/crates/searcher/src/searcher/core.rs#L505-L513) |

> [!TIP]
> `sink_break_context` checks whether `last_line_visited < start_of_line` and context windows are active (`before_context > 0` or `after_context > 0`). If a gap exists between non-contiguous context blocks, it automatically invokes `sink.context_break` to separate matched regions. Sources: [crates/searcher/src/searcher/core.rs:646-659](https://github.com/BurntSushi/ripgrep/blob/main/crates/searcher/src/searcher/core.rs#L646-L659)

| Design Choice | Benefit | Cost | Sources: [crates/searcher/src/searcher/core.rs:114-671](https://github.com/BurntSushi/ripgrep/blob/main/crates/searcher/src/searcher/core.rs#L114-L671) |
| :--- | :--- | :--- | :--- |
| **Dual Fast and Slow Line Matchers** | Allows vector-accelerated or prefilter-based line skipping (`find_by_line_fast`) when patterns permit, while falling back to robust terminator-stripping (`match_by_line_slow`) for complex regexes. | Increases codebase complexity and requires duplicating match loop structures. | Sources: [crates/searcher/src/searcher/core.rs:330-383](https://github.com/BurntSushi/ripgrep/blob/main/crates/searcher/src/searcher/core.rs#L330-L383) |
| **Stripping Line Terminators in `is_match`** | Ensures line-oriented anchors like `(?m)^$` match correctly without spuriously matching extra positions past line breaks. | Imposes a minor slicing overhead on every candidate line inspection. | Sources: [crates/searcher/src/searcher/core.rs:114-122](https://github.com/BurntSushi/ripgrep/blob/main/crates/searcher/src/searcher/core.rs#L114-L122) |
| **Lazy Line Number Counting** | Avoids expensive newline counting across entire buffers upfront by tallying lines incrementally on-demand via `count_lines` during sinking. | Requires tracking `last_line_counted` state within the `Core` struct across chunk rolls. | Sources: [crates/searcher/src/searcher/core.rs:661-671](https://github.com/BurntSushi/ripgrep/blob/main/crates/searcher/src/searcher/core.rs#L661-L671) |

## Searcher Configuration and Resource Limits

Managing search options in ripgrep relies on `SearcherBuilder`, `Config`, `BinaryDetection`, and `Encoding` types. These components govern configuration rules including line terminators, binary detection strategies, transcoding encodings, and heap memory limits. Sources: [crates/searcher/src/searcher/mod.rs:34-146](https://github.com/BurntSushi/ripgrep/blob/main/crates/searcher/src/searcher/mod.rs#L34-L146)

Sources: [crates/searcher/src/searcher/mod.rs:151-236](https://github.com/BurntSushi/ripgrep/blob/main/crates/searcher/src/searcher/mod.rs#L151-L236), [crates/searcher/src/searcher/mod.rs:289-337](https://github.com/BurntSushi/ripgrep/blob/main/crates/searcher/src/searcher/mod.rs#L289-L337)

Binary detection heuristics identify whether data chunks are binary to avoid undesirable textual searches. The `BinaryDetection` struct supports three distinct strategies. Sources: [crates/searcher/src/searcher/mod.rs:34-55](https://github.com/BurntSushi/ripgrep/blob/main/crates/searcher/src/searcher/mod.rs#L34-L55)

Sources: [crates/searcher/src/searcher/mod.rs:57-118](https://github.com/BurntSushi/ripgrep/blob/main/crates/searcher/src/searcher/mod.rs#L57-L118)

| Variant Method | Behavior and Scope | Sources: [crates/searcher/src/searcher/mod.rs:57-118](https://github.com/BurntSushi/ripgrep/blob/main/crates/searcher/src/searcher/mod.rs#L57-L118) |
| :--- | :--- | :--- |
| `BinaryDetection::none()` | No binary detection is performed. Data may contain arbitrary bytes. This is the default. | Sources: [crates/searcher/src/searcher/mod.rs:58-64](https://github.com/BurntSushi/ripgrep/blob/main/crates/searcher/src/searcher/mod.rs#L58-L64) |
| `BinaryDetection::quit(binary_byte)` | Looks for `binary_byte`. In fixed buffers, if found, the search stops as if EOF was reached. In memory maps, a fixed initial region is scanned, and matching/context lines are checked. | Sources: [crates/searcher/src/searcher/mod.rs:66-81](https://github.com/BurntSushi/ripgrep/blob/main/crates/searcher/src/searcher/mod.rs#L66-81) |
| `BinaryDetection::convert(binary_byte)` | Looks for `binary_byte` and replaces it with the configured line terminator in fixed buffers. Ignored for memory maps. | Sources: [crates/searcher/src/searcher/mod.rs:83-97](https://github.com/BurntSushi/ripgrep/blob/main/crates/searcher/src/searcher/mod.rs#L83-97) |

> [!WARNING]
> When `BinaryDetection::convert` is used with memory-mapped searches, the setting has no effect and is ignored; conversion only operates when searching via fixed-size buffers. Sources: [crates/searcher/src/searcher/mod.rs:93-94](https://github.com/BurntSushi/ripgrep/blob/main/crates/searcher/src/searcher/mod.rs#L93-L94)

Building a searcher validates the `Config` via `SearcherBuilder::build()`. Mismatched settings between the matcher and searcher trigger configuration errors. Sources: [crates/searcher/src/searcher/mod.rs:238-262](https://github.com/BurntSushi/ripgrep/blob/main/crates/searcher/src/searcher/mod.rs#L238-L262)

Sources: [crates/searcher/src/searcher/mod.rs:314-337](https://github.com/BurntSushi/ripgrep/blob/main/crates/searcher/src/searcher/mod.rs#L314-L337)

| Error Variant | Cause | Sources: [crates/searcher/src/searcher/mod.rs:244-261](https://github.com/BurntSushi/ripgrep/blob/main/crates/searcher/src/searcher/mod.rs#L244-L261) |
| :--- | :--- | :--- |
| `ConfigError::SearchUnavailable` | Heap limit configuration prevents all possible search strategies from being used (e.g., heap limit is `0` with mmap disabled). | Sources: [crates/searcher/src/searcher/mod.rs:245-248](https://github.com/BurntSushi/ripgrep/blob/main/crates/searcher/src/searcher/mod.rs#L245-L248) |
| `ConfigError::MismatchedLineTerminators` | The matcher reports a line terminator different from the one configured in the searcher. | Sources: [crates/searcher/src/searcher/mod.rs:249-256](https://github.com/BurntSushi/ripgrep/blob/main/crates/searcher/src/searcher/mod.rs#L249-L256) |
| `ConfigError::UnknownEncoding` | The provided encoding label does not correspond to a valid encoding in the Encoding Standard. | Sources: [crates/searcher/src/searcher/mod.rs:257-261](https://github.com/BurntSushi/ripgrep/blob/main/crates/searcher/src/searcher/mod.rs#L257-L261) |

Constructing a searcher from a builder executes a deterministic validation and allocation pipeline:

1. `SearcherBuilder::build()` clones the internal `Config` and applies `passthru` overrides (`before_context = 0`, `after_context = 0`). Sources: [crates/searcher/src/searcher/mod.rs:315-320](https://github.com/BurntSushi/ripgrep/blob/main/crates/searcher/src/searcher/mod.rs#L315-L320)
2. `DecodeReaderBytesBuilder::new()` initializes transcoding rules, setting up BOM sniffing, BOM overrides, and UTF-8 passthrough flags from `Config`. Sources: [crates/searcher/src/searcher/mod.rs:322-328](https://github.com/BurntSushi/ripgrep/blob/main/crates/searcher/src/searcher/mod.rs#L322-L328)
3. `Config::line_buffer()` instantiates and configures a `LineBufferBuilder` with the searcher's line terminator and binary detection mode. Sources: [crates/searcher/src/searcher/mod.rs:218-223](https://github.com/BurntSushi/ripgrep/blob/main/crates/searcher/src/searcher/mod.rs#L218-L223)
4. If `heap_limit` is specified, `Config::line_buffer()` splits the capacity against `DEFAULT_BUFFER_CAPACITY` and assigns `BufferAllocation::Error(additional)` before calling `builder.build()`. Sources: [crates/searcher/src/searcher/mod.rs:224-234](https://github.com/BurntSushi/ripgrep/blob/main/crates/searcher/src/searcher/mod.rs#L224-L234)
5. `Searcher` is assembled with wrapped buffers (`decode_buffer`, `line_buffer`, `multi_line_buffer`) ready for search execution. Sources: [crates/searcher/src/searcher/mod.rs:330-336](https://github.com/BurntSushi/ripgrep/blob/main/crates/searcher/src/searcher/mod.rs#L330-L336)

## High-Level Worker Search Abstraction

The search worker manages the high-level interaction points between the matcher, the searcher, and the printer. It coordinates input sources, file paths, preprocessor commands, and decompression pipelines during search execution. Sources: [crates/core/search.rs:4-8](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/search.rs#L4-L8)

When executing a search over a haystack, the worker determines the appropriate binary detection configuration, evaluates the input path, and selects the matching dispatch route:

1. `SearchWorker::search()` inspects `haystack.is_explicit()` to select between `self.config.binary_explicit` and `self.config.binary_implicit`. Sources: [crates/core/search.rs:249-253](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/search.rs#L249-L253)
2. `self.searcher.set_binary_detection(bin)` applies the selected binary detection mode to the underlying searcher. Sources: [crates/core/search.rs:257](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/search.rs#L257)
3. Branch condition evaluates the input type: if `haystack.is_stdin()` is true, it calls `self.search_reader(path, &mut io::stdin().lock())`; else if `self.should_preprocess(path)` is true, it calls `self.search_preprocessor(path)`; else if `self.should_decompress(path)` is true, it calls `self.search_decompress(path)`; otherwise, it falls back to `self.search_path(path)`. Sources: [crates/core/search.rs:258-266](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/search.rs#L258-L266)
4. `search_preprocessor()` spawns the preprocessor command via `std::process::Command::new(bin)`, passes the file path as an argument with input redirection from `File::open(path)?`, builds a command reader via `self.command_builder.build(&mut cmd)`, and searches the reader before closing the command handle. Sources: [crates/core/search.rs:302-323](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/search.rs#L302-L323)
5. `search_decompress()` builds a decompression reader via `decomp_builder.build(path)?`, searches its contents through `search_reader`, and closes the reader stream. Sources: [crates/core/search.rs:333-338](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/search.rs#L333-L338)
6. `search_path()` or `search_reader()` dispatches the underlying `PatternMatcher` variant (`RustRegex` or `PCRE2`) to execute `search_path` or `search_reader` against the printer's sink. Sources: [crates/core/search.rs:346-374](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/search.rs#L346-L374)

> [!WARNING]
> If a preprocessor command is explicitly configured, it completely overrides the `search_zip` decompression setting, bypassing automatic file decompression. Sources: [crates/core/search.rs:120-122](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/search.rs#L120-L122)

The search worker supports specific pattern matching engines and output printers configured at runtime. Sources: [crates/core/search.rs:191-211](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/search.rs#L191-L211)

| Enum Variant | Type Parameter / Inner Type | Purpose | Sources: [crates/core/search.rs:193-211](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/search.rs#L193-L211) |
| :--- | :--- | :--- | :--- |
| `PatternMatcher::RustRegex` | `grep::regex::RegexMatcher` | Uses Rust's regex engine for pattern matching. | Sources: [crates/core/search.rs:194](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/search.rs#L194) |
| `PatternMatcher::PCRE2` | `grep::pcre2::RegexMatcher` | Uses the PCRE2 regex engine for pattern matching (when feature enabled). | Sources: [crates/core/search.rs:195-197](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/search.rs#L195-L197) |
| `Printer::Standard` | `grep::printer::Standard<W>` | Uses the standard printer supporting classic grep-like formats. | Sources: [crates/core/search.rs:204-205](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/search.rs#L204-L205) |
| `Printer::Summary` | `grep::printer::Summary<W>` | Uses the summary printer supporting aggregate displays of search results. | Sources: [crates/core/search.rs:207-208](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/search.rs#L207-L208) |
| `Printer::JSON` | `grep::printer::JSON<W>` | Emits search results in the JSON Lines format. | Sources: [crates/core/search.rs:209-211](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/search.rs#L209-L211) |

| Design Choice | Benefit | Cost | Sources: [crates/core/search.rs:131-361](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/search.rs#L131-L361) |
| :--- | :--- | :--- | :--- |
| Direct `search_path` vs `search_reader` | Enables high-performance optimizations like memory maps (`mmap`) when searching files directly. | Requires separate code paths for standard files versus preprocessed or decompressed streams. | Sources: [crates/core/search.rs:359-361](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/search.rs#L359-L361) |
| Lazy `decomp_builder` initialization | Avoids non-trivial upfront work (such as resolving decompression binary paths on Windows) when zip searching is disabled. | Introduces an `Option` wrapper that must be checked on every compressed file evaluation. | Sources: [crates/core/search.rs:234-237](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/search.rs#L234-L237) |
| Separate `binary_implicit` and `binary_explicit` settings | Prevents recursive directory searches from aborting on user-specified files while allowing strict skip/quit rules for implicit discovery. | Requires maintaining dual configuration fields and duplicate binary detection logic per search invocation. | Sources: [crates/core/search.rs:131-161](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/search.rs#L131-L161) |

## Related

- [[Rust Regex Matching]]
- [[PCRE2 Matching]]

