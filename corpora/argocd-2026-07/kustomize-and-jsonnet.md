# Kustomize and Jsonnet

<details>
<summary>Relevant source files</summary>

The following files were used as context for generating this wiki page:

- [reposerver/repository/repository.go](https://github.com/argoproj/argo-cd/blob/main/reposerver/repository/repository.go)
- [controller/state.go](https://github.com/argoproj/argo-cd/blob/main/controller/state.go)
</details>

## Overview

Kustomize and Jsonnet serve as built-in declarative configuration generation engines within Argo CD, transforming raw template sources and overlays into standard Kubernetes manifests. Operating on the repository server side via gRPC and internal methods, this subsystem discovers application configurations, resolves path and binary settings, evaluates templates against customizable environments, and splits raw output streams into structured unstructured objects for downstream synchronization.

Sources: [reposerver/repository/repository.go:1758-1811](https://github.com/argoproj/argo-cd/blob/main/reposerver/repository/repository.go#L1758-L1811), [controller/state.go:228-232](https://github.com/argoproj/argo-cd/blob/main/controller/state.go#L228-L232)

By delegating template compilation and rendering to the repo-server before the application controller compares desired and live states, Argo CD decouples compute-heavy manifest generation from core reconciliation loops. Key design decisions include enforcing strict path traversal safeguards, caching generated responses to prevent redundant builds, and injecting runtime environment variables and external arguments directly into execution VMs and binary tools.

Sources: [reposerver/repository/repository.go:645-733](https://github.com/argoproj/argo-cd/blob/main/reposerver/repository/repository.go#L645-L733), [reposerver/repository/repository.go:2269-2307](https://github.com/argoproj/argo-cd/blob/main/reposerver/repository/repository.go#L2269-L2307)

## Repository Manifest Generation API Surface

### Overview

The repository manifest generation API surface provides the core gRPC endpoints and internal methods utilized by Argo CD to request, coordinate, and cache manifest generation across Kustomize, Jsonnet, Helm, directory, and plugin-based applications. Serving requests from the application controller or client interfaces, the repo-server manages repository checkouts, concurrency throttling via weighted semaphores, environment variable construction, and result caching.

Sources: [reposerver/repository/repository.go:91-111](https://github.com/argoproj/argo-cd/blob/main/reposerver/repository/repository.go#L91-L111), [reposerver/repository/repository.go:645-733](https://github.com/argoproj/argo-cd/blob/main/reposerver/repository/repository.go#L645-L733)

### Core Manifest Generation Methods

The `Service` struct implements manifest generation through several primary gRPC methods and asynchronous workers. When `GenerateManifest` is invoked via gRPC, it initiates tracing via OpenTelemetry, validates multi-source and reference configurations, and delegates execution through `runRepoOperation` and `runManifestGen`.

```go
func (s *Service) GenerateManifest(ctx context.Context, q *apiclient.ManifestRequest) (res *apiclient.ManifestResponse, retErr error)
```

Sources: [reposerver/repository/repository.go:645-660](https://github.com/argoproj/argo-cd/blob/main/reposerver/repository/repository.go#L645-L660)

The following sequence details the call-chain execution flow during an incoming manifest generation request:
`GenerateManifest()` → `runRepoOperation()` → `runManifestGen()` → `runManifestGenAsync()` → `GenerateManifests()`

1. **`GenerateManifest()`**: Starts an OpenTelemetry tracing span (`reposerver.GenerateManifest`), sets application attributes (`argocd.app.name`, `argocd.revision`), checks for ref-only sources, and sets up cache and execution operations. Sources: [reposerver/repository/repository.go:645-711](https://github.com/argoproj/argo-cd/blob/main/reposerver/repository/repository.go#L645-L711)
2. **`runRepoOperation()`**: Resolves revisions (Git, OCI, or Helm), checks cache entries, acquires parallelism limit semaphores (`settings.sem.Acquire`), extracts or checks out repository paths, and executes the operation callback. Sources: [reposerver/repository/repository.go:346-561](https://github.com/argoproj/argo-cd/blob/main/reposerver/repository/repository.go#L346-L561)
3. **`runManifestGen()`**: Instantiates communication channels (`responseCh`, `tarDoneCh`, `errCh`) inside a `ManifestResponsePromise` and spawns `runManifestGenAsync` as a background goroutine. Sources: [reposerver/repository/repository.go:826-839](https://github.com/argoproj/argo-cd/blob/main/reposerver/repository/repository.go#L826-L839)
4. **`runManifestGenAsync()`**: Handles multi-source reference checkouts, invokes `GenerateManifests`, computes cache keys via `getManifestCacheKey()`, and persists successful responses or consecutive generation errors in the cache. Sources: [reposerver/repository/repository.go:850-1032](https://github.com/argoproj/argo-cd/blob/main/reposerver/repository/repository.go#L850-L1032)
5. **`GenerateManifests()`**: Evaluates the application source type (Helm, Kustomize, Plugin, or Directory), builds target objects, sets resource tracking labels (`argo.NewResourceTracking()`), and marshals outputs into unstructured JSON strings. Sources: [reposerver/repository/repository.go:1747-1862](https://github.com/argoproj/argo-cd/blob/main/reposerver/repository/repository.go#L1747-L1862)

> [!NOTE]
> During multi-source manifest generation, `runManifestGenAsync` iterates over reference sources and validates that multiple revisions are not referenced for the same repository URL concurrently, returning an explicit error if a conflict is detected.

Sources: [reposerver/repository/repository.go:899-903](https://github.com/argoproj/argo-cd/blob/main/reposerver/repository/repository.go#L899-L903)

### API Request and Response Structures

The repository service processes requests containing application definitions, source configurations, and cluster parameters. The input query fields and output response metrics govern how manifests are retrieved, cached, and rendered.

| Field / Parameter | Type | Purpose |
| :--- | :--- | :--- |
| `Repo` | `*v1alpha1.Repository` | Repository target configuration containing credentials and URL |
| `ApplicationSource` | `*v1alpha1.ApplicationSource` | Source details specifying path, chart, target revision, and tool options |
| `Revision` | `string` | Resolved or unresolved Git revision, tag, branch, or OCI digest |
| `NoCache` | `bool` | Bypasses cached manifest responses when set to true |
| `NoRevisionCache` | `bool` | Disables caching during Git revision resolution |
| `HasMultipleSources` | `bool` | Indicates whether the application utilizes multi-source definitions |

Sources: [reposerver/repository/repository.go:710-711](https://github.com/argoproj/argo-cd/blob/main/reposerver/repository/repository.go#L710-L711), [controller/state.go:394-414](https://github.com/argoproj/argo-cd/blob/main/controller/state.go#L394-L414)

> [!WARNING]
> If manifest error caching is enabled (`PauseGenerationAfterFailedGenerationAttempts > 0`), consecutive failures are tracked with `FirstFailureTimestamp` and `NumberOfConsecutiveFailures`, causing subsequent requests to serve cached error responses until the failure grace period or request threshold expires.

Sources: [reposerver/repository/repository.go:977-1001](https://github.com/argoproj/argo-cd/blob/main/reposerver/repository/repository.go#L977-L1001)

### Environment Variable Injection

When rendering manifests for Kustomize or Jsonnet applications, `newEnv` injects standard execution environment variables representing the application context. These variables are accessible during template evaluation and script execution.

```go
func newEnv(q *apiclient.ManifestRequest, revision string) *v1alpha1.Env {
	shortRevision := shortenRevision(revision, 7)
	shortRevision8 := shortenRevision(revision, 8)
	return &v1alpha1.Env{
		&v1alpha1.EnvEntry{Name: "ARGOCD_APP_NAME", Value: q.AppName},
		&v1alpha1.EnvEntry{Name: "ARGOCD_APP_NAMESPACE", Value: q.Namespace},
		&v1alpha1.EnvEntry{Name: "ARGOCD_APP_PROJECT_NAME", Value: q.ProjectName},
		&v1alpha1.EnvEntry{Name: "ARGOCD_APP_REVISION", Value: revision},
		&v1alpha1.EnvEntry{Name: "ARGOCD_APP_REVISION_SHORT", Value: shortRevision},
		&v1alpha1.EnvEntry{Name: "ARGOCD_APP_REVISION_SHORT_8", Value: shortRevision8},
		&v1alpha1.EnvEntry{Name: "ARGOCD_APP_SOURCE_REPO_URL", Value: q.Repo.Repo},
		&v1alpha1.EnvEntry{Name: "ARGOCD_APP_SOURCE_PATH", Value: q.ApplicationSource.Path},
		&v1alpha1.EnvEntry{Name: "ARGOCD_APP_SOURCE_TARGET_REVISION", Value: q.ApplicationSource.TargetRevision},
	}
}
```

Sources: [reposerver/repository/repository.go:1864-1878](https://github.com/argoproj/argo-cd/blob/main/reposerver/repository/repository.go#L1864-L1878)

## Kustomize Application Discovery and Build Process

### Overview

The Kustomize application build workflow processes targeted repository paths by identifying the correct Kustomize binary path, establishing environment contexts, parsing API and Kubernetes target versions, and invoking the Kustomize build runner. Within `GenerateManifests`, when the source type resolves to `ApplicationSourceTypeKustomize`, the system queries binary options and triggers an execution sequence to compile unstructured objects.

Sources: [reposerver/repository/repository.go:1775-1793](https://github.com/argoproj/argo-cd/blob/main/reposerver/repository/repository.go#L1775-L1793)

### Kustomize Build Call Chain

The execution sequence flows through core configuration and builder functions to prepare and evaluate manifests:

`GenerateManifests()` → `settings.GetKustomizeBinaryPath()` → `parseKubeVersion()` → `kustomize.NewKustomizeApp()` → `k.Build()`

1. **`GenerateManifests()`**: Intercepts the manifest generation request, identifies the Kustomize source type, and initiates binary resolution. Sources: [reposerver/repository/repository.go:1775-1780](https://github.com/argoproj/argo-cd/blob/main/reposerver/repository/repository.go#L1775-L1780)
2. **`settings.GetKustomizeBinaryPath()`**: Evaluates application-level Kustomize options and source overrides to determine the correct executable binary path. Sources: [reposerver/repository/repository.go:1776-1780](https://github.com/argoproj/argo-cd/blob/main/reposerver/repository/repository.go#L1776-L1780)
3. **`parseKubeVersion()`**: Normalizes cluster version strings into semantic specifications using `k8sversion.ParseGeneric`. Sources: [reposerver/repository/repository.go:1781-1785](https://github.com/argoproj/argo-cd/blob/main/reposerver/repository/repository.go#L1781-L1785)
4. **`kustomize.NewKustomizeApp()`**: Instantiates the Kustomize application runner passing the repository root, application path, git credentials, repository URL, binary path, proxy settings, and no-proxy configs. Sources: [reposerver/repository/repository.go:1786-1786](https://github.com/argoproj/argo-cd/blob/main/reposerver/repository/repository.go#L1786-L1786)
5. **`k.Build()`**: Executes the Kustomize build process using `q.ApplicationSource.Kustomize`, build options, and environment variables. Sources: [reposerver/repository/repository.go:1787-1790](https://github.com/argoproj/argo-cd/blob/main/reposerver/repository/repository.go#L1787-L1790)

> [!NOTE]
> During Kustomize app details population (`populateKustomizeAppDetails`), a fake manifest request is instantiated with empty namespace properties to query image specifications without affecting active cluster deployments.

Sources: [reposerver/repository/repository.go:2666-2678](https://github.com/argoproj/argo-cd/blob/main/reposerver/repository/repository.go#L2666-L2678)

### Kustomize Execution Parameters

The build invocation structures execution options and binary paths according to the parameters defined in the request and settings manager:

| Field / Parameter | Source Function | Purpose |
| :--- | :--- | :--- |
| `kustomizeBinary` | `settings.GetKustomizeBinaryPath` | Resolves the specific Kustomize binary path based on version mapping or global settings |
| `kubeVersion` | `parseKubeVersion` | Parses and validates Kubernetes server version constraints for compatibility checks |
| `BuildOpts` | `k.Build` | Passes `KubeVersion` and `APIVersions` into the Kustomize build context |
| `env` | `newEnv` | Provides standard environment variables including application name, namespace, project name, and revision details |

Sources: [reposerver/repository/repository.go:1776-1790](https://github.com/argoproj/argo-cd/blob/main/reposerver/repository/repository.go#L1776-L1790), [reposerver/repository/repository.go:1864-1877](https://github.com/argoproj/argo-cd/blob/main/reposerver/repository/repository.go#L1864-L1877)

> [!WARNING]
> Failing to parse the Kubernetes version string via `parseKubeVersion` during Kustomize manifest generation immediately aborts the build process and returns an error.

Sources: [reposerver/repository/repository.go:1781-1785](https://github.com/argoproj/argo-cd/blob/main/reposerver/repository/repository.go#L1781-L1785)

### Kustomize App Details Population

When retrieving application metadata via `GetAppDetails`, Kustomize processing invokes `populateKustomizeAppDetails` to inspect container image declarations.

```go
func populateKustomizeAppDetails(res *apiclient.RepoAppDetailsResponse, q *apiclient.RepoServerAppDetailsQuery, repoRoot string, appPath string, reversion string, credsStore git.CredsStore) error {
	res.Kustomize = &apiclient.KustomizeAppSpec{}
	kustomizeBinary, err := settings.GetKustomizeBinaryPath(q.KustomizeOptions, *q.Source)
	if err != nil {
		return fmt.Errorf("failed to get kustomize binary path: %w", err)
	}
	k := kustomize.NewKustomizeApp(repoRoot, appPath, q.Repo.GetGitCreds(credsStore), q.Repo.Repo, kustomizeBinary, q.Repo.Proxy, q.Repo.NoProxy)
	fakeManifestRequest := apiclient.ManifestRequest{
		AppName:           q.AppName,
		Namespace:         "",
		Repo:              q.Repo,
		ApplicationSource: q.Source,
	}
	env := newEnv(&fakeManifestRequest, reversion)
	_, images, _, err := k.Build(q.Source.Kustomize, q.KustomizeOptions, env, nil)
	if err != nil {
		return err
	}
	res.Kustomize.Images = images
	return nil
}
```

Sources: [reposerver/repository/repository.go:2659-2679](https://github.com/argoproj/argo-cd/blob/main/reposerver/repository/repository.go#L2659-L2679)

## Jsonnet Template Evaluation and VM Initialization

### Overview

When directory-based manifest generation encounters files ending with the `.jsonnet` extension, Argo CD delegates rendering to `makeJsonnetVM` to initialize a Google Jsonnet virtual machine instance, inject environment-substituted variables and top-level arguments, and evaluate the source file. Sources: [reposerver/repository/repository.go:2018-2029](https://github.com/argoproj/argo-cd/blob/main/reposerver/repository/repository.go#L2018-L2029), [reposerver/repository/repository.go:2269-2308](https://github.com/argoproj/argo-cd/blob/main/reposerver/repository/repository.go#L2269-L2308)

### Jsonnet VM Initialization and Call Chain

The execution sequence for setting up and evaluating Jsonnet manifests flows through dedicated initialization and evaluation helpers:

`findManifests()` → `makeJsonnetVM()` → `jsonnet.MakeVM()` → `vm.TLAVar()` / `vm.TLACode()` / `vm.ExtVar()` / `vm.ExtCode()` → `vm.Importer()` → `vm.EvaluateFile()`

Sources: [reposerver/repository/repository.go:2022-2026](https://github.com/argoproj/argo-cd/blob/main/reposerver/repository/repository.go#L2022-L2026), [reposerver/repository/repository.go:2270-2305](https://github.com/argoproj/argo-cd/blob/main/reposerver/repository/repository.go#L2270-L2305)

1. **`makeJsonnetVM`**: Instantiates a fresh VM via `jsonnet.MakeVM()` and processes Top-Level Arguments (`TLAs`) and External Variables (`ExtVars`) by applying environment substitution (`env.Envsubst`) to their string values. Sources: [reposerver/repository/repository.go:2270-2276](https://github.com/argoproj/argo-cd/blob/main/reposerver/repository/repository.go#L2270-L2276)
2. **Variable Injection**: Iterates through each argument or external variable definition. If the `Code` boolean property is set, it registers them using `vm.TLACode()` or `vm.ExtCode()`; otherwise, it injects them as standard literal values via `vm.TLAVar()` or `vm.ExtVar()`. Sources: [reposerver/repository/repository.go:2277-2290](https://github.com/argoproj/argo-cd/blob/main/reposerver/repository/repository.go#L2277-L2290)
3. **Import Path Resolution**: Configures search directories for imports (`jpaths`), starting with the application path (`appPath`) and appending any configured library paths (`Libs`) resolved relative to the repository root (`repoRoot`) using `pathutil.ResolveFileOrDirectoryPath()`. Sources: [reposerver/repository/repository.go:2292-2301](https://github.com/argoproj/argo-cd/blob/main/reposerver/repository/repository.go#L2292-L2301)
4. **File Importer**: Sets up a `jsonnet.FileImporter` containing the compiled import search paths (`JPaths`) and returns the initialized virtual machine. Sources: [reposerver/repository/repository.go:2303-2307](https://github.com/argoproj/argo-cd/blob/main/reposerver/repository/repository.go#L2303-L2307)
5. **Evaluation**: Invokes `vm.EvaluateFile(manifestPath)` on the target `.jsonnet` file to produce a rendered JSON string, which is subsequently unmarshaled into unstructured Kubernetes resource objects or arrays. Sources: [reposerver/repository/repository.go:2026-2043](https://github.com/argoproj/argo-cd/blob/main/reposerver/repository/repository.go#L2026-L2043)

> [!NOTE]
> File size validation during directory walking explicitly excludes `.jsonnet` files from the combined manifest size counter (`maxCombinedManifestQuantity`), placing memory management responsibility entirely on the Jsonnet execution engine.

Sources: [reposerver/repository/repository.go:2249-2257](https://github.com/argoproj/argo-cd/blob/main/reposerver/repository/repository.go#L2249-L2257)

### Jsonnet Configuration Options

| Parameter / Field | Source Struct / Type | Purpose |
| :--- | :--- | :--- |
| `TLAs` | `v1alpha1.ApplicationSourceJsonnet` | Top-level arguments passed into the Jsonnet template, supporting code or string values |
| `ExtVars` | `v1alpha1.ApplicationSourceJsonnet` | External variables injected into the virtual machine environment |
| `Libs` | `v1alpha1.ApplicationSourceJsonnet` | Additional library search paths resolved relative to the repository root |
| `JPaths` | `jsonnet.FileImporter` | Collection of directory paths permitted for Jsonnet `import` statements |

Sources: [reposerver/repository/repository.go:2271-2305](https://github.com/argoproj/argo-cd/blob/main/reposerver/repository/repository.go#L2271-L2305)

## Manifest Parsing and YAML Structured Deserialization

### Overview

Manifest parsing and structural deserialization convert raw output streams and files into Kubernetes unstructured resource objects. The repository server processes YAML and JSON files through stream-oriented decoders, handles resource lists, and enforces object-level normalization.

Sources: [reposerver/repository/repository.go:1817-1855](https://github.com/argoproj/argo-cd/blob/main/reposerver/repository/repository.go#L1817-L1855), [reposerver/repository/repository.go:2120-2137](https://github.com/argoproj/argo-cd/blob/main/reposerver/repository/repository.go#L2120-L2137)

### Deserialization Call Chain

The processing flow for raw manifest text into structured resources proceeds through specific parser functions:

`findManifests()` → `getObjsFromYAMLOrJSON()` → `splitYAMLOrJSON()` → `kubeyaml.NewYAMLOrJSONDecoder()` → `d.Decode()` → `unstructured.Unstructured`

Sources: [reposerver/repository/repository.go:2045-2049](https://github.com/argoproj/argo-cd/blob/main/reposerver/repository/repository.go#L2045-L2049), [reposerver/repository/repository.go:2120-2137](https://github.com/argoproj/argo-cd/blob/main/reposerver/repository/repository.go#L2120-L2137)

1. **`findManifests`**: Iterates through discovered valid manifest entries, identifying files by extension and routing `.jsonnet` files to the Jsonnet VM or falling back to `getObjsFromYAMLOrJSON()` for YAML and JSON sources. Sources: [reposerver/repository/repository.go:2014-2050](https://github.com/argoproj/argo-cd/blob/main/reposerver/repository/repository.go#L2014-L2050)
2. **`getObjsFromYAMLOrJSON`**: Opens file readers using UTF-8 utilities (`utfutil.OpenFile`), decoding individual JSON files or dispatching multi-document files to stream splitters. Sources: [reposerver/repository/repository.go:2055-2114](https://github.com/argoproj/argo-cd/blob/main/reposerver/repository/repository.go#L2055-L2114)
3. **`splitYAMLOrJSON`**: Instantiates a Kubernetes YAML-or-JSON decoder via `kubeyaml.NewYAMLOrJSONDecoder(reader, 4096)` and reads documents iteratively until `io.EOF`. Sources: [reposerver/repository/repository.go:2120-2137](https://github.com/argoproj/argo-cd/blob/main/reposerver/repository/repository.go#L2120-L2137)
4. **List Expansion**: In `GenerateManifests`, parsed objects are inspected for list structures via `obj.IsList()` or `isNullList(obj)`, unpacking individual list items into individual target unstructured objects. Sources: [reposerver/repository/repository.go:1822-1840](https://github.com/argoproj/argo-cd/blob/main/reposerver/repository/repository.go#L1822-L1840)

> [!WARNING]
> When `splitYAMLOrJSON` encounters decoding errors mid-stream, it returns all objects successfully read up to the point of failure along with the formatting error, allowing partial diagnostics.

Sources: [reposerver/repository/repository.go:2118-2137](https://github.com/argoproj/argo-cd/blob/main/reposerver/repository/repository.go#L2118-L2137)

### Deserialization Utilities and Handlers

| Helper Function | Input Type | Output Type | Description |
| :--- | :--- | :--- | :--- |
| `splitYAMLOrJSON` | `goio.Reader` | `([]*unstructured.Unstructured, error)` | Streams documents from a reader using Kubernetes YAML/JSON decoders. |
| `isNullList` | `*unstructured.Unstructured` | `bool` | Detects list kinds where the `items` field evaluates explicitly to `null`. |
| `unmarshalManifests` | `[]string` | `([]*unstructured.Unstructured, error)` | Unmarshals serialized JSON manifest strings back into unstructured objects. |

Sources: [reposerver/repository/repository.go:1988-2000](https://github.com/argoproj/argo-cd/blob/main/reposerver/repository/repository.go#L1988-L2000), [reposerver/repository/repository.go:2120-2137](https://github.com/argoproj/argo-cd/blob/main/reposerver/repository/repository.go#L2120-L2137), [reposerver/repository/repository.go:560-570](https://github.com/argoproj/argo-cd/blob/main/reposerver/repository/repository.go#L560-L570)

## Controller Integration and State Comparison Sync

### Overview

Retrieving generated objects from the repository server and synchronizing evaluated application states are handled centrally by the application controller's state manager. The controller bridges declarative source configurations (including Kustomize, Jsonnet, and multi-source setups) with the live Kubernetes cluster state by requesting manifests, normalising target objects, tracking resource ownership, and driving reconciliation results.

Sources: [controller/state.go:94-100](https://github.com/argoproj/argo-cd/blob/main/controller/state.go#L94-L100), [controller/state.go:228-233](https://github.com/argoproj/argo-cd/blob/main/controller/state.go#L228-L233), [controller/state.go:677-684](https://github.com/argoproj/argo-cd/blob/main/controller/state.go#L677-L684)

### State Comparison and Manifest Retrieval Call Chain

The reconciliation pipeline coordinates manifest retrieval and state evaluation through the primary methods defined on the `appStateManager` interface:

`CompareAppState()` → `GetRepoObjs()` → `evaluateRevisionChanges()` → `repoClient.GenerateManifest()` → `NormalizeTargetObjects()` → `sync.Reconcile()`

Sources: [controller/state.go:95-100](https://github.com/argoproj/argo-cd/blob/main/controller/state.go#L95-L100), [controller/state.go:228-233](https://github.com/argoproj/argo-cd/blob/main/controller/state.go#L228-L233), [controller/state.go:394-419](https://github.com/argoproj/argo-cd/blob/main/controller/state.go#L394-L419), [controller/state.go:677-684](https://github.com/argoproj/argo-cd/blob/main/controller/state.go#L677-L684), [controller/state.go:900](https://github.com/argoproj/argo-cd/blob/main/controller/state.go#L900)

1. **`CompareAppState`**: Initiates a comparison between Git state and live cluster state, initializing performance stats, tracking metrics, and checking local versus remote manifest paths. Sources: [controller/state.go:677-745](https://github.com/argoproj/argo-cd/blob/main/controller/state.go#L677-L745)
2. **`GetRepoObjs`**: Connects to the repository server client, inspects permitted Helm and OCI repositories, and builds manifest generation requests for each application source. Sources: [controller/state.go:228-321](https://github.com/argoproj/argo-cd/blob/main/controller/state.go#L228-L321)
3. **`evaluateRevisionChanges`**: Inspects source revisions, validates path updates, and handles reference sources (`IsRef()`) or branch diffs before committing to a full generation pass. Sources: [controller/state.go:464-493](https://github.com/argoproj/argo-cd/blob/main/controller/state.go#L464-L493)
4. **`repoClient.GenerateManifest`**: Dispatches the gRPC manifest payload containing Kustomize options, Helm credentials, API versions, and runtime state to the repo-server. Sources: [controller/state.go:394-419](https://github.com/argoproj/argo-cd/blob/main/controller/state.go#L394-L419)
5. **`NormalizeTargetObjects`**: Unmarshals raw string manifests, applies cluster scope checks, sets app instance tracking labels, and deduplicates repeated resources into application conditions. Sources: [controller/state.go:572-623](https://github.com/argoproj/argo-cd/blob/main/controller/state.go#L572-L623)
6. **`sync.Reconcile`**: Compares normalized target objects against live objects loaded from the cluster state cache. Sources: [controller/state.go:824-831](https://github.com/argoproj/argo-cd/blob/main/controller/state.go#L824-L831), [controller/state.go:900](https://github.com/argoproj/argo-cd/blob/main/controller/state.go#L900)

> [!WARNING]
> When `CompareAppState` encounters a repository error during manifest retrieval, it consults a repo error cache and grace period. If an error is new and outside the grace period, it stores the timestamp and returns `ErrCompareStateRepo` to bypass expensive retries until the grace period expires.

Sources: [controller/state.go:746-765](https://github.com/argoproj/argo-cd/blob/main/controller/state.go#L746-L765)

### AppStateManager Interfaces and Result Structures

| Method / Struct Name | Input Parameters | Return Types | Description |
| :--- | :--- | :--- | :--- |
| `CompareAppState` | `ctx, app, project, revisions, sources, noCache, noRevisionCache, localManifests, hasMultipleSources` | `(*comparisonResult, error)` | Compares target state against live cluster state and evaluates sync and health statuses. |
| `GetRepoObjs` | `ctx, app, sources, appLabelKey, revisions, noCache, noRevisionCache, sourceIntegrity, proj, sendRuntimeState` | `([]*unstructured.Unstructured, []*apiclient.ManifestResponse, bool, error)` | Delegates generation tasks to the repository server and returns parsed unstructured objects. |
| `EvaluateAppRevisionsChanges` | `ctx, app, sources, revisions, proj, sendRuntimeState, noRevisionCache` | `(bool, []string, error)` | Checks if source revisions have changed without generating full manifests. |
| `SyncAppState` | `ctx, app, project, state` | `()` | Executes synchronization tasks for an application according to its operation state. |

Sources: [controller/state.go:95-100](https://github.com/argoproj/argo-cd/blob/main/controller/state.go#L95-L100)

### Design Trade-Offs in State Synchronization

| Design Choice | Benefit | Cost |
| :--- | :--- | :--- |
| **Separate Repo Server Communication via gRPC** | Isolates CPU-heavy Kustomize and Jsonnet execution from the controller loop. | Introduces network serialization overhead and connection management complexity per source. |
| **Error Caching and Grace Periods** | Prevents reconciling queue saturation when downstream Git repositories or repo-servers experience outages. | Temporary transient errors on target generation may be masked until the grace period threshold passes. |
| **Target Object Deduplication via Key Maps** | Automatically detects colliding resource keys and attaches clear warning conditions. | Drops duplicate target objects except for the last parsed entry in the map collection. |

Sources: [controller/state.go:228-233](https://github.com/argoproj/argo-cd/blob/main/controller/state.go#L228-L233), [controller/state.go:608-621](https://github.com/argoproj/argo-cd/blob/main/controller/state.go#L608-L621), [controller/state.go:746-765](https://github.com/argoproj/argo-cd/blob/main/controller/state.go#L746-L765)

## Related

- [[Repo Server Architecture]]
- [[Config Management Plugins]]

