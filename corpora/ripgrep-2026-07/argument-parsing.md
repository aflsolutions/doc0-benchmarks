# Argument Parsing

<details>
<summary>Relevant source files</summary>

The following files were used as context for generating this wiki page:

- [crates/core/flags/defs.rs](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs)
</details>

## Overview

Ripgrep defines all command line flags as unit structs implementing the `Flag` trait, mapping each logical operation—such as encoding configuration or context control—to its respective long names, optional short flags, negated forms, and aliases.

Sources: [crates/core/flags/defs.rs:4-18](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L4-L18)

## Low-Level Argument Definitions

### Low-Level Flag Definitions and Structure

Individual flags in ripgrep are represented as unit structs that implement the `Flag` trait. Each struct corresponds to a single logical flag state inside ripgrep, even when exposed to the end user via multiple manifestations such as long names, optional short flags, negated forms, or aliases. For instance, the context-related flags `-A`/`--after-context`, `-B`/`--before-context`, and `-C`/`--context` manipulate the underlying `Context` and `ContextMode` configurations during argument parsing.

Sources: [crates/core/flags/defs.rs:4-18](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L4-L18)

### Flag Metadata and List Ordering

The global list of all flags is maintained as a static slice `FLAGS`, containing references to every supported flag implementation. The order of entries within `FLAGS` is critical because it dictates the display order of flags inside generated documentation, including `-h`, `--help`, and man pages, grouped by category with deprecated flags placed last.

```rust
pub(super) const FLAGS: &[&dyn Flag] = &[
    &Regexp,
    &File,
    &AfterContext,
    &BeforeContext,
    // ...
    &AutoHybridRegex,
    &NoPcre2Unicode,
    &SortFiles,
];
```

Sources: [crates/core/flags/defs.rs:39-156](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L39-L156)

### Indexing Restrictions on Low-Level Arguments

Ripgrep defines validation logic on `LowArgs` through the `indexing_unsupported_flag` routine to enforce restrictions when search indexing is active. This method inspects active flags and configuration fields, returning an `Option<&'static dyn Flag>` representing the first unsupported feature encountered.

| Condition checked | Field / Mode | Incompatible Flag Returned |
| :--- | :--- | :--- |
| Mode is `FilesWithoutMatch` | `self.mode` | `&FilesWithoutMatch` |
| Binary search as text | `self.binary` | `&Binary` |
| Non-auto encoding | `self.encoding` | `&Encoding` |
| PCRE2 engine choice | `self.engine` | `&Engine` |
| Follow symlinks enabled | `self.follow` | `&Follow` |
| Globs or iglobs present | `self.globs` / `self.iglobs` | `&Glob` |
| Hidden files enabled | `self.hidden` | `&Hidden` |
| Custom ignore files present | `self.ignore_file` | `&IgnoreFile` |
| Ignore flags set | `self.no_ignore_dot`, etc. | Various (`&NoIgnoreDot`, etc.) |
| One file system boundary | `self.one_file_system` | `&OneFileSystem` |
| Preprocessor or search-zip | `self.pre` / `self.search_zip` | `&Pre` / `&SearchZip` |

Sources: [crates/core/flags/defs.rs:167-228](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L167-L228)

> [!NOTE]
> The `indexing_unsupported_flag` check implements a strict whitelist/blacklist approach designed to be paranoid about what features are permitted when search indexes are enabled, with the long-term goal of progressively lifting these restrictions.

Sources: [crates/core/flags/defs.rs:163-166](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L163-L166)

## Parsing Raw Command Line Arguments

### Parsing Raw Command Line Arguments

### Overview

Ripgrep processes raw command line inputs via low-level argument parsing helpers (`parse_low_raw`) defined alongside unit flag structures in `crates/core/flags/defs.rs`. These test helpers exercise flag parsing mechanics across various input permutations—such as combined short flags (`-A5`), explicit value assignments (`--after-context=5`), boolean toggles (`--binary` and `--no-binary`), and multi-value options (`--colors`, `--glob`, `--regexp`).

Sources: [crates/core/flags/defs.rs:34-36](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L34-L36)

### Flag Parsing Test Behaviors

The raw argument parsing layer validates state transitions directly against expected `LowArgs` fields. The following table highlights representative unit test assertions for low-level flag parsing:

| Flag / Option | Test Input Array | Resulting `LowArgs` / Field State |
| :--- | :--- | :--- |
| `AfterContext` | `["--after-context", "5"]` | `args.context` sets after-context to `5` |
| `AutoHybridRegex` | `["--auto-hybrid-regex"]` | `args.engine` set to `EngineChoice::Auto` |
| `Binary` | `["--binary", "--no-binary"]` | `args.binary` toggles from `SearchAndSuppress` to `Auto` |
| `Encoding` | `["-E", "none"]` | `args.encoding` set to `EncodingMode::Disabled` |
| `Index` | `["-XX"]` | `args.index` incremented to `2` |

