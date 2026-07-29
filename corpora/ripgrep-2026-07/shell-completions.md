# Shell Completions

<details>
<summary>Relevant source files</summary>

The following files were used as context for generating this wiki page:

- [crates/core/flags/defs.rs](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs)
</details>

## Overview

Ripgrep provides built-in support for generating shell completion scripts directly from its command-line interface via the `--generate` flag, enabling seamless integration and autocompletion for major shells including bash, zsh, fish, and PowerShell. Sources: [crates/core/flags/defs.rs:2474-2541](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L2474-L2541)

## Flag Definition Architecture and Trait Model

### Overview

Ripgrep defines its comprehensive command-line option set by mapping every logical flag to a unit struct implementing the central `Flag` trait, where a single trait implementation encapsulates multiple user-facing representations including long names, optional short character names, negated variants, and arbitrary aliases. Sources: [crates/core/flags/defs.rs:4-18](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L4-L18)

### The `Flag` Trait Model and Lifecycle

Each command-line option in ripgrep implements the `Flag` trait, defining methods that dictate whether an option acts as a boolean switch (`is_switch`), its short character identifier (`name_short`), its long flag string (`name_long`), its negated long flag (`name_negated`), aliases, documentation metadata (`doc_category`, `doc_short`, `doc_long`, `doc_variable`, `doc_choices`), shell completion classification (`completion_type`), and its state-mutating update method (`update`). Sources: [crates/core/flags/defs.rs:235-267](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L235-L267)

The `FLAGS` constant array enumerates all registered flags across categories, establishing the definitive ordering used when generating help documentation (`-h`, `--help`) and man pages. Sources: [crates/core/flags/defs.rs:39-156](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L39-L156)

| Flag Name | Trait Struct | Switch / Value | Category | Default / Behavior |
| :--- | :--- | :--- | :--- | :--- |
| `--after-context` / `-A` | `AfterContext` | Value (`NUM`) | Output | Sets trailing context lines via `args.context.set_after()`. Sources: [crates/core/flags/defs.rs:231-267](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L231-L267) |
| `--auto-hybrid-regex` | `AutoHybridRegex` | Switch | Search | (Deprecated) Dynamically selects regex engine; sets `args.engine = EngineChoice::Auto`. Sources: [crates/core/flags/defs.rs:317-376](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L317-L376) |
| `--binary` / `-a` | `Binary` | Switch | Filter | Controls automatic binary file skipping via `BinaryMode`. Sources: [crates/core/flags/defs.rs:502-566](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L502-L566) |
| `--block-buffered` | `BlockBuffered` | Switch | Output | Forces block buffering via `BufferMode::Block`. Sources: [crates/core/flags/defs.rs:593-634](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L593-L634) |
| `--byte-offset` / `-b` | `ByteOffset` | Switch | Output | Prints 0-based byte offsets by setting `args.byte_offset`. Sources: [crates/core/flags/defs.rs:653-692](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L653-L692) |

Sources: [crates/core/flags/defs.rs:39-267](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L39-L267), [crates/core/flags/defs.rs:317-692](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L317-L692)

> [!NOTE]
> The order of references inside the `FLAGS` slice is significant because it directly dictates the presentation sequence of options within each category in auto-generated man pages and help output. Sources: [crates/core/flags/defs.rs:41-43](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L41-L43)

### Flag Parsing and State Mutation

When options are parsed from the command line, the parser dispatches parsed values to the target flag's `update` method, modifying the mutable `LowArgs` state structure. For instance, the `AfterContext` flag parses its input argument into a `usize` value and updates the internal context tracking mode:

```rust
fn update(&self, v: FlagValue, args: &mut LowArgs) -> anyhow::Result<()> {
    args.context.set_after(convert::usize(&v.unwrap_value())?);
    Ok(())
}
```
Sources: [crates/core/flags/defs.rs:263-267](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L263-L267)

Similarly, complex flags like `--encoding` examine the provided `FlagValue` variant, verifying whether a switch or explicit string value was supplied before mapping string labels to concrete `EncodingMode` variants or falling back to default behaviors. Sources: [crates/core/flags/defs.rs:1707-1725](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L1707-L1725)

> [!WARNING]
> Certain flags such as `--index` enforce strict usage limits and preconditions during their `update` execution phase, returning an error if invoked when unstable indexing features are absent or if given more times than permitted. Sources: [crates/core/flags/defs.rs:3511-3520](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L3511-L3520)

## Shell Completion Generation Flag Options

### Overview

