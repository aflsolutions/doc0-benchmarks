# Event Loop
<details>
<summary>Relevant source files</summary>

The following files were used as context for generating this wiki page:

- [src/ae_kqueue.c](https://github.com/redis/redis/blob/main/src/ae_kqueue.c)
- [src/ae.c](https://github.com/redis/redis/blob/main/src/ae.c)
- [src/ae_evport.c](https://github.com/redis/redis/blob/main/src/ae_evport.c)
- [src/networking.c](https://github.com/redis/redis/blob/main/src/networking.c)
</details>

The Event Loop is the architectural heartbeat of Redis. It is a single-threaded, event-driven mechanism responsible for multiplexing I/O operations and scheduling time-based tasks. By centralizing the management of file descriptors and timer events, it allows the server to handle thousands of concurrent client connections with high efficiency, avoiding the overhead and complexity of multi-threaded context switching for I/O tasks.

The system is designed with a decoupled multiplexing layer. While the core event loop logic resides in `src/ae.c`, it delegates low-level system calls (such as `epoll`, `kqueue`, or `evport`) to OS-specific modules. This abstraction ensures that Redis maintains consistent performance across various Unix-like operating systems while utilizing the most optimized kernel interfaces available.

The loop operates in a continuous cycle: it processes pending file events (socket activity), executes time-based events (periodic maintenance), and manages pre- and post-sleep hooks. This structured approach allows Redis to seamlessly balance network throughput, memory management, and replication tasks within a single main-thread execution context.

## Initialization and Lifecycle
The event loop lifecycle begins with `aeCreateEventLoop`, which allocates the primary `aeEventLoop` structure. This function initializes the `events` (file events) and `fired` (ready file events) arrays and invokes the platform-specific `aeApiCreate` to prepare the I/O multiplexing state (e.g., creating a `kqueue` or `port_create`).

The `setsize` parameter defines the maximum number of file descriptors the loop can monitor. The loop dynamically resizes these internal arrays using `aeResizeSetSize` if the demand exceeds the initial capacity, ensuring flexibility while maintaining predictable memory usage for the event vectors.

Sources: [src/ae.c:47-81](https://github.com/redis/redis/blob/main/src/ae.c#L47-L81), [src/ae_kqueue.c:62-82](https://github.com/redis/redis/blob/main/src/ae_kqueue.c#L62-L82), [src/ae_evport.c:74-95](https://github.com/redis/redis/blob/main/src/ae_evport.c#L74-L95)

## I/O Multiplexing Abstraction
The subsystem relies on an API abstraction layer (`aeApi`) to interface with kernel events. Each supported platform implements specific functions to manage the interest list (`aeApiAddEvent`, `aeApiDelEvent`) and to block until events occur (`aeApiPoll`). 

In `src/ae_kqueue.c`, for instance, the loop must handle a limitation where `kqueue` treats read and write events separately. To support the "barrier" requirement—where a write event should not immediately follow a read event—the module uses a bitmask (`eventsMask`) to merge the state of the same file descriptor.

Sources: [src/ae_kqueue.c:102-122](https://github.com/redis/redis/blob/main/src/ae_kqueue.c#L102-L122), [src/ae_kqueue.c:142-179](https://github.com/redis/redis/blob/main/src/ae_kqueue.c#L142-L179), [src/ae_evport.c:154-183](https://github.com/redis/redis/blob/main/src/ae_evport.c#L154-L183)

> [!NOTE]
> In the `evport` implementation, file descriptors are dissociated from the port when an event is returned. The system must explicitly re-associate them in the next call to `aeApiPoll` to prevent infinite firing of level-triggered events.

## Main Control Loop
The `aeMain` function drives the loop using a simple `while (!eventLoop->stop)` condition. Within each iteration, `aeProcessEvents` is invoked. This function is responsible for:
1. Executing `beforesleep` hooks.
2. Calculating the timeout duration based on the earliest timer event (`usUntilEarliestTimer`).
3. Calling the `aeApiPoll` to wait for I/O activity.
4. Executing file event handlers (Readable/Writable).
5. Calling `aftersleep` hooks.
6. Processing time events.

Sources: [src/ae.c:365-473](https://github.com/redis/redis/blob/main/src/ae.c#L365-L473), [src/ae.c:497-504](https://github.com/redis/redis/blob/main/src/ae.c#L497-L504)

### Execution Walkthrough: Handling Socket I/O
The flow of handling a ready socket is as follows:
1. `aeProcessEvents` calls `aeApiPoll`, which returns an array of ready file descriptors.
2. The loop iterates through the `fired` events.
3. For each FD, the code checks the `AE_BARRIER` flag. If set, and if both read/write events are triggered, the writable event is deferred to ensure ordered consistency.
4. The handlers (`rfileProc` or `wfileProc`) are dispatched to handle the logic, such as `readQueryFromClient`.

Sources: [src/ae.c:414-466](https://github.com/redis/redis/blob/main/src/ae.c#L414-L466)

## Timer Event Management
Timer events are managed as a linked list (`timeEventHead`). While current implementations use an unsorted list (resulting in $O(N)$ lookup), the logic efficiently manages timers through `aeCreateTimeEvent` and `processTimeEvents`. Timers are flagged as `AE_DELETED_EVENT_ID` instead of immediate removal to prevent list modification issues during iteration.

The function `usUntilEarliestTimer` determines the sleep interval for `aeApiPoll`. If the system has time-sensitive tasks, the I/O multiplexer will only wait until the next timer expires, ensuring the system remains responsive.

Sources: [src/ae.c:218-239](https://github.com/redis/redis/blob/main/src/ae.c#L218-L239), [src/ae.c:263-281](https://github.com/redis/redis/blob/main/src/ae.c#L263-L281), [src/ae.c:284-348](https://github.com/redis/redis/blob/main/src/ae.c#L284-L348)

## Flag and Status Reference
The event loop behavior is controlled by various flags defined in `ae.h` and used across the loop:

| Flag | Description |
| :--- | :--- |
| `AE_FILE_EVENTS` | Indicates that file-based I/O events should be processed. |
| `AE_TIME_EVENTS` | Indicates that time-based events should be processed. |
| `AE_DONT_WAIT` | Instructs `aeApiPoll` to return immediately without blocking. |
| `AE_BARRIER` | Forces a specific ordering for read/write events on the same FD. |

Sources: [src/ae.c:355-364](https://github.com/redis/redis/blob/main/src/ae.c#L355-L364), [src/ae.c:431](https://github.com/redis/redis/blob/main/src/ae.c#L431)

## Performance Considerations
The architecture makes specific trade-offs to maintain throughput:

| Design Choice | Benefit | Cost |
| :--- | :--- | :--- |
| Single-threaded loop | Eliminates locking contention | Scaling limited to one CPU core |
| List-based Timers | Fast insertion ($O(1)$) | Slow lookup ($O(N)$) |
| Epoll/Kqueue usage | Efficient $O(1)$ or $O(\log N)$ multiplexing | Complexity in OS-specific implementations |

Sources: [src/ae.c:257-261](https://github.com/redis/redis/blob/main/src/ae.c#L257-L261)

## Worked Example: Creating a File Event
To monitor a socket, a developer uses `aeCreateFileEvent`. This snippet demonstrates registering a read handler:

```c
// Example: Creating a read event for a socket descriptor 'fd'
// The 'readQueryFromClient' function is defined in networking.c
if (aeCreateFileEvent(server.el, fd, AE_READABLE, readQueryFromClient, NULL) == AE_ERR) {
    // Handle error (e.g., fd out of range or event loop failure)
    serverLog(LL_WARNING, "Failed to create file event for fd %d", fd);
}
```
This call verifies the bounds of the file descriptor relative to the `setsize`, resizes the loop if necessary, and triggers the `aeApiAddEvent` to inform the kernel to track the specific FD for read activity.

Sources: [src/ae.c:145-179](https://github.com/redis/redis/blob/main/src/ae.c#L145-L179)