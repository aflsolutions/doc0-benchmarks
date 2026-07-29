# Manual Page Generation

<details>
<summary>Relevant source files</summary>

The following files were used as context for generating this wiki page:

- [crates/core/flags/defs.rs](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs)
</details>

## Overview

Ripgrep structures its command-line interface around a unified flag system where each logical option is represented by an implementation of the `Flag` trait, mapping long names, short flags, negated forms, and aliases into cohesive state updates for low-level parsing arguments. Sources: [crates/core/flags/defs.rs:1-18](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L1-L18), [crates/core/flags/defs.rs:39-43](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L39-L43)

The ordering of these flag definitions determines their presentation sequence within generated documentation categories, `-h` and `--help` outputs, and manual pages. Sources: [crates/core/flags/defs.rs:39-43](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L39-L43)

## Flag Definitions for Help Generation

### Overview

Ripgrep defines all available command-line flags as individual unit structs that implement the `Flag` trait, mapping long names, optional short codes, negated forms, and aliases to underlying state modifications inside the `LowArgs` structure. Sources: [crates/core/flags/defs.rs:4-18](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L4-L18), [crates/core/flags/defs.rs:39-44](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L39-L44)

The master array `FLAGS` strictly sequences these trait implementations, controlling their presentation order within help menus and generated documentation categories. Sources: [crates/core/flags/defs.rs:39-46](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L39-L46)

### Flag Metadata Structures and Trait Implementations

Each flag implementation provides accessor methods for command metadata such as `name_long`, `name_short`, `name_negated`, `aliases`, `doc_category`, `doc_short`, `doc_long`, and `update`. For instance, context-related flags like `AfterContext` (`-A` / `--after-context`), `BeforeContext` (`-B` / `--before-context`), and `Context` (`-C` / `--context`) parse numeric string arguments via `convert::usize` and configure the internal `ContextMode` state. Sources: [crates/core/flags/defs.rs:231-267](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L231-L267), [crates/core/flags/defs.rs:416-452](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L416-L452), [crates/core/flags/defs.rs:1073-1112](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L1073-L1112)

| Flag Struct | Long Name | Short Flag | Category | Purpose |
| :--- | :--- | :--- | :--- | :--- |
| `AfterContext` | `after-context` | `A` (`0x41`) | `Category::Output` | Show NUM lines after each match |
| `BeforeContext` | `before-context` | `B` (`0x42`) | `Category::Output` | Show NUM lines before each match |
| `Binary` | `binary` | None | `Category::Filter` | Search binary files without aborting on NUL bytes |
| `CaseSensitive` | `case-sensitive` | `s` (`0x73`) | `Category::Search` | Execute search case sensitively (default) |
| `Color` | `color` | None | `Category::Output` | Control when to use color (`never`, `auto`, `always`, `ansi`) |
| `Context` | `context` | `C` (`0x43`) | `Category::Output` | Show NUM lines before and after each match |
| `Count` | `count` | `c` (`0x63`) | `Category::OutputModes` | Show count of matching lines for each file |
| `Encoding` | `encoding` | `E` (`0x45`) | `Category::Search` | Specify text file encoding (`auto`, `none`, or standard labels) |
| `Engine` | `engine` | None | `Category::Search` | Select regex engine (`default`, `pcre2`, `auto`) |
| `File` | `file` | `f` (`0x66`) | `Category::Input` | Search for patterns listed in an external file |
| `FixedStrings` | `fixed-strings` | `F` (`0x46`) | `Category::Search` | Treat all patterns as literals instead of regexes |
| `Generate` | `generate` | None | `Category::OtherBehaviors` | Generate man pages or shell completion scripts and exit |
| `Glob` | `glob` | `g` (`0x67`) | `Category::Filter` | Include or exclude file paths matching glob patterns |
| `Help` | `help` | `h` (`0x68`) | `Category::Output` | Show help output (condensed for `-h`, verbose for `--help`) |
| `Index` | `index` | `X` (`0x58`) | `Category::Indexing` | Enable searching with a prebuilt search index |
| `Json` | `json` | None | `Category::OutputModes` | Emit search results in JSON Lines format |
| `LineNumber` | `line-number` | `n` (`0x6e`) | `Category::Output` | Show 1-based line numbers |
| `Multiline` | `multiline` | `U` (`0x55`) | `Category::Search` | Enable searching across multiple lines |
| `Regexp` | `regexp` | `e` (`0x65`) | `Category::Input` | Specify an explicit search pattern |
| `Replace` | `replace` | `r` (`0x72`) | `Category::Output` | Replace matches with given replacement text string |

