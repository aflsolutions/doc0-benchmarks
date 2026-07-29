# Hyperlink Generation

<details>
<summary>Relevant source files</summary>

The following files were used as context for generating this wiki page:

- [src/main.rs](https://github.com/sharkdp/fd/blob/main/src/main.rs)
- [README.md](https://github.com/sharkdp/fd/blob/main/README.md)
- [src/cli.rs](https://github.com/sharkdp/fd/blob/main/src/cli.rs)
- [src/walk.rs](https://github.com/sharkdp/fd/blob/main/src/walk.rs)
- [src/hyperlink.rs](https://github.com/sharkdp/fd/blob/main/src/hyperlink.rs)
- [src/fmt/mod.rs](https://github.com/sharkdp/fd/blob/main/src/fmt/mod.rs)
- [src/output.rs](https://github.com/sharkdp/fd/blob/main/src/output.rs)
- [Cargo.toml](https://github.com/sharkdp/fd/blob/main/Cargo.toml)
- [src/exec/mod.rs](https://github.com/sharkdp/fd/blob/main/src/exec/mod.rs)
- [scripts/create-deb.sh](https://github.com/sharkdp/fd/blob/main/scripts/create-deb.sh)
- [src/sanitize.rs](https://github.com/sharkdp/fd/blob/main/src/sanitize.rs)
- [src/fmt/input.rs](https://github.com/sharkdp/fd/blob/main/src/fmt/input.rs)
- [src/dir_entry.rs](https://github.com/sharkdp/fd/blob/main/src/dir_entry.rs)
- [doc/screencast.sh](https://github.com/sharkdp/fd/blob/main/doc/screencast.sh)
- [src/error.rs](https://github.com/sharkdp/fd/blob/main/src/error.rs)
- [doc/sponsors.md](https://github.com/sharkdp/fd/blob/main/doc/sponsors.md)
- [SECURITY.md](https://github.com/sharkdp/fd/blob/main/SECURITY.md)
- [src/config.rs](https://github.com/sharkdp/fd/blob/main/src/config.rs)
</details>

## Overview

Hyperlink generation equips `fd` to wrap rendered filesystem paths in clickable terminal hyperlinks using OSC 8 escape sequences, enriching interactive console sessions. This component interacts directly with the path-formatting and terminal-printing pipeline, resolving entries into absolute URLs and applying robust URL-encoding rules across various operating systems.

Sources: [src/hyperlink.rs:1-42](https://github.com/sharkdp/fd/blob/main/src/hyperlink.rs#L1-L42), [src/output.rs:17-43](https://github.com/sharkdp/fd/blob/main/src/output.rs#L17-L43)

## Hyperlink Formatting and ANSI Escape Encoding

### Overview

The `PathUrl` struct encapsulates a normalized filesystem path designed for URL rendering. Its creation requires a valid path processed through absolute path resolution, returning `OptionathUrl>` via its `new` constructor.

Sources: [src/hyperlink.rs:5-11](https://github.com/sharkdp/fd/blob/main/src/hyperlink.rs#L5-L11)

### PathUrl Display Implementation and Encoding Rules

The `fmt::Display` implementation for `PathUrl` formats the destination string using the `file://` schema prefixed to the system hostname. It retrieves encoded path bytes via `as_encoded_bytes()` and writes each byte through the `encode` function.

Sources: [src/hyperlink.rs:13-22](https://github.com/sharkdp/fd/blob/main/src/hyperlink.rs#L13-L22)

The `encode` function matches each byte against permitted character sets, writing alphanumeric characters and specific symbols directly, while percent-encoding all non-ASCII or unsafe bytes. On Windows platforms, backslash path separators (`\`) are explicitly normalized to forward slashes (`/`).

Sources: [src/hyperlink.rs:24-41](https://github.com/sharkdp/fd/blob/main/src/hyperlink.rs#L24-L41)

> [!NOTE]
> Non-ASCII bytes and bytes $\ge 128$ are percent-encoded regardless of whether they form valid UTF-8 sequences. This prevents parsing failures on operating systems like Windows where path byte vectors might not conform strictly to UTF-8.

Sources: [src/hyperlink.rs:25-30](https://github.com/sharkdp/fd/blob/main/src/hyperlink.rs#L25-L30)

### Hostname Resolution

Platform-specific `host()` functions determine the URI authority component. On Unix-like systems, `HOST_NAME` caches the result of `nix::unistd::gethostname()` using a thread-safe `OnceLock<String>`, falling back to an empty string if resolution fails. On non-Unix platforms, the host is statically defined as `/`.

Sources: [src/hyperlink.rs:43-62](https://github.com/sharkdp/fd/blob/main/src/hyperlink.rs#L43-L62)

## Absolute Path Resolution and Percent Encoding

### Overview

Converting relative filesystem paths into valid, clickable `file://` URLs requires robust absolute path resolution followed by rigorous byte-level percent encoding. The `PathUrl` abstraction handles this transformation by obtaining an absolute path via the filesystem module and formatting every byte according to strict URL safety criteria.

Sources: [src/hyperlink.rs:1-11](https://github.com/sharkdp/fd/blob/main/src/hyperlink.rs#L1-L11)

### PathUrl Construction and Byte Encoding Pipeline

The absolute path resolution and encoding pipeline follows a precise execution sequence when generating a URL representation from a raw input path.

1. `PathUrl::new(path)` receives a target path slice.
2. `absolute_path(path)` resolves the path against the current working directory to produce an absolute `PathBuf`.
3. `PathUrl(PathBuf)` wraps the resolved path into the internal `PathUrl` tuple struct, returning `None` if resolution fails.
4. `fmt::Display::fmt()` calls `host()` to obtain the URI authority and writes the scheme prefix `file://{host}`.
5. `as_encoded_bytes()` extracts the underlying OS-encoded byte representation from the path.
6. `encode(f, byte)` iterates over every individual byte, passing each through character matching rules before writing to the formatter.

Sources: [src/hyperlink.rs:1-22](https://github.com/sharkdp/fd/blob/main/src/hyperlink.rs#L1-L22)

> [!NOTE]
> On Windows builds, the `encode` function intercepts backslash path separators (`\`) and normalizes them into standard forward slashes (`/`) before URL formatting occurs.

Sources: [src/hyperlink.rs:35-36](https://github.com/sharkdp/fd/blob/main/src/hyperlink.rs#L35-L36)

### Character Encoding Reference Table

The `encode` function distinguishes between unreserved URI characters that pass through unmodified and special or non-ASCII bytes that undergo hexadecimal percent encoding.

| Byte Pattern / Character | Action | Formatted Output / Description |
| :--- | :--- | :--- |
| `b'0'..=b'9'`, `b'A'..=b'Z'`, `b'a'..=b'z'` | Passthrough | Alphanumeric ASCII characters remain unencoded. |
| `b'/'`, `b':'`, `b'-'`, `b'.'`, `b'_'`, `b'~'` | Passthrough | Standard path and URI structural characters remain unencoded. |
| `b'\\'` (Windows only) | Replacement | Backslashes are written as forward slashes (`/`). |
| All other bytes (`_`) | Percent Encode | Encoded as `%` followed by two uppercase hexadecimal digits (`%{byte:02X}`). |

Sources: [src/hyperlink.rs:24-41](https://github.com/sharkdp/fd/blob/main/src/hyperlink.rs#L24-L41)

## Terminal Output Pipeline Integration

### Overview

Hyperlink generation integrates directly into the core terminal output pipeline via the `print_entry` function in `src/output.rs`. When enabled via configuration, the output routine wraps rendered directory entries in OSC 8 escape sequences, enclosing both colored and uncolored path outputs between opening and closing hyperlink markers.

Sources: [src/output.rs:17-43](https://github.com/sharkdp/fd/blob/main/src/output.rs#L17-L43)

### Output Printing Call-Chain

The integration of hyperlinks into entry rendering follows a strict conditional execution path managed by `print_entry`:

1. `print_entry(stdout, entry, config)` inspects `config.hyperlink` and attempts to construct a `PathUrl` via `PathUrl::new(entry.path())`.
2. If both conditions succeed, it writes the opening OSC 8 hyperlink sequence `\x1B]8;;{url}\x1B\\` to `stdout` and sets `has_hyperlink = true`.
3. It evaluates the formatting configuration, dispatching to `print_entry_format`, `print_entry_colorized`, or `print_entry_uncolorized`.
4. The selected formatter writes the entry's path and optional trailing slash (managed by `print_trailing_slash`) to `stdout`.
5. If `has_hyperlink` is active, it writes the closing OSC 8 sequence `\x1B]8;;\x1B\\` to terminate the hyperlink span.
6. It appends either a null byte (`\0`) when `config.null_separator` is set, or a standard newline (`writeln!(stdout)`) to finalize the output line.

Sources: [src/output.rs:17-43](https://github.com/sharkdp/fd/blob/main/src/output.rs#L17-L43)

> [!TIP]
> The closing OSC 8 escape sequence (`\x1B]8;;\x1B\\`) is emitted *after* colorization and trailing slash rendering, ensuring that the entire rendered output block remains clickable without breaking ANSI color styling boundaries.

Sources: [src/output.rs:34-36](https://github.com/sharkdp/fd/blob/main/src/output.rs#L34-L36)

### Output Method Dispatch Table

The output pipeline selects its formatting strategy based on active configuration flags before finalizing the entry line.

| Dispatch Condition | Target Function | Purpose |
| :--- | :--- | :--- |
| `config.format.is_some()` | `print_entry_format` | Renders entries according to a custom user-defined format template string. |
| `config.ls_colors.is_some()` | `print_entry_colorized` | Applies terminal colors based on `ls_colors` indicators and path components. |
| Fallback (None) | `print_entry_uncolorized` | Writes uncolorized paths, respecting raw byte output on Unix piped targets. |

Sources: [src/output.rs:26-32](https://github.com/sharkdp/fd/blob/main/src/output.rs#L26-L32)

## Hyperlink Configuration and Options Parsing

### Overview

Controlling hyperlink generation involves evaluating command-line arguments and mapping them through runtime configuration options. Users configure hyperlink behavior using the `--hyperlink` CLI flag (with the `--hyper` alias), which accepts an optional mode value.

Sources: [src/cli.rs:537-548](https://github.com/sharkdp/fd/blob/main/src/cli.rs#L537-L548), [src/config.rs:131-132](https://github.com/sharkdp/fd/blob/main/src/config.rs#L131-L132)

### CLI Options and Configuration Mapping

The command-line interface defines the `HyperlinkWhen` enum to represent user intent, supporting `Auto`, `Always`, and `Never` modes. During startup, `construct_config` translates this enum and the output colorization state into a boolean `hyperlink` flag stored within the `Config` struct.

Sources: [src/cli.rs:845-853](https://github.com/sharkdp/fd/blob/main/src/cli.rs#L845-L853), [src/main.rs:293-297](https://github.com/sharkdp/fd/blob/main/src/main.rs#L293-L297), [src/config.rs:131-132](https://github.com/sharkdp/fd/blob/main/src/config.rs#L131-L132)

### Hyperlink Configuration Execution Walkchain

The initialization and evaluation of hyperlink settings proceed through a strict call sequence during application startup:

1. `Opts::parse()` parses command-line arguments, defaulting `opts.hyperlink` to `HyperlinkWhen::Never` with a default missing value of `auto` when invoked without arguments.
2. `construct_config(opts, pattern_regexps)` evaluates `colored_output` based on color settings, `NO_COLOR` environment variables, and terminal interactivity checks.
3. `construct_config` matches on `opts.hyperlink`:
   - `HyperlinkWhen::Always` resolves directly to `true`.
   - `HyperlinkWhen::Never` resolves directly to `false`.
   - `HyperlinkWhen::Auto` assigns `colored_output`, enabling hyperlinks whenever colors are active.
4. The resulting boolean value is stored in `Config { hyperlink, .. }`.
5. `walk::scan(&search_paths, regexps, config)` consumes the `Config` instance, passing the hyperlink flag down to the output printing routines.

Sources: [src/main.rs:76-112](https://github.com/sharkdp/fd/blob/main/src/main.rs#L76-L112), [src/main.rs:279-297](https://github.com/sharkdp/fd/blob/main/src/main.rs#L279-L297), [src/cli.rs:537-548](https://github.com/sharkdp/fd/blob/main/src/cli.rs#L537-L548)

> [!WARNING]
> Hyperlinks are explicitly disabled when running with `--exec` or `--exec-batch` (`-x` / `-X`), as terminal escape sequences cannot be reliably injected into batched or streamed command executions.

Sources: [src/cli.rs:535-536](https://github.com/sharkdp/fd/blob/main/src/cli.rs#L535-L536)

### Hyperlink Enumeration and Options Table

The CLI parsing layer defines specific variants and argument behaviors for controlling hyperlink output.

| Option / Enum Variant | Type / Value | Default | Description |
| :--- | :--- | :--- | :--- |
| `--hyperlink` (`--hyper`) | CLI Flag | `Never` (missing: `auto`) | Adds terminal hyperlink to a `file://` URL for each path in the output. |
| `HyperlinkWhen::Auto` | Enum Variant | N/A | Uses hyperlinks only if color output is enabled. |
| `HyperlinkWhen::Always` | Enum Variant | N/A | Always uses hyperlinks when printing file paths. |
| `HyperlinkWhen::Never` | Enum Variant | N/A | Never uses hyperlinks. |

Sources: [src/cli.rs:537-548](https://github.com/sharkdp/fd/blob/main/src/cli.rs#L537-L548), [src/cli.rs:845-853](https://github.com/sharkdp/fd/blob/main/src/cli.rs#L845-L853)

## Terminal Output Sanitization and Security

### Overview

To prevent terminal escape code injection attacks when rendering potentially malicious filenames to interactive TTYs, `fd` implements a comprehensive output sanitization mechanism. Malicious filenames containing embedded control characters, carriage returns, or escape sequences (such as OSC 8 hyperlinks or OSC 52 clipboard payloads) can manipulate terminal emulators or spoof command output. The sanitization logic inspects text strings character-by-character and escapes dangerous codepoints before they reach standard output or standard error.

Sources: [src/sanitize.rs:1-24](https://github.com/sharkdp/fd/blob/main/src/sanitize.rs#L1-L24), [src/sanitize.rs:80-96](https://github.com/sharkdp/fd/blob/main/src/sanitize.rs#L80-L96)

### Sanitization Pipeline and Character Escaping Walkchain

The execution path for filtering terminal strings flows through specific validation functions:

1. `maybe_sanitize(s, is_terminal)` checks whether output is directed to an interactive TTY (`is_terminal`). If false, it returns a zero-copy `Cow::Borrowed(s)` allowing raw bytes (including invalid UTF-8) to pass through untouched on pipes or files.
2. If `is_terminal` is true, `sanitize_for_terminal(s)` is invoked, calling `s.chars().any(needs_escape)` as a fast-path guard. If no forbidden characters exist, it returns a borrowed slice.
3. When `needs_escape(c)` evaluates to true, an owned `String` buffer is initialized, and each dangerous character is transformed:
   - Characters with code points $\le$ `0xFF` are formatted as two-digit hexadecimal escape sequences (`\xHH`).
   - Characters with code points > `0xFF` are formatted as unicode hex escape sequences (`\u{HHHH}`).
4. Safe characters are appended directly to the output buffer without modification, returned finally as an owned `Cow::Owned(out)`.

Sources: [src/sanitize.rs:26-55](https://github.com/sharkdp/fd/blob/main/src/sanitize.rs#L26-L55), [src/output.rs:175-182](https://github.com/sharkdp/fd/blob/main/src/output.rs#L175-L182)

### Sanitized Target Contexts

Terminal sanitization is applied across distinct output pathways within `fd`, securing both file listings and diagnostic messages:

* `print_entry_format`: Sanitizes custom format template outputs rendered in interactive terminal mode.
* `print_entry_colorized`: Separately sanitizes parent directory paths and basenames before applying `nu-ansi-term` styling.
* `print_entry_uncolorized_base`: Sanitizes standard uncolorized path strings.
* `print_error`: Intercepts error messages destined for standard error, sanitizing them when `stderr` is connected to an interactive terminal.

Sources: [src/output.rs:81-85](https://github.com/sharkdp/fd/blob/main/src/output.rs#L81-L85), [src/output.rs:120-129](https://github.com/sharkdp/fd/blob/main/src/output.rs#L120-L129), [src/output.rs:153-154](https://github.com/sharkdp/fd/blob/main/src/output.rs#L153-L154), [src/error.rs:5-9](https://github.com/sharkdp/fd/blob/main/src/error.rs#L5-L9)

### Escape Rules and Filtered Characters

The `needs_escape` predicate isolates specific ranges of control codes, invisible formatting characters, bidi overrides, and tag characters to prevent UI spoofing and escape injection.

| Character / Range | Codepoint / Match Condition | Action Taken | Purpose / Threat Mitigated |
| :--- | :--- | :--- | :--- |
| Horizontal Tab (`\t`) | `c == '\t'` | Preserved (`false`) | Allows standard tab formatting in text outputs. |
| Control Characters | `c.is_control()` | Escaped (`\xHH` / `\u{HHHH}`) | Strips C0/C1/DEL, null bytes, bells, and carriage returns used for output forgery. |
| Soft Hyphen | `\u{00AD}` | Escaped (`\u{00AD}`) | Prevents invisible character confusion. |
| Mongolian Vowel Separator | `\u{180E}` | Escaped (`\u{180E}`) | Neutralizes invisible formatting artifacts. |
| Zero-Width / LRM / RLM | `\u{200B}'..='\u{200F}` | Escaped | Prevents layout manipulation and spoofing. |
| Bidi Overrides | `\u{202A}'..='\u{202E}` | Escaped | Blocks Trojan-Source style RLO/LRO attacks that flip rendered filename order. |
| Invisible Word Joiners & Formats | `\u{2060}'..='\u{206F}` | Escaped | Neutralizes deprecated and invisible format characters. |
| Zero-Width No-Break Space / BOM | `\u{FEFF}` | Escaped | Prevents leading invisible character spoofing. |
| Interlinear Annotation | `\u{FFF9}'..='\u{FFFB}` | Escaped | Neutralizes annotation control characters. |
| Language Tags | `\u{E0000}'..='\u{E007F}` | Escaped | Blocks hidden language tag injections. |

Sources: [src/sanitize.rs:8-24](https://github.com/sharkdp/fd/blob/main/src/sanitize.rs#L8-L24)

> [!WARNING]
> On Unix systems, piping output to a file or another command disables sanitization, causing raw bytes to pass through unchanged. This ensures that non-UTF-8 filenames are preserved intact for downstream tools, while interactive TTY rendering strictly escapes unsafe control vectors.

Sources: [src/output.rs:173-182](https://github.com/sharkdp/fd/blob/main/src/output.rs#L173-L182), [src/sanitize.rs:48-55](https://github.com/sharkdp/fd/blob/main/src/sanitize.rs#L48-L55)

> [!NOTE]
> Legitimate Unicode features such as emoji variation selectors (`\u{FE0F}`) and private-use characters used by icon fonts are explicitly permitted and pass through without escaping.

Sources: [src/sanitize.rs:143-156](https://github.com/sharkdp/fd/blob/main/src/sanitize.rs#L143-L156)

## Related

- [[Result Output]]

