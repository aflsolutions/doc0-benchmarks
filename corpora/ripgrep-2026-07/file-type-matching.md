# File Type Matching

<details>
<summary>Relevant source files</summary>

The following files were used as context for generating this wiki page:

- [crates/core/flags/defs.rs](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs)
</details>

## Overview

File type matching in ripgrep provides a robust mechanism to target or exclude specific file formats during directory traversal and searching. By leveraging predefined or custom-defined type mappings, users can restrict search operations to relevant codebases, documentation, or assets without manually crafting complex path filters.

Sources: [crates/core/flags/defs.rs:1-18](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L1-L18)

## Command-Line File Type Selection Flags

### Overview

Command-line file type selection in ripgrep is governed by dedicated flags that allow users to include or exclude predefined file types during a search operation. These flags correspond to specific implementations of the `Flag` trait within the core flag definitions, namely `--type` (`-t`) and `--type-not` (`-T`). Each flag updates the underlying low-level argument structure (`LowArgs`) to enforce filtering criteria based on file extension and type mappings.

Sources: [crates/core/flags/defs.rs:141-142](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L141-L142)

### Type Selection Flags Reference

The core flags responsible for including and excluding predefined file types during searches are structured around distinct short and long names, category assignments, and state update handlers.

| Flag Name | Short Name | Long Name | Category | Purpose |
| --- | --- | --- | --- | --- |
| Type | `t` | `type` | Filter | Only search files matching the given type. |
| TypeNot | `T` | `type-not` | Filter | Do not search files matching the given type. |

Sources: [crates/core/flags/defs.rs:141-142](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L141-L142)

## Custom Type Definitions and Modification

### Overview

Custom type definitions and modifications allow users to extend ripgrep's file type mapping system beyond built-in defaults or clear existing configurations entirely. These capabilities are exposed via specific unit structs implementing the `Flag` trait in ripgrep's core definitions, specifically `--type-add` and `--type-clear`. Each flag parses user input and modifies the underlying low-level argument state (`LowArgs`) to govern how file paths are classified and filtered during directory traversal.

Sources: [crates/core/flags/defs.rs:143-144](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L143-L144)

### Custom Type Modification Flags Reference

The flags responsible for adding custom type definitions and resetting existing type mappings are configured with specific metadata, categories, and update behaviors.

| Flag Name | Short Name | Long Name | Category | Purpose |
| --- | --- | --- | --- | --- |
| TypeAdd | None | `type-add` | Filter | Add a new glob pattern for a file type. |
| TypeClear | None | `type-clear` | Filter | Clear all glob patterns for a file type. |

Sources: [crates/core/flags/defs.rs:143-144](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L143-L144)

> [!NOTE]
> Unlike standard search flags, `--type-add` and `--type-clear` do not provide short flag aliases, ensuring that custom type modifications are explicitly documented within command-line invocations or configuration files.
> 
> Sources: [crates/core/flags/defs.rs:143-144](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L143-L144)

### Design Trade-Offs in Type Modification

| Design Choice | Benefit | Cost |
| --- | --- | --- |
| Declarative `TypeAdd` accumulation | Allows incremental extension of custom types across multiple config files and CLI flags. | Requires order-dependent evaluation to resolve conflicting definitions. |
| Complete `TypeClear` purging | Enables immediate resetting of unwanted built-in or inherited type mappings. | Removes all associated globs for the target type, risking accidental omission of default file extensions. |

Sources: [crates/core/flags/defs.rs:143-144](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L143-L144)

## Glob Pattern Selection and Matching

### Overview

Glob pattern selection and matching in ripgrep provide explicit file and directory filtering capabilities that override default ignore rules. These filters are governed by dedicated flag implementations on `LowArgs`, specifically supporting standard glob inclusion via `--glob` (`-g`), case-insensitive glob matching via `--glob-case-insensitive` or `--iglob`, and preprocessor-specific glob filtering via `--pre-glob`. Each flag modifies internal state collections or boolean flags to control how paths are evaluated during directory traversal.

Sources: [crates/core/flags/defs.rs:75-76](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L75-L76), [crates/core/flags/defs.rs:82](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L82-L82), [crates/core/flags/defs.rs:126](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L126-L126)

### Glob Selection and Matching Flags Reference

The core flags responsible for glob filtering are structured with specific identifiers, categories, and behaviors to control traversal inclusions and exclusions.

| Flag Name | Short Name | Long Name | Category | Purpose |
| --- | --- | --- | --- | --- |
| Glob | `g` | `glob` | Filter | Include or exclude files and directories matching a glob pattern. |
| GlobCaseInsensitive | None | `glob-case-insensitive` | Filter | Process all standard glob patterns case insensitively. |
| IGlob | None | `iglob` | Filter | Include or exclude paths using case-insensitive glob patterns. |
| PreGlob | None | `pre-glob` | Input | Limit preprocessor execution to files matching specified globs. |

