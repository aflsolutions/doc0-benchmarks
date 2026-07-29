# Packaging Specs

<details>
<summary>Relevant source files</summary>

The following files were used as context for generating this wiki page:

- [crates/core/flags/defs.rs](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs)
</details>

## Overview

The command-line interface implementation relies on a comprehensive flag definition infrastructure located in `crates/core/flags/defs.rs`. This module defines every available command-line option as an individual unit struct implementing the `Flag` trait, mapping user-facing inputs to internal configuration states.

Sources: [crates/core/flags/defs.rs:1-18](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L1-L18), [crates/core/flags/defs.rs:39-44](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L39-L44)

## CLI Flag Definitions

### Overview

The `defs.rs` module establishes the complete registry of ripgrep command-line options. Each logical option is represented by a dedicated unit struct implementing the `Flag` trait, allowing multiple user-facing flags (such as long names, short single-character variants, negated forms, and aliases) to manipulate a single unified internal setting.

Sources: [crates/core/flags/defs.rs:4-18](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L4-L18)

### Flag Registry and Ordering

The master registry array `FLAGS` holds references to every implemented flag type. The exact sequence within this slice governs the presentation order of flags in generated help output (`-h`, `--help`) and man pages, with deprecated flags positioned last in their respective categories.

Sources: [crates/core/flags/defs.rs:39-44](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L39-L44), [crates/core/flags/defs.rs:152-156](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L152-L156)

### Indexing Compatibility Validation

When search indexing is active, configuration parameters are scanned to detect incompatible feature flags. If an unsupported filter or mode is enabled, a reference to the offending flag struct is returned.

| Flag Struct | Conflicting State Condition | Source Reference |
| :--- | :--- | :--- |
| `FilesWithoutMatch` | `self.mode` is `Mode::Search(SearchMode::FilesWithoutMatch)` | [crates/core/flags/defs.rs:170-172](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L170-L172) |
| `Binary` | `self.binary` is `BinaryMode::AsText` | [crates/core/flags/defs.rs:173-175](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L173-L175) |
| `Encoding` | `self.encoding` is not `EncodingMode::Auto` | [crates/core/flags/defs.rs:176-178](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L176-L178) |
| `Engine` | `self.engine` is `EngineChoice::PCRE2` | [crates/core/flags/defs.rs:179-181](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L179-L181) |
| `Follow` | `self.follow` is `true` | [crates/core/flags/defs.rs:182-184](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L182-L184) |
| `Glob` | `self.globs` or `self.iglobs` is non-empty | [crates/core/flags/defs.rs:185-193](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L185-L193) |

Sources: [crates/core/flags/defs.rs:167-228](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L167-L228)

## Generate Flag Configuration

### Overview

The handling of package generation flags within ripgrep is driven by the `--generate` command-line option, implemented via the `Generate` struct and its associated `Flag` trait implementation. This mechanism instructs ripgrep to build specialized output artifacts such as man pages or shell completion scripts, and then terminate immediately without performing any file search operations.

Sources: [crates/core/flags/defs.rs:2474-2498](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L2474-L2498)

### Supported Generation Kinds

When a user specifies `--generate <KIND>`, the input argument is parsed and mapped directly to an internal `GenerateMode` enum variant. The recognized kinds dictate which documentation or completion script format is written to standard output.

| Kind Identifier | `GenerateMode` Variant | Description / Output Format |
| :--- | :--- | :--- |
| `man` | `GenerateMode::Man` | Generates a manual page for ripgrep in the `roff` format | [crates/core/flags/defs.rs:2501-2503](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L2501-L2503), [crates/core/flags/defs.rs:2531|](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L2531) |
| `complete-bash` | `GenerateMode::CompleteBash` | Generates a completion script for the `bash` shell | [crates/core/flags/defs.rs:2504-2506](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L2504-L2506), [crates/core/flags/defs.rs:2532|](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L2532) |
| `complete-zsh` | `GenerateMode::CompleteZsh` | Generates a completion script for the `zsh` shell | [crates/core/flags/defs.rs:2507-2509](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L2507-L2509), [crates/core/flags/defs.rs:2533|](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L2533) |
| `complete-fish` | `GenerateMode::CompleteFish` | Generates a completion script for the `fish` shell | [crates/core/flags/defs.rs:2510-2512](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L2510-L2512), [crates/core/flags/defs.rs:2534|](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L2534) |
| `complete-powershell` | `GenerateMode::CompletePowerShell` | Generates a completion script for PowerShell | [crates/core/flags/defs.rs:2513-2515](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L2513-L2515), [crates/core/flags/defs.rs:2535|](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L2535) |

