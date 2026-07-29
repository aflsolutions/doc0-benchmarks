# CLI Local Config

<details>
<summary>Relevant source files</summary>

The following files were used as context for generating this wiki page:

- [cmd/argocd/commands/root.go](https://github.com/argoproj/argo-cd/blob/main/cmd/argocd/commands/root.go)
- [docs/operator-manual/user-management/index.md](https://github.com/argoproj/argo-cd/blob/main/docs/operator-manual/user-management/index.md)
- [cmd/argocd/commands/login.go](https://github.com/argoproj/argo-cd/blob/main/cmd/argocd/commands/login.go)
- [cmd/argocd/commands/account.go](https://github.com/argoproj/argo-cd/blob/main/cmd/argocd/commands/account.go)
- [cmd/argocd/commands/admin/cluster.go](https://github.com/argoproj/argo-cd/blob/main/cmd/argocd/commands/admin/cluster.go)
- [util/localconfig/localconfig.go](https://github.com/argoproj/argo-cd/blob/main/util/localconfig/localconfig.go)
- [cmd/argocd/commands/relogin.go](https://github.com/argoproj/argo-cd/blob/main/cmd/argocd/commands/relogin.go)
- [cmd/argocd/commands/context.go](https://github.com/argoproj/argo-cd/blob/main/cmd/argocd/commands/context.go)
- [docs/operator-manual/security.md](https://github.com/argoproj/argo-cd/blob/main/docs/operator-manual/security.md)
- [docs/user-guide/commands/argocd_account_session-token.md](https://github.com/argoproj/argo-cd/blob/main/docs/user-guide/commands/argocd_account_session-token.md)
- [cmd/argocd/commands/logout.go](https://github.com/argoproj/argo-cd/blob/main/cmd/argocd/commands/logout.go)
- [docs/user-guide/commands/argocd_configure.md](https://github.com/argoproj/argo-cd/blob/main/docs/user-guide/commands/argocd_configure.md)
- [pkg/apiclient/apiclient.go](https://github.com/argoproj/argo-cd/blob/main/pkg/apiclient/apiclient.go)
- [util/settings/settings.go](https://github.com/argoproj/argo-cd/blob/main/util/settings/settings.go)
</details>

## Overview

The Argo CD CLI local configuration mechanism manages persistent client-side settings, authentication tokens, server connection profiles, and multi-environment targeting within local files. Stored by default at `~/.argo/config` or via XDG configuration paths, this configuration file enables seamless switching between distinct Argo CD instances and user accounts without requiring manual re-authentication for every command execution.
Sources: [util/localconfig/localconfig.go:270-315](https://github.com/argoproj/argo-cd/blob/main/util/localconfig/localconfig.go#L270-L315)

By serializing server descriptors, user credentials, and context references into structured YAML documents, the local configuration client establishes a robust state store that supports automated API integration, credential refresh workflows, and interactive session maintenance. Adjacent components such as the API client package leverage these local parameters to initialize secure gRPC and HTTP connections, while identity commands handle token persistence across login, relogin, and logout operations.
Sources: [util/localconfig/localconfig.go:15-29](https://github.com/argoproj/argo-cd/blob/main/util/localconfig/localconfig.go#L15-L29), [pkg/apiclient/apiclient.go:155-201](https://github.com/argoproj/argo-cd/blob/main/pkg/apiclient/apiclient.go#L155-L201)

## Config File Storage and Root Setup

### Overview

The Argo CD CLI local configuration system resolves its storage location through a prioritized directory lookup sequence before evaluating path overrides and persistent root flags. Default path resolution evaluates explicit environment variables, legacy dotdirectories, and XDG-compliant base paths to locate settings and cached authentication tokens.
Sources: [util/localconfig/localconfig.go:269-315](https://github.com/argoproj/argo-cd/blob/main/util/localconfig/localconfig.go#L269-L315)

Root CLI command initialization binds these resolved paths and connection properties directly to persistent cobra flags during application bootstrap. This ensures that every sub-command inherits uniform connection options, server targets, logging parameters, and proxy configurations.
Sources: [cmd/argocd/commands/root.go:23-104](https://github.com/argoproj/argo-cd/blob/main/cmd/argocd/commands/root.go#L23-L104)

### Path Resolution Call Chain

The execution path for determining the default local configuration file follows a strict sequence of checks across environment variables and filesystem locations:

`DefaultLocalConfigPath()` → `DefaultConfigDir()` → `getHomeDir()`

1. **`DefaultLocalConfigPath()`**: Calls `DefaultConfigDir()` to retrieve the root directory and appends the `config` filename.
Sources: [util/localconfig/localconfig.go:308-315](https://github.com/argoproj/argo-cd/blob/main/util/localconfig/localconfig.go#L308-L315)
2. **`DefaultConfigDir()`**: Executes the following branch evaluations in order:
   - Checks `ARGOCD_CONFIG_DIR` via `os.Getenv("ARGOCD_CONFIG_DIR")`. If non-empty, returns this directory immediately.
   Sources: [util/localconfig/localconfig.go:271-275](https://github.com/argoproj/argo-cd/blob/main/util/localconfig/localconfig.go#L271-L275)
   - Resolves the user home directory via `getHomeDir()`.
   Sources: [util/localconfig/localconfig.go:277-280](https://github.com/argoproj/argo-cd/blob/main/util/localconfig/localconfig.go#L277-L280)
   - Inspects the legacy directory path (`<home>/.argocd`) using `os.Stat`. If the legacy directory exists on disk, it takes precedence and is returned.
   Sources: [util/localconfig/localconfig.go:282-288](https://github.com/argoproj/argo-cd/blob/main/util/localconfig/localconfig.go#L282-L288)
   - Checks `XDG_CONFIG_HOME` via `os.Getenv("XDG_CONFIG_HOME")`. If present, returns `<XDG_CONFIG_HOME>/argocd`.
   Sources: [util/localconfig/localconfig.go:290-293](https://github.com/argoproj/argo-cd/blob/main/util/localconfig/localconfig.go#L290-L293)
   - Falls back to the default XDG path: `<home>/.config/argocd`.
   Sources: [util/localconfig/localconfig.go:295-297](https://github.com/argoproj/argo-cd/blob/main/util/localconfig/localconfig.go#L295-L297)
3. **`getHomeDir()`**: Invokes `os.UserHomeDir()` to retrieve the underlying operating system user home directory.
Sources: [util/localconfig/localconfig.go:299-306](https://github.com/argoproj/argo-cd/blob/main/util/localconfig/localconfig.go#L299-L306)

> [!NOTE]
> The legacy `.argocd` directory is only selected if it already exists on disk. If absent, path resolution prioritizes `ARGOCD_CONFIG_DIR`, `XDG_CONFIG_HOME`, and finally falls back to `~/.config/argocd/config`.
> Sources: [util/localconfig/localconfig.go:271-297](https://github.com/argoproj/argo-cd/blob/main/util/localconfig/localconfig.go#L271-L297)

### Root Command Flag Binding

During root command creation in `NewCommand()`, persistent flags are registered on the cobra command instance to expose local configuration overrides, authentication parameters, server connection options, and Kubernetes context mappings.
Sources: [cmd/argocd/commands/root.go:33-104](https://github.com/argoproj/argo-cd/blob/main/cmd/argocd/commands/root.go#L33-L104)

| Flag Name | Field Target | Default Value Source | Description |
| :--- | :--- | :--- | :--- |
| `--config` | `clientOpts.ConfigPath` | `localconfig.DefaultLocalConfigPath()` | Path to Argo CD config |
| `--server` | `clientOpts.ServerAddr` | `common.EnvServer` env var or `""` | Argo CD server address |
| `--plaintext` | `clientOpts.PlainText` | `config.GetBoolFlag("plaintext")` | Disable TLS |
| `--insecure` | `clientOpts.Insecure` | `config.GetBoolFlag("insecure")` | Skip server certificate and domain verification |
| `--auth-token` | `clientOpts.AuthToken` | `common.EnvAuthToken` env var or `""` | Authentication token |
| `--argocd-context` | `clientOpts.Context` | `""` | The name of the Argo-CD server context to use |
| `--prompts-enabled` | `clientOpts.PromptsEnabled` | `localconfig.GetPromptsEnabled(true)` | Force optional interactive prompts to be enabled or disabled |
| `--kube-context` | `clientOpts.KubeOverrides.CurrentContext` | `""` | Directs the command to the given kube-context |

Sources: [cmd/argocd/commands/root.go:72-102](https://github.com/argoproj/argo-cd/blob/main/cmd/argocd/commands/root.go#L72-L102)

## Local Config Structures and Serialization

### Overview

The local configuration structure defines how Argo CD serializes and represents user credentials, server endpoints, and active connection contexts within YAML-formatted configuration files. The root `LocalConfig` object acts as the primary container for all persistent CLI state, coordinating individual named entities across slices for servers, users, and context references.
Sources: [util/localconfig/localconfig.go:15-22](https://github.com/argoproj/argo-cd/blob/main/util/localconfig/localconfig.go#L15-L22)

### Data Structures and YAML Mappings

The configuration model maps directly to structured YAML through explicit JSON and YAML serialization tags. The core data models consist of `LocalConfig`, `ContextRef`, `Server`, and `User`.
Sources: [util/localconfig/localconfig.go:15-66](https://github.com/argoproj/argo-cd/blob/main/util/localconfig/localconfig.go#L15-L66)

| Struct Name | Field Name | YAML/JSON Tag | Type | Description |
| :--- | :--- | :--- | :--- | :--- |
| `LocalConfig` | `CurrentContext` | `current-context` | `string` | The active named context |
| `LocalConfig` | `Contexts` | `contexts` | `[]ContextRef` | Slice of defined context references |
| `LocalConfig` | `Servers` | `servers` | `[]Server` | Slice of configured Argo CD servers |
| `LocalConfig` | `Users` | `users` | `[]User` | Slice of authenticated user records |
| `LocalConfig` | `PromptsEnabled` | `prompts-enabled` | `bool` | Global prompt enablement flag |
| `ContextRef` | `Name` | `name` | `string` | Unique name of the context reference |
| `ContextRef` | `Server` | `server` | `string` | Target server identifier |
| `ContextRef` | `User` | `user` | `string` | Associated user identity |
| `Server` | `Server` | `server` | `string` | Server host address or URL |
| `Server` | `Insecure` | `insecure` | `bool` | Connect over TLS insecurely |
| `Server` | `GRPCWeb` | `grpc-web` | `bool` | Use gRPC Web protocol |
| `Server` | `GRPCWebRootPath` | `grpc-web-root-path` | `string` | Root path for gRPC Web |
| `Server` | `CACertificateAuthorityData` | `certificate-authority-data` | `string` | Base64-encoded PEM CA certificate |
| `Server` | `ClientCertificateData` | `client-certificate-data` | `string` | Base64-encoded PEM client certificate |
| `Server` | `ClientCertificateKeyData` | `client-certificate-key-data` | `string` | Base64-encoded PEM client private key |
| `Server` | `PlainText` | `plain-text` | `bool` | Connect with TLS disabled |
| `Server` | `Core` | `core` | `bool` | Talk directly to Kubernetes API without Argo CD API server |
| `User` | `Name` | `name` | `string` | Username or subject identifier |
| `User` | `AuthToken` | `auth-token` | `string` | Bearer authentication token |
| `User` | `RefreshToken` | `refresh-token` | `string` | OAuth2 refresh token |

Sources: [util/localconfig/localconfig.go:15-66](https://github.com/argoproj/argo-cd/blob/main/util/localconfig/localconfig.go#L15-L66)

> [!NOTE]
> Optional fields on the `Server` struct such as `insecure`, `grpc-web`, `certificate-authority-data`, `client-certificate-data`, `client-certificate-key-data`, and `plain-text` utilize the `omitempty` struct tag to keep serialized YAML documents clean when default values are omitted.
> Sources: [util/localconfig/localconfig.go:38-59](https://github.com/argoproj/argo-cd/blob/main/util/localconfig/localconfig.go#L38-L59)

### Serialization and Validation Flow

Reading, writing, and validating configuration files follow an explicit execution sequence that inspects permissions, unmarshals YAML, and validates resolved constraints.
Sources: [util/localconfig/localconfig.go:79-123](https://github.com/argoproj/argo-cd/blob/main/util/localconfig/localconfig.go#L79-L123)

The configuration lifecycle execution walkthrough proceeds through the following functions:

`ReadLocalConfig()` → `config.UnmarshalLocalFile()` → `ValidateLocalConfig()` → `ResolveContext()`

1. **`ReadLocalConfig(path)`**: Checks file permissions using `os.Stat` when the configuration file exists, then calls `config.UnmarshalLocalFile(path, &localconfig)`. If the file does not exist (`os.IsNotExist`), it returns `nil, nil`.
Sources: [util/localconfig/localconfig.go:79-95](https://github.com/argoproj/argo-cd/blob/main/util/localconfig/localconfig.go#L79-L95)
2. **Error Handling & Parsing**: If unmarshaling fails with a non-not-exist error, it returns a wrapped parsing error (`fmt.Errorf("failed to parse config file: %w", err)`).
Sources: [util/localconfig/localconfig.go:96-98](https://github.com/argoproj/argo-cd/blob/main/util/localconfig/localconfig.go#L96-L98)
3. **`ValidateLocalConfig(config)`**: Evaluates the parsed configuration struct. If `CurrentContext` is empty, validation succeeds immediately. Otherwise, it invokes `config.ResolveContext(config.CurrentContext)` to ensure the current context points to valid, defined server and user records.
Sources: [util/localconfig/localconfig.go:106-114](https://github.com/argoproj/argo-cd/blob/main/util/localconfig/localconfig.go#L106-L114)
4. **`WriteLocalConfig(localconfig, configPath)`**: Ensures parent directories exist using `os.MkdirAll(path.Dir(configPath), os.ModePerm)` before invoking `config.MarshalLocalYAMLFile(configPath, localconfig)` to persist the YAML structure.
Sources: [util/localconfig/localconfig.go:116-123](https://github.com/argoproj/argo-cd/blob/main/util/localconfig/localconfig.go#L116-L123)

> [!WARNING]
> `ValidateLocalConfig` allows an empty `CurrentContext` without error. However, if a `CurrentContext` is specified, an undefined underlying server or user reference will cause validation to fail with a wrapped error.
> Sources: [util/localconfig/localconfig.go:106-114](https://github.com/argoproj/argo-cd/blob/main/util/localconfig/localconfig.go#L106-L114)

## User Login and Token Persistence

### Overview

Managing user credentials and session persistence across the Argo CD CLI involves a coordinated sequence of authentication routines handled by `argocd login`, `argocd relogin`, and `argocd logout`. These commands acquire, refresh, and revoke bearer tokens and OAuth2 refresh tokens, persisting them directly into the local configuration file.
Sources: [cmd/argocd/commands/login.go:151-180](https://github.com/argoproj/argo-cd/blob/main/cmd/argocd/commands/login.go#L151-L180), [cmd/argocd/commands/relogin.go:86-94](https://github.com/argoproj/argo-cd/blob/main/cmd/argocd/commands/relogin.go#L86-L94), [cmd/argocd/commands/logout.go:90-101](https://github.com/argoproj/argo-cd/blob/main/cmd/argocd/commands/logout.go#L90-L101)

### Login and Token Acquisition Execution Walkthrough

The login process differs depending on whether credentials or Single Sign-On (SSO) are used. The call-chain execution walkthrough for `NewLoginCommand` proceeds through the following functions:

`NewLoginCommand()` → `grpc_util.TestTLS()` → `passwordLogin()` or `oauth2Login()` → `localconfig.UpsertServer()` → `localconfig.UpsertUser()` → `localconfig.UpsertContext()` → `localconfig.WriteLocalConfig()`

1. **`NewLoginCommand()`**: Parses target server arguments and validates TLS connectivity via `grpc_util.TestTLS(server, dialTime)`.
Sources: [cmd/argocd/commands/login.go:39-100](https://github.com/argoproj/argo-cd/blob/main/cmd/argocd/commands/login.go#L39-L100)
2. **`passwordLogin()` / `oauth2Login()`**: If `--sso` is omitted, `passwordLogin()` prompts for credentials and invokes `sessionIf.Create(ctx, &sessionRequest)` to receive a session token. If `--sso` is set, `oauth2Login()` initializes a temporary HTTP server, generates a PKCE code verifier and SHA-256 code challenge, opens the browser via `ssoAuthFlow()`, and exchanges the authorization code for an `id_token` and `refresh_token`.
Sources: [cmd/argocd/commands/login.go:133-142](https://github.com/argoproj/argo-cd/blob/main/cmd/argocd/commands/login.go#L133-L142), [cmd/argocd/commands/login.go:245-384](https://github.com/argoproj/argo-cd/blob/main/cmd/argocd/commands/login.go#L245-L384), [cmd/argocd/commands/login.go:363-374](https://github.com/argoproj/argo-cd/blob/main/cmd/argocd/commands/login.go#L363-L374)
3. **`UpsertServer()` / `UpsertUser()` / `UpsertContext()`**: Updates the local configuration store by upserting the server connection properties, token records (`AuthToken` and `RefreshToken`), and context reference.
Sources: [cmd/argocd/commands/login.go:157-178](https://github.com/argoproj/argo-cd/blob/main/cmd/argocd/commands/login.go#L157-L178)
4. **`localconfig.WriteLocalConfig()`**: Serializes the updated local configuration to disk at `clientOpts.ConfigPath`.
Sources: [cmd/argocd/commands/login.go:179-180](https://github.com/argoproj/argo-cd/blob/main/cmd/argocd/commands/login.go#L179-L180)

> [!NOTE]
> During OAuth2 login, `oauth2Login` generates a 24-character random state nonce and an RFC 7636 PKCE code verifier from the character set `ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~` to secure the authorization code exchange.
> Sources: [cmd/argocd/commands/login.go:235-252](https://github.com/argoproj/argo-cd/blob/main/cmd/argocd/commands/login.go#L235-L252)

### Relogin and Logout Operations

When tokens expire, `argocd relogin` reads the current context and inspects the token claims. If the issuer matches `session.SessionManagerClaimsIssuer`, it re-authenticates via `passwordLogin()`. Otherwise, it reinitiates the SSO login flow and updates the user's `AuthToken` and `RefreshToken` in the local config.
Sources: [cmd/argocd/commands/relogin.go:40-94](https://github.com/argoproj/argo-cd/blob/main/cmd/argocd/commands/relogin.go#L40-L94)

For cleanup and revocation, `argocd logout` prompts the user for confirmation, attempts to invalidate the token server-side via `revokeServerToken()`, removes the token from the local configuration using `localCfg.RemoveToken(context)`, and persists the result.
Sources: [cmd/argocd/commands/logout.go:37-103](https://github.com/argoproj/argo-cd/blob/main/cmd/argocd/commands/logout.go#L37-L103)

| Command Function | Target Action | Credential Types Handled | Local Config Modification |
| :--- | :--- | :--- | :--- |
| `passwordLogin` | Authenticates local accounts via gRPC session service | Username, Password | Upserts `AuthToken` |
| `oauth2Login` | Orchestrates local HTTP server and OIDC authorization code flow | OAuth2 ID Token, Refresh Token | Upserts `AuthToken`, `RefreshToken` |
| `NewReloginCommand` | Refreshes expired authentication tokens based on issuer claims | Session Manager claims or OIDC provider | Updates existing user `AuthToken` and `RefreshToken` |
| `revokeServerToken` | Calls server-side logout endpoint to invalidate session | Bearer token via HTTP Cookie (`argocd.token`) | Removes token via `RemoveToken(context)` |

Sources: [cmd/argocd/commands/login.go:207-374](https://github.com/argoproj/argo-cd/blob/main/cmd/argocd/commands/login.go#L207-L374), [cmd/argocd/commands/relogin.go:33-114](https://github.com/argoproj/argo-cd/blob/main/cmd/argocd/commands/relogin.go#L33-L114), [cmd/argocd/commands/logout.go:37-138](https://github.com/argoproj/argo-cd/blob/main/cmd/argocd/commands/logout.go#L37-L138)

> [!WARNING]
> If `revokeServerToken` fails to reach the server or returns an unexpected status code during `argocd logout`, the CLI logs a warning but proceeds to remove the token from the local configuration file anyway.
> Sources: [cmd/argocd/commands/logout.go:79-94](https://github.com/argoproj/argo-cd/blob/main/cmd/argocd/commands/logout.go#L79-L94)

## Context Resolution and Switching Mechanics

### Overview

The `argocd context` command (aliased as `argocd ctx`) manages target environment selections, listing configured contexts, deleting unused ones, and switching the active cluster target. Execution begins in `NewContextCommand`, which reads the local configuration via `localconfig.ReadLocalConfig(clientOpts.ConfigPath)` and branches based on whether the `--delete` flag is set or positional arguments are supplied.
Sources: [cmd/argocd/commands/context.go:19-41](https://github.com/argoproj/argo-cd/blob/main/cmd/argocd/commands/context.go#L19-L41)

### Context Listing and Resolution Mechanics

When invoked without arguments (`argocd context`), the command executes `printArgoCDContexts(clientOpts.ConfigPath)`. This routine initializes a tabular writer (`tabwriter.NewWriter`) with the columns `CURRENT`, `NAME`, and `SERVER`. It iterates over `localCfg.Contexts`, resolving each reference through `localCfg.ResolveContext(contextRef.Name)`. If resolution succeeds, it prefixes the active context (matching `localCfg.CurrentContext`) with an asterisk (`*`) and unselected contexts with a space, printing the resulting rows to standard output.
Sources: [cmd/argocd/commands/context.go:52-55](https://github.com/argoproj/argo-cd/blob/main/cmd/argocd/commands/context.go#L52-L55), [cmd/argocd/commands/context.go:121-145](https://github.com/argoproj/argo-cd/blob/main/cmd/argocd/commands/context.go#L121-L145)

```mermaid
flowchart TD
    A["argocd context [CONTEXT]"] --> B{"Deletion flag set?"}
    B -->|Yes| C{"Args provided?"}
    C -->|No| D["Display Help & Exit"]
    C -->|Yes| E["deleteContext()"]
    B -->|No| F{"Args empty?"}
    F -->|Yes| G["printArgoCDContexts()"]
    F -->|No| H{"ctxName == \"-\"?"}
    H -->|Yes| I["Read .prev-ctx file"]
    H -->|No| J["Verify and Resolve Context"]
    I --> J
    J --> K["Update CurrentContext & Write Config"]
    K --> L["Write Previous Context to .prev-ctx"]
```

Sources: [cmd/argocd/commands/context.go:20-84](https://github.com/argoproj/argo-cd/blob/main/cmd/argocd/commands/context.go#L20-L84)

### Switching Contexts and Previous Context Navigation

Passing a context name switches the active target. If the argument is `-`, the CLI reads the previous context name from the `.prev-ctx` file stored in the default configuration directory (`path.Join(argoCDDir, ".prev-ctx")`). The execution proceeds through validation checks:

1. `localCfg.CurrentContext == ctxName`: Reports that the CLI is already at the target context and returns early.
Sources: [cmd/argocd/commands/context.go:68-71](https://github.com/argoproj/argo-cd/blob/main/cmd/argocd/commands/context.go#L68-L71)
2. `localCfg.ResolveContext(ctxName)`: Validates that the context, its referenced server, and its user exist in the configuration store, logging a fatal error if undefined.
Sources: [cmd/argocd/commands/context.go:72-74](https://github.com/argoproj/argo-cd/blob/main/cmd/argocd/commands/context.go#L72-L74)
3. State persistence: Stores the old `CurrentContext` into `prev-ctx`, assigns `ctxName` to `localCfg.CurrentContext`, writes the configuration via `localconfig.WriteLocalConfig()`, and writes the previous context string with `0o644` permissions.
Sources: [cmd/argocd/commands/context.go:75-82](https://github.com/argoproj/argo-cd/blob/main/cmd/argocd/commands/context.go#L75-L82)

> [!NOTE]
> Resolving a context checks both the `Contexts` slice and dereferences the associated `Server` and `User` entities. If either lookup fails, `ResolveContext` returns an error (`Context 'X' undefined`, `Server 'Y' undefined`, or `User 'Z' undefined`).
> Sources: [util/localconfig/localconfig.go:133-160](https://github.com/argoproj/argo-cd/blob/main/util/localconfig/localconfig.go#L133-L160)

### Deleting Contexts

When invoked with `--delete [CONTEXT]`, execution delegates to `deleteContext(context, configPath)`. The function removes the context reference, user, and server definitions from the local config structure:

- `localCfg.RemoveContext(context)` extracts the associated server name and removes the entry from `Contexts`.
Sources: [cmd/argocd/commands/context.go:96-99](https://github.com/argoproj/argo-cd/blob/main/cmd/argocd/commands/context.go#L96-L99)
- `localCfg.RemoveUser(context)` and `localCfg.RemoveServer(serverName)` prune the matching user and server records.
Sources: [cmd/argocd/commands/context.go:100-101](https://github.com/argoproj/argo-cd/blob/main/cmd/argocd/commands/context.go#L100-L101)
- If `localCfg.IsEmpty()` evaluates to true (no servers remaining), the entire configuration file is deleted via `localconfig.DeleteLocalConfig(configPath)`. Otherwise, if the deleted context was the active one, `CurrentContext` is reset to empty string (`""`), validated via `localconfig.ValidateLocalConfig()`, and rewritten to disk.
Sources: [cmd/argocd/commands/context.go:103-116](https://github.com/argoproj/argo-cd/blob/main/cmd/argocd/commands/context.go#L103-L116)

> [!WARNING]
> Deleting the current context resets `CurrentContext` to an empty string in the configuration file rather than automatically promoting another context.
> Sources: [cmd/argocd/commands/context.go:107-109](https://github.com/argoproj/argo-cd/blob/main/cmd/argocd/commands/context.go#L107-L109)

## API Client Integration and Credentials

### API Client Initialization Walkthrough

The API client package initializes connection channels and transport configurations by consuming local configuration data and client options. The initialization follows an explicit sequence through named functions in `pkg/apiclient/apiclient.go`:

1. `NewClient(opts *ClientOptions)`: Reads local configuration via `localconfig.ReadLocalConfig(opts.ConfigPath)`, resolves the active context using `localCfg.ResolveContext(opts.Context)`, and populates client fields such as `ServerAddr`, `AuthToken`, `RefreshToken`, `CertPEMData`, and `ClientCert`.
Sources: [pkg/apiclient/apiclient.go:155-201](https://github.com/argoproj/argo-cd/blob/main/pkg/apiclient/apiclient.go#L155-L201)
2. Environment and Flag Overrides: Overrides server address with `EnvArgoCDServer` or `--port-forward` logic via `kube.PortForward`, and auth tokens with `EnvArgoCDAuthToken`.
Sources: [pkg/apiclient/apiclient.go:208-233](https://github.com/argoproj/argo-cd/blob/main/pkg/apiclient/apiclient.go#L208-L233)
3. Transport Configuration: Evaluates `opts.PlainText` and `opts.Insecure` flags, invokes `c.tlsConfig()` to build certificate pools and key pairs, and configures the HTTP client.
Sources: [pkg/apiclient/apiclient.go:253-282](https://github.com/argoproj/argo-cd/blob/main/pkg/apiclient/apiclient.go#L253-L282)
4. Protocol Fallback Check: If `c.GRPCWeb` is false, tests a gRPC connection against `NewVersionClient()`; upon failure, automatically sets `c.GRPCWeb = true`.
Sources: [pkg/apiclient/apiclient.go:283-307](https://github.com/argoproj/argo-cd/blob/main/pkg/apiclient/apiclient.go#L283-L307)
5. Token Validation and Refresh: Calls `c.refreshAuthToken(localCfg, ctxName, opts.ConfigPath)` to inspect token expiration and redeem fresh tokens if necessary.
Sources: [pkg/apiclient/apiclient.go:308-313](https://github.com/argoproj/argo-cd/blob/main/pkg/apiclient/apiclient.go#L308-L313), [pkg/apiclient/apiclient.go:394-436](https://github.com/argoproj/argo-cd/blob/main/pkg/apiclient/apiclient.go#L394-L436)

> [!NOTE]
> If port forwarding is enabled (`opts.PortForward`), `NewClient` forces `opts.ServerAddr` to `127.0.0.1:ort>` and forces `opts.Insecure = true` regardless of local config settings.
> Sources: [pkg/apiclient/apiclient.go:209-220](https://github.com/argoproj/argo-cd/blob/main/pkg/apiclient/apiclient.go#L209-L220)

### Token Refresh Workflows

When `refreshAuthToken` executes, it parses the existing authentication token using `jwt.NewParser(jwt.WithoutClaimsValidation())` without verifying signatures, extracting `jwt.RegisteredClaims`.
Sources: [pkg/apiclient/apiclient.go:403-408](https://github.com/argoproj/argo-cd/blob/main/pkg/apiclient/apiclient.go#L403-L408)

- If `jwt.NewValidator().Validate(claims)` returns `nil`, the token remains valid and no network call occurs.
Sources: [pkg/apiclient/apiclient.go:409-413](https://github.com/argoproj/argo-cd/blob/main/pkg/apiclient/apiclient.go#L409-L413)
- If expired, `c.redeemRefreshToken()` establishes a settings client, queries Argo CD settings via `setIf.Get()`, retrieves the OIDC configuration via `c.OIDCConfig()`, and executes an OAuth2 token exchange (`oauth2conf.TokenSource().Token()`).
Sources: [pkg/apiclient/apiclient.go:415-464](https://github.com/argoproj/argo-cd/blob/main/pkg/apiclient/apiclient.go#L415-L464)
- The newly acquired `id_token` and optional new `refresh_token` are written back to the local config file using `localCfg.UpsertUser()` and `localconfig.WriteLocalConfig()`.
Sources: [pkg/apiclient/apiclient.go:420-435](https://github.com/argoproj/argo-cd/blob/main/pkg/apiclient/apiclient.go#L420-L435)

### Client Options and Environment Reference

| Option Name | Environment Variable | Default Value | Description |
| :--- | :--- | :--- | :--- |
| `ServerAddr` | `ARGOCD_SERVER` | `""` | Target Argo CD API server address |
| `AuthToken` | `ARGOCD_AUTH_TOKEN` | `""` | Bearer authentication token for RPC requests |
| `PlainText` | — | `false` | Connect without TLS transport security |
| `Insecure` | — | `false` | Skip server certificate verification |
| `GRPCWeb` | — | `false` | Enable gRPC-web protocol framing |

Sources: [pkg/apiclient/apiclient.go:59-65](https://github.com/argoproj/argo-cd/blob/main/pkg/apiclient/apiclient.go#L59-L65), [pkg/apiclient/apiclient.go:106-132](https://github.com/argoproj/argo-cd/blob/main/pkg/apiclient/apiclient.go#L106-L132)

## Security Notes and User Management

### Overview

Local CLI configurations store authentication tokens in plaintext or clear formats on the local filesystem, meaning that securing the local config file is critical to preventing credential theft. Beyond local storage practices, cluster administrative setup and role-based access control govern how administrative tools interact with managed Kubernetes clusters.
Sources: [docs/operator-manual/user-management/index.md:8-13](https://github.com/argoproj/argo-cd/blob/main/docs/operator-manual/user-management/index.md#L8-L13), [cmd/argocd/commands/admin/cluster.go:43-71](https://github.com/argoproj/argo-cd/blob/main/cmd/argocd/commands/admin/cluster.go#L43-L71)

### Cluster Administrative Setup and Spec Generation

Administrators use the `argocd admin cluster` command tree to generate declarative cluster specifications, manage controller sharding, and inspect managed namespaces.
Sources: [cmd/argocd/commands/admin/cluster.go:43-71](https://github.com/argoproj/argo-cd/blob/main/cmd/argocd/commands/admin/cluster.go#L43-L71)

The `generate-spec` subcommand builds a declarative cluster configuration from a kubeconfig context by evaluating configuration options and generating or retrieving service account bearer tokens.
Sources: [cmd/argocd/commands/admin/cluster.go:589-618](https://github.com/argoproj/argo-cd/blob/main/cmd/argocd/commands/admin/cluster.go#L589-L618)

| Flag Name | Default Value | Description |
| :--- | :--- | :--- |
| `--bearer-token` | `""` | Authentication token that should be used to access Kubernetes API server |
| `--generate-bearer-token` | `false` | Generate authentication token that should be used to access Kubernetes API server |
| `--service-account` | `argocd-manager` | System namespace service account to use for Kubernetes resource management |
| `--system-namespace` | `argocd` | Use different system namespace |
| `--output`, `-o` | `yaml` | Output format. One of: json|yaml |

Sources: [cmd/argocd/commands/admin/cluster.go:716-724](https://github.com/argoproj/argo-cd/blob/main/cmd/argocd/commands/admin/cluster.go#L716-L724)

> [!WARNING]
> When generating cluster declarative specs using `--generate-bearer-token`, ensure that long-lived service account tokens are handled securely and rotated in accordance with cluster security policies.
> Sources: [cmd/argocd/commands/admin/cluster.go:674-678](https://github.com/argoproj/argo-cd/blob/main/cmd/argocd/commands/admin/cluster.go#L674-L678), [docs/operator-manual/security.md:126-152](https://github.com/argoproj/argo-cd/blob/main/docs/operator-manual/security.md#L126-L152)

### User Management and RBAC Configuration

Local users and accounts serve as automation tokens or provide access for small teams where SSO is unnecessary. When local users are created, they require explicit RBAC rules; otherwise, they fall back to the default policy specified by the `policy.default` field in the `argocd-rbac-cm` ConfigMap.
Sources: [docs/operator-manual/user-management/index.md:8-17](https://github.com/argoproj/argo-cd/blob/main/docs/operator-manual/user-management/index.md#L8-L17)

> [!IMPORTANT]
> The maximum length for a local account's username is 32 characters. Disabling the default `admin` user is strongly recommended as soon as alternative users or SSO integrations are established.
> Sources: [docs/operator-manual/user-management/index.md:18-80](https://github.com/argoproj/argo-cd/blob/main/docs/operator-manual/user-management/index.md#L18-L80)

## Related

- [[CLI Architecture]]
- [[User Sessions]]

