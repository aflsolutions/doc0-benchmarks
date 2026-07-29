# Notifications Controller

<details>
<summary>Relevant source files</summary>

The following files were used as context for generating this wiki page:

- [notifications_catalog/install.yaml](https://github.com/argoproj/argo-cd/blob/main/notifications_catalog/install.yaml)
- [docs/operator-manual/notifications/catalog.md](https://github.com/argoproj/argo-cd/blob/main/docs/operator-manual/notifications/catalog.md)
- [cmd/argocd-notification/commands/argocd_notification.go](https://github.com/argoproj/argo-cd/blob/main/cmd/argocd-notification/commands/argocd_notification.go)
- [docs/operator-manual/notifications/triggers.md](https://github.com/argoproj/argo-cd/blob/main/docs/operator-manual/notifications/triggers.md)
- [notification_controller/controller/controller.go](https://github.com/argoproj/argo-cd/blob/main/notification_controller/controller/controller.go)
- [controller/appcontroller.go](https://github.com/argoproj/argo-cd/blob/main/controller/appcontroller.go)
- [docs/operator-manual/notifications/index.md](https://github.com/argoproj/argo-cd/blob/main/docs/operator-manual/notifications/index.md)
</details>

## Overview

The Argo CD Notifications controller continuously monitors application state changes and provides a flexible mechanism to alert users about important lifecycle events. Operating as a dedicated component within the broader Argo CD ecosystem, it bridges application reconciliation state with external notification delivery channels. The controller solves the problem of reactive operational visibility by evaluating customizable trigger conditions against live application metrics and dispatching formatted alerts through templates. Key design decisions include leveraging informer-based state tracking across single or multiple namespaces, evaluating predicate expressions via an embedded rules engine, and supporting self-service notification configurations. By integrating directly with application controllers, core settings, and predefined notification catalogs, the system delivers structured alerts without duplicating core GitOps reconciliation logic.

Sources: [docs/operator-manual/notifications/index.md:3-8](https://github.com/argoproj/argo-cd/blob/main/docs/operator-manual/notifications/index.md#L3-L8), [docs/operator-manual/notifications/triggers.md:1-4](https://github.com/argoproj/argo-cd/blob/main/docs/operator-manual/notifications/triggers.md#L1-L4), [notification_controller/controller/controller.go:57-126](https://github.com/argoproj/argo-cd/blob/main/notification_controller/controller/controller.go#L57-L126)

## CLI Initialization and Controller Bootstrap

### Overview

The `argocd-notification` binary configures and starts the Argo CD Notifications controller via a Cobra command-line interface. The bootstrap procedure sets up Kubernetes clients, parsing flags and environment variables, initializes logging formats, establishes repo-server TLS configurations, starts a metrics endpoint, and instantiates the main notification controller loop.

Sources: [cmd/argocd-notification/commands/argocd_notification.go:39-168](https://github.com/argoproj/argo-cd/blob/main/cmd/argocd-notification/commands/argocd_notification.go#L39-L168)

### CLI Flags and Environment Configuration

The controller exposes configuration parameters through command-line flags and environment variables.

| Flag | Type | Default | Environment Variable | Purpose |
| :--- | :--- | :--- | :--- | :--- |
| `--processors-count` | int | `1` | `ARGOCD_NOTIFICATION_CONTROLLER_PROCESSORS_COUNT` | Number of concurrent notification processors. |
| `--app-label-selector` | string | `""` | None | Application label selector for filtering watched resources. |
| `--loglevel` | string | `"info"` | `ARGOCD_NOTIFICATIONS_CONTROLLER_LOGLEVEL` | Logging level (`debug`, `info`, `warn`, `error`). |
| `--logformat` | string | `"json"` | `ARGOCD_NOTIFICATIONS_CONTROLLER_LOGFORMAT` | Logging format (`json`, `text`). |
| `--metrics-port` | int | `9001` | None | Port for serving Prometheus metrics. |
| `--argocd-repo-server` | string | `argocd-repo-server:8081` | None | Argo CD repository server address. |
| `--argocd-repo-server-plaintext` | bool | `false` | `ARGOCD_NOTIFICATION_CONTROLLER_REPO_SERVER_PLAINTEXT` | Use a plaintext (non-TLS) client connection to the repository server. |
| `--argocd-repo-server-strict-tls` | bool | `false` | None | Perform strict validation of TLS certificates (deprecated in favor of CA cert path). |
| `--config-map-name` | string | `"argocd-notifications-cm"` | None | Name of the notifications ConfigMap. |
| `--secret-name` | string | `"argocd-notifications-secret"` | None | Name of the notifications Secret. |
| `--application-namespaces` | stringSlice | `[]` | `ARGOCD_APPLICATION_NAMESPACES` | Additional namespaces monitored for notifications. |
| `--self-service-notification-enabled` | bool | `false` | `ARGOCD_NOTIFICATION_CONTROLLER_SELF_SERVICE_NOTIFICATION_ENABLED` | Enables pulling notification config from resource namespaces. |

Sources: [cmd/argocd-notification/commands/argocd_notification.go:170-183](https://github.com/argoproj/argo-cd/blob/main/cmd/argocd-notification/commands/argocd_notification.go#L170-L183)

### Startup Call-Chain Execution Walkthrough

When `RunE` executes, the initialization follows a strict sequence:
1. `clientConfig.Namespace()` resolves the target namespace and logs startup information via `vers.LogStartupInfo()`.
2. `clientConfig.ClientConfig()` provisions the REST configuration, setting the User-Agent to `argocd-notifications-controller/<version> (latform>)`.
3. `dynamic.NewForConfig()` and `kubernetes.NewForConfig()` establish the dynamic and core Kubernetes API clients.
4. `log.ParseLevel()` and log format switch statements configure logging verbosity and structure (JSON or Text with optional color forcing).
5. `repoServerClientTLSConfigSrc()` evaluates TLS settings, establishing plaintext or X509 certificate pools using `env.StringFromEnv(common.EnvAppConfigPath, common.DefaultAppConfigPath)`.
6. `service.NewArgoCDService()` initializes the Argo CD service wrapper with the repository clientset.
7. `controller.NewController()` constructs the controller instance, followed by `ctrl.Init(ctx)` which spins up informers and waits for cache synchronization via `cache.WaitForCacheSync()`.
8. `signal.Notify()` captures OS interrupts and `SIGTERM` signals for graceful context cancellation, while `ctrl.Run(ctx, processorsCount)` launches the event workers.

> [!WARNING]
> If cache synchronization times out during `ctrl.Init(ctx)`, the function immediately returns an error (`timed out waiting for caches to sync`), terminating the startup routine.

Sources: [cmd/argocd-notification/commands/argocd_notification.go:59-166](https://github.com/argoproj/argo-cd/blob/main/cmd/argocd-notification/commands/argocd_notification.go#L59-L166), [notification_controller/controller/controller.go:182-194](https://github.com/argoproj/argo-cd/blob/main/notification_controller/controller/controller.go#L182-L194)

## Application Informers and State Reconciliation

### Overview

The notification controller relies on custom Kubernetes informers and resource controllers to monitor Argo CD applications and projects. It implements strict namespace scoping and conditional processing logic to ensure that events trigger notifications only when application state transitions are fully reconciled and valid.

Sources: [notification_controller/controller/controller.go:52-128](https://github.com/argoproj/argo-cd/blob/main/notification_controller/controller/controller.go#L52-L128)

### Informer Construction and Namespace Scoping

The controller initializes shared index informers for both `Applications` and `AppProjects` using dynamic client interfaces. When listing and watching application resources, the `newInformer` function applies custom list filters to restrict monitored entities to either the control plane namespace or any user-defined additional application namespaces.

Sources: [notification_controller/controller/controller.go:85-86](https://github.com/argoproj/argo-cd/blob/main/notification_controller/controller/controller.go#L85-L86), [notification_controller/controller/controller.go:148-180](https://github.com/argoproj/argo-cd/blob/main/notification_controller/controller/controller.go#L148-L180)

| Informer | Resource | Namespace Scope | Purpose |
| :--- | :--- | :--- | :--- |
| `appInformer` | Applications (`v1alpha1`) | Control plane namespace or `applicationNamespaces` | Monitors target application changes and sync statuses. |
| `appProjInformer` | AppProjects (`v1alpha1`) | Control plane namespace (`namespace`) | Resolves project annotations for destination overrides. |
| `secretInformer` | Secrets | Control plane or `NamespaceAll` (self-service) | Watches notification configuration secrets. |
| `configMapInformer` | ConfigMaps | Control plane or `NamespaceAll` (self-service) | Watches notification templates and trigger mappings. |

Sources: [notification_controller/controller/controller.go:59-62](https://github.com/argoproj/argo-cd/blob/main/notification_controller/controller/controller.go#L59-L62), [notification_controller/controller/controller.go:85-94](https://github.com/argoproj/argo-cd/blob/main/notification_controller/controller/controller.go#L85-L94)

Sources: [notification_controller/controller/controller.go:59-62](https://github.com/argoproj/argo-cd/blob/main/notification_controller/controller/controller.go#L59-L62), [notification_controller/controller/controller.go:85-94](https://github.com/argoproj/argo-cd/blob/main/notification_controller/controller/controller.go#L85-L94)

### State Reconciliation and Skip Processing

Before processing an object, the underlying notification engine evaluates `WithSkipProcessing` options configured on the controller. The `checkAppNotInAdditionalNamespaces` and `isAppSyncStatusRefreshed` functions determine whether an application update should be deferred or skipped.

Sources: [notification_controller/controller/controller.go:103-112](https://github.com/argoproj/argo-cd/blob/main/notification_controller/controller/controller.go#L103-L112), [notification_controller/controller/controller.go:131-133](https://github.com/argoproj/argo-cd/blob/main/notification_controller/controller/controller.go#L131-L133)

> [!WARNING]
> If an application has a completed `operationState` (phases `Failed`, `Error`, or `Succeeded`) where the `finishedAt` timestamp occurs after both `reconciledAt` and `observedAt`, `isAppSyncStatusRefreshed` returns `false`. This causes the controller to skip notification processing until Argo CD completes its status refresh.

Sources: [notification_controller/controller/controller.go:221-264](https://github.com/argoproj/argo-cd/blob/main/notification_controller/controller/controller.go#L221-264)

### Destination Alteration and Project Annotations

As notifications are prepared, the `alterDestinations` method queries the associated `AppProject` via `getAppProj` using the informer indexer key format `<namespace>/rojName>`. It merges both modern subscription annotations and legacy destination settings directly into the notification dispatch targets.

Sources: [notification_controller/controller/controller.go:135-146](https://github.com/argoproj/argo-cd/blob/main/notification_controller/controller/controller.go#L135-L146), [notification_controller/controller/controller.go:201-218](https://github.com/argoproj/argo-cd/blob/main/notification_controller/controller/controller.go#L201-218)

Sources: [notification_controller/controller/controller.go:135-146](https://github.com/argoproj/argo-cd/blob/main/notification_controller/controller/controller.go#L135-L146), [notification_controller/controller/controller.go:201-218](https://github.com/argoproj/argo-cd/blob/main/notification_controller/controller/controller.go#L201-218)

## Trigger Condition Evaluation Mechanics

### Overview

Triggers define the specific conditions under which notifications are dispatched. Each trigger entry consists of a unique name, a predicate expression evaluated against the application state, and a reference to one or more notification templates. The evaluation engine is powered by [antonmedv/expr](https://github.com/antonmedv/expr), supporting full predicate expressions, optional chaining, and built-in functions such as time parsing and calculations.

Sources: [docs/operator-manual/notifications/triggers.md:1-4](https://github.com/argoproj/argo-cd/blob/main/docs/operator-manual/notifications/triggers.md#L1-L4), [docs/operator-manual/notifications/triggers.md:130-138](https://github.com/argoproj/argo-cd/blob/main/docs/operator-manual/notifications/triggers.md#L130-L138)

### Configuring Trigger Conditions and Optional Chaining

Triggers are configured within the `argocd-notifications-cm` ConfigMap. Expressions can reference nested application attributes, including optional fields that may be absent during specific lifecycle phases. The optional chaining operator (`?.`) prevents evaluation failures when checking properties on uninitialized sub-objects like `status.operationState`.

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: argocd-notifications-cm
data:
  trigger.on-sync-status-unknown: |
    - when: app.status.sync.status == 'Unknown'
      send: [app-sync-status, github-commit-status]
  trigger.sync-operation-change: |
    - when: app.status?.operationState.phase in ['Succeeded']
      send: [github-commit-status]
    - when: app.status?.operationState.phase in ['Running']
      send: [github-commit-status]
    - when: app.status?.operationState.phase in ['Error', 'Failed']
      send: [app-sync-failed, github-commit-status]
```

Sources: [docs/operator-manual/notifications/triggers.md:6-18](https://github.com/argoproj/argo-cd/blob/main/docs/operator-manual/notifications/triggers.md#L6-L18), [docs/operator-manual/notifications/triggers.md:31-44](https://github.com/argoproj/argo-cd/blob/main/docs/operator-manual/notifications/triggers.md#L31-L44)

> [!NOTE]
> The optional chaining expression `app.status?.operationState.phase` evaluates safely to `nil` if `operationState` is not present, which is equivalent to writing `app.status.operationState != nil ? app.status.operationState.phase : nil`. Omitting the `?.` operator on optional fields results in an evaluation error when the field is uninitialized.

Sources: [docs/operator-manual/notifications/triggers.md:47-55](https://github.com/argoproj/argo-cd/blob/main/docs/operator-manual/notifications/triggers.md#L47-L55)

### Preventing Flapping and Managing Revision Triggers

To prevent duplicate notifications caused by intermittent state changes (such as an application health status temporarily switching to `Progressing` and back to `Healthy`), triggers can use the `oncePer` field. This ensures notifications are sent only when a specific tracking field changes value.

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: argocd-notifications-cm
data:
  trigger.on-deployed: |
    when: app.status?.operationState.phase in ['Succeeded'] and app.status.health.status == 'Healthy'
    oncePer: app.status.sync.revision
    send: [app-sync-succeeded]
```

Sources: [docs/operator-manual/notifications/triggers.md:58-78](https://github.com/argoproj/argo-cd/blob/main/docs/operator-manual/notifications/triggers.md#L58-L78)

> [!TIP]
> When monitoring a monorepo where a single Git revision triggers syncs across multiple applications, using `oncePer: app.status.sync.revision` generates notifications for every affected application per commit. To scope notifications to a particular application's sync operation, use `oncePer: app.status?.operationState.syncResult.revision` or target custom resource metadata annotations like `oncePer: app.metadata.annotations["example.com/version"]`.

Sources: [docs/operator-manual/notifications/triggers.md:80-98](https://github.com/argoproj/argo-cd/blob/main/docs/operator-manual/notifications/triggers.md#L80-L98)

## Notification Catalog and Template Rendering

### Overview

Argo CD Notifications provides a pre-packaged catalog of triggers and templates designed to monitor application lifecycles without requiring custom authoring from scratch. The catalog is distributed as a Kubernetes ConfigMap manifest (`notifications_catalog/install.yaml`) which can be applied directly to the cluster control plane namespace.

Sources: [notifications_catalog/install.yaml:527-530](https://github.com/argoproj/argo-cd/blob/main/notifications_catalog/install.yaml#L527-L530), [docs/operator-manual/notifications/catalog.md:1-6](https://github.com/argoproj/argo-cd/blob/main/docs/operator-manual/notifications/catalog.md#L1-L6)

To install the official catalog of triggers and templates into the `argocd` namespace, run the following command:

```bash
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/notifications_catalog/install.yaml
```

Sources: [docs/operator-manual/notifications/catalog.md:2-6](https://github.com/argoproj/argo-cd/blob/main/docs/operator-manual/notifications/catalog.md#L2-L6)

### Catalog Triggers Reference

The catalog defines a set of standard trigger definitions mapped to application lifecycle events, evaluation conditions, and output templates.

| Name | Description | Template |
| :--- | :--- | :--- |
| `on-created` | Application is created. | `app-created` |
| `on-deleted` | Application is deleted. | `app-deleted` |
| `on-deployed` | Application is synced and healthy. Triggered once per commit. | `app-deployed` |
| `on-health-degraded` | Application has degraded | `app-health-degraded` |
| `on-sync-failed` | Application syncing has failed | `app-sync-failed` |
| `on-sync-running` | Application is being synced | `app-sync-running` |
| `on-sync-status-unknown` | Application status is 'Unknown' | `app-sync-status-unknown` |
| `on-sync-succeeded` | Application syncing has succeeded | `app-sync-succeeded` |

Sources: [docs/operator-manual/notifications/catalog.md:7-17](https://github.com/argoproj/argo-cd/blob/main/docs/operator-manual/notifications/catalog.md#L7-L17)

### Default Catalog Templates

Templates define channel-specific message structures, subjects, email bodies, and rich Slack or Microsoft Teams attachment fields. Each template handles single-source and multi-source application specifications using conditional expansions (`if .app.spec.source` versus `if .app.spec.sources`) to extract repository URLs.

```yaml
template.app-created:
  email:
    subject: Application {{.app.metadata.name}} has been created.
  message: Application {{.app.metadata.name}} has been created.
  teams:
    title: Application {{.app.metadata.name}} has been created.
template.app-deleted:
  email:
    subject: Application {{.app.metadata.name}} has been deleted.
  message: Application {{.app.metadata.name}} has been deleted.
  teams:
    title: Application {{.app.metadata.name}} has been deleted.
```

Sources: [notifications_catalog/install.yaml:3-14](https://github.com/argoproj/argo-cd/blob/main/notifications_catalog/install.yaml#L3-L14)

> [!NOTE]
> Templates dynamically adjust repository fields depending on whether `.app.spec.source` or multi-source `.app.spec.sources` is declared on the target application resource, iterating across sources with range loops to format list output safely across Slack and Microsoft Teams payloads.

Sources: [notifications_catalog/install.yaml:32-36](https://github.com/argoproj/argo-cd/blob/main/notifications_catalog/install.yaml#L32-L36), [notifications_catalog/install.yaml:62-64](https://github.com/argoproj/argo-cd/blob/main/notifications_catalog/install.yaml#L62-L64)

## Main Controller Integration and Settings

### Overview

The notifications controller integrates tightly with Argo CD application management pipelines to guarantee that notification dispatches remain synchronized with application lifecycle events and sync statuses. Rather than relying solely on raw Kubernetes watch updates, the controller evaluates specific conditions—such as verifying whether an application's `SyncStatus` has been refreshed following a completed operation phase—before triggering notifications or downstream processing loops.

Sources: [notification_controller/controller/controller.go:103-112](https://github.com/argoproj/argo-cd/blob/main/notification_controller/controller/controller.go#L103-L112), [notification_controller/controller/controller.go:221-232](https://github.com/argoproj/argo-cd/blob/main/notification_controller/controller/controller.go#L221-L232)

### Sync Status Refinement and Validation

During application monitoring, `isAppSyncStatusRefreshed` evaluates active operation states (`phase`, `finishedAt`, `reconciledAt`, and `observedAt`) to verify if an operation's completion timestamp precedes the latest reconciliation metrics. If an operation phase is completed (`Failed`, `Error`, or `Succeeded`) but `finishedAt` occurs after `reconciledAt` or `observedAt`, the sync status is determined to be out-of-date, preventing premature notification firing.

Sources: [notification_controller/controller/controller.go:233-258](https://github.com/argoproj/argo-cd/blob/main/notification_controller/controller/controller.go#L233-L258)

> [!NOTE]
> If an application object lacks an `operationState` or an explicit operation phase, `isAppSyncStatusRefreshed` assumes the sync status is up-to-date and permits subsequent processing steps to proceed.

Sources: [notification_controller/controller/controller.go:222-232](https://github.com/argoproj/argo-cd/blob/main/notification_controller/controller/controller.go#L222-L232)

### Destination and Project Annotation Integration

When dispatching notifications, the controller alters delivery destinations by inspecting associated `AppProject` definitions via `alterDestinations`. It extracts custom project annotations to merge dynamic webhook endpoints, subscription annotations, and legacy configurations into the final notification payload.

Sources: [notification_controller/controller/controller.go:135-146](https://github.com/argoproj/argo-cd/blob/main/notification_controller/controller/controller.go#L135-L146)

| Integration Function | Target Object | Purpose |
| :--- | :--- | :--- |
| `NewController` | `kubernetes.Interface`, `dynamic.Interface` | Initializes informers, secret watchers, and the core notification engine factory. |
| `alterDestinations` | `metav1.Object`, `services.Destinations` | Merges project-level annotation subscriptions with default trigger routing rules. |
| `isAppSyncStatusRefreshed` | `unstructured.Unstructured` | Validates whether application sync metrics match or lag behind the last operation finish time. |

Sources: [notification_controller/controller/controller.go:65-96](https://github.com/argoproj/argo-cd/blob/main/notification_controller/controller/controller.go#L65-L96), [notification_controller/controller/controller.go:135-146](https://github.com/argoproj/argo-cd/blob/main/notification_controller/controller/controller.go#L135-L146), [notification_controller/controller/controller.go:221-264](https://github.com/argoproj/argo-cd/blob/main/notification_controller/controller/controller.go#L221-L264)

## Related

- [[Notification Templates]]
- [[Application Controller]]

