# Core Concepts

<details>
<summary>Relevant source files</summary>

The following files were used as context for generating this wiki page:

- [pkg/apis/application/v1alpha1/applicationset_types.go](https://github.com/argoproj/argo-cd/blob/main/pkg/apis/application/v1alpha1/applicationset_types.go)
- [docs/operator-manual/applicationset/index.md](https://github.com/argoproj/argo-cd/blob/main/docs/operator-manual/applicationset/index.md)
- [pkg/apis/application/v1alpha1/generated.proto](https://github.com/argoproj/argo-cd/blob/main/pkg/apis/application/v1alpha1/generated.proto)
- [ui/src/app/shared/models.ts](https://github.com/argoproj/argo-cd/blob/main/ui/src/app/shared/models.ts)
</details>

## Overview

The core concepts governing Argo CD's automation infrastructure encompass comprehensive type definitions, generation semantics, and state management models that coordinate multi-cluster deployments. These architectural elements bridge declarative custom resources with controller reconciliation loops, ensuring robust multi-tenant application scaling and synchronization. Sources: [pkg/apis/application/v1alpha1/applicationset_types.go:48-59](https://github.com/argoproj/argo-cd/blob/main/pkg/apis/application/v1alpha1/applicationset_types.go#L48-L59), [docs/operator-manual/applicationset/index.md:5-17](https://github.com/argoproj/argo-cd/blob/main/docs/operator-manual/applicationset/index.md#L5-L17)

By establishing unified representations across Go structs, Protocol Buffer definitions, and TypeScript interfaces, the system maintains type safety and serialization consistency for custom resources like `Application`, `AppProject`, and `ApplicationSet`. Sources: [pkg/apis/application/v1alpha1/generated.proto:52-58](https://github.com/argoproj/argo-cd/blob/main/pkg/apis/application/v1alpha1/generated.proto#L52-L58), [ui/src/app/shared/models.ts:177-182](https://github.com/argoproj/argo-cd/blob/main/ui/src/app/shared/models.ts#L177-L182)

## Custom Resource Definitions Overview

### Overview

Argo CD defines its primary architectural entities across multiple language tiers to support the Kubernetes API server, backend controllers, and the web user interface. Sources: [pkg/apis/application/v1alpha1/applicationset_types.go:48-59](https://github.com/argoproj/argo-cd/blob/main/pkg/apis/application/v1alpha1/applicationset_types.go#L48-L59)

The core custom resources—specifically `Application`, `AppProject`, and `ApplicationSet`—are maintained as native Go types using controller-gen markers, translated into Protocol Buffer definitions for high-performance RPC and serialization, and mapped to TypeScript interfaces for the frontend SPA. Sources: [pkg/apis/application/v1alpha1/generated.proto:52-58](https://github.com/argoproj/argo-cd/blob/main/pkg/apis/application/v1alpha1/generated.proto#L52-L58), [ui/src/app/shared/models.ts:177-182](https://github.com/argoproj/argo-cd/blob/main/ui/src/app/shared/models.ts#L177-L182)

### Multi-Language Model Representations

The type definitions establish strict structural contracts between the Kubernetes custom resource definitions and internal runtime consumers. Each resource encapsulates metadata, specifications, and observed status conditions. Sources: [pkg/apis/application/v1alpha1/applicationset_types.go:54-59](https://github.com/argoproj/argo-cd/blob/main/pkg/apis/application/v1alpha1/applicationset_types.go#L54-L59)

| Custom Resource | Go Type Representation | Protobuf Message | TypeScript Model | Primary Purpose |
| :--- | :--- | :--- | :--- | :--- |
| **Application** | `v1alpha1.Application` | `Application` | `Application` | Represents a deployed instance of a declarative GitOps workload targeting a specific cluster and namespace. Sources: [pkg/apis/application/v1alpha1/generated.proto:135-147](https://github.com/argoproj/argo-cd/blob/main/pkg/apis/application/v1alpha1/generated.proto#L135-L147), [ui/src/app/shared/models.ts:177-182](https://github.com/argoproj/argo-cd/blob/main/ui/src/app/shared/models.ts#L177-L182) |
| **AppProject** | `v1alpha1.AppProject` | `AppProject` | `Project` | Provides logical grouping, destination whitelists, RBAC roles, and sync windows for applications. Sources: [pkg/apis/application/v1alpha1/generated.proto:52-58](https://github.com/argoproj/argo-cd/blob/main/pkg/apis/application/v1alpha1/generated.proto#L52-L58), [ui/src/app/shared/models.ts:912-918](https://github.com/argoproj/argo-cd/blob/main/ui/src/app/shared/models.ts#L912-L918) |
| **ApplicationSet** | `v1alpha1.ApplicationSet` | `ApplicationSet` | `ApplicationSet` | Automates the generation and reconciliation of multiple `Application` resources across parameter generators. Sources: [pkg/apis/application/v1alpha1/applicationset_types.go:48-59](https://github.com/argoproj/argo-cd/blob/main/pkg/apis/application/v1alpha1/applicationset_types.go#L48-L59), [pkg/apis/application/v1alpha1/generated.proto:214-222](https://github.com/argoproj/argo-cd/blob/main/pkg/apis/application/v1alpha1/generated.proto#L214-L222), [ui/src/app/shared/models.ts:1183-1198](https://github.com/argoproj/argo-cd/blob/main/ui/src/app/shared/models.ts#L1183-L1198) |

Sources: [pkg/apis/application/v1alpha1/applicationset_types.go:48-59](https://github.com/argoproj/argo-cd/blob/main/pkg/apis/application/v1alpha1/applicationset_types.go#L48-L59), [pkg/apis/application/v1alpha1/generated.proto:52-58](https://github.com/argoproj/argo-cd/blob/main/pkg/apis/application/v1alpha1/generated.proto#L52-L58), [pkg/apis/application/v1alpha1/generated.proto:135-147](https://github.com/argoproj/argo-cd/blob/main/pkg/apis/application/v1alpha1/generated.proto#L135-L147), [pkg/apis/application/v1alpha1/generated.proto:214-222](https://github.com/argoproj/argo-cd/blob/main/pkg/apis/application/v1alpha1/generated.proto#L214-L222), [ui/src/app/shared/models.ts:177-182](https://github.com/argoproj/argo-cd/blob/main/ui/src/app/shared/models.ts#L177-L182), [ui/src/app/shared/models.ts:912-918](https://github.com/argoproj/argo-cd/blob/main/ui/src/app/shared/models.ts#L912-L918), [ui/src/app/shared/models.ts:1183-1198](https://github.com/argoproj/argo-cd/blob/main/ui/src/app/shared/models.ts#L1183-L1198)

> [!NOTE]
> `Application` and `ApplicationSet` share standard Kubernetes structure metadata (`metav1.TypeMeta` and `metav1.ObjectMeta`) for frontend abstraction under `AbstractApplication`, but maintain distinct specification and status types to accommodate generator expansion versus direct reconciliation. Sources: [pkg/apis/application/v1alpha1/applicationset_types.go:45-59](https://github.com/argoproj/argo-cd/blob/main/pkg/apis/application/v1alpha1/applicationset_types.go#L45-L59), [ui/src/app/shared/models.ts:169-175](https://github.com/argoproj/argo-cd/blob/main/ui/src/app/shared/models.ts#L169-L175)

### API Serialization and Code Generation

The protocol buffer definitions in `generated.proto` serve as the source of truth for cross-service payloads, enforcing optional and repeated fields across all schema objects. Sources: [pkg/apis/application/v1alpha1/generated.proto:2-4](https://github.com/argoproj/argo-cd/blob/main/pkg/apis/application/v1alpha1/generated.proto#L2-L4)

When modifying API types in Go files such as `applicationset_types.go`, developers must execute code generation targets (`make proto` or `go-to-protobuf`) to synchronize protobuf messages and maintain RPC compatibility. Sources: [pkg/apis/application/v1alpha1/applicationset_types.go:1-15](https://github.com/argoproj/argo-cd/blob/main/pkg/apis/application/v1alpha1/applicationset_types.go#L1-L15), [pkg/apis/application/v1alpha1/generated.proto:214-222](https://github.com/argoproj/argo-cd/blob/main/pkg/apis/application/v1alpha1/generated.proto#L214-L222)

## ApplicationSet Generators and Templates

### Overview

The `ApplicationSet` controller enables multi-cluster and monorepo application deployments by generating parameters from various sources and rendering Argo CD `Application` resources. Sources: [docs/operator-manual/applicationset/index.md:5-17](https://github.com/argoproj/argo-cd/blob/main/docs/operator-manual/applicationset/index.md#L5-L17)

At the core of an `ApplicationSet` resource (`ApplicationSetSpec`) are generators, which extract parameter sets, and templates, which define the structure of the resulting Argo CD applications. Sources: [pkg/apis/application/v1alpha1/applicationset_types.go:66-82](https://github.com/argoproj/argo-cd/blob/main/pkg/apis/application/v1alpha1/applicationset_types.go#L66-L82)

Generators can operate independently or combine their outputs using advanced combination primitives such as `Matrix` and `Merge` generators. Sources: [pkg/apis/application/v1alpha1/applicationset_types.go:196-253](https://github.com/argoproj/argo-cd/blob/main/pkg/apis/application/v1alpha1/applicationset_types.go#L196-L253), [docs/operator-manual/applicationset/index.md:61-70](https://github.com/argoproj/argo-cd/blob/main/docs/operator-manual/applicationset/index.md#L61-L70)

### Generator Types and Matrix/Merge Semantics

Top-level generators are defined via `ApplicationSetGenerator`, while nested generators under `Matrix` or `Merge` utilize `ApplicationSetNestedGenerator` or `ApplicationSetTerminalGenerator`. Sources: [pkg/apis/application/v1alpha1/applicationset_types.go:196-254](https://github.com/argoproj/argo-cd/blob/main/pkg/apis/application/v1alpha1/applicationset_types.go#L196-L254)

Because Kubernetes CustomResourceDefinitions do not support recursive types, nesting depth is strictly enforced by converting terminal generators through helper methods like `toApplicationSetNestedGenerators()`, `ToNestedMatrixGenerator()`, and `ToNestedMergeGenerator()`. Sources: [pkg/apis/application/v1alpha1/applicationset_types.go:237-240](https://github.com/argoproj/argo-cd/blob/main/pkg/apis/application/v1alpha1/applicationset_types.go#L237-L240), [pkg/apis/application/v1alpha1/applicationset_types.go:304-316](https://github.com/argoproj/argo-cd/blob/main/pkg/apis/application/v1alpha1/applicationset_types.go#L304-L316), [pkg/apis/application/v1alpha1/applicationset_types.go:355-369](https://github.com/argoproj/argo-cd/blob/main/pkg/apis/application/v1alpha1/applicationset_types.go#L355-L369)

| Generator Field | Go Type | Description |
| :--- | :--- | :--- |
| `list` | `*ListGenerator` | Generates parameters from a literal list of elements. Sources: [pkg/apis/application/v1alpha1/applicationset_types.go:198](https://github.com/argoproj/argo-cd/blob/main/pkg/apis/application/v1alpha1/applicationset_types.go#L198), [docs/operator-manual/applicationset/index.md:63](https://github.com/argoproj/argo-cd/blob/main/docs/operator-manual/applicationset/index.md#L63) |
| `clusters` | `*ClusterGenerator` | Generates parameters based on clusters registered within Argo CD. Sources: [pkg/apis/application/v1alpha1/applicationset_types.go:199](https://github.com/argoproj/argo-cd/blob/main/pkg/apis/application/v1alpha1/applicationset_types.go#L199), [docs/operator-manual/applicationset/index.md:64](https://github.com/argoproj/argo-cd/blob/main/docs/operator-manual/applicationset/index.md#L64) |
| `git` | `*GitGenerator` | Generates parameters from files or directories inside a Git repository. Sources: [pkg/apis/application/v1alpha1/applicationset_types.go:200](https://github.com/argoproj/argo-cd/blob/main/pkg/apis/application/v1alpha1/applicationset_types.go#L200), [docs/operator-manual/applicationset/index.md:65-67](https://github.com/argoproj/argo-cd/blob/main/docs/operator-manual/applicationset/index.md#L65-L67) |
| `scmProvider` | `*SCMProviderGenerator` | Discovers repositories by scraping an SCM provider API (GitHub, GitLab, Gitea, Bitbucket, Azure DevOps, AWS CodeCommit). Sources: [pkg/apis/application/v1alpha1/applicationset_types.go:201](https://github.com/argoproj/argo-cd/blob/main/pkg/apis/application/v1alpha1/applicationset_types.go#L201), [pkg/apis/application/v1alpha1/applicationset_types.go:435-443](https://github.com/argoproj/argo-cd/blob/main/pkg/apis/application/v1alpha1/applicationset_types.go#L435-L443), [pkg/apis/application/v1alpha1/applicationset_types.go:455](https://github.com/argoproj/argo-cd/blob/main/pkg/apis/application/v1alpha1/applicationset_types.go#L455) |
| `clusterDecisionResource` | `*DuckTypeGenerator` | Matches against dynamic cluster decision resources referenced via a ConfigMap. Sources: [pkg/apis/application/v1alpha1/applicationset_types.go:202](https://github.com/argoproj/argo-cd/blob/main/pkg/apis/application/v1alpha1/applicationset_types.go#L202), [pkg/apis/application/v1alpha1/applicationset_types.go:397-402](https://github.com/argoproj/argo-cd/blob/main/pkg/apis/application/v1alpha1/applicationset_types.go#L397-L402) |
| `pullRequest` | `*PullRequestGenerator` | Scrapes pull request APIs for candidate PRs (GitHub, GitLab, Gitea, Bitbucket, Azure DevOps). Sources: [pkg/apis/application/v1alpha1/applicationset_types.go:203](https://github.com/argoproj/argo-cd/blob/main/pkg/apis/application/v1alpha1/applicationset_types.go#L203), [pkg/apis/application/v1alpha1/applicationset_types.go:615-628](https://github.com/argoproj/argo-cd/blob/main/pkg/apis/application/v1alpha1/applicationset_types.go#L615-L628) |
| `matrix` | `*MatrixGenerator` | Computes the cartesian product of two or more nested generators. Sources: [pkg/apis/application/v1alpha1/applicationset_types.go:204](https://github.com/argoproj/argo-cd/blob/main/pkg/apis/application/v1alpha1/applicationset_types.go#L204), [pkg/apis/application/v1alpha1/applicationset_types.go:284-285](https://github.com/argoproj/argo-cd/blob/main/pkg/apis/application/v1alpha1/applicationset_types.go#L284-L285), [docs/operator-manual/applicationset/index.md:68](https://github.com/argoproj/argo-cd/blob/main/docs/operator-manual/applicationset/index.md#L68) |
| `merge` | `*MergeGenerator` | Merges parameter sets from multiple generators using specified merge keys, with latter generators taking precedence. Sources: [pkg/apis/application/v1alpha1/applicationset_types.go:205](https://github.com/argoproj/argo-cd/blob/main/pkg/apis/application/v1alpha1/applicationset_types.go#L205), [pkg/apis/application/v1alpha1/applicationset_types.go:327-330](https://github.com/argoproj/argo-cd/blob/main/pkg/apis/application/v1alpha1/applicationset_types.go#L327-L330) |
| `plugin` | `*PluginGenerator` | Integrates external plugins via ConfigMap references to generate parameter sets. Sources: [pkg/apis/application/v1alpha1/applicationset_types.go:210](https://github.com/argoproj/argo-cd/blob/main/pkg/apis/application/v1alpha1/applicationset_types.go#L210), [pkg/apis/application/v1alpha1/applicationset_types.go:800-802](https://github.com/argoproj/argo-cd/blob/main/pkg/apis/application/v1alpha1/applicationset_types.go#L800-L802) |

Sources: [pkg/apis/application/v1alpha1/applicationset_types.go:197-211](https://github.com/argoproj/argo-cd/blob/main/pkg/apis/application/v1alpha1/applicationset_types.go#L197-L211), [pkg/apis/application/v1alpha1/applicationset_types.go:284-289](https://github.com/argoproj/argo-cd/blob/main/pkg/apis/application/v1alpha1/applicationset_types.go#L284-L289), [pkg/apis/application/v1alpha1/applicationset_types.go:327-341](https://github.com/argoproj/argo-cd/blob/main/pkg/apis/application/v1alpha1/applicationset_types.go#L327-L341), [docs/operator-manual/applicationset/index.md:61-70](https://github.com/argoproj/argo-cd/blob/main/docs/operator-manual/applicationset/index.md#L61-L70)

The `MatrixGenerator` evaluates the cartesian product of its constituent nested generators. Sources: [pkg/apis/application/v1alpha1/applicationset_types.go:284-285](https://github.com/argoproj/argo-cd/blob/main/pkg/apis/application/v1alpha1/applicationset_types.go#L284-L285)

The `MergeGenerator` combines parameter sets where values for all specified `MergeKeys` are equal, ignoring parameter sets whose merge keys are absent from the base generator. Sources: [pkg/apis/application/v1alpha1/applicationset_types.go:327-330](https://github.com/argoproj/argo-cd/blob/main/pkg/apis/application/v1alpha1/applicationset_types.go#L327-L330)

> [!NOTE]
> Nested matrix and merge generators are stored as generic `apiextensionsv1.JSON` objects within Kubernetes resource definitions and are subsequently unmarshalled using `ToNestedMatrixGenerator()` and `ToNestedMergeGenerator()` during controller processing. Sources: [pkg/apis/application/v1alpha1/applicationset_types.go:223-227](https://github.com/argoproj/argo-cd/blob/main/pkg/apis/application/v1alpha1/applicationset_types.go#L223-L227), [pkg/apis/application/v1alpha1/applicationset_types.go:294-297](https://github.com/argoproj/argo-cd/blob/main/pkg/apis/application/v1alpha1/applicationset_types.go#L294-L297), [pkg/apis/application/v1alpha1/applicationset_types.go:347-350](https://github.com/argoproj/argo-cd/blob/main/pkg/apis/application/v1alpha1/applicationset_types.go#L347-L350)

## Application and AppProject Schema Definitions

### Overview

Argo CD defines its primary control entities, `Application` and `AppProject`, across protocol buffers and TypeScript interface models. Sources: [pkg/apis/application/v1alpha1/generated.proto:52-118](https://github.com/argoproj/argo-cd/blob/main/pkg/apis/application/v1alpha1/generated.proto#L52-L118)

The `Application` resource configures target state delivery by linking source manifest repositories to Kubernetes cluster destinations, accompanied by sync policies, retry strategies, and real-time status tracking. Sources: [pkg/apis/application/v1alpha1/generated.proto:135-147](https://github.com/argoproj/argo-cd/blob/main/pkg/apis/application/v1alpha1/generated.proto#L135-L147)

The `AppProject` resource provides logical grouping and governance constraints for multiple applications, enforcing security controls such as repository whitelists, cluster and namespace resource restrictions, sync windows, and RBAC policy enforcement via bound OIDC groups and JWT tokens. Sources: [ui/src/app/shared/models.ts:912-918](https://github.com/argoproj/argo-cd/blob/main/ui/src/app/shared/models.ts#L912-L918)

### Application Data Structures

The `Application` resource combines Kubernetes metadata with desired specifications, observed runtime status, and active operations. Sources: [pkg/apis/application/v1alpha1/generated.proto:135-147](https://github.com/argoproj/argo-cd/blob/main/pkg/apis/application/v1alpha1/generated.proto#L135-L147)

| Field Name | Protobuf Type | Description |
| :--- | :--- | :--- |
| `metadata` | `ObjectMeta` | Standard Kubernetes object metadata (name, namespace, labels, annotations). Sources: [pkg/apis/application/v1alpha1/generated.proto:137](https://github.com/argoproj/argo-cd/blob/main/pkg/apis/application/v1alpha1/generated.proto#L137) |
| `spec` | `ApplicationSpec` | Desired specification governing source repositories, destination clusters, and project linkage. Sources: [pkg/apis/application/v1alpha1/generated.proto:140](https://github.com/argoproj/argo-cd/blob/main/pkg/apis/application/v1alpha1/generated.proto#L140) |
| `status` | `ApplicationStatus` | Observed synchronization state, health status, resource list, and revision history. Sources: [pkg/apis/application/v1alpha1/generated.proto:143](https://github.com/argoproj/argo-cd/blob/main/pkg/apis/application/v1alpha1/generated.proto#L143) |
| `operation` | `Operation` | Details regarding any ongoing or requested operation (such as a manual sync or rollback). Sources: [pkg/apis/application/v1alpha1/generated.proto:146](https://github.com/argoproj/argo-cd/blob/main/pkg/apis/application/v1alpha1/generated.proto#L146) |

Sources: [pkg/apis/application/v1alpha1/generated.proto:135-147](https://github.com/argoproj/argo-cd/blob/main/pkg/apis/application/v1alpha1/generated.proto#L135-L147), [ui/src/app/shared/models.ts:177-182](https://github.com/argoproj/argo-cd/blob/main/ui/src/app/shared/models.ts#L177-L182)

The `ApplicationSpec` object contains core fields that direct manifest resolution and target cluster deployment. Sources: [pkg/apis/application/v1alpha1/generated.proto:685-717](https://github.com/argoproj/argo-cd/blob/main/pkg/apis/application/v1alpha1/generated.proto#L685-L717)

| Field Name | Protobuf Type | Description |
| :--- | :--- | :--- |
| `source` | `ApplicationSource` | Reference to the location of single-source manifests, Helm charts, or Kustomize definitions. Sources: [pkg/apis/application/v1alpha1/generated.proto:687](https://github.com/argoproj/argo-cd/blob/main/pkg/apis/application/v1alpha1/generated.proto#L687) |
| `sources` | `repeated ApplicationSource` | List of manifest sources used in multi-source application configurations. Sources: [pkg/apis/application/v1alpha1/generated.proto:713](https://github.com/argoproj/argo-cd/blob/main/pkg/apis/application/v1alpha1/generated.proto#L713) |
| `destination` | `ApplicationDestination` | Target Kubernetes server URL or symbolic name and namespace. Sources: [pkg/apis/application/v1alpha1/generated.proto:690](https://github.com/argoproj/argo-cd/blob/main/pkg/apis/application/v1alpha1/generated.proto#L690) |
| `project` | `string` | Name of the `AppProject` governing this application; defaults to `default`. Sources: [pkg/apis/application/v1alpha1/generated.proto:694](https://github.com/argoproj/argo-cd/blob/main/pkg/apis/application/v1alpha1/generated.proto#L694) |
| `syncPolicy` | `SyncPolicy` | Automated sync controls, retry behaviors, and sync options. Sources: [pkg/apis/application/v1alpha1/generated.proto:697](https://github.com/argoproj/argo-cd/blob/main/pkg/apis/application/v1alpha1/generated.proto#L697) |
| `ignoreDifferences` | `repeated ResourceIgnoreDifferences` | Resource fields and JSON pointers excluded during live state comparisons. Sources: [pkg/apis/application/v1alpha1/generated.proto:700](https://github.com/argoproj/argo-cd/blob/main/pkg/apis/application/v1alpha1/generated.proto#L700) |

Sources: [pkg/apis/application/v1alpha1/generated.proto:685-717](https://github.com/argoproj/argo-cd/blob/main/pkg/apis/application/v1alpha1/generated.proto#L685-L717), [ui/src/app/shared/models.ts:352-362](https://github.com/argoproj/argo-cd/blob/main/ui/src/app/shared/models.ts#L352-L362)

> [!NOTE]
> When `project` is omitted or set to an empty string within `ApplicationSpec`, the application is automatically associated with the `default` AppProject.
> Sources: [pkg/apis/application/v1alpha1/generated.proto:693-694](https://github.com/argoproj/argo-cd/blob/main/pkg/apis/application/v1alpha1/generated.proto#L693-L694)

### AppProject Governance Models

The `AppProject` resource defines security and operational boundaries for groups of applications. Sources: [pkg/apis/application/v1alpha1/generated.proto:52-58](https://github.com/argoproj/argo-cd/blob/main/pkg/apis/application/v1alpha1/generated.proto#L52-L58)

Its specification regulates deployment destinations, allowed repositories, and access control bindings. Sources: [pkg/apis/application/v1alpha1/generated.proto:69-118](https://github.com/argoproj/argo-cd/blob/main/pkg/apis/application/v1alpha1/generated.proto#L69-L118)

| Field Name | Protobuf Type | Description |
| :--- | :--- | :--- |
| `sourceRepos` | `repeated string` | Whitelist of repository URLs permitted for deployment by applications in this project. Sources: [pkg/apis/application/v1alpha1/generated.proto:71](https://github.com/argoproj/argo-cd/blob/main/pkg/apis/application/v1alpha1/generated.proto#L71) |
| `destinations` | `repeated ApplicationDestination` | Whitelist of allowed cluster servers and target namespaces. Sources: [pkg/apis/application/v1alpha1/generated.proto:74](https://github.com/argoproj/argo-cd/blob/main/pkg/apis/application/v1alpha1/generated.proto#L74) |
| `roles` | `repeated ProjectRole` | User-defined RBAC roles, Casbin policies, and OIDC group bindings associated with the project. Sources: [pkg/apis/application/v1alpha1/generated.proto:81](https://github.com/argoproj/argo-cd/blob/main/pkg/apis/application/v1alpha1/generated.proto#L81) |
| `clusterResourceWhitelist` | `repeated ClusterResourceRestrictionItem` | Whitelisted cluster-level resource groups, kinds, and names. Sources: [pkg/apis/application/v1alpha1/generated.proto:84](https://github.com/argoproj/argo-cd/blob/main/pkg/apis/application/v1alpha1/generated.proto#L84) |
| `clusterResourceBlacklist` | `repeated ClusterResourceRestrictionItem` | Blacklisted cluster-level resource groups, kinds, and names. Sources: [pkg/apis/application/v1alpha1/generated.proto:104](https://github.com/argoproj/argo-cd/blob/main/pkg/apis/application/v1alpha1/generated.proto#L104) |
| `namespaceResourceWhitelist` | `repeated GroupKind` | Whitelisted namespace-level resource group and kind combinations. Sources: [pkg/apis/application/v1alpha1/generated.proto:96](https://github.com/argoproj/argo-cd/blob/main/pkg/apis/application/v1alpha1/generated.proto#L96) |
| `namespaceResourceBlacklist` | `repeated GroupKind` | Blacklisted namespace-level resource group and kind combinations. Sources: [pkg/apis/application/v1alpha1/generated.proto:87](https://github.com/argoproj/argo-cd/blob/main/pkg/apis/application/v1alpha1/generated.proto#L87) |
| `syncWindows` | `repeated SyncWindow` | Temporal windows controlling when sync operations are allowed or denied. Sources: [pkg/apis/application/v1alpha1/generated.proto:93](https://github.com/argoproj/argo-cd/blob/main/pkg/apis/application/v1alpha1/generated.proto#L93) |

Sources: [pkg/apis/application/v1alpha1/generated.proto:69-118](https://github.com/argoproj/argo-cd/blob/main/pkg/apis/application/v1alpha1/generated.proto#L69-L118), [ui/src/app/shared/models.ts:880-894](https://github.com/argoproj/argo-cd/blob/main/ui/src/app/shared/models.ts#L880-L894)

> [!WARNING]
> RBAC policies defined in `ProjectRole` use Casbin-formatted strings stored in the `policies` field. Incorrect syntax in these policies can lead to unintended permission escalations or complete access denials within the project.
> Sources: [pkg/apis/application/v1alpha1/generated.proto:160-162](https://github.com/argoproj/argo-cd/blob/main/pkg/apis/application/v1alpha1/generated.proto#L160-L162), [ui/src/app/shared/models.ts:852-857](https://github.com/argoproj/argo-cd/blob/main/ui/src/app/shared/models.ts#L852-L857)

## GitOps State Calculation and Differences

### Overview

The ApplicationSet controller evaluates its own health status and manages differences between generated applications through dedicated types and methods in the Go API. Sources: [pkg/apis/application/v1alpha1/applicationset_types.go:147-168](https://github.com/argoproj/argo-cd/blob/main/pkg/apis/application/v1alpha1/applicationset_types.go#L147-L168)

State calculation relies on inspecting status conditions to derive operational health, while difference-ignoring mechanisms control how live applications are updated. Sources: [pkg/apis/application/v1alpha1/applicationset_types.go:959-1006](https://github.com/argoproj/argo-cd/blob/main/pkg/apis/application/v1alpha1/applicationset_types.go#L959-L1006)

### Health Calculation Workflow

The `CalculateHealth()` method determines the health status of an ApplicationSet by iterating through its status conditions. Sources: [pkg/apis/application/v1alpha1/applicationset_types.go:959-970](https://github.com/argoproj/argo-cd/blob/main/pkg/apis/application/v1alpha1/applicationset_types.go#L959-L970)

Health evaluation follows a strict priority order based on condition types and statuses. Sources: [pkg/apis/application/v1alpha1/applicationset_types.go:971-986](https://github.com/argoproj/argo-cd/blob/main/pkg/apis/application/v1alpha1/applicationset_types.go#L971-L986)

| Priority | Condition Type | Condition Status | Resulting Health Status |
| :--- | :--- | :--- | :--- |
| 1 | `ErrorOccurred` | `True` | `Degraded` |
| 2 | `RolloutProgressing` | `True` | `Progressing` |
| 3 | `ResourcesUpToDate` | `True` | `Healthy` |
| 4 | *None / Other* | *Any* | `Unknown` |

Sources: [pkg/apis/application/v1alpha1/applicationset_types.go:959-1006](https://github.com/argoproj/argo-cd/blob/main/pkg/apis/application/v1alpha1/applicationset_types.go#L959-L1006)

> [!NOTE]
> If an ApplicationSet has no status conditions recorded (`len(status.Conditions) == 0`), `CalculateHealth()` immediately returns `HealthStatusUnknown` with the message `"No status conditions found for ApplicationSet"`.
> Sources: [pkg/apis/application/v1alpha1/applicationset_types.go:960-965](https://github.com/argoproj/argo-cd/blob/main/pkg/apis/application/v1alpha1/applicationset_types.go#L960-L965)

### Resource Difference Ignoring

The ApplicationSet controller provides mechanisms to ignore specific differences in managed applications when applying changes. Sources: [pkg/apis/application/v1alpha1/applicationset_types.go:147-150](https://github.com/argoproj/argo-cd/blob/main/pkg/apis/application/v1alpha1/applicationset_types.go#L147-L150)

This behavior is configured via `ApplicationSetIgnoreDifferences` and `ApplicationSetResourceIgnoreDifferences`. Sources: [pkg/apis/application/v1alpha1/applicationset_types.go:159-168](https://github.com/argoproj/argo-cd/blob/main/pkg/apis/application/v1alpha1/applicationset_types.go#L159-L168)

| Field Name | Type | Description |
| :--- | :--- | :--- |
| `Name` | `string` | Name of the application to ignore differences for. If left empty, the rule applies to all managed applications. Sources: [pkg/apis/application/v1alpha1/applicationset_types.go:163](https://github.com/argoproj/argo-cd/blob/main/pkg/apis/application/v1alpha1/applicationset_types.go#L163) |
| `JSONPointers` | `[]string` | List of JSON pointers targeting fields whose differences should be ignored during synchronization. Sources: [pkg/apis/application/v1alpha1/applicationset_types.go:165](https://github.com/argoproj/argo-cd/blob/main/pkg/apis/application/v1alpha1/applicationset_types.go#L165) |
| `JQPathExpressions` | `[]string` | List of JQ path expressions targeting fields whose differences should be ignored during synchronization. Sources: [pkg/apis/application/v1alpha1/applicationset_types.go:167](https://github.com/argoproj/argo-cd/blob/main/pkg/apis/application/v1alpha1/applicationset_types.go#L167) |

Sources: [pkg/apis/application/v1alpha1/applicationset_types.go:147-168](https://github.com/argoproj/argo-cd/blob/main/pkg/apis/application/v1alpha1/applicationset_types.go#L147-L168)

The conversion method `ToApplicationIgnoreDifferences()` maps collection-level ignore configurations into standard engine-level resource ignore rules by iterating through configured items and invoking `ToApplicationResourceIgnoreDifferences()`. Sources: [pkg/apis/application/v1alpha1/applicationset_types.go:151-157](https://github.com/argoproj/argo-cd/blob/main/pkg/apis/application/v1alpha1/applicationset_types.go#L151-L157)

> [!WARNING]
> Omitting the `Name` field in an `ApplicationSetResourceIgnoreDifferences` entry applies the JSON pointers and JQ expressions globally across all applications generated by the ApplicationSet.
> Sources: [pkg/apis/application/v1alpha1/applicationset_types.go:161-164](https://github.com/argoproj/argo-cd/blob/main/pkg/apis/application/v1alpha1/applicationset_types.go#L161-L164)

## Operator Manual ApplicationSet Architecture

### Overview

The ApplicationSet controller operates as a Kubernetes controller that supplements Argo CD by processing custom `ApplicationSet` resources and reconciling them into standard Argo CD `Application` instances. Sources: [docs/operator-manual/applicationset/index.md:1-6](https://github.com/argoproj/argo-cd/blob/main/docs/operator-manual/applicationset/index.md#L1-L6)

Bundled with Argo CD starting from v2.3, the controller manages multi-cluster and multi-repository deployments using a declarative template-and-generator architecture. Sources: [docs/operator-manual/applicationset/index.md:7-17](https://github.com/argoproj/argo-cd/blob/main/docs/operator-manual/applicationset/index.md#L7-L17)

### Supported Generators

Generators are responsible for producing key-value parameter sets that get substituted into the `template:` section of an `ApplicationSet` resource. Sources: [docs/operator-manual/applicationset/index.md:55-60](https://github.com/argoproj/argo-cd/blob/main/docs/operator-manual/applicationset/index.md#L55-L60)

The ApplicationSet controller supports multiple built-in generator types, each utilizing distinct sources for parameter generation. Sources: [docs/operator-manual/applicationset/index.md:61-70](https://github.com/argoproj/argo-cd/blob/main/docs/operator-manual/applicationset/index.md#L61-L70)

| Generator Type | Parameter Source | Description |
| :--- | :--- | :--- |
| **List generator** | Literal configuration | Generates parameters based on a fixed list of cluster name and URL values defined directly within the resource manifest. Sources: [docs/operator-manual/applicationset/index.md:33-40](https://github.com/argoproj/argo-cd/blob/main/docs/operator-manual/applicationset/index.md#L33-L40), [docs/operator-manual/applicationset/index.md:63](https://github.com/argoproj/argo-cd/blob/main/docs/operator-manual/applicationset/index.md#L63) |
| **Cluster generator** | Argo CD cluster secrets | Automatically generates cluster parameters based on the clusters registered within Argo CD. Sources: [docs/operator-manual/applicationset/index.md:64](https://github.com/argoproj/argo-cd/blob/main/docs/operator-manual/applicationset/index.md#L64) |
| **Git generator** | Git repository files/folders | Generates parameters based on files (parsed JSON values) or individual directory paths contained within a designated Git repository. Sources: [docs/operator-manual/applicationset/index.md:65-67](https://github.com/argoproj/argo-cd/blob/main/docs/operator-manual/applicationset/index.md#L65-L67) |
| **Matrix generator** | Combined generators | Combines the generated parameters of two other generators to produce a Cartesian product or merged output. Sources: [docs/operator-manual/applicationset/index.md:68](https://github.com/argoproj/argo-cd/blob/main/docs/operator-manual/applicationset/index.md#L68) |

Sources: [docs/operator-manual/applicationset/index.md:61-69](https://github.com/argoproj/argo-cd/blob/main/docs/operator-manual/applicationset/index.md#L61-L69)

### Reconciliation Execution Walkthrough

When an `ApplicationSet` resource is applied to a Kubernetes cluster, the controller executes a deterministic processing pipeline to translate generator entries into active Argo CD applications: Sources: [docs/operator-manual/applicationset/index.md:76-82](https://github.com/argoproj/argo-cd/blob/main/docs/operator-manual/applicationset/index.md#L76-L82)

1. **Generator Processing**: The ApplicationSet controller processes the configured generator entries (`- list`, `- cluster`, `- git`, or `- matrix`), producing a distinct set of template parameters. Sources: [docs/operator-manual/applicationset/index.md:77-78](https://github.com/argoproj/argo-cd/blob/main/docs/operator-manual/applicationset/index.md#L77-L78)
2. **Parameter Substitution**: The controller substitutes the generated parameters into the resource's `template:` section once for each parameter set, replacing placeholders such as `{{cluster}}` and `{{url}}`. Sources: [docs/operator-manual/applicationset/index.md:74-79](https://github.com/argoproj/argo-cd/blob/main/docs/operator-manual/applicationset/index.md#L74-L79)
3. **Application Creation**: Each rendered template is converted into an Argo CD `Application` resource, which is subsequently created or updated within the Argo CD namespace. Sources: [docs/operator-manual/applicationset/index.md:80-80](https://github.com/argoproj/argo-cd/blob/main/docs/operator-manual/applicationset/index.md#L80-L80)
4. **Controller Notification**: Finally, the Argo CD controller is notified of these newly created `Application` resources and assumes responsibility for managing their ongoing synchronization and lifecycle. Sources: [docs/operator-manual/applicationset/index.md:81-81](https://github.com/argoproj/argo-cd/blob/main/docs/operator-manual/applicationset/index.md#L81-L81)

> [!NOTE]
> Any subsequent changes, updates, or deletions made to the parent `ApplicationSet` resource are automatically propagated by the controller to all instantiated Argo CD `Application` resources. Adding a new entry to a List generator instantly triggers the creation of a corresponding application instance.
> Sources: [docs/operator-manual/applicationset/index.md:107-109](https://github.com/argoproj/argo-cd/blob/main/docs/operator-manual/applicationset/index.md#L107-L109)

## Related

- [[Application Controller]]
- [[ApplicationSet Controller]]

