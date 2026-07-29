# Regex Options

<details>
<summary>Relevant source files</summary>

The following files were used as context for generating this wiki page:

- [crates/core/flags/defs.rs](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs)
</details>

## Overview

Ripgrep defines comprehensive command-line flags through implementations of the `Flag` trait, mapping multiple user-facing aliases and negated forms to singular logical states within its argument parsing layer. These options control matching behavior, engine execution characteristics, search boundaries, and resource thresholds.

Sources: [crates/core/flags/defs.rs:1-18](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L1-L18), [crates/core/flags/defs.rs:39-44](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L39-L44)

## Case Sensitivity Flag Definitions

### Overview

Ripgrep defines three core case sensitivity flags—`-s`/`--case-sensitive`, `-i`/`--ignore-case`, and `-S`/`--smart-case`—which map directly to the `CaseMode` representation inside `LowArgs`. Each flag struct implements the `Flag` trait to parse user inputs, enforce switch constraints, and update the global search state.

Sources: [crates/core/flags/defs.rs:713-751](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L713-L751), [crates/core/flags/defs.rs:3223-3263](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L3223-L3263), [crates/core/flags/defs.rs:6514-6559](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L6514-L6559)

### Flag Representation and Parsing Table

The following table details the struct definitions, short flags, long flags, default values, and internal `CaseMode` mappings for each case sensitivity option.

| Flag Struct | Short Flag | Long Flag | Internal `CaseMode` Mapping | Sources |
| :--- | :--- | :--- | :--- | :--- |
| `CaseSensitive` | `s` | `case-sensitive` | `CaseMode::Sensitive` | [crates/core/flags/defs.rs:713-751](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L713-L751) |
| `IgnoreCase` | `i` | `ignore-case` | `CaseMode::Insensitive` | [crates/core/flags/defs.rs:3223-3263](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L3223-L3263) |
| `SmartCase` | `S` | `smart-case` | `CaseMode::Smart` | [crates/core/flags/defs.rs:6514-6559](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L6514-L6559) |

Sources: [crates/core/flags/defs.rs:713-751](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L713-L751), [crates/core/flags/defs.rs:3223-3263](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L3223-L3263), [crates/core/flags/defs.rs:6514-6559](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L6514-L6559)

### Mode Update Mechanics

When parsed from the command line, each flag's `update` method asserts that the input value is an active switch and assigns the corresponding variant to `args.case`. 

> [!NOTE]
> None of the three case sensitivity flags feature native CLI negations (such as `--no-case-sensitive`). Instead, precedence is entirely determined by command-line ordering: whichever flag appears last among case options overwrites `args.case`.

Sources: [crates/core/flags/defs.rs:746-750](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L746-L750), [crates/core/flags/defs.rs:3258-3262](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L3258-L3262), [crates/core/flags/defs.rs:6554-6558](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L6554-L6558)

## Boundary and Anchoring Options

### Overview

Ripgrep provides dedicated flags to govern search matching boundaries, restricting searches to full lines or specific word boundaries. These options are managed via implementations of the `Flag` trait which translate user inputs into specific configurations inside the low-level argument structure.

Sources: [crates/core/flags/defs.rs:4083-4119](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L4083-L4119), [crates/core/flags/defs.rs:6644-6680](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L6644-L6680)

### Boundary Option Configuration Table

The following table summarizes the boundary and full line configuration flags defined in ripgrep:

| Flag Struct | Short Flag | Long Flag | Internal State Mapping | Sources |
| :--- | :--- | :--- | :--- | :--- |
| `LineRegexp` | `x` | `line-regexp` | `args.boundary = Some(BoundaryMode::Line)` | [crates/core/flags/defs.rs:4083-4119](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L4083-L4119) |
| `WordRegexp` | `w` | `word-regexp` | `args.boundary = Some(BoundaryMode::Word)` | [crates/core/flags/defs.rs:6644-6680](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L6644-L6680) |

Sources: [crates/core/flags/defs.rs:4083-4119](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L4083-L4119), [crates/core/flags/defs.rs:6644-6680](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L6644-L6680)

### Update Mechanics and Overrides

When a user invokes either `-x`/`--line-regexp` or `-w`/`--word-regexp`, the corresponding `update` method executes an assertion verifying that the flag value is an active switch. It then sets `args.boundary` to either `BoundaryMode::Line` or `BoundaryMode::Word`.

> [!WARNING]
> `--line-regexp` explicitly overrides the `--word-regexp` flag if both are supplied, as full line matching takes precedence over word boundary constraints in the low argument resolution phase.

