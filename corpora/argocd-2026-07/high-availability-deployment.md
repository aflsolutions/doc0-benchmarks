# High Availability Deployment

<details>
<summary>Relevant source files</summary>

The following files were used as context for generating this wiki page:

- [manifests/ha/namespace-install-with-hydrator.yaml](https://github.com/argoproj/argo-cd/blob/main/manifests/ha/namespace-install-with-hydrator.yaml)
- [manifests/ha/namespace-install.yaml](https://github.com/argoproj/argo-cd/blob/main/manifests/ha/namespace-install.yaml)
</details>

## Overview

High availability deployment architectures for Argo CD provide robust fault tolerance and horizontal scalability by structuring core services across redundant replicas, stateful configurations, and network isolation policies. These deployment templates handle critical infrastructure requirements such as automatic failover management for high-availability Redis components, multi-replica API and repository servers, and dedicated controller scaling. By establishing clear manifest architectures and automated generation lifecycles, high-availability deployments eliminate single points of failure across enterprise Kubernetes environments.

Sources: [manifests/ha/namespace-install-with-hydrator.yaml:1-4634](https://github.com/argoproj/argo-cd/blob/main/manifests/ha/namespace-install-with-hydrator.yaml#L1-L4634), [manifests/ha/namespace-install.yaml:1-532](https://github.com/argoproj/argo-cd/blob/main/manifests/ha/namespace-install.yaml#L1-L532)

## HA Manifest Architecture Overview

### HA Manifest Architecture Overview

High-availability manifest variants in Argo CD are provided in distinct installation formats that dictate how controllers, API servers, and state backends are deployed. The standard namespace high-availability configuration (`manifests/ha/namespace-install.yaml`) structures components with multi-replica deployments and anti-affinity rules, whereas the hydrator-enabled variant (`manifests/ha/namespace-install-with-hydrator.yaml`) introduces dedicated runtime environment variables and command-line parameters to support manifest hydration workflows. Specifically, both deployment manifests configure core controllers with dedicated service accounts, role-based access control (RBAC) rules, and network policies enforcing ingress and egress isolation.

Sources: [manifests/ha/namespace-install.yaml:1-532](https://github.com/argoproj/argo-cd/blob/main/manifests/ha/namespace-install.yaml#L1-L532), [manifests/ha/namespace-install-with-hydrator.yaml:1-4634](https://github.com/argoproj/argo-cd/blob/main/manifests/ha/namespace-install-with-hydrator.yaml#L1-L4634)

Structural differences between the manifests center on parameter injection for the hydrator subsystem. In the hydrator-enabled manifest variant, container specifications for components such as the application controller and server include environment variable mappings derived from configuration maps, notably injecting `ARGOCD_HYDRATOR_ENABLED` and associated hydration processor limits. 

Sources: [manifests/ha/namespace-install-with-hydrator.yaml:3712-3717](https://github.com/argoproj/argo-cd/blob/main/manifests/ha/namespace-install-with-hydrator.yaml#L3712-L3717), [manifests/ha/namespace-install-with-hydrator.yaml:4000-4005](https://github.com/argoproj/argo-cd/blob/main/manifests/ha/namespace-install-with-hydrator.yaml#L4000-L4005)

The structural hierarchy across both high-availability architectures relies on several core resource types that define the operational topology:

| Resource Type | Component Target | Structural Role & High-Availability Purpose |
| :--- | :--- | :--- |
| `StatefulSet` | `argocd-application-controller` | Runs single-replica or sharded stateful reconciliation loops with anti-affinity rules. |
| `StatefulSet` | `argocd-redis-ha-server` | Manages 3 Redis replication nodes with sentinel monitoring and automated failover scripts. |
| `Deployment` | `argocd-repo-server` | Provides 2 horizontally scaled replicas for manifest generation and repository operations. |
| `Deployment` | `argocd-server` | Scales 2 API server replicas behind load balancers with TLS and session affinity. |
| `NetworkPolicy` | All Components | Enforces strict ingress and egress boundaries between controllers, servers, and proxies. |

Sources: [manifests/ha/namespace-install-with-hydrator.yaml:1775-1783](https://github.com/argoproj/argo-cd/blob/main/manifests/ha/namespace-install-with-hydrator.yaml#L1775-L1783), [manifests/ha/namespace-install-with-hydrator.yaml:2644-2653](https://github.com/argoproj/argo-cd/blob/main/manifests/ha/namespace-install-with-hydrator.yaml#L2644-L2653), [manifests/ha/namespace-install-with-hydrator.yaml:3082-3092](https://github.com/argoproj/argo-cd/blob/main/manifests/ha/namespace-install-with-hydrator.yaml#L3082-L3092), [manifests/ha/namespace-install-with-hydrator.yaml:4096-4106](https://github.com/argoproj/argo-cd/blob/main/manifests/ha/namespace-install-with-hydrator.yaml#L4096-L4106), [manifests/ha/namespace-install-with-hydrator.yaml:4375-4443](https://github.com/argoproj/argo-cd/blob/main/manifests/ha/namespace-install-with-hydrator.yaml#L4375-L4443)

## Standard Namespace HA Deployment

### Standard Namespace HA Deployment

### Overview

The standard namespace-scoped high-availability installation (`manifests/ha/namespace-install.yaml`) establishes an isolated operational topology within a single Kubernetes namespace by deploying dedicated service accounts, role-based access control rules, and resource exclusion policies. The deployment defines service accounts for core components such as `argocd-application-controller`, `argocd-applicationset-controller`, `argocd-dex-server`, `argocd-notifications-controller`, `argocd-redis-ha`, `argocd-redis-ha-haproxy`, `argocd-repo-server`, and `argocd-server`. Each service account is bound via `RoleBinding` to a corresponding `Role` that grants minimal required API verbs against core and `argoproj.io` resource groups.

Sources: [manifests/ha/namespace-install.yaml:1-464](https://github.com/argoproj/argo-cd/blob/main/manifests/ha/namespace-install.yaml#L1-L464)

### Component RBAC Privileges

The namespace installation configures specific access rights for each component to enforce least-privilege security across controllers and servers. The table below details the role bindings, target service accounts, and resource permissions defined in the standard HA manifest.

| Component Name | Target Service Account | Resource Groups & Types | Permitted Verbs |
| :--- | :--- | :--- | :--- |
| `argocd-application-controller` | `argocd-application-controller` | `""` (secrets, configmaps), `argoproj.io` (applications, applicationsets, appprojects), `""` (events), `apps` (deployments) | `create`, `get`, `list`, `watch`, `update`, `patch`, `delete` |
| `argocd-applicationset-controller` | `argocd-applicationset-controller` | `argoproj.io` (applications, applicationsets, applicationsets/finalizers, appprojects, applicationsets/status), `""` (events, secrets, configmaps), `coordination.k8s.io` (leases) | `create`, `delete`, `get`, `list`, `patch`, `update`, `watch` |
| `argocd-dex-server` | `argocd-dex-server` | `""` (secrets, configmaps) | `get`, `list`, `watch` |
| `argocd-notifications-controller` | `argocd-notifications-controller` | `argoproj.io` (applications, appprojects), `""` (configmaps, secrets) | `get`, `list`, `watch`, `update`, `patch` |
| `argocd-redis-ha` | `argocd-redis-ha` | `""` (endpoints) | `get` |
| `argocd-redis-ha-haproxy` | `argocd-redis-ha-haproxy` | `""` (secrets, endpoints) | `create`, `get` |
| `argocd-server` | `argocd-server` | `""` (secrets, configmaps, events), `argoproj.io` (applications, appprojects, applicationsets) | `create`, `get`, `list`, `watch`, `update`, `patch`, `delete` |

Sources: [manifests/ha/namespace-install.yaml:76-352](https://github.com/argoproj/argo-cd/blob/main/manifests/ha/namespace-install.yaml#L76-L352)

> [!NOTE]
> The `argocd-applicationset-controller` role restricts lease acquisition to its specific leader election resource name `58ac56fa.applicationsets.argoproj.io` under the `coordination.k8s.io` API group to prevent leader collision in shared namespaces.
> 
> Sources: [manifests/ha/namespace-install.yaml:183-197](https://github.com/argoproj/argo-cd/blob/main/manifests/ha/namespace-install.yaml#L183-L197)

### Resource Customization and Exclusions

The standard namespace deployment configures global resource customizations and exclusion rules in ConfigMaps to minimize watch event overhead and reduce UI clutter. Ignored resource updates are defined for custom and standard types using JSON pointers and jq path expressions.

```yaml
resource.customizations.ignoreResourceUpdates.ConfigMap: |
  jqPathExpressions:
    - '.metadata.annotations."cluster-autoscaler.kubernetes.io/last-updated"'
    - '.metadata.annotations."control-plane.alpha.kubernetes.io/leader"'
resource.customizations.ignoreResourceUpdates.Endpoints: |
  jsonPointers:
    - /metadata
    - /subsets
resource.customizations.ignoreResourceUpdates.all: |
  jsonPointers:
    - /status
```

Sources: [manifests/ha/namespace-install.yaml:465-479](https://github.com/argoproj/argo-cd/blob/main/manifests/ha/namespace-install.yaml#L465-L479)

Furthermore, the manifest explicitly excludes control plane network resources, internal leases, and authentication review types from controller reconciliation tracking.

```yaml
resource.exclusions: |
  - apiGroups:
    - ''
    - discovery.k8s.io
    kinds:
    - Endpoints
    - EndpointSlice
  - apiGroups:
    - coordination.k8s.io
    kinds:
    - Lease
  - apiGroups:
    - authentication.k8s.io
    - authorization.k8s.io
    kinds:
    - SelfSubjectReview
    - TokenReview
    - LocalSubjectAccessReview
    - SelfSubjectAccessReview
    - SelfSubjectRulesReview
    - SubjectAccessReview
```

Sources: [manifests/ha/namespace-install.yaml:507-531](https://github.com/argoproj/argo-cd/blob/main/manifests/ha/namespace-install.yaml#L507-L531)

## Hydrator Integration in HA Setup

### Hydrator Integration in HA Setup

### Overview

Manifest hydration in high-availability namespace installations introduces configuration parameters that enable the hydration feature across primary control plane components. The installation manifests explicitly configure environment variables and resource customization rules to support hydrated application states.

Sources: [manifests/ha/namespace-install-with-hydrator.yaml:494-500](https://github.com/argoproj/argo-cd/blob/main/manifests/ha/namespace-install-with-hydrator.yaml#L494-L500)

### Hydrator Environment Configuration

The high-availability deployment specifications enable hydration by injecting the `ARGOCD_HYDRATOR_ENABLED` environment variable from the `argocd-cmd-params-cm` ConfigMap into both the application controller and the API server deployments.

```yaml
- name: ARGOCD_HYDRATOR_ENABLED
  valueFrom:
    configMapKeyRef:
      key: hydrator.enabled
      name: argocd-cmd-params-cm
      optional: true
```

Sources: [manifests/ha/namespace-install-with-hydrator.yaml:3503-3508](https://github.com/argoproj/argo-cd/blob/main/manifests/ha/namespace-install-with-hydrator.yaml#L3503-L3508)

Additionally, the application controller deployment configures operation and hydration processors using dedicated environment parameters sourced from the parameters ConfigMap.

```yaml
- name: ARGOCD_APPLICATION_CONTROLLER_OPERATION_PROCESSORS
  valueFrom:
    configMapKeyRef:
      key: controller.operation.processors
      name: argocd-cmd-params-cm
      optional: true
- name: ARGOCD_APPLICATION_CONTROLLER_HYDRATION_PROCESSORS
  valueFrom:
    configMapKeyRef:
      key: controller.hydration.processors
      name: argocd-cmd-params-cm
      optional: true
```

Sources: [manifests/ha/namespace-install-with-hydrator.yaml:3706-3717](https://github.com/argoproj/argo-cd/blob/main/manifests/ha/namespace-install-with-hydrator.yaml#L3706-L3717)

### Custom Resource Update Exclusions for Hydration

To prevent infinite reconciliation loops caused by hydration timestamp updates, the deployment defines custom ignore rules for `argoproj.io_Application` resources within the core configuration map. These rules use `jqPathExpressions` to exclude specific metadata annotations.

| JQ Path Expression | Purpose |
| :--- | :--- |
| `'.metadata.annotations."notified.notifications.argoproj.io"'` | Ignores notification dispatch tracking updates |
| `'.metadata.annotations."argocd.argoproj.io/refresh"'` | Ignores manual application refresh flags |
| `'.metadata.annotations."argocd.argoproj.io/refresh-timestamp"'` | Ignores application refresh timestamps |
| `'.metadata.annotations."argocd.argoproj.io/hydrate"'` | Ignores manifest hydration execution flags |
| `'.metadata.annotations."argocd.argoproj.io/hydrate-timestamp"'` | Ignores manifest hydration completion timestamps |
| `'.operation'` | Ignores active operation status blocks |

Sources: [manifests/ha/namespace-install-with-hydrator.yaml:494-501](https://github.com/argoproj/argo-cd/blob/main/manifests/ha/namespace-install-with-hydrator.yaml#L494-L501)

> [!NOTE]
> The `argocd.argoproj.io/hydrate` and `argocd.argoproj.io/hydrate-timestamp` annotations must be explicitly ignored in resource update customizations so that background hydration writes do not trigger recursive controller reconciliation cycles.
> 
> Sources: [manifests/ha/namespace-install-with-hydrator.yaml:494-500](https://github.com/argoproj/argo-cd/blob/main/manifests/ha/namespace-install-with-hydrator.yaml#L494-L500)

## Component Replication and Scalability

### Overview

Core high-availability application components in Argo CD are deployed with multi-replica configurations and anti-affinity rules to ensure fault tolerance and load distribution across cluster nodes and availability zones.

Sources: [manifests/ha/namespace-install.yaml:2522-2548](https://github.com/argoproj/argo-cd/blob/main/manifests/ha/namespace-install.yaml#L2522-L2548)

### Replica Allocations and Topology Rules

The high-availability manifests define specific replica counts and scheduling constraints for stateful servers, stateless API endpoints, proxy layers, and repository management components. 

| Component | Kind | Replica Count | Scheduling & Anti-Affinity Rules |
| :--- | :--- | :--- | :--- |
| `argocd-redis-ha-server` | StatefulSet | 3 | Required anti-affinity on `kubernetes.io/hostname` |
| `argocd-redis-ha-haproxy` | Deployment | 3 | Required anti-affinity on `kubernetes.io/hostname` |
| `argocd-repo-server` | Deployment | 2 | Preferred anti-affinity on `topology.kubernetes.io/zone` (weight 100); required on `kubernetes.io/hostname` |
| `argocd-server` | Deployment | 2 | Preferred anti-affinity on `topology.kubernetes.io/zone` (weight 100); required on `kubernetes.io/hostname` |
| `argocd-commit-server` | Deployment | Unspecified (default 1) | Preferred anti-affinity on `kubernetes.io/hostname` (weight 100) and `app.kubernetes.io/part-of: argocd` (weight 5) |

Sources: [manifests/ha/namespace-install.yaml:2126-2140](https://github.com/argoproj/argo-cd/blob/main/manifests/ha/namespace-install.yaml#L2126-L2140), [manifests/ha/namespace-install.yaml:2522-2547](https://github.com/argoproj/argo-cd/blob/main/manifests/ha/namespace-install.yaml#L2522-L2547), [manifests/ha/namespace-install.yaml:2652-2675](https://github.com/argoproj/argo-cd/blob/main/manifests/ha/namespace-install.yaml#L2652-L2675), [manifests/ha/namespace-install.yaml:3090-3113](https://github.com/argoproj/argo-cd/blob/main/manifests/ha/namespace-install.yaml#L3090-L3113), [manifests/ha/namespace-install.yaml:4104-4124](https://github.com/argoproj/argo-cd/blob/main/manifests/ha/namespace-install.yaml#L4104-L4124)

> [!WARNING]
> The `argocd-redis-ha-server` StatefulSet utilizes an `OrderedReady` pod management policy and requires an exact replica count of 3 to maintain quorum for Redis Sentinel elections.
> 
> Sources: [manifests/ha/namespace-install.yaml:4105-4106](https://github.com/argoproj/argo-cd/blob/main/manifests/ha/namespace-install.yaml#L4105-L4106)

## HA Manifest Generation Lifecycle

### Overview

High-availability manifests for Argo CD are automatically generated target configurations that enforce strict structural constraints across deployment artifacts. Direct modification of these generated files is prohibited by design to prevent drift from upstream template sources.

Sources: [manifests/ha/namespace-install-with-hydrator.yaml:1-1](https://github.com/argoproj/argo-cd/blob/main/manifests/ha/namespace-install-with-hydrator.yaml#L1-L1), [manifests/ha/namespace-install.yaml:1-1](https://github.com/argoproj/argo-cd/blob/main/manifests/ha/namespace-install.yaml#L1-L1)

### Automated Generation Constraints and File Headers

Every generated high-availability manifest file begins with an explicit warning header instructing operators against manual modifications. This mechanism protects automated pipeline outputs from being overwritten or corrupted during subsequent regeneration cycles.

```yaml
# This is an auto-generated file. DO NOT EDIT
```

Sources: [manifests/ha/namespace-install-with-hydrator.yaml:1-1](https://github.com/argoproj/argo-cd/blob/main/manifests/ha/namespace-install-with-hydrator.yaml#L1-L1), [manifests/ha/namespace-install.yaml:1-1](https://github.com/argoproj/argo-cd/blob/main/manifests/ha/namespace-install.yaml#L1-L1)

> [!WARNING]
> Manual edits applied directly to `namespace-install.yaml` or `namespace-install-with-hydrator.yaml` will be permanently lost during the next automated generation cycle. All configuration customizations must be managed via upstream source templates or Helm values.
> 
> Sources: [manifests/ha/namespace-install-with-hydrator.yaml:1-1](https://github.com/argoproj/argo-cd/blob/main/manifests/ha/namespace-install-with-hydrator.yaml#L1-L1), [manifests/ha/namespace-install.yaml:1-1](https://github.com/argoproj/argo-cd/blob/main/manifests/ha/namespace-install.yaml#L1-L1)

### Manifest Update and Generation Procedures

To update high-availability deployment manifests, maintainers execute automated generation tooling that compiles base configurations and component overlays into complete namespace installation bundles. 

| Manifest File | Target Variant | Generation Source / Tooling |
| :--- | :--- | :--- |
| `manifests/ha/namespace-install.yaml` | Standard HA namespace installation | Upstream kustomize generator pipelines |
| `manifests/ha/namespace-install-with-hydrator.yaml` | HA installation with manifest hydrator support | Upstream kustomize generator pipelines with hydration overlay |

Sources: [manifests/ha/namespace-install-with-hydrator.yaml:1-1](https://github.com/argoproj/argo-cd/blob/main/manifests/ha/namespace-install-with-hydrator.yaml#L1-L1), [manifests/ha/namespace-install.yaml:1-1](https://github.com/argoproj/argo-cd/blob/main/manifests/ha/namespace-install.yaml#L1-L1)

## Related

- [[Kubernetes Manifests]]
- [[Controller Sharding]]

