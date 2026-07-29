# Binary File Filtering

<details>
<summary>Relevant source files</summary>

The following files were used as context for generating this wiki page:

- [crates/core/flags/defs.rs](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs)
</details>

## Overview

Ripgrep implements automated binary file filtering to improve search relevance and performance during recursive directory traversal. By default, ripgrep heuristically detects binary files using NUL byte inspection, automatically terminating searches or suppressing output upon encountering binary content unless overridden by explicit configuration flags like `--binary` or `--text`.

Sources: [crates/core/flags/defs.rs:524-544](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L524-L544)

## Binary Detection CLI Flag Surface

### Binary Detection CLI Flag Surface

### Overview

Ripgrep exposes specialized command-line flags within its configuration surface to govern how binary files are handled during recursive searches. These flags modify internal binary mode states inside `LowArgs` through discrete flag implementations defined in the core flag definitions module.

Sources: [crates/core/flags/defs.rs:502-566](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L502-L566)

### Configured Binary and Text Flags

The primary CLI flags controlling binary file filtering behavior include `--binary`, `--no-binary`, `--text`, and `--unrestricted`. Each flag maps to a specific variant of `BinaryMode` or interacts with other traversal filters.

| Flag Name | Short Flag | Type / Negation | Target Field | Purpose and Behavior |
| :--- | :--- | :--- | :--- | :--- |
| `binary` | None | Switch (`--no-binary`) | `args.binary` | Enables binary file searching while suppressing and warning upon NUL byte encounters. Sets `BinaryMode::SearchAndSuppress`. |
| `text` | `-a` | Switch (`--no-text`) | `args.binary` | Treats all files as plain text, disabling any special NUL byte detection or suppression. Sets `BinaryMode::AsText`. |
| `unrestricted` | None | Repeated Switch | `args.binary` | When supplied three times, automatically enables the binary flag behavior (`BinaryMode::SearchAndSuppress`). |

Sources: [crates/core/flags/defs.rs:502-566](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L502-L566)

### Flag Update Execution Path

When parsing command-line arguments, ripgrep invokes the `update` method on the matching `Flag` implementation. For the binary handling flag, the execution proceeds as follows:

`Flag::update()` receives a `FlagValue::Switch` → `v.unwrap_value()` or `v.unwrap_switch()` extracts the boolean state → the closure branches on the boolean value to assign `BinaryMode::SearchAndSuppress` or `BinaryMode::Auto` to `args.binary`.

Sources: [crates/core/flags/defs.rs:558-565](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L558-L565)

> [!WARNING]
> The `--binary` flag overrides the `--text` flag if specified later on the command line, whereas supplying `-a` (`--text`) after `--binary` transitions the internal state to `BinaryMode::AsText`.

Sources: [crates/core/flags/defs.rs:554-555](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L554-L555), [crates/core/flags/defs.rs:583-587](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L583-L587)

## Binary Search Modes and Behavior

### Binary Search Modes and Behavior

### Overview

Ripgrep defines specific flags and boundary configurations that dictate how searches traverse lines, handle NUL bytes, and enforce line-level constraints. These flags govern line boundary matching, NUL-delimited data processing, and line terminator modifications.

Sources: [crates/core/flags/defs.rs:4084-4119](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L4084-L4119), [crates/core/flags/defs.rs:5387-5428](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L5387-L5428)

### Boundary and NUL-Byte Flag Configurations

The implementation structs for line boundaries and NUL byte handling translate command-line inputs into internal modes within `LowArgs`. 

| Flag Name | Short Flag | Type / Negation | Target Field | Purpose and Behavior |
| :--- | :--- | :--- | :--- | :--- |
| `line-regexp` | `-x` | Switch (No negation) | `args.boundary` | Restricts matches to line boundaries by setting `BoundaryMode::Line`, equivalent to wrapping patterns in `^` and `$`. |
| `null-data` | None | Switch (No negation) | `args.null_data` | Replaces standard `\n` line terminators with `\NUL`, setting `args.null_data = true` and `args.crlf = false`. |
| `crlf` | None | Switch (`--no-crlf`) | `args.crlf` | Treats `\r\n` as a single line terminator, setting `args.crlf = true` and clearing `args.null_data = false`. |

Sources: [crates/core/flags/defs.rs:4084-4119](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L4084-L4119), [crates/core/flags/defs.rs:1457-1502](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L1457-L1502), [crates/core/flags/defs.rs:5387-5428](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L5387-L5428)

