# System Settings

<details>
<summary>Relevant source files</summary>

The following files were used as context for generating this wiki page:

- [util/settings/settings.go](https://github.com/argoproj/argo-cd/blob/main/util/settings/settings.go)
- [docs/operator-manual/argocd-cmd-params-cm.yaml](https://github.com/argoproj/argo-cd/blob/main/docs/operator-manual/argocd-cmd-params-cm.yaml)
- [manifests/namespace-install-with-hydrator.yaml](https://github.com/argoproj/argo-cd/blob/main/manifests/namespace-install-with-hydrator.yaml)
</details>

## Overview

The system settings subsystem provides centralized configuration management for Argo CD by reconciling in-memory runtime structures with declarative Kubernetes ConfigMaps and Secrets. It solves the challenge of distributing uniform settings across distributed control plane components while supporting live configuration updates without restarting services. Key design decisions include thread-safe initialization of `SettingsManager` instances, automatic fallback to sensible defaults, and reactive synchronization through Kubernetes informers that watch for changes in labeled objects.
Sources: [util/settings/settings.go:86-173](https://github.com/argoproj/argo-cd/blob/main/util/settings/settings.go#L86-L173), [util/settings/settings.go:602-621](https://github.com/argoproj/argo-cd/blob/main/util/settings/settings.go#L602-L621), [util/settings/settings.go:1380-1405](https://github.com/argoproj/argo-cd/blob/main/util/settings/settings.go#L1380-L1405)

By integrating tightly with Kubernetes primitives, the settings engine interacts with API server components, controllers, and authentication providers to parse OIDC configurations, resolve secret references, and evaluate feature gates. This architecture guarantees that parameter definitions, resource customizations, and diff options remain synchronized across the entire Argo CD deployment.
Sources: [util/settings/settings.go:1669-1736](https://github.com/argoproj/argo-cd/blob/main/util/settings/settings.go#L1669-L1736), [util/settings/settings.go:1764-1811](https://github.com/argoproj/argo-cd/blob/main/util/settings/settings.go#L1764-L1811), [util/settings/settings.go:2018-2024](https://github.com/argoproj/argo-cd/blob/main/util/settings/settings.go#L2018-L2024)

## Settings Manager Architecture

### Settings Manager Architecture

### Overview

The `SettingsManager` is the core structural component responsible for managing, watching, and loading Argo CD runtime configuration from Kubernetes ConfigMaps and Secrets. It coordinates informer lifecycles, maintains thread-safe access to listers, and manages subscriber notifications when configuration changes occur in the cluster.
Sources: [util/settings/settings.go:602-621](https://github.com/argoproj/argo-cd/blob/main/util/settings/settings.go#L602-L621), [util/settings/settings.go:1380-1405](https://github.com/argoproj/argo-cd/blob/main/util/settings/settings.go#L1380-L1405)

### Core Structures

The subsystem relies on several primary Go structures defined in `util/settings/settings.go` to hold configuration state and manage synchronization primitives:

| Structure | Key Fields | Purpose |
| :--- | :--- | :--- |
| `SettingsManager` | `clientset`, `secrets`, `configmaps`, `subscribers`, `mutex`, `clusterInformer` | Orchestrates Kubernetes informers, listers, and subscriber channels for live configuration management. |
| `ArgoCDSettings` | `URL`, `DexConfig`, `OIDCConfigRAW`, `ServerSignature`, `Certificate`, `Secrets`, `ExecShells` | Holds in-memory runtime configuration options parsed from ConfigMaps and Secrets. |
| `SettingsManagerOpts` | Functional option closure type | Allows customization of `SettingsManager` during instantiation, such as attaching repo or cluster change handlers. |

Sources: [util/settings/settings.go:86-173](https://github.com/argoproj/argo-cd/blob/main/util/settings/settings.go#L86-L173), [util/settings/settings.go:602-621](https://github.com/argoproj/argo-cd/blob/main/util/settings/settings.go#L602-L621), [util/settings/settings.go:1929-1935](https://github.com/argoproj/argo-cd/blob/main/util/settings/settings.go#L1929-L1935)

### Lifecycle and Execution Walkthrough

The lifecycle of the `SettingsManager` follows a strict initialization and synchronization path. When any configuration-dependent component attempts to read settings, it invokes `ensureSynced()` to verify that informers are active and caches are populated.

The initialization execution flow proceeds through the following call chain:
`ensureSynced()` → locks `mgr.mutex` and checks cache state → calls `initialize()` → creates filtered informers via `NewFilteredConfigMapInformer`, `NewFilteredSecretInformer`, and `NewClusterInformer` → spawns goroutines to run informers via `cmInformer.Run()`, `secretsInformer.Run()`, and `clusterInformer.Run()` → blocks on `cache.WaitForCacheSync()` until all informers sync → initializes `mgr.secrets` and `mgr.configmaps` listers.

> [!NOTE]
> During synchronization, `ensureSynced(false)` returns immediately if listers are already populated. Passing `forceResync = true` cancels any existing initialization context and forces a complete teardown and restart of all informers.

Sources: [util/settings/settings.go:1550-1642](https://github.com/argoproj/argo-cd/blob/main/util/settings/settings.go#L1550-L1642), [util/settings/settings.go:1644-1657](https://github.com/argoproj/argo-cd/blob/main/util/settings/settings.go#L1644-L1657)

### Instantiation and Subscription API

New manager instances are constructed using `NewSettingsManager()`, which accepts a Kubernetes clientset and target namespace, followed by functional options. Subscribers can register to receive updates whenever configuration changes.

```go
ctx := context.Background()
clientset := kubernetes.NewForConfigOrDie(restConfig)
mgr := settings.NewSettingsManager(ctx, clientset, "argocd", 
    settings.WithRepoOrClusterChangedHandler(func() {
        log.Info("Repository or cluster configuration changed")
    }),
)

subCh := make(chan *settings.ArgoCDSettings, 10)
mgr.Subscribe(subCh)
defer mgr.Unsubscribe(subCh)
```
Sources: [util/settings/settings.go:1931-1951](https://github.com/argoproj/argo-cd/blob/main/util/settings/settings.go#L1931-L1951), [util/settings/settings.go:2398-2416](https://github.com/argoproj/argo-cd/blob/main/util/settings/settings.go#L2398-L2416)

## ConfigMap Structure and Parameter Defaults

### Overview

Declarative configuration for Argo CD components is governed by the `argocd-cmd-params-cm` ConfigMap, which defines operational parameters, resource limits, timeout thresholds, and feature flags across all control plane binaries. Concurrently, namespace manifest installations embed default exclusion rules, ignore-difference customizations, and environment variable mappings in deployments.
Sources: [docs/operator-manual/argocd-cmd-params-cm.yaml:1-10](https://github.com/argoproj/argo-cd/blob/main/docs/operator-manual/argocd-cmd-params-cm.yaml#L1-L10), [manifests/namespace-install-with-hydrator.yaml:425-521](https://github.com/argoproj/argo-cd/blob/main/manifests/namespace-install-with-hydrator.yaml#L425-L521)

### Controller and Server Parameter Schema

The parameters ConfigMap exposes properties grouped by service component. The default manifest installations project these ConfigMap keys directly into environment variables consumed by container entrypoints.

| Parameter Key | Default Value | Component / Purpose |
| :--- | :--- | :--- |
| `repo.server` | `"argocd-repo-server:8081"` | Global repository server RPC endpoint address. |
| `redis.server` | `"argocd-redis:6379"` | Redis server hostname and port for caching. |
| `redis.compression` | `gzip` | Compression algorithm for data sent to Redis. |
| `hydrator.enabled` | `"false"` | Enables the beta manifest hydrator feature. |
| `controller.status.processors` | `"20"` | Number of concurrent application status processors. |
| `controller.operation.processors` | `"10"` | Number of concurrent application operation processors. |
| `controller.hydration.processors` | `"5"` | Number of manifest hydration processors (requires hydrator). |
| `controller.sharding.algorithm` | `legacy` | Sharding algorithm for balancing clusters across shards. |
| `server.k8s.client.qps` | `"50"` | QPS limit for Kubernetes API client requests. |
| `server.k8s.client.burst` | `"100"` | Burst value for Kubernetes API client requests. |
| `reposerver.parallelism.limit` | `"1"` | Limit on concurrent manifest generation requests. |
| `commitserver.listen.address` | `"0.0.0.0"` | Listen address for the commit server. |

Sources: [docs/operator-manual/argocd-cmd-params-cm.yaml:9-26](https://github.com/argoproj/argo-cd/blob/main/docs/operator-manual/argocd-cmd-params-cm.yaml#L9-L26), [docs/operator-manual/argocd-cmd-params-cm.yaml:63-68](https://github.com/argoproj/argo-cd/blob/main/docs/operator-manual/argocd-cmd-params-cm.yaml#L63-L68), [docs/operator-manual/argocd-cmd-params-cm.yaml:101-102](https://github.com/argoproj/argo-cd/blob/main/docs/operator-manual/argocd-cmd-params-cm.yaml#L101-L102), [docs/operator-manual/argocd-cmd-params-cm.yaml:229-234](https://github.com/argoproj/argo-cd/blob/main/docs/operator-manual/argocd-cmd-params-cm.yaml#L229-L234), [docs/operator-manual/argocd-cmd-params-cm.yaml:264-265](https://github.com/argoproj/argo-cd/blob/main/docs/operator-manual/argocd-cmd-params-cm.yaml#L264-L265), [docs/operator-manual/argocd-cmd-params-cm.yaml:321-322](https://github.com/argoproj/argo-cd/blob/main/docs/operator-manual/argocd-cmd-params-cm.yaml#L321-L322)

> [!WARNING]
> Setting `reposerver.parallelism.limit` below `1` removes concurrency limits entirely. Any value less than `1` disables the restriction, which can exhaust repository server memory during heavy manifest generation spikes.
Sources: [docs/operator-manual/argocd-cmd-params-cm.yaml:264-265](https://github.com/argoproj/argo-cd/blob/main/docs/operator-manual/argocd-cmd-params-cm.yaml#L264-L265)

### Built-in Resource Exclusions and Customizations

Namespace installations bundle pre-configured resource customizations inside `argocd-cm` to exclude high-churn control plane objects and reduce watched event volume.

| Excluded API Group | Excluded Kinds | Purpose |
| :--- | :--- | :--- |
| `""`, `discovery.k8s.io` | `Endpoints`, `EndpointSlice` | Network resources created by the control plane to reduce UI clutter and watched events. |
| `coordination.k8s.io` | `Lease` | Internal leader election objects. |
| `authentication.k8s.io`, `authorization.k8s.io` | `SelfSubjectReview`, `TokenReview`, `SubjectAccessReview`, and related review kinds | Internal authentication and authorization testing objects. |
| `certificates.k8s.io`, `cert-manager.io` | `CertificateSigningRequest`, `CertificateRequest` | Intermediate certificate requests. |
| `cilium.io` | `CiliumIdentity`, `CiliumEndpoint`, `CiliumEndpointSlice` | Cilium networking internal state. |
| `kyverno.io`, `reports.kyverno.io`, `wgpolicyk8s.io` | `PolicyReport`, `ClusterPolicyReport`, `AdmissionReport`, and related report kinds | Kyverno policy reporting objects. |

Sources: [manifests/namespace-install-with-hydrator.yaml:467-521](https://github.com/argoproj/argo-cd/blob/main/manifests/namespace-install-with-hydrator.yaml#L467-L521)

## Dynamic Synchronization and Informer Events

### Dynamic Synchronization and Informer Events

### Overview

Argo CD maintains live synchronization with Kubernetes configuration resources using client-go informers managed by `SettingsManager`. The initialization sequence wires filtered informers for ConfigMaps and Secrets, attaches selective event handlers, and handles resync operations dynamically when parameters or credentials change.

Sources: [util/settings/settings.go:1419-1642](https://github.com/argoproj/argo-cd/blob/main/util/settings/settings.go#L1419-L1642)

### Informer Event Handlers

The `SettingsManager` builds specialized event handler filters to process only relevant cluster modifications. The validation logic relies on helper predicates (`isArgoCDConfigMap`, `isRepositorySecret`, `isSettingsObject`) to ignore unrelated objects and prevent unnecessary cache invalidation or spurious reloads.

| Handler Function | Target Resource Type | Filtering Rule | Action on Event |
| :--- | :--- | :--- | :--- |
| `argoCDConfigMapEventHandler` | ConfigMap | Matches `argocd-cm` (`isArgoCDConfigMap`) | Triggers `onRepoOrClusterChanged()` for project cache invalidation |
| `repositorySecretEventHandler` | Secret | Matches `argocd.argoproj.io/secret-type=repository` | Triggers `onRepoOrClusterChanged()` for project-repo binding updates |
| `clusterSecretEventHandler` | Secret | Filtered by informer to `argocd.argoproj.io/secret-type=cluster` | Triggers `onRepoOrClusterChanged()` for cluster updates |
| `settingsNotificationEventHandler` | ConfigMap / Secret | Matches `app.kubernetes.io/part-of=argocd` | Triggers `tryNotify()` to reload settings and push to subscribers |

Sources: [util/settings/settings.go:1411-1548](https://github.com/argoproj/argo-cd/blob/main/util/settings/settings.go#L1411-L1548)

> [!NOTE]
> `settingsNotificationEventHandler` checks creation timestamps on `AddFunc` and resource version changes on `UpdateFunc`. This prevents the periodic informer resync window from triggering synthetic update notifications and redundant settings reloads.
Sources: [util/settings/settings.go:1519-1548](https://github.com/argoproj/argo-cd/blob/main/util/settings/settings.go#L1519-L1548)

### Informer Resyncing and Subscription Execution Walkthrough

When configuration updates occur via `updateSecret()` or `updateConfigMap()`, or when manual synchronization is requested, the manager initiates a resync workflow.

1. **Trigger Call**: `ResyncInformers()` invokes `mgr.ensureSynced(true)`.
2. **Context Cancellation**: `ensureSynced` acquires `mgr.mutex`, cancels any active initialization context via `mgr.initContextCancel()`, and creates a new derived context from `mgr.ctx`.
3. **Informer Initialization**: `initialize(ctx)` constructs filtered informers:
   - ConfigMap informer (`cmInformer`) filtered to `app.kubernetes.io/part-of=argocd` with custom namespace and indexers (`cache.NamespaceIndex`, `ByProjectRepoIndexer`, `ByProjectRepoWriteIndexer`).
   - Secret informer (`secretsInformer`) filtered to exclude cluster secrets (`argocd.argoproj.io/secret-type != cluster`).
   - Cluster informer (`clusterInformer`) filtered to `argocd.argoproj.io/secret-type=cluster`.
4. **Cache Synchronization**: `cache.WaitForCacheSync` blocks until all three informers report synced status.
5. **Subscriber Notification**: `tryNotify()` invokes `mgr.GetSettings()` and pushes the parsed `ArgoCDSettings` pointer to all registered channels in `mgr.subscribers` via `notifySubscribers()`.

Sources: [util/settings/settings.go:708-782](https://github.com/argoproj/argo-cd/blob/main/util/settings/settings.go#L708-L782), [util/settings/settings.go:1419-1657](https://github.com/argoproj/argo-cd/blob/main/util/settings/settings.go#L1419-L1657)

> [!WARNING]
> `notifySubscribers` dispatches updates to subscriber channels inside a separate goroutine (`go func()`) while holding `mgr.mutex` during snapshotting, but sending to channels occurs asynchronously to prevent deadlocks when subscribers call back into the `SettingsManager`.
Sources: [util/settings/settings.go:1419-1432](https://github.com/argoproj/argo-cd/blob/main/util/settings/settings.go#L1419-L1432), [util/settings/settings.go:2418-2432](https://github.com/argoproj/argo-cd/blob/main/util/settings/settings.go#L2418-L2432)

## Secret Replacement and OIDC Integration

### Overview

Argo CD handles sensitive credentials by embedding secret references using a `$` prefix (e.g., `$secretKey` or `$secretName:key`) within configuration blocks such as OIDC and webhook settings. The `SettingsManager` resolves these references by merging values from the primary `argocd-secret` and additional participating secrets. TLS certificates are loaded dynamically with cascading fallbacks from externally managed secrets to internal storage or auto-generated self-signed pairs. Concurrently, Dex and OIDC configurations are unmarshaled, validated, and parsed into structured options.

Sources: [util/settings/settings.go:1765-1838](https://github.com/argoproj/argo-cd/blob/main/util/settings/settings.go#L1765-L1838), [util/settings/settings.go:1985-2016](https://github.com/argoproj/argo-cd/blob/main/util/settings/settings.go#L1985-L2016)

### Secret Reference Resolution and OIDC Parsing Walkthrough

The pipeline for parsing OIDC settings and substituting embedded secret references executes through a distinct call chain:

1. **Raw Retrieval**: `ArgoCDSettings.oidcConfig()` checks `a.OIDCConfigRAW`. If present, it unmarshals the raw YAML string into a generic `map[string]any`.
2. **Recursive Secret Replacement**: `ReplaceMapSecrets(configMap, a.Secrets)` invokes `replaceMapSecrets()`, which dispatches values to `replaceSecretsValue()`. For each string encountered, `ReplaceStringSecret()` / `replaceStringSecret()` inspects whether the value starts with `$`.
3. **Lookup and Trimming**: If a leading `$` is detected, the key is extracted and looked up in `secretValues`. If found, the raw secret value is trimmed using `strings.TrimSpace` and returned.
4. **Connector Configuration Escaping**: Before Dex or OIDC structures are finalized, `EscapeDollarSignsInConnectorConfig()` checks if string values are resolved secrets. If they are not unresolved environment variable references (`isUnresolvedEnvVarReference`), literal dollar signs are escaped to `$$` to protect them from downstream `os.ExpandEnv` expansion.
5. **Final Unmarshaling**: The sanitized map is marshaled back to YAML via `yaml.Marshal` and unmarshaled into the structured `oidcConfig` object using `unmarshalOIDCConfig()`.

Sources: [util/settings/settings.go:1991-2065](https://github.com/argoproj/argo-cd/blob/main/util/settings/settings.go#L1991-L2065), [util/settings/settings.go:2532-2630](https://github.com/argoproj/argo-cd/blob/main/util/settings/settings.go#L2532-L2630)

> [!NOTE]
> `isUnresolvedEnvVarReference` ensures that dollar-sign prefixes that do not match any key in the secret map are treated as environment variable references and left unescaped, allowing Dex to expand them at runtime.
Sources: [util/settings/settings.go:2620-2630](https://github.com/argoproj/argo-cd/blob/main/util/settings/settings.go#L2620-L2630)

### TLS Certificate Loading Strategy

The API server resolves its TLS configuration using a prioritized cascading strategy managed by `loadTLSCertificate()`.

| Priority Order | Secret Source | Target Keys | Action |
| :--- | :--- | :--- | :--- |
| 1 (External) | `argocd-server-tls` (External Secret) | `tls.crt`, `tls.key` | Loaded via `loadTLSCertificateFromSecret()`; sets `CertificateIsExternal = true` |
| 2 (Internal) | `argocd-secret` | `tls.crt`, `tls.key` | Fallback if no external secret exists; sets `CertificateIsExternal = false` |
| 3 (Generated) | Self-signed generator | None | Generated via `tlsutil.GenerateX509KeyPair()` during `InitializeSettings()` if missing |

Sources: [util/settings/settings.go:1777-1837](https://github.com/argoproj/argo-cd/blob/main/util/settings/settings.go#L1777-L1837), [util/settings/settings.go:2499-2519](https://github.com/argoproj/argo-cd/blob/main/util/settings/settings.go#L2499-L2519)

> [!WARNING]
> When `CertificateIsExternal` is true, `saveSignatureAndCertificate()` explicitly deletes `tls.crt` and `tls.key` from the internal `argocd-secret` to prevent split-brain certificate states between external mounts and internal storage.
Sources: [util/settings/settings.go:1865-1880](https://github.com/argoproj/argo-cd/blob/main/util/settings/settings.go#L1865-L1880)

## Resource Overrides and Feature Gates

### Overview

Argo CD provides fine-grained control over how Kubernetes application resources are compared, tracked, and modified during reconciliation through customizable diff options, resource overrides, and client-go feature gate evaluations. The `SettingsManager` inspects the `argocd-cm` ConfigMap to assemble diff preferences and resource customization mappings.

Sources: [util/settings/settings.go:1000-1092](https://github.com/argoproj/argo-cd/blob/main/util/settings/settings.go#L1000-L1092)

### Application Diffing and Status Overrides

Resource comparison behavior is governed by `ArgoCDDiffOptions`, which controls whether aggregated roles are ignored, whether resource status fields are excluded from comparison, and whether ignore differences are applied during resource updates.

| Diff Option Key | Default Value | Purpose |
| :--- | :--- | :--- |
| `IgnoreAggregatedRoles` | `false` | Ignores differences in aggregated cluster roles. |
| `IgnoreResourceStatusField` | `crd`, `all`, `none` | Controls status field omission (defaults to `all`). |
| `IgnoreDifferencesOnResourceUpdates` | `true` | Applies ignore differences rules during application refresh on resource updates. |

Sources: [util/settings/settings.go:638-646](https://github.com/argoproj/argo-cd/blob/main/util/settings/settings.go#L638-L646), [util/settings/settings.go:1224-1226](https://github.com/argoproj/argo-cd/blob/main/util/settings/settings.go#L1224-L1226)

When loading resource overrides via `GetResourceOverrides()`, status fields are automatically appended to resource group-kinds based on the configured `IgnoreResourceStatusField` setting:

1. **All / Empty (`all`, `""`)**: Adds a status ignore override to `*/*`.
2. **CRD (`crd`)**: Adds a status ignore override to `apiextensions.k8s.io/CustomResourceDefinition`.
3. **None / Off (`none`, `false`)**: Bypasses status overriding.
4. **Unrecognized**: Defaults to applying status overrides to `*/*` and logs a warning.

Sources: [util/settings/settings.go:1074-1090](https://github.com/argoproj/argo-cd/blob/main/util/settings/settings.go#L1074-L1090)

> [!WARNING]
> YAML configuration values such as `off` or `false` for `ignoreResourceStatusField` are converted to mean `none`, preventing hard-to-catch misconfigurations when parsing boolean-like strings in the ConfigMap.
Sources: [util/settings/settings.go:1080-1084](https://github.com/argoproj/argo-cd/blob/main/util/settings/settings.go#L1080-L1084)

### Feature Gate Evaluation

Argo CD initializes client-go feature gates upon package startup via `init()` calling `ConfigureGoClientFeatures()`. The `myFeatureGates` wrapper explicitly forces specific experimental client-go feature flags to be disabled across services.

```go
type myFeatureGates struct {
	parent clientgofeatures.Gates
}

func (m myFeatureGates) Enabled(f clientgofeatures.Feature) bool {
	if f == clientgofeatures.WatchListClient ||
		f == clientgofeatures.InOrderInformers {
		return false
	}
	return m.parent.Enabled(f)
}
```

Sources: [util/settings/settings.go:2439-2453](https://github.com/argoproj/argo-cd/blob/main/util/settings/settings.go#L2439-L2453)

> [!NOTE]
> `ConfigureGoClientFeatures` intercepts `clientgofeatures.WatchListClient` and `clientgofeatures.InOrderInformers`, overriding upstream defaults to return `false` until proper support is finalized.
Sources: [util/settings/settings.go:2447-2465](https://github.com/argoproj/argo-cd/blob/main/util/settings/settings.go#L2447-L2465)

## Related

- [[Kubernetes Manifests]]