Sources: [crates/core/flags/defs.rs:75-76](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L75-L76), [crates/core/flags/defs.rs:82](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L82-L82), [crates/core/flags/defs.rs:126](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L126-L126), [crates/core/flags/defs.rs:2579-2582](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L2579-L2582), [crates/core/flags/defs.rs:2673-2678](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L2673-L2678), [crates/core/flags/defs.rs:3170-3175](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L3170-L3175), [crates/core/flags/defs.rs:9546-9553](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L9546-L9553)

> [!NOTE]
> Globs specified via `--glob` match `.gitignore` syntax rules and always override standard ignore logic. Preceding a glob with an exclamation point (`!`) explicitly excludes matching paths, with later command-line declarations taking precedence.
> 
> Sources: [crates/core/flags/defs.rs:2604-2608](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L2604-L2608)

### State Update Execution Walkthrough

When explicit glob flags are parsed from the command line, update routines extract the raw value and append or modify structured fields inside the `LowArgs` instance. 

1. **Extraction**: `update()` receives a `FlagValue` containing either string input or switch state.
2. **Parsing & Conversion**: `convert::string(v.unwrap_value())?` parses the argument into a standard `String` representation.
3. **State Mutation**: The resulting string is pushed onto `args.globs` for `--glob`, `args.iglobs` for `--iglob`, or `args.pre_glob` for `--pre-glob`. For boolean flags like `--glob-case-insensitive`, `v.unwrap_switch()` directly sets `args.glob_case_insensitive`.

Sources: [crates/core/flags/defs.rs:2631-2635](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L2631-L2635), [crates/core/flags/defs.rs:2696-2700](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L2696-L2700), [crates/core/flags/defs.rs:3197-3201](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L3197-L3201), [crates/core/flags/defs.rs:9592-9596](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L9592-L9596)

### Design Trade-Offs in Glob Filtering

| Design Choice | Benefit | Cost |
| --- | --- | --- |
| Vector accumulation of glob rules (`args.globs.push`) | Supports multiple inclusion and exclusion filters across layered configuration files and command-line flags. | Requires evaluating every candidate path against all configured patterns in sequence. |
| Whole-path glob matching (`foo/**` required for directories) | Prevents unexpected prefix matches where directory names collide with file components. | Can be less intuitive for users accustomed to simple directory-name matching. |

Sources: [crates/core/flags/defs.rs:2604-2628](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L2604-L2628), [crates/core/flags/defs.rs:2631-2635](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L2631-L2635)

## Ignore File Configuration and Scoping

### Overview

Ripgrep provides a robust set of command-line flags to control how ignore files are parsed, discovered, scoped, and bypassed during directory traversal. These flags allow users to selectively disable specific ignore file tiers—such as `.gitignore`, `.ignore`, `.rgignore`, global excludes, parent directory traversal, and repository requirements—or to supply custom ignore files via explicit paths.

### Ignore File Control Flags Reference

The flags governing ignore file configuration and scoping are mapped to specific structural fields in `LowArgs` through their respective `Flag` trait implementations.

| Flag Name | Short Name | Long Name | Negated Flag | Category | Purpose |
| --- | --- | --- | --- | --- | --- |
| IgnoreFile | None | `ignore-file` | None | Filter | Specify additional ignore files containing gitignore-formatted rules. |
| IgnoreFileCaseInsensitive | None | `ignore-file-case-insensitive` | `no-ignore-file-case-insensitive` | Filter | Process ignore files case insensitively. |
| NoIgnore | None | `no-ignore` | `ignore` | Filter | Disable all standard ignore files (`.gitignore`, `.ignore`, `.rgignore`). |
| NoIgnoreDot | None | `no-ignore-dot` | `ignore-dot` | Filter | Disable `.ignore` and `.rgignore` local exclusion files. |
| NoIgnoreExclude | None | `no-ignore-exclude` | `ignore-exclude` | Filter | Disable repository-specific exclusion files like `.git/info/exclude`. |
| NoIgnoreFiles | None | `no-ignore-files` | `ignore-files` | Filter | Ignore all `--ignore-file` command-line arguments. |
| NoIgnoreGlobal | None | `no-ignore-global` | `ignore-global` | Filter | Disable global ignore files such as git's `core.excludesFile`. |
| NoIgnoreMessages | None | `no-ignore-messages` | `ignore-messages` | Logging | Suppress parse error messages related to ignore files. |
| NoIgnoreParent | None | `no-ignore-parent` | `ignore-parent` | Filter | Disable ascending parent directories to search for ignore files. |
| NoIgnoreVcs | None | `no-ignore-vcs` | `ignore-vcs` | Filter | Disable version control ignore files (`.gitignore`). |
| NoRequireGit | None | `no-require-git` | `require-git` | Filter | Respect `.gitignore` files even when no git repository is present. |

