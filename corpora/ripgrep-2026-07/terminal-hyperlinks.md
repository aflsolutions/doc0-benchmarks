# Terminal Hyperlinks

<details>
<summary>Relevant source files</summary>

The following files were used as context for generating this wiki page:

- [crates/core/flags/defs.rs](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs)
</details>

## Overview

Terminal hyperlinks enable clickable file paths within supported terminal emulators by leveraging OSC 8 escape sequences, bridging command-line search results with interactive editor or file viewer workflows. Ripgrep implements this capability through configurable URI format strings, hostname resolution mechanisms, and path rendering rules that integrate with the output stream.

Sources: [crates/core/flags/defs.rs:2998-3002](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L2998-L3002)

To ensure correct URI construction and rendering, the hyperlink subsystem interacts closely with color formatting flags, stream redirection checks, and environment configurations such as `NO_COLOR` and `TERM=dumb`. This design ensures that hyperlinks behave consistently alongside ANSI color codes and tty detection heuristics.

Sources: [crates/core/flags/defs.rs:3064-3084](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L3064-L3084)

## CLI Hyperlink Flag Definition

### CLI Hyperlink Flag Definition

The command-line interface exposes hyperlink formatting behavior primarily through the `--hyperlink-format` flag, backed by the `HyperlinkFormat` struct implementation of the `Flag` trait. This flag accepts a format string or an alias to determine how file paths are wrapped in OSC 8 escape sequences.

Sources: [crates/core/flags/defs.rs:2974-2983](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L2974-L2983)

When a user passes `--hyperlink-format`, the parser delegates updating the configuration through the `update` method, which parses the string value into a format specification and assigns it to `args.hyperlink_format`.

Sources: [crates/core/flags/defs.rs:3118-3124](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L3118-L3124)

### Configuration and Aliases

The `--hyperlink-format` flag accepts an optional value representing either a custom URI template or one of several predefined aliases sorted by display priority. 

Sources: [crates/core/flags/defs.rs:2984-3017](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L2984-L3017)

| Field / Property | Type | Default Value | Purpose |
| :--- | :--- | :--- | :--- |
| `name_long` | `&'static str` | `"hyperlink-format"` | Defines the long command-line flag name. |
| `doc_variable` | `Option<&'static str>` | `Some("FORMAT")` | Specifies the meta-variable name in help documentation. |
| `doc_category` | `Category` | `Category::Output` | Categorizes the flag under output configuration. |
| `hyperlink_format` | `HyperlinkFormat` | `none` (parsed) | Stores the active hyperlink formatting rule in `LowArgs`. |

Sources: [crates/core/flags/defs.rs:2978-2990](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L2978-L2990), [crates/core/flags/defs.rs:3134-3135](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L3134-L3135)

> [!NOTE]
> An empty format string is explicitly equivalent to the `none` alias, which completely disables hyperlink generation. Users must explicitly opt into hyperlinks as ripgrep does not enable them by default.
>
> Sources: [crates/core/flags/defs.rs:3057-3061](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L3057-L3061)

### Execution Walkthrough

When command-line arguments are processed, the CLI parser evaluates flags sequentially and executes their update routines:

1. `parse_low_raw()` tokenizes the input arguments using lexopt.
2. When `--hyperlink-format` is encountered, the parser calls `HyperlinkFormat::update(v, args)`.
3. `update()` extracts the raw flag value via `v.unwrap_value()` and converts it to a string slice using `convert::str(&v)?`.
4. The string slice is parsed into a `grep::printer::HyperlinkFormat` object via its `FromStr` implementation. If parsing fails, an error context `"invalid hyperlink format"` is returned.
5. Finally, the resulting format is assigned to `args.hyperlink_format`.

Sources: [crates/core/flags/defs.rs:3118-3124](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L3118-L3124)

> [!WARNING]
> Hyperlinks are only emitted when paths appear in the output and color is enabled. Searching a file path directly (e.g., `rg foo path/to/file`) suppresses path printing in standard grep mode; users must supply `--with-filename` to force path emission and enable hyperlinks.
>
> Sources: [crates/core/flags/defs.rs:3067-3070](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L3067-L3070), [crates/core/flags/defs.rs:3086-3094](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L3086-L3094)

