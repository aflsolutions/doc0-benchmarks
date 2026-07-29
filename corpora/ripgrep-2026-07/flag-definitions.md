# Flag Definitions

<details>
<summary>Relevant source files</summary>

The following files were used as context for generating this wiki page:

- [crates/core/flags/defs.rs](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs)
</details>

## Overview

Ripgrep defines its command-line interface through unit structs that implement the `Flag` trait, mapping user inputs—including long names, short switches, negated forms, and aliases—to logical internal states. Each flag implementation encapsulates documentation metadata, categorization, and update logic that mutates low-level argument configurations.

Sources: [crates/core/flags/defs.rs:1-18](https://github.8com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L1-L18), [crates/core/flags/defs.rs:39-44](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L39-L44)

## Flag Trait Abstraction

### Flag Trait Abstraction and Switch Representation

Ripgrep models each logical command-line option as a distinct unit struct that implements the `Flag` trait. Rather than representing isolated raw parameters, each `Flag` implementation handles multiple concrete CLI manifestations for a single underlying capability, including long flag names, optional short flag characters, negated long forms, and arbitrary alias lists. For instance, the `AfterContext` struct implements short flag `A`, long flag `after-context`, and category output mapping to manage matching line counts.

Sources: [crates/core/flags/defs.rs:1-18](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L1-L18), [crates/core/flags/defs.rs:231-267](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L231-L267)

### Trait Method Signatures

Every flag struct conforms to the core trait contract by defining methods that report switch behavior, naming variants, documentation strings, and state updates. The `is_switch` method distinguishes boolean switches from value-accepting options, while accessor methods return optional byte identifiers for short flags, static strings for long flags, negated alternatives, and variable names.

```rust
struct AfterContext;

impl Flag for AfterContext {
    fn is_switch(&self) -> bool { false }
    fn name_short(&self) -> Option<u8> { Some(b'A') }
    fn name_long(&self) -> &'static str { "after-context" }
    fn doc_variable(&self) -> Option<&'static str> { Some("NUM") }
    fn doc_category(&self) -> Category { Category::Output }
    fn doc_short(&self) -> &'static str { "Show NUM lines after each match." }
    fn doc_long(&self) -> &'static str { "Show NUM lines after each match..." }
    fn update(&self, v: FlagValue, args: &mut LowArgs) -> anyhow::Result<()> {
        args.context.set_after(convert::usize(&v.unwrap_value())?);
        Ok(())
    }
}
```

Sources: [crates/core/flags/defs.rs:231-267](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L231-L267)

### Flag Metadata and Categories

Flags are grouped into categories that dictate their grouping in generated help output and man pages. The global `FLAGS` registry array determines the strict order of presentation within each category, placing primary input flags like `Regexp` and `File` first and deprecated flags last.

| Flag Struct | Long Name | Short Flag | Category | Switch? |
| :--- | :--- | :--- | :--- | :--- |
| `AfterContext` | `after-context` | `A` | `Output` | No |
| `AutoHybridRegex` | `auto-hybrid-regex` | None | `Search` | Yes |
| `Binary` | `binary` | None | `Filter` | Yes |
| `CaseSensitive` | `case-sensitive` | `s` | `Search` | Yes |
| `Color` | `color` | None | `Output` | No |

Sources: [crates/core/flags/defs.rs:39-156](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L39-L156), [crates/core/flags/defs.rs:231-376](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L231-L376), [crates/core/flags/defs.rs:502-566](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L502-566)

## Parsing Utilities and Value Unwrapping

### Parsing Utilities and Value Unwrapping

### Overview

Ripgrep's flag definitions rely heavily on helper parsing utilities provided via the `convert` module to transform raw CLI argument strings into typed primitive values, sizing parameters, and human-readable numeric sizes. When flags like `--after-context`, `--dfa-size-limit`, or `--color` receive user input, their respective `update` implementations unwrap the incoming `FlagValue` variant and delegate to conversion routines that perform validation and bounded parsing.

Sources: [crates/core/flags/defs.rs:263-266](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L263-L266), [crates/core/flags/defs.rs:1614-1618](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L1614-L1618)

### Value Unwrapping Execution Flow

The extraction and conversion pipeline follows a strict execution path from raw CLI token to internal state update:

1. **`FlagValue::unwrap_value()`** extracts the inner string or byte slice from a value-bearing argument, panicking or asserting if encountered on a pure boolean switch where `FlagValue::Switch` is set.
2. **`convert::usize()` / `convert::u64()` / `convert::str()`** parse the extracted representation into standard integer or string types with target-width checks (e.g., rejecting out-of-range 64-bit integers on 32-bit platforms).
3. **`convert::human_readable_usize()` / `convert::human_readable_u64()`** process sizing parameters with optional unit suffixes (`K`, `M`, `G`) for flags like `--dfa-size-limit` and `--max-filesize`.

```rust
impl Flag for AfterContext {
    fn update(&self, v: FlagValue, args: &mut LowArgs) -> anyhow::Result<()> {
        args.context.set_after(convert::usize(&v.unwrap_value())?);
        Ok(())
    }
}
```

Sources: [crates/core/flags/defs.rs:263-266](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L263-L266), [crates/core/flags/defs.rs:1614-1618](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L1614-L1618)

### Numeric and Sizing Parameter Handling

Numeric flags enforce strict parsing rules and domain boundaries, handling both decimal scaling suffixes and explicit error propagation via `anyhow`.

| Flag Struct | Long Name | Parsing Function | Supported Suffixes / Values | Error Behavior |
| :--- | :--- | :--- | :--- | :--- |
| `AfterContext` | `after-context` | `convert::usize` | Decimal integers up to `usize::MAX` | Fails on overflow or non-digits |
| `DfaSizeLimit` | `dfa-size-limit` | `convert::human_readable_usize` | `K` (KB), `M` (MB), `G` (GB), or raw bytes | Fails on invalid suffix or overflow |
| `Color` | `color` | `convert::str` | `never`, `auto`, `always`, `ansi` | Fails on unrecognized choice strings |
| `MaxColumns` | `max-columns` | `convert::u64` | Unsigned 64-bit integer | Fails on negative or invalid numbers |

Sources: [crates/core/flags/defs.rs:263-266](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L263-L266), [crates/core/flags/defs.rs:841-849](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L841-L849), [crates/core/flags/defs.rs:1614-1618](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L1614-L1618), [crates/core/flags/defs.rs:4166-4170](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L4166-L4170)

> [!WARNING]
> Sizing flags such as `--dfa-size-limit` and `--regex-size-limit` perform checked arithmetic when scaling values by `K` ($1024$), `M` ($1024^2$), or `G` ($1024^3$). Passing numbers exceeding integer limits triggers an `anyhow` parse error rather than silent truncation.

Sources: [crates/core/flags/defs.rs:1614-1618](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L1614-L1618), [crates/core/flags/defs.rs:6173-6177](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L6173-L6177)

## Context and Positional Flags

### Context Bounds State Mutations

Ripgrep manages surrounding output context via the `AfterContext`, `BeforeContext`, and `Context` flag implementations, which mutate the internal `args.context` state structure. The `Context` flag sets both before and after bounds simultaneously, while `-A`/`--after-context` and `-B`/`--before-context` modify individual bounds.

Sources: [crates/core/flags/defs.rs:263-266](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L263-L266), [crates/core/flags/defs.rs:448-451](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L448-L451), [crates/core/flags/defs.rs:1108-1111](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L1108-L1111)

### Context Precedence and Partial Overrides

The interaction between `-C`/`--context` and the specific `-A`/`-B` flags follows a non-obvious partial override rule modeled after GNU grep. Specific bounds partially override general context settings regardless of the order in which they appear on the command line.

| Flag Combination | Execution Order | Resulting Context State (`before`, `after`) |
| :--- | :--- | :--- |
| `-A1 -C5` | `-A` precedes `-C` | `(5, 1)` |
| `-C5 -A1` | `-C` precedes `-A` | `(5, 1)` |
| `-A1 -B2 -C5` | Mixed specific bounds | `(2, 1)` |

Sources: [crates/core/flags/defs.rs:1165-1210](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L1165-L1210)

> [!NOTE]
> Specific context flags (`-A` and `-B`) only *partially* override `-C`. When `-C5 -A1` is parsed, the after-context becomes `1` while the before-context remains `5`, making it equivalent to `-B5 -A1`. Additionally, explicit `passthru` and context flags mutually override one another depending on parse order.

Sources: [crates/core/flags/defs.rs:1187-1196](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L1187-L1196), [crates/core/flags/defs.rs:299-303](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L299-L303)

### Positional Flag Parsing Rules

Positional arguments and pattern sources interact directly through `Regexp` and `File` flag updates. When either `--regexp` (`-e`) or `--file` (`-f`) is supplied on the command line, ripgrep treats all remaining positional arguments strictly as files or directories to search rather than pattern strings.

Sources: [crates/core/flags/defs.rs:2097-2099](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L2097-L2099), [crates/core/flags/defs.rs:2260-2262](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L2260-L262)

## Mapping Low Flags to High Args

### Mapping Low Flags to High Args

### Overview

The translation flow from raw command-line flags into high-level search options is governed by the `Flag::update` method implementation provided by each flag struct. When ripgrep parses arguments, raw string tokens and parsed flag values are dispatched to specific flag handlers defined across the codebase, which subsequently mutate fields on the intermediate `LowArgs` configuration struct.

Sources: [crates/core/flags/defs.rs:158-160](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L158-L160), [crates/core/flags/defs.rs:263-266](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L263-L266)

### Flag Translation Execution Walkthrough

The translation pipeline takes parsed token values and updates internal configuration states through a defined execution sequence:

1. **Token Extraction:** The parser extracts raw values or boolean switches from lexopt and wraps them into a `FlagValue` enum variant (`FlagValue::Value` or `FlagValue::Switch`).
2. **Lookup and Dispatch:** The parser identifies the matching unit struct implementing the `Flag` trait (such as `Encoding`, `Binary`, or `Crlf`) from the global `FLAGS` slice.
3. **Value Unwrapping and Conversion:** The implementation invokes `v.unwrap_value()` or `v.unwrap_switch()`, passing the payload through conversion helpers like `convert::str()` or `convert::usize()`.
4. **State Mutation and Inter-Flag Conflict Resolution:** The target field on `LowArgs` is updated, and dependent flags or mutually exclusive options are adjusted. For example, enabling `--crlf` explicitly sets `args.null_data = false`, while enabling `--null-data` sets `args.crlf = false` and implies `args.text = true`.

Sources: [crates/core/flags/defs.rs:44-156](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L44-L156), [crates/core/flags/defs.rs:1495-1500](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L1495-L1500), [crates/core/flags/defs.rs:5424-5426](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L5424-L5426)

### Low-Level Argument Mappings and Overrides

| Flag Struct | Long Name | Target `LowArgs` Field | Mutually Exclusive / Overridden Flags |
| :--- | :--- | :--- | :--- |
| `Binary` | `binary` | `args.binary` | Overrides `text` |
| `Crlf` | `crlf` | `args.crlf` | Overrides `null-data` |
| `Encoding` | `encoding` | `args.encoding` | Overridden by `no-encoding` |
| `Multiline` | `multiline` | `args.multiline` | Overrides `stop-on-nonmatch` |
| `NullData` | `null-data` | `args.null_data` | Implies `text`, overrides `crlf` |
| `SearchZip` | `search-zip` | `args.search_zip` | Overrides `pre` |

Sources: [crates/core/flags/defs.rs:554-555](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L554-L555), [crates/core/flags/defs.rs:1491-1492](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L1491-L1492), [crates/core/flags/defs.rs:1699-1701](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L1699-L1701), [crates/core/flags/defs.rs:4558-4559](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L4558-L4559), [crates/core/flags/defs.rs:5418-5419](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L5418-L5419), [crates/core/flags/defs.rs:2471-2472](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L2471-L2472)

> [!WARNING]
> Certain flag update methods enforce strict assertion checks or reset conflicting fields asynchronously during parsing. For instance, `SearchZip::update` completely clears any previously configured preprocessor (`args.pre = None`) when `--search-zip` is enabled, reflecting an asymmetric precedence where compression search takes priority over custom preprocessors.

Sources: [crates/core/flags/defs.rs:6475-6483](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L6475-L6483)

## Indexing and Search Execution Control

### Overview

Indexing and search execution control flags govern operational execution parameters, such as thread counts, regex engine choices, preprocessor hooks, and safety constraints that guard against unsupported option combinations during indexed searches. These flags modify lower-level execution modes and invoke safety checks to prevent runtime errors or inconsistent query execution states.

Sources: [crates/core/flags/defs.rs:167-228](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L167-L228), [crates/core/flags/defs.rs:3511-3520](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L3511-L3520)

### Indexing Safety Checks and Execution Walkthrough

When an indexed search or index maintenance operation is requested via `-X/--index` or `--x-crud`, ripgrep executes strict parameter validation to ensure incompatible filters or flags are not active. The validation walk proceeds through the `LowArgs::indexing_unsupported_flag` routine and check assertions:

1. **Invocation Check:** The flag update method invokes `check_indexing_allowed()` before accepting indexing flags like `Index` or `IndexCrud`.
2. **Unsupported Flag Inspection:** The `indexing_unsupported_flag(&self)` method inspects `LowArgs` state fields in fixed evaluation order.
3. **Branch Termination:** If an unsupported configuration is detected — such as `SearchMode::FilesWithoutMatch`, `BinaryMode::AsText`, custom `EncodingMode` variants, `EngineChoice::PCRE2`, symbol following (`follow`), or active glob filters (`globs`, `iglobs`) — the routine immediately returns `Some(&dyn Flag)` corresponding to the violating flag.
4. **Error Yielding:** The caller uses this returned flag reference to abort execution and report an invalid flag combination when indexing is enabled.

Sources: [crates/core/flags/defs.rs:167-228](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L167-L228), [crates/core/flags/defs.rs:3511-3513](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L3511-L3513), [crates/core/flags/defs.rs:3620-3622](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L3620-L3622)

> [!WARNING]
> The `-X/--index` flag can be specified at most twice. Providing `-X` once enables index searching with standard fallback behavior if no index is found or if queries are ineligible, whereas passing `-X` twice forces ripgrep to abort instead of executing an ordinary search fallback.

Sources: [crates/core/flags/defs.rs:3504-3507](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L3504-L3507), [crates/core/flags/defs.rs:3515-3518](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L3515-L3518)

### Execution Control and Engine Reference Table

| Flag Long Name | Short Flag | Target Field | Purpose and Constraints |
| :--- | :--- | :--- | :--- |
| `engine` | None | `args.engine` | Specifies regex engine (`default`, `pcre2`, or `auto`). Overrides previous `-P` or `--auto-hybrid-regex` flags. |
| `pcre2` | `-P` | `args.engine` | Enables the PCRE2 regex engine (`EngineChoice::PCRE2`). Optional build-time feature. |
| `index` | `-X` | `args.index` | Enables search index utilization. Increments counter up to a maximum of `2`. |
| `x-crud` | None | `args.mode` | Creates or updates an index (`IndexMode::Crud`) for specified paths or current directory. |
| `x-force` | None | `args.index_force` | Forces selected files to be re-indexed regardless of modification timestamps. |
| `x-path` | None | `args.index_path` | Sets an explicit file system path for the index targeted by `x-crud`. |

Sources: [crates/core/flags/defs.rs:1767-1822](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L1767-1822), [crates/core/flags/defs.rs:3453-3520](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L3453-3520), [crates/core/flags/defs.rs:3619-3631](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L3619-L3631), [crates/core/flags/defs.rs:3673-3678](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L3673-3678), [crates/core/flags/defs.rs:3726-3730](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L3726-3730), [crates/core/flags/defs.rs:5705-5759](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L5705-5759)

> [!TIP]
> When updating regex engines via the CLI, `--engine=pcre2` and `--auto-hybrid-regex` interact dynamically. For instance, passing `--auto-hybrid-regex` followed by `--engine=pcre2` sets `EngineChoice::PCRE2`, whereas passing `--engine=pcre2` followed by `--auto-hybrid-regex` assigns `EngineChoice::Auto`.

Sources: [crates/core/flags/defs.rs:1837-1843](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L1837-L1843)

## Related

- [[Argument Parsing]]
- [[Manual Page Generation]]

