# Resource Diffing

<details>
<summary>Relevant source files</summary>

The following files were used as context for generating this wiki page:

- [cmd/argocd/commands/app_diff.go](https://github.com/argoproj/argo-cd/blob/main/cmd/argocd/commands/app_diff.go)
- [docs/user-guide/diffing.md](https://github.com/argoproj/argo-cd/blob/main/docs/user-guide/diffing.md)
- [controller/state.go](https://github.com/argoproj/argo-cd/blob/main/controller/state.go)
- [controller/sync.go](https://github.com/argoproj/argo-cd/blob/main/controller/sync.go)
- [docs/operator-manual/reconcile.md](https://github.com/argoproj/argo-cd/blob/main/docs/operator-manual/reconcile.md)
- [gitops-engine/pkg/diff/diff.go](https://github.com/argoproj/argo-cd/blob/main/gitops-engine/pkg/diff/diff.go)
- [server/application/application.go](https://github.com/argoproj/argo-cd/blob/main/server/application/application.go)
</details>

## Overview

Resource diffing is a core capability in Argo CD that compares the desired target manifests declared in Git or Helm against the live state of resources running in a target Kubernetes cluster. By continuously evaluating these differences, Argo CD determines whether an application is synchronized (`Synced`) or has drifted (`OutOfSync`), surfacing unauthorized changes, pending pruning operations, or upstream template fluctuations. The diffing subsystem addresses complex synchronization challenges—such as variable generation, field ordering discrepancies, mutating webhook interventions, and sensitive secret data—through normalized comparison pipelines, structured merge diff algorithms, and multi-tier configuration overrides at both the application and system levels.

Sources: [gitops-engine/pkg/diff/diff.go:3-50](https://github.com/argoproj/argo-cd/blob/main/gitops-engine/pkg/diff/diff.go#L3-L50), [docs/user-guide/diffing.md:3-17](https://github.com/argoproj/argo-cd/blob/main/docs/user-guide/diffing.md#L3-L17)

## Core Engine Diff Calculation Algorithms

### Overview

The `gitops-engine/pkg/diff` package implements core resource comparison algorithms mirroring `kubectl diff`. The top-level entry point is `Diff()`, which receives a context, optional desired config and live unstructured objects, and optional configuration flags. It normalizes inputs, checks feature flags or sync options for server-side diffs and structured merge diffs, evaluates the presence of `kubectl.kubernetes.io/last-applied-configuration`, and dispatches to either structured merge diff, three-way diff, two-way diff, or creation/deletion handlers.

Sources: [gitops-engine/pkg/diff/diff.go:74-134](https://github.com/argoproj/argo-cd/blob/main/gitops-engine/pkg/diff/diff.go#L74-L134)

### Structured Merge Diffs

When structured merge diff is requested via options or the `ServerSideApply=true` sync option annotation, `StructuredMergeDiff()` resolves the parseable type via GVK parser, converts live and config objects into typed values, and delegates to the `merge.Updater` engine. 

```
StructuredMergeDiff() → serverSideDiff() / structuredMergeDiff() → gescheme.ResolveParseableType() → pt.FromUnstructured() → apply() [updates via merge.Updater] → normalizeTypedValue() → buildDiffResult()
```

Sources: [gitops-engine/pkg/diff/diff.go:415-521](https://github.com/argoproj/argo-cd/blob/main/gitops-engine/pkg/diff/diff.go#L415-L521)

> [!NOTE]
> When `ignoreMutationWebhook` is active during server-side diffs, `removeWebhookMutation()` builds a set of fields managed by the designated manager, calculates the set difference against unmanaged fields, excludes manager-owned ancestors, filters out composite key fields in associative lists, and merges predicted states back with live states to strip out webhook-induced modifications.

Sources: [gitops-engine/pkg/diff/diff.go:179-315](https://github.com/argoproj/argo-cd/blob/main/gitops-engine/pkg/diff/diff.go#L179-L315)

### Three-Way Diffs and Strategic Merge

When the live resource contains the `kubectl.kubernetes.io/last-applied-configuration` annotation, `Diff()` extracts it as the original state and dispatches to `ThreeWayDiff()`. This function strips namespaces and empty annotation maps, generates a three-way merge patch, and applies it against live bytes.

```
ThreeWayDiff() → removeNamespaceAnnotation() → threeWayMergePatch() → applyPatch() [or jsonpatch.MergePatch] → buildDiffResult()
```

Sources: [gitops-engine/pkg/diff/diff.go:749-782](https://github.com/argoproj/argo-cd/blob/main/gitops-engine/pkg/diff/diff.go#L749-L782), [gitops-engine/pkg/diff/diff.go:830-878](https://github.com/argoproj/argo-cd/blob/main/gitops-engine/pkg/diff/diff.go#L830-L878)

> [!WARNING]
> StatefulSets require special handling because the Kubernetes API server injects defaulted fields into `volumeClaimTemplates` that cannot be reproduced client-side. The engine invokes `statefulSetWorkaround()` to strip defaulted template fields prior to patch construction.

Sources: [gitops-engine/pkg/diff/diff.go:814-828](https://github.com/argoproj/argo-cd/blob/main/gitops-engine/pkg/diff/diff.go#L814-L828)

### Secret Obfuscation

For core `Secret` resources, `HideSecretData()` processes target manifests, live states, and last-applied configuration annotations to mask secret data symmetrically. Equal values receive matching placeholders (`++++++++`, `++++++++++++`, etc.), while distinct values receive differing placeholder lengths, preserving equality relationships across manifests without leaking plaintext credentials.

Sources: [gitops-engine/pkg/diff/diff.go:199-206](https://github.com/argoproj/argo-cd/blob/main/gitops-engine/pkg/diff/diff.go#L199-L206), [gitops-engine/pkg/diff/diff.go:1111-1163](https://github.com/argoproj/argo-cd/blob/main/gitops-engine/pkg/diff/diff.go#L1111-L1163)

### Diff Strategy Selection

| Diff Method | Trigger Condition | Underlying Mechanism |
| :--- | :--- | :--- |
| **Server-Side Diff** | `serverSideDiff` option enabled | Dry-run server-side apply via `serverSideDryRunner` |
| **Structured Merge Diff** | `structuredMergeDiff` option or `ServerSideApply=true` annotation | `sigs.k8s.io/structured-merge-diff` `Updater.Apply` |
| **Three-Way Diff** | Presence of `kubectl.kubernetes.io/last-applied-configuration` annotation | Strategic merge patch or JSON merge patch |
| **Two-Way Diff** | Fallback when last-applied configuration is absent | Two-way merge patch comparing config directly against live |
| **Create/Delete Diff** | Either `config` or `live` is `nil` | `handleResourceCreateOrDeleteDiff` |

Sources: [gitops-engine/pkg/diff/diff.go:74-134](https://github.com/argoproj/argo-cd/blob/main/gitops-engine/pkg/diff/diff.go#L74-L134), [gitops-engine/pkg/diff/diff.go:571-600](https://github.com/argoproj/argo-cd/blob/main/gitops-engine/pkg/diff/diff.go#L571-L600)

## Controller Application State Comparison

### Overview

The application state comparison loop managed by `appStateManager` coordinates the end-to-end reconciliation workflow within the Argo CD controller. When an application requires a status refresh or reconciliation, `CompareAppState` orchestrates repository manifest generation, target object normalization, live cluster state retrieval via the live state cache, reconciliation planning, and diff evaluation.

Sources: [controller/state.go:680-746](https://github.com/argoproj/argo-cd/blob/main/controller/state.go#L680-L746)

### Application State Comparison Call Chain

The reconciliation and diff evaluation sequence executes through specific internal functions:

```
CompareAppState() → GetRepoObjs() → NormalizeTargetObjects() → liveStateCache.GetManagedLiveObjs() → sync.Reconcile() → argodiff.StateDiffs()
```

1. **`CompareAppState()`**: Initializes the comparison context, builds timing stats, loads settings, and drives manifest loading.
2. **`GetRepoObjs()`**: Contacts the repo-server via gRPC `GenerateManifest` to compile templates into unstructured target objects.
3. **`NormalizeTargetObjects()`**: Enforces scope rules, normalizes namespaces based on resource scope, appends application instance tracking labels, and detects duplicate resources.
4. **`GetManagedLiveObjs()`**: Queries the cluster cache for live objects managed by the application.
5. **`sync.Reconcile()`**: Pairs target objects with live objects and discovers resource hooks.
6. **`argodiff.StateDiffs()`**: Evaluates differences between live and target collections using the configured diff configuration.

Sources: [controller/state.go:228-460](https://github.com/argoproj/argo-cd/blob/main/controller/state.go#L228-L460), [controller/state.go:572-623](https://github.com/argoproj/argo-cd/blob/main/controller/state.go#L572-L623), [controller/state.go:824-902](https://github.com/argoproj/argo-cd/blob/main/controller/state.go#L824-L902), [controller/state.go:971-976](https://github.com/argoproj/argo-cd/blob/main/controller/state.go#L971-L976)

> [!NOTE]
> `useDiffCache` evaluates whether an existing diff cache can be leveraged. It checks flags such as `noCache`, explicit user refresh requests, expiration timeout thresholds, manifest length mismatches, revision changes, and spec modifications against compared-to statuses.

Sources: [controller/state.go:1180-1218](https://github.com/argoproj/argo-cd/blob/main/controller/state.go#L1180-L1218)

### Target Manifest Normalization and Patching

Target objects undergo normalization through `NormalizeTargetObjects()` and `normalizeTargetResources()`. If a resource is cluster-scoped but specifies a namespace, its namespace is cleared. Conversely, missing namespaces on namespaced objects inherit the application destination namespace, triggering instance label application.

Sources: [controller/state.go:572-623](https://github.com/argoproj/argo-cd/blob/main/controller/state.go#L572-L623), [controller/sync.go:496-577](https://github.com/argoproj/argo-cd/blob/main/controller/sync.go#L496-L577)

> [!CAUTION]
> When `RespectIgnoreDifferences=true` is enabled during synchronization, `normalizeTargetResources()` calculates merge patches from live resources to preserve ignored fields. The `status` subresource is explicitly removed from live patches to prevent the controller from asserting co-ownership of controller-owned statuses under server-side apply.

Sources: [controller/sync.go:535-549](https://github.com/argoproj/argo-cd/blob/main/controller/sync.go#L535-L549)

### Reconciliation Settings and Configurations

The diff configuration builder integrates ignore differences, resource overrides, GVK parsers, and server-side diffdry-runners.

| Configuration Builder Method | Parameter / Option | Purpose |
| :--- | :--- | :--- |
| `WithDiffSettings` | `IgnoreDifferences`, `resourceOverrides`, `IgnoreAggregatedRoles`, `ignoreNormalizerOpts` | Sets custom field-level ignore rules and override policies |
| `WithTracking` | `appLabelKey`, `trackingMethod` | Configures resource instance tracking annotations or labels |
| `WithCache` | `appstatecache.Cache`, `appName` | Connects the application state cache for diff caching |
| `WithServerSideDiff` | `serverSideDiff` (bool) | Enables or disables server-side dry-run diff evaluation |
| `WithStructuredMergeDiff` | `true` | Enables structured merge diff when `ServerSideApply=true` |

Sources: [controller/state.go:925-962](https://github.com/argoproj/argo-cd/blob/main/controller/state.go#L925-L962)

## API Server Diff Endpoint Processing

### Overview

The Argo CD API server provides gRPC endpoints in `server/application/application.go` for managing application resources, processing server-side dry runs, and querying resource diffs. These operations coordinate user authorization, project lock constraints, and cluster state retrieval.

Sources: [server/application/application.go:90-165](https://github.com/argoproj/argo-cd/blob/main/server/application/application.go#L90-L165)

### API Server Initialization and Server Structure

The `Server` struct encapsulates cluster client sets, application informers, repo client sets, Kubectl helpers, and RBAC enforcers. The `NewServer` constructor instantiates the service and returns both the `ApplicationServiceServer` interface and the application resource tree function `s.getAppResources`.

```go
func NewServer(
	namespace string,
	kubeclientset kubernetes.Interface,
	appclientset appclientset.Interface,
	appLister applisters.ApplicationLister,
	appInformer cache.SharedIndexInformer,
	appBroadcaster broadcast.Broadcaster[v1alpha1.ApplicationWatchEvent],
	repoClientset apiclient.Clientset,
	cache *servercache.Cache,
	kubectl kube.Kubectl,
	db db.ArgoDB,
	enf *rbac.Enforcer,
	projectLock sync.KeyLock,
	settingsMgr *settings.SettingsManager,
	projInformer cache.SharedIndexInformer,
	enabledNamespaces []string,
	enableK8sEvent []string,
	syncWithReplaceAllowed bool,
) (application.ApplicationServiceServer, AppResourceTreeFn)
```

Sources: [server/application/application.go:91-165](https://github.com/argoproj/argo-cd/blob/main/server/application/application.go#L91-L165)

### Authorization and Project Security Enforcement

Access control for application endpoints is governed by `getAppEnforceRBAC()`. It evaluates claims against the RBAC enforcer and prevents namespace or application existence leakage when unauthorized users issue requests.

> [!WARNING]
> If an application does not exist, `getAppEnforceRBAC()` returns a "permission denied" error rather than a 404 Not Found status. This prevents unauthorized users from inferring whether an arbitrary application name exists within the system.

Sources: [server/application/application.go:167-196](https://github.com/argoproj/argo-cd/blob/main/server/application/application.go#L167-L196)

## CLI Diff Execution Strategies

### Overview

The `argocd app diff` CLI command renders differences between live cluster resources and target manifests. It supports client-side comparison using `gitops-engine` or server-side diff evaluation via the Argo CD API server, alongside local manifest comparison workflows.

Sources: [cmd/argocd/commands/app_diff.go:623-649](https://github.com/argoproj/argo-cd/blob/main/cmd/argocd/commands/app_diff.go#L623-L649)

### CLI Command Flags and Configuration

The `NewApplicationDiffCommand` function configures cobra flags controlling refresh behavior, exit codes, local file paths, and server-side diff performance tuning.

| Flag Name | Type | Default | Purpose |
| :--- | :--- | :--- | :--- |
| `refresh` | `bool` | `false` | Refresh application data when retrieving |
| `hard-refresh` | `bool` | `false` | Refresh application data as well as target manifests cache |
| `exit-code` | `bool` | `true` | Return non-zero exit code when there is a diff |
| `diff-exit-code` | `int` | `1` | Return specified exit code when a diff is found |
| `local` | `string` | `""` | Compare live app to local manifests |
| `revision` | `string` | `""` | Compare live app to a particular revision |
| `local-repo-root` | `string` | `"/"` | Path to repository root used with `--local` |
| `server-side-generate` | `bool` | `false` | Send local manifests to server for generation/diffing |
| `server-side-diff` | `bool` | `false` | Use server-side diff to calculate differences |
| `server-side-diff-concurrency` | `int` | `-1` | Max concurrent batches (`-1` = unlimited, `1` = sequential, `0` = invalid) |
| `server-side-diff-max-batch-kb` | `int` | `250` | Max batch size in KB for server-side diff payloads |
| `local-include` | `string[]` | `["*.yaml", "*.yml", "*.json"]` | Filename patterns to send with `--server-side-generate` |
| `app-namespace` | `string` | `""` | Only render the difference in namespace (`-N`) |
| `revisions` | `string[]` | `[]` | Manifest revisions for multi-source positions |
| `source-positions` | `int64[]` | `[]` | List of source positions starting at 1 |
| `source-names` | `string[]` | `[]` | List of source names for multi-source resolution |
| `ignore-normalizer-jq-execution-timeout` | `duration` | `normalizers.DefaultJQExecutionTimeout` | Set JQ execution timeout for ignore normalizers |

Sources: [cmd/argocd/commands/app_diff.go:790-806](https://github.com/argoproj/argo-cd/blob/main/cmd/argocd/commands/app_diff.go#L790-L806), [cmd/argocd/commands/app_diff.go:810-813](https://github.com/argoproj/argo-cd/blob/main/cmd/argocd/commands/app_diff.go#L810-L813)

### Strategy Selection and Comparison Execution

Diff strategies are encapsulated by the `diffStrategy` function type, which evaluates batches of `comparisonObject` pairs and returns `diff.DiffResult` slices from `gitops-engine`.

```go
type comparisonObject struct {
	key    kube.ResourceKey
	live   *unstructured.Unstructured
	target *unstructured.Unstructured
}

type diffStrategy func(ctx context.Context, items []comparisonObject) ([]*diff.DiffResult, error)
```

Sources: [cmd/argocd/commands/app_diff.go:49-59](https://github.com/argoproj/argo-cd/blob/main/cmd/argocd/commands/app_diff.go#L49-L59)

> [!WARNING]
> When executing `--server-side-diff` with `--local`, you must also pass `--server-side-generate`. Without server-side generation, client-generated manifests will mismatch server-side expectations and abort execution.

Sources: [cmd/argocd/commands/app_diff.go:714-716](https://github.com/argoproj/argo-cd/blob/main/cmd/argocd/commands/app_diff.go#L714-L716)

### Local Manifest Comparison and Manifest Providers

Manifest providers implement the `manifestProvider` signature to retrieve target unstructured objects before diffing. The CLI switches between single revision, multi-source revision, local client-side generation, local server-side generation, and default managed resource providers.

```go
type manifestProvider func(ctx context.Context) ([]*unstructured.Unstructured, error)
```

Sources: [cmd/argocd/commands/app_diff.go:46-47](https://github.com/argoproj/argo-cd/blob/main/cmd/argocd/commands/app_diff.go#L46-L47)

> [!NOTE]
> Secrets are explicitly skipped in local client-side diffs (`getLocalObjects`) because `diff.HideSecretData` requires server-side configurations to function reliably. Consequently, `excludeSecret` is set to `true` for local client-side provider runs.

Sources: [cmd/argocd/commands/app_diff.go:169-174](https://github.com/argoproj/argo-cd/blob/main/cmd/argocd/commands/app_diff.go#L169-L174), [cmd/argocd/commands/app_diff.go:748-751](https://github.com/argoproj/argo-cd/blob/main/cmd/argocd/commands/app_diff.go#L748-L751)

## Diff Customization and Reconciliation Tuning

### Overview

Argo CD allows ignoring differences and tuning reconciliation behavior to suppress false positives caused by mutating webhooks, controllers, or custom marshaling. Diff customizations and reconciliation rules can be configured at the application level via the `spec.ignoreDifferences` field or at the system level using keys inside the `argocd-cm` ConfigMap.

Sources: [docs/user-guide/diffing.md:17-22](https://github.com/argoproj/argo-cd/blob/main/docs/user-guide/diffing.md#L17-L22), [docs/user-guide/diffing.md:83-86](https://github.com/argoproj/argo-cd/blob/main/docs/user-guide/diffing.md#L83-L86)

### Application and System-Level Configuration

At the application level, `ignoreDifferences` supports RFC6902 JSON pointers, JQ path expressions, and `managedFieldsManagers`. Slashes in JSON pointers must be escaped as `~1`.

```yaml
spec:
  ignoreDifferences:
    - group: apps
      kind: Deployment
      jsonPointers:
        - /spec/replicas
      jqPathExpressions:
        - .spec.template.spec.initContainers[] | select(.name == "injected-init-container")
      managedFieldsManagers:
        - kube-controller-manager
```

Sources: [docs/user-guide/diffing.md:20-82](https://github.com/argoproj/argo-cd/blob/main/docs/user-guide/diffing.md#L20-L82)

System-level configurations in `argocd-cm` apply resource customizations globally across applications. The `resource.compareoptions` block controls status field diffing and aggregated role handling.

| Key | Values / Type | Default | Purpose |
| :--- | :--- | :--- | :--- |
| `ignoreResourceStatusField` | `all`, `crd`, `none` | `all` | Disables status field diffing in specified resource types |
| `ignoreAggregatedRoles` | `bool` | `false` | Ignores `rules` changes in Aggregated ClusterRoles |
| `ignoreDifferencesOnResourceUpdates` | `bool` | `true` | Inherits system-level `ignoreDifferences` into resource update checks |
| `resource.ignoreResourceUpdatesEnabled` | `bool` | `true` | Enables ignoring resource updates to optimize reconciliation performance |

Sources: [docs/user-guide/diffing.md:117-148](https://github.com/argoproj/argo-cd/blob/main/docs/user-guide/diffing.md#L117-L148), [docs/operator-manual/reconcile.md:12-65](https://github.com/argoproj/argo-cd/blob/main/docs/operator-manual/reconcile.md#L12-L65)

> [!NOTE]
> JQ path expression evaluation is limited to a default timeout of one second. You can extend this limit by configuring `ignore.normalizer.jq.timeout` inside the `argocd-cmd-params-cm` ConfigMap.

Sources: [docs/user-guide/diffing.md:198-209](https://github.com/argoproj/argo-cd/blob/main/docs/user-guide/diffing.md#L198-L209)

### Reconciliation Optimization and Performance Tuning

By default, an Argo CD application refreshes whenever a watched resource changes. High-churn controllers can trigger continuous reconciliation loops and elevate CPU usage on the `argocd-application-controller`. Enabling `resource.ignoreResourceUpdates` suppresses application refreshes when non-watched fields change, provided the resource's health status remains unaltered. 

Sources: [docs/operator-manual/reconcile.md:1-11](https://github.com/argoproj/argo-cd/blob/main/docs/operator-manual/reconcile.md#L1-L11)

> [!WARNING]
> Argo CD applies `ignoreResourceUpdates` exclusively to tracked resources. Dependent child resources like Pods created by a Deployment will trigger application reconciliations on any update unless annotated directly with `argocd.argoproj.io/ignore-resource-updates=true`.

Sources: [docs/operator-manual/reconcile.md:127-133](https://github.com/argoproj/argo-cd/blob/main/docs/operator-manual/reconcile.md#L127-L133)

## Related

- [[Reconciliation Engine]]
- [[Resource Cache]]

