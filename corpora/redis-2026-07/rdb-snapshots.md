# RDB Snapshots
<details>
<summary>Relevant source files</summary>

The following files were used as context for generating this wiki page:

- [src/rdb.c](https://github.com/redis/redis/blob/main/src/rdb.c)
</details>

RDB (Redis Database) Snapshots provide a point-in-time recovery mechanism by serializing the entire dataset to a compact binary file. This mechanism is critical for persistence, enabling server restarts without losing all data, and serves as the foundation for replication, as master nodes use RDB files to perform full synchronizations with replica nodes.

The RDB format is designed for efficiency. By utilizing binary serialization, it minimizes disk I/O and footprint compared to text-based alternatives. The core design decision involves creating a separate process via `fork()` to perform the snapshotting (BGSAVE). This allows the main server process to continue handling client requests without blocking, significantly reducing the impact of high-latency disk operations on overall system availability.

Beyond simple persistence, RDB files carry auxiliary information—such as the Redis version, memory usage, and replication state—making them self-contained snapshots. The subsystem interacts closely with the Redis I/O (RIO) abstraction, which provides a unified interface for writing data to files, memory buffers, or network sockets, abstracting away the specific delivery mechanism for the serialized data.

## API and Control Flow
The RDB subsystem exposes two primary entry points: `rdbSave()`, which synchronously or asynchronously initiates a snapshot, and `rdbLoad()`, which restores a dataset from an RDB file. When triggered as a `BGSAVE`, the system utilizes `rdbSaveBackground()`, which performs the following operations:
1. Validates that no other snapshotting process is active.
2. Updates `server.dirty_before_bgsave` to track changes since the last snapshot.
3. Invokes `redisFork()` to create a child process.
4. The child executes `rdbSave()`, while the parent proceeds to handle client commands.
5. The child reports completion via a status signal, which the parent handles through `backgroundSaveDoneHandler()`.

Sources: [src/rdb.c:2070-2104](https://github.com/redis/redis/blob/main/src/rdb.c#L2070-L2104), [src/rdb.c:4029-4066](https://github.com/redis/redis/blob/main/src/rdb.c#L4029-L4066)

## Serialization Mechanism
Data serialization is handled by recursive calls that map Redis objects to their binary representations. The system uses a tag-length-value approach for efficiency. Primitive types and collections (strings, lists, hashes, sorted sets) each have specific serialization routines (`rdbSaveObject`) that ensure integers are stored in minimal byte formats and large strings or collection contents are compressed using LZF.

Key logic in `rdbSaveRawString`:
```c
// Attempt to encode integers if the string is small
if (len <= 11) {
    if ((enclen = rdbTryIntegerEncoding((char*)s,len,buf)) > 0) {
        // ... writes encoded integer
    }
}
// Optionally compress with LZF
if (server.rdb_compression && len > 20) {
    n = rdbSaveLzfStringObject(rdb,s,len);
}
```
Sources: [src/rdb.c:449-479](https://github.com/redis/redis/blob/main/src/rdb.c#L449-L479)

## RDB File Format Opcodes
The RDB file structure is a stream of opcodes. Opcodes identify the start of a database, key metadata, object types, and auxiliary information.

| Opcode | Purpose |
| :--- | :--- |
| `RDB_OPCODE_SELECTDB` | Indicates the following keys belong to a specific database ID. |
| `RDB_OPCODE_RESIZEDB` | Provides hints about key/expire hash map sizes for allocation. |
| `RDB_OPCODE_AUX` | Generic metadata (Redis version, ctime, used-mem). |
| `RDB_OPCODE_EOF` | End-of-file marker before the checksum. |
| `RDB_OPCODE_KEY_META` | Prefix for key-level metadata (e.g., expiration). |

Sources: [src/rdb.c:1788-1801](https://github.com/redis/redis/blob/main/src/rdb.c#L1788-L1801), [src/rdb.c:1911](https://github.com/redis/redis/blob/main/src/rdb.c#L1911), [src/rdb.c:1995](https://github.com/redis/redis/blob/main/src/rdb.c#L1995)

> [!NOTE]
> When `RDB_OPCODE_KEY_META` is encountered during loading, the system must parse metadata before it can properly interpret the subsequent object type and value.

Sources: [src/rdb.c:2195-2216](https://github.com/redis/redis/blob/main/src/rdb.c#L2195-L2216)

## Loading and Integrity
The `rdbLoadObject` function is the gatekeeper for reading data. It uses a series of guards to prevent reading corrupt data:
1. `rdbResolveKeyType` ensures the RDB format is understood before proceeding.
2. `lpValidateIntegrity` and similar checks verify that containers like listpacks are not corrupted before they are integrated into the live database.
3. If corruption is detected, `rdbReportCorruptRDB` is triggered to log the incident and, if necessary, terminate the process.

Sources: [src/rdb.c:2406-2424](https://github.com/redis/redis/blob/main/src/rdb.c#L2406-L2424), [src/rdb.c:3128-3134](https://github.com/redis/redis/blob/main/src/rdb.c#L3128-L3134)

## Verified Call Chain: Loading Corrupt Object
When loading an object that contains an integer encoding error, the following path is traversed:
1. `rdbLoadObject` (invokes object-specific loaders)
2. `rdbLoadEncodedStringObject` (delegates to the generic loader)
3. `rdbGenericLoadStringObject`
4. `rdbGenericLoadStringObjectUsable`
5. `rdbLoadIntegerObject` (encounters bad integer type)
6. `rdbReportCorruptRDB` (invokes `rdbReportError` with `corruption_error=1`)

Sources: [src/rdb.c:2405-3910](https://github.com/redis/redis/blob/main/src/rdb.c#L2405-L3910) (Verified chain from source)

## Design Trade-offs
| Design Choice | Benefit | Cost |
| :--- | :--- | :--- |
| `fork()` for BGSAVE | Non-blocking persistence for the main thread. | High peak memory usage due to Copy-on-Write (CoW). |
| LZF Compression | Reduced disk space and I/O time. | Increased CPU overhead during snapshot creation. |
| RIO Abstraction | Supports file, socket, and memory stream interfaces. | Adds a thin abstraction layer overhead. |

Sources: [src/rdb.c:378-386](https://github.com/redis/redis/blob/main/src/rdb.c#L378-L386), [src/rdb.c:2079](https://github.com/redis/redis/blob/main/src/rdb.c#L2079)

> [!WARNING]
> The RDB file format for modules is specific to the version ID. If a module cannot be loaded during `rdbLoad`, the server will refuse to start to avoid data inconsistencies.

Sources: [src/rdb.c:3749-3753](https://github.com/redis/redis/blob/main/src/rdb.c#L3749-L3753)