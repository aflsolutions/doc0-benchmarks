# Diagnostics
<details>
<summary>Relevant source files</summary>

The following files were used as context for generating this wiki page:

- [src/debug.c](https://github.com/redis/redis/blob/main/src/debug.c)
- [src/latency.c](https://github.com/redis/redis/blob/main/src/latency.c)
- [src/syscheck.c](https://github.com/redis/redis/blob/main/src/syscheck.c)
- [src/server.h](https://github.com/redis/redis/blob/main/src/server.h)
</details>

Diagnostics in Redis encompasses the tools and subsystems designed to inspect, profile, and troubleshoot a running server. Because Redis is a performance-critical, memory-resident system, these diagnostics are built to be highly efficient and, where possible, async-signal-safe to ensure they can function even during extreme system failure or severe load conditions.

The subsystem solves problems ranging from simple "is the server alive" inquiries to complex "why is this query latent" and "why did the process crash" analysis. It provides mechanisms for database content verification, system environment validation (OS configuration), latency monitoring, and crash reporting (including stack traces, register dumps, and memory corruption tests).

The design follows a "safety-first" architecture. For instance, the diagnostic logging mechanism avoids standard library calls that might allocate memory (and thus deadlock if the heap is corrupted) in favor of direct syscalls or async-signal-safe wrappers. By embedding these capabilities directly into the core, Redis avoids external dependencies for fundamental stability assessment.

## Dataset Integrity (DEBUG DIGEST)

The integrity of a dataset can be verified using the `DEBUG DIGEST` mechanism. The system computes a SHA-1-based digest that is commutative for unordered structures (like sets and hash tables) by XORing the digests of individual elements. This ensures that the dataset's logical content remains the same regardless of the internal traversal order of the underlying data structures.

- **Mechanism:** The `computeDatasetDigest()` function iterates through all databases and entries. For each entry, it creates a `keyobj` and a `key-value` digest, mixing the key's content and the value's content into the running SHA-1 context. For ordered structures like lists, the digest includes the order in the calculation, ensuring that `[A, B]` results in a different digest than `[B, A]`.
- **Flow:** `computeDatasetDigest()` → `kvstoreIterator` (traverse keys) → `xorObjectDigest()` (type-specific digestion) → `mixDigest()` or `xorDigest()` (SHA-1 updates).

Sources: [src/debug.c:303-347](https://github.com/redis/redis/blob/main/src/debug.c#L303-L347)

## Latency Monitoring

The latency monitor tracks significant performance bottlenecks by recording the duration of high-latency events. It is driven by a series of time-series objects stored in a dictionary, capturing the `time` and `latency` duration of events exceeding a configured threshold.

- **Mechanism:** When a critical operation (like a disk write or fork) finishes, the system checks the duration against `server.latency_monitor_threshold`. If it exceeds the limit, `latencyAddSample()` is invoked. This maintains a ring buffer of samples per event type, keeping only the most severe latency samples observed within the time series.
- **Reporting:** The `latencyCommand` provides the interface to query this data. It includes subcommands like `HISTORY` (for raw samples) and `GRAPH` (which uses `sparkline` ASCII rendering to visualize the distribution of spikes over time).

Sources: [src/latency.c:59-93](https://github.com/redis/redis/blob/main/src/latency.c#L59-L93), [src/latency.c:571-613](https://github.com/redis/redis/blob/main/src/latency.c#L571-L613)

## System Environment Validation (syscheck)

Redis performs environmental validation via the `syscheck` module to ensure the OS configuration is optimal for performance. This is typically invoked at startup or via explicit checks to identify hazards like slow clock sources or incorrect memory overcommit settings.

- **Check Flow:** The `syscheck()` function iterates through a registered array of `check` structures, executing each `check_fn`. Each function returns 1 (Pass), 0 (Skipped), or -1 (Fail).
- **Hazard Prevention:** For instance, `checkOvercommit()` ensures that Linux memory overcommit is set to 1. If it is disabled, the system warns that background saves or replication may fail under memory pressure, as the Linux kernel might kill the child process to reclaim memory.

Sources: [src/syscheck.c:333-354](https://github.com/redis/redis/blob/main/src/syscheck.c#L333-L354)

| Check Name | Target | Purpose |
| :--- | :--- | :--- |
| `slow-clocksource` | `clock_gettime` | Ensure high-precision, low-overhead timestamps. |
| `xen-clocksource` | `/sys/devices/...` | Avoid known slow Xen hypervisor clocksource. |
| `overcommit` | `/proc/sys/vm/overcommit_memory` | Ensure kernel allows memory overcommit for CoW. |
| `THP` | `/sys/kernel/mm/.../enabled` | Prevent latency spikes caused by Transparent Huge Pages. |

Sources: [src/syscheck.c:320-330](https://github.com/redis/redis/blob/main/src/syscheck.c#L320-L330)

## Crash Handling and Stack Traces

When a crash (like `SIGSEGV`) occurs, the signal handler executes a diagnostic sequence to preserve the state for post-mortem analysis.

> [!CAUTION]
> The signal handler uses a `pthread_mutex` with `PTHREAD_MUTEX_ERRORCHECK` to ensure it does not deadlock if a recursive signal occurs. If the mutex is already locked by the current thread, it switches to a "reduced information" mode.

- **Mechanism:**
    1. **Signal Handler:** `sigsegvHandler()` captures the `ucontext_t` and the faulting address.
    2. **Log Generation:** `logStackTrace()` uses `backtrace()` and `backtrace_symbols_fd()` to map memory addresses to function names.
    3. **Registry Dump:** `logRegisters()` dumps the state of hardware registers, which is architecture-specific (e.g., handling X86 vs ARM64 differences).
    4. **Memory Test:** If `server.memcheck_enabled` is set, `doFastMemoryTest()` kills other threads and runs a read-only memory consistency check on anonymous mappings.

Sources: [src/debug.c:2539-2604](https://github.com/redis/redis/blob/main/src/debug.c#L2539-L2604)

## Design Trade-offs

| Design Choice | Benefit | Cost |
| :--- | :--- | :--- |
| Commutative Digests (XOR) | Order-independent verification. | Requires SHA-1 of individual elements. |
| Fixed-length Rings (Latency TS) | Constant memory usage. | Older spikes are dropped over time. |
| Minimal Signal Handler | Safely runs during severe corruption. | Reduced diagnostic granularity in extreme cases. |
| Explicit Syscalls (debug.c) | Operates without heap/library dependencies. | Higher complexity for cross-platform support. |

Sources: [src/debug.c:72-118](https://github.com/redis/redis/blob/main/src/debug.c#L72-L118), [src/latency.c:59-93](https://github.com/redis/redis/blob/main/src/latency.c#L59-L93)

## Worked Example: Latency Analysis

To analyze latency for a command-related event, a developer can use the `LATENCY` command suite. The following example demonstrates how to extract the history and visualize the data.

```c
// Example: Requesting the history and graph for "command" latency
// In redis-cli:
// 127.0.0.1:6379> LATENCY HISTORY command
// 127.0.0.1:6379> LATENCY GRAPH command
```

When `LATENCY GRAPH command` is called, the server executes:
1. `latencyCommand()` identifies the command.
2. `latencyCommandGenSparkeline()` is invoked, creating a sequence of samples.
3. `sparklineRender()` converts these samples into an ASCII string based on the `LATENCY_GRAPH_COLS` (default 80 columns).
4. The output is sent back to the client as a `verbatim` string.

Sources: [src/latency.c:636-649](https://github.com/redis/redis/blob/main/src/latency.c#L636-L649), [src/latency.c:572-614](https://github.com/redis/redis/blob/main/src/latency.c#L572-L614)