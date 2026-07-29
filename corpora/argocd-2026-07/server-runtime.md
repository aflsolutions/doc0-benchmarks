# Server Runtime

<details>
<summary>Relevant source files</summary>

The following files were used as context for generating this wiki page:

- [cmd/argocd-server/commands/argocd_server.go](https://github.com/argoproj/argo-cd/blob/main/cmd/argocd-server/commands/argocd_server.go)
- [cmd/argocd-repo-server/commands/argocd_repo_server.go](https://github.com/argoproj/argo-cd/blob/main/cmd/argocd-repo-server/commands/argocd_repo_server.go)
- [server/server.go](https://github.com/argoproj/argo-cd/blob/main/server/server.go)
- [cmd/argocd-application-controller/commands/argocd_application_controller.go](https://github.com/argoproj/argo-cd/blob/main/cmd/argocd-application-controller/commands/argocd_application_controller.go)
- [cmd/argocd/commands/root.go](https://github.com/argoproj/argo-cd/blob/main/cmd/argocd/commands/root.go)
- [docs/operator-manual/server-commands/argocd-server.md](https://github.com/argoproj/argo-cd/blob/main/docs/operator-manual/server-commands/argocd-server.md)
- [docs/developer-guide/architecture/authz-authn.md](https://github.com/argoproj/argo-cd/blob/main/docs/developer-guide/architecture/authz-authn.md)
- [cmd/argocd-commit-server/commands/argocd_commit_server.go](https://github.com/argoproj/argo-cd/blob/main/cmd/argocd-commit-server/commands/argocd_commit_server.go)
- [manifests/base/server/argocd-server-deployment.yaml](https://github.com/argoproj/argo-cd/blob/main/manifests/base/server/argocd-server-deployment.yaml)
- [cmd/argocd/commands/headless/headless.go](https://github.com/argoproj/argo-cd/blob/main/cmd/argocd/commands/headless/headless.go)
- [cmpserver/server.go](https://github.com/argoproj/argo-cd/blob/main/cmpserver/server.go)
</details>

## Overview

The Server Runtime forms the backbone of Argo CD's user-facing and internal control plane, providing the executable machinery that powers the API server (`argocd-server`) and repository server (`argocd-repo-server`) components. It orchestrates command-line flag parsing, environment-based configuration, subsystem initialization, and robust lifecycle management including graceful shutdown handling.

Sources: [cmd/argocd-server/commands/argocd_server.go:56-115](https://github.com/argoproj/argo-cd/blob/main/cmd/argocd-server/commands/argocd_server.go#L56-L115), [cmd/argocd-repo-server/commands/argocd_repo_server.go:55-93](https://github.com/argoproj/argo-cd/blob/main/cmd/argocd-repo-server/commands/argocd_repo_server.go#L55-L93)

Designed to handle multiplexed networking, security enforcement, and high-performance RPC and REST routing, the runtime bridges client interfaces—such as the Web UI, CLI, and external CI/CD systems—with core Kubernetes controllers and Git repository services.

Sources: [server/server.go:186-221](https://github.com/argoproj/argo-cd/blob/main/server/server.go#L186-L221), [docs/developer-guide/architecture/authz-authn.md:14-28](https://github.com/argoproj/argo-cd/blob/main/docs/developer-guide/architecture/authz-authn.md#L14-L28)

## Server Entrypoint and CLI Flags

### Overview

The `argocd-server` executable initializes via a Cobra command definition that parses command-line flags and maps them to environment variables. The entrypoint function `NewCommand()` constructs the root command, registers flags for networking, TLS, Redis caching, OpenTelemetry tracing, and ApplicationSet integration, and coordinates the startup sequence.

Sources: [cmd/argocd-server/commands/argocd_server.go:56-115](https://github.com/argoproj/argo-cd/blob/main/cmd/argocd-server/commands/argocd_server.go#L56-L115)

### Startup Initialization Flow

When executed, the server run loop executes a structured initialization sequence through explicit function calls and configuration checks:
1. `clientConfig.Namespace()` resolves the target Kubernetes namespace and `vers.LogStartupInfo()` records component startup metadata.
2. `cli.SetLogFormat()`, `cli.SetLogLevel()`, `cli.SetGLogLevel()`, and `utilglob.SetCacheSize()` configure the logging and RBAC glob cache parameters.
3. `clientConfig.ClientConfig()` loads Kubernetes configuration defaults, followed by `tlsConfigCustomizerSrc()`, `cacheSrc()`, and `repoServerCacheSrc()` to initialize caches and TLS settings.
4. `server.NewServer()` instantiates the core server struct with populated options, followed by `argocd.Init(ctx)`, `argocd.Listen()`, and `argocd.Run(serverCtx, lns)` inside an active listener loop.

Sources: [cmd/argocd-server/commands/argocd_server.go:118-150](https://github.com/argoproj/argo-cd/blob/main/cmd/argocd-server/commands/argocd_server.go#L118-L150), [cmd/argocd-server/commands/argocd_server.go:277-290](https://github.com/argoproj/argo-cd/blob/main/cmd/argocd-server/commands/argocd_server.go#L277-L290)

> [!WARNING]
> Panic recovery is explicitly deferred in the command run loop (`cmd/argocd-server/commands/argocd_server.go:135-139`); any unhandled runtime panic captures a stack trace via `debug.Stack()` and triggers a fatal log exit instead of propagating upward.

Sources: [cmd/argocd-server/commands/argocd_server.go:135-139](https://github.com/argoproj/argo-cd/blob/main/cmd/argocd-server/commands/argocd_server.go#L135-L139)

### Configuration Flags Reference

| Flag Name | Environment Variable | Default Value | Purpose |
| :--- | :--- | :--- | :--- |
| `--address` | `ARGOCD_SERVER_LISTEN_ADDRESS` | `0.0.0.0` | API server listen IP address. |
| `--port` | N/A | `8080` | API server listen port. |
| `--insecure` | `ARGOCD_SERVER_INSECURE` | `false` | Run server without TLS. |
| `--repo-server` | `ARGOCD_SERVER_REPO_SERVER` | `argocd-repo-server:8081` | Repository server gRPC address. |
| `--dex-server` | `ARGOCD_SERVER_DEX_SERVER` | `argocd-dex-server:5556` | Dex OIDC identity provider server address. |
| `--repo-server-timeout-seconds` | `ARGOCD_SERVER_REPO_SERVER_TIMEOUT_SECONDS` | `60` | Timeout threshold for repository server RPC calls. |

Sources: [cmd/argocd-server/commands/argocd_server.go:310-333](https://github.com/argoproj/argo-cd/blob/main/cmd/argocd-server/commands/argocd_server.go#L310-L333)

## Server Initialization and Subsystem Setup

### Overview

The core API server state and its background subsystems are instantiated through `NewServer()`, which initializes configuration management, Kubernetes client informers, RBAC policy enforcement, database handles, and notification components.

Sources: [server/server.go:312-328](https://github.com/argoproj/argo-cd/blob/main/server/server.go#L312-L328)

### Subsystem Initialization Call-Chain

When bootstrapping the server instance, `NewServer()` executes a strict call sequence to wire up dependent managers and caches:
1. `settings_util.NewSettingsManager()` instantiates the settings manager using the Kubernetes client and target namespace.
2. `settingsMgr.InitializeSettings()` loads and validates server configuration, respecting the `insecure` flag.
3. `initializeDefaultProject()` ensures the default app project (`default`) exists in the target namespace with wildcard permissions.
4. `settings_util.NewClusterInformer()` sets up cluster watching, while `appinformer.NewSharedInformerFactoryWithOptions()` configures shared informers for projects, applications, and application sets.
5. `rbac.NewEnforcer()` and `rbacpolicy.NewRBACPolicyEnforcer()` initialize Casbin authorization rules and scope bindings.
6. `db.NewDB()` establishes the database instance for application, repository, and cluster persistence.

Sources: [server/server.go:292-358](https://github.com/argoproj/argo-cd/blob/main/server/server.go#L292-L358), [server/server.go:383](https://github.com/argoproj/argo-cd/blob/main/server/server.go#L383)

> [!NOTE]
> If multi-tenant isolation via `ApplicationNamespaces` is configured, `NewServer()` applies a `newNamespaceFilterTransform` transform to both application and application set informers. This drops objects from unauthorized namespaces before they ever populate the informer cache.

Sources: [server/server.go:344-348](https://github.com/argoproj/argo-cd/blob/main/server/server.go#L344-L348), [server/server.go:1809-1822](https://github.com/argoproj/argo-cd/blob/main/server/server.go#L1809-L1822)

### Informer and Storage Configuration

| Subsystem Component | Initializing Function / Constructor | Purpose |
| :--- | :--- | :--- |
| `settingsMgr` | `settings_util.NewSettingsManager()` | Manages configuration stored in the `argocd-cm` ConfigMap and secrets. |
| `clusterInformer` | `settings_util.NewClusterInformer()` | Tracks registered Kubernetes clusters for target deployments. |
| `projInformer` | `appinformer.NewSharedInformerFactoryWithOptions()` | Watches `AppProject` custom resources in the control plane namespace. |
| `appInformer` | `appinformer.NewSharedInformerFactoryWithOptions()` | Watches `Application` custom resources cluster-wide or within scoped namespaces. |
| `appsetInformer` | `appinformer.NewSharedInformerFactoryWithOptions()` | Watches `ApplicationSet` resources. |
| `userStateStorage` | `util_session.NewUserStateStorage()` | Backs user session state and lock mechanisms with Redis. |
| `db` | `db.NewDB()` | Provides CRUD access for clusters, repositories, and certificates. |

Sources: [server/server.go:314-383](https://github.com/argoproj/argo-cd/blob/main/server/server.go#L314-L383)

## Dual gRPC and HTTP Server Multiplexing

### Overview

The Argo CD API server multiplexes multiple network protocols (gRPC, HTTP/1.1 REST via `grpc-gateway`, gRPC-Web, and static assets) over a single TCP listener port using `cmux`. When starting up, `ArgoCDServer.Run()` binds network sockets via `Listen()`, configures protocol connection managers, and orchestrates connection multiplexing with TLS or plaintext options.

Sources: [server/server.go:525-562](https://github.com/argoproj/argo-cd/blob/main/server/server.go#L525-L562), [server/server.go:626-660](https://github.com/argoproj/argo-cd/blob/main/server/server.go#L626-L660)

### Network Listener Creation and Multiplexing Call Chain

The network listener initialization and routing flow executes through a series of discrete configuration and binding calls:

1. `ArgoCDServer.Listen()` calls `startListener()` for both the main service port (`ListenHost` / `ListenPort`) and the metrics port (`ListenHost` / `MetricsPort`) using exponential backoff retry logic.
2. `ArgoCDServer.Run()` initializes `cmux.New(listeners.Main)` to inspect incoming TCP bytes and split traffic streams dynamically.
3. If TLS is enabled (`server.useTLS()`), `cmux` routes raw TLS client handshakes through `tls.NewListener()` using custom Application-Layer Protocol Negotiation (`NextProtos: []string{"http/1.1", "h2"}`) and dynamic certificate loading via `tlsConfig.GetCertificate`.
4. A secondary nested `cmux` multiplexer (`tlsm`) splits the decrypted TLS stream into HTTPS REST/gRPC-Web traffic (`httpsL`) matching PATCH/HTTP requests and HTTP/2 gRPC traffic (`grpcL`) matching the `content-type: application/grpc` header field.

Sources: [server/server.go:511-534](https://github.com/argoproj/argo-cd/blob/main/server/server.go#L511-L534), [server/server.go:578](https://github.com/argoproj/argo-cd/blob/main/server/server.go#L578), [server/server.go:626-660](https://github.com/argoproj/argo-cd/blob/main/server/server.go#L626-L660), [server/server.go:908-913](https://github.com/argoproj/argo-cd/blob/main/server/server.go#L908-L913)

> [!NOTE]
> The gRPC server itself (`grpcS`) is instantiated without TLS credentials via `grpc.NewServer()`. TLS termination and multiplexing are handled entirely upstream by `cmux` and `tls.NewListener()`, allowing plaintext gRPC handlers to operate over the decrypted transport stream.

Sources: [server/server.go:958-960](https://github.com/argoproj/argo-cd/blob/main/server/server.go#L958-L960), [server/server.go:986](https://github.com/argoproj/argo-cd/blob/main/server/server.go#L986)

### gRPC Server Setup and Service Registration

`ArgoCDServer.newGRPCServer()` builds the core gRPC server instance with message size quotas, keepalive enforcement policies, Prometheus metrics interceptors, and OpenTelemetry tracing handlers.

Sources: [server/server.go:915-986](https://github.com/argoproj/argo-cd/blob/main/server/server.go#L915-L986)

| gRPC Service | Register Function | Service Implementation |
| :--- | :--- | :--- |
| Version | `versionpkg.RegisterVersionServiceServer` | `server.serviceSet.VersionService` |
| Cluster | `clusterpkg.RegisterClusterServiceServer` | `server.serviceSet.ClusterService` |
| Application | `applicationpkg.RegisterApplicationServiceServer` | `server.serviceSet.ApplicationService` |
| ApplicationSet | `applicationsetpkg.RegisterApplicationSetServiceServer` | `server.serviceSet.ApplicationSetService` |
| Notification | `notificationpkg.RegisterNotificationServiceServer` | `server.serviceSet.NotificationService` |
| Repository | `repositorypkg.RegisterRepositoryServiceServer` | `server.serviceSet.RepoService` |
| RepoCreds | `repocredspkg.RegisterRepoCredsServiceServer` | `server.serviceSet.RepoCredsService` |
| Session | `sessionpkg.RegisterSessionServiceServer` | `server.serviceSet.SessionService` |
| Settings | `settingspkg.RegisterSettingsServiceServer` | `server.serviceSet.SettingsService` |
| Project | `projectpkg.RegisterProjectServiceServer` | `server.serviceSet.ProjectService` |
| Account | `accountpkg.RegisterAccountServiceServer` | `server.serviceSet.AccountService` |
| Certificate | `certificatepkg.RegisterCertificateServiceServer` | `server.serviceSet.CertificateService` |
| GPGKey | `gpgkeypkg.RegisterGPGKeyServiceServer` | `server.serviceSet.GpgkeyService` |

Sources: [server/server.go:991-1003](https://github.com/argoproj/argo-cd/blob/main/server/server.go#L991-L1003)

### HTTP/REST Gateway Routing and Handlers

`ArgoCDServer.newHTTPServer()` constructs the HTTP multiplexer (`http.Server`), embedding `grpc-gateway` via `runtime.NewServeMux()` to translate incoming HTTP REST requests into internal gRPC loopback calls over `listeners.GatewayConn`.

Sources: [server/server.go:1183-1208](https://github.com/argoproj/argo-cd/blob/main/server/server.go#L1183-L1208)

> [!WARNING]
> `grpc-gateway` relies on a custom JSON marshaller (`grpc_util.JSONMarshaler`) instead of the default `golang/protobuf` `jsonpb` implementation. This ensures support for complex types like `time.Time` fields across all REST service endpoints.

Sources: [server/server.go:1200-1206](https://github.com/argoproj/argo-cd/blob/main/server/server.go#L1200-L1206)

The HTTP router dispatches special endpoints via `handlerSwitcher` and `http.ServeMux`:
- Badge rendering via `badge.NewHandler()` at `/api/badge`.
- User session logout via `logout.NewHandler()` at `common.LogoutEndpoint`.
- gRPC-Web framing for `application/grpc-web+proto` content types.
- Interactive terminal execution sessions at `/terminal`.
- Git webhook processing at `/api/webhook`.
- CLI binary downloads via `/download/argocd-linux` and architecture-suffixed routes.
- UI static assets and HTML5 History API fallback routing under `/`.

Sources: [server/server.go:1191-1293](https://github.com/argoproj/argo-cd/blob/main/server/server.go#L1191-L1293), [server/server.go:1434-1497](https://github.com/argoproj/argo-cd/blob/main/server/server.go#L1434-L1497)

## Middleware Interceptors and Authentication Flow

### Overview

The Argo CD API server executes request processing through ordered chains of middleware interceptors for both gRPC and HTTP transports. Authentication and authorization logic validates incoming tokens, extracts claims, and manages OIDC session lifecycles before requests reach underlying service handlers.

Sources: [server/server.go:960-984](https://github.com/argoproj/argo-cd/blob/main/server/server.go#L960-L984), [docs/developer-guide/architecture/authz-authn.md:63-94](https://github.com/argoproj/argo-cd/blob/main/docs/developer-guide/architecture/authz-authn.md#L63-L94)

### Interceptor Chains and Call Execution Walkthrough

Unary and stream gRPC requests pass through a sequence of interceptors configured during gRPC server creation in `ArgoCDServer.newGRPCServer()`.

Sources: [server/server.go:960-984](https://github.com/argoproj/argo-cd/blob/main/server/server.go#L960-L984)

The unary interceptor execution order is:
1. `bug21955WorkaroundInterceptor` — unescapes URL path parameters in request messages.
2. `logging.UnaryServerInterceptor` — injects structured logging via `grpc_util.InterceptorLogger`.
3. `serverMetrics.UnaryServerInterceptor` — records Prometheus metrics for request handling time and counts.
4. `grpc_auth.UnaryServerInterceptor(server.Authenticate)` — invokes authentication to validate tokens and populate claims.
5. `grpc_util.UserAgentUnaryServerInterceptor` — validates client version constraints against `clientConstraint`.
6. `grpc_util.PayloadUnaryServerInterceptor` — logs payload contents unless the method matches `sensitiveMethods`.
7. `grpc_util.ErrorCodeK8sUnaryServerInterceptor()` and `ErrorCodeGitUnaryServerInterceptor()` — translates error codes.
8. `recovery.UnaryServerInterceptor` — recovers from panics using `grpc_util.LoggerRecoveryHandler`.

Sources: [server/server.go:960-984](https://github.com/argoproj/argo-cd/blob/main/server/server.go#L960-L984)

> [!WARNING]
> Methods listed in `sensitiveMethods` (such as `ClusterService/Create`, `AccountService/UpdatePassword`, and `ApplicationService/PatchResource`) explicitly bypass payload logging to protect sensitive credentials and avoid large log allocations.

Sources: [server/server.go:936-957](https://github.com/argoproj/argo-cd/blob/main/server/server.go#L936-L957)

### Authentication, Token Validation, and OIDC Flow

Authentication is executed by `ArgoCDServer.Authenticate()`, which delegates claim extraction and token refreshing to `ArgoCDServer.getClaims()`.

Sources: [server/server.go:1548-1587](https://github.com/argoproj/argo-cd/blob/main/server/server.go#L1548-L1587), [server/server.go:1590-1651](https://github.com/argoproj/argo-cd/blob/main/server/server.go#L1590-L1651)

`getToken(md)` extracts tokens from incoming requests by inspecting metadata keys in priority order:
1. `metadata["token"]` (`apiclient.MetaDataTokenKey`)
2. `metadata["authorization"]` (extracting `Bearer ` tokens if valid via `jwtutil.IsValid`)
3. `metadata["grpcgateway-cookie"]` (extracting `argocd.token` from cookie headers via `httputil.JoinCookies`)

Sources: [server/server.go:1653-1684](https://github.com/argoproj/argo-cd/blob/main/server/server.go#L1653-L1684)

Once a token string is obtained, `sessionMgr.VerifyToken()` validates it. If OIDC or Dex is configured, `ssoClientApp.SetGroupsClaimFromEndpoint()` fetches group claims and `ssoClientApp.CheckAndRefreshToken()` automatically refreshes expired or expiring ID tokens before attaching the claims context for downstream RBAC enforcement.

Sources: [server/server.go:1606-1648](https://github.com/argoproj/argo-cd/blob/main/server/server.go#L1606-L1648)

### RBAC Policy Enforcement

Authorization is enforced via Casbin and the RBAC policy enforcer initialized during server startup.

Sources: [server/server.go:352-360](https://github.com/argoproj/argo-cd/blob/main/server/server.go#L352-L360)

| Component | Initializer / Implementation | Purpose |
| :--- | :--- | :--- |
| Enforcer | `rbac.NewEnforcer()` | Loads built-in CSV policies and watches the `argocd-rbac-cm` ConfigMap. |
| Policy Enforcer | `rbacpolicy.NewRBACPolicyEnforcer()` | Evaluates claims against project-scoped rules and global policies via `EnforceClaims`. |
| Policy Loader | `server.rbacPolicyLoader()` | Continuously syncs RBAC scopes from ConfigMap data annotations. |

Sources: [server/server.go:352-360](https://github.com/argoproj/argo-cd/blob/main/server/server.go#L352-L360), [server/server.go:891-906](https://github.com/argoproj/argo-cd/blob/main/server/server.go#L891-L906)

## Headless Mode and Auxiliary Commands

### Headless Mode and CLI In-Process Execution

Headless mode permits the Argo CD command-line interface to execute core API server logic locally within the same process when connecting via core mode (`--core`). The entrypoint function `NewClientOrDie` initiates this flow by resolving the Kubernetes context via `resolveAndApplyKubeContext` and invoking `MaybeStartLocalServer`.

Sources: [cmd/argocd/commands/headless/headless.go:318-334](https://github.com/argoproj/argo-cd/blob/main/cmd/argocd/commands/headless/headless.go#L318-L334)

The execution call chain for establishing a local headless API server proceeds through distinct initialization phases:
1. `MaybeStartLocalServer()` — checks `clientOpts.Core` or evaluates local configuration files via `localconfig.ReadLocalConfig()` to determine if an in-process server is required.
2. `net.ListenConfig{}.Listen()` — binds a ephemeral TCP listener on `localhost:0` if no specific port is provided.
3. `clientcmd.ClientConfig.ClientConfig()` — constructs the Kubernetes REST configuration, enforcing fake in-cluster configuration defaults via `v1alpha1.EnvVarFakeInClusterConfig`.
4. `miniredis.Run()` — instantiates an in-memory Redis instance to back the local application state cache without requiring an external cluster deployment.
5. `server.NewServer()` — configures the complete Argo CD API server with internal forwarders (`forwardCacheClient` and `forwardRepoClientset`) that execute port-forwarding tunnels to cluster-resident pods when repository or caching operations require remote access.

Sources: [cmd/argocd/commands/headless/headless.go:180-290](https://github.com/argoproj/argo-cd/blob/main/cmd/argocd/commands/headless/headless.go#L180-L290)

> [!NOTE]
> When `forwardRepoClientset.NewRepoServerClient()` is invoked in headless mode, it queries the Kubernetes API server for services matching `argocd.argoproj.io/component=repo-server`, dynamically retrieves the target pod name, and establishes a local port-forwarding session to port `8081`.

Sources: [cmd/argocd/commands/headless/headless.go:131-147](https://github.com/argoproj/argo-cd/blob/main/cmd/argocd/commands/headless/headless.go#L131-L147)

### Adjacent Subsystem Entrypoints

Aside from the primary API server and headless CLI execution, Argo CD provides distinct auxiliary server entrypoints designed to run as standalone microservices or background daemons within Kubernetes deployments. Each entrypoint initializes its own gRPC listeners, metrics endpoints, and signal handling routines.

Sources: [cmd/argocd-repo-server/commands/argocd_repo_server.go:88-91](https://github.com/argoproj/argo-cd/blob/main/cmd/argocd-repo-server/commands/argocd_repo_server.go#L88-L91), [cmd/argocd-application-controller/commands/argocd_application_controller.go:103-106](https://github.com/argoproj/argo-cd/blob/main/cmd/argocd-application-controller/commands/argocd_application_controller.go#L103-L106), [cmd/argocd-commit-server/commands/argocd_commit_server.go:37-40](https://github.com/argoproj/argo-cd/blob/main/cmd/argocd-commit-server/commands/argocd_commit_server.go#L37-L40)

| Subsystem Command | Source File | Core Responsibility | Default Port |
| :--- | :--- | :--- | :--- |
| Repository Server (`argocd-repo-server`) | `cmd/argocd-repo-server/commands/argocd_repo_server.go` | Maintains Git and Helm repository caches, parses manifests, and handles GnuPG keyrings. | `8081` (Metrics: `8084`) |
| Application Controller (`argocd-application-controller`) | `cmd/argocd-application-controller/commands/argocd_application_controller.go` | Kubernetes controller monitoring live cluster states against target Git states. | Metrics: `8082` |
| Commit Server (`argocd-commit-server`) | `cmd/argocd-commit-server/commands/argocd_commit_server.go` | Internal service responsible for committing and pushing hydrated manifests back to Git. | `8083` (Metrics: `8086`) |

Sources: [cmd/argocd-repo-server/commands/argocd_repo_server.go:88-91](https://github.com/argoproj/argo-cd/blob/main/cmd/argocd-repo-server/commands/argocd_repo_server.go#L88-L91), [cmd/argocd-application-controller/commands/argocd_application_controller.go:103-106](https://github.com/argoproj/argo-cd/blob/main/cmd/argocd-application-controller/commands/argocd_application_controller.go#L103-L106), [cmd/argocd-commit-server/commands/argocd_commit_server.go:37-40](https://github.com/argoproj/argo-cd/blob/main/cmd/argocd-commit-server/commands/argocd_commit_server.go#L37-L40)

## Related

- [[Application API]]
- [[Project and Cluster API]]
- [[User Sessions]]

