# Configuration Files

<details>
<summary>Relevant source files</summary>

The following files were used as context for generating this wiki page:

- [crates/core/flags/defs.rs](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs)
</details>

## Overview

Ripgrep configuration file handling enables users to define default command-line flags and arguments through persistent configuration files, which can be located and loaded via the `RIPGREP_CONFIG_PATH` environment variable or bypassed entirely using the `--no-config` flag.
Sources: [crates/core/flags/defs.rs:105-112](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L105-L112), [crates/core/flags/defs.rs:4649-4682](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L4649-L4682)

## Configuration File Discovery and Environment Scope

### Overview

Ripgrep locates configuration files via the `RIPGREP_CONFIG_PATH` environment variable unless suppressed by command-line overrides. When configuring defaults, the discovery mechanism checks specific scope variables and environment settings during application startup.
Sources: [crates/core/flags/defs.rs:4649-4676](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L4649-L4676)

### Configuration Discovery Rules

The `NoConfig` implementation ensures that setting `--no-config` completely disables reading configuration files and explicitly ignores the `RIPGREP_CONFIG_PATH` environment variable.
Sources: [crates/core/flags/defs.rs:4667-4681](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L4667-L4681)

> [!NOTE]
> If `--no-config` is active, any path specified in `RIPGREP_CONFIG_PATH` is bypassed during startup.
Sources: [crates/core/flags/defs.rs:4667-4670](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L4667-L4670)

## Parsing Configuration File Lines into Arguments

### Overview

Configuration files in ripgrep contain command-line flags and arguments written on separate lines. Once a configuration file is located and opened, its contents must be processed into line-buffered streams, enabling raw arguments to be extracted and fed into the argument parsing machinery alongside explicit CLI parameters.
Sources: [crates/core/flags/defs.rs:1-18](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L1-L18)

### Line-Buffered Processing

Files are read iteratively by splitting input streams into discrete lines, stripping leading and trailing whitespace, and ignoring empty lines or comments. Each parsed token maps to a logical flag implementation defined via the `Flag` trait, allowing long flags, short flags, negated options, and arguments to share unified parsing logic with direct command-line invocations.
Sources: [crates/core/flags/defs.rs:4-18](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L4-L18)

> [!NOTE]
> Each implementation of `Flag` corresponds to a single logical option inside ripgrep, meaning configuration file lines like `--encoding` or `-E` manipulate the exact same underlying state structures as their CLI equivalents.
Sources: [crates/core/flags/defs.rs:14-17](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L14-L17)

## Low-Level Argument Flag Processing

### Overview

Ripgrep maps raw flag strings and configuration entries to low-level argument structures through implementations of the `Flag` trait. Each `Flag` implementation represents a single logical flag inside ripgrep, capable of handling long flag names, optional short flag names, negated long flag names, and an arbitrary list of aliases.
Sources: [crates/core/flags/defs.rs:4-18](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L4-L18)

### Low-Level Flag Processing and State Mapping

When raw arguments or configuration lines are evaluated, the parser invokes the `update` method on matching `Flag` trait implementations to mutate the low-level argument structure (`LowArgs`). For example, the `NoConfig` flag directly toggles the `no_config` boolean property on `LowArgs` via `update`, enforcing configuration suppression.
Sources: [crates/core/flags/defs.rs:4677-4681](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L4677-L4681)

```rust
struct NoConfig;

impl Flag for NoConfig {
    fn is_switch(&self) -> bool {
        true
    }
    fn name_long(&self) -> &'static str {
        "no-config"
    }
    fn doc_category(&self) -> Category {
        Category::OtherBehaviors
    }
    fn doc_short(&self) -> &'static str {
        r"Never read configuration files."
    }
    fn update(&self, v: FlagValue, args: &mut LowArgs) -> anyhow::Result<()> {
        assert!(v.unwrap_switch(), "--no-config has no negation");
        args.no_config = true;
        Ok(())
    }
}
```
Sources: [crates/core/flags/defs.rs:4650-4681](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L4650-L4681)

### Flag Structure and Trait Reference

