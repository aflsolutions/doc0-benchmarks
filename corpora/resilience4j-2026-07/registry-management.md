# Registry Management

<details>
<summary>Relevant source files</summary>

The following files were used as context for generating this wiki page:

- [README.adoc](https://github.com/resilience4j/resilience4j/blob/main/README.adoc)
- [resilience4j-micronaut/src/main/java/io/github/resilience4j/micronaut/circuitbreaker/CircuitBreakerRegistryFactory.java](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-micronaut/src/main/java/io/github/resilience4j/micronaut/circuitbreaker/CircuitBreakerRegistryFactory.java)
- [resilience4j-micronaut/src/main/java/io/github/resilience4j/micronaut/ratelimiter/RateLimiterRegistryFactory.java](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-micronaut/src/main/java/io/github/resilience4j/micronaut/ratelimiter/RateLimiterRegistryFactory.java)
- [resilience4j-retry/src/main/java/io/github/resilience4j/retry/RetryRegistry.java](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-retry/src/main/java/io/github/resilience4j/retry/RetryRegistry.java)
- [resilience4j-bulkhead/src/main/java/io/github/resilience4j/bulkhead/internal/InMemoryThreadPoolBulkheadRegistry.java](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-bulkhead/src/main/java/io/github/resilience4j/bulkhead/internal/InMemoryThreadPoolBulkheadRegistry.java)
- [resilience4j-micronaut/src/main/java/io/github/resilience4j/micronaut/retry/RetryRegistryFactory.java](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-micronaut/src/main/java/io/github/resilience4j/micronaut/retry/RetryRegistryFactory.java)
- [resilience4j-micronaut/src/main/java/io/github/resilience4j/micronaut/bulkhead/BulkHeadRegistryFactory.java](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-micronaut/src/main/java/io/github/resilience4j/micronaut/bulkhead/BulkHeadRegistryFactory.java)
- [resilience4j-micronaut/src/main/java/io/github/resilience4j/micronaut/bulkhead/ThreadPoolBulkheadFactory.java](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-micronaut/src/main/java/io/github/resilience4j/micronaut/bulkhead/ThreadPoolBulkheadFactory.java)
- [resilience4j-core/src/main/java/io/github/resilience4j/core/registry/AbstractRegistry.java](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-core/src/main/java/io/github/resilience4j/core/registry/AbstractRegistry.java)
- [resilience4j-hedge/src/main/java/io/github/resilience4j/hedge/internal/InMemoryHedgeRegistry.java](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-hedge/src/main/java/io/github/resilience4j/hedge/internal/InMemoryHedgeRegistry.java)
- [resilience4j-bulkhead/src/main/java/io/github/resilience4j/bulkhead/ThreadPoolBulkheadRegistry.java](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-bulkhead/src/main/java/io/github/resilience4j/bulkhead/ThreadPoolBulkheadRegistry.java)
- [resilience4j-retry/src/main/java/io/github/resilience4j/retry/internal/InMemoryRetryRegistry.java](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-retry/src/main/java/io/github/resilience4j/retry/internal/InMemoryRetryRegistry.java)
- [resilience4j-timelimiter/src/main/java/io/github/resilience4j/timelimiter/internal/InMemoryTimeLimiterRegistry.java](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-timelimiter/src/main/java/io/github/resilience4j/timelimiter/internal/InMemoryTimeLimiterRegistry.java)
- [resilience4j-commons-configuration/src/main/java/io/github/resilience4j/commons/configuration/retry/configure/CommonsConfigurationRetryRegistry.java](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-commons-configuration/src/main/java/io/github/resilience4j/commons/configuration/retry/configure/CommonsConfigurationRetryRegistry.java)
- [resilience4j-commons-configuration/src/main/java/io/github/resilience4j/commons/configuration/circuitbreaker/configure/CommonsConfigurationCircuitBreakerRegistry.java](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-commons-configuration/src/main/java/io/github/resilience4j/commons/configuration/circuitbreaker/configure/CommonsConfigurationCircuitBreakerRegistry.java)
- [resilience4j-commons-configuration/src/main/java/io/github/resilience4j/commons/configuration/ratelimiter/configure/CommonsConfigurationRateLimiterRegistry.java](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-commons-configuration/src/main/java/io/github/resilience4j/commons/configuration/ratelimiter/configure/CommonsConfigurationRateLimiterRegistry.java)
- [resilience4j-commons-configuration/src/main/java/io/github/resilience4j/commons/configuration/bulkhead/configure/CommonsConfigurationBulkheadRegistry.java](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-commons-configuration/src/main/java/io/github/resilience4j/commons/configuration/bulkhead/configure/CommonsConfigurationBulkheadRegistry.java)
- [resilience4j-core/src/main/java/io/github/resilience4j/core/registry/InMemoryRegistryStore.java](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-core/src/main/java/io/github/resilience4j/core/registry/InMemoryRegistryStore.java)
- [resilience4j-consumer/src/main/java/io/github/resilience4j/consumer/DefaultEventConsumerRegistry.java](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-consumer/src/main/java/io/github/resilience4j/consumer/DefaultEventConsumerRegistry.java)
- [resilience4j-ratelimiter/src/main/java/io/github/resilience4j/ratelimiter/RateLimiterRegistry.java](https://github.com/resilience4j/ratelimiter/src/main/java/io/github/resilience4j/ratelimiter/RateLimiterRegistry.java)
- [resilience4j-circuitbreaker/src/main/java/io/github/resilience4j/circuitbreaker/CircuitBreakerRegistry.java](https://github.com/resilience4j/circuitbreaker/CircuitBreakerRegistry.java)
- [resilience4j-timelimiter/src/main/java/io/github/resilience4j/timelimiter/TimeLimiterRegistry.java](https://github.com/resilience4j/timelimiter/TimeLimiterRegistry.java)
- [resilience4j-cache/src/main/java/io/github/resilience4j/cache/CacheRegistryStore.java](https://github.com/resilience4j/cache/CacheRegistryStore.java)
- [resilience4j-bulkhead/src/main/java/io/github/resilience4j/bulkhead/BulkheadRegistry.java](https://github.com/resilience4j/bulkhead/BulkheadRegistry.java)
- [resilience4j-spring-boot4/src/main/java/io/github/resilience4j/springboot/bulkhead/autoconfigure/BulkheadRefreshScopedRegistryAutoConfiguration.java](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-spring-boot4/src/main/java/io/github/resilience4j/springboot/bulkhead/autoconfigure/BulkheadRefreshScopedRegistryAutoConfiguration.java)
- [resilience4j-core/src/main/java/io/github/resilience4j/core/registry/package-info.java](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-core/src/main/java/io/github/resilience4j/core/registry/package-info.java)
- [resilience4j-spring-boot4/src/main/java/io/github/resilience4j/springboot/retry/autoconfigure/RetryRefreshScopedRegistryAutoConfiguration.java](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-spring-boot4/src/main/java/io/github/resilience4j/springboot/retry/autoconfigure/RetryRefreshScopedRegistryAutoConfiguration.java)
- [resilience4j-hedge/src/main/java/io/github/resilience4j/hedge/HedgeRegistry.java](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-hedge/src/main/java/io/github/resilience4j/hedge/HedgeRegistry.java)
- [resilience4j-core/src/main/java/io/github/resilience4j/core/Registry.java](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-core/src/main/java/io/github/resilience4j/core/Registry.java)
- [resilience4j-core/src/main/java/io/github/resilience4j/core/RegistryStore.java](https://github.com/resilience4j/core/RegistryStore.java)
</details>

## Overview

Registry management in Resilience4j provides centralized creation, configuration, and lifecycle tracking for all fault-tolerance decorators and resilience instances. By abstracting instance caching, configuration inheritance, and event dispatching behind robust core contracts, the registry subsystem ensures that circuit breakers, rate limiters, bulkheads, retries, time limiters, and hedges are instantiated efficiently, isolated correctly per backend service, and observed seamlessly across different application runtimes and frameworks.

Sources: [resilience4j-retry/src/main/java/io/github/resilience4j/retry/RetryRegistry.java#L28-L31](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-retry/src/main/java/io/github/resilience4j/retry/RetryRegistry.java#L28-L31), [resilience4j-core/src/main/java/io/github/resilience4j/core/registry/AbstractRegistry.java#L31-L34](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-core/src/main/java/io/github/resilience4j/core/registry/AbstractRegistry.java#L31-L34)

Designed to support concurrent workloads and modern asynchronous platforms like Java virtual threads, the architecture combines flexible underlying storage mechanisms—such as concurrent map stores and JCache adapters—with standardized factories, event consumer registries, and framework integrations for Micronaut, Spring Boot, and Apache Commons Configuration.

Sources: [resilience4j-core/src/main/java/io/github/resilience4j/core/registry/InMemoryRegistryStore.java#L29-L31](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-core/src/main/java/io/github/resilience4j/core/registry/InMemoryRegistryStore.java#L29-L31), [resilience4j-cache/src/main/java/io/github/resilience4j/cache/CacheRegistryStore.java#L14-L16](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-cache/src/main/java/io/github/resilience4j/cache/CacheRegistryStore.java#L14-L16), [resilience4j-micronaut/src/main/java/io/github/resilience4j/micronaut/circuitbreaker/CircuitBreakerRegistryFactory.java#L45-L47](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-micronaut/src/main/java/io/github/resilience4j/micronaut/circuitbreaker/CircuitBreakerRegistryFactory.java#L45-L47)

## Core Registry Contracts and Interfaces

### Core Contract Definitions

The foundational contract for all Resilience4j management components is defined by the generic `Registry<E, C>` interface, where `E` represents the resilience instance type and `C` represents its corresponding configuration class. This top-level contract establishes uniform methods for managing configurations, manipulating entries, retrieving global registry tags, and publishing registry lifecycle events through its nested `EventPublisher` interface.

Sources: [resilience4j-core/src/main/java/io/github/resilience4j/core/Registry.java#L32-L110](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-core/src/main/java/io/github/resilience4j/core/Registry.java#L32-L110)

### Registry Contract Methods

The `Registry` interface declares operations for instance lookup, configuration management, and event subscription.

| Method Signature | Return Type | Description |
| :--- | :--- | :--- |
| `addConfiguration(String configName, C configuration)` | `void` | Adds a shared configuration under a given name. |
| `find(String name)` | `Optional<E>` | Finds a named entry in the registry. |
| `remove(String name)` | `Optional<E>` | Removes an entry from the registry. |
| `replace(String name, E newEntry)` | `Optional<E>` | Replaces an existing entry with a new one. |
| `getConfiguration(String configName)` | `Optional<C>` | Gets a shared configuration by name. |
| `getDefaultConfig()` | `C` | Returns the default configuration. |
| `getTags()` | `Map<String, String>` | Returns global configured registry tags. |
| `getEventPublisher()` | `EventPublisher<E>` | Returns an event publisher for lifecycle events. |
| `removeConfiguration(String configName)` | `C` | Removes and returns a shared configuration by name. |

Sources: [resilience4j-core/src/main/java/io/github/resilience4j/core/Registry.java#L34-L97](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-core/src/main/java/io/github/resilience4j/core/Registry.java#L34-L97)

> [!NOTE]
> The nested `EventPublisher<E>` interface extends `io.github.resilience4j.core.EventPublisher<RegistryEvent>` and exposes fluent registration methods: `onEntryAdded`, `onEntryRemoved`, and `onEntryReplaced`.
> Sources: [resilience4j-core/src/main/java/io/github/resilience4j/core/Registry.java#L102-L109](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-core/src/main/java/io/github/resilience4j/core/Registry.java#L102-L109)

### Specialized Domain Registries

Specific resilience modules extend or specialize this core contract to provide domain-specific factory methods, fluent builders, and creation overloads supporting default instances, custom configurations, suppliers, shared configuration names, and per-instance tags.

- **`CircuitBreakerRegistry`**: Manages `CircuitBreaker` instances backed by `CircuitBreakerConfig`.
  Sources: [resilience4j-circuitbreaker/src/main/java/io/github/resilience4j/circuitbreaker/CircuitBreakerRegistry.java#L35-L39](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-circuitbreaker/src/main/java/io/github/resilience4j/circuitbreaker/CircuitBreakerRegistry.java#L35-L39)
- **`RetryRegistry`**: Manages `Retry` instances backed by `RetryConfig`.
  Sources: [resilience4j-retry/src/main/java/io/github/resilience4j/retry/RetryRegistry.java#L28-L31](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-retry/src/main/java/io/github/resilience4j/retry/RetryRegistry.java#L28-L31)
- **`RateLimiterRegistry`**: Manages `RateLimiter` instances backed by `RateLimiterConfig`.
  Sources: [resilience4j-ratelimiter/src/main/java/io/github/resilience4j/ratelimiter/RateLimiterRegistry.java#L32-L35](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-ratelimiter/src/main/java/io/github/resilience4j/ratelimiter/RateLimiterRegistry.java#L32-L35)
- **`BulkheadRegistry` & `ThreadPoolBulkheadRegistry`**: Manage `Bulkhead` and `ThreadPoolBulkhead` instances backed by `BulkheadConfig` and `ThreadPoolBulkheadConfig` respectively.
  Sources: [resilience4j-bulkhead/src/main/java/io/github/resilience4j/bulkhead/BulkheadRegistry.java#L33-L37](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-bulkhead/src/main/java/io/github/resilience4j/bulkhead/BulkheadRegistry.java#L33-L37), [resilience4j-bulkhead/src/main/java/io/github/resilience4j/bulkhead/ThreadPoolBulkheadRegistry.java#L35-L40](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-bulkhead/src/main/java/io/github/resilience4j/bulkhead/ThreadPoolBulkheadRegistry.java#L35-L40)
- **`TimeLimiterRegistry`**: Manages `TimeLimiter` instances backed by `TimeLimiterConfig`.
  Sources: [resilience4j-timelimiter/src/main/java/io/github/resilience4j/timelimiter/TimeLimiterRegistry.java#L32-L35](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-timelimiter/src/main/java/io/github/resilience4j/timelimiter/TimeLimiterRegistry.java#L32-L35)
- **`HedgeRegistry`**: Manages `Hedge` instances backed by `HedgeConfig`.
  Sources: [resilience4j-hedge/src/main/java/io/github/resilience4j/hedge/HedgeRegistry.java#L28-L31](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-hedge/src/main/java/io/github/resilience4j/hedge/HedgeRegistry.java#L28-L31)

> [!CAUTION]
> When adding shared configurations via registry builders (such as `addRetryConfig` or `addCircuitBreakerConfig`), passing `"default"` as the configuration name throws an `IllegalArgumentException` because that identifier is strictly reserved for the default registry configuration.
> Sources: [resilience4j-retry/src/main/java/io/github/resilience4j/retry/RetryRegistry.java#L294-L298](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-retry/src/main/java/io/github/resilience4j/retry/RetryRegistry.java#L294-L298), [resilience4j-circuitbreaker/src/main/java/io/github/resilience4j/circuitbreaker/CircuitBreakerRegistry.java#L308-L312](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-circuitbreaker/src/main/java/io/github/resilience4j/circuitbreaker/CircuitBreakerRegistry.java#L308-L312)

## Abstract Registry Architecture

### Architecture Overview

The `AbstractRegistry<E, C>` class serves as the foundational, generic implementation of the `Registry<E, C>` interface across Resilience4j. It manages instance storage via a `RegistryStore<E>`, configuration dictionaries backed by a `ConcurrentHashMap<String, C>`, global registry-level tags, and an internal event dispatching engine.

Sources: [resilience4j-core/src/main/java/io/github/resilience4j/core/registry/AbstractRegistry.java#L33-L52](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-core/src/main/java/io/github/resilience4j/core/registry/AbstractRegistry.java#L33-L52)

### Core Operations and Call Chains

`AbstractRegistry` coordinates concurrent access, configuration isolation, and lifecycle event propagation. Its construction initializes the default configuration under the reserved key `"default"` and accepts optional lists of `RegistryEventConsumer<E>` instances and global tag maps.

Sources: [resilience4j-core/src/main/java/io/github/resilience4j/core/registry/AbstractRegistry.java#L76-L98](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-core/src/main/java/io/github/resilience4j/core/registry/AbstractRegistry.java#L76-L98)

#### Lifecycle Call-Chain Execution Walkthrough

When an entry is requested or mutated, `AbstractRegistry` executes precise call chains through the underlying store and event processor:

1. **Adding/Computing an Entry**: `computeIfAbsent(name, supplier)` → validates `name` via `Objects.requireNonNull` → invokes `entryMap.computeIfAbsent` → executes `supplier.get()` to construct entry `E` → instantiates `EntryAddedEvent<>(entry)` → passes event to `eventProcessor.processEvent()` → returns entry `E`.
   Sources: [resilience4j-core/src/main/java/io/github/resilience4j/core/registry/AbstractRegistry.java#L100-L106](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-core/src/main/java/io/github/resilience4j/core/registry/AbstractRegistry.java#L100-L106)
2. **Removing an Entry**: `remove(name)` → invokes `entryMap.remove(name)` returning `Optional<E>` → evaluates `removedEntry.ifPresent()` → instantiates `EntryRemovedEvent<>(entry)` → passes event to `eventProcessor.processEvent()` → returns `Optional<E>`.
   Sources: [resilience4j-core/src/main/java/io/github/resilience4j/core/registry/AbstractRegistry.java#L113-L119](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-core/src/main/java/io/github/resilience4j/core/registry/AbstractRegistry.java#L113-L119)
3. **Replacing an Entry**: `replace(name, newEntry)` → invokes `entryMap.replace(name, newEntry)` returning `Optional<E>` → evaluates `replacedEntry.ifPresent()` → instantiates `EntryReplacedEvent<>(oldEntry, newEntry)` → passes event to `eventProcessor.processEvent()` → returns `Optional<E>`.
   Sources: [resilience4j-core/src/main/java/io/github/resilience4j/core/registry/AbstractRegistry.java#L121-L127](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-core/src/main/java/io/github/resilience4j/core/registry/AbstractRegistry.java#L121-L127)

> [!WARNING]
> Attempting to add or remove a configuration entry using the reserved identifier `"default"` throws an immediate `IllegalArgumentException`, as that key is strictly protected for default registry configurations.
> Sources: [resilience4j-core/src/main/java/io/github/resilience4j/core/registry/AbstractRegistry.java#L130-L134](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-core/src/main/java/io/github/resilience4j/core/registry/AbstractRegistry.java#L130-L134), [resilience4j-core/src/main/java/io/github/resilience4j/core/registry/AbstractRegistry.java#L143-L148](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-core/src/main/java/io/github/resilience4j/core/registry/AbstractRegistry.java#L143-L148)

### Configuration Constants and Error Messages

| Constant Field | Value | Purpose / Meaning |
| :--- | :--- | :--- |
| `DEFAULT_CONFIG` | `"default"` | Reserved map key identifying the default configuration instance. |
| `CONFIG_MUST_NOT_BE_NULL` | `"Config must not be null"` | Exception message when null configuration is supplied. |
| `CONSUMER_MUST_NOT_BE_NULL` | `"EventConsumers must not be null"` | Exception message when null event consumer is supplied. |
| `SUPPLIER_MUST_NOT_BE_NULL` | `"Supplier must not be null"` | Exception message when null supplier is supplied. |
| `TAGS_MUST_NOT_BE_NULL` | `"Tags must not be null"` | Exception message when null tag map is supplied. |
| `NAME_MUST_NOT_BE_NULL` | `"Name must not be null"` | Exception message when null entry name is supplied to lookups or computes. |
| `REGISTRY_STORE_MUST_NOT_BE_NULL` | `"Registry Store must not be null"` | Exception message when a null `RegistryStore` implementation is provided. |

Sources: [resilience4j-core/src/main/java/io/github/resilience4j/core/registry/AbstractRegistry.java#L35-L42](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-core/src/main/java/io/github/resilience4j/core/registry/AbstractRegistry.java#L35-L42)

## Underlying Storage Implementations

### Storage Overview

Resilience4j defines the `RegistryStore<E>` contract to decouple registry instance management from underlying storage engines. Implementations provide thread-safe instance persistence, atomic initialization, and lifecycle management for resilience components.

Sources: [resilience4j-core/src/main/java/io/github/resilience4j/core/RegistryStore.java#L25-L40](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-core/src/main/java/io/github/resilience4j/core/RegistryStore.java#L25-L40), [resilience4j-core/src/main/java/io/github/resilience4j/core/registry/InMemoryRegistryStore.java#L32-L35](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-core/src/main/java/io/github/resilience4j/core/registry/InMemoryRegistryStore.java#L32-L35)

### In-Memory Registry Storage Mechanics

`InMemoryRegistryStore<E>` implements `RegistryStore<E>` using a `ConcurrentHashMap` combined with `CompletableFuture` instances under the "FutureHashMap" pattern. This architecture avoids holding map segment locks during expensive entry creation, preventing virtual thread pinning.

Sources: [resilience4j-core/src/main/java/io/github/resilience4j/core/registry/InMemoryRegistryStore.java#L32-L36](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-core/src/main/java/io/github/resilience4j/core/registry/InMemoryRegistryStore.java#L32-L36)

#### Call-Chain Execution Walkthrough

When resolving an entry concurrently via `computeIfAbsent`, `InMemoryRegistryStore` executes the following sequence:

1. `computeIfAbsent(key, mappingFunction)` validates inputs via `Objects.requireNonNull`.
Sources: [resilience4j-core/src/main/java/io/github/resilience4j/core/registry/InMemoryRegistryStore.java#L49-L52](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-core/src/main/java/io/github/resilience4j/core/registry/InMemoryRegistryStore.java#L49-L52)
2. Instantiates a new `CompletableFuture<E>` named `created`.
Sources: [resilience4j-core/src/main/java/io/github/resilience4j/core/registry/InMemoryRegistryStore.java#L70-L70](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-core/src/main/java/io/github/resilience4j/core/registry/InMemoryRegistryStore.java#L70-L70)
3. Invokes `entryMap.putIfAbsent(key, created)` to claim the key atomically.
Sources: [resilience4j-core/src/main/java/io/github/resilience4j/core/registry/InMemoryRegistryStore.java#L71-L71](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-core/src/main/java/io/github/resilience4j/core/registry/InMemoryRegistryStore.java#L71-L71)
4. If `putIfAbsent` returns `null` (winner thread): executes `mappingFunction.apply(key)` *outside* the map lock, validates non-null result, and completes the future via `future.complete(value)`. On failure, completes exceptionally and removes the key.
Sources: [resilience4j-core/src/main/java/io/github/resilience4j/core/registry/InMemoryRegistryStore.java#L73-L86](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-core/src/main/java/io/github/resilience4j/core/registry/InMemoryRegistryStore.java#L73-L86)
5. If `putIfAbsent` returns an existing future (loser threads): calls `future.join()`, parking via `LockSupport.park()` without carrier thread pinning.
Sources: [resilience4j-core/src/main/java/io/github/resilience4j/core/registry/InMemoryRegistryStore.java#L71-L74](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-core/src/main/java/io/github/resilience4j/core/registry/InMemoryRegistryStore.java#L71-L74), [resilience4j-core/src/main/java/io/github/resilience4j/core/registry/InMemoryRegistryStore.java#L87-L87](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-core/src/main/java/io/github/resilience4j/core/registry/InMemoryRegistryStore.java#L87-L87), [resilience4j-core/src/main/java/io/github/resilience4j/core/registry/InMemoryRegistryStore.java#L100-L100](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-core/src/main/java/io/github/resilience4j/core/registry/InMemoryRegistryStore.java#L100-L100)

> [!NOTE]
> `InMemoryRegistryStore` deliberately avoids standard `ConcurrentHashMap.computeIfAbsent()` to prevent holding monitor locks during I/O-bound or blocking initialization tasks in virtual thread runtimes.
> Sources: [resilience4j-core/src/main/java/io/github/resilience4j/core/registry/InMemoryRegistryStore.java#L55-L68](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-core/src/main/java/io/github/resilience4j/core/registry/InMemoryRegistryStore.java#L55-L68)

### Cache-Backed Registry Storage

`CacheRegistryStore<E>` wraps a JSR-107 `Cache<String, E>` instance to store registry entries. It handles atomic computation through a nested static `AtomicComputeProcessor<E>` implementation of `EntryProcessor`.

Sources: [resilience4j-cache/src/main/java/io/github/resilience4j/cache/CacheRegistryStore.java#L14-L20](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-cache/src/main/java/io/github/resilience4j/cache/CacheRegistryStore.java#L14-L20), [resilience4j-cache/src/main/java/io/github/resilience4j/cache/CacheRegistryStore.java#L59-L61](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-cache/src/main/java/io/github/resilience4j/cache/CacheRegistryStore.java#L59-L61)

```java
static class AtomicComputeProcessor<E> implements EntryProcessor<String, E, E> {
    @Override
    public E process(MutableEntry<String, E> entry, Object... arguments) throws EntryProcessorException {
        @SuppressWarnings("unchecked")
        Function<? super String, ? extends E> mappingFunction = (Function<? super String, ? extends E>) arguments[0];
        E oldValue = entry.getValue();
        if (oldValue != null) {
            return oldValue;
        }
        E newValue = mappingFunction.apply(entry.getKey());
        if (newValue != null) {
            entry.setValue(newValue);
            return newValue;
        } else {
            return oldValue;
        }
    }
}
```
Sources: [resilience4j-cache/src/main/java/io/github/resilience4j/cache/CacheRegistryStore.java#L59-L78](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-cache/src/main/java/io/github/resilience4j/cache/CacheRegistryStore.java#L59-L78)

### Registry Store Implementation Comparison

| Implementation | Underlying Data Structure | Concurrency & Virtual Thread Strategy | Error Handling Strategy |
| :--- | :--- | :--- | :--- |
| `InMemoryRegistryStore` | `ConcurrentHashMap<String, CompletableFuture<E>>` | FutureHashMap pattern; executes mapping function outside map lock and uses `future.join()` to park virtual threads without pinning. | Exceptional futures are caught, cleaned up via `entryMap.remove(key, future)`, and rethrown. |
| `CacheRegistryStore` | `Cache<String, E>` (JSR-107) | Delegates atomicity to cache entry processors (`cacheStore.invoke`). | Catches `EntryProcessorException` and rethrows wrapped cause as a `RuntimeException`. |

Sources: [resilience4j-core/src/main/java/io/github/resilience4j/core/registry/InMemoryRegistryStore.java#L35-L87](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-core/src/main/java/io/github/resilience4j/core/registry/InMemoryRegistryStore.java#L35-L87), [resilience4j-cache/src/main/java/io/github/resilience4j/cache/CacheRegistryStore.java#L16-L28](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-cache/src/main/java/io/github/resilience4j/cache/CacheRegistryStore.java#L16-L28)

## Pattern In-Memory Registry Implementations

### Overview

Concrete in-memory registry implementations extend `AbstractRegistry` to manage instances of Resilience4j fault-tolerance primitives: `InMemoryRetryRegistry`, `InMemoryThreadPoolBulkheadRegistry`, `InMemoryTimeLimiterRegistry`, and `InMemoryHedgeRegistry`. Each class provides overloaded creation methods accepting direct configuration objects, configuration suppliers, configuration names referencing shared map entries, or custom tag maps.

Sources: [resilience4j-bulkhead/src/main/java/io/github/resilience4j/bulkhead/internal/InMemoryThreadPoolBulkheadRegistry.java#L38-L40](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-bulkhead/src/main/java/io/github/resilience4j/bulkhead/internal/InMemoryThreadPoolBulkheadRegistry.java#L38-L40), [resilience4j-hedge/src/main/java/io/github/resilience4j/hedge/internal/InMemoryHedgeRegistry.java#L37-L38](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-hedge/src/main/java/io/github/resilience4j/hedge/internal/InMemoryHedgeRegistry.java#L37-L38), [resilience4j-retry/src/main/java/io/github/resilience4j/retry/internal/InMemoryRetryRegistry.java#L33-L34](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-retry/src/main/java/io/github/resilience4j/retry/internal/InMemoryRetryRegistry.java#L33-L34), [resilience4j-timelimiter/src/main/java/io/github/resilience4j/timelimiter/internal/InMemoryTimeLimiterRegistry.java#L38-L39](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-timelimiter/src/main/java/io/github/resilience4j/timelimiter/internal/InMemoryTimeLimiterRegistry.java#L38-L39)

### Registry Execution and Resolution Flow

When a client requests a resilience instance by name and configuration name, the concrete registry executes a standardized call chain through inherited base infrastructure:

1. `retry(name, configName, tags)` (or equivalent `bulkhead`, `timeLimiter`, `hedge` method) is invoked on the concrete registry implementation.
2. `getConfiguration(configName)` queries the internal `configurations` map to retrieve an `Optional<Config>`.
3. If absent, it throws a `ConfigurationNotFoundException(configName)`.
4. If present, it invokes `computeIfAbsent(name, mappingFunction)` with a factory lambda that builds the primitive using `Primitive.of(name, config, getAllTags(tags))`.
5. The request delegates to the underlying `RegistryStore` implementation (defaulting to `InMemoryRegistryStore`), which coordinates thread-safe creation.

Sources: [resilience4j-bulkhead/src/main/java/io/github/resilience4j/bulkhead/internal/InMemoryThreadPoolBulkheadRegistry.java#L205-L208](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-bulkhead/src/main/java/io/github/resilience4j/bulkhead/internal/InMemoryThreadPoolBulkheadRegistry.java#L205-L208), [resilience4j-hedge/src/main/java/io/github/resilience4j/hedge/internal/InMemoryHedgeRegistry.java#L147-L152](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-hedge/src/main/java/io/github/resilience4j/hedge/internal/InMemoryHedgeRegistry.java#L147-L152), [resilience4j-retry/src/main/java/io/github/resilience4j/retry/internal/InMemoryRetryRegistry.java#L184-L187](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-retry/src/main/java/io/github/resilience4j/retry/internal/InMemoryRetryRegistry.java#L184-L187), [resilience4j-timelimiter/src/main/java/io/github/resilience4j/timelimiter/internal/InMemoryTimeLimiterRegistry.java#L191-L195](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-timelimiter/src/main/java/io/github/resilience4j/timelimiter/internal/InMemoryTimeLimiterRegistry.java#L191-L195)

> [!WARNING]
> Requesting a named configuration that has not been registered via map initialization or explicit addition causes `getConfiguration(configName)` to throw `ConfigurationNotFoundException`, rather than silently falling back to default configuration values.
> Sources: [resilience4j-bulkhead/src/main/java/io/github/resilience4j/bulkhead/internal/InMemoryThreadPoolBulkheadRegistry.java#L206-L207](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-bulkhead/src/main/java/io/github/resilience4j/bulkhead/internal/InMemoryThreadPoolBulkheadRegistry.java#L206-L207), [resilience4j-hedge/src/main/java/io/github/resilience4j/hedge/internal/InMemoryHedgeRegistry.java#L149-L150](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-hedge/src/main/java/io/github/resilience4j/hedge/internal/InMemoryHedgeRegistry.java#L149-L150), [resilience4j-retry/src/main/java/io/github/resilience4j/retry/internal/InMemoryRetryRegistry.java#L185-L186](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-retry/src/main/java/io/github/resilience4j/retry/internal/InMemoryRetryRegistry.java#L185-L186), [resilience4j-timelimiter/src/main/java/io/github/resilience4j/timelimiter/internal/InMemoryTimeLimiterRegistry.java#L192-L193](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-timelimiter/src/main/java/io/github/resilience4j/timelimiter/internal/InMemoryTimeLimiterRegistry.java#L192-L193)

### Builder Pattern Variant

`InMemoryHedgeRegistry` uniquely implements a static nested `Builder` class to assemble registry instances with optional tags, multiple named configurations, default configuration overrides, and registry event consumers.

Sources: [resilience4j-hedge/src/main/java/io/github/resilience4j/hedge/internal/InMemoryHedgeRegistry.java#L54-L95](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-hedge/src/main/java/io/github/resilience4j/hedge/internal/InMemoryHedgeRegistry.java#L54-L95)

| Builder Method | Argument Type | Purpose |
| :--- | :--- | :--- |
| `withTags` | `Map<String, String>` | Appends custom metadata tags to the registry instance. |
| `withConfigs` | `Map<String, HedgeConfig>` | Populates named configuration mappings. |
| `withDefaultConfig` | `HedgeConfig` | Sets the default configuration (throws `NullPointerException` if null). |
| `withConsumers` | `List<RegistryEventConsumer<Hedge>>` | Registers multiple event consumers. |
| `withConsumer` | `RegistryEventConsumer<Hedge>` | Registers a single event consumer. |
| `build` | none | Removes any entry keyed as `"default"` from configs and instantiates `InMemoryHedgeRegistry`. |

Sources: [resilience4j-hedge/src/main/java/io/github/resilience4j/hedge/internal/InMemoryHedgeRegistry.java#L60-L94](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-hedge/src/main/java/io/github/resilience4j/hedge/internal/InMemoryHedgeRegistry.java#L60-L94)

## Framework Integration and Commons Configuration

### Overview

Framework integrations and external configuration loaders bridge native Resilience4j registries with modern DI containers and externalized configuration files. The Micronaut integration module provides bean factories for circuit breakers, rate limiters, standard and thread-pool bulkheads, and retries. Each factory is conditional, activating only when its respective property (`resilience4j.circuitbreaker.enabled`, `resilience4j.ratelimiter.enabled`, `resilience4j.bulkhead.enabled`, `resilience4j.thread-pool-bulkhead.enabled`, or `resilience4j.retry.enabled`) evaluates to true.

Sources: [resilience4j-micronaut/src/main/java/io/github/resilience4j/micronaut/circuitbreaker/CircuitBreakerRegistryFactory.java#L45-L46](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-micronaut/src/main/java/io/github/resilience4j/micronaut/circuitbreaker/CircuitBreakerRegistryFactory.java#L45-L46), [resilience4j-micronaut/src/main/java/io/github/resilience4j/micronaut/ratelimiter/RateLimiterRegistryFactory.java#L43-L44](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-micronaut/src/main/java/io/github/resilience4j/micronaut/ratelimiter/RateLimiterRegistryFactory.java#L43-L44), [resilience4j-micronaut/src/main/java/io/github/resilience4j/micronaut/retry/RetryRegistryFactory.java#L43-L44](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-micronaut/src/main/java/io/github/resilience4j/micronaut/retry/RetryRegistryFactory.java#L43-L44), [resilience4j-micronaut/src/main/java/io/github/resilience4j/micronaut/bulkhead/BulkHeadRegistryFactory.java#L45-L46](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-micronaut/src/main/java/io/github/resilience4j/micronaut/bulkhead/BulkHeadRegistryFactory.java#L45-L46), [resilience4j-micronaut/src/main/java/io/github/resilience4j/micronaut/bulkhead/ThreadPoolBulkheadFactory.java#L46-L47](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-micronaut/src/main/java/io/github/resilience4j/micronaut/bulkhead/ThreadPoolBulkheadFactory.java#L46-L47)

### Micronaut Registry Factories and Event Wiring

Micronaut registry factories wire up configuration properties, composite customizers, event consumer registries, and registry event consumers. For instance, `CircuitBreakerRegistryFactory` defines singleton and bean producers that assemble a `CircuitBreakerRegistry` through a structured sequence.

Sources: [resilience4j-micronaut/src/main/java/io/github/resilience4j/micronaut/circuitbreaker/CircuitBreakerRegistryFactory.java#L45-L68](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-micronaut/src/main/java/io/github/resilience4j/micronaut/circuitbreaker/CircuitBreakerRegistryFactory.java#L45-L68)

```java
    @Singleton
    @Requires(beans = CircuitBreakerProperties.class)
    public CircuitBreakerRegistry circuitBreakerRegistry(
        CommonCircuitBreakerConfigurationProperties circuitBreakerConfigurationProperties,
        @CircuitBreakerQualifier EventConsumerRegistry<CircuitBreakerEvent> eventConsumerRegistry,
        @CircuitBreakerQualifier RegistryEventConsumer<CircuitBreaker> circuitBreakerRegistryEventConsumer,
        @CircuitBreakerQualifier CompositeCustomizer<CircuitBreakerConfigCustomizer> compositeCircuitBreakerCustomizer) {
        CircuitBreakerRegistry circuitBreakerRegistry = createCircuitBreakerRegistry(
            circuitBreakerConfigurationProperties, circuitBreakerRegistryEventConsumer,
            compositeCircuitBreakerCustomizer);
        registerEventConsumer(circuitBreakerConfigurationProperties, circuitBreakerRegistry, eventConsumerRegistry);
        initCircuitBreakerRegistry(circuitBreakerConfigurationProperties, circuitBreakerRegistry, compositeCircuitBreakerCustomizer);
        return circuitBreakerRegistry;
    }
```

Sources: [resilience4j-micronaut/src/main/java/io/github/resilience4j/micronaut/circuitbreaker/CircuitBreakerRegistryFactory.java#L55-L68](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-micronaut/src/main/java/io/github/resilience4j/micronaut/circuitbreaker/CircuitBreakerRegistryFactory.java#L55-L68)

The initialization call chain flows explicitly through registry creation, event publisher registration, and instance instantiation:
1. `createCircuitBreakerRegistry()` reads shared configuration maps, builds individual `CircuitBreakerConfig` instances using the composite customizer, and instantiates the base registry via `CircuitBreakerRegistry.of()`.
2. `registerEventConsumer()` attaches listeners to the registry's `EventPublisher` for entry addition, replacement, and removal events, defaulting event buffer sizes to 100 if unspecified.
3. `initCircuitBreakerRegistry()` iterates over configured instances in `CommonCircuitBreakerConfigurationProperties` and forces eager creation by calling `circuitBreakerRegistry.circuitBreaker(name, config)`.

Sources: [resilience4j-micronaut/src/main/java/io/github/resilience4j/micronaut/circuitbreaker/CircuitBreakerRegistryFactory.java#L95-L155](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-micronaut/src/main/java/io/github/resilience4j/micronaut/circuitbreaker/CircuitBreakerRegistryFactory.java#L95-L155)

> [!NOTE]
> Thread-pool bulkhead factories prefix event consumer names with the class simple name when registering event consumers, combining `ThreadPoolBulkhead.class.getSimpleName()` with the bulkhead instance name (`String.join("-", ThreadPoolBulkhead.class.getSimpleName(), bulkHead.getName())`).
> Sources: [resilience4j-micronaut/src/main/java/io/github/resilience4j/micronaut/bulkhead/ThreadPoolBulkheadFactory.java#L132-L142](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-micronaut/src/main/java/io/github/resilience4j/micronaut/bulkhead/ThreadPoolBulkheadFactory.java#L132-L142)

### Commons Configuration Registry Wrappers

The `resilience4j-commons-configuration` module maps Apache Commons Configuration instances into Resilience4j configuration properties and registries. Static `of()` factory methods exist for each resilience primitive.

Sources: [resilience4j-commons-configuration/src/main/java/io/github/resilience4j/commons/configuration/retry/configure/CommonsConfigurationRetryRegistry.java#L39-L47](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-commons-configuration/src/main/java/io/github/resilience4j/commons/configuration/retry/configure/CommonsConfigurationRetryRegistry.java#L39-L47), [resilience4j-commons-configuration/src/main/java/io/github/resilience4j/commons/configuration/circuitbreaker/configure/CommonsConfigurationCircuitBreakerRegistry.java#L39-L47](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-commons-configuration/src/main/java/io/github/resilience4j/commons/configuration/circuitbreaker/configure/CommonsConfigurationCircuitBreakerRegistry.java#L39-L47), [resilience4j-commons-configuration/src/main/java/io/github/resilience4j/commons/configuration/ratelimiter/configure/CommonsConfigurationRateLimiterRegistry.java#L39-L47](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-commons-configuration/src/main/java/io/github/resilience4j/commons/configuration/ratelimiter/configure/CommonsConfigurationRateLimiterRegistry.java#L39-L47), [resilience4j-commons-configuration/src/main/java/io/github/resilience4j/commons/configuration/bulkhead/configure/CommonsConfigurationBulkheadRegistry.java#L40-L48](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-commons-configuration/src/main/java/io/github/resilience4j/commons/configuration/bulkhead/configure/CommonsConfigurationBulkheadRegistry.java#L40-L48)

| Commons Configuration Factory Class | Target Registry | Configuration Binding Method |
| :--- | :--- | :--- |
| `CommonsConfigurationRetryRegistry` | `RetryRegistry` | `CommonsConfigurationRetryConfiguration.of(configuration)` |
| `CommonsConfigurationCircuitBreakerRegistry` | `CircuitBreakerRegistry` | `CommonsConfigurationCircuitBreakerConfiguration.of(configuration)` |
| `CommonsConfigurationRateLimiterRegistry` | `RateLimiterRegistry` | `CommonsConfigurationRateLimiterConfiguration.of(configuration)` |
| `CommonsConfigurationBulkheadRegistry` | `BulkheadRegistry` | `CommonsConfigurationBulkHeadConfiguration.of(configuration)` |

Sources: [resilience4j-commons-configuration/src/main/java/io/github/resilience4j/commons/configuration/retry/configure/CommonsConfigurationRetryRegistry.java#L40-L40](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-commons-configuration/src/main/java/io/github/resilience4j/commons/configuration/retry/configure/CommonsConfigurationRetryRegistry.java#L40-L40), [resilience4j-commons-configuration/src/main/java/io/github/resilience4j/commons/configuration/circuitbreaker/configure/CommonsConfigurationCircuitBreakerRegistry.java#L40-L40](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-commons-configuration/src/main/java/io/github/resilience4j/commons/configuration/circuitbreaker/configure/CommonsConfigurationCircuitBreakerRegistry.java#L40-L40), [resilience4j-commons-configuration/src/main/java/io/github/resilience4j/commons/configuration/ratelimiter/configure/CommonsConfigurationRateLimiterRegistry.java#L40-L40](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-commons-configuration/src/main/java/io/github/resilience4j/commons/configuration/ratelimiter/configure/CommonsConfigurationRateLimiterRegistry.java#L40-L40), [resilience4j-commons-configuration/src/main/java/io/github/resilience4j/commons/configuration/bulkhead/configure/CommonsConfigurationBulkheadRegistry.java#L41-L41](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-commons-configuration/src/main/java/io/github/resilience4j/commons/configuration/bulkhead/configure/CommonsConfigurationBulkheadRegistry.java#L41-L41)

## Event Consumer Registries and Auto-Configuration

### Overview

Event consumer registries manage circular event consumer structures indexed by backend identifiers, allowing applications to capture and buffer resilience events. The `DefaultEventConsumerRegistry<T>` implementation uses a `ConcurrentHashMap` internally, optimized for virtual threads where simple map operations avoid heavy future pattern overheads.

Sources: [resilience4j-consumer/src/main/java/io/github/resilience4j/consumer/DefaultEventConsumerRegistry.java#L22-L35](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-consumer/src/main/java/io/github/resilience4j/consumer/DefaultEventConsumerRegistry.java#L22-L35)

### Event Consumer Registry Operations

The `DefaultEventConsumerRegistry` class provides methods to create, retrieve, remove, and list circular event consumers bound to specific identifiers.

| Method Signature | Return Type | Description |
| :--- | :--- | :--- |
| `createEventConsumer(String id, int bufferSize)` | `CircularEventConsumer<T>` | Instantiates a new `CircularEventConsumer` with the specified buffer size and stores it in the registry under `id`. |
| `getEventConsumer(String id)` | `CircularEventConsumer<T>` | Retrieves the event consumer associated with the given identifier. |
| `removeEventConsumer(String id)` | `CircularEventConsumer<T>` | Removes and returns the event consumer matching the identifier from the registry. |
| `getAllEventConsumer()` | `List<CircularEventConsumer<T>>` | Returns an unmodifiable copy of all stored event consumers using `List.copyOf()`. |

Sources: [resilience4j-consumer/src/main/java/io/github/resilience4j/consumer/DefaultEventConsumerRegistry.java#L37-L56](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-consumer/src/main/java/io/github/resilience4j/consumer/DefaultEventConsumerRegistry.java#L37-L56)

### Spring Boot Refresh-Scoped Auto-Configuration

Spring Boot integration provides refresh-scoped auto-configurations that allow resilience registries to re-bind dynamically when configuration properties change via Spring Cloud Context refresh events.

The `BulkheadRefreshScopedRegistryAutoConfiguration` class configures refreshable beans for `BulkheadRegistry` and `ThreadPoolBulkheadRegistry` before standard bulkhead auto-configuration runs, provided `RefreshScope` is active.

```java
@AutoConfiguration(before = BulkheadAutoConfiguration.class, after = RefreshAutoConfiguration.class)
@ConditionalOnClass({Bulkhead.class, RefreshScope.class})
@EnableConfigurationProperties({BulkheadProperties.class, ThreadPoolBulkheadProperties.class})
@ConditionalOnBean(org.springframework.cloud.context.scope.refresh.RefreshScope.class)
public class BulkheadRefreshScopedRegistryAutoConfiguration {

    private final BulkheadConfiguration bulkheadConfiguration = new BulkheadConfiguration();
    private final ThreadPoolBulkheadConfiguration threadPoolBulkheadConfiguration = new ThreadPoolBulkheadConfiguration();

    @Bean
    @RefreshScope
    @ConditionalOnMissingBean
    public BulkheadRegistry bulkheadRegistry(
        BulkheadConfigurationProperties bulkheadConfigurationProperties,
        EventConsumerRegistry<BulkheadEvent> bulkheadEventConsumerRegistry,
        RegistryEventConsumer<Bulkhead> bulkheadRegistryEventConsumer,
        @Qualifier("compositeBulkheadCustomizer") CompositeCustomizer<BulkheadConfigCustomizer> compositeBulkheadCustomizer) {
        return bulkheadConfiguration
            .bulkheadRegistry(bulkheadConfigurationProperties, bulkheadEventConsumerRegistry,
                bulkheadRegistryEventConsumer, compositeBulkheadCustomizer);
    }
}
```

Sources: [resilience4j-spring-boot4/src/main/java/io/github/resilience4j/springboot/bulkhead/autoconfigure/BulkheadRefreshScopedRegistryAutoConfiguration.java#L27-L51](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-spring-boot4/src/main/java/io/github/resilience4j/springboot/bulkhead/autoconfigure/BulkheadRefreshScopedRegistryAutoConfiguration.java#L27-L51)

Similarly, `RetryRefreshScopedRegistryAutoConfiguration` exposes a refresh-scoped `RetryRegistry` bean conditional on `RefreshScope` and `Retry` classes being present on the classpath.

Sources: [resilience4j-spring-boot4/src/main/java/io/github/resilience4j/springboot/retry/autoconfigure/RetryRefreshScopedRegistryAutoConfiguration.java#L21-L43](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-spring-boot4/src/main/java/io/github/resilience4j/springboot/retry/autoconfigure/RetryRefreshScopedRegistryAutoConfiguration.java#L21-L43)

> [!NOTE]
> Refresh-scoped registry auto-configurations depend on `RefreshAutoConfiguration` and require `RefreshScope` beans to be active in the application context before overriding standard registry definitions with `@ConditionalOnMissingBean`.
> Sources: [resilience4j-spring-boot4/src/main/java/io/github/resilience4j/springboot/bulkhead/autoconfigure/BulkheadRefreshScopedRegistryAutoConfiguration.java#L27-L31](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-spring-boot4/src/main/java/io/github/resilience4j/springboot/bulkhead/autoconfigure/BulkheadRefreshScopedRegistryAutoConfiguration.java#L27-L31), [resilience4j-spring-boot4/src/main/java/io/github/resilience4j/springboot/retry/autoconfigure/RetryRefreshScopedRegistryAutoConfiguration.java#L21-L24](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-spring-boot4/src/main/java/io/github/resilience4j/springboot/retry/autoconfigure/RetryRefreshScopedRegistryAutoConfiguration.java#L21-L24)

## Related

- [[Circuit Breakers]]
- [[Retry Mechanism]]

