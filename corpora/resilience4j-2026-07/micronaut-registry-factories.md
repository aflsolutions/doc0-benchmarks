# Micronaut Registry Factories

<details>
<summary>Relevant source files</summary>

The following files were used as context for generating this wiki page:

- [resilience4j-micronaut/src/main/java/io/github/resilience4j/micronaut/ratelimiter/RateLimiterRegistryFactory.java](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-micronaut/src/main/java/io/github/resilience4j/micronaut/ratelimiter/RateLimiterRegistryFactory.java)
- [resilience4j-micronaut/src/main/java/io/github/resilience4j/micronaut/circuitbreaker/CircuitBreakerRegistryFactory.java](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-micronaut/src/main/java/io/github/resilience4j/micronaut/circuitbreaker/CircuitBreakerRegistryFactory.java)
- [resilience4j-micronaut/src/main/java/io/github/resilience4j/micronaut/timelimiter/TimeLimiterRegistryFactory.java](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-micronaut/src/main/java/io/github/resilience4j/micronaut/timelimiter/TimeLimiterRegistryFactory.java)
- [resilience4j-micronaut/src/main/java/io/github/resilience4j/micronaut/bulkhead/ThreadPoolBulkheadFactory.java](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-micronaut/src/main/java/io/github/resilience4j/micronaut/bulkhead/ThreadPoolBulkheadFactory.java)
- [resilience4j-spring6/src/main/java/io/github/resilience4j/spring6/circuitbreaker/configure/CircuitBreakerConfiguration.java](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-spring6/src/main/java/io/github/resilience4j/spring6/circuitbreaker/configure/CircuitBreakerConfiguration.java)
- [resilience4j-micronaut/src/main/java/io/github/resilience4j/micronaut/retry/RetryRegistryFactory.java](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-micronaut/src/main/java/io/github/resilience4j/micronaut/retry/RetryRegistryFactory.java)
- [resilience4j-micronaut/src/main/java/io/github/resilience4j/micronaut/bulkhead/BulkHeadRegistryFactory.java](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-micronaut/src/main/java/io/github/resilience4j/micronaut/bulkhead/BulkHeadRegistryFactory.java)
- [resilience4j-spring6/src/main/java/io/github/resilience4j/spring6/retry/configure/RetryConfiguration.java](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-spring6/src/main/java/io/github/resilience4j/spring6/retry/configure/RetryConfiguration.java)
- [resilience4j-spring6/src/main/java/io/github/resilience4j/spring6/bulkhead/configure/BulkheadConfiguration.java](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-spring6/src/main/java/io/github/resilience4j/spring6/bulkhead/configure/BulkheadConfiguration.java)
- [resilience4j-spring6/src/main/java/io/github/resilience4j/spring6/ratelimiter/configure/RateLimiterConfiguration.java](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-spring6/src/main/java/io/github/resilience4j/spring6/ratelimiter/configure/RateLimiterConfiguration.java)
- [resilience4j-spring-boot4/src/main/java/io/github/resilience4j/springboot/circuitbreaker/autoconfigure/CircuitBreakerAutoConfiguration.java](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-spring-boot4/src/main/java/io/github/resilience4j/springboot/circuitbreaker/autoconfigure/CircuitBreakerAutoConfiguration.java)
- [resilience4j-micronaut/src/main/java/io/github/resilience4j/micronaut/circuitbreaker/CircuitBreakerInterceptor.java](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-micronaut/src/main/java/io/github/resilience4j/micronaut/circuitbreaker/CircuitBreakerInterceptor.java)
- [resilience4j-micronaut/src/main/java/io/github/resilience4j/micronaut/retry/RetryInterceptor.java](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-micronaut/src/main/java/io/github/resilience4j/micronaut/retry/RetryInterceptor.java)
- [resilience4j-spring-boot3/src/main/resources/META-INF/additional-spring-configuration-metadata.json](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-spring-boot3/src/main/resources/META-INF/additional-spring-configuration-metadata.json)
- [resilience4j-commons-configuration/src/main/java/io/github/resilience4j/commons/configuration/circuitbreaker/configure/CommonsConfigurationCircuitBreakerRegistry.java](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-commons-configuration/src/main/java/io/github/resilience4j/commons/configuration/circuitbreaker/configure/CommonsConfigurationCircuitBreakerRegistry.java)
- [resilience4j-micronaut/src/main/java/io/github/resilience4j/micronaut/retry/RetryProperties.java](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-micronaut/src/main/java/io/github/resilience4j/micronaut/retry/RetryProperties.java)
- [resilience4j-micronaut/src/main/java/io/github/resilience4j/micronaut/circuitbreaker/CircuitBreakerProperties.java](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-micronaut/src/main/java/io/github/resilience4j/micronaut/circuitbreaker/CircuitBreakerProperties.java)
- [resilience4j-spring-boot4/src/main/java/io/github/resilience4j/springboot/circuitbreaker/autoconfigure/CircuitBreakerRefreshScopedRegistryAutoConfiguration.java](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-spring-boot4/src/main/java/io/github/resilience4j/springboot/circuitbreaker/autoconfigure/CircuitBreakerRefreshScopedRegistryAutoConfiguration.java)
- [resilience4j-micronaut/src/main/java/io/github/resilience4j/micronaut/ratelimiter/RateLimiterProperties.java](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-micronaut/src/main/java/io/github/resilience4j/micronaut/ratelimiter/RateLimiterProperties.java)
- [resilience4j-spring-boot3/src/main/java/io/github/resilience4j/springboot3/circuitbreaker/autoconfigure/AbstractCircuitBreakerConfigurationOnMissingBean.java](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-spring-boot3/src/main/java/io/github/resilience4j/springboot3/circuitbreaker/autoconfigure/AbstractCircuitBreakerConfigurationOnMissingBean.java)
- [resilience4j-spring-boot4/src/main/java/io/github/resilience4j/springboot/retry/autoconfigure/RetryAutoConfiguration.java](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-spring-boot4/src/main/java/io/github/resilience4j/springboot/retry/autoconfigure/RetryAutoConfiguration.java)
- [resilience4j-spring-boot3/src/main/java/io/github/resilience4j/springboot3/retry/autoconfigure/AbstractRetryConfigurationOnMissingBean.java](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-spring-boot3/src/main/java/io/github/resilience4j/springboot3/retry/autoconfigure/AbstractRetryConfigurationOnMissingBean.java)
- [resilience4j-spring-boot4/src/main/java/io/github/resilience4j/springboot/retry/autoconfigure/RetryRefreshScopedRegistryAutoConfiguration.java](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-spring-boot4/src/main/java/io/github/resilience4j/springboot/retry/autoconfigure/RetryRefreshScopedRegistryAutoConfiguration.java)
- [resilience4j-spring-boot4/src/main/java/io/github/resilience4j/springboot/bulkhead/autoconfigure/BulkheadRefreshScopedRegistryAutoConfiguration.java](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-spring-boot4/src/main/java/io/github/resilience4j/springboot/bulkhead/autoconfigure/BulkheadRefreshScopedRegistryAutoConfiguration.java)
- [resilience4j-spring-boot4/src/main/java/io/github/resilience4j/springboot/bulkhead/autoconfigure/BulkheadAutoConfiguration.java](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-spring-boot4/src/main/java/io/github/resilience4j/springboot/bulkhead/autoconfigure/BulkheadAutoConfiguration.java)
- [resilience4j-spring-boot3/src/main/java/io/github/resilience4j/springboot3/circuitbreaker/autoconfigure/CircuitBreakersHealthIndicatorAutoConfiguration.java](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-spring-boot3/src/main/java/io/github/resilience4j/springboot3/circuitbreaker/autoconfigure/CircuitBreakersHealthIndicatorAutoConfiguration.java)
- [resilience4j-spring-boot4/src/main/java/io/github/resilience4j/springboot/ratelimiter/autoconfigure/RateLimiterAutoConfiguration.java](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-springboot4/src/main/java/io/github/resilience4j/springboot/ratelimiter/autoconfigure/RateLimiterAutoConfiguration.java)
- [resilience4j-spring-boot4/src/main/java/io/github/resilience4j/springboot/ratelimiter/autoconfigure/RateLimiterRefreshScopedRegistryAutoConfiguration.java](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-springboot4/src/main/java/io/github/resilience4j/springboot/ratelimiter/autoconfigure/RateLimiterRefreshScopedRegistryAutoConfiguration.java)
- [README.adoc](https://github.com/resilience4j/resilience4j/blob/main/README.adoc)
- [resilience4j-spring-boot3/src/main/java/io/github/resilience4j/springboot3/nativeimage/configuration/NativeHintsConfiguration.java](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-spring-boot3/src/main/java/io/github/resilience4j/springboot3/nativeimage/configuration/NativeHintsConfiguration.java)
</details>

## Overview

Micronaut Registry Factories provide a modular configuration infrastructure that automatically provisions and manages Resilience4j fault tolerance registries within Micronaut applications. By leveraging conditional activation and properties binding, these factories instantiate and configure distinct runtime registries for circuit breakers, retries, bulkheads, rate limiters, and time limiters. Sources: [resilience4j-micronaut/src/main/java/io/github/resilience4j/micronaut/ratelimiter/RateLimiterRegistryFactory.java#L43-L45](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-micronaut/src/main/java/io/github/resilience4j/micronaut/ratelimiter/RateLimiterRegistryFactory.java#L43-L45), [resilience4j-micronaut/src/main/java/io/github/resilience4j/micronaut/circuitbreaker/CircuitBreakerRegistryFactory.java#L45-L47](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-micronaut/src/main/java/io/github/resilience4j/micronaut/circuitbreaker/CircuitBreakerRegistryFactory.java#L45-L47), [resilience4j-micronaut/src/main/java/io/github/resilience4j/micronaut/timelimiter/TimeLimiterRegistryFactory.java#L45-L47](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-micronaut/src/main/java/io/github/resilience4j/micronaut/timelimiter/TimeLimiterRegistryFactory.java#L45-L47), [resilience4j-micronaut/src/main/java/io/github/resilience4j/micronaut/bulkhead/ThreadPoolBulkheadFactory.java#L46-L48](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-micronaut/src/main/java/io/github/resilience4j/micronaut/bulkhead/ThreadPoolBulkheadFactory.java#L46-L48), [resilience4j-micronaut/src/main/java/io/github/resilience4j/micronaut/retry/RetryRegistryFactory.java#L43-L45](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-micronaut/src/main/java/io/github/resilience4j/micronaut/retry/RetryRegistryFactory.java#L43-L45), [resilience4j-micronaut/src/main/java/io/github/resilience4j/micronaut/bulkhead/BulkHeadRegistryFactory.java#L45-L47](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-micronaut/src/main/java/io/github/resilience4j/micronaut/bulkhead/BulkHeadRegistryFactory.java#L45-L47)

These components bridge declarative configuration properties with method interception frameworks, enabling seamless integration of event consumers, customizers, and execution interceptors across distributed service boundaries. Sources: [resilience4j-micronaut/src/main/java/io/github/resilience4j/micronaut/ratelimiter/RateLimiterRegistryFactory.java#L49-L69](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-micronaut/src/main/java/io/github/resilience4j/micronaut/ratelimiter/RateLimiterRegistryFactory.java#L49-L69), [resilience4j-micronaut/src/main/java/io/github/resilience4j/micronaut/circuitbreaker/CircuitBreakerRegistryFactory.java#L48-L68](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-micronaut/src/main/java/io/github/resilience4j/micronaut/circuitbreaker/CircuitBreakerRegistryFactory.java#L48-L68), [resilience4j-micronaut/src/main/java/io/github/resilience4j/micronaut/circuitbreaker/CircuitBreakerInterceptor.java#L37-L51](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-micronaut/src/main/java/io/github/resilience4j/micronaut/circuitbreaker/CircuitBreakerInterceptor.java#L37-L51), [resilience4j-micronaut/src/main/java/io/github/resilience4j/micronaut/retry/RetryInterceptor.java#L41-L61](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-micronaut/src/main/java/io/github/resilience4j/micronaut/retry/RetryInterceptor.java#L41-L61)

## Circuit Breaker Registry Factory Setup

### Overview

The `CircuitBreakerRegistryFactory` provisions and manages `CircuitBreakerRegistry` singleton beans within Micronaut applications. Annotated with `@Factory` and conditionally loaded via `@Requires(property = "resilience4j.circuitbreaker.enabled", value = StringUtils.TRUE, defaultValue = StringUtils.FALSE)`, this factory constructs customized circuit breaker instances, configures shared configuration maps, and binds event consumers through Micronaut's dependency injection container. Sources: [resilience4j-micronaut/src/main/java/io/github/resilience4j/micronaut/circuitbreaker/CircuitBreakerRegistryFactory.java#L31-L47](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-micronaut/src/main/java/io/github/resilience4j/micronaut/circuitbreaker/CircuitBreakerRegistryFactory.java#L31-L47)

### Bean Provisioning and Call-Chain Execution

The construction of the `CircuitBreakerRegistry` follows a strict execution sequence orchestrated by the `circuitBreakerRegistry` method. When Micronaut resolves the registry bean, it executes a three-phase initialization lifecycle:

`circuitBreakerRegistry()` → `createCircuitBreakerRegistry()` → `registerEventConsumer()` → `initCircuitBreakerRegistry()`

1. **`createCircuitBreakerRegistry`**: Maps and compiles shared `CircuitBreakerConfig` instances from `CommonCircuitBreakerConfigurationProperties.getConfigs()`, applying any `CompositeCustomizer<CircuitBreakerConfigCustomizer>` beans, and instantiates the base registry via `CircuitBreakerRegistry.of(configs, circuitBreakerRegistryEventConsumer, circuitBreakerProperties.getTags())`. Sources: [resilience4j-micronaut/src/main/java/io/github/resilience4j/micronaut/circuitbreaker/CircuitBreakerRegistryFactory.java#L112-L124](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-micronaut/src/main/java/io/github/resilience4j/micronaut/circuitbreaker/CircuitBreakerRegistryFactory.java#L112-L124)
2. **`registerEventConsumer`**: Subscribes registry event publishers to `onEntryAdded`, `onEntryReplaced`, and `onEntryRemoved` events. When an entry is added or replaced, it retrieves the instance-specific `eventConsumerBufferSize` (defaulting to `100` if unconfigured) and attaches an event consumer from the `EventConsumerRegistry<CircuitBreakerEvent>`. Removal events invoke `unregisterEventConsumer` to clean up bindings. Sources: [resilience4j-micronaut/src/main/java/io/github/resilience4j/micronaut/circuitbreaker/CircuitBreakerRegistryFactory.java#L133-L155](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-micronaut/src/main/java/io/github/resilience4j/micronaut/circuitbreaker/CircuitBreakerRegistryFactory.java#L133-L155)
3. **`initCircuitBreakerRegistry`**: Iterates through `circuitBreakerConfigurationProperties.getInstances()` and eagerly instantiates named circuit breaker instances using custom configuration parameters. Sources: [resilience4j-micronaut/src/main/java/io/github/resilience4j/micronaut/circuitbreaker/CircuitBreakerRegistryFactory.java#L95-L103](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-micronaut/src/main/java/io/github/resilience4j/micronaut/circuitbreaker/CircuitBreakerRegistryFactory.java#L95-L103)

> [!NOTE]
> The `circuitBreakerRegistry` method requires the presence of the `CircuitBreakerProperties` bean via `@Requires(beans = CircuitBreakerProperties.class)` to trigger container injection. Sources: [resilience4j-micronaut/src/main/java/io/github/resilience4j/micronaut/circuitbreaker/CircuitBreakerRegistryFactory.java#L55-L56](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-micronaut/src/main/java/io/github/resilience4j/micronaut/circuitbreaker/CircuitBreakerRegistryFactory.java#L55-L56)

### Configuration Binding and Properties

The `CircuitBreakerProperties` class extends `CommonCircuitBreakerConfigurationProperties` and implements Micronaut's `Toggleable` interface, binding external configuration keys prefixed with `resilience4j.circuitbreaker`. It declares nested `@EachProperty` classes to bind map entries for shared configurations and specific instances. Sources: [resilience4j-micronaut/src/main/java/io/github/resilience4j/micronaut/circuitbreaker/CircuitBreakerProperties.java#L29-L30](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-micronaut/src/main/java/io/github/resilience4j/micronaut/circuitbreaker/CircuitBreakerProperties.java#L29-L30)

| Factory Bean Method | Scope / Qualifier | Primary / Conditional Requirements | Purpose | Sources |
| :--- | :--- | :--- | :--- | :--- |
| `compositeCircuitBreakerCustomizer` | `@Bean`, `@CircuitBreakerQualifier` | Optional `List<CircuitBreakerConfigCustomizer>` | Wraps configuration customizers into a composite container. | [resilience4j-micronaut/src/main/java/io/github/resilience4j/micronaut/circuitbreaker/CircuitBreakerRegistryFactory.java#L48-L53](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-micronaut/src/main/java/io/github/resilience4j/micronaut/circuitbreaker/CircuitBreakerRegistryFactory.java#L48-L53) |
| `circuitBreakerRegistry` | `@Singleton` | `@Requires(beans = CircuitBreakerProperties.class)` | Constructs, initializes, and returns the primary `CircuitBreakerRegistry`. | [resilience4j-micronaut/src/main/java/io/github/resilience4j/micronaut/circuitbreaker/CircuitBreakerRegistryFactory.java#L55-L68](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-micronaut/src/main/java/io/github/resilience4j/micronaut/circuitbreaker/CircuitBreakerRegistryFactory.java#L55-L68) |
| `circuitBreakerRegistryEventConsumer` | `@Bean`, `@Primary`, `@CircuitBreakerQualifier` | Optional `List<RegistryEventConsumer<CircuitBreaker>>` | Aggregates registry event consumers into a composite event consumer. | [resilience4j-micronaut/src/main/java/io/github/resilience4j/micronaut/circuitbreaker/CircuitBreakerRegistryFactory.java#L71-L80](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-micronaut/src/main/java/io/github/resilience4j/micronaut/circuitbreaker/CircuitBreakerRegistryFactory.java#L71-L80) |
| `circuitBreakerEventsConsumerRegistry` | `@Bean`, `@CircuitBreakerQualifier` | None | Instantiates a default event consumer registry for circuit breaker events. | [resilience4j-micronaut/src/main/java/io/github/resilience4j/micronaut/circuitbreaker/CircuitBreakerRegistryFactory.java#L82-L86](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-micronaut/src/main/java/io/github/resilience4j/micronaut/circuitbreaker/CircuitBreakerRegistryFactory.java#L82-L86) |

Sources: [resilience4j-micronaut/src/main/java/io/github/resilience4j/micronaut/circuitbreaker/CircuitBreakerRegistryFactory.java#L48-L86](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-micronaut/src/main/java/io/github/resilience4j/micronaut/circuitbreaker/CircuitBreakerRegistryFactory.java#L48-L86)

### Properties Structure and Inner Bindings

The `CircuitBreakerProperties` constructor binds configuration maps by parsing parameterized inner classes annotated with Micronaut binding annotations. Sources: [resilience4j-micronaut/src/main/java/io/github/resilience4j/micronaut/circuitbreaker/CircuitBreakerProperties.java#L33-L42](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-micronaut/src/main/java/io/github/resilience4j/micronaut/circuitbreaker/CircuitBreakerProperties.java#L33-L42)

```java
@ConfigurationProperties("resilience4j.circuitbreaker")
public class CircuitBreakerProperties extends CommonCircuitBreakerConfigurationProperties implements Toggleable {
    private boolean enabled;

    public CircuitBreakerProperties(
        List<CircuitBreakerProperties.InstancePropertiesConfigs> configs,
        List<CircuitBreakerProperties.InstancePropertiesInstances> instances) {
        for (CircuitBreakerProperties.InstancePropertiesConfigs config : configs) {
            this.getConfigs().put(config.getName(), config);
        }
        for (CircuitBreakerProperties.InstancePropertiesInstances instance : instances) {
            this.getInstances().put(instance.getName(), instance);
        }
    }
    // ...
}
```
Sources: [resilience4j-micronaut/src/main/java/io/github/resilience4j/micronaut/circuitbreaker/CircuitBreakerProperties.java#L29-L42](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-micronaut/src/main/java/io/github/resilience4j/micronaut/circuitbreaker/CircuitBreakerProperties.java#L29-L42)

> [!WARNING]
> If `resilience4j.circuitbreaker.enabled` is set to `false` or omitted entirely, the entire `CircuitBreakerRegistryFactory` bean factory is skipped due to the class-level `@Requires` constraint. Sources: [resilience4j-micronaut/src/main/java/io/github/resilience4j/micronaut/circuitbreaker/CircuitBreakerRegistryFactory.java#L45-L47](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-micronaut/src/main/java/io/github/resilience4j/micronaut/circuitbreaker/CircuitBreakerRegistryFactory.java#L45-L47)

## Retry Registry and Method Interception

### Retry Registry Configuration and Factory Beans

The `RetryRegistryFactory` class is a Micronaut factory responsible for instantiating and configuring retry-related beans. It is guarded by a class-level `@Requires` annotation checking that the property `resilience4j.retry.enabled` equals `true`, defaulting to `false`. Sources: [resilience4j-micronaut/src/main/java/io/github/resilience4j/micronaut/retry/RetryRegistryFactory.java#L43-L45](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-micronaut/src/main/java/io/github/resilience4j/micronaut/retry/RetryRegistryFactory.java#L43-L45)

| Bean Method | Annotations | Parameter Dependencies | Description | Sources |
| :--- | :--- | :--- | :--- | :--- |
| `compositeTimeLimiterCustomizer` | `@Bean`, `@RetryQualifier` | `@Nullable List<RetryConfigCustomizer>` | Creates a composite customizer wrapping all available retry configuration customizers. | [resilience4j-micronaut/src/main/java/io/github/resilience4j/micronaut/retry/RetryRegistryFactory.java#L47-L51](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-micronaut/src/main/java/io/github/resilience4j/micronaut/retry/RetryRegistryFactory.java#L47-L51) |
| `createRetryRegistry` | `@Singleton`, `@Requires(beans = CommonRetryConfigurationProperties.class)` | `CommonRetryConfigurationProperties`, `@RetryQualifier EventConsumerRegistry<RetryEvent>`, `@RetryQualifier RegistryEventConsumer<Retry>`, `@RetryQualifier CompositeCustomizer<RetryConfigCustomizer>` | Constructs, initializes, registers event consumers for, and returns the primary `RetryRegistry`. | [resilience4j-micronaut/src/main/java/io/github/resilience4j/micronaut/retry/RetryRegistryFactory.java#L53-L69](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-micronaut/src/main/java/io/github/resilience4j/micronaut/retry/RetryRegistryFactory.java#L53-L69) |
| `retryEventEventConsumerRegistry` | `@Bean`, `@RetryQualifier` | None | Instantiates a `DefaultEventConsumerRegistry<RetryEvent>` for tracking retry events. | [resilience4j-micronaut/src/main/java/io/github/resilience4j/micronaut/retry/RetryRegistryFactory.java#L72-L76](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-micronaut/src/main/java/io/github/resilience4j/micronaut/retry/RetryRegistryFactory.java#L72-L76) |
| `retryRegistryEventConsumer` | `@Bean`, `@Primary`, `@RetryQualifier` | `Optional<List<RegistryEventConsumer<Retry>>>` | Combines multiple registry event consumers into a composite consumer. | [resilience4j-micronaut/src/main/java/io/github/resilience4j/micronaut/retry/RetryRegistryFactory.java#L78-L87](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-micronaut/src/main/java/io/github/resilience4j/micronaut/retry/RetryRegistryFactory.java#L78-L87) |

### RetryProperties Binding Structure

The `RetryProperties` class extends `CommonRetryConfigurationProperties` and implements Micronaut's `Toggleable` interface, mapping configuration keys under the `resilience4j.retry` namespace. Sources: [resilience4j-micronaut/src/main/java/io/github/resilience4j/micronaut/retry/RetryProperties.java#L31-L32](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-micronaut/src/main/java/io/github/resilience4j/micronaut/retry/RetryProperties.java#L31-L32)

```java
@ConfigurationProperties("resilience4j.retry")
public class RetryProperties extends CommonRetryConfigurationProperties implements Toggleable {
    private boolean enabled;

    public RetryProperties(
        List<RetryProperties.InstancePropertiesConfigs> configs,
        List<RetryProperties.InstancePropertiesInstances> instances) {
        for (RetryProperties.InstancePropertiesConfigs config : configs) {
            this.getConfigs().put(config.getName(), config);
        }
        for (RetryProperties.InstancePropertiesInstances instance : instances) {
            this.getInstances().put(instance.getName(), instance);
        }
    }
    // ...
}
```
Sources: [resilience4j-micronaut/src/main/java/io/github/resilience4j/micronaut/retry/RetryProperties.java#L31-L44](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-micronaut/src/main/java/io/github/resilience4j/micronaut/retry/RetryProperties.java#L31-L44)

Inner classes `InstancePropertiesConfigs` and `InstancePropertiesInstances` use `@EachProperty` to bind individual named configuration sets and instances respectively, exposing a primary default configuration bean. Sources: [resilience4j-micronaut/src/main/java/io/github/resilience4j/micronaut/retry/RetryProperties.java#L55-L81](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-micronaut/src/main/java/io/github/resilience4j/micronaut/retry/RetryProperties.java#L55-L81)

### RetryInterceptor Invocation Flow

The `RetryInterceptor` intercepts method calls annotated with `@io.github.resilience4j.micronaut.annotation.Retry`, executing them according to the result type returned by the intercepted method. Sources: [resilience4j-micronaut/src/main/java/io/github/resilience4j/micronaut/retry/RetryInterceptor.java#L41-L43](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-micronaut/src/main/java/io/github/resilience4j/micronaut/retry/RetryInterceptor.java#L41-L43)

The execution walkthrough for `RetryInterceptor.intercept()` proceeds through these concrete verification and branching steps:

1. `context.hasAnnotation(...)` checks if the method is decorated with the Retry annotation; if absent, it immediately calls `context.proceed()`. Sources: [resilience4j-micronaut/src/main/java/io/github/resilience4j/micronaut/retry/RetryInterceptor.java#L85-L87](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-micronaut/src/main/java/io/github/resilience4j/micronaut/retry/RetryInterceptor.java#L85-L87)
2. Extracts the instance name from the annotation (defaulting to `"default"`), fetches the corresponding `RetryConfig` from `retryRegistry`, and obtains or creates the `Retry` instance via `retryRegistry.retry(name, config)`. Sources: [resilience4j-micronaut/src/main/java/io/github/resilience4j/micronaut/retry/RetryInterceptor.java#L89-L93](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-micronaut/src/main/java/io/github/resilience4j/micronaut/retry/RetryInterceptor.java#L89-L93)
3. Wraps the invocation context in an `InterceptedMethod` and inspects `interceptedMethod.resultType()` to branch into one of three execution modes:
   - **`PUBLISHER`**: Passes the publisher through `extension.retry(...)` and handles fallback using `extension.falbackPublisher(...)`. Sources: [resilience4j-micronaut/src/main/java/io/github/resilience4j/micronaut/retry/RetryInterceptor.java#L98-L103](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-micronaut/src/main/java/io/github/resilience4j/micronaut/retry/RetryInterceptor.java#L98-L103)
   - **`COMPLETION_STAGE`**: Executes the completion stage via `retry.executeCompletionStage(executorService, ...)` combined with `fallbackForFuture(...)`. Sources: [resilience4j-micronaut/src/main/java/io/github/resilience4j/micronaut/retry/RetryInterceptor.java#L104-L115](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-micronaut/src/main/java/io/github/resilience4j/micronaut/retry/RetryInterceptor.java#L104-L115)
   - **`SYNCHRONOUS`**: Executes the supplier synchronously using `retry.executeCheckedSupplier(context::proceed)`, catching any `Throwable` and delegating to `fallback(context, exception)`. Sources: [resilience4j-micronaut/src/main/java/io/github/resilience4j/micronaut/retry/RetryInterceptor.java#L116-L121](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-micronaut/src/main/java/io/github/resilience4j/micronaut/retry/RetryInterceptor.java#L116-L121)

Sources: [resilience4j-micronaut/src/main/java/io/github/resilience4j/micronaut/retry/RetryInterceptor.java#L84-L124](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-micronaut/src/main/java/io/github/resilience4j/micronaut/retry/RetryInterceptor.java#L84-L124)

> [!NOTE]
> `RetryInterceptor` returns `ResilienceInterceptPhase.RETRY.getPosition()` for its interceptor order, ensuring it executes at the designated phase within the Micronaut AOP interception chain. Sources: [resilience4j-micronaut/src/main/java/io/github/resilience4j/micronaut/retry/RetryInterceptor.java#L64-L67](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-micronaut/src/main/java/io/github/resilience4j/micronaut/retry/RetryInterceptor.java#L64-L67)

## Bulkhead and ThreadPool Registry Factories

### Overview

Micronaut container integration for Resilience4j Bulkheads is established through two dedicated factory classes: `BulkHeadRegistryFactory` and `ThreadPoolBulkheadFactory`. These factories manage the creation, configuration, and event consumer registration for standard semaphore-based bulkheads and thread pool bulkheads. Sources: [resilience4j-micronaut/src/main/java/io/github/resilience4j/micronaut/bulkhead/BulkHeadRegistryFactory.java#L45-L47](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-micronaut/src/main/java/io/github/resilience4j/micronaut/bulkhead/BulkHeadRegistryFactory.java#L45-L47), [resilience4j-micronaut/src/main/java/io/github/resilience4j/micronaut/bulkhead/ThreadPoolBulkheadFactory.java#L46-L48](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-micronaut/src/main/java/io/github/resilience4j/micronaut/bulkhead/ThreadPoolBulkheadFactory.java#L46-L48)

### Bulkhead Registry Factory Configuration

The `BulkHeadRegistryFactory` class is conditionally activated when the property `resilience4j.bulkhead.enabled` evaluates to true (defaulting to false). It exposes beans for bulkhead customizers, event registries, and the central `BulkheadRegistry`. Sources: [resilience4j-micronaut/src/main/java/io/github/resilience4j/micronaut/bulkhead/BulkHeadRegistryFactory.java#L45-L92](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-micronaut/src/main/java/io/github/resilience4j/micronaut/bulkhead/BulkHeadRegistryFactory.java#L45-L92)

The initialization walkthrough for creating the `BulkheadRegistry` bean follows this exact call sequence:

1. `bulkheadRegistry()` receives `CommonBulkheadConfigurationProperties`, event consumer registries, event consumers, and composite customizers as parameters, requiring the presence of `BulkheadProperties`. Sources: [resilience4j-micronaut/src/main/java/io/github/resilience4j/micronaut/bulkhead/BulkHeadRegistryFactory.java#L58-L64](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-micronaut/src/main/java/io/github/resilience4j/micronaut/bulkhead/BulkHeadRegistryFactory.java#L58-L64)
2. `createBulkheadRegistry()` maps configured config entries using `CommonBulkheadConfigurationProperties.createBulkheadConfig()` and instantiates the base registry via `BulkheadRegistry.of(configs, bulkheadRegistryEventConsumer, bulkheadConfigurationProperties.getTags())`. Sources: [resilience4j-micronaut/src/main/java/io/github/resilience4j/micronaut/bulkhead/BulkHeadRegistryFactory.java#L133-L142](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-micronaut/src/main/java/io/github/resilience4j/micronaut/bulkhead/BulkHeadRegistryFactory.java#L133-L142)
3. `registerEventConsumer()` hooks into the registry's `getEventPublisher()` to register entry addition (`onEntryAdded`), replacement (`onEntryReplaced`), and removal (`onEntryRemoved`) listeners. Sources: [resilience4j-micronaut/src/main/java/io/github/resilience4j/micronaut/bulkhead/BulkHeadRegistryFactory.java#L102-L109](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-micronaut/src/main/java/io/github/resilience4j/micronaut/bulkhead/BulkHeadRegistryFactory.java#L102-L109)
4. Iterates over `bulkheadConfigurationProperties.getInstances()` to eagerly instantiate and configure individual bulkhead instances within the registry. Sources: [resilience4j-micronaut/src/main/java/io/github/resilience4j/micronaut/bulkhead/BulkHeadRegistryFactory.java#L69-L74](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-micronaut/src/main/java/io/github/resilience4j/micronaut/bulkhead/BulkHeadRegistryFactory.java#L69-L74)

> [!NOTE]
> When looking up event consumer buffer sizes for individual bulkhead instances, `registerEventConsumer` falls back to a default buffer size of `100` if backend-specific properties are absent. Sources: [resilience4j-micronaut/src/main/java/io/github/resilience4j/micronaut/bulkhead/BulkHeadRegistryFactory.java#L115-L121](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-micronaut/src/main/java/io/github/resilience4j/micronaut/bulkhead/BulkHeadRegistryFactory.java#L115-L121)

### ThreadPoolBulkhead Factory Configuration

Similarly, `ThreadPoolBulkheadFactory` is guarded by the `resilience4j.thread-pool-bulkhead.enabled` property and wires thread pool bulkheads into the Micronaut dependency injection container. Sources: [resilience4j-micronaut/src/main/java/io/github/resilience4j/micronaut/bulkhead/ThreadPoolBulkheadFactory.java#L46-L48](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-micronaut/src/main/java/io/github/resilience4j/micronaut/bulkhead/ThreadPoolBulkheadFactory.java#L46-L48)

The thread pool bulkhead initialization sequence follows a parallel lifecycle:

1. `threadPoolBulkheadRegistry()` requires `CommonThreadPoolBulkheadConfigurationProperties` and orchestrates registry creation. Sources: [resilience4j-micronaut/src/main/java/io/github/resilience4j/micronaut/bulkhead/ThreadPoolBulkheadFactory.java#L56-L63](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-micronaut/src/main/java/io/github/resilience4j/micronaut/bulkhead/ThreadPoolBulkheadFactory.java#L56-L63)
2. `createBulkheadRegistry()` collects configurations and invokes `ThreadPoolBulkheadRegistry.of(configs, threadPoolBulkheadRegistryEventConsumer, threadPoolBulkheadConfigurationProperties.getTags())`. Sources: [resilience4j-micronaut/src/main/java/io/github/resilience4j/micronaut/bulkhead/ThreadPoolBulkheadFactory.java#L97-L110](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-micronaut/src/main/java/io/github/resilience4j/micronaut/bulkhead/ThreadPoolBulkheadFactory.java#L97-L110)
3. Event consumers are bound via `registerEventConsumer()`, constructing event consumer names by joining `ThreadPoolBulkhead.class.getSimpleName()` and `bulkHead.getName()` with a hyphen (`-`). Sources: [resilience4j-micronaut/src/main/java/io/github/resilience4j/micronaut/bulkhead/ThreadPoolBulkheadFactory.java#L119-L142](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-micronaut/src/main/java/io/github/resilience4j/micronaut/bulkhead/ThreadPoolBulkheadFactory.java#L119-L142)
4. Iterates over `bulkheadConfigurationProperties.getBackends()` to populate backend thread pool bulkhead instances. Sources: [resilience4j-micronaut/src/main/java/io/github/resilience4j/micronaut/bulkhead/ThreadPoolBulkheadFactory.java#L69-L71](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-micronaut/src/main/java/io/github/resilience4j/micronaut/bulkhead/ThreadPoolBulkheadFactory.java#L69-L71)

### Bulkhead Factory Components Reference

| Factory Class | Enabling Property | Primary Qualifier | Configuration Properties Bean | Registry Return Type | Sources |
| --- | --- | --- | --- | --- | --- |
| `BulkHeadRegistryFactory` | `resilience4j.bulkhead.enabled` | `@BulkheadQualifier` | `CommonBulkheadConfigurationProperties` (requires `BulkheadProperties`) | `BulkheadRegistry` | [resilience4j-micronaut/src/main/java/io/github/resilience4j/micronaut/bulkhead/BulkHeadRegistryFactory.java#L46-L75](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-micronaut/src/main/java/io/github/resilience4j/micronaut/bulkhead/BulkHeadRegistryFactory.java#L46-L75) |
| `ThreadPoolBulkheadFactory` | `resilience4j.thread-pool-bulkhead.enabled` | `@ThreadPoolBulkheadQualifier` | `CommonThreadPoolBulkheadConfigurationProperties` | `ThreadPoolBulkheadRegistry` | [resilience4j-micronaut/src/main/java/io/github/resilience4j/micronaut/bulkhead/ThreadPoolBulkheadFactory.java#L47-L73](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-micronaut/src/main/java/io/github/resilience4j/micronaut/bulkhead/ThreadPoolBulkheadFactory.java#L47-L73) |

Sources: [resilience4j-micronaut/src/main/java/io/github/resilience4j/micronaut/bulkhead/BulkHeadRegistryFactory.java#L45-L142](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-micronaut/src/main/java/io/github/resilience4j/micronaut/bulkhead/BulkHeadRegistryFactory.java#L45-L142), [resilience4j-micronaut/src/main/java/io/github/resilience4j/micronaut/bulkhead/ThreadPoolBulkheadFactory.java#L46-L142](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-micronaut/src/main/java/io/github/resilience4j/micronaut/bulkhead/ThreadPoolBulkheadFactory.java#L46-L142)

## Rate Limiter and Time Limiter Wiring

### Overview

Resilience4j provides Micronaut factory integration for both rate limiters and time limiters via `RateLimiterRegistryFactory` and `TimeLimiterRegistryFactory`. Each factory is conditional upon its respective feature enablement property (`resilience4j.ratelimiter.enabled` and `resilience4j.timelimiter.enabled`) set to `true`. Sources: [resilience4j-micronaut/src/main/java/io/github/resilience4j/micronaut/ratelimiter/RateLimiterRegistryFactory.java#L43-L44](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-micronaut/src/main/java/io/github/resilience4j/micronaut/ratelimiter/RateLimiterRegistryFactory.java#L43-L44), [resilience4j-micronaut/src/main/java/io/github/resilience4j/micronaut/timelimiter/TimeLimiterRegistryFactory.java#L45-L46](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-micronaut/src/main/java/io/github/resilience4j/micronaut/timelimiter/TimeLimiterRegistryFactory.java#L45-L46)

### Rate Limiter Registry Wiring

The `RateLimiterRegistryFactory` class orchestrates the creation of rate limiter components by binding configuration properties and event registries into the Micronaut container. Sources: [resilience4j-micronaut/src/main/java/io/github/resilience4j/micronaut/ratelimiter/RateLimiterRegistryFactory.java#L43-L69](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-micronaut/src/main/java/io/github/resilience4j/micronaut/ratelimiter/RateLimiterRegistryFactory.java#L43-L69)

The rate limiter instantiation sequence follows a specific execution flow:

1. `rateLimiterRegistry()` receives `RateLimiterProperties`, event consumer registries, event consumers, and customizers as parameters. Sources: [resilience4j-micronaut/src/main/java/io/github/resilience4j/micronaut/ratelimiter/RateLimiterRegistryFactory.java#L54-L58](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-micronaut/src/main/java/io/github/resilience4j/micronaut/ratelimiter/RateLimiterRegistryFactory.java#L54-L58)
2. `createRateLimiterRegistry()` streams over configured config entries, maps them using `createRateLimiterConfig()`, and calls `RateLimiterRegistry.of(configs, rateLimiterRegistryEventConsumer, rateLimiterConfigurationProperties.getTags())`. Sources: [resilience4j-micronaut/src/main/java/io/github/resilience4j/micronaut/ratelimiter/RateLimiterRegistryFactory.java#L131-L143](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-micronaut/src/main/java/io/github/resilience4j/micronaut/ratelimiter/RateLimiterRegistryFactory.java#L131-L143)
3. `registerEventConsumer()` attaches listeners to the registry event publisher for entry additions, replacements, and removals. Sources: [resilience4j-micronaut/src/main/java/io/github/resilience4j/micronaut/ratelimiter/RateLimiterRegistryFactory.java#L95-L102](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-micronaut/src/main/java/io/github/resilience4j/micronaut/ratelimiter/RateLimiterRegistryFactory.java#L95-L102)
4. Instance properties are iterated via `rateLimiterProperties.getInstances().forEach(...)` to register individual rate limiters with specific configurations into the registry. Sources: [resilience4j-micronaut/src/main/java/io/github/resilience4j/micronaut/ratelimiter/RateLimiterRegistryFactory.java#L62-L67](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-micronaut/src/main/java/io/github/resilience4j/micronaut/ratelimiter/RateLimiterRegistryFactory.java#L62-L67)

> [!NOTE]
> When `subscribeForEvents` is enabled on an instance property, the event consumer buffer size defaults to `100` if not explicitly specified or configured as zero. Sources: [resilience4j-micronaut/src/main/java/io/github/resilience4j/micronaut/ratelimiter/RateLimiterRegistryFactory.java#L113-L120](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-micronaut/src/main/java/io/github/resilience4j/micronaut/ratelimiter/RateLimiterRegistryFactory.java#L113-L120)

### Time Limiter Registry Wiring

The `TimeLimiterRegistryFactory` class creates time limiter registries conditioned on `CommonTimeLimiterConfigurationProperties` beans being present. Sources: [resilience4j-micronaut/src/main/java/io/github/resilience4j/micronaut/timelimiter/TimeLimiterRegistryFactory.java#L45-L69](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-micronaut/src/main/java/io/github/resilience4j/micronaut/timelimiter/TimeLimiterRegistryFactory.java#L45-L69)

The time limiter registry wiring process operates as follows:

1. `timeLimiterRegistry()` initializes the registry using `createTimeLimiterRegistry()`. Sources: [resilience4j-micronaut/src/main/java/io/github/resilience4j/micronaut/timelimiter/TimeLimiterRegistryFactory.java#L55-L64](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-micronaut/src/main/java/io/github/resilience4j/micronaut/timelimiter/TimeLimiterRegistryFactory.java#L55-L64)
2. Event consumers are registered by mapping registry publisher events (`onEntryAdded`, `onEntryReplaced`, `onEntryRemoved`) to consumer registrations or removals. Sources: [resilience4j-micronaut/src/main/java/io/github/resilience4j/micronaut/timelimiter/TimeLimiterRegistryFactory.java#L123-L134](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-micronaut/src/main/java/io/github/resilience4j/micronaut/timelimiter/TimeLimiterRegistryFactory.java#L123-L134)
3. `initTimeLimiterRegistry()` loops through configured time limiter instances and registers them into the `TimeLimiterRegistry`. Sources: [resilience4j-micronaut/src/main/java/io/github/resilience4j/micronaut/timelimiter/TimeLimiterRegistryFactory.java#L89-L95](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-micronaut/src/main/java/io/github/resilience4j/micronaut/timelimiter/TimeLimiterRegistryFactory.java#L89-L95)

### Properties Binding

The `RateLimiterProperties` class extends `CommonRateLimiterConfigurationProperties` and implements `Toggleable`, binding configuration values under the `resilience4j.ratelimiter` prefix. Sources: [resilience4j-micronaut/src/main/java/io/github/resilience4j/micronaut/ratelimiter/RateLimiterProperties.java#L31-L32](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-micronaut/src/main/java/io/github/resilience4j/micronaut/ratelimiter/RateLimiterProperties.java#L31-L32)

| Nested Property Class | Annotation Mapping | Parameter Support | Sources |
| --- | --- | --- | --- |
| `InstancePropertiesConfigs` | `@EachProperty(value = "configs", primary = "default")` | `@Parameter String name` | [resilience4j-micronaut/src/main/java/io/github/resilience4j/micronaut/ratelimiter/RateLimiterProperties.java#L55-L67](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-micronaut/src/main/java/io/github/resilience4j/micronaut/ratelimiter/RateLimiterProperties.java#L55-L67) |
| `InstancePropertiesInstances` | `@EachProperty(value = "instances", primary = "default")` | `@Parameter String name` | [resilience4j-micronaut/src/main/java/io/github/resilience4j/micronaut/ratelimiter/RateLimiterProperties.java#L69-L81](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-micronaut/src/main/java/io/github/resilience4j/micronaut/ratelimiter/RateLimiterProperties.java#L69-L81) |

Sources: [resilience4j-micronaut/src/main/java/io/github/resilience4j/micronaut/ratelimiter/RateLimiterRegistryFactory.java#L43-L143](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-micronaut/src/main/java/io/github/resilience4j/micronaut/ratelimiter/RateLimiterRegistryFactory.java#L43-L143), [resilience4j-micronaut/src/main/java/io/github/resilience4j/micronaut/timelimiter/TimeLimiterRegistryFactory.java#L45-L142](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-micronaut/src/main/java/io/github/resilience4j/micronaut/timelimiter/TimeLimiterRegistryFactory.java#L45-L142), [resilience4j-micronaut/src/main/java/io/github/resilience4j/micronaut/ratelimiter/RateLimiterProperties.java#L31-L81](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-micronaut/src/main/java/io/github/resilience4j/micronaut/ratelimiter/RateLimiterProperties.java#L31-L81)

## Circuit Breaker Invocation Interception Flow

### Overview

The `CircuitBreakerInterceptor` class manages method execution interception for beans annotated with `@CircuitBreaker`, coordinating permission checks, state modifications, and reactive/synchronous result handling. Sources: [resilience4j-micronaut/src/main/java/io/github/resilience4j/micronaut/circuitbreaker/CircuitBreakerInterceptor.java#L37-L39](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-micronaut/src/main/java/io/github/resilience4j/micronaut/circuitbreaker/CircuitBreakerInterceptor.java#L37-L39)

### Interception Execution Walkthrough

When an intercepted method is invoked, the request flows through specific conditional branches depending on the return type and annotation presence:

1. `intercept(MethodInvocationContext)` checks whether `io.github.resilience4j.micronaut.annotation.CircuitBreaker` is present on the method context; if absent, it bypasses interception via `context.proceed()`. Sources: [resilience4j-micronaut/src/main/java/io/github/resilience4j/micronaut/circuitbreaker/CircuitBreakerInterceptor.java#L73-L76](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-micronaut/src/main/java/io/github/resilience4j/micronaut/circuitbreaker/CircuitBreakerInterceptor.java#L73-L76)
2. The interceptor extracts the circuit breaker name (defaulting to `"default"`), fetches or resolves the matching `CircuitBreakerConfig` from the registry, and obtains the concrete `CircuitBreaker` instance. Sources: [resilience4j-micronaut/src/main/java/io/github/resilience4j/micronaut/circuitbreaker/CircuitBreakerInterceptor.java#L77-L82](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-micronaut/src/main/java/io/github/resilience4j/micronaut/circuitbreaker/CircuitBreakerInterceptor.java#L77-L82)
3. `InterceptedMethod.of(context, conversionService)` determines the method result container type, routing execution to one of three handling blocks: `PUBLISHER`, `COMPLETION_STAGE`, or `SYNCHRONOUS`. Sources: [resilience4j-micronaut/src/main/java/io/github/resilience4j/micronaut/circuitbreaker/CircuitBreakerInterceptor.java#L83-L85](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-micronaut/src/main/java/io/github/resilience4j/micronaut/circuitbreaker/CircuitBreakerInterceptor.java#L83-L85)
4. For synchronous calls, `circuitBreaker.executeCheckedSupplier(context::proceed)` checks permission to execute against the current breaker state and records success or failure. Sources: [resilience4j-micronaut/src/main/java/io/github/resilience4j/micronaut/circuitbreaker/CircuitBreakerInterceptor.java#L104-L106](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-micronaut/src/main/java/io/github/resilience4j/micronaut/circuitbreaker/CircuitBreakerInterceptor.java#L104-L106)
5. If a checked exception or failure occurs during synchronous execution, control catches the `Throwable` and delegates to `fallback(context, exception)`. Sources: [resilience4j-micronaut/src/main/java/io/github/resilience4j/micronaut/circuitbreaker/CircuitBreakerInterceptor.java#L107-L109](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-micronaut/src/main/java/io/github/resilience4j/micronaut/circuitbreaker/CircuitBreakerInterceptor.java#L107-L109)

> [!NOTE]
> `CircuitBreakerInterceptor` extends `BaseInterceptor` and runs at the position defined by `ResilienceInterceptPhase.CIRCUIT_BREAKER.getPosition()`, ensuring proper ordering relative to other resilience interceptors. Sources: [resilience4j-micronaut/src/main/java/io/github/resilience4j/micronaut/circuitbreaker/CircuitBreakerInterceptor.java#L39-L56](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-micronaut/src/main/java/io/github/resilience4j/micronaut/circuitbreaker/CircuitBreakerInterceptor.java#L39-L56)

### Result Type Routing

| Result Type Enum | Interception & Handling Strategy | Sources |
| --- | --- | --- |
| `PUBLISHER` | Delegates to `extension.fallbackPublisher(...)` wrapping `extension.circuitBreaker(...)`. | [resilience4j-micronaut/src/main/java/io/github/resilience4j/micronaut/circuitbreaker/CircuitBreakerInterceptor.java#L85-L91](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-micronaut/src/main/java/io/github/resilience4j/micronaut/circuitbreaker/CircuitBreakerInterceptor.java#L85-L91) |
| `COMPLETION_STAGE` | Executes via `circuitBreaker.executeCompletionStage(...)` paired with `fallbackForFuture(...)`. | [resilience4j-micronaut/src/main/java/io/github/resilience4j/micronaut/circuitbreaker/CircuitBreakerInterceptor.java#L92-L103](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-micronaut/src/main/java/io/github/resilience4j/micronaut/circuitbreaker/CircuitBreakerInterceptor.java#L92-L103) |
| `SYNCHRONOUS` | Executes via `circuitBreaker.executeCheckedSupplier(context::proceed)` with fallback error interception. | [resilience4j-micronaut/src/main/java/io/github/resilience4j/micronaut/circuitbreaker/CircuitBreakerInterceptor.java#L104-L109](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-micronaut/src/main/java/io/github/resilience4j/micronaut/circuitbreaker/CircuitBreakerInterceptor.java#L104-L109) |

Sources: [resilience4j-micronaut/src/main/java/io/github/resilience4j/micronaut/circuitbreaker/CircuitBreakerInterceptor.java#L37-L117](https://github.com/resilience4j/resilience4j/blob/main/resilience4j-micronaut/src/main/java/io/github/resilience4j/micronaut/circuitbreaker/CircuitBreakerInterceptor.java#L37-L117)

## Related

- [[Micronaut Interceptors]]

