# Quick Start

<details>
<summary>Relevant source files</summary>

The following files were used as context for generating this wiki page:

- [crates/core/search.rs](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/search.rs)
- [README.md](https://github.com/BurntSushi/ripgrep/blob/main/README.md)
- [crates/core/main.rs](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/main.rs)
- [crates/core/flags/defs.rs](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs)
</details>

## Overview

### Overview

Ripgrep (`rg`) is a line-oriented recursive search utility designed around high performance, robust default filtering, and first-class Unicode support. By combining efficient finite automata, SIMD, and aggressive literal optimizations from Rust's regex engine with a lock-free parallel directory iterator, ripgrep delivers rapid content searches across complex directory trees and single large files alike. Sources: [README.md:1-10](https://github.com/BurntSushi/ripgrep/blob/main/README.md#L1-L10), [README.md:188-209](https://github.com/BurntSushi/ripgrep/blob/main/README.md#L188-L209)

The architecture is structured around clean separation of concerns, routing high-level execution flow from the CLI entry point through argument parsing and validation directly into specialized search or file-listing engines. Whether operating in single-threaded mode or scaling execution across parallel workers via recursive directory traversal, the execution lifecycle cleanly abstracts matcher, searcher, and printer components. Sources: [crates/core/main.rs:44-107](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/main.rs#L44-L107), [crates/core/search.rs:2-8](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/search.rs#L2-L8)

To tailor behavior for varied environments, ripgrep exposes extensive command-line flag configurations controlling search modes, output formatting, binary handling, and performance tuning. This foundation supports flexible workflows, including custom input preprocessors, archive decompression, and specialized file type filtering to adapt the search engine to any development task. Sources: [README.md:122-153](https://github.com/BurntSushi/ripgrep/blob/main/README.md#L122-L153), [crates/core/flags/defs.rs:44-156](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L44-L156)

Sources: [README.md:1-10](https://github.com/BurntSushi/ripgrep/blob/main/README.md#L1-L10), [crates/core/main.rs:44-107](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/main.rs#L44-L107), [README.md:122-153](https://github.com/BurntSushi/ripgrep/blob/main/README.md#L122-L153)

## Building and Installing Ripgrep

### Overview

Ripgrep (`rg`) can be installed either via prebuilt binary archives and package managers across major operating systems or compiled directly from source using Cargo. Precompiled binary archives are provided for Windows, macOS, and Linux, with Linux and Windows binaries distributed as static executables. Sources: [README.md:237-240](https://github.com/BurntSushi/ripgrep/blob/main/README.md#L237-L240)

### Package Manager Installation

Ripgrep is available across numerous package ecosystems and operating system repositories.

| Platform / Manager | Installation Command |
| :--- | :--- |
| macOS (Homebrew) | `brew install ripgrep` |
| MacPorts | `sudo port install ripgrep` |
| Windows (Chocolatey) | `choco install ripgrep` |
| Windows (Scoop) | `scoop install ripgrep` |
| Windows (Winget) | `winget install BurntSushi.ripgrep.MSVC` |
| Arch Linux | `sudo pacman -S ripgrep` |
| Gentoo | `sudo emerge sys-apps/ripgrep` |
| Fedora | `sudo dnf install ripgrep` |
| openSUSE | `sudo zypper install ripgrep` |
| CentOS Stream 10 / Rocky 10 | `sudo dnf install ripgrep` |
| Red Hat 10 | `sudo dnf install ripgrep` |
| Nix | `nix-env --install ripgrep` |
| Flox | `flox install ripgrep` |
| Guix | `guix install ripgrep` |
| Debian / Ubuntu (`.deb`) | `sudo dpkg -i ripgrep_14.1.1-1_amd64.deb` |
| Debian stable / Ubuntu | `sudo apt-get install ripgrep` |
| ALT | `sudo apt-get install ripgrep` |
| FreeBSD | `sudo pkg install ripgrep` |
| OpenBSD | `doas pkg_add ripgrep` |
| NetBSD | `sudo pkgin install ripgrep` |
| Haiku x86_64 | `sudo pkgman install ripgrep` |
| Haiku x86_gcc2 | `sudo pkgman install ripgrep_x86` |
| Void Linux | `sudo xbps-install -Syv ripgrep` |

Sources: [README.md:245-428](https://github.com/BurntSushi/ripgrep/blob/main/README.md#L245-L428)

### Compiling from Source

Compiling ripgrep from source requires a Rust compiler matching version **1.96.0** (stable) or newer, as ripgrep generally tracks the latest stable release of the Rust compiler. Sources: [README.md:430-435](https://github.com/BurntSushi/ripgrep/blob/main/README.md#L430-L435), [README.md:453-456](https://github.com/BurntSushi/ripgrep/blob/main/README.md#L453-L456)

To clone and build ripgrep locally with release optimizations:

```bash
git clone https://github.com/BurntSushi/ripgrep
cd ripgrep
cargo build --release
./target/release/rg --version
```

Sources: [README.md:460-466](https://github.com/BurntSushi/ripgrep/blob/main/README.md#L460-L466)

> [!NOTE]
> Cargo installations include debug symbols in the compiled binary by default. To reduce file size, run `strip` on the resulting binary. Sources: [README.md:434-436](https://github.com/BurntSushi/ripgrep/blob/main/README.md#L434-L436)

### Optional Features and Target Architectures

Optional PCRE2 regex support can be enabled at compile time by passing the `pcre2` feature flag:

```bash
cargo build --release --features 'pcre2'
```

Sources: [README.md:476-481](https://github.com/BurntSushi/ripgrep/blob/main/README.md#L476-L481)

Enabling PCRE2 attempts to automatically locate and link against your system's PCRE2 library via `pkg-config`. If no system library is found, ripgrep compiles PCRE2 from source using your system C compiler and statically links it. Static linking can be forced by setting `PCRE2_SYS_STATIC=1` or by building for the MUSL target. Sources: [README.md:483-489](https://github.com/BurntSushi/ripgrep/blob/main/README.md#L483-L489)

To build a fully static executable on Linux using the MUSL target:

```bash
rustup target add x86_64-unknown-linux-musl
cargo build --release --target x86_64-unknown-linux-musl
```

Sources: [README.md:496-499](https://github.com/BurntSushi/ripgrep/blob/main/README.md#L496-L499)

## Execution Entry Point and Lifecycle

### Overview

Ripgrep execution begins at the standard binary entry point `main()`, which intercepts any argument parsing results and returns a process `ExitCode`. The lifecycle manages memory allocation selection, error propagation, and search dispatch. Sources: [crates/core/main.rs:44-67](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/main.rs#L44-L67)

> [!NOTE]
> On 64-bit systems targeting MUSL, ripgrep explicitly overrides the global allocator with `tikv_jemallocator::Jemalloc` because MUSL's native allocator substantially slows down search workloads. Sources: [crates/core/main.rs:26-41](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/main.rs#L26-L41)

### Execution Call Chain and Dispatch

The control flow moves from process invocation through command-line parsing into high-level dispatch routines. The core execution path follows this sequence:

`main()` → `flags::parse()` → `run()` → `search()` / `search_parallel()` / `files()` / `files_parallel()` / `index::read()` / `index::write()` / `types()` / `generate()` / `special()` — where `run()` inspects the `ParseResult` and routes execution based on the chosen mode and thread count. Sources: [crates/core/main.rs:45-99](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/main.rs#L45-L99)

> [!WARNING]
> If an I/O error represents a broken pipe (`std::io::ErrorKind::BrokenPipe`), ripgrep catches the error during the error-chain descent and returns a graceful success exit code (`0`) instead of printing a panic or trace to stderr. Sources: [crates/core/main.rs:48-62](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/main.rs#L48-L62)

### Mode Dispatch Reference

The `run()` function routes higher-level `HiArgs` to specialized execution branches depending on the command mode and thread configuration.

| Mode / Condition | Target Function / Module | Purpose |
| :--- | :--- | :--- |
| `ParseResult::Err(err)` | Immediate return | Bubbles up argument parsing errors. Sources: [crates/core/main.rs:81-82](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/main.rs#L81-L82) |
| `ParseResult::Special(mode)` | `special(mode)` | Short-circuits initialization for help, version, and PCRE2 checks. Sources: [crates/core/main.rs:83](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/main.rs#L83) |
| `Mode::Search(_)` with index (`index() > 0`) | `index::read(&args, mode)` | Reads and processes from a pre-built index. Sources: [crates/core/main.rs:88](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/main.rs#L88) |
| `Mode::Search(_)` with single thread (`threads() == 1`) | `search(&args, mode)` | Sequentially steps through the file list and searches files. Sources: [crates/core/main.rs:89](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/main.rs#L89) |
| `Mode::Search(_)` multi-threaded | `search_parallel(&args, mode)` | Performs parallel recursive directory traversal and concurrent worker searches. Sources: [crates/core/main.rs:90](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/main.rs#L90) |
| `Mode::Index(_)` | `index::write(&args)` | Builds and writes an index. Sources: [crates/core/main.rs:91-94](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/main.rs#L91-L94) |
| `Mode::Files` with single thread (`threads() == 1`) | `files(&args)` | Recursively lists files sequentially without searching. Sources: [crates/core/main.rs:95](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/main.rs#L95) |
| `Mode::Files` multi-threaded | `files_parallel(&args)` | Recursively lists files across multiple worker threads with a dedicated printing thread. Sources: [crates/core/main.rs:96](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/main.rs#L96) |
| `Mode::Types` | `types(&args)` | Lists file type definitions and associated glob patterns. Sources: [crates/core/main.rs:97](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/main.rs#L97) |
| `Mode::Generate(mode)` | `generate(mode)` | Generates man pages or shell completion scripts. Sources: [crates/core/main.rs:98](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/main.rs#L98) |

Sources: [crates/core/main.rs:81-99](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/main.rs#L81-L99)

### Design Trade-Offs in Execution Dispatch

| Design Choice | Benefit | Cost |
| :--- | :--- | :--- |
| Explicit single-thread vs multi-threaded branch splitting (`threads() == 1`) | Avoids synchronization overhead, mutex locking, and atomic variables during simple sequential searches. | Duplicates control flow logic between `search()` and `search_parallel()` (and similarly for `files()` and `files_parallel()`). Sources: [crates/core/main.rs:89-90](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/main.rs#L89-L90) |
| Dedicated printing thread with an `mpsc` channel in `files_parallel()` | Prevents output interleaving and race conditions without locking worker threads on stdout writes. | Introduces channel communication overhead and an extra background thread lifecycle. Sources: [crates/core/main.rs:291-300](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/main.rs#L291-L300) |
| Short-circuiting `special` mode prior to environment checks | Avoids directory traversal and working directory access failures when a user requests `--help` or `--version`. | Requires separate handling branches for flags that bypass standard argument validation flows. Sources: [crates/core/main.rs:377-388](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/main.rs#L377-L388) |

Sources: [crates/core/main.rs:89-90](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/main.rs#L89-L90), [crates/core/main.rs:291-300](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/main.rs#L291-L300), [crates/core/main.rs:377-388](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/main.rs#L377-L388)

## Command Line Flag Configuration

### Overview

Ripgrep defines its command-line interface through unit structs that implement the `Flag` trait, mapping user-facing variations—such as long names, short flags, negated options, and aliases—to a single logical representation inside `LowArgs`. The central array `FLAGS` establishes the exact ordering of flags within generated documentation and help menus, placing deprecated flags last.

Sources: [crates/core/flags/defs.rs:1-18](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L1-L18), [crates/core/flags/defs.rs:39-156](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L39-L156)

### Flag Definition and Update Handling

Each flag type overrides methods to parse incoming `FlagValue` enums and mutate the shared `LowArgs` state structure. For instance, context flags like `AfterContext` (`-A`), `BeforeContext` (`-B`), and `Context` (`-C`) update bounds via `args.context.set_after()`, `args.context.set_before()`, and `args.context.set_both()`, respectively.

Sources: [crates/core/flags/defs.rs:231-267](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L231-L267), [crates/core/flags/defs.rs:416-452](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L416-L452), [crates/core/flags/defs.rs:1073-1112](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L1073-L1112)

| Flag Struct | Short Name | Long Name | Category | Purpose / Update Behavior |
| :--- | :--- | :--- | :--- | :--- |
| `AfterContext` | `A` | `after-context` | `Output` | Sets number of lines following each match (`args.context.set_after`). Sources: [crates/core/flags/defs.rs:239-244](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L239-L244), [crates/core/flags/defs.rs:263-266](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L263-L266) |
| `AutoHybridRegex` | None | `auto-hybrid-regex` | `Search` | Dynamically selects regex engine; sets `args.engine = EngineChoice::Auto`. Sources: [crates/core/flags/defs.rs:325-332](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L325-L332), [crates/core/flags/defs.rs:367-375](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L367-L375) |
| `BeforeContext` | `B` | `before-context` | `Output` | Sets number of lines preceding each match (`args.context.set_before`). Sources: [crates/core/flags/defs.rs:424-429](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L424-L429), [crates/core/flags/defs.rs:448-451](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L448-L451) |
| `Binary` | None | `binary` | `Filter` | Controls binary file searching and NUL suppression (`args.binary`). Sources: [crates/core/flags/defs.rs:510-517](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L510-L517), [crates/core/flags/defs.rs:558-564](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L558-L564) |
| `BlockBuffered` | None | `block-buffered` | `Output` | Forces block buffering mode (`args.buffer = BufferMode::Block`). Sources: [crates/core/flags/defs.rs:601-608](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L601-L608), [crates/core/flags/defs.rs:626-633](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L626-L633) |

Sources: [crates/core/flags/defs.rs:231-633](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L231-L633)

> [!WARNING]
> Certain flags such as `--index` (`-X`) perform strict validation via `check_indexing_allowed()` and enforce upper bounds, throwing an error if provided more than twice or when unstable index features are disabled.

Sources: [crates/core/flags/defs.rs:3511-3520](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L3511-L3520)

### Indexing Restrictions and Unsupported Flags

When indexing operations are active, `LowArgs::indexing_unsupported_flag(&self)` inspects the configuration state to reject incompatible flags. If an incompatible option is detected, it returns a reference to the offending `Flag` implementation.

Sources: [crates/core/flags/defs.rs:167-229](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L167-L229)

> [!NOTE]
> The method evaluates fields sequentially—checking `self.mode`, `self.binary`, `self.encoding`, `self.engine`, `self.follow`, `self.globs`, `self.hidden`, ignore lists, file systems, preprocessors, and zip search settings—to guarantee that index-incompatible queries fall back cleanly.

Sources: [crates/core/flags/defs.rs:170-227](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L170-L227)

## Search Worker Execution Engine

### Overview

The search worker execution engine is managed by the `SearchWorker` abstraction defined in `crates/core/search.rs`. A single worker coordinates interactions between a pattern matcher (such as Rust regex or PCRE2), a searcher, and a printer. It is intended for single-threaded searches or cloned per thread during parallel directory walks.

Sources: [crates/core/search.rs:1-8](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/search.rs#L1-L8), [crates/core/search.rs:224-241](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/search.rs#L224-L241), [crates/core/main.rs:187-187](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/main.rs#L187-L187)

### Single-Threaded and Parallel Execution Loops

Ripgrep dispatches search operations depending on thread counts and search modes in `run()`. When running single-threaded searches (`args.threads() == 1`), the engine iterates sequentially through sorted or unsorted haystacks via `search()`. When running multi-threaded searches, it utilizes parallel directory walking via `search_parallel()`, cloning the `SearchWorker` for each parallel task runner block.

Sources: [crates/core/main.rs:88-90](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/main.rs#L88-L90), [crates/core/main.rs:113-157](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/main.rs#L113-L157), [crates/core/main.rs:166-235](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/main.rs#L166-L235)

> [!WARNING]
> Requesting sorted output via flags such as `--sort path` automatically disables parallelism in the top-level execution runner, forcing single-threaded evaluation through `search()`.

Sources: [crates/core/main.rs:163-165](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/main.rs#L163-L165)

### Worker Search Call Chain

When `searcher.search(&haystack)` is invoked on a haystack, the worker evaluates binary detection rules, configures the underlying searcher, and branches based on input type and preprocessor or decompression settings before executing the match.

The search execution proceeds along this call chain:
`SearchWorker::search()` → (`search_reader()` / `search_preprocessor()` / `search_decompress()` / `search_path()`) → `search_path()` or `search_reader()` helpers → `searcher.search_path()` / `searcher.search_reader()` with printer sink.

Sources: [crates/core/search.rs:245-267](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/search.rs#L245-L267), [crates/core/search.rs:341-375](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/search.rs#L341-L375)

### Worker Configurations and Components

The worker structure and its associated configuration types encapsulate options controlling input preprocessing, compression handling, and binary file detection.

| Component / Struct | Field / Variant | Purpose / Description |
| :--- | :--- | :--- |
| `Config` | `preprocessor` | Optional path to an external preprocessor command. Sources: [crates/core/search.rs:19-20](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/search.rs#L19-L20) |
| `Config` | `preprocessor_globs` | Glob overrides determining which files route through the preprocessor. Sources: [crates/core/search.rs:21](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/search.rs#L21) |
| `Config` | `search_zip` | Boolean flag enabling compressed file decompression and search. Sources: [crates/core/search.rs:22](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/search.rs#L22) |
| `Config` | `binary_implicit` | Binary detection policy for files found via recursive search. Sources: [crates/core/search.rs:23](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/search.rs#L23) |
| `Config` | `binary_explicit` | Binary detection policy for files explicitly supplied by users. Sources: [crates/core/search.rs:24](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/search.rs#L24) |
| `PatternMatcher` | `RustRegex` | Standard regex engine backed by `grep::regex::RegexMatcher`. Sources: [crates/core/search.rs:194](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/search.rs#L194) |
| `PatternMatcher` | `PCRE2` | Optional PCRE2 regex engine backend (`grep::pcre2::RegexMatcher`). Sources: [crates/core/search.rs:195-197](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/search.rs#L195-L197) |
| `Printer` | `Standard` | Classic grep-like output formatter. Sources: [crates/core/search.rs:205](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/search.rs#L205) |
| `Printer` | `Summary` | Summary output formatter displaying aggregate statistics. Sources: [crates/core/search.rs:207-208](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/search.rs#L207-L208) |
| `Printer` | `JSON` | JSON Lines format output formatter. Sources: [crates/core/search.rs:209-210](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/search.rs#L209-L210) |

Sources: [crates/core/search.rs:14-211](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/search.rs#L14-L211)

## Custom Workflows and Preprocessing

### Custom Workflows and Preprocessing

Ripgrep allows tailoring search workflows by passing files through custom external preprocessors or automatic decompression layers. The `SearchWorker` inspects each haystack path and determines whether to dispatch the file directly, pipe it through a preprocessor command, or decompress it first. Sources: [crates/core/search.rs:2-8](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/search.rs#L2-L8), [crates/core/search.rs:245-267](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/search.rs#L245-L267)

### Preprocessor and Decompression Execution

When a preprocessor is configured, ripgrep bypasses direct file opening and spawns the external command with the file path as an argument, passing the file contents via standard input. If decompression is enabled instead, matching archives are automatically decompressed before matching occurs. Sources: [crates/core/search.rs:296-339](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/search.rs#L296-L339)

The preprocessing and decompression logic follows this exact evaluation order within `SearchWorker::search()`:
`SearchWorker::search()` → checks `haystack.is_stdin()` → `self.should_preprocess(path)` → `self.should_decompress(path)` → falls back to `self.search_path(path)`. Sources: [crates/core/search.rs:258-266](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/search.rs#L258-L266)

> [!NOTE]
> If a preprocessor command is explicitly configured via `SearchWorkerBuilder::preprocessor()`, it completely overrides any enabled `search_zip` decompression settings for matching files. Sources: [crates/core/search.rs:120-122](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/search.rs#L120-L122)

### Preprocessor Configuration Rules

The preprocessor subsystem evaluates glob filters to determine whether a given file path should be processed externally or read natively. Sources: [crates/core/search.rs:284-292](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/search.rs#L284-L292)

| Method / Field | Purpose / Operation |
| :--- | :--- |
| `SearchWorkerBuilder::preprocessor()` | Resolves and sets the external binary path for processing input files. Sources: [crates/core/search.rs:92-103](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/search.rs#L92-L103) |
| `SearchWorkerBuilder::preprocessor_globs()` | Sets override globs determining which files are routed through the preprocessor. Sources: [crates/core/search.rs:108-114](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/search.rs#L108-L114) |
| `SearchWorkerBuilder::search_zip()` | Enables decompression and searching of recognized common compressed files. Sources: [crates/core/search.rs:123-129](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/search.rs#L123-L129) |
| `SearchWorker::should_preprocess()` | Evaluates whether `preprocessor` is set and whether `preprocessor_globs` matches the path. Sources: [crates/core/search.rs:284-292](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/search.rs#L284-L292) |

Sources: [crates/core/search.rs:92-129](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/search.rs#L92-L129), [crates/core/search.rs:284-292](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/search.rs#L284-L292)

## Related

- [[Overview]]
- [[Project Structure]]

