# Application Controller

<details>
<summary>Relevant source files</summary>

The following files were used as context for generating this wiki page:

- [cmd/argocd-application-controller/commands/argocd_application_controller.go](https://github.com/argoproj/argo-cd/blob/main/cmd/argocd-application-controller/commands/argocd_application_controller.go)
- [controller/appcontroller.go](https://github.com/argoproj/argo-cd/blob/main/controller/appcontroller.go)
- [applicationset/controllers/applicationset_controller.go](https://github.com/argoproj/argo-cd/blob/main/applicationset/controllers/applicationset_controller.go)
</details>

## Overview

The Argo CD Application Controller is a core Kubernetes controller responsible for continuously monitoring GitOps applications and reconciling their actual live state on target clusters with their declared desired state stored in version control repositories. By acting as the primary engine for continuous deployment, the controller bridges the gap between declarative Git specifications and runtime infrastructure, automatically detecting drift, managing automated synchronization policies, and handling application lifecycles across single or multi-cluster architectures.

Sources: [cmd/argocd-application-controller/commands/argocd_application_controller.go:106](https://github.com/argoproj/argo-cd/blob/main/cmd/argocd-application-controller/commands/argocd_application_controller.go#L106), [controller/appcontroller.go:117-118](https://github.com/argoproj/argo-cd/blob/main/controller/appcontroller.go#L117-L118)

## CLI Entry Point and Flag Configuration

### CLI Entry Point and Flag Configuration

The command-line interface for the Argo CD application controller is structured using the Cobra command library and initialized via the `NewCommand()` function. This setup handles flag registration, environment variable parsing, TLS configuration for repository server connections, tracing initialization, and controller bootstrapping before running the main reconciliation loop.

Sources: [cmd/argocd-application-controller/commands/argocd_application_controller.go:54-319](https://github.com/argoproj/argo-cd/blob/main/cmd/argocd-application-controller/commands/argocd_application_controller.go#L54-L319)

### Startup Execution Call Chain

When the controller command executes its `RunE` handler, it performs a sequenced initialization routine. Tracing this execution path reveals the precise order in which infrastructure clients and runtime components are provisioned:

1. `clientConfig.Namespace()` — Resolves the target Kubernetes namespace from the client configuration.
2. `vers.LogStartupInfo()` — Logs startup metadata including platform version and namespace context.
3. `clientConfig.ClientConfig()` & `v1alpha1.SetK8SConfigDefaults()` — Obtains the Kubernetes REST client configuration and applies standard API defaults.
4. `kubernetes.NewForConfigOrDie()` & `appclientset.NewForConfigOrDie()` — Instantiates the core Kubernetes client and custom Application custom resource clientset.
5. `repoServerClientTLSConfigSrc()` — Resolves client TLS credentials and evaluates plaintext or strict TLS flags.
6. `apiclient.NewRepoServerClientset()` & `commitclient.NewCommitServerClientset()` — Constructs gRPC clients for the repository and commit servers.
7. `cacheSource()` — Establishes application state caching connections backed by Redis.
8. `settings.NewSettingsManager()` — Initializes the Argo CD settings manager configured with a repository or cluster change event handler to invalidate the project cache.
9. `sharding.GetClusterSharding()` — Determines the cluster sharding distribution based on configured algorithms and environment settings.
10. `controller.NewApplicationController()` — Builds the master application controller instance with all injected clients, timeouts, and metric options.
11. `trace.InitTracer()` — Initializes OpenTelemetry tracing if an OTLP collector address is provided.
12. `appController.Run()` — Starts the controller background workers and status/operation processors.

Sources: [cmd/argocd-application-controller/commands/argocd_application_controller.go:108-250](https://github.com/argoproj/argo-cd/blob/main/cmd/argocd-application-controller/commands/argocd_application_controller.go#L108-L250)

### Configuration Flags and Environment Mappings

The application controller exposes numerous command-line flags that map directly to underlying environment variables and control reconciliation parameters, timeouts, processing concurrency, and telemetry.

| Flag Name | Environment Variable | Default Value | Purpose |
| :--- | :--- | :--- | :--- |
| `--app-resync` | `ARGOCD_RECONCILIATION_TIMEOUT` | `120` | Time period in seconds for application resync. |
| `--app-hard-resync` | `ARGOCD_HARD_RECONCILIATION_TIMEOUT` | `0` | Time period in seconds for application hard resync. |
| `--app-resync-jitter` | `ARGOCD_RECONCILIATION_JITTER` | `60` | Maximum time period in seconds to add as delay jitter for application resync. |
| `--repo-error-grace-period-seconds` | `ARGOCD_REPO_ERROR_GRACE_PERIOD_SECONDS` | `180` | Grace period in seconds for ignoring consecutive errors while communicating with repo server. |
| `--repo-server` | `ARGOCD_APPLICATION_CONTROLLER_REPO_SERVER` | `argocd-repo-server:8081` | Repo server address. |
| `--commit-server` | `ARGOCD_APPLICATION_CONTROLLER_COMMIT_SERVER` | `argocd-commit-server:8081` | Commit server address. |
| `--status-processors` | `ARGOCD_APPLICATION_CONTROLLER_STATUS_PROCESSORS` | `20` | Number of application status processors. |
| `--operation-processors` | `ARGOCD_APPLICATION_CONTROLLER_OPERATION_PROCESSORS` | `10` | Number of application operation processors. |
| `--hydration-processors` | `ARGOCD_APPLICATION_CONTROLLER_HYDRATION_PROCESSORS` | `5` | Number of manifest hydration processors (active when source hydrator is enabled). |
| `--logformat` | `ARGOCD_APPLICATION_CONTROLLER_LOGFORMAT` | `json` | Set logging format (`json` or `text`). |
| `--loglevel` | `ARGOCD_APPLICATION_CONTROLLER_LOGLEVEL` | `info` | Set logging level (`debug`, `info`, `warn`, or `error`). |
| `--metrics-port` | N/A | `4582` | Start metrics server on given port. |
| `--self-heal-timeout-seconds` | `ARGOCD_APPLICATION_CONTROLLER_SELF_HEAL_TIMEOUT_SECONDS` | `0` | Specifies timeout between application self heal attempts. |
| `--sharding-method` | `ARGOCD_CONTROLLER_SHARDING_ALGORITHM` | `legacy` | Choice of sharding method (`legacy`, `round-robin`, or `consistent-hashing`). |
| `--repo-server-plaintext` | `ARGOCD_APPLICATION_CONTROLLER_REPO_SERVER_PLAINTEXT` | `false` | Disable TLS on connections to repo server. |
| `--repo-server-strict-tls` | `ARGOCD_APPLICATION_CONTROLLER_STRICT_TLS` | `false` | Strict validation of TLS cert presented by repo server (deprecated; use ca-cert-path). |
| `--dynamic-cluster-distribution-enabled` | `ARGOCD_DYNAMIC_CLUSTER_DISTRIBUTION_ENABLED` | `false` | Enables dynamic cluster distribution. |
| `--server-side-diff-enabled` | `ARGOCD_SERVER_SIDE_DIFF` | `false` | Feature flag to enable ServerSide diff. |

Sources: [cmd/argocd-application-controller/commands/argocd_application_controller.go:260-311](https://github.com/argoproj/argo-cd/blob/main/cmd/argocd-application-controller/commands/argocd_application_controller.go#L260-L311)

### TLS and Certificate Bootstrapping

TLS configuration for repository server communication is resolved dynamically via `repoServerClientTLSConfigSrc`. The controller disables TLS if `--repo-server-plaintext` (`ARGOCD_APPLICATION_CONTROLLER_REPO_SERVER_PLAINTEXT`) is asserted. When strict TLS validation is requested and no explicit certificates are loaded, the controller attempts to load an X.509 certificate pool containing the Certificate Authority (CA) and client certificates from the designated application configuration path:

```go
pool, err := tls.LoadX509CertPool(
    env.StringFromEnv(common.EnvAppConfigPath, common.DefaultAppConfigPath)+"/controller/tls/tls.crt",
    env.StringFromEnv(common.EnvAppConfigPath, common.DefaultAppConfigPath)+"/controller/tls/ca.crt",
)
```

> [!WARNING]
> The `--repo-server-strict-tls` flag is formally marked as deprecated in favor of explicit certificate authority configuration paths via `--repo-server-ca-cert-path`, though legacy validation fallbacks remain active for backward compatibility during initialization.

Sources: [cmd/argocd-application-controller/commands/argocd_application_controller.go:151-167](https://github.com/argoproj/argo-cd/blob/main/cmd/argocd-application-controller/commands/argocd_application_controller.go#L151-L167), [cmd/argocd-application-controller/commands/argocd_application_controller.go:284-285](https://github.com/argoproj/argo-cd/blob/main/cmd/argocd-application-controller/commands/argocd_application_controller.go#L284-L285)

## Controller Lifecycle and Cluster Sharding

### Overview

The `ApplicationController` manages the lifecycle of `Application` and `AppProject` custom resources. Controller initialization constructs the core struct, wires informer caches, starts background workers, and distributes workloads across cluster shards.

Sources: [controller/appcontroller.go:118-161](https://github.com/argoproj/argo-cd/blob/main/controller/appcontroller.go#L118-L161), [controller/appcontroller.go:901-995](https://github.com/argoproj/argo-cd/blob/main/controller/appcontroller.go#L901-L995)

### Controller Initialization and Informer Creation

The constructor function `NewApplicationController` initializes database connections, work queues, event handlers, and informer factories. When multiple application namespaces are specified via configuration, the informer watches across all permitted namespaces (`watchNamespace = ""`); otherwise, it targets the control plane namespace.

```go
func NewApplicationController(
	namespace string,
	settingsMgr *settings_util.SettingsManager,
	kubeClientset kubernetes.Interface,
	applicationClientset appclientset.Interface,
	...
) (*ApplicationController, error)
```

The application informer builds a custom `cache.ListWatch` coupled with `cache.Indexers` containing `cache.NamespaceIndex` and an `orphanedIndex` indexer function.

Sources: [controller/appcontroller.go:164-246](https://github.com/argoproj/argo-cd/blob/main/controller/appcontroller.go#L164-L246), [controller/appcontroller.go:2739-2807](https://github.com/argoproj/argo-cd/blob/main/controller/appcontroller.go#L2739-L2807)

### Cache Warming and Run Loop Execution

The `Run` method coordinates controller startup, cache synchronization, and background worker spawning. 

```go
ctrl.clusterSharding.Init(clusters, appItems)
go ctrl.appInformer.Run(ctx.Done())
go ctrl.projInformer.Run(ctx.Done())
errors.CheckError(ctrl.stateCache.Init())

if !cache.WaitForCacheSync(ctx.Done(), ctrl.appInformer.HasSynced, ctrl.projInformer.HasSynced) {
    log.Error("Timed out waiting for caches to sync")
    return
}

go func() { errors.CheckError(ctrl.stateCache.Run(ctx)) }()
```

> [!IMPORTANT]
> Cache synchronization is strictly enforced. If `cache.WaitForCacheSync` times out waiting for `appInformer` and `projInformer` to sync, the controller halts startup immediately before launching worker loops.

Sources: [controller/appcontroller.go:901-943](https://github.com/argoproj/argo-cd/blob/main/controller/appcontroller.go#L901-L943)

### Cluster Sharding and Dynamic Distribution

Cluster sharding determines whether an application instance falls under the jurisdiction of the current controller shard via `canProcessApp()`. When `dynamicClusterDistributionEnabled` is active, the readiness probe evaluates the controller deployment replica count and shard mapping configuration.

```go
shard := env.ParseNumFromEnv(common.EnvControllerShard, -1, -math.MaxInt32, math.MaxInt32)
shard, err := sharding.GetOrUpdateShardFromConfigMap(kubeClientset.(*kubernetes.Clientset), settingsMgr, int(*appControllerDeployment.Spec.Replicas), shard)
if ctrl.clusterSharding.UpdateShard(shard) {
    ctrl.stateCache.UpdateShard(shard)
    ...
}
```

Sources: [controller/appcontroller.go:253-298](https://github.com/argoproj/argo-cd/blob/main/controller/appcontroller.go#L253-L298), [controller/appcontroller.go:2706-2737](https://github.com/argoproj/argo-cd/blob/main/controller/appcontroller.go#L2706-L2737)

## Reconciliation Queues and Event Handlers

### Reconciliation Queues and Event Handlers

### Overview

The application controller relies on specialized workqueues backed by rate-limiting interfaces and Kubernetes informer event handlers to process application and project reconciliation triggers. Workqueues decouple event detection from execution, batching rapid resource mutations and preventing infinite reconciliation loops.

Sources: [controller/appcontroller.go:125-132](https://github.com/argoproj/argo-cd/blob/main/controller/appcontroller.go#L125-L132), [controller/appcontroller.go:208-213](https://github.com/argoproj/argo-cd/blob/main/controller/appcontroller.go#L208-L213)

### Workqueue Architecture and Queues

`NewApplicationController` initializes several distinct typed rate-limiting workqueues, each dedicated to a specific operational domain:

| Queue Name / Field | Type | Purpose |
| :--- | :--- | :--- |
| `appRefreshQueue` (`app_reconciliation_queue`) | `workqueue.TypedRateLimitingInterface[string]` | Handles standard application status reconciliation and refresh cycles. |
| `appOperationQueue` (`app_operation_processing_queue`) | `workqueue.TypedRateLimitingInterface[string]` | Processes requested application sync operations and resource deletions. |
| `projectRefreshQueue` (`project_reconciliation_queue`) | `workqueue.TypedRateLimitingInterface[string]` | Manages `AppProject` validation and deletion finalization. |
| `appComparisonTypeRefreshQueue` | `workqueue.TypedRateLimitingInterface[string]` | Dispatches requests for application refreshes carrying specific pre-defined comparison types. |
| `appHydrateQueue` (`app_hydration_queue`) | `workqueue.TypedRateLimitingInterface[string]` | Evaluates whether an application requires manifest hydration. |
| `hydrationQueue` (`manifest_hydration_queue`) | `workqueue.TypedRateLimitingInterface[hydratortypes.HydrationQueueKey]` | Performs heavy manifest generation, branch committing, and per-app status writes keyed by source and destination repository configurations. |

Sources: [controller/appcontroller.go:208-213](https://github.com/argoproj/argo-cd/blob/main/controller/appcontroller.go#L208-L213)

### Event Handler Functions and Dispatching

Informer event handlers intercept Kubernetes resource changes and route keys into the appropriate workqueues. The application event handler function `applicationEventHandlerFuncs()` checks whether the controller can process the application via `canProcessApp()` before dispatching.

```go
func (ctrl *ApplicationController) applicationEventHandlerFuncs() cache.ResourceEventHandlerFuncs
```

The execution flow for application updates proceeds through specific filter and dispatch steps:
1. `UpdateFunc` receives `old` and `new` object references.
2. `ctrl.canProcessApp(new)` evaluates namespace permissions, skip-reconcile annotations, and cluster sharding assignments.
3. `automatedSyncEnabled(oldApp, newApp)` detects transitions from automated sync disabled to enabled, setting `compareWith = CompareWithLatest.Pointer()`.
4. `ctrl.statusRefreshJitter` introduces a random jitter delay if the resource version is unchanged to prevent thundering herds:
   `jitter := time.Duration(float64(ctrl.statusRefreshJitter) * rand.Float64())`
5. `ctrl.requestAppRefresh(...)`, `ctrl.appHydrateQueue.AddRateLimited(...)`, and `ctrl.appOperationQueue.AddRateLimited(...)` enqueue the keys.

Sources: [controller/appcontroller.go:2706-2737](https://github.com/argoproj/argo-cd/blob/main/controller/appcontroller.go#L2706-L2737), [controller/appcontroller.go:2848-2924](https://github.com/argoproj/argo-cd/blob/main/controller/appcontroller.go#L2848-L2924), [controller/appcontroller.go:3448-3472](https://github.com/argoproj/argo-cd/blob/main/controller/appcontroller.go#L3448-L3472)

> [!WARNING]
> Deletion events unwrapping `cache.DeletedFinalStateUnknown` tombstones bypass rate-limiting by calling `ctrl.appRefreshQueue.Add(key)` or `ctrl.projectRefreshQueue.Add(key)` directly to guarantee immediate cleanup processing.

Sources: [controller/appcontroller.go:2833-2844](https://github.com/argoproj/argo-cd/blob/main/controller/appcontroller.go#L2833-L2844), [controller/appcontroller.go:2904-2918](https://github.com/argoproj/argo-cd/blob/main/controller/appcontroller.go#L2904-2918)

### Comparison Queue Dispatching

The comparison queue dispatcher worker processes items from `appComparisonTypeRefreshQueue` via `processAppComparisonTypeQueueItem()`. Each queue item consists of a string key formatted as `namespace/name/comparisonType`.

```go
func (ctrl *ApplicationController) processAppComparisonTypeQueueItem() (processNext bool)
```

The worker splits the key by forward slashes (`strings.Split(key, "/")`), parses the integer comparison type from the third segment, and invokes `requestAppRefresh()` with the explicit comparison level pointer and a `nil` delay.

Sources: [controller/appcontroller.go:1118-1144](https://github.com/argoproj/argo-cd/blob/main/controller/appcontroller.go#L1118-L1144)

## Sync Execution and Status Persistence

### Overview

The application controller manages sync execution and status persistence by orchestrating how application specifications are compared against live cluster states, how automated synchronization and self-healing operate, and how operation results and application states are persisted back to Kubernetes. When an application operation or refresh is queued, the controller evaluates execution constraints, invokes the app state manager for diffing, manages resource hooks and finalizers, and writes status updates back through rate-limited patches.

Sources: [controller/appcontroller.go:1477-1511](https://github.com/argoproj/argo-cd/blob/main/controller/appcontroller.go#L1477-L1511), [controller/appcontroller.go:1792-1840](https://github.com/argoproj/argo-cd/blob/main/controller/appcontroller.go#L1792-L1840)

### Sync Operation Execution and Call Chain

Requested operations on applications are processed by `processAppOperationQueueItem()` and its downstream handlers. The execution walkthrough follows a strict sequence:

`processAppOperationQueueItem()` → `ctrl.applicationClientset.ArgoprojV1alpha1().Applications(...).Get(...)` → `ctrl.processRequestedAppOperation(app)` → `NewOperationState(*app.Operation)` → `ctrl.appStateManager.SyncAppState(ctx, app, project, state)` → `ctrl.setOperationState(ctx, app, state)`

> [!NOTE]
> During operation processing, the controller fetches a fresh copy of the application directly from `applicationClientset` rather than relying on the informer cache, preventing stale state execution caused by concurrent updates from the API server.

Sources: [controller/appcontroller.go:1028-1110](https://github.com/argoproj/argo-cd/blob/main/controller/appcontroller.go#L1028-L1110), [controller/appcontroller.go:1477-1608](https://github.com/argoproj/argo-cd/blob/main/controller/appcontroller.go#L1477-L1608)

### Comparison Levels and Refresh States

The controller uses distinct comparison modes when evaluating live states against repository manifests. These modes determine whether target revisions are resolved dynamically or skipped.

| Comparison Constant | Value | Description |
| :--- | :--- | :--- |
| `ComparisonWithNothing` | `0` | Skips comparison entirely and only refreshes the application resource tree from cache. |
| `CompareWithRecent` | `1` | Compares live application state against the revision used in the most recent comparison. |
| `CompareWithLatest` | `2` | Compares live application state against the state defined in the latest git revision. |
| `CompareWithLatestForceResolve` | `3` | Compares live state against the latest git revision with resolved revision caching forced off. |

Sources: [controller/appcontroller.go:92-103](https://github.com/argoproj/argo-cd/blob/main/controller/appcontroller.go#L92-L103)

### Automated Sync and Self-Heal Lifecycle

Automated synchronization and self-healing are evaluated during the reconciliation phase inside `auto_sync`. Before triggering a sync, `alreadyAttemptedSync()` verifies whether the desired revisions match the most recent sync result to prevent infinite synchronization loops when manifests remain out of sync.

```go
func alreadyAttemptedSync(app *appv1.Application, desiredRevisions []string, newRevisionHasChanges bool) (bool, []string, synccommon.OperationPhase)
```

> [!WARNING]
> Self-heal attempts are throttled using backoff calculations in `selfHealRemainingBackoff()`. If `selfHealBackoff` is configured, step delays accumulate based on `SelfHealAttemptsCount` before the application is re-enqueued for reconciliation.

Sources: [controller/appcontroller.go:2473-2583](https://github.com/argoproj/argo-cd/blob/main/controller/appcontroller.go#L2473-L2583), [controller/appcontroller.go:2631-2698](https://github.com/argoproj/argo-cd/blob/main/controller/appcontroller.go#L2631-L2698)

### Status Persistence and Fallback Handling

Status persistence is handled by `persistAppStatus()` and `handleRefreshAnnotation()`, which construct two-way merge patches and submit updates back to the Kubernetes API server via `PatchAppWithWriteBack()`.

```go
func (ctrl *ApplicationController) persistAppStatus(ctx context.Context, orig *appv1.Application, newStatus *appv1.ApplicationStatus) (patchDuration time.Duration)
```

> [!CAUTION]
> If a status patch fails due to exceeding the Kubernetes resource size limit (`apierrors.IsRequestEntityTooLargeError`), the controller catches the error, drops the bulky status fields, and falls back to persisting an `ApplicationCondition` of type `ApplicationConditionUnknownError` warning that status size limits were breached.

Sources: [controller/appcontroller.go:2375-2471](https://github.com/argoproj/argo-cd/blob/main/controller/appcontroller.go#L2375-L2471)

## ApplicationSet Controller and Template Generation

### Overview

The `ApplicationSetReconciler` controller manages `ApplicationSet` resources by executing a reconciliation loop that processes parameter generators, validates generated Argo CD `Application` instances, manages progressive rollouts, and synchronizes resources in the Kubernetes cluster.

Sources: [applicationset/controllers/applicationset_controller.go:90-112](https://github.com/argoproj/argo-cd/blob/main/applicationset/controllers/applicationset_controller.go#L90-L112), [applicationset/controllers/applicationset_controller.go:119-195](https://github.com/argoproj/argo-cd/blob/main/applicationset/controllers/applicationset_controller.go#L119-L195)

### Reconciliation Loop and Call Chain

When an `ApplicationSet` reconciliation event is received, `Reconcile` retrieves the resource, evaluates its lifecycle state, generates desired applications, validates them, and applies changes. The execution walkthrough follows a strict sequence:

`Reconcile()` → `template.GenerateApplications()` → `r.validateGeneratedApplications()` → `r.ProgressiveSyncManager.PerformProgressiveSyncs()` → `r.createOrUpdateInCluster()` → `r.deleteInCluster()` → `r.updateResourcesStatus()`

> [!NOTE]
> If an application generation or validation error occurs, the reconciler catches the error and requeues the request using `ReconcileRequeueOnValidationError` (set to 3 minutes), ensuring transient generator failures recover without manual intervention.

Sources: [applicationset/controllers/applicationset_controller.go:66-77](https://github.com/argoproj/argo-cd/blob/main/applicationset/controllers/applicationset_controller.go#L66-L77), [applicationset/controllers/applicationset_controller.go:119-242](https://github.com/argoproj/argo-cd/blob/main/applicationset/controllers/applicationset_controller.go#L119-L242), [applicationset/controllers/applicationset_controller.go:342-404](https://github.com/argoproj/argo-cd/blob/main/applicationset/controllers/applicationset_controller.go#L342-L404)

### Validation and Progressive Sync Management

Generated applications undergo strict checks in `validateGeneratedApplications`, verifying that each application has a concrete name, references an existing `AppProject`, and specifies a valid destination cluster. If `EnableProgressiveSyncs` is active and the `RollingSync` strategy is used, `ProgressiveSyncManager` controls rollout pacing across steps.

| Deletion Order Constant | Value | Description |
| :--- | :--- | :--- |
| `Reverse` | `"Reverse"` | Reverses the deletion order of generated applications during `ApplicationSet` deletion. |
| `AllAtOnce` | `"AllAtOnce"` | Deletes all generated applications concurrently. |

Sources: [applicationset/controllers/applicationset_controller.go:72-73](https://github.com/argoproj/argo-cd/blob/main/applicationset/controllers/applicationset_controller.go#L72-L73), [applicationset/controllers/applicationset_controller.go:252-281](https://github.com/argoproj/argo-cd/blob/main/applicationset/controllers/applicationset_controller.go#L252-L281), [applicationset/controllers/applicationset_controller.go:595-630](https://github.com/argoproj/argo-cd/blob/main/applicationset/controllers/applicationset_controller.go#L595-L630)

### Design Trade-Offs

| Design Choice | Benefit | Cost |
| :--- | :--- | :--- |
| Lexicographical error sorting (`firstAppError`) | Deterministic error propagation across concurrent goroutines. | Overhead of sorting error maps before returning from `g.Wait()`. |
| Concurrent cluster updates via `errgroup` | Accelerates creation and patching of large multi-cluster ApplicationSets. | Increased API server load and contention risk under high concurrency. |
| Status subresource retry loop (`RetryOnConflict`) | Robust handling of concurrent status updates on `ApplicationSet`. | Latency overhead during high-frequency status reconciliation. |

Sources: [applicationset/controllers/applicationset_controller.go:567-585](https://github.com/argoproj/argo-cd/blob/main/applicationset/controllers/applicationset_controller.go#L567-L585), [applicationset/controllers/applicationset_controller.go:708-828](https://github.com/argoproj/argo-cd/blob/main/applicationset/controllers/applicationset_controller.go#L708-828), [applicationset/controllers/applicationset_controller.go:955-965](https://github.com/argoproj/argo-cd/blob/main/applicationset/controllers/applicationset_controller.go#L955-965)

## Related

- [[Resource Cache]]
- [[Reconciliation Engine]]
- [[Resource Diffing]]

