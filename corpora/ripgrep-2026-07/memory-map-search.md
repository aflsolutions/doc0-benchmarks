# Memory Map Search

<details>
<summary>Relevant source files</summary>

The following files were used as context for generating this wiki page:

- [crates/searcher/src/searcher/glue.rs](https://github.com/BurntSushi/ripgrep/blob/main/crates/searcher/src/searcher/glue.rs)
- [crates/core/search.rs](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/search.rs)
- [crates/core/flags/defs.rs](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs)
</details>

## Overview

Memory map search is a high-performance optimization in ripgrep that enables searching the contents of files directly via memory-mapped byte slices rather than streaming them through traditional buffered reader loops. By mapping files into virtual memory, ripgrep can execute regex matching routines directly across raw memory regions, unlocking significant performance gains when processing eligible filesystem paths.

Sources: [crates/searcher/src/searcher/glue.rs:97-139](https://github.com/BurntSushi/ripgrep/blob/main/crates/searcher/src/searcher/glue.rs#L97-L139), [crates/core/search.rs:341-365](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/search.rs#L341-L365)

## Memory Map Configuration Flags

### Overview

Command-line flags in ripgrep control memory-mapping behavior, determining whether files are searched via memory maps or streamed through traditional reader pipelines. The core flag definition governing this behavior is the `--mmap` flag, which exposes short and long switch variants along with negation rules.

Sources: [crates/core/flags/defs.rs:102-102](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L102-L102), [crates/core/flags/defs.rs:4300-4364](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L4300-L4364)

### Flag Definition and State Update

The `--mmap` flag is implemented as a unit struct `Mmap` adhering to the `Flag` trait, providing the long name `"mmap"`, the negated name `"no-mmap"`, and categorizing under `Category::Search`. When invoked as a switch, its `update` method updates the internal `LowArgs` structure by mutating the `mmap` field.

```rust
struct Mmap;

impl Flag for Mmap {
    fn is_switch(&self) -> bool {
        true
    }
    fn name_long(&self) -> &'static str {
        "mmap"
    }
    fn name_negated(&self) -> Option<&'static str> {
        Some("no-mmap")
    }
    fn update(&self, v: FlagValue, args: &mut LowArgs) -> anyhow::Result<()> {
        args.mmap = v.unwrap_switch();
        Ok(())
    }
}
```

Sources: [crates/core/flags/defs.rs:4300-4345](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L4300-L4345)

### Memory Map Configuration Reference

The following table summarizes the configuration parameters associated with the memory map search subsystem as defined in the flag specifications:

| Flag Name | Short Flag | Negated Form | Default State | Purpose |
| :--- | :--- | :--- | :--- | :--- |
| `--mmap` | None | `--no-mmap` | Disabled (`false`) | Enables or disables searching files via memory maps. |

Sources: [crates/core/flags/defs.rs:4300-4345](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L4300-L4345)

> [!NOTE]
> By default, ripgrep does not enable memory-mapped searching unless explicitly requested via the `--mmap` flag, falling back to standard buffered reader streaming to maintain safety across arbitrary filesystem conditions.

Sources: [crates/core/flags/defs.rs:4320-4345](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L4320-L4345)

## Search Worker File Dispatching

### Overview

The `SearchWorker` abstraction in `crates/core/search.rs` manages the high-level routing of files, standard input, and streams prior to search execution. Before any matcher or printer is invoked, `SearchWorker::search` evaluates the properties of a given haystack and determines whether the path should be processed via standard input, routed through an external preprocessor, uncompressed via a decompression reader, or passed directly to path-based search routines that unlock memory-mapping optimizations.

Sources: [crates/core/search.rs:1-8](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/search.rs#L1-L8), [crates/core/search.rs:243-267](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/search.rs#L243-L267)

### Search Worker File Dispatch Call-Chain

When a haystack is dispatched for searching, `SearchWorker::search` executes an ordered sequence of checks to route the input to the appropriate handler. 

1. `SearchWorker::search()` reads `haystack.path()` and determines the binary detection configuration (`bin`) depending on whether `haystack.is_explicit()` is true or false.
2. It invokes `self.searcher.set_binary_detection(bin)` to configure the underlying searcher instance.
3. It evaluates a cascading conditional branch to select the input stream mechanism:
   - If `haystack.is_stdin()` returns true, control flows to `self.search_reader(path, &mut io::stdin().lock())`.
   - Else if `self.should_preprocess(path)` returns true, control flows to `self.search_preprocessor(path)`.
   - Else if `self.should_decompress(path)` returns true, control flows to `self.search_decompress(path)`.
   - Otherwise, control flows to `self.search_path(path)`.
4. `self.search_path(path)` matches on `self.matcher` (either `RustRegex` or `PCRE2`) and invokes `search_path(m, searcher, printer, path)`.
5. `search_path()` matches on `printer` (`Standard`, `Summary`, or `JSON`), creates a sink with path via `p.sink_with_path(&matcher, path)`, and executes `searcher.search_path(&matcher, path, &mut sink)`.

```rust
pub(crate) fn search(
    &mut self,
    haystack: &crate::haystack::Haystack,
) -> io::Result<SearchResult> {
    let bin = if haystack.is_explicit() {
        self.config.binary_explicit.clone()
    } else {
        self.config.binary_implicit.clone()
    };
    let path = haystack.path();

    self.searcher.set_binary_detection(bin);
    if haystack.is_stdin() {
        self.search_reader(path, &mut io::stdin().lock())
    } else if self.should_preprocess(path) {
        self.search_preprocessor(path)
    } else if self.should_decompress(path) {
        self.search_decompress(path)
    } else {
        self.search_path(path)
    }
}
```

Sources: [crates/core/search.rs:243-267](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/search.rs#L243-L267), [crates/core/search.rs:341-351](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/search.rs#L341-L351), [crates/core/search.rs:380-412](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/search.rs#L380-L412)

> [!WARNING]
> Searching via `search_reader` bypasses direct file inspection paths and prevents the underlying searcher from leveraging memory-mapped file optimizations. Direct path routing via `search_path` must be preserved to enable mmap eligibility.

Sources: [crates/core/search.rs:358-361](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/search.rs#L358-L361)

### Dispatch Routing and Configuration Reference

The following table outlines the conditional routing methods and configuration states evaluated by `SearchWorker` during file dispatching:

| Method Name | Condition Evaluated | Action Taken on Match | Fallback / Next Check |
| :--- | :--- | :--- | :--- |
| `haystack.is_stdin()` | Haystack represents standard input stream | Locks `io::stdin()` and calls `search_reader` | Evaluates `should_preprocess` |
| `should_preprocess(path)` | Preprocessor configured and path matches glob filters | Spawns preprocessor command via `search_preprocessor` | Evaluates `should_decompress` |
| `should_decompress(path)` | `search_zip` enabled and path recognized by decompression matcher | Builds decompression reader and calls `search_decompress` | Falls through to `search_path` |
| `search_path(path)` | None of the above conditions apply | Dispatches directly to path-based search sinks | Invokes underlying `searcher.search_path` |

Sources: [crates/core/search.rs:258-266](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/search.rs#L258-L266), [crates/core/search.rs:276-292](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/search.rs#L276-L292)

## In-Memory Slice Search Execution

### Overview

In-memory slice searching within ripgrep's searcher glue handles memory-mapped byte slices directly through dedicated executor structures. When a search is initiated against an in-memory byte slice, the glue module distinguishes between single-line search strategies (`SliceByLine`) and multi-line search strategies (`MultiLine`). These structures wrap a shared execution core (`Core`) along with the reference slice to coordinate scanning, binary detection, context tracking, and sink output without requiring buffered stream readers.

Sources: [crates/searcher/src/searcher/glue.rs:96-100](https://github.com/BurntSushi/ripgrep/blob/main/crates/searcher/src/searcher/glue.rs#L96-L100), [crates/searcher/src/searcher/glue.rs:141-147](https://github.com/BurntSushi/ripgrep/blob/main/crates/searcher/src/searcher/glue.rs#L141-L147)

### SliceByLine Execution Walkthrough

The `SliceByLine` executor processes single-line matching across an entire memory-mapped byte slice. Its execution path proceeds through a strict series of method calls:

1. `SliceByLine::new()` asserts that the searcher is not configured for multi-line matching with the given matcher using `debug_assert!(!searcher.multi_line_with_matcher(&matcher))`, then initializes the internal `Core` with `is_slice` set to `true`.
2. `SliceByLine::run()` invokes `self.core.begin()?` to initialize sink state.
3. It computes the binary detection window limit using `std::cmp::min(self.slice.len(), DEFAULT_BUFFER_CAPACITY)` to construct a `Range` representing the initial buffer capacity.
4. It calls `self.core.detect_binary(self.slice, &binary_range)?` to check for binary content within the initial slice prefix.
5. If binary detection does not trigger a quit, it enters a `while` loop, checking `!self.slice[self.core.pos()..].is_empty()` and executing `self.core.match_by_line(self.slice)?` until the slice is exhausted.
6. Finally, it calculates the byte count via `self.byte_count()`, retrieves the binary byte offset, and delegates to `self.core.finish(byte_count, binary_byte_offset)`.

```rust
pub(crate) fn run(mut self) -> Result<(), S::Error> {
    if self.core.begin()? {
        let binary_upto =
            std::cmp::min(self.slice.len(), DEFAULT_BUFFER_CAPACITY);
        let binary_range = Range::new(0, binary_upto);
        if !self.core.detect_binary(self.slice, &binary_range)? {
            while !self.slice[self.core.pos()..].is_empty()
                && self.core.match_by_line(self.slice)?
            {}
        }
    }
    let byte_count = self.byte_count();
    let binary_byte_offset = self.core.binary_byte_offset();
    self.core.finish(byte_count, binary_byte_offset)
}
```

Sources: [crates/searcher/src/searcher/glue.rs:103-131](https://github.com/BurntSushi/ripgrep/blob/main/crates/searcher/src/searcher/glue.rs#L103-L131)

> [!NOTE]
> Unlike buffered reader execution paths that scan chunks dynamically, `SliceByLine` and `MultiLine` evaluate binary detection strictly across the initial chunk bound by `DEFAULT_BUFFER_CAPACITY`. Subsequent binary checks only occur inside actual matches.

Sources: [crates/searcher/src/searcher/glue.rs:119-122](https://github.com/BurntSushi/ripgrep/blob/main/crates/searcher/src/searcher/glue.rs#L119-L122), [crates/searcher/src/searcher/glue.rs:168-171](https://github.com/BurntSushi/ripgrep/blob/main/crates/searcher/src/searcher/glue.rs#L168-L171)

### In-Memory Executors and Core Components

The glue layer defines distinct executor types and configuration mechanisms to handle memory-mapped slices under varying search requirements.

| Struct / Method Name | Signature / Type | Purpose and Operational Behavior |
| :--- | :--- | :--- |
| `ReadByLine` | `struct ReadByLine<'s, M, R, S>` | Executes line-buffered searches over standard `io::Read` streams with dynamic buffer rolling. |
| `SliceByLine` | `struct SliceByLine<'s, M, S>` | Executes direct single-line searches over an in-memory `&'s [u8]` slice without buffering. |
| `MultiLine` | `struct MultiLine<'s, M, S>` | Executes multi-line searches across an in-memory slice, managing adjacent match overlap and inverted matching. |
| `SliceByLine::byte_count` | `fn byte_count(&mut self) -> u64` | Determines total searched bytes, adjusting for binary offsets if binary data precedes the current search position. |
| `MultiLine::advance` | `fn advance(&mut self, range: &Range)` | Advances search position past a match, handling zero-width matches by stepping one byte forward. |

Sources: [crates/searcher/src/searcher/glue.rs:10-15](https://github.com/BurntSushi/ripgrep/blob/main/crates/searcher/src/searcher/glue.rs#L10-L15), [crates/searcher/src/searcher/glue.rs:97-100](https://github.com/BurntSushi/ripgrep/blob/main/crates/searcher/src/searcher/glue.rs#L97-L100), [crates/searcher/src/searcher/glue.rs:142-147](https://github.com/BurntSushi/ripgrep/blob/main/crates/searcher/src/searcher/glue.rs#L142-L147), [crates/searcher/src/searcher/glue.rs:133-138](https://github.com/BurntSushi/ripgrep/blob/main/crates/searcher/src/searcher/glue.rs#L133-L138), [crates/searcher/src/searcher/glue.rs:337-343](https://github.com/BurntSushi/ripgrep/blob/main/crates/searcher/src/searcher/glue.rs#L337-L343)

### Slice Search Trade-Offs

Analyzing the implementation structure of slice search executors reveals distinct design trade-offs when operating directly on memory maps versus streaming readers.

| Design Choice | Benefit | Cost |
| :--- | :--- | :--- |
| Direct slice indexing (`&self.slice[...]`) | Eliminates buffer allocation overhead and copy operations; enables direct random access | Requires the entire haystack to fit contiguously in virtual memory address space |
| Initial chunk binary detection limit (`DEFAULT_BUFFER_CAPACITY`) | Avoids scanning the entire mapping upfront for binary indicators, preserving mmap startup performance | Binary data occurring after the initial chunk boundary in non-matching regions may remain undetected |
| Match delaying and adjacent grouping in `MultiLine` | Guarantees a single line is never sinked more than once and groups overlapping matches into coherent blocks | Requires holding `last_match` state and conditional branch evaluation during match iteration |

Sources: [crates/searcher/src/searcher/glue.rs:119-122](https://github.com/BurntSushi/ripgrep/blob/main/crates/searcher/src/searcher/glue.rs#L119-L122), [crates/searcher/src/searcher/glue.rs:223-226](https://github.com/BurntSushi/ripgrep/blob/main/crates/searcher/src/searcher/glue.rs#L223-L226), [crates/searcher/src/searcher/glue.rs:246-255](https://github.com/BurntSushi/ripgrep/blob/main/crates/searcher/src/searcher/glue.rs#L246-L255)

## Binary Detection and Early Termination

### Overview

When searching memory-mapped byte buffers, the search engine enforces rules for binary content detection and early termination. These checks guard against processing binary files when configured to skip them or abort upon discovering specific indicator bytes.

Sources: [crates/searcher/src/searcher/glue.rs:119-122](https://github.com/BurntSushi/ripgrep/blob/main/crates/searcher/src/searcher/glue.rs#L119-L122), [crates/searcher/src/searcher/glue.rs:168-171](https://github.com/BurntSushi/ripgrep/blob/main/crates/searcher/src/searcher/glue.rs#L168-L171)

### Binary Detection and Quit Execution Flow

The binary detection and early termination checks follow a precise execution pathway during slice evaluation. In `SliceByLine::run` and `MultiLine::run`, the searcher calculates an initial binary evaluation boundary bounded by `DEFAULT_BUFFER_CAPACITY` and passes a `Range` to `detect_binary`.

1. `SliceByLine::run` or `MultiLine::run` invokes `std::cmp::min(self.slice.len(), DEFAULT_BUFFER_CAPACITY)`.
2. A `Range` is constructed from zero up to this calculated limit: `Range::new(0, binary_upto)`.
3. `self.core.detect_binary(self.slice, &binary_range)` evaluates the slice segment for binary content.
4. If binary data is detected and quit conditions are met, the search terminates early without scanning the remainder of the memory map.

```rust
let binary_upto =
    std::cmp::min(self.slice.len(), DEFAULT_BUFFER_CAPACITY);
let binary_range = Range::new(0, binary_upto);
if !self.core.detect_binary(self.slice, &binary_range)? {
    while !self.slice[self.core.pos()..].is_empty()
        && self.core.match_by_line(self.slice)?
    {}
}
```

Sources: [crates/searcher/src/searcher/glue.rs:119-126](https://github.com/BurntSushi/ripgrep/blob/main/crates/searcher/src/searcher/glue.rs#L119-L126), [crates/searcher/src/searcher/glue.rs:168-175](https://github.com/BurntSushi/ripgrep/blob/main/crates/searcher/src/searcher/glue.rs#L168-L175)

> [!WARNING]
> For slice-based searchers (`SliceByLine` and `MultiLine`), binary detection is performed strictly within the initial chunk defined by `DEFAULT_BUFFER_CAPACITY`. If binary markers appear later in the file outside matching lines, they will not trigger early termination in the same manner as buffered stream readers.

Sources: [crates/searcher/src/searcher/glue.rs:119-122](https://github.com/BurntSushi/ripgrep/blob/main/crates/searcher/src/searcher/glue.rs#L119-L122), [crates/searcher/src/searcher/glue.rs:168-171](https://github.com/BurntSushi/ripgrep/blob/main/crates/searcher/src/searcher/glue.rs#L168-L171)

### Binary Check Methods and Helpers

The searcher glue implementation relies on helper methods on `ReadByLine` to inspect buffer states and evaluate quit thresholds during buffered or stream execution.

| Method Name | Signature | Purpose and Operational Behavior |
| :--- | :--- | :--- |
| `ReadByLine::should_binary_quit` | `fn should_binary_quit(&self) -> bool` | Returns true if a binary byte offset has been identified and the configuration specifies a quit byte threshold (`quit_byte().is_some()`). |
| `ReadByLine::fill` | `fn fill(&mut self) -> Result<bool, S::Error>` | Rolls the line buffer, fills from the underlying reader, checks for newly exposed binary offsets, and evaluates binary quit conditions. |
| `ReadByLine::consume_remaining` | `fn consume_remaining(&mut self)` | Consumes remaining unsearched bytes up to the core position when a quit condition is triggered. |

Sources: [crates/searcher/src/searcher/glue.rs:53-56](https://github.com/BurntSushi/ripgrep/blob/main/crates/searcher/src/searcher/glue.rs#L53-L56), [crates/searcher/src/searcher/glue.rs:58-88](https://github.com/BurntSushi/ripgrep/blob/main/crates/searcher/src/searcher/glue.rs#L58-L88), [crates/searcher/src/searcher/glue.rs:90-93](https://github.com/BurntSushi/ripgrep/blob/main/crates/searcher/src/searcher/glue.rs#L90-L93)

## Slice Versus Reader Search Pipelines

### Overview

Ripgrep dispatches search operations across two primary architectural pathways depending on whether the input source can be memory-mapped as a contiguous byte slice or must be streamed dynamically through a buffered I/O reader. The glue layer defines distinct runner structs—`SliceByLine` and `MultiLine` for direct memory slices, versus `ReadByLine` for stream buffers—tailoring the matching and buffer-management strategies to the underlying data representation.

Sources: [crates/searcher/src/searcher/glue.rs:10-15](https://github.com/BurntSushi/ripgrep/blob/main/crates/searcher/src/searcher/glue.rs#L10-L15), [crates/searcher/src/searcher/glue.rs:96-100](https://github.com/BurntSushi/ripgrep/blob/main/crates/searcher/src/searcher/glue.rs#L96-L100), [crates/searcher/src/searcher/glue.rs:141-147](https://github.com/BurntSushi/ripgrep/blob/main/crates/searcher/src/searcher/glue.rs#L141-L147)

### Execution Pipeline Walkthrough

The execution pipeline differs significantly between direct slice searchers and reader-based streaming searchers, governing how buffers are filled, advanced, and finalized.

1. `SearchWorker::search` inspects the haystack characteristics and routes execution to either `search_path` (leveraging memory maps) or `search_reader` (leveraging buffered streams).
2. For slice inputs, `SliceByLine::run` or `MultiLine::run` initializes execution via `self.core.begin()`, performs binary detection on an initial range bounded by `DEFAULT_BUFFER_CAPACITY`, and iterates across `self.slice` until all bytes are consumed.
3. For reader inputs, `ReadByLine::run` executes `self.core.begin()`, then loops over `self.fill()` to stream chunks into a `LineBufferReader`, calling `self.core.match_by_line(self.rdr.buffer())` for each populated buffer segment.
4. Both pipelines conclude by invoking `self.core.finish()` with appropriate byte counts and binary byte offsets.

```rust
pub(crate) fn run(mut self) -> Result<(), S::Error> {
    if self.core.begin()? {
        while self.fill()? {
            if !self.core.match_by_line(self.rdr.buffer())? {
                self.consume_remaining();
                break;
            }
        }
    }
    self.core.finish(
        self.rdr.absolute_byte_offset(),
        self.rdr.binary_byte_offset(),
    )
}
```

Sources: [crates/searcher/src/searcher/glue.rs:38-51](https://github.com/BurntSushi/ripgrep/blob/main/crates/searcher/src/searcher/glue.rs#L38-L51), [crates/searcher/src/searcher/glue.rs:117-131](https://github.com/BurntSushi/ripgrep/blob/main/crates/searcher/src/searcher/glue.rs#L117-L131), [crates/core/search.rs:244-267](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/search.rs#L244-L267)

> [!NOTE]
> `ReadByLine` checks for binary data on every buffer refill if binary detection is active, whereas `SliceByLine` and `MultiLine` perform an initial binary detection check on the first chunk and subsequently rely on match-driven detection.

Sources: [crates/searcher/src/searcher/glue.rs:69-75](https://github.com/BurntSushi/ripgrep/blob/main/crates/searcher/src/searcher/glue.rs#L69-L75), [crates/searcher/src/searcher/glue.rs:119-122](https://github.com/BurntSushi/ripgrep/blob/main/crates/searcher/src/searcher/glue.rs#L119-L122), [crates/searcher/src/searcher/glue.rs:168-171](https://github.com/BurntSushi/ripgrep/blob/main/crates/searcher/src/searcher/glue.rs#L168-L171)

### Structural Design Trade-Offs

| Pipeline Architecture | Benefit | Cost |
| :--- | :--- | :--- |
| `SliceByLine` / `MultiLine` (Direct Slice) | Zero-copy searching across memory-mapped regions; enables simpler bounds checking and multi-line lookaheads without buffer sliding. | Requires the entire file or chunk to be addressable in virtual memory; less suitable for unbounded pipes or streaming inputs. |
| `ReadByLine` (Reader Stream) | Handles arbitrary `io::Read` streams, compressed data wrappers, and preprocessors without requiring full file memory mapping. | Requires manual buffer management, rolling logic via `self.core.roll()`, and periodic buffer refilling (`self.rdr.fill()`). |

Sources: [crates/searcher/src/searcher/glue.rs:58-88](https://github.com/BurntSushi/ripgrep/blob/main/crates/searcher/src/searcher/glue.rs#L58-L88), [crates/searcher/src/searcher/glue.rs:117-131](https://github.com/BurntSushi/ripgrep/blob/main/crates/searcher/src/searcher/glue.rs#L117-L131), [crates/core/search.rs:362-375](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/search.rs#L362-L375)

## Related

- [[File Search Core]]

