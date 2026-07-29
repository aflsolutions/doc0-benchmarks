# Progressive Sync

<details>
<summary>Relevant source files</summary>

The following files were used as context for generating this wiki page:

- [docs/operator-manual/applicationset/Progressive-Syncs.md](https://github.com/argoproj/argo-cd/blob/main/docs/operator-manual/applicationset/Progressive-Syncs.md)
- [docs/proposals/2022-07-13-appset-progressive-rollout-strategy.md](https://github.com/argoproj/argo-cd/blob/main/docs/proposals/2022-07-13-appset-progressive-rollout-strategy.md)
- [applicationset/progressivesync/progressive_sync.go](https://github.com/argoproj/argo-cd/blob/main/applicationset/progressivesync/progressive_sync.go)
- [controller/sync.go](https://github.com/argoproj/argo-cd/blob/main/controller/sync.go)
- [applicationset/controllers/applicationset_controller.go](https://github.com/argoproj/argo-cd/blob/main/applicationset/controllers/applicationset_controller.go)
- [gitops-engine/pkg/sync/sync_context.go](https://github.com/argoproj/argo-cd/blob/main/gitops-engine/pkg/sync/sync_context.go)
</details>

## Overview

Progressive Sync is a feature of the Argo CD ApplicationSet controller that controls the order in which managed Application resources are created, updated, or deleted. By default, changes to an ApplicationSet propagate simultaneously across all target applications. Progressive Sync allows cluster operators to organize applications into structured rollout steps using label selectors and match expressions, restricting the blast radius of configuration changes and enabling safe, phased deployments across multiple environments or clusters.

Sources: [docs/operator-manual/applicationset/Progressive-Syncs.md:8-16](https://github.com/argoproj/argo-cd/blob/main/docs/operator-manual/applicationset/Progressive-Syncs.md#L8-L16), [docs/proposals/2022-07-13-appset-progressive-rollout-strategy.md:21-32](https://github.com/argoproj/argo-cd/blob/main/docs/proposals/2022-07-13-appset-progressive-rollout-strategy.md#L21-L32)

## ApplicationSet Progressive Sync Strategy Configuration

### Overview

The ApplicationSet progressive sync strategy configuration defines how the ApplicationSet controller manages the lifecycle of generated Application resources through declarative rollout specifications. Strategy configurations are specified under the `spec.strategy` field of the ApplicationSet resource and are partitioned into creation strategies via the `type` field and deletion strategies via the `deletionOrder` field. 

Sources: [docs/operator-manual/applicationset/Progressive-Syncs.md:28-33](https://github.com/argoproj/argo-cd/blob/main/docs/operator-manual/applicationset/Progressive-Syncs.md#L28-L33)

### Creation Strategy Configuration

The creation strategy controls how generated applications are created and updated. The `type` field accepts either `AllAtOnce` or `RollingSync`. When `RollingSync` is configured, applications are grouped using labels and `matchExpressions` under the `rollingSync.steps` parameter.

- Multiple `matchExpressions` evaluate with a logical AND behavior where all expressions must be true for an application to be selected.
- The `In` and `NotIn` operators must match at least one value to be evaluated as true, implementing an OR behavior.
- In the event of a conflict where both `In` and `NotIn` operators produce a match, the `NotIn` operator takes precedence.
- The `maxUpdate` parameter restricts the number of simultaneous application updates within a specific step and accepts both absolute integers and percentage strings, which round down with a floor of 1 application for any value greater than zero.

Sources: [docs/operator-manual/applicationset/Progressive-Syncs.md:36-63](https://github.com/argoproj/argo-cd/blob/main/docs/operator-manual/applicationset/Progressive-Syncs.md#L36-L63), [docs/operator-manual/applicationset/Progressive-Syncs.md:202-208](https://github.com/argoproj/argo-cd/blob/main/docs/operator-manual/applicationset/Progressive-Syncs.md#L202-L208)

### Target Cluster Matchers and Example Specification

ApplicationSet target cluster matchers use template metadata labels combined with step match expressions to isolate subsets of applications into distinct rollout phases. Unselected applications that do not match any listed expression are excluded from the rolling sync and require manual synchronization via the CLI or UI.

```yaml
spec:
  strategy:
    type: RollingSync
    deletionOrder: Reverse
    rollingSync:
      steps:
        - matchExpressions:
            - key: envLabel
              operator: In
              values:
                - env-dev
        - matchExpressions:
            - key: envLabel
              operator: In
              values:
                - env-prod
          maxUpdate: 10%
```

Sources: [docs/operator-manual/applicationset/Progressive-Syncs.md:68-87](https://github.com/argoproj/argo-cd/blob/main/docs/operator-manual/applicationset/Progressive-Syncs.md#L68-L87), [docs/operator-manual/applicationset/Progressive-Syncs.md:135-149](https://github.com/argoproj/argo-cd/blob/main/docs/operator-manual/applicationset/Progressive-Syncs.md#L135-L149)

## Controller Reconciliation and Progressive Sync Triggering

### Overview

The ApplicationSet controller reconciliation loop evaluates and manages generated Application resources, triggering progressive sync evaluations when configured. The reconciliation loop is driven by the `ApplicationSetReconciler.Reconcile` method, which processes incoming requests by retrieving the target `ApplicationSet`, generating desired applications through template generators, validating them, and delegating rolling sync updates to the progressive sync manager.

Sources: [applicationset/controllers/applicationset_controller.go:119-281](https://github.com/argoproj/argo-cd/blob/main/applicationset/controllers/applicationset_controller.go#L119-L281)

### Reconciliation Execution Flow

When progressive syncs are enabled on the controller (`EnableProgressiveSyncs` is true), the reconciliation loop executes a specific sequence of validations and calls into the progressive sync subsystem:

1. `r.Get()` retrieves the target `ApplicationSet` resource from the cluster.
2. `template.GenerateApplications()` runs all configured generators to produce the set of desired application specifications.
3. `r.validateGeneratedApplications()` inspects the generated applications for missing names, duplicate names, missing Argo CD projects, and invalid destination clusters.
4. `progressivesync.IsRollingSyncStrategy()` checks whether the `RollingSync` strategy is enabled on the ApplicationSet.
5. `progressivesync.IsStepsEmpty()` verifies that at least one rollout step is defined.
6. `r.ProgressiveSyncManager.PerformProgressiveSyncs()` runs the progressive sync evaluation, calculating step dependency lists, updating statuses, and determining which applications are authorized to sync.
7. `r.ProgressiveSyncManager.SyncDesiredApplications()` sets up the operation block and retry strategies for approved applications.

Sources: [applicationset/controllers/applicationset_controller.go:138-335](https://github.com/argoproj/argo-cd/blob/main/applicationset/controllers/applicationset_controller.go#L138-L335)

### Controller Event Predicates and Requeue Logic

The controller registers event handlers and predicates via `SetupWithManager` to watch both `ApplicationSet` resources and owned `Application` resources. The `shouldRequeueForApplication` and `shouldRequeueForApplicationSet` functions determine whether changes to underlying objects should trigger a re-reconcile.

> [!NOTE]
> The ApplicationSet controller owns a subset of fields on generated `Application` resources (spec, annotations, labels, and finalizers). Updates to runtime bookkeeping fields such as `ApplicationStatus.ReconciledAt`, `ResourceVersion`, or `Generation` do not trigger re-reconciliation on their own unless progressive sync health or sync status fields change.

When progressive syncs are enabled, changes to an owned application's health status, sync status, or operation phase trigger a re-reconcile to advance the next progression wave.

Sources: [applicationset/controllers/applicationset_controller.go:673-694](https://github.com/argoproj/argo-cd/blob/main/applicationset/controllers/applicationset_controller.go#L673-L694), [applicationset/controllers/applicationset_controller.go:1280-1311](https://github.com/argoproj/argo-cd/blob/main/applicationset/controllers/applicationset_controller.go#L1280-L1311)

## Progressive Sync Manager Step Evaluation Logic

### Overview

The progressive sync manager governs the stepwise rollout of applications across defined rollout steps. It coordinates application dependencies, calculates maximum update thresholds, evaluates status transitions between waiting, pending, progressing, and healthy states, and determines which applications are authorized to sync in the current wave.

Sources: [applicationset/progressivesync/progressive_sync.go:63-112](https://github.com/argoproj/argo-cd/blob/main/applicationset/progressivesync/progressive_sync.go#L63-L112)

### Step Evaluation Logic and Call-Chain Walkthrough

The evaluation of application steps and statuses executes through a deterministic call sequence within the manager:

1. `PerformProgressiveSyncs()` initializes validation tracking, invokes `buildAppDependencyList()` to map applications to dependency steps, and delegates status updates to `UpdateApplicationSetApplicationStatus()`.
Sources: [applicationset/progressivesync/progressive_sync.go:77-91](https://github.com/argoproj/argo-cd/blob/main/applicationset/progressivesync/progressive_sync.go#L77-L91)

2. `buildAppDependencyList()` parses rollout steps and applies match expressions (`In`, `NotIn`) to classify applications into `appDependencyList` indexes and `appStepMap` lookups.
Sources: [applicationset/progressivesync/progressive_sync.go:173-246](https://github.com/argoproj/argo-cd/blob/main/applicationset/progressivesync/progressive_sync.go#L173-L246)

3. `getAppsToSync()` evaluates each wave in order, requiring all applications in preceding steps to reach `ProgressiveSyncHealthy` before unlocking subsequent waves.
Sources: [applicationset/progressivesync/progressive_sync.go:421-466](https://github.com/argoproj/argo-cd/blob/main/applicationset/progressivesync/progressive_sync.go#L421-L466)

4. `UpdateApplicationSetApplicationStatusProgress()` enforces `maxUpdate` constraints on waiting applications, promoting eligible entries to `ProgressiveSyncPending` when update counts remain below calculated limits.
Sources: [applicationset/progressivesync/progressive_sync.go:500-598](https://github.com/argoproj/argo-cd/blob/main/applicationset/progressivesync/progressive_sync.go#L500-L598)

> [!NOTE]
> Percentage-based `maxUpdate` constraints guarantee that any percentage greater than `0%` resolves to at least `1` application being selected for update, preventing stalled rollouts in small steps.
Sources: [applicationset/progressivesync/progressive_sync.go:562-565](https://github.com/argoproj/argo-cd/blob/main/applicationset/progressivesync/progressive_sync.go#L562-L565)

### Status Transition Lifecycle

Applications managed by progressive sync transition through specific lifecycle phases stored in `ApplicationSetApplicationStatus.Status`. The manager evaluates these states during `UpdateApplicationSetApplicationStatus`.

| Status Constant | Value String | Transition Condition / Meaning |
| :--- | :--- | :--- |
| `ProgressiveSyncWaiting` | `Waiting` | Default state for new applications or when target revisions/specs change. |
| `ProgressiveSyncPending` | `Pending` | Assigned when an application is unlocked by `maxUpdate` bounds and authorized to sync. |
| `ProgressiveSyncProgressing` | `Progressing` | Entered once an application sync operation has started or encountered reconciling errors. |
| `ProgressiveSyncHealthy` | `Healthy` | Reached when the application resource achieves both synced status and healthy health status. |

Sources: [applicationset/progressivesync/progressive_sync.go:291-399](https://github.com/argoproj/argo-cd/blob/main/applicationset/progressivesync/progressive_sync.go#L291-L399), [applicationset/progressivesync/progressive_sync.go:573-576](https://github.com/argoproj/argo-cd/blob/main/applicationset/progressivesync/progressive_sync.go#L573-L576)

> [!WARNING]
> If an application's spec changes independently of Git (such as dynamic generator parameters like image tags or Helm values), `UpdateApplicationSetApplicationStatus` detects the mismatch via `cmp.Equal` and immediately resets its status back to `Waiting`, even if it was previously `Healthy`.
Sources: [applicationset/progressivesync/progressive_sync.go:324-344](https://github.com/argoproj/argo-cd/blob/main/applicationset/progressivesync/progressive_sync.go#L324-L344)

## Application Sync Context and Resource Execution

### Overview

Lower-level application synchronization processes through `appStateManager.SyncAppState()` in `controller/sync.go` and `syncContext` execution routines in `gitops-engine/pkg/sync/sync_context.go`. This subsystem initializes configuration flags, verifies sync windows, executes manifest dry-runs, and orchestrates resource deployment across ordered synchronization phases.

Sources: [controller/sync.go:160-190](https://github.com/argoproj/argo-cd/blob/main/controller/sync.go#L160-L190), [gitops-engine/pkg/sync/sync_context.go:493-556](https://github.com/argoproj/argo-cd/blob/main/gitops-engine/pkg/sync/sync_context.go#L493-L556)

### Call-Chain Execution Walkthrough

The execution path for a synchronization operation follows a strict sequence from high-level application state handling down to individual resource application:

1. `SyncAppState()` checks sync window compliance via `syncWindowPreventsSync()`, compares application states, validates shared resources, and instantiates sync options before building a sync context.
Sources: [controller/sync.go:191-424](https://github.com/argoproj/argo-cd/blob/main/controller/sync.go#L191-L424)

2. `NewSyncContext()` initializes dynamic clients, discovery clients, and resource operators, returning a `syncContext` instance.
Sources: [gitops-engine/pkg/sync/sync_context.go:246-297](https://github.com/argoproj/argo-cd/blob/main/gitops-engine/pkg/sync/sync_context.go#L246-L297)

3. `Sync()` retrieves synchronization tasks using `getSyncTasks()`, performs a dry-run apply via `runTasks()`, evaluates task health status, and coordinates phase execution.
Sources: [gitops-engine/pkg/sync/sync_context.go:493-687](https://github.com/argoproj/argo-cd/blob/main/gitops-engine/pkg/sync/sync_context.go#L493-L687)

4. `runTasks()` splits tasks into prune tasks and creation tasks, spawning goroutines via `newStateSync()` to execute `pruneObject()` or apply objects concurrently.
Sources: [gitops-engine/pkg/sync/sync_context.go:1626-1696](https://github.com/argoproj/argo-cd/blob/main/gitops-engine/pkg/sync/sync_context.go#L1626-L1696)

5. `applyObject()` evaluates server-side apply settings, performs CSA-to-SSA migration using `performCSAUpgradeMigration()` if needed, and invokes `resourceOps.ApplyResource()`.
Sources: [gitops-engine/pkg/sync/sync_context.go:1416-1485](https://github.com/argoproj/argo-cd/blob/main/gitops-engine/pkg/sync/sync_context.go#L1416-L1485)

> [!WARNING]
> During dry-run execution, server-side apply is automatically disabled because running dry-run in server mode breaks the auto-create namespace feature for rendered manifests.
Sources: [gitops-engine/pkg/sync/sync_context.go:1308-1315](https://github.com/argoproj/argo-cd/blob/main/gitops-engine/pkg/sync/sync_context.go#L1308-L1315)

### Sync Context Configuration Options

The behavior of `SyncContext` is controlled through functional options (`SyncOpt`) passed during initialization.

| Option Function | Parameter Type | Description / Purpose |
| :--- | :--- | :--- |
| `WithPrunePropagationPolicy` | `*metav1.DeletionPropagation` | Sets propagation policy (`background`, `foreground`, or `orphan`) for pruning. |
| `WithPermissionValidator` | `common.PermissionValidator` | Validates resource permissions against project allow/deny lists. |
| `WithHealthOverride` | `health.HealthOverride` | Registers Lua resource health overrides for custom resources. |
| `WithResourcesFilter` | `func(...) bool` | Filters out manifests that do not match selected resources or tracking selectors. |
| `WithPrune` | `bool` | Enables or disables the pruning of obsolete resources. |
| `WithReplace` | `bool` | Forces resource updates via replacement rather than patching or applying. |
| `WithServerSideApply` | `bool` | Enables Kubernetes Server-Side Apply for resource application. |

Sources: [controller/sync.go:378-410](https://github.com/argoproj/argo-cd/blob/main/controller/sync.go#L378-L410), [gitops-engine/pkg/sync/sync_context.go:81-243](https://github.com/argoproj/argo-cd/blob/main/gitops-engine/pkg/sync/sync_context.go#L81-L243)

### Design Trade-Offs in Sync Execution

| Design Choice | Benefit | Cost |
| :--- | :--- | :--- |
| **Concurrent task execution via `newStateSync()`** | Significantly accelerates multi-resource deployments and pruning actions across waves. | Increases complexity in conflict resolution and requires explicit mutex protection around shared state maps (`sc.syncRes`). |
| **Client-Side Apply migration via `csaupgrade`** | Directly patches `managedFields` to transfer ownership without hitting the 262KB `last-applied-configuration` annotation size limit. | Relies on complex parsing of live object managed fields and requires robust conflict retry logic. |
| **Artificial sync-wave delay (`ARGOCD_SYNC_WAVE_DELAY`)** | Gives external controllers time to react to spec changes before resource health is evaluated. | Introduces latency into multi-wave deployment pipelines. |

Sources: [controller/sync.go:44-48](https://github.com/argoproj/argo-cd/blob/main/controller/sync.go#L44-L48), [gitops-engine/pkg/sync/sync_context.go:427-428](https://github.com/argoproj/argo-cd/blob/main/gitops-engine/pkg/sync/sync_context.go#L427-L428), [gitops-engine/pkg/sync/sync_context.go:1351-1354](https://github.com/argoproj/argo-cd/blob/main/gitops-engine/pkg/sync/sync_context.go#L1351-L1354), [gitops-engine/pkg/sync/sync_context.go:1645-1661](https://github.com/argoproj/argo-cd/blob/main/gitops-engine/pkg/sync/sync_context.go#L1645-L1661)

## Validation Issues and Status Condition Lifecycle

### Overview

The progressive sync subsystem validates rollout configurations and manages application lifecycle status conditions during rolling deployments. When building app dependency lists and evaluating rollout steps, the controller collects configuration errors—such as invalid match expressions, duplicate application selections across steps, empty rollout steps, and invalid `maxUpdate` values—into a `ValidationIssues` collection.
Sources: [applicationset/progressivesync/progressive_sync.go:78-86](https://github.com/argoproj/argo-cd/blob/main/applicationset/progressivesync/progressive_sync.go#L78-L86), [applicationset/progressivesync/progressive_sync.go:193-246](https://github.com/argoproj/argo-cd/blob/main/applicationset/progressivesync/progressive_sync.go#L193-L246), [applicationset/progressivesync/progressive_sync.go:532-560](https://github.com/argoproj/argo-cd/blob/main/applicationset/progressivesync/progressive_sync.go#L532-L560)

### Status Condition Evaluation and Lifecycle

The controller evaluates and persists status conditions on the ApplicationSet resource through `getInvalidRolloutConfig()`, `getProgressingCondition()`, and `setApplicationSetStatusCondition()`. These methods inspect whether rollout configuration issues are present or if a rollout is currently active across waves.

| Condition Type | Status Value | Reason Code | Description / Meaning |
| :--- | :--- | :--- | :--- |
| `ApplicationSetConditionInvalidRolloutConfig` | `True` | `ApplicationSetReasonInvalidRolloutConfig` | Rollout configuration contains validation errors (e.g. invalid match expressions, duplicate selections, bad `maxUpdate`). |
| `ApplicationSetConditionInvalidRolloutConfig` | `False` | `ApplicationSetReasonValidRolloutConfig` | Rolling sync is configured correctly with no validation issues. |
| `ApplicationSetConditionRolloutProgressing` | `True` | `ApplicationSetReasonApplicationSetModified` | ApplicationSet is currently performing a rollout of a specific step. |
| `ApplicationSetConditionRolloutProgressing` | `False` | `ApplicationSetReasonApplicationSetRolloutComplete` | ApplicationSet rollout has completed successfully across all waves. |
| `ApplicationSetConditionErrorOccurred` | `True` | `ApplicationSetReasonApplicationValidationError` | An error occurred during application validation or generation. |

Sources: [applicationset/progressivesync/progressive_sync.go:600-665](https://github.com/argoproj/argo-cd/blob/main/applicationset/progressivesync/progressive_sync.go#L600-L665), [applicationset/controllers/applicationset_controller.go:230-241](https://github.com/argoproj/argo-cd/blob/main/applicationset/controllers/applicationset_controller.go#L230-L241), [applicationset/controllers/applicationset_controller.go:473-545](https://github.com/argoproj/argo-cd/blob/main/applicationset/controllers/applicationset_controller.go#L473-L545)

> [!WARNING]
> If an ApplicationSet switches from a `RollingSync` strategy to the default strategy, the controller automatically clears out existing progressive sync application status entries to prevent stale rollout state from persisting in etcd.
Sources: [applicationset/controllers/applicationset_controller.go:252-260](https://github.com/argoproj/argo-cd/blob/main/applicationset/controllers/applicationset_controller.go#L252-L260)

### Error Handling and Validation Flow

During progressive sync execution, validation errors and unexpected rollout configurations trigger specific reconciliation behaviors. If validation fails or steps are empty, the controller logs the failure and requeues using `ReconcileRequeueOnValidationError`.

| Error Condition / Issue | Trigger Location | Handling Behavior |
| :--- | :--- | :--- |
| **Empty Steps** | [applicationset/controllers/applicationset_controller.go:261-276](https://github.com/argoproj/argo-cd/blob/main/applicationset/controllers/applicationset_controller.go#L261-L276) | Sets `ApplicationSetConditionErrorOccurred` with reason `ApplicationSetReasonApplicationSetRolloutError` and requeues. |
| **Invalid Match Expressions** | [applicationset/progressivesync/progressive_sync.go:193-243](https://github.com/argoproj/argo-cd/blob/main/applicationset/progressivesync/progressive_sync.go#L193-L243) | Records issue in `ValidationIssues`, sets `selected = false`, and prevents the app from being scheduled in the step. |
| **Duplicate App Selections** | [applicationset/progressivesync/progressive_sync.go:193-243](https://github.com/argoproj/argo-cd/blob/main/applicationset/progressivesync/progressive_sync.go#L193-L243) | Logs a warning, records the duplicate indices in `DuplicateAppSelections`, and adds the app to multiple steps. |
| **Invalid MaxUpdate Value** | [applicationset/progressivesync/progressive_sync.go:532-560](https://github.com/argoproj/argo-cd/blob/main/applicationset/progressivesync/progressive_sync.go#L532-L560) | Logs a warning, records the error in `InvalidMaxUpdates`, and ignores the `maxUpdate` restriction for that step. |

Sources: [applicationset/progressivesync/progressive_sync.go:193-243](https://github.com/argoproj/argo-cd/blob/main/applicationset/progressivesync/progressive_sync.go#L193-L243), [applicationset/progressivesync/progressive_sync.go:532-560](https://github.com/argoproj/argo-cd/blob/main/applicationset/progressivesync/progressive_sync.go#L532-L560), [applicationset/controllers/applicationset_controller.go:261-276](https://github.com/argoproj/argo-cd/blob/main/applicationset/controllers/applicationset_controller.go#L261-L276)

> [!TIP]
> When `maxUpdate` percentage values are evaluated, percentage configurations greater than `0%` are automatically enforced to result in at least one application being selected for update to prevent deadlocks in small rollout steps.
Sources: [applicationset/progressivesync/progressive_sync.go:562-565](https://github.com/argoproj/argo-cd/blob/main/applicationset/progressivesync/progressive_sync.go#L562-L565)

## Related

- [[ApplicationSet Controller]]

