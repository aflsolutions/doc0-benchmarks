# Lua Scripting
<details>
<summary>Relevant source files</summary>

The following files were used as context for generating this wiki page:

- [src/eval.c](https://github.com/redis/redis/blob/main/src/eval.c)
- [src/function_lua.c](https://github.com/redis/redis/blob/main/src/function_lua.c)
- [src/script_lua.c](https://github.com/redis/redis/blob/main/src/script_lua.c)
- [src/functions.c](https://github.com/redis/redis/blob/main/src/functions.c)
- [src/script.c](https://github.com/redis/redis/blob/main/src/script.c)
</details>

Lua scripting provides a powerful, sandboxed execution environment within the Redis database server. By moving application logic closer to the data, developers can perform multi-command atomic operations without the network round-trip overhead typical of client-side execution. The subsystem is designed to ensure that scripts are isolated, repeatable, and memory-conscious while maintaining consistency across replicas.

Architecturally, Redis integrates Lua via a core `lua_State` VM, managed through specialized interfaces in `src/script_lua.c` and `src/eval.c`. The system categorizes scripts into transient `EVAL` based execution and persistent `FUNCTION` based registration. Both paths leverage a shared underlying execution context, ensuring consistent command permission handling, memory tracking, and replication semantics.

This subsystem provides the engine for atomicity: when a Lua script executes, it runs as a single, uninterruptible operation relative to other clients. The scripting engine handles the complex mapping between Lua types and Redis RESP types, enabling seamless data flow between the engine and the database core.

## The Execution Lifecycle

The execution of a script, whether triggered via `EVAL` or `FCALL`, follows a strict sequence to ensure isolation.

1.  **Preparation**: `scriptPrepareForRun()` verifies the command context, checks ACL permissions, and ensures compatibility with current server state (e.g., cluster mode, OOM status).
2.  **Context Binding**: The script environment (using `luaSaveOnRegistry`) is bound to the `scriptRunCtx`, which holds pointers to the caller's client, flags, and execution mode.
3.  **VM Call**: `luaCallFunction()` pushes the function onto the Lua stack, sets appropriate debugging hooks if needed, and executes the script using `lua_pcall`.
4.  **Result Conversion**: The result is captured from the Lua stack and converted back to Redis RESP format via `luaReplyToRedisReply()`, which performs deep translation of Lua tables into Redis nested replies (arrays, sets, maps).
5.  **Reset**: `scriptResetRun()` cleans up the context, ensuring no state leakage between successive script invocations.

Sources: [src/eval.c:608-625](https://github.com/redis/redis/blob/main/src/eval.c#L608-L625), [src/script_lua.c:1662-1748](https://github.com/redis/redis/blob/main/src/script_lua.c#L1662-L1748), [src/functions.c:648-655](https://github.com/redis/redis/blob/main/src/functions.c#L648-L655)

## The Lua VM and Registry

The Lua environment is encapsulated within a central `lua_State` instance. Because the global scope is dangerous, Redis employs "table protection" mechanisms to guard the global namespace.

*   **Global Protection**: The global table is locked using a custom metatable (`luaSetErrorMetatable`), preventing scripts from defining or accessing unauthorized globals.
*   **API Exposure**: The `redis` table is populated in the Lua global scope via `luaRegisterRedisAPI()`, exposing commands like `redis.call`, `redis.pcall`, and `redis.sha1hex`.
*   **Registry Access**: Redis stores internal metadata—such as the active `scriptRunCtx` or the `error_handler`—in the Lua registry (`LUA_REGISTRYINDEX`), which is unreachable by standard Lua scripts, protecting internal state from modification.

Sources: [src/eval.c:249-256](https://github.com/redis/redis/blob/main/src/eval.c#L249-L256), [src/script_lua.c:427-501](https://github.com/redis/redis/blob/main/src/script_lua.c#L427-L501)

## Script Eviction and LRU Cache

When users execute scripts via `EVAL`, they generate new unique scripts in the cache. To prevent memory exhaustion, Redis maintains an LRU-based eviction strategy for `EVAL` scripts only.

> [!NOTE]
> Script eviction does not apply to scripts loaded via `SCRIPT LOAD` or the `FUNCTION` subsystem; these are considered persistent, and the user must manage their lifecycle explicitly.

The logic relies on `luaScriptsLRUAdd()` which maintains a `list` of SHAs. When the count exceeds `LRU_LIST_LENGTH` (500), the oldest script is removed via `luaDeleteFunction()`.

Sources: [src/eval.c:534-550](https://github.com/redis/redis/blob/main/src/eval.c#L534-L550)

## Memory Management and GC

Lua's garbage collector can trigger latency spikes. Redis minimizes this impact through the `luaGC` function, which performs incremental garbage collection steps every 50 commands (defined by `LUA_GC_CYCLE_PERIOD`).

The system also tracks memory consumption explicitly. Every script or function library registers its memory overhead, which is monitored by `evalScriptsMemoryEngine()` and `luaMemory()`. This allows the server to accurately report `used_memory` and block scripts if they exceed safety thresholds.

Sources: [src/script_lua.c:1750-1770](https://github.com/redis/redis/blob/main/src/script_lua.c#L1750-L1770), [src/eval.c:753-758](https://github.com/redis/redis/blob/main/src/eval.c#L753-L758)

## Error Handling and Debugging

The Lua debugger (LDB) uses an instrumentation-based approach. The key mechanism is `luaLdbLineHook`, which is triggered by the Lua VM at every line execution.

1.  **Line Hook**: When the line hook fires, LDB checks if the current line matches a breakpoint or if a timeout has occurred.
2.  **Session Management**: If stopped, `ldbRepl()` is called, which intercepts the client's connection (via `connRead`) to serve a simple interactive debug console.
3.  **Command Dispatch**: Commands like `print`, `break`, and `eval` are parsed and executed within the context of the running script.

Sources: [src/eval.c:1600-1762](https://github.com/redis/redis/blob/main/src/eval.c#L1600-L1762)

## Function Subsystem Integration

While `EVAL` treats scripts as anonymous blobs keyed by SHA1, the `FUNCTION` subsystem (in `src/functions.c`) provides a structured way to register named libraries.

| Feature | EVAL / EVALSHA | FUNCTION LOAD |
| :--- | :--- | :--- |
| **Lifespan** | Ephemeral / LRU cache | Persistent until flushed |
| **Identity** | SHA1 hash | User-defined name |
| **Registration** | Implicit upon execution | Explicit via `FUNCTION LOAD` |
| **Metadata** | None (unless shebang) | Full library metadata |

The `functionLibCreateFunction` function verifies library names and creates a `functionInfo` object, which points to the engine-specific function (e.g., the Lua function reference).

Sources: [src/functions.c:244-268](https://github.com/redis/redis/blob/main/src/functions.c#L244-L268)

## Runnable Example

This example demonstrates how a script interacts with the Redis API within Lua.

```lua
-- Simple script to set a key if it doesn't exist
local key = KEYS[1]
local val = ARGV[1]
if redis.call("EXISTS", key) == 0 then
    redis.call("SET", key, val)
    return 1
else
    return 0
end
```

The corresponding Redis invocation:
```bash
# Executing with one key and one argument
EVAL "local key = KEYS[1]; local val = ARGV[1]; ..." 1 mykey myvalue
```

Sources: [src/script_lua.c:1682-1696](https://github.com/redis/redis/blob/main/src/script_lua.c#L1682-L1696)