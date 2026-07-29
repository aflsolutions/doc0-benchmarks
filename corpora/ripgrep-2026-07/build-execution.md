# Build Execution

<details>
<summary>Relevant source files</summary>

The following files were used as context for generating this wiki page:

- [README.md](https://github.com/BurntSushi/ripgrep/blob/main/README.md)
- [crates/core/main.rs](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/main.rs)
- [crates/core/search.rs](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/search.rs)
- [crates/core/flags/defs.rs](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs)
</details>

## Overview

### Execution Architecture

The build execution and initialization lifecycle of ripgrep governs how command-line options transition from raw inputs into compiled binaries, configured search workers, and generated artifacts. Structured around modular Cargo configurations, feature flags, and robust command-line entry points, the build process orchestrates everything from conditional compilation and static linking of optional C dependencies like PCRE2 to the generation of shell completion scripts and manual pages.

Sources: [README.md:451-506](https://github.com/BurntSushi/ripgrep/blob/main/README.md#L451-L506), [crates/core/main.rs:43-107](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/main.rs#L43-L107), [crates/core/search.rs:52-85](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/search.rs#L52-L85)

By decoupling flag definition structures from worker execution pipelines, ripgrep establishes a flexible foundation where search workers coordinate pattern matchers, text searchers, and output formatters across single-threaded or multi-threaded execution modes.

Sources: [README.md:188-209](https://github.com/BurntSushi/ripgrep/blob/main/README.md#L188-L209), [crates/core/main.rs:109-235](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/main.rs#L109-L235), [crates/core/search.rs:224-277](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/search.rs#L224-L277), [crates/core/flags/defs.rs:39-156](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L39-L156)

## Build Configuration and Dependency Management

### Overview

RiPGrep's compilation and dependency management rely on standard Cargo configuration settings, targeted feature flags, and integration rules for optional C libraries. Building the binary requires a compatible Rust compiler toolchain, while optional features control advanced regular expression engines and static linking behaviors.

Sources: [README.md:451-489](https://github.com/BurntSushi/ripgrep/blob/main/README.md#L451-L489)

### Cargo Compilation and Dependency Management

Compiling ripgrep requires a Rust installation tracking stable releases, with a minimum supported Rust version (MSRV) established at **1.96.0**. Binary releases on Linux and Windows target static executables, which can be configured via target specifications such as `x86_64-unknown-linux-musl`.

Sources: [README.md:431-433](https://github.com/BurntSushi/ripgrep/blob/main/README.md#L431-L433), [README.md:451-456](https://github.com/BurntSushi/ripgrep/blob/main/README.md#L451-L456), [README.md:496-499](https://github.com/BurntSushi/ripgrep/blob/main/README.md#L496-L499)

> [!NOTE]
> The generated release binary intentionally retains debug symbols. To reduce file size for deployment, operators must manually run `strip` on the compiled `rg` binary.

Sources: [README.md:434-437](https://github.com/BurntSushi/ripgrep/blob/main/README.md#L434-L437)

The optional PCRE2 regex engine integration allows linking against system libraries or compiling from source when absent. Dynamic or static linking can be enforced using environment variables or target selection.

Sources: [README.md:476-490](https://github.com/BurntSushi/ripgrep/blob/main/README.md#L476-L490)

The build configuration variables and flags controlling this behavior are summarized below.

Sources: [README.md:476-516](https://github.com/BurntSushi/ripgrep/blob/main/README.md#L476-L516)

| Compilation Setting / Feature | Flag or Environment Variable | Default Behavior | Purpose |
| ----------------------------- | -------------------------- | ---------------- | ------- |
| **PCRE2 Feature Flag** | `--features 'pcre2'` | Disabled | Enables PCRE2 support for look-around and backreferences. |
| **Static PCRE2 Link Override** | `PCRE2_SYS_STATIC=1` | Dynamic/Auto | Forces static linking of PCRE2 even if a system library is present. |
| **MUSL Target Compilation** | `--target x86_64-unknown-linux-musl` | Native target | Produces a fully static executable on Linux systems. |
| **Test Suite Execution** | `cargo test --all` | Run default tests | Executes unit and integration test suites from the repository root. |

Sources: [README.md:476-516](https://github.com/BurntSushi/ripgrep/blob/main/README.md#L476-L516)

> [!WARNING]
> Building a static executable with MUSL and PCRE2 simultaneously requires `musl-gcc` to be installed on the host distribution, which is frequently packaged separately from the core MUSL libraries.

Sources: [README.md:500-505](https://github.com/BurntSushi/ripgrep/blob/main/README.md#L500-L505)

## Build-Time Artifact and Completion Generation

### Overview

Ripgrep incorporates generation routines directly into its command-line execution framework to produce ancillary metadata, including man pages in roff format and shell completion scripts. When the binary receives specific generation instructions, the execution flow dispatches to corresponding generation functions that output the requested payload to standard output.

Sources: [crates/core/main.rs:357-375](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/main.rs#L357-L375)

### Generation Mode Execution Call Chain

The generation mechanism is triggered through the top-level `run` function when parsing evaluates a `Generate` mode.

Sources: [crates/core/main.rs:78-99](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/main.rs#L78-L99)

The execution walkthrough proceeds through the following dispatch stages:

1. `main()` calls `run(flags::parse())`, which evaluates the argument parse result.
2. When `args.mode()` yields `Mode::Generate(mode)`, control hands off directly to `generate(mode)`.
3. The `generate()` function matches on the variant of `crate::flags::GenerateMode` and invokes the corresponding flag generation routine.
4. The resulting string output is trimmed at the end and written to standard output via `writeln!(std::io::stdout(), "{}", output.trim_end())`.

Sources: [crates/core/main.rs:44-375](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/main.rs#L44-L375)

### Supported Generation Modes

The `GenerateMode` variants correspond directly to manual page generation and completions across multiple shell environments. These options and their associated handler functions are enumerated below.

Sources: [crates/core/main.rs:361-375](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/main.rs#L361-L375)

| Generate Mode Variant | Handler Function | Output Target Format | Purpose |
| --------------------- | ---------------- | -------------------- | ------- |
| `GenerateMode::Man` | `flags::generate_man_page()` | Roff / man page | Generates the ripgrep manual page. |
| `GenerateMode::CompleteBash` | `flags::generate_complete_bash()` | Bash completion script | Generates shell completion definitions for Bash. |
| `GenerateMode::CompleteZsh` | `flags::generate_complete_zsh()` | Zsh completion script | Generates shell completion definitions for Zsh. |
| `GenerateMode::CompleteFish` | `flags::generate_complete_fish()` | Fish completion script | Generates shell completion definitions for Fish. |
| `GenerateMode::CompletePowerShell` | `flags::generate_complete_powershell()` | PowerShell completion script | Generates shell completion definitions for PowerShell. |

Sources: [crates/core/main.rs:361-372](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/main.rs#L361-L372)

## Main Entry Point and Flag Initialization

### Overview

RiPGrep executes its core binary through a main function that initializes global memory allocators, parses command-line flags, and delegates to specialized search or utility run routines.

Sources: [crates/core/main.rs:43-67](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/main.rs#L43-L67)

On 64-bit platforms built with the musl environment, ripgrep configures `tikv_jemallocator::Jemalloc` as its global allocator to prevent performance degradation observed with musl's default allocator.

Sources: [crates/core/main.rs:26-42](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/main.rs#L26-L42)

### Execution Call-Chain Walkthrough

The command-line execution and initialization sequence proceeds through the following named functions in strict call order:

Sources: [crates/core/main.rs:43-107](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/main.rs#L43-L107)

1. `main()` → Invokes `flags::parse()` and matches on the returned result inside a safe error-handling wrapper.
2. `run()` → Consumes the parsed argument representation, unwrapping error states or short-circuiting into `special()` modes, then inspecting the execution mode via `args.mode()`.
3. Mode Dispatch → Depending on thread configuration and search parameters, control passes to single-threaded search (`search()`), parallel search (`search_parallel()`), file listing (`files()`, `files_parallel()`), type listing (`types()`), or artifact generation (`generate()`).
4. Exit Code Conversion → The concluding boolean match state and error counters determine whether ripgrep returns `ExitCode::from(0)`, `ExitCode::from(1)`, or `ExitCode::from(2)`.

Sources: [crates/core/main.rs:44-107](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/main.rs#L44-L107)

> [!WARNING]
> Unhandled I/O errors matching `std::io::ErrorKind::BrokenPipe` are explicitly intercepted during error unwinding in `main()`, causing ripgrep to exit gracefully with success (`ExitCode::from(0)`) to mirror standard Unix pipeline conventions.

Sources: [crates/core/main.rs:48-62](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/main.rs#L48-L62)

### Initialization Design Trade-Offs

| Design Choice | Benefit | Cost |
| ------------- | ------- | ---- |
| **Musl Jemalloc Override** | Mitigates performance degradation on static musl builds where the default allocator is suboptimal. | Increases binary compilation times and adds allocator dependency overhead on target platforms. |
| **Special Mode Short-Circuiting** | Bypasses working directory checks and heavy initialization when rendering help or version metadata. | Requires separate dispatch paths for informational queries before full argument validation occurs. |

Sources: [crates/core/main.rs:26-38](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/main.rs#L26-L38), [crates/core/main.rs:377-388](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/main.rs#L377-L388)

## Search Worker Abstraction and Execution

### Overview

The search worker abstraction governs the high-level coordination between regex pattern matchers, search strategies, and output printers.

Sources: [crates/core/search.rs:1-9](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/search.rs#L1-L9)

Managed through `SearchWorker` and constructed via `SearchWorkerBuilder`, each worker encapsulates configuration state for preprocessors, file decompression, and binary file detection.

Sources: [crates/core/search.rs:39-85](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/search.rs#L39-L85)

### Execution Call-Chain Walkthrough

The search worker execution pipeline routes each target haystack through a series of validation and dispatch functions:

Sources: [crates/core/search.rs:243-267](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/search.rs#L243-L267)

1. `SearchWorker::search()` → Receives a reference to a `Haystack`, resolves whether binary detection rules apply via `haystack.is_explicit()`, and updates `self.searcher.set_binary_detection(bin)`.
2. Input Routing Branch → The worker checks stream type and configuration flags in fixed order: if `haystack.is_stdin()` is true, it calls `self.search_reader()`; else if `self.should_preprocess(path)` matches, it invokes `self.search_preprocessor(path)`; else if `self.should_decompress(path)` matches, it invokes `self.search_decompress(path)`; otherwise it falls through to `self.search_path(path)`.
3. Pattern Matcher Dispatch → `search_path()` or `search_reader()` inspects `self.matcher` and delegates to backend-specific functions (`RustRegex(ref m)` or `PCRE2(ref m)`).
4. Printer Sink Execution → `search_path<M, W>` or `search_reader<M, R, W>` extracts a matching sink from the printer (`Printer::Standard`, `Printer::Summary`, or `Printer::JSON`), executes `searcher.search_path(...)` or `searcher.search_reader(...)`, and wraps the result in a `SearchResult`.

Sources: [crates/core/search.rs:243-449](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/search.rs#L243-L449)

> [!WARNING]
> Preprocessor execution completely overrides decompression settings (`search_zip`). If both a preprocessor command and zip searching are configured, the preprocessor takes precedence for matching file paths.

Sources: [crates/core/search.rs:121-123](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/search.rs#L121-L123)

### Search Worker Components and Variants

| Component / Enum | Variant / Method | Type / Target Signature | Purpose |
| ---------------- | ---------------- | ----------------------- | ------- |
| `PatternMatcher` | `RustRegex` | `grep::regex::RegexMatcher` | Uses ripgrep's native Rust regex engine backend. |
| `PatternMatcher` | `PCRE2` | `grep::pcre2::RegexMatcher` | Uses the optional PCRE2 regex engine backend. |
| `Printer<W>` | `Standard` | `grep::printer::Standard<W>` | Emits search results in classic grep format. |
| `Printer<W>` | `Summary` | `grep::printer::Summary<W>` | Emits aggregate displays of search results. |
| `Printer<W>` | `JSON` | `grep::printer::JSON<W>` | Emits search results in JSON Lines format. |

Sources: [crates/core/search.rs:193-211](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/search.rs#L193-L211)

### Worker Architecture Trade-Offs

| Design Choice | Benefit | Cost |
| ------------- | ------- | ---- |
| **Direct Path Searching (`search_path`)** | Permits advanced low-level I/O optimizations like memory-mapping files directly. | Bypasses stream filters, requiring separate reader code paths for preprocessors and decompression. |
| **Cloned Worker per Thread (`search_parallel`)** | Avoids lock contention across parallel directory worker threads during traversal. | Replicates internal searcher and printer allocations per worker instance. |

Sources: [crates/core/main.rs:187-187](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/main.rs#L187-L187), [crates/core/search.rs:226-241](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/search.rs#L226-L241), [crates/core/search.rs:359-361](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/search.rs#L359-L361)

## Flag Definitions and Conditional Compilation

### Overview

RiPGrep structures its command-line flag system around individual unit structs that each implement the `Flag` trait.

Sources: [crates/core/flags/defs.rs:1-18](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L1-L18)

A single logical flag inside ripgrep can manifest in multiple ways for an end user, including a long flag name, an optional short flag name, an optional negated long flag name, and an arbitrarily long list of aliases.

Sources: [crates/core/flags/defs.rs:4-17](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L4-L17)

The `FLAGS` constant array dictates the authoritative sequence of flags, determining both parsing priority and the exact layout of options generated inside help documentation and man pages sorted by category.

Sources: [crates/core/flags/defs.rs:39-156](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L39-L156)

### Flag Representation and Properties

| Struct Name | Short Flag | Long Flag | Negated Long | Category | Purpose |
| ----------- | ---------- | --------- | ------------ | -------- | ------- |
| `AfterContext` | `b'A'` | `after-context` | None | Output | Show NUM lines after each match. |
| `AutoHybridRegex` | None | `auto-hybrid-regex` | `no-auto-hybrid-regex` | Search | (DEPRECATED) Use PCRE2 if appropriate. |
| `BeforeContext` | `b'B'` | `before-context` | None | Output | Show NUM lines before each match. |
| `Binary` | None | `binary` | `no-binary` | Filter | Search binary files. |
| `BlockBuffered` | None | `block-buffered` | `no-block-buffered` | Output | Force block buffering. |
| `ByteOffset` | `b'b'` | `byte-offset` | `no-byte-offset` | Output | Print the byte offset for each matching line. |

Sources: [crates/core/flags/defs.rs:231-692](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L231-L692)

> [!NOTE]
> Certain flags such as `Index` and `IndexCrud` contain conditional checks guarding their availability. Specifically, if the `unstable-index` compile-time feature is disabled, invoking these flags triggers an immediate parse error.

Sources: [crates/core/flags/defs.rs:3525-3529](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L3525-L3529), [crates/core/flags/defs.rs:3630-3634](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L3630-L3634)

### Flag Update Call Chain and Validation

When arguments are parsed, individual flag implementations handle values via their `update` method, mutating the intermediate `LowArgs` structure.

Sources: [crates/core/flags/defs.rs:263-266](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L263-L266)

The execution flow for flag state updates proceeds through explicit validation boundaries:

1. **CLI Flag Dispatch**: Lexopt yields an option token matching a registered implementation in `FLAGS`.
2. **Feature Gate Verification**: Operations like `Index::update()` invoke `check_indexing_allowed()`, rejecting execution if unstable features are absent.
3. **Value Parsing and Conversion**: `convert` utilities parse arguments into typed choices (e.g., `convert::usize` or `convert::human_readable_usize`).
4. **State Mutation**: The parsed value is written to the target field in `LowArgs` (e.g., `args.context.set_after(...)`), overriding conflicting flags according to precedence rules.

Sources: [crates/core/flags/defs.rs:39-156](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L39-L156), [crates/core/flags/defs.rs:263-266](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L263-L266), [crates/core/flags/defs.rs:3511-3520](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L3511-L3520)

## Related

- [[Shell Completions]]
- [[Manual Page Generation]]

