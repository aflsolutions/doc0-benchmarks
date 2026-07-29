# Overview

<details>
<summary>Relevant source files</summary>

The following files were used as context for generating this wiki page:

- [crates/searcher/src/searcher/glue.rs](https://github.com/BurntSushi/ripgrep/blob/main/crates/searcher/src/searcher/glue.rs)
- [crates/core/search.rs](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/search.rs)
- [crates/core/main.rs](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/main.rs)
- [README.md](https://github.com/BurntSushi/ripgrep/blob/main/README.md)
- [crates/core/flags/hiargs.rs](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/hiargs.rs)
- [crates/searcher/src/searcher/mod.rs](https://github.com/BurntSushi/ripgrep/blob/main/crates/searcher/src/searcher/mod.rs)
</details>

## Overview

Ripgrep (`rg`) is a line-oriented, high-performance recursive search tool engineered to locate regex patterns across file hierarchies with exceptional speed. Its architecture decomposes cleanly into a front-end command-line interface core (`crates/core`) and a collection of lower-level, reusable search and utility library crates (`crates/searcher`). Sources: [README.md:1-6](https://github.com/BurntSushi/ripgrep/blob/main/README.md#L1-L6)

The system translates raw terminal inputs and configuration settings into robust search strategies that automatically respect ignore rules, manage memory efficiently through streaming buffers or memory maps, and coordinate parallel worker threads for rapid multi-core directory traversal. Sources: [README.md:3-6](https://github.com/BurntSushi/ripgrep/blob/main/README.md#L3-L6)

## High Level System and Crate Architecture

### Overview

The core binary entry point (`crates/core/main.rs`) manages process execution, allocator selection, and top-level execution dispatch. Depending on target configuration and platform constraints, the binary conditionally configures its global allocator: on 64-bit systems targeting the musl environment, it explicitly assigns `tikv_jemallocator::Jemalloc` to mitigate the performance overhead of musl's default allocator during static compilation. Sources: [crates/core/main.rs:26-41](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/main.rs#L26-L41)

### Execution Flow and Dispatch

The process lifecycle begins at `main()`, which invokes `run(flags::parse())` and converts results into an `ExitCode`. If a broken pipe occurs during execution, the error chain is inspected for `std::io::ErrorKind::BrokenPipe`, allowing the process to terminate gracefully with exit code `0` in accordance with Unix conventions. Sources: [crates/core/main.rs:44-67](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/main.rs#L44-L67)

The `run` function processes the high-level `HiArgs` configuration and matches on the active search or utility mode:

1. `ParseResult::Err(err)` → returns the error immediately. Sources: [crates/core/main.rs:81-82](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/main.rs#L81-L82)
2. `ParseResult::Special(mode)` → dispatches to `special(mode)`. Sources: [crates/core/main.rs:83](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/main.rs#L83)
3. `ParseResult::Ok(args)` → extracts `args` and evaluates `args.mode()` to invoke `index::read`, `search`, `search_parallel`, `index::write`, `files`, `files_parallel`, `types`, or `generate`. Sources: [crates/core/main.rs:84-98](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/main.rs#L84-L98)

Sources: [crates/core/main.rs:78-107](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/main.rs#L78-L107)

> [!NOTE]
> When executing multi-threaded searches (`search_parallel`), requesting sorted output (such as via `--sort path`) automatically disables parallelism to guarantee output determinism. Sources: [crates/core/main.rs:163-165](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/main.rs#L163-L165)

### Mode Handlers and Exit Codes

Ripgrep defines specific execution modes and exit code mappings handled within `run` and specialized routines. Sources: [crates/core/main.rs:93-105](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/main.rs#L93-L105)

| Mode / Action | Condition / Check | Resulting Exit Code | Sources |
| --------------| ----------------- | ------------------- | ------- |
| Search / Files (Match Found) | `quiet()` or no errors | `ExitCode::from(0)` | [crates/core/main.rs:100-101](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/main.rs#L100-L101) |
| Execution Error | `messages::errored()` | `ExitCode::from(2)` | [crates/core/main.rs:102-103](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/main.rs#L102-L103) |
| Search / Files (No Match) | Default no-match fallback | `ExitCode::from(1)` | [crates/core/main.rs:104-105](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/main.rs#L104-L105) |
| Index Write / Generate / Special | Successful completion | `ExitCode::from(0)` | [crates/core/main.rs:93](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/main.rs#L93) |

Sources: [crates/core/main.rs:373-409](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/main.rs#L373-L409)

## CLI Argument Parsing and Configuration Processing

### Overview

Ripgrep bridges low-level command-line option collection and high-level execution planning through `HiArgs`, a structured representation that is instantiated only after all CLI parsing has completely finished. While low-level arguments accumulate raw inputs during parsing, high-level argument construction relies on completed state—such as finalized glob patterns or verified working directories—to initialize matchers, directory walkers, and search workers. Sources: [crates/core/flags/hiargs.rs:26-34](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/hiargs.rs#L26-L34)

The transformation from low-level configuration (`LowArgs`) to structured settings runs entirely inside `HiArgs::from_low_args(low)`. This conversion sequence initializes shared environment state, extracts patterns and paths, validates constraints, and constructs engine-specific matchers. Sources: [crates/core/flags/hiargs.rs:114-118](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/hiargs.rs#L114-L118)

### Configuration Conversion Call Chain

The conversion process executes a deterministic series of steps, delegating to helper builders while tracking shared context:

`HiArgs::from_low_args()` → `State::new()` → `Patterns::from_low_args()` → `Paths::from_low_args()` → `BinaryDetection::from_low_args()` → `matcher()` / `walk_builder()` Sources: [crates/core/flags/hiargs.rs:114-163](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/hiargs.rs#L114-L163)

1. `HiArgs::from_low_args()` asserts that no short-circuiting special mode is present, validates sorting configurations via `sort.supported()?`, and restricts unsupported indexing flags. Sources: [crates/core/flags/hiargs.rs:114-133](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/hiargs.rs#L114-L133)
2. `State::new()` initializes process-wide context, querying the current working directory via `current_dir()` (with fallback to the `PWD` environment variable) and checking if stdout is connected to a terminal. Sources: [crates/core/flags/hiargs.rs:986-996](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/hiargs.rs#L986-L996)
3. `Patterns::from_low_args()` extracts search expressions from `-e`/`--regexp` and `-f`/`--file` or consumes the first positional argument, de-duplicating entries into a `HashSet` to prevent performance degradation from repetitive patterns. Sources: [crates/core/flags/hiargs.rs:1016-1084](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/hiargs.rs#L1016-L1084)
4. `Paths::from_low_args()` collects remaining positional arguments or applies heuristics (`grep::cli::is_readable_stdin()`) to decide whether to default to the current directory (`./`) or stdin (`-`). Sources: [crates/core/flags/hiargs.rs:1107-1170](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/hiargs.rs#L1107-L1170)
5. `BinaryDetection::from_low_args()` configures explicit versus implicit binary detection rules, establishing whether ripgrep should convert or skip binary files. Sources: [crates/core/flags/hiargs.rs:1195-1211](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/hiargs.rs#L1195-L1211)

Sources: [crates/core/flags/hiargs.rs:986-1211](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/hiargs.rs#L986-L1211)

> [!WARNING]
> Attempting to read patterns from stdin via `-f -` while simultaneously searching stdin (`rg foo -`) triggers an immediate bail error during `Paths::from_low_args`, as stdin can only be consumed once. Sources: [crates/core/flags/hiargs.rs:1121-1125](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/hiargs.rs#L1121-L1125)

### Regex Engine Selection and Matcher Construction

Once high-level arguments are established, `HiArgs::matcher()` evaluates the requested `EngineChoice` to construct the appropriate `PatternMatcher`. Sources: [crates/core/flags/hiargs.rs:379-380](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/hiargs.rs#L379-L380)

| Engine Choice | Behavior / Fallback Strategy | Sources |
| --------------| ---------------------------- | ------- |
| `EngineChoice::Default` | Attempts building with Rust's regex engine (`matcher_rust`). If compilation fails, inspects the error message via `suggest_other_engine` to recommend PCRE2 when backreferences or look-around are detected. | [crates/core/flags/hiargs.rs:380-386](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/hiargs.rs#L380-L386) |
| `EngineChoice::PCRE2` | Directly invokes `matcher_pcre2()`. Returns an error if the binary is compiled without the `pcre2` feature. | [crates/core/flags/hiargs.rs:387](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/hiargs.rs#L387) |
| `EngineChoice::Auto` | Attempts Rust regex compilation first. If it falls back to PCRE2. If both engines fail to compile the pattern, aborts and displays detailed error logs for both. | [crates/core/flags/hiargs.rs:388-412](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/hiargs.rs#L388-L412) |

Sources: [crates/core/flags/hiargs.rs:379-465](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/hiargs.rs#L379-L465)

> [!TIP]
> On 64-bit systems, `matcher_pcre2` automatically enables JIT compilation and scales the maximum JIT stack size up to 10MB to handle complex patterns efficiently, while bypassing JIT entirely on 32-bit architectures to prevent out-of-memory errors. Sources: [crates/core/flags/hiargs.rs:440-447](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/hiargs.rs#L440-L447)

## Search Worker Coordination and Execution Flow

### Overview

Ripgrep coordinates file traversal, input transformation, and worker execution through high-level orchestration routines defined in `main.rs` and `search.rs`. Depending on whether threading and sorting are enabled, execution branches into single-threaded or parallel search loops that feed items into a `SearchWorker`. Sources: [crates/core/main.rs:86-99](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/main.rs#L86-L99)

### Execution Flow and Worker Coordination

The execution flow governs how paths discovered during directory iteration turn into search results. For single-threaded runs, `search()` builds a sequential iterator, sorts haystacks if requested, and iterates through each path to invoke the search worker. Sources: [crates/core/main.rs:109-122](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/main.rs#L109-L122)

The call chain for executing a search over a haystack proceeds through the following steps:
`search()` / `search_parallel()` → `SearchWorker::search()` → checks binary detection rules (`self.config.binary_explicit` or `self.config.binary_implicit`) → evaluates input routing branches (`is_stdin()`, `should_preprocess()`, `should_decompress()`) → `SearchWorker::search_reader()`, `search_preprocessor()`, `search_decompress()`, or `search_path()` → `search_path()` / `search_reader()` helper functions → sink creation (`p.sink_with_path()`) → underlying `grep::searcher::Searcher` execution. Sources: [crates/core/search.rs:245-267](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/search.rs#L245-L267)

Sources: [crates/core/search.rs:341-449](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/search.rs#L341-L449)

> [!NOTE]
> When a preprocessor command is configured via `--pre`, it takes precedence over archive decompression (`search_zip`), overriding automatic zip handling for matching files. Sources: [crates/core/search.rs:116-129](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/search.rs#L116-L129)

### Parallel Search and Worker Cloning

Multi-threaded execution is managed by `search_parallel()`, which leverages parallel directory traversal via the `ignore` crate's `build_parallel().run()` loop. Sources: [crates/core/main.rs:159-181](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/main.rs#L159-L181)

| Threading Mode | Directory Walker & Scheduling | Output & Stats Coordination | Sources |
| -------------- | ----------------------------- | --------------------------- | ------- |
| Single-threaded (`search`) | Builds a sequential walk iterator, optionally sorts haystacks via `HiArgs::sort()`, and loops over each entry. | Directly mutates local stats and writes straight to stdout or the configured writer. | [crates/core/main.rs:109-157](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/main.rs#L109-L157) |
| Parallel (`search_parallel`) | Executes concurrent directory traversal, cloning a `SearchWorker` for each parallel thread worker closure. | Uses `AtomicBool` flags for match/search tracking, a `Mutex`-wrapped statistics accumulator, and a `BufferWriter` to prevent interleaved output interleaving. | [crates/core/main.rs:159-235](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/main.rs#L159-L235) |

Sources: [crates/core/flags/hiargs.rs:773-826](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/hiargs.rs#L773-L826)

## Core Searcher Engine and Buffer Strategy

### Overview

The core searcher engine orchestrates scanning over files, memory maps, and generic `std::io::Read` streams, managing line buffering, memory mapping strategies, and character encoding detection. Configuration options and streaming buffers are maintained by `Searcher`, `SearcherBuilder`, and `Config`. Sources: [crates/searcher/src/searcher/mod.rs:151-185](https://github.com/BurntSushi/ripgrep/blob/main/crates/searcher/src/searcher/mod.rs#L151-L185)

### Configuration and Builder Strategy

A `SearcherBuilder` constructs a `Searcher` by translating high-level user parameters into an internal `Config` and initializing transcoding builders and internal cell-wrapped buffers. Sources: [crates/searcher/src/searcher/mod.rs:298-337](https://github.com/BurntSushi/ripgrep/blob/main/crates/searcher/src/searcher/mod.rs#L298-L337)

The call chain for building and invoking a search over a file path proceeds as follows:
`SearcherBuilder::build()` → configures `DecodeReaderBytesBuilder` and allocates `Searcher` fields (`decode_buffer`, `line_buffer`, `multi_line_buffer`) → `Searcher::search_path()` → `File::open()` → `Searcher::search_file_maybe_path()` → checks `self.config.mmap.open()` (falling back to multi-line heap reading or `search_reader()` roll buffers). Sources: [crates/searcher/src/searcher/mod.rs:315-337](https://github.com/BurntSushi/ripgrep/blob/main/crates/searcher/src/searcher/mod.rs#L315-L337)

Sources: [crates/searcher/src/searcher/mod.rs:643-714](https://github.com/BurntSushi/ripgrep/blob/main/crates/searcher/src/searcher/mod.rs#L643-L714)

> [!WARNING]
> If a process searches a file-backed memory map concurrently with the file being truncated, the process can terminate with a bus error. Sources: [crates/searcher/src/searcher/mod.rs:493-495](https://github.com/BurntSushi/ripgrep/blob/main/crates/searcher/src/searcher/mod.rs#L493-L495)

### Search Strategies and Transcoding

Input data passes through transcoding layers or line buffers depending on whether explicit encodings or Byte Order Mark (BOM) sniffing are active. Sources: [crates/searcher/src/searcher/mod.rs:519-556](https://github.com/BurntSushi/ripgrep/blob/main/crates/searcher/src/searcher/mod.rs#L519-L556)

| Strategy Option | Default Value | Purpose and Behavior | Sources |
| --------------- | ------------- | -------------------- | ------- |
| `heap_limit` | `None` | Restricts maximum heap memory usage for line buffers or multi-line heap allocations. A limit of `0` restricts searching exclusively to memory maps. | [crates/searcher/src/searcher/mod.rs:164-168](https://github.com/BurntSushi/ripgrep/blob/main/crates/searcher/src/searcher/mod.rs#L164-L168) |
| `mmap` | `MmapChoice::default()` (Never) | Determines memory map usage (`Automatic` or `Never`). Avoids heap allocation for multi-line searches when files are mapped directly. | [crates/searcher/src/searcher/mod.rs:169-170](https://github.com/BurntSushi/ripgrep/blob/main/crates/searcher/src/searcher/mod.rs#L169-L170) |
| `binary` | `BinaryDetection::default()` | Configures heuristic binary file detection, supporting `none()`, `quit(u8)`, and `convert(u8)` modes. | [crates/searcher/src/searcher/mod.rs:34-118](https://github.com/BurntSushi/ripgrep/blob/main/crates/searcher/src/searcher/mod.rs#L34-L118) |
| `bom_sniffing` | `true` | Enables automatic text transcoding and UTF-16 support by sniffing Byte-Order Marks on incoming streams. | [crates/searcher/src/searcher/mod.rs:178-179](https://github.com/BurntSushi/ripgrep/blob/main/crates/searcher/src/searcher/mod.rs#L178-L179) |

Sources: [crates/searcher/src/searcher/mod.rs:436-556](https://github.com/BurntSushi/ripgrep/blob/main/crates/searcher/src/searcher/mod.rs#L436-L556), [crates/searcher/src/searcher/mod.rs:727-795](https://github.com/BurntSushi/ripgrep/blob/main/crates/searcher/src/searcher/mod.rs#L727-L795)

## Low Level Search Execution and Matching Glue

### Overview

The low-level execution layer coordinates buffer scanning, line iteration, binary data detection, and match sink callbacks via internal glue structures: `ReadByLine`, `SliceByLine`, and `MultiLine`. Sources: [crates/searcher/src/searcher/glue.rs:11-149](https://github.com/BurntSushi/ripgrep/blob/main/crates/searcher/src/searcher/glue.rs#L11-L149)

### Execution Flow and Glue Structures

Execution paths depend heavily on whether a search is single-line or multi-line, and whether input arrives via a stream reader or a memory slice. Sources: [crates/searcher/src/searcher/glue.rs:38-51](https://github.com/BurntSushi/ripgrep/blob/main/crates/searcher/src/searcher/glue.rs#L38-L51)

The call-chain execution walkthrough for a line-buffered reader proceeds through `ReadByLine::run()` → `self.core.begin()` → `self.fill()` (which rolls buffers via `self.core.roll()`, re-fills via `self.rdr.fill()`, and checks for binary data via `self.core.binary_data()`) → `self.core.match_by_line(self.rdr.buffer())` → `self.core.finish()`. Sources: [crates/searcher/src/searcher/glue.rs:58-88](https://github.com/BurntSushi/ripgrep/blob/main/crates/searcher/src/searcher/glue.rs#L58-L88)

For slice and multi-line executions, `SliceByLine::run()` and `MultiLine::run()` initialize binary ranges up to `DEFAULT_BUFFER_CAPACITY`, check `self.core.detect_binary()`, and iterate via `self.core.match_by_line()` or `self.sink()?`. Sources: [crates/searcher/src/searcher/glue.rs:117-131](https://github.com/BurntSushi/ripgrep/blob/main/crates/searcher/src/searcher/glue.rs#L117-L131), [crates/searcher/src/searcher/glue.rs:166-206](https://github.com/BurntSushi/ripgrep/blob/main/crates/searcher/src/searcher/glue.rs#L166-L206)

> [!NOTE]
> `MultiLine::sink()` delays emitting matches to group adjacent matches that start and end on the same line into a single sink callback, ensuring a single line is never sinked more than once. Sources: [crates/searcher/src/searcher/glue.rs:223-226](https://github.com/BurntSushi/ripgrep/blob/main/crates/searcher/src/searcher/glue.rs#L223-L226)

### Glue Components and Design Trade-offs

| Glue Structure | Target Haystack Type | Matching Strategy | Binary Detection Scope | Sources |
| -------------- | -------------------- | ------------------ | ---------------------- | ------- |
| `ReadByLine` | `std::io::Read` | Single-line rolling buffer search | Entire buffer contents as filled | [crates/searcher/src/searcher/glue.rs:11-15](https://github.com/BurntSushi/ripgrep/blob/main/crates/searcher/src/searcher/glue.rs#L11-L15) |
| `SliceByLine` | `&[u8]` slice | Single-line direct slice search | Initial chunk up to `DEFAULT_BUFFER_CAPACITY` and subsequent matches | [crates/searcher/src/searcher/glue.rs:97-100](https://github.com/BurntSushi/ripgrep/blob/main/crates/searcher/src/searcher/glue.rs#L97-L100) |
| `MultiLine` | `&[u8]` slice | Multi-line arbitrary-span matching with context | Initial chunk up to `DEFAULT_BUFFER_CAPACITY` and subsequent matches | [crates/searcher/src/searcher/glue.rs:142-147](https://github.com/BurntSushi/ripgrep/blob/main/crates/searcher/src/searcher/glue.rs#L142-L147) |

Sources: [crates/searcher/src/searcher/glue.rs:38-51](https://github.com/BurntSushi/ripgrep/blob/main/crates/searcher/src/searcher/glue.rs#L38-L51), [crates/searcher/src/searcher/mod.rs:44-53](https://github.com/BurntSushi/ripgrep/blob/main/crates/searcher/src/searcher/mod.rs#L44-L53)

| Design Choice | Benefit | Cost | Sources |
| ------------- | ------- | ---- | ------- |
| Line-buffered rolling (`ReadByLine`) | Binds memory consumption for streams lacking line terminators; prevents exorbitant memory usage | Requires buffer rolling and shifting state on each fill cycle | [crates/searcher/src/searcher/glue.rs:58-88](https://github.com/BurntSushi/ripgrep/blob/main/crates/searcher/src/searcher/glue.rs#L58-L88) |
| Slice-based direct scan (`SliceByLine`) | Eliminates copying overhead when memory maps or slices are available | Requires entire haystack available in memory simultaneously | [crates/searcher/src/searcher/mod.rs:767-795](https://github.com/BurntSushi/ripgrep/blob/main/crates/searcher/src/searcher/mod.rs#L767-L795) |
| Delayed match sinking (`MultiLine::sink`) | Groups adjacent matches starting/ending on the same line into single callbacks | Adds state-tracking overhead via `last_match: Option<Range>` | [crates/searcher/src/searcher/glue.rs:223-257](https://github.com/BurntSushi/ripgrep/blob/main/crates/searcher/src/searcher/glue.rs#L223-L257) |

Sources: [crates/searcher/src/searcher/glue.rs:146-146](https://github.com/BurntSushi/ripgrep/blob/main/crates/searcher/src/searcher/glue.rs#L146-L146), [crates/searcher/src/searcher/mod.rs:46-49](https://github.com/BurntSushi/ripgrep/blob/main/crates/searcher/src/searcher/mod.rs#L46-L49)

## Related

- [[Quick Start]]
- [[Project Structure]]

