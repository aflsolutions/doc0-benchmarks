# Application CLI

<details>
<summary>Relevant source files</summary>

The following files were used as context for generating this wiki page:

- [cmd/argocd/commands/app.go](https://github.com/argoproj/argo-cd/blob/main/cmd/argocd/commands/app.go)
- [cmd/argocd-application-controller/commands/argocd_application_controller.go](https://github.com/argoproj/argo-cd/blob/main/cmd/argocd-application-controller/commands/argocd_application_controller.go)
- [cmd/argocd/commands/app_diff.go](https://github.com/argoproj/argo-cd/blob/main/cmd/argocd/commands/app_diff.go)
- [docs/user-guide/commands/argocd_app_sync.md](https://github.com/argoproj/argo-cd/blob/main/docs/user-guide/commands/argocd_app_sync.md)
</details>

## Overview

The Application CLI (`argocd app`) serves as the primary command-line interface for managing Argo CD applications, enabling operators to interact directly with the Argo CD API server or Kubernetes control plane. It provides comprehensive tooling to handle full application lifecycles, reconcile drift, synchronize deployments, mutate specifications, and inspect target manifests or live resource health.

Sources: [cmd/argocd/commands/app.go:58-101](https://github.com/argoproj/argo-cd/blob/main/cmd/argocd/commands/app.go#L58-L101)

## CLI Command Structure and Lifecycle

### CLI Command Structure and Lifecycle

### Overview

The root `argocd app` command functions as a Cobra command container that registers and coordinates all application management subcommands. When invoked without arguments, it executes its default `Run` function, which prints the command help text and exits with status code `1`. The lifecycle of each managed command follows a strict sequence: client initialization via `headless.NewClientOrDie(clientOpts, c)`, establishment of a gRPC connection and service client (`acdClient.NewApplicationClientOrDie()`), parsing of qualified application names using `argo.ParseFromQualifiedName(args[0], appNamespace)`, execution of the respective API request, and deferred connection closure via `utilio.Close(conn)`.

Sources: [cmd/argocd/commands/app.go:58-101](https://github.com/argoproj/argo-cd/blob/main/cmd/argocd/commands/app.go#L58-L101), [cmd/argocd/commands/app.go:381-390](https://github.com/argoproj/argo-cd/blob/main/cmd/argocd/commands/app.go#L381-L390)

### Application Lifecycle Commands

Core application management encompasses creation, retrieval, listing, editing, patching, deletion, and operation termination. Each command exposes specific flags and handles errors through `errors.CheckError(err)`.

* **Creation (`create`)**: Constructs applications via `cmdutil.ConstructApps` and dispatches an `application.ApplicationCreateRequest`. It evaluates whether the app already exists by querying `appIf.Get` (permitting `codes.NotFound` and `codes.PermissionDenied` under CVE-2022-41354 mitigations) and logs whether the resource was created, updated, or left unchanged based on `hasAppChanged`.
* **Retrieval (`get`)**: Fetches application details supporting multiple output formats (`wide`, `yaml`, `json`, `tree`, `tree=detailed`) and implements a retry mechanism with context timeouts to fallback when refresh flags block.
* **Listing (`list`)**: Queries applications through `appIf.List` with optional label selectors and project/repo/cluster/path filters, supporting output modes `wide`, `name`, `json`, and `yaml`.
* **Editing (`edit`)**: Fetches the application specification, serializes it to YAML, opens an interactive editor via `cli.InteractiveEdit`, parses the modified YAML back into an `argoappv1.ApplicationSpec`, and submits updates via `appIf.UpdateSpec`.
* **Patching (`patch`)**: Submits JSON or merge patch bodies to the application service via `appIf.Patch` and prints the resulting marshaled YAML.
* **Deletion (`delete`)**: Resolves target applications via label selectors or positional arguments, prompts operators conditionally based on `isatty` and prompt flags, and issues `appIf.Delete` with configurable cascade and propagation policies.
* **Termination (`terminate-op`)**: Sends an `application.OperationTerminateRequest` to cancel any running operation on a target application.

Sources: [cmd/argocd/commands/app.go:113-197](https://github.com/argoproj/argo-cd/blob/main/cmd/argocd/commands/app.go#L113-L197), [cmd/argocd/commands/app.go:342-512](https://github.com/argoproj/argo-cd/blob/main/cmd/argocd/commands/app.go#L342-L512), [cmd/argocd/commands/app.go:1406-1476](https://github.com/argoproj/argo-cd/blob/main/cmd/argocd/commands/app.go#L1406-L1476), [cmd/argocd/commands/app.go:1261-1357](https://github.com/argoproj/argo-cd/blob/main/cmd/argocd/commands/app.go#L1261-L1357), [cmd/argocd/commands/app.go:2957-2983](https://github.com/argoproj/argo-cd/blob/main/cmd/argocd/commands/app.go#L2957-L2983), [cmd/argocd/commands/app.go:2985-3044](https://github.com/argoproj/argo-cd/blob/main/cmd/argocd/commands/app.go#L2985-L3044), [cmd/argocd/commands/app.go:3046-3090](https://github.com/argoproj/argo-cd/blob/main/cmd/argocd/commands/app.go#L3046-L3090)

### Subcommand Registration Reference

| Subcommand | Function Builder | Primary Arguments | Key Flags |
| :--- | :--- | :--- | :--- |
| `app` | `NewApplicationCommand` | None | None |
| `create` | `NewApplicationCreateCommand` | `APPNAME` | `--name`, `--upsert`, `-f/--file`, `-l/--label`, `--annotations`, `--set-finalizer`, `-N/--app-namespace` |
| `get` | `NewApplicationGetCommand` | `APPNAME` | `-o/--output`, `--timeout`, `--show-operation`, `--show-params`, `--refresh`, `--hard-refresh`, `-N/--app-namespace`, `--source-position`, `--source-name` |
| `list` | `NewApplicationListCommand` | None | `-o/--output`, `-l/--selector`, `-p/--project`, `-r/--repo`, `-N/--app-namespace`, `-c/--cluster`, `-P/--path` |
| `edit` | `NewApplicationEditCommand` | `APPNAME` | `-N/--app-namespace` |
| `patch` | `NewApplicationPatchCommand` | `APPNAME` | `-N/--app-namespace`, `--patch`, `--type` |
| `delete` | `NewApplicationDeleteCommand` | `APPNAME...` | `--cascade`, `-p/--propagation-policy`, `-y/--yes`, `-l/--selector`, `--wait`, `-N/--app-namespace` |
| `terminate-op` | `NewApplicationTerminateOpCommand` | `APPNAME` | `-N/--app-namespace` |

Sources: [cmd/argocd/commands/app.go:58-101](https://github.com/argoproj/argo-cd/blob/main/cmd/argocd/commands/app.go#L58-L101), [cmd/argocd/commands/app.go:113-213](https://github.com/argoproj/argo-cd/blob/main/cmd/argocd/commands/app.go#L113-L213), [cmd/argocd/commands/app.go:329-512](https://github.com/argoproj/argo-cd/blob/main/cmd/argocd/commands/app.go#L329-L512), [cmd/argocd/commands/app.go:1261-1357](https://github.com/argoproj/argo-cd/blob/main/cmd/argocd/commands/app.go#L1261-L1357), [cmd/argocd/commands/app.go:1406-1476](https://github.com/argoproj/argo-cd/blob/main/cmd/argocd/commands/app.go#L1406-L1476), [cmd/argocd/commands/app.go:2957-3090](https://github.com/argoproj/argo-cd/blob/main/cmd/argocd/commands/app.go#L2957-L3090)

> [!WARNING]
> When executing `argocd app create` without an explicit `--upsert` flag, the API server checks for existing resources and returns a `PermissionDenied` or `NotFound` error status code depending on server-side CVE-2022-41354 remediations. Omitting `upsert` on an existing application without proper spec matching will cause command failure.

Sources: [cmd/argocd/commands/app.go:175-180](https://github.com/argoproj/argo-cd/blob/main/cmd/argocd/commands/app.go#L175-L180)

## Application Sync and Rollback Operations

### Application Sync and Rollback Operations

### Overview

Argo CD provides command-line workflows for synchronizing applications to their target states, waiting for health and sync transitions, and rolling back applications to previous historical deployments. These workflows are exposed through the `argocd app sync`, `argocd app wait`, and `argocd app rollback` commands.

Sources: [cmd/argocd/commands/app.go:1586-1670](https://github.com/argoproj/argo-cd/blob/main/cmd/argocd/commands/app.go#L1586-L1670), [cmd/argocd/commands/app.go:1698-2091](https://github.com/argoproj/argo-cd/blob/main/cmd/argocd/commands/app.go#L1698-L2091), [cmd/argocd/commands/app.go:2707-2762](https://github.com/argoproj/argo-cd/blob/main/cmd/argocd/commands/app.go#L2707-L2762)

### Sync Workflows and Options

The `argocd app sync` command targets one or more applications, resolves their revision and sync settings, constructs an `application.ApplicationSyncRequest`, and invokes `appIf.Sync`. Operators can restrict sync operations using labels, specific resources, or local manifest directories.

| Flag | Type | Default | Purpose |
| :--- | :--- | :--- | :--- |
| `--dry-run` | bool | `false` | Preview apply without affecting cluster |
| `--prune` | bool | `false` | Allow deleting unexpected resources |
| `--revision` | string | `""` | Sync to a specific revision while preserving parameter overrides |
| `--resource` | stringArray | `[]` | Sync only specific resources formatted as `GROUP:KIND:NAME` or `!GROUP:KIND:NAME` |
| `--selector` | string | `""` | Sync apps matching the specified label selector |
| `--label` | stringArray | `[]` | Sync only specific resources bearing a matching label |
| `--timeout` | uint | `0` | Time out after the specified number of seconds |
| `--retry-limit` | int64 | `0` | Maximum number of allowed sync retries |
| `--retry-refresh` | bool | `false` | Use the latest revision on retry instead of the initial one |
| `--retry-backoff-duration` | Duration | `5s` | Retry backoff base duration |
| `--retry-backoff-max-duration` | Duration | `3m0s` | Maximum retry backoff duration |
| `--retry-backoff-factor` | int64 | `2` | Factor multiplying base duration after each failed retry |
| `--strategy` | string | `""` | Sync strategy, one of: `apply`, `hook` |
| `--force` | bool | `false` | Perform a force apply |
| `--replace` | bool | `false` | Use `kubectl create/replace` instead of apply |
| `--server-side` | bool | `false` | Use server-side apply during synchronization |
| `--apply-out-of-sync-only` | bool | `false` | Sync only out-of-sync resources |
| `--async` | bool | `false` | Do not wait for application synchronization to complete |
| `--local` | string | `""` | Path to a local directory; bypasses git queries |
| `--local-repo-root` | string | `"/"` | Path to repository root when using `--local` |
| `--preview-changes` | bool | `false` | Preview differences against live state and wait for confirmation |

Sources: [cmd/argocd/commands/app.go:2059-2090](https://github.com/argoproj/argo-cd/blob/main/cmd/argocd/commands/app.go#L2059-L2090), [docs/user-guide/commands/argocd_app_sync.md:44-78](https://github.com/argoproj/argo-cd/blob/main/docs/user-guide/commands/argocd_app_sync.md#L44-L78)

> [!WARNING]
> When executing a local sync via `--local`, automated sync policies cannot be enabled unless `--dry-run` is simultaneously provided; the command terminates immediately with a fatal error otherwise.

Sources: [cmd/argocd/commands/app.go:1942-1945](https://github.com/argoproj/argo-cd/blob/main/cmd/argocd/commands/app.go#L1942-L1945)

### Revision Rollback Execution

The `argocd app rollback` command restores an application to a previously deployed version recorded in its deployment history. 

```go
appName, appNs := argo.ParseFromQualifiedName(args[0], appNamespace)
var err error
depID := -1
if len(args) > 1 {
    depID, err = strconv.Atoi(args[1])
    errors.CheckError(err)
}
acdClient := headless.NewClientOrDie(clientOpts, c)
conn, appIf := acdClient.NewApplicationClientOrDie()
defer utilio.Close(conn)
app, err := appIf.Get(ctx, &application.ApplicationQuery{
    Name:         &appName,
    AppNamespace: &appNs,
})
errors.CheckError(err)

depInfo, err := findRevisionHistory(app, int64(depID))
errors.CheckError(err)

_, err = appIf.Rollback(ctx, &application.ApplicationRollbackRequest{
    Name:         &appName,
    AppNamespace: &appNs,
    Id:           new(depInfo.ID),
    Prune:        new(prune),
})
errors.CheckError(err)

_, _, err = waitOnApplicationStatus(ctx, acdClient, app.QualifiedName(), timeout, watchOpts{
    operation: true,
}, nil, output)
errors.CheckError(err)
```

Sources: [cmd/argocd/commands/app.go:2719-2755](https://github.com/argoproj/argo-cd/blob/main/cmd/argocd/commands/app.go#L2719-L2755)

If the deployment history ID argument `[ID]` is omitted, `findRevisionHistory` evaluates `historyId == -1`, checks that the application contains at least two successful deployments, and selects the second-to-last history entry (`application.Status.History[l-2]`).

Sources: [cmd/argocd/commands/app.go:2690-2698](https://github.com/argoproj/argo-cd/blob/main/cmd/argocd/commands/app.go#L2690-L2698)

> [!NOTE]
> Rollback execution automatically triggers `waitOnApplicationStatus` with `operation: true` enabled, blocking until the rollback operation finishes unless a timeout or context cancellation occurs.

Sources: [cmd/argocd/commands/app.go:2751-2754](https://github.com/argoproj/argo-cd/blob/main/cmd/argocd/commands/app.go#L2751-L2754)

## Diffing Strategies and Target Providers

### Overview

The `argocd app diff` command computes and displays differences between live cluster states and target application manifests. It supports multiple strategies for both manifest retrieval and diff calculation, allowing administrators to compare live resources against target revisions, multi-source repositories, or local directories using either client-side execution via `gitops-engine` or delegated server-side evaluation.

Sources: [cmd/argocd/commands/app_diff.go:46-59](https://github.com/argoproj/argo-cd/blob/main/cmd/argocd/commands/app_diff.go#L46-L59), [cmd/argocd/commands/app_diff.go:319-357](https://github.com/argoproj/argo-cd/blob/main/cmd/argocd/commands/app_diff.go#L319-L357), [cmd/argocd/commands/app_diff.go:624-807](https://github.com/argoproj/argo-cd/blob/main/cmd/argocd/commands/app_diff.go#L624-L807)

### Target Providers and Manifest Sources

Target manifest providers retrieve the intended state objects that are then paired against live cluster resources. Depending on flags and application properties, `NewApplicationDiffCommand` instantiates one of several provider implementations.

| Provider Function | Return Type | Purpose / Description |
| :--- | :--- | :--- |
| `newMultiSourceRevisionProvider` | `manifestProvider` | Retrieves manifests for multi-source applications using explicit revisions and source positions. |
| `newSingleRevisionProvider` | `manifestProvider` | Retrieves manifests for applications configured with a single revision. |
| `newLocalServerSideProvider` | `manifestProvider` | Streams local directory files via gRPC (`GetManifestsWithFiles`) to the Argo CD server for remote manifest generation. |
| `newLocalClientSideProvider` | `manifestProvider` | Deprecated provider generating manifests locally using repository roots and cluster version info. |
| `newDefaultTargetProvider` | `manifestProvider` | Extracts target states directly from the application's `ManagedResourcesResponse` payload. |
| `newLiveManifestProvider` | `manifestProvider` | Extracts normalized live state objects from managed resource responses, optionally filtering out secrets. |

Sources: [cmd/argocd/commands/app_diff.go:46-48](https://github.com/argoproj/argo-cd/blob/main/cmd/argocd/commands/app_diff.go#L46-L48), [cmd/argocd/commands/app_diff.go:360-508](https://github.com/argoproj/argo-cd/blob/main/cmd/argocd/commands/app_diff.go#L360-L508)

> [!WARNING]
> Local diff execution without `--server-side-generate` is deprecated, does not support plugins, and ignores Kubernetes Secrets because local generation lacks server-side secret redaction configuration.

Sources: [cmd/argocd/commands/app_diff.go:152-179](https://github.com/argoproj/argo-cd/blob/main/cmd/argocd/commands/app_diff.go#L152-L179), [cmd/argocd/commands/app_diff.go:439-470](https://github.com/argoproj/argo-cd/blob/main/cmd/argocd/commands/app_diff.go#L439-L470), [cmd/argocd/commands/app_diff.go:744-751](https://github.com/argoproj/argo-cd/blob/main/cmd/argocd/commands/app_diff.go#L744-L751)

### Diff Computation Call-Chain Execution

When comparing live and target manifests, the engine executes a distinct pipeline to pair resources, normalize target objects, and calculate diff outputs. The operation proceeds through the following call sequence:

`compareManifests()` → `getLiveManifests()` / `getTargetManifests()` → `newNormalizeTargetManifestsProvider()` → `controller.NormalizeTargetObjects()` → `getComparisonObjects()` → `getObjectMap()` → `performDiff()` (`newServerSideDiffStrategy` or `newClientSideDiffStrategy`) → `argodiff.StateDiff()` or `appIf.ServerSideDiff()`

1. `compareManifests` invokes the live and target manifest providers to fetch unstructured slices.
2. `newNormalizeTargetManifestsProvider` wraps the target provider, executing `controller.NormalizeTargetObjects()` alongside `resourceTracking.SetAppInstance()` to assign tracking annotations and validate namespaces using the `resourceInfoProvider` built from live state (`getInfoProviderFromState`).
3. `getComparisonObjects` invokes `getObjectMap` on both manifests, filtering out hooks (`hook.IsHook`) and ignored resources (`ignore.Ignore`), and indexes remaining items by `kube.ResourceKey`.
4. The comparison pairs live and target objects into `comparisonObject` slices, forwarding them to the chosen `diffStrategy`.
5. The selected diff strategy computes resource variances, returning `diff.DiffResult` entries that omit unmodified or null-state resource pairs.

Sources: [cmd/argocd/commands/app_diff.go:60-150](https://github.com/argoproj/argo-cd/blob/main/cmd/argocd/commands/app_diff.go#L60-L150), [cmd/argocd/commands/app_diff.go:214-357](https://github.com/argoproj/argo-cd/blob/main/cmd/argocd/commands/app_diff.go#L214-357), [cmd/argocd/commands/app_diff.go:510-621](https://github.com/argoproj/argo-cd/blob/main/cmd/argocd/commands/app_diff.go#L510-L621)

### Diffing Strategies and Design Trade-offs

The CLI supports two distinct diff computation backends determined by the `--server-side-diff` flag or application annotations:

| Strategy Choice | Benefit | Cost |
| :--- | :--- | :--- |
| Client-side (`newClientSideDiffStrategy`) | Executes entirely locally using `argodiff.StateDiff`; avoids server round-trips for payload comparison. | Requires local resource overrides and ignore-difference configuration parsing; heavier client-side memory footprint. |
| Server-side (`newServerSideDiffStrategy`) | Offloads normalization and diff calculation to the Argo CD API server; supports concurrent batched execution with configurable batch limits (`--server-side-diff-max-batch-kb`) and concurrency caps (`--server-side-diff-concurrency`). | Incurs network round-trips and gRPC serialization overhead per batch. |

Sources: [cmd/argocd/commands/app_diff.go:214-357](https://github.com/argoproj/argo-cd/blob/main/cmd/argocd/commands/app_diff.go#L214-357), [cmd/argocd/commands/app_diff.go:809-813](https://github.com/argoproj/argo-cd/blob/main/cmd/argocd/commands/app_diff.go#L809-L813)

> [!NOTE]
> Server-side diff batches resources up to `server-side-diff-max-batch-kb` (defaulting to 250 KB) and schedules queries concurrently via an `errgroup` worker pool limited by `server-side-diff-concurrency`.

Sources: [cmd/argocd/commands/app_diff.go:259-298](https://github.com/argoproj/argo-cd/blob/main/cmd/argocd/commands/app_diff.go#L259-L298), [cmd/argocd/commands/app_diff.go:811-812](https://github.com/argoproj/argo-cd/blob/main/cmd/argocd/commands/app_diff.go#L811-L812)

## Parameter Overrides and Spec Mutation

### Overview

Modifying application specifications, Helm parameters, and source configurations is handled by mutation commands such as `argocd app set`, `argocd app unset`, `argocd app add-source`, `argocd app remove-source`, and `argocd app patch`. These commands inspect the target application via `appIf.Get()`, validate source positions or names, apply spec updates through `cmdutil.SetAppSpecOptions()` and `setParameterOverrides()`, and persist changes using `appIf.UpdateSpec()` or `appIf.Patch()`.

Sources: [cmd/argocd/commands/app.go:837-923](https://github.com/argoproj/argo-cd/blob/main/cmd/argocd/commands/app.go#L837-L923), [cmd/argocd/commands/app.go:955-1061](https://github.com/argoproj/argo-cd/blob/main/cmd/argocd/commands/app.go#L955-L1061), [cmd/argocd/commands/app.go:3092-3154](https://github.com/argoproj/argo-cd/blob/main/cmd/argocd/commands/app.go#L3092-L3154), [cmd/argocd/commands/app.go:3156-3243](https://github.com/argoproj/argo-cd/blob/main/cmd/argocd/commands/app.go#L3156-L3243), [cmd/argocd/commands/app.go:3046-3090](https://github.com/argoproj/argo-cd/blob/main/cmd/argocd/commands/app.go#L3046-L3090)

### Parameter Overrides Call-Chain Execution

When setting parameter overrides on an application, the CLI resolves the correct source target and mutates the internal structure through a specific validation and assignment pipeline:

`NewApplicationSetCommand()` → `appIf.Get()` → `getSourceNameToPositionMap()` → `cmdutil.SetAppSpecOptions()` → `setParameterOverrides()` → `argoappv1.NewHelmParameter()` → `source.Helm.AddParameter()` → `appIf.UpdateSpec()`

1. `NewApplicationSetCommand()` queries the existing application specification using `appIf.Get()`.
2. If `--source-name` is provided, `getSourceNameToPositionMap()` maps the string name to a 1-based source index.
3. `cmdutil.SetAppSpecOptions()` mutates core application options, returning the number of visited flag updates.
4. `setParameterOverrides()` inspects the target source's explicit type, status type, or parameter key-value format to enforce that overrides apply exclusively to Helm applications.
5. `argoappv1.NewHelmParameter()` parses each parameter string, appending it to `source.Helm.Parameters` before submitting the modified spec via `appIf.UpdateSpec()`.

Sources: [cmd/argocd/commands/app.go:837-917](https://github.com/argoproj/argo-cd/blob/main/cmd/argocd/commands/app.go#L837-L917), [cmd/argocd/commands/app.go:318-327](https://github.com/argoproj/argo-cd/blob/main/cmd/argocd/commands/app.go#L318-L327), [cmd/argocd/commands/app.go:2555-2588](https://github.com/argoproj/argo-cd/blob/main/cmd/argocd/commands/app.go#L2555-L2588)

> [!WARNING]
> Parameter overrides (`-p` / `--parameter`) can only be set against Helm applications or Helm-backed sources; attempting to pass parameters to non-Helm application sources triggers a fatal error in `setParameterOverrides()`.

Sources: [cmd/argocd/commands/app.go:2585-2587](https://github.com/argoproj/argo-cd/blob/main/cmd/argocd/commands/app.go#L2585-L2587)

### Unset and Spec Mutation Options

The `argocd app unset` command utilizes `unsetOpts` and the `unset()` function to strip specific overrides from Kustomize, Helm, and plugin blocks.

| Unset Flag | Target Struct Field / Action | Purpose |
| :--- | :--- | :--- |
| `--namesuffix` | `source.Kustomize.NameSuffix` | Clears Kustomize name suffix override. |
| `--nameprefix` | `source.Kustomize.NamePrefix` | Clears Kustomize name prefix override. |
| `--kustomize-version` | `source.Kustomize.Version` | Clears Kustomize version override. |
| `--kustomize-namespace` | `source.Kustomize.Namespace` | Clears Kustomize namespace override. |
| `--kustomize-image` | `source.Kustomize.Images` | Removes matching Kustomize image replacement entries. |
| `--kustomize-replica` | `source.Kustomize.Replicas` | Removes matching Kustomize replica target overrides. |
| `-p`, `--parameter` | `source.Helm.Parameters` | Removes specific Helm parameter override entries by name. |
| `--values` | `source.Helm.ValueFiles` | Removes matching Helm values files from the spec. |
| `--values-literal` | `source.Helm.SetValuesString("")` | Resets inline Helm values literal block. |
| `--plugin-env` | `source.Plugin.RemoveEnvEntry()` | Removes specific environment variable overrides from plugin config. |

Sources: [cmd/argocd/commands/app.go:925-942](https://github.com/argoproj/argo-cd/blob/main/cmd/argocd/commands/app.go#L925-L942), [cmd/argocd/commands/app.go:1043-1060](https://github.com/argoproj/argo-cd/blob/main/cmd/argocd/commands/app.go#L1043-L1060), [cmd/argocd/commands/app.go:1063-1179](https://github.com/argoproj/argo-cd/blob/main/cmd/argocd/commands/app.go#L1063-L1179)

> [!CAUTION]
> When removing sources via `remove-source` or unsetting parameters via `unset`, multi-source applications require either `--source-position` (1-based index) or `--source-name` to be explicitly declared. Removing the final remaining source in an application specification is prohibited.

Sources: [cmd/argocd/commands/app.go:987-1013](https://github.com/argoproj/argo-cd/blob/main/cmd/argocd/commands/app.go#L987-L1013), [cmd/argocd/commands/app.go:3179-3215](https://github.com/argoproj/argo-cd/blob/main/cmd/argocd/commands/app.go#L3179-3215)

## Resource Tree and Manifest Inspection

### Overview

The Argo CD CLI exposes commands to inspect resource hierarchies, evaluate live object states, print generated application manifests, and stream container logs associated with deployed workloads. These operations interact directly with application service clients via `ResourceTree`, `ManagedResources`, `GetManifests`, and `PodLogs`.

Sources: [cmd/argocd/commands/app.go:273-296](https://github.com/argoproj/argo-cd/blob/main/cmd/argocd/commands/app.go#L273-L296), [cmd/argocd/commands/app.go:589-605](https://github.com/argoproj/argo-cd/blob/main/cmd/argocd/commands/app.go#L589-L605), [cmd/argocd/commands/app.go:2873-2877](https://github.com/argoproj/argo-cd/blob/main/cmd/argocd/commands/app.go#L2873-L2877)

### Resource Tree Construction and Display

Resource trees are resolved through `parentChildDetails()`, which invokes `appIf.ResourceTree()` to build UID-to-node maps and parent-to-child relationships. The `get output=tree` and `get output=tree=detailed` formats render hierarchical trees via `printTreeView()` and `printTreeViewDetailed()`.

```go
func parentChildDetails(ctx context.Context, appIf application.ApplicationServiceClient, appName string, appNs string) (map[string]argoappv1.ResourceNode, map[string][]string, map[string]struct{}) {
	mapUIDToNode := make(map[string]argoappv1.ResourceNode)
	mapParentToChild := make(map[string][]string)
	parentNode := make(map[string]struct{})

	resourceTree, err := appIf.ResourceTree(ctx, &application.ResourcesQuery{Name: &appName, AppNamespace: &appNs, ApplicationName: &appName})
	errors.CheckError(err)

	for _, node := range resourceTree.Nodes {
		mapUIDToNode[node.UID] = node

		if len(node.ParentRefs) > 0 {
			_, ok := mapParentToChild[node.ParentRefs[0].UID]
			if !ok {
				var temp []string
				mapParentToChild[node.ParentRefs[0].UID] = temp
			}
			mapParentToChild[node.ParentRefs[0].UID] = append(mapParentToChild[node.ParentRefs[0].UID], node.UID)
		} else {
			parentNode[node.UID] = struct{}{}
		}
	}
	return mapUIDToNode, mapParentToChild, parentNode
}
```

Sources: [cmd/argocd/commands/app.go:273-296](https://github.com/argoproj/argo-cd/blob/main/cmd/argocd/commands/app.go#L273-L296), [cmd/argocd/commands/app.go:483-496](https://github.com/argoproj/argo-cd/blob/main/cmd/argocd/commands/app.go#L483-L496)

### Manifest Inspection and Pod Log Streaming

The `argocd app manifests` command retrieves manifests from either Git repository sources or live cluster states. It supports target revisions, multi-source revision selectors (`--revisions` and `--source-positions` or `--source-names`), and local directory manifests.

Sources: [cmd/argocd/commands/app.go:2796-2955](https://github.com/argoproj/argo-cd/blob/main/cmd/argocd/commands/app.go#L2796-L2955)

The `argocd app logs` command streams pod logs via `appIf.PodLogs()`, handling reconnection on `codes.Unavailable` when follow mode is active.

```go
stream, err := appIf.PodLogs(ctx, &application.ApplicationPodLogsQuery{
    Name:         &appName,
    Group:        &group,
    Namespace:    new(namespace),
    Kind:         &kind,
    ResourceName: &resourceName,
    Follow:       new(follow),
    TailLines:    new(tail),
    SinceSeconds: new(sinceSeconds),
    UntilTime:    &untilTime,
    Filter:       &filter,
    MatchCase:    new(matchCase),
    Container:    new(container),
    Previous:     new(previous),
    AppNamespace: &appNs,
})
```

Sources: [cmd/argocd/commands/app.go:589-605](https://github.com/argoproj/argo-cd/blob/main/cmd/argocd/commands/app.go#L589-L605)

| Log Flag | Shorthand | Type | Purpose |
| :--- | :--- | :--- | :--- |
| `--group` | — | string | Filter logs by resource group. |
| `--kind` | — | string | Filter logs by resource kind. |
| `--namespace` | — | string | Filter logs by resource namespace. |
| `--name` | — | string | Filter logs by specific resource name. |
| `--follow` | `-f` | bool | Stream logs in real-time. |
| `--tail` | — | int64 | Number of lines from the end of logs to show. |
| `--since-seconds` | — | int64 | Relative time in seconds before current time. |
| `--until-time` | — | string | Show logs until specified timestamp format. |
| `--filter` | — | string | Show logs containing specific string. |
| `--container` | `-c` | string | Target container name within pods. |
| `--previous` | `-p` | bool | Return previously terminated container logs. |
| `--match-case` | `-m` | bool | Enable case-sensitive filtering. |

Sources: [cmd/argocd/commands/app.go:515-530](https://github.com/argoproj/argo-cd/blob/main/cmd/argocd/commands/app.go#L515-L530), [cmd/argocd/commands/app.go:634-647](https://github.com/argoproj/argo-cd/blob/main/cmd/argocd/commands/app.go#L634-L647)

> [!NOTE]
> When executing `argocd app logs` with `--follow` enabled, if the gRPC stream encounters a `codes.Unavailable` status error, the command automatically triggers a retry loop starting from 1 second prior.

Sources: [cmd/argocd/commands/app.go:615-623](https://github.com/argoproj/argo-cd/blob/main/cmd/argocd/commands/app.go#L615-L623)

## Application Controller Binary Execution

### Overview

The `argocd-application-controller` binary executes a long-running Kubernetes controller process responsible for continuously monitoring applications, comparing their live state against desired targets from Git or OCI repositories, and reconciling differences. The entrypoint command `NewCommand()` constructs a root Cobra command that binds configuration flags, initializes clients, sets up sharding algorithms, configures distributed tracing, and starts worker processors.

Sources: [cmd/argocd-application-controller/commands/argocd_application_controller.go:54-108](https://github.com/argoproj/argo-cd/blob/main/cmd/argocd-application-controller/commands/argocd_application_controller.go#L54-L108)

### Controller Initialization and Execution Walkthrough

When the `RunE` handler executes, it follows a strict initialization sequence before starting background reconciliation loops:

1. `clientConfig.Namespace()` — Resolves the target namespace for controller execution.
2. `vers.LogStartupInfo()` — Logs startup metadata including platform and namespace.
3. `kubernetes.NewForConfigOrDie()` and `appclientset.NewForConfigOrDie()` — Instantiates Kubernetes and Argo CD custom resource clientsets.
4. `apiclient.NewRepoServerClientset()` and `commitclient.NewCommitServerClientset()` — Establishes repository and commit server client connections.
5. `sharding.GetClusterSharding()` — Configures cluster sharding based on the selected sharding method.
6. `controller.NewApplicationController()` — Initializes the main `ApplicationController` struct with processors, timeouts, and rate limits.
7. `appController.Run()` — Launches status, operation, and hydration processors in background goroutines while listening for cancellation and OS signals.

Sources: [cmd/argocd-application-controller/commands/argocd_application_controller.go:108-250](https://github.com/argoproj/argo-cd/blob/main/cmd/argocd-application-controller/commands/argocd_application_controller.go#L108-250)

> [!WARNING]
> If a panic occurs during controller execution, the recovery defer block captures the stack trace and calls `log.Fatal()`, terminating the binary rather than leaving the controller in an undefined reconciliation state.

Sources: [cmd/argocd-application-controller/commands/argocd_application_controller.go:126-131](https://github.com/argoproj/argo-cd/blob/main/cmd/argocd-application-controller/commands/argocd_application_controller.go#L126-131)

### Configuration Flags and Defaults

The controller exposes numerous command-line flags to tune synchronization, self-healing, sharding, and telemetry.

| Flag | Default Value | Environment Variable | Purpose |
| :--- | :--- | :--- | :--- |
| `--app-resync` | `120` | `ARGOCD_RECONCILIATION_TIMEOUT` | Time period in seconds for application resync. |
| `--app-hard-resync` | `0` | `ARGOCD_HARD_RECONCILIATION_TIMEOUT` | Time period in seconds for application hard resync. |
| `--status-processors` | `20` | `ARGOCD_APPLICATION_CONTROLLER_STATUS_PROCESSORS` | Number of application status processors. |
| `--operation-processors` | `10` | `ARGOCD_APPLICATION_CONTROLLER_OPERATION_PROCESSORS` | Number of application operation processors. |
| `--hydration-processors` | `5` | `ARGOCD_APPLICATION_CONTROLLER_HYDRATION_PROCESSORS` | Number of manifest hydration processors. |
| `--sharding-method` | `legacy` | `ARGOCD_CONTROLLER_SHARDING_ALGORITHM` | Sharding method: `legacy`, `round-robin`, `consistent-hashing`. |
| `--metrics-port` | `8082` | — | Start Prometheus metrics server on given port. |
| `--kubectl-parallelism-limit` | `20` | `ARGOCD_APPLICATION_CONTROLLER_KUBECTL_PARALLELISM_LIMIT` | Maximum concurrent cluster operations during sync. |

Sources: [cmd/argocd-application-controller/commands/argocd_application_controller.go:260-312](https://github.com/argoproj/argo-cd/blob/main/cmd/argocd-application-controller/commands/argocd_application_controller.go#L260-312)

### Sharding and Telemetry Setup

Cluster distribution across controller replicas is managed via the `--sharding-method` flag, which supports `legacy`, `round-robin`, and `consistent-hashing` algorithms. Dynamic cluster distribution can be enabled via `--dynamic-cluster-distribution-enabled`. OpenTelemetry tracing is initialized when `--otlp-address` is provided, configuring insecure mode, headers, attributes, and sampling ratios through `trace.InitTracer()`.

Sources: [cmd/argocd-application-controller/commands/argocd_application_controller.go:183-184](https://github.com/argoproj/argo-cd/blob/main/cmd/argocd-application-controller/commands/argocd_application_controller.go#L183-184), [cmd/argocd-application-controller/commands/argocd_application_controller.go:232-238](https://github.com/argoproj/argo-cd/blob/main/cmd/argocd-application-controller/commands/argocd_application_controller.go#L232-238), [cmd/argocd-application-controller/commands/argocd_application_controller.go:296](https://github.com/argoproj/argo-cd/blob/main/cmd/argocd-application-controller/commands/argocd_application_controller.go#L296)

## Related

- [[CLI Architecture]]
- [[Application API]]

