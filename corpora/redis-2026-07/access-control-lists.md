# Access Control Lists
<details>
<summary>Relevant source files</summary>

The following files were used as context for generating this wiki page:

- [src/acl.c](https://github.com/redis/redis/blob/main/src/acl.c)
- [redis.conf](https://github.com/redis/redis/blob/main/redis.conf)
</details>

Access Control Lists (ACLs) provide a robust, rule-based security framework that allows administrators to define fine-grained permissions for users connecting to the Redis server. Unlike traditional password-only authentication, the ACL system operates at the command level, permitting control over which commands a user can execute, which keys they can access, and which Pub/Sub channels they can interact with. This enables the principle of least privilege, ensuring that applications or users only have access to the specific resources they require.

At its core, the ACL subsystem manages user identities, where each user is assigned a set of credentials and permissions. When a client authenticates, it is associated with a specific user account. The server then evaluates each incoming command against the permissions assigned to that user. By supporting multiple selectors—nested rule sets within a user profile—the system provides a flexible way to compose complex authorization policies that are strictly enforced before command execution.

The ACL subsystem is deeply integrated into the command processing path and lifecycle management of the Redis server. It serves as a gatekeeper during the authentication phase (e.g., via `AUTH` or `HELLO` commands) and continues to function throughout the client's session. The subsystem is responsible not only for authorization but also for logging security violations and providing introspection tools, enabling administrators to audit access and detect potentially malicious activity through the ACL log.

## Global ACL State and Initialization

The ACL subsystem maintains global state through a set of core data structures, primarily housed in `src/acl.c`. The `Users` radix tree (`rax *Users`) acts as the primary registry, mapping usernames to their respective `user` structures. This implementation choice provides efficient lookup times for user credentials. The `DefaultUser` pointer provides a global reference for anonymous connections, which are authenticated against this account if no explicit authentication is provided.

Initialization is handled by `ACLInit()`, which initializes the `Users` radix tree and the default "default" user. Additionally, the system manages command categories via `ACLInitCommandCategories()`, which populates the `ACLCommandCategories` array using the `ACLDefaultCommandCategories` definitions. This structure allows the system to support category-based permissions like `+@admin` or `-@read`, simplifying rule management for the operator.

> [!IMPORTANT]
> The `commandId` mapping is a critical component for permission checks. Every command is assigned an integer ID using `ACLGetCommandID()`, which is used to index into the command bitmask. The system reserves the last bit (`USER_COMMAND_BITS_COUNT-1`) to identify if a user has "all commands" permissions, which ensures that future commands (e.g., loaded via modules) are correctly handled.

Sources: [src/acl.c:23-28](https://github.com/redis/redis/blob/main/src/acl.c#L23-L28), [src/acl.c:107-112](https://github.com/redis/redis/blob/main/src/acl.c#L107-L112), [src/acl.c:1430-1437](https://github.com/redis/redis/blob/main/src/acl.c#L1430-L1437), [src/acl.c:1557-1558](https://github.com/redis/redis/blob/main/src/acl.c#L1557-L1558)

## User and Selector Data Model

Users are represented by the `user` structure, which contains authentication information (a list of hashed passwords) and a list of `aclSelector` objects. A selector encapsulates a cohesive set of permissions. The system design relies on an initial "root selector" for every user, which maintains backwards compatibility with legacy Redis ACL behavior.

The `aclSelector` structure defines the actual authorization limits:
- `flags`: Contains bitwise indicators like `SELECTOR_FLAG_ALLKEYS` or `SELECTOR_FLAG_ALLCOMMANDS`.
- `allowed_commands`: A bitmask (an array of `uint64_t`) where each bit corresponds to a command's unique ID.
- `patterns` and `channels`: Lists of `keyPattern` or `sds` patterns used to validate resource access.

This separation between user flags and selector permission sets allows for complex logical compositions, where users can have multiple additive permission rules grouped into different selectors.

| Field | Type | Purpose |
| :--- | :--- | :--- |
| `flags` | `uint32_t` | Defines global selector behavior (e.g., `ALLKEYS`). |
| `allowed_commands` | `uint64_t[]` | Bitmap tracking permitted commands. |
| `patterns` | `list *` | Allowed key patterns. |
| `channels` | `list *` | Allowed Pub/Sub channel patterns. |

Sources: [src/acl.c:153-180](https://github.com/redis/redis/blob/main/src/acl.c#L153-L180), [src/acl.c:438-447](https://github.com/redis/redis/blob/main/src/acl.c#L438-L147)

## Authentication Flow

Authentication is mediated by the `ACLAuthenticateUser()` function, which acts as the entry point for client credentials. It first attempts module-based authentication and, if unhandled, proceeds to `checkPasswordBasedAuth()`.

The flow for password verification is:
1. `ACLCheckUserCredentials()` looks up the user by name.
2. It checks for the `USER_FLAG_DISABLED` bit; if set, the authentication is blocked.
3. If the user has `USER_FLAG_NOPASS`, authentication succeeds immediately.
4. Otherwise, the provided password is hashed via `ACLHashPassword()` and compared against the list of stored hashes using `time_independent_strcmp()` to prevent timing attacks.

> [!CAUTION]
> Using `time_independent_strcmp()` for password comparison is a critical security mechanism. By iterating through the entire length of the hash rather than returning upon the first byte mismatch, the implementation hides the exact position of a failure from potential attackers who monitor response latency.

Sources: [src/acl.c:200-206](https://github.com/redis/redis/blob/main/src/acl.c#L200-L206), [src/acl.c:1445-1479](https://github.com/redis/redis/blob/main/src/acl.c#L1445-L1479), [src/acl.c:1516-1523](https://github.com/redis/redis/blob/main/src/acl.c#L1516-L1523)

## Command Authorization Logic

When a client attempts to run a command, `ACLCheckAllPerm()` is called. This triggers a traversal through the user's list of selectors, invoking `ACLSelectorCheckCmd()` for each to determine if the operation is permitted.

**Authorization Call Path:**
`ACLCheckAllPerm()` → `ACLCheckAllUserCommandPerm()` → `ACLSelectorCheckCmd()` → `ACLSelectorCheckKey()` (for keys) or `ACLCheckChannelAgainstList()` (for Pub/Sub).

Within `ACLSelectorCheckCmd`, the system checks:
1. **Command Bitmask:** Is the command's ID bit set in `allowed_commands`?
2. **First-Argument Validation:** If the bit is not set, is there an explicit exception allowing this command with specific first-arguments (e.g., `+DEBUG|OBJECT`)?
3. **Resource Validation:** If command permissions are granted, are the referenced keys or channels compliant with the selector's pattern lists?

The tie-breaking logic is simple but effective: if any selector allows the operation, the command proceeds (`ACL_OK`). If multiple selectors are defined, they are treated as an OR-union of allowed permissions.

Sources: [src/acl.c:1698-1766](https://github.com/redis/redis/blob/main/src/acl.c#L1698-L1766), [src/acl.c:1857-1908](https://github.com/redis/redis/blob/main/src/acl.c#L1857-L1908), [src/acl.c:1911-1913](https://github.com/redis/redis/blob/main/src/acl.c#L1911-L1913)

## ACL Log Mechanism

The ACL Log, accessible via `ACL LOG`, records denied operations. When a check fails (e.g., `ACL_DENIED_CMD`), `addACLLogEntry()` is invoked. This function groups similar violations (e.g., same reason, object, and user) within a 60-second window to prevent log flooding.

- **Similarity Matching:** `ACLLogMatchEntry()` compares `reason`, `context`, `object`, and `username` of the new event against existing log entries.
- **Entry Update:** If a match is found, the count is incremented, and the timestamp (`ctime`) and client info (`cinfo`) are updated.
- **Limit Enforcement:** `trimACLLogEntriesToMaxLen()` ensures that the log does not exceed the configured `acllog-max-len`.

Sources: [src/acl.c:2639-2648](https://github.com/redis/redis/blob/main/src/acl.c#L2639-L2648), [src/acl.c:2700-2773](https://github.com/redis/redis/blob/main/src/acl.c#L2700-L2773)

## Design Trade-offs

| Design Choice | Benefit | Cost |
| :--- | :--- | :--- |
| **Bitmap for Command IDs** | Extremely fast `O(1)` bitmask checks. | Rigid command mapping; requires ID-reassignment logic. |
| **Radix Tree for User Lookup** | Efficient memory usage and fast lookups. | Adds complexity compared to simple linked lists. |
| **Selector Multiplicity** | Allows granular, additive policy composition. | Increases complexity of permission evaluation loops. |
| **`time_independent_strcmp`** | Mitigates timing-based brute force attacks. | Forces full string traversal; slightly slower than early-exit `strcmp`. |

Sources: [src/acl.c:23](https://github.com/redis/redis/blob/main/src/acl.c#L23), [src/acl.c:161](https://github.com/redis/redis/blob/main/src/acl.c#L161), [src/acl.c:200-206](https://github.com/redis/redis/blob/main/src/acl.c#L200-L206)

## Full Worked Example: Adding a User

To add a new user named `deploy` who can only perform read operations on specific keys, you would use the `ACL SETUSER` command.

```c
// Internal C equivalent logic for "ACL SETUSER deploy on >password123 ~jobs:* -@all +get +ping"
user *u = ACLCreateUser("deploy", 6);
ACLSetUser(u, "on", -1);
ACLSetUser(u, ">password123", -1);
ACLSetUser(u, "~jobs:*", -1);
ACLSetUser(u, "-@all", -1);
ACLSetUser(u, "+get", -1);
ACLSetUser(u, "+ping", -1);
```

This example creates a user, sets the enabled flag, adds a hashed password, restricts keyspace access to `jobs:*`, and builds a specific command set starting from an empty state (`-@all`) and adding permitted commands.

Sources: [src/acl.c:427-448](https://github.com/redis/redis/blob/main/src/acl.c#L427-L448), [src/acl.c:1288-1384](https://github.com/redis/redis/blob/main/src/acl.c#L1288-L1384)