Sources: [crates/core/flags/defs.rs:4113-4118](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L4113-L4118), [crates/core/flags/defs.rs:6674-6679](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L6674-L6679)

## Multiline and Line Terminator Flags

### Overview

Ripgrep provides specific flags to control multiline matching modes, dotall behavior, and CRLF line terminator support. These options configure how regular expressions interact with line boundaries and newline characters during searches.

Sources: [crates/core/flags/defs.rs:1457-1502](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L1457-L1502), [crates/core/flags/defs.rs:4999-4569](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L4999-L4569), [crates/core/flags/defs.rs:4587-4633](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L4587-L4633)

### Multiline and Line Terminator Flag Reference Table

The following table details the flags governing multiline and line terminator configurations:

| Flag Struct | Short Flag | Long Flag | Internal State Mapping | Sources |
| :--- | :--- | :--- | :--- | :--- |
| `Crlf` | None | `crlf` (negatable: `no-crlf`) | `args.crlf = v.unwrap_switch(); if args.crlf { args.null_data = false; }` | [crates/core/flags/defs.rs:1457-1502](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L1457-L1502) |
| `Multiline` | `U` | `multiline` (negatable: `no-multiline`) | `args.multiline = v.unwrap_switch(); if args.multiline { args.stop_on_nonmatch = false; }` | [crates/core/flags/defs.rs:4999-4569](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L4999-L4569) |
| `MultilineDotall` | None | `multiline-dotall` (negatable: `no-multiline-dotall`) | `args.multiline_dotall = v.unwrap_switch()` | [crates/core/flags/defs.rs:4587-4633](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L4587-L4633) |

Sources: [crates/core/flags/defs.rs:1457-1502](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L1457-L1502), [crates/core/flags/defs.rs:4999-4569](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L4999-L4569), [crates/core/flags/defs.rs:4587-4633](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L4587-L4633)

### Update Mechanics and Flag Interactions

When the `Multiline` flag is updated with an active switch, it sets `args.multiline` to `true` and conditionally disables `args.stop_on_nonmatch`. Similarly, activating the `Crlf` flag sets `args.crlf` to `true` while enforcing `args.null_data = false`. 

> [!WARNING]
> Enabling `crlf` explicitly overrides `null-data` by setting `args.null_data` to false, whereas enabling `null-data` overrides `crlf` by setting `args.crlf` to false. 

Sources: [crates/core/flags/defs.rs:1495-1501](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L1495-L1501), [crates/core/flags/defs.rs:4563-4568](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L4563-L4568), [crates/core/flags/defs.rs:5422-5426](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L5422-L5426)

## Unicode and Encoding Flags

### Overview

Ripgrep provides dedicated flags to manage Unicode character property support across its regex engines and handle toggles specific to PCRE2 Unicode behavior. These options control whether patterns operate in Unicode mode or plain byte/ASCII mode, affecting character classes, case folding, and boundary assertions.

Sources: [crates/core/flags/defs.rs:5157-5203](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L5157-L5203), [crates/core/flags/defs.rs:5259-5336](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L5259-L5336)

### Unicode and PCRE2 Flag Reference Table

The following table outlines the flags responsible for Unicode and PCRE2 Unicode configuration, their names, short identifiers, negations, and internal state updates:

| Flag Struct | Short Flag | Long Flag | Negated Form | Internal State Mapping | Sources |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `NoPcre2Unicode` | None | `no-pcre2-unicode` | `pcre2-unicode` | `args.no_unicode = v.unwrap_switch();` | [crates/core/flags/defs.rs:5157-5203](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L5157-L5203) |
| `NoUnicode` | None | `no-unicode` | `unicode` | `args.no_unicode = v.unwrap_switch();` | [crates/core/flags/defs.rs:5259-5336](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L5259-L5336) |

Sources: [crates/core/flags/defs.rs:5157-5203](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L5157-L5203), [crates/core/flags/defs.rs:5259-5336](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L5259-L5336)

### Update Mechanics and Deprecations

Both `NoUnicode` and the deprecated `NoPcre2Unicode` update the underlying `args.no_unicode` boolean field directly via `v.unwrap_switch()`. By default, Unicode mode is enabled (`args.no_unicode` is `false`). When `NoUnicode` or `NoPcre2Unicode` is passed, `args.no_unicode` becomes `true`, disabling Unicode-aware character classes (`\w`, `\s`, `\d`), Unicode case folding, and restricting the dot operator (`.`) to valid UTF-8 encoded scalar values.

