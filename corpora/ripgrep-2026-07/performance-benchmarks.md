# Performance Benchmarks

<details>
<summary>Relevant source files</summary>

The following files were used as context for generating this wiki page:

- [crates/searcher/src/searcher/glue.rs](https://github.com/BurntSushi/ripgrep/blob/main/crates/searcher/src/searcher/glue.rs)
- [crates/printer/src/standard.rs](https://github.com/BurntSushi/ripgrep/blob/main/crates/printer/src/standard.rs)
- [crates/core/search.rs](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/search.rs)
</details>

## Overview

The search worker abstraction manages the high-level interaction points between the matcher, the searcher, and the printer, handling operations like file preprocessors and decompression. 
Sources: [crates/core/search.rs:4-8](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/search.rs#L4-L8)

The core search execution engine handles low-level glue logic, line matching across slices and buffers, and buffer management. 
Sources: [crates/searcher/src/searcher/glue.rs:10-151](https://github.com/BurntSushi/ripgrep/blob/main/crates/searcher/src/searcher/glue.rs#L10-L151)

The standard output formatting engine provides grep-like sink formatting, colorization, field separators, and line-to-match granularity mapping. 
Sources: [crates/printer/src/standard.rs:466-484](https://github.com/BurntSushi/ripgrep/blob/main/crates/printer/src/standard.rs#L466-L484)

## Search Worker Abstraction and Dispatch

The search worker abstraction manages high-level interactions between the matcher, searcher, and printer, handling preprocessors, decompression, and path-versus-stream dispatch. 
Sources: [crates/core/search.rs:1-8](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/search.rs#L1-L8)

The `Config` struct controls high-level search options such as preprocessors, glob overrides, zip searching, and binary detection settings for implicit and explicit paths. 
Sources: [crates/core/search.rs:14-25](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/search.rs#L14-L25)

The `SearchWorkerBuilder` constructs `SearchWorker` instances with default configurations and command readers. 
Sources: [crates/core/search.rs:39-59](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/search.rs#L39-L59)

| Configuration Field | Type | Default Value | Purpose |
| :--- | :--- | :--- | :--- |
| `preprocessor` | `Option<std::path::PathBuf>` | `None` | Path to an external command executed to transform file contents before searching. |
| `preprocessor_globs` | `ignore::overrides::Override` | `Override::empty()` | Glob patterns determining which files are routed through the preprocessor. |
| `search_zip` | `bool` | `false` | Enables automatic decompression and searching of compressed files. |
| `binary_implicit` | `grep::searcher::BinaryDetection` | `BinaryDetection::none()` | Binary detection strategy for recursively discovered files. |
| `binary_explicit` | `grep::searcher::BinaryDetection` | `BinaryDetection::none()` | Binary detection strategy for user-supplied paths. |

Sources: [crates/core/search.rs:19-36](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/search.rs#L19-L36)

> [!NOTE]
> Setting a preprocessor command via `SearchWorkerBuilder::preprocessor` automatically resolves the binary path using `grep::cli::resolve_binary`, overriding any active `search_zip` decompression setting. 
> Sources: [crates/core/search.rs:92-103](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/search.rs#L92-L103), [crates/core/search.rs:121-122](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/search.rs#L121-L122)

## Core Search Execution Engine

The low-level execution engine manages buffer management, line matching, and slice iteration across streams and memory-mapped chunks. It implements core loop structures such as `ReadByLine`, `SliceByLine`, and `MultiLine` to orchestrate pattern matching via `grep_matcher::Matcher` and sink dispatch. 
Sources: [crates/searcher/src/searcher/glue.rs:1-151](https://github.com/BurntSushi/ripgrep/blob/main/crates/searcher/src/searcher/glue.rs#L1-L151)

The execution engine defines three primary worker types responsible for executing searches across different input types and matcher configurations. 
Sources: [crates/searcher/src/searcher/glue.rs:10-15](https://github.com/BurntSushi/ripgrep/blob/main/crates/searcher/src/searcher/glue.rs#L10-L15), [crates/searcher/src/searcher/glue.rs:96-100](https://github.com/BurntSushi/ripgrep/blob/main/crates/searcher/src/searcher/glue.rs#L96-L100), [crates/searcher/src/searcher/glue.rs:141-147](https://github.com/BurntSushi/ripgrep/blob/main/crates/searcher/src/searcher/glue.rs#L141-L147)

| Struct Name | Generic Parameters | Purpose |
| :--- | :--- | :--- |
| `ReadByLine` | `'s, M, R, S` | Executes single-line searching over a buffered reader (`std::io::Read`). |
| `SliceByLine` | `'s, M, S` | Executes single-line searching over a contiguous byte slice (`&[u8]`). |
| `MultiLine` | `'s, M, S` | Executes multi-line pattern matching over a contiguous byte slice (`&[u8]`). |

Sources: [crates/searcher/src/searcher/glue.rs:10-15](https://github.com/BurntSushi/ripgrep/blob/main/crates/searcher/src/searcher/glue.rs#L10-L15), [crates/searcher/src/searcher/glue.rs:96-100](https://github.com/BurntSushi/ripgrep/blob/main/crates/searcher/src/searcher/glue.rs#L96-L100), [crates/searcher/src/searcher/glue.rs:141-147](https://github.com/BurntSushi/ripgrep/blob/main/crates/searcher/src/searcher/glue.rs#L141-L147)

The core line-buffered search loop processes byte streams through an explicit sequence of state transitions and buffer operations:

`ReadByLine::run()` → `self.core.begin()` → `self.fill()` → `self.rdr.roll()` → `self.rdr.fill()` → `self.core.match_by_line()` → `self.core.finish()`

Sources: [crates/searcher/src/searcher/glue.rs:38-51](https://github.com/BurntSushi/ripgrep/blob/main/crates/searcher/src/searcher/glue.rs#L38-L51), [crates/searcher/src/searcher/glue.rs:58-88](https://github.com/BurntSushi/ripgrep/blob/main/crates/searcher/src/searcher/glue.rs#L58-L88)

> [!WARNING]
> In `ReadByLine::fill`, if rolling the buffer results in zero consumed bytes and refilling adds no new data, the engine forcefully consumes the remaining buffer length and quits to prevent infinite loops on leftover context. 
> Sources: [crates/searcher/src/searcher/glue.rs:79-86](https://github.com/BurntSushi/ripgrep/blob/main/crates/searcher/src/searcher/glue.rs#L79-L86)

| Design Choice | Benefit | Cost |
| :--- | :--- | :--- |
| Line-buffered chunking (`ReadByLine`) | Handles arbitrarily large streams with bounded heap allocation. | Requires buffer rolling logic to preserve context across chunk boundaries. |
| Slice-based searching (`SliceByLine`, `MultiLine`) | Eliminates buffering overhead when the entire input is already in memory. | Demands contiguous memory allocation matching the input file size. |
| Delayed multi-line matching (`MultiLine::sink`) | Groups adjacent and overlapping matches into a single sink event. | Requires tracking `last_match` state and handling trailing context post-loop. |

Sources: [crates/searcher/src/searcher/glue.rs:38-94](https://github.com/BurntSushi/ripgrep/blob/main/crates/searcher/src/searcher/glue.rs#L38-L94), [crates/searcher/src/searcher/glue.rs:117-131](https://github.com/BurntSushi/ripgrep/blob/main/crates/searcher/src/searcher/glue.rs#L117-L131), [crates/searcher/src/searcher/glue.rs:166-258](https://github.com/BurntSushi/ripgrep/blob/main/crates/searcher/src/searcher/glue.rs#L166-L258)

## Standard Output Formatting Engine

The standard output formatting engine implements grep-like layout rendering, colorization, and field separation via the [`Standard`](https://github.com/BurntSushi/ripgrep/blob/main/crates/printer/src/standard.rs#L480-L484) printer and [`StandardSink`](https://github.com/BurntSushi/ripgrep/blob/main/crates/printer/src/standard.rs#L639-L650). It formats matching lines, contextual blocks, and file paths using configurable separators, terminal coloring specs, and hyperlink interpolators. 
Sources: [crates/printer/src/standard.rs:466-478](https://github.com/BurntSushi/ripgrep/blob/main/crates/printer/src/standard.rs#L466-L478), [crates/printer/src/standard.rs:616-621](https://github.com/BurntSushi/ripgrep/blob/main/crates/printer/src/standard.rs#L616-L621)

The [`Config`](https://github.com/BurntSushi/ripgrep/blob/main/crates/printer/src/standard.rs#L36-L57) struct governs all formatting behaviors, instantiated and modified via [`StandardBuilder`](https://github.com/BurntSushi/ripgrep/blob/main/crates/printer/src/standard.rs#L98-L101). 
Sources: [crates/printer/src/standard.rs:36-57](https://github.com/BurntSushi/ripgrep/blob/main/crates/printer/src/standard.rs#L36-L57), [crates/printer/src/standard.rs:98-101](https://github.com/BurntSushi/ripgrep/blob/main/crates/printer/src/standard.rs#L98-L101)

| Field Name | Type | Default Value | Purpose |
| :--- | :--- | :--- | :--- |
| `colors` | `ColorSpecs` | `ColorSpecs::default()` | Terminal color specifications for paths, line numbers, and matches. |
| `hyperlink` | `HyperlinkConfig` | `HyperlinkConfig::default()` | Hyperlink configuration for file paths in output. |
| `stats` | `bool` | `false` | Enables aggregate statistics collection. |
| `heading` | `bool` | `false` | Prints the file path as a heading on its own line before matches. |
| `path` | `bool` | `true` | Controls whether file paths are emitted in the output. |
| `only_matching` | `bool` | `false` | Prints only the specific match portions rather than full lines. |
| `per_match` | `bool` | `false` | Prints at least one line per match instance. |
| `per_match_one_line` | `bool` | `false` | Restricts multi-line matches to their first line under `per_match`. |
| `replacement` | `Arc<Option<Vec<u8>>>` | `None` | Replacement pattern bytes for match substitution. |
| `max_columns` | `Option<u64>` | `None` | Omits lines exceeding the specified byte column count. |
| `max_columns_preview` | `bool` | `false` | Renders a grapheme preview for long lines exceeding `max_columns`. |
| `column` | `bool` | `false` | Prints the 1-based column number of the first match in a line. |
| `byte_offset` | `bool` | `false` | Prints the absolute 0-based byte offset of each line or match. |
| `trim_ascii` | `bool` | `false` | Trims leading ASCII whitespace from printed lines. |
| `separator_search` | `Arc<Option<Vec<u8>>>` | `None` | Divider printed between discontiguous search result sets. |
| `separator_context` | `Arc<Option<Vec<u8>>>` | `Some(b"--".to_vec())` | Divider printed between discontiguous context runs. |
| `separator_field_match` | `Arc<Vec<u8>>` | `b":".to_vec()` | Separator written between prelude fields for matching lines. |
| `separator_field_context` | `Arc<Vec<u8>>` | `b"-".to_vec()` | Separator written between prelude fields for context lines. |
| `separator_path` | `Option<u8>` | `None` | Custom override byte for path separators. |
| `path_terminator` | `Option<u8>` | `None` | Byte terminator written immediately after file paths. |

Sources: [crates/printer/src/standard.rs:36-84](https://github.com/BurntSushi/ripgrep/blob/main/crates/printer/src/standard.rs#L36-L84)

> [!NOTE]
> The printer configuration is completely frozen upon calling `build()` or `build_no_color()`, preventing runtime mutations during active search execution. 
> Sources: [crates/printer/src/standard.rs:32-34](https://github.com/BurntSushi/ripgrep/blob/main/crates/printer/src/standard.rs#L32-L34), [crates/printer/src/standard.rs:127-145](https://github.com/BurntSushi/ripgrep/blob/main/crates/printer/src/standard.rs#L127-L145)

When the searcher reports a matching line to the sink, formatting executes through a strict sequence of methods across `StandardSink`, `StandardImpl`, and `PreludeWriter`:

`StandardSink::matched()` → `self.record_matches()` → `self.replace()` → `StandardImpl::from_match()` → `StandardImpl::sink()` → `self.write_search_prelude()` → `StandardImpl::sink_slow()` → `StandardImpl::write_prelude()` → `PreludeWriter::new()` → `prelude.start()` → `prelude.write_path()` → `prelude.write_line_number()` → `prelude.write_column_number()` → `prelude.write_byte_offset()` → `prelude.end()` → `StandardImpl::write_colored_line()`

Sources: [crates/printer/src/standard.rs:766-791](https://github.com/BurntSushi/ripgrep/blob/main/crates/printer/src/standard.rs#L766-L791), [crates/printer/src/standard.rs:900-943](https://github.com/BurntSushi/ripgrep/blob/main/crates/printer/src/standard.rs#L900-L943), [crates/printer/src/standard.rs:1176-1189](https://github.com/BurntSushi/ripgrep/blob/main/crates/printer/src/standard.rs#L1176-L1189), [crates/printer/src/standard.rs:1614-1621](https://github.com/BurntSushi/ripgrep/blob/main/crates/printer/src/standard.rs#L1614-L1621)

> [!WARNING]
> If `needs_match_granularity()` evaluates to false (e.g., when coloring is disabled and no column, replacement, or per-match options are set), the engine bypasses `record_matches()` entirely and executes fast-path printing via `sink_fast()` or `sink_fast_multi_line()` to avoid the overhead of individual match detection. 
> Sources: [crates/printer/src/standard.rs:578-594](https://github.com/BurntSushi/ripgrep/blob/main/crates/printer/src/standard.rs#L578-L594), [crates/printer/src/standard.rs:704-707](https://github.com/BurntSushi/ripgrep/blob/main/crates/printer/src/standard.rs#L704-L707), [crates/printer/src/standard.rs:928-935](https://github.com/BurntSushi/ripgrep/blob/main/crates/printer/src/standard.rs#L928-L935)

| Design Choice | Benefit | Cost |
| :--- | :--- | :--- |
| Match granularity gating (`needs_match_granularity`) | Avoids expensive individual match location scanning on simple searches. | Requires upfront evaluation of all output flags to determine sink behavior. |
| Re-entrant buffer mutation (`RefCell<CounterWriter<W>>`) | Permits shared immutable references to print sinks while tracking byte counts. | Introduces runtime borrow checks and prevents concurrent multi-threaded writes without synchronization. |
| Pre-computed match vector (`self.standard.matches`) | Amortizes match allocations and simplifies slow-path formatting logic. | Incurs an extra vector copy and memory overhead per reported match buffer. |

Sources: [crates/printer/src/standard.rs:480-484](https://github.com/BurntSushi/ripgrep/blob/main/crates/printer/src/standard.rs#L480-L484), [crates/printer/src/standard.rs:578-594](https://github.com/BurntSushi/ripgrep/blob/main/crates/printer/src/standard.rs#L578-L594), [crates/printer/src/standard.rs:704-735](https://github.com/BurntSushi/ripgrep/blob/main/crates/printer/src/standard.rs#L704-L735)

## Search Statistics and Metrics Collection

RiPGrep accumulates runtime telemetry and search metrics through the `StandardSink` and `Stats` integration when enabled via the printer configuration. Aggregate statistics track total matches, matched lines, searches executed, searches resulting in matches, searched bytes, printed bytes, and elapsed execution time. 
Sources: [crates/printer/src/standard.rs:188-206](https://github.com/BurntSushi/ripgrep/blob/main/crates/printer/src/standard.rs#L188-L206), [crates/printer/src/standard.rs:521-532](https://github.com/BurntSushi/ripgrep/blob/main/crates/printer/src/standard.rs#L521-L532), [crates/printer/src/standard.rs:687-694](https://github.com/BurntSushi/ripgrep/blob/main/crates/printer/src/standard.rs#L687-L694)

> [!NOTE]
> Enabling statistics gathering can introduce performance overhead because it mandates match granularity (`needs_match_granularity()`), forcing the printer to compute and store individual match locations during execution. 
> Sources: [crates/printer/src/standard.rs:198-200](https://github.com/BurntSushi/ripgrep/blob/main/crates/printer/src/standard.rs#L198-L200), [crates/printer/src/standard.rs:592-594](https://github.com/BurntSushi/ripgrep/blob/main/crates/printer/src/standard.rs#L592-L594)

Statistics tracking and lifecycle timing execute through specific sink methods during a search session:

`StandardSink::begin()` → `self.start_time = Instant::now()` → `StandardSink::matched()` → `stats.add_matches()` & `stats.add_matched_lines()` → `StandardSink::finish()` → `stats.add_elapsed()` → `stats.add_searches()` → `stats.add_searches_with_match()` → `stats.add_bytes_searched()` → `stats.add_bytes_printed()`

Sources: [crates/printer/src/standard.rs:770-783](https://github.com/BurntSushi/ripgrep/blob/main/crates/printer/src/standard.rs#L770-L783), [crates/printer/src/standard.rs:841-847](https://github.com/BurntSushi/ripgrep/blob/main/crates/printer/src/standard.rs#L841-L847), [crates/printer/src/standard.rs:849-866](https://github.com/BurntSushi/ripgrep/blob/main/crates/printer/src/standard.rs#L849-L866)

## Binary Detection and Context Handling

RiPGrep performs fast-path binary file inspection, line-buffered or slice-based context line collection, and match-limit enforcement during execution via structural glue logic. The worker components differentiate between stream-based line reading (`ReadByLine`) and memory-sliced searching (`SliceByLine`, `MultiLine`), running binary detection checks across initial buffer capacities and match ranges. 
Sources: [crates/searcher/src/searcher/glue.rs:10-151](https://github.com/BurntSushi/ripgrep/blob/main/crates/searcher/src/searcher/glue.rs#L10-L151)

> [!NOTE]
> Line-buffered searchers (`ReadByLine`) strictly verify binary data in the current buffer before performing searches, whereas slice-based searchers inspect binary indicators within an initial buffer capacity and subsequently verify binary data solely inside discovered matches. 
> Sources: [crates/searcher/src/searcher/glue.rs:69-75](https://github.com/BurntSushi/ripgrep/blob/main/crates/searcher/src/searcher/glue.rs#L69-L75), [crates/searcher/src/searcher/glue.rs:736-745](https://github.com/BurntSushi/ripgrep/blob/main/crates/searcher/src/searcher/glue.rs#L736-L745)

The execution path for line-buffered binary and context handling coordinates readers, buffers, and core search states through explicit method transitions:

`ReadByLine::run()` → `self.core.begin()?` → `self.fill()?` → `self.core.roll()` → `self.rdr.fill()` → `self.rdr.binary_byte_offset()` → `self.core.binary_data(offset)?` → `self.core.match_by_line()`

Sources: [crates/searcher/src/searcher/glue.rs:38-51](https://github.com/BurntSushi/ripgrep/blob/main/crates/searcher/src/searcher/glue.rs#L38-L51), [crates/searcher/src/searcher/glue.rs:58-88](https://github.com/BurntSushi/ripgrep/blob/main/crates/searcher/src/searcher/glue.rs#L58-L88)

| Struct / Method | Type / Signature | Description |
| :--- | :--- | :--- |
| `ReadByLine` | Struct | Manages buffered I/O streaming searches when multi-line matching is disabled. |
| `SliceByLine` | Struct | Executes contiguous memory slice searches line-by-line without multi-line logic. |
| `MultiLine` | Struct | Handles multi-line pattern matching, overlap grouping, and context collection over memory slices. |

Sources: [crates/searcher/src/searcher/glue.rs:10-15](https://github.com/BurntSushi/ripgrep/blob/main/crates/searcher/src/searcher/glue.rs#L10-L15), [crates/searcher/src/searcher/glue.rs:96-100](https://github.com/BurntSushi/ripgrep/blob/main/crates/searcher/src/searcher/glue.rs#L96-L100), [crates/searcher/src/searcher/glue.rs:141-147](https://github.com/BurntSushi/ripgrep/blob/main/crates/searcher/src/searcher/glue.rs#L141-L147)

| Design Choice | Benefit | Cost |
| :--- | :--- | :--- |
| Initial chunk binary inspection (`DEFAULT_BUFFER_CAPACITY`) | Avoids full-file scanning overhead on large files while catching binary indicators early. | Can miss binary signatures located past the initial buffer capacity unless inside a match. |
| Delayed match sinking in `MultiLine` (`self.last_match`) | Correctly groups adjacent and overlapping matches into a single sink block without duplicate line reports. | Requires holding state and performing range comparisons per match iteration. |
| Automatic buffer rolling and consumption (`self.core.roll`) | Keeps memory usage bounded to fixed buffer allocations during streaming I/O. | Incurs overhead shifting unconsumed context bytes across buffer boundaries. |

Sources: [crates/searcher/src/searcher/glue.rs:62-64](https://github.com/BurntSushi/ripgrep/blob/main/crates/searcher/src/searcher/glue.rs#L62-L64), [crates/searcher/src/searcher/glue.rs:119-122](https://github.com/BurntSushi/ripgrep/blob/main/crates/searcher/src/searcher/glue.rs#L119-L122), [crates/searcher/src/searcher/glue.rs:223-226](https://github.com/BurntSushi/ripgrep/blob/main/crates/searcher/src/searcher/glue.rs#L223-L226), [crates/searcher/src/searcher/glue.rs:246-248](https://github.com/BurntSushi/ripgrep/blob/main/crates/searcher/src/searcher/glue.rs#L246-L248)

## Related

- [[Overview]]

