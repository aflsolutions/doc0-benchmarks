# Quick Start

<details>
<summary>Relevant source files</summary>

The following files were used as context for generating this wiki page:

- [docs/developer-guide/running-locally.md](https://github.com/argoproj/argo-cd/blob/main/docs/developer-guide/running-locally.md)
- [docs/getting_started.md](https://github.com/argoproj/argo-cd/blob/main/docs/getting_started.md)
- [README.md](https://github.com/argoproj/argo-cd/blob/main/README.md)
- [docs/developer-guide/development-environment.md](https://github.com/argoproj/argo-cd/blob/main/docs/developer-guide/development-environment.md)
- [docs/index.md](https://github.com/argoproj/argo-cd/blob/main/docs/index.md)
- [gitops-engine/agent/README.md](https://github.com/argoproj/argo-cd/blob/main/gitops-engine/agent/README.md)
- [docs/developer-guide/test-e2e.md](https://github.com/argoproj/argo-cd/blob/main/docs/developer-guide/test-e2e.md)
- [docs/try_argo_cd_locally.md](https://github.com/argoproj/argo-cd/blob/main/docs/try_argo_cd_locally.md)
- [docs/operator-manual/core.md](https://github.com/argoproj/argo-cd/blob/main/docs/operator-manual/core.md)
- [gitops-engine/agent/main.go](https://github.com/argoproj/argo-cd/blob/main/gitops-engine/agent/main.go)
- [docs/developer-guide/tilt.md](https://github.com/argoproj/argo-cd/blob/main/docs/developer-guide/tilt.md)
- [gitops-engine/agent/manifests/install-namespaced.yaml](https://github.com/argoproj/argo-cd/blob/main/gitops-engine/agent/manifests/install-namespaced.yaml)
- [docs/developer-guide/debugging-locally.md](https://github.com/argoproj/argo-cd/blob/main/docs/developer-guide/debugging-locally.md)
- [gitops-engine/agent/manifests/install.yaml](https://github.com/argoproj/argo-cd/blob/main/gitops-engine/agent/manifests/install.yaml)
- [docs/user-guide/ci_automation.md](https://github.com/argoproj/argo-cd/blob/main/docs/user-guide/ci_automation.md)
- [gitops-engine/agent/manifests/base/gitops-agent-deploy.yaml](https://github.com/argoproj/argo-cd/blob/main/gitops-engine/agent/manifests/base/gitops-agent-deploy.yaml)
- [docs/developer-guide/development-cycle.md](https://github.com/argoproj/argo-cd/blob/main/docs/developer-guide/development-cycle.md)
- [hack/k8s/main.go](https://github.com/argoproj/argo-cd/blob/main/hack/k8s/main.go)
- [docs/developer-guide/index.md](https://github.com/argoproj/argo-cd/blob/main/docs/developer-guide/index.md)
- [docs/developer-guide/debugging-remote-environment.md](https://github.com/argoproj/argo-cd/blob/main/docs/developer-guide/debugging-remote-environment.md)
- [docs/operator-manual/applicationset/index.md](https://github.com/argoproj/argo-cd/blob/main/docs/operator-manual/applicationset/index.md)
- [docs/operator-manual/installation.md](https://github.com/argoproj/argo-cd/blob/main/docs/operator-manual/installation.md)
- [manifests/base/kustomization.yaml](https://github.com/argoproj/argo-cd/blob/main/manifests/base/kustomization.yaml)
</details>

## Overview

This quick start guide helps developers and operators rapidly set up, run, and evaluate Argo CD on a local Kubernetes cluster. It provides foundational instructions covering local environment requirements, service execution via scripts, Tilt, or core mode, and deploying sample GitOps applications. Sources: [docs/getting_started.md:6-11](https://github.com/argoproj/argo-cd/blob/main/docs/getting_started.md#L6-L11), [docs/try_argo_cd_locally.md:7-10](https://github.com/argoproj/argo-cd/blob/main/docs/try_argo_cd_locally.md#L7-L10)

Additionally, the guide details how to inspect and run the GitOps Engine Agent and execute end-to-end testing and debugging workflows to streamline the development cycle. Sources: [docs/developer-guide/running-locally.md:8-11](https://github.com/argoproj/argo-cd/blob/main/docs/developer-guide/running-locally.md#L8-L11), [docs/developer-guide/test-e2e.md:1-4](https://github.com/argoproj/argo-cd/blob/main/docs/developer-guide/test-e2e.md#L1-L4)

## Prerequisites and Local Environment Setup

### Overview

Configuring requirements and setting up the local development environment involves installing mandatory CLI utilities, container runtimes, local Kubernetes distributions, and setting up the Argo CD repository. Developers must ensure that all mandatory tools meet the minimum version thresholds before cloning the codebase, installing code generation tools, and deploying the initial manifests to a local cluster. Sources: [docs/getting_started.md:6-11](https://github.com/argoproj/argo-cd/blob/main/docs/getting_started.md#L6-L11), [docs/developer-guide/development-environment.md:3-11](https://github.com/argoproj/argo-cd/blob/main/docs/developer-guide/development-environment.md#L3-L11)

### Required Development Tools

To successfully build, test, and run Argo CD locally, developers must install a specific set of tools and maintain minimum version constraints. The table below lists the required components, their minimum versions, and verification methods.

| Tool | Minimum Version / Source | Verification Command | Purpose |
| :--- | :--- | :--- | :--- |
| **Git** | v2.0.0+ | `git version` | Pulling source code and managing version control. Sources: [docs/developer-guide/development-environment.md:7-18](https://github.com/argoproj/argo-cd/blob/main/docs/developer-guide/development-environment.md#L7-L18) |
| **Go** | version specified in `go.mod` | `go version` | SDK and compilation tools for backend development. Sources: [docs/developer-guide/development-environment.md:8-29](https://github.com/argoproj/argo-cd/blob/main/docs/developer-guide/development-environment.md#L8-L29) |
| **Docker** or **Podman** | Docker v20.10.0+ or Podman v3.0.0+ | `docker version` | Building and executing multi-stage container images. Sources: [docs/developer-guide/development-environment.md:9-42](https://github.com/argoproj/argo-cd/blob/main/docs/developer-guide/development-environment.md#L9-L42) |
| **Local K8s Cluster** | Kind v0.11.0+, Minikube v1.23.0+, or K3d v5.7.3+ | `kubectl version` | Providing a local Kubernetes runtime environment. Sources: [docs/developer-guide/development-environment.md:10-50](https://github.com/argoproj/argo-cd/blob/main/docs/developer-guide/development-environment.md#L10-L50) |
| **kubectl** | Latest stable | `kubectl version` | Kubernetes command-line cluster administration tool. Sources: [docs/getting_started.md:8-8](https://github.com/argoproj/argo-cd/blob/main/docs/getting_started.md#L8-L8) |

Sources: [docs/getting_started.md:6-11](https://github.com/argoproj/argo-cd/blob/main/docs/getting_started.md#L6-L11), [docs/developer-guide/development-environment.md:3-11](https://github.com/argoproj/argo-cd/blob/main/docs/developer-guide/development-environment.md#L3-L11)

> [!WARNING]
> The local build process uses GOPATH and that path should not be used for cloning unless the Argo CD repository was directly cloned inside it. Always verify that your Go version matches or exceeds the requirement in `go.mod`. Sources: [docs/developer-guide/development-environment.md:29-30](https://github.com/argoproj/argo-cd/blob/main/docs/developer-guide/development-environment.md#L29-L30), [docs/developer-guide/development-environment.md:91-92](https://github.com/argoproj/argo-cd/blob/main/docs/developer-guide/development-environment.md#L91-L92)

### Forking, Cloning, and Local Toolchain Setup

After installing the required baseline tools, developers need to fork the repository, clone it locally, and configure an upstream remote to keep branches synchronized. Additionally, core development targets and code generation utilities must be installed using the project's `Makefile`. Sources: [docs/developer-guide/development-environment.md:87-106](https://github.com/argoproj/argo-cd/blob/main/docs/developer-guide/development-environment.md#L87-L106)

Execute the following commands to clone the repository, add the upstream remote, and install development and codegen tools:

```shell
git clone https://github.com/YOUR-USERNAME/argo-cd.git
cd argo-cd
git remote add upstream https://github.com/argoproj/argo-cd.git
make install-go-tools-local
make install-codegen-tools-local
```

Sources: [docs/developer-guide/development-environment.md:88-106](https://github.com/argoproj/argo-cd/blob/main/docs/developer-guide/development-environment.md#L88-L106)

> [!TIP]
> Setting up an `upstream` remote via `git remote add upstream https://github.com/argoproj/argo-cd.git` allows you to easily pull latest changes into your local branches by running `git pull upstream master`. Sources: [docs/developer-guide/development-environment.md:93-94](https://github.com/argoproj/argo-cd/blob/main/docs/developer-guide/development-environment.md#L93-L94)

### Deploying Argo CD to the Local Cluster

To initialize Argo CD on your local Kubernetes cluster (such as Kind, Minikube, or K3d), create the `argocd` namespace and apply the official installation manifests using server-side apply with conflict forcing. Sources: [docs/getting_started.md:12-17](https://github.com/argoproj/argo-cd/blob/main/docs/getting_started.md#L12-L17), [docs/developer-guide/development-environment.md:48-50](https://github.com/argoproj/argo-cd/blob/main/docs/developer-guide/development-environment.md#L48-L50), [docs/developer-guide/development-environment.md:110-113](https://github.com/argoproj/argo-cd/blob/main/docs/developer-guide/development-environment.md#L110-L113)

```shell
kubectl create namespace argocd
kubectl apply -n argocd --server-side --force-conflicts -f https://raw.githubusercontent.com/argoproj/argo-cd/master/manifests/install.yaml
kubectl config set-context --current --namespace=argocd
```

Sources: [docs/getting_started.md:15-16](https://github.com/argoproj/argo-cd/blob/main/docs/getting_started.md#L15-L16), [docs/developer-guide/development-environment.md:111-118](https://github.com/argoproj/argo-cd/blob/main/docs/developer-guide/development-environment.md#L111-L118)

> [!NOTE]
> The `--server-side` flag is mandatory because certain Argo CD CustomResourceDefinitions, such as ApplicationSet, exceed the 262KB annotation size limit enforced by client-side `kubectl apply`. Server-side apply avoids this by omitting the `last-applied-configuration` annotation. Sources: [docs/getting_started.md:21-24](https://github.com/argoproj/argo-cd/blob/main/docs/getting_started.md#L21-L24)

## Running Argo CD Services Locally

### Overview

Running Argo CD components locally can be achieved through local execution scripts, Tilt, or Core mode. Before starting any local services outside of a Kubernetes cluster, deploy the installation manifests into your cluster and scale down all Argo CD instances to ensure configuration resources like CRDs and ConfigMaps are present while the workloads remain stopped. Sources: [docs/developer-guide/running-locally.md:13-45](https://github.com/argoproj/argo-cd/blob/main/docs/developer-guide/running-locally.md#L13-L45)

```shell
kubectl create namespace argocd
kubectl apply -n argocd --server-side --force-conflicts -f manifests/install.yaml
kubectl config set-context --current --namespace=argocd
kubectl -n argocd scale statefulset/argocd-application-controller --replicas 0
kubectl -n argocd scale deployment/argocd-dex-server --replicas 0
kubectl -n argocd scale deployment/argocd-repo-server --replicas 0
kubectl -n argocd scale deployment/argocd-server --replicas 0
kubectl -n argocd scale deployment/argocd-redis --replicas 0
kubectl -n argocd scale deployment/argocd-applicationset-controller --replicas 0
kubectl -n argocd scale deployment/argocd-notifications-controller --replicas 0
```

Sources: [docs/developer-guide/running-locally.md:20-44](https://github.com/argoproj/argo-cd/blob/main/docs/developer-guide/running-locally.md#L20-L44)

### Local Toolchain Execution

When using the virtualized toolchain, services are started by running `make start`. To use Podman instead of Docker, set the `DOCKER` environment variable. With the local toolchain, services can be invoked via `make start-local`, `make run`, or `goreman start` with `ARGOCD_GPG_ENABLED=false`. Sources: [docs/developer-guide/running-locally.md:52-101](https://github.com/argoproj/argo-cd/blob/main/docs/developer-guide/running-locally.md#L52-L101)

| Startup Command | Toolchain Type | GPG Variable Setting | Exposed Ports |
|-----------------|----------------|----------------------|----------------|
| `make start` | Virtualized (Docker/Podman) | Default | API server (8080), UI server (4000), Helm registry (5000) |
| `make start-local` | Local Toolchain | `ARGOCD_GPG_ENABLED=false` | API server (8080), UI server (4000), Helm registry (5000) |
| `make run` | Local Toolchain | `ARGOCD_GPG_ENABLED=false` | API server (8080), UI server (4000), Helm registry (5000) |
| `goreman start` | Local Toolchain | `ARGOCD_GPG_ENABLED=false` | API server (8080), UI server (4000), Helm registry (5000) |

Sources: [docs/developer-guide/running-locally.md:57-108](https://github.com/argoproj/argo-cd/blob/main/docs/developer-guide/running-locally.md#L57-L108)

> [!WARNING]
> Webpack takes time to bundle resources initially when starting local services, so the first page load at `http://localhost:4000` can take several seconds or minutes. Sources: [docs/developer-guide/running-locally.md:73-73](https://github.com/argoproj/argo-cd/blob/main/docs/developer-guide/running-locally.md#L73-L73)

### Tilt Development and Port Forwarding

Tilt provides a real-time web UI and automated dependency management via a single `tilt up` command executed in the root directory of the repository. It automatically sets up port forwarding from the cluster to localhost. Sources: [docs/developer-guide/tilt.md:3-21](https://github.com/argoproj/argo-cd/blob/main/docs/developer-guide/tilt.md#L3-L21)

| Deployment | API Port | Metrics Port | Webhook Port | Debug Port |
|------------|----------|--------------|--------------|------------|
| `argocd-server` | 8080 | 8083 | — | 9345 |
| `argocd-repo-server` | 8081 | 8084 | — | 9346 |
| `argocd-redis` | 6379 | — | — | — |
| `argocd-applicationset-controller` | — | 8085 | 7000 | 9347 |
| `argocd-application-controller` | — | 8086 | — | 9348 |
| `argocd-notifications-controller` | — | 8087 | — | 9349 |
| `argocd-commit-server` | 8089 | 8088 | — | 9350 |

Sources: [docs/developer-guide/tilt.md:23-31](https://github.com/argoproj/argo-cd/blob/main/docs/developer-guide/tilt.md#L23-L31)

> [!NOTE]
> To remove all deployed resources in your local cluster including CRDs after Tilt testing, run `tilt down` from the root of the repo. Sources: [docs/developer-guide/tilt.md:17-18](https://github.com/argoproj/argo-cd/blob/main/docs/developer-guide/tilt.md#L17-L18)

### Argo CD Core Mode

Argo CD Core runs Argo CD in headless mode without the API server, RBAC model, OIDC authentication, or notification controller. Users interact with it via Kubernetes Application and ApplicationSet CRDs. To use the CLI in core mode, pass the `--core` flag during login:

```bash
kubectl config set-context --current --namespace=argocd
argocd login --core
```

To run the Web UI locally in core mode, execute:

```bash
argocd admin dashboard -n argocd
```

Sources: [docs/operator-manual/core.md:5-16](https://github.com/argoproj/argo-cd/blob/main/docs/operator-manual/core.md#L5-L16), [docs/operator-manual/core.md:66-100](https://github.com/argoproj/argo-cd/blob/main/docs/operator-manual/core.md#L66-L100)

## Deploying Sample Applications via GitOps

### Overview

Argo CD manages application declarations using Git repositories as the single source of truth. Manifests can be specified using Kustomize, Helm, Jsonnet, plain YAML/JSON directories, or custom config management plugins. To demonstrate this workflow, Argo CD provides example applications such as the guestbook app hosted in the example repository. Sources: [docs/getting_started.md:156-158](https://github.com/argoproj/argo-cd/blob/main/docs/getting_started.md#L156-L158), [docs/index.md:33-42](https://github.com/argoproj/argo-cd/blob/main/docs/index.md#L33-L42)

### Kustomize Base Configuration

The base Kustomize configuration for Argo CD is defined in the manifests base directory, which references all underlying component resources and specifies the primary container image tags. Sources: [manifests/base/kustomization.yaml:1-18](https://github.com/argoproj/argo-cd/blob/main/manifests/base/kustomization.yaml#L1-L18)

| Image Name | New Name | New Tag |
|------------|----------|---------|
| `quay.io/argoproj/argocd` | `quay.io/argoproj/argocd` | `latest` |

Sources: [manifests/base/kustomization.yaml:5-8](https://github.com/argoproj/argo-cd/blob/main/manifests/base/kustomization.yaml#L5-L8)

| Resource Path | Component |
|---------------|-----------|
| `./application-controller` | Application Controller |
| `./dex` | Dex SSO Provider |
| `./repo-server` | Repository Server |
| `./server` | API Server |
| `./config` | Configuration Resources |
| `./redis` | Redis Cache |
| `./notification` | Notifications Controller |
| `./applicationset-controller` | ApplicationSet Controller |

Sources: [manifests/base/kustomization.yaml:9-18](https://github.com/argoproj/argo-cd/blob/main/manifests/base/kustomization.yaml#L9-L18)

> [!NOTE]
> The base Kustomization file ties together all core controllers and services required to run Argo CD in a Kubernetes cluster. Sources: [manifests/base/kustomization.yaml:9-18](https://github.com/argoproj/argo-cd/blob/main/manifests/base/kustomization.yaml#L9-L18)

### Creating and Syncing Sample Applications

Applications can be created via the CLI by targeting a Git repository path and specifying the destination cluster and namespace. For example, to create the guestbook sample application:

```bash
kubectl config set-context --current --namespace=argocd
argocd app create guestbook --repo https://github.com/argoproj/argocd-example-apps.git --path guestbook --dest-server https://kubernetes.default.svc --dest-namespace default
```

Sources: [docs/getting_started.md:162-174](https://github.com/argoproj/argo-cd/blob/main/docs/getting_started.md#L162-L174)

Once created, the application status will initially report as `OutOfSync` with a health status of `Missing` because resources have not yet been deployed to the cluster. To deploy the application and synchronize live state with the desired Git state, run:

```bash
argocd app sync guestbook
```

Sources: [docs/getting_started.md:225-230](https://github.com/argoproj/argo-cd/blob/main/docs/getting_started.md#L225-L230)

> [!WARNING]
> Example applications such as the guestbook app may only be compatible with the AMD64 architecture. Running them on ARM64 or other architectures can lead to dependency or container image compatibility issues. Sources: [docs/getting_started.md:159-160](https://github.com/argoproj/argo-cd/blob/main/docs/getting_started.md#L159-L160)

## Executing the GitOps Engine Agent

### Overview

The GitOps Engine Agent provides access to core reconciliation, syncing, sync hooks, and sync waves via a simple CLI interface, synchronizing a single Git repository into the cluster where it is installed. Sources: [gitops-engine/agent/README.md:3-6](https://github.com/argoproj/argo-cd/blob/main/gitops-engine/agent/README.md#L3-L6)

### Agent Manifests and Installation Modes

The agent supports two deployment modes: namespaced mode, where the agent manages the same namespace where it is installed, and full cluster mode, where the agent manages the entire cluster. Both configurations deploy the `gitops-agent` container alongside a `git-sync` sidecar container that mounts an emptyDir volume at `/tmp/git`. Sources: [gitops-engine/agent/README.md:13-16](https://github.com/argoproj/argo-cd/blob/main/gitops-engine/agent/README.md#L13-L16), [gitops-engine/agent/manifests/install-namespaced.yaml:30-73](https://github.com/argoproj/argo-cd/blob/main/gitops-engine/agent/manifests/install-namespaced.yaml#L30-L73), [gitops-engine/agent/manifests/install.yaml:35-77](https://github.com/argoproj/argo-cd/blob/main/gitops-engine/agent/manifests/install.yaml#L35-L77)

| Manifest File | Target Mode | RBAC Resource | Sidecar Webhook URL |
|---------------|-------------|---------------|---------------------|
| `install-namespaced.yaml` | Namespaced | `Role` | `http://localhost:9001/api/v1/sync` |
| `install.yaml` | Full Cluster | `ClusterRole` | `http://localhost:9001/api/v1/sync` |

Sources: [gitops-engine/agent/manifests/install-namespaced.yaml:6-16](https://github.com/argoproj/argo-cd/blob/main/gitops-engine/agent/manifests/install-namespaced.yaml#L6-L16), [gitops-engine/agent/manifests/install-namespaced.yaml:57-59](https://github.com/argoproj/argo-cd/blob/main/gitops-engine/agent/manifests/install-namespaced.yaml#L57-L59), [gitops-engine/agent/manifests/install.yaml:6-20](https://github.com/argoproj/argo-cd/blob/main/gitops-engine/agent/manifests/install.yaml#L6-L20), [gitops-engine/agent/manifests/install.yaml:61-63](https://github.com/argoproj/argo-cd/blob/main/gitops-engine/agent/manifests/install.yaml#L61-L63)

> [!NOTE]
> In cluster mode, the agent receives full cluster access via a `ClusterRole` binding. See the cluster role definitions for specific permissions. Sources: [gitops-engine/agent/README.md:41-46](https://github.com/argoproj/argo-cd/blob/main/gitops-engine/agent/README.md#L41-L46)

### Main Entry Point and Execution Walkthrough

The agent entry point initializes via `main()` which invokes `newCmd(log).Execute()` through `textlogger`. The command execution processes the repository path, sets up the Kubernetes client configuration, and initiates the synchronization loop. Sources: [gitops-engine/agent/main.go:40-44](https://github.com/argoproj/argo-cd/blob/main/gitops-engine/agent/main.go#L40-L44), [gitops-engine/agent/main.go:119-144](https://github.com/argoproj/argo-cd/blob/main/gitops-engine/agent/main.go#L119-L144)

The call-chain execution walkthrough proceeds as follows: `main()` → `newCmd()` parses CLI flags and client config → `cache.NewClusterCache()` initializes the resource cache with `SetPopulateResourceInfoHandler` → `engine.NewEngine()` creates the GitOps engine instance → `gitOpsEngine.Run()` starts background workers and returns a cleanup function → a ticker goroutine and an HTTP server endpoint at `/api/v1/sync` feed the `resync` channel → `s.parseManifests()` runs `git rev-parse HEAD` and walks files, splitting YAML contents via `kube.SplitYAML()` and injecting garbage collection marks → `gitOpsEngine.Sync()` reconciles the target manifests with the cluster state using prune and logger options. Sources: [gitops-engine/agent/main.go:40-44](https://github.com/argoproj/argo-cd/blob/main/gitops-engine/agent/main.go#L40-L44), [gitops-engine/agent/main.go:62-104](https://github.com/argoproj/argo-cd/blob/main/gitops-engine/agent/main.go#L62-L104), [gitops-engine/agent/main.go:151-207](https://github.com/argoproj/argo-cd/blob/main/gitops-engine/agent/main.go#L151-L207)

> [!IMPORTANT]
> The agent parses manifest files with extensions `.json`, `.yml`, or `.yaml`. Every parsed resource is automatically annotated with a SHA-256 hash garbage collection mark (`gitops-agent.argoproj.io/gc-mark`) derived from the repository path and resource key. Sources: [gitops-engine/agent/main.go:33-38](https://github.com/argoproj/argo-cd/blob/main/gitops-engine/agent/main.go#L33-L38), [gitops-engine/agent/main.go:78-102](https://github.com/argoproj/argo-cd/blob/main/gitops-engine/agent/main.go#L78-L102)

### CLI Flags and Configuration Options

The agent command exposes several configuration flags and environment variables to control synchronization behavior, networking, and profiling. Sources: [gitops-engine/agent/main.go:106-117](https://github.com/argoproj/argo-cd/blob/main/gitops-engine/agent/main.go#L106-L117), [gitops-engine/agent/main.go:210-219](https://github.com/argoproj/argo-cd/blob/main/gitops-engine/agent/main.go#L210-L219)

| Flag / Environment Variable | Type / Default | Description |
|-----------------------------|----------------|-------------|
| `--path` | `[]string{"."}` | Directory path within the repository containing manifests. |
| `--resync-seconds` | `int` (300) | Automatic resync duration in seconds. |
| `--port` | `int` (9001) | Port number for the agent HTTP server. |
| `--prune` | `bool` (true) | Enables resource pruning during synchronization. |
| `--namespaced` | `bool` (false) | Switches agent into namespaced mode. |
| `--default-namespace` | `string` ("") | Namespace used if resource namespace is unspecified. |
| `GITOPS_ENGINE_PROFILE` | `string` | Enables profiling mode when set to `web`. |
| `GITOPS_ENGINE_PROFILE_HOST` | `string` (127.0.0.1) | Host address for pprof web server. |
| `GITOPS_ENGINE_PROFILE_PORT` | `string` (6060) | Port number for pprof web server. |

Sources: [gitops-engine/agent/README.md:67-72](https://github.com/argoproj/argo-cd/blob/main/gitops-engine/agent/README.md#L67-L72), [gitops-engine/agent/main.go:33-38](https://github.com/argoproj/argo-cd/blob/main/gitops-engine/agent/main.go#L33-L38), [gitops-engine/agent/main.go:210-219](https://github.com/argoproj/argo-cd/blob/main/gitops-engine/agent/main.go#L210-L219)

## Local End to End Debugging Workflows

### Overview

Running end-to-end (E2E) tests and debugging local or remote Argo CD components involves specialized commands, environment variables, configuration profiles, and isolation strategies across the development lifecycle. Sources: [docs/developer-guide/test-e2e.md:1-7](https://github.com/argoproj/argo-cd/blob/main/docs/developer-guide/test-e2e.md#L1-L7), [docs/developer-guide/debugging-locally.md:1-16](https://github.com/argoproj/argo-cd/blob/main/docs/developer-guide/debugging-locally.md#L1-L16), [docs/developer-guide/development-cycle.md:93-106](https://github.com/argoproj/argo-cd/blob/main/docs/developer-guide/development-cycle.md#L93-L106)

### E2E Test Architecture and Isolation

E2E tests assume Argo CD services are installed into the `argocd-e2e` namespace or cluster current context. A throw-away namespace `argocd-e2e***` is created prior to test execution to serve as the target namespace for test applications. The `/test/e2e/testdata` directory is copied into a temporary directory (configurable by `ARGOCD_E2E_DIR`) and accessed in tests as a Git repository via the file URL `file:///tmp/argo-e2e***`. Each test receives a strict isolation footprint consisting of a random 5-character ID, a unique Git repository containing `testdata` under `/tmp/argo-e2e/${id}`, a unique namespace `argocd-e2e-ns-${id}`, and a primary app name `argocd-e2e-${id}`. Sources: [docs/developer-guide/test-e2e.md:3-8](https://github.com/argoproj/argo-cd/blob/main/docs/developer-guide/test-e2e.md#L3-L8), [docs/developer-guide/test-e2e.md:53-61](https://github.com/argoproj/argo-cd/blob/main/docs/developer-guide/test-e2e.md#L53-L61)

> [!NOTE]
> Queries to the local repository exposed through the E2E server running in a container may return `unable to ls-remote HEAD on repository: failed to list refs: repository not found` due to `/tmp` directory sharing protection. Configure a different directory using `ARGOCD_E2E_DIR` or disable sharing protection. Sources: [docs/developer-guide/test-e2e.md:9-12](https://github.com/argoproj/argo-cd/blob/main/docs/developer-guide/test-e2e.md#L9-L12)

### E2E Test Configuration Variables

The Makefile targets for E2E execution depend on network listeners. Override the defaults using environment variables before running `make start-e2e`: Sources: [docs/developer-guide/test-e2e.md:40-43](https://github.com/argoproj/argo-cd/blob/main/docs/developer-guide/test-e2e.md#L40-L43)

| Environment Variable | Default Value | Purpose / Description |
|----------------------|---------------|-----------------------|
| `ARGOCD_E2E_APISERVER_PORT` | `8080` | Listener port for `argocd-server`. |
| `ARGOCD_E2E_REPOSERVER_PORT` | `8081` | Listener port for `argocd-reposerver`. |
| `ARGOCD_E2E_DEX_PORT` | `5556` | Listener port for `dex`. |
| `ARGOCD_E2E_REDIS_PORT` | `6379` | Listener port for `redis`. |
| `ARGOCD_E2E_PNPM_CMD` | `pnpm` | Command to use for starting the UI via pnpm. |
| `ARGOCD_E2E_DIR` | `/tmp/argo-e2e***` | Local path to repository for ephemeral test data. |

Sources: [docs/developer-guide/test-e2e.md:44-49](https://github.com/argoproj/argo-cd/blob/main/docs/developer-guide/test-e2e.md#L44-L49)

### Local Component Debugging and IDE Setup

When debugging a single component (such as `api-server`), you must run it separately in your IDE using launch configurations copied from the root `Procfile`, while running the other services via the local toolchain. Environment variables can be stored in an `.env` file (e.g., `api-server.env`) and referenced by the IDE configuration. Sources: [docs/developer-guide/debugging-locally.md:11-34](https://github.com/argoproj/argo-cd/blob/main/docs/developer-guide/debugging-locally.md#L11-L34)

To run the remaining Argo CD components locally without conflicts, use a whitelist or exclusion flag with your local startup command. For example, when debugging the `api-server`, you can run: Sources: [docs/developer-guide/debugging-locally.md:123-136](https://github.com/argoproj/argo-cd/blob/main/docs/developer-guide/debugging-locally.md#L123-L136)

- `make start-local ARGOCD_START="notification applicationset-controller repo-server redis dex controller ui"`
- `make run exclude=api-server`
- `goreman start notification applicationset-controller repo-server redis dex controller ui`

Sources: [docs/developer-guide/debugging-locally.md:124-143](https://github.com/argoproj/argo-cd/blob/main/docs/developer-guide/debugging-locally.md#L124-L143)

### Remote Environment Debugging with Telepresence

To debug a remote ArgoCD environment using Telepresence, connect to the cluster and intercept a specific microservice such as `argocd-server` to forward traffic locally: Sources: [docs/developer-guide/debugging-remote-environment.md:1-27](https://github.com/argoproj/argo-cd/blob/main/docs/developer-guide/debugging-remote-environment.md#L1-L27)

```shell
kubectl config set-context --current --namespace argocd
telepresence helm install --set-json agent.securityContext={}
telepresence connect
telepresence intercept argocd-server --port 8080:http --env-file .envrc.remote
```

Sources: [docs/developer-guide/debugging-remote-environment.md:22-26](https://github.com/argoproj/argo-cd/blob/main/docs/developer-guide/debugging-remote-environment.md#L22-L26)

> [!CAUTION]
> Ensure that components running locally via toolchains or IDEs do not conflict with active cluster deployments or duplicate process listeners. Running a component twice results in port binding errors or debugging uninstrumented binary instances. Sources: [docs/developer-guide/debugging-locally.md:147-149](https://github.com/argoproj/argo-cd/blob/main/docs/developer-guide/debugging-locally.md#L147-L149)

## Related

- [[Overview]]
- [[Development Environment]]

