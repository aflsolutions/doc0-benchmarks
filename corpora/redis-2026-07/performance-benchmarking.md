# Performance Benchmarking
<details>
<summary>Relevant source files</summary>

The following files were used as context for generating this wiki page:

- [src/redis-benchmark.c](https://github.com/redis/redis/blob/main/src/redis-benchmark.c)
- [tools/array-bench.py](https://github.com/redis/redis/blob/main/tools/array-bench.py)
- [redis.conf](https://github.com/redis/redis/blob/main/redis.conf)
</details>

Performance Benchmarking in Redis is a critical discipline for capacity planning, regression testing, and verifying throughput/latency characteristics under load. The ecosystem provides two primary tools: the `redis-benchmark` C utility, which serves as a high-performance, multi-threaded load generator designed to stress-test Redis instances, and specialized Python-based harness tools like `array-bench.py` for evaluating specific data structures and complex workloads.

These tools solve the fundamental problem of quantifying system response time and throughput. By simulating concurrent client connections, pipelined requests, and randomized key/data access patterns, they allow developers to measure how different configurations (such as persistence settings or cluster topology) impact real-world performance. The design relies heavily on event-driven I/O (`ae` event loop) and atomic primitives to coordinate multi-threaded workloads, ensuring that the benchmark tool itself does not become the bottleneck during high-load tests.

This performance measurement subsystem is deeply integrated with Redis's architecture. It interacts with the server's protocol parsers, cluster slot management mechanisms, and internal memory management. As the system scales from a single instance to a clustered environment, the benchmarking logic must dynamically adapt to topology changes, making it an essential component for both performance tuning and operational stability.

## Core Benchmarking Engine (`redis-benchmark`)

The `redis-benchmark` utility acts as the primary driver for performance analysis. It implements a client that can operate in single-threaded or multi-threaded modes. The core mechanism involves creating an event loop (`aeEventLoop`) for each thread, which orchestrates non-blocking socket I/O to maximize requests-per-second (RPS).

When running in multi-threaded mode, the tool initializes an array of `benchmarkThread` structures. Each thread manages its own `aeEventLoop` and a pool of clients. Load distribution is handled by dividing the total requested connections across these threads.

> [!TIP]
> When running benchmarks on multi-core machines, explicitly using the `--threads` option is essential. Failing to match the benchmark threads to the server's capabilities often leads to the benchmark tool itself hitting a CPU bottleneck, resulting in misleadingly low throughput numbers.

Sources: [src/redis-benchmark.c:61-94](https://github.com/redis/redis/blob/main/src/redis-benchmark.c#L61-L94), [src/redis-benchmark.c:936-944](https://github.com/redis/redis/blob/main/src/redis-benchmark.c#L936-L944)

## Client Lifecycle and Event Handling

Clients in `redis-benchmark` manage their own state machine for request pipelining. A client is initialized by pre-formatting the command (e.g., via `redisFormatCommand`) into an output buffer (`c->obuf`).

The state machine transitions between `writeHandler` and `readHandler`:
1.  `writeHandler`: Responsible for pushing bytes into the socket. It guards the connection flow by checking `c->written` and atomic flags for total issued requests.
2.  `readHandler`: Triggered when data is available. It performs the latency calculation by comparing `ustime()` with `c->start`.

A critical mechanism is the management of the "prefix" commands (like `AUTH` or `SELECT`). The client tracks `prefix_pending` and `prefixlen` to ensure these commands are issued first, but then excluded from the core loop's timing and random-data-replacement logic.

Sources: [src/redis-benchmark.c:110-130](https://github.com/redis/redis/blob/main/src/redis-benchmark.c#L110-L130), [src/redis-benchmark.c:442-553](https://github.com/redis/redis/blob/main/src/redis-benchmark.c#L442-L553), [src/redis-benchmark.c:555-602](https://github.com/redis/redis/blob/main/src/redis-benchmark.c#L555-L602)

## Cluster Mode Integration

When running in cluster mode (`--cluster`), the benchmark must be aware of the cluster topology to direct commands to the correct nodes. The `fetchClusterConfiguration` function retrieves node info, and `fetchClusterSlotsConfiguration` keeps the slot mapping updated.

The system uses `setClusterKeyHashTag` to inject `{tag}` into keys. This ensures that when commands reach the Redis cluster, they hash correctly to the shard holding that key. If a node returns a `MOVED` or `ASK` error, the benchmark triggers a slot update mechanism, effectively forcing a refresh of the topology before re-issuing the command.

> [!CAUTION]
> In cluster mode, incorrect usage of key tags will cause commands to be sent to the wrong node, resulting in constant redirection overhead or `CLUSTERDOWN` errors. Always ensure that the benchmark commands provided explicitly include the `{tag}` placeholder when working with a multi-shard environment.

Sources: [src/redis-benchmark.c:395-418](https://github.com/redis/redis/blob/main/src/redis-benchmark.c#L395-L418), [src/redis-benchmark.c:1095-1259](https://github.com/redis/redis/blob/main/src/redis-benchmark.c#L1095-L1259)

## Latency Histograms

To provide accurate p50, p95, and p99 metrics, the utility uses `hdr_histogram` (HdrHistogram). It maintains two histograms: one for the entire run and a transient one (`current_sec_latency_histogram`) for interval-based throughput reporting.

The recording happens in the `readHandler` path. The use of `hdr_record_value_atomic` ensures that in multi-threaded scenarios, latency samples from different threads are aggregated correctly without contention bottlenecks in the histogram structure itself.

| Metric | Histogram Source | Purpose |
| :--- | :--- | :--- |
| `latency_histogram` | Global | Entire benchmark run statistics |
| `current_sec_latency_histogram` | Thread-local/Interval | Real-time throughput/latency reporting |

Sources: [src/redis-benchmark.c:99-100](https://github.com/redis/redis/blob/main/src/redis-benchmark.c#L99-L100), [src/redis-benchmark.c:528-541](https://github.com/redis/redis/blob/main/src/redis-benchmark.c#L528-L541)

## Automated Harnesses (`array-bench.py`)

The `tools/array-bench.py` script demonstrates how to wrap `redis-benchmark` for specific algorithmic validation. It orchestrates an entire lifecycle:
1.  **Deployment**: Starts an ephemeral `redis-server`.
2.  **Preparation**: Flushes the database and builds complex datasets using `piped` raw RESP requests (`build_dense_numeric`, `build_dense_text`).
3.  **Workload Execution**: Iterates through a defined set of `Workload` objects, invoking `redis-benchmark` with calibrated parameters (like request counts, clients, and pipelines).
4.  **Reporting**: Parses the raw stdout output via Regex (`QPS_RE`) and generates a structured summary.

This harness effectively treats `redis-benchmark` as a library, providing a repeatable test-and-verify loop for analyzing Redis performance under controlled, deterministic datasets.

Sources: [tools/array-bench.py:198-206](https://github.com/redis/redis/blob/main/tools/array-bench.py#L198-L206), [tools/array-bench.py:338-354](https://github.com/redis/redis/blob/main/tools/array-bench.py#L338-L354)

## Usage Example

The following example demonstrates how a developer invokes `redis-benchmark` directly to test a custom command path with pipelining:

```c
// Example: Running a custom benchmark for an "LRANGE" operation 
// with 20 parallel clients and a pipeline depth of 16.
$ ./redis-benchmark -h 127.0.0.1 -p 6379 -c 20 -P 16 -n 100000 -t lrange
```

Sources: [src/redis-benchmark.c:1633-1644](https://github.com/redis/redis/blob/main/src/redis-benchmark.c#L1633-L1644)