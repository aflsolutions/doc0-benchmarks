# Project Structure

<details>
<summary>Relevant source files</summary>

The following files were used as context for generating this wiki page:

- [crates/searcher/src/searcher/glue.rs](https://github.com/BurntSushi/ripgrep/blob/main/crates/searcher/src/searcher/glue.rs)
- [crates/globset/src/lib.rs](https://github.com/BurntSushi/ripgrep/blob/main/crates/globset/src/lib.rs)
- [crates/ignore/src/walk.rs](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/walk.rs)
- [crates/core/search.rs](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/search.rs)
</details>

## Overview

The project architecture is organized as a modular workspace encompassing specialized subsystems for glob set matching, directory traversal, search worker orchestration, and low-level line buffering. These components collectively solve the problems of high-throughput pattern matching, recursive file system traversal under complex ignore rules, and memory-efficient stream searching across arbitrary data sources.

Sources: [crates/globset/src/lib.rs:2-13](https://github.com/BurntSushi/ripgrep/blob/main/crates/globset/src/lib.rs#L2-L13), [crates/ignore/src/walk.rs:439-487](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/walk.rs#L439-L487), [crates/core/search.rs:1-8](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/search.rs#L1-L8)

## Workspace Organization and Core Architecture

### Workspace Layout and Modular Architecture

ripgrep is architected as a modular Cargo workspace, decoupling pattern compilation, parallel directory traversal, worker orchestration, and stream buffering into distinct, specialized crates. This separation of concerns enables high-throughput text searching while adhering strictly to complex ignore rules and multi-threaded work distribution.

Sources: [crates/globset/src/lib.rs:2-13](https://github.com/BurntSushi/ripgrep/blob/main/crates/globset/src/lib.rs#L2-L13), [crates/ignore/src/walk.rs:439-487](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/walk.rs#L439-L487), [crates/core/search.rs:1-8](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/search.rs#L1-L8)

### Subsystem Responsibilities

The codebase divides responsibilities across several major components:
- **`globset`**: Provides single glob and multi-glob set matching using optimized strategies such as literals, extensions, prefixes, suffixes, and regex sets.
- **`ignore`**: Implements recursive directory iterators (`Walk` and `WalkParallel`), work-stealing stacks, and multi-tier ignore rule evaluation (`.gitignore`, `.ignore`, global git ignores, and overrides).
- **`core`**: Manages the high-level search worker abstraction (`SearchWorkerBuilder` and `SearchWorker`), coordinating matchers, printers, preprocessors, and zip/decompression handling.
- **`searcher`**: Executes low-level stream searching (`ReadByLine`, `SliceByLine`, and `MultiLine`), buffer management, binary file detection, and sink integration.

Sources: [crates/globset/src/lib.rs:2-14](https://github.com/BurntSushi/ripgrep/blob/main/crates/globset/src/lib.rs#L2-L14), [crates/ignore/src/walk.rs:399-454](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/walk.rs#L399-L454), [crates/core/search.rs:1-8](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/search.rs#L1-L8), [crates/searcher/src/searcher/glue.rs:10-15](https://github.com/BurntSushi/ripgrep/blob/main/crates/searcher/src/searcher/glue.rs#L10-L15)

## High Level Search Worker Orchestration

### Overview

The `core` subsystem defines the high-level search worker abstraction (`SearchWorkerBuilder` and `SearchWorker`), which bridges the gap between recursive file traversal and low-level search execution. A search worker manages the coordination points among the pattern matcher, the searcher, the output printer, external preprocessors, and built-in compressed file decompression.

Sources: [crates/core/search.rs:1-8](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/search.rs#L1-L8), [crates/core/search.rs:39-85](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/search.rs#L39-L85)

### Search Worker Configuration and Builder Options

The search worker is configured via `SearchWorkerBuilder` and its underlying `Config` structure. These structures control behavior flags such as preprocessor commands, file glob matching for preprocessors, zip/decompression support, and binary file detection thresholds.

| Option / Field | Type | Default | Purpose |
| :--- | :--- | :--- | :--- |
| `config.preprocessor` | `Option<std::path::PathBuf>` | `None` | Path to an external preprocessor command run on files before searching. |
| `config.preprocessor_globs` | `ignore::overrides::Override` | `Override::empty()` | Glob rules determining which files are routed through the preprocessor. |
| `config.search_zip` | `bool` | `false` | Enables automatic decompression and searching of common compressed archive files. |
| `config.binary_implicit` | `grep::searcher::BinaryDetection` | `BinaryDetection::none()` | Binary file detection strategy used during recursive directory traversal. |
| `config.binary_explicit` | `grep::searcher::BinaryDetection` | `BinaryDetection::none()` | Binary file detection strategy used for paths explicitly supplied by the user. |

Sources: [crates/core/search.rs:14-37](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/search.rs#L14-L37), [crates/core/search.rs:39-162](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/search.rs#L39-L162)

### Preprocessors and Decompression Handling

When executing searches across diverse file streams, the search worker evaluates whether files require transformation via preprocessors or archive decompression. If a preprocessor path is configured, it completely overrides the `search_zip` decompression setting. 

> [!NOTE]
> When a preprocessor command is specified, every matching file path is passed as the first argument to that executable, and the search worker subsequently scans the command's standard output instead of the raw file directly.

Sources: [crates/core/search.rs:87-129](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/search.rs#L87-L129)

> [!WARNING]
> Binary detection configurations differ between implicit directory traversal and explicit user arguments. Binary detection for implicit scans may be configured to `grep::searcher::BinaryDetection::quit` to skip binary files, whereas explicit files supplied directly by end users should never automatically skip binary files.

Sources: [crates/core/search.rs:139-161](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/search.rs#L139-L161)

## Parallel Directory Traversal and Filtering

### Overview

The directory traversal and filtering architecture in `crates/ignore/src/walk.rs` provides both single-threaded (`Walk`) and parallel (`WalkParallel`) directory iterators. It combines recursive filesystem walking with layered ignore rules, symlink loop detection, and work-stealing parallelism.

Sources: [crates/ignore/src/walk.rs:439-487](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/walk.rs#L439-L487), [crates/ignore/src/walk.rs:1116-1124](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/walk.rs#L1116-L1124), [crates/ignore/src/walk.rs:1396-1415](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/walk.rs#L1396-L1415)

### Parallel Traversal and Work-Stealing Architecture

When `WalkParallel::visit` or `WalkParallel::run` is invoked, it initializes worker threads and distributes initial path work items across work-stealing stacks (`Stack`). Each worker thread operates both as a producer and consumer, utilizing a depth-first deque (`crossbeam_deque::Worker`) paired with stealers (`crossbeam_deque::Stealer`) to maximize cache locality and avoid the excessive memory overhead of breadth-first traversal on deep hierarchies.

Sources: [crates/ignore/src/walk.rs:1417-1528](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/walk.rs#L1417-L1528), [crates/ignore/src/walk.rs:1642-1723](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/walk.rs#L1642-L1723)

> [!NOTE]
> `Stack::new_for_each_thread` uses `Deque::new_lifo` to enforce a depth-first traversal order. A breadth-first traversal across wide directory trees containing extensive ignore rules leads to disastrous memory consumption by retaining too many matchers and path nodes simultaneously.

Sources: [crates/ignore/src/walk.rs:1655-1660](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/walk.rs#L1655-L1660), [crates/ignore/src/walk.rs:1719-1723](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/walk.rs#L1719-L1723)

### Call-Chain Execution Walkdown

During parallel execution, each worker processes items retrieved from its stack via a well-defined sequence of verification and directory-listing functions:
`Worker::run()` → `Worker::get_work()` → `Worker::run_one()` → `Work::read_dir()` → `Worker::generate_work()`.

1. `Worker::run()` continuously loops, pulling the next unit of work using `get_work()`.
2. `Worker::get_work()` checks local and stolen deques, decrementing active worker counts via `deactivate_worker()` when idle to orchestrate termination when all deques empty.
3. `Worker::run_one(work)` evaluates depth bounds, verifies symbolic links and device boundaries, and determines whether to descend into directories.
4. `Work::read_dir()` executes `fs::read_dir` on the target directory path, captures errors, registers directory entries into `ReadDirResult`, and extends parent ignore rules via `ignore.add_child_with_entries()`.
5. `Worker::generate_work()` processes each child filesystem entry, constructing `DirEntryRaw` and `DirEntry`, validating follow-links and symlink loops, applying ignore matchers (`should_skip_entry`), and pushing surviving paths back onto the work stack.

Sources: [crates/ignore/src/walk.rs:1754-1760](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/walk.rs#L1754-L1760), [crates/ignore/src/walk.rs:1762-1852](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/walk.rs#L1762-L1852), [crates/ignore/src/walk.rs:1867-1929](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/walk.rs#L1867-L1929), [crates/ignore/src/walk.rs:1935-1985](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/walk.rs#L1935-L1985)

> [!WARNING]
> Trivial filtering checks such as ignore matching (`should_skip_entry`) and stdout redirection checks occur *before* expensive filesystem operations like `stat` calls or metadata reads. This ordering is critical on specialized or remote filesystems (e.g., Windows virtual filesystems) to prevent on-demand file downloads.

Sources: [crates/ignore/src/walk.rs:1147-1162](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/walk.rs#L1147-L1162), [crates/ignore/src/walk.rs:1897-1908](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/walk.rs#L1897-L1908)

### Ignore Rule Precedence and Configuration Options

Ignore matching follows a strict precedence cascade established across ignore builders and directory iterators. When a path is evaluated, ignore files and filters take effect in a specific priority order.

| Precedence Order / Rule | Source Type / Mechanism | Scope & Behavior |
| :--- | :--- | :--- |
| 1. Glob Overrides | `Override` whitelist/ignore globs | Checked first; matching stops traversal evaluation (unless overridden by an ignore glob `!`). |
| 2. Ignore Files | `.ignore`, `.gitignore`, `.git/info/exclude`, global gitignore, explicit | Evaluated by precedence order where `.ignore` overrides `.gitignore`, and nested files override parent files. |
| 3. File Type Matchers | `Types` filter | Executed on non-directory files to include or exclude specific format categories. |
| 4. Hidden File Filtering | `hidden(bool)` | Skips hidden paths unless explicitly whitelisted. |
| 5. File Size Limits | `max_filesize(Option<u64>)` | Discards non-directory files exceeding the configured byte size limit. |
| 6. Custom Entry Predicates | `filter_entry` / `ParallelVisitor` | Custom closures applied to accept or reject directory nodes and their children. |

Sources: [crates/ignore/src/walk.rs:454-486](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/walk.rs#L454-L486), [crates/ignore/src/walk.rs:645-674](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/walk.rs#L645-L674), [crates/ignore/src/walk.rs:1045-1051](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/walk.rs#L1045-L1051)

### Design Trade-Offs in Directory Traversal

| Design Choice | Benefit | Cost |
| :--- | :--- | :--- |
| Work-stealing LIFO stacks (`crossbeam_deque`) | High cache locality and balanced load distribution across worker threads | More complex idle detection via atomic active-worker counters and polling sleep intervals |
| Lazy ignore matcher loading | Avoids unnecessary disk reads for skipped directory subtrees | Caches matchers permanently; subsequent file changes to ignore files are ignored until rebuilt |
| Separate `DirEntryRaw` structure | Permits instantiating directory entries from whole cloth in parallel iterations without `walkdir` state | Duplicates basic entry metadata fields and platform-specific handle logic across types |

Sources: [crates/ignore/src/walk.rs:235-256](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/walk.rs#L235-L256), [crates/ignore/src/walk.rs:664-671](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/walk.rs#L664-L671), [crates/ignore/src/walk.rs:1655-1660](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/walk.rs#L1655-L1660), [crates/ignore/src/walk.rs:1975-1982](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/walk.rs#L1975-L1982)

## Pattern Matching and Glob Set Optimization

### Overview

The `globset` crate provides cross-platform single glob and glob set matching, enabling multiple glob patterns to be evaluated simultaneously against a single candidate path. Path normalization, decomposition into basenames and file extensions, and route planning through specialized search strategies are managed through the `Candidate` structure and `GlobSet` compilation logic.

Sources: [crates/globset/src/lib.rs:2-13](https://github.com/BurntSushi/ripgrep/blob/main/crates/globset/src/lib.rs#L2-L13), [crates/globset/src/lib.rs:306-312](https://github.com/BurntSushi/ripgrep/blob/main/crates/globset/src/lib.rs#L306-L312), [crates/globset/src/lib.rs:592-603](https://github.com/BurntSushi/ripgrep/blob/main/crates/globset/src/lib.rs#L592-L603)

### Glob Set Compilation and Strategy Routing

When a user builds a `GlobSet` via `GlobSet::new` or `GlobSetBuilder::build`, patterns are iterated, assigned sequence numbers, and classified by their structure into specialized optimization strategies. Each pattern is parsed into a `MatchStrategy` variant, which dictates how it is routed into collection builders.

Sources: [crates/globset/src/lib.rs:461-514](https://github.com/BurntSushi/ripgrep/blob/main/crates/globset/src/lib.rs#L461-L514), [crates/globset/src/lib.rs:578-584](https://github.com/BurntSushi/ripgrep/blob/main/crates/globset/src/lib.rs#L578-L584)

The call chain during compilation flows as:
`GlobSetBuilder::build()` → `GlobSet::new()` → `MatchStrategy::new()` → Strategy-specific builder (`LiteralStrategy`, `BasenameLiteralStrategy`, `ExtensionStrategy`, `MultiStrategyBuilder`, or `RequiredExtensionStrategyBuilder`) → `GlobSet` container.

Sources: [crates/globset/src/lib.rs:472-514](https://github.com/BurntSushi/ripgrep/blob/main/crates/globset/src/lib.rs#L472-L514), [crates/globset/src/lib.rs:580-583](https://github.com/BurntSushi/ripgrep/blob/main/crates/globset/src/lib.rs#L580-L583)

| Match Strategy | Builder Struct | Underlying Engine / Mechanism | Purpose & Behavior |
| :--- | :--- | :--- | :--- |
| `Literal` | `LiteralStrategy` | `fnv::HashMap<Vec<u8>, Vec<usize>>` | Matches full path literals exactly against the normalized candidate path. |
| `BasenameLiteral` | `BasenameLiteralStrategy` | `fnv::HashMap<Vec<u8>, Vec<usize>>` | Matches file basenames exactly against the candidate's basename component. |
| `Extension` | `ExtensionStrategy` | `fnv::HashMap<Vec<u8>, Vec<usize>>` | Matches file extensions exactly against the candidate's extension component. |
| `Prefix` | `MultiStrategyBuilder` | `AhoCorasick` | Matches path prefixes using overlapping Aho-Corasick automaton searches. |
| `Suffix` | `MultiStrategyBuilder` | `AhoCorasick` | Matches path suffixes using overlapping Aho-Corasick automaton searches anchored at path end. |
| `RequiredExtension` | `RequiredExtensionStrategyBuilder` | `fnv::HashMap` + regex vector | Validates path regexes only when a specific file extension matches. |
| `Regex` | `MultiStrategyBuilder` | `regex_automata::meta::Regex` | Compiles complex or un-optimizable globs into a unified regex set with a pattern pool. |

Sources: [crates/globset/src/lib.rs:472-514](https://github.com/BurntSushi/ripgrep/blob/main/crates/globset/src/lib.rs#L472-L514), [crates/globset/src/lib.rs:710-715](https://github.com/BurntSushi/ripgrep/blob/main/crates/globset/src/lib.rs#L710-L715), [crates/globset/src/lib.rs:742-747](https://github.com/BurntSushi/ripgrep/blob/main/crates/globset/src/lib.rs#L742-L747), [crates/globset/src/lib.rs:780-785](https://github.com/BurntSushi/ripgrep/blob/main/crates/globset/src/lib.rs#L780-L785), [crates/globset/src/lib.rs:818-823](https://github.com/BurntSushi/ripgrep/blob/main/crates/globset/src/lib.rs#L818-L823), [crates/globset/src/lib.rs:863-868](https://github.com/BurntSushi/ripgrep/blob/main/crates/globset/src/lib.rs#L863-L868), [crates/globset/src/lib.rs:908-910](https://github.com/BurntSushi/ripgrep/blob/main/crates/globset/src/lib.rs#L908-L910), [crates/globset/src/lib.rs:964-976](https://github.com/BurntSushi/ripgrep/blob/main/crates/globset/src/lib.rs#L964-L976), [crates/globset/src/lib.rs:1016-1021](https://github.com/BurntSushi/ripgrep/blob/main/crates/globset/src/lib.rs#L1016-L1021), [crates/globset/src/lib.rs:1069-1071](https://github.com/BurntSushi/ripgrep/blob/main/crates/globset/src/lib.rs#L1069-L1071)

> [!NOTE]
> `RegexSetStrategy` maintains an `ArcoolatternSet, PatternSetPoolFn>>` to reuse `PatternSet` allocations across overlapping match queries. When `matches_into` executes, it checks out a `PatternSet` via `self.patset.get()`, populates it using `matcher.which_overlapping_matches()`, extracts matching indices, and explicitly returns the guard to the pool via `PoolGuard::put(patset)`.

Sources: [crates/globset/src/lib.rs:964-976](https://github.com/BurntSushi/ripgrep/blob/main/crates/globset/src/lib.rs#L964-L976), [crates/globset/src/lib.rs:986-995](https://github.com/BurntSushi/ripgrep/blob/main/crates/globset/src/lib.rs#L986-L995), [crates/globset/src/lib.rs:1002-1012](https://github.com/BurntSushi/ripgrep/blob/main/crates/globset/src/lib.rs#L1002-L1012)

### Design Trade-Offs in Glob Strategy Selection

| Design Choice | Benefit | Cost |
| :--- | :--- | :--- |
| Multi-strategy partitioning (separate hash maps and automatons per type) | Fast O(1) hash lookups for literals/extensions and vectorized multi-pattern scans for prefixes/suffixes | Increases compilation complexity and memory overhead by maintaining multiple distinct collection structures |
| `Candidate` path decomposition into `path`, `basename`, and `ext` | Amortizes path normalization and component slicing costs when matching a path against multiple globs | Requires eager allocation of normalized `Cow` byte vectors upon candidate construction |
| Pooling `PatternSet` instances in `RegexSetStrategy` | Avoids repeated heap allocations for matching bitsets across high-frequency file evaluations | Introduces pool contention and lock overhead in heavily multithreaded search environments |

Sources: [crates/globset/src/lib.rs:472-552](https://github.com/BurntSushi/ripgrep/blob/main/crates/globset/src/lib.rs#L472-L552), [crates/globset/src/lib.rs:592-638](https://github.com/BurntSushi/ripgrep/blob/main/crates/globset/src/lib.rs#L592-L638), [crates/globset/src/lib.rs:964-976](https://github.com/BurntSushi/ripgrep/blob/main/crates/globset/src/lib.rs#L964-L976)

## Low Level Search Buffer Engine

### Overview

The low-level search buffer engine provides the core glue layer responsible for executing line-by-line streaming reads, slice searches, and multi-line matching operations. It coordinates between raw I/O buffers (`LineBufferReader`), matchers, binary detection routines, and output sinks. The module defines three primary search engines: `ReadByLine`, `SliceByLine`, and `MultiLine`.

Sources: [crates/searcher/src/searcher/glue.rs:10-15](https://github.com/BurntSushi/ripgrep/blob/main/crates/searcher/src/searcher/glue.rs#L10-L15), [crates/searcher/src/searcher/glue.rs:96-100](https://github.com/BurntSushi/ripgrep/blob/main/crates/searcher/src/searcher/glue.rs#L96-L100), [crates/searcher/src/searcher/glue.rs:141-147](https://github.com/BurntSushi/ripgrep/blob/main/crates/searcher/src/searcher/glue.rs#L141-L147)

### Search Engine Execution Architecture

The execution flow for streaming reader searches via `ReadByLine` follows an explicit order of operations managed through core state transitions:

1. `ReadByLine::run()` initiates the search by invoking `self.core.begin()?`.
2. If initialization succeeds, it enters a `while self.fill()?` loop to replenish data from the underlying buffer.
3. Within the loop, `self.core.match_by_line(self.rdr.buffer())?` executes the line matcher against the active buffer slice.
4. If matching returns `false`, `self.consume_remaining()` computes the current consumption position via `self.core.pos()` and advances the reader via `self.rdr.consume(consumed)` before breaking.
5. Upon loop completion, `self.core.finish(self.rdr.absolute_byte_offset(), self.rdr.binary_byte_offset())` finalizes execution.

Sources: [crates/searcher/src/searcher/glue.rs:38-51](https://github.com/BurntSushi/ripgrep/blob/main/crates/searcher/src/searcher/glue.rs#L38-L51)

> [!WARNING]
> When `ReadByLine::fill()` rolls the buffer without consuming any bytes and a subsequent refill adds zero new data, the buffer contains only leftover context. The engine forces a termination by consuming the remaining buffer length and returning `false` to prevent infinite spinning.

Sources: [crates/searcher/src/searcher/glue.rs:79-87](https://github.com/BurntSushi/ripgrep/blob/main/crates/searcher/src/searcher/glue.rs#L79-L87)

### Buffer Glue Engine Types and Operations

The glue layer implements distinct structures tailored to input types and pattern matching configurations.

| Engine Struct | Supported Input | Match Strategy | Key Operations |
| :--- | :--- | :--- | :--- |
| `ReadByLine` | `std::io::Read` | Single-line | `new()`, `run()`, `fill()`, `consume_remaining()`, `should_binary_quit()` |
| `SliceByLine` | `&'s [u8]` | Single-line slice | `new()`, `run()`, `byte_count()` |
| `MultiLine` | `&'s [u8]` | Multi-line slice | `new()`, `run()`, `sink()`, `sink_matched_inverted()`, `sink_matched()`, `sink_context()`, `find()`, `advance()`, `byte_count()` |

Sources: [crates/searcher/src/searcher/glue.rs:10-15](https://github.com/BurntSushi/ripgrep/blob/main/crates/searcher/src/searcher/glue.rs#L10-L15), [crates/searcher/src/searcher/glue.rs:96-100](https://github.com/BurntSushi/ripgrep/blob/main/crates/searcher/src/searcher/glue.rs#L96-L100), [crates/searcher/src/searcher/glue.rs:141-147](https://github.com/BurntSushi/ripgrep/blob/main/crates/searcher/src/searcher/glue.rs#L141-L147)

### Design Trade-Offs in Buffer Glue and Sinking

| Design Choice | Benefit | Cost |
| :--- | :--- | :--- |
| Delayed match sinking in `MultiLine` via `self.last_match.take()` | Groups adjacent or overlapping matches into a single sink invocation, guaranteeing lines are never sinked twice | Requires holding match state and handling complex boundary logic for overlapping match boundaries |
| Separation of `ReadByLine` and `SliceByLine` engines | Optimizes memory management and zero-copy slicing for in-memory byte buffers while supporting streaming I/O | Duplicates runner boilerplate across different input abstractions |
| Eager binary detection checks during buffer filling and slice initialization | Early identification and optional bailout on binary files before expensive searches run | Differs slightly in binary detection semantics between streaming readers and slice readers |

Sources: [crates/searcher/src/searcher/glue.rs:38-94](https://github.com/BurntSushi/ripgrep/blob/main/crates/searcher/src/searcher/glue.rs#L38-L94), [crates/searcher/src/searcher/glue.rs:117-131](https://github.com/BurntSushi/ripgrep/blob/main/crates/searcher/src/searcher/glue.rs#L117-L131), [crates/searcher/src/searcher/glue.rs:223-257](https://github.com/BurntSushi/ripgrep/blob/main/crates/searcher/src/searcher/glue.rs#L223-L257), [crates/searcher/src/searcher/glue.rs:736-756](https://github.com/BurntSushi/ripgrep/blob/main/crates/searcher/src/searcher/glue.rs#L736-L756)

## Related

- [[Overview]]
- [[Search Workflow]]

