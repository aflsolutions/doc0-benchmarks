# PCRE2 Matching

<details>
<summary>Relevant source files</summary>

The following files were used as context for generating this wiki page:

- [crates/searcher/src/searcher/glue.rs](https://github.com/BurntSushi/ripgrep/blob/main/crates/searcher/src/searcher/glue.rs)
- [crates/core/search.rs](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/search.rs)
- [crates/core/flags/defs.rs](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs)
</details>

## Overview

The integration of the PCRE2 regex engine within ripgrep enables advanced matching capabilities such as look-around assertions and backreferences through a robust bridging architecture. This system connects command-line flag definitions and engine selection logic with underlying search execution abstractions. High-level components like the search worker manage broader pipeline tasks including preprocessing, decompression, and dispatching search tasks, while searcher glue layers bind generic matcher traits to concrete PCRE2 execution routines. Data is processed through specialized line iteration loops and multiline search algorithms that handle match sinking, boundary alignment, and context accumulation. Additionally, binary data detection guards and context handling mechanisms safely govern how input streams are inspected, ensuring that PCRE2 pattern matching interacts correctly with ripgrep's filtering policies and output requirements.

Sources: [crates/searcher/src/searcher/glue.rs:10-351](https://github.com/BurntSushi/ripgrep/blob/main/crates/searcher/src/searcher/glue.rs#L10-L351), [crates/core/search.rs:2-376](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/search.rs#L2-L376), [crates/core/flags/defs.rs:1766-1823](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L1766-L1823)

## PCRE2 Flag Definitions and Engine Selection

### Overview

Command-line flag parsing and configuration configure the regex engine and toggle advanced matching features such as PCRE2, Unicode mode, and hybrid engine selection. The flag definitions in `crates/core/flags/defs.rs` link user inputs directly to internal choices like `EngineChoice` and update `LowArgs` state fields.

Sources: [crates/core/flags/defs.rs:1-18](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L1-L18)

### Engine Selection and PCRE2 Flags

The core flags responsible for choosing the regular expression engine and controlling PCRE2-specific behavior are parsed into corresponding engine choices. The `--engine` flag accepts specific configuration strings (`default`, `pcre2`, or `auto`), while deprecated flags like `--auto-hybrid-regex` map to `EngineChoice::Auto`.

| Flag Name | Short / Long / Negated | Type / Variable | Purpose |
| :--- | :--- | :--- | :--- |
| `Engine` | `--engine`, `--no-engine` (via value) | String (`ENGINE`) | Selects regex engine (`default`, `pcre2`, or `auto`). |
| `AutoHybridRegex` | `--auto-hybrid-regex`, `--no-auto-hybrid-regex` | Switch | (Deprecated) Dynamically chooses between engines depending on features. |
| `PCRE2` | `-P`, `--pcre2`, `--no-pcre2` | Switch | Enables the PCRE2 engine for advanced features like look-around and backreferences. |
| `PCRE2Version` | `--pcre2-version` | None | Prints the version of PCRE2 in use and exits. |

Sources: [crates/core/flags/defs.rs:1766-1823](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L1766-L1823)

> [!WARNING]
> If the `pcre2` engine is requested via `--engine=pcre2` or `-P`, but PCRE2 support was excluded during the build of ripgrep, the engine selection logic will print an error message and exit immediately.

Sources: [crates/core/flags/defs.rs:1796-1803](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L1796-L1803)

### Flag Parsing and State Update Walkthrough

When command-line arguments are parsed, the flag implementation's `update` method maps raw CLI values into structured internal options stored within `LowArgs`. 

1. `parse_low_raw()` receives command-line arguments via `lexopt`.
2. Matching flag definitions (such as `Engine`) intercept parameters.
3. `Flag::update(&self, v: FlagValue, args: &mut LowArgs)` executes.
4. `convert::str(&v)` extracts string slices from `FlagValue::Value`.
5. The string is matched against valid engine variants (`"default"`, `"pcre2"`, `"auto"`).
6. `args.engine` is assigned the resulting `EngineChoice` variant (e.g., `EngineChoice::PCRE2`).

Sources: [crates/core/flags/defs.rs:1812-1822](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L1812-L1822)

> [!TIP]
> The `--engine` flag completely overrides previous uses of both the `--pcre2` flag and the deprecated `--auto-hybrid-regex` flag, establishing a deterministic engine mode for all regexes supplied on the command line.

Sources: [crates/core/flags/defs.rs:1804-1805](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L1804-L1805)

## Search Worker Abstraction and Dispatch

### Overview

`SearchWorker` manages high-level search pipelines by coordinating pattern matchers, searchers, preprocessors, decompression handlers, and output printers. It inspects haystack properties, applies binary detection policies, and dispatches execution paths to the underlying `grep::searcher::Searcher` abstraction.

Sources: [crates/core/search.rs:1-8](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/search.rs#L1-L8)

### Search Dispatch Execution Walkthrough

When searching a haystack, `SearchWorker` executes a multi-step inspection and dispatch sequence to determine how data is fed into the searcher.

1. `SearchWorker::search(haystack)` reads `haystack.path()` and checks `haystack.is_explicit()` to select between `self.config.binary_explicit` and `self.config.binary_implicit`.
2. `self.searcher.set_binary_detection(bin)` configures the underlying searcher with the determined binary detection mode.
3. `haystack.is_stdin()` is evaluated; if true, execution branches to `self.search_reader(path, &mut io::stdin().lock())`.
4. Otherwise, `self.should_preprocess(path)` checks if a preprocessor matches the path, branching to `self.search_preprocessor(path)` if applicable.
5. If preprocessing does not apply, `self.should_decompress(path)` checks if the file is compressed, branching to `self.search_decompress(path)`.
6. If none of the conditional transformations apply, execution falls through to `self.search_path(path)`.

Sources: [crates/core/search.rs:245-267](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/search.rs#L245-L267)

### Search Pipeline Components and Configuration

`SearchWorker` is constructed via `SearchWorkerBuilder`, which captures high-level behaviors including preprocessing commands, glob filters, zip searching, and binary detection modes.

| Component / Struct | Field / Method | Type | Purpose |
| :--- | :--- | :--- | :--- |
| `Config` | `preprocessor` | `OptionathBuf>` | Path to an external command used to preprocess files before searching. |
| `Config` | `preprocessor_globs` | `ignore::overrides::Override` | Glob rules restricting which files run through the preprocessor. |
| `Config` | `search_zip` | `bool` | Enables automatic decompression and searching of compressed archives. |
| `Config` | `binary_implicit` | `grep::searcher::BinaryDetection` | Binary detection policy for recursively discovered files. |
| `Config` | `binary_explicit` | `grep::searcher::BinaryDetection` | Binary detection policy for user-supplied explicit file paths. |
| `SearchWorker` | `decomp_builder` | `Option<grep::cli::DecompressionReaderBuilder>` | Constructs decompression readers when `search_zip` is enabled. |
| `SearchWorker` | `matcher` | `PatternMatcher` | Holds either `PatternMatcher::RustRegex` or `PatternMatcher::PCRE2`. |

Sources: [crates/core/search.rs:14-36](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/search.rs#L14-L36), [crates/core/search.rs:230-241](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/search.rs#L230-L241)

> [!NOTE]
> `SearchWorker::search_preprocessor` spawns an external process using `std::process::Command`, opens the target path as standard input, wraps the process output via `self.command_builder.build(&mut cmd)`, and delegates reading to `self.search_reader`.

Sources: [crates/core/search.rs:296-324](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/search.rs#L296-L324)

## Searcher Glue and Matcher Abstraction

### Overview

The `grep_matcher::Matcher` trait defines the abstraction through which search execution interacts with search backends such as PCRE2 or Rust regex engines. In `crates/searcher/src/searcher/glue.rs`, searcher glue structures (`ReadByLine`, `SliceByLine`, and `MultiLine`) bind this generic `Matcher` trait to concrete search execution loops over byte slices or buffered readers. These structures rely on an underlying `Core` instance (`Core<'s, M, S>`) that coordinates search state, match positions, binary detection, and sink invocation.

Sources: [crates/searcher/src/searcher/glue.rs:1-150](https://github.com/BurntSushi/ripgrep/blob/main/crates/searcher/src/searcher/glue.rs#L1-L150)

### Execution Walkthrough

When executing a search operation via `SliceByLine`, the search flow coordinates the matcher trait and core state through a specific sequence of operations:

1. `SliceByLine::run` calls `self.core.begin()?` to initialize the sink and emit any header or pre-search status.
2. It calculates `binary_upto` as the minimum of `self.slice.len()` and `DEFAULT_BUFFER_CAPACITY`, constructing a `Range` for binary inspection.
3. `self.core.detect_binary(self.slice, &binary_range)?` checks the initial bytes for binary indicators according to configuration.
4. If binary detection does not trigger a quit or skip, the search loop enters `while !self.slice[self.core.pos()..].is_empty() && self.core.match_by_line(self.slice)? {}`, repeatedly invoking line-based matching on the matcher via `core`.
5. Upon completion of the loop, `self.byte_count()` and `self.core.binary_byte_offset()` are retrieved.
6. Finally, `self.core.finish(byte_count, binary_byte_offset)` finalizes the search output and returns the result.

Sources: [crates/searcher/src/searcher/glue.rs:117-131](https://github.com/BurntSushi/ripgrep/blob/main/crates/searcher/src/searcher/glue.rs#L117-L131)

### Glue Structures and Matcher Integration

The module defines distinct executor structs tailored to streaming readers, memory slices, and single-line versus multi-line matcher requirements. Each struct enforces invariants regarding multi-line configuration at construction time using debug assertions against the matcher.

| Struct Name | Generic Parameters | Constructor | Purpose / Execution Mode |
| :--- | :--- | :--- | :--- |
| `ReadByLine` | `'s, M, R, S` | `ReadByLine::new(...)` | Processes streams line-by-line using `LineBufferReader` where `M: Matcher`, `R: std::io::Read`, and `S: Sink`. |
| `SliceByLine` | `'s, M, S` | `SliceByLine::new(...)` | Processes a single memory slice line-by-line for single-line matchers (`M: Matcher`, `S: Sink`). |
| `MultiLine` | `'s, M, S` | `MultiLine::new(...)` | Processes memory slices supporting multi-line matchers, managing match overlap and adjacent line grouping. |

Sources: [crates/searcher/src/searcher/glue.rs:10-164](https://github.com/BurntSushi/ripgrep/blob/main/crates/searcher/src/searcher/glue.rs#L10-L164)

> [!CAUTION]
> `ReadByLine::new`, `SliceByLine::new`, and `MultiLine::new` all execute a `debug_assert!` verifying whether `searcher.multi_line_with_matcher(&matcher)` matches the expected capability of the struct. Passing a multi-line matcher to a single-line runner or vice versa triggers a debug assertion failure.

Sources: [crates/searcher/src/searcher/glue.rs:29](https://github.com/BurntSushi/ripgrep/blob/main/crates/searcher/src/searcher/glue.rs#L29), [crates/searcher/src/searcher/glue.rs:109](https://github.com/BurntSushi/ripgrep/blob/main/crates/searcher/src/searcher/glue.rs#L109), [crates/searcher/src/searcher/glue.rs:156](https://github.com/BurntSushi/ripgrep/blob/main/crates/searcher/src/searcher/glue.rs#L156)

## Line Iteration and Match Sinking

### Overview

The searcher engine processes text by dispatching inputs through specialized iteration loops that feed matched ranges and context into a downstream sink. In `crates/searcher/src/searcher/glue.rs`, line-by-line and multi-line search loops handle the mechanics of advancing search positions, managing buffered reads, detecting binary thresholds, and grouping adjacent or overlapping matches.

Sources: [crates/searcher/src/searcher/glue.rs:38-51](https://github.com/BurntSushi/ripgrep/blob/main/crates/searcher/src/searcher/glue.rs#L38-L51), [crates/searcher/src/searcher/glue.rs:117-131](https://github.com/BurntSushi/ripgrep/blob/main/crates/searcher/src/searcher/glue.rs#L117-L131), [crates/searcher/src/searcher/glue.rs:166-206](https://github.com/BurntSushi/ripgrep/blob/main/crates/searcher/src/searcher/glue.rs#L166-L206)

### Multi-Line Match Sinking and Overlap Handling

When executing searches with matchers capable of spanning multiple lines (`MultiLine`), matches must be delayed and coalesced so that adjacent or overlapping matches are emitted as a single block. The `MultiLine::run` method drives this process over memory slices.

### Execution Walkthrough

The `MultiLine::run` execution path proceeds through the following call sequence:

1. `MultiLine::run` invokes `self.core.begin()?` to initialize sink state.
2. It constructs a binary inspection range using `DEFAULT_BUFFER_CAPACITY` and invokes `self.core.detect_binary(self.slice, &binary_range)?`.
3. If binary detection passes, it loops while `!self.slice[self.core.pos()..].is_empty() && keepgoing` by calling `self.sink()?`.
4. Inside `self.sink()?`, `self.find()?` locates the next match range against the remaining slice suffix. If no match is found, position is set to `self.slice.len()` and iteration terminates.
5. If a match is found, `self.advance(&mat)` updates the core search position past the match.
6. The raw match range is mapped to line boundaries via `lines::locate(self.slice, self.config.line_term.as_byte(), mat)`.
7. The method checks `self.last_match`. If `last_match.end() >= line.start()`, the adjacent or overlapping matches are merged by growing the end of `last_match`. Otherwise, the previous match and its context are flushed to the sink via `self.sink_context()` and `self.sink_matched()`.

Sources: [crates/searcher/src/searcher/glue.rs:166-258](https://github.com/BurntSushi/ripgrep/blob/main/crates/searcher/src/searcher/glue.rs#L166-L258)

> [!TIP]
> `MultiLine::sink` delays reporting matches specifically to group adjacent matches together. Two distinct matches starting and ending on the same line are merged so that a single line is never sinked more than once.

Sources: [crates/searcher/src/searcher/glue.rs:221-226](https://github.com/BurntSushi/ripgrep/blob/main/crates/searcher/src/searcher/glue.rs#L221-L226)

### Read-By-Line Buffering and Consumption

For stream-based searching via `ReadByLine`, data is read into an internal buffer managed by `LineBufferReader`. The `ReadByLine::run` method coordinates execution by filling buffers iteratively and checking termination conditions.

### Execution Walkthrough

The stream iteration loop executes in the following order:

1. `ReadByLine::run` calls `self.core.begin()?`.
2. It enters a `while self.fill()?` loop.
3. Inside `fill()`, `self.core.roll(self.rdr.buffer())` rolls unprocessed bytes to the front of the buffer, returning the consumed byte count.
4. `self.rdr.consume(consumed)` advances the reader buffer pointer.
5. `self.rdr.fill()` pulls new data from the underlying I/O stream.
6. If binary data is encountered for the first time, `self.core.binary_data(offset)` is invoked; if it returns `false`, `fill()` aborts.
7. If no bytes were read or `should_binary_quit()` evaluates to true, iteration stops.
8. Back in `run()`, `self.core.match_by_line(self.rdr.buffer())?` processes the buffer contents line by line. If matching fails or halts, `self.consume_remaining()` cleans up, and `self.core.finish()` is executed with absolute and binary byte offsets.

Sources: [crates/searcher/src/searcher/glue.rs:38-94](https://github.com/BurntSushi/ripgrep/blob/main/crates/searcher/src/searcher/glue.rs#L38-L94)

> [!WARNING]
> In `ReadByLine::fill`, if rolling the buffer consumes 0 bytes and re-filling adds 0 bytes while buffer length remains unchanged, the remaining buffer data consists exclusively of leftover context. The loop forces consumption of the entire old buffer length and terminates immediately to prevent infinite loops.

Sources: [crates/searcher/src/searcher/glue.rs:79-86](https://github.com/BurntSushi/ripgrep/blob/main/crates/searcher/src/searcher/glue.rs#L79-L86)

## Binary Detection and Context Handling

### Binary Detection and Guard Mechanics

When searching streams or slices, binary data detection guards against processing unsupported binary contents or prematurely terminating when configuration dictates. In `ReadByLine::fill`, binary byte offsets are tracked via `self.rdr.binary_byte_offset()`. If binary detection identifies an offset and `already_binary` is false, `self.core.binary_data(offset)` is invoked; returning `false` halts the search loop immediately.

Sources: [crates/searcher/src/searcher/glue.rs:58-75](https://github.com/BurntSushi/ripgrep/blob/main/crates/searcher/src/searcher/glue.rs#L58-L75)

> [!WARNING]
> `ReadByLine::should_binary_quit` checks both `self.rdr.binary_byte_offset().is_some()` and `self.config.binary.quit_byte().is_some()`. If both conditions hold, the search worker aborts further filling and quits, suppressing output when implicit binary filtering is active.

Sources: [crates/searcher/src/searcher/glue.rs:90-93](https://github.com/BurntSushi/ripgrep/blob/main/crates/searcher/src/searcher/glue.rs#L90-L93)

### Context Line Sinking and Passthru Integration

Context handling coordinates the emission of before-context, after-context, or passthrough lines around matches. For multi-line and slice searches, `MultiLine::sink_context` checks `self.config.passthru`. When passthrough is enabled, `self.core.other_context_by_line(self.slice, range.start())` emits surrounding context. Otherwise, separate before- and after-context routines are executed.

Sources: [crates/searcher/src/searcher/glue.rs:311-325](https://github.com/BurntSushi/ripgrep/blob/main/crates/searcher/src/searcher/glue.rs#L311-L325)

The search worker abstraction in `SearchWorker::search` manages implicit versus explicit binary detection rules passed down to the searcher. Explicit paths supplied by users bypass automatic quit guards, whereas recursive directory searches apply implicit binary detection policies.

Sources: [crates/core/search.rs:249-257](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/search.rs#L249-L257)

## Related

- [[Matcher Interface]]

