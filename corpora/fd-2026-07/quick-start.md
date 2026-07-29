# Quick Start

<details>
<summary>Relevant source files</summary>

The following files were used as context for generating this wiki page:

- [src/main.rs](https://github.com/sharkdp/fd/blob/main/src/main.rs)
- [README.md](https://github.com/sharkdp/fd/blob/main/README.md)
- [src/cli.rs](https://github.com/sharkdp/fd/blob/main/src/cli.rs)
- [src/walk.rs](https://github.com/sharkdp/fd/blob/main/src/walk.rs)
- [Cargo.toml](https://github.com/sharkdp/fd/blob/main/Cargo.toml)
- [scripts/create-deb.sh](https://github.com/sharkdp/fd/blob/main/scripts/create-deb.sh)
- [CONTRIBUTING.md](https://github.com/sharkdp/fd/blob/main/CONTRIBUTING.md)
- [doc/release-checklist.md](https://github.com/sharkdp/fd/blob/main/doc/release-checklist.md)
- [contrib/completion/fdfind.bash](https://github.com/sharkdp/fd/blob/main/contrib/completion/fdfind.bash)
- [doc/screencast.sh](https://github.com/sharkdp/fd/blob/main/doc/screencast.sh)
- [doc/sponsors.md](https://github.com/sharkdp/fd/blob/main/doc/sponsors.md)
- [SECURITY.md](https://github.com/sharkdp/fd/blob/main/SECURITY.md)
- [src/config.rs](https://github.com/sharkdp/fd/blob/main/src/config.rs)
</details>

## Overview

`fd` is a simple, fast, and user-friendly command-line tool designed to find entries in a filesystem as a modern alternative to `find`. By relying on opinionated defaults, it performs parallelized directory searches using regular expression or glob-based patterns while automatically ignoring hidden directories and VCS ignore rules like `.gitignore`. Sources: [README.md:8-29](https://github.com/sharkdp/fd/blob/main/README.md#L8-L29)

The application architecture coordinates command-line option parsing, robust runtime configuration construction, multi-threaded filesystem traversal, and shell integration. This page documents the underlying mechanisms that govern compilation, distribution scripts, argument parsing, recursive parallel traversal, and terminal shell completions. Sources: [src/main.rs:75-112](https://github.com/sharkdp/fd/blob/main/src/main.rs#L75-L112)

## Source Building and Cargo Setup

Building `fd` from source requires Rust version `1.90.0` or higher and Cargo, following the specifications defined in `Cargo.toml`. Sources: [Cargo.toml:16-21](https://github.com/sharkdp/fd/blob/main/Cargo.toml#L16-L21)

Sources: [Cargo.toml:16-21](https://github.com/sharkdp/fd/blob/main/Cargo.toml#L16-L21)

The package is configured for edition `2024` under the crate name `fd-find` and binary name `fd`. Sources: [Cargo.toml:16-32](https://github.com/sharkdp/fd/blob/main/Cargo.toml#L16-L32)

Sources: [Cargo.toml:16-32](https://github.com/sharkdp/fd/blob/main/Cargo.toml#L16-L32)

The build configuration declares specific profile optimizations for development and release builds. Sources: [Cargo.toml:79-93](https://github.com/sharkdp/fd/blob/main/Cargo.toml#L79-L93)

Sources: [Cargo.toml:79-93](https://github.com/sharkdp/fd/blob/main/Cargo.toml#L79-L93)

The development profile sets `debug = "line-tables-only"`, while release builds enforce link-time optimization (`lto = true`), binary stripping (`strip = true`), and single codegen units (`codegen-units = 1`). Sources: [Cargo.toml:79-93](https://github.com/sharkdp/fd/blob/main/Cargo.toml#L79-L93)

Sources: [Cargo.toml:79-93](https://github.com/sharkdp/fd/blob/main/Cargo.toml#L79-L93)

Dependencies are partitioned into core runtime requirements, target-specific dependencies, and optional features. Sources: [Cargo.toml:33-72](https://github.com/sharkdp/fd/blob/main/Cargo.toml#L33-L72)

Sources: [Cargo.toml:33-72](https://github.com/sharkdp/fd/blob/main/Cargo.toml#L33-L72)

| Dependency Name | Version / Spec | Purpose | Sources |
|-----------------|----------------|---------|---------|
| `aho-corasick` | `1.1` | Fast multiple substring searching | Sources: [Cargo.toml:34-34](https://github.com/sharkdp/fd/blob/main/Cargo.toml#L34-L34) |
| `nu-ansi-term` | `0.50` | ANSI terminal color support | Sources: [Cargo.toml:35-35](https://github.com/sharkdp/fd/blob/main/Cargo.toml#L35-L35) |
| `argmax` | `0.4.0` | Argument vector length calculation | Sources: [Cargo.toml:36-36](https://github.com/sharkdp/fd/blob/main/Cargo.toml#L36-L36) |
| `ignore` | `0.4.25` | Fast recursive directory traversal and `.gitignore` matching | Sources: [Cargo.toml:37-37](https://github.com/sharkdp/fd/blob/main/Cargo.toml#L37-L37) |
| `regex` | `1.12.2` | Regular expression engine | Sources: [Cargo.toml:38-38](https://github.com/sharkdp/fd/blob/main/Cargo.toml#L38-L38) |
| `regex-syntax` | `0.8` | Regular expression syntax parser | Sources: [Cargo.toml:39-39](https://github.com/sharkdp/fd/blob/main/Cargo.toml#L39-L39) |
| `ctrlc` | `3.5` | Interrupt signal handler | Sources: [Cargo.toml:40-40](https://github.com/sharkdp/fd/blob/main/Cargo.toml#L40-L40) |
| `globset` | `0.4` | Multiple glob pattern matching | Sources: [Cargo.toml:41-41](https://github.com/sharkdp/fd/blob/main/Cargo.toml#L41-L41) |
| `anyhow` | `1.0` | Flexible error handling type | Sources: [Cargo.toml:42-42](https://github.com/sharkdp/fd/blob/main/Cargo.toml#L42-L42) |
| `etcetera` | `0.11` | Home and configuration directory resolution | Sources: [Cargo.toml:43-43](https://github.com/sharkdp/fd/blob/main/Cargo.toml#L43-L43) |
| `normpath` | `1.5.1` | Cross-platform normalized paths | Sources: [Cargo.toml:44-44](https://github.com/sharkdp/fd/blob/main/Cargo.toml#L44-L44) |
| `crossbeam-channel` | `0.5.15` | Multi-producer multi-consumer channels | Sources: [Cargo.toml:45-45](https://github.com/sharkdp/fd/blob/main/Cargo.toml#L45-L45) |
| `clap_complete` | `4.6.5` (optional) | Shell completion generator | Sources: [Cargo.toml:46-46](https://github.com/sharkdp/fd/blob/main/Cargo.toml#L46-L46) |
| `faccess` | `0.2.4` | File accessibility checks | Sources: [Cargo.toml:47-47](https://github.com/sharkdp/fd/blob/main/Cargo.toml#L47-L47) |
| `jiff` | `0.2.27` | Date and time library | Sources: [Cargo.toml:48-48](https://github.com/sharkdp/fd/blob/main/Cargo.toml#L48-L48) |
| `clap` | `4.6.1` | Command line argument parser (`suggestions`, `color`, `wrap_help`, `cargo`, `derive`) | Sources: [Cargo.toml:50-53](https://github.com/sharkdp/fd/blob/main/Cargo.toml#L50-L53) |
| `lscolors` | `0.21` | LS_COLORS file type styling | Sources: [Cargo.toml:54-58](https://github.com/sharkdp/fd/blob/main/Cargo.toml#L54-L58) |
| `nix` | `0.31.1` (Unix target) | Unix system APIs (`signal`, `user`, `hostname`) | Sources: [Cargo.toml:59-60](https://github.com/sharkdp/fd/blob/main/Cargo.toml#L59-L60) |
| `libc` | `0.2` (Non-redox Unix target) | Native C bindings | Sources: [Cargo.toml:62-63](https://github.com/sharkdp/fd/blob/main/Cargo.toml#L62-L63) |
| `tikv-jemallocator` | `0.7.0` (optional) | High-performance memory allocator | Sources: [Cargo.toml:70-71](https://github.com/sharkdp/fd/blob/main/Cargo.toml#L70-L71) |

> [!NOTE]
> `tikv-jemallocator` is conditionally compiled on supported Unix targets, but is explicitly excluded on macOS, Windows, Android, FreeBSD, OpenBSD, Illumos, 32-bit musl environments, and RISC-V 64-bit architectures. Sources: [Cargo.toml:70-71](https://github.com/sharkdp/fd/blob/main/Cargo.toml#L70-L71)

## Package Creation and Distribution Scripts

Package creation and distribution leverage automated shell scripts and release checklists to bundle binaries, man pages, shell completions, and license documentation into valid Debian packages (`.deb`) and official GitHub releases. Sources: [scripts/create-deb.sh](https://github.com/sharkdp/fd/blob/main/scripts/create-deb.sh#L1-L136)

Sources: [scripts/create-deb.sh](https://github.com/sharkdp/fd/blob/main/scripts/create-deb.sh#L1-L136)

The script `scripts/create-deb.sh` stages files inside a temporary directory and compiles them using `dpkg-deb`. Sources: [scripts/create-deb.sh:5-37](https://github.com/sharkdp/fd/blob/main/scripts/create-deb.sh#L5-L37)

Sources: [scripts/create-deb.sh:5-37](https://github.com/sharkdp/fd/blob/main/scripts/create-deb.sh#L5-L37)

The target architecture and base package names are dynamically resolved based on environment variables and rust host triplets. Sources: [scripts/create-deb.sh:9-35](https://github.com/sharkdp/fd/blob/main/scripts/create-deb.sh#L9-L35)

Sources: [scripts/create-deb.sh:9-35](https://github.com/sharkdp/fd/blob/main/scripts/create-deb.sh#L9-L35)

| Target Match Pattern | DPKG Base Name | Conflicts List | Architecture Mapping | Sources |
|---------------------|----------------|----------------|----------------------|---------|
| `*-musl*` | `fd-musl` | `fd, fd-find` | Resolved via target pattern | Sources: [scripts/create-deb.sh:13-35](https://github.com/sharkdp/fd/blob/main/scripts/create-deb.sh#L13-L35) |
| Default / Other | `fd` | `fd-musl, fd-find` | `arm64`, `armf`, `i686`, `amd64`, `notset` | Sources: [scripts/create-deb.sh:18-35](https://github.com/sharkdp/fd/blob/main/scripts/create-deb.sh#L18-L35) |

> [!NOTE]
> The Debian package creation script automatically sets up alternative binary symlinks and completion files for `fdfind` alongside `fd` to support Debian/Ubuntu naming conventions. Sources: [scripts/create-deb.sh:60-65](https://github.com/sharkdp/fd/blob/main/scripts/create-deb.sh#L60-L65)

Releasing new versions follows a structured checklist partitioned into four sequential phases: version bump, pre-release checks, release execution, and post-release cleanup. Sources: [doc/release-checklist.md:6-70](https://github.com/sharkdp/fd/blob/main/doc/release-checklist.md#L6-L70)

Sources: [doc/release-checklist.md:6-70](https://github.com/sharkdp/fd/blob/main/doc/release-checklist.md#L6-L70)

1. **Version bump**: Update `Cargo.toml`, regenerate `Cargo.lock`, update documentation references, and update `CHANGELOG.md`. Sources: [doc/release-checklist.md:6-19](https://github.com/sharkdp/fd/blob/main/doc/release-checklist.md#L6-L19)
2. **Pre-release checks and updates**: Install the candidate build locally, review man pages and help outputs via `gawk -i inplace -f scripts/update-help.awk README.md`, and execute `cargo publish --dry-run`. Sources: [doc/release-checklist.md:20-34](https://github.com/sharkdp/fd/blob/main/doc/release-checklist.md#L20-L34)
3. **Release**: Merge the release branch, tag the commit with `git tag vX.Y.Z; git push origin tag vX.Y.Z`, create the GitHub release, and publish to crates.io. Sources: [doc/release-checklist.md:35-51](https://github.com/sharkdp/fd/blob/main/doc/release-checklist.md#L35-L51)
4. **Post-release**: Prepare a new empty *"Upcoming release"* section at the top of `CHANGELOG.md` with subsections for `Features`, `Bugfixes`, `Changes`, and `Other`. Sources: [doc/release-checklist.md:52-70](https://github.com/sharkdp/fd/blob/main/doc/release-checklist.md#L52-L70)

> [!WARNING]
> Publishing to crates.io must be performed from a clean repository clone to ensure local uncommitted edits or untracked artifacts do not corrupt the published package crate. Sources: [doc/release-checklist.md:49-50](https://github.com/sharkdp/fd/blob/main/doc/release-checklist.md#L49-L50)

## Command Line Interface Argument Parsing

The command-line interface argument parser processes user options, configuration flags, and root search paths, initializing the options structure through `clap` derive macros and post-processing them into validated search paths and regex compilation units. Sources: [src/main.rs:75-112](https://github.com/sharkdp/fd/blob/main/src/main.rs#L75-L112)

Sources: [src/main.rs:75-112](https://github.com/sharkdp/fd/blob/main/src/main.rs#L75-L112)

Executing search queries follows a precise call sequence through core entry points that parse command-line arguments, configure working environments, compile regular expressions, and initiate filesystem traversal. Sources: [src/main.rs:75-112](https://github.com/sharkdp/fd/blob/main/src/main.rs#L75-L112)

Sources: [src/main.rs:75-112](https://github.com/sharkdp/fd/blob/main/src/main.rs#L75-L112)

1. `Opts::parse()`: Invokes `clap` argument parsing to populate the `Opts` structure from raw environment inputs. Sources: [src/main.rs:76-76](https://github.com/sharkdp/fd/blob/main/src/main.rs#L76-L76)
2. `set_working_dir()`: Inspects `opts.base_directory`, checks if it is an existing directory via `filesystem::is_existing_directory()`, and switches the current process working directory. Sources: [src/main.rs:83-83](https://github.com/sharkdp/fd/blob/main/src/main.rs#L83-L83)
3. `opts.search_paths()`: Resolves target root paths or falls back to `./`, verifying directory existence and normalizing paths via `normalize_path()`. Sources: [src/main.rs:84-84](https://github.com/sharkdp/fd/blob/main/src/main.rs#L84-L84)
4. `ensure_search_pattern_is_not_a_path()`: Validates that primary and `--and` search patterns do not contain path separators unless operating with `--full-path`. Sources: [src/main.rs:89-89](https://github.com/sharkdp/fd/blob/main/src/main.rs#L89-L89)
5. `build_pattern_regex()` & `construct_config()`: Compiles pattern strings based on glob, exact match, or fixed-strings flags and aggregates all filters into a `Config` struct. Sources: [src/main.rs:94-102](https://github.com/sharkdp/fd/blob/main/src/main.rs#L94-L102)
6. `walk::scan()`: Hands the validated search paths, compiled byte regexes, and configuration object to the directory walker. Sources: [src/main.rs:111-111](https://github.com/sharkdp/fd/blob/main/src/main.rs#L111-L111)

> [!WARNING]
> If no valid search paths can be resolved or if `search_paths` returns empty, execution aborts immediately with an error bail. Sources: [src/main.rs:85-87](https://github.com/sharkdp/fd/blob/main/src/main.rs#L85-L87)

The command-line parser accepts multiple specialized types and file categories for filtering search results. Sources: [src/cli.rs:802-853](https://github.com/sharkdp/fd/blob/main/src/cli.rs#L802-L853)

Sources: [src/cli.rs:802-853](https://github.com/sharkdp/fd/blob/main/src/cli.rs#L802-L853)

| Enumeration | Value / Aliases | Description / Behavior | Sources |
|-------------|-----------------|------------------------|---------|
| `FileType::File` | `f` | Regular files | Sources: [src/cli.rs:803-805](https://github.com/sharkdp/fd/blob/main/src/cli.rs#L803-L805) |
| `FileType::Directory` | `d`, `dir` | Directories | Sources: [src/cli.rs:803,806-807](https://github.com/sharkdp/fd/blob/main/src/cli.rs#L803,806-L807) |
| `FileType::Symlink` | `l` | Symbolic links | Sources: [src/cli.rs:803,808-809](https://github.com/sharkdp/fd/blob/main/src/cli.rs#L803,808-L809) |
| `FileType::BlockDevice` | `b` | Block devices | Sources: [src/cli.rs:803,810-811](https://github.com/sharkdp/fd/blob/main/src/cli.rs#L803,810-L811) |
| `FileType::CharDevice` | `c` | Character devices | Sources: [src/cli.rs:803,812-813](https://github.com/sharkdp/fd/blob/main/src/cli.rs#L803,812-L813) |
| `FileType::Executable` | `x` | Executable by the current effective user | Sources: [src/cli.rs:803,814-816](https://github.com/sharkdp/fd/blob/main/src/cli.rs#L803,814-L816) |
| `FileType::Empty` | `e` | Empty files or directories | Sources: [src/cli.rs:803,817-818](https://github.com/sharkdp/fd/blob/main/src/cli.rs#L803,817-818) |
| `FileType::Socket` | `s` | Sockets | Sources: [src/cli.rs:803,819-820](https://github.com/sharkdp/fd/blob/main/src/cli.rs#L803,819-820) |
| `FileType::Pipe` | `p` | Named pipes (FIFO) | Sources: [src/cli.rs:803,821-822](https://github.com/sharkdp/fd/blob/main/src/cli.rs#L803,821-822) |
| `ColorWhen` | `Auto`, `Always`, `Never` | Display mode for terminal coloring | Sources: [src/cli.rs:825-833](https://github.com/sharkdp/fd/blob/main/src/cli.rs#L825-L833) |
| `StripCwdWhen` | `Auto`, `Always`, `Never` | Control stripping of `./` prefixes | Sources: [src/cli.rs:835-843](https://github.com/sharkdp/fd/blob/main/src/cli.rs#L835-L843) |
| `HyperlinkWhen` | `Auto`, `Always`, `Never` | Control file:// hyperlink generation | Sources: [src/cli.rs:845-853](https://github.com/sharkdp/fd/blob/main/src/cli.rs#L845-L853) |

> [!TIP]
> Specifying `--type executable` implicitly sets the file type filter to require regular files (`file_types.files = true`), while `--type empty` searches both empty files and directories unless explicitly restricted. Sources: [src/main.rs:341-357](https://github.com/sharkdp/fd/blob/main/src/main.rs#L341-L357)

## Runtime Configuration and Walk Execution

`fd` delegates filesystem traversal to the `ignore` crate through a parallel walker wrapper defined in `src/walk.rs`. Sources: [src/walk.rs:14-15](https://github.com/sharkdp/fd/blob/main/src/walk.rs#L14-L15)

Sources: [src/walk.rs:14-15](https://github.com/sharkdp/fd/blob/main/src/walk.rs#L14-L15)

The runtime system manages configuration parameters, multi-threaded worker pools, and output buffering modes. Sources: [src/config.rs:14-136](https://github.com/sharkdp/fd/blob/main/src/config.rs#L14-L136)

Sources: [src/config.rs:14-136](https://github.com/sharkdp/fd/blob/main/src/config.rs#L14-L136)

The traversal lifecycle coordinates configuration structures, walker setup, and worker distribution across multiple threads in a defined sequence: Sources: [src/walk.rs:617-687](https://github.com/sharkdp/fd/blob/main/src/walk.rs#L617-L687)

Sources: [src/walk.rs:617-687](https://github.com/sharkdp/fd/blob/main/src/walk.rs#L617-L687)

1. `walk::scan()`: Instantiates a new `WorkerState` containing the compiled regex patterns and `Config` parameters. Sources: [src/walk.rs:685-687](https://github.com/sharkdp/fd/blob/main/src/walk.rs#L685-L687)
2. `WorkerState::scan()`: Builds the parallel walker via `build_walker()`, configures a Ctrl-C signal handler if colors and printing are enabled, establishes a bounded channel, and invokes thread scoping. Sources: [src/walk.rs:617-646](https://github.com/sharkdp/fd/blob/main/src/walk.rs#L617-L646)
3. `WorkerState::build_walker()`: Sets hidden file options, ignore files (`.fdignore`, gitignore, global ignore), depth bounds, symlink following, and file system boundaries on a `WalkBuilder` instance. Sources: [src/walk.rs:347-404](https://github.com/sharkdp/fd/blob/main/src/walk.rs#L347-L404)
4. `WorkerState::spawn_senders()`: Executes the parallel walker thread pool, filtering entries against patterns, extensions, file types, sizes, times, and owner constraints before batching results into the channel via `BatchSender::send()`. Sources: [src/walk.rs:443-614](https://github.com/sharkdp/fd/blob/main/src/walk.rs#L443-L614)
5. `WorkerState::receive()`: Manages output consumption either by executing parallel batch or job commands (`exec::batch` / `exec::job`) or by running `ReceiverBuffer::process()`. Sources: [src/walk.rs:408-440](https://github.com/sharkdp/fd/blob/main/src/walk.rs#L408-L440)
6. `ReceiverBuffer::process()`: Buffers quick results up to `DEFAULT_MAX_BUFFER_TIME` (100ms) or `MAX_BUFFER_LENGTH` (1000 items) to enable sorted output before switching to direct streaming mode. Sources: [src/walk.rs:124-127](https://github.com/sharkdp/fd/blob/main/src/walk.rs#L124-L127)

> [!NOTE]
> If execution completes within `max_buffer_time`, `ReceiverBuffer::stop()` sorts the collected entry buffer alphabetically before streaming them to standard output. Sources: [src/walk.rs:282-286](https://github.com/sharkdp/fd/blob/main/src/walk.rs#L282-L286)

The `Config` struct consolidates all execution flags derived from CLI arguments and environment parameters. Sources: [src/config.rs:14-136](https://github.com/sharkdp/fd/blob/main/src/config.rs#L14-L136)

Sources: [src/config.rs:14-136](https://github.com/sharkdp/fd/blob/main/src/config.rs#L14-L136)

| Field | Type | Default Source / Context | Purpose | Sources |
|-------|------|--------------------------|---------|---------|
| `case_sensitive` | `bool` | `!opts.ignore_case && (opts.case_sensitive \|\| has_upper)` | Controls case sensitivity | Sources: [src/main.rs:251-255](https://github.com/sharkdp/fd/blob/main/src/main.rs#L251-L255) |
| `ignore_hidden` | `bool` | `!(opts.hidden \|\| opts.rg_alias_ignore())` | Skip hidden files and directories | Sources: [src/main.rs:313-313](https://github.com/sharkdp/fd/blob/main/src/main.rs#L313-L313) |
| `read_fdignore` | `bool` | `!(opts.no_ignore \|\| opts.rg_alias_ignore())` | Respect `.fdignore` files | Sources: [src/main.rs:314-314](https://github.com/sharkdp/fd/blob/main/src/main.rs#L314-L314) |
| `follow_links` | `bool` | `opts.follow` | Follow symbolic links | Sources: [src/main.rs:321-321](https://github.com/sharkdp/fd/blob/main/src/main.rs#L321-L321) |
| `max_buffer_time` | `Option<Duration>` | `opts.max_buffer_time` | Output buffering duration limit | Sources: [src/main.rs:329-329](https://github.com/sharkdp/fd/blob/main/src/main.rs#L329-L329) |
| `batch_size` | `usize` | `opts.batch_size` | Results per command invocation | Sources: [src/main.rs:379-379](https://github.com/sharkdp/fd/blob/main/src/main.rs#L379-L379) |

> [!WARNING]
> Pressing `Ctrl-C` once sets the `quit_flag` to terminate worker threads gracefully; pressing it a second time invokes `ExitCode::KilledBySigint.exit()` immediately. Sources: [src/walk.rs:625-632](https://github.com/sharkdp/fd/blob/main/src/walk.rs#L625-L632)

## Shell Completions and Environment Setup

Terminal integration for `fd` involves configuring shell completion scripts and setting up recording automation for screencasts. Sources: [README.md:751-778](https://github.com/sharkdp/fd/blob/main/README.md#L751-L778)

Sources: [README.md:751-778](https://github.com/sharkdp/fd/blob/main/README.md#L751-L778)

Pre-built completion files supplied in release archives or generated dynamically via `fd --gen-completions <shell>` provide command-line tab completion across major shells. Sources: [README.md:751-778](https://github.com/sharkdp/fd/blob/main/README.md#L751-L778)

Sources: [README.md:751-778](https://github.com/sharkdp/fd/blob/main/README.md#L751-L778)

Completion files support Bash, Zsh, Fish, and PowerShell environments. Sources: [README.md:751-761](https://github.com/sharkdp/fd/blob/main/README.md#L751-L761)

Sources: [README.md:751-761](https://github.com/sharkdp/fd/blob/main/README.md#L751-L761)

When installing via Debian-based packages where the binary is named `fdfind`, custom wrapper completion scripts such as `contrib/completion/fdfind.bash` source the main completion file and register the `fdfind` completion command with `complete -F _fd`. Sources: [README.md:545-554](https://github.com/sharkdp/fd/blob/main/README.md#L545-L554), [contrib/completion/fdfind.bash:1-8](https://github.com/sharkdp/fd/blob/main/contrib/completion/fdfind.bash#L1-L8)

| Shell | Release Archive Location | Generation Command | Target Path / Setup Action | Sources |
|-------|--------------------------|--------------------|---------------------------|---------|
| **bash** | `autocomplete/fd.bash` | `fd --gen-completions bash` | Source in `~/.bashrc` or `~/.local/share/bash-completion/completions/fd` | Sources: [README.md:756-769](https://github.com/sharkdp/fd/blob/main/README.md#L756-L769) |
| **zsh** | `autocomplete/_fd` | `fd --gen-completions zsh` | Move to directory in `fpath` (e.g., `~/.zfunc/_fd`) | Sources: [README.md:757-771](https://github.com/sharkdp/fd/blob/main/README.md#L757-L771) |
| **fish** | `autocomplete/fd.fish` | `fd --gen-completions fish` | Copy to `~/.config/fish/completions/fd.fish` | Sources: [README.md:758-774](https://github.com/sharkdp/fd/blob/main/README.md#L758-L774) |
| **powershell** | `autocomplete/_fd.ps1` | `fd --gen-completions powershell` | Source from profile script (`$PROFILE`) | Sources: [README.md:759-777](https://github.com/sharkdp/fd/blob/main/README.md#L759-L777) |

> [!NOTE]
> For Bash version 4.4 and newer, `fdfind` completions configure `complete -F _fd -o nosort -o bashdefault -o default fdfind`, whereas older versions omit `-o nosort`. Sources: [contrib/completion/fdfind.bash:4-8](https://github.com/sharkdp/fd/blob/main/contrib/completion/fdfind.bash#L4-L8)

The terminal recording setup uses `doc/screencast.sh` to simulate interactive command execution for documentation assets. Sources: [doc/screencast.sh:1-64](https://github.com/sharkdp/fd/blob/main/doc/screencast.sh#L1-L64)

Sources: [doc/screencast.sh:1-64](https://github.com/sharkdp/fd/blob/main/doc/screencast.sh#L1-L64)

The script defines helper functions (`prompt`, `enter`, `type`) that coordinate delays, type characters via `pv`, and evaluate commands dynamically. Sources: [doc/screencast.sh:11-31](https://github.com/sharkdp/fd/blob/main/doc/screencast.sh#L11-L31)

Sources: [doc/screencast.sh:11-31](https://github.com/sharkdp/fd/blob/main/doc/screencast.sh#L11-L31)

```bash
enter() {
    INPUT=$1
    DELAY=1

    prompt
    sleep "$DELAY"
    type "$INPUT"
    sleep 0.5
    printf '%b' "\\n"
    eval "$INPUT"
    type "\\n"
}
```
Sources: [doc/screencast.sh:11-22](https://github.com/sharkdp/fd/blob/main/doc/screencast.sh#L11-L22)

The main workflow executes a sequence of search demonstrations, ranging from basic invocation (`enter "fd"`) and extension filtering (`enter "fd -e md"`) to parallel execution (`enter "fd -e md --exec wc -l"`) and exclusion rules (`enter "fd --exclude src"`). Sources: [doc/screencast.sh:32-62](https://github.com/sharkdp/fd/blob/main/doc/screencast.sh#L32-L62)

## Related

- [[Overview]]
- [[Command Line Interface]]

