# Line Buffering

<details>
<summary>Relevant source files</summary>

The following files were used as context for generating this wiki page:

- [crates/searcher/src/searcher/glue.rs](https://github.com/BurntSushi/ripgrep/blob/main/crates/searcher/src/searcher/glue.rs)
- [crates/printer/src/standard.rs](https://github.com/BurntSushi/ripgrep/blob/main/crates/printer/src/standard.rs)
- [crates/searcher/src/line_buffer.rs](https://github.com/BurntSushi/ripgrep/blob/main/crates/searcher/src/line_buffer.rs)
</details>

## Overview

Line buffering forms the core incremental search infrastructure within ripgrep's searcher component, designed to process streaming input sources by reading data into managed memory buffers while preserving valid line boundaries. It solves the fundamental problem of searching unbounded streams or large files without loading entire contents into RAM, while ensuring that regex matchers never operate on truncated lines or split tokens. By combining fixed-size initial read chunks with dynamic capacity management, rolling buffer logic, and explicit line termination rules, the subsystem coordinates stream refilling, line boundary scanning, byte offset tracking, and binary data inspection.

Sources: [crates/searcher/src/searcher/glue.rs:38-88](https://github.com/BurntSushi/ripgrep/blob/main/crates/searcher/src/searcher/glue.rs#L38-L88), [crates/searcher/src/line_buffer.rs:5-27](https://github.com/BurntSushi/ripgrep/blob/main/crates/searcher/src/line_buffer.rs#L5-L27)

## LineBuffer Management and Allocation Strategies

### Overview

The `LineBuffer` data structure manages memory allocation, read capacities, and state tracking for incremental stream processing. It uses a fixed default capacity of 64 KB (`DEFAULT_BUFFER_CAPACITY`) and supports configurable allocation behaviors via the `BufferAllocation` enum when lines exceed the initial buffer size.

Sources: [crates/searcher/src/line_buffer.rs:5-27](https://github.com/BurntSushi/ripgrep/blob/main/crates/searcher/src/line_buffer.rs#L5-L27)

### Data Structures and Configuration Constants

The buffer subsystem defines core configuration options and state fields that govern allocation limits, line termination bytes, and binary content detection.

| Constant / Type | Value / Variants | Purpose |
| :--- | :--- | :--- |
| `DEFAULT_BUFFER_CAPACITY` | `64 * (1 << 10)` (64 KB) | The default byte capacity used for the line buffer and read size. |
| `BufferAllocation::Eager` | Unit variant (default) | Attempt to expand buffer size until the next line fits or memory is exhausted. |
| `BufferAllocation::Error(usize)` | `usize` byte limit | Limit additional memory allocation; return an error if a line exceeds the limit. |
| `BinaryDetection::None` | Unit variant (default) | No binary detection performed; data may contain arbitrary bytes. |
| `BinaryDetection::Quit(u8)` | `u8` byte value | Treat data as binary and act as EOF if the specified byte occurs. |
| `BinaryDetection::Convert(u8)` | `u8` byte value | Replace the specified binary byte with the line terminator. |

Sources: [crates/searcher/src/line_buffer.rs:5-70](https://github.com/BurntSushi/ripgrep/blob/main/crates/searcher/src/line_buffer.rs#L5-L70)

> [!NOTE]
> When `BufferAllocation::Error(usize)` is configured and a line requires more memory than the allowed limit, `alloc_error(limit)` constructs an `io::Error` with `ErrorKind::Other` and the message `"configured allocation limit ({}) exceeded"`.

Sources: [crates/searcher/src/line_buffer.rs:23-40](https://github.com/BurntSushi/ripgrep/blob/main/crates/searcher/src/line_buffer.rs#L23-L40)

### Initialization and Builder API

Line buffers are constructed via `LineBufferBuilder`, which encapsulates a `Config` struct containing the capacity, line terminator, allocation strategy, and binary detection rules. Calling `build()` initializes the `LineBuffer` instance with zeroed vector storage and resets all internal offsets and position trackers.

Sources: [crates/searcher/src/line_buffer.rs:83-131](https://github.com/BurntSushi/ripgrep/blob/main/crates/searcher/src/line_buffer.rs#L83-L131)

> [!WARNING]
> The `LineBuffer` struct initializes `buf` using `vec![0; self.config.capacity]`. Modifying the capacity through `LineBufferBuilder::capacity` adjusts the initial read chunk size and buffer allocation target.

Sources: [crates/searcher/src/line_buffer.rs:121-147](https://github.com/BurntSushi/ripgrep/blob/main/crates/searcher/src/line_buffer.rs#L121-L147)

## Stream Refilling and Buffer Rolling Flow

### Overview

Stream refilling and buffer rolling coordinate how incremental input is fetched, searched, and advanced across iterations. The `ReadByLine` struct orchestrates this workflow by pairing a `Searcher` configuration, a `Core` search engine, and a `LineBufferReader`.

Sources: [crates/searcher/src/searcher/glue.rs:10-15](https://github.com/BurntSushi/ripgrep/blob/main/crates/searcher/src/searcher/glue.rs#L10-L15)

### Call-Chain Execution Walkthrough

The primary execution loop runs through `ReadByLine::run()`, which executes the search lifecycle by driving stream refilling and match processing iteratively.

1. `ReadByLine::run()` — Initiates the search by invoking `self.core.begin()`. If successful, it loops on `self.fill()` to fetch and roll data.
Sources: [crates/searcher/src/searcher/glue.rs:38-46](https://github.com/BurntSushi/ripgrep/blob/main/crates/searcher/src/searcher/glue.rs#L38-L46)

2. `ReadByLine::fill()` — Asserts that all bytes up to `self.core.pos()` have been consumed, calculates buffer shifts via `self.core.roll(self.rdr.buffer())`, and consumes processed bytes through `self.rdr.consume(consumed)`.
Sources: [crates/searcher/src/searcher/glue.rs:58-64](https://github.com/BurntSushi/ripgrep/blob/main/crates/searcher/src/searcher/glue.rs#L58-L64)

3. `LineBufferReader::fill()` — Reads new input from the underlying I/O stream into the buffer. Errors are mapped via `S::Error::error_io(err)`.
Sources: [crates/searcher/src/searcher/glue.rs:65-68](https://github.com/BurntSushi/ripgrep/blob/main/crates/searcher/src/searcher/glue.rs#L65-L68)

4. `ReadByLine::should_binary_quit()` — Evaluates whether binary detection triggers an early exit if a binary byte offset is present alongside a quit byte configuration.
Sources: [crates/searcher/src/searcher/glue.rs:76-78](https://github.com/BurntSushi/ripgrep/blob/main/crates/searcher/src/searcher/glue.rs#L76-L78), [crates/searcher/src/searcher/glue.rs:90-93](https://github.com/BurntSushi/ripgrep/blob/main/crates/searcher/src/searcher/glue.rs#L90-L93)

5. `Core::match_by_line()` — Searches the active buffer contents. If a search round fails or terminates prematurely, `ReadByLine::consume_remaining()` finalizes buffer consumption before loop termination.
Sources: [crates/searcher/src/searcher/glue.rs:40-45](https://github.com/BurntSushi/ripgrep/blob/main/crates/searcher/src/searcher/glue.rs#L40-L45), [crates/searcher/src/searcher/glue.rs:53-56](https://github.com/BurntSushi/ripgrep/blob/main/crates/searcher/src/searcher/glue.rs#L53-L56)

6. `Core::finish()` — Concludes the search execution by passing absolute and binary byte offsets from the reader.
Sources: [crates/searcher/src/searcher/glue.rs:47-50](https://github.com/BurntSushi/ripgrep/blob/main/crates/searcher/src/searcher/glue.rs#L47-L50)

> [!WARNING]
> If rolling the buffer results in zero consumed bytes (`consumed == 0`) and re-filling the buffer adds no new bytes (`old_buf_len == self.rdr.buffer().len()`), the remaining data consists entirely of leftover context that is no longer needed. The reader forcefully consumes the old buffer length and returns `Ok(false)` to prevent infinite loops.
Sources: [crates/searcher/src/searcher/glue.rs:79-86](https://github.com/BurntSushi/ripgrep/blob/main/crates/searcher/src/searcher/glue.rs#L79-L86)

## Line Boundary Detection and Matching Engine

### Overview

Line boundary detection and matching routines are implemented in search glue via specialised worker types: `ReadByLine`, `SliceByLine`, and `MultiLine`. These structures coordinate line-by-line scanning, slice-based searches, and multiline matching state across buffers and memory slices.

Sources: [crates/searcher/src/searcher/glue.rs:10-15](https://github.com/BurntSushi/ripgrep/blob/main/crates/searcher/src/searcher/glue.rs#L10-L15), [crates/searcher/src/searcher/glue.rs:96-100](https://github.com/BurntSushi/ripgrep/blob/main/crates/searcher/src/searcher/glue.rs#L96-L100), [crates/searcher/src/searcher/glue.rs:141-147](https://github.com/BurntSushi/ripgrep/blob/main/crates/searcher/src/searcher/glue.rs#L141-L147)

### Slice and Multiline Search Mechanics

`SliceByLine` and `MultiLine` operate directly on borrowed byte slices (`&'s [u8]`). Both initialize by asserting whether the matcher requires multiline capability via `searcher.multi_line_with_matcher(&matcher)`.

Sources: [crates/searcher/src/searcher/glue.rs:103-115](https://github.com/BurntSushi/ripgrep/blob/main/crates/searcher/src/searcher/glue.rs#L103-L115), [crates/searcher/src/searcher/glue.rs:150-164](https://github.com/BurntSushi/ripgrep/blob/main/crates/searcher/src/searcher/glue.rs#L150-L164)

The execution flow for slice and multiline scanning follows a precise path:

1. `SliceByLine::run()` or `MultiLine::run()` — Begins execution by calling `self.core.begin()?`. If successful, it calculates binary detection bounds using `std::cmp::min(self.slice.len(), DEFAULT_BUFFER_CAPACITY)` and instantiates a `Range`.
Sources: [crates/searcher/src/searcher/glue.rs:117-121](https://github.com/BurntSushi/ripgrep/blob/main/crates/searcher/src/searcher/glue.rs#L117-L121), [crates/searcher/src/searcher/glue.rs:167-171](https://github.com/BurntSushi/ripgrep/blob/main/crates/searcher/src/searcher/glue.rs#L167-L171)

2. `Core::detect_binary()` — Scans the initial range for binary content. If binary data is absent, the engine enters its main scanning loop.
Sources: [crates/searcher/src/searcher/glue.rs:122-125](https://github.com/BurntSushi/ripgrep/blob/main/crates/searcher/src/searcher/glue.rs#L122-L125), [crates/searcher/src/searcher/glue.rs:171-175](https://github.com/BurntSushi/ripgrep/blob/main/crates/searcher/src/searcher/glue.rs#L171-L175)

3. `MultiLine::sink()` — For multiline searches, `sink()` dispatches to `self.find()` to locate match ranges, advances the internal search position via `self.advance(&mat)`, and locates line boundaries using `lines::locate(self.slice, self.config.line_term.as_byte(), mat)`.
Sources: [crates/searcher/src/searcher/glue.rs:208-222](https://github.com/BurntSushi/ripgrep/blob/main/crates/searcher/src/searcher/glue.rs#L208-L222)

4. `MultiLine::sink_matched_inverted()` — When inverted matching is enabled, `sink_matched_inverted()` handles non-matching regions by utilizing a `LineStep` stepper initialized with `self.config.line_term.as_byte()`, `invert_match.start()`, and `invert_match.end()`, iterating through lines via `stepper.next_match(self.slice)`.
Sources: [crates/searcher/src/searcher/glue.rs:260-296](https://github.com/BurntSushi/ripgrep/blob/main/crates/searcher/src/searcher/glue.rs#L260-L296)

5. `Core::finish()` — Concludes execution by passing computed byte counts and binary byte offsets.
Sources: [crates/searcher/src/searcher/glue.rs:128-131](https://github.com/BurntSushi/ripgrep/blob/main/crates/searcher/src/searcher/glue.rs#L128-L131), [crates/searcher/src/searcher/glue.rs:203-206](https://github.com/BurntSushi/ripgrep/blob/main/crates/searcher/src/searcher/glue.rs#L203-L206)

> [!NOTE]
> `MultiLine` delays sinking matches to group adjacent matches together into a single sink invocation. Adjacent matches are defined as distinct matches that start and end on the same line, ensuring a single line is never sinked more than once.
Sources: [crates/searcher/src/searcher/glue.rs:223-226](https://github.com/BurntSushi/ripgrep/blob/main/crates/searcher/src/searcher/glue.rs#L223-L226)

### Match Location and Position Advancement

The `MultiLine` engine tracks match state using `last_match: Option<Range>` and adjusts search positions via `MultiLine::advance()`. Zero-width matches receive special treatment: if a match range is empty and the current position is within the slice length, the position is advanced by one extra byte.

Sources: [crates/searcher/src/searcher/glue.rs:142-147](https://github.com/BurntSushi/ripgrep/blob/main/crates/searcher/src/searcher/glue.rs#L142-L147), [crates/searcher/src/searcher/glue.rs:333-343](https://github.com/BurntSushi/ripgrep/blob/main/crates/searcher/src/searcher/glue.rs#L333-L343)

## Line Termination Handling and Standard Output

### Overview

Line termination handling and standard output formatting are managed by `StandardImpl` and `PreludeWriter` within the printer module. These types handle trimming trailing line terminators, preserving explicit line terminators during fast paths or replacements, and rendering formatted outputs such as prefixes, file paths, line numbers, and column offsets.

Sources: [crates/printer/src/standard.rs:876-882](https://github.com/BurntSushi/ripgrep/blob/main/crates/printer/src/standard.rs#L876-L882), [crates/printer/src/standard.rs:1594-1600](https://github.com/BurntSushi/ripgrep/blob/main/crates/printer/src/standard.rs#L1594-L1600)

### Line Terminator Trimming and Preservation Flow

When writing lines without match granularity or when stripping explicit boundaries, the printer verifies and strips line terminators using utility functions and searcher configuration. The execution path for outputting regular and fast lines follows specific checks:

1. `StandardImpl::write_line()` — Evaluates whether ASCII prefix trimming is enabled via `self.config().trim_ascii`. If active, it uses `trim_ascii_prefix()` to compute the non-whitespace slice range.
Sources: [crates/printer/src/standard.rs:1192-1200](https://github.com/BurntSushi/ripgrep/blob/main/crates/printer/src/standard.rs#L1192-L1200)

2. `StandardImpl::exceeds_max_columns()` — Checks if the target line exceeds configured column limits. If exceeded, it delegates to `write_exceeded_line()` to either print an omission message or a preview.
Sources: [crates/printer/src/standard.rs:1201-1209](https://github.com/BurntSushi/ripgrep/blob/main/crates/printer/src/standard.rs#L1201-L1209)

3. `StandardImpl::has_line_terminator()` — Inspects whether the provided buffer ends with the searcher's configured line terminator using `self.searcher.line_terminator().is_suffix(buf)`.
Sources: [crates/printer/src/standard.rs:1212-1214](https://github.com/BurntSushi/ripgrep/blob/main/crates/printer/src/standard.rs#L1212-L1214), [crates/printer/src/standard.rs:1527-1529](https://github.com/BurntSushi/ripgrep/blob/main/crates/printer/src/standard.rs#L1527-L1529)

4. `StandardImpl::write_line_term()` — Writes the exact line terminator bytes retrieved from `self.searcher.line_terminator().as_bytes()` if a terminator is missing from the buffer.
Sources: [crates/printer/src/standard.rs:1429-1431](https://github.com/BurntSushi/ripgrep/blob/main/crates/printer/src/standard.rs#L1429-L1431)

> [!NOTE]
> `trim_line_terminator` invokes `trim_line_terminator(&self.searcher, buf, line)` to remove trailing `\n` or `\r\n` sequences from match slices before highlighting or writing colorized segments.
Sources: [crates/printer/src/standard.rs:1523-1525](https://github.com/BurntSushi/ripgrep/blob/main/crates/printer/src/standard.rs#L1523-L1525)

### Prelude Construction and Field Formatting

The `PreludeWriter` struct manages the formatting sequence that precedes each matching or context line. Depending on the printer configuration, it injects file paths, line numbers, column numbers, and byte offsets separated by custom field or path terminators.

Sources: [crates/printer/src/standard.rs:1594-1609](https://github.com/BurntSushi/ripgrep/blob/main/crates/printer/src/standard.rs#L1594-L1609)

| Prelude Field | Config Flag | Default Value | Purpose |
| :--- | :--- | :--- | :--- |
| **Path** | `path()` / `heading` | Enabled (prefix or header) | Displays the file path associated with the search result. |
| **Line Number** | `Searcher` setting | Enabled (in searcher) | Prints the 1-based line number for the matching or context line. |
| **Column Number** | `column(true)` | Disabled (`false`) | Prints the 1-based byte offset column of the first match on the line. |
| **Byte Offset** | `byte_offset(true)` | Disabled (`false`) | Prints the 0-based absolute byte offset from the start of the search. |

Sources: [crates/printer/src/standard.rs:229-232](https://github.com/BurntSushi/ripgrep/blob/main/crates/printer/src/standard.rs#L229-L232), [crates/printer/src/standard.rs:335-338](https://github.com/BurntSushi/ripgrep/blob/main/crates/printer/src/standard.rs#L335-L338), [crates/printer/src/standard.rs:347-350](https://github.com/BurntSushi/ripgrep/blob/main/crates/printer/src/standard.rs#L347-L350), [crates/printer/src/standard.rs:1660-1715](https://github.com/BurntSushi/ripgrep/blob/main/crates/printer/src/standard.rs#L1660-L1715)

The prelude writer sequences its output through `PreludeWriter::start()`, which initiates hyperlinks when line-dependent formatting or non-heading modes are active, and terminates fields via `write_separator()`.

Sources: [crates/printer/src/standard.rs:1629-1643](https://github.com/BurntSushi/ripgrep/blob/main/crates/printer/src/standard.rs#L1629-L1643), [crates/printer/src/standard.rs:1722-1736](https://github.com/BurntSushi/ripgrep/blob/main/crates/printer/src/standard.rs#L1722-L1736)

> [!WARNING]
> When `heading(true)` is set, `PreludeWriter::write_path()` skips emitting the file path on every individual line prelude to prevent redundant output, relying entirely on the single heading emitted at the top of the file block.
Sources: [crates/printer/src/standard.rs:1664-1666](https://github.com/BurntSushi/ripgrep/blob/main/crates/printer/src/standard.rs#L1664-L1666)

## Binary Data Handling and Quitting Behavior

### Binary Detection and Quitting Mechanics

Binary data handling during stream searches relies on heuristic evaluation configured via `BinaryDetection`. When `ReadByLine::fill()` fetches data from a buffered reader, it checks whether binary byte offsets have already been established. If unset, it invokes `self.rdr.binary_byte_offset()`, and if an offset is found, it calls `self.core.binary_data(offset)?`. Depending on whether a quit rule or conversion rule is active, the searcher either terminates early or alters the data stream.
Sources: [crates/searcher/src/searcher/glue.rs:58-75](https://github.com/BurntSushi/ripgrep/blob/main/crates/searcher/src/searcher/glue.rs#L58-L75)

The decision to terminate search execution prematurely is governed by `ReadByLine::should_binary_quit()`, which evaluates whether both a binary byte offset has been detected and a quit byte configuration exists in `self.config.binary.quit_byte()`.
Sources: [crates/searcher/src/searcher/glue.rs:90-94](https://github.com/BurntSushi/ripgrep/blob/main/crates/searcher/src/searcher/glue.rs#L90-L94)

| Binary Detection Variant | Action on Match | Guarantee to Callers |
| :--- | :--- | :--- |
| **`BinaryDetection::None`** | Performs no detection; data may contain arbitrary bytes. | None. |
| **`BinaryDetection::Quit(u8)`** | Stops reading data, acts as EOF, and records binary offset. | The binary byte will never be observable by callers. |
| **`BinaryDetection::Convert(u8)`** | Replaces the detected binary byte with the line terminator. | The binary byte will never be observable by callers. |

Sources: [crates/searcher/src/line_buffer.rs:50-64](https://github.com/BurntSushi/ripgrep/blob/main/crates/searcher/src/line_buffer.rs#L50-L64)

> [!WARNING]
> When `BinaryDetection::Quit` is configured, finding the specified binary byte forces an immediate termination of the search loop in `ReadByLine::fill()`, returning `Ok(false)` and suppressing further matching.
Sources: [crates/searcher/src/searcher/glue.rs:76-78](https://github.com/BurntSushi/ripgrep/blob/main/crates/searcher/src/searcher/glue.rs#L76-L78), [crates/searcher/src/searcher/glue.rs:90-94](https://github.com/BurntSushi/ripgrep/blob/main/crates/searcher/src/searcher/glue.rs#L90-L94)

## Related

- [[File Search Core]]