## Hyperlink Format Specification

### Overview

The hyperlink format specification dictates how URI templates are constructed and populated with context variables during OSC 8 terminal hyperlink generation. The `HyperlinkFormat` flag implementation relies on format strings and variable specifiers defined within `crates/core/flags/defs.rs`.

Sources: [crates/core/flags/defs.rs:2973-3003](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L2973-L3003)

### Format Variables and Specifiers

Format strings support specific placeholder variables enclosed in braces. These variables are substituted dynamically during printer execution based on match state, line numbers, columns, and host resolution.

| Variable Specifier | Requirement / Behavior | Description & Fallback Rule |
| :--- | :--- | :--- |
| `{path}` | Required | Replaced with an absolute, percent-encoded matching file path guaranteed to start with `/`. |
| `{host}` | Optional | Replaced with the system hostname (via `gethostname`, `GetComputerNameExW`, or `hostname-bin`); empty if unresolved. |
| `{line}` | Optional | Replaced with match line number; defaults to `1` if unavailable or if `--no-line-number` is set. |
| `{column}` | Optional (requires `{line}`) | Replaced with match column number; defaults to `1` if unavailable or if `--no-column` is set. |
| `{wslprefix}` | Optional | Replaced with `wsl$/` followed by the `WSL_DISTRO_NAME` environment variable; empty on non-Unix or unset env. |

Sources: [crates/core/flags/defs.rs:3023-3055](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L3023-L3055)

> [!NOTE]
> The `{column}` specifier strictly depends on the presence of `{line}`. If line numbers are suppressed or unavailable, column interpolation cannot function independently.
>
> Sources: [crates/core/flags/defs.rs:3043-3048](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L3043-L3048)

### URI Parsing and Validation

Format strings are parsed into structured formatting rules via standard string parsing extensions. When evaluating user inputs, invalid URI structures are rejected.

Sources: [crates/core/flags/defs.rs:3118-3124](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L3118-L3124)

> [!WARNING]
> Passing malformed custom URI templates (such as `file://heythere` lacking valid URI path placeholders or syntax structure) will cause `parse_low_raw` to return an error during flag updates.
>
> Sources: [crates/core/flags/defs.rs:3162-3164](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L3162-L3164)

## Hostname Resolution Integration

### Overview

Hostname resolution for hyperlink URI construction in ripgrep is controlled via the `--hostname-bin` command-line flag and automatic system fallback routines. When URI templates containing the `{host}` placeholder are evaluated, ripgrep determines the system hostname to populate the URI authority component.

Sources: [crates/core/flags/defs.rs:2912-2958](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L2912-L2958), [crates/core/flags/defs.rs:3032-3037](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L3032-L3037)

### Hostname Flag Definition and Parsing

The `HostnameBin` unit struct implements the `Flag` trait, allowing users to supply an external executable via command-line arguments to resolve the system hostname.

| Trait Method / Property | Value / Implementation | Purpose |
| :--- | :--- | :--- |
| `name_long` | `"hostname-bin"` | Defines the long CLI flag name. |
| `is_switch` | `false` | Indicates that the flag accepts a value rather than acting as a boolean toggle. |
| `doc_variable` | `Some("COMMAND")` | Specifies the metavariable name in generated documentation. |
| `doc_category` | `Category::Output` | Categorizes the flag under output configuration. |
| `completion_type` | `CompletionType::Executable` | Triggers executable shell completion generation. |

Sources: [crates/core/flags/defs.rs:2912-2951](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L2912-L2951)

### Execution and Resolution Call Chain

When command-line arguments are parsed and updated, `HostnameBin::update()` processes the provided executable path:

1. `HostnameBin::update(&self, v: FlagValue, args: &mut LowArgs)` receives the extracted flag value.
2. `PathBuf::from(v.unwrap_value())` converts the value into a target pathbuf.
3. `path.as_os_str().is_empty()` checks whether an empty string or omission occurred. If empty, `args.hostname_bin` is set to `None`; otherwise, it stores `Some(path)`.

