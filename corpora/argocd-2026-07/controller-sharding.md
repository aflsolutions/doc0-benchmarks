# Controller Sharding

<details>
<summary>Relevant source files</summary>

The following files were used as context for generating this wiki page:

- [cmd/argocd-application-controller/commands/argocd_application_controller.go](https://github.com/argoproj/argo-cd/blob/main/cmd/argocd-application-controller/commands/argocd_application_controller.go)
- [controller/appcontroller.go](https://github.com/argoproj/argo-cd/blob/main/controller/appcontroller.go)
- [docs/proposals/rebalancing-clusters-across-shards-dynamically.md](https://github.com/argoproj/argo-cd/blob/main/docs/proposals/rebalancing-clusters-across-shards-dynamically.md)
- [controller/sharding/sharding.go](https://github.com/argoproj/argo-cd/blob/main/controller/sharding/sharding.go)
- [manifests/ha/namespace-install-with-hydrator.yaml](https://github.com/argoproj/argo-cd/blob/main/manifests/ha/namespace-install-with-hydrator.yaml)
</details>

## Overview

Controller sharding in Argo CD distributes the reconciliation load of managing applications and target clusters across multiple replicas of the application controller [[cmd/argocd-application-controller/commands/argocd_application_controller.go:183](https://github.com/argoproj/argo-cd/blob/main/cmd/argocd-application-controller/commands/argocd_application_controller.go#L183-L183), [docs/proposals/rebalancing-clusters-across-shards-dynamically.md:20](https://github.com/argoproj/argo-cd/blob/main/docs/proposals/rebalancing-clusters-across-shards-dynamically.md#L20-L20)]. By dividing the cluster workload among available controller instances, sharding prevents bottlenecks, enhances horizontal scalability, and ensures resilient resource monitoring [[docs/proposals/rebalancing-clusters-across-shards-dynamically.md:46](https://github.com/argoproj/argo-cd/blob/main/docs/proposals/rebalancing-clusters-across-shards-dynamically.md#L46-L46)]. Sharded controller replicas independently filter destinations and evaluate application states using configurable distribution algorithms and dynamic rebalancing mechanisms [[controller/sharding/sharding.go:66](https://github.com/argoproj/argo-cd/blob/main/controller/sharding/sharding.go#L66-L81), [controller/sharding/sharding.go:88](https://github.com/argoproj/argo-cd/blob/main/controller/sharding/sharding.go#L88-L97), [docs/proposals/rebalancing-clusters-across-shards-dynamically.md:20](https://github.com/argoproj/argo-cd/blob/main/docs/proposals/rebalancing-clusters-across-shards-dynamically.md#L20-L20)].

Sources: [cmd/argocd-application-controller/commands/argocd_application_controller.go:183](https://github.com/argoproj/argo-cd/blob/main/cmd/argocd-application-controller/commands/argocd_application_controller.go#L183-L183), [docs/proposals/rebalancing-clusters-across-shards-dynamically.md:20](https://github.com/argoproj/argo-cd/blob/main/docs/proposals/rebalancing-clusters-across-shards-dynamically.md#L20-L20), [docs/proposals/rebalancing-clusters-across-shards-dynamically.md:46](https://github.com/argoproj/argo-cd/blob/main/docs/proposals/rebalancing-clusters-across-shards-dynamically.md#L46-L46), [controller/sharding/sharding.go:66-81](https://github.com/argoproj/argo-cd/blob/main/controller/sharding/sharding.go#L66-L81), [controller/sharding/sharding.go:88-97](https://github.com/argoproj/argo-cd/blob/main/controller/sharding/sharding.go#L88-L97)

## Controller Initialization and Shard Setup

### Controller Initialization and Shard Setup

During startup, the application controller initializes its sharding environment, inspects replica counts, and establishes its unique shard index before instantiating the cluster sharding cache. The entry point command constructs the Kubernetes and application clients, parses configuration flags, and invokes `sharding.GetClusterSharding` to resolve the current instance's shard assignment.

Sources: [cmd/argocd-application-controller/commands/argocd_application_controller.go:138-184](https://github.com/argoproj/argo-cd/blob/main/cmd/argocd-application-controller/commands/argocd_application_controller.go#L138-L184)

The shard resolution flow follows an explicit call chain depending on whether dynamic cluster distribution is enabled. When `enableDynamicClusterDistribution` is active, the controller inspects the deployment replica count and coordinates via config maps before defaulting to static environment variables or hostname inference:

`GetClusterSharding()` → checks `enableDynamicClusterDistribution` → `kubeClient.AppsV1().Deployments().Get()` (if dynamic) or `env.ParseNumFromEnv(common.EnvControllerReplicas)` → `GetOrUpdateShardFromConfigMap()` or `InferShard()` → `NewClusterSharding()`

Sources: [controller/sharding/sharding.go:460-514](https://github.com/argoproj/argo-cd/blob/main/controller/sharding/sharding.go#L460-L514)

> [!NOTE]
> If `replicasCount` is set to `1` or less, sharding is bypassed entirely, logging a notice that all cluster shards are processed and forcing the shard number to `0`.
> Sources: [controller/sharding/sharding.go:508-511](https://github.com/argoproj/argo-cd/blob/main/controller/sharding/sharding.go#L508-L511)

### Sharding Environment Variables and Configuration Flags

The initialization routine relies on specific environment variables and command-line flags to configure controller sharding parameters, algorithms, and replica topologies.

| Parameter / Flag | Environment Variable | Default Value | Purpose |
| :--- | :--- | :--- | :--- |
| `shardingAlgorithm` | `ARGOCD_CONTROLLER_SHARDING_ALGORITHM` | `legacy` | Sets the distribution method (`legacy`, `round-robin`, `consistent-hashing`) |
| `enableDynamicClusterDistribution` | `ARGOCD_ENABLE_DYNAMIC_CLUSTER_DISTRIBUTION` | `false` | Enables dynamic cluster distribution across controller replicas |
| `shardNumber` | `ARGOCD_CONTROLLER_SHARD` | `-1` | Explicit shard index assigned to the current controller instance |
| `replicasCount` | `ARGOCD_CONTROLLER_REPLICAS` | `0` | Total number of active controller replicas in the cluster |

Sources: [cmd/argocd-application-controller/commands/argocd_application_controller.go:296-306](https://github.com/argoproj/argo-cd/blob/main/cmd/argocd-application-controller/commands/argocd_application_controller.go#L296-L306), [controller/sharding/sharding.go:41-43](https://github.com/argoproj/argo-cd/blob/main/controller/sharding/sharding.go#L41-L43), [controller/sharding/sharding.go:461-477](https://github.com/argoproj/argo-cd/blob/main/controller/sharding/sharding.go#L461-L477)

## Sharding Algorithms and Distribution Strategies

### Overview

Argo CD assigns managed clusters to specific application controller replicas using configurable distribution strategies. The `GetDistributionFunction` function acts as the central factory, selecting the active sharding algorithm based on runtime configuration and returning a `DistributionFunction` closure that maps a given cluster to a target shard index.

Sources: [controller/sharding/sharding.go:83-99](https://github.com/argoproj/argo-cd/blob/main/controller/sharding/sharding.go#L83-L99)

### Supported Sharding Algorithms

The controller supports three main algorithms alongside compatibility fallbacks, each implementing distinct trade-offs between distribution homogeneity and stability during topology changes.

| Algorithm Constant | Strategy Name | Characteristics & Trade-offs |
| :--- | :--- | :--- |
| `common.LegacyShardingAlgorithm` (`legacy`) | Legacy FNV Hash | Lightweight, stable distribution based on FNV-32a hashing of the cluster ID; lacks homogeneity as certain shards may receive more clusters than others. |
| `common.RoundRobinShardingAlgorithm` (`round-robin`) | Round-Robin | Homogeneous distribution (`clusters +/- 1`) by sorting clusters by UID and applying modulo over replicas; drawback is severe reshuffling of clusters across shards when the cluster list changes. |
| `common.ConsistentHashingWithBoundedLoadsAlgorithm` (`consistent-hashing`) | Consistent Hashing with Bounded Loads | Almost homogeneous distribution (`+/- 10%`) resilient to sharding and cluster set changes, factoring in actual application load per cluster destination. |

Sources: [common/constants.go:34-37](https://github.com/argoproj/argo-cd/blob/main/common/constants.go#L34-L37), [controller/sharding/sharding.go:88-97](https://github.com/argoproj/argo-cd/blob/main/controller/sharding/sharding.go#L88-L97), [controller/sharding/sharding.go:101-170](https://github.com/argoproj/argo-cd/blob/main/controller/sharding/sharding.go#L101-L170)

### Consistent Hashing with Bounded Loads Execution

When using consistent hashing with bounded loads, the controller executes a deterministic calculation pipeline to distribute clusters while respecting existing application loads across controller shards.

The distribution mechanism follows an explicit call chain during evaluation:

`ConsistentHashingWithBoundedLoadsDistributionFunction()` → `createConsistentHashingWithBoundLoads()` → `getSortedClustersList()` → `getAppDistribution()` → `consistent.New()` → `consistentHashing.Add()` → `consistentHashing.GetLeast()` → `consistentHashing.UpdateLoad()`

Sources: [controller/sharding/sharding.go:171-239](https://github.com/argoproj/argo-cd/blob/main/controller/sharding/sharding.go#L171-L239)

> [!NOTE]
> If a cluster's shard is manually overridden via `c.Shard` and the requested value is less than the active replica count, the distribution function bypasses the hashing algorithm and honors the manual assignment directly.
> Sources: [controller/sharding/sharding.go:118-120](https://github.com/argoproj/argo-cd/blob/main/controller/sharding/sharding.go#L118-L120), [controller/sharding/sharding.go:149-151](https://github.com/argoproj/argo-cd/blob/main/controller/sharding/sharding.go#L149-L151), [controller/sharding/sharding.go:180-182](https://github.com/argoproj/argo-cd/blob/main/controller/sharding/sharding.go#L180-L182)

> [!WARNING]
> If `strconv.Atoi` fails while parsing the shard index returned by the consistent hashing ring, the error is logged but execution continues; because it returns `0` on failure, the cluster falls back to shard `0` rather than being dropped entirely.
> Sources: [controller/sharding/sharding.go:224-229](https://github.com/argoproj/argo-cd/blob/main/controller/sharding/sharding.go#L224-L229)

## Shard-Aware Cluster and Application Filtering

### Overview

The application controller uses shard-aware filtering to determine whether incoming cluster destinations and application resources belong to the running replica's assigned shard. The `GetClusterFilter` function generates a `ClusterFilterFunction` that evaluates a cluster against the active shard index. Concurrently, the controller executes `canProcessApp` to gate application reconciliation, event handling, and metrics collection based on namespace restrictions, skip annotations, and cluster sharding membership.

Sources: [controller/appcontroller.go:2706-2737](https://github.com/argoproj/argo-cd/blob/main/controller/appcontroller.go#L2706-L2737), [controller/sharding/sharding.go:62-81](https://github.com/argoproj/argo-cd/blob/main/controller/sharding/sharding.go#L62-L81)

### Cluster Filtering Logic

`GetClusterFilter` inspects whether a cluster has an explicit manual shard assignment via `c.Shard`. If a requested shard is set and falls below the total replica count, that shard is returned; otherwise, it falls back to evaluating the configured distribution function. The resulting integer shard is compared against the running controller replica's shard identifier.

```go
func GetClusterFilter(_ db.ArgoDB, distributionFunction DistributionFunction, replicas, shard int) ClusterFilterFunction {
	return func(c *v1alpha1.Cluster) bool {
		clusterShard := 0
		if c != nil && c.Shard != nil {
			requestedShard := int(*c.Shard)
			if requestedShard < replicas {
				clusterShard = requestedShard
			} else {
				log.Warnf("Specified cluster shard (%d) for cluster: %s is greater than the number of available shard. Assigning automatically.", requestedShard, c.Name)
			}
		} else {
			clusterShard = distributionFunction(c)
		}
		return clusterShard == shard
	}
}
```

Sources: [controller/sharding/sharding.go:62-81](https://github.com/argoproj/argo-cd/blob/main/controller/sharding/sharding.go#L62-L81)

### Application Processing Eligibility

The `canProcessApp` method enforces whether an application object can be handled by the current controller replica. It validates namespace permissions, checks skip annotations, and verifies cluster sharding status through a multi-step evaluation sequence.

`canProcessApp()` execution call chain:
`canProcessApp()` → `isAppNamespaceAllowed()` → `Application.GetAnnotations()` → `argo.GetDestinationCluster()` → `clusterSharding.IsManagedCluster()`

Sources: [controller/appcontroller.go:2706-2737](https://github.com/argoproj/argo-cd/blob/main/controller/appcontroller.go#L2706-L2737)

> [!NOTE]
> If an application's destination cluster cannot be resolved from the database, `canProcessApp` falls back to querying `ctrl.clusterSharding.IsManagedCluster(nil)` to decide whether unmanaged or in-cluster destinations are permitted.
> Sources: [controller/appcontroller.go:2732-2736](https://github.com/argoproj/argo-cd/blob/main/controller/appcontroller.go#L2732-L2736)

> [!WARNING]
> Applications marked with the `argocd.argoproj.io/skip-reconcile` annotation (`common.AnnotationKeyAppSkipReconcile`) explicitly bypass reconciliation checks and cause `canProcessApp` to return false.
> Sources: [controller/appcontroller.go:2718-2725](https://github.com/argoproj/argo-cd/blob/main/controller/appcontroller.go#L2718-L2725)

## Dynamic Cluster Rebalancing Architecture

### Overview

The dynamic cluster rebalancing architecture removes the requirement to deploy application controllers as a Kubernetes StatefulSet, enabling stateless horizontal scaling via standard Deployments. Rather than relying on predictable pod ordinals (e.g., `argocd-application-controller-0`), replicas dynamically claim shard assignments through a shared ConfigMap using a heartbeat mechanism.

Sources: [docs/proposals/rebalancing-clusters-across-shards-dynamically.md:29-38](https://github.com/argoproj/argo-cd/blob/main/docs/proposals/rebalancing-clusters-across-shards-dynamically.md#L29-L38), [controller/sharding/sharding.go:56-60](https://github.com/argoproj/argo-cd/blob/main/controller/sharding/sharding.go#L56-L60)

### ConfigMap Shard Mapping Mechanisms

Controller replicas discover and coordinate their assigned shards through the `argocd-application-controller-shard` ConfigMap. Every application controller periodically updates its heartbeat entry stored under the `shardControllerMapping` key. The mapping structure tracks each shard number, the hosting controller hostname, and the last successful synchronization timestamp.

```go
type shardApplicationControllerMapping struct {
	ShardNumber    int
	ControllerName string
	HeartbeatTime  metav1.Time
}
```

Sources: [docs/proposals/rebalancing-clusters-across-shards-dynamically.md:69-74](https://github.com/argoproj/argo-cd/blob/main/docs/proposals/rebalancing-clusters-across-shards-dynamically.md#L69-L74), [controller/sharding/sharding.go:45-60](https://github.com/argoproj/argo-cd/blob/main/controller/sharding/sharding.go#L45-L60)

The heartbeat parameters and timeouts are governed by environment variables defined during controller initialization:

| Environment Variable | Default Value | Minimum | Maximum | Description |
| :--- | :--- | :--- | :--- | :--- |
| `ARGOCD_CONTROLLER_HEARTBEAT_TIME` | `10` seconds | `10` | `60` | Duration between controller heartbeat updates. |
| `ARGOCD_CONTROLLER_HEARTBEAT_TIMEOUT` | `3 * HeartbeatDuration` | — | — | Threshold after which a silent controller is marked unhealthy. |

Sources: [controller/sharding/sharding.go:41-43](https://github.com/argoproj/argo-cd/blob/main/controller/sharding/sharding.go#L41-L43)

### Shard Resolution and Claiming Walkthrough

When dynamic cluster distribution is enabled, the controller resolves its active shard through a robust retrieval and retry sequence. 

Call-chain execution for shard acquisition:
`GetClusterSharding()` → `GetOrUpdateShardFromConfigMap()` → `Get()` / `Create()` / `Update()` → `getOrUpdateShardNumberForController()`

During this routine, `getOrUpdateShardNumberForController()` executes the following branch logic:
1. If the ConfigMap entry count is less than the number of deployment replicas, additional empty shard mappings are appended.
2. If the entry count exceeds the replica count, the mapping slice is regenerated entirely using `getDefaultShardMappingData()`.
3. If an explicit shard is configured and valid, it updates the corresponding entry's controller name and heartbeat timestamp.
4. If no shard is pre-allocated, it scans for an unassigned entry (`ControllerName == ""`) or an entry whose `HeartbeatTime` has exceeded `HeartbeatTimeout`.

```go
	if shard == -1 {
		for i := range shardMappingData {
			shardMapping := shardMappingData[i]
			if (shardMapping.ControllerName == "") || (metav1.Now().After(shardMapping.HeartbeatTime.Add(time.Duration(HeartbeatTimeout) * time.Second))) {
				shard = int(shardMapping.ShardNumber)
				log.Debugf("Empty shard found %d", shard)
				shardMapping.ControllerName = hostname
				shardMapping.HeartbeatTime = heartbeatCurrentTime()
				shardMappingData[i] = shardMapping
				break
			}
		}
	}
```

Sources: [controller/sharding/sharding.go:404-416](https://github.com/argoproj/argo-cd/blob/main/controller/sharding/sharding.go#L404-L416)

> [!NOTE]
> If a Kubernetes API conflict occurs while updating the sharding ConfigMap, `GetClusterSharding` automatically retries up to `common.AppControllerHeartbeatUpdateRetryCount` times before waiting for the next heartbeat iteration.
> Sources: [controller/sharding/sharding.go:485-495](https://github.com/argoproj/argo-cd/blob/main/controller/sharding/sharding.go#L485-L495)

> [!WARNING]
> If the application controller deployment or its replica count cannot be fetched when `enableDynamicClusterDistribution` is true, the initialization function immediately returns an error and aborts startup.
> Sources: [controller/sharding/sharding.go:463-473](https://github.com/argoproj/argo-cd/blob/main/controller/sharding/sharding.go#L463-L473)

## HA Manifests and Deployment Topology

### HA Manifests and Deployment Topology

Argo CD High Availability (HA) installations deploy core components with dedicated service accounts, role-based access control rules, and customized resource configurations. The namespace install manifests declare distinct service accounts for components including `argocd-application-controller`, `argocd-applicationset-controller`, `argocd-commit-server`, `argocd-dex-server`, `argocd-notifications-controller`, `argocd-redis-ha`, `argocd-redis-ha-haproxy`, `argocd-repo-server`, and `argocd-server`.

Sources: [manifests/ha/namespace-install-with-hydrator.yaml:3-84](https://github.com/argoproj/argo-cd/blob/main/manifests/ha/namespace-install-with-hydrator.yaml#L3-L84)

Each controller and server component binds to scoped permissions restricting access to specific API groups and resources. For example, the `argocd-application-controller` role manages core secrets, configmaps, applications, applicationsets, appprojects, events, and deployments.

Sources: [manifests/ha/namespace-install-with-hydrator.yaml:85-132](https://github.com/argoproj/argo-cd/blob/main/manifests/ha/namespace-install-with-hydrator.yaml#L85-L132)

| Component Name | Service Account | Role Binding | Key Resources Managed |
| :--- | :--- | :--- | :--- |
| Application Controller | `argocd-application-controller` | `argocd-application-controller` | Secrets, ConfigMaps, Applications, AppProjects, Deployments |
| ApplicationSet Controller | `argocd-applicationset-controller` | `argocd-applicationset-controller` | Applicationsets, Applications, Leases |
| Notifications Controller | `argocd-notifications-controller` | `argocd-notifications-controller` | Applications, AppProjects, ConfigMaps, Secrets |
| Redis HA Proxy | `argocd-redis-ha-haproxy` | `argocd-redis-ha-haproxy` | Secrets, Endpoints |

Sources: [manifests/ha/namespace-install-with-hydrator.yaml:3-46](https://github.com/argoproj/argo-cd/blob/main/manifests/ha/namespace-install-with-hydrator.yaml#L3-L46), [manifests/ha/namespace-install-with-hydrator.yaml:363-425](https://github.com/argoproj/argo-cd/blob/main/manifests/ha/namespace-install-with-hydrator.yaml#L363-L425)

The topology configuration defines resource exclusions and update customizations via the `argocd-cm` ConfigMap. These rules prevent unnecessary reconciliation loops by ignoring volatile fields across various Kubernetes API kinds.

Sources: [manifests/ha/namespace-install-with-hydrator.yaml:474-571](https://github.com/argoproj/argo-cd/blob/main/manifests/ha/namespace-install-with-hydrator.yaml#L474-L571)

> [!WARNING]
> Internal Kubernetes control plane resources such as Endpoints, EndpointSlice, Lease, SelfSubjectReview, and TokenReview are explicitly excluded from resource watches to reduce event noise and UI clutter.
> Sources: [manifests/ha/namespace-install-with-hydrator.yaml:516-540](https://github.com/argoproj/argo-cd/blob/main/manifests/ha/namespace-install-with-hydrator.yaml#L516-L540)

## Related

- [[Application Controller]]
- [[High Availability Deployment]]