Sources: [crates/core/flags/defs.rs:2500-2515](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L2500-L2515), [crates/core/flags/defs.rs:2530-2537](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L2530-L2537)

### Execution Walkthrough and State Update

The configuration update lifecycle follows a precise path when processing package generation flags:
1. The flag implementation extracts the raw flag value via `v.unwrap_value()`.
2. `convert::str()` borrows the string slice representation of the target kind.
3. A match statement maps the string to a `GenerateMode` variant (returning an error via `anyhow::bail!` if unrecognized).
4. `args.mode.update(Mode::Generate(genmode))` mutates the active operational mode within `LowArgs`.

Sources: [crates/core/flags/defs.rs:2529-2540](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L2529-L2540)

> [!NOTE]
> The mode-update mechanism allows subsequent non-generation flags (such as `--json` followed by `--no-json`) to reset the operational mode back to standard searching, demonstrating that generation modes participate fully in the overarching argument override sequence.

Sources: [crates/core/flags/defs.rs:2574-2577](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L2574-L2577)

## Platform Feature Trait Implementations

### Overview

Feature flags and platform-specific behaviors in ripgrep are controlled through distinct unit structs implementing the `Flag` trait, adapting their behavior dynamically according to target execution platforms. Certain capabilities, such as conditional separator validation and hostname or path lookups, rely explicitly on platform compilation targets like Unix or Windows.

Sources: [crates/core/flags/defs.rs:1310-1319](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L1310-L1319), [crates/core/flags/defs.rs:2939-2944](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L2939-L2944)

### Platform-Specific Trait Behavior

The execution paths for validating raw byte streams and interpreting host environment configurations vary between operating systems. For example, `ContextSeparator` and `FieldContextSeparator` perform UTF-8 checks during unescaping, allowing raw byte sequences under Unix systems via `OsStrExt::as_bytes` when explicit byte-level fallbacks are tested.

Sources: [crates/core/flags/defs.rs:1310-1319](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L1310-L1319), [crates/core/flags/defs.rs:1954-1963](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L1954-L1963)

Similarly, `HyperlinkFormat` evaluates default schemes conditioned on the target platform architecture during test assertions, mapping `--hyperlink-format default` to `file://{path}` on Windows and `file://{host}{path}` on non-Windows platforms.

Sources: [crates/core/flags/defs.rs:3137-3142](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L3137-L3142)

### Call-Chain Execution Walkthrough

The evaluation and state mutation for platform-sensitive flags follow an explicit sequence during command-line parsing:
1. `parse_low_raw()` captures raw command-line arguments as OS strings or byte slices.
2. The parser looks up the matching `Flag` implementation (e.g., `HyperlinkFormat`, `ContextSeparator`, or `IndexPath`).
3. The instance's `update()` method is invoked with a `FlagValue` enum.
4. `convert::str()` or `convert::string()` extracts and validates the string slice or path buffer.
5. Target platform conditional branches verify constraints (such as `#[cfg(unix)]` byte vector conversions) before committing the value to `LowArgs`.

Sources: [crates/core/flags/defs.rs:1310-1319](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L1310-L1319), [crates/core/flags/defs.rs:3118-3124](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L3118-L3124)

> [!NOTE]
> Unsupported flag checks under restricted features (such as `unstable-index`) explicitly verify compilation configuration flags via `cfg!(feature = "unstable-index")`, causing parsing to fail immediately when unstable indexing features are compiled out of the binary.

Sources: [crates/core/flags/defs.rs:3526-3529](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L3526-L3529)

## Flag Parsing and Validation

### Overview

Validation logic for command-line options in ripgrep ensures that conflicting, out-of-bounds, or unsupported parameters are caught early during parsing. The core validation framework relies on individual `Flag::update` methods, helper functions, and bounds-checking utilities to maintain consistency across operational flags.

Sources: [crates/core/flags/defs.rs:167-228](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L167-L228), [crates/core/flags/defs.rs:3512-3519](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L3512-L3519)

### Validation Logic and Helper Functions

The validation pipeline enforces structural invariants on low-level arguments before search execution begins. For example, the `-X/--index` flag invokes `check_indexing_allowed()` and ensures that the repetition count does not exceed two updates, returning an error via `anyhow::ensure!`.