Sources: [crates/core/flags/defs.rs:281-282](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L281-L282), [crates/core/flags/defs.rs:384-385](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L384-L385), [crates/core/flags/defs.rs:577-578](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L577-L578), [crates/core/flags/defs.rs:1743-1744](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L1743-L1744), [crates/core/flags/defs.rs:3542-3543](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L3542-L3543)

> [!WARNING]
> When passing invalid numeric bounds or unrecognized enum choices (such as `--color foofoo`), the raw argument parser via `parse_low_raw` yields an `Err` result rather than recovering silently, enforcing strict validation during early parsing.

Sources: [crates/core/flags/defs.rs:882-883](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L882-L883)

### Design Trade-Offs in Raw Parsing

| Design Choice | Benefit | Cost |
| :--- | :--- | :--- |
| Unit struct per logical flag | Centralizes documentation, choice lists, and update logic per flag | High boilerplate with repetitive `impl Flag` blocks |
| Explicit error bail on unrecognized choices | Fails fast on typoed parameters (e.g., `--color foofoo`) | Requires exhaustive match arms for every valid string option |
| Separate `LowArgs` intermediate struct | Decouples raw argument parsing from high-level printer construction | Requires a secondary conversion pass into domain types |

Sources: [crates/core/flags/defs.rs:4-18](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L4-L18), [crates/core/flags/defs.rs:842-848](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L842-L848)

## High-Level Flag Representation Conversion

### High-Level Flag Representation Conversion

### Overview

Ripgrep transforms low-level parsed flags into high-level domain arguments through explicit update methods implemented on individual flag structs. Each flag implementation receives a `FlagValue` variant and a mutable reference to `LowArgs`, updating intermediate state fields that are subsequently converted into high-level configuration structures used by ripgrep's search and print backends.

Sources: [crates/core/flags/defs.rs:263-266](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L263-L266), [crates/core/flags/defs.rs:367-375](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L367-L375)

### Flag Update Call Chain

During argument processing, flag transformation follows a deterministic execution flow from raw token extraction down to domain state mutation:

`parse_low_raw()` → `Flag::update()` → `FlagValue::unwrap_value()` / `unwrap_switch()` → `convert` helpers → `LowArgs` field mutation

Sources: [crates/core/flags/defs.rs:263-266](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L263-L266), [crates/core/flags/defs.rs:558-564](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L558-L564), [crates/core/flags/defs.rs:1614-1617](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L1614-L1617)

> [!NOTE]
> The conversion functions like `convert::usize` and `convert::human_readable_usize` handle validation, returning an `anyhow::Result` error if numerical limits overflow or if string suffixes like `K`, `M`, or `G` are malformed.

Sources: [crates/core/flags/defs.rs:264](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L264), [crates/core/flags/defs.rs:1616](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L1616)

### Flag Representation Transformation Map

The following table details how low-level flags convert their values into specific `LowArgs` fields and domain types:

| Flag Struct | Command Line Flag | Target Field in `LowArgs` | Converted Domain Type / Value |
| :--- | :--- | :--- | :--- |
| `AfterContext` | `-A`, `--after-context` | `args.context` | `ContextMode` (via `convert::usize`) |
| `AutoHybridRegex` | `--auto-hybrid-regex` | `args.engine` | `EngineChoice::Auto` |
| `Binary` | `--binary`, `-a` | `args.binary` | `BinaryMode::SearchAndSuppress` |
| `Color` | `--color` | `args.color` | `ColorChoice` (`Never`, `Auto`, `Always`, `Ansi`) |
| `DfaSizeLimit` | `--dfa-size-limit` | `args.dfa_size_limit` | `Option<usize>` (via `convert::human_readable_usize`) |

Sources: [crates/core/flags/defs.rs:263-266](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L263-L266), [crates/core/flags/defs.rs:367-375](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L367-L375), [crates/core/flags/defs.rs:558-564](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L558-L564), [crates/core/flags/defs.rs:841-850](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L841-L850), [crates/core/flags/defs.rs:1614-1617](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L1614-L1617)

## Value Unwrapping and Parameter Formatting

### Value Unwrapping and Parameter Formatting

### Overview

Ripgrep processes command-line flag parameters through a structured unwrapping mechanism that extracts raw string or switch values from the internal `FlagValue` enum and coerces them into typed domain representations using dedicated conversion utilities.

Sources: [crates/core/flags/defs.rs:263-266](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L263-L266), [crates/core/flags/defs.rs:1614-1617](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L1614-L1617)

### Value Unwrapping Execution Flow

When a matched flag requires argument data, the update handler extracts and parses the payload through a precise sequence of extraction calls:

`Flag::update()` → `FlagValue::unwrap_value()` / `unwrap_switch()` → `convert::*` parsing functions → target `LowArgs` field assignment

Sources: [crates/core/flags/defs.rs:263-266](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L263-L266), [crates/core/flags/defs.rs:1614-1617](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L1614-L1617)

