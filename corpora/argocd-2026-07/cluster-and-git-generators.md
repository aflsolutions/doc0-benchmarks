# Cluster and Git Generators

<details>
<summary>Relevant source files</summary>

The following files were used as context for generating this wiki page:

- [docs/operator-manual/applicationset/Generators-Matrix.md](https://github.com/argoproj/argo-cd/blob/main/docs/operator-manual/applicationset/Generators-Matrix.md)
- [docs/operator-manual/applicationset/Generators-Git.md](https://github.com/argoproj/argo-cd/blob/main/docs/operator-manual/applicationset/Generators-Git.md)
- [docs/operator-manual/applicationset/Generators-Merge.md](https://github.com/argoproj/argo-cd/blob/main/docs/operator-manual/applicationset/Generators-Merge.md)
- [docs/operator-manual/applicationset/Generators-Cluster.md](https://github.com/argoproj/argo-cd/blob/main/docs/operator-manual/applicationset/Generators-Cluster.md)
- [applicationset/generators/git.go](https://github.com/argoproj/argo-cd/blob/main/applicationset/generators/git.go)
- [docs/operator-manual/applicationset/Generators.md](https://github.com/argoproj/argo-cd/blob/main/docs/operator-manual/applicationset/Generators.md)
- [docs/operator-manual/applicationset.yaml](https://github.com/argoproj/argo-cd/blob/main/docs/operator-manual/applicationset.yaml)
- [pkg/apis/application/v1alpha1/applicationset_types.go](https://github.com/argoproj/argo-cd/blob/main/pkg/apis/application/v1alpha1/applicationset_types.go)
- [docs/operator-manual/applicationset/Generators-Plugin.md](https://github.com/argoproj/argo-cd/blob/main/docs/operator-manual/applicationset/Generators-Plugin.md)
- [docs/operator-manual/applicationset/index.md](https://github.com/argoproj/argo-cd/blob/main/docs/operator-manual/applicationset/index.md)
- [applicationset/generators/cluster.go](https://github.com/argoproj/argo-cd/blob/main/applicationset/generators/cluster.go)
- [applicationset/webhook/webhook.go](https://github.com/argoproj/argo-cd/blob/main/applicationset/webhook/webhook.go)
- [applicationset/generators/matrix.go](https://github.com/argoproj/argo-cd/blob/main/applicationset/generators/matrix.go)
- [applicationset/generators/merge.go](https://github.com/argoproj/argo-cd/blob/main/applicationset/generators/merge.go)
</details>

## Overview

Cluster and Git generators form the core parameter-generation mechanisms of the Argo CD ApplicationSet controller, bridging declarative cluster topologies with repository-driven workflows. The Cluster generator targets registered Argo CD clusters by extracting secret metadata, while the Git generator scans repository directories and structured configuration files to dynamically construct parameter sets. Together, these generators solve the challenge of scaling multi-cluster application deployments from a single source of truth without manual duplication.

Sources: [docs/operator-manual/applicationset/Generators-Cluster.md:1-15](https://github.com/argoproj/argo-cd/blob/main/docs/operator-manual/applicationset/Generators-Cluster.md#L1-L15), [docs/operator-manual/applicationset/Generators-Git.md:1-4](https://github.com/argoproj/argo-cd/blob/main/docs/operator-manual/applicationset/Generators-Git.md#L1-L4), [docs/operator-manual/applicationset/Generators.md:1-11](https://github.com/argoproj/argo-cd/blob/main/docs/operator-manual/applicationset/Generators.md#L1-L11)

Building upon individual parameter sources, combination generators like Matrix and Merge enable complex multi-dimensional deployments by taking products or overriding overlapping parameter keys across child generators. Concurrently, an event-driven webhook lifecycle ensures real-time reconciliation and dynamic refresh execution in response to Git repository mutations.

Sources: [docs/operator-manual/applicationset/Generators-Matrix.md:1-5](https://github.com/argoproj/argo-cd/blob/main/docs/operator-manual/applicationset/Generators-Matrix.md#L1-L5), [docs/operator-manual/applicationset/Generators-Merge.md:1-4](https://github.com/argoproj/argo-cd/blob/main/docs/operator-manual/applicationset/Generators-Merge.md#L1-L4), [docs/operator-manual/applicationset/Generators-Git.md:454-469](https://github.com/argoproj/argo-cd/blob/main/docs/operator-manual/applicationset/Generators-Git.md#L454-L469)

## ApplicationSet Generator Architecture and Types

### Overview

The ApplicationSet generator architecture relies on typed API definitions within the `pkg/apis/application/v1alpha1` package to declare parameter sources, nesting structures, and controller synchronization behaviors. At the top level, an `ApplicationSet` resource defines a spec containing a list of `ApplicationSetGenerator` structs, an `ApplicationSetTemplate` for rendering Argo CD Applications, and optional rollout strategies or sync policies. Individual generators are responsible for producing parameters that are interpolated into templates.

Sources: [pkg/apis/application/v1alpha1/applicationset_types.go:48-82](https://github.com/argoproj/argo-cd/blob/main/pkg/apis/application/v1alpha1/applicationset_types.go#L48-L82), [docs/operator-manual/applicationset/Generators.md:3-6](https://github.com/argoproj/argo-cd/blob/main/docs/operator-manual/applicationset/Generators.md#L3-L6)

### Generator API Types and Structures

Generators are categorized into top-level generators, nested combination generators (`MatrixGenerator` and `MergeGenerator`), and terminal generators. Because Kubernetes CustomResourceDefinitions do not support recursive types, the ApplicationSet controller enforces a nesting depth limit using distinct types: `ApplicationSetGenerator`, `ApplicationSetNestedGenerator`, and `ApplicationSetTerminalGenerator`.

| Generator Type Struct | Corresponding Field / CRD Representation | Purpose & Behavior |
| :--- | :--- | :--- |
| `ListGenerator` | `list` | Generates parameters from a fixed, literal list of elements or YAML strings. |
| `ClusterGenerator` | `clusters` | Extracts parameters from Argo CD cluster secrets based on label selectors. |
| `GitGenerator` | `git` | Scans Git repository directory paths or JSON/YAML configuration files. |
| `SCMProviderGenerator` | `scmProvider` | Automatically discovers repositories via SCM APIs (GitHub, GitLab, etc.). |
| `DuckTypeGenerator` | `clusterDecisionResource` | Interacts with Kubernetes custom resources using duck-typing and ConfigMap refs. |
| `PullRequestGenerator` | `pullRequest` | Scans SCM APIs for open pull requests matching specified filter rules. |
| `MatrixGenerator` | `matrix` | Produces the cartesian product of two or more nested child generators. |
| `MergeGenerator` | `merge` | Merges parameter sets from multiple child generators using designated merge keys. |
| `PluginGenerator` | `plugin` | Makes RPC HTTP requests to external plugins using a ConfigMap reference and inputs. |

Sources: [pkg/apis/application/v1alpha1/applicationset_types.go:196-254](https://github.com/argoproj/argo-cd/blob/main/pkg/apis/application/v1alpha1/applicationset_types.go#L196-L254)

> [!NOTE]
> Nested matrix and merge generators are not included directly as typed structs in the top-level CRD fields; instead, they are embedded as generic `apiextensionsv1.JSON` objects and are subsequently unmarshalled into `NestedMatrixGenerator` or `NestedMergeGenerator` structs during controller processing.

Sources: [pkg/apis/application/v1alpha1/applicationset_types.go:223-228](https://github.com/argoproj/argo-cd/blob/main/pkg/apis/application/v1alpha1/applicationset_types.go#L223-L228), [pkg/apis/application/v1alpha1/applicationset_types.go:295-297](https://github.com/argoproj/argo-cd/blob/main/pkg/apis/application/v1alpha1/applicationset_types.go#L295-L297)

### Nested Generator Conversion Interfaces

To facilitate handling generators at arbitrary nesting depths within combination structures, the codebase provides explicit conversion methods. For instance, `ApplicationSetTerminalGenerators` implements `toApplicationSetNestedGenerators()` to convert terminal leaf generators into nested generator wrappers. Similarly, `NestedMatrixGenerator` implements `ToMatrixGenerator()`, and `NestedMergeGenerator` implements `ToMergeGenerator()`.

```go
func (g ApplicationSetTerminalGenerators) toApplicationSetNestedGenerators() []ApplicationSetNestedGenerator {
	nestedGenerators := make([]ApplicationSetNestedGenerator, len(g))
	for i, terminalGenerator := range g {
		nestedGenerators[i] = ApplicationSetNestedGenerator{
			List:                    terminalGenerator.List,
			Clusters:                terminalGenerator.Clusters,
			Git:                     terminalGenerator.Git,
			SCMProvider:             terminalGenerator.SCMProvider,
			ClusterDecisionResource: terminalGenerator.ClusterDecisionResource,
			PullRequest:             terminalGenerator.PullRequest,
			Plugin:                  terminalGenerator.Plugin,
			Selector:                terminalGenerator.Selector,
		}
	}
	return nestedGenerators
}
```

Sources: [pkg/apis/application/v1alpha1/applicationset_types.go:256-274](https://github.com/argoproj/argo-cd/blob/main/pkg/apis/application/v1alpha1/applicationset_types.go#L256-L274)

## Cluster Generator Parameter Generation

### Overview

The `ClusterGenerator` targets registered Argo CD clusters by reading Kubernetes Secret objects stored within the Argo CD namespace. It extracts cluster metadata, connection endpoints, labels, and annotations to build parameter sets for ApplicationSet templates.

Sources: [applicationset/generators/cluster.go:21-26](https://github.com/argoproj/argo-cd/blob/main/applicationset/generators/cluster.go#L21-L26), [docs/operator-manual/applicationset/Generators-Cluster.md:3-15](https://github.com/argoproj/argo-cd/blob/main/docs/operator-manual/applicationset/Generators-Cluster.md#L3-L15)

### Parameter Generation Call-Chain Execution

When the ApplicationSet controller processes an ApplicationSet containing a cluster generator, parameter extraction flows through a specific sequence of internal methods:

`GenerateParams()` → `getSecretsByClusterName()` → `getClusterParameters()` → `appendTemplatedValues()` → `paramHolder.consolidate()`

1. **`GenerateParams()`**: Validates input parameters, checks that `appSetGenerator.Clusters` is non-nil, determines whether to ignore local cluster credentials, and initializes a `paramHolder` structure.
2. **`getSecretsByClusterName()`**: Constructs a label selector combining the user-defined selector and the mandatory secret-type label (`argocd.argoproj.io/secret-type: cluster`), queries Kubernetes Secrets via the controller-runtime client, and maps them by their internal cluster name.
3. **`getClusterParameters()`**: Iterates over each matched secret, extracting `name`, normalized name (`nameNormalized`), `server`, `project`, and handling metadata labels and annotations depending on whether `GoTemplate` is enabled.
4. **`appendTemplatedValues()`**: Appends any user-defined arbitrary key-value pairs from the generator's `values` field into the parameter map.
5. **`paramHolder.consolidate()`**: Returns the slice of parameter maps directly or wraps them under a `clusters` key if `flatList` mode is enabled.

Sources: [applicationset/generators/cluster.go:48-108](https://github.com/argoproj/argo-cd/blob/main/applicationset/generators/cluster.go#L48-L108)

> [!NOTE]
> The cluster generator overrides requeue intervals by returning `NoRequeueAfter` from `GetRequeueAfter()`. Cluster secret event handlers (`clusterSecretEventHandler`) automatically trigger ApplicationSet reconciliation whenever underlying cluster secrets change.

Sources: [applicationset/generators/cluster.go:38-42](https://github.com/argoproj/argo-cd/blob/main/applicationset/generators/cluster.go#L38-L42)

### Extracted Cluster Parameters and Secret Fields

The cluster generator extracts specific data fields from cluster secrets and populates parameter maps used by ApplicationSet templates.

| Parameter Key | Source Field / Derivation | Purpose / Behavior |
| :--- | :--- | :--- |
| `name` | `cluster.Data["name"]` | Identifies the registered cluster name. |
| `nameNormalized` | `utils.SanitizeName(cluster.Data["name"])` | Converts the cluster name to lowercase alphanumeric characters, `-`, or `.` to ensure Kubernetes resource naming compliance. |
| `server` | `cluster.Data["server"]` | Specifies the Kubernetes API server endpoint URL. |
| `project` | `cluster.Data["project"]` | Assigns the Argo CD project; defaults to `""` if absent. |
| `metadata.labels.<key>` | `cluster.Labels` | Exposes secret labels as parameters when `GoTemplate` is disabled (or via `.metadata.labels` under `goTemplate: true`). |
| `metadata.annotations.<key>` | `cluster.Annotations` | Exposes secret annotations as parameters when `GoTemplate` is disabled (or via `.metadata.annotations` under `goTemplate: true`). |

Sources: [docs/operator-manual/applicationset/Generators-Cluster.md:9-15](https://github.com/argoproj/argo-cd/blob/main/docs/operator-manual/applicationset/Generators-Cluster.md#L9-L15), [applicationset/generators/cluster.go:128-163](https://github.com/argoproj/argo-cd/blob/main/applicationset/generators/cluster.go#L128-L163)

> [!WARNING]
> Local clusters are automatically included in generated parameters unless a non-empty label selector (`MatchLabels` or `MatchExpressions`) is configured. Because the default in-cluster instance does not have a corresponding Kubernetes Secret, any selector checking for secret labels will exclude it.

Sources: [applicationset/generators/cluster.go:58-61](https://github.com/argoproj/argo-cd/blob/main/applicationset/generators/cluster.go#L58-L61), [applicationset/generators/cluster.go:90-91](https://github.com/argoproj/argo-cd/blob/main/applicationset/generators/cluster.go#L90-L91)

### Cluster Generator Design Trade-Offs

| Design Choice | Benefit | Cost |
| :--- | :--- | :--- |
| **Secret-backed cluster discovery** | Reuses existing Argo CD declarative cluster registration infrastructure without introducing new CRDs. | Requires controller-runtime client list permissions on secrets within the Argo CD namespace. |
| **Automatic in-cluster fallback** | Seamlessly targets the host cluster where Argo CD runs without requiring manual secret creation. | Can unexpectedly deploy workloads to the local control plane if label filters are omitted. |
| **Flat-list consolidation (`flatList`)** | Aggregates all cluster parameters into a single array structure (`.clusters`) for multi-cluster Helm values injection. | Prevents generating separate Application resources per cluster when multiple flat list generators are combined. |

Sources: [docs/operator-manual/applicationset/Generators-Cluster.md:3-6](https://github.com/argoproj/argo-cd/blob/main/docs/operator-manual/applicationset/Generators-Cluster.md#L3-L6), [docs/operator-manual/applicationset/Generators-Cluster.md:106-110](https://github.com/argoproj/argo-cd/blob/main/docs/operator-manual/applicationset/Generators-Cluster.md#L106-L110), [docs/operator-manual/applicationset/Generators-Cluster.md:256-315](https://github.com/argoproj/argo-cd/blob/main/docs/operator-manual/applicationset/Generators-Cluster.md#L256-L315), [applicationset/generators/cluster.go:90-105](https://github.com/argoproj/argo-cd/blob/main/applicationset/generators/cluster.go#L90-L105)

## Git Directory and File Generators

### Overview

The Git generator subtype provides two distinct mechanisms for parameterizing ApplicationSets: scanning directory structures or parsing JSON/YAML configuration files within a remote Git repository. The ApplicationSet controller orchestrates this process via the `GitGenerator` implementation of the core generator interface.

Sources: [docs/operator-manual/applicationset/Generators-Git.md:3](https://github.com/argoproj/argo-cd/blob/main/docs/operator-manual/applicationset/Generators-Git.md#L3), [applicationset/generators/git.go:24-29](https://github.com/argoproj/argo-cd/blob/main/applicationset/generators/git.go#L24-L29)

### Execution Walkthrough and Parameter Generation

When the ApplicationSet controller reconciles a Git generator, it delegates execution through a specific sequence of internal functions. 

The call chain proceeds as follows: `GenerateParams()` → checks whether `appSetGenerator.Git.Directories` or `appSetGenerator.Git.Files` is populated → branches into either `generateParamsForGitDirectories()` or `generateParamsForGitFiles()`. 

- For directory generators, `generateParamsForGitDirectories()` calls `g.repos.GetDirectories()` to retrieve all matching directory paths from the repo server. It then runs `g.filterApps()` to evaluate include and exclude rules against each path, passing the resulting paths to `g.generateParamsFromApps()` to construct the final parameter maps.
- For file generators, `generateParamsForGitFiles()` gathers files matching include patterns via `g.repos.GetFiles()`, excludes files matching any exclude pattern, sorts the file paths deterministically, and iterates through them calling `g.generateParamsFromGitFile()` to parse JSON or YAML structures into key-value pairs.

Sources: [applicationset/generators/git.go:61-140](https://github.com/argoproj/argo-cd/blob/main/applicationset/generators/git.go#L61-L140), [applicationset/generators/git.go:145-217](https://github.com/argoproj/argo-cd/blob/main/applicationset/generators/git.go#L145-L217)

> [!WARNING]
> Exclude rules take absolute precedence over include rules. If a path matches both an include pattern and an exclude pattern, the directory or file is always excluded, regardless of the order in which patterns are listed in the generator configuration.

Sources: [docs/operator-manual/applicationset/Generators-Git.md:127-133](https://github.com/argoproj/argo-cd/blob/main/docs/operator-manual/applicationset/Generators-Git.md#L127-L133), [applicationset/generators/git.go:318-321](https://github.com/argoproj/argo-cd/blob/main/applicationset/generators/git.go#L318-L321)

### Extracted Git Parameters and File Parsing Options

The Git generator exposes parameter keys depending on whether Go templating is active and whether a `pathParamPrefix` is configured.

| Parameter Field (Go Template Mode) | Parameter Field (Flat Mode) | Description / Derivation |
| :--- | :--- | :--- |
| `{{.path.path}}` / `{{.prefix.path}}` | `path` / `prefix.path` | The directory path or file directory path within the Git repository. |
| `{{.path.basename}}` / `{{.prefix.basename}}` | `path.basename` / `prefix.path.basename` | The right-most directory name extracted from the path. |
| `{{.path.basenameNormalized}}` | `path.basenameNormalized` | The basename with unsupported characters replaced with `-`. |
| `{{index .path.segments n}}` | `path[n]` | Path segments split into array elements by `/`. |
| `{{.path.filename}}` | `path.filename` | The matched filename (file generator only). |
| `{{.path.filenameNormalized}}` | `path.filenameNormalized` | The matched filename with unsupported characters replaced with `-` (file generator only). |

Sources: [docs/operator-manual/applicationset/Generators-Git.md:68-74](https://github.com/argoproj/argo-cd/blob/main/docs/operator-manual/applicationset/Generators-Git.md#L68-L74), [docs/operator-manual/applicationset/Generators-Git.md:333-340](https://github.com/argoproj/argo-cd/blob/main/docs/operator-manual/applicationset/Generators-Git.md#L333-L340), [applicationset/generators/git.go:244-282](https://github.com/argoproj/argo-cd/blob/main/applicationset/generators/git.go#L244-L282), [applicationset/generators/git.go:333-357](https://github.com/argoproj/argo-cd/blob/main/applicationset/generators/git.go#L333-L357)

### Git Generator Design Trade-Offs

| Design Choice | Benefit | Cost |
| :--- | :--- | :--- |
| **Repo-server remote discovery** | Offloads repository traversal and authentication to the Argo CD repo-server service, avoiding local git clones in the controller. | Subject to repo-server revision cache expiration settings, which can introduce delays in detecting new commits. |
| **Dual unmarshalling (Single object or Array)** | File generator automatically handles individual YAML/JSON configuration objects as well as lists of objects per file. | Unmarshalling failures on malformed configuration files halt parameter generation for the entire file set. |
| **Deterministic file sorting** | Sorts retrieved file paths lexicographically before processing to ensure stable parameter generation order. | Adds sorting overhead when processing large repositories containing thousands of configuration files. |

Sources: [docs/operator-manual/applicationset/Generators-Git.md:445-453](https://github.com/argoproj/argo-cd/blob/main/docs/operator-manual/applicationset/Generators-Git.md#L445-L453), [applicationset/generators/git.go:199-214](https://github.com/argoproj/argo-cd/blob/main/applicationset/generators/git.go#L199-L214), [applicationset/generators/git.go:225-237](https://github.com/argoproj/argo-cd/blob/main/applicationset/generators/git.go#L225-L237)

## Matrix and Merge Combinatorial Generators

### Overview

The Matrix and Merge generators provide combinatorial parameter expansion by combining or overriding parameter sets across multiple child generators. The Matrix generator computes the full Cartesian product ($A \times B$) of two child generators, merging each parameter combination. The Merge generator computes parameter intersections using configured merge keys, letting subsequent generators override parameter sets from the base generator with bottom-to-top precedence.

Sources: [docs/operator-manual/applicationset/Generators-Matrix.md:3-5](https://github.com/argoproj/argo-cd/blob/main/docs/operator-manual/applicationset/Generators-Matrix.md#L3-L5), [docs/operator-manual/applicationset/Generators-Merge.md:3-4](https://github.com/argoproj/argo-cd/blob/main/docs/operator-manual/applicationset/Generators-Merge.md#L3-L4)

### Execution Walkthrough and Parameter Merging

The Matrix generator execution path is managed by `MatrixGenerator.GenerateParams()`, which validates generator constraints, executes child generators sequentially, and combines their output maps.

Adding and combining parameter sets follows this call chain:
`GenerateParams()` validates that `appSetGenerator.Matrix` is non-nil and contains exactly two generators via `len(appSetGenerator.Matrix.Generators) < 2` or `> 2` checks → `m.getParams()` invokes `Transform()` for each child generator nested inside `appSetBaseGenerator` → `g0` parameter set is iterated, and for each parameter map `a`, `m.getParams()` fetches `g1` using parameter values from `a` → `g1` parameters `b` are merged with `a`. If `appSet.Spec.GoTemplate` is enabled, `mergo.Merge(&tmp, b, mergo.WithOverride)` followed by `mergo.Merge(&tmp, a, mergo.WithOverride)` constructs the combined map; otherwise, `utils.CombineStringMaps(a, b)` performs string map combination.

Sources: [applicationset/generators/matrix.go:35-80](https://github.com/argoproj/argo-cd/blob/main/applicationset/generators/matrix.go#L35-L80), [applicationset/generators/matrix.go:82-123](https://github.com/argoproj/argo-cd/blob/main/applicationset/generators/matrix.go#L82-L123)

For Merge generators, `MergeGenerator.GenerateParams()` retrieves all child parameter sets via `m.getParamSetsForAllGenerators()`, indexes the base parameter set using `getParamSetsByMergeKey()`, and applies overrides from subsequent generators.

The merge key indexing and deduplication call chain operates as follows:
`getParamSetsByMergeKey()` verifies that `mergeKeys` is non-empty (`ErrNoMergeKeys`) → iterates through `paramSets` to extract values matching the deduplicated `mergeKeys` → marshals the extracted key map into a canonical JSON string via `json.Marshal(paramSetKey)` → checks `paramSetsByMergeKey[paramSetKeyString]` for collisions, returning `ErrNonUniqueParamSets` if a duplicate key exists → stores the parameter set against the marshaled key string.

Sources: [applicationset/generators/merge.go:53-101](https://github.com/argoproj/argo-cd/blob/main/applicationset/generators/merge.go#L53-L101), [applicationset/generators/merge.go:106-134](https://github.com/argoproj/argo-cd/blob/main/applicationset/generators/merge.go#L106-L134)

> [!CAUTION]
> Both Matrix and Merge generators enforce strict structural validation rules. Matrix generators accept strictly two child generators and throw `ErrLessThanTwoGenerators` or `ErrMoreThanTwoGenerators` if violated. Merge generators require two or more generators (`ErrLessThanTwoGeneratorsInMerge`) and at least one merge key (`ErrNoMergeKeys`), while rejecting duplicate keys within the same generator via `ErrNonUniqueParamSets`.

Sources: [applicationset/generators/matrix.go:17-21](https://github.com/argoproj/argo-cd/blob/main/applicationset/generators/matrix.go#L17-L21), [applicationset/generators/merge.go:18-22](https://github.com/argoproj/argo-cd/blob/main/applicationset/generators/merge.go#L18-L22)

### Combinatorial Generator Reference Table

| Error / Constant Variable | Value / Condition | Meaning and Validation Context |
| :--- | :--- | :--- |
| `ErrMoreThanTwoGenerators` | `"found more than two generators, Matrix support only two"` | Returned by Matrix generator when `len(Generators) > 2`. |
| `ErrLessThanTwoGenerators` | `"found less than two generators, Matrix support only two"` | Returned by Matrix generator when `len(Generators) < 2`. |
| `ErrMoreThenOneInnerGenerators` | `"found more than one generator in matrix.Generators"` / `merge.go` | Returned when `Transform()` returns more than a single inner generator structure during child evaluation. |
| `ErrLessThanTwoGeneratorsInMerge` | `"found less than two generators, Merge requires two or more"` | Returned by Merge generator when `len(Generators) < 2`. |
| `ErrNoMergeKeys` | `"no merge keys were specified, Merge requires at least one"` | Returned by `getParamSetsByMergeKey()` when `mergeKeys` array is empty. |
| `ErrNonUniqueParamSets` | `"the parameters from a generator were not unique by the given mergeKeys..."` | Returned when two parameter sets share identical merge key values. |

Sources: [applicationset/generators/matrix.go:17-21](https://github.com/argoproj/argo-cd/blob/main/applicationset/generators/matrix.go#L17-L21), [applicationset/generators/merge.go:18-22](https://github.com/argoproj/argo-cd/blob/main/applicationset/generators/merge.go#L18-L22), [applicationset/generators/matrix.go:118-120](https://github.com/argoproj/argo-cd/blob/main/applicationset/generators/matrix.go#L118-L120), [applicationset/generators/merge.go:172-174](https://github.com/argoproj/argo-cd/blob/main/applicationset/generators/merge.go#L172-L174)

### Combinatorial Generator Design Trade-Offs

| Design Choice | Benefit | Cost |
| :--- | :--- | :--- |
| **Strict two-generator limit for Matrix** | Keeps combinatorial complexity bounded and simplifies child parameter indexing and variable cross-referencing. | Prevents direct three-way matrix products without nesting multiple ApplicationSets or generators. |
| **JSON-marshaled composite merge keys** | Enables robust multi-key and nested field indexing by serializing extracted merge key maps into canonical JSON strings. | Adds json marshaling overhead for every generated parameter set during merge key indexing. |
| **Bottom-to-top override precedence** | Allows later generators in the array to cleanly override parameters defined by earlier base generators. | Non-matching parameter sets in subsequent generators are silently discarded, which can hide configuration omissions if keys do not align. |

Sources: [docs/operator-manual/applicationset/Generators-Matrix.md:3-4](https://github.com/argoproj/argo-cd/blob/main/docs/operator-manual/applicationset/Generators-Matrix.md#L3-L4), [docs/operator-manual/applicationset/Generators-Matrix.md:357-358](https://github.com/argoproj/argo-cd/blob/main/docs/operator-manual/applicationset/Generators-Matrix.md#L357-L358), [docs/operator-manual/applicationset/Generators-Merge.md:3-4](https://github.com/argoproj/argo-cd/blob/main/docs/operator-manual/applicationset/Generators-Merge.md#L3-L4), [applicationset/generators/merge.go:122-131](https://github.com/argoproj/argo-cd/blob/main/applicationset/generators/merge.go#L122-L131)

## Webhooks and Dynamic Refresh Lifecycle

### Overview

The Webhook subsystem handles incoming webhook payloads from Git and Pull Request providers, evaluating whether registered ApplicationSets require dynamic recalculation. Incoming events are accepted via `Handler()`, parsed based on provider headers (`X-GitHub-Event`, `X-Gitlab-Event`, `X-Vss-Activityid`), and dispatched into a buffered `queue` of size 50,000 processed concurrently by worker pools.

Sources: [applicationset/webhook/webhook.go:33-34](https://github.com/argoproj/argo-cd/blob/main/applicationset/webhook/webhook.go#L33-L34), [applicationset/webhook/webhook.go:161-194](https://github.com/argoproj/argo-cd/blob/main/applicationset/webhook/webhook.go#L161-L194)

### Webhook Execution and Refresh Chain

The event-driven recalculation lifecycle follows a strict execution path from receipt to controller patch:

`Handler()` → `queue` channel → `startWorkerPool()` → `HandleEvent()` → `getGitGeneratorInfo()` / `getPRGeneratorInfo()` → `shouldRefreshMatrixGenerator()` / `shouldRefreshMergeGenerator()` → `refreshApplicationSet()` → `retry.RetryOnConflict()` → client patch with `argocd.argoproj.io/applicationset-refresh` annotation.

Sources: [applicationset/webhook/webhook.go:108-121](https://github.com/argoproj/argo-cd/blob/main/applicationset/webhook/webhook.go#L108-L121), [applicationset/webhook/webhook.go:123-159](https://github.com/argoproj/argo-cd/blob/main/applicationset/webhook/webhook.go#L123-L159), [applicationset/webhook/webhook.go:611-624](https://github.com/argoproj/argo-cd/blob/main/applicationset/webhook/webhook.go#L611-L624)

> [!WARNING]
> If the payload queue reaches its capacity of 50,000 items, `Handler()` immediately discards the incoming webhook payload and returns an HTTP 503 Service Unavailable response.

Sources: [applicationset/webhook/webhook.go:33-33](https://github.com/argoproj/argo-cd/blob/main/applicationset/webhook/webhook.go#L33-L33), [applicationset/webhook/webhook.go:188-194](https://github.com/argoproj/argo-cd/blob/main/applicationset/webhook/webhook.go#L188-L194)

### Webhook Event and Action Filters

Incoming webhook payloads are filtered by allowed action types and matching metadata criteria before triggering ApplicationSet refreshes.

| Provider / Event Type | Allowed Actions / Triggers | Filtering Criteria |
| :--- | :--- | :--- |
| **GitHub Pull Request** | `opened`, `closed`, `synchronize`, `labeled`, `reopened`, `unlabeled` | Owner, repository name (case-insensitive), and API URL regex match. |
| **GitLab Merge Request** | `open`, `close`, `reopen`, `update`, `merge` | Project ID string and API hostname match. |
| **Azure DevOps Pull Request** | `git.pullrequest.created`, `git.pullrequest.merged`, `git.pullrequest.updated` | Project name and repository name exact match. |
| **Git Push Events** | Push ref update | Repository web URL regex match and revision evaluation (`touchedHead`). |

Sources: [applicationset/webhook/webhook.go:202-219](https://github.com/argoproj/argo-cd/blob/main/applicationset/webhook/webhook.go#L202-L219), [applicationset/webhook/webhook.go:290-314](https://github.com/argoproj/argo-cd/blob/main/applicationset/webhook/webhook.go#L290-L314), [applicationset/webhook/webhook.go:358-411](https://github.com/argoproj/argo-cd/blob/main/applicationset/webhook/webhook.go#L358-L411)

## Related

- [[ApplicationSet Controller]]

