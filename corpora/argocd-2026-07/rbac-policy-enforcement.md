# RBAC Policy Enforcement

<details>
<summary>Relevant source files</summary>

The following files were used as context for generating this wiki page:

- [docs/operator-manual/rbac.md](https://github.com/argoproj/argo-cd/blob/main/docs/operator-manual/rbac.md)
- [cmd/argocd/commands/admin/settings_rbac.go](https://github.com/argoproj/argo-cd/blob/main/cmd/argocd/commands/admin/settings_rbac.go)
- [util/rbac/rbac.go](https://github.com/argoproj/argo-cd/blob/main/util/rbac/rbac.go)
- [server/server.go](https://github.com/argoproj/argo-cd/blob/main/server/server.go)
- [server/application/application.go](https://github.com/argoproj/argo-cd/blob/main/server/application/application.go)
</details>

## Overview

Role-Based Access Control (RBAC) policy enforcement in Argo CD governs resource access permissions across administrative boundaries, applications, and core services. Because Argo CD lacks an internal user management system beyond the superuser `admin`, it integrates with external single sign-on (SSO) providers and local user accounts, mapping authenticated claims and user groups to defined roles.
Sources: [docs/operator-manual/rbac.md:3-7](https://github.com/argoproj/argo-cd/blob/main/docs/operator-manual/rbac.md#L3-L7)

The policy engine relies on Casbin models to evaluate both group mappings and granular resource policies using either glob or regular expression matching modes. By centralizing authorization through configurable ConfigMaps and AppProject declarations, the system ensures deterministic permission resolution with explicit deny precedence and cached evaluation routines.
Sources: [docs/operator-manual/rbac.md:8-12](https://github.com/argoproj/argo-cd/blob/main/docs/operator-manual/rbac.md#L8-L12), [docs/operator-manual/rbac.md:43-45](https://github.com/argoproj/argo-cd/blob/main/docs/operator-manual/rbac.md#L43-L45), [docs/operator-manual/rbac.md:283-306](https://github.com/argoproj/argo-cd/blob/main/docs/operator-manual/rbac.md#L283-L306), [util/rbac/rbac.go:121-140](https://github.com/argoproj/argo-cd/blob/main/util/rbac/rbac.go#L121-L140)

## Casbin Enforcer Core Architecture

### Overview

The core authorization engine relies on Casbin models wrapped by the `Enforcer` struct, which coordinates cached enforcer instances, custom JWT claims evaluation, matching modes, and adapter-driven policy loading.
Sources: [util/rbac/rbac.go:121-140](https://github.com/argoproj/argo-cd/blob/main/util/rbac/rbac.go#L121-L140)

### Core Data Structures and Interfaces

The subsystem defines central structures and interfaces that govern enforcer state, caching, and persistence adaptation.
Sources: [util/rbac/rbac.go:46-56](https://github.com/argoproj/argo-cd/blob/main/util/rbac/rbac.go#L46-L56), [util/rbac/rbac.go:121-146](https://github.com/argoproj/argo-cd/blob/main/util/rbac/rbac.go#L121-L146), [util/rbac/rbac.go:586-591](https://github.com/argoproj/argo-cd/blob/main/util/rbac/rbac.go#L586-L591)

| Structure / Interface | Underlying Type / Field Set | Purpose & Description |
| :--- | :--- | :--- |
| `CasbinEnforcer` | Interface (`EnableLog`, `Enforce`, `LoadPolicy`, `EnableEnforce`, `AddFunction`, `GetGroupingPolicy`, `GetAllRoles`, `GetImplicitPermissionsForUser`) | Defines the mandatory method set implemented by underlying Casbin enforcers. |
| `Enforcer` | Struct (`lock`, `enforcerCache`, `adapter`, `enableLog`, `enabled`, `clientset`, `namespace`, `configmap`, `claimsEnforcerFunc`, `model`, `defaultRole`, `matchMode`) | Manages Kubernetes integration, caching, policy adapters, and runtime evaluation settings. |
| `cachedEnforcer` | Struct (`enforcer`, `policy`) | Holds cached Casbin enforcer instances alongside their optional project-level policy string. |
| `argocdAdapter` | Struct (`builtinPolicy`, `userDefinedPolicy`, `runtimePolicy`) | Implements the Casbin `persist.Adapter` interface to load layered policy strings. |
Sources: [util/rbac/rbac.go:46-56](https://github.com/argoproj/argo-cd/blob/main/util/rbac/rbac.go#L46-L56), [util/rbac/rbac.go:121-146](https://github.com/argoproj/argo-cd/blob/main/util/rbac/rbac.go#L121-L146), [util/rbac/rbac.go:586-591](https://github.com/argoproj/argo-cd/blob/main/util/rbac/rbac.go#L586-L591)

### Casbin Enforcer Lifecycle and Caching

Enforcer instances are instantiated safely and cached using `patrickmn/go-cache` to avoid repeated overhead during request evaluation. When policies or settings change, `invalidateCache()` flushes the cache under a mutex lock.
Sources: [util/rbac/rbac.go:148-156](https://github.com/argoproj/argo-cd/blob/main/util/rbac/rbac.go#L148-L156), [util/rbac/rbac.go:210-223](https://github.com/argoproj/argo-cd/blob/main/util/rbac/rbac.go#L210-L223)

> [!WARNING]
> Reusing the same Casbin `Model` instance across multiple enforcers is unsafe; `newBuiltInModel()` must construct a fresh model via `model.NewModelFromString(assets.ModelConf)` for every enforcer instance.
Sources: [util/rbac/rbac.go:575-584](https://github.com/argoproj/argo-cd/blob/main/util/rbac/rbac.go#L575-L584)

The evaluation call chain processes requests through several explicit layers:
`Enforce()` → `getCasbinEnforcer()` / `snapshotEnforceState()` → `enforce()` → `enf.Enforce()`
During this sequence, `enforce()` first evaluates any configured `defaultRole`, checks whether the subject is a JWT token (`jwt.Claims`) to invoke `claimsEnforcerFunc`, and finally falls back to standard Casbin enforcement.
Sources: [util/rbac/rbac.go:342-346](https://github.com/argoproj/argo-cd/blob/main/util/rbac/rbac.go#L342-L346), [util/rbac/rbac.go:400-426](https://github.com/argoproj/argo-cd/blob/main/util/rbac/rbac.go#L400-L426)

### Policy Adapter and Parsing Implementation

The `argocdAdapter` type satisfies Casbin's persistence adapter interface by sequentially reading built-in, user-defined, and runtime policies.
Sources: [util/rbac/rbac.go:586-610](https://github.com/argoproj/argo-cd/blob/main/util/rbac/rbac.go#L586-L610)

```go
func (a *argocdAdapter) LoadPolicy(model model.Model) error {
	for _, policyStr := range []string{a.builtinPolicy, a.userDefinedPolicy, a.runtimePolicy} {
		for line := range strings.SplitSeq(policyStr, "\n") {
			if err := loadPolicyLine(strings.TrimSpace(line), model); err != nil {
				return fmt.Errorf("error loading policy line: %w", err)
			}
		}
	}
	return nil
}
```
Sources: [util/rbac/rbac.go:601-610](https://github.com/argoproj/argo-cd/blob/main/util/rbac/rbac.go#L601-L610)

Lines are parsed using a CSV reader configured with `TrimLeadingSpace = true` to handle quoted policy tokens correctly, validating structural requirements for policy (`p`) and grouping (`g`) definitions before appending them to the model.
Sources: [util/rbac/rbac.go:614-645](https://github.com/argoproj/argo-cd/blob/main/util/rbac/rbac.go#L614-L645)

> [!NOTE]
> `SavePolicy`, `AddPolicy`, `RemovePolicy`, and `RemoveFilteredPolicy` on `argocdAdapter` return "not implemented" errors because policies are managed declaratively via Kubernetes ConfigMaps rather than modified dynamically through Casbin write methods.
Sources: [util/rbac/rbac.go:647-662](https://github.com/argoproj/argo-cd/blob/main/util/rbac/rbac.go#L647-L662)

## Policy Loading and ConfigMap Synchronization

### ConfigMap Synchronization and Policy Composition

Argo CD synchronizes dynamic RBAC policies by watching the global Kubernetes ConfigMap (`argocd-rbac-cm`). The synchronization process executes through a defined call chain: `RunPolicyLoader()` fetches initial ConfigMap data and invokes `syncUpdate()`, which subsequently triggers `PolicyCSV()`, updates the enforcer's default role and match mode, executes the registered update callback, and applies the parsed user policies.
Sources: [util/rbac/rbac.go:455-469](https://github.com/argoproj/argo-cd/blob/main/util/rbac/rbac.go#L455-L469), [util/rbac/rbac.go:551-559](https://github.com/argoproj/argo-cd/blob/main/util/rbac/rbac.go#L551-L559)

The `PolicyCSV()` function composes the final multi-part policy string by extracting entries from the ConfigMap data map. It reads the primary `policy.csv` key first, sorts all additional keys alphabetically, and appends keys matching the `policy.<any string>.csv` naming convention to enable clean overlays using configuration tools like Kustomize or Helm.
Sources: [util/rbac/rbac.go:519-548](https://github.com/argoproj/argo-cd/blob/main/util/rbac/rbac.go#L519-L548), [docs/operator-manual/rbac.md:416-425](https://github.com/argoproj/argo-cd/blob/main/docs/operator-manual/rbac.md#L416-L425)

| ConfigMap Key | Purpose |
| :------------ | :------ |
| `policy.csv` | Primary base RBAC policy rules and group bindings. |
| `policy.<any string>.csv` | Additional overlay policies concatenated alphabetically below the base policy. |
| `policy.default` | Default role assigned to authenticated (or anonymous) users when no explicit rule matches. |
| `scopes` | OIDC token scopes examined during role and group extraction. |
| `policy.matchMode` | Switch between `glob` and `regex` evaluation pattern matching modes. |
Sources: [util/rbac/rbac.go:35-44](https://github.com/argoproj/argo-cd/blob/main/util/rbac/rbac.go#L35-L44), [util/rbac/rbac.go:519-548](https://github.com/argoproj/argo-cd/blob/main/util/rbac/rbac.go#L519-L548), [server/server.go:893-904](https://github.com/argoproj/argo-cd/blob/main/server/server.go#L893-L904)

> [!WARNING]
> Updates whose `ResourceVersion` remains unchanged (such as periodic informer resyncs) are explicitly skipped by the `rbacConfigMapEventHandler` UpdateFunc to avoid redundant cache invalidations and enforcer reloads.
Sources: [util/rbac/rbac.go:500-508](https://github.com/argoproj/argo-cd/blob/main/util/rbac/rbac.go#L500-L508)

### Informer-Driven Policy Watcher

The background policy watcher creates a filtered Kubernetes ConfigMap informer targeting only the configured RBAC configmap name within the control plane namespace.
Sources: [util/rbac/rbac.go:444-452](https://github.com/argoproj/argo-cd/blob/main/util/rbac/rbac.go#L444-L452)

```go
func (e *Enforcer) newInformer() cache.SharedIndexInformer {
	tweakConfigMap := func(options *metav1.ListOptions) {
		cmFieldSelector := fields.ParseSelectorOrDie("metadata.name=" + e.configmap)
		options.FieldSelector = cmFieldSelector.String()
	}
	indexers := cache.Indexers{cache.NamespaceIndex: cache.MetaNamespaceIndexFunc}
	return informersv1.NewFilteredConfigMapInformer(e.clientset, e.namespace, defaultRBACSyncPeriod, indexers, tweakConfigMap)
}
```
Sources: [util/rbac/rbac.go:444-452](https://github.com/argoproj/argo-cd/blob/main/util/rbac/rbac.go#L444-L452)

Event handlers safely guard type assertions against unexpected object types, including `cache.DeletedFinalStateUnknown` tombstones, preventing server panics when processing cluster events.
Sources: [util/rbac/rbac.go:482-487](https://github.com/argoproj/argo-cd/blob/main/util/rbac/rbac.go#L482-L487)

## Server Lifecycle and Policy Initialization

### Overview

The Argo CD API server initializes and maintains its RBAC policy loader as a core background routine during server startup. The server structure (`ArgoCDServer`) coordinates the lifecycle of the RBAC enforcer, policy enforcer, and dynamic informer loops.
Sources: [server/server.go:186-221](https://github.com/argoproj/argo-cd/blob/main/server/server.go#L186-L221), [server/server.go:891-906](https://github.com/argoproj/argo-cd/blob/main/server/server.go#L891-L906)

### Server Startup and Policy Initialization

During the initialization of `NewServer`, the RBAC enforcer is instantiated with the control plane Kubernetes client, namespace, and config map name (`common.ArgoCDRBACConfigMapName`). The builtin policy asset is loaded, authentication enforcement is conditionally toggled based on the `--disable-auth` flag, and debug logging is enabled if the environment variable `ARGOCD_RBAC_DEBUG` is set to `"1"`.
Sources: [server/server.go:352-360](https://github.com/argoproj/argo-cd/blob/main/server/server.go#L352-L360)

```go
	enf := rbac.NewEnforcer(opts.KubeClientset, opts.Namespace, common.ArgoCDRBACConfigMapName, nil)
	enf.EnableEnforce(!opts.DisableAuth)
	err = enf.SetBuiltinPolicy(assets.BuiltinPolicyCSV)
	errorsutil.CheckError(err)
	enf.EnableLog(os.Getenv(common.EnvVarRBACDebug) == "1")

	policyEnf := rbacpolicy.NewRBACPolicyEnforcer(enf, projLister)
	enf.SetClaimsEnforcerFunc(policyEnf.EnforceClaims)
```
Sources: [server/server.go:352-360](https://github.com/argoproj/argo-cd/blob/main/server/server.go#L352-L360)

> [!NOTE]
> The claims enforcer function (`policyEnf.EnforceClaims`) is bound directly to the enforcer instance during server creation, enabling token claims and OIDC group evaluations to integrate seamlessly with Casbin authorization checks.
Sources: [server/server.go:358-360](https://github.com/argoproj/argo-cd/blob/main/server/server.go#L358-L360)

### Background Policy Loader Routine

When the API server enters its main execution loop via `Run()`, it spawns `server.rbacPolicyLoader(ctx)` as an asynchronous background worker. This routine invokes `RunPolicyLoader` on the enforcer with an update callback function that unmarshals OIDC token scopes from the ConfigMap data and updates the policy enforcer's scope configuration.
Sources: [server/server.go:674-674](https://github.com/argoproj/argo-cd/blob/main/server/server.go#L674-L674), [server/server.go:891-906](https://github.com/argoproj/argo-cd/blob/main/server/server.go#L891-L906)

```go
func (server *ArgoCDServer) rbacPolicyLoader(ctx context.Context) {
	err := server.enf.RunPolicyLoader(ctx, func(cm *corev1.ConfigMap) error {
		var scopes []string
		if scopesStr, ok := cm.Data[rbac.ConfigMapScopesKey]; scopesStr != "" && ok {
			scopes = make([]string, 0)
			err := yaml.Unmarshal([]byte(scopesStr), &scopes)
			if err != nil {
				return fmt.Errorf("error unmarshalling scopes: %w", err)
			}
		}

		server.policyEnforcer.SetScopes(scopes)
		return nil
	})
	errorsutil.CheckError(err)
}
```
Sources: [server/server.go:891-906](https://github.com/argoproj/argo-cd/blob/main/server/server.go#L891-L906)

## API Request Authorization and Enforcement

### Overview

Argo CD enforces Role-Based Access Control (RBAC) permissions across incoming API requests by intercepting requests in application service handlers, constructing the target resource name via `security.RBACName()`, and querying the Casbin enforcer. When users make requests without specifying a project, the API server handles authorization defensively to prevent information leakage regarding resource existence.
Sources: [server/application/application.go:177-201](https://github.com/argoproj/argo-cd/blob/main/server/application/application.go#L177-L201)

### RBAC Enforcement Flow and Call Chain

When an application operation is requested, the server executes a multi-step authorization and validation flow. The primary enforcement call chain flows through `getApplicationEnforceRBACInformer()` or `getApplicationEnforceRBACClient()`, which invoke `getAppEnforceRBAC()` to evaluate permissions against the target application and project.
Sources: [server/application/application.go:177-267](https://github.com/argoproj/argo-cd/blob/main/server/application/application.go#L177-L267)

```
getAppEnforceRBAC() → s.enf.EnforceErr() → getApp() → s.enf.EnforceErr() → getAppProject()
```
Sources: [server/application/application.go:189-253](https://github.com/argoproj/argo-cd/blob/main/server/application/application.go#L189-L253)

1. **Initial Parameterized Check**: If a project is supplied in the request, `s.enf.EnforceErr()` validates permissions against the parameterized RBAC name. If denied, the server performs a dummy `getApp()` fetch to equalize response timing, mitigating timing attacks.
Sources: [server/application/application.go:187-200](https://github.com/argoproj/argo-cd/blob/main/server/application/application.go#L187-L200)

2. **Resource Retrieval & Secondary Check**: The target application is fetched via informer or client. A second mandatory enforcement check validates permissions against the application's actual project (`a.RBACName(s.ns)`).
Sources: [server/application/application.go:202-234](https://github.com/argoproj/argo-cd/blob/main/server/application/application.go#L202-L234)

3. **Project Mismatch Verification**: The effective project is resolved and verified against any project specified in the request parameters, ensuring callers cannot spoof project scopes.
Sources: [server/application/application.go:235-247](https://github.com/argoproj/argo-cd/blob/main/server/application/application.go#L235-L247)

> [!WARNING]
> If an application does not exist or the user lacks access when no project is specified, Argo CD deliberately returns a uniform `PermissionDeniedAPIError` (HTTP 403) rather than a 404 Not Found error. This prevents unauthorized callers from inferring the existence of private applications.
Sources: [server/application/application.go:209-212](https://github.com/argoproj/argo-cd/blob/main/server/application/application.go#L209-L212)

### JWT Claims Integration and Custom Enforcers

The `Enforcer` struct wraps Casbin and integrates user JWT claims with rule evaluation. During an `Enforce()` call, `enforce()` inspects the subject type (`rvals[0]`). If the subject implements `jwt.Claims`, the custom `claimsEnforcerFunc` is invoked. If custom claims enforcement fails or is absent, the subject falls back to a standard evaluation path.
Sources: [util/rbac/rbac.go:121-140](https://github.com/argoproj/argo-cd/blob/main/util/rbac/rbac.go#L121-L140), [util/rbac/rbac.go:400-426](https://github.com/argoproj/argo-cd/blob/main/util/rbac/rbac.go#L400-L426)

```go
func enforce(enf CasbinEnforcer, defaultRole string, claimsEnforcerFunc ClaimsEnforcerFunc, rvals ...any) bool {
	if defaultRole != "" && len(rvals) >= 2 {
		if ok, err := enf.Enforce(append([]any{defaultRole}, rvals[1:]...)...); ok && err == nil {
			return true
		}
	}
	if len(rvals) == 0 {
		return false
	}
	sub := rvals[0]
	switch s := sub.(type) {
	case string:
	case jwt.Claims:
		if claimsEnforcerFunc != nil && claimsEnforcerFunc(s, rvals...) {
			return true
		}
		rvals = append([]any{""}, rvals[1:]...)
	default:
		rvals = append([]any{""}, rvals[1:]...)
	}
	ok, err := enf.Enforce(rvals...)
	return ok && err == nil
}
```
Sources: [util/rbac/rbac.go:400-426](https://github.com/argoproj/argo-cd/blob/main/util/rbac/rbac.go#L400-L426)

> [!TIP]
> When `EnforceErr()` encounters a failed authorization check with `jwt.Claims` as the first argument, it automatically extracts user identifiers (`sub`) and issued-at timestamps (`iat`) via `jwtutil.MapClaims()` to enrich the audit log and returned gRPC error status.
Sources: [util/rbac/rbac.go:349-374](https://github.com/argoproj/argo-cd/blob/main/util/rbac/rbac.go#L349-L374)

## CLI Administrative Policy Validation Utilities

### CLI Administrative Policy Validation Utilities

Argo CD provides administrative CLI commands under `argocd admin settings rbac` to inspect, validate, and test role-based access control configurations directly from the terminal or within continuous integration pipelines. These utilities interact with local policy files or fetch Kubernetes `ConfigMap` resources from cluster namespaces to verify policy correctness.
Sources: [cmd/argocd/commands/admin/settings_rbac.go:110-122](https://github.com/argoproj/argo-cd/blob/main/cmd/argocd/commands/admin/settings_rbac.go#L110-L122), [cmd/argocd/commands/admin/settings_rbac.go:241-247](https://github.com/argoproj/argo-cd/blob/main/cmd/argocd/commands/admin/settings_rbac.go#L241-L247)

### Policy Validation and Test Execution Flow

When validating or testing permissions, the CLI utility resolves the underlying policy source using a structured loading sequence. The execution flow processes inputs via `getPolicy()` to delegate between file-based and cluster-backed loaders.
Sources: [cmd/argocd/commands/admin/settings_rbac.go:305-318](https://github.com/argoproj/argo-cd/blob/main/cmd/argocd/commands/admin/settings_rbac.go#L305-L318)

```
getPolicy() → getPolicyFromFile() / getPolicyConfigMap() → getPolicyFromConfigMap() → PolicyCSV()
```
Sources: [cmd/argocd/commands/admin/settings_rbac.go:305-361](https://github.com/argoproj/argo-cd/blob/main/cmd/argocd/commands/admin/settings_rbac.go#L305-L361)

1. **Source Resolution**: `getPolicy()` inspects whether a local `--policy-file` or a cluster `--namespace` is provided. Exactly one must be specified.
Sources: [cmd/argocd/commands/admin/settings_rbac.go:182-186](https://github.com/argoproj/argo-cd/blob/main/cmd/argocd/commands/admin/settings_rbac.go#L182-L186), [cmd/argocd/commands/admin/settings_rbac.go:270-274](https://github.com/argoproj/argo-cd/blob/main/cmd/argocd/commands/admin/settings_rbac.go#L270-L274)

2. **File Unmarshaling**: `getPolicyFromFile()` reads the local file path via `os.ReadFile()`, attempting to unmarshal the contents as a Kubernetes `ConfigMap` YAML structure. If unmarshaling fails, the file content is treated as raw CSV text.
Sources: [cmd/argocd/commands/admin/settings_rbac.go:330-346](https://github.com/argoproj/argo-cd/blob/main/cmd/argocd/commands/admin/settings_rbac.go#L330-L346)

3. **Cluster Retrieval**: When using `--namespace`, `getPolicyConfigMap()` fetches the `argocd-rbac-cm` ConfigMap using the active Kubernetes client configuration.
Sources: [cmd/argocd/commands/admin/settings_rbac.go:363-370](https://github.com/argoproj/argo-cd/blob/main/cmd/argocd/commands/admin/settings_rbac.go#L363-L370)

4. **CSV Compilation**: `getPolicyFromConfigMap()` extracts the default role and match mode keys, passing `cm.Data` into `rbac.PolicyCSV()` to assemble the ordered policy string.
Sources: [util/rbac/rbac.go:519-548](https://github.com/argoproj/argo-cd/blob/main/util/rbac/rbac.go#L519-L548), [cmd/argocd/commands/admin/settings_rbac.go:348-361](https://github.com/argoproj/argo-cd/blob/main/cmd/argocd/commands/admin/settings_rbac.go#L348-L361)

> [!CAUTION]
> Both `NewRBACCanCommand()` and `NewRBACValidateCommand()` enforce mutually exclusive flags. Supplying both `--policy-file` and `--namespace` (or omitting both) triggers a help message display and immediately terminates the process via `log.Fatal()`.
Sources: [cmd/argocd/commands/admin/settings_rbac.go:182-186](https://github.com/argoproj/argo-cd/blob/main/cmd/argocd/commands/admin/settings_rbac.go#L182-L186), [cmd/argocd/commands/admin/settings_rbac.go:270-274](https://github.com/argoproj/argo-cd/blob/main/cmd/argocd/commands/admin/settings_rbac.go#L270-L274)

### Resource Mapping and Validation Rules

To accommodate shorthand notation in administrative testing, the CLI command maps user-supplied resource names to standard Casbin RBAC resource constants via `resourceMap`. Strict checking further validates resource-action compatibility against `validRBACResourcesActions`.
Sources: [cmd/argocd/commands/admin/settings_rbac.go:30-52](https://github.com/argoproj/argo-cd/blob/main/cmd/argocd/commands/admin/settings_rbac.go#L30-L52), [cmd/argocd/commands/admin/settings_rbac.go:399-406](https://github.com/argoproj/argo-cd/blob/main/cmd/argocd/commands/admin/settings_rbac.go#L399-L406)

| Shorthand Key | Resolved RBAC Resource Constant | Associated Actions Map |
| :--- | :--- | :--- |
| `account`, `accounts` | `accounts` | `accountsActions` |
| `app`, `apps`, `application`, `applications` | `applications` | `applicationsActions` |
| `applicationsets` | `applicationsets` | `defaultCRUDActions` |
| `cert`, `certs`, `certificate` | `certificates` | `defaultCRDActions` |
| `cluster`, `clusters` | `clusters` | `defaultCRUDActions` |
| `extension` | `extensions` | `extensionActions` |
| `gpgkey`, `key` | `gpgkeys` | `defaultCRDActions` |
| `log`, `logs` | `logs` | `logsActions` |
| `exec` | `exec` | `execActions` |
| `proj`, `projs`, `project` | `projects` | `defaultCRUDActions` |
| `repo`, `repos`, `repository` | `repositories` | `defaultCRUDActions` |

Sources: [cmd/argocd/commands/admin/settings_rbac.go:30-67](https://github.com/argoproj/argo-cd/blob/main/cmd/argocd/commands/admin/settings_rbac.go#L30-L67)

> [!NOTE]
> For project-scoped resources where `rbac.ProjectScoped[realResource]` evaluates to true, specifying an empty sub-resource or an asterisk (`*`) causes `checkPolicy()` to automatically normalize the sub-resource parameter to `*/*`.
Sources: [cmd/argocd/commands/admin/settings_rbac.go:411-415](https://github.com/argoproj/argo-cd/blob/main/cmd/argocd/commands/admin/settings_rbac.go#L411-L415)

### Administrative Command Implementation Example

The following reference implementation demonstrates how `NewRBACValidateCommand()` loads a policy file or ConfigMap and invokes `rbac.ValidatePolicy()` to evaluate syntactic correctness and referential integrity.
Sources: [cmd/argocd/commands/admin/settings_rbac.go:233-295](https://github.com/argoproj/argo-cd/blob/main/cmd/argocd/commands/admin/settings_rbac.go#L233-L295), [util/rbac/rbac.go:561-573](https://github.com/argoproj/argo-cd/blob/main/util/rbac/rbac.go#L561-L573)

```go
func NewRBACValidateCommand() *cobra.Command {
	var (
		policyFile   string
		namespace    string
		clientConfig clientcmd.ClientConfig
	)
	command := &cobra.Command{
		Use:   "validate [--policy-file POLICYFILE] [--namespace NAMESPACE]",
		Short: "Validate RBAC policy",
		Run: func(c *cobra.Command, args []string) {
			ctx := c.Context()
			restConfig, _ := clientConfig.ClientConfig()
			realClientset, _ := kubernetes.NewForConfig(restConfig)
			userPolicy, _, _ := getPolicy(ctx, policyFile, realClientset, namespace)
			if userPolicy != "" {
				if err := rbac.ValidatePolicy(userPolicy); err == nil {
					fmt.Print("Policy is valid.\n")
					os.Exit(0)
				}
				fmt.Printf("Policy is invalid: %v\n", err)
				os.Exit(1)
			}
			log.Fatal("Policy is empty or could not be loaded.")
		},
	}
	clientConfig = cli.AddKubectlFlagsToCmd(command)
	command.Flags().StringVar(&policyFile, "policy-file", "", "path to policy file")
	command.Flags().StringVar(&namespace, "namespace", "", "namespace for configmap")
	return command
}
```
Sources: [cmd/argocd/commands/admin/settings_rbac.go:233-301](https://github.com/argoproj/argo-cd/blob/main/cmd/argocd/commands/admin/settings_rbac.go#L233-L301)

## Related

- [[User Sessions]]
- [[Project and Cluster API]]

