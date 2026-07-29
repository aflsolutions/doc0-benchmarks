# Dependency Injection Integration

<details>
<summary>Relevant source files</summary>

The following files were used as context for generating this wiki page:

- [src/Snippets/Docs/DependencyInjection.cs](https://github.com/App-vNext/Polly/blob/main/src/Snippets/Docs/DependencyInjection.cs)
- [src/Polly.Extensions/DependencyInjection/PollyServiceCollectionExtensions.cs](https://github.com/App-vNext/Polly/blob/main/src/Polly.Extensions/DependencyInjection/PollyServiceCollectionExtensions.cs)
- [docs/advanced/dependency-injection.md](https://github.com/App-vNext/Polly/blob/main/docs/advanced/dependency-injection.md)
- [src/Snippets/Docs/ResiliencePipelines.cs](https://github.com/App-vNext/Polly/blob/main/src/Snippets/Docs/ResiliencePipelines.cs)
- [README.md](https://github.com/App-vNext/Polly/blob/main/README.md)
- [src/Polly.Extensions/DependencyInjection/AddResiliencePipelineContext.cs](https://github.com/App-vNext/Polly/blob/main/src/Polly.Extensions/DependencyInjection/AddResiliencePipelineContext.cs)
- [src/Polly.Extensions/DependencyInjection/AddResiliencePipelinesContext.cs](https://github.com/App-vNext/Polly/blob/main/src/Polly.Extensions/DependencyInjection/AddResiliencePipelinesContext.cs)
- [src/Snippets/Docs/Readme.cs](https://github.com/App-vNext/Polly/blob/main/src/Snippets/Docs/Readme.cs)
- [src/Polly.Extensions/README.md](https://github.com/App-vNext/Polly/blob/main/src/Polly.Extensions/README.md)
- [docs/pipelines/index.md](https://github.com/App-vNext/Polly/blob/main/docs/pipelines/index.md)
- [docs/getting-started.md](https://github.com/App-vNext/Polly/blob/main/docs/getting-started.md)
- [src/Polly.Extensions/DependencyInjection/ConfigureResiliencePipelineRegistryOptions.cs](https://github.com/App-vNext/Polly/blob/main/src/Polly.Extensions/DependencyInjection/ConfigureResiliencePipelineRegistryOptions.cs)
- [AGENTS.md](https://github.com/App-vNext/Polly/blob/main/AGENTS.md)
- [src/Polly.Extensions/Registry/ConfigureBuilderContextExtensions.cs](https://github.com/App-vNext/Polly/blob/main/src/Polly.Extensions/Registry/ConfigureBuilderContextExtensions.cs)
</details>

## Overview

The dependency injection integration in Polly, provided via the `Polly.Extensions` package, offers a streamlined way to combine resilience pipelines with the standard .NET `IServiceCollection` container. By acting as a thin layer atop the resilience pipeline registry, it enables applications to register, configure, and resolve resilience pipelines seamlessly while automatically integrating telemetry for all registered pipelines. Sources: [docs/advanced/dependency-injection.md:3-8](https://github.com/App-vNext/Polly/blob/main/docs/advanced/dependency-injection.md#L3-L8), [README.md:29](https://github.com/App-vNext/Polly/blob/main/README.md#L29)

This integration solves common complexity in distributed applications by cleanly separating pipeline definitions from their runtime consumption, supporting deferred additions, and managing dynamic reloads and resource disposal without manual boilerplate. Key design decisions include registering pipelines as transient services to support complex keys and providing contextual builders that give direct access to the `IServiceProvider`. Sources: [docs/advanced/dependency-injection.md:32-41](https://github.com/App-vNext/Polly/blob/main/docs/advanced/dependency-injection.md#L32-L41), [docs/advanced/dependency-injection.md:150-158](https://github.com/App-vNext/Polly/blob/main/docs/advanced/dependency-injection.md#L150-L158), [docs/advanced/dependency-injection.md:189-194](https://github.com/App-vNext/Polly/blob/main/docs/advanced/dependency-injection.md#L189-L194)

## Service Collection Extension API Surface

### Overview

The `PollyServiceCollectionExtensions` class in `src/Polly.Extensions/DependencyInjection/PollyServiceCollectionExtensions.cs` defines the primary extension methods for integrating resilience pipelines and registry services into an `IServiceCollection`. These methods establish core extension points for registering non-generic and generic resilience pipelines, deferring pipeline additions, and configuring the underlying registry. Sources: [src/Polly.Extensions/DependencyInjection/PollyServiceCollectionExtensions.cs:13-16](https://github.com/App-vNext/Polly/blob/main/src/Polly.Extensions/DependencyInjection/PollyServiceCollectionExtensions.cs#L13-L16)

### Registration Methods

The extension methods fall into categories based on pipeline typing and deferred configuration behavior. Each overload ensures null guard checks via `Guard.NotNull` before modifying the service collection. Sources: [src/Polly.Extensions/DependencyInjection/PollyServiceCollectionExtensions.cs:40-41](https://github.com/App-vNext/Polly/blob/main/src/Polly.Extensions/DependencyInjection/PollyServiceCollectionExtensions.cs#L40-L41)

| Method Signature | Key Constraints | Purpose / Behavior |
| :--- | :--- | :--- |
| `AddResiliencePipeline<TKey, TResult>(services, key, configure)` | `TKey : notnull` | Registers a typed resilience pipeline handling `TResult`, adding keyed transient services and registry actions. Sources: [src/Polly.Extensions/DependencyInjection/PollyServiceCollectionExtensions.cs:62-67](https://github.com/App-vNext/Polly/blob/main/src/Polly.Extensions/DependencyInjection/PollyServiceCollectionExtensions.cs#L62-L67), [src/Polly.Extensions/DependencyInjection/PollyServiceCollectionExtensions.cs:71-84](https://github.com/App-vNext/Polly/blob/main/src/Polly.Extensions/DependencyInjection/PollyServiceCollectionExtensions.cs#L71-L84) |
| `AddResiliencePipeline<TKey>(services, key, configure)` | `TKey : notnull` | Registers a non-generic resilience pipeline associated with the specified key. Sources: [src/Polly.Extensions/DependencyInjection/PollyServiceCollectionExtensions.cs:128-133](https://github.com/App-vNext/Polly/blob/main/src/Polly.Extensions/DependencyInjection/PollyServiceCollectionExtensions.cs#L128-L133), [src/Polly.Extensions/DependencyInjection/PollyServiceCollectionExtensions.cs:137-150](https://github.com/App-vNext/Polly/blob/main/src/Polly.Extensions/DependencyInjection/PollyServiceCollectionExtensions.cs#L137-L150) |
| `AddResiliencePipelines<TKey>(services, configure)` | `TKey : notnull` | Allows deferred addition of one or more resilience pipelines using `ConfigureResiliencePipelineRegistryOptions<TKey>`. Sources: [src/Polly.Extensions/DependencyInjection/PollyServiceCollectionExtensions.cs:170-174](https://github.com/App-vNext/Polly/blob/main/src/Polly.Extensions/DependencyInjection/PollyServiceCollectionExtensions.cs#L170-L174), [src/Polly.Extensions/DependencyInjection/PollyServiceCollectionExtensions.cs:178-186](https://github.com/App-vNext/Polly/blob/main/src/Polly.Extensions/DependencyInjection/PollyServiceCollectionExtensions.cs#L178-L186) |
| `AddResiliencePipelineRegistry<TKey>(services, configure)` | `TKey : notnull` | Adds the registry and provider singletons while applying explicit options configuration. Sources: [src/Polly.Extensions/DependencyInjection/PollyServiceCollectionExtensions.cs:200-204](https://github.com/App-vNext/Polly/blob/main/src/Polly.Extensions/DependencyInjection/PollyServiceCollectionExtensions.cs#L200-L204), [src/Polly.Extensions/DependencyInjection/PollyServiceCollectionExtensions.cs:208-212](https://github.com/App-vNext/Polly/blob/main/src/Polly.Extensions/DependencyInjection/PollyServiceCollectionExtensions.cs#L208-L212) |
| `AddResiliencePipelineRegistry<TKey>(services)` | `TKey : notnull` | Adds `ResiliencePipelineRegistry<TKey>` and `ResiliencePipelineProvider<TKey>` if not already marked. Sources: [src/Polly.Extensions/DependencyInjection/PollyServiceCollectionExtensions.cs:225-227](https://github.com/App-vNext/Polly/blob/main/src/Polly.Extensions/DependencyInjection/PollyServiceCollectionExtensions.cs#L225-L227), [src/Polly.Extensions/DependencyInjection/PollyServiceCollectionExtensions.cs:232-235](https://github.com/App-vNext/Polly/blob/main/src/Polly.Extensions/DependencyInjection/PollyServiceCollectionExtensions.cs#L232-L235) |

Sources: [src/Polly.Extensions/DependencyInjection/PollyServiceCollectionExtensions.cs:62-265](https://github.com/App-vNext/Polly/blob/main/src/Polly.Extensions/DependencyInjection/PollyServiceCollectionExtensions.cs#L62-L265)

### Execution Walkthrough

When `AddResiliencePipeline` is invoked for a specific key, the registration executes a precise multi-step initialization sequence across extension methods:

1. `AddResiliencePipeline<TKey, TResult>()` validates inputs using `Guard.NotNull(services)` and `Guard.NotNull(configure)`. Sources: [src/Polly.Extensions/DependencyInjection/PollyServiceCollectionExtensions.cs:68-69](https://github.com/App-vNext/Polly/blob/main/src/Polly.Extensions/DependencyInjection/PollyServiceCollectionExtensions.cs#L68-L69)
2. It registers a keyed transient service via `services.TryAddKeyedTransient()`, which resolves the pipeline through `ResiliencePipelineProvider<TKey>.GetPipeline<TResult>((TKey)key!)`. Sources: [src/Polly.Extensions/DependencyInjection/PollyServiceCollectionExtensions.cs:71-78](https://github.com/App-vNext/Polly/blob/main/src/Polly.Extensions/DependencyInjection/PollyServiceCollectionExtensions.cs#L71-L78)
3. It calls `services.AddResiliencePipelines<TKey>()`, which configures `ConfigureResiliencePipelineRegistryOptions<TKey>` and invokes `services.AddResiliencePipelineRegistry<TKey>()`. Sources: [src/Polly.Extensions/DependencyInjection/PollyServiceCollectionExtensions.cs:80-83](https://github.com/App-vNext/Polly/blob/main/src/Polly.Extensions/DependencyInjection/PollyServiceCollectionExtensions.cs#L80-L83), [src/Polly.Extensions/DependencyInjection/PollyServiceCollectionExtensions.cs:178-185](https://github.com/App-vNext/Polly/blob/main/src/Polly.Extensions/DependencyInjection/PollyServiceCollectionExtensions.cs#L178-L185)
4. Inside `AddResiliencePipelineRegistry<TKey>()`, a marker check via `RegistryMarker<TKey>.ServiceDescriptor` prevents duplicate registrations. Sources: [src/Polly.Extensions/DependencyInjection/PollyServiceCollectionExtensions.cs:232-235](https://github.com/App-vNext/Polly/blob/main/src/Polly.Extensions/DependencyInjection/PollyServiceCollectionExtensions.cs#L232-L235)
5. The method calls private `AddResilienceBuilder()`, configuring `TelemetryOptions` with an `ILoggerFactory` and registering a transient `ResiliencePipelineBuilder` factory with telemetry and time provider bindings. Sources: [src/Polly.Extensions/DependencyInjection/PollyServiceCollectionExtensions.cs:237-238](https://github.com/App-vNext/Polly/blob/main/src/Polly.Extensions/DependencyInjection/PollyServiceCollectionExtensions.cs#L237-L238), [src/Polly.Extensions/DependencyInjection/PollyServiceCollectionExtensions.cs:267-287](https://github.com/App-vNext/Polly/blob/main/src/Polly.Extensions/DependencyInjection/PollyServiceCollectionExtensions.cs#L267-L287)
6. Finally, it registers `ResiliencePipelineRegistry<TKey>` and `ResiliencePipelineProvider<TKey>` as singletons, iterating over collected configuration actions to populate the registry. Sources: [src/Polly.Extensions/DependencyInjection/PollyServiceCollectionExtensions.cs:240-254](https://github.com/App-vNext/Polly/blob/main/src/Polly.Extensions/DependencyInjection/PollyServiceCollectionExtensions.cs#L240-L254)

> [!NOTE]
> The `RegistryMarker<TKey>` sealed class uses a static `ServiceDescriptor` singleton to ensure registry initialization logic runs exactly once per unique `TKey` type parameter, preventing service collection pollution. Sources: [src/Polly.Extensions/DependencyInjection/PollyServiceCollectionExtensions.cs:230-237](https://github.com/App-vNext/Polly/blob/main/src/Polly.Extensions/DependencyInjection/PollyServiceCollectionExtensions.cs#L230-L237), [src/Polly.Extensions/DependencyInjection/PollyServiceCollectionExtensions.cs:290-293](https://github.com/App-vNext/Polly/blob/main/src/Polly.Extensions/DependencyInjection/PollyServiceCollectionExtensions.cs#L290-L293)

Sources: [src/Polly.Extensions/DependencyInjection/PollyServiceCollectionExtensions.cs:62-293](https://github.com/App-vNext/Polly/blob/main/src/Polly.Extensions/DependencyInjection/PollyServiceCollectionExtensions.cs#L62-L293)

## Pipeline Builder Context Configuration

### Overview

Pipeline builder setup relies on context classes that expose dependency injection services, options resolution, and registration control. The `AddResiliencePipelineContext<TKey>` and `AddResiliencePipelinesContext<TKey>` types serve as the primary configuration interfaces when defining resilience pipelines.

Sources: [src/Polly.Extensions/DependencyInjection/AddResiliencePipelineContext.cs:9-15](https://github.com/App-vNext/Polly/blob/main/src/Polly.Extensions/DependencyInjection/AddResiliencePipelineContext.cs#L9-L15), [src/Polly.Extensions/DependencyInjection/AddResiliencePipelinesContext.cs:5-11](https://github.com/App-vNext/Polly/blob/main/src/Polly.Extensions/DependencyInjection/AddResiliencePipelinesContext.cs#L5-L11)

### AddResiliencePipelineContext Members

The `AddResiliencePipelineContext<TKey>` class provides access to pipeline-specific metadata and services during builder configuration. It exposes the pipeline key, service provider, dynamic reload capabilities, options fetching, and disposal callbacks.

| Member | Type / Signature | Description |
| :--- | :--- | :--- |
| `PipelineKey` | `TKey` | Gets the key identifying the resilience pipeline being created. | Sources: [src/Polly.Extensions/DependencyInjection/AddResiliencePipelineContext.cs:23-25](https://github.com/App-vNext/Polly/blob/main/src/Polly.Extensions/DependencyInjection/AddResiliencePipelineContext.cs#L23-L25) |
| `ServiceProvider` | `IServiceProvider` | Gets the service provider providing access to the dependency injection container. | Sources: [src/Polly.Extensions/DependencyInjection/AddResiliencePipelineContext.cs:27-30](https://github.com/App-vNext/Polly/blob/main/src/Polly.Extensions/DependencyInjection/AddResiliencePipelineContext.cs#L27-L30) |
| `EnableReloads<TOptions>` | `void EnableReloads<TOptions>(string? name = null)` | Enables dynamic reloading of the pipeline whenever `TOptions` change, using registered `IOptionsMonitor<TOptions>`. | Sources: [src/Polly.Extensions/DependencyInjection/AddResiliencePipelineContext.cs:37-50](https://github.com/App-vNext/Polly/blob/main/src/Polly.Extensions/DependencyInjection/AddResiliencePipelineContext.cs#L37-L50) |
| `EnableReloadsWithMonitor<TOptions>` | `void EnableReloadsWithMonitor<TOptions>(IOptionsMonitor<TOptions> monitor, string? name = null)` | Enables dynamic reloading using a custom `IOptionsMonitor<TOptions>` instance not stored in the container. | Sources: [src/Polly.Extensions/DependencyInjection/AddResiliencePipelineContext.cs:53-71](https://github.com/App-vNext/Polly/blob/main/src/Polly.Extensions/DependencyInjection/AddResiliencePipelineContext.cs#L53-L71) |
| `GetOptions<TOptions>` | `TOptions GetOptions<TOptions>(string? name = null)` | Retrieves the options instance identified by `name` from the options monitor. | Sources: [src/Polly.Extensions/DependencyInjection/AddResiliencePipelineContext.cs:73-86](https://github.com/App-vNext/Polly/blob/main/src/Polly.Extensions/DependencyInjection/AddResiliencePipelineContext.cs#L73-L86) |
| `OnPipelineDisposed` | `void OnPipelineDisposed(Action callback)` | Registers a callback invoked when the configured pipeline instance is disposed. | Sources: [src/Polly.Extensions/DependencyInjection/AddResiliencePipelineContext.cs:88-93](https://github.com/App-vNext/Polly/blob/main/src/Polly.Extensions/DependencyInjection/AddResiliencePipelineContext.cs#L88-L93) |

Sources: [src/Polly.Extensions/DependencyInjection/AddResiliencePipelineContext.cs:13-94](https://github.com/App-vNext/Polly/blob/main/src/Polly.Extensions/DependencyInjection/AddResiliencePipelineContext.cs#L13-L94)

### AddResiliencePipelinesContext Overloads

The `AddResiliencePipelinesContext<TKey>` class allows registering multiple resilience pipelines inside a configuration block. It defers builder registration into the underlying options actions list, ensuring that the last added builder with the same key wins.

```csharp
public sealed class AddResiliencePipelinesContext<TKey> where TKey : notnull
{
    public IServiceProvider ServiceProvider { get; }

    public void AddResiliencePipeline(
        TKey key,
        Action<ResiliencePipelineBuilder, AddResiliencePipelineContext<TKey>> configure);

    public void AddResiliencePipeline<TResult>(
        TKey key,
        Action<ResiliencePipelineBuilder<TResult>, AddResiliencePipelineContext<TKey>> configure);
}
```
Sources: [src/Polly.Extensions/DependencyInjection/AddResiliencePipelinesContext.cs:9-80](https://github.com/App-vNext/Polly/blob/main/src/Polly.Extensions/DependencyInjection/AddResiliencePipelinesContext.cs#L9-L80)

> [!NOTE]
> When multiple builders share the exact same key during configuration, `registry.TryAddBuilder` uses last-writer-wins semantics. This allows callers to override previously registered pipeline definitions. Sources: [src/Polly.Extensions/DependencyInjection/AddResiliencePipelinesContext.cs:44-51](https://github.com/App-vNext/Polly/blob/main/src/Polly.Extensions/DependencyInjection/AddResiliencePipelinesContext.cs#L44-L51), [src/Polly.Extensions/DependencyInjection/AddResiliencePipelinesContext.cs:72-79](https://github.com/App-vNext/Polly/blob/main/src/Polly.Extensions/DependencyInjection/AddResiliencePipelinesContext.cs#L72-L79)

## Registry Options and Key Configuration

### Overview

Polly supports custom keys for resilience pipelines through the `AddResiliencePipelineRegistry<TKey>` extension method on `IServiceCollection`. When using complex or composite keys, you can configure registry options such as custom equality comparers and name formatters to control how pipeline instances are isolated, compared, and retrieved from the underlying provider.

Sources: [src/Snippets/Docs/DependencyInjection.cs:233-248](https://github.com/App-vNext/Polly/blob/main/src/Snippets/Docs/DependencyInjection.cs#L233-L248)

### Complex Keys and Comparers

When utilizing a custom record struct or class as a pipeline key, the registry relies on equality comparison and formatting delegates to manage pipeline and builder instances. For example, a composite key struct can combine a pipeline name and an instance identifier:

```csharp
public record struct MyPipelineKey(string PipelineName, string InstanceName)
{
}
```
Sources: [src/Snippets/Docs/DependencyInjection.cs:200-206](https://github.com/App-vNext/Polly/blob/main/src/Snippets/Docs/DependencyInjection.cs#L200-L206)

To customize how keys are evaluated for equality during registry lookups, implement `IEqualityComparer<TKey>`. The following custom comparer isolates pipeline building by checking only the `PipelineName` property:

```csharp
public sealed class PipelineNameComparer : IEqualityComparer<MyPipelineKey>
{
    public bool Equals(MyPipelineKey x, MyPipelineKey y) => x.PipelineName == y.PipelineName;

    public int GetHashCode(MyPipelineKey obj) => obj.PipelineName.GetHashCode(StringComparison.Ordinal);
}
```
Sources: [src/Snippets/Docs/DependencyInjection.cs:222-231](https://github.com/App-vNext/Polly/blob/main/src/Snippets/Docs/DependencyInjection.cs#L222-L231)

You can register this custom comparer along with instance and builder name formatters by configuring the registry options during service collection setup:

```csharp
services
    .AddResiliencePipelineRegistry<MyPipelineKey>(options =>
    {
        options.BuilderComparer = new PipelineNameComparer();

        options.InstanceNameFormatter = key => key.InstanceName;

        options.BuilderNameFormatter = key => key.PipelineName;
    });
```
Sources: [src/Snippets/Docs/DependencyInjection.cs:233-248](https://github.com/App-vNext/Polly/blob/main/src/Snippets/Docs/DependencyInjection.cs#L233-L248)

> [!NOTE]
> The internal `ConfigureResiliencePipelineRegistryOptions<TKey>` helper class collects registry configuration actions on the service collection, ensuring that options are correctly applied when the registry instance is built. Sources: [src/Polly.Extensions/DependencyInjection/ConfigureResiliencePipelineRegistryOptions.cs:5-10](https://github.com/App-vNext/Polly/blob/main/src/Polly.Extensions/DependencyInjection/ConfigureResiliencePipelineRegistryOptions.cs#L5-L10)

Once configured, the `ResiliencePipelineProvider<TKey>` can dynamically create, isolate, and cache separate named instances based on the complex key structure:

```csharp
ResiliencePipelineProvider<MyPipelineKey> pipelineProvider = serviceProvider.GetRequiredService<ResiliencePipelineProvider<MyPipelineKey>>();

// The registry dynamically creates and caches instance-A using the associated builder action
ResiliencePipeline instanceA = pipelineProvider.GetPipeline(new MyPipelineKey("my-pipeline", "instance-A"));

// The registry creates and caches instance-B
ResiliencePipeline instanceB = pipelineProvider.GetPipeline(new MyPipelineKey("my-pipeline", "instance-B"));
```
Sources: [src/Snippets/Docs/DependencyInjection.cs:250-263](https://github.com/App-vNext/Polly/blob/main/src/Snippets/Docs/DependencyInjection.cs#L250-L263)

## Dynamic Reloading and Context Extensions

### Dynamic Reloading and Context Extensions

### Overview

Polly integrates with Microsoft's `IOptionsMonitor<TOptions>` to support dynamic reloading of resilience pipelines without requiring application restarts. The `AddResiliencePipelineContext<TKey>` class exposes methods to listen for options changes, fetch current options values, and register disposal callbacks.
Sources: [src/Polly.Extensions/DependencyInjection/AddResiliencePipelineContext.cs:37-94](https://github.com/App-vNext/Polly/blob/main/src/Polly.Extensions/DependencyInjection/AddResiliencePipelineContext.cs#L37-L94)

### Reloading Mechanics and Change Tokens

Dynamic reloading is driven by the `EnableReloads` and `EnableReloadsWithMonitor` methods on `AddResiliencePipelineContext<TKey>`, which delegate to extension methods on `ConfigureBuilderContext<TKey>`. 

When `EnableReloads` is invoked, a `CancellationTokenSource` is created and an `IOptionsMonitor<TOptions>` change listener is registered. If the changed options name matches the targeted configuration name (defaulting to `string.Empty` for global options), the cancellation token source is cancelled, triggering a pipeline reload.

```csharp
public static void EnableReloads<TKey, [DynamicallyAccessedMembers(DynamicallyAccessedMemberTypes.PublicParameterlessConstructor)] TOptions>(
    this ConfigureBuilderContext<TKey> context,
    IOptionsMonitor<TOptions> optionsMonitor,
    string? name = null)
    where TKey : notnull
{
    Guard.NotNull(context);
    Guard.NotNull(optionsMonitor);

    name ??= string.Empty;

    var source = new CancellationTokenSource();
    var registration = optionsMonitor.OnChange((_, changedNamed) =>
    {
        if (name == changedNamed)
        {
            source.Cancel();
        }
    });

    context.AddReloadToken(source.Token);
    context.OnPipelineDisposed(() =>
    {
        registration?.Dispose();
        source.Dispose();
    });
}
```
Sources: [src/Polly.Extensions/Registry/ConfigureBuilderContextExtensions.cs:28-56](https://github.com/App-vNext/Polly/blob/main/src/Polly.Extensions/Registry/ConfigureBuilderContextExtensions.cs#L28-L56)

> [!NOTE]
> You can listen for configuration changes across multiple options types by invoking `EnableReloads` multiple times with different `TOptions` type parameters within the same pipeline builder configuration.
Sources: [src/Polly.Extensions/DependencyInjection/AddResiliencePipelineContext.cs:45-47](https://github.com/App-vNext/Polly/blob/main/src/Polly.Extensions/DependencyInjection/AddResiliencePipelineContext.cs#L45-L47), [src/Polly.Extensions/Registry/ConfigureBuilderContextExtensions.cs:24-26](https://github.com/App-vNext/Polly/blob/main/src/Polly.Extensions/Registry/ConfigureBuilderContextExtensions.cs#L24-L26)

### Context Extension API Reference

The `AddResiliencePipelineContext<TKey>` type provides several convenience methods for retrieving options and managing pipeline lifetime resources:

| Member Signature | Return Type | Description |
| :--- | :--- | :--- |
| `EnableReloads<TOptions>(string? name)` | `void` | Resolves `IOptionsMonitor<TOptions>` from container and enables reloading on options changes. |
| `EnableReloadsWithMonitor<TOptions>(IOptionsMonitor<TOptions> monitor, string? name)` | `void` | Enables reloading using an explicitly supplied options monitor instance. |
| `GetOptions<TOptions>(string? name)` | `TOptions` | Resolves the options monitor from container and retrieves the current options instance identified by `name`. |
| `OnPipelineDisposed(Action callback)` | `void` | Registers a callback invoked when the configured pipeline instance is disposed. |

Sources: [src/Polly.Extensions/DependencyInjection/AddResiliencePipelineContext.cs:37-94](https://github.com/App-vNext/Polly/blob/main/src/Polly.Extensions/DependencyInjection/AddResiliencePipelineContext.cs#L37-L94)

> [!WARNING]
> When wrapping a custom configuration source or feature flag system where `IOptionsMonitor<TOptions>` is not registered in the service container, always use `EnableReloadsWithMonitor` to pass your custom monitor instance directly.
Sources: [src/Polly.Extensions/DependencyInjection/AddResiliencePipelineContext.cs:58-61](https://github.com/App-vNext/Polly/blob/main/src/Polly.Extensions/DependencyInjection/AddResiliencePipelineContext.cs#L58-L61)

## Usage Patterns and Dependency Resolution

### Overview

Pipelines registered in the service container can be resolved using standard dependency injection mechanisms or explicit service provider lookups. Both non-generic and generic pipeline variants are supported, allowing typed results such as `HttpResponseMessage` to be handled natively.
Sources: [src/Snippets/Docs/DependencyInjection.cs:24-38](https://github.com/App-vNext/Polly/blob/main/src/Snippets/Docs/DependencyInjection.cs#L24-L38), [src/Snippets/Docs/DependencyInjection.cs:64-75](https://github.com/App-vNext/Polly/blob/main/src/Snippets/Docs/DependencyInjection.cs#L64-L75)

### Pipeline Registration and Resolution Patterns

Pipelines are added to an `IServiceCollection` using `AddResiliencePipeline` or `AddResiliencePipeline<TKey, TResult>`. Once configured, consumption is handled by resolving `ResiliencePipelineProvider<TKey>` or by utilizing .NET keyed services.

```csharp
var services = new ServiceCollection();

// Define a resilience pipeline
services.AddResiliencePipeline("my-key", builder =>
{
    builder.AddTimeout(TimeSpan.FromSeconds(10));
});

// Resolve the resilience pipeline
ServiceProvider serviceProvider = services.BuildServiceProvider();
ResiliencePipelineProvider<string> pipelineProvider = serviceProvider.GetRequiredService<ResiliencePipelineProvider<string>>();
ResiliencePipeline pipeline = pipelineProvider.GetPipeline("my-key");

// Use it
await pipeline.ExecuteAsync(
    static async cancellation => await Task.Delay(100, cancellation));
```
Sources: [src/Snippets/Docs/DependencyInjection.cs:21-48](https://github.com/App-vNext/Polly/blob/main/src/Snippets/Docs/DependencyInjection.cs#L21-L48)

For generic pipelines handling specific result types, such as `HttpResponseMessage`, specify both the key type and the result type during registration and retrieval:

```csharp
var services = new ServiceCollection();

services.AddResiliencePipeline<string, HttpResponseMessage>("my-pipeline", builder =>
{
    builder.AddRetry(new()
    {
        MaxRetryAttempts = 2,
        ShouldHandle = new PredicateBuilder<HttpResponseMessage>()
            .Handle<HttpRequestException>()
            .Handle<TimeoutRejectedException>()
            .HandleResult(response => response.StatusCode == System.Net.HttpStatusCode.InternalServerError)
    })
    .AddTimeout(TimeSpan.FromSeconds(2));
});

ServiceProvider serviceProvider = services.BuildServiceProvider();
ResiliencePipelineProvider<string> pipelineProvider = serviceProvider.GetRequiredService<ResiliencePipelineProvider<string>>();
ResiliencePipeline<HttpResponseMessage> pipeline = pipelineProvider.GetPipeline<HttpResponseMessage>("my-key");
```
Sources: [src/Snippets/Docs/DependencyInjection.cs:60-80](https://github.com/App-vNext/Polly/blob/main/src/Snippets/Docs/DependencyInjection.cs#L60-L80)

> [!WARNING]
> Never call `services.BuildServiceProvider()` inside strategy configuration callbacks (such as `OnRetry`) to resolve loggers or dependencies. Doing so builds an isolated container root, causing memory leaks and duplicate service instances. Always use `context.ServiceProvider` provided by the builder callback instead.
Sources: [src/Snippets/Docs/DependencyInjection.cs:265-303](https://github.com/App-vNext/Polly/blob/main/src/Snippets/Docs/DependencyInjection.cs#L265-L303)

### Keyed Services Integration

Resilience pipelines can be injected directly into consumer classes using .NET keyed service attributes when registered under matching names.

```csharp
public sealed class MyApi
{
    private readonly ResiliencePipeline _pipeline;
    private readonly ResiliencePipeline<HttpResponseMessage> _genericPipeline;

    public MyApi(
        [FromKeyedServices("my-pipeline")]
        ResiliencePipeline pipeline,
        [FromKeyedServices("my-pipeline")]
        ResiliencePipeline<HttpResponseMessage> genericPipeline)
    {
        // Although the pipelines are registered with the same key, they are distinct instances.
        // One is generic, the other is not.
        _pipeline = pipeline;
        _genericPipeline = genericPipeline;
    }
}
```
Sources: [src/Snippets/Docs/DependencyInjection.cs:111-127](https://github.com/App-vNext/Polly/blob/main/src/Snippets/Docs/DependencyInjection.cs#L111-L127)

## Related

- [[Pipeline Registry]]
- [[Extended Telemetry Metrics]]

