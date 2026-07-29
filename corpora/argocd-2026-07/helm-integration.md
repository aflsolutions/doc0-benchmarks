# Helm Integration

<details>
<summary>Relevant source files</summary>

The following files were used as context for generating this wiki page:

- [docs/user-guide/helm.md](https://github.com/argoproj/argo-cd/blob/main/docs/user-guide/helm.md)
- [docs/user-guide/oci.md](https://github.com/argoproj/argo-cd/blob/main/docs/user-guide/oci.md)
- [docs/proposals/native-oci-support.md](https://github.com/argoproj/argo-cd/blob/main/docs/proposals/native-oci-support.md)
- [reposerver/repository/repository.go](https://github.com/argoproj/argo-cd/blob/main/reposerver/repository/repository.go)
</details>

## Overview

Argo CD provides robust native integration with Helm, allowing teams to manage and deploy Helm charts declaratively while handling application lifecycles directly within Argo CD rather than delegating to Helm's own runtime commands. Operating primarily through the `helm template` inflation mechanism on the repository server, Argo CD bridges standard chart packaging with GitOps workflows by supporting advanced discovery, templating, subchart dependency building, custom values file resolution, and strict parameter precedence.

Sources: [docs/user-guide/helm.md:3-6](https://github.com/argoproj/argo-cd/blob/main/docs/user-guide/helm.md#L3-L6), [reposerver/repository/repository.go:1449-1451](https://github.com/argoproj/argo-cd/blob/main/reposerver/repository/repository.go#L1449-L1451)

To accommodate modern distribution standards, the integration includes first-class OCI registry interaction for pulling and extracting charts and artifacts, alongside comprehensive credential management, URL sanitization, and security constraint enforcement across private and public registries.

Sources: [docs/user-guide/oci.md:3-5](https://github.com/argoproj/argo-cd/blob/main/docs/user-guide/oci.md#L3-L5), [reposerver/repository/repository.go:1148-1197](https://github.com/argoproj/argo-cd/blob/main/reposerver/repository/repository.go#L1148-L1197)

## Helm Application Discovery and Templating

### Overview

Argo CD handles Helm chart processing through a structured manifest generation pipeline residing on the repository server. When an application targeting a Helm chart is reconciled, the core service orchestrates retrieval, extraction, and template execution. The invocation flow follows a defined execution path: `Service.GenerateManifest()` → `Service.runRepoOperation()` → `Service.runManifestGen()` / `runManifestGenAsync()` → `GenerateManifests()` → `helmTemplate()`. During execution, the pipeline evaluates app source types, resolves template options, and executes Helm commands to generate Kubernetes manifests.

Sources: [reposerver/repository/repository.go:645-733](https://github.com/argoproj/argo-cd/blob/main/reposerver/repository/repository.go#L645-L733), [reposerver/repository/repository.go:1292-1449](https://github.com/argoproj/argo-cd/blob/main/reposerver/repository/repository.go#L1292-L1449), [reposerver/repository/repository.go:1747-1862](https://github.com/argoproj/argo-cd/blob/main/reposerver/repository/repository.go#L1747-L1862)

### Application Source Type Inspection

Before rendering takes place, Argo CD inspects the repository path and source parameters to determine whether the application utilizes Helm, Kustomize, a custom configuration management plugin, or plain directory files. This check is executed by the `GetAppSourceType` function, which merges local source parameters from `.argocd-source.yaml` files before evaluating the application type.

Sources: [reposerver/repository/repository.go:1957-1980](https://github.com/argoproj/argo-cd/blob/main/reposerver/repository/repository.go#L1957-L1980)

| Source Type Constant | Value | Purpose |
|---|---|---|
| `ApplicationSourceTypeHelm` | `helm` | Inflates Helm charts using `helm template` and template options |
| `ApplicationSourceTypeKustomize` | `kustomize` | Builds manifests using Kustomize binary integrations |
| `ApplicationSourceTypePlugin` | `Plugin` | Delegates generation to config management plugin sidecars |
| `ApplicationSourceTypeDirectory` | `directory` | Discovers and unmarshals raw YAML or JSON files |

Sources: [reposerver/repository/repository.go:1771-1810](https://github.com/argoproj/argo-cd/blob/main/reposerver/repository/repository.go#L1771-L1810)

> [!NOTE]
> `GenerateManifests` applies parameter overrides as a side effect directly on the provided `ApplicationSource` object during type detection and template option assembly.

Sources: [reposerver/repository/repository.go:1746-1761](https://github.com/argoproj/argo-cd/blob/main/reposerver/repository/repository.go#L1746-L1761)

### Template Execution and Fallback Handling

When `helmTemplate` is invoked, it configures `helm.TemplateOpts` using the application release name, namespace, Kubernetes version, API versions, and value files. It then initializes a Helm application client via `helm.NewHelmApp` and executes `h.Template(templateOpts)`. If template execution fails due to a missing chart dependency, Argo CD automatically intercepts the error with `helm.IsMissingDependencyErr`, triggers `runHelmBuild` to execute `helm dependency build`, and retries templating.

Sources: [reposerver/repository/repository.go:1292-1449](https://github.com/argoproj/argo-cd/blob/main/reposerver/repository/repository.go#L1292-L1449)

> [!WARNING]
> If a chart dependency cannot be reached and its repository URL is not permitted by the application's `AppProject`, Argo CD aborts the pipeline and returns a `PermissionDenied` gRPC status error.

Sources: [reposerver/repository/repository.go:1416-1435](https://github.com/argoproj/argo-cd/blob/main/reposerver/repository/repository.go#L1416-L1435)

## Chart Dependency Resolution and Building

### Overview

When Helm charts define subchart dependencies within their `Chart.yaml` specification, the Argo CD repo-server manages dependency discovery, credential mapping, and automated build execution via internal helper functions.

Sources: [reposerver/repository/repository.go:1208-1241](https://github.com/argoproj/argo-cd/blob/main/reposerver/repository/repository.go#L1208-L1241)

### Subchart Discovery and Repository Mapping

The repository server inspects chart metadata and resolves required registries through a dedicated parsing pipeline. The dependency extraction flow proceeds via `getHelmRepos()` → `getHelmDependencyRepos()`, which unmarshals the `Chart.yaml` file to read dependency entries.

Sources: [reposerver/repository/repository.go:1142-1197](https://github.com/argoproj/argo-cd/blob/main/reposerver/repository/repository.go#L1142-L1197), [reposerver/repository/repository.go:1208-1241](https://github.com/argoproj/argo-cd/blob/main/reposerver/repository/repository.go#L1208-L1241)

| Repository Prefix / Format | Parsing Action |
|---|---|
| `@` prefix | Strips the prefix to map a local or named repository reference (e.g. `@repoName`) |
| `alias:` prefix | Extracts the alias suffix as the target repository identifier |
| `https://` or `oci://` schemes | Parses the URL, strips any `oci://` scheme prefix, and registers the source with OCI enablement flags |

Sources: [reposerver/repository/repository.go:1220-1238](https://github.com/argoproj/argo-cd/blob/main/reposerver/repository/repository.go#L1220-L1238)

### Automated Dependency Builds

When template execution encounters missing subchart dependencies, Argo CD triggers an automated build sequence. The build execution flow operates through `runHelmBuild()` → `manifestGenerateLock.Lock()` → `h.DependencyBuild(ctx)`, which invokes Helm's dependency build command safely across concurrent threads.

Sources: [reposerver/repository/repository.go:1251-1271](https://github.com/argoproj/argo-cd/blob/main/reposerver/repository/repository.go#L1251-L1271)

> [!TIP]
> `runHelmBuild` utilizes a marker file named `.argocd-helm-dep-up` (`helmDepUpMarkerFile`) inside the application path. Once `helm dependency build` executes successfully, the marker file is written with root permissions (`0o644`) to prevent redundant builds during concurrent reconciliation requests for the same commit. This marker file is automatically cleaned up when repositories are re-initialized or switched to a different revision.

Sources: [reposerver/repository/repository.go:78-85](https://github.com/argoproj/argo-cd/blob/main/reposerver/repository/repository.go#L78-L85), [reposerver/repository/repository.go:1251-1271](https://github.com/argoproj/argo-cd/blob/main/reposerver/repository/repository.go#L1251-L1271)

## Custom Values Files and Parameter Resolution

### Overview

Custom values files and parameter overrides are processed by the repo-server to customize Helm chart rendering. The resolution engine locates, validates, and merges values from diverse inputs—including explicit local paths, external Git repositories referenced via `ref`, glob patterns, inline `valuesObject` definitions, and command-line style `-p` parameters.

Sources: [reposerver/repository/repository.go:1468-1581](https://github.com/argoproj/argo-cd/blob/main/reposerver/repository/repository.go#L1468-L1581)

### Values File Resolution and Glob Expansion

The values file resolution pipeline executes through `helmTemplate()` → `getResolvedValueFiles()`. First, explicit (non-glob) value files are evaluated and stored in an `explicitPaths` map. Then, the engine iterates over raw value file entries, resolves paths against local directories or referenced external repository paths, and expands any glob patterns using the `doublestar.FilepathGlob` library.

Sources: [reposerver/repository/repository.go:1328-1331](https://github.com/argoproj/argo-cd/blob/main/reposerver/repository/repository.go#L1328-L1331), [reposerver/repository/repository.go:1468-1581](https://github.com/argoproj/argo-cd/blob/main/reposerver/repository/repository.go#L1468-L1581)

| Resolution Phase | Function Call / Component | Operation Performed |
|---|---|---|
| Explicit Collection | `getResolvedValueFiles` loop | Pre-collects non-glob resolved paths into `explicitPaths` to ensure explicit declarations override glob positions |
| Glob Expansion | `doublestar.FilepathGlob()` | Expands glob patterns (`*`, `?`, `[`, `**`) in lexical order for local files |
| Root Boundary Verification | `verifyGlobMatchesWithinRoot()` | Resolves symlinks via `filepath.EvalSymlinks()` and verifies matches remain inside `effectiveRoot` |
| Unique Appending | `appendUnique()` | Deduplicates paths, skipping files already captured by explicit entries |

Sources: [reposerver/repository/repository.go:1468-1581](https://github.com/argoproj/argo-cd/blob/main/reposerver/repository/repository.go#L1468-L1581)

> [!WARNING]
> When `ignoreMissingValueFiles` is set to `false`, a glob pattern matching zero files results in a `GlobNoMatchError`, placing the Application in a degraded `ComparisonError` state. Setting `ignoreMissingValueFiles: true` allows Argo CD to skip missing files or empty glob expansions silently.

Sources: [docs/user-guide/helm.md:301-327](https://github.com/argoproj/argo-cd/blob/main/docs/user-guide/helm.md#L301-L327), [reposerver/repository/repository.go:1548-1554](https://github.com/argoproj/argo-cd/blob/main/reposerver/repository/repository.go#L1548-L1554)

### Parameter and Values Object Resolution

Inline values defined under `source.helm.values` or `source.helm.valuesObject` are serialized into a temporary file written via `os.WriteFile()` and passed to Helm as an extra values path (`templateOpts.ExtraValues`). Parameter overrides specified under `source.helm.parameters` are populated into `templateOpts.Set` or `templateOpts.SetString` depending on the `forceString` boolean flag.

Sources: [reposerver/repository/repository.go:1335-1360](https://github.com/argoproj/argo-cd/blob/main/reposerver/repository/repository.go#L1335-L1360)

> [!NOTE]
> Helm value precedence strictly follows the hierarchy: `parameters > valuesObject > values > valueFiles > helm repository values.yaml`. Later entries in `valueFiles` take precedence over earlier entries.

Sources: [docs/user-guide/helm.md:398-433](https://github.com/argoproj/argo-cd/blob/main/docs/user-guide/helm.md#L398-L433)

## OCI Registry Integration and Client Management

### OCI Registry Interaction and Client Management

Argo CD provides first-class support for OCI (Open Container Initiative) registries, allowing artifacts, Helm charts, and raw manifest bundles stored as OCI images to be consumed directly as application sources. The core repository server integrates OCI capabilities through dedicated client factories, standard client configuration options, and robust extraction and metadata caching mechanisms.

Sources: [docs/user-guide/oci.md:3-5](https://github.com/argoproj/argo-cd/blob/main/docs/user-guide/oci.md#L3-L5), [reposerver/repository/repository.go:3623-3632](https://github.com/argoproj/argo-cd/blob/main/reposerver/repository/repository.go#L3623-L3632)

### Client Initialization and Standard Options

The repository service initializes OCI clients using the configured `newOCIClient` function pointer. Standard OCI client behavior is governed by `ociClientStandardOpts()`, which configures caching, path storage, security boundaries, and metrics collection.

The following options are applied when initializing standard OCI clients:

| OCI Client Option | Source Function / Constant | Purpose / Configuration |
|---|---|---|
| Index Cache | `oci.WithIndexCache(s.cache)` | Caches OCI registry indices and tag lists within the Argo CD repo-server cache instance |
| Image Paths | `oci.WithImagePaths(s.ociPaths)` | Configures randomized temporary storage paths for extracted OCI artifacts |
| Max Extracted Size | `oci.WithManifestMaxExtractedSize(s.initConstants.OCIManifestMaxExtractedSize)` | Restricts the maximum permitted size of extracted OCI layers to prevent resource exhaustion |
| Disable Max Size | `oci.WithDisableManifestMaxExtractedSize(s.initConstants.DisableOCIManifestMaxExtractedSize)` | Allows disabling the extracted size limit when explicitly configured |
| Event Handlers | `oci.WithEventHandlers(metrics.NewOCIClientEventHandlers(s.metricsServer))` | Registers telemetry and metrics event handlers for OCI client operations |

Sources: [reposerver/repository/repository.go:3623-3632](https://github.com/argoproj/argo-cd/blob/main/reposerver/repository/repository.go#L3623-L3632)

### Revision Resolution and Extraction Call Chain

When processing an OCI-backed application source, `runRepoOperation` executes a distinct call chain to resolve revisions, clean cache state, extract image layers, and perform safety validations before running manifest generation.

The call-chain execution walkthrough proceeds as follows:
`runRepoOperation()` → `s.newOCIClientResolveRevision()` → `ociClient.ResolveRevision()` → `ociClient.Extract()` → `s.checkOutOfBoundsSymlinks()` → `apppathutil.Path()`

During this sequence, `newOCIClientResolveRevision()` initializes the OCI client and resolves the target revision or digest. If `noCache` is enabled, `ociClient.CleanCache(revision)` is invoked before `ociClient.Extract(ctx, revision)` expands the OCI layer into a temporary directory.

Sources: [reposerver/repository/repository.go:372-373](https://github.com/argoproj/argo-cd/blob/main/reposerver/repository/repository.go#L372-L373), [reposerver/repository/repository.go:408-446](https://github.com/argoproj/argo-cd/blob/main/reposerver/repository/repository.go#L408-L446), [reposerver/repository/repository.go:2920-2932](https://github.com/argoproj/argo-cd/blob/main/reposerver/repository/repository.go#L2920-L2932)

> [!WARNING]
> Extracted OCI images undergo strict out-of-bounds symlink validation via `s.checkOutOfBoundsSymlinks()`. If an artifact contains symlinks pointing outside the extraction root, Argo CD logs a high-severity security warning (`common.SecurityHigh`) and rejects the image with an explicit traversal error.

Sources: [reposerver/repository/repository.go:422-437](https://github.com/argoproj/argo-cd/blob/main/reposerver/repository/repository.go#L422-L437)

### Metadata Annotations and Caching

Argo CD extracts standard OCI metadata annotations through `GetOCIMetadata()`, which queries the OCI client for digest metadata and maps standard OpenContainer annotations into the internal `v1alpha1.OCIMetadata` structure. Results are stored in the repo-server cache to avoid repeated registry round-trips.

| OCI Annotation Key | Mapped Struct Field | Description |
|---|---|---|
| `org.opencontainers.image.created` | `CreatedAt` | Timestamp when the OCI artifact was created |
| `org.opencontainers.image.authors` | `Authors` | Contact details of the artifact author |
| `org.opencontainers.image.documentation` | `DocsURL` | URL to documentation for the OCI artifact |
| `org.opencontainers.image.source` | `SourceURL` | Source code repository URL for the artifact |
| `org.opencontainers.image.version` | `Version` | Application or artifact version identifier |
| `org.opencontainers.image.description` | `Description` | Human-readable description of the OCI content |

Sources: [docs/user-guide/oci.md:141-149](https://github.com/argoproj/argo-cd/blob/main/docs/user-guide/oci.md#L141-L149), [reposerver/repository/repository.go:2834-2844](https://github.com/argoproj/argo-cd/blob/main/reposerver/repository/repository.go#L2834-L2844)

## Helm Repository Credentials and Security

### Overview

Managing Helm repository credentials and enforcing security constraints involves credential matching algorithms, URL sanitization, and project-level permission validation during manifest generation. Argo CD inspects Helm chart dependencies defined in `Chart.yaml` and resolves corresponding authentication credentials across configured repository definitions and credential stores.

Sources: [docs/user-guide/helm.md:712-729](https://github.com/argoproj/argo-cd/blob/main/docs/user-guide/helm.md#L712-L729), [reposerver/repository/repository.go:1142-1198](https://github.com/argoproj/argo-cd/blob/main/reposerver/repository/repository.go#L1142-L1198)

### Credential Matching and Retrieval Call Chain

When gathering Helm repositories via `getHelmRepos()`, Argo CD resolves credentials using a specific precedence order across global configurations and dependency definitions.

The call-chain execution walkthrough proceeds as follows:
`getHelmRepos()` → `getHelmDependencyRepos()` → `getRepoCredential()` → repository credential store matching → OCI hostname fallback matching.

During this sequence, `getHelmDependencyRepos()` parses `Chart.yaml` to extract declared dependency repositories. Next, `getHelmRepos()` iterates through each dependency, attempting an exact match against configured repositories by URL or name. If no direct match exists, `getRepoCredential()` queries the provided Helm repository credentials list. If the repository utilizes OCI, Argo CD falls back to matching credentials by hostname prefix when no exact match is found.

Sources: [reposerver/repository/repository.go:1142-1198](https://github.com/argoproj/argo-cd/blob/main/reposerver/repository/repository.go#L1142-L1198), [reposerver/repository/repository.go:1208-1241](https://github.com/argoproj/argo-cd/blob/main/reposerver/repository/repository.go#L1208-L1241), [reposerver/repository/repository.go:1635-1647](https://github.com/argoproj/argo-cd/blob/main/reposerver/repository/repository.go#L1635-L1647)

> [!WARNING]
> When overriding Helm release names using `releaseName` or CLI flags, Argo CD injects the Application name into the `app.kubernetes.io/instance` label for tracking purposes. Overriding the release name causes the Application name to diverge from the release name, which can break resource selectors unless `application.instanceLabelKey` is adjusted in `argocd-cm.yaml`.

Sources: [docs/user-guide/helm.md:479-500](https://github.com/argoproj/argo-cd/blob/main/docs/user-guide/helm.md#L479-L500)

### URL Sanitization and Security Enforcement

To protect sensitive information in logs and trace data, Argo CD sanitizes repository URLs and file paths before recording telemetry. The repository server creates sanitized log attributes using `git.SanitizeRepoURL()` and filters randomized temporary directory paths via `redactPaths()`.

Sources: [reposerver/repository/repository.go:645-657](https://github.com/argoproj/argo-cd/blob/main/reposerver/repository/repository.go#L645-L657), [reposerver/repository/repository.go:1454-1466](https://github.com/argoproj/argo-cd/blob/main/reposerver/repository/repository.go#L1454-L1466)

When a Helm chart dependency download fails due to reachability or missing permissions, `helmTemplate()` validates whether the repository is permitted by the application's associated `AppProject`.

```go
if (chartCannotBeReached || couldNotDownloadChart) && !isSourcePermitted(repo.Repo, q.ProjectSourceRepos) {
    reposNotPermitted = append(reposNotPermitted, repo.Repo)
}
```

If unauthorized repositories are detected, Argo CD aborts template execution and returns a gRPC `PermissionDenied` status code indicating that the Helm repositories are not permitted in the project.

Sources: [reposerver/repository/repository.go:1418-1435](https://github.com/argoproj/argo-cd/blob/main/reposerver/repository/repository.go#L1418-L1435)

## Related

- [[Repo Server Architecture]]
- [[Kustomize and Jsonnet]]