> [!NOTE]
> `--no-pcre2-unicode` is marked as deprecated in favor of `--no-unicode`, though both map to the exact same internal `args.no_unicode` flag state during argument resolution.

Sources: [crates/core/flags/defs.rs:5178-5187](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L5178-L5187), [crates/core/flags/defs.rs:5313-5316](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L5313-L5316)

## Engine Selection and Resource Limits

### Overview

Ripgrep exposes options for choosing between regular expression engines, treating patterns as literal text strings, and constraining memory consumption via size limits on compiled regexes and DFAs. These configurations govern the underlying matching mechanics and resource allocation constraints.

Sources: [crates/core/flags/defs.rs:1766-1823](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L1766-L1823), [crates/core/flags/defs.rs:2360-2395](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L2360-L2395), [crates/core/flags/defs.rs:5705-5760](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L5705-L5760)

### Engine Selection and Literal Flags Reference Table

The following table summarizes the flags and options governing engine selection, literal string matching, and automatic hybrid regex behavior:

| Flag Struct | Short Flag | Long Flag | Negated Form | Internal State Mapping | Sources |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `AutoHybridRegex` | None | `auto-hybrid-regex` | `no-auto-hybrid-regex` | `args.engine = EngineChoice::Auto` / `Default` | [crates/core/flags/defs.rs:317-376](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L317-L376) |
| `Engine` | None | `engine` | None | `args.engine = EngineChoice::Default` / `PCRE2` / `Auto` | [crates/core/flags/defs.rs:1766-1823](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L1766-L1823) |
| `FixedStrings` | `-F` | `fixed-strings` | `no-fixed-strings` | `args.fixed_strings = v.unwrap_switch();` | [crates/core/flags/defs.rs:2360-2395](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L2360-L2395) |
| `PCRE2` | `-P` | `pcre2` | `no-pcre2` | `args.engine = EngineChoice::PCRE2` / `Default` | [crates/core/flags/defs.rs:5705-5760](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L5705-L5760) |

Sources: [crates/core/flags/defs.rs:317-376](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L317-L376), [crates/core/flags/defs.rs:1766-1823](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L1766-L1823), [crates/core/flags/defs.rs:2360-2395](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L2360-L2395), [crates/core/flags/defs.rs:5705-5760](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L5705-L5760)

### Resource Limits Reference Table

Memory and size constraints are enforced via human-readable numeric limits that accept byte sizes or suffixes (`K`, `M`, `G`):

| Flag Struct | Short Flag | Long Flag | Value Variable | Internal State Mapping | Sources |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `DfaSizeLimit` | None | `dfa-size-limit` | `NUM+SUFFIX?` | `args.dfa_size_limit = Some(convert::human_readable_usize(&v)?);` | [crates/core/flags/defs.rs:1581-1619](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L1581-1619) |
| `RegexSizeLimit` | None | `regex-size-limit` | `NUM+SUFFIX?` | `args.regex_size_limit = Some(convert::human_readable_usize(&v)?);` | [crates/core/flags/defs.rs:1613-1619](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L1613-L1619), [crates/core/flags/defs.rs:6137-6178](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L6137-6178) |

Sources: [crates/core/flags/defs.rs:1581-1619](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L1581-1619), [crates/core/flags/defs.rs:6137-6178](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L6137-6178)

### Engine Update Walkthrough

When parsing flags that affect engine selection, updates flow through specific `Flag::update` implementations. For example, updating via `--engine` executes `Engine::update`: it unwraps the flag value, converts it to a string slice via `convert::str(&v)`, matches against `"default"`, `"pcre2"`, or `"auto"`, and assigns the resulting `EngineChoice` variant directly to `args.engine`. Similarly, `PCRE2::update` maps boolean switch values to either `EngineChoice::PCRE2` or `EngineChoice::Default`.

> [!NOTE]
> The deprecated `--auto-hybrid-regex` flag maps switch states to `EngineChoice::Auto` or `EngineChoice::Default`, while `--engine=pcre2` and `-P` (`PCRE2`) override previous engine choices and configure `args.engine = EngineChoice::PCRE2`.

Sources: [crates/core/flags/defs.rs:367-375](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L367-L375), [crates/core/flags/defs.rs:1812-1822](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L1812-L1822), [crates/core/flags/defs.rs:5752-5759](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L5752-L5759)

## Related

- [[Rust Regex Matching]]

