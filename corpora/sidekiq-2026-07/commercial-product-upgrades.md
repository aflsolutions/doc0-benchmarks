# Commercial Product Upgrades

<details>
<summary>Relevant source files</summary>

The following files were used as context for generating this wiki page:

- [Ent-Changes.md](https://github.com/sidekiq/sidekiq/blob/main/Ent-Changes.md)
- [COMM-LICENSE.txt](https://github.com/sidekiq/sidekiq/blob/main/COMM-LICENSE.txt)
- [docs/sdlc.md](https://github.com/sidekiq/sidekiq/blob/main/docs/sdlc.md)
- [README.md](https://github.com/sidekiq/sidekiq/blob/main/README.md)
- [docs/Pro-2.0-Upgrade.md](https://github.com/sidekiq/sidekiq/blob/main/docs/Pro-2.0-Upgrade.md)
- [docs/3.0-Upgrade.md](https://github.com/sidekiq/sidekiq/blob/main/docs/3.0-Upgrade.md)
- [docs/5.0-Upgrade.md](https://github.com/sidekiq/sidekiq/blob/main/docs/5.0-Upgrade.md)
- [docs/7.0-Upgrade.md](https://github.com/sidekiq/sidekiq/blob/main/docs/7.0-Upgrade.md)
- [docs/Ent-7.0-Upgrade.md](https://github.com/sidekiq/sidekiq/blob/main/docs/Ent-7.0-Upgrade.md)
- [docs/Pro-7.0-Upgrade.md](https://github.com/sidekiq/sidekiq/blob/main/docs/Pro-7.0-Upgrade.md)
- [docs/Ent-2.0-Upgrade.md](https://github.com/sidekiq/sidekiq/blob/main/docs/Ent-2.0-Upgrade.md)
- [docs/Pro-8.0-Upgrade.md](https://github.com/sidekiq/sidekiq/blob/main/docs/Pro-8.0-Upgrade.md)
- [LICENSE.txt](https://github.com/sidekiq/sidekiq/blob/main/LICENSE.txt)
- [docs/Pro-5.0-Upgrade.md](https://github.com/sidekiq/sidekiq/blob/main/docs/Pro-5.0-Upgrade.md)
- [docs/Ent-8.0-Upgrade.md](https://github.com/sidekiq/sidekiq/blob/main/docs/Ent-8.0-Upgrade.md)
- [docs/Pro-4.0-Upgrade.md](https://github.com/sidekiq/sidekiq/blob/main/docs/Pro-4.0-Upgrade.md)
- [docs/Pro-3.0-Upgrade.md](https://github.com/sidekiq/sidekiq/blob/main/docs/Pro-3.0-Upgrade.md)
- [docs/8.0-Upgrade.md](https://github.com/sidekiq/sidekiq/blob/main/docs/8.0-Upgrade.md)
- [docs/6.0-Upgrade.md](https://github.com/sidekiq/sidekiq/blob/main/docs/6.0-Upgrade.md)
- [docs/4.0-Upgrade.md](https://github.com/sidekiq/sidekiq/blob/main/docs/4.0-Upgrade.md)
</details>

## Overview

Managing commercial upgrades for Sidekiq Pro and Sidekiq Enterprise requires a structured approach across major framework versions, runtime dependencies, and licensing constraints. Commercial Product Upgrades guides developers and operators through the complete upgrade lifecycle, addressing core framework dependencies, legacy Pro migrations from version 2.0 through 5.0, and modern upgrades for versions 7.0 and 8.0. It also covers major Enterprise release milestones, change management practices under the software development lifecycle, and the legal distribution terms and licensing agreements that govern commercial extensions.

Sources: [docs/sdlc.md:1-100](https://github.com/sidekiq/sidekiq/blob/main/docs/sdlc.md#L1-L100), [docs/Pro-2.0-Upgrade.md:1-139](https://github.com/sidekiq/sidekiq/blob/main/docs/Pro-2.0-Upgrade.md#L1-L139), [docs/Ent-8.0-Upgrade.md:1-38](https://github.com/sidekiq/sidekiq/blob/main/docs/Ent-8.0-Upgrade.md#L1-L38)

## Sidekiq Core Upgrade Foundations

### Overview

Upgrading Sidekiq across major versions requires adhering to strict migration path dependencies, sequential major-version stepping, and core framework requirements. Sidekiq upgrades must always be performed one major version at a time, moving through the latest minor and patch releases of an existing major version before advancing to the next. Skipping major versions or failing to clear deprecation warnings on intermediate releases often leads to broken data models, incompatible middleware APIs, or missing runtime dependencies.

Sources: [docs/5.0-Upgrade.md:43-57](https://github.com/sidekiq/sidekiq/blob/main/docs/5.0-Upgrade.md#L43-L57), [docs/7.0-Upgrade.md:91-104](https://github.com/sidekiq/sidekiq/blob/main/docs/7.0-Upgrade.md#L91-L104), [docs/8.0-Upgrade.md:61-75](https://github.com/sidekiq/sidekiq/blob/main/docs/8.0-Upgrade.md#L61-L75)

### Migration Path Dependencies

Each major version introduces strict requirements on underlying runtime environments, Redis or compatible data stores, and dependent client libraries. Attempting to upgrade without resolving these baseline dependencies results in immediate startup failures or data serialization errors.

> [!CAUTION]
> Always upgrade Sidekiq one major version at a time (e.g., 4.x → 5.x, 6.x → 7.x, 7.x → 8.x). Never jump across multiple major versions directly, as internal data models, connection adapters, and API signatures change between releases.

Sources: [docs/5.0-Upgrade.md:43-45](https://github.com/sidekiq/sidekiq/blob/main/docs/5.0-Upgrade.md#L43-L45), [docs/7.0-Upgrade.md:91-93](https://github.com/sidekiq/sidekiq/blob/main/docs/7.0-Upgrade.md#L91-L93), [docs/8.0-Upgrade.md:61-63](https://github.com/sidekiq/sidekiq/blob/main/docs/8.0-Upgrade.md#L61-L63)

### Core Framework and Runtime Matrix

| Sidekiq Version | Minimum Ruby | Minimum Redis / Compatible Store | Minimum Rails / Framework Support | Default Concurrency |
| :--- | :--- | :--- | :--- | :--- |
| **Sidekiq 5.0** | Ruby 2.2.2+ | Redis 2.8+ | Rails 4.0+ | 10 |
| **Sidekiq 6.0** | Ruby 2.5+ | Redis 4.0+ | Rails 5.0+ | 10 |
| **Sidekiq 7.0** | Ruby 2.7+ | Redis 6.2+ | Rails 6.0+ | 5 |
| **Sidekiq 8.0** | Ruby 3.2+ | Redis 7.0+, Valkey 7.2+, DragonflyDB 1.27+ | Rails 7.0+ | 5 |

Sources: [docs/5.0-Upgrade.md:40-41](https://github.com/sidekiq/sidekiq/blob/main/docs/5.0-Upgrade.md#L40-L41), [docs/7.0-Upgrade.md:44-45](https://github.com/sidekiq/sidekiq/blob/main/docs/7.0-Upgrade.md#L44-L45), [docs/7.0-Upgrade.md:84-86](https://github.com/sidekiq/sidekiq/blob/main/docs/7.0-Upgrade.md#L84-L86), [docs/8.0-Upgrade.md:51-55](https://github.com/sidekiq/sidekiq/blob/main/docs/8.0-Upgrade.md#L51-L55), [docs/6.0-Upgrade.md:50-57](https://github.com/sidekiq/sidekiq/blob/main/docs/6.0-Upgrade.md#L50-L57)

## Sidekiq Pro Early Version Upgrades

### Overview

Sidekiq Pro legacy versions 2.0 through 5.0 introduced major architectural enhancements, including nested batch workflows, atomic Lua-based reliable scheduling, and compatibility adaptations for successive Sidekiq core releases. Upgrading through these versions requires careful adherence to incremental gem version constraints and explicit migration sequences.

Sources: [docs/Pro-2.0-Upgrade.md:3-10](https://github.com/sidekiq/sidekiq/blob/main/docs/Pro-2.0-Upgrade.md#L3-L10), [docs/Pro-3.0-Upgrade.md:3-10](https://github.com/sidekiq/sidekiq/blob/main/docs/Pro-3.0-Upgrade.md#L3-L10), [docs/Pro-4.0-Upgrade.md:3-5](https://github.com/sidekiq/sidekiq/blob/main/docs/Pro-4.0-Upgrade.md#L3-L5), [docs/Pro-5.0-Upgrade.md:3-6](https://github.com/sidekiq/sidekiq/blob/main/docs/Pro-5.0-Upgrade.md#L3-L6)

### Pro 2.0 and 3.0 Architectural Transitions

Sidekiq Pro 2.0 overhauled the batch data model, reducing Redis storage size and introducing 14-character URL-safe Base64-encoded BIDs (replacing 16-character hex-encoded strings). It added support for nested batches via the `jobs` block method and a Lua-based reliable scheduler. Pro 3.0 removed Celluloid dependency, introduced instantaneous queue pausing, and added `timed_fetch!` for non-persistent hostname platforms like Heroku and Docker.

> [!WARNING]
> You cannot downgrade from Sidekiq Pro 2.x back to 1.x once batches have been created under 2.x, as the new batch data format will not process correctly. Applications running Pro < 1.5 must upgrade to the latest 1.x version and run it for a week before moving to 2.0.

Sources: [docs/Pro-2.0-Upgrade.md:15-16](https://github.com/sidekiq/sidekiq/blob/main/docs/Pro-2.0-Upgrade.md#L15-L16), [docs/Pro-2.0-Upgrade.md:18-19](https://github.com/sidekiq/sidekiq/blob/main/docs/Pro-2.0-Upgrade.md#L18-L19), [docs/Pro-2.0-Upgrade.md:72-74](https://github.com/sidekiq/sidekiq/blob/main/docs/Pro-2.0-Upgrade.md#L72-L74), [docs/Pro-3.0-Upgrade.md:11-27](https://github.com/sidekiq/sidekiq/blob/main/docs/Pro-3.0-Upgrade.md#L11-L27)

### Pro 4.0 and 5.0 Release Updates

Sidekiq Pro 4.0 introduced dead batch tracking, allowing developers to inspect dead batches and their associated failed jobs via `Sidekiq::Batch::DeadSet.new`. It removed older `reliable_fetch` and `timed_fetch` algorithms in favor of `super_fetch`. Sidekiq Pro 5.0 acted primarily as a cleanup release for Sidekiq 6.0, adding localized web UI support for Spanish, Chinese, Portuguese, Japanese, and Russian.

Sources: [docs/Pro-4.0-Upgrade.md:3-19](https://github.com/sidekiq/sidekiq/blob/main/docs/Pro-4.0-Upgrade.md#L3-L19), [docs/Pro-5.0-Upgrade.md:3-13](https://github.com/sidekiq/sidekiq/blob/main/docs/Pro-5.0-Upgrade.md#L3-L13)

### Legacy Pro Version Dependency Matrix

| Sidekiq Pro Version | Minimum Sidekiq Core | Minimum Ruby | Minimum Redis / Store | Key Architectural Additions |
| :--- | :--- | :--- | :--- | :--- |
| **Sidekiq Pro 2.0** | Sidekiq 3.3.2+ | Unspecified | Redis 2.8+ (2.4/2.6 partial) | Nested batches, Lua reliable scheduler, Base64 BIDs |
| **Sidekiq Pro 3.0** | Sidekiq 4.0+ | Unspecified | Redis 2.8+ (3.0.3+ recommended) | Removed Celluloid, instantaneous queue pausing, `timed_fetch!` |
| **Sidekiq Pro 4.0** | Sidekiq 5.0.5+ | Unspecified | Unspecified | Dead batch tracking (`Sidekiq::Batch::DeadSet`), `super_fetch` only |
| **Sidekiq Pro 5.0** | Sidekiq 6.0+ | Ruby 2.5+ | Redis 4.0+ | Web UI localizations (ES, ZH, PT, JA, RU), removed deprecated APIs |

Sources: [docs/Pro-2.0-Upgrade.md:11-13](https://github.com/sidekiq/sidekiq/blob/main/docs/Pro-2.0-Upgrade.md#L11-L13), [docs/Pro-3.0-Upgrade.md:3-9](https://github.com/sidekiq/sidekiq/blob/main/docs/Pro-3.0-Upgrade.md#L3-L9), [docs/Pro-4.0-Upgrade.md:3-22](https://github.com/sidekiq/sidekiq/blob/main/docs/Pro-4.0-Upgrade.md#L3-L22), [docs/Pro-5.0-Upgrade.md:10-13](https://github.com/sidekiq/sidekiq/blob/main/docs/Pro-5.0-Upgrade.md#L10-L13)

## Sidekiq Pro Modern Version Upgrades

### Overview

Sidekiq Pro 7.0 and 8.0 introduce significant architectural refactoring, updated dependency requirements, and modernized Redis data models for batch tracking. Version 7.0 skipped 6.x to synchronize its major version number with Sidekiq 7. Upgrading across these releases requires verifying minimum dependency versions, adapting metric collection configurations, and following precise staging guidelines to migrate Redis batch structures safely.

Sources: [docs/Pro-7.0-Upgrade.md:1-6](https://github.com/sidekiq/sidekiq/blob/main/docs/Pro-7.0-Upgrade.md#L1-L6), [docs/Pro-8.0-Upgrade.md:1-10](https://github.com/sidekiq/sidekiq/blob/main/docs/Pro-8.0-Upgrade.md#L1-L10)

### Sidekiq Pro 7.0 Refactoring and Dependency Updates

Sidekiq 7.0's embedding support required substantial refactoring of Pro internals while maintaining backward compatibility where possible. Legacy statsd support via the `statsd-ruby` gem was removed in favor of the actively maintained `dogstatsd-ruby` gem. Configuration for DogStatsD moved from `Sidekiq::Pro.dogstatsd` to the server configuration block.

> [!WARNING]
> Always upgrade gems using `bundle up sidekiq-pro` rather than `bundle up sidekiq`. Using the latter can lead to incompatible lower-level dependent gem versions in use.

Sources: [docs/Pro-7.0-Upgrade.md:7-34](https://github.com/sidekiq/sidekiq/blob/main/docs/Pro-7.0-Upgrade.md#L7-L34), [docs/Pro-7.0-Upgrade.md:36-41](https://github.com/sidekiq/sidekiq/blob/main/docs/Pro-7.0-Upgrade.md#L36-L41)

```ruby
Sidekiq::Pro.dogstatsd = -> { Datadog::Statsd.new("localhost", 8125) } # old way

Sidekiq.configure_server do |config|
  config.dogstatsd = -> { Datadog::Statsd.new("localhost", 8125) } # new way
end
```

Sources: [docs/Pro-7.0-Upgrade.md:19-25](https://github.com/sidekiq/sidekiq/blob/main/docs/Pro-7.0-Upgrade.md#L19-L25)

### Sidekiq Pro 8.0 Batch Data Model and Metric Changes

Sidekiq Pro 8.0 refactors `Sidekiq::Batch` internals to use modern Redis commands and data structures. Additionally, batches no longer store job error backtraces because they are redundant with job retries and consume excessive Redis memory. All Statsd metrics are now automatically prefixed with `sidekiq.`, allowing explicit `:namespace` options to be removed from initializers.

> [!CAUTION]
> Because of the data model changes in `Sidekiq::Batch`, customers must first upgrade to version 7.3.x and run it for several weeks to ensure all legacy Batch data clears from Redis before upgrading to 8.0. Safe upgrade indicators include an empty Batches page, running for at least a month, or confirming every `failinfo` key in Redis has a matching `failed` key.

Sources: [docs/Pro-8.0-Upgrade.md:5-35](https://github.com/sidekiq/sidekiq/blob/main/docs/Pro-8.0-Upgrade.md#L5-L35)

```ruby
Sidekiq.configure_server do |config|
  #config.dogstatsd = -> { Datadog::Statsd.new("localhost", 8125, namespace: "sidekiq") }
  config.dogstatsd = -> { Datadog::Statsd.new("localhost", 8125) }
end
```

Sources: [docs/Pro-8.0-Upgrade.md:30-35](https://github.com/sidekiq/sidekiq/blob/main/docs/Pro-8.0-Upgrade.md#L30-L35)

### Modern Pro Version Dependency Matrix

| Sidekiq Pro Version | Minimum Sidekiq Core | Minimum Ruby | Minimum Redis | Minimum DogStatsD | Version Support Policy |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Sidekiq Pro 7.0** | Sidekiq 7.0+ | Ruby 2.7+ | Redis 6.2+ | `dogstatsd-ruby` v5.0+ | Current and previous major versions only (Pro 4.x dropped) |
| **Sidekiq Pro 8.0** | Unspecified | Unspecified | Unspecified | Unspecified | Current and previous major versions only (Pro 5.x dropped) |

Sources: [docs/Pro-7.0-Upgrade.md:27-34](https://github.com/sidekiq/sidekiq/blob/main/docs/Pro-7.0-Upgrade.md#L27-L34), [docs/Pro-8.0-Upgrade.md:37-40](https://github.com/sidekiq/sidekiq/blob/main/docs/Pro-8.0-Upgrade.md#L37-L40)

## Sidekiq Enterprise Major Release Upgrades

### Overview

Sidekiq Enterprise major version upgrades introduce critical architectural refactorings, updated dependency requirements, and modified authentication APIs across milestones 2.0, 7.0, and 8.0. Upgrading across these releases requires precise handling of runtime license credentials, unique lock states, and updated web configuration blocks.

Sources: [docs/Ent-2.0-Upgrade.md:1-5](https://github.com/sidekiq/sidekiq/blob/main/docs/Ent-2.0-Upgrade.md#L1-L5), [docs/Ent-7.0-Upgrade.md:1-11](https://github.com/sidekiq/sidekiq/blob/main/docs/Ent-7.0-Upgrade.md#L1-L11), [docs/Ent-8.0-Upgrade.md:1-4](https://github.com/sidekiq/sidekiq/blob/main/docs/Ent-8.0-Upgrade.md#L1-L4)

### Sidekiq Enterprise 2.0 and Rate Limiter Backoffs

Sidekiq Enterprise 2.0 requires license credentials to be available at runtime. If Bundler was not configured via the access email, you must set `SIDEKIQ_ENT_USERNAME=abcdef12 bundle exec sidekiq...` when starting the process, or configure Bundler if vendoring. Additionally, dead jobs now release any unique locks they were holding upon death. Backoff behavior can be customized per rate limiter by passing a Proc:

Sources: [docs/Ent-2.0-Upgrade.md:3-15](https://github.com/sidekiq/sidekiq/blob/main/docs/Ent-2.0-Upgrade.md#L3-L15)

```ruby
limiter = Sidekiq::Limiter.bucket(:stripe, 10, :second, backoff: ->(limiter, job) {
  return job['overrated'] || 5 # wait for N seconds, where N is failure count
})
```

Sources: [docs/Ent-2.0-Upgrade.md:16-21](https://github.com/sidekiq/sidekiq/blob/main/docs/Ent-2.0-Upgrade.md#L16-L21)

> [!WARNING]
> When upgrading to 2.x, first upgrade to the latest Sidekiq Enterprise 1.x using `gem 'sidekiq-ent', '< 2'`, fix all deprecation warnings, and then upgrade to `< 3`.

Sources: [docs/Ent-2.0-Upgrade.md:27-37](https://github.com/sidekiq/sidekiq/blob/main/docs/Ent-2.0-Upgrade.md#L27-L37)

### Sidekiq Enterprise 7.0 Internals and Unique Locks

Sidekiq Enterprise 7.0 refactored internals to support embedding while removing deprecated features. Version 7.0.4 accidentally broke data compatibility with unique locks set by previous versions, which can manifest as temporary duplicate jobs until new-style locks populate in Redis.

Sources: [docs/Ent-7.0-Upgrade.md:3-19](https://github.com/sidekiq/sidekiq/blob/main/docs/Ent-7.0-Upgrade.md#L3-L19)

### Sidekiq Enterprise 8.0 Web Authorization

Sidekiq Enterprise 8.0 updates the `Sidekiq::Web` authorization scheme. The previous syntax using `Sidekiq::Web.authorize` is replaced by a configuration block inside `Sidekiq::Web.configure`:

Sources: [docs/Ent-8.0-Upgrade.md:7-26](https://github.com/sidekiq/sidekiq/blob/main/docs/Ent-8.0-Upgrade.md#L7-L26)

```ruby
Sidekiq::Web.configure do |config|
  config.authorize do |env, method, path|
    method == "GET" || method == "HEAD"
  end
end
```

Sources: [docs/Ent-8.0-Upgrade.md:19-26](https://github.com/sidekiq/sidekiq/blob/main/docs/Ent-8.0-Upgrade.md#L19-L26)

> [!IMPORTANT]
> Support is only guaranteed for the current and previous major versions. Releasing Sidekiq Enterprise 8.0 officially drops support for Sidekiq Enterprise 2.x.

Sources: [docs/Ent-8.0-Upgrade.md:28-30](https://github.com/sidekiq/sidekiq/blob/main/docs/Ent-8.0-Upgrade.md#L28-L30)

### Enterprise Version Dependency Matrix

| Enterprise Version | Minimum Ruby | Minimum Redis | Minimum Sidekiq Core | Minimum Pro Dependency | Dropped Support Milestone |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Sidekiq Enterprise 2.0** | Ruby 2.5+ | Redis 4.0+ | Sidekiq 6.0+ | Sidekiq Pro 5.0+ | Sidekiq Enterprise 1.x |
| **Sidekiq Enterprise 7.0** | Ruby 2.7+ | Redis 6.2+ | Sidekiq 7.0+ | Unspecified | Sidekiq Enterprise 1.x |
| **Sidekiq Enterprise 8.0** | Unspecified | Unspecified | Unspecified | Unspecified | Sidekiq Enterprise 2.x |

Sources: [docs/Ent-2.0-Upgrade.md:24-25](https://github.com/sidekiq/sidekiq/blob/main/docs/Ent-2.0-Upgrade.md#L24-L25), [docs/Ent-7.0-Upgrade.md:22-27](https://github.com/sidekiq/sidekiq/blob/main/docs/Ent-7.0-Upgrade.md#L22-L27), [docs/Ent-8.0-Upgrade.md:28-30](https://github.com/sidekiq/sidekiq/blob/main/docs/Ent-8.0-Upgrade.md#L28-L30)

## Enterprise Lifecycle and Change Management

### Overview

Sidekiq Enterprise tracks releases, bug fixes, and breaking changes through `Ent-Changes.md`. Its software development lifecycle (SDLC) adheres to structured phases covering planning, development, testing, release, and maintenance.

Sources: [Ent-Changes.md:1-7](https://github.com/sidekiq/sidekiq/blob/main/Ent-Changes.md#L1-L7), [docs/sdlc.md:1-100](https://github.com/sidekiq/sidekiq/blob/main/docs/sdlc.md#L1-L100)

### Commercial SDLC Phases

Sidekiq Pro and Sidekiq Enterprise follow a structured release process tailored for commercial functionality.

| Phase | Core Activity | Key Artifacts & Requirements |
| :--- | :--- | :--- |
| **1. Planning and requirements** | Issue tracking and milestone assignment | GitHub issues and milestones |
| **2. Development and coding** | Feature implementation on dedicated branches | Descriptive branches and pull requests |
| **3. Testing and quality assurance** | Automated linters, tests, and security scans | Bundler tests, GitHub Actions, `standard` linter |
| **4. Release and deployment** | Version tagging and changelog documentation | `Ent-Changes.md`, Git tags (`v1.2.3`), gem push |
| **5. Maintenance and support** | Vulnerability fixes and patch management | Private vulnerability reports, security policies |

Sources: [docs/sdlc.md:46-82](https://github.com/sidekiq/sidekiq/blob/main/docs/sdlc.md#L46-L82)

### Commercial Contribution Workflow

Because Sidekiq Enterprise is closed-source, public contributions and issue discussions take place in the open `sidekiq/sidekiq` repository. 

1. **Issue Creation**: Open an issue in the public `sidekiq/sidekiq` repository to propose changes or report bugs in commercial features.
2. **Review and Approval**: Maintainers evaluate the proposal. If approved, customers may submit a private Git patch via email to `support@contribsys.com`.
3. **Internal Implementation**: Maintainers commit changes to the private repository, subject to review by `@mperham`.

Sources: [docs/sdlc.md:83-94](https://github.com/sidekiq/sidekiq/blob/main/docs/sdlc.md#L83-L94)

> [!NOTE]
> Sidekiq Enterprise customers with an unlimited license can request read-only access to the private repositories for one designated GitHub user in good standing.

Sources: [docs/sdlc.md:95-97](https://github.com/sidekiq/sidekiq/blob/main/docs/sdlc.md#L95-L97)

## Commercial Licensing and Distribution Terms

### Overview

Sidekiq Pro and Sidekiq Enterprise are governed by specific commercial agreements between the customer and Contributed Systems. The software is licensed rather than sold, requiring a valid Source URL provided at purchase.

Sources: [COMM-LICENSE.txt:1-13](https://github.com/sidekiq/sidekiq/blob/main/COMM-LICENSE.txt#L1-L13)

### License Grants and Distribution Models

Different license types dictate usage rights across hosts, workers, and distribution channels.

| License Type | Host Scope | Worker Scope / Limit | Distribution Rights |
| :--- | :--- | :--- | :--- |
| **Unlimited Organization License** | Unlimited physical or virtual hosts controlled by you | Unlimited workers (threads within a Sidekiq server process) | Internal deployment only |
| **Limited Enterprise License** | Unlimited physical or virtual hosts controlled by you | Aggregate workers must not exceed the maximum number authorized at purchase | Internal deployment only |
| **Enterprise Site License** | Unlimited physical or virtual hosts controlled by you | Unlimited workers | Internal deployment only |
| **Appliance License** | Unlimited physical or virtual hosts controlled by you | Determined by underlying license | Permitted within developed Applications, provided customers cannot use the Software independently |

Sources: [COMM-LICENSE.txt:14-22](https://github.com/sidekiq/sidekiq/blob/main/COMM-LICENSE.txt#L14-L22)

### Modifications and Restricted Uses

Contributed Systems provides source code to allow users to create Modifications, defined as any addition to, deletion from, or new file containing parts of the original Software. While users retain copyright on original authored modifications, Contributed Systems retains all intellectual property rights in the base software.

> [!CAUTION]
> Under no circumstances may you use the Software as part of a product or service that provides similar functionality to the Software itself, nor can you decompile, reverse engineer, or publicly disseminate performance benchmarks without authorization.

Sources: [COMM-LICENSE.txt:27-34](https://github.com/sidekiq/sidekiq/blob/main/COMM-LICENSE.txt#L27-L34)

### Verification and Compliance

The Software periodically sends aggregate usage data to Contributed Systems to verify license compliance, and this mechanism must not be disabled or blocked. Contributed Systems may request an annual signed compliance document.

Sources: [COMM-LICENSE.txt:64-71](https://github.com/sidekiq/sidekiq/blob/main/COMM-LICENSE.txt#L64-L71)

## Related

- [[Open Source Upgrades]]

