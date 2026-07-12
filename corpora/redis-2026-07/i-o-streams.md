# I/O Streams
<details>
<summary>Relevant source files</summary>

The following files were used as context for generating this wiki page:

- [src/aof.c](https://github.com/redis/redis/blob/main/src/aof.c)
- [src/rio.c](https://github.com/redis/redis/blob/main/src/rio.c)
- [src/rio.h](https://github.com/redis/redis/blob/main/src/rio.h)
- [src/t_stream.c](https://github.com/redis/redis/blob/main/src/t_stream.c)
</details>

I/O Streams in Redis serve as a unified abstraction for sequential data production and consumption. By decoupling the higher-level logic (such as AOF persistence, RDB serialization, and replication) from the underlying transport mechanism, the system allows the same serialization code—like that used for writing key-value pairs to disk—to operate seamlessly over memory buffers, physical files, or network socket connections.

The design centers on an I/O context structure (aliased as `rio` from `struct _rio`) that bundles function pointers for read, write, tell (positioning), and flush operations. This approach abstracts away the complexities of different backends, allowing modules to emit protocols (like the Redis bulk-string format) without awareness of whether the destination is a local file, a temporary memory buffer, or a set of connected replicas.

This component is critical for data integrity and performance. It enables optimizations such as asynchronous file-system synchronization, page cache reclamation, and checksum validation during serialization. By providing a consistent API, it ensures that data flows are robust, easily testable, and capable of adapting to varying hardware environments and high-concurrency replication requirements.

Sources: [src/rio.h:32-48](https://github.com/redis/redis/blob/main/src/rio.h#L32-L48), [src/rio.h:98](https://github.com/redis/redis/blob/main/src/rio.h#L98)

## The Abstraction Surface
The subsystem is structured as a functional interface defined in `src/rio.h` and implemented through various "targets." The core structure, `rio`, acts as a dispatch table.

- **read/write**: High-level wrappers defined in `src/rio.h` that manage the actual function calls to the backend pointers.
- **processed_bytes**: A tracking field updated automatically by the reading and writing helpers to monitor throughput.
- **flags**: Used to track the operational state (like read or write errors), allowing for safe, short-circuited error handling.
- **update_cksum**: An optional callback (typically implemented via `rioGenericUpdateChecksum`, which calls `crc64`) used to compute rolling checksums during serialization, crucial for detecting corruption in RDB or AOF files.

Sources: [src/rio.h:32-96](https://github.com/redis/redis/blob/main/src/rio.h#L32-L96), [src/rio.h:104-134](https://github.com/redis/redis/blob/main/src/rio.h#L104-L134), [src/rio.c:556-558](https://github.com/redis/redis/blob/main/src/rio.c#L556-L558)

## Backend Targets
The implementation provides specific backends suited for different lifecycle stages of data:

| Backend Type | Purpose | Key Property |
| :--- | :--- | :--- |
| Buffer | In-memory serialization | Appends to an `sds` buffer. |
| File | AOF/RDB disk storage | Supports `autosync` and page cache reclamation. |
| Conn | Replication loading | Buffers data from a `connection` object. |
| Fd | Pipe streaming | Used for diskless replication (writing to a pipe). |
| Connset | Multi-replica streaming | Writes data to multiple socket connections in parallel. |

Sources: [src/rio.c:75-86](https://github.com/redis/redis/blob/main/src/rio.c#L75-L86), [src/rio.c:172-183](https://github.com/redis/redis/blob/main/src/rio.c#L172-L183), [src/rio.c:274-285](https://github.com/redis/redis/blob/main/src/rio.c#L274-L285), [src/rio.c:393-404](https://github.com/redis/redis/blob/main/src/rio.c#L393-L404), [src/rio.c:522-533](https://github.com/redis/redis/blob/main/src/rio.c#L522-L533)

## File-Based Mechanism and Auto-Sync
When using file-based backends for disk-based persistence, the subsystem integrates directly with the OS's write cache. The writing logic includes mechanics to avoid flooding the kernel with dirty pages.

When `autosync` is configured via `rioSetAutoSync`, the I/O object tracks `buffered` bytes. If this count exceeds the threshold, it triggers a flush and an asynchronous write-out via `sync_file_range` (where available) or `redis_fsync`.

> [!WARNING]
> If `sync_file_range` is unavailable, the system falls back to a synchronous `redis_fsync`. This can introduce latency spikes when serializing large RDB files, as the system must wait for the disk hardware to confirm the write.

Sources: [src/rio.c:97-154](https://github.com/redis/redis/blob/main/src/rio.c#L97-L154)

## AOF Manifest Management
AOF management relies on structures (e.g., `aofManifest`) that track multiple file segments (`BASE`, `INCR`, `HISTORY`). This ensures that during recovery or rewrite operations, the server maintains an accurate, sequential view of the data.

- **BASE**: A point-in-time snapshot of the database.
- **INCR**: Sequential delta logs generated since the last rewrite.
- **HISTORY**: Obsolete segments scheduled for garbage collection.

The manifest itself is written by first creating a temporary file and then atomically renaming it to the final destination, preventing corruption if the process crashes mid-update.

Sources: [src/aof.c:48-71](https://github.com/redis/redis/blob/main/src/aof.c#L48-L71), [src/aof.c:539-609](https://github.com/redis/redis/blob/main/src/aof.c#L539-L609)

## Stream Entry Serialization
The logic in `src/t_stream.c` for rewriting stream objects demonstrates how these I/O operations handle complex data structures. To serialize a stream:
1. It iterates through the radix tree of listpacks.
2. For each record, it emits an `XADD` command to the stream.
3. It uses bulk count and bulk string helpers to maintain the Redis RESP protocol format.

This allows the stream object to be reconstructed exactly during AOF replay or replication loading.

Sources: [src/t_stream.c:2264-2475](https://github.com/redis/redis/blob/main/src/t_stream.c#L2264-L2475)

## Call Chain: Serializing a Bulk String
When a module or internal function needs to serialize a bulk string, the operation flows through the abstraction layer:

1. **`rioWriteBulkString()`**: Public API call to format the string for transmission.
2. **`rioWriteBulkCount()`**: Writes the `$` prefix and the length header.
3. **Internal `rioWrite()`**: The inline wrapper function in `src/rio.h` that checks for write error flags in the stream context object.
4. **Backend function**: The specific backend function pointer stored in the stream context object (e.g., the `write` member) is executed.
5. **Raw System Call**: The backend writes the raw bytes to the destination descriptor or memory pointer.

Sources: [src/rio.c:615-622](https://github.com/redis/redis/blob/main/src/rio.c#L615-L622), [src/rio.h:104-118](https://github.com/redis/redis/blob/main/src/rio.h#L104-L118)

## Design Trade-offs
| Design Choice | Benefit | Cost |
| :--- | :--- | :--- |
| **Fixed-size chunk writing** | Memory efficiency; avoids large allocations. | Requires multiple system calls for large payloads. |
| **SDS-based buffering** | Simplifies string manipulation and dynamic sizing. | Overhead of SDS metadata management. |
| **Function pointers** | Flexible backend switching; decoupled logic. | Slight overhead of indirect function calls. |
| **Auto-sync mechanism** | Distributes I/O pressure; improves responsiveness. | Complex logic to track dirty buffer counts. |

Sources: [src/rio.c:332-349](https://github.com/redis/redis/blob/main/src/rio.c#L332-L349), [src/rio.c:104-150](https://github.com/redis/redis/blob/main/src/rio.c#L104-L150)