Sources: [crates/core/flags/defs.rs:44-156](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L44-L156), [crates/core/flags/defs.rs:231-267](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L231-L267), [crates/core/flags/defs.rs:502-566](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L502-L566), [crates/core/flags/defs.rs:713-751](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L713-L751), [crates/core/flags/defs.rs:766-851](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L766-L851), [crates/core/flags/defs.rs:1073-1112](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L1073-L1112), [crates/core/flags/defs.rs:1322-1376](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L1322-L1376), [crates/core/flags/defs.rs:1657-1726](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L1657-L1726), [crates/core/flags/defs.rs:1766-1823](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L1766-L1823), [crates/core/flags/defs.rs:2062-2110](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L2062-L2110), [crates/core/flags/defs.rs:2360-2394](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L2360-L2394), [crates/core/flags/defs.rs:2474-2541](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L2474-L2541), [crates/core/flags/defs.rs:2579-2636](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L2579-L2636), [crates/core/flags/defs.rs:2785-2824](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L2785-L2824), [crates/core/flags/defs.rs:3453-3521](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L3453-L3521), [crates/core/flags/defs.rs:3809-3889](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L3809-L3889), [crates/core/flags/defs.rs:3974-4009](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L3974-L4009), [crates/core/flags/defs.rs:4999-4569](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L4999-L4569), [crates/core/flags/defs.rs:6217-6270](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L6217-L6270), [crates/core/flags/defs.rs:6346-6409](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L6346-L6409)

> [!NOTE]
> The ordering of flag structs within the `FLAGS` slice is semantically significant because it establishes the exact layout order for generated documentation like `--help` and manual pages, ensuring deprecated flags remain grouped at the end of their categories. Sources: [crates/core/flags/defs.rs:39-46](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L39-L46), [crates/core/flags/defs.rs:152-156](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L152-L156)

### Validation and Indexing Restrictions

Low-level argument handlers validate mutual exclusions and feature constraints during state updates. For instance, `LowArgs::indexing_unsupported_flag(&self)` scans configurations to detect conflicting flags when index searching is active, returning an `Option<&'static dyn Flag>` referencing the offending option if forbidden flags like `--files-without-match`, `--binary`, `--encoding`, `--engine`, or `--follow` are enabled. Sources: [crates/core/flags/defs.rs:167-228](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L167-L228)

Sources: [crates/core/flags/defs.rs:39-228](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L39-L228)

## Version and Help Flag Processing

### Overview

The representation and processing of help and version flags in ripgrep involve specialized handling because certain flags diverge from standard boolean switch semantics. Specifically, the `-h`/`--help` flags require distinct behaviors that cannot be fully expressed through the generic `Flag` trait interface alone, necessitating specialized logic inside the parser. Ripgrep defines unit structs such as `Help`, `Version`, and `PCRE2Version` to map these command-line representations into internal special operating modes. Sources: [crates/core/flags/defs.rs:2785-2824](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L2785-L2824), [crates/core/flags/defs.rs:5809-5814](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L5809-L5814)

### Help and Version Flag Behaviors

Unlike standard switches where short and long representations share equivalent outcomes, the short help flag `-h` triggers condensed help output, whereas the long flag `--help` produces verbose output containing complete documentation. The `Help::update` method intercepts these values and relies on parser-level special casing, asserting that the flag has no negation. Similarly, `PCRE2Version` updates the `SpecialMode` state to output version metadata for PCRE2 before exiting. Sources: [crates/core/flags/defs.rs:2809-2824](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L2809-L2824), [crates/core/flags/defs.rs:5809-5814](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L5809-L5814)

| Struct Name | Long Flag | Short Flag | Category | Target Special Mode |
| :--- | :--- | :--- | :--- | :--- |
| `Help` | `help` | `h` (`0x68`) | `Category::Output` | `SpecialMode::HelpShort` or `SpecialMode::HelpLong` |
| `PCRE2Version` | `pcre2-version` | None | `Category::OtherBehaviors` | `SpecialMode::VersionPCRE2` |

Sources: [crates/core/flags/defs.rs:2785-2824](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L2785-L2824), [crates/core/flags/defs.rs:5784-5814](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L5784-L5814)

> [!WARNING]
> The short `-h` flag and long `--help` flag execute different code paths in the underlying parser and set distinct enum variants (`SpecialMode::HelpShort` vs `SpecialMode::HelpLong`), overriding standard flag parity assumptions. Sources: [crates/core/flags/defs.rs:2809-2824](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L2809-L2824)

