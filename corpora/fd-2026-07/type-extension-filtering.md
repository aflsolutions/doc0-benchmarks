# Type & Extension Filtering

<details>
<summary>Relevant source files</summary>

The following files were used as context for generating this wiki page:

- [src/main.rs](https://github.com/sharkdp/fd/blob/main/src/main.rs)
- [src/cli.rs](https://github.com/sharkdp/fd/blob/main/src/cli.rs)
- [README.md](https://github.com/sharkdp/fd/blob/main/README.md)
- [src/walk.rs](https://github.com/sharkdp/fd/blob/main/src/walk.rs)
- [src/fmt/mod.rs](https://github.com/sharkdp/fd/blob/main/src/fmt/mod.rs)
- [Cargo.toml](https://github.com/sharkdp/fd/blob/main/Cargo.toml)
- [src/filter/owner.rs](https://github.com/sharkdp/fd/blob/main/src/filter/owner.rs)
- [src/filetypes.rs](https://github.com/sharkdp/fd/blob/main/src/filetypes.rs)
- [src/filter/size.rs](https://github.com/sharkdp/fd/blob/main/src/filter/size.rs)
- [doc/sponsors.md](https://github.com/sharkdp/fd/blob/main/doc/sponsors.md)
- [src/filesystem.rs](https://github.com/sharkdp/fd/blob/main/src/filesystem.rs)
- [src/filter/mod.rs](https://github.com/sharkdp/fd/blob/main/src/filter/mod.rs)
- [src/config.rs](https://github.com/sharkdp/fd/blob/main/src/config.rs)
- [doc/screencast.sh](https://github.com/sharkdp/fd/blob/main/doc/screencast.sh)
</details>

## Overview

Type and extension filtering in `fd` provides a mechanism for restricting filesystem search results by target entry category and filename extensions. By mapping user-supplied command-line arguments to structured internal configurations, the filtering system enables precise targeting of regular files, directories, symbolic links, executables, and special devices alongside case-insensitive extension matching. This capability integrates directly into the parallel directory traversal pipeline to evaluate discovered filesystem entries efficiently and works in concert with metadata-based filters for size, time, and ownership.

Sources: [src/main.rs:333-360](https://github.com/sharkdp/fd/blob/main/src/main.rs#L333-L360), [src/cli.rs:333-393](https://github.com/sharkdp/fd/blob/main/src/cli.rs#L333-L393), [src/filetypes.rs:8-18](https://github.com/sharkdp/fd/blob/main/src/filetypes.rs#L8-L18), [src/walk.rs:526-555](https://github.com/sharkdp/fd/blob/main/src/walk.rs#L526-L555)

## CLI Option Parsing and Flag Mapping

### CLI Option Parsing and Flag Mapping

Configuration initialization begins in `run()` within `src/main.rs`, which invokes `Opts::parse()` via `clap` to populate the command-line options structure defined in `src/cli.rs`. Once arguments are parsed, `construct_config` translates user-provided type and extension flags into runtime settings stored in the `Config` struct.

Sources: [src/main.rs:76-102](https://github.com/sharkdp/fd/blob/main/src/main.rs#L76-L102), [src/cli.rs:21-32](https://github.com/sharkdp/fd/blob/main/src/cli.rs#L21-L32), [src/config.rs:14-136](https://github.com/sharkdp/fd/blob/main/src/config.rs#L14-L136)

### File Type and Extension Flag Mapping

The `construct_config` function maps `opts.filetype` (an optional `Vec<FileType>`) into an optional `FileTypes` bitmask structure. Similarly, `opts.extensions` is compiled into a case-insensitive `RegexSet`.

```rust
        file_types: opts.filetype.as_ref().map(|values| {
            use crate::cli::FileType::*;
            let mut file_types = FileTypes::default();
            for value in values {
                match value {
                    File => file_types.files = true,
                    Directory => file_types.directories = true,
                    Symlink => file_types.symlinks = true,
                    Executable => {
                        file_types.executables_only = true;
                        file_types.files = true;
                    }
                    Empty => file_types.empty_only = true,
                    BlockDevice => file_types.block_devices = true,
                    CharDevice => file_types.char_devices = true,
                    Socket => file_types.sockets = true,
                    Pipe => file_types.pipes = true,
                }
            }

            // If only 'empty' was specified, search for both files and directories:
            if file_types.empty_only && !(file_types.files || file_types.directories) {
                file_types.files = true;
                file_types.directories = true;
            }

            file_types
        }),
        extensions: opts
            .extensions
            .as_ref()
            .map(|exts| {
                let patterns = exts
                    .iter()
                    .map(|e| e.trim_start_matches('.'))
                    .map(|e| format!(r".\.{}$", regex::escape(e)));
                RegexSetBuilder::new(patterns)
                    .case_insensitive(true)
                    .build()
            })
            .transpose()?,
```

Sources: [src/main.rs:333-373](https://github.com/sharkdp/fd/blob/main/src/main.rs#L333-L373)

### CLI Argument Reference Table

The command-line flags and their corresponding options for filtering types and extensions are detailed below.

| CLI Flag / Short | Long Argument | Value Name | Description / Behavior |
| :--- | :--- | :--- | :--- |
| `-t` | `--type` | `filetype` | Filter by file type (`file`, `dir`, `symlink`, `executable`, `empty`, `socket`, `pipe`, `char-device`, `block-device`). |
| `-e` | `--extension` | `ext` | Filter results by extension, trimming leading dots and matching case-insensitively. |

Sources: [src/cli.rs:367-393](https://github.com/sharkdp/fd/blob/main/src/cli.rs#L367-L393)

> [!NOTE]
> The `--type executable` flag implicitly sets `file_types.files = true`, ensuring that executable checks apply correctly to regular files. Likewise, specifying `--type empty` without explicit file or directory types will automatically target both regular files and directories.

Sources: [src/main.rs:342-357](https://github.com/sharkdp/fd/blob/main/src/main.rs#L342-L357)

## FileTypes Data Structures and Representation

### Overview

The `filetypes` module defines the core data structures used to evaluate and filter directory entries against requested target types. At its center is the `FileTypes` struct, which acts as a collection of boolean flags controlling which entry categories should be retained or ignored during traversal. 

Sources: [src/filetypes.rs:6-18](https://github.com/sharkdp/fd/blob/main/src/filetypes.rs#L6-L18)

### FileTypes Structure Representation

The `FileTypes` structure uses standard boolean fields derived from the `Default` trait to track target categories. The fields govern whether files, directories, symlinks, special devices, sockets, pipes, executables, or empty entries are accepted.

```rust
#[derive(Default)]
pub struct FileTypes {
    pub files: bool,
    pub directories: bool,
    pub symlinks: bool,
    pub block_devices: bool,
    pub char_devices: bool,
    pub sockets: bool,
    pub pipes: bool,
    pub executables_only: bool,
    pub empty_only: bool,
}
```

Sources: [src/filetypes.rs:6-18](https://github.com/sharkdp/fd/blob/main/src/filetypes.rs#L6-L18)

### Entry Evaluation Flow

The `should_inspect` or `should_ignore` evaluation logic is encapsulated within an implementation block on `FileTypes`. The `should_ignore` method takes a reference to a `dir_entry::DirEntry` and returns a boolean value indicating whether the entry violates the type filters.

```rust
impl FileTypes {
    pub fn should_ignore(&self, entry: &dir_entry::DirEntry) -> bool {
        if let Some(ref entry_type) = entry.file_type() {
            (!self.files && entry_type.is_file())
                || (!self.directories && entry_type.is_dir())
                || (!self.symlinks && entry_type.is_symlink())
                || (!self.block_devices && filesystem::is_block_device(*entry_type))
                || (!self.char_devices && filesystem::is_char_device(*entry_type))
                || (!self.sockets && filesystem::is_socket(*entry_type))
                || (!self.pipes && filesystem::is_pipe(*entry_type))
                || (self.executables_only && !entry.path().executable())
                || (self.empty_only && !filesystem::is_empty(entry))
                || !(entry_type.is_file()
                    || entry_type.is_dir()
                    || entry_type.is_symlink()
                    || filesystem::is_block_device(*entry_type)
                    || filesystem::is_char_device(*entry_type)
                    || filesystem::is_socket(*entry_type)
                    || filesystem::is_pipe(*entry_type))
        } else {
            true
        }
    }
}
```

Sources: [src/filetypes.rs:20-43](https://github.com/sharkdp/fd/blob/main/src/filetypes.rs#L20-L43)

### FileTypes Field Mapping Reference

The configuration fields and their functional roles inside `FileTypes` are outlined below.

| Field Name | Type | Default Value | Purpose |
| :--- | :--- | :--- | :--- |
| `files` | `bool` | `false` | Controls inclusion of regular files. |
| `directories` | `bool` | `false` | Controls inclusion of directory entries. |
| `symlinks` | `bool` | `false` | Controls inclusion of symbolic links. |
| `block_devices` | `bool` | `false` | Controls inclusion of block device files. |
| `char_devices` | `bool` | `false` | Controls inclusion of character device files. |
| `sockets` | `bool` | `false` | Controls inclusion of Unix domain sockets. |
| `pipes` | `bool` | `false` | Controls inclusion of named pipes (FIFOs). |
| `executables_only` | `bool` | `false` | Restricts matches to executable files. |
| `empty_only` | `bool` | `false` | Restricts matches to empty files or directories. |

Sources: [src/filetypes.rs:7-18](https://github.com/sharkdp/fd/blob/main/src/filetypes.rs#L7-L18)

> [!WARNING]
> If an entry's underlying file type cannot be determined from metadata (`entry.file_type()` returns `None`), `should_ignore` immediately short-circuits and returns `true`, skipping the entry entirely.

Sources: [src/filetypes.rs:39-41](https://github.com/sharkdp/fd/blob/main/src/filetypes.rs#L39-L41)

## Traversal Integration and Entry Evaluation

### Overview

Parallel filesystem traversal and entry evaluation are managed by the `WorkerState` and `ReceiverBuffer` structures within the walk pipeline. The walker processes filesystem entries concurrently using background threads supplied by the `ignore` crate, invoking a closure for each discovered path to test exclusion rules, depth constraints, name patterns, file types, extensions, size constraints, and time filters before sending qualifying items over a bounded channel to the receiver thread.

Sources: [src/walk.rs:146-249](https://github.com/sharkdp/fd/blob/main/src/walk.rs#L146-L249), [src/walk.rs:306-614](https://github.com/sharkdp/fd/blob/main/src/walk.rs#L306-L614)

### Pipeline Execution Walkthrough

The traversal and filtering pipeline executes through a sequence of specific methods across worker setup, parallel iteration, and result buffering:

1. `scan()` initializes search paths, sets up signal handlers, creates a bounded channel, and invokes `WorkerState::receive()` and `WorkerState::spawn_senders()`.
2. `spawn_senders()` configures a parallel walk builder via `build_walker()`, defining hidden file handling, git ignore options, custom ignore files, and thread limits.
3. `walker.run()` executes the parallel traversal across worker threads, passing each encountered entry through a filtering closure.
4. The closure checks `ignore_contain` directories, root depth, and error types (such as broken symlinks), then applies string matching, extension checks, and `file_types.should_ignore(&entry)`.
5. Surviving entries are encapsulated in `WorkerResult::Entry` and sent via `BatchSender::send()` into the bounded channel.
6. `ReceiverBuffer::process()` polls the receiver channel, buffering results temporarily or streaming them directly to standard output depending on elapsed time and buffer length.

Sources: [src/walk.rs:146-303](https://github.com/sharkdp/fd/blob/main/src/walk.rs#L146-L303), [src/walk.rs:443-614](https://github.com/sharkdp/fd/blob/main/src/walk.rs#L443-L614), [src/walk.rs:616-653](https://github.com/sharkdp/fd/blob/main/src/walk.rs#L616-L653)

### Pipeline Configuration and Control Constants

The traversal pipeline relies on several configuration constants and walk states to manage buffer capacities, throttling limits, and traversal flow.

| Constant / Enum | Value / Variant | Purpose |
| :--- | :--- | :--- |
| `MAX_BUFFER_LENGTH` | `1000` | Maximum number of results buffered before flushing to the console during early sorting. |
| `DEFAULT_MAX_BUFFER_TIME` | `100ms` | Default duration that output buffering remains active before switching to streaming mode. |
| `ReceiverMode::Buffering` | Enum Variant | Receiver is buffering results to sort them if the search finishes quickly. |
| `ReceiverMode::Streaming` | Enum Variant | Receiver is directly printing results to standard output. |
| `WorkerResult::Entry` | Enum Variant | Wraps a successfully filtered `DirEntry`. |
| `WorkerResult::Error` | Enum Variant | Wraps an `ignore::Error` encountered during traversal. |

Sources: [src/walk.rs:27-45](https://github.com/sharkdp/fd/blob/main/src/walk.rs#L27-L45), [src/walk.rs:124-128](https://github.com/sharkdp/fd/blob/main/src/walk.rs#L124-L128)

> [!NOTE]
> During parallel execution, `BatchSender` limits batch sizes to 1 when `--exec` is active with multiple threads to evenly distribute work across receivers, whereas standard streaming defaults to a batch limit of `0x100`.

Sources: [src/walk.rs:449-457](https://github.com/sharkdp/fd/blob/main/src/walk.rs#L449-L457)

### Search String Resolution and Path Handling

When evaluating name patterns, `search_str_for_entry` determines whether to match against the file name or the full path based on whether `full_path_base` is configured. If a base path is provided and the entry path is relative, it joins the relative path onto the base path; otherwise, it extracts the file name from the entry path.

```rust
fn search_str_for_entry<'a>(
    entry_path: &'a std::path::Path,
    full_path_base: Option<&std::path::Path>,
) -> Cow<'a, OsStr> {
    if let Some(cwd) = full_path_base {
        if entry_path.is_absolute() {
            return Cow::Borrowed(entry_path.as_os_str());
        }
        let path = entry_path.strip_prefix(".").unwrap_or(entry_path);
        Cow::Owned(cwd.join(path).into())
    } else {
        match entry_path.file_name() {
            Some(filename) => Cow::Borrowed(filename),
            None => unreachable!(
                "Encountered file system entry without a file name..."
            ),
        }
    }
}
```

Sources: [src/walk.rs:656-678](https://github.com/sharkdp/fd/blob/main/src/walk.rs#L656-L678)

> [!WARNING]
> Path traversal aborts with an `unreachable!` panic if an entry without a file name (such as `/` or `foo/bar/..`) is evaluated without an absolute base path, as these paths are expected to be filtered out prior to evaluation.

Sources: [src/walk.rs:671-677](https://github.com/sharkdp/fd/blob/main/src/walk.rs#L671-L677)

## Filter Subsystem Integration and Composition

### Overview

Beyond basic file type and extension matchers, `fd` composes metadata-based filters into the traversal pipeline. These filters inspect filesystem metadata such as file size, modification time, and user/group ownership. Each filter subsystem parses command-line strings into robust internal enums during initialization, which are subsequently evaluated against filesystem metadata (`std::fs::Metadata`) for each matching entry.

Sources: [src/filter/owner.rs:1-74](https://github.com/sharkdp/fd/blob/main/src/filter/owner.rs#L1-L74), [src/filter/size.rs:1-75](https://github.com/sharkdp/fd/blob/main/src/filter/size.rs#L1-L75), [src/config.rs:106-115](https://github.com/sharkdp/fd/blob/main/src/config.rs#L106-L115)

### Size and Owner Filter Structures

The `SizeFilter` enum evaluates file lengths against maximum, minimum, or exact equality thresholds using binary and SI unit prefixes. The `OwnerFilter` struct on Unix platforms evaluates UID and GID constraints using equality, negation, or ignore modes.

| Filter Enum / Struct | Variants / Fields | Value / Meaning |
| :--- | :--- | :--- |
| `SizeFilter` | `Max(u64)` | Matches files with size less than or equal to limit. |
| `SizeFilter` | `Min(u64)` | Matches files with size greater than or equal to limit. |
| `SizeFilter` | `Equals(u64)` | Matches files with size exactly equal to limit. |
| `OwnerFilter` | `uid: Check<u32>` | User ID matching constraint (`Equal`, `NotEq`, or `Ignore`). |
| `OwnerFilter` | `gid: Check<u32>` | Group ID matching constraint (`Equal`, `NotEq`, or `Ignore`). |

Sources: [src/filter/owner.rs:5-16](https://github.com/sharkdp/fd/blob/main/src/filter/owner.rs#L5-L16), [src/filter/size.rs:8-13](https://github.com/sharkdp/fd/blob/main/src/filter/size.rs#L8-L13)

### Filter Evaluation Call-Chain Walkthrough

When an entry passes path and type screening, metadata filters are executed through specific methods across the filter subsystems:

1. `OwnerFilter::matches(md: &fs::Metadata) -> bool`: Invokes `self.uid.check(md.uid())` and `self.gid.check(md.gid())` utilizing Unix metadata extensions.
2. `Check<T>::check(v: T) -> bool`: Evaluates `v` against internal comparison states (`Check::Equal(x)` checks `v == *x`, `Check::NotEq(x)` checks `v != *x`, and `Check::Ignore` returns `true`).
3. `SizeFilter::is_within(size: u64) -> bool`: Evaluates file size against `SizeFilter::Max`, `SizeFilter::Min`, or `SizeFilter::Equals` bounds.

Sources: [src/filter/owner.rs:69-83](https://github.com/sharkdp/fd/blob/main/src/filter/owner.rs#L69-L83), [src/filter/size.rs:68-74](https://github.com/sharkdp/fd/blob/main/src/filter/size.rs#L68-L74)

> [!NOTE]
> `SizeFilter::from_string` uses a lazily-initialized `OnceLock<Regex>` (`SIZE_CAPTURES`) matching `(?i)^([+-]?)(\d+)(b|[kmgt]i?b?)$` to parse limits and multipliers like `kibi` (1024) versus `kilo` (1000).

Sources: [src/filter/size.rs:1-7](https://github.com/sharkdp/fd/blob/main/src/filter/size.rs#L1-L7), [src/filter/size.rs:33-58](https://github.com/sharkdp/fd/blob/main/src/filter/size.rs#L33-L58)

### Subsystem Design Trade-Offs

| Design Choice | Benefit | Cost |
| :--- | :--- | :--- |
| **Lazy Regex Initialization** (`OnceLock`) | Defers compilation overhead until size constraints are actually parsed from CLI arguments. | Introduces minor atomic synchronization checks on first parse invocation. |
| **Separated UID/GID `Check` Enum** | Reuses identical logic for positive, negative, and wildcard owner filters. | Requires nested pattern matching for each metadata inspection call. |
| **Explicit SI and Binary Multipliers** | Supports precise user expectations for both decimal (`1k` = 1000) and binary (`1ki` = 1024) file sizes. | Expands parsing branch complexity across regex capture groups. |

Sources: [src/filter/owner.rs:5-16](https://github.com/sharkdp/fd/blob/main/src/filter/owner.rs#L5-L16), [src/filter/owner.rs:76-103](https://github.com/sharkdp/fd/blob/main/src/filter/owner.rs#L76-L103), [src/filter/size.rs:1-66](https://github.com/sharkdp/fd/blob/main/src/filter/size.rs#L1-L66)

## Related

- [[Parallel Directory Traversal]]
- [[File Size Filtering]]