Sources: [crates/core/flags/defs.rs:3512-3519](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L3512-L3519)

| Helper / Flag | Validation Rule | Error / Fallback Behavior |
| :--- | :--- | :--- |
| `Index` flag update | `args.index <= 2` after saturating addition | Returns an error if `-X/--index` is given more than twice |
| `PathSeparator` flag update | Unescaped byte slice length must equal 1 | Returns an error via `anyhow::bail!` if length != 1 |
| Indexing check function | Checks if active filters conflict with indexing | Returns `Some(&'static dyn Flag)` referencing the first offending flag |

Sources: [crates/core/flags/defs.rs:170-226](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L170-L226), [crates/core/flags/defs.rs:5594-5607](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L5594-L5607)

### Call-Chain Execution Walkthrough

When a user passes a constrained option, validation routines execute in a precise sequence to verify input validity:
1. `parse_low_raw()` captures the command-line input and dispatches to the corresponding flag's `update()` method.
2. The flag calls validation helpers (such as `check_indexing_allowed()`) or string converters (`convert::string()`, `convert::u64()`).
3. Size limits or byte constraints are evaluated (e.g., path separator checks `raw.len() == 1`).
4. `anyhow::bail!` or `anyhow::ensure!` intercepts invalid inputs and halts parsing with a descriptive error.
5. If valid, the state is committed to the mutable `LowArgs` instance.

Sources: [crates/core/flags/defs.rs:3512-3519](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L3512-L3519), [crates/core/flags/defs.rs:5592-5608](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L5592-L5608)

> [!WARNING]
> Path separators provided via shell arguments on Windows may be auto-expanded by certain shells; ripgrep explicitly instructs users to pass double slashes (`//`) or valid escape sequences when validating single-byte requirements.

Sources: [crates/core/flags/defs.rs:5599-5606](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L5599-L5606)

## Package Manifest Generation Flags

### Overview

Package manifest and deployment generation metadata are controlled by dedicated generation flags within ripgrep, specifically implemented via the `Generate` struct and associated modes. These specifications govern how deployment documentation, manual pages, and shell completion scripts are emitted directly to standard output.

Sources: [crates/core/flags/defs.rs:2474-2541](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L2474-L2541)

### Generation Flag Configuration and Choices

The `--generate` flag accepts specific kind arguments to produce deployment artifacts or shell integration scripts. When invoked, it transitions the operational mode of ripgrep into `Mode::Generate(genmode)` and terminates execution without performing file searches.

Sources: [crates/core/flags/defs.rs:2496-2517](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L2496-L2517), [crates/core/flags/defs.rs:2529-2540](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L2529-L2540)

| Kind Argument | Target Output Format | Associated `GenerateMode` Variant |
| :--- | :--- | :--- |
| `man` | Manual page in roff format | `GenerateMode::Man` |
| `complete-bash` | Bash shell completion script | `GenerateMode::CompleteBash` |
| `complete-zsh` | Zsh shell completion script | `GenerateMode::CompleteZsh` |
| `complete-fish` | Fish shell completion script | `GenerateMode::CompleteFish` |
| `complete-powershell` | PowerShell completion script | `GenerateMode::CompletePowerShell` |

Sources: [crates/core/flags/defs.rs:2501-2515](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L2501-L2515), [crates/core/flags/defs.rs:2530-2536](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L2530-L2536)

> [!TIP]
> Generation modes completely suppress standard file traversal and pattern matching. Passing `--generate` causes ripgrep to print the requested script or roff manual to `stdout` and exit immediately.

Sources: [crates/core/flags/defs.rs:2496-2497](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L2496-L2497)

### Execution Walkthrough and State Update

The update handler for generation manifests maps string tokens to typed generation enums:
1. The `Generate` flag implementation extracts the string value from `FlagValue::Value`.
2. `convert::str()` validates UTF-8 compliance of the argument.
3. A match statement maps choices to variants (`man` → `GenerateMode::Man`, `complete-bash` → `GenerateMode::CompleteBash`, etc.), returning an error via `anyhow::bail!` on unrecognized inputs.
4. `args.mode.update(Mode::Generate(genmode))` overrides the current operational mode.

Sources: [crates/core/flags/defs.rs:2529-2540](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L2529-L2540)

## Related

- [[Release Workflows]]

