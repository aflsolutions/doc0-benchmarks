# Commons Configuration Integration

<details>
<summary>Relevant source files</summary>

The following files were used as context for generating this wiki page:

- [resilience4j-micronaut/src/main/java/io/github/resilience4j/micronaut/circuitbreaker/CircuitBreakerRegistryFactory.java](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-micronaut/src/main/java/io/github/resilience4j/micronaut/circuitbreaker/CircuitBreakerRegistryFactory.java)
- [resilience4j-spring6/src/main/java/io/github/resilience4j/spring6/circuitbreaker/configure/CircuitBreakerConfiguration.java](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-spring6/src/main/java/io/github/resilience4j/spring6/circuitbreaker/configure/CircuitBreakerConfiguration.java)
- [resilience4j-commons-configuration/src/main/java/io/github/resilience4j/commons/configuration/retry/configure/CommonsConfigurationRetryConfiguration.java](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-commons-configuration/src/main/java/io/github/resilience4j/commons/configuration/retry/configure/CommonsConfigurationRetryConfiguration.java)
- [resilience4j-micronaut/src/main/java/io/github/resilience4j/micronaut/ratelimiter/RateLimiterRegistryFactory.java](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-micronaut/src/main/java/io/github/resilience4j/micronaut/ratelimiter/RateLimiterRegistryFactory.java)
- [resilience4j-commons-configuration/src/main/java/io/github/resilience4j/commons/configuration/circuitbreaker/configure/CommonsConfigurationCircuitBreakerConfiguration.java](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-commons-configuration/src/main/java/io/github/resilience4j/commons/configuration/circuitbreaker/configure/CommonsConfigurationCircuitBreakerConfiguration.java)
- [resilience4j-micronaut/src/main/java/io/github/resilience4j/micronaut/retry/RetryRegistryFactory.java](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-micronaut/src/main/java/io/github/resilience4j/micronaut/retry/RetryRegistryFactory.java)
- [resilience4j-spring6/src/main/java/io/github/resilience4j/spring6/bulkhead/configure/threadpool/ThreadPoolBulkheadConfiguration.java](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-spring6/src/main/java/io/github/resilience4j/spring6/bulkhead/configure/threadpool/ThreadPoolBulkheadConfiguration.java)
- [resilience4j-micronaut/src/main/java/io/github/resilience4j/micronaut/bulkhead/BulkHeadRegistryFactory.java](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-micronaut/src/main/java/io/github/resilience4j/micronaut/bulkhead/BulkHeadRegistryFactory.java)
- [resilience4j-micronaut/src/main/java/io/github/resilience4j/micronaut/bulkhead/ThreadPoolBulkheadFactory.java](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-micronaut/src/main/java/io/github/resilience4j/micronaut/bulkhead/ThreadPoolBulkheadFactory.java)
- [resilience4j-spring6/src/main/java/io/github/resilience4j/spring6/retry/configure/RetryConfiguration.java](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-spring6/src/main/java/io/github/resilience4j/spring6/retry/configure/RetryConfiguration.java)
- [resilience4j-spring6/src/main/java/io/github/resilience4j/spring6/bulkhead/configure/BulkheadConfiguration.java](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-spring6/src/main/java/io/github/resilience4j/spring6/bulkhead/configure/BulkheadConfiguration.java)
- [resilience4j-commons-configuration/src/main/java/io/github/resilience4j/commons/configuration/ratelimiter/configure/CommonsConfigurationRateLimiterConfiguration.java](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-commons-configuration/src/main/java/io/github/resilience4j/commons/configuration/ratelimiter/configure/CommonsConfigurationRateLimiterConfiguration.java)
- [resilience4j-commons-configuration/src/main/java/io/github/resilience4j/commons/configuration/bulkhead/configure/CommonsConfigurationBulkHeadConfiguration.java](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-commons-configuration/src/main/java/io/github/resilience4j/commons/configuration/bulkhead/configure/CommonsConfigurationBulkHeadConfiguration.java)
- [resilience4j-commons-configuration/src/main/java/io/github/resilience4j/commons/configuration/timelimiter/configure/CommonsConfigurationTimeLimiterConfiguration.java](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-commons-configuration/src/main/java/io/github/resilience4j/commons/configuration/timelimiter/configure/CommonsConfigurationTimeLimiterConfiguration.java)
- [resilience4j-spring-boot4/src/main/resources/META-INF/additional-spring-configuration-metadata.json](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-spring-boot4/src/main/resources/META-INF/additional-spring-configuration-metadata.json)
- [resilience4j-spring-boot3/src/main/resources/META-INF/additional-spring-configuration-metadata.json](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-spring-boot3/src/main/resources/META-INF/additional-spring-configuration-metadata.json)
- [README.adoc](https://github.com/resilience4j/resilience4j/blob/main/README.adoc)
- [resilience4j-commons-configuration/src/main/java/io/github/resilience4j/commons/configuration/retry/configure/CommonsConfigurationRetryRegistry.java](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-commons-configuration/src/main/java/io/github/resilience4j/commons/configuration/retry/configure/CommonsConfigurationRetryRegistry.java)
- [resilience4j-commons-configuration/src/main/java/io/github/resilience4j/commons/configuration/circuitbreaker/configure/CommonsConfigurationCircuitBreakerRegistry.java](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-commons-configuration/src/main/java/io/github/resilience4j/commons/configuration/circuitbreaker/configure/CommonsConfigurationCircuitBreakerRegistry.java)
- [resilience4j-commons-configuration/src/main/java/io/github/resilience4j/commons/configuration/bulkhead/configure/CommonsConfigurationBulkheadRegistry.java](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-commons-configuration/src/main/java/io/github/resilience4j/commons/configuration/bulkhead/configure/CommonsConfigurationBulkheadRegistry.java)
- [resilience4j-commons-configuration/src/main/java/io/github/resilience4j/commons/configuration/ratelimiter/configure/CommonsConfigurationRateLimiterRegistry.java](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-commons-configuration/src/main/java/io/github/resilience4j/commons/configuration/ratelimiter/configure/CommonsConfigurationRateLimiterRegistry.java)
- [resilience4j-commons-configuration/src/main/java/io/github/resilience4j/commons/configuration/timelimiter/configure/CommonsConfigurationTimeLimiterRegistry.java](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-commons-configuration/src/main/java/io/github/resilience4j/commons/configuration/timelimiter/configure/CommonsConfigurationTimeLimiterRegistry.java)
- [resilience4j-framework-common/src/main/java/io/github/resilience4j/common/utils/ConfigUtils.java](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-framework-common/src/main/java/io/github/resilience4j/common/utils/ConfigUtils.java)
- [resilience4j-spring-boot3/src/main/java/io/github/resilience4j/springboot3/bulkhead/autoconfigure/AbstractBulkheadConfigurationOnMissingBean.java](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-spring-boot3/src/main/java/io/github/resilience4j/springboot3/bulkhead/autoconfigure/AbstractBulkheadConfigurationOnMissingBean.java)
- [resilience4j-spring-boot3/src/main/java/io/github/resilience4j/springboot3/retry/autoconfigure/AbstractRetryConfigurationOnMissingBean.java](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-spring-boot3/src/main/java/io/github/resilience4j/springboot3/retry/autoconfigure/AbstractRetryConfigurationOnMissingBean.java)
- [resilience4j-spring-boot4/src/main/java/io/github/resilience4j/springboot/retry/autoconfigure/RetryRefreshScopedRegistryAutoConfiguration.java](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-spring-boot4/src/main/java/io/github/resilience4j/springboot/retry/autoconfigure/RetryRefreshScopedRegistryAutoConfiguration.java)
- [resilience4j-spring-boot4/src/main/java/io/github/resilience4j/springboot/bulkhead/autoconfigure/BulkheadRefreshScopedRegistryAutoConfiguration.java](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-spring-boot4/src/main/java/io/github/resilience4j/springboot/bulkhead/autoconfigure/BulkheadRefreshScopedRegistryAutoConfiguration.java)
- [resilience4j-spring-boot3/src/main/java/io/github/resilience4j/springboot3/circuitbreaker/autoconfigure/CircuitBreakerConfigurationOnMissingBean.java](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-spring-boot3/src/main/java/io/github/resilience4j/springboot3/circuitbreaker/autoconfigure/CircuitBreakerConfigurationOnMissingBean.java)
- [resilience4j-spring-boot3/src/main/java/io/github/resilience4j/springboot3/nativeimage/configuration/NativeHintsConfiguration.java](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-spring-boot3/src/main/java/io/github/resilience4j/springboot3/nativeimage/configuration/NativeHintsConfiguration.java)
- [gradle/libs.versions.toml](https://github.com/resilience4j/resilience4j/blob/main/gradle/libs.versions.toml)
</details>

## Overview

The Commons Configuration integration module for Resilience4j bridges Apache Commons Configuration properties with the library's core resilience mechanisms. By extracting and parsing properties into specialized configuration properties objects, it enables seamless initialization and registry building for fault-tolerance components.

Sources: [resilience4j-commons-configuration/src/main/java/io/github/resilience4j/commons/configuration/circuitbreaker/configure/CommonsConfigurationCircuitBreakerConfiguration.java](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-commons-configuration/src/main/java/io/github/resilience4j/commons/configuration/circuitbreaker/configure/CommonsConfigurationCircuitBreakerConfiguration.java#L72-L81)

This module standardizes property parsing across mechanisms such as circuit breakers, retries, rate limiters, bulkheads, and time limiters, aligning closely with standard configuration patterns found in other framework adaptors.

Sources: [resilience4j-commons-configuration/src/main/java/io/github/resilience4j/commons/configuration/retry/configure/CommonsConfigurationRetryRegistry.java](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-commons-configuration/src/main/java/io/github/resilience4j/commons/configuration/retry/configure/CommonsConfigurationRetryRegistry.java#L39-L47)

## Commons Configuration Integration Architecture

### Overview

The Apache Commons Configuration binding architecture in Resilience4j follows a consistent structural pattern across all resilience modules. Each module provides a dedicated configuration class extending a corresponding `Common*ConfigurationProperties` base class from resilience4j-common. These configuration binders process an Apache Commons `Configuration` instance by extracting predefined hierarchical property prefixes for shared template configurations (`configs`) and named component instances (`instances`).

Sources: [resilience4j-commons-configuration/src/main/java/io/github/resilience4j/commons/configuration/retry/configure/CommonsConfigurationRetryConfiguration.java](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-commons-configuration/src/main/java/io/github/resilience4j/commons/configuration/retry/configure/CommonsConfigurationRetryConfiguration.java#L34-L70), [resilience4j-commons-configuration/src/main/java/io/github/resilience4j/commons/configuration/circuitbreaker/configure/CommonsConfigurationCircuitBreakerConfiguration.java](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-commons-configuration/src/main/java/io/github/resilience4j/commons/configuration/circuitbreaker/configure/CommonsConfigurationCircuitBreakerConfiguration.java#L32-L81), [resilience4j-commons-configuration/src/main/java/io/github/resilience4j/commons/configuration/ratelimiter/configure/CommonsConfigurationRateLimiterConfiguration.java](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-commons-configuration/src/main/java/io/github/resilience4j/commons/configuration/ratelimiter/configure/CommonsConfigurationRateLimiterConfiguration.java#L30-L61), [resilience4j-commons-configuration/src/main/java/io/github/resilience4j/commons/configuration/bulkhead/configure/CommonsConfigurationBulkHeadConfiguration.java](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-commons-configuration/src/main/java/io/github/resilience4j/commons/configuration/bulkhead/configure/CommonsConfigurationBulkHeadConfiguration.java#L30-L56), [resilience4j-commons-configuration/src/main/java/io/github/resilience4j/commons/configuration/timelimiter/configure/CommonsConfigurationTimeLimiterConfiguration.java](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-commons-configuration/src/main/java/io/github/resilience4j/commons/configuration/timelimiter/configure/CommonsConfigurationTimeLimiterConfiguration.java#L30-L55)

### Execution Walkthrough

When initializing any resilience module configuration, the process flows through a deterministic execution chain from the top-level factory method down to individual instance property mapping:

1. `of(Configuration configuration)`: Static entry point creates an empty configuration binder instance, wraps parsing logic in a `try-catch` block, and wraps any thrown exceptions in a `ConfigParseException`.
   Sources: [resilience4j-commons-configuration/src/main/java/io/github/resilience4j/commons/configuration/retry/configure/CommonsConfigurationRetryConfiguration.java](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-commons-configuration/src/main/java/io/github/resilience4j/commons/configuration/retry/configure/CommonsConfigurationRetryConfiguration.java#L61-L70)
2. `configuration.subset(PREFIX)`: Extracts distinct configuration subsets for shared configs and named instances using module-specific prefixes (e.g., `resilience4j.retry.configs` and `resilience4j.retry.instances`).
   Sources: [resilience4j-commons-configuration/src/main/java/io/github/resilience4j/commons/configuration/retry/configure/CommonsConfigurationRetryConfiguration.java](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-commons-configuration/src/main/java/io/github/resilience4j/commons/configuration/retry/configure/CommonsConfigurationRetryConfiguration.java#L64-L65)
3. `getProperties(Configuration configuration)`: Delegates key extraction to `StringParseUtil.extractUniquePrefixes(configuration.getKeys(), Constants.PROPERTIES_KEY_DELIMITER)`, identifying unique instance identifiers.
   Sources: [resilience4j-commons-configuration/src/main/java/io/github/resilience4j/commons/configuration/retry/configure/CommonsConfigurationRetryConfiguration.java](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-commons-configuration/src/main/java/io/github/resilience4j/commons/configuration/retry/configure/CommonsConfigurationRetryConfiguration.java#L72-L79)
4. `mapConfigurationToInstanceProperties.apply(...)`: A lambda function that inspects subset keys (such as `waitDuration`, `maxAttempts`, or `slidingWindowSize`) via `configuration.containsKey(...)` and populates a strongly typed `InstanceProperties` container object.
   Sources: [resilience4j-commons-configuration/src/main/java/io/github/resilience4j/commons/configuration/retry/configure/CommonsConfigurationRetryConfiguration.java](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-commons-configuration/src/main/java/io/github/resilience4j/commons/configuration/retry/configure/CommonsConfigurationRetryConfiguration.java#L81-L138)

### Module Configuration Prefixes and Binders

Each resilience module defines static property prefixes used to isolate configuration trees within the broader Apache Commons `Configuration` tree.

| Module | Configs Prefix | Instances Prefix | Configuration Class |
| :--- | :--- | :--- | :--- |
| Retry | `resilience4j.retry.configs` | `resilience4j.retry.instances` | `CommonsConfigurationRetryConfiguration` |
| CircuitBreaker | `resilience4j.circuitbreaker.configs` | `resilience4j.circuitbreaker.instances` | `CommonsConfigurationCircuitBreakerConfiguration` |
| RateLimiter | `resilience4j.ratelimiter.configs` | `resilience4j.ratelimiter.instances` | `CommonsConfigurationRateLimiterConfiguration` |
| Bulkhead | `resilience4j.bulkhead.configs` | `resilience4j.bulkhead.instances` | `CommonsConfigurationBulkHeadConfiguration` |
| TimeLimiter | `resilience4j.timelimiter.configs` | `resilience4j.timelimiter.instances` | `CommonsConfigurationTimeLimiterConfiguration` |

Sources: [resilience4j-commons-configuration/src/main/java/io/github/resilience4j/commons/configuration/retry/configure/CommonsConfigurationRetryConfiguration.java](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-commons-configuration/src/main/java/io/github/resilience4j/commons/configuration/retry/configure/CommonsConfigurationRetryConfiguration.java#L35-L36), [resilience4j-commons-configuration/src/main/java/io/github/resilience4j/commons/configuration/circuitbreaker/configure/CommonsConfigurationCircuitBreakerConfiguration.java](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-commons-configuration/src/main/java/io/github/resilience4j/commons/configuration/circuitbreaker/configure/CommonsConfigurationCircuitBreakerConfiguration.java#L33-L34), [resilience4j-commons-configuration/src/main/java/io/github/resilience4j/commons/configuration/ratelimiter/configure/CommonsConfigurationRateLimiterConfiguration.java](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-commons-configuration/src/main/java/io/github/resilience4j/commons/configuration/ratelimiter/configure/CommonsConfigurationRateLimiterConfiguration.java#L31-L32), [resilience4j-commons-configuration/src/main/java/io/github/resilience4j/commons/configuration/bulkhead/configure/CommonsConfigurationBulkHeadConfiguration.java](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-commons-configuration/src/main/java/io/github/resilience4j/commons/configuration/bulkhead/configure/CommonsConfigurationBulkHeadConfiguration.java#L31-L32), [resilience4j-commons-configuration/src/main/java/io/github/resilience4j/commons/configuration/timelimiter/configure/CommonsConfigurationTimeLimiterConfiguration.java](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-commons-configuration/src/main/java/io/github/resilience4j/commons/configuration/timelimiter/configure/CommonsConfigurationTimeLimiterConfiguration.java#L31-L32)

## Circuit Breaker Commons Configuration Parsing

### Overview

The parsing and binding of Apache Commons Configuration properties for CircuitBreaker instances is coordinated through `CommonsConfigurationCircuitBreakerConfiguration` and `CommonsConfigurationCircuitBreakerRegistry`. These components locate property trees under fixed root paths, extract instance keys, and map raw configuration values into strongly-typed `InstanceProperties` instances.

Sources: [resilience4j-commons-configuration/src/main/java/io/github/resilience4j/commons/configuration/circuitbreaker/configure/CommonsConfigurationCircuitBreakerConfiguration.java](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-commons-configuration/src/main/java/io/github/resilience4j/commons/configuration/circuitbreaker/configure/CommonsConfigurationCircuitBreakerConfiguration.java#L32-L81), [resilience4j-commons-configuration/src/main/java/io/github/resilience4j/commons/configuration/circuitbreaker/configure/CommonsConfigurationCircuitBreakerRegistry.java](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-commons-configuration/src/main/java/io/github/resilience4j/commons/configuration/circuitbreaker/configure/CommonsConfigurationCircuitBreakerRegistry.java#L29-L48)

### Configuration Parsing Flow

The parsing sequence executes through a defined call chain starting from the root configuration object. 

`CommonsConfigurationCircuitBreakerConfiguration.of(Configuration)` → `configuration.subset(CIRCUITBREAKER_INSTANCES_PREFIX)` → `getProperties(Configuration)` → `StringParseUtil.extractUniquePrefixes(...)` → `mapConfigurationToInstanceProperties.apply(Configuration)`

During this chain, `CommonsConfigurationCircuitBreakerConfiguration.of()` wraps parsing logic in a `try-catch` block, catching any exceptions and throwing a `ConfigParseException`.

Sources: [resilience4j-commons-configuration/src/main/java/io/github/resilience4j/commons/configuration/circuitbreaker/configure/CommonsConfigurationCircuitBreakerConfiguration.java](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-commons-configuration/src/main/java/io/github/resilience4j/commons/configuration/circuitbreaker/configure/CommonsConfigurationCircuitBreakerConfiguration.java#L72-L81)

> [!NOTE]
> `CommonsConfigurationCircuitBreakerConfiguration` defines private constructors and static factory methods, restricting instantiation to the static `of(Configuration)` method.

Sources: [resilience4j-commons-configuration/src/main/java/io/github/resilience4j/commons/configuration/circuitbreaker/configure/CommonsConfigurationCircuitBreakerConfiguration.java](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-commons-configuration/src/main/java/io/github/resilience4j/commons/configuration/circuitbreaker/configure/CommonsConfigurationCircuitBreakerConfiguration.java#L63-L81)

### Property Mappings and Registry Construction

The lambda function `mapConfigurationToInstanceProperties` inspects the configuration subset for explicit keys, parsing durations, enums, primitives, and class references using utility helpers such as `ClassParseUtil`.

Sources: [resilience4j-commons-configuration/src/main/java/io/github/resilience4j/commons/configuration/circuitbreaker/configure/CommonsConfigurationCircuitBreakerConfiguration.java](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-commons-configuration/src/main/java/io/github/resilience4j/commons/configuration/circuitbreaker/configure/CommonsConfigurationCircuitBreakerConfiguration.java#L92-L158)

| Property Constant | Field / Key Name | Target Type / Method |
| :--- | :--- | :--- |
| `SLIDING_WINDOW_SIZE` | `slidingWindowSize` | `configuration.getInt(...)` |
| `FAILURE_RATE_THRESHOLD` | `failureRateThreshold` | `configuration.getFloat(...)` |
| `WAIT_DURATION_IN_OPEN_STATE` | `waitDurationInOpenState` | `configuration.getDuration(...)` |
| `SLIDING_WINDOW_TYPE` | `slidingWindowType` | `configuration.getEnum(..., SlidingWindowType.class)` |
| `INITIAL_STATE` | `initialState` | `configuration.getEnum(..., CircuitBreaker.State.class)` |
| `RECORD_EXCEPTIONS` | `recordExceptions` | `ClassParseUtil.convertStringListToClassTypeArray(...)` |
| `RECORD_FAILURE_PREDICATE` | `recordFailurePredicate` | `ClassParseUtil.convertStringToClassType(...)` |

Sources: [resilience4j-commons-configuration/src/main/java/io/github/resilience4j/commons/configuration/circuitbreaker/configure/CommonsConfigurationCircuitBreakerConfiguration.java](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-commons-configuration/src/main/java/io/github/resilience4j/commons/configuration/circuitbreaker/configure/CommonsConfigurationCircuitBreakerConfiguration.java#L35-L62), [resilience4j-commons-configuration/src/main/java/io/github/resilience4j/commons/configuration/circuitbreaker/configure/CommonsConfigurationCircuitBreakerConfiguration.java](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-commons-configuration/src/main/java/io/github/resilience4j/commons/configuration/circuitbreaker/configure/CommonsConfigurationCircuitBreakerConfiguration.java#L92-L158)

Once the properties are mapped, `CommonsConfigurationCircuitBreakerRegistry.of(Configuration, CompositeCustomizer)` extracts instance maps and builds individual `CircuitBreakerConfig` instances before instantiating the `CircuitBreakerRegistry`.

Sources: [resilience4j-commons-configuration/src/main/java/io/github/resilience4j/commons/configuration/circuitbreaker/configure/CommonsConfigurationCircuitBreakerRegistry.java](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-commons-configuration/src/main/java/io/github/resilience4j/commons/configuration/circuitbreaker/configure/CommonsConfigurationCircuitBreakerRegistry.java#L39-L47)

## Retry and Rate Limiter Binders

### Overview

The retry and rate limiter modules rely on `CommonsConfigurationRetryConfiguration` and `CommonsConfigurationRateLimiterConfiguration` to parse Apache Commons Configuration properties into structured instance properties. These configuration classes extend `CommonRetryConfigurationProperties` and `CommonRateLimiterConfigurationProperties`, providing prefix extraction under `resilience4j.retry.configs`, `resilience4j.retry.instances`, `resilience4j.ratelimiter.configs`, and `resilience4j.ratelimiter.instances`.

Sources: [resilience4j-commons-configuration/src/main/java/io/github/resilience4j/commons/configuration/retry/configure/CommonsConfigurationRetryConfiguration.java](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-commons-configuration/src/main/java/io/github/resilience4j/commons/configuration/retry/configure/CommonsConfigurationRetryConfiguration.java#L34-L70), [resilience4j-commons-configuration/src/main/java/io/github/resilience4j/commons/configuration/ratelimiter/configure/CommonsConfigurationRateLimiterConfiguration.java](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-commons-configuration/src/main/java/io/github/resilience4j/commons/configuration/ratelimiter/configure/CommonsConfigurationRateLimiterConfiguration.java#L30-L61)

### Property Extraction and Call-Chain Execution

When initializing registries, Apache Commons Configuration instances flow through static factory methods that orchestrate parsing and mapping. The execution walkthrough follows this specific call path:

1. `CommonsConfigurationRetryRegistry.of(configuration, customizer)` or `CommonsConfigurationRateLimiterRegistry.of(configuration, customizer)` is invoked with an Apache Commons `Configuration` instance and a `CompositeCustomizer`.
   Sources: [resilience4j-commons-configuration/src/main/java/io/github/resilience4j/commons/configuration/retry/configure/CommonsConfigurationRetryRegistry.java](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-commons-configuration/src/main/java/io/github/resilience4j/commons/configuration/retry/configure/CommonsConfigurationRetryRegistry.java#L39-L47), [resilience4j-commons-configuration/src/main/java/io/github/resilience4j/commons/configuration/ratelimiter/configure/CommonsConfigurationRateLimiterRegistry.java](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-commons-configuration/src/main/java/io/github/resilience4j/commons/configuration/ratelimiter/configure/CommonsConfigurationRateLimiterRegistry.java#L39-L47)
2. The registry calls `CommonsConfigurationRetryConfiguration.of(configuration)` or `CommonsConfigurationRateLimiterConfiguration.of(configuration)`, which wraps property extraction in a try-catch block and throws a `ConfigParseException` if errors occur.
   Sources: [resilience4j-commons-configuration/src/main/java/io/github/resilience4j/commons/configuration/retry/configure/CommonsConfigurationRetryConfiguration.java](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-commons-configuration/src/main/java/io/github/resilience4j/commons/configuration/retry/configure/CommonsConfigurationRetryConfiguration.java#L61-L70), [resilience4j-commons-configuration/src/main/java/io/github/resilience4j/commons/configuration/ratelimiter/configure/CommonsConfigurationRateLimiterConfiguration.java](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-commons-configuration/src/main/java/io/github/resilience4j/commons/configuration/ratelimiter/configure/CommonsConfigurationRateLimiterConfiguration.java#L52-L61)
3. `of(configuration)` extracts configuration subsets using prefixes (`resilience4j.retry.configs`, `resilience4j.retry.instances`, `resilience4j.ratelimiter.configs`, `resilience4j.ratelimiter.instances`) and passes them to `getProperties(configuration)`.
   Sources: [resilience4j-commons-configuration/src/main/java/io/github/resilience4j/commons/configuration/retry/configure/CommonsConfigurationRetryConfiguration.java](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-commons-configuration/src/main/java/io/github/resilience4j/commons/configuration/retry/configure/CommonsConfigurationRetryConfiguration.java#L64-L65), [resilience4j-commons-configuration/src/main/java/io/github/resilience4j/commons/configuration/ratelimiter/configure/CommonsConfigurationRateLimiterConfiguration.java](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-commons-configuration/src/main/java/io/github/resilience4j/commons/configuration/ratelimiter/configure/CommonsConfigurationRateLimiterConfiguration.java#L55-L56)
4. `getProperties(configuration)` uses `StringParseUtil.extractUniquePrefixes` with `Constants.PROPERTIES_KEY_DELIMITER` to identify unique instance names.
   Sources: [resilience4j-commons-configuration/src/main/java/io/github/resilience4j/commons/configuration/retry/configure/CommonsConfigurationRetryConfiguration.java](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-commons-configuration/src/main/java/io/github/resilience4j/commons/configuration/retry/configure/CommonsConfigurationRetryConfiguration.java#L72-L73), [resilience4j-commons-configuration/src/main/java/io/github/resilience4j/commons/configuration/ratelimiter/configure/CommonsConfigurationRateLimiterConfiguration.java](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-commons-configuration/src/main/java/io/github/resilience4j/commons/configuration/ratelimiter/configure/CommonsConfigurationRateLimiterConfiguration.java#L63-L64)
5. For each unique prefix, a lambda mapper (`mapConfigurationToInstanceProperties`) inspects individual keys via `configuration.containsKey(...)` and populates `InstanceProperties` objects.
   Sources: [resilience4j-commons-configuration/src/main/java/io/github/resilience4j/commons/configuration/retry/configure/CommonsConfigurationRetryConfiguration.java](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-commons-configuration/src/main/java/io/github/resilience4j/commons/configuration/retry/configure/CommonsConfigurationRetryConfiguration.java#L75-L138), [resilience4j-commons-configuration/src/main/java/io/github/resilience4j/commons/configuration/ratelimiter/configure/CommonsConfigurationRateLimiterConfiguration.java](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-commons-configuration/src/main/java/io/github/resilience4j/commons/configuration/ratelimiter/configure/CommonsConfigurationRateLimiterConfiguration.java#L66-L101)

> [!WARNING]
> If any parsing operation fails during `of(Configuration)` execution, the caught exception is rethrown wrapped inside a `ConfigParseException`, halting registry creation.

Sources: [resilience4j-commons-configuration/src/main/java/io/github/resilience4j/commons/configuration/retry/configure/CommonsConfigurationRetryConfiguration.java](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-commons-configuration/src/main/java/io/github/resilience4j/commons/configuration/retry/configure/CommonsConfigurationRetryConfiguration.java#L67-L70), [resilience4j-commons-configuration/src/main/java/io/github/resilience4j/commons/configuration/ratelimiter/configure/CommonsConfigurationRateLimiterConfiguration.java](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-commons-configuration/src/main/java/io/github/resilience4j/commons/configuration/ratelimiter/configure/CommonsConfigurationRateLimiterConfiguration.java#L58-L60)

### Configured Properties Reference

The mapping functions translate string configuration keys into typed properties using configuration getter methods and utility parsers such as `ClassParseUtil`.

| Property Constant / Key | Target Field Name | Extraction Method / Parser |
| :--- | :--- | :--- |
| `baseConfig` | `baseConfig` | `configuration.getString(...)` |
| `waitDuration` | `waitDuration` | `configuration.getDuration(...)` |
| `maxAttempts` | `maxAttempts` | `configuration.getInt(...)` |
| `intervalBiFunction` | `intervalBiFunction` | `ClassParseUtil.convertStringToClassType(...)` |
| `retryExceptions` | `retryExceptions` | `ClassParseUtil.convertStringListToClassTypeArray(...)` |
| `limitForPeriod` | `limitForPeriod` | `configuration.getInt(...)` |
| `limitRefreshPeriod` | `limitRefreshPeriod` | `configuration.getDuration(...)` |
| `timeoutDuration` | `timeoutDuration` | `configuration.getDuration(...)` |
| `subscribeForEvents` | `subscribeForEvents` | `configuration.getBoolean(...)` |
| `writableStackTraceEnabled` | `writableStackTraceEnabled` | `configuration.getBoolean(...)` |

Sources: [resilience4j-commons-configuration/src/main/java/io/github/resilience4j/commons/configuration/retry/configure/CommonsConfigurationRetryConfiguration.java](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-commons-configuration/src/main/java/io/github/resilience4j/commons/configuration/retry/configure/CommonsConfigurationRetryConfiguration.java#L37-L51), [resilience4j-commons-configuration/src/main/java/io/github/resilience4j/commons/configuration/retry/configure/CommonsConfigurationRetryConfiguration.java](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-commons-configuration/src/main/java/io/github/resilience4j/commons/configuration/retry/configure/CommonsConfigurationRetryConfiguration.java#L81-L137), [resilience4j-commons-configuration/src/main/java/io/github/resilience4j/commons/configuration/ratelimiter/configure/CommonsConfigurationRateLimiterConfiguration.java](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-commons-configuration/src/main/java/io/github/resilience4j/commons/configuration/ratelimiter/configure/CommonsConfigurationRateLimiterConfiguration.java#L33-L42), [resilience4j-commons-configuration/src/main/java/io/github/resilience4j/commons/configuration/ratelimiter/configure/CommonsConfigurationRateLimiterConfiguration.java](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-commons-configuration/src/main/java/io/github/resilience4j/commons/configuration/ratelimiter/configure/CommonsConfigurationRateLimiterConfiguration.java#L72-L101)

### Registry Construction

Once instance properties are mapped, `CommonsConfigurationRetryRegistry` and `CommonsConfigurationRateLimiterRegistry` collect the configuration entries into streams. They apply customizers via `CompositeCustomizer` and create underlying `RetryConfig` or `RateLimiterConfig` objects before returning the initialized `RetryRegistry` or `RateLimiterRegistry`.

Sources: [resilience4j-commons-configuration/src/main/java/io/github/resilience4j/commons/configuration/retry/configure/CommonsConfigurationRetryRegistry.java](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-commons-configuration/src/main/java/io/github/resilience4j/commons/configuration/retry/configure/CommonsConfigurationRetryRegistry.java#L39-L47), [resilience4j-commons-configuration/src/main/java/io/github/resilience4j/commons/configuration/ratelimiter/configure/CommonsConfigurationRateLimiterRegistry.java](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-commons-configuration/src/main/java/io/github/resilience4j/commons/configuration/ratelimiter/configure/CommonsConfigurationRateLimiterRegistry.java#L39-L47)

## Bulkhead and Time Limiter Binders

### Overview

The configuration parsing and registry creation for Bulkhead and TimeLimiter features are handled by dedicated binding classes within the Apache Commons Configuration module. `CommonsConfigurationBulkHeadConfiguration` and `CommonsConfigurationTimeLimiterConfiguration` inherit from `CommonBulkheadConfigurationProperties` and `CommonTimeLimiterConfigurationProperties`, parsing properties under specific prefixes.

Sources: [resilience4j-commons-configuration/src/main/java/io/github/resilience4j/commons/configuration/bulkhead/configure/CommonsConfigurationBulkHeadConfiguration.java](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-commons-configuration/src/main/java/io/github/resilience4j/commons/configuration/bulkhead/configure/CommonsConfigurationBulkHeadConfiguration.java#L30-L36), [resilience4j-commons-configuration/src/main/java/io/github/resilience4j/commons/configuration/timelimiter/configure/CommonsConfigurationTimeLimiterConfiguration.java](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-commons-configuration/src/main/java/io/github/resilience4j/commons/configuration/timelimiter/configure/CommonsConfigurationTimeLimiterConfiguration.java#L30-L36)

### Call-Chain Execution Walkthrough

The instantiation flow for registries proceeds through specific transformation stages:

1. `CommonsConfigurationBulkheadRegistry.of(configuration, customizer)` or `CommonsConfigurationTimeLimiterRegistry.of(configuration, customizer)` is invoked with an Apache Commons `Configuration` instance and a `CompositeCustomizer`.
   Sources: [resilience4j-commons-configuration/src/main/java/io/github/resilience4j/commons/configuration/bulkhead/configure/CommonsConfigurationBulkheadRegistry.java](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-commons-configuration/src/main/java/io/github/resilience4j/commons/configuration/bulkhead/configure/CommonsConfigurationBulkheadRegistry.java#L40-L48), [resilience4j-commons-configuration/src/main/java/io/github/resilience4j/commons/configuration/timelimiter/configure/CommonsConfigurationTimeLimiterRegistry.java](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-commons-configuration/src/main/java/io/github/resilience4j/commons/configuration/timelimiter/configure/CommonsConfigurationTimeLimiterRegistry.java#L39-L47)
2. `CommonsConfigurationBulkHeadConfiguration.of(configuration)` or `CommonsConfigurationTimeLimiterConfiguration.of(configuration)` extracts configuration subsets via `BULK_HEAD_CONFIGS_PREFIX` / `TIME_LIMITER_CONFIGS_PREFIX` and `BULK_HEAD_INSTANCES_PREFIX` / `TIME_LIMITER_INSTANCES_PREFIX`.
   Sources: [resilience4j-commons-configuration/src/main/java/io/github/resilience4j/commons/configuration/bulkhead/configure/CommonsConfigurationBulkHeadConfiguration.java](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-commons-configuration/src/main/java/io/github/resilience4j/commons/configuration/bulkhead/configure/CommonsConfigurationBulkHeadConfiguration.java#L47-L56), [resilience4j-commons-configuration/src/main/java/io/github/resilience4j/commons/configuration/timelimiter/configure/CommonsConfigurationTimeLimiterConfiguration.java](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-commons-configuration/src/main/java/io/github/resilience4j/commons/configuration/timelimiter/configure/CommonsConfigurationTimeLimiterConfiguration.java#L46-L55)
3. `getProperties(configuration)` uses `StringParseUtil.extractUniquePrefixes` to identify individual instances based on `Constants.PROPERTIES_KEY_DELIMITER`.
   Sources: [resilience4j-commons-configuration/src/main/java/io/github/resilience4j/commons/configuration/bulkhead/configure/CommonsConfigurationBulkHeadConfiguration.java](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-commons-configuration/src/main/java/io/github/resilience4j/commons/configuration/bulkhead/configure/CommonsConfigurationBulkHeadConfiguration.java#L58-L59), [resilience4j-commons-configuration/src/main/java/io/github/resilience4j/commons/configuration/timelimiter/configure/CommonsConfigurationTimeLimiterConfiguration.java](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-commons-configuration/src/main/java/io/github/resilience4j/commons/configuration/timelimiter/configure/CommonsConfigurationTimeLimiterConfiguration.java#L57-L58)
4. `mapConfigurationToInstanceProperties` maps individual property keys to bean properties (`maxConcurrentCalls`, `maxWaitDuration`, `timeoutDuration`, `cancelRunningFuture`, `writableStackTraceEnabled`, `eventConsumerBufferSize`, and `baseConfig`).
   Sources: [resilience4j-commons-configuration/src/main/java/io/github/resilience4j/commons/configuration/bulkhead/configure/CommonsConfigurationBulkHeadConfiguration.java](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-commons-configuration/src/main/java/io/github/resilience4j/commons/configuration/bulkhead/configure/CommonsConfigurationBulkHeadConfiguration.java#L67-L85), [resilience4j-commons-configuration/src/main/java/io/github/resilience4j/commons/configuration/timelimiter/configure/CommonsConfigurationTimeLimiterConfiguration.java](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-commons-configuration/src/main/java/io/github/resilience4j/commons/configuration/timelimiter/configure/CommonsConfigurationTimeLimiterConfiguration.java#L66-L81)
5. The resulting registry collects entries via Java streams, applying customizers through `createBulkheadConfig` or `createTimeLimiterConfig` before instantiating `BulkheadRegistry` or `TimeLimiterRegistry`.
   Sources: [resilience4j-commons-configuration/src/main/java/io/github/resilience4j/commons/configuration/bulkhead/configure/CommonsConfigurationBulkheadRegistry.java](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-commons-configuration/src/main/java/io/github/resilience4j/commons/configuration/bulkhead/configure/CommonsConfigurationBulkheadRegistry.java#L41-L47), [resilience4j-commons-configuration/src/main/java/io/github/resilience4j/commons/configuration/timelimiter/configure/CommonsConfigurationTimeLimiterRegistry.java](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-commons-configuration/src/main/java/io/github/resilience4j/commons/configuration/timelimiter/configure/CommonsConfigurationTimeLimiterRegistry.java#L40-L46)

### Configuration Properties Reference

| Property Key Constant | Target Configuration Class | Type / Parser Method |
| :--- | :--- | :--- |
| `maxConcurrentCalls` | Bulkhead | `configuration.getInt(...)` |
| `maxWaitDuration` | Bulkhead | `configuration.getDuration(...)` |
| `writableStackTraceEnabled` | Bulkhead / TimeLimiter | `configuration.getBoolean(...)` |
| `eventConsumerBufferSize` | Bulkhead / TimeLimiter | `configuration.getInt(...)` |
| `timeoutDuration` | TimeLimiter | `configuration.getDuration(...)` |
| `cancelRunningFuture` | TimeLimiter | `configuration.getBoolean(...)` |
| `baseConfig` | Bulkhead / TimeLimiter | `configuration.getString(...)` |

Sources: [resilience4j-commons-configuration/src/main/java/io/github/resilience4j/commons/configuration/bulkhead/configure/CommonsConfigurationBulkHeadConfiguration.java](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-commons-configuration/src/main/java/io/github/resilience4j/commons/configuration/bulkhead/configure/CommonsConfigurationBulkHeadConfiguration.java#L31-L36), [resilience4j-commons-configuration/src/main/java/io/github/resilience4j/commons/configuration/bulkhead/configure/CommonsConfigurationBulkHeadConfiguration.java](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-commons-configuration/src/main/java/io/github/resilience4j/commons/configuration/bulkhead/configure/CommonsConfigurationBulkHeadConfiguration.java#L67-L84), [resilience4j-commons-configuration/src/main/java/io/github/resilience4j/commons/configuration/timelimiter/configure/CommonsConfigurationTimeLimiterConfiguration.java](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-commons-configuration/src/main/java/io/github/resilience4j/commons/configuration/timelimiter/configure/CommonsConfigurationTimeLimiterConfiguration.java#L31-L35), [resilience4j-commons-configuration/src/main/java/io/github/resilience4j/commons/configuration/timelimiter/configure/CommonsConfigurationTimeLimiterConfiguration.java](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-commons-configuration/src/main/java/io/github/resilience4j/commons/configuration/timelimiter/configure/CommonsConfigurationTimeLimiterConfiguration.java#L66-L80)

## Registry Integration Across Framework Adaptors

### Overview

Framework integration adaptors populate and initialize resilience registries by combining configuration properties, customizers, and event consumer registries. While Commons Configuration bindings parse flat or hierarchical properties directly, Micronaut and Spring Boot autoconfiguration factories leverage dependency injection, conditional annotations, and composite builders to construct registries dynamically at runtime.

Sources: [resilience4j-micronaut/src/main/java/io/github/resilience4j/micronaut/circuitbreaker/CircuitBreakerRegistryFactory.java](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-micronaut/src/main/java/io/github/resilience4j/micronaut/circuitbreaker/CircuitBreakerRegistryFactory.java#L55-L68), [resilience4j-spring6/src/main/java/io/github/resilience4j/spring6/circuitbreaker/configure/CircuitBreakerConfiguration.java](https://github.com/resilience4j/spring6/blob/main/resilience4j-spring6/src/main/java/io/github/resilience4j/spring6/circuitbreaker/configure/CircuitBreakerConfiguration.java#L70-L81)

### Registry Initialization and Event Consumer Wiring

In both Micronaut factory classes (such as `CircuitBreakerRegistryFactory`) and Spring configuration classes (such as `CircuitBreakerConfiguration`), registry population follows a strict lifecycle sequence. First, base configurations and shared parameters are gathered to build the registry instance. Next, event consumer registries are bound to capture emitted telemetry, and individual resilience instances are initialized using properties and customizers.

The instantiation call chain proceeds through specific initialization phases:
`createCircuitBreakerRegistry()` → `registerEventConsumer()` → `initCircuitBreakerRegistry()`.

1. `createCircuitBreakerRegistry`: Collects configuration maps via stream collectors and creates the core registry using `CircuitBreakerRegistry.of(...)` with supplied event consumers and tags.
   Sources: [resilience4j-micronaut/src/main/java/io/github/resilience4j/micronaut/circuitbreaker/CircuitBreakerRegistryFactory.java](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-micronaut/src/main/java/io/github/resilience4j/micronaut/circuitbreaker/CircuitBreakerRegistryFactory.java#L112-L124), [resilience4j-spring6/src/main/java/io/github/resilience4j/spring6/circuitbreaker/configure/CircuitBreakerConfiguration.java](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-spring6/src/main/java/io/github/resilience4j/spring6/circuitbreaker/configure/CircuitBreakerConfiguration.java#L141-L151)
2. `registerEventConsumer`: Subscribes listeners to the registry's event publisher (`onEntryAdded`, `onEntryReplaced`, `onEntryRemoved`) to manage buffer sizes per backend instance.
   Sources: [resilience4j-micronaut/src/main/java/io/github/resilience4j/micronaut/circuitbreaker/CircuitBreakerRegistryFactory.java](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-micronaut/src/main/java/io/github/resilience4j/micronaut/circuitbreaker/CircuitBreakerRegistryFactory.java#L133-L139), [resilience4j-spring6/src/main/java/io/github/resilience4j/spring6/circuitbreaker/configure/CircuitBreakerConfiguration.java](https://github.com/resilience4j/spring6/blob/main/resilience4j-spring6/src/main/java/io/github/resilience4j/spring6/circuitbreaker/configure/CircuitBreakerConfiguration.java#L178-L184)
3. `initCircuitBreakerRegistry`: Iterates over configured instance properties to instantiate individual circuit breakers with customizers.
   Sources: [resilience4j-micronaut/src/main/java/io/github/resilience4j/micronaut/circuitbreaker/CircuitBreakerRegistryFactory.java](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-micronaut/src/main/java/io/github/resilience4j/micronaut/circuitbreaker/CircuitBreakerRegistryFactory.java#L95-L103), [resilience4j-spring6/src/main/java/io/github/resilience4j/spring6/circuitbreaker/configure/CircuitBreakerConfiguration.java](https://github.com/resilience4j/spring6/blob/main/resilience4j-spring6/src/main/java/io/github/resilience4j/spring6/circuitbreaker/configure/CircuitBreakerConfiguration.java#L159-L169)

```java
// Micronaut / Spring Boot initialization sequence exemplar
CircuitBreakerRegistry registry = createCircuitBreakerRegistry(properties, registryEventConsumer, customizer);
registerEventConsumer(registry, eventConsumerRegistry, properties);
initCircuitBreakerRegistry(registry, customizer);
```

Sources: [resilience4j-micronaut/src/main/java/io/github/resilience4j/micronaut/circuitbreaker/CircuitBreakerRegistryFactory.java](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-micronaut/src/main/java/io/github/resilience4j/micronaut/circuitbreaker/CircuitBreakerRegistryFactory.java#L57-L68), [resilience4j-spring6/src/main/java/io/github/resilience4j/spring6/circuitbreaker/configure/CircuitBreakerConfiguration.java](https://github.com/resilience4j/spring6/blob/main/resilience4j-spring6/src/main/java/io/github/resilience4j/spring6/circuitbreaker/configure/CircuitBreakerConfiguration.java#L70-L81)

> [!NOTE]
> In Spring Boot implementations (such as `CircuitBreakerConfiguration`), instance initialization also queries `compositeCircuitBreakerCustomizer.instanceNames()` to instantiate instances declared purely through programmatic customizers even if omitted from external configuration files.

Sources: [resilience4j-spring6/src/main/java/io/github/resilience4j/spring6/circuitbreaker/configure/CircuitBreakerConfiguration.java](https://github.com/resilience4j/spring6/blob/main/resilience4j-spring6/src/main/java/io/github/resilience4j/spring6/circuitbreaker/configure/CircuitBreakerConfiguration.java#L164-L169)

### Framework Adaptor Comparison

| Feature / Mechanism | Micronaut Adaptors | Spring Boot Adaptors |
| :--- | :--- | :--- |
| **Factory Annotation** | `@Factory` with `@Requires(property = "resilience4j....enabled", ...)` | `@Configuration` with `@ConditionalOnMissingBean` |
| **Customizer Binding** | `@Nullable List<ConfigCustomizer>` injected into `CompositeCustomizer` | `@Autowired(required = false) List<ConfigCustomizer>` with `@Qualifier` |
| **Registry Refresh Scope** | Managed natively via Micronaut context reloading | Supported via `RefreshScopedRegistryAutoConfiguration` and `@RefreshScope` |
| **Event Consumer Registry** | `@Bean` annotated with specific module qualifiers | `@Bean` with conditional fallback on missing beans |

Sources: [resilience4j-micronaut/src/main/java/io/github/resilience4j/micronaut/circuitbreaker/CircuitBreakerRegistryFactory.java](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-micronaut/src/main/java/io/github/resilience4j/micronaut/circuitbreaker/CircuitBreakerRegistryFactory.java#L45-L87), [resilience4j-spring6/src/main/java/io/github/resilience4j/spring6/circuitbreaker/configure/CircuitBreakerConfiguration.java](https://github.com/resilience4j/spring6/blob/main/resilience4j-spring6/src/main/java/io/github/resilience4j/spring6/circuitbreaker/configure/CircuitBreakerConfiguration.java#L51-L132), [resilience4j-spring-boot4/src/main/java/io/github/resilience4j/springboot/retry/autoconfigure/RetryRefreshScopedRegistryAutoConfiguration.java](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-spring-boot4/src/main/java/io/github/resilience4j/springboot/retry/autoconfigure/RetryRefreshScopedRegistryAutoConfiguration.java#L21-L43)

## Related

- [[Registry Management]]