The shell completion and documentation generation capabilities of ripgrep are controlled primarily through the `--generate` flag option. Implemented via the `Generate` unit struct implementing the `Flag` trait, this option instructs ripgrep to output specific completion scripts or roff-formatted manual pages to standard output and then terminate immediately without executing any file searches. Sources: [crates/core/flags/defs.rs:2474-2517](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L2474-L2517)

Unlike boolean switches, `Generate` expects an explicit argument (`KIND`) representing the target shell or format. The `doc_choices` method exposes the exact set of supported target strings, which are parsed during state updates to configure the underlying `GenerateMode` enum variant within `LowArgs`. Sources: [crates/core/flags/defs.rs:2485-2487](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L2485-L2487), [crates/core/flags/defs.rs:2519-2540](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L2519-L2540)

### Target Generation Kinds and Choices

The `Generate` struct defines explicit behavior for five target generation kinds. Each choice maps directly to a specific variant of `GenerateMode` processed by ripgrep's low-level argument handler.

| Kind Argument | Trait Definition Source | Target Mode Variant | Description |
| :--- | :--- | :--- | :--- |
| `man` | `Generate` choices | `GenerateMode::Man` | Generates a manual page for ripgrep in the roff format. Sources: [crates/core/flags/defs.rs:2521](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L2521), [crates/core/flags/defs.rs:2531](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L2531) |
| `complete-bash` | `Generate` choices | `GenerateMode::CompleteBash` | Generates a completion script for the Bash shell. Sources: [crates/core/flags/defs.rs:2522](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L2522), [crates/core/flags/defs.rs:2532](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L2532) |
| `complete-zsh` | `Generate` choices | `GenerateMode::CompleteZsh` | Generates a completion script for the Zsh shell. Sources: [crates/core/flags/defs.rs:2523](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L2523), [crates/core/flags/defs.rs:2533](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L2533) |
| `complete-fish` | `Generate` choices | `GenerateMode::CompleteFish` | Generates a completion script for the Fish shell. Sources: [crates/core/flags/defs.rs:2524](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L2524), [crates/core/flags/defs.rs:2534](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L2534) |
| `complete-powershell` | `Generate` choices | `GenerateMode::CompletePowerShell` | Generates a completion script for PowerShell. Sources: [crates/core/flags/defs.rs:2525](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L2525), [crates/core/flags/defs.rs:2535](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L2535) |

Sources: [crates/core/flags/defs.rs:2519-2540](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L2519-L2540)

> [!NOTE]
> The `Generate` flag implementation specifies `is_switch(&self) -> bool` as returning `false`, ensuring that any invocation of `--generate` requires an accompanying string value rather than acting as a standalone boolean flag. Sources: [crates/core/flags/defs.rs:2478-2481](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L2478-L2481)

### Execution Walkthrough and State Update

When the command-line parser encounters the `--generate` flag, it executes the `Generate::update` method to translate the input value into runtime state modifications:

1. `v.unwrap_value()` extracts the raw string or byte slice provided to the flag argument. Sources: [crates/core/flags/defs.rs:2530](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L2530)
2. `convert::str(&...)` validates and converts the extracted value into a UTF-8 string slice. Sources: [crates/core/flags/defs.rs:2530](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L2530)
3. A match expression maps the string to a `GenerateMode` enum variant (`man` → `GenerateMode::Man`, `complete-bash` → `GenerateMode::CompleteBash`, `complete-zsh` → `GenerateMode::CompleteZsh`, `complete-fish` → `GenerateMode::CompleteFish`, `complete-powershell` → `GenerateMode::CompletePowerShell`), returning an error via `anyhow::bail!` on unrecognized choices. Sources: [crates/core/flags/defs.rs:2530-2537](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L2530-L2537)
4. `args.mode.update(Mode::Generate(genmode))` mutates the application execution mode inside the `LowArgs` structure, overriding any prior search or file-listing modes. Sources: [crates/core/flags/defs.rs:2538](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L2538)

```rust
fn update(&self, v: FlagValue, args: &mut LowArgs) -> anyhow::Result<()> {
    let genmode = match convert::str(&v.unwrap_value())? {
        "man" => GenerateMode::Man,
        "complete-bash" => GenerateMode::CompleteBash,
        "complete-zsh" => GenerateMode::CompleteZsh,
        "complete-fish" => GenerateMode::CompleteFish,
        "complete-powershell" => GenerateMode::CompletePowerShell,
        unk => anyhow::bail!("choice '{unk}' is unrecognized"),
    };
    args.mode.update(Mode::Generate(genmode));
    Ok(())
}
```
Sources: [crates/core/flags/defs.rs:2529-2540](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L2529-L2540)

