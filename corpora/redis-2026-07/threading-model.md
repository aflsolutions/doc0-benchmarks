# Threading Model
<details>
<summary>Relevant source files</summary>

The following files were used as context for generating this wiki page:

- [src/iothread.c](https://github.com/redis/redis/blob/main/src/iothread.c)
- [src/networking.c](https://github.com/redis/redis/blob/main/src/networking.c)
</details>

The Redis "Threading Model" is a sophisticated architectural design that allows the server to scale its I/O throughput by offloading network-intensive operations—specifically reading requests and writing responses—to a dedicated pool of I/O threads, while preserving the single-threaded nature of command execution. This hybrid approach ensures that while the expensive networking operations benefit from multi-core parallelism, the core database logic, which relies on simplicity and avoiding complex locking, remains single-threaded.

The system exists to solve the bottleneck encountered when a single thread handles both event loop I/O and command processing under high concurrency. By distributing I/O work, the system reduces the pressure on the main thread, allowing it to spend more CPU cycles on query parsing, command execution, and data management. The architecture implements a "main-thread-centric" coordination model where the main thread retains control over client lifecycle and command semantics, while I/O threads act as high-speed data transporters.

This model is built upon the interaction between the main thread's event loop (`src/ae.c`) and custom event loops assigned to each I/O thread. Communication occurs through thread-safe queues and event notifiers that signal cross-thread handoffs. This architecture achieves high performance without compromising the integrity of Redis's single-threaded data operations, as all memory-mutating commands occur exclusively in the main thread.

## I/O Thread Lifecycle and Initialization

The I/O thread pool is initialized upon server startup when the configured thread count exceeds one. Each I/O thread maintains its own `aeEventLoop` instance, allowing it to independently poll and process events associated with the clients assigned to it.

1. **Spawning:** `initThreadedIO()` iterates from 1 up to `server.io_threads_num`, allocating an `IOThread` structure for each worker.
2. **Resources:** Every thread is assigned an independent set of pending lists for client handoffs, a mutex to ensure memory-safe interactions, and a dedicated `eventNotifier` to receive notifications from the main thread.
3. **Execution:** The `IOThreadMain` function sets the thread title and CPU affinity, then calls `aeMain()` to start the event loop. The thread stays alive until the server process terminates.
4. **Cleanup:** `killIOThreads()` performs a graceful teardown by sending termination signals to the worker threads and joining them.

Sources: [src/iothread.c:876-963](https://github.com/redis/redis/blob/main/src/iothread.c#L876-L943), [src/iothread.c:860-873](https://github.com/redis/redis/blob/main/src/iothread.c#L860-L873)

## Client Assignment and Load Balancing

The system maintains a load-balancing mechanism to ensure that clients are distributed evenly across available I/O threads. When a new client connection is accepted or an existing one is reassigned, the system calculates the optimal thread ID based on current client load.

*   **Assignment Algorithm:** `assignClientToIOThread()` scans the `io_threads_clients_num` array to find the thread managing the fewest clients (`min_id`).
*   **Handoff Mechanism:** Upon finding the target thread, the main thread unbinds the client's connection from the global event loop, disables its read/write handlers, and enqueues it into `mainThreadPendingClientsToIOThreads` for the selected worker.

Sources: [src/iothread.c:283-310](https://github.com/redis/redis/blob/main/src/iothread.c#L283-L310)

## Handoff Control Flow: Main Thread to I/O Thread

The main thread delegates I/O work to I/O threads by batching clients into queues and notifying the target thread via an event notifier.

```mermaid
flowchart TD
    A["Main Thread: "]
       processCommand() or Accept"] --> B["assignClientToIOThread()"]
    B --> C["Enqueue client to "]
             mainThreadPendingClientsToIOThreads"]
    C --> D["sendPendingClientsToIOThreads()"]
    D --> E["triggerEventNotifier()"]
    E --> F["I/O Thread: handleClientsFromMainThread()"]
    F --> G["processClientsFromMainThread()"]
    G --> H["Bind Connection to I/O Event Loop"]
```
Sources: [src/iothread.c:450-469](https://github.com/redis/redis/blob/main/src/iothread.c#L450-L469)

## I/O Thread to Main Thread: Command Processing

I/O threads only parse the binary protocol into commands; they do not execute them. Once a command is fully parsed, it is passed to the main thread.

> [!IMPORTANT]
> To prevent data races, the main thread remains the sole executor of commands. I/O threads are forbidden from modifying server state, ensuring consistency without requiring massive locking primitives.

When an I/O thread successfully parses a complete request, it triggers the handoff:

1.  **Enqueue:** The I/O thread removes the client from its local list and links it into `pending_clients_to_main_thread`.
2.  **Notification:** It calls `sendPendingClientsToMainThreadIfNeeded()`, which sends an event to the main thread's notifier if the threshold is reached or the queue is non-empty.
3.  **Processing:** The main thread reacts to the notification via `handleClientsFromIOThread()`, executing `processClientsFromIOThread()`.

Sources: [src/iothread.c:109-128](https://github.com/redis/redis/blob/main/src/iothread.c#L109-L128), [src/iothread.c:552-664](https://github.com/redis/redis/blob/main/src/iothread.c#L552-L664)

## Thread Safety and Pause Mechanisms

Because the main thread must sometimes access I/O thread-specific data (e.g., during configuration changes), the model includes a pause-and-resume mechanism.

*   **Pause Logic:** The main thread increments `PausedIOThreads[id]`. The I/O thread, in its `IOThreadBeforeSleep` function, calls `handlePauseAndResume()`.
*   **State Machine:** The thread transitions its state to `IO_THREAD_PAUSED` and busy-waits on an atomic `IO_THREAD_RESUMING` flag.
*   **Resume:** Once the main thread finishes its sensitive operation, it decrements the pause counter and triggers a state transition.

| State Constant | Meaning |
| :--- | :--- |
| `IO_THREAD_UNPAUSED` | Normal operation. |
| `IO_THREAD_PAUSING` | Transition state initiated by main thread. |
| `IO_THREAD_PAUSED` | Thread is dormant, waiting for resume signal. |
| `IO_THREAD_RESUMING` | Transition state initiated by main thread. |

Sources: [src/iothread.c:416-428](https://github.com/redis/redis/blob/main/src/iothread.c#L416-L428), [src/iothread.c:356-410](https://github.com/redis/redis/blob/main/src/iothread.c#L356-L410)

## Design Trade-offs

| Design Choice | Benefit | Cost |
| :--- | :--- | :--- |
| Separate I/O Threads | Parallel network I/O reduces latency. | Added complexity in cross-thread coordination. |
| Main-thread Handoff | Single-threaded state integrity. | Periodic lock contention on thread-safe queues. |
| Busy-wait Pause | Instantaneous state transition. | High CPU usage while thread is "paused". |
| Handoff Thresholds | Reduced notification overhead. | Slightly increased latency for small request bursts. |

Sources: [src/iothread.c:333-349](https://github.com/redis/redis/blob/main/src/iothread.c#L333-L349), [src/iothread.c:23-43](https://github.com/redis/redis/blob/main/src/iothread.c#L23-L43)

## Worked Example: Client Lifecycle Handoff

When a client is read by an I/O thread and a command is identified, the following chain occurs:

1.  **Reading:** `readQueryFromClient()` runs inside the I/O thread.
2.  **Parsing:** `processInputBuffer()` parses the binary data; if complete, it flags `CLIENT_IO_PENDING_COMMAND`.
3.  **Handoff:** `enqueuePendingClientsToMainThread()` is called, moving the client to `pending_clients_to_main_thread`.
4.  **Handoff:** The I/O thread notifies the main thread via `triggerEventNotifier()`.
5.  **Execution:** The main thread runs `handleClientsFromIOThread()` → `processClientsFromIOThread()`, where `processPendingCommandAndInputBuffer(c)` is executed, resulting in command execution and reply generation.

Sources: [src/iothread.c:666-681](https://github.com/redis/redis/blob/main/src/iothread.c#L666-L681), [src/networking.c:3518-3542](https://github.com/redis/redis/blob/main/src/networking.c#L3518-L3542)