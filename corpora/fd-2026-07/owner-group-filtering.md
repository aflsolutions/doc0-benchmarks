# Owner & Group Filtering

<details>
<summary>Relevant source files</summary>

The following files were used as context for generating this wiki page:

- [src/main.rs](https://github.com/sharkdp/fd/blob/main/src/main.rs)
- [src/walk.rs](https://github.com/sharkdp/fd/blob/main/src/walk.rs)
- [src/cli.rs](https://github.com/sharkdp/fd/blob/main/src/cli.rs)
- [README.md](https://github.com/sharkdp/fd/blob/main/README.md)
- [src/exec/job.rs](https://github.com/sharkdp/fd/blob/main/src/exec/job.rs)
- [src/exec/mod.rs](https://github.com/sharkdp/fd/blob/main/src/exec/mod.rs)
- [src/filter/owner.rs](https://github.com/sharkdp/fd/blob/main/src/filter/owner.rs)
- [src/fmt/mod.rs](https://github.com/sharkdp/fd/blob/main/src/fmt/mod.rs)
- [src/filter/size.rs](https://github.com/sharkdp/fd/blob/main/src/filter/size.rs)
- [src/filetypes.rs](https://github.com/sharkdp/fd/blob/main/src/filetypes.rs)
- [src/filter/time.rs](https://github.com/sharkdp/fd/blob/main/src/filter/time.rs)
- [src/dir_entry.rs](https://github.com/sharkdp/fd/blob/main/src/dir_entry.rs)
- [src/output.rs](https://github.com/sharkdp/fd/blob/main/src/output.rs)
- [src/filter/mod.rs](https://github.com/sharkdp/fd/blob/main/src/filter/mod.rs)
- [src/regex_helper.rs](https://github.com/sharkdp/fd/blob/main/src/regex_helper.rs)
- [src/fmt/input.rs](https://github.com/sharkdp/fd/blob/main/src/fmt/input.rs)
- [src/filesystem.rs](https://github.com/sharkdp/fd/blob/main/src/filesystem.rs)
- [src/sanitize.rs](https://github.com/sharkdp/fd/blob/main/src/sanitize.rs)
- [src/config.rs](https://github.com/sharkdp/fd/blob/main/src/config.rs)
</details>

## Overview

Owner and group filtering in `fd` provides a robust, Unix-specific mechanism to restrict file system searches based on user and group ownership constraints. By leveraging POSIX metadata retrieval and the `nix` crate for identifier resolution, the subsystem translates human-readable specifiers into efficient numeric UID and GID checks. This capability integrates cleanly into the parallel directory traversal pipeline, coordinating alongside size, time, and filetype filter predicates to evaluate candidates concurrently within worker threads.

Sources: [src/cli.rs:460-474](https://github.com/sharkdp/fd/blob/main/src/cli.rs#L460-L474), [src/filter/owner.rs:1-74](https://github.com/sharkdp/fd/blob/main/src/filter/owner.rs#L1-L74), [src/walk.rs:544-555](https://github.com/sharkdp/fd/blob/main/src/walk.rs#L544-L555)

## CLI Option Parsing for Ownership

### Overview

Command-line option parsing for file ownership filters in `fd` is governed by Unix-conditional CLI flags defined within `Opts`. When a user invokes `fd` with ownership constraints, the command-line argument parser maps the string input to an `OwnerFilter` instance. This parameter is subsequently processed during configuration construction to populate the global search `Config` state.

Sources: [src/cli.rs:460-473](https://github.com/sharkdp/fd/blob/main/src/cli.rs#L460-L473), [src/main.rs:268-270](https://github.com/sharkdp/fd/blob/main/src/main.rs#L268-L270)

### Ownership Argument Mapping

The `--owner` (or short flag `-o`) option takes a single string value adhering to the format `[(user|uid)][:(group|gid)]`, where either side of the colon is optional and exclusion can be requested by preceding either side with an exclamation point (`!`). 

```rust
    #[cfg(unix)]
    #[arg(long, short = 'o', value_parser = OwnerFilter::from_string, value_name = "user:group",
        help = "Filter by owning user and/or group",
        long_help,
        )]
    pub owner: Option<OwnerFilter>,
```
Sources: [src/cli.rs:468-474](https://github.com/sharkdp/fd/blob/main/src/cli.rs#L468-L474)

During initialization in `construct_config`, the raw `owner` field stored in `Opts` is extracted and sanitized before being stored in the `Config` struct. If the option is absent, `owner_constraint` evaluates to `None`.

```rust
    #[cfg(unix)]
    let owner_constraint: Option<OwnerFilter> = opts.owner.and_then(OwnerFilter::filter_ignore);
```
Sources: [src/main.rs:268-270](https://github.com/sharkdp/fd/blob/main/src/main.rs#L268-L270)

The resulting `owner_constraint` is embedded directly into the immutable `Config` instance passed into the parallel file traversal walker.

```rust
        #[cfg(unix)]
        owner_constraint,
```
Sources: [src/main.rs:384-386](https://github.com/sharkdp/fd/blob/main/src/main.rs#L384-L386)

## Owner Filter Data Structures

### Overview

The `OwnerFilter` data structure and its associated helper type `Check<T>` encapsulate user and group ownership constraints for Unix systems in `fd`. These structures parse strings formatted as `user:group`, `user`, or `:group`—with optional exclamation prefixes for negative matching—and resolve textual names to numeric IDs using the `nix` crate API.

Sources: [src/filter/owner.rs:1-103](https://github.com/sharkdp/fd/blob/main/src/filter/owner.rs#L1-L103)

### Core Types and Data Layout

The `OwnerFilter` struct contains two fields representing the user ID (`uid`) and group ID (`gid`) checks, respectively. Each field is wrapped in a generic `Check<T>` enum that determines whether matching requires equality, inequality, or should ignore the respective attribute.

```rust
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub struct OwnerFilter {
    uid: Check<u32>,
    gid: Check<u32>,
}

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
enum Check<T> {
    Equal(T),
    NotEq(T),
    Ignore,
}
```
Sources: [src/filter/owner.rs:5-16](https://github.com/sharkdp/fd/blob/main/src/filter/owner.rs#L5-L16)

The `Check<T>` enum defines three filtering variants:

| Variant | Value Type | Description |
| :--- | :--- | :--- |
| `Check::Equal(T)` | `T` | Asserts that the target metadata matches the specified value. |
| `Check::NotEq(T)` | `T` | Asserts that the target metadata does not match the specified value. |
| `Check::Ignore` | None | Bypasses the filter check for this attribute. |

Sources: [src/filter/owner.rs:11-16](https://github.com/sharkdp/fd/blob/main/src/filter/owner.rs#L11-L16)

### Parsing and Resolution Call Chain

When parsing an ownership specification string, `OwnerFilter::from_string` splits the input on a single colon (`:`) to separate the user specifier from the group specifier. It validates that no more than two segments are provided before parsing each half via `Check::parse`.

```rust
    pub fn from_string(input: &str) -> Result<Self> {
        let mut it = input.split(':');
        let (fst, snd) = (it.next(), it.next());

        if it.next().is_some() {
            return Err(anyhow!(
                "more than one ':' present in owner string '{}'. See 'fd --help'.",
                input
            ));
        }

        let uid = Check::parse(fst, |s| {
            if let Ok(uid) = s.parse() {
                Ok(uid)
            } else {
                User::from_name(s)?
                    .map(|user| user.uid.as_raw())
                    .ok_or_else(|| anyhow!("'{}' is not a recognized user name", s))
            }
        })?;
        let gid = Check::parse(snd, |s| {
            if let Ok(gid) = s.parse() {
                Ok(gid)
            } else {
                Group::from_name(s)?
                    .map(|group| group.gid.as_raw())
                    .ok_or_else(|| anyhow!("'{}' is not a recognized group name", s))
            }
        })?;

        Ok(OwnerFilter { uid, gid })
    }
```
Sources: [src/filter/owner.rs:27-58](https://github.com/sharkdp/fd/blob/main/src/filter/owner.rs#L27-L58)

The complete name and ID resolution flow proceeds as follows:
1. `OwnerFilter::from_string()` splits the input string on `:`.
2. `Check::parse()` inspects the token for a leading `!` character to toggle negation (`equality` flag).
3. The closure attempts numeric parsing via string `.parse()`.
4. If numeric parsing fails, it invokes `User::from_name(s)?` or `Group::from_name(s)?` from the `nix::unistd` module.
5. If the `nix` lookup succeeds, it extracts the raw identifier using `.map(|user| user.uid.as_raw())` or `.map(|group| group.gid.as_raw())`. Otherwise, it returns an unrecognized name error via `anyhow!`.

Sources: [src/filter/owner.rs:27-55](https://github.com/sharkdp/fd/blob/main/src/filter/owner.rs#L27-L55), [src/filter/owner.rs:85-102](https://github.com/sharkdp/fd/blob/main/src/filter/owner.rs#L85-L102)

> [!NOTE]
> `Check::parse` treats empty strings (`""`) and missing tokens (`None`) as `Check::Ignore`, allowing partial specifications like `:group` or `user:` to function correctly without requiring explicit wildcards.
> Sources: [src/filter/owner.rs:89-93](https://github.com/sharkdp/fd/blob/main/src/filter/owner.rs#L89-L93)

### Filter Evaluation and No-Op Handling

Once initialized, `OwnerFilter` provides methods to check filesystem metadata and to prune no-op filters. The `matches` method extracts raw Unix file metadata (`uid()` and `gid()`) and evaluates them against the configured `uid` and `gid` checks.

```rust
    pub fn filter_ignore(self) -> Option<Self> {
        if self == Self::IGNORE {
            None
        } else {
            Some(self)
        }
    }

    pub fn matches(&self, md: &fs::Metadata) -> bool {
        use std::os::unix::fs::MetadataExt;

        self.uid.check(md.uid()) && self.gid.check(md.gid())
    }
```
Sources: [src/filter/owner.rs:60-74](https://github.com/sharkdp/fd/blob/main/src/filter/owner.rs#L60-L74)

## Directory Entry Metadata Retrieval

### Overview

The `DirEntry` wrapper struct in `src/dir_entry.rs` manages directory traversal items originating from the `ignore` crate or broken symlinks. It lazily fetches and caches filesystem metadata and display styles via `OnceCell`. When evaluating ownership or inspecting entry attributes, metadata retrieval determines whether an entry is a normal file, directory, or broken symlink.

```rust
pub struct DirEntry {
    inner: DirEntryInner,
    metadata: OnceCell<Option<Metadata>>,
    style: OnceCell<Option<Style>>,
}
```
Sources: [src/dir_entry.rs:17-22](https://github.com/sharkdp/fd/blob/main/src/dir_entry.rs#L17-L22)

### Metadata Retrieval and Symlink Handling

The `metadata(&self)` method on `DirEntry` uses a `OnceCell` cache to avoid redundant system calls. Depending on whether the entry variant is normal or a broken symlink, it dispatches to different underlying filesystem functions.

```rust
    pub fn metadata(&self) -> Option<&Metadata> {
        self.metadata
            .get_or_init(|| match &self.inner {
                DirEntryInner::Normal(e) => e.metadata().ok(),
                DirEntryInner::BrokenSymlink(path) => path.symlink_metadata().ok(),
            })
            .as_ref()
    }
```
Sources: [src/dir_entry.rs:89-96](https://github.com/sharkdp/fd/blob/main/src/dir_entry.rs#L89-L96)

> [!NOTE]
> For normal entries, `e.metadata().ok()` queries standard filesystem metadata. For broken symlinks (`DirEntryInner::BrokenSymlink`), standard metadata queries fail because the target does not exist; therefore, `path.symlink_metadata().ok()` is invoked instead to retrieve metadata for the symlink itself.
> Sources: [src/dir_entry.rs:91-94](https://github.com/sharkdp/fd/blob/main/src/dir_entry.rs#L91-L94)

### File Type and Empty Checks

Filesystem checks in `src/filesystem.rs` inspect `DirEntry` and `FileType` instances to determine entry properties such as whether a path represents a block device, character device, socket, pipe, or an empty file/directory.

```rust
pub fn is_empty(entry: &dir_entry::DirEntry) -> bool {
    if let Some(file_type) = entry.file_type() {
        if file_type.is_dir() {
            if let Ok(mut entries) = fs::read_dir(entry.path()) {
                entries.next().is_none()
            } else {
                false
            }
        } else if file_type.is_file() {
            entry.metadata().map(|m| m.len() == 0).unwrap_or(false)
        } else {
            false
        }
    } else {
        false
    }
}
```
Sources: [src/filesystem.rs:44-60](https://github.com/sharkdp/fd/blob/main/src/filesystem.rs#L44-L60)

### Platform-Specific File Type Helpers

Different operating systems expose specialized file types through distinct extension traits. The filesystem module abstracts these platform differences into unified helper functions.

| Function Name | Target Platform | Underlying `std::fs::FileType` Method |
| :--- | :--- | :--- |
| `is_block_device` | Unix, Redox | `ft.is_block_device()` |
| `is_block_device` | Windows | Returns `false` |
| `is_char_device` | Unix, Redox | `ft.is_char_device()` |
| `is_char_device` | Windows | Returns `false` |
| `is_socket` | Unix, Redox | `ft.is_socket()` |
| `is_socket` | Windows | Returns `false` |
| `is_pipe` | Unix, Redox | `ft.is_fifo()` |
| `is_pipe` | Windows | Returns `false` |

Sources: [src/filesystem.rs:62-100](https://github.com/sharkdp/fd/blob/main/src/filesystem.rs#L62-L100)

> [!WARNING]
> On Windows platforms, device files, sockets, and named pipes are not natively supported by the standard file type API; helper functions like `is_socket` and `is_pipe` unconditionally return `false` rather than attempting unsupported queries.
> Sources: [src/filesystem.rs:87-90](https://github.com/sharkdp/fd/blob/main/src/filesystem.rs#L87-L90), [src/filesystem.rs:97-100](https://github.com/sharkdp/fd/blob/main/src/filesystem.rs#L97-L100)

## Filter Evaluation in Traversal Pipeline

### Overview

During directory traversal, the parallel walker executes a closure for each discovered filesystem entry inside worker threads spawned by `spawn_senders`. Within this pipeline, ownership constraints configured by the user are evaluated on Unix platforms against entry metadata. When an owner filter is active, the traversal thread retrieves the entry's metadata and queries `owner_constraint.matches(metadata)`. If the metadata cannot be fetched or the ownership check fails, the entry is filtered out by returning `WalkState::Continue`, ensuring non-matching paths are excluded before reaching output buffering or execution stages.

Sources: [src/walk.rs:443-457](https://github.com/sharkdp/fd/blob/main/src/walk.rs#L443-L457), [src/walk.rs:544-555](https://github.com/sharkdp/fd/blob/main/src/walk.rs#L544-L555)

### Traversal Pipeline Execution Walkthrough

The evaluation of ownership filters within the traversal worker threads follows a precise execution path through `WorkerState::spawn_senders`:

1. **Worker Iteration**: `walker.run(|| { ... })` invokes the worker closure for each discovered `entry` across parallel threads.
2. **Cancellation Check**: `quit_flag.load(Ordering::Relaxed)` verifies whether the search has been aborted; if set, it returns `WalkState::Quit`.
3. **Directory and Ignore Contain Checks**: The entry type and path attributes are inspected to skip roots or directories matching ignore contain constraints.
4. **Error and Symlink Handling**: Successful entries are wrapped via `DirEntry::normal(e)`, while IO errors and broken symlinks are handled or pushed to error channels.
5. **Name, Extension, and Type Filtering**: The path string is matched against search patterns, extension regexes, and file type rules.
6. **Owner Constraint Evaluation**: On Unix platforms, if `config.owner_constraint` is present, `entry.metadata()` is fetched and `owner_constraint.matches(metadata)` is evaluated. If matching fails or metadata is unavailable, `WalkState::Continue` skips the entry.
7. **Size, Time, and Dispatch**: Size and time constraints are evaluated subsequently before coloring and dispatching valid entries via `tx.send(WorkerResult::Entry(entry))`.

Sources: [src/walk.rs:443-612](https://github.com/sharkdp/fd/blob/main/src/walk.rs#L443-L612)

> [!NOTE]
> Ownership filtering occurs strictly on Unix platforms (`#[cfg(unix)]`) after name, extension, and file type filters have passed, but before size and modification time constraints are evaluated.
> Sources: [src/walk.rs:544-555](https://github.com/sharkdp/fd/blob/main/src/walk.rs#L544-L555)

### Traversal Filter Predicates Reference

The worker closure applies a series of sequential predicates to determine whether an entry proceeds down the pipeline or is discarded via `WalkState::Continue`.

| Filter Stage | Configuration Field | Condition for Skipping Entry (`WalkState::Continue`) |
| :--- | :--- | :--- |
| **Depth Filter** | `config.min_depth` | Entry depth is less than `min_depth`. |
| **Pattern Match** | `patterns` | Entry path fails to match one or more search patterns. |
| **Extension Filter** | `config.extensions` | File name extension does not match extension regex set. |
| **File Type Filter** | `config.file_types` | `file_types.should_ignore(&entry)` returns true. |
| **Owner Filter** | `config.owner_constraint` | Metadata is missing or `owner_constraint.matches(metadata)` returns false. |
| **Size Filter** | `config.size_constraints` | File size violates any configured size constraint. |
| **Time Filter** | `config.time_constraints` | Modification time fails to satisfy time constraints. |

Sources: [src/walk.rs:508-591](https://github.com/sharkdp/fd/blob/main/src/walk.rs#L508-L591)

> [!WARNING]
> If `entry.metadata()` returns `None` during the ownership check, the entry is immediately skipped with `WalkState::Continue`, preventing traversal failure on unreadable or transient files.
> Sources: [src/walk.rs:546-554](https://github.com/sharkdp/fd/blob/main/src/walk.rs#L546-L554)

### Design Trade-offs in Traversal Filtering

| Design Choice | Benefit | Cost |
| :--- | :--- | :--- |
| **Lazy Metadata Fetching** | Avoids expensive `stat` system calls for entries eliminated by name or extension filters. | Requires conditional metadata retrieval when executing late-stage filters like owner, size, or time constraints. |
| **Parallel Walker Execution** | Distributes traversal and filtering across multiple threads using `WalkParallel`. | Introduces synchronization overhead across worker channels and batch senders. |
| **Early `WalkState::Continue` Returns** | Short-circuits evaluation pipelines immediately upon filter failure, reducing redundant computation. | Scattered early-return branches require careful ordering to ensure cheaper checks precede expensive ones. |

Sources: [src/walk.rs:443-591](https://github.com/sharkdp/fd/blob/main/src/walk.rs#L443-L591)

## Integration with Filter Subsystems

### Overview

Coordinate ownership constraints alongside size, time, and filetype filter predicates. The filtering architecture processes discrete predicates across independent filter modules (`size`, `time`, `filetypes`, and `owner`) to validate entries before output dispatch or command execution.

Sources: [src/filetypes.rs:7-43](https://github.com/sharkdp/fd/blob/main/src/filetypes.rs#L7-L43), [src/filter/mod.rs:1-12](https://github.com/sharkdp/fd/blob/main/src/filter/mod.rs#L1-L12), [src/filter/size.rs:9-74](https://github.com/sharkdp/fd/blob/main/src/filter/size.rs#L9-L74), [src/filter/time.rs:7-63](https://github.com/sharkdp/fd/blob/main/src/filter/time.rs#L7-L63)

### Predicate Comparison and Data Structures

Each subsystem exposes distinct evaluation structures and parsing logic. The size filter parses constraints with SI and binary prefixes into bounds, the time filter computes absolute system time bounds from relative spans or timestamps, and file types evaluate system file characteristics and permissions.

| Subsystem | Enum / Struct | Parsing / Evaluation Method | Supported Constraints / Variants |
| :--- | :--- | :--- | :--- |
| **Size Filter** | `SizeFilter` | `SizeFilter::from_string(s)` / `is_within(size)` | `Max(u64)`, `Min(u64)`, `Equals(u64)` with SI (`k`, `m`, `g`, `t`) and binary (`ki`, `mi`, `gi`, `ti`) prefixes. |
| **Time Filter** | `TimeFilter` | `TimeFilter::before(s)`, `TimeFilter::after(s)` / `applies_to(t)` | `Before(SystemTime)`, `After(SystemTime)` parsed from spans, ISO timestamps, dates, or `@` epochs. |
| **File Types** | `FileTypes` | `FileTypes::should_ignore(entry)` | Flags for `files`, `directories`, `symlinks`, `block_devices`, `char_devices`, `sockets`, `pipes`, `executables_only`, `empty_only`. |

Sources: [src/filetypes.rs:7-43](https://github.com/sharkdp/fd/blob/main/src/filetypes.rs#L7-L43), [src/filter/size.rs:9-74](https://github.com/sharkdp/fd/blob/main/src/filter/size.rs#L9-L74), [src/filter/time.rs:7-63](https://github.com/sharkdp/fd/blob/main/src/filter/time.rs#L7-L63)

### Filter Coordination Design Trade-offs

| Design Choice | Benefit | Cost |
| :--- | :--- | :--- |
| **Modular Filter Submodules** | Isolates domain logic (size multipliers, time zone parsing, file attribute checks) into separate files under `src/filter/`. | Requires coordinating multiple distinct types and parsing pathways in configuration and traversal logic. |
| **Explicit Unit Parsing via Regex and Jiff** | Robust handling of complex size multipliers and relative/absolute time expressions using specialized libraries (`regex`, `jiff`). | Parsing failures return hard errors or optional values that require upstream error propagation. |
| **Separate Unix-only Owner Subsystem** | Keeps platform-specific system calls (`nix`) decoupled from portable size and time filtering logic. | Requires conditional compilation guards (`#[cfg(unix)]`) across filter module declarations and execution paths. |

Sources: [src/filter/mod.rs:1-12](https://github.com/sharkdp/fd/blob/main/src/filter/mod.rs#L1-L12), [src/filter/size.rs:28-66](https://github.com/sharkdp/fd/blob/main/src/filter/size.rs#L28-L66), [src/filter/time.rs:28-47](https://github.com/sharkdp/fd/blob/main/src/filter/time.rs#L28-L47)

> [!NOTE]
> Size filter parsing leverages a cached regular expression `SIZE_CAPTURES` initialized via `OnceLock` to extract prefix signs, numeric quantities, and SI or binary unit multipliers without re-allocating the regex parser on every call.
> Sources: [src/filter/size.rs:4-38](https://github.com/sharkdp/fd/blob/main/src/filter/size.rs#L4-L38)

## Related

- [[Time-Based Filtering]]
- [[Directory Entries]]

