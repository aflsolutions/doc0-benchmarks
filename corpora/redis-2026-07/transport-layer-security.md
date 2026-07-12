# Transport Layer Security
<details>
<summary>Relevant source files</summary>

The following files were used as context for generating this wiki page:

- [src/networking.c](https://github.com/redis/redis/blob/main/src/networking.c)
</details>

Transport Layer Security (TLS) in the context of the provided networking subsystem serves as a foundational security layer for encrypted client-server communication. While the core logic of `src/networking.c` focuses heavily on managing client buffers, replication streams, and command execution, it relies on connection handling abstractions to interact with the underlying transport layer. The system is designed to delegate low-level transport operations—such as socket handling and buffer management—to specific connection handlers, allowing the upper layers of the server to remain largely agnostic of whether the underlying link is a standard TCP socket or an encrypted TLS tunnel.

The primary purpose of the TLS implementation in this system is to enforce secure, authenticated data transit. By abstracting the transport layer via the `connection` structure, the architecture ensures that the server can provide consistent security guarantees across different connection types without duplicating complex handshaking or crypto-negotiation logic throughout the command execution paths. This design choice separates the security mechanism from the command logic, ensuring that sensitive data is protected at the transport boundary before it reaches the server's command-processing pipeline.

Interaction with TLS is inherently event-driven and integrated into the server’s lifecycle. When a new connection arrives, the networking layer coordinates with the TLS handler (e.g., `tlsAcceptHandler` as referenced in `src/networking.c`) to complete the handshake process. Once authenticated, the connection is treated as a standard `client` object, enabling the system to apply output buffer limits, ACL checks, and command execution as if the connection were plaintext. This approach maintains high-performance throughput by minimizing the overhead associated with deep integration between the crypto layer and the application layer.

## Connection Abstraction and Initialization
The architecture relies on an opaque `connection` handle to mask the transport details. Initialization occurs during client creation, where the server enables necessary socket properties and assigns the `readQueryFromClient` handler.

- **Mechanism:** When a new connection is accepted, `acceptCommonHandler` calls `createClient()` to set up the client structure. The actual TLS-specific setup is handled by the connection module referenced by the client's `conn` pointer.
- **Guard:** A critical invariant exists in `acceptCommonHandler`. Before initiating any client creation or logic, the code verifies the transport integrity.

```c
// Example of checking the connection state post-accept
if (connGetState(conn) != CONN_STATE_ACCEPTING) {
    // ... logic for error handling ...
    connClose(conn);
    return;
}
```
Sources: [src/networking.c:1646-1656](https://github.com/redis/redis/blob/main/src/networking.c#L1646-L1656)

## TLS Authentication Flow
The system supports auto-authentication based on certificate identities. When a client connects via TLS, the system can extract the peer's username to perform an automatic ACL check, preventing unauthorized access before the client even issues an `AUTH` command.

- **Mechanism:** The system queries the connection's peer information within `clientAcceptHandler`. If a valid username is returned, the system performs an `ACLGetUserByName` lookup and sets the user context for the client.
- **Security Check:** If the authentication fails, `addACLLogEntry` records the invalid attempt, providing observability into potential security misconfigurations.

Sources: [src/networking.c:1618-1631](https://github.com/redis/redis/blob/main/src/networking.c#L1618-L1631)

## Data Flow in Secure Connections
Because the networking code operates on a `connection` object, the data flow remains identical for TLS and plaintext. The `writeToClient` function consumes the output buffer and delegates to the connection handler, which handles the actual transmission (and encryption, if TLS is active).

- **Flow:** `writeToClient` → `_writeToClientNonSlave` → `connWrite` (via the connection abstraction).
- **Design Trade-offs:** The system uses buffered writes to minimize the number of encryption calls (and the associated CPU overhead). This reduces latency for high-throughput clients.

| Design Choice | Benefit | Cost |
| :--- | :--- | :--- |
| **Abstractions** | Transport-agnostic logic | Indirect call overhead |
| **Buffering** | Fewer encryption cycles | Increased memory usage |
| **Event-loop** | Non-blocking handshakes | Complexity in state management |

Sources: [src/networking.c:2696-2727](https://github.com/redis/redis/blob/main/src/networking.c#L2696-L2727)

## Shutdown and Edge Cases
Handling TLS connections during shutdown requires caution, especially when a bgsave fork is present. The `unlinkClient` function must decide whether to use a system-level `shutdown` (for raw file descriptors) or a connection-layer shutdown (which properly closes TLS-aware connections).

> [!CAUTION]
> If the client is associated with a replication RDB channel, the fork may be writing to the connection. Using the standard connection shutdown may be dangerous because the TLS state in the parent process might be stale or conflicting with the child's activity. The code explicitly checks `CLIENT_REPL_RDB_CHANNEL` to prevent calling into the TLS-aware shutdown if it is unsafe.

Sources: [src/networking.c:1913-1922](https://github.com/redis/redis/blob/main/src/networking.c#L1913-L1922)

## Performance Considerations
For TLS connections, the encryption and decryption overhead is non-trivial. The networking layer attempts to mitigate this by batching output buffers into `clientReplyBlock` nodes.

1. **Memory Tracking:** The system monitors shared memory usage to avoid unnecessary copies (copy avoidance).
2. **Batching:** `handleClientsWithPendingWrites` tries to write directly to the socket before entering the main loop, reducing latency for high-throughput clients.
3. **Threading:** IO threads can offload write operations, further decoupling TLS encryption from the main command-processing logic.

Sources: [src/networking.c:1273-1305](https://github.com/redis/redis/blob/main/src/networking.c#L1273-L1305), [src/networking.c:2897-2940](https://github.com/redis/redis/blob/main/src/networking.c#L2897-L2940)

## Security Invariants
The system maintains strict invariants regarding client authentication:

> [!NOTE]
> Even if TLS provides a transport-level identity, `authRequired(c)` remains the final authority on whether a client can execute commands, ensuring consistency between certificate-based and password-based authentication.

Sources: [src/networking.c:111-120](https://github.com/redis/redis/blob/main/src/networking.c#L111-L120)