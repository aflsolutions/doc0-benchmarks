# Search Workflow

<details>
<summary>Relevant source files</summary>

The following files were used as context for generating this wiki page:

- [crates/searcher/src/searcher/glue.rs](https://github.com/BurntSushi/ripgrep/blob/main/crates/searcher/src/searcher/glue.rs)
- [crates/ignore/src/walk.rs](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/walk.rs)
- [crates/printer/src/standard.rs](https://github.com/BurntSushi/ripgrep/blob/main/crates/printer/src/standard.rs)
</details>

## Overview

The search workflow is the core processing pipeline responsible for discovering, filtering, and examining files to locate matching patterns across a file system. At its foundation, it coordinates parallel directory traversal to efficiently explore folder hierarchies, applying multi-threaded work stealing and ignore-rule evaluation to prune excluded paths [[crates/ignore/src/walk.rs:1445-1527](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/walk.rs#L1445-L1527), [crates/ignore/src/walk.rs:1986-2021](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/walk.rs#L1986-L2021)]. Once individual files or streams are targeted, the stream search engine processes contents line-by-line while managing buffers and binary data detection [[crates/searcher/src/searcher/glue.rs:38-94](https://github.com/BurntSushi/ripgrep/blob/main/crates/searcher/src/searcher/glue.rs#L38-L94)]. Search hits and contextual lines are subsequently dispatched through sink interfaces, allowing formatters to apply styling, line-number tracking, and standard output rendering [[crates/printer/src/standard.rs:763-868](https://github.com/BurntSushi/ripgrep/blob/main/crates/printer/src/standard.rs#L763-L868)]. Sources: [crates/searcher/src/searcher/glue.rs:38-94](https://github.com/BurntSushi/ripgrep/blob/main/crates/searcher/src/searcher/glue.rs#L38-L94), [crates/ignore/src/walk.rs:1445-1527](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/walk.rs#L1445-L1527), [crates/ignore/src/walk.rs:1986-2021](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/walk.rs#L1986-L2021), [crates/printer/src/standard.rs:763-868](https://github.com/BurntSushi/ripgrep/blob/main/crates/printer/src/standard.rs#L763-L868)

## Parallel Directory Traversal Architecture

### Overview

The parallel directory traversal architecture coordinates multi-threaded directory exploration through the `WalkParallel` and worker structures [[crates/ignore/src/walk.rs:1404-1415](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/walk.rs#L1404-L1415), [crates/ignore/src/walk.rs:1714-1747](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/walk.rs#L1714-L1747)]. By employing crossbeam-deque work-stealing stacks configured for LIFO (Last-In, First-Out) operations, worker threads process directory trees in a depth-first manner to minimize peak memory consumption [[crates/ignore/src/walk.rs:1656-1661](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/walk.rs#L1656-L1661), [crates/ignore/src/walk.rs:1719-1723](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/walk.rs#L1719-L1723)].

Sources: [crates/ignore/src/walk.rs:1404-1415](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/walk.rs#L1404-L1415), [crates/ignore/src/walk.rs:1656-1661](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/walk.rs#L1656-L1661), [crates/ignore/src/walk.rs:1714-1747](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/walk.rs#L1714-L1747), [crates/ignore/src/walk.rs:1719-1723](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/walk.rs#L1719-L1723)

### Thread Coordination and Work Stealing

Each worker maintains a thread-local work deque and holds a shared reference to all peer stealers, enabling dynamic load balancing across active threads [[crates/ignore/src/walk.rs:1642-1649](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/walk.rs#L1642-L1649), [crates/ignore/src/walk.rs:1695-1707](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/walk.rs#L1695-L1707)]. When a thread's local queue is exhausted, work stealing iterates through peer stealers starting from `index + 1` with wrap-around fairness, executing `steal_batch_and_pop` to acquire batches of work [[crates/ignore/src/walk.rs:1696-1707](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/walk.rs#L1696-L1707)]. Active worker tracking relies on an atomic counter (`active_workers`), which decrements when a worker deactivates upon encountering an empty queue and increments when new work arrives [[crates/ignore/src/walk.rs:1498-1510](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/walk.rs#L1498-L1510), [crates/ignore/src/walk.rs:2013-2020](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/walk.rs#L2013-L2020)]. If all workers become inactive simultaneously, termination is signaled via a broadcast quit message [[crates/ignore/src/walk.rs:1955-1964](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/walk.rs#L1955-L1964)].

> [!IMPORTANT]
> The work-stealing mechanism initializes deques using `Deque::new_lifo()` instead of FIFO queues. Depth-first traversal is critical when searching wide directories laden with `.gitignore` files to prevent catastrophic memory growth caused by caching hierarchical ignore matchers across broad directory levels [[crates/ignore/src/walk.rs:1656-1661](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/walk.rs#L1656-L1661), [crates/ignore/src/walk.rs:1719-1723](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/walk.rs#L1719-L1723)].

Sources: [crates/ignore/src/walk.rs:1498-1510](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/walk.rs#L1498-L1510), [crates/ignore/src/walk.rs:1642-1649](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/walk.rs#L1642-L1649), [crates/ignore/src/walk.rs:1656-1661](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/walk.rs#L1656-L1661), [crates/ignore/src/walk.rs:1696-1707](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/walk.rs#L1696-L1707), [crates/ignore/src/walk.rs:1719-1723](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/walk.rs#L1719-L1723), [crates/ignore/src/walk.rs:1955-1964](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/walk.rs#L1955-L1964), [crates/ignore/src/walk.rs:2013-2020](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/walk.rs#L2013-L2020)

### Traversal Execution Walkthrough

The parallel traversal executes a precise sequence of operations as each worker consumes items from its stack. The execution path flows through specific stages:

1. **Work Consumption**: Continuously fetches work items via internal methods until exhaustion, dispatching each unit for processing [[crates/ignore/src/walk.rs:1754-1760](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/walk.rs#L1754-L1760)].
2. **Entry Evaluation**: Evaluates depth constraints, validates symlinks or file types, and invokes visitor callbacks immediately if the entry is a file [[crates/ignore/src/walk.rs:1762-1776](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/walk.rs#L1762-L1776)]. For directories, it adds parent ignore rules, checks filesystem boundaries if `root_device` is set, and conditionally reads directory contents [[crates/ignore/src/walk.rs:1777-1812](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/walk.rs#L1777-L1812)].
3. **Directory Reading**: Calls standard library `fs::read_dir()` on target paths, collecting directory entries and read errors into structures and updating ignore matchers via `add_child_with_entries()` [[crates/ignore/src/walk.rs:1609-1637](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/walk.rs#L1609-L1637)].
4. **Work Generation**: Iterates over successful directory entries, wraps each into a `DirEntryRaw`, applies ignore filters, size checks, and custom predicates before pushing qualifying items back onto the work stack [[crates/ignore/src/walk.rs:1834-1839](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/walk.rs#L1834-L1839), [crates/ignore/src/walk.rs:1874-1928](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/walk.rs#L1874-L1928)].

> [!NOTE]
> When directory reading encounters an I/O error listing a directory, the error is collected separately while any successfully retrieved entries are still processed, ensuring partial traversal resilience [[crates/ignore/src/walk.rs:1621-1630](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/walk.rs#L1621-L1630), [crates/ignore/src/walk.rs:1834-1850](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/walk.rs#L1834-L1850)].

Sources: [crates/ignore/src/walk.rs:1609-1637](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/walk.rs#L1609-L1637), [crates/ignore/src/walk.rs:1621-1630](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/walk.rs#L1621-L1630), [crates/ignore/src/walk.rs:1754-1776](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/walk.rs#L1754-L1776), [crates/ignore/src/walk.rs:1777-1812](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/walk.rs#L1777-L1812), [crates/ignore/src/walk.rs:1834-1850](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/walk.rs#L1834-L1850), [crates/ignore/src/walk.rs:1874-1928](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/walk.rs#L1874-L1928)

## Directory Filtering and Ignore Logic

### Overview

Directory traversal and filtering rely on a strict, ordered evaluation pipeline that determines whether paths, files, or entire directory subtrees are visited, skipped, or ignored. When building or iterating over a directory tree via `Walk` or `WalkParallel`, every entry encounters a sequence of checks before it is yielded to the caller or descended into.

Sources: [crates/ignore/src/walk.rs:456-486](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/walk.rs#L456-L486), [crates/ignore/src/walk.rs:1147-1181](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/walk.rs#L1147-L1181), [crates/ignore/src/walk.rs:1867-1928](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/walk.rs#L1867-L1928)

### Ignore Rule Evaluation Precedence

Rules influencing whether a file or directory is skipped follow a deterministic precedence order. Glob overrides, ignore files, file type matchers, hidden file settings, and file size limits execute sequentially.

1. **Glob overrides**: Checked first. If a path matches a glob override, matching stops. Whitelist overrides continue unless prefixed with `!`, which forces an ignore.
2. **Ignore files**: Evaluated second. Precedence among ignore sources places `.ignore` files highest, followed by `.gitignore`, `.git/info/exclude`, global gitignore files, and explicitly added ignore files.
3. **File type matching**: Run on non-directory paths after ignore checks pass.
4. **Hidden files**: Skipped if unwhitelisted and hidden.
5. **Max filesize**: Compared against file size limits for non-directory entries.
6. **Yield**: Paths surviving all prior checks are emitted by the iterator.

Sources: [crates/ignore/src/walk.rs:456-486](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/walk.rs#L456-L486)

### Filtering and Skip Execution Walkthrough

The single-threaded and parallel walkers execute entry filtering through designated helper routines. The execution path for evaluating an entry during traversal proceeds as follows:

1. **Skip Validation**: Invoked for each entry at depth greater than 0, evaluating trivial skip conditions prior to expensive filesystem operations [[crates/ignore/src/walk.rs:1147-1181](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/walk.rs#L1147-L1181)].
2. **Ignore Matching**: Calls `ig.matched_dir_entry(dent)` against the current ignore matcher. If the match status is `is_ignore()`, it logs debug information and returns `true` to skip the entry [[crates/ignore/src/walk.rs:2078-2089](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/walk.rs#L2078-L2089)].
3. **Stdout Equivalence**: Checks if the entry corresponds to stdout redirection targets by comparing inode numbers on Unix or matching file handles to prevent unbounded feedback loops [[crates/ignore/src/walk.rs:1163-1167](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/walk.rs#L1163-L1167), [crates/ignore/src/walk.rs:2116-2135](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/walk.rs#L2116-L2135)].
4. **Filesize Limits**: Evaluates metadata length against `max_filesize` for non-directory files [[crates/ignore/src/walk.rs:1168-1174](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/walk.rs#L1168-L1174), [crates/ignore/src/walk.rs:2056-2076](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/walk.rs#L2056-L2076)].
5. **Filter Predicate**: Applies any custom closure registered via `WalkBuilder::filter_entry` [[crates/ignore/src/walk.rs:1175-1179](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/walk.rs#L1175-L1179)].

> [!NOTE]
> Trivial ignore checks execute before any `stat` or filesystem queries are performed. This order is critical on remote or virtualized filesystems where operations like `stat` trigger expensive on-demand network downloads.

Sources: [crates/ignore/src/walk.rs:1147-1181](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/walk.rs#L1147-L1181), [crates/ignore/src/walk.rs:2056-2076](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/walk.rs#L2056-L2076), [crates/ignore/src/walk.rs:2078-2089](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/walk.rs#L2078-L2089), [crates/ignore/src/walk.rs:2116-2135](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/walk.rs#L2116-L2135)

### Depth Limits and Boundary Constraints

Traversal bounds and device constraints limit directory recursion depth and filesystem boundary crossing.

| Constraint Option | Default Value | Purpose and Enforcement |
| :--- | :--- | :--- |
| `max_depth` | `None` | Restricts recursion depth. When set, directory descension halts once depth reaches or exceeds the threshold. |
| `min_depth` | `None` | Omits entries shallower than the specified minimum depth from being yielded. |
| `same_file_system` | `false` | Prevents traversal from crossing file system boundaries by comparing volume device numbers against the root device. |
| `max_filesize` | `None` | Skips files exceeding the specified byte size limit. |

Sources: [crates/ignore/src/walk.rs:491-495](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/walk.rs#L491-L495), [crates/ignore/src/walk.rs:1807-1812](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/walk.rs#L1807-L1812), [crates/ignore/src/walk.rs:1854-1861](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/walk.rs#L1854-L1861), [crates/ignore/src/walk.rs:2155-2161](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/walk.rs#L2155-L2161)

> [!WARNING]
> When `min_depth` and `max_depth` are both configured via builder methods, setting one out of bounds automatically clamps the opposing limit to maintain validity (`max_depth` cannot be less than `min_depth`, and vice versa).

Sources: [crates/ignore/src/walk.rs:730-736](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/walk.rs#L730-L736), [crates/ignore/src/walk.rs:745-751](https://github.com/BurntSushi/ripgrep/blob/main/crates/ignore/src/walk.rs#L745-L751)

## Stream Search Execution Engine

### Overview

The stream search execution engine acts as the glue logic orchestrating how ripgrep iterates through content, buffers reader blocks, detects binary streams, handles context lines, and dispatches matches to sink targets. Three primary execution structures manage these responsibilities depending on whether the input source is a line-buffered stream (`ReadByLine`), a fixed-length memory slice (`SliceByLine`), or a multi-line regular expression search (`MultiLine`).

Sources: [crates/searcher/src/searcher/glue.rs:11-15](https://github.com/BurntSushi/ripgrep/blob/main/crates/searcher/src/searcher/glue.rs#L11-L15), [crates/searcher/src/searcher/glue.rs:96-100](https://github.com/BurntSushi/ripgrep/blob/main/crates/searcher/src/searcher/glue.rs#L96-L100), [crates/searcher/src/searcher/glue.rs:142-147](https://github.com/BurntSushi/ripgrep/blob/main/crates/searcher/src/searcher/glue.rs#L142-L147)

### Call-Chain Execution Walkthrough

Executing a stream search via `ReadByLine` follows an explicit loop pattern that advances the buffer and dispatches matching events through core processing handlers:

`ReadByLine::run()` → `self.core.begin()?` → `self.fill()?` → `self.core.match_by_line(self.rdr.buffer())?` → `self.core.finish(...)`

1. **`ReadByLine::run`**: Initiates the lifecycle, entering a conditional block if `self.core.begin()?` succeeds [[crates/searcher/src/searcher/glue.rs:38-39](https://github.com/BurntSushi/ripgrep/blob/main/crates/searcher/src/searcher/glue.rs#L38-L39)].
2. **`ReadByLine::fill`**: Populates or rolls the underlying `LineBufferReader`, checking binary offsets and EOF states [[crates/searcher/src/searcher/glue.rs:40](https://github.com/BurntSushi/ripgrep/blob/main/crates/searcher/src/searcher/glue.rs#L40), [crates/searcher/src/searcher/glue.rs:58-88](https://github.com/BurntSushi/ripgrep/blob/main/crates/searcher/src/searcher/glue.rs#L58-L88)].
3. **`Core::match_by_line`**: Searches the active buffer contents line-by-line using the configured matcher [[crates/searcher/src/searcher/glue.rs:41](https://github.com/BurntSushi/ripgrep/blob/main/crates/searcher/src/searcher/glue.rs#L41)].
4. **`ReadByLine::consume_remaining`**: Invoked if matching fails or terminates early, flushing consumed positions from the buffer reader [[crates/searcher/src/searcher/glue.rs:42](https://github.com/BurntSushi/ripgrep/blob/main/crates/searcher/src/searcher/glue.rs#L42), [crates/searcher/src/searcher/glue.rs:53-56](https://github.com/BurntSushi/ripgrep/blob/main/crates/searcher/src/searcher/glue.rs#L53-L56)].
5. **`Core::finish`**: Finalizes execution by passing total byte counts and binary byte offsets to the sink [[crates/searcher/src/searcher/glue.rs:47-50](https://github.com/BurntSushi/ripgrep/blob/main/crates/searcher/src/searcher/glue.rs#L47-L50)].

Sources: [crates/searcher/src/searcher/glue.rs:38-51](https://github.com/BurntSushi/ripgrep/blob/main/crates/searcher/src/searcher/glue.rs#L38-L51), [crates/searcher/src/searcher/glue.rs:53-88](https://github.com/BurntSushi/ripgrep/blob/main/crates/searcher/src/searcher/glue.rs#L53-L88)

> [!WARNING]
> In line-buffered reader mode (`ReadByLine`), binary data detection is enforced across the *entire* current buffer before searching it. In contrast, slice readers (`SliceByLine` and `MultiLine`) restrict initial binary detection to the first chunk up to `DEFAULT_BUFFER_CAPACITY`, thereafter only inspecting bytes that overlap with explicit matches.

Sources: [crates/searcher/src/searcher/glue.rs:736-745](https://github.com/BurntSushi/ripgrep/blob/main/crates/searcher/src/searcher/glue.rs#L736-L745)

### Execution Engine Components and Trade-Offs

The module implements distinct execution wrappers tailored to specific input types and search modes, balancing memory overhead against algorithmic complexity.

| Execution Struct | Target Input | Primary Benefit | Trade-off / Cost |
| :--- | :--- | :--- | :--- |
| `ReadByLine` | `std::io::Read` stream | Streams arbitrarily large inputs with constant memory buffering. | Requires complex buffer rolling and state management. |
| `SliceByLine` | `&'s [u8]` memory slice | Fast direct slice indexing without reader overhead. | Entire input must fit resident in memory. |
| `MultiLine` | `&'s [u8]` memory slice | Supports regex matches spanning multiple lines and overlapping regions. | Higher algorithmic overhead for sink buffering and deferred match merging. |

Sources: [crates/searcher/src/searcher/glue.rs:11-15](https://github.com/BurntSushi/ripgrep/blob/main/crates/searcher/src/searcher/glue.rs#L11-L15), [crates/searcher/src/searcher/glue.rs:96-100](https://github.com/BurntSushi/ripgrep/blob/main/crates/searcher/src/searcher/glue.rs#L96-L100), [crates/searcher/src/searcher/glue.rs:142-147](https://github.com/BurntSushi/ripgrep/blob/main/crates/searcher/src/searcher/glue.rs#L142-L147)

### Buffer Management and Context Retrieval

When performing multi-line searches (`MultiLine`), adjacent or overlapping matches must be grouped together to guarantee that individual lines are never emitted to sinks more than once. The `MultiLine::sink` method delays sinking matches by tracking `self.last_match`, extending ranges if `last_match.end() >= line.start()`. Context retrieval handles passthrough mode versus explicit before/after context bounds.

```rust
fn sink_context(&mut self, range: &Range) -> Result<bool, S::Error> {
    if self.config.passthru {
        if !self.core.other_context_by_line(self.slice, range.start())? {
            return Ok(false);
        }
    } else {
        if !self.core.after_context_by_line(self.slice, range.start())? {
            return Ok(false);
        }
        if !self.core.before_context_by_line(self.slice, range.start())? {
            return Ok(false);
        }
    }
    Ok(true)
}
```

Sources: [crates/searcher/src/searcher/glue.rs:223-257](https://github.com/BurntSushi/ripgrep/blob/main/crates/searcher/src/searcher/glue.rs#L223-L257), [crates/searcher/src/searcher/glue.rs:311-325](https://github.com/BurntSushi/ripgrep/blob/main/crates/searcher/src/searcher/glue.rs#L311-L325)

> [!NOTE]
> Zero-width matches receive special position advancement handling in `MultiLine::advance`: if a match is empty and does not hit the exact end of the slice, the engine forcibly advances the search position by one byte past the match end to prevent infinite loops.

Sources: [crates/searcher/src/searcher/glue.rs:333-343](https://github.com/BurntSushi/ripgrep/blob/main/crates/searcher/src/searcher/glue.rs#L333-L343)

## Match Sinking and Event Dispatch

### Overview

The `MultiLine` search struct orchestrates match sinking, inverted matching logic, and line-by-line stepping for complex pattern evaluations. When searching through memory slices with multi-line configurations enabled, hits and context regions are dispatched to sinks via specialized internal helper methods.

Sources: [crates/searcher/src/searcher/glue.rs:142-147](https://github.com/BurntSushi/ripgrep/blob/main/crates/searcher/src/searcher/glue.rs#L142-L147), [crates/searcher/src/searcher/glue.rs:208-258](https://github.com/BurntSushi/ripgrep/blob/main/crates/searcher/src/searcher/glue.rs#L208-L258)

### Inverted Matching and Line Stepping

When `config.invert_match` is set, `MultiLine::sink` dispatches control to `sink_matched_inverted`. This routine calculates unselected text segments by locating match boundaries and evaluating line spans.

```rust
    fn sink_matched_inverted(&mut self) -> Result<bool, S::Error> {
        assert!(self.config.invert_match);

        let invert_match = match self.find()? {
            None => {
                let range = Range::new(self.core.pos(), self.slice.len());
                self.core.set_pos(range.end());
                range
            }
            Some(mat) => {
                let line = lines::locate(
                    self.slice,
                    self.config.line_term.as_byte(),
                    mat,
                );
                let range = Range::new(self.core.pos(), line.start());
                self.advance(&line);
                range
            }
        };
        if invert_match.is_empty() {
            return Ok(true);
        }
        if !self.sink_context(&invert_match)? {
            return Ok(false);
        }
        let mut stepper = LineStep::new(
            self.config.line_term.as_byte(),
            invert_match.start(),
            invert_match.end(),
        );
        while let Some(line) = stepper.next_match(self.slice) {
            if !self.sink_matched(&line)? {
                return Ok(false);
            }
        }
        Ok(true)
    }
```

Sources: [crates/searcher/src/searcher/glue.rs:260-297](https://github.com/BurntSushi/ripgrep/blob/main/crates/searcher/src/searcher/glue.rs#L260-L297)

> [!IMPORTANT]
> During inverted matching, `LineStep` iterates over individual lines within the identified inverted range (`invert_match.start()` to `invert_match.end()`), feeding each step sequentially to `sink_matched` to ensure that every non-matching line is correctly emitted.

Sources: [crates/searcher/src/searcher/glue.rs:286-295](https://github.com/BurntSushi/ripgrep/blob/main/crates/searcher/src/searcher/glue.rs#L286-L295)

## Output Formatting and Standard Printing

### Overview

The standard printer infrastructure manages the formatting, layout, coloring, and final presentation of search results. Orchestrated via `StandardBuilder`, `Standard`, and `StandardSink`, it coordinates configuration properties such as path display, line numbers, column tracking, custom separators, and terminal coloring.

Sources: [crates/printer/src/standard.rs:30-101](https://github.com/BurntSushi/ripgrep/blob/main/crates/printer/src/standard.rs#L30-L101), [crates/printer/src/standard.rs:480-484](https://github.com/BurntSushi/ripgrep/blob/main/crates/printer/src/standard.rs#L480-L484), [crates/printer/src/standard.rs:639-650](https://github.com/BurntSushi/ripgrep/blob/main/crates/printer/src/standard.rs#L639-L650)

### Configuration and Builder Options

The `Config` struct holds the complete printer state, frozen once built. The table below outlines core configuration options defined in the builder:

| Option Property | Type | Default Value | Purpose |
| :--- | :--- | :--- | :--- |
| `path` | `bool` | `true` | Controls whether file paths are included in the output. |
| `heading` | `bool` | `false` | Prints file paths once as a heading before matches when enabled. |
| `only_matching` | `bool` | `false` | Prints only the specific matching portions instead of entire lines. |
| `per_match` | `bool` | `false` | Prints at least one line per individual match. |
| `per_match_one_line` | `bool` | `false` | Restricts multi-line matches to exactly one printed line. |
| `column` | `bool` | `false` | Prints the starting column number of the first match on a line. |
| `byte_offset` | `bool` | `false` | Prints the absolute byte offset from the start of search. |
| `trim_ascii` | `bool` | `false` | Trims leading ASCII whitespace from printed lines. |
| `separator_context` | `Arc<Option<Vec<u8>>>` | `Some(b"--")` | Sets the divider between discontiguous context blocks. |
| `separator_field_match` | `Arc<Vec<u8>>` | `b":"` | Separator written after line numbers for matching lines. |
| `separator_field_context` | `Arc<Vec<u8>>` | `b"-"` | Separator written after line numbers for context lines. |

Sources: [crates/printer/src/standard.rs:35-57](https://github.com/BurntSushi/ripgrep/blob/main/crates/printer/src/standard.rs#L35-L57), [crates/printer/src/standard.rs:61-83](https://github.com/BurntSushi/ripgrep/blob/main/crates/printer/src/standard.rs#L61-L83)

### Call-Chain Execution Walkthrough

When a search match or context block is registered by `StandardSink`, execution flows through a precise sequence of internal dispatch methods. The call-chain below traces a matching line hit:

1. **Sink Notification**: Receives the match via `Sink` trait methods, increments match counters, and triggers match recording and replacement logic [[crates/printer/src/standard.rs:766-791](https://github.com/BurntSushi/ripgrep/blob/main/crates/printer/src/standard.rs#L766-L791)].
2. **Match Recording**: Clears previous matches and, if match granularity is required, calls helper utilities to populate stored match locations [[crates/printer/src/standard.rs:698-735](https://github.com/BurntSushi/ripgrep/blob/main/crates/printer/src/standard.rs#L698-L735)].
3. **Replacement Evaluation**: Evaluates replacement expressions if configured [[crates/printer/src/standard.rs:747-759](https://github.com/BurntSushi/ripgrep/blob/main/crates/printer/src/standard.rs#L747-L759)].
4. **Printer Implementation**: Bundles state into a `StandardImpl` instance containing initialized matching data [[crates/printer/src/standard.rs:902-911](https://github.com/BurntSushi/ripgrep/blob/main/crates/printer/src/standard.rs#L902-L911)].
5. **Dispatch Execution**: Inspects whether matches are empty and whether multi-line mode is active, dispatching to fast or slow sinking routines [[crates/printer/src/standard.rs:928-943](https://github.com/BurntSushi/ripgrep/blob/main/crates/printer/src/standard.rs#L928-L943)].
6. **Prelude Generation**: Ensures search separators or file path headings are emitted before result lines, and constructs line prefixes via `PreludeWriter` [[crates/printer/src/standard.rs:1182-1189](https://github.com/BurntSushi/ripgrep/blob/main/crates/printer/src/standard.rs#L1182-L1189), [crates/printer/src/standard.rs:1370-1386](https://github.com/BurntSushi/ripgrep/blob/main/crates/printer/src/standard.rs#L1370-L1386)].
7. **Line Output**: Applies terminal color specs, handles maximum column truncation or previews, and writes final bytes to the underlying writer [[crates/printer/src/standard.rs:1192-1239](https://github.com/BurntSushi/ripgrep/blob/main/crates/printer/src/standard.rs#L1192-L1239)].

Sources: [crates/printer/src/standard.rs:698-735](https://github.com/BurntSushi/ripgrep/blob/main/crates/printer/src/standard.rs#L698-L735), [crates/printer/src/standard.rs:747-759](https://github.com/BurntSushi/ripgrep/blob/main/crates/printer/src/standard.rs#L747-L759), [crates/printer/src/standard.rs:766-791](https://github.com/BurntSushi/ripgrep/blob/main/crates/printer/src/standard.rs#L766-L791), [crates/printer/src/standard.rs:902-943](https://github.com/BurntSushi/ripgrep/blob/main/crates/printer/src/standard.rs#L902-L943), [crates/printer/src/standard.rs:1182-1239](https://github.com/BurntSushi/ripgrep/blob/main/crates/printer/src/standard.rs#L1182-L1239), [crates/printer/src/standard.rs:1370-1386](https://github.com/BurntSushi/ripgrep/blob/main/crates/printer/src/standard.rs#L1370-L1386)]

> [!NOTE]
> Granular match recording (`needs_match_granularity`) is conditionally enabled only when features such as terminal coloring, column numbers, replacements, per-match lines, or statistics are active, avoiding unnecessary performance overhead during fast searches.

Sources: [crates/printer/src/standard.rs:578-594](https://github.com/BurntSushi/ripgrep/blob/main/crates/printer/src/standard.rs#L578-L594)

### Design Trade-Offs

| Design Choice | Benefit | Cost |
| :--- | :--- | :--- |
| **Separated `Standard` and `StandardSink`** | Allows cheap, temporary sink allocation per searched file while retaining shared printer configuration. | Requires managing lifetime references (`'p`, `'s`) across printer and sink boundaries. |
| **Conditional match granularity** | Bypasses individual match detection during fast searches, maximizing throughput for plain grepping. | Requires secondary inspection passes when color, columns, or replacements are subsequently enabled. |
| **Vector-backed match storage (`self.standard.matches`)** | Amortizes allocation overhead across multiple matches within search runs. | Introduces interior mutability via `RefCell` and shared buffer reuse across sinks. |

Sources: [crates/printer/src/standard.rs:480-484](https://github.com/BurntSushi/ripgrep/blob/main/crates/printer/src/standard.rs#L480-L484), [crates/printer/src/standard.rs:616-650](https://github.com/BurntSushi/ripgrep/blob/main/crates/printer/src/standard.rs#L616-L650), [crates/printer/src/standard.rs:698-735](https://github.com/BurntSushi/ripgrep/blob/main/crates/printer/src/standard.rs#L698-L735)

## Related

- [[File Search Core]]
- [[File System Walkers]]