### Flag Update Execution Path

When parsing options that manipulate binary search boundaries and line terminators, ripgrep invokes the respective `Flag::update()` routine:

`Flag::update()` receives `FlagValue` → `v.unwrap_switch()` extracts the boolean flag state → `args.boundary` or `args.null_data` and `args.crlf` are assigned according to precedence rules. For instance, updating `NullData` explicitly resets `args.crlf = false` to enforce mutual exclusivity.

Sources: [crates/core/flags/defs.rs:1495-1501](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L1495-L1501), [crates/core/flags/defs.rs:4114-4118](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L4114-L4118), [crates/core/flags/defs.rs:5422-5427](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L5422-L5427)

> [!NOTE]
> The `--line-regexp` (`-x`) flag overrides the `--word-regexp` flag by updating the internal boundary mode to `BoundaryMode::Line`.

Sources: [crates/core/flags/defs.rs:4105-4111](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L4105-L4111), [crates/core/flags/defs.rs:4114-4118](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L4114-L4118)

> [!WARNING]
> Enabling `--null-data` automatically overrides and disables `--crlf`, while enabling `--crlf` sets `args.null_data = false`. These two line-terminator configurations cannot be active simultaneously.

Sources: [crates/core/flags/defs.rs:1496-1500](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L1496-L1500), [crates/core/flags/defs.rs:5423-5426](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L5423-L5426)

## Buffer Heuristics and Encoding Interaction

### Overview

Ripgrep coordinates binary detection settings alongside text encoding modes and output output modes to ensure search safety and correct rendering of binary streams. When searching files that may contain arbitrary byte sequences or explicit `NUL` terminators, the parser must reconcile binary filtering flags with encoding options and index constraints.

Sources: [crates/core/flags/defs.rs:167-178](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L167-L178), [crates/core/flags/defs.rs:1707-1725](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L1707-L1725)

### Encoding and Binary Flag Interaction

The encoding update path interprets user inputs for `-E`/`--encoding`, translating label strings into internal `EncodingMode` structures. When `--encoding` is set to any value other than `auto`, ripgrep flags that feature as unsupported for search indexing.

| Encoding Mode Input | Parsed `EncodingMode` Variant | Indexing Compatibility | Behavior |
| :--- | :--- | :--- | :--- |
| `auto` | `EncodingMode::Auto` | Supported | Performs best-effort BOM sniffing for UTF-8 or UTF-16 files. |
| `none` | `EncodingMode::Disabled` | Supported | Completely disables BOM sniffing and searches raw bytes. |
| Custom label (e.g., `utf-16`) | `EncodingMode::Some(Encoding)` | Unsupported | Transcodes or enforces specific character set decoders via `grep::searcher::Encoding`. |

Sources: [crates/core/flags/defs.rs:176-178](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L176-L178), [crates/core/flags/defs.rs:1707-1725](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L1707-L1725)

### Indexing Unsupported Flag Validation Path

When index-backed searches are requested, ripgrep validates active configurations via `LowArgs::indexing_unsupported_flag()` to verify that incompatible binary or encoding modes are not enabled simultaneously. 

`LowArgs::indexing_unsupported_flag()` checks state conditions in sequence → `matches!(self.binary, BinaryMode::AsText)` returns `Some(&Binary)` if text mode overrides binary filtering → `!matches!(self.encoding, EncodingMode::Auto)` returns `Some(&Encoding)` if transcoding or disabled encoding is active → returns `None` if all parameters are compatible with indexing constraints.

Sources: [crates/core/flags/defs.rs:173-178](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L173-L178), [crates/core/flags/defs.rs:227-228](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L227-L228)

> [!NOTE]
> If any flag checked by `indexing_unsupported_flag()` returns `Some`, ripgrep rejects the index query configuration or falls back to an ordinary search depending on the repetition count of the index flag.

Sources: [crates/core/flags/defs.rs:167-170](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L167-L170), [crates/core/flags/defs.rs:3503-3507](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L3503-L3507)

## Performance and Memory Mapping Strategy

### Overview

Flag configurations for memory mapping and execution modes control how ripgrep loads and accesses file contents during a search, directly impacting performance and safety when handling binary data or large files.

Sources: [crates/core/flags/defs.rs:4456-4467](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L4456-L4467), [crates/core/flags/defs.rs:4546-4552](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L4546-L4552)

