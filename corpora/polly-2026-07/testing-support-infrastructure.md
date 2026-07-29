# Testing Support Infrastructure

<details>
<summary>Relevant source files</summary>

The following files were used as context for generating this wiki page:

- [README.md](https://github.com/App-vNext/Polly/blob/main/README.md)
- [src/Snippets/Docs/Testing.cs](https://github.com/App-vNext/Polly/blob/main/src/Snippets/Docs/Testing.cs)
- [docs/advanced/dependency-injection.md](https://github.com/App-vNext/Polly/blob/main/docs/advanced/dependency-injection.md)
- [src/Polly.Testing/ResiliencePipelineExtensions.cs](https://github.com/App-vNext/Polly/blob/main/src/Polly.Testing/ResiliencePipelineExtensions.cs)
- [src/Snippets/Docs/ResiliencePipelineRegistry.cs](https://github.com/App-vNext/Polly/blob/main/src/Snippets/Docs/ResiliencePipelineRegistry.cs)
- [docs/pipelines/index.md](https://github.com/App-vNext/Polly/blob/main/docs/pipelines/index.md)
- [src/Snippets/Docs/DependencyInjection.cs](https://github.com/App-vNext/Polly/blob/main/src/Snippets/Docs/DependencyInjection.cs)
- [docs/advanced/testing.md](https://github.com/App-vNext/Polly/blob/main/docs/advanced/testing.md)
- [AGENTS.md](https://github.com/App-vNext/Polly/blob/main/AGENTS.md)
- [src/Polly.Testing/README.md](https://github.com/App-vNext/Polly/blob/main/src/Polly.Testing/README.md)
- [docs/advanced/telemetry.md](https://github.com/App-vNext/Polly/blob/main/docs/advanced/telemetry.md)
- [docs/pipelines/resilience-pipeline-registry.md](https://github.com/App-vNext/Polly/blob/main/docs/pipelines/resilience-pipeline-registry.md)
- [src/Polly.Testing/ResiliencePipelineDescriptor.cs](https://github.com/App-vNext/Polly/blob/main/src/Polly.Testing/ResiliencePipelineDescriptor.cs)
- [src/Polly.Testing/ResilienceStrategyDescriptor.cs](https://github.com/App-vNext/Polly/blob/main/src/Polly.Testing/ResilienceStrategyDescriptor.cs)
- [docs/strategies/index.md](https://github.com/App-vNext/Polly/blob/main/docs/strategies/index.md)
- [src/Polly.Core/README.md](https://github.com/App-vNext/Polly/blob/main/src/Polly.Core/README.md)
- [docs/community/resources.md](https://github.com/App-vNext/Polly/blob/main/docs/community/resources.md)
- [docs/extensibility/reactive-strategy.md](https://github.com/App-vNext/Polly/blob/main/docs/extensibility/reactive-strategy.md)
</details>

## Overview

Testing Polly's resilience pipelines requires focusing on custom settings and delegates rather than internal execution mechanics, a process streamlined by the `Polly.Testing` package. This infrastructure provides dedicated APIs to inspect and validate pipeline composition, verify strategy options, and simplify unit testing through pipeline provider mocking and registry integration.
Sources: [docs/advanced/testing.md:1-7](https://github.com/App-vNext/Polly/blob/main/docs/advanced/testing.md#L1-L7)

## Testing Infrastructure Overview and Concepts

The `Polly.Testing` package provides specialized testing infrastructure and APIs designed to simplify the validation of resilience pipelines without testing internal execution mechanics. By introducing tools for strategy descriptor inspection, the package enables developers to verify pipeline composition, strategy ordering, and specific configuration options for both non-generic `ResiliencePipeline` and generic `ResiliencePipeline<T>` instances.
Sources: [docs/advanced/testing.md:3-6](https://github.com/App-vNext/Polly/blob/main/docs/advanced/testing.md#L3-L6)

To inspect a constructed resilience pipeline, developers retrieve a `ResiliencePipelineDescriptor` through extension methods and assert against its inner properties. The standard workflow proceeds through the following phases:
1. Construct the pipeline using `ResiliencePipelineBuilder` or `ResiliencePipelineBuilder<T>` with configured strategies such as retry or timeout.
2. Call `pipeline.GetPipelineDescriptor()` to extract the pipeline descriptor composition.
3. Access `descriptor.Strategies` to check total strategy counts and inspect individual strategy configurations.
4. Cast `descriptor.Strategies[index].Options` to expected types like `RetryStrategyOptions` or `TimeoutStrategyOptions` to verify property values like `MaxRetryAttempts` or `Timeout`.
Sources: [docs/advanced/testing.md:15-63](https://github.com/App-vNext/Polly/blob/main/docs/advanced/testing.md#L15-L63)

> [!NOTE]
> The `GetPipelineDescriptor` extension method is fully supported on both non-generic `ResiliencePipeline` and generic `ResiliencePipeline<T>` instances constructed via their respective builders.
Sources: [docs/advanced/testing.md:44-45](https://github.com/App-vNext/Polly/blob/main/docs/advanced/testing.md#L44-L45)

The `Polly.Testing` package exposes APIs and utilities that can be used to assert on the composition of resilience pipelines.
Sources: [src/Polly.Testing/README.md:1-3](https://github.com/App-vNext/Polly/blob/main/src/Polly.Testing/README.md#L1-L3)

## Pipeline Descriptors and Strategy Metaprogramming

The `Polly.Testing` namespace exposes core data structures designed for pipeline composition inspection and strategy metaprogramming. At the center of this inspection layer are `ResiliencePipelineDescriptor` and `ResilienceStrategyDescriptor`. These classes encapsulate the structural hierarchy of a constructed pipeline, allowing developers to programmatically examine individual strategy instances and their associated configuration options without executing the pipeline itself.
Sources: [src/Polly.Testing/ResiliencePipelineDescriptor.cs:3-28](https://github.com/App-vNext/Polly/blob/main/src/Polly.Testing/ResiliencePipelineDescriptor.cs#L3-L28)

`ResiliencePipelineDescriptor` is a sealed class that holds an internal constructor receiving an `IReadOnlyList<ResilienceStrategyDescriptor>` alongside a boolean `isReloadable` flag. It exposes two primary properties: `Strategies`, which returns the collection of strategy descriptors comprising the pipeline, and `FirstStrategy`, which provides a direct shorthand accessor returning `Strategies[0]`. Additionally, `IsReloadable` indicates whether the pipeline supports dynamic reloading behavior.
Sources: [src/Polly.Testing/ResiliencePipelineDescriptor.cs:6-28](https://github.com/App-vNext/Polly/blob/main/src/Polly.Testing/ResiliencePipelineDescriptor.cs#L6-L28)

Each entry within the pipeline's strategy collection is wrapped in a `ResilienceStrategyDescriptor`. This sealed type stores two immutable properties initialized via its internal constructor: `Options`, representing the `ResilienceStrategyOptions` configured for the strategy (if any), and `StrategyInstance`, which exposes the underlying runtime strategy object as an `object`.
Sources: [src/Polly.Testing/ResilienceStrategyDescriptor.cs:6-23](https://github.com/App-vNext/Polly/blob/main/src/Polly.Testing/ResilienceStrategyDescriptor.cs#L6-L23)

| Property Name | Return Type | Description | Sources |
| --- | --- | --- | --- |
| `Strategies` | `IReadOnlyList<ResilienceStrategyDescriptor>` | Gets the strategies the pipeline is composed of. | [src/Polly.Testing/ResiliencePipelineDescriptor.cs:14-18](https://github.com/App-vNext/Polly/blob/main/src/Polly.Testing/ResiliencePipelineDescriptor.cs#L14-L18) |
| `FirstStrategy` | `ResilienceStrategyDescriptor` | Gets the first strategy of the pipeline (`Strategies[0]`). | [src/Polly.Testing/ResiliencePipelineDescriptor.cs:19-23](https://github.com/App-vNext/Polly/blob/main/src/Polly.Testing/ResiliencePipelineDescriptor.cs#L19-L23) |
| `IsReloadable` | `bool` | Gets a value indicating whether the resilience pipeline is reloadable. | [src/Polly.Testing/ResiliencePipelineDescriptor.cs:24-28](https://github.com/App-vNext/Polly/blob/main/src/Polly.Testing/ResiliencePipelineDescriptor.cs#L24-L28) |
| `Options` | `ResilienceStrategyOptions?` | Gets the options used by the resilience strategy, if any. | [src/Polly.Testing/ResilienceStrategyDescriptor.cs:14-18](https://github.com/App-vNext/Polly/blob/main/src/Polly.Testing/ResilienceStrategyDescriptor.cs#L14-L18) |
| `StrategyInstance` | `object` | Gets the strategy instance. | [src/Polly.Testing/ResilienceStrategyDescriptor.cs:19-23](https://github.com/App-vNext/Polly/blob/main/src/Polly.Testing/ResilienceStrategyDescriptor.cs#L19-L23) |

> [!NOTE]
> `ResiliencePipelineDescriptor` and `ResilienceStrategyDescriptor` instances can only be instantiated internally by the Polly testing infrastructure. Developers consume these descriptors through the extension methods provided on `ResiliencePipeline` and `ResiliencePipeline<T>`.
Sources: [src/Polly.Testing/ResiliencePipelineDescriptor.cs:8-12](https://github.com/App-vNext/Polly/blob/main/src/Polly.Testing/ResiliencePipelineDescriptor.cs#L8-L12)

## Pipeline Descriptor Extension Methods

The `ResiliencePipelineExtensions` class in the `Polly.Testing` namespace provides the entry point extension methods for retrieving pipeline descriptors from `ResiliencePipeline` and `ResiliencePipeline<TResult>` instances. These extensions inspect the internal component hierarchy of a built pipeline, expanding composite structures and wrapping underlying strategy components into a read-only collection of descriptors.
Sources: [src/Polly.Testing/ResiliencePipelineExtensions.cs:6-36](https://github.com/App-vNext/Polly/blob/main/src/Polly.Testing/ResiliencePipelineExtensions.cs#L6-L36)

The extraction process begins when `GetPipelineDescriptor()` or `GetPipelineDescriptor<TResult>()` is invoked on a pipeline. Both methods validate that the pipeline instance is non-null using `Guard.NotNull(pipeline)`, then pass the root `pipeline.Component` to the private helper `GetPipelineDescriptorCore<T>()`.
Sources: [src/Polly.Testing/ResiliencePipelineExtensions.cs:18-36](https://github.com/App-vNext/Polly/blob/main/src/Polly.Testing/ResiliencePipelineExtensions.cs#L18-L36)

Inside `GetPipelineDescriptorCore<T>()`, an empty `ListipelineComponent>` is created and passed to the recursive extension method `ExpandComponents()`. The expansion logic inspects the runtime type of each `PipelineComponent` node to unwrap wrappers and collect the terminal strategy components:
1. `CompositeComponent`: Iterates through all inner components in `pipeline.Components`, recursively calling `inner.ExpandComponents(components)`.
Sources: [src/Polly.Testing/ResiliencePipelineExtensions.cs:64-72](https://github.com/App-vNext/Polly/blob/main/src/Polly.Testing/ResiliencePipelineExtensions.cs#L64-L72)
2. `ReloadableComponent`: Adds the reloadable wrapper itself to the list, then recursively expands `reloadable.Component`.
Sources: [src/Polly.Testing/ResiliencePipelineExtensions.cs:73-77](https://github.com/App-vNext/Polly/blob/main/src/Polly.Testing/ResiliencePipelineExtensions.cs#L73-L77)
3. `ExecutionTrackingComponent`, `ComponentWithDisposeCallbacks`, and `ExternalComponent`: Bypasses the wrapper node without adding it to the list, recursively expanding their inner `Component`.
Sources: [src/Polly.Testing/ResiliencePipelineExtensions.cs:78-89](https://github.com/App-vNext/Polly/blob/main/src/Polly.Testing/ResiliencePipelineExtensions.cs#L78-L89)
4. Default/Terminal case: Adds the concrete component to the `components` list.
Sources: [src/Polly.Testing/ResiliencePipelineExtensions.cs:90-93](https://github.com/App-vNext/Polly/blob/main/src/Polly.Testing/ResiliencePipelineExtensions.cs#L90-L93)

Once all components are flattened, `GetPipelineDescriptorCore<T>()` filters the list for `BridgeComponentBase` instances, projecting each into a `ResilienceStrategyDescriptor` via `GetStrategyInstance<T>(s)`. Finally, it instantiates and returns a `ResiliencePipelineDescriptor`, setting `isReloadable` by checking if any component in the list is a `ReloadableComponent`.
Sources: [src/Polly.Testing/ResiliencePipelineExtensions.cs:43-52](https://github.com/App-vNext/Polly/blob/main/src/Polly.Testing/ResiliencePipelineExtensions.cs#L43-L52)

> [!NOTE]
> The strategy instance extraction helper `GetStrategyInstance<T>()` handles reactive and non-reactive bridges separately. If the component is a `BridgeComponent<T>`, it returns `reactiveBridge.Strategy`; otherwise, it casts the component to a non-generic `BridgeComponent` and returns its `.Strategy`.
Sources: [src/Polly.Testing/ResiliencePipelineExtensions.cs:54-62](https://github.com/App-vNext/Polly/blob/main/src/Polly.Testing/ResiliencePipelineExtensions.cs#L54-L62)

| Component Type | Expansion Behavior | Added to Component List? | Sources |
| --- | --- | --- | --- |
| `CompositeComponent` | Iterates over `pipeline.Components` and recurses into each inner component. | No (inner components are processed) | [src/Polly.Testing/ResiliencePipelineExtensions.cs:66-72](https://github.com/App-vNext/Polly/blob/main/src/Polly.Testing/ResiliencePipelineExtensions.cs#L66-L72) |
| `ReloadableComponent` | Adds itself to the list, then recurses into `reloadable.Component`. | Yes | [src/Polly.Testing/ResiliencePipelineExtensions.cs:73-77](https://github.com/App-vNext/Polly/blob/main/src/Polly.Testing/ResiliencePipelineExtensions.cs#L73-L77) |
| `ExecutionTrackingComponent` | Recurses directly into `tracking.Component`. | No | [src/Polly.Testing/ResiliencePipelineExtensions.cs:78-81](https://github.com/App-vNext/Polly/blob/main/src/Polly.Testing/ResiliencePipelineExtensions.cs#L78-L81) |
| `ComponentWithDisposeCallbacks` | Recurses directly into `callbacks.Component`. | No | [src/Polly.Testing/ResiliencePipelineExtensions.cs:82-85](https://github.com/App-vNext/Polly/blob/main/src/Polly.Testing/ResiliencePipelineExtensions.cs#L82-L85) |
| `ExternalComponent` | Recurses directly into `nonDisposable.Component`. | No | [src/Polly.Testing/ResiliencePipelineExtensions.cs:86-89](https://github.com/App-vNext/Polly/blob/main/src/Polly.Testing/ResiliencePipelineExtensions.cs#L86-L89) |
| Terminal / Other | Falls through to the default branch, adding the component to the collection. | Yes | [src/Polly.Testing/ResiliencePipelineExtensions.cs:90-93](https://github.com/App-vNext/Polly/blob/main/src/Polly.Testing/ResiliencePipelineExtensions.cs#L90-L93) |

Sources: [src/Polly.Testing/ResiliencePipelineExtensions.cs:64-94](https://github.com/App-vNext/Polly/blob/main/src/Polly.Testing/ResiliencePipelineExtensions.cs#L64-L94)

| Method Signature | Return Type | Description | Sources |
| --- | --- | --- | --- |
| `GetPipelineDescriptor<TResult>(this ResiliencePipeline<TResult> pipeline)` | `ResiliencePipelineDescriptor` | Gets the pipeline descriptor for a generic resilience pipeline. | [src/Polly.Testing/ResiliencePipelineExtensions.cs:18-23](https://github.com/App-vNext/Polly/blob/main/src/Polly.Testing/ResiliencePipelineExtensions.cs#L18-L23) |
| `GetPipelineDescriptor(this ResiliencePipeline pipeline)` | `ResiliencePipelineDescriptor` | Gets the pipeline descriptor for a non-generic resilience pipeline. | [src/Polly.Testing/ResiliencePipelineExtensions.cs:31-36](https://github.com/App-vNext/Polly/blob/main/src/Polly.Testing/ResiliencePipelineExtensions.cs#L31-L36) |

Sources: [src/Polly.Testing/ResiliencePipelineExtensions.cs:18-36](https://github.com/App-vNext/Polly/blob/main/src/Polly.Testing/ResiliencePipelineExtensions.cs#L18-L36)

The following example demonstrates building a resilience pipeline containing retry and timeout strategies, then calling `GetPipelineDescriptor()` to inspect its composition and verify strategy options:

```csharp
ResiliencePipeline pipeline = new ResiliencePipelineBuilder()
    .AddRetry(new RetryStrategyOptions
    {
        MaxRetryAttempts = 4
    })
    .AddTimeout(TimeSpan.FromSeconds(1))
    .Build();

ResiliencePipelineDescriptor descriptor = pipeline.GetPipelineDescriptor();

Assert.Equal(2, descriptor.Strategies.Count);

var retryOptions = Assert.IsType<RetryStrategyOptions>(descriptor.Strategies[0].Options);
Assert.Equal(4, retryOptions.MaxRetryAttempts);

var timeoutOptions = Assert.IsType<TimeoutStrategyOptions>(descriptor.Strategies[1].Options);
Assert.Equal(TimeSpan.FromSeconds(1), timeoutOptions.Timeout);
```
Sources: [src/Snippets/Docs/Testing.cs:18-41](https://github.com/App-vNext/Polly/blob/main/src/Snippets/Docs/Testing.cs#L18-L41)

## Unit Testing and Mocking Strategies

Unit testing components that consume resilience pipelines requires mocking the `ResiliencePipelineProvider<TKey>` interface. Using mocking libraries such as NSubstitute, tests can isolate target classes by returning predefined or empty resilience pipelines for specific keys.
Sources: [src/Snippets/Docs/Testing.cs:65-83](https://github.com/App-vNext/Polly/blob/main/src/Snippets/Docs/Testing.cs#L65-L83)

The following example configures a mock pipeline provider to return `ResiliencePipeline.Empty` when queried for `"my-pipeline"`, which is then injected into an arbitrary API class for testing:

```csharp
ResiliencePipelineProvider<string> pipelineProvider = Substitute.For<ResiliencePipelineProvider<string>>();

// Mock the pipeline provider to return an empty pipeline for testing
pipelineProvider
    .GetPipeline("my-pipeline")
    .Returns(ResiliencePipeline.Empty);

// Use the mocked pipeline provider in your code
var api = new MyApi(pipelineProvider);

// You can now test the api
```
Sources: [src/Snippets/Docs/Testing.cs:67-82](https://github.com/App-vNext/Polly/blob/main/src/Snippets/Docs/Testing.cs#L67-L82)

When testing components built for dependency injection, services can be registered alongside resilience policies using extension methods. The `MyApi` class resolves its pipeline through `ResiliencePipelineProvider<string>` and executes asynchronous operations via the pipeline.
Sources: [src/Snippets/Docs/Testing.cs:85-109](https://github.com/App-vNext/Polly/blob/main/src/Snippets/Docs/Testing.cs#L85-L109)

```csharp
// Represents an arbitrary API that needs resilience support
public class MyApi
{
    private readonly ResiliencePipeline _pipeline;

    // The value of pipelineProvider is injected via dependency injection
    public MyApi(ResiliencePipelineProvider<string> pipelineProvider)
    {
        _pipeline = pipelineProvider.GetPipeline("my-pipeline");
    }

    public async Task ExecuteAsync(CancellationToken cancellationToken)
    {
        await _pipeline.ExecuteAsync(
            static async token =>
            {
                // Add your code here
            },
            cancellationToken);
    }
}

// Extensions to incorporate MyApi into dependency injection
public static class MyApiExtensions
{
    public static IServiceCollection AddMyApi(this IServiceCollection services)
    {
        return services
            .AddResiliencePipeline("my-pipeline", builder =>
            {
                builder.AddRetry(new RetryStrategyOptions
                {
                    MaxRetryAttempts = 4
                });
            })
            .AddSingleton<MyApi>();
    }
}
```
Sources: [src/Snippets/Docs/Testing.cs:87-127](https://github.com/App-vNext/Polly/blob/main/src/Snippets/Docs/Testing.cs#L87-L127)

> [!TIP]
> When testing classes dependent on resilience pipelines, registering pipelines via `AddResiliencePipeline` in a service collection allows direct validation of the underlying retry and timeout behaviors without manual mock setups.
Sources: [src/Snippets/Docs/Testing.cs:110-126](https://github.com/App-vNext/Polly/blob/main/src/Snippets/Docs/Testing.cs#L110-L126)

## Dependency Injection and Registry Inspection

When building applications that integrate Polly with Microsoft.Extensions.DependencyInjection, resilience pipelines are managed through the pipeline registry and exposed via DI container services. Inspecting and validating these configured pipelines within unit tests or container setups relies on resolving the `ResiliencePipelineProvider<TKey>` or `ResiliencePipelineRegistry<TKey>` from the built `ServiceProvider`.
Sources: [docs/advanced/dependency-injection.md:42-46](https://github.com/App-vNext/Polly/blob/main/docs/advanced/dependency-injection.md#L42-L46)

The registration of resilience pipelines via `AddResiliencePipeline` automatically populates the DI container with core management types. These services allow test suites to inspect registry options, retrieve registered pipelines by string or complex keys, and verify that transient lifetime behaviors correctly instantiate pipelines across distinct scopes or keys.
Sources: [docs/advanced/dependency-injection.md:53-59](https://github.com/App-vNext/Polly/blob/main/docs/advanced/dependency-injection.md#L53-L59)

| DI Service Type | Description | Sources |
| ---------------- | ----------- | ------- |
| `ResiliencePipelineRegistry<string>` | Allows adding and retrieving resilience pipelines directly within the container. | [docs/advanced/dependency-injection.md:56](https://github.com/App-vNext/Polly/blob/main/docs/advanced/dependency-injection.md#L56) |
| `ResiliencePipelineProvider<string>` | Read-only abstraction allowing components to retrieve resilience pipelines. | [docs/advanced/dependency-injection.md:57](https://github.com/App-vNext/Polly/blob/main/docs/advanced/dependency-injection.md#L57) |
| `IOptions<ResiliencePipelineRegistryOptions<string>>` | Configuration options controlling registry comparer and formatting behavior. | [docs/advanced/dependency-injection.md:58](https://github.com/App-vNext/Polly/blob/main/docs/advanced/dependency-injection.md#L58) |

Sources: [docs/advanced/dependency-injection.md:56-59](https://github.com/App-vNext/Polly/blob/main/docs/advanced/dependency-injection.md#L56-L59)

When utilizing complex registry keys or custom comparers, registry validation ensures that builder lookup and instance formatting behave as intended. By configuring `ResiliencePipelineRegistryOptions<TKey>`, developers control how keys map to builder names, instance names, and caching equality.
Sources: [docs/advanced/dependency-injection.md:300-312](https://github.com/App-vNext/Polly/blob/main/docs/advanced/dependency-injection.md#L300-L312)

```csharp
public record struct MyPipelineKey(string PipelineName, string InstanceName)
{
}

public sealed class PipelineNameComparer : IEqualityComparer<MyPipelineKey>
{
    public bool Equals(MyPipelineKey x, MyPipelineKey y) => x.PipelineName == y.PipelineName;

    public int GetHashCode(MyPipelineKey obj) => obj.PipelineName.GetHashCode(StringComparison.Ordinal);
}
```
Sources: [docs/advanced/dependency-injection.md:261-296](https://github.com/App-vNext/Polly/blob/main/docs/advanced/dependency-injection.md#L261-L296)

> [!NOTE]
> The resilience pipelines are registered in the DI container as transient services. This enables the resolution of multiple instances of `ResiliencePipeline` when complex pipeline keys are used, with lifetime management handled by the `ResiliencePipelineProvider`.
Sources: [docs/advanced/dependency-injection.md:150-152](https://github.com/App-vNext/Polly/blob/main/docs/advanced/dependency-injection.md#L150-L152)

The constructor of `ResiliencePipelineRegistry<TKey>` accepts `ResiliencePipelineRegistryOptions<TKey>` to customize runtime pipeline lookup and telemetry formatting:

| Property | Default Value | Description | Sources |
| -------- | ------------- | ----------- | ------- |
| `BuilderFactory` | Function returning a new `ResiliencePipelineBuilder` each time. | Allows consumers to customize builder creation. | [docs/pipelines/resilience-pipeline-registry.md:91-92](https://github.com/App-vNext/Polly/blob/main/docs/pipelines/resilience-pipeline-registry.md#L91-L92) |
| `PipelineComparer` | `EqualityComparer<TKey>.Default` | Comparer the registry uses to fetch resilience pipelines. | [docs/pipelines/resilience-pipeline-registry.md:93](https://github.com/App-vNext/Polly/blob/main/docs/pipelines/resilience-pipeline-registry.md#L93) |
| `BuilderComparer` | `EqualityComparer<TKey>.Default` | Comparer the registry uses to fetch registered pipeline builders. | [docs/pipelines/resilience-pipeline-registry.md:94](https://github.com/App-vNext/Polly/blob/main/docs/pipelines/resilience-pipeline-registry.md#L94) |
| `InstanceNameFormatter` | `null` | Delegate formatting `TKey` to instance name. | [docs/pipelines/resilience-pipeline-registry.md:95](https://github.com/App-vNext/Polly/blob/main/docs/pipelines/resilience-pipeline-registry.md#L95) |
| `BuilderNameFormatter` | Function returning the `key.ToString()` value. | Delegate formatting `TKey` to builder name. | [docs/pipelines/resilience-pipeline-registry.md:96](https://github.com/App-vNext/Polly/blob/main/docs/pipelines/resilience-pipeline-registry.md#L96) |

Sources: [docs/pipelines/resilience-pipeline-registry.md:90-97](https://github.com/App-vNext/Polly/blob/main/docs/pipelines/resilience-pipeline-registry.md#L90-L97)

## Related

- [[Resilience Pipelines]]

