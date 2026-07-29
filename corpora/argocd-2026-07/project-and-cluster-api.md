# Project and Cluster API

<details>
<summary>Relevant source files</summary>

The following files were used as context for generating this wiki page:

- [docs/user-guide/projects.md](https://github.com/argoproj/argo-cd/blob/main/docs/user-guide/projects.md)
- [manifests/crds/appproject-crd.yaml](https://github.com/argoproj/argo-cd/blob/main/manifests/crds/appproject-crd.yaml)
- [cmd/argocd/commands/project.go](https://github.com/argoproj/argo-cd/blob/main/cmd/argocd/commands/project.go)
- [pkg/apis/application/v1alpha1/generated.proto](https://github.com/argoproj/argo-cd/blob/main/pkg/apis/application/v1alpha1/generated.proto)
- [server/project/project.go](https://github.com/argoproj/argo-cd/blob/main/server/project/project.go)
</details>

## Overview

The Project and Cluster API provides a robust administrative and programmatic interface for defining, managing, and enforcing multi-tenant isolation boundaries in Argo CD. By exposing structured API contracts, gRPC services, and supporting command-line tools, it enables operators and teams to govern application deployment scopes, source repository whitelists, cluster and namespace permissions, and fine-grained role-based access control (RBAC).

Sources: [manifests/crds/appproject-crd.yaml:23-29](https://github.com/argoproj/argo-cd/blob/main/manifests/crds/appproject-crd.yaml#L23-L29), [cmd/argocd/commands/project.go:41-91](https://github.com/argoproj/argo-cd/blob/main/cmd/argocd/commands/project.go#L41-L91), [pkg/apis/application/v1alpha1/generated.proto:42-47](https://github.com/argoproj/argo-cd/blob/main/pkg/apis/application/v1alpha1/generated.proto#L42-L47), [server/project/project.go:46-70](https://github.com/argoproj/argo-cd/blob/main/server/project/project.go#L46-L70)

## AppProject Custom Resource Specification

### AppProject Custom Resource Definition

An `AppProject` provides a logical grouping of applications, supplying structural controls that govern deployment locations, deployable contents, user access permissions, RBAC policies, and automated token access. Declared as a namespace-scoped CustomResourceDefinition under the `argoproj.io` API group, `AppProject` objects utilize the `v1alpha1` version schema and support the short names `appproj` and `appprojs`.

Sources: [manifests/crds/appproject-crd.yaml:1-18](https://github.com/argoproj/argo-cd/blob/main/manifests/crds/appproject-crd.yaml#L1-L18), [pkg/apis/application/v1alpha1/generated.proto:42-58](https://github.com/argoproj/argo-cd/blob/main/pkg/apis/application/v1alpha1/generated.proto#L42-L58)

### Structural Specification Schema

The `AppProjectSpec` schema defines the multi-tenant governance boundaries, tracking target clusters, repositories, security constraints, and automation roles.

| Field Name | Type | Description |
| :--- | :--- | :--- |
| `sourceRepos` | `[]string` | Whitelisted repository URLs permitted for deployment. |
| `destinations` | `[]ApplicationDestination` | Allowed deployment destination cluster URLs or symbolic names and namespaces. |
| `description` | `string` | Optional human-readable description of the project (maximum 255 characters). |
| `roles` | `[]ProjectRole` | User-defined RBAC roles associated with the project containing Casbin policies, OIDC groups, and JWT tokens. |
| `clusterResourceWhitelist` | `[]ClusterResourceRestrictionItem` | Whitelisted cluster-level resource groups, kinds, and name patterns using glob syntax. |
| `clusterResourceBlacklist` | `[]ClusterResourceRestrictionItem` | Blacklisted cluster-level resource groups, kinds, and name patterns. |
| `namespaceResourceWhitelist` | `[]GroupKind` | Whitelisted namespace-level API groups and kinds. |
| `namespaceResourceBlacklist` | `[]GroupKind` | Blacklisted namespace-level API groups and kinds. |
| `orphanedResources` | `OrphanedResourcesMonitorSettings` | Configuration settings for monitoring orphaned resources, including warning states and ignored resource keys. |
| `syncWindows` | `[]SyncWindow` | Cron-based time windows controlling when synchronization operations are permitted or blocked. |
| `signatureKeys` | `[]SignatureKey` | Deprecated list of PGP key IDs required for commit signature verification (superseded by `sourceIntegrity`). |
| `sourceIntegrity` | `SourceIntegrity` | Manifest source integrity constraints for git source verification policies (such as GPG keys and repository matchers). |
| `sourceNamespaces` | `[]string` | Namespaces where application resources are authorized to be created. |
| `permitOnlyProjectScopedClusters` | `bool` | Restricts destinations exclusively to clusters that are project-scoped. |
| `destinationServiceAccounts` | `[]ApplicationDestinationServiceAccount` | Service accounts to be impersonated during application sync operations for specified destinations. |

Sources: [manifests/crds/appproject-crd.yaml:48-397](https://github.com/argoproj/argo-cd/blob/main/manifests/crds/appproject-crd.yaml#L48-L397), [pkg/apis/application/v1alpha1/generated.proto:68-118](https://github.com/argoproj/argo-cd/blob/main/pkg/apis/application/v1alpha1/generated.proto#L68-L118)

> [!NOTE]
> The `signatureKeys` field is deprecated in favor of `sourceIntegrity` and will be removed in the next major version release. When configuring commit verification policies, prioritize `sourceIntegrity.git.policies` configurations.

Sources: [manifests/crds/appproject-crd.yaml:257-261](https://github.com/argoproj/argo-cd/blob/main/manifests/crds/appproject-crd.yaml#L257-L261), [pkg/apis/application/v1alpha1/generated.proto:98-101](https://github.com/argoproj/argo-cd/blob/main/pkg/apis/application/v1alpha1/generated.proto#L98-L101)

### Status and Runtime State

The `AppProjectStatus` schema captures dynamic runtime information associated with generated automation artifacts, specifically maintaining issued JWT tokens indexed by their assigned role names.

| Field Name | Type | Description |
| :--- | :--- | :--- |
| `jwtTokensByRegistry` / `jwtTokensByRole` | `map[string]JWTTokens` | Map of role names to their corresponding lists of issued JSON Web Tokens (`JWTToken` containing `iat`, `exp`, and `id` values). |

Sources: [manifests/crds/appproject-crd.yaml:398-427](https://github.com/argoproj/argo-cd/blob/main/manifests/crds/appproject-crd.yaml#L398-L427), [pkg/apis/application/v1alpha1/generated.proto:120-124](https://github.com/argoproj/argo-cd/blob/main/pkg/apis/application/v1alpha1/generated.proto#L120-L124)

### Example Manifest Configuration

Below is a complete, well-formed `AppProject` custom resource configuration demonstrating resource restriction lists, destination targets, and RBAC project role definitions.

```yaml
apiVersion: argoproj.io/v1alpha1
kind: AppProject
metadata:
  name: team-alpha
  namespace: argocd
  labels:
    app.kubernetes.io/name: team-alpha
spec:
  description: "Deployment project for Team Alpha applications"
  sourceRepos:
    - "https://github.com/example/team-alpha-apps.git"
  destinations:
    - server: "https://kubernetes.default.svc"
      namespace: "alpha-prod"
  clusterResourceWhitelist:
    - group: ""
      kind: Namespace
  namespaceResourceWhitelist:
    - group: "apps"
      kind: Deployment
    - group: ""
      kind: Service
  roles:
    - name: sync-operator
      description: "Grants permission to trigger sync operations for Team Alpha"
      policies:
        - "p, proj:team-alpha:sync-operator, applications, sync, team-alpha/*, allow"
      groups:
        - "alpha-engineers"
```

Sources: [manifests/crds/appproject-crd.yaml:1-256](https://github.com/argoproj/argo-cd/blob/main/manifests/crds/appproject-crd.yaml#L1-L256), [pkg/apis/application/v1alpha1/generated.proto:42-118](https://github.com/argoproj/argo-cd/blob/main/pkg/apis/application/v1alpha1/generated.proto#L42-L118)

## Project Management gRPC Service API

### Overview

The project management gRPC service exposes functionality for manipulating `AppProject` resources, managing RBAC policies, and issuing JWT tokens through the Argo CD API server. The service implementation resides in the `project` package and is structured around the `Server` struct, which coordinates Kubernetes clients, RBAC enforcers, audit loggers, and session managers.

Sources: [server/project/project.go:46-60](https://github.com/argoproj/argo-cd/blob/main/server/project/project.go#L46-L60)

### Token Creation and Validation Call Chain

When clients request a new automation token for a project role, the API execution flows through a robust validation and retry pipeline to ensure synchronization safety.

`CreateToken()` → `retry.RetryOnConflict()` → `createToken()` → `validateProject()` → `prj.GetRoleByName()` → `s.enf.EnforceErr()` → `jwtutil.IsMember()` → `prj.ValidateJWTTokenID()` → `s.sessionMgr.Create()` → `parser.ParseUnverified()` → `appclientset.ArgoprojV1alpha1().AppProjects().Update()`

* `CreateToken()` intercepts incoming gRPC requests and wraps token creation in conflict-handling retry logic.
* `createToken()` loads the target `AppProject` resource from the Kubernetes client and validates project syntax via `validateProject()`.
* `s.enf.EnforceErr()` and `jwtutil.IsMember()` evaluate whether the calling context possesses administrative rights or belongs to the authorized OIDC group for the requested role.
* `s.sessionMgr.Create()` generates a signed JWT token using the standard subject formatting string `proj:%s:%s` parameterized by project name and role name.
* Finally, the updated JWT list is normalized, appended to `prj.Status.JWTTokensByRole`, and committed back to the Kubernetes API server via a resource update call.

Sources: [server/project/project.go:41-44](https://github.com/argoproj/argo-cd/blob/main/server/project/project.go#L41-L44), [server/project/project.go:84-162](https://github.com/argoproj/argo-cd/blob/main/server/project/project.go#L84-L162)

> [!WARNING]
> Token creation requests are protected by concurrent resource locks (`s.projectLock`) keyed against the project name. Bypassing project locks during concurrent token generation across multiple API replicas can result in optimistic locking conflicts (`AppProject` resource version mismatches).

Sources: [server/project/project.go:54](https://github.com/argoproj/argo-cd/blob/main/server/project/project.go#L54), [server/project/project.go:105-106](https://github.com/argoproj/argo-cd/blob/main/server/project/project.go#L105-L106)

### Server Service Structure

The project management service struct contains all runtime dependencies required to evaluate project policies, write audit events, and synchronize cluster state.

| Field Name | Type | Purpose |
| :--- | :--- | :--- |
| `ns` | `string` | Namespace where Argo CD control plane resources are deployed. |
| `enf` | `*rbac.Enforcer` | Casbin-backed RBAC enforcement engine for project-level actions. |
| `policyEnf` | `*rbacpolicy.RBACPolicyEnforcer` | Extended RBAC policy enforcer tracking OIDC group claims and scopes. |
| `appclientset` | `appclientset.Interface` | Kubernetes client for Argo CD custom resources (`AppProject`, `Application`). |
| `kubeclientset` | `kubernetes.Interface` | Standard Kubernetes client for core cluster interactions and audit logging. |
| `auditLogger` | `*argo.AuditLogger` | Audit trail recorder for tracking administrative mutations and API actions. |
| `projectLock` | `sync.KeyLock` | Key-based synchronization mutex to prevent concurrent project update races. |
| `sessionMgr` | `*session.SessionManager` | Session and token manager responsible for issuing and signing JWT tokens. |

Sources: [server/project/project.go:47-59](https://github.com/argoproj/argo-cd/blob/main/server/project/project.go#L47-L59)

## Project Server Authorization and Scoping

### Overview

Server-side authorization for project management operations combines Casbin-based RBAC evaluation with project-specific scope checks. When administrative actions or token creation requests are processed by the project server, authorization logic inspects the request context against defined project roles, group memberships, and validation rules.

Sources: [server/project/project.go:72-82](https://github.com/argoproj/argo-cd/blob/main/server/project/project.go#L72-L82), [server/project/project.go:108-116](https://github.com/argoproj/argo-cd/blob/main/server/project/project.go#L108-L116)

### Project Validation and Authorization Call Chain

Before any token creation or mutation is persisted, the server executes a strict validation and enforcement sequence to verify syntactic correctness and caller privileges.

`validateProject()` → `proj.ValidateProject()` → `rbac.ValidatePolicy()` → `s.enf.EnforceErr()` → `jwtutil.IsMember()` → `prj.ValidateJWTTokenID()`

* `validateProject()` executes `proj.ValidateProject()` to inspect structural integrity and then calls `rbac.ValidatePolicy()` on the project's policy string.
* `s.enf.EnforceErr()` checks if the request claims possess `update` permissions on `projects` resource paths for the given project.
* `jwtutil.IsMember()` verifies whether the caller's OIDC groups match the authorized groups configured on the target project role when direct RBAC permission is absent.
* `prj.ValidateJWTTokenID()` ensures that requested JWT token identifiers comply with naming rules and uniqueness constraints.

Sources: [server/project/project.go:72-82](https://github.com/argoproj/argo-cd/blob/main/server/project/project.go#L72-L82), [server/project/project.go:108-120](https://github.com/argoproj/argo-cd/blob/main/server/project/project.go#L108-L120)

### Policy Enforcement Mechanics

Project validation handles syntax checking for Casbin policy strings embedded within `AppProject` definitions. If a syntax violation occurs during validation, the server aborts the operation and returns an explicit gRPC status error.

| Validation Function | Target Subsystem | Error Code Returned | Purpose |
| :--- | :--- | :--- | :--- |
| `proj.ValidateProject()` | `AppProject` Schema | Standard Go error | Validates core project schema fields and constraints. |
| `rbac.ValidatePolicy()` | Casbin Policy Engine | `codes.InvalidArgument` | Validates custom project policy string syntax. |
| `prj.GetRoleByName()` | Project Role Store | `codes.NotFound` | Verifies that the target role exists within the project definition. |
| `prj.ValidateJWTTokenID()` | JWT Token Structure | `codes.InvalidArgument` | Validates token identifier format and uniqueness. |

Sources: [server/project/project.go:72-82](https://github.com/argoproj/argo-cd/blob/main/server/project/project.go#L72-L82), [server/project/project.go:108-120](https://github.com/argoproj/argo-cd/blob/main/server/project/project.go#L108-L120)

> [!WARNING]
> If `s.enf.EnforceErr()` fails because the user lacks direct update permissions, the authorization check falls back to evaluating OIDC group membership via `jwtutil.IsMember()`. If both checks fail, the authorization error is returned immediately and token generation is denied.

Sources: [server/project/project.go:112-116](https://github.com/argoproj/argo-cd/blob/main/server/project/project.go#L112-L116)

## Command-Line Interface for Projects

### Overview

The Argo CD client CLI exposes an extensive suite of commands rooted under the `argocd proj` parent command for managing multi-tenant application projects, destinations, source repositories, signature keys, orphaned resource tracking policies, and RBAC resource access lists. Subcommands coordinate directly with the gRPC project management client to execute remote operations or modify local manifests.

Sources: [cmd/argocd/commands/project.go:41-91](https://github.com/argoproj/argo-cd/blob/main/cmd/argocd/commands/project.go#L41-L91)

### Project CLI Command Hierarchy and Options

The `argocd proj` command tree supports configuration flags, output formatting choices, and resource-scoping parameters across its subcommands.

| Command / Flag | Type / Scope | Default Value | Purpose |
| :--- | :--- | :--- | :--- |
| `argocd proj create PROJECT` | Subcommand | N/A | Creates a new project or applies manifests from a file/URL. |
| `--upsert` | Boolean Flag | `false` | Overrides an existing project even if specs differ during creation. |
| `-f, --file` | String Flag | `""` | Filename or URL pointing to Kubernetes YAML/JSON manifests. |
| `argocd proj set PROJECT` | Subcommand | N/A | Sets specific project parameters using command flags. |
| `-o, --output` | String Flag | `wide` | Output formatting for `list` and `get` (`json`, `yaml`, `wide`, `name`). |
| `-l, --list` | String Flag | `deny` / `allow` | Selects allow or deny list for resource restriction commands. |

Sources: [cmd/argocd/commands/project.go:105-142](https://github.com/argoproj/argo-cd/blob/main/cmd/argocd/commands/project.go#L105-L142), [cmd/argocd/commands/project.go:648-727](https://github.com/argoproj/argo-cd/blob/main/cmd/argocd/commands/project.go#L648-L727), [cmd/argocd/commands/project.go:884-919](https://github.com/argoproj/argo-cd/blob/main/cmd/argocd/commands/project.go#L884-L919)

### Resource Access Policy Modification Flow

The CLI manages cluster-scoped and namespaced resource restrictions through unified modifier functions. When a resource restriction command executes, it follows an explicit invocation chain to update internal lists before issuing a remote update request.

`modifyResourceListCmd()` → `modifyClusterResourcesList()` / `modifyNamespacedResourcesList()` → `projIf.Update()`

* `modifyResourceListCmd()` parses command-line arguments (`PROJECT`, `GROUP`, `KIND`, and optional `NAME`), queries the existing project via `projIf.Get()`, and resolves whether to target the allow or deny list.
* `modifyClusterResourcesList()` or `modifyNamespacedResourcesList()` checks for duplicate entries or locates the target index for removal.
* `projIf.Update()` pushes the modified `AppProject` spec back to the gRPC API server.

Sources: [cmd/argocd/commands/project.go:600-727](https://github.com/argoproj/argo-cd/blob/main/cmd/argocd/commands/project.go#L600-L727)

> [!WARNING]
> Namespaced resource commands default to modifying the deny list (`defaultList = "deny"`), whereas cluster resource commands default to the allow list (`defaultList = "allow"`). Explicitly specify the `-l, --list` flag when overriding default behavior.

Sources: [cmd/argocd/commands/project.go:649-657](https://github.com/argoproj/argo-cd/blob/main/cmd/argocd/commands/project.go#L649-L657)

### Worked Example: Modifying Resource Lists

The following examples illustrate real command-line invocations using signatures and flags defined in the CLI command constructors:

```bash
# Create a project with upsert enabled from a manifest file
argocd proj create my-project -f project.yaml --upsert

# Add a cluster-scoped resource to the project allow list with an optional name pattern
argocd proj allow-cluster-resource my-project argoproj.io AppProject my-project-pattern

# Add a namespaced resource group and kind to the deny list
argocd proj deny-namespace-resource my-project apps Deployment
```

Sources: [cmd/argocd/commands/project.go:112-142](https://github.com/argoproj/argo-cd/blob/main/cmd/argocd/commands/project.go#L112-L142), [cmd/argocd/commands/project.go:743-786](https://github.com/argoproj/argo-cd/blob/main/cmd/argocd/commands/project.go#L743-L786)

## Project Multi-Tenancy User Guide Overview

### Overview

Projects provide a logical grouping of applications, enabling multi-tenant isolation when Argo CD is shared across multiple teams. Every application belongs to a single project. If unspecified, applications belong to the `default` project, which is created automatically and initially permits deployments from any source repository (`*`), to any destination cluster and namespace (`*`), and for all resource kinds. While the `default` project can be modified, it cannot be deleted and is intended primarily for initial testing; administrators should create dedicated projects with explicit source, destination, and resource permissions.

Sources: [docs/user-guide/projects.md:1-26](https://github.com/argoproj/argo-cd/blob/main/docs/user-guide/projects.md#L1-L26)

### Multi-Tenant Isolation Features

Projects restrict and govern application deployment behavior through several structural controls:

* Restrict trusted Git source repositories.
* Restrict destination clusters and namespaces.
* Restrict deployable object kinds via allow-lists and deny-lists.
* Define project roles for application RBAC bound to OIDC groups and/or JWT tokens.

Sources: [docs/user-guide/projects.md:3-9](https://github.com/argoproj/argo-cd/blob/main/docs/user-guide/projects.md#L3-L9)

### Validation Rules for Sources and Destinations

Source repositories and destination clusters/namespaces are evaluated using allow and deny rules. A rule prefixed with `!` acts as a denial condition. A source or destination is considered valid if any allow rule permits it and no deny rule rejects it. 

> [!WARNING]
> The rule `!*` is invalid because disallowing everything contradicts the evaluation logic.

Sources: [docs/user-guide/projects.md:83-88](https://github.com/argoproj/argo-cd/blob/main/docs/user-guide/projects.md#L83-L88), [docs/user-guide/projects.md:120-125](https://github.com/argoproj/argo-cd/blob/main/docs/user-guide/projects.md#L120-L125)

### Project Scoping and Implicit Destinations

Administrators can configure project-scoped repositories and clusters so that developers can self-service resource registration by referencing a specific project label or field in Kubernetes Secrets. Furthermore, setting `permitOnlyProjectScopedClusters: true` on an `AppProject` spec forces applications to deploy exclusively to clusters associated with that project.

> [!NOTE]
> **Implicit Destinations:** When a project-scoped cluster is defined, an implicit entry is dynamically added to the AppProject's `destinations` list during evaluation, acting as `namespace: "*"` unless specific namespaces are restricted.

Sources: [docs/user-guide/projects.md:322-328](https://github.com/argoproj/argo-cd/blob/main/docs/user-guide/projects.md#L322-L328), [docs/user-guide/projects.md:398-421](https://github.com/argoproj/argo-cd/blob/main/docs/user-guide/projects.md#L398-L421)

## Related

- [[Server Runtime]]
- [[RBAC Policy Enforcement]]