Sources: [crates/core/flags/defs.rs:2785-2824](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L2785-L2824), [crates/core/flags/defs.rs:5784-5824](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L5784-L5824)

## Manual Page Generation Mechanics

### Overview

Ripgrep supports generating documentation artifacts and shell completion scripts directly from its internal flag metadata definitions via the `--generate` command-line flag. Implemented as the unit struct `Generate`, this flag accepts a specific target argument (`KIND`) and configures ripgrep to emit the requested documentation to standard output before immediately terminating without performing any file searches. Sources: [crates/core/flags/defs.rs:2474-2497](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L2474-L2497)

### Target Kinds and Execution Flow

When a user invokes `--generate <KIND>`, the `Generate::update` function parses the provided string value, maps it to a specific `GenerateMode` enum variant, and updates the low-level argument execution mode via `args.mode.update(Mode::Generate(genmode))`. The supported generation targets and their corresponding internal choices are defined within the flag's documentation choices and parsing logic. Sources: [crates/core/flags/defs.rs:2519-2540](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L2519-L2540)

| Generation Target (`KIND`) | `GenerateMode` Variant | Description |
| :--- | :--- | :--- |
| `man` | `GenerateMode::Man` | Generates a manual page for ripgrep in the `roff` format. |
| `complete-bash` | `GenerateMode::CompleteBash` | Generates a completion script for the `bash` shell. |
| `complete-zsh` | `GenerateMode::CompleteZsh` | Generates a completion script for the `zsh` shell. |
| `complete-fish` | `GenerateMode::CompleteFish` | Generates a completion script for the `fish` shell. |
| `complete-powershell` | `GenerateMode::CompletePowerShell` | Generates a completion script for PowerShell. |

Sources: [crates/core/flags/defs.rs:2500-2537](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L2500-L2537)

> [!NOTE]
> Unrecognized generation targets passed to `--generate` will trigger an error via `anyhow::bail!("choice '{unk}' is unrecognized")`, terminating execution during argument parsing. Sources: [crates/core/flags/defs.rs:2536-2536](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L2536-L2536)

Sources: [crates/core/flags/defs.rs:2474-2541](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L2474-L2541)

## Type-Specific Flag Formatting Helpers

### Overview

Ripgrep processes human-readable flags that accept numeric, size-limited, or formatted string arguments by implementing parsing and conversion helpers within individual `Flag` struct updates. These flags declare documentation variables like `NUM`, `ENCODING`, `SEPARATOR`, or `GLOB` and map raw command-line values into structured fields on `LowArgs`. Sources: [crates/core/flags/defs.rs:245-247](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L245-L247), [crates/core/flags/defs.rs:1674-1676](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L1674-L1676)

### Flag Formatting and Value Conversion Helpers

When numeric and string parameters are passed to flags such as `--after-context`, `--dfa-size-limit`, or `--path-separator`, their `update` methods invoke conversion utilities to validate and parse byte sizes, integer counts, or exact byte lengths. For example, `AfterContext::update` calls `convert::usize(&v.unwrap_value())?` to populate `args.context`, while `PathSeparator::update` unescapes byte strings and enforces that separators measure exactly one byte in length. Sources: [crates/core/flags/defs.rs:263-266](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L263-L266), [crates/core/flags/defs.rs:5991-6007](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L5991-L6007)

| Flag Struct | Long Name | Doc Variable | Target Field in `LowArgs` | Conversion Rule / Validation |
| :--- | :--- | :--- | :--- | :--- |
| `AfterContext` | `after-context` | `NUM` | `args.context` | Parses value via `convert::usize` |
| `DfaSizeLimit` | `dfa-size-limit` | `NUM+SUFFIX?` | `args.dfa_size_limit` | Parses human-readable size (`K`, `M`, `G`) via `convert::human_readable_usize` |
| `Encoding` | `encoding` | `ENCODING` | `args.encoding` | Maps string labels (`auto`, `none`, or explicit encoding) |
| `PathSeparator` | `path-separator` | `SEPARATOR` | `args.path_separator` | Unescapes bytes; requires length of exactly 1 byte |
| `MaxColumns` | `max-columns` | `NUM` | `args.max_columns` | Parses `u64`; value `0` sets field to `None` |

Sources: [crates/core/flags/defs.rs:242-247](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L242-L247), [crates/core/flags/defs.rs:1589-1594](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L1589-L1594), [crates/core/flags/defs.rs:1668-1676](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L1668-L1676), [crates/core/flags/defs.rs:5567-5572](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L5567-L5572), [crates/core/flags/defs.rs:4145-4150](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L4145-L4150)

