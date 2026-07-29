# Credentials and TLS

<details>
<summary>Relevant source files</summary>

The following files were used as context for generating this wiki page:

- [docs/operator-manual/security.md](https://github.com/argoproj/argo-cd/blob/main/docs/operator-manual/security.md)
- [docs/operator-manual/tls.md](https://github.com/argoproj/argo-cd/blob/main/docs/operator-manual/tls.md)
- [docs/user-guide/private-repositories.md](https://github.com/argoproj/argo-cd/blob/main/docs/user-guide/private-repositories.md)
- [docs/operator-manual/mtls.md](https://github.com/argoproj/argo-cd/blob/main/docs/operator-manual/mtls.md)
- [docs/operator-manual/user-management/index.md](https://github.com/argoproj/argo-cd/blob/main/docs/operator-manual/user-management/index.md)
- [docs/operator-manual/secret-management.md](https://github.com/argoproj/argo-cd/blob/main/docs/operator-manual/secret-management.md)
- [manifests/namespace-install-with-hydrator.yaml](https://github.com/argoproj/argo-cd/blob/main/manifests/namespace-install-with-hydrator.yaml)
</details>

## Overview

Securing an Argo CD deployment requires managing multiple layers of authentication, secret storage, artifact verification, and cryptographic communication across its core architectural components. Argo CD relies on Kubernetes Secrets, ConfigMaps, and encrypted communication channels to safeguard cluster access, external Git and Helm repositories, and inter-service gRPC traffic. 

Sources: [docs/operator-manual/security.md:1-17](https://github.com/argoproj/argo-cd/blob/main/docs/operator-manual/security.md#L1-L17), [docs/operator-manual/tls.md:6-14](https://github.com/argoproj/argo-cd/blob/main/docs/operator-manual/tls.md#L6-L14)

Proper configuration of these security primitives prevents unauthorized cluster modifications, mitigates man-in-the-middle risks, and enforces strict isolation boundaries between operators, automated pipelines, and private source material.

Sources: [docs/user-guide/private-repositories.md:316-322](https://github.com/argoproj/argo-cd/blob/main/docs/user-guide/private-repositories.md#L316-L322), [docs/operator-manual/user-management/index.md:3-16](https://github.com/argoproj/argo-cd/blob/main/docs/operator-manual/user-management/index.md#L3-L16)

## Secret Storage and Kubernetes Architecture

### Overview

Argo CD handles sensitive configuration and state data through dedicated core secret storage patterns within Kubernetes manifests. Rather than keeping sensitive payloads in generic config maps, the architecture leverages native Kubernetes `Secret` resources such as `argocd-secret` and `argocd-notifications-secret`, alongside specialized Secret mounts across cluster deployments.

Sources: [manifests/namespace-install-with-hydrator.yaml:598-615](https://github.com/argoproj/argo-cd/blob/main/manifests/namespace-install-with-hydrator.yaml#L598-L615)

### Core Secret Storage Architecture

Argo CD component deployments reference specific Kubernetes secret objects to provision internal authentication tokens, TLS material, and component-to-component encryption. For instance, the Redis deployment mounts an authentication key via a `secretKeyRef` targeting the `argocd-redis` secret object to enforce password-protected data caching.

Sources: [manifests/namespace-install-with-hydrator.yaml:1571-1576](https://github.com/argoproj/argo-cd/blob/main/manifests/namespace-install-with-hydrator.yaml#L1571-L1576)

```yaml
env:
- name: REDIS_PASSWORD
  valueFrom:
    secretKeyRef:
      key: auth
      name: argocd-redis
```

Sources: [manifests/namespace-install-with-hydrator.yaml:1571-1576](https://github.com/argoproj/argo-cd/blob/main/manifests/namespace-install-with-hydrator.yaml#L1571-L1576)

### Secret Management Strategies

When architecting GitOps workflows with Argo CD, deployments choose between destination cluster secret management and manifest generation-based secret injection. The project strongly recommends destination cluster secret management utilizing operators like Sealed Secrets, External Secrets Operator, or the Kubernetes Secrets Store CSI Driver.

Sources: [docs/operator-manual/secret-management.md:8-13](https://github.com/argoproj/argo-cd/blob/main/docs/operator-manual/secret-management.md#L8-L13), [docs/operator-manual/secret-management.md:22-22](https://github.com/argoproj/argo-cd/blob/main/docs/operator-manual/secret-management.md#L22-L22)

> [!WARNING]
> Manifest generation-based secret injection stores generated manifests in plaintext within the Redis cache and exposes them via the repo-server gRPC API, increasing the risk of credential leakage if network policies or component access controls are misconfigured.

Sources: [docs/operator-manual/secret-management.md:31-38](https://github.com/argoproj/argo-cd/blob/main/docs/operator-manual/secret-management.md#L31-L38), [docs/operator-manual/secret-management.md:50-54](https://github.com/argoproj/argo-cd/blob/main/docs/operator-manual/secret-management.md#L50-L54)

## Private Repository Credential Management

### Overview

Configuring access to private Git repositories, Helm charts, and OCI registries requires supplying explicit credentials such as SSH keys, HTTPS access tokens, or cloud-native identity configurations. Argo CD supports multiple authentication mechanisms, which can be applied directly to individual repositories or generalized using credential templates.

Sources: [docs/user-guide/private-repositories.md:11-12](https://github.com/argoproj/argo-cd/blob/main/docs/user-guide/private-repositories.md#L11-L12), [docs/user-guide/private-repositories.md:275-278](https://github.com/argoproj/argo-cd/blob/main/docs/user-guide/private-repositories.md#L275-L278)

### Credential Configuration Methods

Private repositories using HTTPS URLs (`https://`) can be configured with standard username/password combinations or personal access tokens. For access tokens, any non-empty string can be used as the username while the token serves as the password, with specific hosting services requiring particular formatting:

| Git Hosting Provider | Required Username Value | Documentation Reference |
| :--- | :--- | :--- |
| GitHub | Any non-empty string | [GitHub Documentation](https://help.github.com/en/articles/creating-a-personal-access-token-for-the-command-line) |
| GitLab | Any non-empty string | [GitLab Documentation](https://docs.gitlab.com/ee/user/project/deploy_tokens/) |
| Bitbucket Cloud / Data Center | `x-token-auth` | [Bitbucket Documentation](https://confluence.atlassian.com/bitbucketserver/personal-access-tokens-939515499.html) |
| Azure Repos | Any non-empty string | [Azure DevOps Documentation](https://docs.microsoft.com/en-us/azure/devops/organizations/accounts/use-personal-access-tokens-to-authenticate?view=azure-devops&tabs=preview-page) |

Sources: [docs/user-guide/private-repositories.md:41-54](https://github.com/argoproj/argo-cd/blob/main/docs/user-guide/private-repositories.md#L41-L54)

> [!NOTE]
> Argo CD 2.4 upgraded to OpenSSH 8.9, which drops support for the `ssh-rsa` SHA-1 key signature algorithm. SSH servers must be tested for compatibility if they rely on older cryptographic signatures.

Sources: [docs/user-guide/private-repositories.md:80-84](https://github.com/argoproj/argo-cd/blob/main/docs/user-guide/private-repositories.md#L80-L84)

### Cloud-Native and App-Based Authentication

For advanced enterprise integrations, Argo CD supports GitHub App credentials, Google Cloud service account keys, Azure Service Principals, and Azure Workload Identity. When configuring Azure Workload Identity for Helm OCI or Azure Repos, specific Kubernetes secret definitions are parsed by the repo-server component.

Sources: [docs/user-guide/private-repositories.md:110-112](https://github.com/argoproj/argo-cd/blob/main/docs/user-guide/private-repositories.md#L110-L112), [docs/user-guide/private-repositories.md:148-150](https://github.com/argoproj/argo-cd/blob/main/docs/user-guide/private-repositories.md#L148-L150), [docs/user-guide/private-repositories.md:215-243](https://github.com/argoproj/argo-cd/blob/main/docs/user-guide/private-repositories.md#L215-L243)

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: helm-private-repo
  namespace: argocd
  labels:
    argocd.argoproj.io/secret-type: repository
stringData:
  type: helm
  url: contoso.azurecr.io/charts
  name: contosocharts
  enableOCI: "true"
  useAzureWorkloadIdentity: "true"
```

Sources: [docs/user-guide/private-repositories.md:217-230](https://github.com/argoproj/argo-cd/blob/main/docs/user-guide/private-repositories.md#L217-L230)

> [!WARNING]
> Scp-style SSH URLs (`git@yourgit.com:yourrepo`) do not support port specifications and will incorrectly treat any port number as part of the repository path; non-standard ports require `ssh://`-style URLs.

Sources: [docs/user-guide/private-repositories.md:107-109](https://github.com/argoproj/argo-cd/blob/main/docs/user-guide/private-repositories.md#L107-L109)

## TLS and Repo Server mTLS

### Overview

Argo CD provides secure communication between its components through inbound TLS termination and mutual TLS (mTLS) for the `argocd-repo-server`. Inter-component traffic relies on certificates for encryption in transit and client authentication. By default, workloads generate ephemeral self-signed certificates, but production deployments utilize persistent Kubernetes secrets and dedicated Certificate Authorities.

Sources: [docs/operator-manual/tls.md:6-20](https://github.com/argoproj/argo-cd/blob/main/docs/operator-manual/tls.md#L6-L20), [docs/operator-manual/mtls.md:6-9](https://github.com/argoproj/argo-cd/blob/main/docs/operator-manual/mtls.md#L6-L9)

### Inbound TLS Configuration Reference

The following table summarizes the secret requirements, hot-reload behavior, and SAN entries for Argo CD inbound TLS endpoints:

| Component | Secret Name | Hot Reload | Default Cert | Required SAN Entries |
|-----------|-------------|------------|---------------|---------------------|
| `argocd-server` | `argocd-server-tls` | ✅ Yes | Self-signed | External hostname (e.g., `argocd.example.com`) |
| `argocd-repo-server` | `argocd-repo-server-tls` | ❌ Restart required | Self-signed | `DNS:argocd-repo-server`, `DNS:argocd-repo-server.argocd.svc` |
| `argocd-dex-server` | `argocd-dex-server-tls` | ❌ Restart required | Self-signed | `DNS:argocd-dex-server`, `DNS:argocd-dex-server.argocd.svc` |

Sources: [docs/operator-manual/tls.md:26-30](https://github.com/argoproj/argo-cd/blob/main/docs/operator-manual/tls.md#L26-L30)

> [!WARNING]
> Unlike `argocd-server`, workloads such as `argocd-repo-server` and `argocd-dex-server` cannot pick up secret modifications automatically; updating their TLS certificates requires restarting the corresponding pods.

Sources: [docs/operator-manual/tls.md:136-138](https://github.com/argoproj/argo-cd/blob/main/docs/operator-manual/tls.md#L136-L138), [docs/operator-manual/tls.md:175-177](https://github.com/argoproj/argo-cd/blob/main/docs/operator-manual/tls.md#L175-L177)

### Mutual TLS (mTLS) for Repo Server

Enabling mTLS adds client certificate verification on top of server-side TLS for the `argocd-repo-server`. The default shared-certificate setup mounts a single client secret across all client workloads without requiring manual volume declarations.

Sources: [docs/operator-manual/mtls.md:6-13](https://github.com/argoproj/argo-cd/blob/main/docs/operator-manual/mtls.md#L6-L13)

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: argocd-repo-server-mtls
  namespace: argocd
type: Opaque
data:
  client-ca.crt: <BASE64_CA_PEM>
  client.crt: <BASE64_CLIENT_CERT_PEM>
  client.key: <BASE64_CLIENT_KEY_PEM>
```

Sources: [docs/operator-manual/mtls.md:15-32](https://github.com/argoproj/argo-cd/blob/main/docs/operator-manual/mtls.md#L15-L32)

> [!NOTE]
> When mTLS is enabled, the repo-server automatically generates an ephemeral client certificate for its own internal health-check self-connection, logging a message matching `Generated ephemeral health-check client certificate (CN=<value>)`.

Sources: [docs/operator-manual/mtls.md:38-41](https://github.com/argoproj/argo-cd/blob/main/docs/operator-manual/mtls.md#L38-L41)

### Inter-Component TLS Parameters and Flags

The table below outlines the parameters used to control certificate validation and plaintext communication between Argo CD controllers and the repo server:

| Connection | Recommended Parameter | Legacy Parameter (deprecated) | Plain Text Parameter | Default Behavior |
|------------|----------------------|-------------------------------|---------------------|------------------|
| `argocd-server` → `argocd-repo-server` | `--repo-server-ca-cert-path` | `--repo-server-strict-tls` | `--repo-server-plaintext` | Non-validating TLS |
| `argocd-server` → `argocd-dex-server` | — | `--dex-server-strict-tls` | `--dex-server-plaintext` | Non-validating TLS |
| `argocd-application-controller` → `argocd-repo-server` | `--repo-server-ca-cert-path` | `--repo-server-strict-tls` | `--repo-server-plaintext` | Non-validating TLS |
| `argocd-applicationset-controller` → `argocd-repo-server` | `--repo-server-ca-cert-path` | `--repo-server-strict-tls` | `--repo-server-plaintext` | Non-validating TLS |
| `argocd-notifications-controller` → `argocd-repo-server` | `--argocd-repo-server-ca-cert-path` | `--argocd-repo-server-strict-tls` | `--argocd-repo-server-plaintext` | Non-validating TLS |

Sources: [docs/operator-manual/tls.md:34-40](https://github.com/argoproj/argo-cd/blob/main/docs/operator-manual/tls.md#L34-L40)

> [!IMPORTANT]
> The repo-server loads the file specified by `--client-ca-path` into a single `x509.CertPool` and evaluates only whether incoming client certificates are signed by that CA. It does not inspect client subjects, SANs, or enforce per-component identity out of the box.

Sources: [docs/operator-manual/mtls.md:216-223](https://github.com/argoproj/argo-cd/blob/main/docs/operator-manual/mtls.md#L216-L223)

## GPG Verification and Known Hosts

### Overview

When interacting with privately hosted Git services over SSH or verifying signed artifacts, Argo CD relies on configured SSH known hosts and GPG public keys. Managing unknown SSH hosts requires either disabling host verification or explicitly registering the server's public key in `known_hosts` format using the `argocd` CLI utility or declarative configuration.

Sources: [docs/user-guide/private-repositories.md:396-403](https://github.com/argoproj/argo-cd/blob/main/docs/user-guide/private-repositories.md#L396-L403), [docs/user-guide/private-repositories.md:471-474](https://github.com/argoproj/argo-cd/blob/main/docs/user-guide/private-repositories.md#L471-L474)

> [!WARNING]
> When importing SSH known host keys from a `known_hosts` file, the hostnames or IP addresses in the input data must **not** be hashed. Hashed entries cannot be used as an input source for adding SSH known hosts via the CLI or UI.

Sources: [docs/user-guide/private-repositories.md:407-408](https://github.com/argoproj/argo-cd/blob/main/docs/user-guide/private-repositories.md#L407-L408)

### Managing SSH Known Hosts via CLI

Configured SSH known host entries can be listed, added, or removed using the `argocd cert` command group with the `--cert-type ssh` flag.

```bash
$ argocd cert list --cert-type ssh
HOSTNAME                 TYPE  SUBTYPE              FINGERPRINT/SUBJECT
bitbucket.org            ssh   ssh-rsa              SHA256:46OSHA1Rmj8E8ERTC6xkNcmGOw9oFxYr0WF6zWW8l1E
github.com               ssh   ssh-rsa              SHA256:uNiVztksCsDhcc0u9e8BujQXVUpKZIDTMczCvj3tD2s
gitlab.com               ssh   ecdsa-sha2-nistp256  SHA256:HbW3g8zUjNSksFbqTiUWPWg2Bq1x8xdGUrliXFzSnUw
gitlab.com               ssh   ssh-ed25519          SHA256:eUXGGm1YGsMAS7vkcx6JOJdOGHPem5gQp4taiCfCLB8
gitlab.com               ssh   ssh-rsa              SHA256:ROQFvPThGrW4RuWLoL9tq9I9zJ42fK4XywyRtbOz/EQ
ssh.dev.azure.com        ssh   ssh-rsa              SHA256:ohD8VZEXGWo6Ez8GSEJQ9WpafgLFsOfLOtGGQCQo6Og
vs-ssh.visualstudio.com  ssh   ssh-rsa              SHA256:ohD8VZEXGWo6Ez8GSEJQ9WpafgLFsOfLOtGGQCQo6Og
```

Sources: [docs/user-guide/private-repositories.md:412-424](https://github.com/argoproj/argo-cd/blob/main/docs/user-guide/private-repositories.md#L412-L424)

To add known hosts using `ssh-keyscan` or import a system `known_hosts` file, use `argocd cert add-ssh`:

```bash
ssh-keyscan server.example.com | argocd cert add-ssh --batch 
argocd cert add-ssh --batch --from /etc/ssh/ssh_known_hosts
```

Sources: [docs/user-guide/private-repositories.md:428-439](https://github.com/argoproj/argo-cd/blob/main/docs/user-guide/private-repositories.md#L428-L439)

When multiple key subtypes exist for a single host (such as `gitlab.com`), specific entries can be removed using the `--cert-sub-type` modifier:

```bash
argocd cert rm gitlab.com --cert-type ssh --cert-sub-type ssh-ed25519
```

Sources: [docs/user-guide/private-repositories.md:447-451](https://github.com/argoproj/argo-cd/blob/main/docs/user-guide/private-repositories.md#L447-L451)

> [!NOTE]
> Changes performed by the `argocd cert` command can take up to a couple of minutes to propagate across the cluster depending on the Kubernetes setup.

Sources: [docs/user-guide/private-repositories.md:404-405](https://github.com/argoproj/argo-cd/blob/main/docs/user-guide/private-repositories.md#L404-L405)

### Declarative Known Hosts and Verification Methods

| Method | Production Ready | Configuration Source | Security Consideration |
|---|---|---|---|
| Insecure Skip Verification (`--insecure-skip-server-verification`) | ❌ No | CLI flag / repository spec | Vulnerable to man-in-the-middle attacks |
| SSH Known Hosts (`argocd cert add-ssh`) | ✅ Yes | CLI, UI, or `argocd-ssh-known-hosts-cm` ConfigMap | Validates server host key against trusted store |

Sources: [docs/user-guide/private-repositories.md:398-403](https://github.com/argoproj/argo-cd/blob/main/docs/user-guide/private-repositories.md#L398-L403), [docs/user-guide/private-repositories.md:471-473](https://github.com/argoproj/argo-cd/blob/main/docs/user-guide/private-repositories.md#L471-L473)

## User Management and Security Isolation

### Overview

Argo CD manages user authentication, authorization, and administrative security isolation through local accounts, Single Sign-On (SSO) integration via Dex or external OIDC providers, and role-based access control (RBAC). Authentication to the Argo CD API server is performed exclusively using JSON Web Tokens (JWTs). Username and password bearer tokens are not used for authentication. 

Sources: [docs/operator-manual/security.md:7-11](https://github.com/argoproj/argo-cd/blob/main/docs/operator-manual/security.md#L7-L11), [docs/operator-manual/user-management/index.md:3-4](https://github.com/argoproj/argo-cd/blob/main/docs/operator-manual/user-management/index.md#L3-L4)

### Local Users and Capabilities

Local users and accounts serve automation tasks and small teams where SSO is unnecessary. Each local user account can be assigned specific capabilities within the `argocd-cm` ConfigMap.

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: argocd-cm
  namespace: argocd
  labels:
    app.kubernetes.io/name: argocd-cm
    app.kubernetes.io/part-of: argocd
data:
  accounts.alice: apiKey, login
  accounts.alice.enabled: "false"
```

Sources: [docs/operator-manual/user-management/index.md:6-13](https://github.com/argoproj/argo-cd/blob/main/docs/operator-manual/user-management/index.md#L6-L13), [docs/operator-manual/user-management/index.md:23-40](https://github.com/argoproj/argo-cd/blob/main/docs/operator-manual/user-management/index.md#L23-L40)

| Capability | Value / Identifier | Purpose |
|---|---|---|
| API Key Generation | `apiKey` | Allows generating authentication tokens for API and automation access |
| UI Login | `login` | Allows the user to authenticate using the web user interface |

Sources: [docs/operator-manual/user-management/index.md:34-46](https://github.com/argoproj/argo-cd/blob/main/docs/operator-manual/user-management/index.md#L34-L46)

> [!NOTE]
> When creating local users, each user requires explicit RBAC rules configured in `argocd-rbac-cm`. Otherwise, they fall back to the default policy specified by the `policy.default` field.

Sources: [docs/operator-manual/user-management/index.md:15-17](https://github.com/argoproj/argo-cd/blob/main/docs/operator-manual/user-management/index.md#L15-L17)

### Authentication Mechanisms and Token Lifecycle

Authentication tokens are issued through three distinct workflows depending on the user type:

1. **Local Admin User**: Credentials are exchanged at `/api/v1/session`. Tokens are signed and issued by the Argo CD API server with a 24-hour expiration. Updating the admin password immediately revokes all existing admin JWTs. The password is stored as a bcrypt hash in `argocd-secret`.
2. **SSO Users**: Users complete an OAuth2 login flow against a configured OIDC provider (Dex or a self-managed OIDC provider). Tokens are signed and issued by the IDP; Dex tokens expire after 24 hours.
3. **Automation Tokens**: Generated via `/api/v1/projects/{project}/roles/{role}/token`, these project-scoped tokens manage application resources exclusively within their assigned project and can be revoked by deleting the token reference ID from the project role.

Sources: [docs/operator-manual/security.md:13-28](https://github.com/argoproj/argo-cd/blob/main/docs/operator-manual/security.md#L13-L28)

### Authorization and RBAC Policies

Authorization evaluates the list of group memberships found in a user's JWT `groups` claim, comparing each group against the roles and rules defined in the RBAC policy. Any matched rule grants access to the requested API operation.

Sources: [docs/operator-manual/security.md:30-34](https://github.com/argoproj/argo-cd/blob/main/docs/operator-manual/security.md#L30-L34)

### Brute-Force Protection and Rate Limiting Controls

Argo CD protects login endpoints by throttling and rejecting requests after repeated failures. Control variables include:

| Environment Variable | Default Value | Purpose |
|---|---|---|
| `ARGOCD_SESSION_FAILURE_MAX_FAIL_COUNT` | `5` | Maximum failed logins before rejecting attempts |
| `ARGOCD_SESSION_FAILURE_WINDOW_SECONDS` | `300` | Failure window duration in seconds (0 disables window and applies a 10-failure absolute limit) |
| `ARGOCD_SESSION_MAX_CACHE_SIZE` | `1000` | Maximum number of tracking entries allowed in cache |
| `ARGOCD_MAX_CONCURRENT_LOGIN_REQUESTS_COUNT` | `50` | Maximum number of concurrent login requests (0 disables limit) |

Sources: [docs/operator-manual/user-management/index.md:113-129](https://github.com/argoproj/argo-cd/blob/main/docs/operator-manual/user-management/index.md#L113-L129)

## Related

- [[Repository Credentials API]]
- [[Git Client Operations]]

