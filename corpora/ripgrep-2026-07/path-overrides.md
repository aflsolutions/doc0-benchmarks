# Path Overrides

<details>
<summary>Relevant source files</summary>

The following files were used as context for generating this wiki page:

- [crates/ignore/src/gitignore.rs](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/gitignore.rs)
- [crates/ignore/src/dir.rs](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/dir.rs)
- [crates/ignore/src/walk.rs](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/walk.rs)
- [crates/ignore/src/incremental.rs](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/incremental.rs)
</details>

## Overview

Path overrides provide a mechanism for specifying explicit glob patterns that take absolute precedence over all other filtering rules during directory traversal and matching. When configured, override patterns are evaluated first, determining whether a path is immediately ignored or whitelisted before any standard ignore files or file type filters are consulted. This component solves the challenge of forcing specific inclusion or exclusion rules regardless of hierarchical ignore configurations. Key design decisions include integrating override matchers directly into core matching engines and maintaining strict precedence rules where overrides supersede standard ignore hierarchies. Adjacent components such as the directory iterator and glob parsing infrastructure interact with path overrides by delegating early evaluation checks to the override matcher during traversal. Sources: [crates/ignore/src/dir.rs#L513-L524](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/dir.rs#L513-L524), [crates/ignore/src/walk.rs#L460-L464](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/walk.rs#L460-L464)

## Glob Parsing and Whitelist Matching

### Overview

Gitignore patterns are parsed from scratch without shelling out to the external `git` tool, supporting full gitignore specifications including comments, UTF-8 BOM stripping, escape sequences, whitelisting (`!`), absolute path anchors (`/`), directory-only filters (`/`), and doublestar (`**`) expansions.

Sources: [crates/ignore/src/gitignore.rs#L1-L8](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/gitignore.rs#L1-L8)

### Glob Parsing Call-Chain Execution

When a gitignore file or string is processed, each line passes through a sequential parsing and compilation pipeline before insertion into the underlying glob set. 

Adding and compiling a gitignore line proceeds through the following call chain:
`GitignoreBuilder::add()` / `add_str()` → `GitignoreBuilder::add_line()` → `GlobBuilder::new()` → `GlobSetBuilder::add()` → `GitignoreBuilder::build()`

1. **`GitignoreBuilder::add()`**: Opens the file using `File::open()`, wraps it in a `BufReader`, and iterates over each line with `rdr.lines().enumerate()` while recording line numbers for error tagging. Sources: [crates/ignore/src/gitignore.rs#L403-L420](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/gitignore.rs#L403-L420)
2. **`GitignoreBuilder::add_line()`**: Inspects raw line contents. It strips leading UTF-8 BOM markers on the first line, ignores comments starting with `#`, and trims trailing whitespace unless escaped with `\ `. It checks for leading `!` (marking `is_whitelist = true`) and leading `/` or escaped `\!` / `\#` prefixes (marking absolute matching). Trailing slashes set `is_only_dir = true`. If a glob contains no literal slashes and is not absolute, a `**/` prefix is prepended. If it ends with `/**`, an extra `/*` is appended to match contents without the directory itself. Sources: [crates/ignore/src/gitignore.rs#L458-L525](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/gitignore.rs#L458-L525)
3. **`GlobBuilder::new()`**: Compiles the transformed glob string with `literal_separator(true)`, `backslash_escape(true)`, and `allow_unclosed_class(self.allow_unclosed_class)`. Sources: [crates/ignore/src/gitignore.rs#L526-L535](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/gitignore.rs#L526-L535)
4. **`GlobSetBuilder::add()`**: Inserts the compiled glob into the active `GlobSetBuilder`. Sources: [crates/ignore/src/gitignore.rs#L337-L339](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/gitignore.rs#L337-L339), [crates/ignore/src/gitignore.rs#L536-L536](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/gitignore.rs#L536-L536)
5. **`GitignoreBuilder::build()`**: Finalizes the `GlobSet` via `.builder.build()`, counts ignore versus whitelist globs, initializes the match thread pool, and returns a constructed `Gitignore` matcher. Sources: [crates/ignore/src/gitignore.rs#L349-L364](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/gitignore.rs#L349-L364)

Sources: [crates/ignore/src/gitignore.rs#L349-L364](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/gitignore.rs#L349-L364), [crates/ignore/src/gitignore.rs#L403-L432](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/gitignore.rs#L403-L432), [crates/ignore/src/gitignore.rs#L458-L539](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/gitignore.rs#L458-L539)

> [!NOTE]
> During line parsing, if a glob ends with a literal trailing slash (indicating directory-only matching), the trailing slash is stripped from the actual glob string so that the underlying glob engine matches path components correctly while `is_only_dir` restricts the resulting match.

Sources: [crates/ignore/src/gitignore.rs#L499-L509](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/gitignore.rs#L499-L509)

### Rule Precedence and Match Evaluation

Once a `Gitignore` matcher is built, candidate paths are evaluated against the compiled `GlobSet`. The evaluation resolves rule precedence by iterating through matched glob indices in reverse order of definition.

The matching execution flow operates as follows:
`Gitignore::matched()` → `Gitignore::strip()` → `Gitignore::matched_stripped()` → `GlobSet::matches_candidate_into()`

1. **`Gitignore::matched()`**: Checks if the matcher is empty. If not, it strips superfluous leading `./` prefixes and common root path segments via `self.strip()`. Sources: [crates/ignore/src/gitignore.rs#L202-L211](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/gitignore.rs#L202-L211)
2. **`Gitignore::matched_stripped()`**: Acquires a thread-local match vector from the matcher's `Pool`, creates a `Candidate` from the stripped path, and invokes `self.set.matches_candidate_into()`. Sources: [crates/ignore/src/gitignore.rs#L259-L270](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/gitignore.rs#L259-L270)
3. **Precedence Resolution**: The matcher iterates over the matched glob indices in **reverse order** (`matches.iter().rev()`), meaning later rules in a gitignore file override earlier rules. For each candidate glob, if `!glob.is_only_dir() || is_dir`, it returns `Match::Whitelist(glob)` if `glob.is_whitelist()` is true, or `Match::Ignore(glob)` otherwise. If no globs match, it returns `Match::None`. Sources: [crates/ignore/src/gitignore.rs#L271-L282](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/gitignore.rs#L271-L282)

Sources: [crates/ignore/src/gitignore.rs#L202-L282](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/gitignore.rs#L202-L282)

> [!WARNING]
> Because rule precedence evaluates matching glob indices in reverse order (`matches.iter().rev()`), a whitelist pattern (`!`) defined later in a gitignore file successfully overrides an earlier ignore pattern matching the same path.

Sources: [crates/ignore/src/gitignore.rs#L271-L280](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/gitignore.rs#L271-L280)

### Configuration and Parsing Options

| Builder Method | Default Value | Purpose | Sources |
| :--- | :--- | :--- | :--- |
| `case_insensitive(yes)` | `false` | Toggles whether globs are matched case-insensitively. | [crates/ignore/src/gitignore.rs#L341-L344](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/gitignore.rs#L341-L344), [crates/ignore/src/gitignore.rs#L547-L555](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/gitignore.rs#L547-L555) |
| `allow_unclosed_class(yes)` | `true` | Permits unclosed character classes (e.g., `[abc`), treating them as literal strings instead of errors to match established gitignore semantics. | [crates/ignore/src/gitignore.rs#L341-L344](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/gitignore.rs#L341-L344), [crates/ignore/src/gitignore.rs#L569-L575](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/gitignore.rs#L569-L575) |

Sources: [crates/ignore/src/gitignore.rs#L341-L344](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/gitignore.rs#L341-L344), [crates/ignore/src/gitignore.rs#L547-L575](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/gitignore.rs#L547-L575)

## Directory Traversal and Ignore Stack

### Overview

The `Ignore` data structure connects directory traversal with ignore matchers, organizing ignore rules hierarchically based on the directory structure. Every matcher logically corresponds to ignore rules from a single directory and points to the matcher for its parent directory, forming a persistent data structure specifically designed to support parallel directory iterators.

Sources: [crates/ignore/src/dir.rs#L1-L10](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/dir.rs#L1-L10)

### Parent Matcher Caching and Traversal

Parent matchers are cached across search roots using a thread-safe shared map (`compiled: Arc<RwLock<HashMap<OsString, Weak<IgnoreInner>>>>`). When `Ignore::add_parents` is invoked, it canonicalizes the base path and climbs up ancestor directories. For each ancestor, it checks the compiled cache; if a weak reference upgrades successfully, it reuses the prebuilt matcher. Otherwise, it compiles a child path matcher, marks it as an absolute parent (`is_absolute_parent = true`), and stores it in the cache.

Sources: [crates/ignore/src/dir.rs#L121-L123](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/dir.rs#L121-L123), [crates/ignore/src/dir.rs#L227-L256](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/dir.rs#L227-L256)

> [!NOTE]
> Parent matchers are cached independently of the specific path being walked, but path matching requires the original canonicalized base path (`absolute_base`) to correctly rewrite relative paths against ancestor ignore files across multi-root searches.

Sources: [crates/ignore/src/dir.rs#L96-L112](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/dir.rs#L96-L112), [crates/ignore/src/dir.rs#L1491-L1497](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/dir.rs#L1491-L1497)

### Call-Chain Execution Walkthrough

When adding parent directories to an `Ignore` matcher, the execution proceeds through specific internal methods:
`Ignore::add_parents()` → `Ignore::add_child_path()` → `Ignore::add_child_path_with_found_ignore_files()` → `create_gitignore()`

1. **`Ignore::add_parents()`**: Takes a search path, canonicalizes it to `absolute_base`, collects its parent directory chain from child to root, and iterates over them in reverse (root-to-child) order. Sources: [crates/ignore/src/dir.rs#L192-L227](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/dir.rs#L192-L227)
2. **Cache Lookup**: For each ancestor path, it locks `self.inner.compiled` and attempts to upgrade a cached `Weak<IgnoreInner>`. If an entry exists, it reuses the prebuilt inner arc. Sources: [crates/ignore/src/dir.rs#L228-L237](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/dir.rs#L228-L237)
3. **`Ignore::add_child_path()`**: If not cached, invokes child path resolution, checking for version control markers (`.git`, `.jj`) and resolving git common directories if required. Sources: [crates/ignore/src/dir.rs#L238-L246](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/dir.rs#L238-L246), [crates/ignore/src/dir.rs#L304-L306](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/dir.rs#L304-L306)
4. **`create_gitignore()`**: Builds individual `Gitignore` matchers for `.ignore`, `.gitignore`, custom ignore filenames, and `info/exclude` files relative to the identified ignore file directory. Sources: [crates/ignore/src/dir.rs#L381-L441](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/dir.rs#L381-L441), [crates/ignore/src/dir.rs#L1016-L1051](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/dir.rs#L1016-L1051)

Sources: [crates/ignore/src/dir.rs#L192-L257](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/dir.rs#L192-L257), [crates/ignore/src/dir.rs#L304-L306](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/dir.rs#L304-L306), [crates/ignore/src/dir.rs#L381-L441](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/dir.rs#L381-L441)

### Configuration Options and Ignore Options

| Field / Option | Type | Default | Purpose | Sources |
| :--- | :--- | :--- | :--- | :--- |
| `hidden` | `bool` | `true` | Whether to ignore hidden file paths or not. | [crates/ignore/src/dir.rs#L73-L74](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/dir.rs#L73-L74), [crates/ignore/src/dir.rs#L793-L793](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/dir.rs#L793-L793) |
| `ignore` | `bool` | `true` | Whether to read `.ignore` files. | [crates/ignore/src/dir.rs#L75-L76](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/dir.rs#L75-L76), [crates/ignore/src/dir.rs#L794-L794](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/dir.rs#L794-L794) |
| `parents` | `bool` | `true` | Whether to respect any ignore files in parent directories. | [crates/ignore/src/dir.rs#L77-L78](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/dir.rs#L77-L78), [crates/ignore/src/dir.rs#L795-L795](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/dir.rs#L795-L795) |
| `git_global` | `bool` | `true` | Whether to read git's global gitignore file. | [crates/ignore/src/dir.rs#L79-L80](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/dir.rs#L79-L80), [crates/ignore/src/dir.rs#L796-L796](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/dir.rs#L796-L796) |
| `git_ignore` | `bool` | `true` | Whether to read `.gitignore` files. | [crates/ignore/src/dir.rs#L81-L82](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/dir.rs#L81-L82), [crates/ignore/src/dir.rs#L797-L797](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/dir.rs#L797-L797) |
| `git_exclude` | `bool` | `true` | Whether to read `.git/info/exclude` files. | [crates/ignore/src/dir.rs#L83-L84](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/dir.rs#L83-L84), [crates/ignore/src/dir.rs#L798-L798](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/dir.rs#L798-L798) |
| `ignore_case_insensitive` | `bool` | `false` | Whether to ignore files case insensitively. | [crates/ignore/src/dir.rs#L85-L86](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/dir.rs#L85-L86), [crates/ignore/src/dir.rs#L799-L799](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/dir.rs#L799-L799) |
| `require_git` | `bool` | `true` | Whether a git repository must be present in order to apply any git-related ignore rules. | [crates/ignore/src/dir.rs#L87-L90](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/dir.rs#L87-L90), [crates/ignore/src/dir.rs#L800-L800](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/dir.rs#L800-L800) |

Sources: [crates/ignore/src/dir.rs#L71-L90](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/dir.rs#L71-L90), [crates/ignore/src/dir.rs#L792-L801](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/dir.rs#L792-L801)

## Incremental Match Evaluation

### Overview

The `IncrementalIgnore` engine evaluates individual paths against hierarchical ignore files without executing a full directory walk. Built from a `WalkBuilder`, it caches matchers for previously seen directories to avoid re-traversing ancestor chains.

Sources: [crates/ignore/src/incremental.rs#L11-L20](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/incremental.rs#L11-L20)

### Execution Walkthrough

When matching a path, the engine flows through specific internal functions to validate depth, resolve cached ignore matchers, and apply file-size checks:

1. **`IncrementalIgnore::matched_with_errors()`**: Receives the target path and directory flag, initializing a `PartialErrorBuilder` and invoking `matched_with_errors_impl()`.
   Sources: [crates/ignore/src/incremental.rs#L213-L222](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/incremental.rs#L213-L222)
2. **`IncrementalIgnore::matched_with_errors_impl()`**: Rejects absolute paths or `Stdin` roots, computes path component depth against `min_depth` and `max_depth` options, and hands off to `matched_with_errors_ignore()`.
   Sources: [crates/ignore/src/incremental.rs#L224-L270](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/incremental.rs#L224-L270)
3. **`IncrementalIgnore::matched_with_errors_ignore()`**: Checks parent directory caches (`self.dirs`) for an `Allowed(Ignore)` or `Ignored` state, loading missing ancestor ignore states on demand.
   Sources: [crates/ignore/src/incremental.rs#L310-L341](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/incremental.rs#L310-L341)
4. **`max_filesize` Validation**: If the matched path is a regular file and not ignored, queries file metadata (using `path.metadata()` or `path.symlink_metadata()` depending on `follow_links`) to verify against `max_filesize`.
   Sources: [crates/ignore/src/incremental.rs#L271-L293](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/incremental.rs#L271-L293)

> [!NOTE]
> Paths containing `..` or absolute paths bypass normal evaluation and immediately return a non-match via `IncrementalMatch::none(is_dir)`.

Sources: [crates/ignore/src/incremental.rs#L180-L185](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/incremental.rs#L180-L185), [crates/ignore/src/incremental.rs#L234-L236](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/incremental.rs#L234-L236)

### Incremental Matcher Types and Options

| Struct / Enum | Variant / Field | Type | Purpose | Sources |
| :--- | :--- | :--- | :--- | :--- |
| `IncrementalIgnore` | `root` | `PathBuf` | The root path exactly as given to `WalkBuilder`. | [crates/ignore/src/incremental.rs#L57-L60](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/incremental.rs#L57-L60) |
| `IncrementalIgnore` | `normalized_root` | `OnceLock<OptionathBuf>>` | Normalized root for opt-in absolute path conversion. | [crates/ignore/src/incremental.rs#L61-L61](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/incremental.rs#L61-L61) |
| `IncrementalIgnore` | `ignore` | `RootIgnore` | Matcher state for the configured root directory. | [crates/ignore/src/incremental.rs#L62-L63](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/incremental.rs#L62-L63) |
| `IncrementalIgnore` | `dirs` | `HashMapathBuf, CachedDir>` | Cached traversal state for subdirectories relative to root. | [crates/ignore/src/incremental.rs#L64-L65](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/incremental.rs#L64-L65) |
| `IncrementalIgnoreOptions` | `min_depth` | `Option<usize>` | Minimum depth restriction for matched paths. | [crates/ignore/src/incremental.rs#L73-L74](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/incremental.rs#L73-L74) |
| `IncrementalIgnoreOptions` | `max_depth` | `Option<usize>` | Maximum depth restriction for matched paths. | [crates/ignore/src/incremental.rs#L75-L75](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/incremental.rs#L75-L75) |
| `IncrementalIgnoreOptions` | `max_filesize` | `Option<u64>` | Maximum permitted file size in bytes. | [crates/ignore/src/incremental.rs#L76-L76](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/incremental.rs#L76-L76) |
| `IncrementalIgnoreOptions` | `hidden` | `bool` | Whether hidden file filtering is enabled. | [crates/ignore/src/incremental.rs#L77-L77](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/incremental.rs#L77-L77) |
| `IncrementalIgnoreOptions` | `follow_links` | `bool` | Whether to follow symlinks when checking file metadata. | [crates/ignore/src/incremental.rs#L78-L79](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/incremental.rs#L78-L79) |
| `RootIgnore` | `Unloaded(Ignore)` | `Ignore` | Unloaded ignore state for standard directory roots. | [crates/ignore/src/incremental.rs#L82-L83](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/incremental.rs#L82-L83) |
| `RootIgnore` | `Loaded(Ignore)` | `Ignore` | Fully loaded ignore matcher state. | [crates/ignore/src/incremental.rs#L84-L84](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/incremental.rs#L84-L84) |
| `RootIgnore` | `NotDirectory` | N/A | Root path resolves to a non-directory file. | [crates/ignore/src/incremental.rs#L85-L85](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/incremental.rs#L85-L85) |
| `RootIgnore` | `Stdin` | N/A | Special root representing standard input (`-`). | [crates/ignore/src/incremental.rs#L19-L20](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/incremental.rs#L19-L20), [crates/ignore/src/incremental.rs#L86-L86](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/incremental.rs#L86-L86) |
| `CachedDir` | `Allowed(Ignore)` | `Ignore` | Directory is traversable with loaded ignore rules. | [crates/ignore/src/incremental.rs#L97-L98](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/incremental.rs#L97-L98) |
| `CachedDir` | `Ignored` | N/A | Directory is ignored; descendants are skipped entirely. | [crates/ignore/src/incremental.rs#L99-L103](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/incremental.rs#L99-L103) |

Sources: [crates/ignore/src/incremental.rs#L56-L103](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/incremental.rs#L56-L103)

## Walk Engine Matching Integration

### Overview

The directory walk engines in `crates/ignore/src/walk.rs` integrate compiled ignore and override matchers into both single-threaded (`Walk`) and parallel (`WalkParallel`) directory iterators. Every discovered file or directory entry undergoes multi-stage filtering through `should_skip_entry`, which executes `ig.matched_dir_entry(dent)` to evaluate whether path overrides, gitignores, custom ignore files, file type selections, or hidden file rules match the entry.

Sources: [crates/ignore/src/walk.rs#L1110-L1124](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/walk.rs#L1110-L1124), [crates/ignore/src/walk.rs#L2078-L2089](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/walk.rs#L2078-L2089)

### Single-Threaded and Parallel Walk Execution

The single-threaded `Walk` iterator wraps a sequence of `WalkEventIter` instances and dynamically updates the active ignore stack via `self.ig.add_child()` upon entering directories and `self.ig.parent()` upon exit. In contrast, `WalkParallel` distributes root paths across a work-stealing queue (`Stack`) populated with LIFO deques and stealers, where individual worker threads run `Worker::run` to process work items concurrently.

Sources: [crates/ignore/src/walk.rs#L1184-L1254](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/walk.rs#L1184-L1254), [crates/ignore/src/walk.rs#L1499-L1527](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/walk.rs#L1499-L1527), [crates/ignore/src/walk.rs#L1655-L1661](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/walk.rs#L1655-L1661)

> [!NOTE]
> `WalkParallel` uses `Deque::new_lifo()` for its per-thread work queues to guarantee a depth-first traversal order. A breadth-first search across wide directory trees containing many nested gitignore files causes severe memory and performance overheads by retaining too many matchers simultaneously.

Sources: [crates/ignore/src/walk.rs#L1655-L1661](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/walk.rs#L1655-L1661), [crates/ignore/src/walk.rs#L1719-L1723](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/walk.rs#L1719-L1723)

### Call-Chain Execution Walkthrough

When `WalkParallel` encounters a directory work item in a worker thread, execution flows through the following call sequence:
1. `Worker::run()` calls `self.get_work()` to pop a `Work` message from the thread's local `Stack` (or steal from sibling queues). Sources: [crates/ignore/src/walk.rs#L1754-L1760](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/walk.rs#L1754-L1760)
2. `Worker::run_one(work)` checks if the entry satisfies `min_depth`, verifies symbolic links, and executes `work.add_parents()` if at depth 0. Sources: [crates/ignore/src/walk.rs#L1762-L1783](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/walk.rs#L1762-L1783)
3. If the path is a directory and device boundaries permit (`root_device`), `work.read_dir()` is invoked. Sources: [crates/ignore/src/walk.rs#L1784-L1812](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/walk.rs#L1784-L1812)
4. `Work::read_dir()` calls `fs::read_dir(self.dent.path())`, accumulates raw entries, and invokes `self.ignore.add_child_with_entries()` to compile and merge ignore rules for the child directory. Sources: [crates/ignore/src/walk.rs#L1609-L1637](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/walk.rs#L1609-L1637)
5. For each successfully read file system entry, `Worker::generate_work()` constructs a `DirEntryRaw`, resolves symlink loops if `follow_links` is enabled, checks `should_skip_entry()`, and pushes surviving entries back onto the work stack. Sources: [crates/ignore/src/walk.rs#L1867-L1929](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/walk.rs#L1867-L1929)

Sources: [crates/ignore/src/walk.rs#L1609-L1637](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/walk.rs#L1609-L1637), [crates/ignore/src/walk.rs#L1754-L1812](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/walk.rs#L1754-L1812), [crates/ignore/src/walk.rs#L1867-L1929](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/walk.rs#L1867-L1929)

### Walk Engine Control States and Options

| Struct / Enum | Variant / Field | Type | Purpose | Sources |
| :--- | :--- | :--- | :--- | :--- |
| `WalkState` | `Continue` | N/A | Continue walking as normal. | [crates/ignore/src/walk.rs#L1318-L1320](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/walk.rs#L1318-L1320) |
| `WalkState` | `Skip` | N/A | Skip descending into a directory entry; no effect on non-directories. | [crates/ignore/src/walk.rs#L1321-L1324](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/walk.rs#L1321-L1324) |
| `WalkState` | `Quit` | N/A | Quit the entire parallel iterator as soon as possible. | [crates/ignore/src/walk.rs#L1325-L1330](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/walk.rs#L1325-L1330) |
| `WalkBuilder` | `threads` | `usize` | Number of traversal threads (`0` selects automatically using available parallelism capped at 12). | [crates/ignore/src/walk.rs#L497-L497](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/walk.rs#L497-L497), [crates/ignore/src/walk.rs#L1530-L1536](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/walk.rs#L1530-L1536) |
| `WalkBuilder` | `max_filesize` | `Option<u64>` | Skips files exceeding the specified size limit in bytes. | [crates/ignore/src/walk.rs#L493-L493](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/walk.rs#L493-L493), [crates/ignore/src/walk.rs#L2056-L2076](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/walk.rs#L2056-L2076) |

Sources: [crates/ignore/src/walk.rs#L487-L512](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/walk.rs#L487-L512), [crates/ignore/src/walk.rs#L1317-L1330](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/walk.rs#L1317-L1330), [crates/ignore/src/walk.rs#L1530-L1536](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/walk.rs#L1530-L1536)

> [!WARNING]
> When `same_file_system` is enabled on Unix or Windows, traversal queries device or volume serial numbers via `device_num()`. If used on an unsupported platform (such as `wasm32`), directory traversal immediately returns an error and yields zero entries.

Sources: [crates/ignore/src/walk.rs#L999-L1010](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/walk.rs#L999-L1010), [crates/ignore/src/walk.rs#L1784-L1795](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/walk.rs#L1784-L1795), [crates/ignore/src/walk.rs#L2163-L2184](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/walk.rs#L2163-L2184)

### Walk Engine Design Trade-Offs

| Design Choice | Benefit | Cost | Sources |
| :--- | :--- | :--- | :--- |
| Work-stealing LIFO stack per thread | Achieves depth-first traversal, reducing peak memory usage for paths and matchers | Requires atomic synchronization and steal batching logic across worker queues | [crates/ignore/src/walk.rs#L1655-L1661](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/walk.rs#L1655-L1661), [crates/ignore/src/walk.rs#L1718-L1723](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/walk.rs#L1718-L1723) |
| Lazy directory readdir before visitor callback | Feeds valid entries to the user visitor even if listing permissions fail | Requires careful ordering of error handling vs successful entry dispatch | [crates/ignore/src/walk.rs#L1800-L1818](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/walk.rs#L1800-L1818) |
| Active ignore stack cloning per child | Isolates directory-specific ignore rule additions without global mutation overhead | Allocates new matcher instances for nested directory hierarchies | [crates/ignore/src/walk.rs#L1232-L1237](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/walk.rs#L1232-L1237), [crates/ignore/src/walk.rs#L1596-L1600](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/walk.rs#L1596-L1600) |

Sources: [crates/ignore/src/walk.rs#L1232-L1237](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/walk.rs#L1232-L1237), [crates/ignore/src/walk.rs#L1655-L1661](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/walk.rs#L1655-L1661), [crates/ignore/src/walk.rs#L1800-L1818](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/walk.rs#L1800-L1818)

## Whitelist Overrides and Ancestor Descent

### Overview

Directory traversal engines must correctly handle hidden file filtering while preserving the ability to descend into directories when specific descendant paths or files are whitelisted. In `crates/ignore/src/dir.rs`, the `matched_dir_entry` method evaluates directory entries by combining standard ignore matches, override matchers, and hidden-file criteria. When an entry is otherwise not ignored (`Match::None`), hidden file handling is triggered if `self.inner.opts.hidden` is enabled and `is_hidden_entry(dent)` returns true.

Sources: [crates/ignore/src/dir.rs#L484-L494](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/dir.rs#L484-L494)

### Call-Chain Execution Walkthrough

When evaluating a directory entry during recursive traversal, execution flows through the matching pipeline to resolve whitelists and overrides in a specific sequence:

1. `matched_dir_entry()`: Receives a reference to a `DirEntry` and calls `self.matched(dent.path(), dent.is_dir())`. Sources: [crates/ignore/src/dir.rs#L484-L489](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/dir.rs#L484-L489)
2. `matched()`: First inspects `self.inner.overrides`. If an override matches (whether ignore or whitelist), execution returns immediately because overrides carry the highest precedence. Sources: [crates/ignore/src/dir.rs#L500-L524](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/dir.rs#L500-L524)
3. `matched_ignore()`: If no override matches and ignore rules are present (`self.has_any_ignore_rules()`), this method iterates over the directory's parent hierarchy via `self.parents()`, evaluating custom ignores, `.ignore`, `.gitignore`, `.git/info/exclude`, and global ignore files. Sources: [crates/ignore/src/dir.rs#L525-L533](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/dir.rs#L525-L533), [crates/ignore/src/dir.rs#L548-L685](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/dir.rs#L548-L685)
4. `types.matched()`: Evaluates file type selections if configured. Sources: [crates/ignore/src/dir.rs#L534-L543](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/dir.rs#L534-L543)
5. Fallback & Hidden Check: If all matchers return `Match::None`, `matched_dir_entry` checks `self.inner.opts.hidden` and `is_hidden_entry(dent)`, returning `Match::Ignore(IgnoreMatch::hidden())` if the hidden filter applies. Sources: [crates/ignore/src/dir.rs#L490-L492](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/dir.rs#L490-L492)

> [!IMPORTANT]
> A whitelisted descendant inside an ignored or hidden directory requires parent directory descent to remain active. If a parent directory is skipped solely because it is hidden, a whitelisted nested file (e.g., via `!/.hidden/file.txt`) would be unreachable unless ancestor descent rules permit evaluation through the hidden root.

Sources: [crates/ignore/src/dir.rs#L484-L494](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/dir.rs#L484-L494), [crates/ignore/src/dir.rs#L515-L544](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/dir.rs#L515-L544)

### Matcher Precedence Reference Table

| Matcher Category | Precedence Level | Behavior on Whitelist (`!pat`) | Sources |
| :--- | :--- | :--- | :--- |
| Overrides | Highest (1) | Overrides ignore status immediately | [crates/ignore/src/dir.rs#L515-L524](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/dir.rs#L515-L524) |
| Custom Ignores | High (2) | Evaluated first among ignore files; later custom files override earlier ones | [crates/ignore/src/dir.rs#L564-L571](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/dir.rs#L564-L571), [crates/ignore/src/dir.rs#L1269-L1285](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/dir.rs#L1269-L1285) |
| `.ignore` Files | Medium-High (3) | Overrides `.gitignore` and global/exclude rules | [crates/ignore/src/dir.rs#L572-L578](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/dir.rs#L572-L578), [crates/ignore/src/dir.rs#L1287-L1297](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/dir.rs#L1287-L1297) |
| `.gitignore` & Exclude | Medium-Low (4) | Standard gitignore glob matching with whitelist support (`!`) | [crates/ignore/src/dir.rs#L579-L592](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/dir.rs#L579-L592) |
| Hidden Filter | Lowest (5) | Filters hidden entries unless explicitly overridden | [crates/ignore/src/dir.rs#L490-L492](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/dir.rs#L490-L492) |

Sources: [crates/ignore/src/dir.rs#L490-L492](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/dir.rs#L490-L492), [crates/ignore/src/dir.rs#L515-L592](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/dir.rs#L515-L592), [crates/ignore/src/dir.rs#L1269-L1297](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/dir.rs#L1269-L1297)

## Related

- [[Gitignore Matching]]
- [[Glob Matching]]

