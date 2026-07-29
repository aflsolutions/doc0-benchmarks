# User Sessions

<details>
<summary>Relevant source files</summary>

The following files were used as context for generating this wiki page:

- [docs/operator-manual/user-management/index.md](https://github.com/argoproj/argo-cd/blob/main/docs/operator-manual/user-management/index.md)
- [docs/operator-manual/security.md](https://github.com/argoproj/argo-cd/blob/main/docs/operator-manual/security.md)
- [docs/security_considerations.md](https://github.com/argoproj/argo-cd/blob/main/docs/security_considerations.md)
- [server/server.go](https://github.com/argoproj/argo-cd/blob/main/server/server.go)
- [cmd/argocd/commands/account.go](https://github.com/argoproj/argo-cd/blob/main/cmd/argocd/commands/account.go)
- [util/session/sessionmanager.go](https://github.com/argoproj/argo-cd/blob/main/util/session/sessionmanager.go)
- [cmd/argocd/commands/login.go](https://github.com/argoproj/argo-cd/blob/main/cmd/argocd/commands/login.go)
- [docs/getting_started.md](https://github.com/argoproj/argo-cd/blob/main/docs/getting_started.md)
- [docs/developer-guide/architecture/authz-authn.md](https://github.com/argoproj/argo-cd/blob/main/docs/developer-guide/architecture/authz-authn.md)
</details>

## Overview

User sessions in Argo CD govern the complete lifecycle of authentication and authorization for both human operators and automated clients interacting with the API server. By relying exclusively on JSON Web Tokens (JWTs) issued either locally for built-in accounts or delegated through external OpenID Connect (OIDC) identity providers like Dex, the system ensures secure stateless communication. Managing user identities correctly is critical to prevent vulnerabilities such as session fixation, unauthorized token reuse, and brute-force attacks against administrative endpoints. The session architecture seamlessly integrates server-side authentication interceptors, client-side configuration persistence, robust rate-limiting safeguards, and comprehensive token revocation mechanisms to protect multi-tenant GitOps environments against compromise.

Sources: [docs/operator-manual/user-management/index.md:8-13](https://github.com/argoproj/argo-cd/blob/main/docs/operator-manual/user-management/index.md#L8-L13), [docs/operator-manual/security.md:7-29](https://github.com/argoproj/argo-cd/blob/main/docs/operator-manual/security.md#L7-L29), [util/session/sessionmanager.go:41-52](https://github.com/argoproj/argo-cd/blob/main/util/session/sessionmanager.go#L41-L52)

## Authentication Architecture and Server Middleware

### Overview

The Argo CD API server initializes its core routing and security middleware inside `NewServer` and `newGRPCServer` within `server/server.go`. Incoming client requests reach the server over gRPC, gRPC-Web, or REST via `grpc-gateway`, where server-side interceptors enforce authentication before requests dispatch to individual service handlers.

Sources: [server/server.go:313-428](https://github.com/argoproj/argo-cd/blob/main/server/server.go#L313-L428), [server/server.go:915-1009](https://github.com/argoproj/argo-cd/blob/main/server/server.go#L915-L1009)

### Authentication Interceptors and Call Chain

When a gRPC or gRPC-Gateway request arrives, the server executes a chained sequence of unary and stream interceptors configured via `grpc.ChainUnaryInterceptor` and `grpc.ChainStreamInterceptor`. The authentication flow proceeds through specific validation functions:

`server.Authenticate()` → `server.getClaims()` → `server.sessionMgr.VerifyToken()` → `server.ssoClientApp.CheckAndRefreshToken()`

If authentication succeeds, verified claims are injected into the request context under the `"claims"` key. If token verification fails and the anonymous user is enabled in ArgoCD settings, context claims fall back to an empty string.

Sources: [server/server.go:960-984](https://github.com/argoproj/argo-cd/blob/main/server/server.go#L960-L984), [server/server.go:1548-1587](https://github.com/argoproj/argo-cd/blob/main/server/server.go#L1548-L1587), [server/server.go:1590-1651](https://github.com/argoproj/argo-cd/blob/main/server/server.go#L1590-L1651)

> [!WARNING]
> If `DisableAuth` is set to `true` on the server options, `Authenticate` immediately returns the unmodified context without executing claims extraction or token verification, bypassing all gRPC-level authentication checks.
> 
> Sources: [server/server.go:1552-1554](https://github.com/argoproj/argo-cd/blob/main/server/server.go#L1552-L1554)

### Token Extraction Mechanisms

The `getToken` function parses incoming metadata to locate user sessions in a prioritized order. It inspects metadata keys and HTTP headers before falling back to cookie parsing.

| Priority | Source Mechanism | Header / Key Identifier | Notes |
|----------|-----------------|-------------------------|-------|
| 1 | gRPC Metadata Token | `apiclient.MetaDataTokenKey` (`token`) | Direct metadata field injection |
| 2 | Authorization Header | `authorization` (`Bearer <token>`) | Prefixed with `Bearer `, validated via `jwtutil.IsValid` |
| 3 | Cookie Header | `grpcgateway-cookie` (`argocd.token`) | Parsed using `httputil.JoinCookies` |

Sources: [server/server.go:1653-1684](https://github.com/argoproj/argo-cd/blob/main/server/server.go#L1653-L1684)

## Session Manager and Token Verification

### Overview

The `SessionManager` struct acts as the core controller for token generation, local and IDP token verification, and token revocation. It coordinates with the `SettingsManager`, an HTTP client for fetching OpenID Connect provider details, and user state storage to validate active sessions and enforce security constraints.

Sources: [util/session/sessionmanager.go:41-52](https://github.com/argoproj/argo-cd/blob/main/util/session/sessionmanager.go#L41-L52), [util/session/sessionmanager.go:130-170](https://github.com/argoproj/argo-cd/blob/main/util/session/sessionmanager.go#L130-L170)

### Token Verification Call Chain

When an incoming request requires token validation, `SessionManager.VerifyToken` inspects the token's claims without verification first to determine its issuer. The verification execution path follows a branching sequence based on whether the token was signed locally by Argo CD or externally by an IDP:

`VerifyToken()` → `parser.ParseUnverified()` → check `iss` claim → (`SessionManagerClaimsIssuer` ? `mgr.Parse()` : `mgr.provider()` → `prov.Verify()` → `mgr.storage.IsTokenRevoked()`)

For locally issued tokens, `mgr.Parse()` enforces algorithm checks, validates issued-at time and expiration, checks account enablement and capabilities, verifies that the unique `jti` identifier is present and unrevoked, and confirms that the account password modification time (`PasswordMtime`) precedes the token's issue time.

Sources: [util/session/sessionmanager.go:232-319](https://github.com/argoproj/argo-cd/blob/main/util/session/sessionmanager.go#L232-L319), [util/session/sessionmanager.go:555-624](https://github.com/argoproj/argo-cd/blob/main/util/session/sessionmanager.go#L555-L624)

> [!NOTE]
> When verifying external IDP tokens, if the OIDC provider does not emit the standard `jti` claim (such as Microsoft Entra ID), `tokenUniqueID` falls back to the `uti` claim. For Dex tokens lacking both, it falls back to the `AccessTokenHash` property of the `idToken`.
> 
> Sources: [util/session/sessionmanager.go:604-612](https://github.com/argoproj/argo-cd/blob/main/util/session/sessionmanager.go#L604-L612), [util/session/sessionmanager.go:626-636](https://github.com/argoproj/argo-cd/blob/main/util/session/sessionmanager.go#L626-L636)

### Session Constants and Configuration

The session management subsystem relies on several hardcoded constants and environment controls defined in `util/session/sessionmanager.go`:

| Constant / Variable | Value / Default | Purpose |
|---------------------|-----------------|---------|
| `SessionManagerClaimsIssuer` | `"argocd"` | Fills the `"iss"` field of locally generated JWT tokens. |
| `autoRegenerateTokenDuration` | `5 * time.Minute` | Remaining token lifespan threshold triggering automatic token regeneration during local parsing. |
| `maxUsernameLength` | `32` | Maximum allowed length in bytes for local usernames to keep cache memory usage low. |
| `envLoginMaxCacheSize` | `"ARGOCD_SESSION_MAX_CACHE_SIZE"` (default: `10000`) | Environment variable controlling the maximum number of stored login attempt entries. |
| `envLoginMaxFailCount` | `"ARGOCD_SESSION_FAILURE_MAX_FAIL_COUNT"` (default: `5`) | Environment variable controlling the maximum failed attempts before login delays apply. |
| `envLoginFailureWindowSeconds` | `"ARGOCD_SESSION_FAILURE_WINDOW_SECONDS"` (default: `300`) | Environment variable defining the time window in seconds for tracking login failures. |

Sources: [util/session/sessionmanager.go:66-104](https://github.com/argoproj/argo-cd/blob/main/util/session/sessionmanager.go#L66-L104)

### Token Revocation Operations

Token revocation relies on the underlying `UserStateStorage` interface accessed through `SessionManager`. Tokens are explicitly invalidated by passing their unique identifier along with an expiration duration to the storage backend:

```go
func (mgr *SessionManager) RevokeToken(ctx context.Context, id string, expiringAt time.Duration) error {
	return mgr.storage.RevokeToken(ctx, id, expiringAt)
}
```

During token parsing and verification (`Parse` and `VerifyToken`), `mgr.storage.IsTokenRevoked(id)` is called to reject any session whose `jti` or equivalent unique identifier has been revoked.

Sources: [util/session/sessionmanager.go:293-294](https://github.com/argoproj/argo-cd/blob/main/util/session/sessionmanager.go#L293-L294), [util/session/sessionmanager.go:613-615](https://github.com/argoproj/argo-cd/blob/main/util/session/sessionmanager.go#L613-L615), [util/session/sessionmanager.go:653-655](https://github.com/argoproj/argo-cd/blob/main/util/session/sessionmanager.go#L653-L655)

## CLI Login Workflows and Context Storage

### Overview
The `argocd login` CLI command handles user authentication against an Argo CD server through either direct password credentials or single sign-on (SSO) mechanisms. It supports establishing connections via standard server addresses, port-forwarding, or the Kubernetes API server (`--core`), validating TLS configurations, performing authentication exchanges, and persisting the resulting session configuration locally.

Sources: [cmd/argocd/commands/login.go:38-100](https://github.com/argoproj/argo-cd/blob/main/cmd/argocd/commands/login.go#L38-L100), [cmd/argocd/commands/login.go:151-182](https://github.com/argoproj/argo-cd/blob/main/cmd/argocd/commands/login.go#L151-L182)

### CLI Flags and Options Reference

The login command exposes several configuration flags via Cobra to customize connection behavior, SSO execution, and local context naming:

| Flag Name | Default Value | Purpose |
|-----------|---------------|---------|
| `--name` | `""` | Name to use for the created local context. |
| `--username` | `""` | The username of an account to authenticate with. |
| `--password` | `""` | The password of an account to authenticate with. |
| `--sso` | `false` | Perform SSO login flow. |
| `--sso-port` | `DefaultSSOLocalPort` | Port to run the temporary OAuth2 local callback server. |
| `--callback` | `""` | Scheme, Host, and Port for the custom callback URL. |
| `--skip-test-tls` | `false` | Skip TLS verification checks during server connection. |
| `--sso-launch-browser` | `true` | Automatically launch the system default browser for SSO login. |

Sources: [cmd/argocd/commands/login.go:40-49](https://github.com/argoproj/argo-cd/blob/main/cmd/argocd/commands/login.go#L40-L49), [cmd/argocd/commands/login.go:184-193](https://github.com/argoproj/argo-cd/blob/main/cmd/argocd/commands/login.go#L184-L193)

### Authentication Execution Workflows

#### Password Authentication Call Chain

For standard username and password authentication, the CLI prompts for credentials if necessary and interacts with the session API client:

`passwordLogin()` → `cli.PromptCredentials()` → `acdClient.NewSessionClientOrDie()` → `sessionIf.Create()` → returns `createdSession.Token`.

Sources: [cmd/argocd/commands/login.go:363-374](https://github.com/argoproj/argo-cd/blob/main/cmd/argocd/commands/login.go#L363-L374)

#### OAuth2/SSO Login Call Chain

When `--sso` is enabled, the CLI sets up PKCE parameters, starts a temporary HTTP callback handler, and launches the browser or prints the authorization URL:

`oauth2Login()` → `rand.String(24)` (state nonce) → `rand.StringFromCharset()` (PKCE code verifier & S256 hash/challenge) → `http.HandleFunc("/auth/callback", callbackHandler)` → `oidcutil.InferGrantType()` → `oauth2conf.AuthCodeURL()` / `oidcutil.ImplicitFlowURL()` → `ssoAuthFlow()` → `srv.ListenAndServe()` → `oauth2conf.Exchange()` (for auth code flow) → `srv.Shutdown()`.

Sources: [cmd/argocd/commands/login.go:207-361](https://github.com/argoproj/argo-cd/blob/main/cmd/argocd/commands/login.go#L207-L361)

> [!CAUTION]
> The temporary callback handler enforces a strict redirect limit via `handledRequests`. If more than 2 requests hit `/auth/callback`, the handler aborts with a redirect loop error to prevent hanging or infinite redirection loops during implicit or authorization code flows.
> 
> Sources: [cmd/argocd/commands/login.go:264-270](https://github.com/argoproj/argo-cd/blob/main/cmd/argocd/commands/login.go#L264-L270)

### Local Configuration Persistence

Upon successful authentication, the token is parsed unverified to extract claims for the user display name. The configuration is then written to the local config file via `localconfig`:

1. `localconfig.ReadLocalConfig()` reads or initializes the local configuration structure.
2. `localCfg.UpsertServer()` updates server parameters (`Server`, `PlainText`, `Insecure`, `GRPCWeb`, `GRPCWebRootPath`, `Core`).
3. `localCfg.UpsertUser()` stores the `Name`, `AuthToken`, and `RefreshToken`.
4. `localCfg.UpsertContext()` registers the context linking the user name and server address, setting it as `CurrentContext`.
5. `localconfig.WriteLocalConfig()` persists the updated configuration to disk.

Sources: [cmd/argocd/commands/login.go:144-182](https://github.com/argoproj/argo-cd/blob/main/cmd/argocd/commands/login.go#L144-L182)

## Local Account Passwords and Token Generation

### Overview

Local accounts and tokens in Argo CD are managed via dedicated CLI commands under `argocd account`. These commands handle updating account passwords, generating and deleting persistent API tokens, inspecting account details and permissions, and outputting active session tokens.

Sources: [cmd/argocd/commands/account.go:36-68](https://github.com/argoproj/argo-cd/blob/main/cmd/argocd/commands/account.go#L36-L68)

### Account Command Reference

The `account` command set exposes several subcommands for user and token administration:

| Command | Short Description | Key Flags |
|---|---|---|
| `update-password` | Update an account's password | `--account`, `--current-password`, `--new-password` |
| `get-user-info` (`whoami`) | Get user info | `--output` (`yaml`, `json`) |
| `can-i` | Check user RBAC permissions for an action | None (positional arguments: `ACTION RESOURCE SUBRESOURCE`) |
| `list` | List accounts | `--output` (`json`, `yaml`, `wide`, `name`) |
| `get` | Get account details | `--account`, `--output` (`json`, `yaml`, `wide`, `name`) |
| `generate-token` | Generate account token | `--account`, `--expires-in`, `--id` |
| `delete-token` | Deletes account token | `--account` |
| `session-token` | Display current session token | `--output` (`json`) |

Sources: [cmd/argocd/commands/account.go:76-539](https://github.com/argoproj/argo-cd/blob/main/cmd/argocd/commands/account.go#L76-L539)

### Password Updates and Local Config Re-authentication

#### Password Update Call Chain

`NewAccountUpdatePasswordCommand()` execution flow follows these steps:

`getCurrentAccount()` → checks if issuer matches `sessionutil.SessionManagerClaimsIssuer` → prompts for `currentPassword` via `term.ReadPassword()` if empty → prompts for `newPassword` via `cli.ReadAndConfirmPassword()` → `usrIf.UpdatePassword()` → if updating own account, invokes `passwordLogin()` to acquire a fresh JWT token → updates the local configuration file via `localCfg.UpsertUser()` and `localconfig.WriteLocalConfig()`.

Sources: [cmd/argocd/commands/account.go:91-149](https://github.com/argoproj/argo-cd/blob/main/cmd/argocd/commands/account.go#L91-L149)

> [!NOTE]
> When a local user updates their own password, the CLI automatically performs a re-authentication login behind the scenes to seamlessly refresh the active `AuthToken` stored in the local configuration file.
> 
> Sources: [cmd/argocd/commands/account.go:132-148](https://github.com/argoproj/argo-cd/blob/main/cmd/argocd/commands/account.go#L132-L148)

### Token Generation and Management

Persistent account tokens are generated and revoked using `generate-token` and `delete-token`. 

The `generate-token` command accepts an optional expiration duration (`--expires-in`, defaulting to `"0s"` for no expiration) and an optional token identifier (`--id`, which falls back to a UUID if omitted). 

Sources: [cmd/argocd/commands/account.go:376-414](https://github.com/argoproj/argo-cd/blob/main/cmd/argocd/commands/account.go#L376-L414)

The `delete-token` command prompts the user for confirmation via `utils.NewPrompt()` before invoking the account service client to remove the token by ID.

Sources: [cmd/argocd/commands/account.go:416-453](https://github.com/argoproj/argo-cd/blob/main/cmd/argocd/commands/account.go#L416-L453)

## Rate Limiting and Session Security Controls

### Overview

Argo CD implements robust rate-limiting and session security mechanisms to defend local accounts against password brute-forcing, credential stuffing, and automated login abuse. These protections track consecutive login failures across configurable time windows and throttle concurrent request surges against the authentication endpoints.

Sources: [docs/operator-manual/user-management/index.md:111-113](https://github.com/argoproj/argo-cd/blob/main/docs/operator-manual/user-management/index.md#L111-L113)

### Configuration Controls

Operators can configure throttling and failure tracking behavior using specific environment variables.

| Environment Variable | Default Value | Purpose |
|---|---|---|
| `ARGOCD_SESSION_FAILURE_MAX_FAIL_COUNT` | `5` | Maximum number of failed logins before Argo CD starts rejecting login attempts. |
| `ARGOCD_SESSION_FAILURE_WINDOW_SECONDS` | `300` | Number of seconds for the failure window (5 minutes). Set to `0` to disable the time window and enforce rejection after 10 consecutive failures regardless of time frame. |
| `ARGOCD_SESSION_MAX_CACHE_SIZE` | `1000` | Maximum number of entries allowed in the failure tracking cache. |
| `ARGOCD_MAX_CONCURRENT_LOGIN_REQUESTS_COUNT` | `50` | Limits the maximum number of concurrent login requests. Set to `0` to disable the limit. |

Sources: [docs/operator-manual/user-management/index.md:114-129](https://github.com/argoproj/argo-cd/blob/main/docs/operator-manual/user-management/index.md#L114-L129)

> [!WARNING]
> Setting `ARGOCD_SESSION_FAILURE_WINDOW_SECONDS` to `0` changes failure tracking to rely entirely on consecutive counts rather than a rolling time window, requiring 10 consecutive login failures before rejection activates.
> 
> Sources: [docs/operator-manual/user-management/index.md:119-122](https://github.com/argoproj/argo-cd/blob/main/docs/operator-manual/user-management/index.md#L119-L122)

## Related

- [[OIDC and Dex Integration]]
- [[RBAC Policy Enforcement]]