### Memory Mapping Flag Configurations

The `--mmap` and `--no-mmap` flags govern whether ripgrep uses memory-mapped I/O to search files. When enabled via `Mmap`, ripgrep attempts memory mapping when it determines it will accelerate the search.

| Flag Name | Short / Long Form | Update Action | Target `MmapMode` State |
| :--- | :--- | :--- | :--- |
| `--mmap` | `--mmap` | `args.mmap = MmapMode::AlwaysTryMmap` | `MmapMode::AlwaysTryMmap` |
| `--no-mmap` | `--no-mmap` | `args.mmap = MmapMode::Never` | `MmapMode::Never` |

Sources: [crates/core/flags/defs.rs:4470-4477](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L4470-L4477), [crates/core/flags/defs.rs:4486-4490](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L4486-L4490)

> [!WARNING]
> Memory maps cannot be used on virtual files or streams like `stdin`. Furthermore, ripgrep may abort unexpectedly if it searches a file that is simultaneously truncated while memory-mapped, which users can avoid by passing `--no-mmap`.

Sources: [crates/core/flags/defs.rs:4460-4466](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L4460-L4466)

### Multiline Execution and Memory Layout Interactions

Enabling multiline search via `--multiline` (`-U`) alters memory allocation and execution requirements because matches can cross line boundaries.

Sources: [crates/core/flags/defs.rs:4524-4527](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L4524-L4527), [crates/core/flags/defs.rs:4562-4568](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L4562-L4568)

When `--multiline` is active, ripgrep requires each searched file to reside contiguously in memory—either by reading it onto the heap or via memory mapping—and automatically disables `--stop-on-nonmatch`.

Sources: [crates/core/flags/defs.rs:4547-4550](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L4547-L4550), [crates/core/flags/defs.rs:4564-4566](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L4564-L4566)

## Output Separation and Null Controls

### Overview

Output separation and null controls manage how file paths, match boundaries, and lists of matching files are delimited in ripgrep's results. These settings are particularly useful for downstream parsing pipelines and utilities like `xargs`.

Sources: [crates/core/flags/defs.rs:5340-5364](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L5340-L5364)

### Null Path Separation

The `--null` flag (short form `-0`) ensures that whenever a file path is printed, it is immediately followed by a `NUL` byte instead of a newline or standard separator. This applies to file paths printed before matches as well as lists of files generated by modes like count or file listing.

Sources: [crates/core/flags/defs.rs:5338-5364](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L5338-L5364)

| Flag Name | Short / Long Form | Update Action | Target State / Behavior |
| :--- | :--- | :--- | :--- |
| `--null` | `-0`, `--null` | `args.null = true` | Appends a `NUL` byte after every printed file path |

Sources: [crates/core/flags/defs.rs:5346-5351](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L5346-L5351), [crates/core/flags/defs.rs:5367-5371](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L5367-L5371)

> [!NOTE]
> The `--null` flag has no negation form in the argument parser and throws an error if an attempt is made to negate it.

Sources: [crates/core/flags/defs.rs:5368-5369](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L5368-L5369)

### Field and Path Separator Options

Ripgrep supports fine-grained control over the separators utilized between components of an output line (such as file paths, line numbers, columns, and content) via custom delimiter flags.

Sources: [crates/core/flags/defs.rs:1862-1886](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L1862-L1886), [crates/core/flags/defs.rs:1970-1994](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L1970-L1994), [crates/core/flags/defs.rs:5563-5609](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L5563-L5609)

- `--field-match-separator`: Delimits fields for matching lines, defaulting to the `:` character.
- `--field-context-separator`: Delimits fields for context lines, defaulting to the `-` character.
- `--path-separator`: Overrides the platform-specific directory path separator when printing paths.

Sources: [crates/core/flags/defs.rs:1882-1886](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L1882-L1886), [crates/core/flags/defs.rs:1990-1994](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L1990-L1994), [crates/core/flags/defs.rs:5580-5585](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L5580-L5585)

> [!WARNING]
> A path separator provided via `--path-separator` is strictly limited to exactly one byte. Providing an empty string reverts the separator to the environment default, while providing a multi-byte sequence causes validation to fail.

Sources: [crates/core/flags/defs.rs:5586-5607](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L5586-L5607)

## Related

- [[File Search Core]]

