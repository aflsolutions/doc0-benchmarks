# Kubernetes Manifests

<details>
<summary>Relevant source files</summary>

The following files were used as context for generating this wiki page:

- [docs/operator-manual/installation.md](https://github.com/argoproj/argo-cd/blob/main/docs/operator-manual/installation.md)
- [manifests/namespace-install.yaml](https://github.com/argoproj/argo-cd/blob/main/manifests/namespace-install.yaml)
- [manifests/namespace-install-with-hydrator.yaml](https://github.com/argoproj/argo-cd/blob/main/manifests/namespace-install-with-hydrator.yaml)
</details>

## Overview

Deploying Argo CD onto Kubernetes requires organized manifests that define its core controllers, service accounts, network policies, and configuration parameters. Understanding these installation manifests and their variants enables administrators to configure secure, scalable GitOps environments tailored to specific cluster scopes and resource requirements.

Sources: [docs/operator-manual/installation.md:3-37](https://github.com/argoproj/argo-cd/blob/main/docs/operator-manual/installation.md#L3-L37), [manifests/namespace-install.yaml:1-67](https://github.com/argoproj/argo-cd/blob/main/manifests/namespace-install.yaml#L1-L67), [manifests/namespace-install-with-hydrator.yaml:1-30](https://github.com/argoproj/argo-cd/blob/main/manifests/namespace-install-with-hydrator.yaml#L1-L30)

## Installation Manifest Variants and Overview

### Overview

Argo CD provides official installation variants categorized primarily into multi-tenant and core deployment models. Multi-tenant installations are maintained by platform teams to service multiple developer teams, with end-users accessing the system via the API server using the Web UI or the `argocd` CLI. Conversely, the Argo CD core installation is designed for headless mode deployment, operating without an API server or UI, making it highly suitable for independent cluster administrators.

Sources: [docs/operator-manual/installation.md:3-8](https://github.com/argoproj/argo-cd/blob/main/docs/operator-manual/installation.md#L3-L8), [docs/operator-manual/installation.md:57-64](https://github.com/argoproj/argo-cd/blob/main/docs/operator-manual/installation.md#L57-L64)

### Manifest Variants and High Availability

Official installation manifests are organized into non-high-availability configurations for evaluation, demonstrations, and testing, alongside high-availability bundles tuned with multiple replicas for production environments. Both multi-tenant modes offer non-HA and HA variants:

* `install.yaml` — Standard cluster-admin installation deploying resources in the same cluster.
* `namespace-install.yaml` — Namespace-scoped installation requiring only namespace-level privileges.
* `ha/install.yaml` — High-availability version of the standard cluster-admin installation.
* `ha/namespace-install.yaml` — High-availability version of the namespace-scoped installation.
* `core-install.yaml` — Headless lightweight core installation bundle.

Sources: [docs/operator-manual/installation.md:14-22](https://github.com/argoproj/argo-cd/blob/main/docs/operator-manual/installation.md#L14-L22), [docs/operator-manual/installation.md:27-36](https://github.com/argoproj/argo-cd/blob/main/docs/operator-manual/installation.md#L27-L36), [docs/operator-manual/installation.md:47-56](https://github.com/argoproj/argo-cd/blob/main/docs/operator-manual/installation.md#L47-L56), [docs/operator-manual/installation.md:57-66](https://github.com/argoproj/argo-cd/blob/main/docs/operator-manual/installation.md#L57-L66)

> [!NOTE]
> Custom Resource Definitions (CRDs) are omitted from `namespace-install.yaml` and must be applied separately from the `manifests/crds` directory using server-side apply.

Sources: [docs/operator-manual/installation.md:39-45](https://github.com/argoproj/argo-cd/blob/main/docs/operator-manual/installation.md#L39-L45)

## Namespace Installation Manifest Structure

### Overview

The `manifests/namespace-install.yaml` file defines the core components, roles, service accounts, network policies, and configuration maps required to deploy Argo CD within a single, namespace-scoped environment. Because it operates without cluster-scoped administration privileges, its RBAC resources are constrained to `Role` and `RoleBinding` objects rather than `ClusterRole` and `ClusterRoleBinding` equivalents.

Sources: [manifests/namespace-install.yaml:1-67](https://github.com/argoproj/argo-cd/blob/main/manifests/namespace-install.yaml#L1-L67), [manifests/namespace-install.yaml:321-415](https://github.com/argoproj/argo-cd/blob/main/manifests/namespace-install.yaml#L321-L415)

### Component Service Accounts

The namespace installation deploys distinct service accounts for each core Argo CD subsystem, enabling fine-grained security isolation across components:

* `argocd-application-controller`
* `argocd-applicationset-controller`
* `argocd-dex-server`
* `argocd-notifications-controller`
* `argocd-redis`
* `argocd-repo-server`
* `argocd-server`

Sources: [manifests/namespace-install.yaml:1-64](https://github.com/argoproj/argo-cd/blob/main/manifests/namespace-install.yaml#L1-L64)

> [!NOTE]
> The `argocd-repo-server` explicitly disables mounting its service account token via `automountServiceAccountToken: false` to restrict Kubernetes API access from within repository rendering pods.

Sources: [manifests/namespace-install.yaml:1474-1474](https://github.com/argoproj/argo-cd/blob/main/manifests/namespace-install.yaml#L1474-L1474)

### RBAC Roles and Bindings

Namespace-scoped permissions are provisioned through standard Kubernetes `Role` and `RoleBinding` objects matching each controller or server component. The following table details the bound service accounts and their corresponding role resources:

| Component Name | Service Account | Role Resource |
| :--- | :--- | :--- |
| Application Controller | `argocd-application-controller` | `argocd-application-controller` |
| ApplicationSet Controller | `argocd-applicationset-controller` | `argocd-applicationset-controller` |
| Dex Server | `argocd-dex-server` | `argocd-dex-server` |
| Notifications Controller | `argocd-notifications-controller` | `argocd-notifications-controller` |
| Redis | `argocd-redis` | `argocd-redis` |
| API Server | `argocd-server` | `argocd-server` |

Sources: [manifests/namespace-install.yaml:65-320](https://github.com/argoproj/argo-cd/blob/main/manifests/namespace-install.yaml#L65-L320), [manifests/namespace-install.yaml:321-415](https://github.com/argoproj/argo-cd/blob/main/manifests/namespace-install.yaml#L321-L415)

### ConfigMaps and Resource Customizations

The installation includes base configuration maps such as `argocd-cm`, `argocd-cmd-params-cm`, `argocd-rbac-cm`, and `argocd-ssh-known-hosts-cm`. The main `argocd-cm` ConfigMap embeds comprehensive JSON path expressions and resource exclusions to filter noisy events and control field synchronization.

| Exclusion Category | API Groups | Excluded Kinds |
| :--- | :--- | :--- |
| Network Control Plane | `""`, `discovery.k8s.io` | `Endpoints`, `EndpointSlice` |
| Internal Leases | `coordination.k8s.io` | `Lease` |
| Authz / Authn | `authentication.k8s.io`, `authorization.k8s.io` | `SelfSubjectReview`, `TokenReview`, `LocalSubjectAccessReview`, `SelfSubjectAccessReview`, `SelfSubjectRulesReview`, `SubjectAccessReview` |
| Certificate Requests | `certificates.k8s.io`, `cert-manager.io` | `CertificateSigningRequest`, `CertificateRequest` |
| Cilium Internal | `cilium.io` | `CiliumIdentity`, `CiliumEndpoint`, `CiliumEndpointSlice` |
| Kyverno Reporting | `kyverno.io`, `reports.kyverno.io`, `wgpolicyk8s.io` | `PolicyReport`, `ClusterPolicyReport`, `EphemeralReport`, `ClusterEphemeralReport`, `AdmissionReport`, `ClusterAdmissionReport`, `BackgroundScanReport`, `ClusterBackgroundScanReport`, `UpdateRequest` |

Sources: [manifests/namespace-install.yaml:458-512](https://github.com/argoproj/argo-cd/blob/main/manifests/namespace-install.yaml#L458-L512), [manifests/namespace-install.yaml:513-585](https://github.com/argoproj/argo-cd/blob/main/manifests/namespace-install.yaml#L513-L585)

## Hydrator-Enabled Installation Manifest Architecture

### Overview

The hydrator-enabled namespace installation variant modifies standard deployment profiles by injecting specific parameter flags and configuration markers into parameter ConfigMaps and server deployments. This variant explicitly turns on hydration features required for advanced manifest transformation workflows within the Argo CD control plane.

Sources: [manifests/namespace-install-with-hydrator.yaml:529-532](https://github.com/argoproj/argo-cd/blob/main/manifests/namespace-install-with-hydrator.yaml#L529-L532), [manifests/namespace-install-with-hydrator.yaml:2471-2476](https://github.com/argoproj/argo-cd/blob/main/manifests/namespace-install-with-hydrator.yaml#L2471-L2476)

### Hydrator Configuration Parameters

The hydrator-enabled variant introduces specific key-value configurations into the global parameter configuration map (`argocd-cmd-params-cm`) and adds corresponding environment variable injections in the API server deployment (`argocd-server`). 

| Parameter Key | Target Resource / Object | Configured Value / Mapping | Purpose |
| :--- | :--- | :--- | :--- |
| `hydrator.enabled` | ConfigMap: `argocd-cmd-params-cm` | `"true"` | Enables hydrator subsystem processing globally via parameters config. |
| `ARGOCD_HYDRATOR_ENABLED` | Deployment: `argocd-server` | `configMapKeyRef` (`hydrator.enabled`) | Passes the hydration toggle into the server container runtime environment. |
| `argoproj.io_Application` | ConfigMap: `argocd-cm` (`resource.customizations.ignoreResourceUpdates`) | `.metadata.annotations."argocd.argoproj.io/hydrate"`, `.metadata.annotations."argocd.argoproj.io/hydrate-timestamp"` | Instructs the controller to ignore updates on specific hydration annotations during reconciliations. |

Sources: [manifests/namespace-install-with-hydrator.yaml:529-532](https://github.com/argoproj/argo-cd/blob/main/manifests/namespace-install-with-hydrator.yaml#L529-L532), [manifests/namespace-install-with-hydrator.yaml:450-451](https://github.com/argoproj/argo-cd/blob/main/manifests/namespace-install-with-hydrator.yaml#L450-L451), [manifests/namespace-install-with-hydrator.yaml:2471-2476](https://github.com/argoproj/argo-cd/blob/main/manifests/namespace-install-with-hydrator.yaml#L2471-L2476)

> [!IMPORTANT]
> Enabling `hydrator.enabled` requires adding explicit jq path expressions to `resource.customizations.ignoreResourceUpdates.argoproj.io_Application` for both `/hydrate` and `/hydrate-timestamp` annotations. Omitting these ignores can result in infinite reconciliation loops caused by the hydrator mutating application metadata.

Sources: [manifests/namespace-install-with-hydrator.yaml:450-451](https://github.com/argoproj/argo-cd/blob/main/manifests/namespace-install-with-hydrator.yaml#L450-L451), [manifests/namespace-install-with-hydrator.yaml:529-532](https://github.com/argoproj/argo-cd/blob/main/manifests/namespace-install-with-hydrator.yaml#L529-L532)

## Cluster Scope versus Namespaced Scope

### Overview

Choosing between a cluster-wide setup and a namespaced scope involves balancing permission levels, CRD management overhead, and architectural isolation. Standard multi-tenant installations (`install.yaml`) provide cluster-admin privileges and bundle cluster-wide `ClusterRoleBinding` configurations linked to service accounts within the `argocd` namespace. Conversely, namespaced installations (`namespace-install.yaml`) restrict privileges solely to the deployment namespace using `Role` and `RoleBinding` objects instead of cluster roles.

Sources: [docs/operator-manual/installation.md:18-37](https://github.com/argoproj/argo-cd/blob/main/docs/operator-manual/installation.md#L18-L37)

### Permission and CRD Distribution Differences

The two deployment patterns differ fundamentally in how they handle Kubernetes Custom Resource Definitions and cluster-level access permissions. Namespaced deployments require users to install Argo CD CRDs separately using server-side apply commands from the `manifests/crds` directory because they are absent from `namespace-install.yaml`. Furthermore, a namespaced setup supports GitOps workflows targeting external clusters by default; deploying resources into the local cluster (`kubernetes.svc.default`) requires explicit supplementary roles bound to the `argocd-application-controller` service account.

Sources: [docs/operator-manual/installation.md:27-45](https://github.com/argoproj/argo-cd/blob/main/docs/operator-manual/installation.md#L27-L45), [manifests/namespace-install.yaml:65-112](https://github.com/argoproj/argo-cd/blob/main/manifests/namespace-install.yaml#L65-L112)

> [!WARNING]
> Modifying the installation namespace in cluster-scoped manifests requires manually adjusting the `ClusterRoleBinding` subject references to match the new namespace. Failure to update these references causes immediate permission-related reconciliation errors across core controllers.

Sources: [docs/operator-manual/installation.md:23-26](https://github.com/argoproj/argo-cd/blob/main/docs/operator-manual/installation.md#L23-L26)

## Kustomize Integration and Customization Guidelines

### Kustomize Integration and Customization Guidelines

### Overview

Argo CD manifests can be installed and customized using Kustomize by including the base installation manifest as a remote resource and applying JSON or strategic merge patches. For standard installations, reference the stable remote install URL inside a `Kustomization` manifest while specifying the target namespace.

```yaml
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization

namespace: argocd
resources:
- https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml
```

Sources: [docs/operator-manual/installation.md:73-84](https://github.com/argoproj/argo-cd/blob/main/docs/operator-manual/installation.md#L73-L84)

### Installing Argo CD in a Custom Namespace

When deploying Argo CD into a namespace other than the default `argocd`, a Kustomize patch must update the `ClusterRoleBinding` so that its subject references the ServiceAccount in the custom namespace. This prevents permission-related deployment failures.

```yaml
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization

namespace: <your-custom-namespace>
resources:
  - https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml

patches:
  - patch: |-
      - op: replace
        path: /subjects/0/namespace
        value: <your-custom-namespace>
    target:
      kind: ClusterRoleBinding
```

Sources: [docs/operator-manual/installation.md:89-109](https://github.com/argoproj/argo-cd/blob/main/docs/operator-manual/installation.md#L89-L109)

> [!WARNING]
> When altering the target namespace via Kustomize patches, ensure that the JSON patch correctly targets `/subjects/0/namespace` under the `ClusterRoleBinding` resource. An unpatched cluster role binding will continue pointing to the default namespace, resulting in silent permission denials for controllers.

Sources: [docs/operator-manual/installation.md:90-111](https://github.com/argoproj/argo-cd/blob/main/docs/operator-manual/installation.md#L90-L111)

## Related

- [[High Availability Deployment]]
- [[System Settings]]

