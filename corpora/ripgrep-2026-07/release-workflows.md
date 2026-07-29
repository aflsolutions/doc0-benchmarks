# Release Workflows

<details>
<summary>Relevant source files</summary>

The following files were used as context for generating this wiki page:

- [crates/globset/src/glob.rs](https://github.com/BurntSushi/ripgrep/blob/main/crates/globset/src/glob.rs)
- [README.md](https://github.com/BurntSushi/ripgrep/blob/main/README.md)
- [crates/core/flags/defs.rs](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs)
</details>

## Overview

Release workflows manage the execution, configuration, and structural processing required to build ripgrep binaries and generate release-focused assets across the repository's core packages. These workflows encompass version flag handling, command-line flag definitions, package-level documentation, glob pattern parsing, runtime build flag execution, and pattern-to-regex conversions. Sources: [crates/globset/src/glob.rs](https://github.com/BurntSushi/ripgrep/blob/main/crates/globset/src/glob.rs#L70-L81), [README.md](https://github.com/BurntSushi/ripgrep/blob/main/README.md#L1-L10), [crates/core/flags/defs.rs](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L39-L156)

## Version Flag and Release Definitions

### Overview

The release version flags and command-line definitions in ripgrep are structured around the `Flag` trait implementation and the centralized `FLAGS` constant array defined in `crates/core/flags/defs.rs`. Each entry in `FLAGS` maps to a distinct logical flag, governing both runtime parsing behavior and the ordering of flags in generated help documentation and man pages. Deprecated flags are deliberately placed at the end of the array to ensure they appear last within their respective documentation categories.

Sources: [crates/core/flags/defs.rs](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L39-L156)

### Flag Configuration and Definition Reference

The repository defines core flags as unit structs implementing the `Flag` trait. Each logical flag encapsulates long names, optional short character codes, negated variants, and category classifications.

| Flag Struct | Short Name | Long Name | Negated Name | Category | Purpose |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `AfterContext` | `Some(b'A')` | `"after-context"` | `None` | `Category::Output` | Show NUM lines after each match. Sources: [crates/core/flags/defs.rs](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L231-L266) |
| `AutoHybridRegex` | `None` | `"auto-hybrid-regex"` | `Some("no-auto-hybrid-regex")` | `Category::Search` | (DEPRECATED) Use PCRE2 if appropriate. Sources: [crates/core/flags/defs.rs](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L318-L376) |
| `BeforeContext` | `Some(b'B')` | `"before-context"` | `None` | `Category::Output` | Show NUM lines before each match. Sources: [crates/core/flags/defs.rs](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L416-L452) |
| `Binary` | `None` | `"binary"` | `Some("no-binary")` | `Category::Filter` | Search binary files. Sources: [crates/core/flags/defs.rs](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L503-L566) |
| `BlockBuffered` | `None` | `"block-buffered"` | `Some("no-block-buffered")` | `Category::Output` | Force block buffering. Sources: [crates/core/flags/defs.rs](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L594-L634) |
| `ByteOffset` | `Some(b'b')` | `"byte-offset"` | `Some("no-byte-offset")` | `Category::Output` | Print the byte offset for each matching line. Sources: [crates/core/flags/defs.rs](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L654-L692) |
| `CaseSensitive` | `Some(b's')` | `"case-sensitive"` | `None` | `Category::Search` | Search case sensitively (default). Sources: [crates/core/flags/defs.rs](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L713-L751) |
| `Color` | `None` | `"color"` | `None` | `Category::Output` | When to use color. Sources: [crates/core/flags/defs.rs](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L766-L851) |
| `Colors` | `None` | `"colors"` | `None` | `Category::Output` | Configure color settings and styles. Sources: [crates/core/flags/defs.rs](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L889-L975) |
| `Column` | `None` | `"column"` | `Some("no-column")` | `Category::Output` | Show column numbers. Sources: [crates/core/flags/defs.rs](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L1020-L1055) |
| `Context` | `Some(b'C')` | `"context"` | `None` | `Category::Output` | Show NUM lines before and after each match. Sources: [crates/core/flags/defs.rs](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L1073-L1112) |
| `ContextSeparator` | `None` | `"context-separator"` | `Some("no-context-separator")` | `Category::Output` | Set the separator for contextual chunks. Sources: [crates/core/flags/defs.rs](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L1213-L1261) |
| `Count` | `Some(b'c')` | `"count"` | `None` | `Category::OutputModes` | Show count of matching lines for each file. Sources: [crates/core/flags/defs.rs](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L1323-L1376) |
| `CountMatches` | `None` | `"count-matches"` | `None` | `Category::OutputModes` | Show count of every match for each file. Sources: [crates/core/flags/defs.rs](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L1397-L1439) |
| `Crlf` | `None` | `"crlf"` | `Some("no-crlf")` | `Category::Search` | Use CRLF line terminators (nice for Windows). Sources: [crates/core/flags/defs.rs](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L1457-L1502) |
| `Debug` | `None` | `"debug"` | `None` | `Category::Logging` | Show debug messages. Sources: [crates/core/flags/defs.rs](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L1531-L1566) |
| `DfaSizeLimit` | `None` | `"dfa-size-limit"` | `None` | `Category::Search` | The upper size limit of the regex DFA. Sources: [crates/core/flags/defs.rs](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L1583-L1619) |
| `Encoding` | `Some(b'E')` | `"encoding"` | `Some("no-encoding")` | `Category::Search` | Specify the text encoding of files to search. Sources: [crates/core/flags/defs.rs](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L1657-L1726) |
| `Engine` | `None` | `"engine"` | `None` | `Category::Search` | Specify which regex engine to use. Sources: [crates/core/flags/defs.rs](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L1766-L1823) |
| `FieldContextSeparator` | `None` | `"field-context-separator"` | `None` | `Category::Output` | Set the field context separator. Sources: [crates/core/flags/defs.rs](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L1858-L1895) |
| `FieldMatchSeparator` | `None` | `"field-match-separator"` | `None` | `Category::Output` | Set the field match separator. Sources: [crates/core/flags/defs.rs](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L1966-L2003) |
| `File` | `Some(b'f')` | `"file"` | `None` | `Category::Input` | Search for patterns from the given file. Sources: [crates/core/flags/defs.rs](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L2063-L2110) |
| `Files` | `None` | `"files"` | `None` | `Category::OtherBehaviors` | Print each file that would be searched. Sources: [crates/core/flags/defs.rs](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L2207-L2237) |
| `FilesWithMatches` | `Some(b'l')` | `"files-with-matches"` | `None` | `Category::OutputModes` | Print the paths with at least one match. Sources: [crates/core/flags/defs.rs](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L249-L290) |
| `FilesWithoutMatch` | `None` | `"files-without-match"` | `None` | `Category::OutputModes` | Print the paths that contain zero matches. Sources: [crates/core/flags/defs.rs](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L2305-L2338) |
| `FixedStrings` | `Some(b'F')` | `"fixed-strings"` | `Some("no-fixed-strings")` | `Category::Search` | Treat all patterns as literals. Sources: [crates/core/flags/defs.rs](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L2360-L2395) |
| `Follow` | `Some(b'L')` | `"follow"` | `Some("no-follow")` | `Category::Filter` | Follow symbolic links. Sources: [crates/core/flags/defs.rs](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L2416-L2453) |
| `Generate` | `None` | `"generate"` | `None` | `Category::OtherBehaviors` | Generate man pages and completion scripts. Sources: [crates/core/flags/defs.rs](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L2474-L2541) |
| `Glob` | `Some(b'g')` | `"glob"` | `None` | `Category::Filter` | Include or exclude file paths. Sources: [crates/core/flags/defs.rs](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L2579-L2636) |
| `GlobCaseInsensitive` | `None` | `"glob-case-insensitive"` | `Some("no-glob-case-insensitive")` | `Category::Filter` | Process all glob patterns case insensitively. Sources: [crates/core/flags/defs.rs](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L2669-L2700) |
| `Heading` | `None` | `"heading"` | `Some("no-heading")` | `Category::Output` | Print matches grouped by each file. Sources: [crates/core/flags/defs.rs](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L2726-L2764) |
| `Help` | `Some(b'h')` | `"help"` | `None` | `Category::Output` | Show help output. Sources: [crates/core/flags/defs.rs](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L2785-L2824) |
| `Hidden` | `Some(b'.')` | `"hidden"` | `Some("no-hidden")` | `Category::Filter` | Search hidden files and directories. Sources: [crates/core/flags/defs.rs](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L2845-L2891) |
| `HostnameBin` | `None` | `"hostname-bin"` | `None` | `Category::Output` | Run a program to get this system's hostname. Sources: [crates/core/flags/defs.rs](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L2913-L2958) |
| `HyperlinkFormat` | `None` | `"hyperlink-format"` | `None` | `Category::Output` | Set the format of hyperlinks. Sources: [crates/core/flags/defs.rs](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L2974-L3125) |
| `IGlob` | `None` | `"iglob"` | `None` | `Category::Filter` | Include/exclude paths case insensitively. Sources: [crates/core/flags/defs.rs](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L3166-L3202) |
| `IgnoreCase` | `Some(b'i')` | `"ignore-case"` | `None` | `Category::Search` | Case insensitive search. Sources: [crates/core/flags/defs.rs](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L3223-L3263) |
| `IgnoreFile` | `None` | `"ignore-file"` | `None` | `Category::Filter` | Specify additional ignore files. Sources: [crates/core/flags/defs.rs](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L3284-L3328) |
| `IgnoreFileCaseInsensitive` | `None` | `"ignore-file-case-insensitive"` | `Some("no-ignore-file-case-insensitive")` | `Category::Filter` | Process ignore files case insensitively. Sources: [crates/core/flags/defs.rs](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L3347-L3379) |
| `IncludeZero` | `None` | `"include-zero"` | `Some("no-include-zero")` | `Category::Output` | Include zero matches in summary output. Sources: [crates/core/flags/defs.rs](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L3405-L3438) |
| `Index` | `Some(b'X')` | `"index"` | `None` | `Category::Indexing` | Use a search index when one is available. Sources: [crates/core/flags/defs.rs](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L3453-L3521) |
| `IndexCrud` | `None` | `"x-crud"` | `None` | `Category::Indexing` | Create or update a search index. Sources: [crates/core/flags/defs.rs](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L3554-L3619) |

Sources: [crates/core/flags/defs.rs](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L44-L156), [crates/core/flags/defs.rs](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L231-L3620)

### Indexing Restrictions and Unsupported Flags

The `LowArgs` implementation provides `indexing_unsupported_flag(&self)` to inspect current search configuration parameters against constraints required when running searches over pre-built indices. If an incompatible mode or filter option is active, the function returns a `Some(&'static dyn Flag)` reference pointing to the violating flag definition.

```rust
pub(super) fn indexing_unsupported_flag(
    &self,
) -> Option<&'static dyn Flag> {
    if matches!(self.mode, Mode::Search(SearchMode::FilesWithoutMatch)) {
        return Some(&FilesWithoutMatch);
    }
    if matches!(self.binary, BinaryMode::AsText) {
        return Some(&Binary);
    }
    if !matches!(self.encoding, EncodingMode::Auto) {
        return Some(&Encoding);
    }
    if matches!(self.engine, EngineChoice::PCRE2) {
        return Some(&Engine);
    }
    if self.follow {
        return Some(&Follow);
    }
    if !self.globs.is_empty() {
        return Some(&Glob);
    }
    if self.hidden {
        return Some(&Hidden);
    }
    if !self.iglobs.is_empty() {
        return Some(&Glob);
    }
    if !self.ignore_file.is_empty() {
        return Some(&IgnoreFile);
    }
    if self.no_ignore_dot {
        return Some(&NoIgnoreDot);
    }
    if self.no_ignore_exclude {
        return Some(&NoIgnoreExclude);
    }
    if self.no_ignore_files {
        return Some(&NoIgnoreFiles);
    }
    if self.no_ignore_global {
        return Some(&NoIgnoreGlobal);
    }
    if self.no_ignore_parent {
        return Some(&NoIgnoreParent);
    }
    if self.no_ignore_vcs {
        return Some(&NoIgnoreVcs);
    }
    if self.no_require_git {
        return Some(&NoRequireGit);
    }
    if self.one_file_system {
        return Some(&OneFileSystem);
    }
    if self.pre.is_some() {
        return Some(&Pre);
    }
    if self.search_zip {
        return Some(&SearchZip);
    }
    None
}
```

Sources: [crates/core/flags/defs.rs](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L167-L228)

> [!NOTE]
> When indexing is enabled via `-X` or `--index`, certain flags such as `--binary` (in text mode), non-auto encodings, PCRE2 engine choices, and custom globs or ignore files will trigger validation checks that prevent index execution and enforce fallback behaviors.

Sources: [crates/core/flags/defs.rs](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L167-L228)

## Global Documentation and Package Overview

### Overview

Ripgrep is a line-oriented search tool that recursively searches the current directory for a regex pattern while respecting gitignore rules and automatically skipping hidden files, directories, and binary files by default. Sources: [README.md](https://github.com/BurntSushi/ripgrep/blob/main/README.md#L3-L6) First-class support is provided for Windows, macOS, and Linux, with precompiled binary archives available for every release on GitHub. Sources: [README.md](https://github.com/BurntSushi/ripgrep/blob/main/README.md#L7-L8)

Sources: [README.md](https://github.com/BurntSushi/ripgrep/blob/main/README.md#L3-L8)

### Building From Source and Compiler Requirements

Compiling ripgrep requires a stable Rust installation matching version 1.96.0 or newer, as ripgrep tracks the latest stable compiler releases. Sources: [README.md](https://github.com/BurntSushi/ripgrep/blob/main/README.md#L453-L456) To build a release binary, clone the repository and compile using Cargo:

```bash
$ git clone https://github.com/BurntSushi/ripgrep
$ cd ripgrep
$ cargo build --release
$ ./target/release/rg --version
```

Sources: [README.md](https://github.com/BurntSushi/ripgrep/blob/main/README.md#L461-L466)

### Optional Features and Target Architectures

Optional PCRE2 regex support can be enabled during compilation by supplying the `pcre2` feature flag, which automatically detects system libraries via `pkg-config` or builds PCRE2 from source using the local C compiler. Sources: [README.md](https://github.com/BurntSushi/ripgrep/blob/main/README.md#L476-L485) Fully static Linux executables can be built using the MUSL target after adding the target to the Rust toolchain. Sources: [README.md](https://github.com/BurntSushi/ripgrep/blob/main/README.md#L491-L499)

| Build Flag / Target | Command | Description |
| ------------------- | ------- | ----------- |
| Release build | `cargo build --release` | Compiles standard optimized binary. Sources: [README.md](https://github.com/BurntSushi/ripgrep/blob/main/README.md#L463) |
| PCRE2 feature | `cargo build --release --features 'pcre2'` | Enables advanced regex features via system or static PCRE2. Sources: [README.md](https://github.com/BurntSushi/ripgrep/blob/main/README.md#L480) |
| MUSL target | `rustup target add x86_64-unknown-linux-musl && cargo build --release --target x86_64-unknown-linux-musl` | Produces a fully static executable. Sources: [README.md](https://github.com/BurntSushi/ripgrep/blob/main/README.md#L497-L499) |

Sources: [README.md](https://github.com/BurntSushi/ripgrep/blob/main/README.md#L463-L499)

> [!NOTE]
> Static linking of PCRE2 can be forced even when a system library is present by setting the `PCRE2_SYS_STATIC=1` environment variable or by building with the MUSL target. Sources: [README.md](https://github.com/BurntSushi/ripgrep/blob/main/README.md#L487-L489)

Sources: [README.md](https://github.com/BurntSushi/ripgrep/blob/main/README.md#L487-L489)

## Glob Matching and Syntax Parsing

### Overview

Managing glob parsing and pattern matching structures used in file filtering during builds involves tokenizing shell glob patterns, compiling them into matching AST tokens, and supporting optimized matching strategies such as literal prefix checks, basename matching, and regex translation. Sources: [crates/globset/src/glob.rs](https://github.com/BurntSushi/ripgrep/blob/main/crates/globset/src/glob.rs#L16-L47)

Sources: [crates/globset/src/glob.rs](https://github.com/BurntSushi/ripgrep/blob/main/crates/globset/src/glob.rs#L16-L47)

### Glob Parsing and Tokenization Execution Walkthrough

The compilation of a glob pattern follows an explicit call chain beginning with `Glob::new()` which invokes `GlobBuilder::new(glob).build()`. Sources: [crates/globset/src/glob.rs](https://github.com/BurntSushi/ripgrep/blob/main/crates/globset/src/glob.rs#L283-L284) The builder instantiates a `Parser` struct that processes characters via the following ordered execution sequence:

1. `GlobBuilder::build()` creates a `Parser` with an initial state containing empty token branches and calls `Parser::parse()`. Sources: [crates/globset/src/glob.rs](https://github.com/BurntSushi/ripgrep/blob/main/crates/globset/src/glob.rs#L579-L590)
2. `Parser::parse()` loops over characters using `self.bump()` and dispatches special syntax tokens: `?` calls `self.push_token(Token::Any)`, `*` calls `self.parse_star()`, `[` invokes `self.parse_class()`, and `{` / `}` / `,` manage alternation branches via `self.push_alternate()`, `self.pop_alternate()`, and `self.parse_comma()`. Sources: [crates/globset/src/glob.rs](https://github.com/BurntSushi/ripgrep/blob/main/crates/globset/src/glob.rs#L824-L835)
3. `Parser::parse_star()` inspects the preceding character and peeks ahead to determine whether the star represents a `Token::ZeroOrMore`, `Token::RecursivePrefix`, `Token::RecursiveSuffix`, or `Token::RecursiveZeroOrMore`. Sources: [crates/globset/src/glob.rs](https://github.com/BurntSushi/ripgrep/blob/main/crates/globset/src/glob.rs#L901-L960)
4. `Parser::parse_class()` parses character classes, handling negation (`!` or `^`), ranges (`a-z`), and unclosed classes when `allow_unclosed_class` is enabled by rolling back the iterator state and treating `[` as a literal. Sources: [crates/globset/src/glob.rs](https://github.com/BurntSushi/ripgrep/blob/main/crates/globset/src/glob.rs#L962-L1052)
5. `GlobBuilder::build()` validates that exactly one branch remains in `p.branches` and calls `tokens.to_regex_with(&self.opts)` to produce the final regular expression string before constructing the `Glob` object. Sources: [crates/globset/src/glob.rs](https://github.com/BurntSushi/ripgrep/blob/main/crates/globset/src/glob.rs#L591-L609)

Sources: [crates/globset/src/glob.rs](https://github.com/BurntSushi/ripgrep/blob/main/crates/globset/src/glob.rs#L283-L284), [crates/globset/src/glob.rs](https://github.com/BurntSushi/ripgrep/blob/main/crates/globset/src/glob.rs#L579-L609), [crates/globset/src/glob.rs](https://github.com/BurntSushi/ripgrep/blob/main/crates/globset/src/glob.rs#L824-L1052)

> [!WARNING]
> When `allow_unclosed_class` is enabled, encountering an unclosed character class sets `found_unclosed_class = true`, which permanently disables subsequent character class parsing within that glob to prevent quadratic time complexity attacks from inputs like `[[[[[[[[[[[[[[[[[[[[[[...`. Sources: [crates/globset/src/glob.rs](https://github.com/BurntSushi/ripgrep/blob/main/crates/globset/src/glob.rs#L805-L813)

Sources: [crates/globset/src/glob.rs](https://github.com/BurntSushi/ripgrep/blob/main/crates/globset/src/glob.rs#L805-L813)

### Glob Token Types and Match Strategies

Glob patterns are broken down into discrete token representations and evaluated against match strategies to optimize path filtering performance.

| Token Variant | Associated Data | Description |
| ------------- | --------------- | ----------- |
| `Literal` | `char` | Matches a single literal character with escaping support. Sources: [crates/globset/src/glob.rs](https://github.com/BurntSushi/ripgrep/blob/main/crates/globset/src/glob.rs#L271) |
| `Any` | None | Matches any single character (respects `literal_separator`). Sources: [crates/globset/src/glob.rs](https://github.com/BurntSushi/ripgrep/blob/main/crates/globset/src/glob.rs#L272) |
| `ZeroOrMore` | None | Matches zero or more characters (`*`). Sources: [crates/globset/src/glob.rs](https://github.com/BurntSushi/ripgrep/blob/main/crates/globset/src/glob.rs#L273) |
| `RecursivePrefix` | None | Matches leading path segments (`**/`). Sources: [crates/globset/src/glob.rs](https://github.com/BurntSushi/ripgrep/blob/main/crates/globset/src/glob.rs#L274) |
| `RecursiveSuffix` | None | Matches trailing path segments (`/**`). Sources: [crates/globset/src/glob.rs](https://github.com/BurntSushi/ripgrep/blob/main/crates/globset/src/glob.rs#L275) |
| `RecursiveZeroOrMore` | None | Matches nested path segments (`/**/`). Sources: [crates/globset/src/glob.rs](https://github.com/BurntSushi/ripgrep/blob/main/crates/globset/src/glob.rs#L276) |
| `Class` | `negated: bool, ranges: Vec<(char, char)>` | Character class with ranges and negation. Sources: [crates/globset/src/glob.rs](https://github.com/BurntSushi/ripgrep/blob/main/crates/globset/src/glob.rs#L277) |
| `Alternates` | `Vec<Tokens>` | Alternation group matching any nested pattern branch (`{a,b}`). Sources: [crates/globset/src/glob.rs](https://github.com/BurntSushi/ripgrep/blob/main/crates/globset/src/glob.rs#L278) |

Sources: [crates/globset/src/glob.rs](https://github.com/BurntSushi/ripgrep/blob/main/crates/globset/src/glob.rs#L270-L279)

| Match Strategy | Description | Fallback Behavior |
| -------------- | ----------- | ----------------- |
| `MatchStrategy::Literal` | Entire file path matches a literal string | Exact byte comparison. Sources: [crates/globset/src/glob.rs](https://github.com/BurntSushi/ripgrep/blob/main/crates/globset/src/glob.rs#L17-L19) |
| `MatchStrategy::BasenameLiteral` | File path basename matches a literal string | Basename byte comparison. Sources: [crates/globset/src/glob.rs](https://github.com/BurntSushi/ripgrep/blob/main/crates/globset/src/glob.rs#L20-L22) |
| `MatchStrategy::Extension` | File path extension matches a literal extension | Extension byte comparison. Sources: [crates/globset/src/glob.rs](https://github.com/BurntSushi/ripgrep/blob/main/crates/globset/src/glob.rs#L23-L25) |
| `MatchStrategy::Prefix` | Candidate path starts with a prefix literal | Prefix byte comparison. Sources: [crates/globset/src/glob.rs](https://github.com/BurntSushi/ripgrep/blob/main/crates/globset/src/glob.rs#L26-L28) |
| `MatchStrategy::Suffix` | Candidate path ends with a suffix literal | Suffix byte comparison. Sources: [crates/globset/src/glob.rs](https://github.com/BurntSushi/ripgrep/blob/main/crates/globset/src/glob.rs#L34-L39) |
| `MatchStrategy::RequiredExtension` | Extension matches; necessary but not sufficient | Requires full regex search on mismatch. Sources: [crates/globset/src/glob.rs](https://github.com/BurntSushi/ripgrep/blob/main/crates/globset/src/glob.rs#L40-L44) |
| `MatchStrategy::Regex` | Fallback matching strategy | Full compiled regex search. Sources: [crates/globset/src/glob.rs](https://github.com/BurntSushi/ripgrep/blob/main/crates/globset/src/glob.rs#L45-L46) |

Sources: [crates/globset/src/glob.rs](https://github.com/BurntSushi/ripgrep/blob/main/crates/globset/src/glob.rs#L16-L47)

### Design Trade-Offs in Glob Parsing

| Design Choice | Benefit | Cost |
| ------------- | ------- | ---- |
| AST Tokenization (`Tokens`) | Enables static inspection of patterns for literal extractions and optimization strategies | Requires an extra translation step to convert tokens into regex strings. Sources: [crates/globset/src/glob.rs](https://github.com/BurntSushi/ripgrep/blob/main/crates/globset/src/glob.rs#L251-L280) |
| Strategic Matchers (`MatchStrategy`) | Bypasses heavy regex execution for simple patterns like extensions and basenames | Adds matching branch overhead and maintenance complexity for multiple strategy variants. Sources: [crates/globset/src/glob.rs](https://github.com/BurntSushi/ripgrep/blob/main/crates/globset/src/glob.rs#L16-L67) |
| Unclosed Class Fallback Toggle (`allow_unclosed_class`) | Maintains compatibility with POSIX glob implementations that tolerate unclosed brackets | Weakens error reporting and requires state tracking (`found_unclosed_class`) to mitigate denial-of-service risks. Sources: [crates/globset/src/glob.rs](https://github.com/BurntSushi/ripgrep/blob/main/crates/globset/src/glob.rs#L232-L236) |

Sources: [crates/globset/src/glob.rs](https://github.com/BurntSushi/ripgrep/blob/main/crates/globset/src/glob.rs#L16-L67), [crates/globset/src/glob.rs](https://github.com/BurntSushi/ripgrep/blob/main/crates/globset/src/glob.rs#L232-L236), [crates/globset/src/glob.rs](https://github.com/BurntSushi/ripgrep/blob/main/crates/globset/src/glob.rs#L251-L280)

## Build Flag Parsing and Execution

### Overview

Ripgrep defines its command-line flags through implementations of the `Flag` trait, mapping multiple user-facing representations (such as long names, short options, negated switches, and aliases) to a single logical flag inside the application. Sources: [crates/core/flags/defs.rs](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L4-L18) The complete static registry of these flags is maintained in an ordered array `FLAGS`, which dictates the presentation sequence within generated documentation like help screens and man pages. Sources: [crates/core/flags/defs.rs](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L39-L44)

Sources: [crates/core/flags/defs.rs](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L4-L44)

### Flag Evaluation and Mode Mutation

When parsing command-line parameters, each matched flag invokes its corresponding `update` method, mutating the low-level argument structure (`LowArgs`) or control modes. Sources: [crates/core/flags/defs.rs](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L263-L266) For execution-halting flags like `--generate` and specialized options like `--help`, the flag updates modify internal program modes or immediately trigger auxiliary output behavior before exiting without executing a file search. Sources: [crates/core/flags/defs.rs](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L2474-L2539), [crates/core/flags/defs.rs](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L2817-L2822)

Sources: [crates/core/flags/defs.rs](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L2474-L2539), [crates/core/flags/defs.rs](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L2817-L2822)

### Runtime Generation and Version Flag Behaviors

The `Generate` flag accepts explicit generation kinds via `GenerateMode` and updates the runtime execution mode to terminate after writing output to stdout. Sources: [crates/core/flags/defs.rs](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L2474-L2539)

| Generation Kind (`KIND`) | Target Format / Output | Associated `GenerateMode` Variant |
| ------------------------- | ---------------------- | --------------------------------- |
| `man` | Roff-format manual page | `GenerateMode::Man`. Sources: [crates/core/flags/defs.rs](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L2501-L2503), [crates/core/flags/defs.rs](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L2531) |
| `complete-bash` | Bash completion script | `GenerateMode::CompleteBash`. Sources: [crates/core/flags/defs.rs](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L2504-L2505), [crates/core/flags/defs.rs](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L2532) |
| `complete-zsh` | Zsh completion script | `GenerateMode::CompleteZsh`. Sources: [crates/core/flags/defs.rs](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L2506-L2507), [crates/core/flags/defs.rs](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L2533) |
| `complete-fish` | Fish completion script | `GenerateMode::CompleteFish`. Sources: [crates/core/flags/defs.rs](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L2508-L2509), [crates/core/flags/defs.rs](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L2534) |
| `complete-powershell` | PowerShell completion script | `GenerateMode::CompletePowerShell`. Sources: [crates/core/flags/defs.rs](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L2510-L2514), [crates/core/flags/defs.rs](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L2535) |

Sources: [crates/core/flags/defs.rs](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L2501-L2535)

> [!NOTE]
> Unlike standard flags, the help flag splits behavior between `-h` (triggering `SpecialMode::HelpShort` for condensed output) and `--help` (triggering `SpecialMode::HelpLong` for full documentation), bypassing regular trait execution via custom parser dispatch. Sources: [crates/core/flags/defs.rs](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L2806-L2823)

Sources: [crates/core/flags/defs.rs](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L2806-L2823)

## Pattern Conversion and Regex Compilation

### Overview

Parsed shell glob patterns are converted into regular expression strings and compiled into high-performance matching structures to support fast file filtering during build and release operations. The tokenized representation of a glob executes a translation pipeline, mapping individual syntax elements into valid `regex-automata` regular expression syntax with non-Unicode byte matching semantics (`(?-u)`). Sources: [crates/globset/src/glob.rs](https://github.com/BurntSushi/ripgrep/blob/main/crates/globset/src/glob.rs#L70-L81), [crates/globset/src/glob.rs](https://github.com/BurntSushi/ripgrep/blob/main/crates/globset/src/glob.rs#L673-L690)

Sources: [crates/globset/src/glob.rs](https://github.com/BurntSushi/ripgrep/blob/main/crates/globset/src/glob.rs#L70-L81), [crates/globset/src/glob.rs](https://github.com/BurntSushi/ripgrep/blob/main/crates/globset/src/glob.rs#L673-L690)

### Call-Chain Execution Walkthrough

Converting a glob pattern into an active matcher follows a strict call sequence across parser and builder structures:

1. `GlobBuilder::build()` instantiates and executes a new `Parser` over the input pattern string via `Parser::parse()`. Sources: [crates/globset/src/glob.rs](https://github.com/BurntSushi/ripgrep/blob/main/crates/globset/src/glob.rs#L579-L590)
2. Once parsing succeeds, `Tokens::to_regex_with()` translates the resulting vector of `Token` enum variants into a raw regular expression string, prepending `(?-u)` and anchoring with `^` and `$`. Sources: [crates/globset/src/glob.rs](https://github.com/BurntSushi/ripgrep/blob/main/crates/globset/src/glob.rs#L673-L690)
3. `Glob::compile_matcher()` calls `new_regex()` on the compiled regex string to construct the underlying `regex_automata::meta::Regex`. Sources: [crates/globset/src/glob.rs](https://github.com/BurntSushi/ripgrep/blob/main/crates/globset/src/glob.rs#L288-L292)
4. Finally, `GlobMatcher` wraps both the original `Glob` pattern and the compiled `Regex` instance to expose path matching methods like `GlobMatcher::is_match()` and `GlobMatcher::is_match_candidate()`. Sources: [crates/globset/src/glob.rs](https://github.com/BurntSushi/ripgrep/blob/main/crates/globset/src/glob.rs#L131-L155)

Sources: [crates/globset/src/glob.rs](https://github.com/BurntSushi/ripgrep/blob/main/crates/globset/src/glob.rs#L131-L155), [crates/globset/src/glob.rs](https://github.com/BurntSushi/ripgrep/blob/main/crates/globset/src/glob.rs#L288-L292), [crates/globset/src/glob.rs](https://github.com/BurntSushi/ripgrep/blob/main/crates/globset/src/glob.rs#L579-L590), [crates/globset/src/glob.rs](https://github.com/BurntSushi/ripgrep/blob/main/crates/globset/src/glob.rs#L673-L690)

### Token-to-Regex Mapping Reference

Each parsed `Token` variant maps to a specific regular expression fragment based on active `GlobOptions`:

| Token Variant | Regex Translation Output | Notes / Options Condition |
| ------------- | ------------------------ | ------------------------- |
| `Token::Literal(c)` | Escaped literal character string | Uses `char_to_escaped_literal`. Sources: [crates/globset/src/glob.rs](https://github.com/BurntSushi/ripgrep/blob/main/crates/globset/src/glob.rs#L700-L702) |
| `Token::Any` | `[^/]` or `.` | `[^/]` when `literal_separator` is enabled, otherwise `.`. Sources: [crates/globset/src/glob.rs](https://github.com/BurntSushi/ripgrep/blob/main/crates/globset/src/glob.rs#L703-L709) |
| `Token::ZeroOrMore` | `[^/]*` or `.*` | `[^/]*` when `literal_separator` is enabled, otherwise `.*`. Sources: [crates/globset/src/glob.rs](https://github.com/BurntSushi/ripgrep/blob/main/crates/globset/src/glob.rs#L710-L716) |
| `Token::RecursivePrefix` | `(?:/?|.*/)` | Matches root or leading path components. Sources: [crates/globset/src/glob.rs](https://github.com/BurntSushi/ripgrep/blob/main/crates/globset/src/glob.rs#L717-L719) |
| `Token::RecursiveSuffix` | `/.*` | Matches recursive trailing paths. Sources: [crates/globset/src/glob.rs](https://github.com/BurntSushi/ripgrep/blob/main/crates/globset/src/glob.rs#L720-L722) |
| `Token::RecursiveZeroOrMore` | `(?:/|/.*/)` | Matches path separators or intermediate directory traversals. Sources: [crates/globset/src/glob.rs](https://github.com/BurntSushi/ripgrep/blob/main/crates/globset/src/glob.rs#L723-L725) |
| `Token::Class { negated, ranges }` | `[...]` or `[^...]` | Includes character or range entries with proper escaping. Sources: [crates/globset/src/glob.rs](https://github.com/BurntSushi/ripgrep/blob/main/crates/globset/src/glob.rs#L726-L742) |
| `Token::Alternates(patterns)` | `(?:pat1|pat2|...)` | Joins sub-pattern regex strings with alternation pipes. Sources: [crates/globset/src/glob.rs](https://github.com/BurntSushi/ripgrep/blob/main/crates/globset/src/glob.rs#L743-L760) |

Sources: [crates/globset/src/glob.rs](https://github.com/BurntSushi/ripgrep/blob/main/crates/globset/src/glob.rs#L698-L762)

> [!WARNING]
> Globs are executed against arbitrary bytes (`&[u8]`) rather than UTF-8 strings (`&str`) to support unvalidated file paths. Callers must ensure they use regex engines like `regex-automata` or `regex::bytes::Regex` that support byte-level matching rather than standard Unicode string APIs. Sources: [crates/globset/src/glob.rs](https://github.com/BurntSushi/ripgrep/blob/main/crates/globset/src/glob.rs#L313-L325)

Sources: [crates/globset/src/glob.rs](https://github.com/BurntSushi/ripgrep/blob/main/crates/globset/src/glob.rs#L313-L325)

## Related

- [[Build Execution]]
- [[Packaging Specs]]

