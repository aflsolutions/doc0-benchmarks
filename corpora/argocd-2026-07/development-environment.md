# Development Environment

<details>
<summary>Relevant source files</summary>

The following files were used as context for generating this wiki page:

- [docs/developer-guide/running-locally.md](https://github.com/argoproj/argo-cd/blob/main/docs/developer-guide/running-locally.md)
- [docs/developer-guide/development-cycle.md](https://github.com/argoproj/argo-cd/blob/main/docs/developer-guide/development-cycle.md)
- [docs/developer-guide/tilt.md](https://github.com/argoproj/argo-cd/blob/main/docs/developer-guide/tilt.md)
- [docs/developer-guide/toolchain-guide.md](https://github.com/argoproj/argo-cd/blob/main/docs/developer-guide/toolchain-guide.md)
- [docs/developer-guide/debugging-locally.md](https://github.com/argoproj/argo-cd/blob/main/docs/developer-guide/debugging-locally.md)
- [docs/developer-guide/index.md](https://github.com/argoproj/argo-cd/blob/main/docs/developer-guide/index.md)
- [docs/developer-guide/development-environment.md](https://github.com/argoproj/argo-cd/blob/main/docs/developer-guide/development-environment.md)
- [manifests/dev-tilt/kustomization.yaml](https://github.com/argoproj/argo-cd/blob/main/manifests/dev-tilt/kustomization.yaml)
- [docs/developer-guide/debugging-remote-environment.md](https://github.com/argoproj/argo-cd/blob/main/docs/developer-guide/debugging-remote-environment.md)
- [docs/operator-manual/custom_tools.md](https://github.com/argoproj/argo-cd/blob/main/docs/operator-manual/custom_tools.md)
- [README.md](https://github.com/argoproj/argo-cd/blob/main/README.md)
- [docs/try_argo_cd_locally.md](https://github.com/argoproj/argo-cd/blob/main/docs/try_argo_cd_locally.md)
- [hack/dev-mounter/main.go](https://github.com/argoproj/argo-cd/blob/main/hack/dev-mounter/main.go)
- [manifests/dev-tilt/ui-deployment.yaml](https://github.com/argoproj/argo-cd/blob/main/manifests/dev-tilt/ui-deployment.yaml)
- [manifests/dev-tilt/namespace.yaml](https://github.com/argoproj/argo-cd/blob/main/manifests/dev-tilt/namespace.yaml)
- [docs/developer-guide/dependencies.md](https://github.com/argoproj/argo-cd/blob/main/docs/developer-guide/dependencies.md)
- [docs/developer-guide/test-e2e.md](https://github.com/argoproj/argo-cd/blob/main/docs/developer-guide/test-e2e.md)
- [prepare.sh](https://github.com/argoproj/argo-cd/blob/main/prepare.sh)
</details>

## Overview

Setting up a robust development environment is essential for contributing effectively to Argo CD, enabling developers to build, test, and debug backend services, user interface components, and custom tooling efficiently. This guide outlines the comprehensive procedures and architectural workflows required to establish a fully functional local development workstation, choose between local and virtualized toolchains, leverage fast iteration loops with Tilt, and execute automated end-to-end test suites.

Sources: [docs/developer-guide/development-environment.md:1-11](https://github.com/argoproj/argo-cd/blob/main/docs/developer-guide/development-environment.md#L1-L11), [docs/developer-guide/toolchain-guide.md:1-13](https://github.com/argoproj/argo-cd/blob/main/docs/developer-guide/toolchain-guide.md#L1-L13), [docs/developer-guide/tilt.md:1-4](https://github.com/argoproj/argo-cd/blob/main/docs/developer-guide/tilt.md#L1-L4), [docs/developer-guide/running-locally.md:1-17](https://github.com/argoproj/argo-cd/blob/main/docs/developer-guide/running-locally.md#L1-L17), [docs/developer-guide/debugging-locally.md:1-8](https://github.com/argoproj/argo-cd/blob/main/docs/developer-guide/debugging-locally.md#L1-L8), [docs/developer-guide/test-e2e.md:1-5](https://github.com/argoproj/argo-cd/blob/main/docs/developer-guide/test-e2e.md#L1-L5)

## Prerequisites and Toolchain Setup

### Overview

Setting up an effective Argo CD development environment requires installing a specific set of base software tools, configuring a local Kubernetes cluster, and selecting a development toolchain model. Developers must provision their workstations with minimum version thresholds before executing build operations.

Sources: [docs/developer-guide/development-environment.md:3-11](https://github.com/argoproj/argo-cd/blob/main/docs/developer-guide/development-environment.md#L3-L11)

### Required Tools and Versions

Contributions to Argo CD require several core system utilities. The required tool versions and their primary functions are detailed below.

Sources: [docs/developer-guide/development-environment.md:3-11](https://github.com/argoproj/argo-cd/blob/main/docs/developer-guide/development-environment.md#L3-L11)

| Tool | Minimum Version | Purpose |
| :--- | :--- | :--- |
| Git | v2.0.0+ | Pulling source code and managing version control repositories |
| Go | Version specified in `go.mod` | Compiling backend services and executing Go-based test suites |
| Docker | v20.10.0+ | Building multi-stage container images and running virtualized toolchains |
| Podman | v3.0.0+ | Alternative container runtime supporting rootless execution |
| Kind | v0.11.0+ | Running lightweight Kubernetes clusters inside Docker |
| Minikube | v1.23.0+ | Provisioning local single-node Kubernetes environments |
| K3d | v5.7.3+ | Running Rancher's K3s Kubernetes distribution inside Docker containers |

Sources: [docs/developer-guide/development-environment.md:3-11](https://github.com/argoproj/argo-cd/blob/main/docs/developer-guide/development-environment.md#L3-L11)

### Repository Setup and Local Cluster Bootstrap

To begin working with the codebase, fork the Argo CD repository to your personal GitHub account and clone it locally. Avoid placing the repository inside a strict traditional `GOPATH` workspace unless cloned directly into it. Configure an upstream remote to easily merge recent commits from the main project.

Sources: [docs/developer-guide/development-environment.md:86-100](https://github.com/argoproj/argo-cd/blob/main/docs/developer-guide/development-environment.md#L86-L100)

```shell
git clone https://github.com/YOUR-USERNAME/argo-cd.git
cd argo-cd
git remote add upstream https://github.com/argoproj/argo-cd.git
```

Sources: [docs/developer-guide/development-environment.md:86-100](https://github.com/argoproj/argo-cd/blob/main/docs/developer-guide/development-environment.md#L86-L100)

After establishing the repository clone, initialize a local Kubernetes cluster using your preferred provider and verify connectivity using `kubectl version`. Install the latest Argo CD manifests onto the cluster and set the active namespace context:

Sources: [docs/developer-guide/development-environment.md:82-85](https://github.com/argoproj/argo-cd/blob/main/docs/developer-guide/development-environment.md#L82-L85), [docs/developer-guide/development-environment.md:108-119](https://github.com/argoproj/argo-cd/blob/main/docs/developer-guide/development-environment.md#L108-L119)

```shell
kubectl create namespace argocd &&
kubectl apply -n argocd --server-side --force-conflicts -f https://raw.githubusercontent.com/argoproj/argo-cd/master/manifests/install.yaml

kubectl config set-context --current --namespace=argocd
```

Sources: [docs/developer-guide/development-environment.md:82-85](https://github.com/argoproj/argo-cd/blob/main/docs/developer-guide/development-environment.md#L82-L85), [docs/developer-guide/development-environment.md:108-119](https://github.com/argoproj/argo-cd/blob/main/docs/developer-guide/development-environment.md#L108-L119)

### Toolchain Selection: Local vs Virtualized

Argo CD provides two distinct toolchain models for building and testing changes: a fully virtualized toolchain via Docker images that match production runtimes, and a native local toolchain for rapid iteration and IDE debugger integration.

Sources: [docs/developer-guide/toolchain-guide.md:6-13](https://github.com/argoproj/argo-cd/blob/main/docs/developer-guide/toolchain-guide.md#L6-L13)

> [!NOTE]
> Most Makefile targets provide a local variant suffixed with `-local` (for example, `make test` runs unit tests inside a Docker container, whereas `make test-local` executes them natively on the host system).

Sources: [docs/developer-guide/toolchain-guide.md:11-13](https://github.com/argoproj/argo-cd/blob/main/docs/developer-guide/toolchain-guide.md#L11-L13)

When utilizing the virtualized toolchain, ensure that your Kubernetes API server listens on a network interface accessible from containers rather than strictly on `127.0.0.1` or `localhost`, and update `~/.kube/config` accordingly. For K3d environments, identify your host IP address and replace `0.0.0.0` server endpoints in your kubeconfig with that routable IP address while enabling `insecure-skip-tls-verify: true`. If using Minikube, start the cluster with `minikube start --embed-certs` to avoid authentication data lookup failures inside build containers.

Sources: [docs/developer-guide/toolchain-guide.md:16-19](https://github.com/argoproj/argo-cd/blob/main/docs/developer-guide/toolchain-guide.md#L16-L19), [docs/developer-guide/toolchain-guide.md:59-99](https://github.com/argoproj/argo-cd/blob/main/docs/developer-guide/toolchain-guide.md#L59-L99)

### Local Toolchain Dependencies

Setting up a local toolchain requires installing specific package dependencies and build tools on your host machine. For Linux hosts, automated installer scripts can place binaries into `/usr/local/bin` or a custom directory via the `BIN` environment variable:

Sources: [docs/developer-guide/toolchain-guide.md:139-147](https://github.com/argoproj/argo-cd/blob/main/docs/developer-guide/toolchain-guide.md#L139-L147)

```shell
BIN=~/go/bin make install-tools-local
```

Sources: [docs/developer-guide/toolchain-guide.md:145-147](https://github.com/argoproj/argo-cd/blob/main/docs/developer-guide/toolchain-guide.md#L145-L147)

Additional requirements include installing `node`, `pnpm`, and `goreman` (which manages multi-process startup via the `Procfile`), alongside OS package manager dependencies such as Git LFS and GnuPG version 2. Production binary versions for tools like Helm, Kustomize, and Git LFS are pinned explicitly in `hack/tool-versions.sh`.

Sources: [docs/developer-guide/toolchain-guide.md:116-137](https://github.com/argoproj/argo-cd/blob/main/docs/developer-guide/toolchain-guide.md#L116-L137), [docs/developer-guide/toolchain-guide.md:148-150](https://github.com/argoproj/argo-cd/blob/main/docs/developer-guide/toolchain-guide.md#L148-L150)

## Local Cluster and Running Options

### Overview

Before running Argo CD components locally, a working Kubernetes cluster is required to store resources and configuration. The initialization process involves deploying the installation manifest from your development branch to establish necessary Custom Resource Definitions (CRDs) and ConfigMaps in the `argocd` namespace, then scaling down all deployed instances so that local processes can take over without resource contention.

Sources: [docs/developer-guide/running-locally.md:13-17](https://github.com/argoproj/argo-cd/blob/main/docs/developer-guide/running-locally.md#L13-L17)

### Cluster Manifest Deployment and Scaling

To deploy the cluster-side resources, create the `argocd` namespace and apply the installation manifest using server-side apply. Configure the current `kubectl` context to default to the `argocd` namespace so that subsequent commands operate in the correct scope:

Sources: [docs/developer-guide/running-locally.md:20-31](https://github.com/argoproj/argo-cd/blob/main/docs/developer-guide/running-locally.md#L20-L31)

```bash
kubectl create namespace argocd
kubectl apply -n argocd --server-side --force-conflicts -f manifests/install.yaml
kubectl config set-context --current --namespace=argocd
```

Sources: [docs/developer-guide/running-locally.md:22-31](https://github.com/argoproj/argo-cd/blob/main/docs/developer-guide/running-locally.md#L22-L31)

To prevent cluster-hosted instances from conflicting with locally executed processes, scale all Argo CD stateful sets and deployments down to zero replicas:

Sources: [docs/developer-guide/running-locally.md:33-45](https://github.com/argoproj/argo-cd/blob/main/docs/developer-guide/running-locally.md#L33-L45)

```shell
kubectl -n argocd scale statefulset/argocd-application-controller --replicas 0
kubectl -n argocd scale deployment/argocd-dex-server --replicas 0
kubectl -n argocd scale deployment/argocd-repo-server --replicas 0
kubectl -n argocd scale deployment/argocd-server --replicas 0
kubectl -n argocd scale deployment/argocd-redis --replicas 0
kubectl -n argocd scale deployment/argocd-applicationset-controller --replicas 0
kubectl -n argocd scale deployment/argocd-notifications-controller --replicas 0
```

Sources: [docs/developer-guide/running-locally.md:37-45](https://github.com/argoproj/argo-cd/blob/main/docs/developer-guide/running-locally.md#L37-L45)

### Running Services Outside the Cluster

#### Execution Options Overview

Once cluster resources are provisioned and scaled down, Argo CD services can run locally on the host machine using either the virtualized toolchain or the native local toolchain.

Sources: [docs/developer-guide/running-locally.md:47-51](https://github.com/argoproj/argo-cd/blob/main/docs/developer-guide/running-locally.md#L47-L51)

#### Virtualized Toolchain Execution

With the virtualized toolchain, services run inside containers managed by Docker or Podman. Start the environment by invoking `make start`:

Sources: [docs/developer-guide/running-locally.md:52-59](https://github.com/argoproj/argo-cd/blob/main/docs/developer-guide/running-locally.md#L52-L59)

```bash
cd argo-cd
make start
```

Sources: [docs/developer-guide/running-locally.md:55-58](https://github.com/argoproj/argo-cd/blob/main/docs/developer-guide/running-locally.md#L55-L58)

To use Podman instead of Docker, set the `DOCKER` environment variable:

Sources: [docs/developer-guide/running-locally.md:60-65](https://github.com/argoproj/argo-cd/blob/main/docs/developer-guide/running-locally.md#L60-L65)

```shell
cd argo-cd
DOCKER=podman make start
```

Sources: [docs/developer-guide/running-locally.md:62-65](https://github.com/argoproj/argo-cd/blob/main/docs/developer-guide/running-locally.md#L62-L65)

#### Local Toolchain Execution

When using the local toolchain, services can be launched directly on the host using three alternative commands:

Sources: [docs/developer-guide/running-locally.md:82-84](https://github.com/argoproj/argo-cd/blob/main/docs/developer-guide/running-locally.md#L82-L84)

```shell
# Option 1: make start-local
cd argo-cd
make start-local ARGOCD_GPG_ENABLED=false

# Option 2: make run
cd argo-cd
make run ARGOCD_GPG_ENABLED=false

# Option 3: goreman start
cd argo-cd
ARGOCD_GPG_ENABLED=false && goreman start
```

Sources: [docs/developer-guide/running-locally.md:85-101](https://github.com/argoproj/argo-cd/blob/main/docs/developer-guide/running-locally.md#L85-L101)

### Local Service Endpoints and Access

Both virtualized and local running methods expose identical ports on the host system. You can verify process status using `goreman run status`.

Sources: [docs/developer-guide/running-locally.md:67-72](https://github.com/argoproj/argo-cd/blob/main/docs/developer-guide/running-locally.md#L67-L72), [docs/developer-guide/running-locally.md:103-108](https://github.com/argoproj/argo-cd/blob/main/docs/developer-guide/running-locally.md#L103-L108)

| Service Component | Host Port | Protocol / Interface |
| :--- | :--- | :--- |
| Argo CD API Server | `8080` | HTTP / CLI API |
| Argo CD UI Server | `4000` | Web UI (Webpack bundled) |
| Helm Registry Server | `5000` | OCI / Helm Registry |

Sources: [docs/developer-guide/running-locally.md:67-72](https://github.com/argoproj/argo-cd/blob/main/docs/developer-guide/running-locally.md#L67-L72), [docs/developer-guide/running-locally.md:103-108](https://github.com/argoproj/argo-cd/blob/main/docs/developer-guide/running-locally.md#L103-L108)

> [!NOTE]
> Webpack takes time to bundle resources initially, meaning the first load of `http://localhost:4000` can take several seconds or minutes. When interacting with the API server via the CLI, use `--plaintext` and `--insecure` flags or export `ARGOCD_SERVER=127.0.0.1:8080` and `ARGOCD_OPTS="--plaintext --insecure"`.

Sources: [docs/developer-guide/running-locally.md:73-80](https://github.com/argoproj/argo-cd/blob/main/docs/developer-guide/running-locally.md#L73-L80)

## Tilt Workflows and Live Reloading

### Overview

Tilt facilitates a real-time web UI that delivers enhanced visibility into cluster logs, component health statuses, and dependency graphs, streamlining the debugging experience compared to terminal-only output. Initiated via a single command from the repository root, Tilt automatically deploys all mandatory Argo CD services and dependencies into the target Kubernetes cluster without requiring manual process management. Unlike process managers such as goreman, which lack dynamic configuration reloading, Tilt natively detects and applies modifications to Kubernetes manifests and Kustomize overlays without requiring full environment restarts.

Sources: [docs/developer-guide/tilt.md:1-3](https://github.com/argoproj/argo-cd/blob/main/docs/developer-guide/tilt.md#L1-L3)

### Tilt Manifest Structure and Namespace Configuration

The local development environment managed by Tilt relies on a dedicated Kustomization configuration located in `manifests/dev-tilt/`. This configuration defines the target namespace and aggregates core component deployments alongside cluster installation manifests.

Sources: [manifests/dev-tilt/kustomization.yaml:1-8](https://github.com/argoproj/argo-cd/blob/main/manifests/dev-tilt/kustomization.yaml#L1-L8)

```yaml
# This manifest is used by Tilt to deploy the argocd resources to the cluster.
namespace: argocd

resources:
  - namespace.yaml
  - ui-deployment.yaml
  - ../cluster-install-with-hydrator
```

Sources: [manifests/dev-tilt/kustomization.yaml:1-8](https://github.com/argoproj/argo-cd/blob/main/manifests/dev-tilt/kustomization.yaml#L1-L8)

The namespace resource ensures that all deployed components are isolated within the designated cluster scope.

Sources: [manifests/dev-tilt/namespace.yaml:1-5](https://github.com/argoproj/argo-cd/blob/main/manifests/dev-tilt/namespace.yaml#L1-L5)

```yaml
apiVersion: v1
kind: Namespace
metadata:
  name: argocd
```

Sources: [manifests/dev-tilt/namespace.yaml:1-5](https://github.com/argoproj/argo-cd/blob/main/manifests/dev-tilt/namespace.yaml#L1-L5)

### UI Deployment and Environment Setup

The user interface component within the Tilt development stack is defined as a standard Kubernetes Deployment object, configuring container images, port bindings, and environment variables necessary for live interaction and end-to-end testing connectivity.

Sources: [manifests/dev-tilt/ui-deployment.yaml:1-25](https://github.com/argoproj/argo-cd/blob/main/manifests/dev-tilt/ui-deployment.yaml#L1-L25)

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: argocd-ui
spec:
  selector:
    matchLabels:
      app: argocd-ui
  template:
    metadata:
      labels:
        app: argocd-ui
    spec:
      containers:
        - name: argocd-ui
          image: argocd-ui
          env:
            - name: ARGOCD_API_URL
              value: https://argocd-server
            - name: ARGOCD_E2E_JS_HOST
              value: "0.0.0.0"
          ports:
            - containerPort: 4000
              name: http
```

Sources: [manifests/dev-tilt/ui-deployment.yaml:1-25](https://github.com/argoproj/argo-cd/blob/main/manifests/dev-tilt/ui-deployment.yaml#L1-L25)

> [!NOTE]
> Pressing `ctrl+c` in the terminal running Tilt terminates file-watching routines and closes active port-forwards, but leaves all resources previously deployed to the local cluster intact and running so that subsequent sessions can resume immediately.

Sources: [docs/developer-guide/tilt.md:15](https://github.com/argoproj/argo-cd/blob/main/docs/developer-guide/tilt.md#L15)

## Helper Mounting Scripts and Tooling

### Overview

Developer utilities in the repository include specialized tools for filesystem synchronization and migration scripting. The `dev-mounter` utility synchronizes Kubernetes ConfigMaps directly onto a local host directory, observing cluster events through a shared informer factory and updating local files in real time. The migration script `prepare.sh` organizes repository contents by staging items into a temporary directory (`dir1`), removing specific subdirectories and configuration files via Git, and committing the repository layout for downstream migration.

Sources: [hack/dev-mounter/main.go:1-15](https://github.com/argoproj/argo-cd/blob/main/hack/dev-mounter/main.go#L1-L15), [prepare.sh:1-17](https://github.com/argoproj/argo-cd/blob/main/prepare.sh#L1-L17)

### Dev-Mounter Execution Walkthrough

The `dev-mounter` command parses CLI flags using Cobra, establishing a Kubernetes client connection and a shared informer factory scoped to a target namespace. The utility tracks `ConfigMap` resources through event handlers that trigger `handledConfigMap()` on additions and updates.

Sources: [hack/dev-mounter/main.go:31-115](https://github.com/argoproj/argo-cd/blob/main/hack/dev-mounter/main.go#L31-L115)

The execution sequence proceeds through the following steps:

1. `newCommand()` registers `--configmap` string array flags and kubectl context flags.
2. `ClientConfig.ClientConfig()` and `ClientConfig.Namespace()` load cluster access parameters and target namespace.
3. `kubernetes.NewForConfigOrDie(config)` instantiates the Kubernetes client, and `informers.NewSharedInformerFactoryWithOptions()` creates the shared informer factory with a 1-minute resync interval.
4. `handledConfigMap(obj)` validates the object type as `*corev1.ConfigMap`, looks up the mapped destination path, ensures directory existence via `os.MkdirAll()`, prunes stale files absent from `cm.Data` via `filepath.Walk()` and `os.Remove()`, and writes updated keys as files using `os.WriteFile()` with permission `0o644`.

Sources: [hack/dev-mounter/main.go:31-115](https://github.com/argoproj/argo-cd/blob/main/hack/dev-mounter/main.go#L31-L115)

> [!WARNING]
> `--configmap` flag values must strictly follow the format `name=path` separated by an equals sign; otherwise, the program terminates with a fatal log message.

Sources: [hack/dev-mounter/main.go:43-47](https://github.com/argoproj/argo-cd/blob/main/hack/dev-mounter/main.go#L43-L47)

### Repository Preparation Script

The `prepare.sh` script automates repository restructuring by relocating non-excluded items into `dir1/`, stripping out legacy paths, and recording a signed commit.

Sources: [prepare.sh:1-17](https://github.com/argoproj/argo-cd/blob/main/prepare.sh#L1-L17)

```bash
mkdir dir1
# Move all files and directories except dir1 and prepare.sh
for item in *; do
  if [[ "$item" != "dir1" && "$item" != "prepare.sh" ]]; then
    mv "$item" dir1/
  fi
done
git rm -r pkg specs agent internal go.* Dockerfile LICENSE OWNERS README.md docs hack codecov.yml sonar-project.properties .github/ .golangci.yaml .gitignore
rm dir1/sonar-project.properties dir1/codecov.yml
mv dir1/ gitops-engine
git checkout -b migrate
git add gitops-engine
git add prepare.sh
git commit --signoff -m "prepare repo for migration to ArgoCD repo"
```

Sources: [prepare.sh:1-17](https://github.com/argoproj/argo-cd/blob/main/prepare.sh#L1-L17)

## Debugging Local and Remote Instances

### Overview

Debugging Argo CD components requires isolating a single service while keeping remaining infrastructure operational either locally via process managers or remotely through Telepresence. Local component configurations derive from the repository root `Procfile`, whereas remote debugging intercepts deployed Kubernetes pods to route cluster traffic directly to a local IDE development instance.

Sources: [docs/developer-guide/debugging-locally.md:12-21](https://github.com/argoproj/argo-cd/blob/main/docs/developer-guide/debugging-locally.md#L12-L21), [docs/developer-guide/debugging-remote-environment.md:3-31](https://github.com/argoproj/argo-cd/blob/main/docs/developer-guide/debugging-remote-environment.md#L3-L31)

### Local IDE and Procfile Configuration

When debugging an individual component such as `api-server`, extract environment variables and runtime arguments from the top-level `Procfile`. The Goreman run entry for `api-server` defines variables including `GOCOVERDIR`, `FORCE_LOG_COLORS`, `ARGOCD_FAKE_IN_CLUSTER`, `ARGOCD_TLS_DATA_PATH`, `ARGOCD_SSH_DATA_PATH`, and `ARGOCD_BINARY_NAME=argocd-server`, followed by flags like `--loglevel debug`, `--redis`, `--disable-auth`, `--insecure`, `--dex-server`, `--repo-server`, and `--port`.

Sources: [docs/developer-guide/debugging-locally.md:20-28](https://github.com/argoproj/argo-cd/blob/main/docs/developer-guide/debugging-locally.md#L20-L28)

> [!NOTE]
> Ensure that components do not conflict by running each service exactly once—either locally via toolchain commands or inside your IDE—to prevent port allocation failures or debugging stale binaries.

Sources: [docs/developer-guide/debugging-locally.md:147-149](https://github.com/argoproj/argo-cd/blob/main/docs/developer-guide/debugging-locally.md#L147-L149)

To run the remaining background infrastructure while debugging `api-server` in your IDE, invoke local start targets with explicit exclusions or whitelists:

Sources: [docs/developer-guide/debugging-locally.md:123-143](https://github.com/argoproj/argo-cd/blob/main/docs/developer-guide/debugging-locally.md#L123-L143)

```bash
make start-local ARGOCD_START="notification applicationset-controller repo-server redis dex controller ui"
make run exclude=api-server
goreman start notification applicationset-controller repo-server redis dex controller ui
```

Sources: [docs/developer-guide/debugging-locally.md:127-141](https://github.com/argoproj/argo-cd/blob/main/docs/developer-guide/debugging-locally.md#L127-L141)

### Remote Interception with Telepresence

Telepresence permits connecting a local IDE process to a remote Kubernetes cluster environment, routing inbound cluster requests directly to a local port.

Sources: [docs/developer-guide/debugging-remote-environment.md:13-27](https://github.com/argoproj/argo-cd/blob/main/docs/developer-guide/debugging-remote-environment.md#L13-L27)

```shell
kubectl config set-context --current --namespace argocd
telepresence helm install --set-json agent.securityContext={}
telepresence connect
telepresence intercept argocd-server --port 8080:http --env-file .envrc.remote
```

Sources: [docs/developer-guide/debugging-remote-environment.md:22-26](https://github.com/argoproj/argo-cd/blob/main/docs/developer-guide/debugging-remote-environment.md#L22-L26)

> [!WARNING]
> Use `--port 8080:https` instead of `--port 8080:http` if the remote `argocd-server` deployment terminates TLS natively.

Sources: [docs/developer-guide/debugging-remote-environment.md:28](https://github.com/argoproj/argo-cd/blob/main/docs/developer-guide/debugging-remote-environment.md#L28)

For Telepresence v1 environments, use the swap-deployment syntax to bind local processes:

Sources: [docs/developer-guide/debugging-remote-environment.md:50-54](https://github.com/argoproj/argo-cd/blob/main/docs/developer-guide/debugging-remote-environment.md#L50-L54)

```shell
telepresence --swap-deployment argocd-server --namespace argocd --env-file .envrc.remote --expose 8080:8080 --expose 8083:8083 --run bash
```

Sources: [docs/developer-guide/debugging-remote-environment.md:52-53](https://github.com/argoproj/argo-cd/blob/main/docs/developer-guide/debugging-remote-environment.md#L52-L53)

## End-to-End Testing Environment

### Overview

Executing automated end-to-end tests verifies that Argo CD components integrate correctly with a live Kubernetes cluster environment. The end-to-end test suite expects services to be installed into the `argocd-e2e` namespace or cluster under the active context, creating ephemeral throw-away namespaces `argocd-e2e***` as target namespaces for test applications.

Sources: [docs/developer-guide/development-cycle.md:93-95](https://github.com/argoproj/argo-cd/blob/main/docs/developer-guide/development-cycle.md#L93-L95), [docs/developer-guide/test-e2e.md:1-4](https://github.com/argoproj/argo-cd/blob/main/docs/developer-guide/test-e2e.md#L1-L4)

### Execution Workflow

Running the test suite involves starting the end-to-end server components, copying test application data into an ephemeral Git repository path, and invoking the Go testing binaries.

Sources: [docs/developer-guide/development-cycle.md:97-98](https://github.com/argoproj/argo-cd/blob/main/docs/developer-guide/development-cycle.md#L97-L98), [docs/developer-guide/test-e2e.md:28-34](https://github.com/argoproj/argo-cd/blob/main/docs/developer-guide/test-e2e.md#L28-L34), [docs/developer-guide/test-e2e.md:41-42](https://github.com/argoproj/argo-cd/blob/main/docs/developer-guide/test-e2e.md#L41-L42)

1. Start the end-to-end server by issuing `make start-e2e` for the virtualized toolchain or `make start-e2e-local` for the local toolchain.
2. Ensure that component network listeners are bound successfully without port collisions.
3. Execute the test suite using `make test-e2e` or `make test-e2e-local`.

Sources: [docs/developer-guide/test-e2e.md:28-34](https://github.com/argoproj/argo-cd/blob/main/docs/developer-guide/test-e2e.md#L28-L34)

> [!NOTE]
> The `/test/e2e/testdata` directory is copied before test execution into `/tmp/argo-e2e***` (configurable via `ARGOCD_E2E_DIR`) and served to test applications as a local Git repository using the file URL scheme `file:///tmp/argo-e2e***`.

Sources: [docs/developer-guide/test-e2e.md:6-7](https://github.com/argoproj/argo-cd/blob/main/docs/developer-guide/test-e2e.md#L6-L7)

### Configuration Variables and Port Overrides

To prevent port conflicts when local network services are already active, override the default listener ports and execution paths using environment variables before invoking the start targets.

Sources: [docs/developer-guide/test-e2e.md:42-50](https://github.com/argoproj/argo-cd/blob/main/docs/developer-guide/test-e2e.md#L42-L50)

| Environment Variable | Default Value | Purpose |
| :--- | :--- | :--- |
| `ARGOCD_E2E_APISERVER_PORT` | `8080` | Listener port for `argocd-server` |
| `ARGOCD_E2E_REPOSERVER_PORT` | `8081` | Listener port for `argocd-reposerver` |
| `ARGOCD_E2E_DEX_PORT` | `5556` | Listener port for `dex` |
| `ARGOCD_E2E_REDIS_PORT` | `6379` | Listener port for `redis` |
| `ARGOCD_E2E_PNPM_CMD` | `pnpm` |

## Related

- [[Quick Start]]
- [[Testing Framework]]