> [!NOTE]
> `FlagValue::unwrap_value()` extracts string-backed arguments (such as numeric counts or size limits), whereas `FlagValue::unwrap_switch()` extracts boolean flag states for binary toggles.

Sources: [crates/core/flags/defs.rs:264](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L264), [crates/core/flags/defs.rs:559](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L559)

### Parameter Formatting and Human-Readable Suffixes

Flags that accept numerical size constraints support human-readable suffixes such as `K`, `M`, and `G` representing kilobytes, megabytes, and gigabytes respectively. These values are processed by helper functions like `convert::human_readable_usize` and `convert::human_readable_u64`.

Sources: [crates/core/flags/defs.rs:1608-1610](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L1608-L1610), [crates/core/flags/defs.rs:1616](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L1616), [crates/core/flags/defs.rs:4413-4415](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L4413-L4415)

### Value Unwrapping and Conversion Reference

| Flag Struct | Parameter Type | Conversion Utility | Target Field & Constraints |
| :--- | :--- | :--- | :--- |
| `AfterContext` | Numeric string | `convert::usize` | `args.context` (sets after-context lines) |
| `DfaSizeLimit` | Size specifier with optional suffix | `convert::human_readable_usize` | `args.dfa_size_limit` (accepts `K`, `M`, `G`) |
| `MaxFilesize` | Size specifier with optional suffix | `convert::human_readable_u64` | `args.max_filesize` (accepts `K`, `M`, `G`) |
| `Color` | Choice string | `convert::str` | `args.color` (validates against explicit choices) |
| `PathSeparator` | Single byte or escape sequence | `Vec::unescape_bytes` | `args.path_separator` (enforces exactly 1 byte) |

Sources: [crates/core/flags/defs.rs:264](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L264), [crates/core/flags/defs.rs:842](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L842), [crates/core/flags/defs.rs:1616](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L1616), [crates/core/flags/defs.rs:4413](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L4413), [crates/core/flags/defs.rs:5593-5597](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L5593-L5597)

## Flag Updating and Configuration Integration

### Overview

During argument processing, individual command-line flags update internal program state and enforce mutual exclusivity or override relationships among conflicting configuration settings. Each flag implements the `update` method on the `Flag` trait, mutating the low-level configuration struct (`LowArgs`) in place.

Sources: [crates/core/flags/defs.rs:263-266](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L263-L266)

### State Update Call-Chain Execution Walkthrough

When ripgrep encounters a flag during parsing, it invokes the update routine which executes a deterministic mutation sequence:

`parse_low_raw()` → iterate CLI tokens → lookup `Flag` implementation → `Flag::update(v, args)` → field assignment or mode transition on `LowArgs` → return updated `LowArgs` state

Sources: [crates/core/flags/defs.rs:1495-1501](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L1495-L1501), [crates/core/flags/defs.rs:4562-4568](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L4562-L4568)

> [!WARNING]
> Certain flags trigger cascading updates across multiple fields. For instance, enabling `--crlf` directly resets `args.null_data = false`, while enabling `--null-data` sets `args.crlf = false` and `args.null_data = true`.

Sources: [crates/core/flags/defs.rs:1495-1501](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L1495-L1501), [crates/core/flags/defs.rs:5422-5426](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L5422-L5426)

### Flag-Driven Configuration Overrides and Interactions

The implementation of `update` methods enforces strict dominance rules where specific flags override broad options or complementary flags regardless of order on the command line.

| Flag | Target Field(s) | Overridden / Reset Fields | Effect on State |
| :--- | :--- | :--- | :--- |
| `Crlf` | `args.crlf` | `args.null_data` | Sets `args.crlf = true` and `args.null_data = false` |
| `NullData` | `args.null_data`, `args.crlf` | `args.crlf` | Sets `args.null_data = true` and `args.crlf = false` |
| `Multiline` | `args.multiline`, `args.stop_on_nonmatch` | `args.stop_on_nonmatch` | Sets `args.multiline = true` and `args.stop_on_nonmatch = false` |
| `SearchZip` | `args.search_zip`, `args.pre` | `args.pre` | Sets `args.search_zip = true` and clears `args.pre = None` |
| `Pre` | `args.pre`, `args.search_zip` | `args.search_zip` | Sets `args.pre = Some(path)` and `args.search_zip = false` |

Sources: [crates/core/flags/defs.rs:1495-1501](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L1495-L1501), [crates/core/flags/defs.rs:4562-4568](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L4562-L4568), [crates/core/flags/defs.rs:5914-5917](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L5914-L5917), [crates/core/flags/defs.rs:6476-6481](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L6476-L6481)

> [!NOTE]
> Grouping aliases like `Pretty` modify multiple independent subsystems simultaneously, updating `args.color` to `ColorChoice::Always`, `args.heading` to `Some(true)`, and `args.line_number` to `Some(true)` in a single atomic update step.

Sources: [crates/core/flags/defs.rs:6042-6048](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L6042-L6048)

## Related

- [[Flag Definitions]]
- [[Configuration Files]]

