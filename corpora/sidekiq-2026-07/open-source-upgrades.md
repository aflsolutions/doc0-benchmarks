# Open Source Upgrades

<details>
<summary>Relevant source files</summary>

The following files were used as context for generating this wiki page:

- [Ent-Changes.md](https://github.com/sidekiq/sidekiq/blob/main/Ent-Changes.md)
- [docs/8.0-Upgrade.md](https://github.com/sidekiq/sidekiq/blob/main/docs/8.0-Upgrade.md)
- [README.md](https://github.com/sidekiq/sidekiq/blob/main/README.md)
- [docs/capsule.md](https://github.com/sidekiq/sidekiq/blob/main/docs/capsule.md)
- [docs/3.0-Upgrade.md](https://github.com/sidekiq/sidekiq/blob/main/docs/3.0-Upgrade.md)
- [docs/Pro-2.0-Upgrade.md](https://github.com/sidekiq/sidekiq/blob/main/docs/Pro-2.0-Upgrade.md)
- [docs/5.0-Upgrade.md](https://github.com/sidekiq/sidekiq/blob/main/docs/5.0-Upgrade.md)
- [docs/7.0-Upgrade.md](https://github.com/sidekiq/sidekiq/blob/main/docs/7.0-Upgrade.md)
- [docs/6.0-Upgrade.md](https://github.com/sidekiq/sidekiq/blob/main/docs/6.0-Upgrade.md)
- [docs/7.0-API-Migration.md](https://github.com/sidekiq/sidekiq/blob/main/docs/7.0-API-Migration.md)
- [docs/Pro-8.0-Upgrade.md](https://github.com/sidekiq/sidekiq/blob/main/docs/Pro-8.0-Upgrade.md)
- [docs/Pro-3.0-Upgrade.md](https://github.com/sidekiq/sidekiq/blob/main/docs/Pro-3.0-Upgrade.md)
- [docs/4.0-Upgrade.md](https://github.com/sidekiq/sidekiq/blob/main/docs/4.0-Upgrade.md)
- [docs/Ent-8.0-Upgrade.md](https://github.com/sidekiq/sidekiq/blob/main/docs/Ent-8.0-Upgrade.md)
- [docs/Pro-7.0-Upgrade.md](https://github.com/sidekiq/sidekiq/blob/main/docs/Pro-7.0-Upgrade.md)
- [docs/Pro-5.0-Upgrade.md](https://github.com/sidekiq/sidekiq/blob/main/docs/Pro-5.0-Upgrade.md)
- [docs/Ent-7.0-Upgrade.md](https://github.com/sidekiq/sidekiq/blob/main/docs/Ent-7.0-Upgrade.md)
- [docs/Pro-4.0-Upgrade.md](https://github.com/sidekiq/sidekiq/blob/main/docs/Pro-4.0-Upgrade.md)
- [docs/webui.md](https://github.com/sidekiq/sidekiq/blob/main/docs/webui.md)
- [docs/Ent-2.0-Upgrade.md](https://github.com/sidekiq/sidekiq/blob/main/docs/Ent-2.0-Upgrade.md)
- [docs/middleware.md](https://github.com/sidekiq/sidekiq/blob/main/docs/middleware.md)
</details>

## Overview

Navigating major Sidekiq releases requires careful planning to manage breaking changes across core runtime dependencies, Redis integrations, and application code. This reference details the cumulative upgrade paths, architectural evolutions, and compatibility strategies spanning from early major versions through to Sidekiq 8.0.
Sources: [README.md:65-66](https://github.com/sidekiq/sidekiq/blob/main/README.md#L65-L66), [docs/8.0-Upgrade.md:63-64](https://github.com/sidekiq/sidekiq/blob/main/docs/8.0-Upgrade.md#L63-L64)

The upgrade guides outline systematic approaches to address shifting dependency baselines, such as minimum version requirements for Ruby, Rails, and Redis or its alternatives like Valkey and Dragonfly, while minimizing production downtime.
Sources: [README.md:16-19](https://github.com/sidekiq/sidekiq/blob/main/README.md#L16-L19), [docs/8.0-Upgrade.md:53-55](https://github.com/sidekiq/sidekiq/blob/main/docs/8.0-Upgrade.md#L53-L55)

## Early Major Upgrades 3.0 to 5.0

Major version updates across Sidekiq 3.0, 4.0, and 5.0 introduced significant architectural changes, shifting dependency baselines, and modified API contracts. Upgrading requires adhering to specific dependency constraints, updating client and server-side middleware signatures, and adapting to internal execution core redesigns that integrate tightly with Ruby and Rails runtimes.
Sources: [docs/3.0-Upgrade.md:1-4](https://github.com/sidekiq/sidekiq/blob/main/docs/3.0-Upgrade.md#L1-L4), [docs/4.0-Upgrade.md:1-3](https://github.com/sidekiq/sidekiq/blob/main/docs/4.0-Upgrade.md#L1-L3), [docs/5.0-Upgrade.md:3-6](https://github.com/sidekiq/sidekiq/blob/main/docs/5.0-Upgrade.md#L3-L6)

Sidekiq 3.0 replaced several global client and worker methods, requiring code updates across applications and third-party libraries. Client-side middleware signatures changed to accept a Redis connection pool explicitly for sharding purposes, replacing the legacy `Sidekiq.redis` calls with pool block execution.
Sources: [docs/3.0-Upgrade.md:9-17](https://github.com/sidekiq/sidekiq/blob/main/docs/3.0-Upgrade.md#L9-L17), [docs/3.0-Upgrade.md:21-26](https://github.com/sidekiq/sidekiq/blob/main/docs/3.0-Upgrade.md#L21-L26)

| Legacy API / Behavior | Sidekiq 3.0 Replacement / Requirement | Notes |
| :--- | :--- | :--- |
| `Sidekiq::Client.registered_workers` | `Sidekiq::Workers.new` | Internal process and thread data model reworked. |
| `Sidekiq::Client.registered_queues` | `Sidekiq::Queue.all` | Queue inspection API refactored. |
| `Sidekiq::Worker#retries_exhausted` | `Sidekiq::Worker.sidekiq_retries_exhausted` | Class-level hook replacement. |
| Job error middleware | `config.error_handlers << proc { \|ex, context\| ... }` | Global error handlers replace server middleware for capturing exceptions. |
| Transparent Redis-to-Go activation | `heroku config:set REDIS_PROVIDER=REDISTOGO_URL` | Explicit provider configuration required on Heroku. |
Sources: [docs/3.0-Upgrade.md:21-65](https://github.com/sidekiq/sidekiq/blob/main/docs/3.0-Upgrade.md#L21-L65)

> [!WARNING]
> `sidekiq/api` is no longer automatically required in Sidekiq 3.0. Any application code invoking the Sidekiq API directly must explicitly require `sidekiq/api`.
Sources: [docs/3.0-Upgrade.md:27-28](https://github.com/sidekiq/sidekiq/blob/main/docs/3.0-Upgrade.md#L27-L28)

Sidekiq 4.0 removed Celluloid entirely and dropped `redis-namespace` from default gem dependencies, requiring applications using namespacing to explicitly bundle the `redis-namespace` gem. Redis 2.8.0 became the minimum hard requirement, with Redis 3.0.3 or greater recommended for large-scale deployments.
Sources: [docs/4.0-Upgrade.md:8-20](https://github.com/sidekiq/sidekiq/blob/main/docs/4.0-Upgrade.md#L8-L20)

Because jobs are fetched from Redis in parallel to improve network latency resilience, Sidekiq 4.0 demands increased connection capacity. Processes require a minimum of `concurrency + 2` connections in the Redis connection pool, or Sidekiq will exit upon startup. Furthermore, worker data updates shifted from real-time tracking to interval-based heartbeats, meaning the `Sidekiq::Workers` API is no longer millisecond-precise.
Sources: [docs/4.0-Upgrade.md:22-30](https://github.com/sidekiq/sidekiq/blob/main/docs/4.0-Upgrade.md#L22-L30)

Sidekiq 5.0 restructured its job execution core inside `Sidekiq::Processor` to integrate directly with the Rails 5.0 `ActiveSupport::Executor`, managing ActiveRecord connections, job callbacks, and development mode class loading natively without wrapping them in Sidekiq middleware.
Sources: [docs/5.0-Upgrade.md:9-16](https://github.com/sidekiq/sidekiq/blob/main/docs/5.0-Upgrade.md#L9-L16)

Delayed extensions (`delay`, `delay_for`, and `delay_until`) were disabled by default to prevent large YAML-marshaled payloads from causing Redis timeouts; they can be re-enabled explicitly via `Sidekiq::Extensions.enable_delay!`. Additionally, the quiet signal changed from `USR1` to `TSTP` (Thread STop) for JRuby compatibility, unparseable JSON payloads route directly to the Dead set, and runtime baselines advanced to require Ruby 2.2.2+ while dropping support for Ruby 2.0, 2.1, and Rails 3.2.
Sources: [docs/5.0-Upgrade.md:17-41](https://github.com/sidekiq/sidekiq/blob/main/docs/5.0-Upgrade.md#L17-L41)

## Sidekiq 6.0 Modernization and Cleanup

### Overview

Sidekiq 6.0 introduces major breaking changes designed to modernize the framework, streamline operations, and raise the dependency baselines for language and storage runtimes.
Sources: [docs/6.0-Upgrade.md:3-8](https://github.com/sidekiq/sidekiq/blob/main/docs/6.0-Upgrade.md#L3-L8)

### Baseline Requirements and Deprecations

Sidekiq 6.0 drops support for End-Of-Life versions of Ruby, Rails, and Redis. The minimum runtime baselines are explicitly enforced:
- **Ruby <2.5** is no longer supported.
- **Rails <5** is no longer supported.
- **Redis <4** is no longer supported.
Sources: [docs/6.0-Upgrade.md:55-57](https://github.com/sidekiq/sidekiq/blob/main/docs/6.0-Upgrade.md#L55-L57)

### CLI and Configuration Changes

Legacy command-line arguments and utilities have been removed to align with modern process management standards. Daemonization options (`daemonization`, `logfile`, and `pidfile` command line arguments) along with the `sidekiqctl` binary are completely removed. Operators are advised to use init systems such as systemd, upstart, or foreman.
Sources: [docs/6.0-Upgrade.md:39-43](https://github.com/sidekiq/sidekiq/blob/main/docs/6.0-Upgrade.md#L39-L43)

The default shutdown timeout has been increased from 8 seconds to 25 seconds to leverage default limits used by Heroku and ECS (30 seconds). Deployments depending on the old behavior can pass `-t 8`.
Sources: [docs/6.0-Upgrade.md:50-54](https://github.com/sidekiq/sidekiq/blob/main/docs/6.0-Upgrade.md#L50-L54)

> [!WARNING]
> The `REDIS_PROVIDER` environment variable must hold the name of the environment variable containing your Redis URL (for example, `REDISTOGO_URL`), rather than the actual Redis URL string itself. To set a raw Redis URL directly, use `REDIS_URL`.
Sources: [docs/6.0-Upgrade.md:44-49](https://github.com/sidekiq/sidekiq/blob/main/docs/6.0-Upgrade.md#L44-L49)

Logging has been redesigned to support pluggable formatters. Sidekiq automatically detects and enables the best formatter for the runtime environment, but formatters can also be explicitly configured via `Sidekiq.configure_server`.
Sources: [docs/6.0-Upgrade.md:22-37](https://github.com/sidekiq/sidekiq/blob/main/docs/6.0-Upgrade.md#L22-L37)

| Log Formatter Name | Description / Target Environment |
| :--- | :--- |
| `default` | Typical output format designed for macOS |
| `heroku` | Enabled specifically when running within Heroku |
| `json` | Structured JSON format outputting one hash per line for search indexing |
Sources: [docs/6.0-Upgrade.md:22-27](https://github.com/sidekiq/sidekiq/blob/main/docs/6.0-Upgrade.md#L22-L27)

## Sidekiq 7.0 Capsules and Architecture

### Overview

Sidekiq 7.0 introduces capsules and isolated execution contexts, representing the largest internal refactoring since Sidekiq 4.0. Prior to 7.0, Sidekiq relied on global mutable singletons on the Sidekiq module, such as `Sidekiq.logger` and `Sidekiq.redis`, which prevented Ractor compatibility, multiple process instances, and embedding within other Ruby processes like Puma. Sidekiq 7.0 resolves this by introducing `Sidekiq::Config`, `Sidekiq::Capsule`, and `Sidekiq::Component` to encapsulate state and resources.
Sources: [docs/capsule.md:15-32](https://github.com/sidekiq/sidekiq/blob/main/docs/capsule.md#L15-L32), [docs/capsule.md:40-45](https://github.com/sidekiq/sidekiq/blob/main/docs/capsule.md#L40-L45), [docs/capsule.md:101-105](https://github.com/sidekiq/sidekiq/blob/main/docs/capsule.md#L101-L105)

### Core Architecture and Configuration Components

`Sidekiq::CLI` creates a `Sidekiq::Config` instance holding global configuration at `Sidekiq.default_configuration`. `Sidekiq::Capsule` represents the set of resources necessary to process a set of queues. `Sidekiq::Launcher` takes a `Sidekiq::Config` and launches the tree of runtime components for each capsule, after which the global config and capsules are frozen and immutable. Every internal component takes a `Sidekiq::Capsule` instance, replacing global state with capsule-local resources.
Sources: [docs/capsule.md:43-69](https://github.com/sidekiq/sidekiq/blob/main/docs/capsule.md#L43-L69)

> [!IMPORTANT]
> A Sidekiq process only executes jobs from one Redis instance; all Capsules within a process must share that same Redis instance.
Sources: [docs/capsule.md:70-71](https://github.com/sidekiq/sidekiq/blob/main/docs/capsule.md#L70-L71)

### Capsule Configuration and Redis Pools

Capsules allow fine-grained concurrency tuning per queue set. For example, a specialized capsule can process thread-unsafe jobs with a single thread while the default capsule handles general queues.
Sources: [docs/capsule.md:73-86](https://github.com/sidekiq/sidekiq/blob/main/docs/capsule.md#L73-L86), [docs/7.0-Upgrade.md:21-40](https://github.com/sidekiq/sidekiq/blob/main/docs/7.0-Upgrade.md#L21-L40)

```ruby
Sidekiq.configure_server do |config|
  config.capsule("unsafe") do |capsule|
    capsule.queues = %w(thread_unsafe)
    capsule.concurrency = 1
  end
end
```
Sources: [docs/capsule.md:78-86](https://github.com/sidekiq/sidekiq/blob/main/docs/capsule.md#L78-L86)

Sidekiq creates multiple lazy connection pools: an internal pool of **10** connections for framework components, plus a pool sized to **concurrency** for job processors within each Capsule.
Sources: [docs/capsule.md:92-96](https://github.com/sidekiq/sidekiq/blob/main/docs/capsule.md#L92-L96)

| Pool Type | Connection Pool Size | Target Purpose / Consumers |
| :--- | :--- | :--- |
| Internal pool | 10 | Available to Sidekiq framework components |
| Capsule processor pool | Equal to capsule `concurrency` | Job processors and jobs running within the Capsule |
Sources: [docs/capsule.md:92-99](https://github.com/sidekiq/sidekiq/blob/main/docs/capsule.md#L92-L99)

## API Migrations and Middleware Redesign

Sidekiq 7.0 introduces significant API refactoring and breaking signature updates that require adjustments in initializers and custom extensions. Top-level configuration attributes like `Sidekiq.logger` and direct `ConnectionPool` passing are removed in favor of block-based configuration and automatic pool sizing.
Sources: [docs/7.0-API-Migration.md:3-35](https://github.com/sidekiq/sidekiq/blob/main/docs/7.0-API-Migration.md#L3-L35)

Reading configuration directly via `Sidekiq[:key]` raises a `NoMethodError` and must be replaced with `Sidekiq.default_configuration[:key]`.
Sources: [docs/7.0-API-Migration.md:84-94](https://github.com/sidekiq/sidekiq/blob/main/docs/7.0-API-Migration.md#L84-L94)

Custom log formatters must now be assigned to `cfg.logger.formatter` instead of `cfg.log_formatter`. When configuring Redis sentinels, the `name` keyword argument is required under the updated `redis-client` gem integration. Delayed extensions are fully removed and require migration to `Sidekiq::Job` or the third-party gem `sidekiq-delay_extensions`.
Sources: [docs/7.0-API-Migration.md:17-28](https://github.com/sidekiq/sidekiq/blob/main/docs/7.0-API-Migration.md#L17-L28), [docs/7.0-API-Migration.md:50-79](https://github.com/sidekiq/sidekiq/blob/main/docs/7.0-API-Migration.md#L50-L79), [docs/7.0-API-Migration.md:82-107](https://github.com/sidekiq/sidekiq/blob/main/docs/7.0-API-Migration.md#L82-L107)

> [!WARNING]
> Passing raw `ConnectionPool` instances to `cfg.redis=` is no longer allowed because manual sizing frequently caused performance degradation. Sidekiq now automatically tunes pool size based on concurrency settings and lazy-loads connections.
Sources: [docs/7.0-API-Migration.md:30-48](https://github.com/sidekiq/sidekiq/blob/main/docs/7.0-API-Migration.md#L30-L48)

Middleware classes must include helper modules and adopt updated method signatures. Client middleware includes `Sidekiq::ClientMiddleware` with a `call(job_class_or_string, job, queue, redis_pool)` signature, while server middleware includes `Sidekiq::ServerMiddleware` with a `call(job_instance, job_payload, queue)` signature. Within server middleware, helper methods `redis` and `logger` replace global `Sidekiq` module lookups.
Sources: [docs/middleware.md:6-12](https://github.com/sidekiq/sidekiq/blob/main/docs/middleware.md#L6-L12), [docs/middleware.md:54-90](https://github.com/sidekiq/sidekiq/blob/main/docs/middleware.md#L54-L90)

```ruby
class Server
  include Sidekiq::ServerMiddleware

  def initialize(optional_args)
    @args = optional_args
  end
  
  def call(job_instance, job_payload, queue)
    redis {|c| c.do_something }
    logger.info { "Some message" }
    yield
  end
end

Sidekiq.configure_server do |config|
  config.server_middleware do |chain|
    chain.add Server, optional_args
  end
end
```
Sources: [docs/middleware.md:73-90](https://github.com/sidekiq/sidekiq/blob/main/docs/middleware.md#L73-L90)

## Sidekiq 8.0 Web UI and Configuration

### Overview

Sidekiq 8.0 heavily refactors `Sidekiq::Web` to improve security, configuration ergonomics, and performance. The CSS implementation has been completely rewritten from scratch without Twitter Bootstrap, reducing CSS size from 160KB to 16KB and lowering average page render times from 55ms to 3ms.
Sources: [docs/8.0-Upgrade.md:15-20](https://github.com/sidekiq/sidekiq/blob/main/docs/8.0-Upgrade.md#L15-L20)

### Configuration and Block-Based Setup

Prior to 8.0, configuration relied on global class methods directly on the `Sidekiq::Web` class. Sidekiq 8.0 wraps these options inside a `Sidekiq::Web.configure` block, enabling cleaner registration of third-party extensions, custom Rack middleware, and UI tweaks.
Sources: [docs/webui.md:11-28](https://github.com/sidekiq/sidekiq/blob/main/docs/webui.md#L11-L28), [docs/webui.md:34-41](https://github.com/sidekiq/sidekiq/blob/main/docs/webui.md#L34-L41)

```ruby
require "sidekiq/web"
Sidekiq::Web.configure do |config|
  config.register(MyExtension, name: "myext", tab: "TabName", index: "tabpage/")
  config.use Some::Rack::Middleware
  config.app_url "https://acmecorp.com" # Adds "Back to App" button in the UI
end
```
Sources: [docs/webui.md:34-41](https://github.com/sidekiq/sidekiq/blob/main/docs/webui.md#L34-L41)

### Security Enhancements

Sidekiq 8.0 introduces stricter parameter handling and asset policies to prevent parameter tampering and Cross-Site Scripting (XSS).
Sources: [docs/webui.md:45-48](https://github.com/sidekiq/sidekiq/blob/main/docs/webui.md#L45-L48)

| Parameter Type | Accessor Method | Description / Enforcement |
| :--- | :--- | :--- |
| Route Parameters | `route_params(:bid)` | Variables defined directly within the URL route path |
| URL Parameters | `url_params("size")` | Query string parameters appended to the request URL |
Sources: [docs/webui.md:52-60](https://github.com/sidekiq/sidekiq/blob/main/docs/webui.md#L52-L60)

> [!CAUTION]
> Sidekiq 8.0 explicitly distinguishes between URL parameters and route parameters using separate Strings or Symbols. This prevents attackers from overriding critical route variables (such as a batch ID) simply by appending a query parameter with a matching name.
Sources: [docs/webui.md:52-64](https://github.com/sidekiq/sidekiq/blob/main/docs/webui.md#L52-L64)

> [!NOTE]
> `Sidekiq::Web` 8.0 strengthens its Content-Security-Policy by requiring all assets to tag themselves with a per-request nonce. You can automate this using the `stylesheet_tag` and `script_tag` helpers available in `lib/sidekiq/web/helpers.rb`.
Sources: [docs/webui.md:68-71](https://github.com/sidekiq/sidekiq/blob/main/docs/webui.md#L68-L71)

## Cross Version Upgrade and Compatibility Strategies

Sidekiq enforces a strict upgrade discipline across major releases to maintain stability and prevent silent data corruption. Upgrades must always be executed **one major version at a time**, ensuring that all intermediate deprecation warnings are identified and resolved before moving to the next boundary.
Sources: [docs/8.0-Upgrade.md:61-63](https://github.com/sidekiq/sidekiq/blob/main/docs/8.0-Upgrade.md#L61-L63), [docs/5.0-Upgrade.md:43-45](https://github.com/sidekiq/sidekiq/blob/main/docs/5.0-Upgrade.md#L43-L45), [docs/7.0-Upgrade.md:91-93](https://github.com/sidekiq/sidekiq/blob/main/docs/7.0-Upgrade.md#L91-L93)

Sidekiq provides official support guaranteed exclusively for the **current and previous major versions**. When a new major release ships, support for the oldest previously supported major branch is immediately dropped.
Sources: [docs/8.0-Upgrade.md:57-58](https://github.com/sidekiq/sidekiq/blob/main/docs/8.0-Upgrade.md#L57-L58), [docs/7.0-Upgrade.md:88-89](https://github.com/sidekiq/sidekiq/blob/main/docs/7.0-Upgrade.md#L88-L89)

```ruby
# Step 1: Pin your application to the end of the previous major version series
gem 'sidekiq', '< 9'

# Step 2: Fix any deprecation warnings and test thoroughly in production
# Step 3: Advance to the target major version
```
Sources: [docs/8.0-Upgrade.md:67-74](https://github.com/sidekiq/sidekiq/blob/main/docs/8.0-Upgrade.md#L67-L74)

> [!WARNING]
> Using blanket commands like `bundle up sidekiq` can pull in incompatible gem versions across commercial extensions like `sidekiq-pro` and `sidekiq-ent`. Always upgrade commercial packages with their designated gem names (`bundle up sidekiq-pro` or `bundle up sidekiq-ent`) to pull matching dependencies safely.
Sources: [docs/Pro-8.0-Upgrade.md:41-46](https://github.com/sidekiq/sidekiq/blob/main/docs/Pro-8.0-Upgrade.md#L41-L46), [docs/Ent-8.0-Upgrade.md:34-37](https://github.com/sidekiq/sidekiq/blob/main/docs/Ent-8.0-Upgrade.md#L34-L37)

## Related

- [[Commercial Product Upgrades]]
- [[Design Internals]]