The following table summarizes selected low-level flag definitions, their types, argument requirements, and behavioral updates:
Sources: [crates/core/flags/defs.rs:1662-1724](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L1662-L1724), [crates/core/flags/defs.rs:4650-4681](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L4650-L4681)

| Flag Name | Short / Long | Switch? | Target Field in `LowArgs` | Purpose |
| :--- | :--- | :--- | :--- | :--- |
| `NoConfig` | `--no-config` | Yes | `args.no_config = true` | Never read configuration files or respect `RIPGREP_CONFIG_PATH`. |
| `Encoding` | `-E` / `--encoding` | No | `args.encoding` | Specify text encoding (`auto`, `none`, or specific labels). |
| `NoIgnore` | `--no-ignore` | Yes | `args.no_ignore_*` flags | Disables standard ignore files (`.gitignore`, `.ignore`, `.rgignore`). |
| `FixedStrings` | `-F` / `--fixed-strings` | Yes | `args.fixed_strings` | Treat all search patterns as literal strings rather than regex. |
Sources: [crates/core/flags/defs.rs:1658-1726](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L1658-L1726), [crates/core/flags/defs.rs:2361-2395](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L2361-L2395), [crates/core/flags/defs.rs:4650-4681](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L4650-L4681), [crates/core/flags/defs.rs:4698-4739](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L4698-L4739)

> [!WARNING]
> The `NoConfig` flag has no negation switch (`--config` is not a valid flag); attempting to pass a negated flag value will trigger an assertion failure during argument updates.
Sources: [crates/core/flags/defs.rs:4678-4679](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L4678-L4679)

## High-Level CLI Flag Integration

### Overview

Ripgrep integrates parsed configuration flags and command-line inputs by mapping each flag representation into the centralized `LowArgs` state structure. Every logical flag implements the `Flag` trait, which defines update hooks that mutate specific fields within `LowArgs`, such as regex engine selection, search modes, case sensitivity, buffering behavior, and filtering rules.
Sources: [crates/core/flags/defs.rs:4-18](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L4-L18), [crates/core/flags/defs.rs:367-375](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L367-L375)

### Flag Integration and State Mutation

When flags like `--auto-hybrid-regex`, `--crlf`, or `--search-zip` are encountered, their `update` methods inspect the provided `FlagValue` and apply complex interactions or overrides directly to `LowArgs` fields. For instance, enabling `--auto-hybrid-regex` assigns `EngineChoice::Auto` to `args.engine`, while enabling `--null-data` sets `args.null_data = true` and explicitly overrides CRLF mode by setting `args.crlf = false`.
Sources: [crates/core/flags/defs.rs:367-375](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L367-L375), [crates/core/flags/defs.rs:1495-1501](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L1495-L1501), [crates/core/flags/defs.rs:5422-5427](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L5422-L5427)

```rust
impl Flag for AutoHybridRegex {
    fn update(&self, v: FlagValue, args: &mut LowArgs) -> anyhow::Result<()> {
        let mode = if v.unwrap_switch() {
            EngineChoice::Auto
        } else {
            EngineChoice::Default
        };
        args.engine = mode;
        Ok(())
    }
}
```
Sources: [crates/core/flags/defs.rs:367-375](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L367-L375)

> [!WARNING]
> Certain flags enforce mutual exclusivity during integration. For example, activating `SearchZip` via `--search-zip` automatically clears any configured preprocessor by setting `args.pre = None`, whereas enabling `Pre` via `--pre` disables `search-zip`.
Sources: [crates/core/flags/defs.rs:5915-5917](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L5915-L5917), [crates/core/flags/defs.rs:6476-6481](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L6476-L6481)

### High-Level Flag Mapping Reference

The following table details how high-level configuration flags map to internal `LowArgs` application state fields and their associated overrides:
Sources: [crates/core/flags/defs.rs:318-375](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L318-L375), [crates/core/flags/defs.rs:1459-1502](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L1459-L1502)