> [!WARNING]
> Because generation modes override standard search behavior, passing conflicting output flags subsequently on the command line (such as `-l` or `--json`) can reset or alter `args.mode`. However, proper sequence handling ensures that generation requests cleanly short-circuit standard search loops. Sources: [crates/core/flags/defs.rs:2569-2576](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L2569-L2576)

## Flag Metadata and Parser Integration

### Overview

Flag definitions in ripgrep bind structural metadata—such as long names, optional short character flags, negated forms, and lists of aliases—directly into the argument parsing engine via the `Flag` trait implementations defined in `defs.rs`. Each logical flag unit struct implements methods like `name_long`, `name_short`, `name_negated`, and `aliases` to expose its interface to the command-line parser. Sources: [crates/core/flags/defs.rs:1-17](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L1-L17), [crates/core/flags/defs.rs:4305-4328](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L4305-L4328)

### Flag Aliases and Identifiers Reference

The following table details representative flags, their configured short names, long names, negated forms, and explicit aliases implemented in the codebase:

| Logical Flag Struct | Short Name (`name_short`) | Long Name (`name_long`) | Negated Form (`name_negated`) | Aliases (`aliases`) |
| :--- | :--- | :--- | :--- | :--- |
| `MaxDepth` | `Some(b'd')` | `"max-depth"` | `None` | `&["maxdepth"]` Sources: [crates/core/flags/defs.rs:4319-4327](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L4319-L4327) |
| `Passthru` | `None` | `"passthru"` | `None` | `&["passthrough"]` Sources: [crates/core/flags/defs.rs:5656-5661](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L5656-L5661) |
| `Hidden` | `Some(b'.')` | `"hidden"` | `Some("no-hidden")` | `&[]` Sources: [crates/core/flags/defs.rs:2853-2861](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L2853-L2861) |
| `IgnoreCase` | `Some(b'i')` | `"ignore-case"` | `None` | `&[]` Sources: [crates/core/flags/defs.rs:2231-2236](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L2231-L2236) |
| `NoIgnore` | `None` | `"no-ignore"` | `Some("ignore")` | `&[]` Sources: [crates/core/flags/defs.rs:4701-4707](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L4701-L4707) |

Sources: [crates/core/flags/defs.rs:2231-2236](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L2231-L2236), [crates/core/flags/defs.rs:2853-2861](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L2853-L2861), [crates/core/flags/defs.rs:4319-4327](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L4319-L4327), [crates/core/flags/defs.rs:4701-4707](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L4701-L4707), [crates/core/flags/defs.rs:5656-5661](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L5656-L5661)

> [!NOTE]
> The parser registry uses the slice reference `FLAGS` to establish ordering. The sequence of flag structs inside `FLAGS` dictates the precise print order of help documentation (`-h`, `--help`) and man pages within each category, placing deprecated flags strictly last. Sources: [crates/core/flags/defs.rs:39-44](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L39-L44), [crates/core/flags/defs.rs:152-156](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L152-L156)

### Parser Integration and Value Dispatch

When an argument matches a configured long name, short alias, or registered alternative string, the parser dispatches control to the flag's `update` method. This method mutates the target fields inside the `LowArgs` state container. Sources: [crates/core/flags/defs.rs:4351-4354](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L4351-L4354)

```rust
impl Flag for MaxDepth {
    fn is_switch(&self) -> bool {
        false
    }
    fn name_long(&self) -> &'static str {
        "max-depth"
    }
    fn aliases(&self) -> &'static [&'static str] {
        &["maxdepth"]
    }
    fn update(&self, v: FlagValue, args: &mut LowArgs) -> anyhow::Result<()> {
        args.max_depth = Some(convert::usize(&v.unwrap_value())?);
        Ok(())
    }
}
```
Sources: [crates/core/flags/defs.rs:4315-4355](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L4315-L4355)

## Argument Type and Value Constraints

### Value Helper Methods and Type Enforcement

Ripgrep utilizes value conversion helper methods within flag update implementations to transform raw string or value tokens into typed Rust primitives. These conversion routines enforce strict numerical ranges, parsing semantics, and shell completion hints for argument values. For example, flags accepting scalar numeric constraints use helper methods like `convert::usize` and `convert::u64` during state mutations. Sources: [crates/core/flags/defs.rs:263-266](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L263-L266)

The conversion helpers parse raw flag inputs and return structured errors via `anyhow::Result` if formatting requirements fail. For size limits and file size constraints, functions like `convert::human_readable_usize` and `convert::human_readable_u64` accept size suffixes (`K`, `M`, `G`) alongside raw byte integers. Sources: [crates/core/flags/defs.rs:1615-1618](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L1615-L1618)

### Completion Hints and Argument Context

