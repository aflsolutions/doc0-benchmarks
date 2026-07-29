# Stream Decompression

<details>
<summary>Relevant source files</summary>

The following files were used as context for generating this wiki page:

- [crates/searcher/src/searcher/glue.rs](https://github.com/BurntSushi/ripgrep/blob/main/crates/searcher/src/searcher/glue.rs)
- [crates/core/flags/defs.rs](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs)
</details>

## Overview

Stream decompression in ripgrep enables searching through compressed inputs—such as zip archives—by bridging raw byte streams with pattern-matching infrastructure, relying on specialized glue layers and buffered readers to process content efficiently.
Sources: [crates/searcher/src/searcher/glue.rs:10-94](https://github.com/BurntSushi/ripgrep/blob/main/crates/searcher/src/searcher/glue.rs#L10-L94), [crates/core/flags/defs.rs:224-226](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L224-L226)

This subsystem integrates tightly with adjacent components like buffer management, binary detection heuristics, and search sink callbacks to handle continuous line-oriented transformations without needing entire files fully materialized in memory.
Sources: [crates/searcher/src/searcher/glue.rs:38-88](https://github.com/BurntSushi/ripgrep/blob/main/crates/searcher/src/searcher/glue.rs#L38-L88), [crates/core/flags/defs.rs:682-685](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L682-L685)

## Decompression Flags and Configuration

### Overview

Ripgrep exposes specific command-line flags to control stream decompression behaviors and external preprocessor filters. These configuration options dictate whether archives like zip files are traversed and specify external commands executed prior to search.
Sources: [crates/core/flags/defs.rs:131-132](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L131-L132)

### Flag Reference Table

The command-line flags governing decompression and preprocessors are implemented via unit structs conforming to the `Flag` trait, mapping user inputs directly into low-level configuration structures.
Sources: [crates/core/flags/defs.rs:131-132](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L131-L132), [crates/core/flags/defs.rs:1412-1418](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L1412-L1418)

| Flag Name | Short Flag | Type | Default | Purpose |
| :--- | :--- | :--- | :--- | :--- |
| `--search-zip` | None | Switch (`--search-zip` / `--no-search-zip`) | `false` | Enables searching inside compressed zip files during recursive directory searches. |
| `--pre` | None | Value (`COMMAND`) | `None` | Specifies an external preprocessor command to run on each file before searching. |
| `--pre-glob` | None | Value (`GLOB`) | Empty list | Restricts preprocessor execution to file paths matching the given glob. |

Sources: [crates/core/flags/defs.rs:131-132](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L131-L132), [crates/core/flags/defs.rs:1412-1418](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L1412-L1418)

> [!NOTE]
> Enabling `--search-zip` causes ripgrep to inspect files with a `.zip` extension (or matching archive signatures) during directory traversal, decompressing their entries on the fly into searchable byte streams.
> Sources: [crates/core/flags/defs.rs:131-132](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L131-L132)

## Stream Search Execution Glue

### Overview

The glue layer in the searcher crate establishes the bridge between raw input streams, slices, matchers, and sinks. It manages execution flow across different search strategies—differentiating between line-buffered stream scanning, in-memory slice searches, and multi-line matching operations.
Sources: [crates/searcher/src/searcher/glue.rs:10-164](https://github.com/BurntSushi/ripgrep/blob/main/crates/searcher/src/searcher/glue.rs#L10-L164)

### Execution Glue Structs Reference

Three primary runner structs encapsulate the state and logic required to execute searches depending on whether the source is a streaming reader or an in-memory byte slice, and whether pattern matching spans single or multiple lines.
Sources: [crates/searcher/src/searcher/glue.rs:10-15](https://github.com/BurntSushi/ripgrep/blob/main/crates/searcher/src/searcher/glue.rs#L10-L15), [crates/searcher/src/searcher/glue.rs:96-100](https://github.com/BurntSushi/ripgrep/blob/main/crates/searcher/src/searcher/glue.rs#L96-L100), [crates/searcher/src/searcher/glue.rs:141-147](https://github.com/BurntSushi/ripgrep/blob/main/crates/searcher/src/searcher/glue.rs#L141-L147)

| Struct Name | Type Parameters | Purpose |
| :--- | :--- | :--- |
| `ReadByLine` | `'s`, `M`, `R`, `S` | Executes line-buffered searches over types implementing `std::io::Read` using single-line matchers. |
| `SliceByLine` | `'s`, `M`, `S` | Executes single-line searches over static byte slices (`&'s [u8]`) without line-buffering overhead. |
| `MultiLine` | `'s`, `M`, `S` | Executes multi-line searches over static byte slices (`&'s [u8]`), tracking last matches and handling overlapping contexts. |

Sources: [crates/searcher/src/searcher/glue.rs:10-15](https://github.com/BurntSushi/ripgrep/blob/main/crates/searcher/src/searcher/glue.rs#L10-L15), [crates/searcher/src/searcher/glue.rs:96-100](https://github.com/BurntSushi/ripgrep/blob/main/crates/searcher/src/searcher/glue.rs#L96-L100), [crates/searcher/src/searcher/glue.rs:141-147](https://github.com/BurntSushi/ripgrep/blob/main/crates/searcher/src/searcher/glue.rs#L141-L147)

### Execution Walkthrough and Lifecycle

The execution path for stream and slice searching is coordinated through explicit method call chains on these runner structs. For `ReadByLine`, execution flows through `run()` which invokes `self.core.begin()?`, then loops over `self.fill()?` and `self.core.match_by_line(self.rdr.buffer())?`, and finally concludes with `self.core.finish(...)`.
Sources: [crates/searcher/src/searcher/glue.rs:38-51](https://github.com/BurntSushi/ripgrep/blob/main/crates/searcher/src/searcher/glue.rs#L38-L51)

For `SliceByLine` and `MultiLine`, the runner validates that multi-line settings match expectations via `debug_assert!(!searcher.multi_line_with_matcher(&matcher))` or `debug_assert!(searcher.multi_line_with_matcher(&matcher))`, detects binary status across a capped initial range via `self.core.detect_binary(self.slice, &binary_range)`, and processes matches iteratively.
Sources: [crates/searcher/src/searcher/glue.rs:103-127](https://github.com/BurntSushi/ripgrep/blob/main/crates/searcher/src/searcher/glue.rs#L103-L127), [crates/searcher/src/searcher/glue.rs:150-202](https://github.com/BurntSushi/ripgrep/blob/main/crates/searcher/src/searcher/glue.rs#L150-L202)

> [!WARNING]
> Multi-line searches delay sinking matches to group adjacent matches occurring on the same line into a single sink event, guaranteeing that any single line is never passed to the sink more than once.
> Sources: [crates/searcher/src/searcher/glue.rs:223-226](https://github.com/BurntSushi/ripgrep/blob/main/crates/searcher/src/searcher/glue.rs#L223-L226)

### Design Trade-Offs

| Design Choice | Benefit | Cost |
| :--- | :--- | :--- |
| **Separation of Read vs. Slice Runners** | Avoids buffer management and allocation overhead when searching contiguous in-memory byte slices. | Requires duplicate run-loop implementations for streams versus slices. |
| **Delayed Sinking in Multi-Line Search** | Correctly groups overlapping and adjacent matches into unified ranges before outputting. | Introduces state tracking (`last_match: Option<Range>`) that requires cleanup flush logic at end-of-stream. |

Sources: [crates/searcher/src/searcher/glue.rs:10-15](https://github.com/BurntSushi/ripgrep/blob/main/crates/searcher/src/searcher/glue.rs#L10-L15), [crates/searcher/src/searcher/glue.rs:38-51](https://github.com/BurntSushi/ripgrep/blob/main/crates/searcher/src/searcher/glue.rs#L38-L51), [crates/searcher/src/searcher/glue.rs:176-186](https://github.com/BurntSushi/ripgrep/blob/main/crates/searcher/src/searcher/glue.rs#L176-L186), [crates/searcher/src/searcher/glue.rs:223-226](https://github.com/BurntSushi/ripgrep/blob/main/crates/searcher/src/searcher/glue.rs#L223-L226)

## Binary Detection and Buffer Management

### Overview

Handling input buffers and detecting binary data involves managing internal buffer state during stream reads and slice processing. The searcher inspects streams via `ReadByLine` and slices via `SliceByLine` or `MultiLine`, checking for binary indicators and deciding whether to quit or continue searching based on configuration.
Sources: [crates/searcher/src/searcher/glue.rs:10-15](https://github.com/BurntSushi/ripgrep/blob/main/crates/searcher/src/searcher/glue.rs#L10-L15), [crates/searcher/src/searcher/glue.rs:96-100](https://github.com/BurntSushi/ripgrep/blob/main/crates/searcher/src/searcher/glue.rs#L96-L100), [crates/searcher/src/searcher/glue.rs:141-147](https://github.com/BurntSushi/ripgrep/blob/main/crates/searcher/src/searcher/glue.rs#L141-L147)

### Buffer Fill and Roll Workflow

In `ReadByLine`, buffer filling and rolling execute through a precise sequence of operations within the `fill()` method. The call chain proceeds as follows: `fill()` asserts that the current buffer position is exhausted via `assert!(self.rdr.buffer()[self.core.pos()..].is_empty())`, saves the binary status and buffer length, invokes `self.core.roll(self.rdr.buffer())` to slide unconsumed context, calls `self.rdr.consume(consumed)`, and then fetches new data using `self.rdr.fill()`.
Sources: [crates/searcher/src/searcher/glue.rs:58-68](https://github.com/BurntSushi/ripgrep/blob/main/crates/searcher/src/searcher/glue.rs#L58-L68)

Following the fill operation, binary detection checks if a binary byte offset has newly appeared via `self.rdr.binary_byte_offset()`. If binary data is detected and the core callback `self.core.binary_data(offset)?` returns `false`, `fill()` short-circuits and returns `Ok(false)`.
Sources: [crates/searcher/src/searcher/glue.rs:69-75](https://github.com/BurntSushi/ripgrep/blob/main/crates/searcher/src/searcher/glue.rs#L69-L75)

> [!CAUTION]
> If rolling the buffer results in zero consumed bytes and refilling adds no new data, the buffer contains only leftover context that is no longer needed. The searcher forcefully consumes the entire remaining buffer length (`self.rdr.consume(old_buf_len)`) and terminates the fill loop.
> Sources: [crates/searcher/src/searcher/glue.rs:79-86](https://github.com/BurntSushi/ripgrep/blob/main/crates/searcher/src/searcher/glue.rs#L79-L86)

### Binary Detection Logic and Quitting

Binary data detection rules differ between streamed readers and memory slices. Slice-based searchers evaluate binary data within a capped initial range defined by `std::cmp::min(self.slice.len(), DEFAULT_BUFFER_CAPACITY)`, whereas line-buffered readers evaluate binary data across the active buffer before searching.
Sources: [crates/searcher/src/searcher/glue.rs:119-121](https://github.com/BurntSushi/ripgrep/blob/main/crates/searcher/src/searcher/glue.rs#L119-L121), [crates/searcher/src/searcher/glue.rs:168-170](https://github.com/BurntSushi/ripgrep/blob/main/crates/searcher/src/searcher/glue.rs#L168-L170), [crates/searcher/src/searcher/glue.rs:736-745](https://github.com/BurntSushi/ripgrep/blob/main/crates/searcher/src/searcher/glue.rs#L736-L745)

The `should_binary_quit()` helper checks whether a binary byte offset has been registered (`self.rdr.binary_byte_offset().is_some()`) and whether the binary configuration specifies a quit byte (`self.config.binary.quit_byte().is_some()`).
Sources: [crates/searcher/src/searcher/glue.rs:90-93](https://github.com/BurntSushi/ripgrep/blob/main/crates/searcher/src/searcher/glue.rs#L90-L93)

## Search Sink and Matching Flow

### Overview

Consuming matching streams and reporting results involves routing matches and context ranges through sink callbacks during multi-line or slice searches. The `MultiLine` struct coordinates match identification, adjacent match grouping, inverted matching, and context emission via dedicated methods.
Sources: [crates/searcher/src/searcher/glue.rs:141-147](https://github.com/BurntSushi/ripgrep/blob/main/crates/searcher/src/searcher/glue.rs#L141-L147), [crates/searcher/src/searcher/glue.rs:208-343](https://github.com/BurntSushi/ripgrep/blob/main/crates/searcher/src/searcher/glue.rs#L208-L343)

### Matcher Sinking and Execution Flow

The multi-line search execution follows a specific call-chain sequence through core and sink helper functions. The execution walkthrough proceeds as follows: `run()` invokes `self.core.begin()?`, checks binary detection via `self.core.detect_binary()`, and then loops over `self.sink()?` until exhaustion.
Sources: [crates/searcher/src/searcher/glue.rs:166-175](https://github.com/BurntSushi/ripgrep/blob/main/crates/searcher/src/searcher/glue.rs#L166-L175)

Inside `sink()`, if `config.invert_match` is enabled, control delegates to `self.sink_matched_inverted()`. Otherwise, `self.find()?` locates the next match range, `self.advance(&mat)` updates the search position, and `lines::locate()` maps the match to line boundaries.
Sources: [crates/searcher/src/searcher/glue.rs:208-222](https://github.com/BurntSushi/ripgrep/blob/main/crates/searcher/src/searcher/glue.rs#L208-L222)

> [!TIP]
> Matches are delayed via `self.last_match` to group adjacent matches that start and end on the same line into a single sink callback, guaranteeing that any individual line is never sinked more than once.
> Sources: [crates/searcher/src/searcher/glue.rs:223-227](https://github.com/BurntSushi/ripgrep/blob/main/crates/searcher/src/searcher/glue.rs#L223-L227)

### Sink Helpers and Inversion

| Method | Purpose | Call Target / Return | Sources |
| :--- | :--- | :--- | :--- |
| `sink()` | Dispatches normal vs inverted matching and groups adjacent line matches | `self.sink_matched()`, `self.sink_context()` | [crates/searcher/src/searcher/glue.rs:208-258](https://github.com/BurntSushi/ripgrep/blob/main/crates/searcher/src/searcher/glue.rs#L208-L258) |
| `sink_matched_inverted()` | Processes non-matching lines when `invert_match` is set | `LineStep`, `self.sink_matched()` | [crates/searcher/src/searcher/glue.rs:260-297](https://github.com/BurntSushi/ripgrep/blob/main/crates/searcher/src/searcher/glue.rs#L260-L297) |
| `sink_matched()` | Reports matched byte ranges to core unless empty | `self.core.matched()` | [crates/searcher/src/searcher/glue.rs:299-309](https://github.com/BurntSushi/ripgrep/blob/main/crates/searcher/src/searcher/glue.rs#L299-L309) |
| `sink_context()` | Emits before/after context or passthrough lines | `self.core.other_context_by_line()`, `self.core.after_context_by_line()` | [crates/searcher/src/searcher/glue.rs:311-325](https://github.com/BurntSushi/ripgrep/blob/main/crates/searcher/src/searcher/glue.rs#L311-L325) |

Sources: [crates/searcher/src/searcher/glue.rs:208-325](https://github.com/BurntSushi/ripgrep/blob/main/crates/searcher/src/searcher/glue.rs#L208-L325)

## Related

- [[Search Workflow]]