Sources: [crates/core/flags/defs.rs:84-85](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L84-L85), [crates/core/flags/defs.rs:106-113](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L106-L113), [crates/core/flags/defs.rs:3284-3294](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L3284-L3294), [crates/core/flags/defs.rs:3347-3360](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L3347-L3360), [crates/core/flags/defs.rs:4694-4707](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L4694-L4707), [crates/core/flags/defs.rs:4766-4779](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L4766-L4779), [crates/core/flags/defs.rs:4815-4828](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L4815-L4828), [crates/core/flags/defs.rs:4862-4875](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L4862-L4875), [crates/core/flags/defs.rs:4908-4921](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L4908-L4921), [crates/core/flags/defs.rs:4956-4969](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L4956-L4969), [crates/core/flags/defs.rs:5005-5018](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L5005-L5018), [crates/core/flags/defs.rs:5054-5067](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L5054-L5067), [crates/core/flags/defs.rs:5205-5218](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L5205-L5218)

> [!NOTE]
> The `--no-ignore` flag acts as a shorthand macro that simultaneously sets `no_ignore_dot`, `no_ignore_exclude`, `no_ignore_global`, `no_ignore_parent`, and `no_ignore_vcs` to true. However, it explicitly does not imply `--no-ignore-files`, because `--ignore-file` must be supplied explicitly as a command-line argument.
> 
> Sources: [crates/core/flags/defs.rs:4716-4722](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L4716-L4722), [crates/core/flags/defs.rs:4730-4737](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L4730-L4737)

### Execution Walkthrough for Ignore Flag Updates

When ignore-related flags are encountered during argument processing, their `update()` methods mutate the internal `LowArgs` parsing configuration according to the following call-chain sequence:

1. **Extraction**: The parser evaluates the provided `FlagValue` to extract either a switch boolean or a file system path.
2. **Batch Mutation (`--no-ignore`)**: For `NoIgnore`, `v.unwrap_switch()` retrieves the boolean value, which is then assigned across all five sub-ignore fields (`args.no_ignore_dot`, `args.no_ignore_exclude`, `args.no_ignore_global`, `args.no_ignore_parent`, `args.no_ignore_vcs`) simultaneously.
3. **Path Accumulation (`--ignore-file`)**: For `IgnoreFile`, `PathBuf::from(v.unwrap_value())` converts the value into a path buffer and appends it to the `args.ignore_file` vector.
4. **Boolean Assignment**: For fine-grained flags like `NoIgnoreVcs` or `NoIgnoreMessages`, `v.unwrap_switch()` directly assigns the boolean state to `args.no_ignore_vcs` or `args.no_ignore_messages`.

Sources: [crates/core/flags/defs.rs:3223-3227](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L3223-L3227), [crates/core/flags/defs.rs:4730-4737](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L4730-L4737), [crates/core/flags/defs.rs:4985-4988](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L4985-L4988), [crates/core/flags/defs.rs:5034-5037](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L5034-L5037), [crates/core/flags/defs.rs:5091-5094](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L5091-L5094)

### Design Trade-Offs in Ignore Parsing

| Design Choice | Benefit | Cost |
| --- | --- | --- |
| Granular boolean flags per ignore tier (`--no-ignore-vcs`, `--no-ignore-dot`, etc.) | Allows users to selectively disable specific ignore mechanisms without completely abandoning repository filtering. | Increases configuration surface area and requires managing multiple overlapping state flags in `LowArgs`. |
| Lower precedence for custom ignore files (`--ignore-file`) relative to automatic tree discovery | Ensures repository-level ignore files retain authoritative control over project scoping. | Users cannot easily override pre-existing `.gitignore` rules using custom ignore files alone without disabling standard ignore layers. |
| Case-insensitive ignore file parsing (`--ignore-file-case-insensitive`) | Facilitates robust file filtering on case-insensitive file systems such as Windows and macOS. | Imposes a noticeable performance overhead during directory traversal and rule matching. |

Sources: [crates/core/flags/defs.rs:3306-3313](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L3306-L3313), [crates/core/flags/defs.rs:3369-3371](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L3369-L3371), [crates/core/flags/defs.rs:4716-4719](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L4716-L4719)

## Type Listing and Flag Diagnostics

### Overview

Ripgrep defines dedicated flags for querying available file types and outputting type definitions, governing the behavior of type-listing diagnostic routines. These capabilities are encapsulated in flag definitions like `TypeList`, which instruct ripgrep to output supported types and exit without performing a file search.

Sources: [crates/core/flags/defs.rs:145](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L145-L145)

### Type Listing and Diagnostic Flags

| Flag Structure | Short Name | Long Name | Category | Purpose |
| --- | --- | --- | --- | --- |
| `TypeList` | None | `type-list` | OtherBehaviors | Print all supported file types and their corresponding glob definitions, then exit. |

Sources: [crates/core/flags/defs.rs:145](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L145-L145)

> [!NOTE]
> The `TypeList` flag overrides other active search behaviors by updating the internal mode to list known file types, bypassing directory traversal and pattern matching entirely.
> 
> Sources: [crates/core/flags/defs.rs:145](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L145-L145)

## Related

- [[Glob Matching]]