| Flag Name | CLI Flag | Target Field in `LowArgs` | Override Behavior |
| :--- | :--- | :--- | :--- |
| `AutoHybridRegex` | `--auto-hybrid-regex` | `args.engine` | Sets engine choice to `Auto`; overridden by explicit `--engine`. |
| `Crlf` | `--crlf` | `args.crlf` | Enables CRLF line terminators; overrides `args.null_data = false`. |
| `NullData` | `--null-data` | `args.null_data` | Uses NUL line terminator; implies `--text` and overrides `args.crlf = false`. |
| `SearchZip` | `-z` / `--search-zip` | `args.search_zip` | Enables compressed file searching; sets `args.pre = None`. |
| `Pre` | `--pre` | `args.pre` | Sets preprocessor command path; sets `args.search_zip = false`. |
Sources: [crates/core/flags/defs.rs:318-375](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L318-L375), [crates/core/flags/defs.rs:1459-1502](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L1459-L1502), [crates/core/flags/defs.rs:5389-5428](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L5389-L5428), [crates/core/flags/defs.rs:5827-5920](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L5827-L5920), [crates/core/flags/defs.rs:6437-6482](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L6437-L6482)

## Configuration Logging and Diagnostic Tracing

### Overview

Ripgrep handles diagnostic output, logging events, and verbosity flags via specific flag implementations that manipulate logging and warning states during startup and execution. The diagnostic pipeline distinguishes between general debug tracing, error filtering, and warning suppression.
Sources: [crates/core/flags/defs.rs:1532-1566](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L1532-L1566), [crates/core/flags/defs.rs:4956-4989](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L4956-L4989), [crates/core/flags/defs.rs:5110-5142](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L5110-L5142)

### Diagnostic Flag Handling and State Mutation

When diagnostic flags are parsed, their corresponding `update` methods mutate internal logging modes and warning parameters within the low-level argument structure. For instance, enabling `--debug` assigns `LoggingMode::Debug` to `args.logging`, which helps identify why specific files were skipped during traversal.
Sources: [crates/core/flags/defs.rs:1532-1566](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L1532-L1566)

```rust
impl Flag for Debug {
    fn update(&self, v: FlagValue, args: &mut LowArgs) -> anyhow::Result<()> {
        assert!(v.unwrap_switch(), "--debug can only be enabled");
        args.logging = Some(LoggingMode::Debug);
        Ok(())
    }
}
```
Sources: [crates/core/flags/defs.rs:1561-1565](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L1561-L1565)

> [!NOTE]
> The `--trace` flag implies `--debug` while furnishing additional low-level trace data. Conversely, diagnostic flags like `--no-messages` and `--no-ignore-messages` specifically target file read errors and gitignore parsing noise independently.
Sources: [crates/core/flags/defs.rs:1556-1557](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L1556-L1557), [crates/core/flags/defs.rs:4978-4981](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L4978-L4981), [crates/core/flags/defs.rs:5131-5134](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L5131-L5134)

### Logging and Diagnostic Flag Reference

The table below summarizes the logging and diagnostic flags defined in the codebase, their target fields, and update behaviors:
Sources: [crates/core/flags/defs.rs:1532-1566](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L1532-L1566), [crates/core/flags/defs.rs:4956-4989](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L4956-L4989)

| Flag Name | CLI Flag | Target Field in `LowArgs` | Update Behavior / Effect |
| :--- | :--- | :--- | :--- |
| `Debug` | `--debug` | `args.logging` | Sets `args.logging = Some(LoggingMode::Debug)` to show skipped files and debug messages. |
| `NoIgnoreMessages` | `--no-ignore-messages` | `args.no_ignore_messages` | Sets boolean flag to suppress gitignore parse error messages. |
| `NoMessages` | `--no-messages` | `args.no_messages` | Suppresses errors related to failed opening and reading of files. |
Sources: [crates/core/flags/defs.rs:1532-1566](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L1532-L1566), [crates/core/flags/defs.rs:4956-4989](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L4956-L4989), [crates/core/flags/defs.rs:5110-5142](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L5110-L5142)

## Related

- [[Argument Parsing]]

