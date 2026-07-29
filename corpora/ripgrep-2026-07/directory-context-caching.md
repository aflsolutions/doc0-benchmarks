# Directory Context Caching

<details>
<summary>Relevant source files</summary>

The following files were used as context for generating this wiki page:

- [crates/ignore/src/walk.rs](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/walk.rs)
- [crates/ignore/src/dir.rs](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/dir.rs)
- [crates/ignore/src/gitignore.rs](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/gitignore.rs)
- [crates/ignore/src/incremental.rs](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/incremental.rs)
</details>

## Overview

Directory Context Caching manages compiled ignore rules and directory hierarchy states during file system traversal, enabling efficient rule evaluation and reuse across recursive walks. By caching parent matchers lazily per directory, the subsystem avoids redundant filesystem inspections and glob rebuilding when evaluating paths. It coordinates single-threaded and parallel traversals while respecting gitignore precedence, hidden-file filtering, depth limits, and custom ignore configurations across directory boundaries. Sources: [crates/ignore/src/walk.rs:439-491](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/walk.rs#L439-L491), [crates/ignore/src/dir.rs:1-10](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/dir.rs#L1-L10), [crates/ignore/src/incremental.rs:11-41](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/incremental.rs#L11-L41)

## Directory Traversal and Stack State

### Overview

Directory Traversal and Stack State manages directory stack context and execution flow during both single-threaded and parallel file system walks. It drives traversal via `Walk` and `WalkParallel`, coordinating depth limits, ignore context updates, file size restrictions, and symbolic link loop detection. Single-threaded iteration transforms `WalkDir` outputs using `WalkEventIter` into structured `WalkEvent` items (`Dir`, `File`, and `Exit`), maintaining the active `Ignore` context stack as directories are entered and exited. Parallel iteration distributes work items across thread-local LIFO work-stealing deques managed by `Stack`, using atomic counters to track active workers and detect termination. Sources: [crates/ignore/src/walk.rs:1116-1255](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/walk.rs#L1116-L1255), [crates/ignore/src/walk.rs:1396-1528](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/walk.rs#L1396-L1528), [crates/ignore/src/walk.rs:1640-1708](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/walk.rs#L1640-L1708)

### Traversal Control Flow and Execution Walkthrough

For parallel walks, the lifecycle of a work item traces a precise path through worker methods. When a worker requests work, `Worker::get_work()` invokes `Worker::recv()` (which calls `Stack::pop()` and falls back to work-stealing via `Stack::steal()`) → `Worker::run_one(work)` checks depth bounds and file types → `Work::add_parents()` or `Work::read_dir()` loads directory contents and update the ignore matcher → `Worker::visitor.visit(Ok(work.dent))` executes the caller's callback → `Worker::generate_work()` processes child entries, applying symlink, ignore, size, and filter checks before pushing new `Work` items back to the stack. Sources: [crates/ignore/src/walk.rs:1689-1707](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/walk.rs#L1689-L1707), [crates/ignore/src/walk.rs:1754-1852](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/walk.rs#L1754-L1852), [crates/ignore/src/walk.rs:1935-1985](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/walk.rs#L1935-L1985)

> [!NOTE]
> `Stack::new_for_each_thread` utilizes `Deque::new_lifo()` rather than FIFO or breadth-first queues. Traversing in depth-first order is critical when searching wide directory trees with numerous nested gitignore files, preventing disastrous memory inflation from retaining unexpanded directory contexts. Sources: [crates/ignore/src/walk.rs:1655-1661](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/walk.rs#L1655-L1661)

### Walk State and Message Structures

The traversal subsystem defines specific enums and control structures governing worker behavior, event generation, and traversal instructions.

| Type | Variant / Field | Type / Value | Meaning |
| :--- | :--- | :--- | :--- |
| `WalkState` | `Continue` | Unit | Continue walking as normal. Sources: [crates/ignore/src/walk.rs:1318-1320](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/walk.rs#L1318-L1320) |
| `WalkState` | `Skip` | Unit | Do not descend into the given directory entry; has no effect on files. Sources: [crates/ignore/src/walk.rs:1321-1323](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/walk.rs#L1321-L1323) |
| `WalkState` | `Quit` | Unit | Quit the entire iterator as soon as possible. Sources: [crates/ignore/src/walk.rs:1324-1329](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/walk.rs#L1324-L1329) |
| `Message` | `Work(Work)` | `Work` | A work item corresponding to a directory that should be descended into. Sources: [crates/ignore/src/walk.rs:1539-1544](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/walk.rs#L1539-L1544) |
| `Message` | `Quit` | Unit | Instruction indicating that the worker should quit. Sources: [crates/ignore/src/walk.rs:1545-1547](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/walk.rs#L1545-L1547) |
| `WalkEvent` | `Dir(walkdir::DirEntry)` | `DirEntry` | Emitted when a directory entry is encountered during single-threaded iteration. Sources: [crates/ignore/src/walk.rs:1269-1272](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/walk.rs#L1269-L1272) |
| `WalkEvent` | `File(walkdir::DirEntry)` | `DirEntry` | Emitted when a file entry is encountered during single-threaded iteration. Sources: [crates/ignore/src/walk.rs:1269-1272](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/walk.rs#L1269-L1272) |
| `WalkEvent` | `Exit` | Unit | Emitted when the entire contents of a directory have been enumerated. Sources: [crates/ignore/src/walk.rs:1269-1274](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/walk.rs#L1269-L1274) |

Sources: [crates/ignore/src/walk.rs:1269-1329](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/walk.rs#L1269-L1329), [crates/ignore/src/walk.rs:1539-1547](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/walk.rs#L1539-L1547)

### Design Trade-Offs in Traversal Architecture

| Design Choice | Benefit | Cost |
| :--- | :--- | :--- |
| LIFO work-stealing stack (`crossbeam_deque`) | Substantially reduces peak memory usage by keeping file paths and ignore matchers active in shallow subtrees. Sources: [crates/ignore/src/walk.rs:1655-1661](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/walk.rs#L1655-L1661), [crates/ignore/src/walk.rs:1719-1723](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/walk.rs#L1719-L1723) | Can result in uneven work distribution before work-stealing batches are triggered across threads. Sources: [crates/ignore/src/walk.rs:1695-1707](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/walk.rs#L1695-L1707) |
| Trivial filtering before `stat` calls | Avoids expensive filesystem overheads on specialized or remote filesystems (such as Windows on-demand download layers). Sources: [crates/ignore/src/walk.rs:1151-1160](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/walk.rs#L1151-L1160) | Requires duplicate check logic across both single-threaded (`Walk::skip_entry`) and parallel (`Worker::generate_work`) paths. Sources: [crates/ignore/src/walk.rs:1147-1181](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/walk.rs#L1147-L1181), [crates/ignore/src/walk.rs:1867-1929](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/walk.rs#L1867-L1929) |
| Active worker atomic decrement counting | Enables robust termination detection when all local deques are simultaneously empty and worker threads sleep. Sources: [crates/ignore/src/walk.rs:1955-1964](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/walk.rs#L1955-L1964) | Requires active synchronization loops and timed thread sleeping (`1ms`) near termination. Sources: [crates/ignore/src/walk.rs:1975-1982](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/walk.rs#L1975-L1982) |

Sources: [crates/ignore/src/walk.rs:1147-1181](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/walk.rs#L1147-L1181), [crates/ignore/src/walk.rs:1655-1661](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/walk.rs#L1655-L1661), [crates/ignore/src/walk.rs:1719-1723](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/walk.rs#L1719-L1723), [crates/ignore/src/walk.rs:1955-1982](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/walk.rs#L1955-L1982)

### Parallel Traversal Worked Example

The following example demonstrates setting up and executing a parallel recursive directory walk using `WalkBuilder` and `WalkParallel`, exercising custom visitor building and entry handling with `WalkState` control flow. Sources: [crates/ignore/src/walk.rs:695-714](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/walk.rs#L695-L714), [crates/ignore/src/walk.rs:1421-1426](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/walk.rs#L1421-L1426), [crates/ignore/src/walk.rs:2254-2264](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/walk.rs#L2254-L2264)

```rust
use ignore::{WalkBuilder, WalkState};

let builder = WalkBuilder::new("./src");
builder.build_parallel().run(|| {
    Box::new(|result| {
        match result {
            Ok(entry) => {
                println!("Visited path: {:?}", entry.path());
                if entry.file_name() == "target" {
                    WalkState::Skip
                } else {
                    WalkState::Continue
                }
            }
            Err(err) => {
                eprintln!("Traversal error: {err}");
                WalkState::Continue
            }
        }
    })
});
```

Sources: [crates/ignore/src/walk.rs:695-714](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/walk.rs#L695-L714), [crates/ignore/src/walk.rs:1421-1426](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/walk.rs#L1421-L1426), [crates/ignore/src/walk.rs:2254-2264](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/walk.rs#L2254-L2264)

> [!WARNING]
> Instructing traversal to `Quit` via `WalkState::Quit` is an asynchronous action. Additional entries may still be yielded by worker threads even after returning `WalkState::Quit` from a visitor callback. Sources: [crates/ignore/src/walk.rs:1324-1329](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/walk.rs#L1324-L1329)

## Hierarchical Directory Ignore Contexts

### Overview

The `Ignore` data structure models a persistent directory hierarchy tree designed to connect directory traversal with ignore matchers. Each matcher logically corresponds to ignore rules from a single directory and points to the matcher for its parent directory, making it safe and efficient for parallel directory iterators. Sources: [crates/ignore/src/dir.rs:1-14](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/dir.rs#L1-L14), [crates/ignore/src/dir.rs:93-112](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/dir.rs#L93-L112)

### Core Structures and Options

The matcher behavior is governed by `IgnoreOptions` configuration fields and structured internally via `IgnoreInner` and `IgnoreMatchInner`. Sources: [crates/ignore/src/dir.rs:40-49](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/dir.rs#L40-L49), [crates/ignore/src/dir.rs:69-90](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/dir.rs#L69-L90), [crates/ignore/src/dir.rs:114-166](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/dir.rs#L114-L166)

| Option Field | Type | Default | Purpose |
| --- | --- | --- | --- |
| `hidden` | `bool` | `true` | Whether to ignore hidden file paths or not. Sources: [crates/ignore/src/dir.rs:73-74](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/dir.rs#L73-L74), [crates/ignore/src/dir.rs:793-793](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/dir.rs#L793-L793) |
| `ignore` | `bool` | `true` | Whether to read `.ignore` files. Sources: [crates/ignore/src/dir.rs:75-76](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/dir.rs#L75-L76), [crates/ignore/src/dir.rs:794-794](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/dir.rs#L794-L794) |
| `parents` | `bool` | `true` | Whether to respect any ignore files in parent directories. Sources: [crates/ignore/src/dir.rs:77-78](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/dir.rs#L77-L78), [crates/ignore/src/dir.rs:795-795](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/dir.rs#L795-L795) |
| `git_global` | `bool` | `true` | Whether to read git's global gitignore file. Sources: [crates/ignore/src/dir.rs:79-80](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/dir.rs#L79-L80), [crates/ignore/src/dir.rs:796-796](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/dir.rs#L796-L796) |
| `git_ignore` | `bool` | `true` | Whether to read `.gitignore` files. Sources: [crates/ignore/src/dir.rs:81-82](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/dir.rs#L81-L82), [crates/ignore/src/dir.rs:797-797](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/dir.rs#L797-L797) |
| `git_exclude` | `bool` | `true` | Whether to read `.git/info/exclude` files. Sources: [crates/ignore/src/dir.rs:83-84](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/dir.rs#L83-L84), [crates/ignore/src/dir.rs:798-798](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/dir.rs#L798-L798) |
| `ignore_case_insensitive` | `bool` | `false` | Whether to ignore files case insensitively. Sources: [crates/ignore/src/dir.rs:85-86](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/dir.rs#L85-L86), [crates/ignore/src/dir.rs:799-800](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/dir.rs#L799-L800) |
| `require_git` | `bool` | `true` | Whether a git repository must be present in order to apply git-related ignore rules. Sources: [crates/ignore/src/dir.rs:87-90](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/dir.rs#L87-L90), [crates/ignore/src/dir.rs:801-802](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/dir.rs#L801-L802) |

Sources: [crates/ignore/src/dir.rs:69-90](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/dir.rs#L69-L90), [crates/ignore/src/dir.rs:791-803](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/dir.rs#L791-L803)

### Rule Evaluation and Call Chain

When evaluating a path, `Ignore::matched` executes a strict precedence hierarchy. Overrides take precedence first, followed by recursive ignore files across parent directories, and finally file type filters. Sources: [crates/ignore/src/dir.rs:500-544](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/dir.rs#L500-L544)

The matching call chain flows through the following execution steps:
`Ignore::matched()` → checks `Override::matched()` → `Ignore::matched_ignore()` traversing `Ignore::parents()` → `Gitignore::matched()` per layer → `Types::matched()`. Sources: [crates/ignore/src/dir.rs:500-544](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/dir.rs#L500-L544), [crates/ignore/src/dir.rs:548-685](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/dir.rs#L548-L685)

> [!WARNING]
> If a parent directory matcher has `is_absolute_parent` set, matching paths require absolute base path rewriting using `absolute_base` joined with relative components to avoid incorrect path matching behavior across multi-root searches. Sources: [crates/ignore/src/dir.rs:95-112](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/dir.rs#L95-L112), [crates/ignore/src/dir.rs:595-662](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/dir.rs#L595-L662)

### Design Trade-offs

| Design Choice | Benefit | Cost |
| --- | --- | --- |
| Persistent `Arc`-backed hierarchy (`IgnoreInner`) | Enables sharing parent matchers safely across parallel thread pools and search roots without lock contention. Sources: [crates/ignore/src/dir.rs:8-10](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/dir.rs#L8-L10), [crates/ignore/src/dir.rs:93-112](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/dir.rs#L93-L112) | Requires careful path rewriting relative to `absolute_base` when multiple disparate roots share cached parent matchers. Sources: [crates/ignore/src/dir.rs:95-112](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/dir.rs#L95-L112), [crates/ignore/src/dir.rs:595-662](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/dir.rs#L595-L662) |
| Pre-collecting directory entries via `IgnoreFilesFound` | Reduces filesystem probing overhead by scanning cached directory listings instead of individual `stat` calls per ignore filename. Sources: [crates/ignore/src/dir.rs:284-338](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/dir.rs#L284-L338), [crates/ignore/src/dir.rs:699-713](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/dir.rs#L699-L713) | Introduces additional bookkeeping structs and separate code paths for entry-driven versus raw path directory child additions. Sources: [crates/ignore/src/dir.rs:268-301](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/dir.rs#L268-L301), [crates/ignore/src/dir.rs:340-467](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/dir.rs#L340-L467) |
| RwLock-protected compiled matcher cache | Avoids rebuilding glob sets for ancestor directories when many paths are searched concurrently. Sources: [crates/ignore/src/dir.rs:115-122](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/dir.rs#L115-L122), [crates/ignore/src/dir.rs:227-256](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/dir.rs#L227-L256) | Introduces shared synchronization overhead when populating uncompiled parent matchers into the global map. Sources: [crates/ignore/src/dir.rs:122-122](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/dir.rs#L122-L122), [crates/ignore/src/dir.rs:227-256](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/dir.rs#L227-L256) |

Sources: [crates/ignore/src/dir.rs:8-10](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/dir.rs#L8-L10), [crates/ignore/src/dir.rs:93-122](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/dir.rs#L93-L122), [crates/ignore/src/dir.rs:227-338](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/dir.rs#L227-L338), [crates/ignore/src/dir.rs:595-662](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/dir.rs#L595-L662)

## Gitignore Pattern Matching Rules

### Overview

The gitignore pattern matching module constructs glob matchers and evaluates gitignore rules from scratch, conforming to the `gitignore` man page specification without invoking the `git` command-line tool. Sources: [crates/ignore/src/gitignore.rs:1-8](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/gitignore.rs#L1-L8)

### Glob Parsing and Call-Chain Execution

When building a gitignore matcher from a file or string, each line undergoes structured parsing to extract semantics before compiling into a `GlobSet`. Sources: [crates/ignore/src/gitignore.rs:403-432](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/gitignore.rs#L403-L432), [crates/ignore/src/gitignore.rs:458-539](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/gitignore.rs#L458-L539)

The glob line-addition call chain flows through the following execution steps:
`GitignoreBuilder::add()` or `add_str()` → `GitignoreBuilder::add_line()` → checks escape sequences and leading `!` / `/` modifiers → strips trailing slashes for directory-only matches → applies `**/` prefix rules for non-absolute paths → appends `/*` when ending with `/**` → `GlobBuilder::build()` → `GlobSetBuilder::add()`. Sources: [crates/ignore/src/gitignore.rs:403-432](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/gitignore.rs#L403-L432), [crates/ignore/src/gitignore.rs:446-449](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/gitignore.rs#L446-L449), [crates/ignore/src/gitignore.rs:458-539](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/gitignore.rs#L458-L539)

> [!NOTE]
> If a line starts with an escaped exclamation mark (`\!`) or hash (`\#`), the leading backslash is stripped and the pattern is treated as a literal filename rather than a whitelist or comment, modifying whether absolute path matching flags are set. Sources: [crates/ignore/src/gitignore.rs:482-485](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/gitignore.rs#L482-L485)

### Global Configuration and Excludes Discovery

Global ignore files are discovered by querying environment variables and git configuration files in a defined priority order. Sources: [crates/ignore/src/gitignore.rs:578-600](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/gitignore.rs#L578-L600)

| Priority | Source / Environment Variable | Default Path / Mechanism | Purpose |
| --- | --- | --- | --- |
| 1 (Highest) | `GIT_CONFIG_GLOBAL` | Custom path specified by environment variable | Replaces both user home config and XDG config when set. Sources: [crates/ignore/src/gitignore.rs:582-583](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/gitignore.rs#L582-L583), [crates/ignore/src/gitignore.rs:604-608](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/gitignore.rs#L604-L608) |
| 2 | Home directory `.gitconfig` | `$HOME/.gitconfig` | Parses `core.excludesFile` setting from the user home configuration. Sources: [crates/ignore/src/gitignore.rs:584-585](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/gitignore.rs#L584-L585), [crates/ignore/src/gitignore.rs:629-634](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/gitignore.rs#L629-L634) |
| 3 | XDG configuration directory | `$XDG_CONFIG_HOME/git/config` or `$HOME/.config/git/config` | Parses `core.excludesFile` from the XDG configuration file. Sources: [crates/ignore/src/gitignore.rs:588-590](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/gitignore.rs#L588-L590), [crates/ignore/src/gitignore.rs:638-647](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/gitignore.rs#L638-L647) |
| 4 | `GIT_CONFIG_SYSTEM` | `/etc/gitconfig` (or `GIT_CONFIG_SYSTEM` override) | Reads system-level git configuration. Sources: [crates/ignore/src/gitignore.rs:594-598](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/gitignore.rs#L594-L598), [crates/ignore/src/gitignore.rs:617-625](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/gitignore.rs#L617-L625) |
| 5 (Lowest) | Default exclude path | `$XDG_CONFIG_HOME/git/ignore` or `$HOME/.config/git/ignore` | Falls back to the default global gitignore file location. Sources: [crates/ignore/src/gitignore.rs:599-599](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/gitignore.rs#L599-L599), [crates/ignore/src/gitignore.rs:652-658](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/gitignore.rs#L652-L658) |

Sources: [crates/ignore/src/gitignore.rs:578-600](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/gitignore.rs#L578-L600), [crates/ignore/src/gitignore.rs:604-658](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/gitignore.rs#L604-L658)

### Glob Pattern Translation Rules

| Pattern Construction Rule | Condition | Transformation Applied | Rationale |
| --- | --- | --- | --- |
| Literal slash absence | `!is_absolute && !line.chars().any(|c| c == '/')` | Prepends `**/` to the glob pattern (if not already present). Sources: [crates/ignore/src/gitignore.rs:514-519](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/gitignore.rs#L514-L519) | Allows relative patterns without slashes to match files at any directory depth. Sources: [crates/ignore/src/gitignore.rs:511-513](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/gitignore.rs#L511-L513) |
| Trajectory directory recursion | `glob.actual.ends_with("/**")` | Appends `/*` resulting in `/**/*`. Sources: [crates/ignore/src/gitignore.rs:523-525](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/gitignore.rs#L523-L525) | Ensures patterns ending in `/**` match everything inside the directory without matching the directory itself. Sources: [crates/ignore/src/gitignore.rs:520-523](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/gitignore.rs#L520-L523) |
| Directory-only restriction | `line.as_bytes().last() == Some(&b'/')` | Sets `is_only_dir = true` and strips the trailing slash. Sources: [crates/ignore/src/gitignore.rs:501-509](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/gitignore.rs#L501-L509) | Restricts the rule to match directories only rather than regular files with the same name. Sources: [crates/ignore/src/gitignore.rs:499-501](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/gitignore.rs#L499-L501) |
| UTF-8 Byte Order Mark (BOM) | `i == 0` on first file line | Trims leading `\u{feff}` characters. Sources: [crates/ignore/src/gitignore.rs:422-425](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/gitignore.rs#L422-L425) | Matches Git's handling of `.gitignore` files starting with a Unicode BOM. Sources: [crates/ignore/src/gitignore.rs:422-422](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/gitignore.rs#L422-L422) |

Sources: [crates/ignore/src/gitignore.rs:422-425](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/gitignore.rs#L422-L425), [crates/ignore/src/gitignore.rs:499-525](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/gitignore.rs#L499-L525)

## Incremental Matching and State Caching

### Overview

The `IncrementalIgnore` struct caches compiled parent matchers to evaluate individual filesystem paths against hierarchical ignore files without requiring a full recursive directory traversal. Built from a `WalkBuilder`, it retains directory matchers on first use and handles path-based filters in traversal precedence order, including glob overrides, `.ignore`, `.gitignore`, `.git/info/exclude`, global and explicitly added ignore files, custom filenames, and file type selections. It also applies hidden-file detection, depth limits, and maximum file size thresholds.

Sources: [crates/ignore/src/incremental.rs:11-33](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/incremental.rs#L11-L33), [crates/ignore/src/incremental.rs:56-68](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/incremental.rs#L56-L68)

### Core Structs and Enums

| Name | Kind | Purpose | Sources |
| --- | --- | --- | --- |
| `IncrementalIgnore` | Struct | Main cache container holding the root path, normalized root cache, root ignore state, cached directory hash map, and filtering options. | [crates/ignore/src/incremental.rs:56-68](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/incremental.rs#L56-L68) |
| `IncrementalIgnoreOptions` | Struct | Duplicates filtering configurations from `WalkParallel` including depth limits, maximum file size, hidden file visibility, and symlink following. | [crates/ignore/src/incremental.rs:72-79](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/incremental.rs#L72-L79) |
| `RootIgnore` | Enum | Represents the state of the configured root directory: `Unloaded(Ignore)`, `Loaded(Ignore)`, `NotDirectory`, or `Stdin`. | [crates/ignore/src/incremental.rs:81-87](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/incremental.rs#L81-L87) |
| `CachedDir` | Enum | Cached traversal state for a directory relative to the root: `Allowed(Ignore)` allowing descent and providing child matchers, or `Ignored` stopping descendant checks. | [crates/ignore/src/incremental.rs:89-103](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/incremental.rs#L89-L103) |

Sources: [crates/ignore/src/incremental.rs:56-103](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/incremental.rs#L56-L103)

### Call-Chain Execution Walkthrough

When checking whether a path matches ignore rules, callers invoke `matched()`, which delegates error handling to `matched_with_errors()`, which in turn executes the internal implementation:

1. **`IncrementalIgnore::matched()`**: Public entry point that accepts `path` and `is_dir`, logs any loading errors via `log::debug!`, and returns the resulting `IncrementalMatch`.
   Sources: [crates/ignore/src/incremental.rs:194-204](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/incremental.rs#L194-L204)

2. **`IncrementalIgnore::matched_with_errors()`**: Wraps execution in a `PartialErrorBuilder` default instance and invokes `matched_with_errors_impl()`.
   Sources: [crates/ignore/src/incremental.rs:213-222](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/incremental.rs#L213-L222)

3. **`IncrementalIgnore::matched_with_errors_impl()`**: Short-circuits on absolute paths or `RootIgnore::Stdin`, computes depth component counts, enforces `min_depth` and `max_depth` filters, and then invokes `matched_with_errors_ignore()`.
   Sources: [crates/ignore/src/incremental.rs:224-270](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/incremental.rs#L224-L270)

4. **`IncrementalIgnore::matched_with_errors_ignore()`**: Inspects parent directory components, checks the `self.dirs` hash map for a cached `CachedDir::Allowed(ignore)` or `CachedDir::Ignored` entry, and falls back to component-by-component traversal if the parent is not cached.
   Sources: [crates/ignore/src/incremental.rs:310-341](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/incremental.rs#L310-L341)

> [!NOTE]
> The empty path represents the explicitly configured root and always returns a non-match, which is consistent with recursive traversal where a root is always treated as being at depth zero.
> Sources: [crates/ignore/src/incremental.rs:190-193](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/incremental.rs#L190-L193)

### Design Trade-Offs

| Design Choice | Benefit | Cost | Sources |
| --- | --- | --- | --- |
| Directory-granularity snapshot caching (`CachedDir`) | Avoids re-walking ancestor chains and recompiling ignore matchers on every checked path. | Edges made to ignore files after a directory's initial load are not observed; requires building a new matcher to reload. | [crates/ignore/src/incremental.rs:30-32](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/incremental.rs#L30-L32), [crates/ignore/src/incremental.rs:325-330](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/incremental.rs#L325-L330) |
| Fast path parent lookup via `self.dirs.get(parent)` | Bypasses component-by-component directory traversal when the exact parent directory is already cached. | Requires maintaining a `HashMapathBuf, CachedDir>` index per matcher instance, consuming memory proportional to visited parent directories. | [crates/ignore/src/incremental.rs:64-65](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/incremental.rs#L64-L65), [crates/ignore/src/incremental.rs:325-341](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/incremental.rs#L325-L341) |
| Special casing `-` root for Stdin | Allows `WalkBuilder::build_matchers` to return a valid matcher instance even when configured for standard input. | Forces explicit checks (`matches!(self.ignore, RootIgnore::Stdin)`) across normalization and matching routines to yield inert non-matches. | [crates/ignore/src/incremental.rs:19-21](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/incremental.rs#L19-L21), [crates/ignore/src/incremental.rs:119-123](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/incremental.rs#L119-L123), [crates/ignore/src/incremental.rs:156-158](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/incremental.rs#L156-L158) |

Sources: [crates/ignore/src/incremental.rs:19-32](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/incremental.rs#L19-L32), [crates/ignore/src/incremental.rs:64-65](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/incremental.rs#L64-L65), [crates/ignore/src/incremental.rs:119-123](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/incremental.rs#L119-L123), [crates/ignore/src/incremental.rs:156-158](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/incremental.rs#L156-L158), [crates/ignore/src/incremental.rs:325-341](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/incremental.rs#L325-L341)

### Example Usage

```rust
use ignore::WalkBuilder;

let mut builder = WalkBuilder::new(".");
builder.add_custom_ignore_filename(".rgignore");
let mut matchers = builder.build_matchers();
let matcher = &mut matchers[0];

if matcher.matched("src/generated.rs", false).is_ignore() {
    println!("ignored");
}
```

Sources: [crates/ignore/src/incremental.rs:44-55](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/incremental.rs#L44-L55)

## Cross-Directory Context Reuse

### Overview

Coordinates walk traversal with incremental ignore states to reuse parent matchers across subdirectories. The ignore system implements a persistent data structure where every matcher logically corresponds to ignore rules from a single directory and points to the matcher for its parent directory via an `Arc<IgnoreInner>`. This design enables thread-safe sharing and persistent reuse of compiled ignore state across separate subdirectories or independent traversal roots.
Sources: [crates/ignore/src/dir.rs:1-10](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/dir.rs#L1-L10), [crates/ignore/src/dir.rs:92-96](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/dir.rs#L92-L96)

### Parent Matcher Caching and Inter-Root Reuse

When adding parent directories via `Ignore::add_parents`, the implementation checks a thread-safe shared cache (`compiled: Arc<RwLock<HashMap<OsString, Weak<IgnoreInner>>>>`) before compiling glob sets for ancestor directories. If a parent directory matcher has already been compiled by another branch or root, its weak reference is upgraded, avoiding redundant file system I/O and glob recompilation.
Sources: [crates/ignore/src/dir.rs:116-122](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/dir.rs#L116-L122), [crates/ignore/src/dir.rs:228-237](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/dir.rs#L228-L237)

```rust
let mut compiled = self.inner.compiled.write().unwrap();
if let Some(weak) = compiled.get(parent.as_os_str()) {
    if let Some(prebuilt) = weak.upgrade() {
        ig = Ignore {
            inner: prebuilt,
            absolute_base: Some(absolute_base.clone()),
        };
        continue;
    }
}
```
Sources: [crates/ignore/src/dir.rs:228-237](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/dir.rs#L228-L237)

> [!WARNING]
> While parent matchers are safely shared across different search roots via `Arc`, each root must preserve its own `absolute_base` path. Failing to keep root-specific base paths causes absolute ignore patterns (such as `/llvm/` or `src/invalid`) to be matched against the wrong absolute file system path when multiple roots are searched within the same process.
> Sources: [crates/ignore/src/dir.rs:96-111](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/dir.rs#L96-L111), [crates/ignore/src/dir.rs:1432-1462](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/dir.rs#L1432-L1462)

Sources: [crates/ignore/src/dir.rs:96-111](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/dir.rs#L96-L111), [crates/ignore/src/dir.rs:1432-1462](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/dir.rs#L1432-L1462)

## Related

- [[File System Walkers]]