Certain flags override the `completion_type` method to supply type information to shell completion generators. This associates specific completion hints—such as expected file paths, executable binaries, or encoding names—directly with the flag definition structure. Sources: [crates/core/flags/defs.rs:1703-1705](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L1703-L1705)

| Flag Struct | Completion Type (`completion_type`) | Target Value Semantics |
| :--- | :--- | :--- |
| `Encoding` | `CompletionType::Encoding` | Text encoding names (e.g., `auto`, `none`, `utf-16`) Sources: [crates/core/flags/defs.rs:1703-1705](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L1703-L1705) |
| `File` | `CompletionType::Filename` | Pattern file system paths Sources: [crates/core/flags/defs.rs:2101-2103](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L2101-L2103) |
| `HostnameBin` | `CompletionType::Executable` | Executable command paths or binary names Sources: [crates/core/flags/defs.rs:2948-2950](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L2948-L2950) |
| `IgnoreFile` | `CompletionType::Filename` | Additional ignore file paths Sources: [crates/core/flags/defs.rs:3319-3321](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L3319-L3321) |
| `IndexPath` | `CompletionType::Filename` | Index storage directory paths Sources: [crates/core/flags/defs.rs:3722-3724](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L3722-L3724) |
| `Pre` | `CompletionType::Executable` | Preprocessor command binary paths Sources: [crates/core/flags/defs.rs:5901-5903](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L5901-L5903) |

Sources: [crates/core/flags/defs.rs:1703-1705](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L1703-L1705), [crates/core/flags/defs.rs:2101-2103](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L2101-L2103), [crates/core/flags/defs.rs:2948-2950](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L2948-L2950), [crates/core/flags/defs.rs:3319-3321](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L3319-L3321), [crates/core/flags/defs.rs:3722-3724](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L3722-L3724), [crates/core/flags/defs.rs:5901-5903](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L5901-L5903)

> [!WARNING]
> Path separators configured via `--path-separator` undergo strict byte length validation. The update method unescapes input strings and enforces that the resulting sequence measures precisely one single byte, returning an error for multi-byte inputs or rejecting malformed escape sequences. Sources: [crates/core/flags/defs.rs:5591-5608](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L5591-L5608)

## Completion Output Configuration and Lifecycle

### Overview

During the generation lifecycle of shell completion scripts, flag state definitions interact closely with argument parsing and execution modes. When a user requests shell script output via the `--generate` flag, the parser intercepts the argument value and transitions the application state into a generation lifecycle path. Sources: [crates/core/flags/defs.rs:2474-2541](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L2474-L2541)

### Flag Update and Mode Transitions

The `Generate` flag implementation parses strings such as `man`, `complete-bash`, `complete-zsh`, `complete-fish`, and `complete-powershell` to update `LowArgs`. Specifically, its `update` method maps these choices into corresponding variants of `GenerateMode`, which are wrapped inside `Mode::Generate(genmode)` and stored in the low-level argument structure. Sources: [crates/core/flags/defs.rs:2529-2540](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L2529-L2540)

| Choice String | `GenerateMode` Variant | Target Output Environment |
| :--- | :--- | :--- |
| `man` | `GenerateMode::Man` | roff-format manual page Sources: [crates/core/flags/defs.rs:2501-2503](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L2501-L2503), [crates/core/flags/defs.rs:2531](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L2531) |
| `complete-bash` | `GenerateMode::CompleteBash` | Bash shell completion script Sources: [crates/core/flags/defs.rs:2504-2506](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L2504-L2506), [crates/core/flags/defs.rs:2532](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L2532) |
| `complete-zsh` | `GenerateMode::CompleteZsh` | Zsh shell completion script Sources: [crates/core/flags/defs.rs:2507-2509](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L2507-L2509), [crates/core/flags/defs.rs:2533](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L2533) |
| `complete-fish` | `GenerateMode::CompleteFish` | Fish shell completion script Sources: [crates/core/flags/defs.rs:2510-2512](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L2510-L2512), [crates/core/flags/defs.rs:2534](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L2534) |
| `complete-powershell` | `GenerateMode::CompletePowerShell` | PowerShell completion script Sources: [crates/core/flags/defs.rs:2513-2515](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L2513-L2515), [crates/core/flags/defs.rs:2535](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L2535) |

Sources: [crates/core/flags/defs.rs:2501-2540](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L2501-L2540)

> [!NOTE]
> Mode flags interact dynamically during command parsing; subsequent flags like `--json` or `-l` can overwrite or reset the active execution mode. However, parser tests demonstrate that passing conflicting generation and standard search flags sequentially allows reverting or updating modes prior to execution. Sources: [crates/core/flags/defs.rs:2569-2576](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L2569-L2576)

## Related

- [[Flag Definitions]]