Sources: [crates/core/flags/defs.rs:2952-2957](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L2952-L2957)

> [!NOTE]
> When `--hostname-bin` is set, ripgrep executes the specified binary with no arguments and strips leading and trailing whitespace from its standard output to establish the hostname.
>
> Sources: [crates/core/flags/defs.rs:2934-2938](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L2934-L2938)

### Platform-Specific Fallback Behavior

If `hostname-bin` is unset or set to an empty string, ripgrep falls back to platform-native system APIs:

- On Unix systems, ripgrep calls `gethostname`.
- On Windows systems, ripgrep calls `GetComputerNameExW` to retrieve the physical DNS hostname.
- If hostname resolution fails entirely, the `{host}` variable evaluates to an empty string.

Sources: [crates/core/flags/defs.rs:2940-2946](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L2940-L2946)

## Path Rendering and Formatting

### Overview

Path rendering and formatting in ripgrep coordinates platform-specific path separators, filename display rules, and OSC 8 escape sequence generation during output emission. The formatting pipeline processes path configurations through the `--path-separator` flag and path-formatting rules.

Sources: [crates/core/flags/defs.rs:5559-5610](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L5559-L5610)

### Path Separator Configuration and Parsing

The `PathSeparator` struct implements the `Flag` trait to allow overriding default path separator characters for printed file paths.

| Trait Method / Property | Value / Implementation | Purpose |
| :--- | :--- | :--- |
| `name_long` | `"path-separator"` | Defines the long CLI flag name. |
| `is_switch` | `false` | Indicates that the flag accepts a value. |
| `doc_variable` | `Some("SEPARATOR")` | Specifies the metavariable name in help text. |
| `doc_category` | `Category::Output` | Categorizes the flag under output configuration. |

Sources: [crates/core/flags/defs.rs:5559-5589](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L5559-L5589)

### Path Separator Update Execution Walkchain

When parsing path separator inputs, `PathSeparator::update()` executes a strict validation and unescaping sequence:

1. `v.unwrap_value()` extracts the raw flag value argument.
2. `convert::string(...)` transforms the argument into a string representation.
3. `Vec::unescape_bytes(&s)` evaluates escape sequences such as `\t`, `\0`, or hex codes.
4. The resulting raw byte vector is checked for length constraints: if empty, `args.path_separator` is set to `None`; if exactly one byte, it stores `Some(raw[0])`; otherwise, it returns an error via `anyhow::bail!`.

Sources: [crates/core/flags/defs.rs:5591-5608](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L5591-L5608)

> [!WARNING]
> Path separators are strictly limited to a single byte. Supplying a multi-byte string without proper escaping causes parsing to fail with an error detailing the byte length violation.
>
> Sources: [crates/core/flags/defs.rs:5584-5607](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L5584-L5607)

## Terminal Output and Color Interaction

### Overview

The interaction between hyperlink formatting, color configurations, and terminal output streams is managed through output choices and environment checks. Ripgrep treats color configuration settings as a proxy for determining whether any ANSI escape sequences, including OSC 8 hyperlinks, should be emitted.

Sources: [crates/core/flags/defs.rs:766-851](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L766-L851), [crates/core/flags/defs.rs:2974-3125](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L2974-L3125)

### Color and Stream Interaction

When stdout is not connected to a tty, ripgrep automatically suppresses both colors and hyperlinks by default, regardless of the explicit hyperlink format specification. Users can override this restriction by passing `--color=always`. Furthermore, environment variables such as `NO_COLOR` and `TERM=dumb` suppress color output and consequently disable hyperlink generation.

Sources: [crates/core/flags/defs.rs:787-805](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L787-L805), [crates/core/flags/defs.rs:3063-3084](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L3063-L3084)

> [!NOTE]
> To emit hyperlinks without applying color formatting to paths, lines, columns, or matches, all relevant color attributes must be explicitly set to `none` using the `--colors` flag while retaining `--color=always`.
>
> Sources: [crates/core/flags/defs.rs:822-834](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L822-L834), [crates/core/flags/defs.rs:3067-3077](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L3067-L3077)

## Related

- [[Standard Text Printer]]