> [!NOTE]
> Human-readable size parsing for flags like `--dfa-size-limit` supports unit suffixes `K`, `M`, and `G` (representing kilobytes, megabytes, and gigabytes). If no suffix is attached, the numeric input is processed strictly as raw bytes. Sources: [crates/core/flags/defs.rs:1608-1611](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L1608-L1611)

> [!WARNING]
> Path separators configured via `--path-separator` are restricted to exactly one byte. Providing multi-byte strings or unescaped sequences that expand past one byte will trigger an explicit error bail outlining shell expansion quirks on Windows. Sources: [crates/core/flags/defs.rs:5593-5607](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L5593-L5607)

Sources: [crates/core/flags/defs.rs:231-267](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L231-L267), [crates/core/flags/defs.rs:1585-1726](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L1585-L1726), [crates/core/flags/defs.rs:4134-4171](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L4134-L4171), [crates/core/flags/defs.rs:5563-5609](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L5563-L5609)

## Flag Metadata and Documentation Integration

### Overview

Ripgrep bridges high-level command-line flag structures and low-level argument storage by mapping every documented command-line flag onto an implementation of the `Flag` trait. Each unit struct representing a flag defines metadata methods such as `name_long`, `name_short`, `doc_category`, and crucially, an `update` method that mutates low-level argument structures. Sources: [crates/core/flags/defs.rs:4-18](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L4-L18), [crates/core/flags/defs.rs:235-266](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L235-L266)

### Flag Parsing Execution Walkthrough

When command-line arguments are processed, parsing follows an explicit execution flow through trait implementations and argument state containers:

1. The raw argument parser identifies a flag token matching a registered long or short identifier (e.g., `-A` or `--after-context`). Sources: [crates/core/flags/defs.rs:239-244](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L239-L244)
2. The parser resolves the token to its corresponding `Flag` trait implementation defined across the flag definitions module. Sources: [crates/core/flags/defs.rs:39-44](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L39-L44)
3. The parser extracts the accompanying argument or switch state and packages it into a `FlagValue` enum. Sources: [crates/core/flags/defs.rs:263-263](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L263-L263)
4. The trait's `update` method is invoked, passing the `FlagValue` and a mutable reference to the low-level argument container (`&mut LowArgs`). Sources: [crates/core/flags/defs.rs:263-263](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L263-L263)
5. The `update` implementation validates, converts, and assigns the parsed value to specific fields on `LowArgs` (such as `args.context`, `args.engine`, or `args.binary`). Sources: [crates/core/flags/defs.rs:264-265](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L264-L265)

> [!NOTE]
> The order of flags inside the global `FLAGS` static slice is critical because it directly dictates the presentation order of flags within generated documentation, help text (`-h`/`--help`), and manual pages grouped by category. Sources: [crates/core/flags/defs.rs:39-43](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L39-L43)

### Logical Flag Mapping Reference

Multiple command-line manifestations often map to a single logical flag structure. The table below outlines sample flag implementations, their user-facing aliases or negated forms, and their corresponding mutation target inside `LowArgs`:

| Flag Struct | Long Name | Short Name | Negated Flag | Target Field in `LowArgs` |
| :--- | :--- | :--- | :--- | :--- |
| `AfterContext` | `after-context` | `A` | None | `args.context` |
| `AutoHybridRegex` | `auto-hybrid-regex` | None | `no-auto-hybrid-regex` | `args.engine` |
| `Binary` | `binary` | None | `no-binary` | `args.binary` |
| `Crlf` | `crlf` | None | `no-crlf` | `args.crlf` / `args.null_data` |
| `Index` | `index` | `X` | None | `args.index` |

Sources: [crates/core/flags/defs.rs:239-266](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L239-L266), [crates/core/flags/defs.rs:325-375](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L325-L375), [crates/core/flags/defs.rs:510-565](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L510-565), [crates/core/flags/defs.rs:1465-1501](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L1465-L1501), [crates/core/flags/defs.rs:3513-3520](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L3513-L3520)

Sources: [crates/core/flags/defs.rs:4-18](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L4-L18), [crates/core/flags/defs.rs:39-46](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L39-L46), [crates/core/flags/defs.rs:231-267](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L231-L267), [crates/core/flags/defs.rs:325-375](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L325-L375), [crates/core/flags/defs.rs:502-566](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L502-L566), [crates/core/flags/defs.rs:1465-1501](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L1465-L1501), [crates/core/flags/defs.rs:3513-3520](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L3513-L3520)

## Related

- [[Flag Definitions]]

