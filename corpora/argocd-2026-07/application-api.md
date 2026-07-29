# Application API

<details>
<summary>Relevant source files</summary>

The following files were used as context for generating this wiki page:

- [server/application/application.go](https://github.com/argoproj/argo-cd/blob/main/server/application/application.go)
- [cmd/argocd/commands/app.go](https://github.com/argoproj/argo-cd/blob/main/cmd/argocd/commands/app.go)
</details>

## Overview

The Application API serves as the primary control plane interface for managing Argo CD applications, defining the core gRPC and REST service operations that govern application lifecycles, synchronization controls, and resource interactions. It bridges user requests from the CLI and UI with the underlying GitOps engine and repository server, enforcing strict role-based access control and project boundaries across cluster resources.

Sources: [server/application/application.go:90-109](https://github.com/argoproj/argo-cd/blob/main/server/application/application.go#L90-L109), [server/application/application.go:177-254](https://github.com/argoproj/argo-cd/blob/main/server/application/application.go#L177-L254), [cmd/argocd/commands/app.go:58-101](https://github.com/argoproj/argo-cd/blob/main/cmd/argocd/commands/app.go#L58-L101)

## Public API Surface and Application CRUD

### Overview

The Argo CD Application API exposes robust gRPC service definitions implemented in the application server (`server/application/application.go`) and invoked via the CLI (`cmd/argocd/commands/app.go`). These endpoints govern the end-to-end lifecycle of `Application` Custom Resources, including creation, full specification updates, JSON/merge patching, and cascaded deletion.

Sources: [server/application/application.go:348-428](https://github.com/argoproj/argo-cd/blob/main/server/application/application.go#L348-L428), [server/application/application.go:1051-1134](https://github.com/argoproj/argo-cd/blob/main/server/application/application.go#L1051-L1134), [server/application/application.go:1163-1225](https://github.com/argoproj/argo-cd/blob/main/server/application/application.go#L1163-L1225)

### Application CRUD Execution Walkthrough

Mutating operations follow a strictly validated execution pipeline before persisting changes to the Kubernetes API server. When a client invokes the `Create` endpoint, the server executes the following sequence:

`Create()` → `enf.EnforceErr()` → `getAppProject()` → `validateAndNormalizeApp()` → `appclientset.ArgoprojV1alpha1().Applications(appNs).Create()` → `waitSync()`

1. **`Create()`**: Validates that the request contains a non-nil application payload.
2. **`enf.EnforceErr()`**: Verifies that the caller's RBAC claims possess `create` privileges on `rbac.ResourceApplications` for the target application's RBAC scope (`a.RBACName(s.ns)`).
3. **`getAppProject()`**: Resolves and validates the corresponding `AppProject` via the project informer, returning a vague error if permission or existence checks fail to prevent project enumeration.
4. **`validateAndNormalizeApp()`**: Validates repository connectivity and project permissions, rejects explicit `Operation` blocks on creation to prevent branch protection bypasses, and normalizes the application specification.
5. **`Create()` (Client-Go)**: Submits the application resource to the Kubernetes API server under the resolved namespace (`appNs`). If an `AlreadyExists` conflict occurs and `Upsert` is enabled, it falls back to `updateApp()`.
6. **`waitSync()`**: Polls the application informer cache for up to 2 seconds until the cache reflects a resource version greater than or equal to the newly created object.

Sources: [server/application/application.go:348-428](https://github.com/argoproj/argo-cd/blob/main/server/application/application.go#L348-L428), [server/application/application.go:1322-1400](https://github.com/argoproj/argo-cd/blob/main/server/application/application.go#L1322-L1400), [server/application/application.go:995-1017](https://github.com/argoproj/argo-cd/blob/main/server/application/application.go#L995-L1017)

### Update, Patch, and Delete Endpoints

Beyond creation, the API provides specific handlers for modifying and removing applications:

* **`Update` & `UpdateSpec`**: These methods invoke `validateAndUpdateApp()`, ensuring that modifications are validated against project constraints and enforcing `update` RBAC permissions. `UpdateSpec` specifically targets the application spec while preserving metadata.
* **`Patch`**: Supports `json` and `merge` patch types. It fetches the existing application via `getApplicationEnforceRBACClient`, applies the decoded patch bytes using `json-patch` or JSON merge patch calculations, unmarshals the result, and passes the updated object through `validateAndUpdateApp()`.
* **`Delete`**: Removes an application and handles cascaded deletion finalizers. If cascading is enabled, it validates the propagation policy, patches the application with the appropriate deletion finalizer if not already present, and issues a Kubernetes delete call.

Sources: [server/application/application.go:1051-1134](https://github.com/argoproj/argo-cd/blob/main/server/application/application.go#L1051-L1134), [server/application/application.go:1163-1225](https://github.com/argoproj/argo-cd/blob/main/server/application/application.go#L1163-L1225)

> [!CAUTION]
> Users attempting to set an `Operation` field directly during application creation have their operation fields stripped out and logged at low security. This safeguards against malicious clients attempting to bypass repository branch protection rules by injecting raw manifests during creation.

Sources: [server/application/application.go:384-390](https://github.com/argoproj/argo-cd/blob/main/server/application/application.go#L384-L390)

### Application CRUD API Parameters

| Method | Request Message | Key Options / Fields | Default Behavior / Validation |
| :--- | :--- | :--- | :--- |
| `Create` | `ApplicationCreateRequest` | `Application`, `Upsert`, `Validate` | Strips `Operation` blocks; requires `create` RBAC; supports idempotent upserts when specs match. |
| `Update` | `ApplicationUpdateRequest` | `Application`, `Validate`, `Project` | Replaces the full application object; requires `update` RBAC and project locks. |
| `UpdateSpec` | `ApplicationUpdateSpecRequest` | `Name`, `Spec`, `Validate`, `AppNamespace` | Updates only `app.Spec`, filters invalid overrides, and re-normalizes. |
| `Patch` | `ApplicationPatchRequest` | `Name`, `Patch`, `PatchType`, `AppNamespace` | Supports `json` and `merge` patch types; validates resulting spec. |
| `Delete` | `ApplicationDeleteRequest` | `Name`, `Cascade`, `PropagationPolicy`, `AppNamespace` | Defaults `Cascade` to true; restricts propagation policies to `foreground` or `background`. |

Sources: [server/application/application.go:348-428](https://github.com/argoproj/argo-cd/blob/main/server/application/application.go#L348-L428), [server/application/application.go:1051-1134](https://github.com/argoproj/argo-cd/blob/main/server/application/application.go#L1051-L1134), [server/application/application.go:1163-1225](https://github.com/argoproj/argo-cd/blob/main/server/application/application.go#L1163-L1225)

### Design Trade-Offs in Application CRUD

| Design Choice | Benefit | Cost |
| :--- | :--- | :--- |
| **Informer Cache with `waitSync` Fallback** | Reduces API server load for frequent read and list operations. | Introduces eventual consistency challenges, mitigated via a 2-second timeout polling loop in `waitSync()`. |
| **Project-Scoped Mutex Locking (`projectLock`)** | Prevents concurrent conflicting writes or race conditions within the same `AppProject`. | Serializes concurrent modifications across applications belonging to the same project. |
| **Vague Error Responses on Project/App Access Denial** | Obscures sensitive infrastructure and application existence from unauthorized users (prevents enumeration). | Provides less immediate debugging context for legitimate users who mistype project names. |

Sources: [server/application/application.go:359-360](https://github.com/argoproj/argo-cd/blob/main/server/application/application.go#L359-L360), [server/application/application.go:995-1017](https://github.com/argoproj/argo-cd/blob/main/server/application/application.go#L995-L1017), [server/application/application.go:1142-1160](https://github.com/argoproj/argo-cd/blob/main/server/application/application.go#L1142-L1160)

## Application Sync and Operation Control

### Overview

The Argo CD API server provides dedicated endpoints and control flows for triggering application synchronizations, rollbacks to previous deployment revisions, and terminating active asynchronous operations. These control methods are exposed via the `ApplicationService` gRPC server and corresponding CLI command handlers, interacting directly with underlying cluster operations and repository revision resolvers.

Sources: [server/application/application.go:2085-2199](https://github.com/argoproj/argo-cd/blob/main/server/application/application.go#L2085-L2199), [server/application/application.go:2666-2326](https://github.com/argoproj/argo-cd/blob/main/server/application/application.go#L2666-L2326), [server/application/application.go:2509-2539](https://github.com/argoproj/argo-cd/blob/main/server/application/application.go#L2509-L2539)

### Sync Call-Chain Execution Walkthrough

The `Sync` endpoint transitions an application toward its target state by validating permissions, resolving revisions, and attaching an operation payload to the application resource. The execution path flows through the following sequential stages:

1. `s.getApplicationEnforceRBACClient()` — Fetches the application using a direct client call and verifies that the caller has permissions to read the application.
2. `proj.Spec.SyncWindows.Matches(a).CanSync()` — Evaluates assigned sync windows against the application to verify that manual or automated synchronizations are currently permitted.
3. `s.resolveSourceRevisions()` — Inspects source revisions or multi-source position settings, enforcing override privileges if syncing to a non-default revision and checking automated sync preconditions.
4. `s.resolveRevision()` — Queries the repository server client via `repoClient.ResolveRevision()` to translate ambiguous revisions (such as branch names or tags) into concrete commit SHAs when necessary.
5. `argo.SetAppOperation()` — Writes the populated `v1alpha1.Operation` struct containing sync options, strategies, resources, and initiator metadata directly to the Kubernetes custom resource instance.

Sources: [server/application/application.go:2085-2199](https://github.com/argoproj/argo-cd/blob/main/server/application/application.go#L2085-L2199), [server/application/application.go:2201-2264](https://github.com/argoproj/argo-cd/blob/main/server/application/application.go#L2201-L2264), [server/application/application.go:2465-2507](https://github.com/argoproj/argo-cd/blob/main/server/application/application.go#L2465-L2507)

> [!WARNING]
> When an application has automated sync policies enabled, gRPC callers are strictly prohibited from passing local manifests or overriding revisions unless a dry run is explicitly requested, preventing drift from Git-ops source integrity constraints.

Sources: [server/application/application.go:2109-2111](https://github.com/argoproj/argo-cd/blob/main/server/application/application.go#L2109-L2111), [server/application/application.go:2228-2232](https://github.com/argoproj/argo-cd/blob/main/server/application/application.go#L2228-L2232)

### Rollback and Operation Termination APIs

The `Rollback` endpoint acts as a convenience wrapper around the `Sync` operation mechanism. It validates that automated sync is disabled, locates the historical revision matching the requested deployment identifier (`rollbackReq.GetId()`) from `a.Status.History`, and constructs a sync operation using the stored deployment source configuration.

Sources: [server/application/application.go:2666-2326](https://github.com/argoproj/argo-cd/blob/main/server/application/application.go#L2666-L2326)

The `TerminateOperation` endpoint stops an in-progress operation by updating the application's active `OperationState.Phase` to `common.OperationTerminating` (`Terminating`), allowing the application controller to gracefully halt running sync loops.

Sources: [server/application/application.go:2509-2539](https://github.com/argoproj/argo-cd/blob/main/server/application/application.go#L2509-L2539)

> [!NOTE]
> Rollbacks referencing revisions deployed with Argo CD v0.11 or lower are explicitly rejected because older version history structures lack required source type definitions.

Sources: [server/application/application.go:2691-2696](https://github.com/argoproj/argo-cd/blob/main/server/application/application.go#L2691-L2696)

### Operation Control API Parameters

| Endpoint | Request Message | Key Validation Rules | Action Performed |
| :--- | :--- | :--- | :--- |
| `Sync` | `ApplicationSyncRequest` | Checks sync windows, deletion timestamp, automated sync rules, and source integrity. | Attaches a `SyncOperation` structure to the application spec and records an audit log event. |
| `Rollback` | `ApplicationRollbackRequest` | Requires auto-sync to be disabled; verifies history ID existence and valid source metadata. | Initiates a sync operation targeting a specific historical revision ID from the deployment history. |
| `TerminateOperation` | `OperationTerminateRequest` | Validates that an active operation and operation state exist on the application. | Sets `OperationState.Phase` to `Terminating` with up to 10 retry attempts for conflict resolution. |

Sources: [server/application/application.go:2085-2199](https://github.com/argoproj/argo-cd/blob/main/server/application/application.go#L2085-L2199), [server/application/application.go:2666-2326](https://github.com/argoproj/argo-cd/blob/main/server/application/application.go#L2666-L2326), [server/application/application.go:2509-2539](https://github.com/argoproj/argo-cd/blob/main/server/application/application.go#L2509-L2539)

## Real-Time Log Streaming and Pod Output

### Overview

The Argo CD application server exposes gRPC and CLI streaming pipelines to aggregate, filter, and stream container logs from managed Kubernetes workloads. The `PodLogs` endpoint handles streaming queries by resolving target pods from the application resource tree, connecting to target cluster REST clients, and multiplexing output streams.

Sources: [server/application/application.go:1856-1913](https://github.com/argoproj/argo-cd/blob/main/server/application/application.go#L1856-L1913)

### Pod Selection and Call-Chain Execution

When `PodLogs` is invoked, execution proceeds through a precise sequence of validation, tree resolution, and stream multiplexing steps:

1. `s.getApplicationEnforceRBACInformer()` — Validates application access and verifies permissions against `rbac.ResourceApplications`.
2. `s.enf.EnforceErr()` — Performs an additional authorization check specifically on `rbac.ResourceLogs` with `rbac.ActionGet`.
3. `s.getAppResources()` — Retrieves the cached resource tree associated with the target application instance.
4. `getSelectedPods()` → `isTheSelectedOne()` — Iterates through resource tree nodes to identify target pods matching the query criteria (such as resource name, group, kind, or namespace), including parent reference tracing for workloads like deployments and rollbacks.
5. `kubeClientset.CoreV1().Pods(pod.Namespace).GetLogs()` — Initiates live log streaming from each selected pod across respective cluster configurations.
6. `mergeLogStreams()` — Multiplexes individual goroutine log channels into a single unified stream ordered by timestamp.

Sources: [server/application/application.go:1890-1963](https://github.com/argoproj/argo-cd/blob/main/server/application/application.go#L1890-L1963), [server/application/application.go:2031-2082](https://github.com/argoproj/argo-cd/blob/main/server/application/application.go#L2031-L2082)

> [!WARNING]
> If the total number of pods matching a log query exceeds the maximum limit returned by `maxPodLogsToRender`, the API immediately rejects the request with an `InvalidArgument` error to prevent resource exhaustion on the server.

Sources: [server/application/application.go:1920-1927](https://github.com/argoproj/argo-cd/blob/main/server/application/application.go#L1920-L1927)

### Log Filtering and Stream Options

The `ApplicationPodLogsQuery` struct supports parameters for refining log output. Filters can include literal string matching, inverse filtering via an exclamation prefix (`!`), case sensitivity flags, time bounds, and container selection.

| Field / Option | Type | Default | Purpose |
| :--- | :--- | :--- | :--- |
| `PodName` / `ResourceName` | `*string` | `nil` | Targets a specific pod or resource name for log retrieval. |
| `Container` | `*string` | `nil` | Specifies an individual container within multi-container pods. |
| `Follow` | `*bool` | `false` | Keeps the log stream open for real--time output streaming. |
| `TailLines` | `*int64` | `0` | Limits output to the last $N$ lines from the log stream. |
| `SinceSeconds` | `*int64` | `0` | Restricts logs to entries newer than the specified relative duration. |
| `UntilTime` | `string` | `""` | Terminates streaming when log timestamps exceed the provided RFC3339Nano value. |
| `Filter` | `*string` | `""` | Filters lines containing a literal string (supports inverse matching with `!`). |
| `Previous` | `*bool` | `false` | Retrieves logs from previously terminated container instances. |

Sources: [server/application/application.go:1856-1888](https://github.com/argoproj/argo-cd/blob/main/server/application/application.go#L1856-L1888), [cmd/argocd/commands/app.go:516-649](https://github.com/argoproj/argo-cd/blob/main/cmd/argocd/commands/app.go#L516-L649)

> [!TIP]
> Prefixing a log filter string with `!` (e.g., `!error`) instructs the log parser to run an inverse filter, omitting lines that contain the literal string and returning only non-matching log entries.

Sources: [server/application/application.go:1882-1888](https://github.com/argoproj/argo-cd/blob/main/server/application/application.go#L1882-L1888), [server/application/application.go:1975-1985](https://github.com/argoproj/argo-cd/blob/main/server/application/application.go#L1975-L1985)

## Manifest Generation and Server-Side Diffing

### Overview

The Argo CD application server exposes dedicated gRPC endpoints for querying generated manifests, exploring hierarchical resource trees, and computing server-side diffs against live cluster states. These APIs interact closely with the repository server and gitops-engine components to render target states and compare them with actual cluster resources.

Sources: [server/application/application.go:491-651](https://github.com/argoproj/argo-cd/blob/main/server/application/application.go#L491-L651), [server/application/application.go:3983-3213](https://github.com/argoproj/argo-cd/blob/main/server/application/application.go#L3983-L3213)

### Manifest Generation and Streaming

The `GetManifests` and `GetManifestsWithFiles` endpoints orchestrate manifest compilation through the repository server client. 

1. `s.getApplicationEnforceRBACInformer()` — Validates application accessibility and RBAC permissions for the requesting user context.
2. `s.queryRepoServer()` — Acquires permitted Helm, OCI repositories, credentials, and settings configurations scoped to the application's project.
3. `s.kubectl.GetServerVersion()` and `GetAPIResources()` — Inspects the target cluster's control plane capabilities and installed API versions.
4. `client.GenerateManifest()` — Invokes the repo-server RPC to render manifests for single-source, multi-source, or source-hydrator configurations.
5. `diff.HideSecretData()` — Inspects unmarshaled unstructured objects; if an object is a Kubernetes `Secret` in the core API group, sensitive fields are masked based on settings manager configurations before returning results to the client.

Sources: [server/application/application.go:492-651](https://github.com/argoproj/argo-cd/blob/main/server/application/application.go#L492-L651)

> [!WARNING]
> When rendering manifests, raw `Secret` objects in the core group have their sensitive data dynamically hidden using configured sensitive annotations to prevent leaking credentials over the API.

Sources: [server/application/application.go:635-645](https://github.com/argoproj/argo-cd/blob/main/server/application/application.go#L635-L645)

### Server-Side Diffing Execution

The `ServerSideDiff` endpoint performs dry-run applications against the destination cluster via the gitops-engine diff subsystem.

| Component / Parameter | Type | Purpose |
| :--- | :--- | :--- |
| `q.GetAppName()` | `string` | Identifies the target application being evaluated. |
| `q.GetLiveResources()` | `[]LiveResource` | Supplies current live state snapshots from the client or cache. |
| `q.GetTargetManifests()` | `[]string` | Provides target manifest strings for dry-run comparison. |
| `dryRunner` | `diff.K8sServerSideDryRunner` | Executes server-side apply dry runs against the target cluster. |
| `gvkParser` | `kube.GVKParser` | Parses GroupVersionKinds using the cluster's OpenAPI schema. |

Sources: [server/application/application.go:3983-3057](https://github.com/argoproj/argo-cd/blob/main/server/application/application.go#L3983-L3057)

> [!TIP]
> The server-side diff workflow verifies that every requested live resource is a valid managed resource of the application before initiating cluster dry-runs, returning a `PermissionDenied` error if an unmanaged resource is referenced.

Sources: [server/application/application.go:3080-3091](https://github.com/argoproj/argo-cd/blob/main/server/application/application.go#L3080-L3091)

## Resource Action Execution and Deep Links

### Overview

The Argo CD application server provides specialized gRPC endpoints for discovering and executing custom Lua-based resource actions, as well as evaluating customizable deep link metadata for applications and individual managed cluster resources. These capabilities allow operators to extend cluster resource management and integrate Argo CD UI views with external third-party systems.

Sources: [server/application/application.go:2328-2368](https://github.com/argoproj/argo-cd/blob/main/server/application/application.go#L2328-L2368), [server/application/application.go:2404-2441](https://github.com/argoproj/argo-cd/blob/main/server/application/application.go#L2404-L2441), [server/application/application.go:2562-2582](https://github.com/argoproj/argo-cd/blob/main/server/application/application.go#L2562-L2582), [server/application/application.go:2663-2777](https://github.com/argoproj/argo-cd/blob/main/server/application/application.go#L2663-L2777)

### Custom Resource Actions

#### Resource Action Execution Call-Chain

Custom resource actions are defined via Lua scripts configured in resource overrides and executed against live Kubernetes objects. The lifecycle of discovering and executing a resource action follows a rigorous call-chain validation and execution path:

1. `s.getUnstructuredLiveResourceOrApp()` — Resolves the target resource or application, enforces RBAC action rules (such as `action/<group>/<kind>/<action>`), and fetches the live unstructured object via `kubectl` or informer caches.
2. `s.settingsMgr.GetResourceOverrides()` — Retrieves cluster-level resource override configurations containing embedded Lua action definitions.
3. `luaVM.GetResourceAction()` — Compiles and loads the specified action script from the Lua virtual machine.
4. `luaVM.ExecuteResourceAction()` — Executes the Lua action script with optional parameters, returning a slice of impacted resources and associated Kubernetes operations (`lua.CreateOperation` or `lua.PatchOperation`).
5. `s.verifyResourcePermitted()` — Validates that the application's project permits managing each generated or modified resource against the target cluster.
6. `s.kubectl.CreateResource()` or `s.patchResource()` — Applies the resulting changes to the destination cluster. During patching, `splitStatusPatch()` isolates status subresource modifications from spec modifications if the CRD supports status subresources.

Sources: [server/application/application.go:2584-2616](https://github.com/argoproj/argo-cd/blob/main/server/application/application.go#L2584-L2616), [server/application/application.go:2685-2819](https://github.com/argoproj/argo-cd/blob/main/server/application/application.go#L2685-L2819), [server/application/application.go:2850-2879](https://github.com/argoproj/argo-cd/blob/main/server/application/application.go#L2850-L2879)

> [!CAUTION]
> When executing custom actions that modify resource status fields, Argo CD attempts to patch the status subresource first; if the CRD lacks status subresource support and returns a 404 error, it automatically falls back to a standard resource patch.

Sources: [server/application/application.go:2791-2812](https://github.com/argoproj/argo-cd/blob/main/server/application/application.go#L2791-L2812)

### Deep Link Evaluation

The `ListLinks` and `ListResourceLinks` endpoints evaluate templated deep links configured in Argo CD settings for applications and resources.

| API Endpoint | Request Type | Configuration Key | Purpose |
| :--- | :--- | :--- | :--- |
| `ListLinks` | `application.ListAppLinksRequest` | `settings.ApplicationDeepLinks` | Evaluates and returns deep link metadata for an Application. |
| `ListResourceLinks` | `application.ApplicationResourceRequest` | `settings.ResourceDeepLinks` | Evaluates and returns deep link metadata for a specific cluster resource. |

Sources: [server/application/application.go:2328-2368](https://github.com/argoproj/argo-cd/blob/main/server/application/application.go#L2328-L2368), [server/application/application.go:2404-2441](https://github.com/argoproj/argo-cd/blob/main/server/application/application.go#L2404-L2441)

> [!TIP]
> If a managed-by URL is not explicitly defined in the deep links configuration object, Argo CD falls back to using the base URL configured in the global settings manager instance.

Sources: [server/application/application.go:2352-2360](https://github.com/argoproj/argo-cd/blob/main/server/application/application.go#L2352-L2360)

## RBAC Policy Enforcement and Impersonation

### Overview

Argo CD enforces fine-grained access control and security isolation through project-level RBAC rules, namespace permissions, and Kubernetes service account impersonation. When API requests are processed, permission checks inspect user claims, target projects, and resource identifiers to prevent unauthorized access or information leakage.

Sources: [server/application/application.go:177-254](https://github.com/argoproj/argo-cd/blob/main/server/application/application.go#L177-L254), [server/application/application.go:1402-1446](https://github.com/argoproj/argo-cd/blob/main/server/application/application.go#L1402-L1446)

### RBAC Enforcement and Information Obscuring

#### RBAC Validation Call-Chain

The `getAppEnforceRBAC` method governs permission validation across application queries and mutations. To prevent attackers from inferring the existence of applications they cannot access via timing side-channels or error codes, the enforcer executes specific validation steps:

1. `session.Username(ctx)` — Extracts the authenticated username from the request context or defaults to `"Unknown user"`.
2. `security.RBACName()` — Constructs the fully qualified resource name combining namespace, project, and application name if a project parameter is provided.
3. `s.enf.EnforceErr()` — Evaluates whether the user's claims possess the required action (such as `get`, `create`, `update`, `delete`, or `sync`) against application resources.
4. `getApp()` — Fetches the application object via informer lister or Kubernetes client. If an initial RBAC check fails or the application is not found, a dummy `getApp()` execution is triggered to equalize response timings.
5. `s.getAppProject()` — Retrieves the associated project and enforces project-level restrictions, returning a vague error (`"app is not allowed in project ..., or the project does not exist"`) on permission or lookup failures to prevent project enumeration.

Sources: [server/application/application.go:177-254](https://github.com/argoproj/argo-cd/blob/main/server/application/application.go#L177-L254), [server/application/application.go:1136-1160](https://github.com/argoproj/argo-cd/blob/main/server/application/application.go#L1136-L1160)

> [!WARNING]
> If a user specifies a project parameter in a query but the application resides in a different project, Argo CD returns a `404 Not Found` error rather than a permission error. This guarantees callers cannot determine whether an application exists under a different project boundary.

Sources: [server/application/application.go:239-247](https://github.com/argoproj/argo-cd/blob/main/server/application/application.go#L239-L247)

### Service Account Impersonation

When communicating with external or in-cluster Kubernetes destinations, the server can derive and impersonate a specific service account based on project and application configurations.

| Method / Function | Config Field / Return Type | Purpose |
| :--- | :--- | :--- |
| `s.settingsMgr.IsImpersonationEnabled()` | `bool` | Checks global settings to determine if service account impersonation is enabled. |
| `settings.DeriveServiceAccountToImpersonate()` | `string` | Derives the target service account name from the `AppProject`, `Application`, and `Cluster`. |
| `s.settingsMgr.IsImpersonationEnforced()` | `bool` | Checks if matching service accounts are strictly mandatory for target execution. |
| `config.Impersonate` | `rest.ImpersonationConfig` | Assigns the derived service account username to the Kubernetes REST client configuration. |

Sources: [server/application/application.go:1412-1444](https://github.com/argoproj/argo-cd/blob/main/server/application/application.go#L1412-L1444)

> [!TIP]
> If impersonation is enabled but no matching service account can be derived for an application's destination server and namespace, Argo CD checks whether impersonation enforcement is active. If enforcement is disabled, it logs a warning and gracefully falls back to the controller's service account.

Sources: [server/application/application.go:1425-1439](https://github.com/argoproj/argo-cd/blob/main/server/application/application.go#L1425-L1439)

## Related

- [[Server Runtime]]
- [[Application Controller]]

