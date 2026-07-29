# Terminal Utilities

<details>
<summary>Relevant source files</summary>

The following files were used as context for generating this wiki page:

- [crates/printer/src/standard.rs](https://github.com/BurntSushi/ripgrep/blob/main/crates/printer/src/standard.rs)
- [crates/core/main.rs](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/main.rs)
- [crates/core/flags/defs.rs](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs)
</details>

## Overview

Terminal utilities in ripgrep govern how search results are formatted, styled, buffered, and dispatched to standard output. They bridge the gap between low-level pattern matching engines and human-readable or machine-parsable terminal output, solving problems related to stream buffering, color highlighting, line truncation, and context formatting.
Sources: [crates/printer/src/standard.rs:30-57](https://github.com/BurntSushi/ripgrep/blob/main/crates/printer/src/standard.rs#L30-L57), [crates/core/main.rs:113-156](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/main.rs#L113-L156), [crates/core/flags/defs.rs:39-156](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L39-L156)

The architecture embodies clean separation of concerns by isolating flag parsing, multi-threaded task dispatch loops, buffer management, and sink printing implementations into modular components. These components interact seamlessly with the broader execution context, ensuring safe terminal writes and robust formatting controls across both single-threaded and parallel search paths.
Sources: [crates/printer/src/standard.rs:466-484](https://github.com/BurntSushi/ripgrep/blob/main/crates/printer/src/standard.rs#L466-L484), [crates/core/main.rs:109-235](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/main.rs#L109-L235), [crates/core/flags/defs.rs:39-156](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L39-L156)

## Command Line Terminal Flag Configuration

### Overview

Command line flag definitions in `crates/core/flags/defs.rs` govern terminal display behavior, output buffering, color schemes, and formatting choices. Each logical flag is backed by a unit struct implementing the `Flag` trait, mapping user-supplied arguments—such as long names, short options, negated forms, and aliases—into internal low-level configuration structures (`LowArgs`).
Sources: [crates/core/flags/defs.rs:1-32](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L1-L32)

### Flag Configuration and State Mapping

The `FLAGS` constant array defines the registry and ordering of all available flags, which dictates their layout in generated help menus and man pages. The update mechanism translates flag values into specific output and buffering options.
Sources: [crates/core/flags/defs.rs:39-156](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L39-L156)

| Flag Name | Type | Default Value | Purpose / Action |
| --- | --- | --- | --- |
| `after-context` (`-A`) | `usize` | `0` | Sets the number of lines to display after each match via `args.context.set_after()` |
| `before-context` (`-B`) | `usize` | `0` | Sets the number of lines to display before each match via `args.context.set_before()` |
| `context` (`-C`) | `usize` | `0` | Sets both before and after context lines via `args.context.set_both()` |
| `block-buffered` | Switch | `BufferMode::Auto` | Forces block buffering mode when enabled (`BufferMode::Block`) |
| `byte-offset` (`-b`) | Switch | `false` | Enables printing 0-based byte offsets for matching lines |
| `color` | Enum (`WHEN`) | `ColorChoice::Auto` | Controls color output choices (`never`, `auto`, `always`, `ansi`) |
| `colors` | String Spec | Empty list (`vec![]`) | Pushes iterative color style specifications into `args.colors` |
| `column` | Switch | `None` | Enables 1-based column numbering for matches |
| `context-separator` | Separator | `--` | Defines the string used to separate non-contiguous context chunks |

Sources: [crates/core/flags/defs.rs:231-266](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L231-L266), [crates/core/flags/defs.rs:416-452](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L416-L452), [crates/core/flags/defs.rs:593-634](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L593-L634), [crates/core/flags/defs.rs:653-692](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L653-L692), [crates/core/flags/defs.rs:766-851](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L766-L851), [crates/core/flags/defs.rs:889-975](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L889-L975), [crates/core/flags/defs.rs:1020-1055](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L1020-L1055), [crates/core/flags/defs.rs:1073-1112](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L1073-L1112), [crates/core/flags/defs.rs:1213-1261](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L1213-L1261)

### Flag Parsing Execution Walkthrough

When command-line arguments are processed, ripgrep maps raw inputs through the flag lifecycle:

1. `parse_low_raw()` receives raw command-line arguments or test string slices.
Sources: [crates/core/flags/defs.rs:34-36](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L34-L36)
2. The parser matches each argument against the registered definitions in `FLAGS`.
Sources: [crates/core/flags/defs.rs:39-156](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L39-L156)
3. The matching struct's `update(v: FlagValue, args: &mut LowArgs)` method is invoked.
Sources: [crates/core/flags/defs.rs:263-266](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L263-L266)
4. The `FlagValue` is unwrapped (e.g., via `v.unwrap_value()` or `v.unwrap_switch()`) and converted to the target type via helper routines like `convert::usize()` or `convert::str()`.
Sources: [crates/core/flags/defs.rs:264-265](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L264-L265), [crates/core/flags/defs.rs:842-849](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L842-L849)
5. The parsed value modifies the target field inside `LowArgs` (such as `args.color`, `args.context`, or `args.buffer`).
Sources: [crates/core/flags/defs.rs:264](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L264), [crates/core/flags/defs.rs:627-631](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L627-L631), [crates/core/flags/defs.rs:842-848](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L842-L848)

> [!NOTE]
> Specific flags partially override others regardless of argument ordering. For instance, `--after-context` (`-A`) and `--before-context` (`-B`) partially override `--context` (`-C`), matching standard GNU grep behavior where more specific flags take precedence over broader context ranges.
> Sources: [crates/core/flags/defs.rs:1161-1211](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L1161-L1211)

### Design Trade-Offs in Flag Interpretation

| Design Choice | Benefit | Cost |
| --- | --- | --- |
| **Unit struct per flag implementation** (`struct Color`, `struct AfterContext`) | Clean encapsulation of metadata (`doc_short`, `doc_long`, category) alongside parsing logic | Requires boilerplate unit structs for every distinct flag variant |
| **Iterative vector accumulation** (`args.colors.push()`) | Supports multiple `--colors` flags overriding specific attributes progressively | Requires sequential parsing and validation per specification entry |
| **Enforced UTF-8 check during unescaping** (`ContextSeparator::new()`) | Prevents malformed byte sequences in context boundary separators | Rejects raw invalid UTF-8 strings unless provided via valid UTF-8 escape sequences |

Sources: [crates/core/flags/defs.rs:231-266](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L231-L266), [crates/core/flags/defs.rs:889-975](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L889-L975), [crates/core/flags/defs.rs:1213-1261](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L1213-L1261)

## Execution Context and Output Dispatch

### Overview

Process initialization, allocator configuration, and worker thread dispatching establish the execution context for ripgrep. The binary entry point routes parsed arguments through validation, selects execution modes, and manages output buffers across single-threaded and parallel execution pipelines.
Sources: [crates/core/main.rs:44-107](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/main.rs#L44-L107)

### Process Initialization and Execution Walkthrough

Execution flows through the primary entry point and dispatches to mode-specific workers according to thread counts and argument states:

1. `main()` invokes `run(flags::parse())` and catches any resulting errors or exit codes.
Sources: [crates/core/main.rs:44-45](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/main.rs#L44-L45)
2. `run()` unwraps the `ParseResult<HiArgs>`, handling special modes (such as help or version output) immediately via `special(mode)`.
Sources: [crates/core/main.rs:78-85](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/main.rs#L78-L85)
3. For search operations, `run()` inspects the index depth and thread count to select the search execution route:
   - `index::read(&args, mode)?` when `args.index() > 0`.
   - `search(&args, mode)?` when `args.threads() == 1`.
   - `search_parallel(&args, mode)?` for multi-threaded traversal.
Sources: [crates/core/main.rs:86-90](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/main.rs#L86-L90)
4. For file listing operations without searching, `run()` dispatches to `files(&args)?` or `files_parallel(&args)?`.
Sources: [crates/core/main.rs:95-96](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/main.rs#L95-L96)
5. Exit codes are evaluated based on match outcomes and error state: `ExitCode::from(0)` on success or quiet matches, `ExitCode::from(2)` if internal errors occurred (`messages::errored()`), and `ExitCode::from(1)` otherwise.
Sources: [crates/core/main.rs:100-106](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/main.rs#L100-L106)

> [!NOTE]
> Ripgrep explicitly intercepts `std::io::ErrorKind::BrokenPipe` errors across execution loops and worker printing stages, terminating gracefully with exit code `0` to conform to standard Unix piping conventions.
> Sources: [crates/core/main.rs:48-62](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/main.rs#L48-L62), [crates/core/main.rs:134-135](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/main.rs#L134-L135), [crates/core/main.rs:211-214](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/main.rs#L211-L214)

### Execution Mode Dispatch Table

| Execution Mode | Condition | Target Function | Purpose |
| --- | --- | --- | --- |
| **Search (Single-threaded)** | `args.threads() == 1` | `search(&args, mode)` | Recursively steps through files sequentially and executes searchers. |
| **Search (Parallel)** | `args.threads() > 1` | `search_parallel(&args, mode)` | Dispatches parallel file walking via a buffer-writing worker pool. |
| **Files (Single-threaded)** | `args.threads() == 1` | `files(&args)` | Recursively lists matched file paths sequentially without content searching. |
| **Files (Parallel)** | `args.threads() > 1` | `files_parallel(&args)` | Parallelizes file discovery while feeding paths to a dedicated printing thread. |
| **Type List** | `Mode::Types` | `types(&args)` | Enumerates defined file types and associated glob patterns. |
| **Generate** | `Mode::Generate(mode)` | `generate(mode)` | Outputs auto-generated shell completions or roff man pages. |
| **Special** | `ParseResult::Special(mode)` | `special(mode)` | Short-circuits initialization to output version or help text. |

Sources: [crates/core/main.rs:86-99](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/main.rs#L86-L99)

> [!WARNING]
> Requesting sorted output via flags such as `--sort path` automatically disables parallel traversal, forcing execution into single-threaded codepaths regardless of the configured thread count.
> Sources: [crates/core/main.rs:164-165](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/main.rs#L164-L165), [crates/core/main.rs:275-276](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/main.rs#L275-L276)

### Output Buffer Management and Worker Dispatch

In parallel search operations, ripgrep instantiates an atomic buffer writer (`args.buffer_writer()`) and thread-safe stats mutators (`std::sync::Mutex`). Worker threads obtain cloned searchers initialized with thread-local buffer references via `bufwtr.buffer()`.
Sources: [crates/core/main.rs:170-180](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/main.rs#L170-L180)

During each worker iteration:
- The worker clears its thread-local printer buffer via `searcher.printer().get_mut().clear()`.
Sources: [crates/core/main.rs:195](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/main.rs#L195)
- Search results are executed against each haystack, accumulating statistics inside the locked mutex.
Sources: [crates/core/main.rs:196-209](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/main.rs#L196-L209)
- Completed buffer contents are dispatched through `bufwtr.print(...)` to maintain synchronized terminal output without inter-thread data tearing.
Sources: [crates/core/main.rs:210](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/main.rs#L210)

For parallel file listing (`files_parallel`), an mpsc channel (`mpsc::channel::<Haystack>`) feeds a dedicated background printing thread (`thread::spawn`), preventing write interleaving across worker threads without relying on mutex locks.
Sources: [crates/core/main.rs:281-300](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/main.rs#L281-L300)

## Standard Printer Structure and Lifecycle

### Overview

The standard printer architecture revolves around three central components defined in `crates/printer/src/standard.rs`: the immutable `Config` struct, the fluent `StandardBuilder`, the generic `Standard<W>` printer, and the per-search `StandardSink<'p, 's, M, W>`. Once a `Standard` printer is constructed via its builder, its configuration becomes entirely frozen. Sinks are lightweight and instantiated per search target to record match outcomes and handle streaming buffer callbacks.

Sources: [crates/printer/src/standard.rs:30-101](https://github.com/BurntSushi/ripgrep/blob/main/crates/printer/src/standard.rs#L30-L101), [crates/printer/src/standard.rs:466-484](https://github.com/BurntSushi/ripgrep/blob/main/crates/printer/src/standard.rs#L466-L484), [crates/printer/src/standard.rs:616-650](https://github.com/BurntSushi/ripgrep/blob/main/crates/printer/src/standard.rs#L616-L650)

### Configuration and Builder Architecture

`StandardBuilder` manages a private `Config` struct containing boolean flags, string vectors wrapped in `Arc`, and color specification settings. Callers use fluent builder methods to customize behavior such as maximum columns, replacement patterns, and path terminators before compiling the printer against a `termcolor::WriteColor` or `io::Write` target.

Sources: [crates/printer/src/standard.rs:30-101](https://github.com/BurntSushi/ripgrep/blob/main/crates/printer/src/standard.rs#L30-L101)

| Configuration Method | Parameter Type | Default Value | Purpose |
| --- | --- | --- | --- |
| `color_specs` | `ColorSpecs` | `ColorSpecs::default()` | Sets user-defined color specifications for highlighting matches, line numbers, and paths. |
| `hyperlink` | `HyperlinkConfig` | `HyperlinkConfig::default()` | Configures terminal hyperlink formatting and interpolation rules. |
| `stats` | `bool` | `false` | Enables aggregate statistics collection (bytes searched, match counts, elapsed time). |
| `heading` | `bool` | `false` | Prints the file path once as a heading before matches instead of prefixing every line. |
| `path` | `bool` | `true` | Controls whether file paths are emitted in the output. |
| `only_matching` | `bool` | `false` | Restricts output to exact matching substrings rather than whole lines. |
| `per_match` | `bool` | `false` | Emits a separate output line for every individual match found. |
| `per_match_one_line` | `bool` | `false` | Limits multi-line matches to their first line when `per_match` is enabled. |
| `replacement` | `Option<Vec<u8>>` | `None` | Defines substitution bytes containing capture group references. |
| `max_columns` | `Option<u64>` | `None` | Omits lines exceeding the specified byte width limit. |
| `max_columns_preview` | `bool` | `false` | Displays a grapheme-truncated preview of long lines rather than omitting them entirely. |
| `column` | `bool` | `false` | Prints the starting column number of each match. |
| `byte_offset` | `bool` | `false` | Prints the absolute zero-based byte offset of each line or match. |
| `trim_ascii` | `bool` | `false` | Trims leading ASCII whitespace from output lines. |
| `separator_search` | `Option<Vec<u8>>` | `None` | Inserts a separator between distinct search result blocks. |
| `separator_context` | `Option<Vec<u8>>` | `Some(b"--".to_vec())` | Sets the divider between discontiguous search context runs. |
| `separator_field_match` | `Vec<u8>` | `b":".to_vec()` | Delimits fields (such as line numbers) on matching lines. |
| `separator_field_context` | `Vec<u8>` | `b"-".to_vec()` | Delimits fields on contextual lines. |
| `separator_path` | `Option<u8>` | `None` | Overrides the environment path separator character. |
| `path_terminator` | `Option<u8>` | `None` | Appends a custom terminator byte immediately following emitted paths. |

Sources: [crates/printer/src/standard.rs:59-84](https://github.com/BurntSushi/ripgrep/blob/main/crates/printer/src/standard.rs#L59-L84), [crates/printer/src/standard.rs:164-463](https://github.com/BurntSushi/ripgrep/blob/main/crates/printer/src/standard.rs#L164-L463)

### Sink Lifecycle and Call-Chain Execution

When a search is initiated, `Standard::sink` or `Standard::sink_with_path` constructs a `StandardSink`. The searcher invokes methods on this sink across the execution lifecycle. 

Sources: [crates/printer/src/standard.rs:515-571](https://github.com/BurntSushi/ripgrep/blob/main/crates/printer/src/standard.rs#L515-L571), [crates/printer/src/standard.rs:763-868](https://github.com/BurntSushi/ripgrep/blob/main/crates/printer/src/standard.rs#L763-L868)

The execution walkthrough for handling a matched line flows through the following ordered sequence:
1. `Sink::matched()` intercepts the match event, incrementing `self.match_count`.
Sources: [crates/printer/src/standard.rs:766-771](https://github.com/BurntSushi/ripgrep/blob/main/crates/printer/src/standard.rs#L766-L771)
2. `StandardSink::record_matches()` evaluates `self.needs_match_granularity`. If coloring, columns, replacement, or stats require match-level precision, `find_iter_at_in_context()` executes to populate `self.standard.matches`.
Sources: [crates/printer/src/standard.rs:578-594](https://github.com/BurntSushi/ripgrep/blob/main/crates/printer/src/standard.rs#L578-L594), [crates/printer/src/standard.rs:698-735](https://github.com/BurntSushi/ripgrep/blob/main/crates/printer/src/standard.rs#L698-L735)
3. `StandardSink::replace()` invokes `self.replacer.replace_all()` if replacement bytes are configured.
Sources: [crates/printer/src/standard.rs:742-759](https://github.com/BurntSushi/ripgrep/blob/main/crates/printer/src/standard.rs#L742-L759)
4. `StandardImpl::from_match()` bundles the searcher, sink, and match buffer into a `StandardImpl` instance via `Sunk::from_sink_match()`.
Sources: [crates/printer/src/standard.rs:901-911](https://github.com/BurntSushi/ripgrep/blob/main/crates/printer/src/standard.rs#L901-L911)
5. `StandardImpl::sink()` executes, writing search preludes and dispatching either fast path (`sink_fast`, `sink_fast_multi_line`) or slow path (`sink_slow`, `sink_slow_multi_line`) rendering based on match granularity requirements.
Sources: [crates/printer/src/standard.rs:928-943](https://github.com/BurntSushi/ripgrep/blob/main/crates/printer/src/standard.rs#L928-L943)

> [!NOTE]
> `StandardSink` instances are cheap to construct and intended to be created fresh for every searched file or reader. They borrow the parent `Standard` printer mutably for the duration of the search invocation.
> Sources: [crates/printer/src/standard.rs:515-571](https://github.com/BurntSushi/ripgrep/blob/main/crates/printer/src/standard.rs#L515-L571), [crates/printer/src/standard.rs:616-637](https://github.com/BurntSushi/ripgrep/blob/main/crates/printer/src/standard.rs#L616-L637)

### Lifecycle Method Reference

| Sink Trait Method | Trigger Condition | Core Action Performed |
| --- | --- | --- |
| `begin` | Start of search execution | Resets byte counters (`self.standard.wtr.borrow_mut().reset_count()`), records `start_time`, and clears match counts. |
| `matched` | Searcher finds a matching line | Increments match counter, records match offsets, performs replacements, updates statistics, and dispatches `StandardImpl`. |
| `context` | Searcher reports context lines | Clears match buffers, processes inverted match recordings if applicable, and dispatches context rendering via `StandardImpl::from_context`. |
| `context_break` | Discontiguous context run boundary | Triggers `StandardImpl::write_context_separator()` to emit the configured context separator (e.g., `--`). |
| `binary_data` | Binary byte detected during search | Records `binary_byte_offset` and logs debug messages if quit bytes are configured. |
| `finish` | End of search execution | Writes pending binary warning messages and accumulates final elapsed time, search counts, and byte tallies into `Stats`. |

Sources: [crates/printer/src/standard.rs:763-868](https://github.com/BurntSushi/ripgrep/blob/main/crates/printer/src/standard.rs#L763-L868)

## Safe Writing and Termcolor Formatting

### Overview

The standard printer interfaces with the `termcolor` crate via the `WriteColor` trait, enabling terminal-safe styling, color specification application, and ANSI escape sequence highlighting. Rather than writing raw bytes directly to output streams, formatting operations wrap destination writers through `CounterWriter` combined with `termcolor` wrappers such as `Ansi`, `NoColor`, or standard stream sinks. This architecture guarantees that color specifications and line-highlight rules apply cleanly without corrupting underlying byte streams or failing when color support is disabled.

Sources: [crates/printer/src/standard.rs:1-17](https://github.com/BurntSushi/ripgrep/blob/main/crates/printer/src/standard.rs#L1-L17), [crates/printer/src/standard.rs:127-145](https://github.com/BurntSushi/ripgrep/blob/main/crates/printer/src/standard.rs#L127-L145), [crates/printer/src/standard.rs:474-484](https://github.com/BurntSushi/ripgrep/blob/main/crates/printer/src/standard.rs#L474-L484)

### Color Specification and Highlighting Flow

When matching regions or entire lines require styling, `StandardImpl` manages color application and state transitions. The execution path for writing styled text involves checking color support, managing line highlights, and emitting specific match specifications:

1. `StandardImpl::write_colored_line()` verifies whether the underlying writer supports color and if a matched color specification is configured via `self.config().colors.matched()`. If unsupported or empty, it falls back to unstyled line writing.
Sources: [crates/printer/src/standard.rs:1219-1228](https://github.com/BurntSushi/ripgrep/blob/main/crates/printer/src/standard.rs#L1219-L1228)
2. `StandardImpl::start_line_highlight()` applies any whole-line highlight specification (`self.config().colors.highlight()`) prior to writing text if line highlighting is active.
Sources: [crates/printer/src/standard.rs:1503-1510](https://github.com/BurntSushi/ripgrep/blob/main/crates/printer/src/standard.rs#L1503-L1510)
3. `StandardImpl::write_colored_matches()` iterates across line segments, toggling individual match styles by invoking `StandardImpl::start_color_match()` and `StandardImpl::end_color_match()`.
Sources: [crates/printer/src/standard.rs:1247-1288](https://github.com/BurntSushi/ripgrep/blob/main/crates/printer/src/standard.rs#L1247-L1288)
4. `StandardImpl::write_spec()` borrows the inner `CounterWriter`, explicitly invokes `wtr.set_color(spec)`, writes the raw buffer bytes, and resets color state using `wtr.reset()`.
Sources: [crates/printer/src/standard.rs:1433-1439](https://github.com/BurntSushi/ripgrep/blob/main/crates/printer/src/standard.rs#L1433-L1439)

> [!NOTE]
> `StandardImpl` maintains an internal `in_color_match` cell flag (`Cell<bool>`) to prevent redundant ANSI escape sequence emissions when adjacent or overlapping match ranges share active color specs.
> Sources: [crates/printer/src/standard.rs:875-882](https://github.com/BurntSushi/ripgrep/blob/main/crates/printer/src/standard.rs#L875-L882), [crates/printer/src/standard.rs:1475-1482](https://github.com/BurntSushi/ripgrep/blob/main/crates/printer/src/standard.rs#L1475-L1482)

### Termcolor Formatting and Stream Sink Mechanics

The printer abstracts stream sinks by wrapping custom writers in `CounterWriter` structures to track cumulative byte counts for statistics and output limits. The table below outlines the core color-writing and stream-management helpers implemented on `StandardImpl`:

| Helper Method | Signature | Purpose |
| --- | --- | --- |
| `write_spec` | `(&self, spec: &ColorSpec, buf: &[u8]) -> io::Result<()>` | Applies a specific `ColorSpec`, writes the byte buffer, and immediately resets color formatting. |
| `write_path` | `(&self, path: &PrinterPath) -> io::Result<()>` | Sets path color specifications from configuration and writes the path bytes, concluding with a reset. |
| `start_color_match` | `(&self) -> io::Result<()>` | Enables the match color specification if not already active within the current match state cell. |
| `end_color_match` | `(&self) -> io::Result<()>` | Restores highlight or resets color formatting upon concluding a matched byte sequence. |
| `write` | `(&self, buf: &[u8]) -> io::Result<()>` | Directly writes unstyled raw bytes to the underlying `CounterWriter` stream sink. |

Sources: [crates/printer/src/standard.rs:1433-1446](https://github.com/BurntSushi/ripgrep/blob/main/crates/printer/src/standard.rs#L1433-L1446), [crates/printer/src/standard.rs:1475-1497](https://github.com/BurntSushi/ripgrep/blob/main/crates/printer/src/standard.rs#L1475-L1497), [crates/printer/src/standard.rs:1519-1521](https://github.com/BurntSushi/ripgrep/blob/main/crates/printer/src/standard.rs#L1519-L1521)

## Context Formatting and Column Controls

### Overview

The standard printer provides fine-grained control over line length, text truncation, headings, and match granularity. Depending on the user's configuration, lines exceeding column limits are either completely omitted or rendered as a concise preview. Match granularity determines whether the engine performs extra work to find exact match offsets.
Sources: [crates/printer/src/standard.rs:573-594](https://github.com/BurntSushi/ripgrep/blob/main/crates/printer/src/standard.rs#L573-L594), [crates/printer/src/standard.rs:1290-1352](https://github.com/BurntSushi/ripgrep/blob/main/crates/printer/src/standard.rs#L1290-L1352)

### Line Truncation and Column Controls

When `max_columns` is configured, `StandardImpl::exceeds_max_columns` evaluates whether a given line's byte length surpasses the configured threshold. If it does, `StandardImpl::write_exceeded_line` handles the truncation behavior based on whether `max_columns_preview` is enabled.
Sources: [crates/printer/src/standard.rs:1290-1352](https://github.com/BurntSushi/ripgrep/blob/main/crates/printer/src/standard.rs#L1290-L1352), [crates/printer/src/standard.rs:1562-1564](https://github.com/BurntSushi/ripgrep/blob/main/crates/printer/src/standard.rs#L1562-L1564)

- Without previews, the printer outputs `[Omitted long matching line]`, `[Omitted long context line]`, or `[Omitted long line with N matches]` depending on match count and context state.
Sources: [crates/printer/src/standard.rs:1290-1352](https://github.com/BurntSushi/ripgrep/blob/main/crates/printer/src/standard.rs#L1290-L1352)
- With previews enabled, the printer measures up to $N$ *grapheme clusters* using `.grapheme_indices()`, prints the truncated prefix, and appends a count of any remaining matches within that line (e.g., `[... 1 more match]`).
Sources: [crates/printer/src/standard.rs:1297-1327](https://github.com/BurntSushi/ripgrep/blob/main/crates/printer/src/standard.rs#L1297-L1327)

> [!WARNING]
> Measuring columns via grapheme clusters for previews requires inspecting unicode boundaries, whereas basic length checks use raw byte lengths (`line.len() as u64 > m`). A single column is heuristically defined as a single byte for standard limit checks.
> Sources: [crates/printer/src/standard.rs:298-299](https://github.com/BurntSushi/ripgrep/blob/main/crates/printer/src/standard.rs#L298-L299), [crates/printer/src/standard.rs:1297-1305](https://github.com/BurntSushi/ripgrep/blob/main/crates/printer/src/standard.rs#L1297-L1305), [crates/printer/src/standard.rs:1562-1564](https://github.com/BurntSushi/ripgrep/blob/main/crates/printer/src/standard.rs#L1562-L1564)

### Match Granularity Execution Path

To avoid unnecessary computational overhead, `Standard::needs_match_granularity` checks if the current configuration demands individual match identification within reported lines.
Sources: [crates/printer/src/standard.rs:573-577](https://github.com/BurntSushi/ripgrep/blob/main/crates/printer/src/standard.rs#L573-L577)

The call-chain execution for recording match granularity follows this path during a search sink event:
1. `StandardSink::matched()` intercepts matching blocks from the searcher.
Sources: [crates/printer/src/standard.rs:766-771](https://github.com/BurntSushi/ripgrep/blob/main/crates/printer/src/standard.rs#L766-L771)
2. `StandardSink::record_matches()` checks `self.needs_match_granularity`. If true, it clears previous matches and invokes `find_iter_at_in_context()`.
Sources: [crates/printer/src/standard.rs:698-726](https://github.com/BurntSushi/ripgrep/blob/main/crates/printer/src/standard.rs#L698-L726)
3. `find_iter_at_in_context` iterates over match locations, pushing normalized `Match` coordinate structs into `self.standard.matches`.
Sources: [crates/printer/src/standard.rs:716-726](https://github.com/BurntSushi/ripgrep/blob/main/crates/printer/src/standard.rs#L716-L726)
4. `StandardSink::replace()` executes any configured text replacements via `self.replacer.replace_all()`.
Sources: [crates/printer/src/standard.rs:737-760](https://github.com/BurntSushi/ripgrep/blob/main/crates/printer/src/standard.rs#L737-L760)
5. `StandardImpl::from_match()` bundles the sink match and stored match vector into a `Sunk` wrapper, which `StandardImpl::sink()` dispatches to either fast paths or slow highlight/column rendering loops.
Sources: [crates/printer/src/standard.rs:789-790](https://github.com/BurntSushi/ripgrep/blob/main/crates/printer/src/standard.rs#L789-L790), [crates/printer/src/standard.rs:905-943](https://github.com/BurntSushi/ripgrep/blob/main/crates/printer/src/standard.rs#L905-L943)

> [!NOTE]
> `Standard::needs_match_granularity()` returns `true` if color highlighting is enabled, column reporting is active, replacements are specified, per-match lines are requested, `only_matching` is set, or statistics gathering is turned on.
> Sources: [crates/printer/src/standard.rs:578-594](https://github.com/BurntSushi/ripgrep/blob/main/crates/printer/src/standard.rs#L578-L594)

### Configuration Reference Table

| Configuration Method | Default Value | Purpose |
| --- | --- | --- |
| `max_columns` | `None` | Limits the maximum number of bytes allowed per printed line before truncation. |
| `max_columns_preview` | `false` | Displays an $N$-grapheme preview of long lines instead of omitting them entirely. |
| `column` | `false` | Prints the 1-based column number of the first match in a line. |
| `heading` | `false` | Prints file paths as standalone headings once per file instead of per-line. |
| `separator_search` | `None` | Sets a divider printed between distinct file or search result blocks. |
| `separator_context` | `Some(b"--")` | Sets the separator used between discontiguous runs of search context. |

Sources: [crates/printer/src/standard.rs:59-84](https://github.com/BurntSushi/ripgrep/blob/main/crates/printer/src/standard.rs#L59-L84)

## Related

- [[Standard Text Printer]]

