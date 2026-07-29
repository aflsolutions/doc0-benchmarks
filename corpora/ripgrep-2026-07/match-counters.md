# Match Counters

<details>
<summary>Relevant source files</summary>

The following files were used as context for generating this wiki page:

- [crates/searcher/src/searcher/glue.rs](https://github.com/BurntSushi/ripgrep/blob/main/crates/searcher/src/searcher/glue.rs)
- [crates/printer/src/standard.rs](https://github.com/BurntSushi/ripgrep/blob/main/crates/printer/src/standard.rs)
- [crates/core/search.rs](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/search.rs)
</details>

## Overview

Match counters play a critical role in tracking and limiting search match output across ripgrep's searching and printing pipelines. By maintaining per-file match counts and enforcing maximum match limits, the match-counting system prevents excessive output generation and coordinates graceful search termination when thresholds are reached.

Sources: [crates/printer/src/standard.rs:662-671](https://github.com/BurntSushi/ripgrep/blob/main/crates/printer/src/standard.rs#L662-L671)

## Search Worker Parallel Execution

### Overview

The high-level search worker orchestration manages interaction points between matchers, searchers, and printers. Defined in `crates/core/search.rs`, the search worker handles configuration details such as preprocessor execution, decompression settings, and binary file detection modes.

Sources: [crates/core/search.rs:1-37](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/search.rs#L1-L37)

### Search Worker Configuration and Builder

The `SearchWorkerBuilder` constructs `SearchWorker` instances using a `Config` structure along with a `grep::cli::CommandReaderBuilder`. 

```rust
pub(crate) struct SearchWorkerBuilder {
    config: Config,
    command_builder: grep::cli::CommandReaderBuilder,
}
```

The configuration properties and their default values control preprocessors, archive searching, and binary file detection.

| Option | Type | Default | Purpose |
| :--- | :--- | :--- | :--- |
| `preprocessor` | `Option<std::path::PathBuf>` | `None` | Optional command run instead of direct file reading |
| `preprocessor_globs` | `ignore::overrides::Override` | `Override::empty()` | Glob patterns limiting which files use the preprocessor |
| `search_zip` | `bool` | `false` | Enables automatic decompression and searching of compressed files |
| `binary_implicit` | `grep::searcher::BinaryDetection` | `BinaryDetection::none()` | Binary detection mode for recursive directory searches |
| `binary_explicit` | `grep::searcher::BinaryDetection` | `BinaryDetection::none()` | Binary detection mode for explicitly supplied files |

Sources: [crates/core/search.rs:14-37](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/search.rs#L14-L37), [crates/core/search.rs:39-44](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/search.rs#L39-L44)

> [!NOTE]
> If a preprocessor command is explicitly configured via `preprocessor()`, it takes precedence and overrides the `search_zip` decompression setting entirely.

Sources: [crates/core/search.rs:116-122](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/search.rs#L116-L122)

### Builder Call Chain

To construct and configure a search worker, calls flow through the builder API methods before generating the worker instance:

`SearchWorkerBuilder::new()` → `.preprocessor()` / `.search_zip()` / `.binary_detection_implicit()` → `.build()`

When `.build()` is called, it clones the configuration and command builder, optionally instantiates a `grep::cli::DecompressionReaderBuilder` if `search_zip` is enabled, and returns the initialized `SearchWorker`.

```rust
    pub(crate) fn build<W: WriteColor>(
        &self,
        matcher: PatternMatcher,
        searcher: grep::searcher::Searcher,
        printer: Printer<W>,
    ) -> SearchWorker<W> {
        let config = self.config.clone();
        let command_builder = self.command_builder.clone();
        let decomp_builder = config.search_zip.then(|| {
            let mut decomp_builder =
                grep::cli::DecompressionReaderBuilder::new();
            decomp_builder.async_stderr(true);
            decomp_builder
        });
        SearchWorker {
            config,
            command_builder,
            decomp_builder,
            matcher,
            searcher,
            printer,
        }
    }
```

Sources: [crates/core/search.rs:52-85](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/search.rs#L52-L85)

## Line and Match Sinking

### Overview

Core searcher engine execution handles line-by-line match extraction, stream processing, buffering, binary detection, and multi-line boundary tracking during stream searches. Defined in `crates/searcher/src/searcher/glue.rs`, the engine structures execution around three primary coordinator structs: `ReadByLine`, `SliceByLine`, and `MultiLine`.

Sources: [crates/searcher/src/searcher/glue.rs:10-148](https://github.com/BurntSushi/ripgrep/blob/main/crates/searcher/src/searcher/glue.rs#L10-L148)

### Core Execution Architectures

The searcher engine implements distinct processing paths depending on whether the input source is a buffered reader or an in-memory byte slice, and whether regular expressions span multiple lines.

| Struct Name | Input Type | Multi-Line Support | Purpose |
| :--- | :--- | :--- | :--- |
| `ReadByLine` | `LineBufferReader<'s, R>` | No | Reads and searches stream chunks line by line via buffered I/O |
| `SliceByLine` | `&'s [u8]` | No | Searches an in-memory byte slice line by line without buffer management |
| `MultiLine` | `&'s [u8]` | Yes | Searches an in-memory byte slice handling multi-line regex matches, overlaps, and context |

Sources: [crates/searcher/src/searcher/glue.rs:10-148](https://github.com/BurntSushi/ripgrep/blob/main/crates/searcher/src/searcher/glue.rs#L10-L148)

### Execution Call Chain Walkthrough

For stream processing via `ReadByLine`, execution flows through a precise sequence of driver and core operations:

`ReadByLine::run()` → `self.core.begin()?` → `self.fill()?` → `self.core.match_by_line()` → `self.core.finish()`

1. **`ReadByLine::run()`** initiates the search loop by invoking `self.core.begin()?` to emit initial search headers or setup states.
2. **`self.fill()?`** rolls the internal buffer, consumes processed bytes via `self.rdr.consume(consumed)`, and reads fresh data from the underlying I/O reader.
3. **`self.core.match_by_line(self.rdr.buffer())?`** scans the current buffer slice line by line, dispatching matches to the configured sink.
4. If matching halts or encounters limits, **`self.consume_remaining()`** updates final offsets, and **`self.core.finish()`** concludes execution with absolute and binary byte counts.

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

Sources: [crates/searcher/src/searcher/glue.rs:38-51](https://github.com/BurntSushi/ripgrep/blob/main/crates/searcher/src/searcher/glue.rs#L38-L51)

> [!WARNING]
> When rolling buffers in `ReadByLine::fill()`, if rolling consumes zero bytes and re-filling the buffer adds no new bytes, the buffer contains only leftover context. The engine forcefully consumes the entire remaining buffer and terminates to prevent infinite polling loops.

Sources: [crates/searcher/src/searcher/glue.rs:79-87](https://github.com/BurntSushi/ripgrep/blob/main/crates/searcher/src/searcher/glue.rs#L79-L87)

### Multi-Line Sinking and Overlap Management

When searching with multi-line matchers (`MultiLine`), adjacent matches that start and end on the same line are delayed and coalesced into a single sink event. This guarantees that individual lines are never sinked multiple times.

```rust
                if last_match.end() >= line.start() {
                    self.last_match = Some(last_match.with_end(line.end()));
                    Ok(true)
                } else {
                    self.last_match = Some(line);
                    if !self.sink_context(&last_match)? {
                        return Ok(false);
                    }
                    self.sink_matched(&last_match)
                }
```

Sources: [crates/searcher/src/searcher/glue.rs:246-256](https://github.com/BurntSushi/ripgrep/blob/main/crates/searcher/src/searcher/glue.rs#L246-L256)

> [!NOTE]
> `MultiLine` does not require strict overlap between consecutive matches; it requires only that the lines are adjacent. This supplies larger contiguous blocks of lines to printers and downstream replacement handlers.

Sources: [crates/searcher/src/searcher/glue.rs:237-243](https://github.com/BurntSushi/ripgrep/blob/main/crates/searcher/src/searcher/glue.rs#L237-L243)

## Printer Statistics Collection

### Overview

When statistics collection is enabled on a printer via `StandardBuilder::stats(true)`, each sink instance created by `Standard::sink()` or `Standard::sink_with_path()` allocates an optional `Stats` accumulator. During execution, the sink tracks thread-local metrics including the number of matched lines, total matches, bytes searched, and elapsed wall-clock time.

Sources: [crates/printer/src/standard.rs:519-534](https://github.com/BurntSushi/ripgrep/blob/main/crates/printer/src/standard.rs#L519-L534), [crates/printer/src/standard.rs:555](https://github.com/BurntSushi/ripgrep/blob/main/crates/printer/src/standard.rs#L555)

### Execution Call Chain Walkthrough

Statistics collection spans the entire lifecycle of a search operation handled by `StandardSink`. The collection pipeline executes across distinct phase-specific hook methods:

`StandardSink::begin()` → `StandardSink::matched()` / `StandardSink::context()` → `StandardSink::finish()`

1. **`StandardSink::begin()`** resets the byte counter on the underlying writer via `self.standard.wtr.borrow_mut().reset_count()`, initializes `self.match_count` to `0`, clears `self.binary_byte_offset`, and records the start time using `Instant::now()`.
2. **`StandardSink::matched()`** increments `self.match_count`, records individual match byte ranges, executes replacements if configured, and updates aggregate match statistics if `self.stats` is active: `stats.add_matches(self.standard.matches.len() as u64)` and `stats.add_matched_lines(mat.lines().count() as u64)`.
3. **`StandardSink::finish()`** finalizes the accumulator by recording elapsed time via `self.start_time.elapsed()`, incrementing total search counts and match-hit tallies, aggregating bytes searched from `finish.byte_count()`, and capturing total printed bytes from `self.standard.wtr.borrow().count()`.

```rust
    fn finish(
        &mut self,
        searcher: &Searcher,
        finish: &SinkFinish,
    ) -> Result<(), io::Error> {
        if let Some(offset) = self.binary_byte_offset {
            StandardImpl::new(searcher, self).write_binary_message(offset)?;
        }
        if let Some(stats) = self.stats.as_mut() {
            stats.add_elapsed(self.start_time.elapsed());
            stats.add_searches(1);
            if self.match_count > 0 {
                stats.add_searches_with_match(1);
            }
            stats.add_bytes_searched(finish.byte_count());
            stats.add_bytes_printed(self.standard.wtr.borrow().count());
        }
        Ok(())
    }
```

Sources: [crates/printer/src/standard.rs:841-867](https://github.com/BurntSushi/ripgrep/blob/main/crates/printer/src/standard.rs#L841-L867)

> [!NOTE]
> Enabling statistics collection forces `needs_match_granularity()` to return `true`. This instructs the printer to compute and store individual match locations even when colors are disabled, ensuring accurate per-match counts during complex multi-line or replacement searches.

Sources: [crates/printer/src/standard.rs:578-594](https://github.com/BurntSushi/ripgrep/blob/main/crates/printer/src/standard.rs#L578-L594)

### Printer Configuration and Statistics API

The builder and printer types expose methods to configure and retrieve collection behavior.

| Method Name | Receiver / Builder | Default Value | Purpose |
| :--- | :--- | :--- | :--- |
| `StandardBuilder::stats` | `&mut StandardBuilder` | `false` | Enables or disables gathering of aggregate execution statistics |
| `Standard::sink` | `&mut Standard<W>` | N/A | Creates a sink without path association, optionally initializing `Stats` |
| `Standard::sink_with_path` | `&mut Standard<W>` | N/A | Creates a sink associated with a file path and an optional stats accumulator |
| `StandardSink::stats` | `&self` | `None` | Returns an immutable reference to the gathered [`Stats`], if enabled |

Sources: [crates/printer/src/standard.rs:203-206](https://github.com/BurntSushi/ripgrep/blob/main/crates/printer/src/standard.rs#L203-L206), [crates/printer/src/standard.rs:515-535](https://github.com/BurntSushi/ripgrep/blob/main/crates/printer/src/standard.rs#L515-L535), [crates/printer/src/standard.rs:541-571](https://github.com/BurntSushi/ripgrep/blob/main/crates/printer/src/standard.rs#L541-L571), [crates/printer/src/standard.rs:692-694](https://github.com/BurntSushi/ripgrep/blob/main/crates/printer/src/standard.rs#L692-L694)

## Match Counting and Limit Enforcement

### Overview

The standard printer tracks the frequency of matches encountered during stream traversal and enforces maximum match constraints per file search. Match limit enforcement is managed via `SearcherBuilder::max_matches`, which restricts the total number of matching lines or blocks reported before terminating a search early.

Sources: [crates/printer/src/standard.rs:2679-2691](https://github.com/BurntSushi/ripgrep/blob/main/crates/printer/src/standard.rs#L2679-L2691)

### Match Limit Enforcement Mechanism

When `max_matches` is configured on a `grep_searcher::SearcherBuilder`, the searcher tracks how many matches have been sinked. During output generation, the `StandardSink` maintains a running tally of matches via `self.match_count`.

> [!NOTE]
> Limit enforcement interacts directly with context printing. When `after_context` is enabled alongside `max_matches`, the searcher and printer ensure that trailing context lines associated with the final permitted match are fully emitted before the search halts.

Sources: [crates/printer/src/standard.rs:2701-2722](https://github.com/BurntSushi/ripgrep/blob/main/crates/printer/src/standard.rs#L2701-L2722), [crates/printer/src/standard.rs:530](https://github.com/BurntSushi/ripgrep/blob/main/crates/printer/src/standard.rs#L530), [crates/printer/src/standard.rs:771](https://github.com/BurntSushi/ripgrep/blob/main/crates/printer/src/standard.rs#L771)

### Printer Configuration Options

The following table summarizes builder settings and methods related to match counting and limits:

| Option / Method | Type | Default Value | Purpose |
| :--- | :--- | :--- | :--- |
| `SearcherBuilder::max_matches` | `Option<u64>` | `None` | Limits the maximum number of matches reported per search |
| `StandardSink::match_count` | Method (`&self -> u64`) | `0` | Returns the total number of matches reported to the sink in the previous search |
| `StandardSink::has_match` | Method (`&self -> bool`) | `false` | Returns true if at least one match was received during the previous search |

Sources: [crates/printer/src/standard.rs:653-671](https://github.com/BurntSushi/ripgrep/blob/main/crates/printer/src/standard.rs#L653-L671), [crates/printer/src/standard.rs:2684-2691](https://github.com/BurntSushi/ripgrep/blob/main/crates/printer/src/standard.rs#L2684-L2691)

## Statistics Lifecycle and Final Aggregation

### Overview

The final phase of the printer statistics lifecycle occurs when an individual worker stream completes its search task and invokes the `finish` callback on the sink implementation. At this boundary, thread-local counters, elapsed wall-clock time, and byte tallies are finalized and committed to the sink's aggregate statistics structure.

Sources: [crates/printer/src/standard.rs:849-867](https://github.com/BurntSushi/ripgrep/blob/main/crates/printer/src/standard.rs#L849-L867)

### Statistics Aggregation Workflow

When `Sink::finish` executes, the printer aggregates metrics collected during the stream processing phase into the `Stats` container if statistics collection was enabled via the builder configuration. The accumulation sequence processes fields in a specific order:

1. `stats.add_elapsed(self.start_time.elapsed())` — Records the total duration elapsed since `begin` initialized the timer.
2. `stats.add_searches(1)` — Increments the total count of completed searches by one.
3. `if self.match_count > 0 { stats.add_searches_with_match(1); }` — Conditionally increments searches-with-match if the file or reader contained at least one match.
4. `stats.add_bytes_searched(finish.byte_count())` — Adds the total number of bytes read and inspected from the input stream.
5. `stats.add_bytes_printed(self.standard.wtr.borrow().count())` — Records the total number of bytes written to the underlying writer during this specific search stream.

Sources: [crates/printer/src/standard.rs:841-867](https://github.com/BurntSushi/ripgrep/blob/main/crates/printer/src/standard.rs#L841-L867), [crates/printer/src/standard.rs:843](https://github.com/BurntSushi/ripgrep/blob/main/crates/printer/src/standard.rs#L843), [crates/printer/src/standard.rs:858-864](https://github.com/BurntSushi/ripgrep/blob/main/crates/printer/src/standard.rs#L858-L864)

### Statistics Metrics Reference Table

The metrics aggregated during the final lifecycle stage map directly to getter methods available on the `Stats` type retrieved from the sink:

| Metric Accumulator | Source / Input Value | Purpose |
| :--- | :--- | :--- |
| `add_elapsed` | `self.start_time.elapsed()` | Accumulates total wall-clock execution duration for the search stream |
| `add_searches` | `1` (constant per stream finish) | Tracks total search operations completed |
| `add_searches_with_match` | `1` (conditional on `match_count > 0`) | Tracks how many searched streams yielded at least one match |
| `add_bytes_searched` | `finish.byte_count()` | Records the total raw bytes parsed from the input source |
| `add_bytes_printed` | `self.standard.wtr.borrow().count()` | Records the output byte count written via the `CounterWriter` |

Sources: [crates/printer/src/standard.rs:857-865](https://github.com/BurntSushi/ripgrep/blob/main/crates/printer/src/standard.rs#L857-L865)

> [!NOTE]
> The `CounterWriter` wrapped around the underlying writer is reset via `reset_count()` when `Sink::begin` is invoked at the start of each search stream. This ensures that `bytes_printed` measures precisely the output generated by that individual file or reader before being accumulated into the global summary statistics.

Sources: [crates/printer/src/standard.rs:842-864](https://github.com/BurntSushi/ripgrep/blob/main/crates/printer/src/standard.rs#L842-L864)

## Related

- [[Summary Printers]]

