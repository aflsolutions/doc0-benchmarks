# Terminal Colors

<details>
<summary>Relevant source files</summary>

The following files were used as context for generating this wiki page:

- [crates/searcher/src/searcher/glue.rs](https://github.com/BurntSushi/ripgrep/blob/main/crates/searcher/src/searcher/glue.rs)
- [crates/printer/src/standard.rs](https://github.com/BurntSushi/ripgrep/blob/main/crates/printer/src/standard.rs)
- [crates/printer/src/hyperlink/mod.rs](https://github.com/BurntSushi/ripgrep/blob/main/crates/printer/src/hyperlink/mod.rs)
</details>

## Overview

The terminal colors infrastructure provides rich ANSI styling, match highlighting, and interactive terminal escape sequences for search results and file paths. Operating across search glue execution flows and standard output printers, it coordinates how search matches, line numbers, headings, paths, and context blocks are styled and formatted for modern terminal emulators.

Sources: [crates/searcher/src/searcher/glue.rs:1-94](https://github.com/BurntSushi/ripgrep/blob/main/crates/searcher/src/searcher/glue.rs#L1-L94), [crates/printer/src/standard.rs:1-58](https://github.com/BurntSushi/ripgrep/blob/main/crates/printer/src/standard.rs#L1-L58), [crates/printer/src/hyperlink/mod.rs:1-32](https://github.com/BurntSushi/ripgrep/blob/main/crates/printer/src/hyperlink/mod.rs#L1-L32)

## Printer Color Configuration and Specs

### Overview

The standard printer configuration manages `ColorSpec` properties and formatting options through `StandardBuilder` and its internal `Config` structure. Colors and display specs are assigned using `color_specs` before printing takes place, though the actual rendering depends on the `termcolor::WriteColor` implementation passed into the printer builder.

Sources: [crates/printer/src/standard.rs:30-58](https://github.com/BurntSushi/ripgrep/blob/main/crates/printer/src/standard.rs#L30-L58), [crates/printer/src/standard.rs:147-167](https://github.com/BurntSushi/ripgrep/blob/main/crates/printer/src/standard.rs#L147-L167)

### Printer Configuration and Color Granularity

When configuring standard printer options, matching granularity is dynamically evaluated based on whether colors, columns, line numbers, or stats are active. The method `needs_match_granularity` inspects underlying color settings to determine if individual match locations must be computed during searches.

```rust
fn needs_match_granularity(&self) -> bool {
    let supports_color = self.wtr.borrow().supports_color();
    let match_colored = !self.config.colors.matched().is_none();

    (supports_color && match_colored)
    || self.config.column
    || self.config.replacement.is_some()
    || self.config.per_match
    || self.config.only_matching
    || self.config.stats
}
```

Sources: [crates/printer/src/standard.rs:573-595](https://github.com/BurntSushi/ripgrep/blob/main/crates/printer/src/standard.rs#L573-L595)

> [!NOTE]
> Even if `color_specs` specifies styling for matched text or paths, no ANSI sequences or styles are emitted unless the writer passed to `build` supports color output via `termcolor::WriteColor`.

Sources: [crates/printer/src/standard.rs:147-167](https://github.com/BurntSushi/ripgrep/blob/main/crates/printer/src/standard.rs#L147-L167), [crates/printer/src/standard.rs:578-580](https://github.com/BurntSushi/ripgrep/blob/main/crates/printer/src/standard.rs#L578-L580)

### Prelude Writing and Field Separation

The `PreludeWriter` struct coordinates writing line prefixes, including file paths, line numbers, column numbers, and absolute byte offsets prior to outputting the matching line contents.

```rust
struct PreludeWriter<'a, M: Matcher, W> {
    std: &'a StandardImpl<'a, M, W>,
    next_separator: PreludeSeparator,
    field_separator: &'a [u8],
    interp_status: hyperlink::InterpolatorStatus,
}
```

Sources: [crates/printer/src/standard.rs:1592-1599](https://github.com/BurntSushi/ripgrep/blob/main/crates/printer/src/standard.rs#L1592-L1599)

The execution flow for writing a line's prelude follows a strict sequence through `write_prelude`:
`PreludeWriter::new()` → `prelude.start()` → `prelude.write_path()` → `prelude.write_line_number()` → `prelude.write_column_number()` → `prelude.write_byte_offset()` → `prelude.end()`.

Sources: [crates/printer/src/standard.rs:1776-1789](https://github.com/BurntSushi/ripgrep/blob/main/crates/printer/src/standard.rs#L1776-L1789)

## Standard Printer ANSI Sequence Writing

### Overview

The standard printer's rendering layer applies ANSI start and end color escape sequences through `StandardImpl` methods like `start_color_match`, `end_color_match`, `start_line_highlight`, and `end_line_highlight`. These methods manage state transitions using an `in_color_match` cell and interrogate color specifications to style matched substrings and surrounding text during line rendering.

Sources: [crates/printer/src/standard.rs:875-896](https://github.com/BurntSushi/ripgrep/blob/main/crates/printer/src/standard.rs#L875-L896), [crates/printer/src/standard.rs:1475-1517](https://github.com/BurntSushi/ripgrep/blob/main/crates/printer/src/standard.rs#L1475-L1517)

### Color Match Sequence Methods

The core methods responsible for toggling ANSI sequences during line iteration are defined on `StandardImpl`:

- `start_color_match`: Checks `self.in_color_match.get()`, and if false, applies `self.config().colors.matched()` to the underlying writer via `wtr.set_color(...)`, setting `in_color_match` to true.
- `end_color_match`: Checks `self.in_color_match.get()`, and if true, either switches to the highlight color (if `self.highlight_on()` is true) or resets colors via `wtr.reset()`, setting `in_color_match` to false.
- `highlight_on`: Returns true if the highlight color specification is not empty and the current line is not a context line (`!self.is_context()`).
- `start_line_highlight`: Invokes `self.wtr().borrow_mut().set_color(...)` with the highlight spec if `highlight_on()` returns true.
- `end_line_highlight`: Resets color output if `highlight_on()` returns true.

Sources: [crates/printer/src/standard.rs:1475-1517](https://github.com/BurntSushi/ripgrep/blob/main/crates/printer/src/standard.rs#L1475-L1517)

> [!WARNING]
> `end_color_match` does not unconditionally reset colors back to default; if line-level highlighting is active via `highlight_on()`, ending a match switches the active style back to the background line highlight rather than clearing all attributes.

Sources: [crates/printer/src/standard.rs:1484-1497](https://github.com/BurntSushi/ripgrep/blob/main/crates/printer/src/standard.rs#L1484-L1497)

### Match Highlighting Call-Chain Walkthrough

When writing lines containing colored matches, `StandardImpl` traverses text segments through a precise sequence of methods:
`write_colored_matches()` → `start_line_highlight()` → loop over byte slices (`start_color_match()` or `end_color_match()` depending on boundary conditions) → `end_color_match()` → `end_line_highlight()`.

Sources: [crates/printer/src/standard.rs:1247-1288](https://github.com/BurntSushi/ripgrep/blob/main/crates/printer/src/standard.rs#L1247-L1288), [crates/printer/src/standard.rs:1503-1517](https://github.com/BurntSushi/ripgrep/blob/main/crates/printer/src/standard.rs#L1503-L1517)

## Hyperlink Formatting and Escape Interpolation

### Overview

The `crates/printer/src/hyperlink/mod.rs` module provides functionality for parsing custom hyperlink format strings and constructing terminal escape sequences for file path links. It defines `HyperlinkConfig`, `HyperlinkFormat`, and a `FromStr` parser that processes template strings containing brace-delimited variables into structured format parts.

Sources: [crates/printer/src/hyperlink/mod.rs:14-74](https://github.com/BurntSushi/ripgrep/blob/main/crates/printer/src/hyperlink/mod.rs#L14-L74)

### Hyperlink Format Parsing State Machine

The parser for `HyperlinkFormat` implements a state machine using `std::str::FromStr`. It checks if the input matches any predefined alias in `HYPERLINK_PATTERN_ALIASES` before scanning character by character through four states: `Verbatim`, `VerbatimCloseVariable`, `OpenVariable`, and `InVariable`. 

Sources: [crates/printer/src/hyperlink/mod.rs:10-12](https://github.com/BurntSushi/ripgrep/blob/main/crates/printer/src/hyperlink/mod.rs#L10-L12), [crates/printer/src/hyperlink/mod.rs:99-166](https://github.com/BurntSushi/ripgrep/blob/main/crates/printer/src/hyperlink/mod.rs#L99-L166)

The parsing execution flow follows this path:
`HyperlinkFormat::from_str()` → `HyperlinkAlias::find()` → state machine loop over `input.chars()` → `FormatBuilder::append_char()` or `FormatBuilder::append_var()` → `builder.build()`.

Sources: [crates/printer/src/hyperlink/mod.rs:102-174](https://github.com/BurntSushi/ripgrep/blob/main/crates/printer/src/hyperlink/mod.rs#L102-L174)

> [!WARNING]
> Unmatched closing braces or unclosed variable brackets during string parsing return explicit errors (`InvalidCloseVariable` or `UnclosedVariable`), preventing malformed escape sequence generation.

Sources: [crates/printer/src/hyperlink/mod.rs:133-173](https://github.com/BurntSushi/ripgrep/blob/main/crates/printer/src/hyperlink/mod.rs#L133-L173)

### Format Parser States and Transitions

| State Name | Trigger Character | Resulting Action | Next State |
| :--- | :--- | :--- | :--- |
| `Verbatim` | `{` | None | `OpenVariable` |
| `Verbatim` | `}` | None | `VerbatimCloseVariable` |
| `Verbatim` | Other | Appends character to verbatim buffer | `Verbatim` |
| `VerbatimCloseVariable` | `}` | Appends escaped `}` to builder | `Verbatim` |
| `OpenVariable` | `{` | Appends literal `{` to builder | `Verbatim` |
| `OpenVariable` | `}` | Appends empty variable to builder | `Verbatim` |
| `OpenVariable` | Other | Clears name buffer, pushes character | `InVariable` |
| `InVariable` | `}` | Appends variable name to builder | `Verbatim` |
| `InVariable` | Other | Pushes character to variable name buffer | `InVariable` |

Sources: [crates/printer/src/hyperlink/mod.rs:105-165](https://github.com/BurntSushi/ripgrep/blob/main/crates/printer/src/hyperlink/mod.rs#L105-L165)

### Configuration and Methods Reference

- `HyperlinkConfig::new(env, format)`: Creates a new configuration wrapping an `Arc<HyperlinkConfigInner>` containing the environment and format.
- `HyperlinkFormat::empty()`: Returns an empty hyperlink format equivalent to `HyperlinkFormat::default()`, which disables hyperlinks.
- `HyperlinkFormat::is_empty()`: Returns true if the internal parts vector has no elements.
- `HyperlinkFormat::into_config(env)`: Consumes the format and pairs it with a `HyperlinkEnvironment` to produce a `HyperlinkConfig`.
- `HyperlinkFormat::is_line_dependent()`: Returns an internal boolean indicating whether the format produces line-dependent hyperlinks.

Sources: [crates/printer/src/hyperlink/mod.rs:24-51](https://github.com/BurntSushi/ripgrep/blob/main/crates/printer/src/hyperlink/mod.rs#L24-L51), [crates/printer/src/hyperlink/mod.rs:77-96](https://github.com/BurntSushi/ripgrep/blob/main/crates/printer/src/hyperlink/mod.rs#L77-L96)

## Integrating Color Sinks with Search Glue

### Overview

The `grep_searcher::Sink` trait establishes the integration bridge between low-level search iterations executed within `grep_searcher::searcher::glue` structs (`ReadByLine`, `SliceByLine`, and `MultiLine`) and high-level consumers such as printing sinks. Search execution drivers iterate through buffers and slices, invoking methods like `begin`, `matched`, `context`, `context_break`, `binary_data`, and `finish` on any implementation of `Sink`.

Sources: [crates/searcher/src/searcher/glue.rs:38-51](https://github.com/BurntSushi/ripgrep/blob/main/crates/searcher/src/searcher/glue.rs#L38-L51), [crates/printer/src/standard.rs:763-868](https://github.com/BurntSushi/ripgrep/blob/main/crates/printer/src/standard.rs#L763-L868)

### Search Glue Iteration and Sink Callback Flow

Search drivers orchestrate input processing and delegate match reporting directly to sink callbacks. The execution lifecycle proceeds through specific stages depending on whether searching is line-buffered or slice-based:

1. `Searcher::search_reader()` or `Searcher::search_slice()` instantiates glue structures such as `ReadByLine`, `SliceByLine`, or `MultiLine`.
2. `ReadByLine::run()` invokes `self.core.begin()`, loops over `self.fill()`, and drives line matches via `self.core.match_by_line(self.rdr.buffer())`.
3. `SliceByLine::run()` and `MultiLine::run()` verify binary detection via `self.core.detect_binary()` before iterating through slice segments.
4. When a match or context window is recognized, `Core` invokes `Sink::matched()` or `Sink::context()` on the target sink (e.g., `StandardSink`).
5. `StandardSink` intercepts these callbacks, manages statistics, records match granularities via `record_matches()`, handles replacements via `replace()`, and forwards rendering tasks to `StandardImpl`.
6. `ReadByLine::run()`, `SliceByLine::run()`, and `MultiLine::run()` conclude by invoking `self.core.finish()`, which calls `Sink::finish()` on the printer sink.

Sources: [crates/searcher/src/searcher/glue.rs:38-51](https://github.com/BurntSushi/ripgrep/blob/main/crates/searcher/src/searcher/glue.rs#L38-L51), [crates/searcher/src/searcher/glue.rs:117-131](https://github.com/BurntSushi/ripgrep/blob/main/crates/searcher/src/searcher/glue.rs#L117-L131), [crates/searcher/src/searcher/glue.rs:166-206](https://github.com/BurntSushi/ripgrep/blob/main/crates/searcher/src/searcher/glue.rs#L166-L206), [crates/printer/src/standard.rs:763-868](https://github.com/BurntSushi/ripgrep/blob/main/crates/printer/src/standard.rs#L763-L868)

> [!NOTE]
> `MultiLine` search glue explicitly delays sinking matches using `self.last_match` to group adjacent matches occurring on the same line, guaranteeing that a single line is never sinked more than once.

Sources: [crates/searcher/src/searcher/glue.rs:223-226](https://github.com/BurntSushi/ripgrep/blob/main/crates/searcher/src/searcher/glue.rs#L223-L226)

### Sink Callbacks and Printer Coupling Reference

| Sink Method Signature | Intercepting StandardSink Method | Purpose in Integration Glue |
| :--- | :--- | :--- |
| `begin(&mut self, &Searcher)` | `StandardSink::begin()` | Resets match counts, timers, and byte offset states at search startup. |
| `matched(&mut self, &Searcher, &SinkMatch)` | `StandardSink::matched()` | Increments match counter, records match positions, executes replacements, and dispatches to `StandardImpl::from_match().sink()`. |
| `context(&mut self, &Searcher, &SinkContext)` | `StandardSink::context()` | Clears match buffers, processes inverted match highlights if configured, and dispatches to `StandardImpl::from_context().sink()`. |
| `context_break(&mut self, &Searcher)` | `StandardSink::context_break()` | Writes context separation dividers between discontiguous match blocks. |
| `binary_data(&mut self, &Searcher, u64)` | `StandardSink::binary_data()` | Records the absolute byte offset where binary data was first detected. |
| `finish(&mut self, &Searcher, &SinkFinish)` | `StandardSink::finish()` | Writes binary warning/conversion messages and updates accumulated aggregate statistics. |

Sources: [crates/printer/src/standard.rs:763-868](https://github.com/BurntSushi/ripgrep/blob/main/crates/printer/src/standard.rs#L763-L868)

## Hyperlink Format Validation and Environment Resolution

### Overview

Hyperlink formatting relies on parsing user-supplied format strings or recognized aliases through `HyperlinkFormat::from_str`. The parsing engine processes characters using a state machine that tracks verbatim text, open variable braces, variable content, and close variable braces. During parsing, variable tokens and custom URL schemes are validated against known patterns, and environment variables are resolved via `HyperlinkEnvironment`.

Sources: [crates/printer/src/hyperlink/mod.rs:99-175](https://github.com/BurntSushi/ripgrep/blob/main/crates/printer/src/hyperlink/mod.rs#L99-L175)

### Hyperlink Format Parsing State Machine

The parser implements `std::str::FromStr` for `HyperlinkFormat` using four distinct parser states: `Verbatim`, `VerbatimCloseVariable`, `OpenVariable`, and `InVariable`. 

1. `HyperlinkAlias::find(s)` first checks if the input string `s` matches a known pattern alias (such as `vscode`); if found, the alias's underlying format string is substituted.
2. The character iteration loop updates `state` based on incoming characters:
   - In `Verbatim`, encountering `{` transitions to `OpenVariable`; encountering `}` transitions to `VerbatimCloseVariable`; any other character is appended via `builder.append_char(ch)`.
   - In `VerbatimCloseVariable`, a second `}` appends a literal `}` and returns to `Verbatim`; any other character returns `Err(err(InvalidCloseVariable))`.
   - In `OpenVariable`, encountering another `{` appends `{` and returns to `Verbatim`. Encountering `}` invokes `builder.append_var(&name)` with an empty name. Any other character pushes to `name` and transitions to `InVariable`.
   - In `InVariable`, encountering `}` invokes `builder.append_var(&name)` and returns to `Verbatim`; any other character accumulates into `name`.
3. Upon completion, if `state` is not `Verbatim`, the parser returns `Err(err(InvalidCloseVariable))` or `Err(err(UnclosedVariable))`.

Sources: [crates/printer/src/hyperlink/mod.rs:99-175](https://github.com/BurntSushi/ripgrep/blob/main/crates/printer/src/hyperlink/mod.rs#L99-L175)

> [!WARNING]
> Unclosed variable braces or malformed closing braces in custom hyperlink format strings will immediately abort parsing and return `HyperlinkFormatError` with either `UnclosedVariable` or `InvalidCloseVariable` kinds.

Sources: [crates/printer/src/hyperlink/mod.rs:133-173](https://github.com/BurntSushi/ripgrep/blob/main/crates/printer/src/hyperlink/mod.rs#L133-L173)

### Hyperlink Format Error Kinds

| Error Kind Variant | Condition Triggering Error | Meaning in Parsing Flow |
| :--- | :--- | :--- |
| `InvalidCloseVariable` | Encountering a single `}` without a matching open variable or invalid escape sequence. | The closing brace syntax is malformed or unescaped in verbatim text. |
| `UnclosedVariable` | Reaching end-of-input while in `OpenVariable` or `InVariable` state. | A variable declaration was opened with `{` but never closed with `}`. |

Sources: [crates/printer/src/hyperlink/mod.rs:103-173](https://github.com/BurntSushi/ripgrep/blob/main/crates/printer/src/hyperlink/mod.rs#L103-L173)

## Related

- [[Standard Text Printer]]

