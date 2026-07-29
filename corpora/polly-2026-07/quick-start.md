# Quick Start

<details>
<summary>Relevant source files</summary>

The following files were used as context for generating this wiki page:

- [src/Snippets/Docs/ResiliencePipelines.cs](https://github.com/App-vNext/Polly/blob/main/src/Snippets/Docs/ResiliencePipelines.cs)
- [src/Snippets/Docs/DependencyInjection.cs](https://github.com/App-vNext/Polly/blob/main/src/Snippets/Docs/DependencyInjection.cs)
- [README.md](https://github.com/App-vNext/Polly/blob/main/README.md)
- [docs/pipelines/index.md](https://github.com/App-vNext/Polly/blob/main/docs/pipelines/index.md)
- [src/Snippets/Docs/ResiliencePipelineRegistry.cs](https://github.com/App-vNext/Polly/blob/main/src/Snippets/Docs/ResiliencePipelineRegistry.cs)
- [src/Snippets/Docs/Retry.cs](https://github.com/App-vNext/Polly/blob/main/src/Snippets/Docs/Retry.cs)
- [src/Snippets/Docs/Migration.Policies.cs](https://github.com/App-vNext/Polly/blob/main/src/Snippets/Docs/Migration.Policies.cs)
- [docs/getting-started.md](https://github.com/App-vNext/Polly/blob/main/docs/getting-started.md)
- [src/Snippets/Docs/Readme.cs](https://github.com/App-vNext/Polly/blob/main/src/Snippets/Docs/Readme.cs)
- [src/Snippets/Docs/Performance.cs](https://github.com/App-vNext/Polly/blob/main/src/Snippets/Docs/Performance.cs)
- [src/Snippets/Docs/ResilienceStrategies.cs](https://github.com/App-vNext/Polly/blob/main/src/Snippets/Docs/ResilienceStrategies.cs)
- [docs/strategies/index.md](https://github.com/App-vNext/Polly/blob/main/docs/strategies/index.md)
- [src/Snippets/Docs/Testing.cs](https://github.com/App-vNext/Polly/blob/main/src/Snippets/Docs/Testing.cs)
- [docs/advanced/dependency-injection.md](https://github.com/App-vNext/Polly/blob/main/docs/advanced/dependency-injection.md)
- [docs/advanced/resilience-context.md](https://github.com/App-vNext/Polly/blob/main/docs/advanced/resilience-context.md)
- [src/Snippets/Docs/General.cs](https://github.com/App-vNext/Polly/blob/main/src/Snippets/Docs/General.cs)
</details>

## Overview

The Quick Start guide provides a foundational introduction to Polly, demonstrating how to construct, configure, and execute resilience pipelines using fluent builders and options objects. It walks through core concepts such as packaging strategies, integrating with Microsoft Extensions Dependency Injection, managing named pipelines with registries, leveraging execution context for performance, and transitioning from legacy policy configurations.

Sources: [README.md:38-103](https://github.com/App-vNext/Polly/blob/main/README.md#L38-L103), [docs/getting-started.md:1-73](https://github.com/App-vNext/Polly/blob/main/docs/getting-started.md#L1-L73)

## Pipeline Construction and Execution Basics

### Overview

Building resilience pipelines begins with the `ResiliencePipelineBuilder` class, which exposes fluent extension methods for chaining strategies like retry and timeout before producing an immutable `ResiliencePipeline` instance via `.Build()`.

Sources: [docs/getting-started.md:11-19](https://github.com/App-vNext/Polly/blob/main/docs/getting-started.md#L11-L19), [src/Snippets/Docs/Readme.cs:13-20](https://github.com/App-vNext/Polly/blob/main/src/Snippets/Docs/Readme.cs#L13-L20)

### Pipeline Construction and Execution

The pipeline executes callbacks synchronously or asynchronously. Asynchronous methods return `ValueTask` or `ValueTask<T>` rather than `Task` or `Task<T>`.

```cs
ResiliencePipeline pipeline = new ResiliencePipelineBuilder()
    .AddRetry(new RetryStrategyOptions())
    .AddTimeout(TimeSpan.FromSeconds(10))
    .Build();

await pipeline.ExecuteAsync(static async token => { /* Custom logic */ }, cancellationToken);
```

Sources: [docs/getting-started.md:16-23](https://github.com/App-vNext/Polly/blob/main/docs/getting-started.md#L16-L23), [docs/getting-started.md:26-27](https://github.com/App-vNext/Polly/blob/main/docs/getting-started.md#L26-L27)

> [!NOTE]
> Asynchronous methods in the Polly API return `ValueTask` or `ValueTask<T>` instead of `Task` or `Task<T>`. Users of Visual Basic or F# should review language-specific usage guides.

Sources: [docs/getting-started.md:26-28](https://github.com/App-vNext/Polly/blob/main/docs/getting-started.md#L26-L28)

## Standard Resilience Strategies Configuration

### Overview

Standard resilience strategies such as retries, circuit breakers, and timeouts are configured using dedicated options objects passed directly into builder extension methods like `AddRetry` and `AddTimeout`. These options objects supply defaults while allowing comprehensive customization of behavior, including attempt counts, delay generators, backoff types, jitter, and exception filtering predicates.

Sources: [src/Snippets/Docs/Retry.cs:18-99](https://github.com/App-vNext/Polly/blob/main/src/Snippets/Docs/Retry.cs#L18-L99), [src/Snippets/Docs/ResilienceStrategies.cs:11-20](https://github.com/App-vNext/Polly/blob/main/src/Snippets/Docs/ResilienceStrategies.cs#L11-L20), [docs/strategies/index.md:41-45](https://github.com/App-vNext/Polly/blob/main/docs/strategies/index.md#L41-L45)

### Configuring Retry Strategies with Options

The `RetryStrategyOptions` and typed `RetryStrategyOptions<TResult>` classes control retry execution flows. Basic configurations utilize default options or instantiate zero-delay retries, whereas advanced patterns define custom maximum attempts, backoff types, jitter factors, delay generators, and event notifications.

```cs
// Retry using the default options.
var optionsDefaults = new RetryStrategyOptions();

// For instant retries with no delay
var optionsNoDelay = new RetryStrategyOptions
{
    Delay = TimeSpan.Zero
};

// For advanced control over the retry behavior, including the number of attempts,
// delay between retries, and the types of exceptions to handle.
var optionsComplex = new RetryStrategyOptions
{
    ShouldHandle = new PredicateBuilder().Handle<SomeExceptionType>(),
    BackoffType = DelayBackoffType.Exponential,
    UseJitter = true,  // Adds a random factor to the delay
    MaxRetryAttempts = 4,
    Delay = TimeSpan.FromSeconds(3),
};

// To use a custom function to generate the delay for retries
var optionsDelayGenerator = new RetryStrategyOptions
{
    MaxRetryAttempts = 2,
    DelayGenerator = static args =>
    {
        var delay = args.AttemptNumber switch
        {
            0 => TimeSpan.Zero,
            1 => TimeSpan.FromSeconds(1),
            _ => TimeSpan.FromSeconds(5)
        };

        return new ValueTask<TimeSpan?>(delay);
    }
};

// To extract the delay from the result object
var optionsExtractDelay = new RetryStrategyOptions<HttpResponseMessage>
{
    DelayGenerator = static args =>
    {
        if (args.Outcome.Result is HttpResponseMessage responseMessage &&
            TryGetDelay(responseMessage, out TimeSpan delay))
        {
            return new ValueTask<TimeSpan?>(delay);
        }

        // Returning null means the retry strategy will use its internal delay for this attempt.
        return new ValueTask<TimeSpan?>((TimeSpan?)null);
    }
};

// To get notifications when a retry is performed
var optionsOnRetry = new RetryStrategyOptions
{
    MaxRetryAttempts = 2,
    OnRetry = static args =>
    {
        Console.WriteLine("OnRetry, Attempt: {0}", args.AttemptNumber);
        return default;
    }
};

// To keep retrying indefinitely or until success use int.MaxValue.
var optionsIndefiniteRetry = new RetryStrategyOptions
{
    MaxRetryAttempts = int.MaxValue,
};

// Add a retry strategy with a RetryStrategyOptions{<TResult>} instance to the pipeline
new ResiliencePipelineBuilder().AddRetry(optionsDefaults);
new ResiliencePipelineBuilder<HttpResponseMessage>().AddRetry(optionsExtractDelay);
```

Sources: [src/Snippets/Docs/Retry.cs:18-98](https://github.com/App-vNext/Polly/blob/main/src/Snippets/Docs/Retry.cs#L18-L98)

> [!NOTE]
> Returning `null` from a custom `DelayGenerator` instructs the retry strategy to fall back onto its internally calculated delay for the current attempt. Setting `MaxRetryAttempts = int.MaxValue` configures the strategy to retry indefinitely until execution succeeds.

Sources: [src/Snippets/Docs/Retry.cs:71-73](https://github.com/App-vNext/Polly/blob/main/src/Snippets/Docs/Retry.cs#L71-L73), [src/Snippets/Docs/Retry.cs:90-93](https://github.com/App-vNext/Polly/blob/main/src/Snippets/Docs/Retry.cs#L90-L93)

### Timeout Strategy Configuration

Proactive timeout strategies enforce strict execution ceilings by wrapping callbacks in `TimeoutStrategyOptions`. If an execution exceeds the allotted duration, it is interrupted and results in a `TimeoutRejectedException`.

```cs
ResiliencePipeline pipeline = new ResiliencePipelineBuilder()
    .AddTimeout(new TimeoutStrategyOptions
    {
        Timeout = TimeSpan.FromSeconds(5)
    })
    .Build();
```

Sources: [src/Snippets/Docs/ResilienceStrategies.cs:11-20](https://github.com/App-vNext/Polly/blob/main/src/Snippets/Docs/ResilienceStrategies.cs#L11-L20)

## Dependency Injection Integration

### Overview

Polly provides native integration with the Microsoft Extensions Dependency Injection (`IServiceCollection`) container through the `Polly.Extensions` package. This integration acts as a thin layer atop the resilience pipeline registry to manage both standard and generic resilience pipelines.

To begin using dependency injection features, install the package via the .NET CLI:

```sh
dotnet add package Polly.Extensions
```

Sources: [docs/advanced/dependency-injection.md:11-16](https://github.com/App-vNext/Polly/blob/main/docs/advanced/dependency-injection.md#L11-L16)

### Registering and Resolving Pipelines

Pipelines are registered using the `AddResiliencePipeline` extension method on `IServiceCollection`. This method registers several key services into the DI container: `ResiliencePipelineRegistry<string>`, `ResiliencePipelineProvider<string>`, and `IOptions<ResiliencePipelineRegistryOptions<string>>`.

```cs
var services = new ServiceCollection();

// Define a resilience pipeline
services.AddResiliencePipeline("my-key", builder =>
{
    // Add strategies to your pipeline here, timeout for example
    builder.AddTimeout(TimeSpan.FromSeconds(10));
});

// You can also access IServiceProvider by using the alternate overload
services.AddResiliencePipeline("my-key", (builder, context) =>
{
    // Resolve any service from DI
    var loggerFactory = context.ServiceProvider.GetRequiredService<ILoggerFactory>();

    // Add strategies to your pipeline here
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

Sources: [src/Snippets/Docs/DependencyInjection.cs:21-49](https://github.com/App-vNext/Polly/blob/main/src/Snippets/Docs/DependencyInjection.cs#L21-L49), [docs/advanced/dependency-injection.md:23-50](https://github.com/App-vNext/Polly/blob/main/docs/advanced/dependency-injection.md#L23-L50)

> [!NOTE]
> The generic `string` key type is automatically inferred when the pipeline is defined with a string key like `"my-key"`.

Sources: [docs/advanced/dependency-injection.md:60-62](https://github.com/App-vNext/Polly/blob/main/docs/advanced/dependency-injection.md#L60-L62)

### Generic Resilience Pipelines

You can configure typed, generic resilience pipelines (`ResiliencePipeline<TResult>`) by specifying both the key type and the result type in the registration method.

```cs
var services = new ServiceCollection();

// Define a generic resilience pipeline
// First parameter is the type of key, second one is the type of the results the generic pipeline works with
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

// Resolve the resilience pipeline
ServiceProvider serviceProvider = services.BuildServiceProvider();
ResiliencePipelineProvider<string> pipelineProvider = serviceProvider.GetRequiredService<ResiliencePipelineProvider<string>>();
ResiliencePipeline<HttpResponseMessage> pipeline = pipelineProvider.GetPipeline<HttpResponseMessage>("my-key");

// Use it
await pipeline.ExecuteAsync(
    async cancellation => await client.GetAsync(endpoint, cancellation),
    cancellationToken);
```

Sources: [src/Snippets/Docs/DependencyInjection.cs:60-87](https://github.com/App-vNext/Polly/blob/main/src/Snippets/Docs/DependencyInjection.cs#L60-L87), [docs/advanced/dependency-injection.md:74-100](https://github.com/App-vNext/Polly/blob/main/docs/advanced/dependency-injection.md#L74-L100)

### Keyed Services Integration

Starting from version 8.3.0, .NET keyed services allow direct injection of `ResiliencePipeline` or `ResiliencePipeline<TResult>` instances using the `[FromKeyedServices]` attribute or `GetRequiredKeyedService<T>`.

```cs
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

Sources: [src/Snippets/Docs/DependencyInjection.cs:111-127](https://github.com/App-vNext/Polly/blob/main/src/Snippets/Docs/DependencyInjection.cs#L111-L127), [src/Snippets/Docs/Readme.cs:51](https://github.com/App-vNext/Polly/blob/main/src/Snippets/Docs/Readme.cs#L51), [docs/advanced/dependency-injection.md:130-146](https://github.com/App-vNext/Polly/blob/main/docs/advanced/dependency-injection.md#L130-L146)

> [!NOTE]
> Resilience pipelines are registered in the DI container as transient services. This design enables resolving multiple unique instances when utilizing complex pipeline keys, while lifetime management remains handled by the `ResiliencePipelineProvider`.

Sources: [docs/advanced/dependency-injection.md:150-152](https://github.com/App-vNext/Polly/blob/main/docs/advanced/dependency-injection.md#L150-L152)

## Pipeline Registry and Dynamic Reloading

### Pipeline Registry and Dynamic Reloading

Managing named resilience pipelines manually and implementing dynamic configuration reloads is handled through `ResiliencePipelineRegistry<TKey>`. Non-generic and generic pipelines are stored separately, meaning the same key can be used for both without conflict.

```csharp
var registry = new ResiliencePipelineRegistry<string>();

// Register builder for pipeline "A"
registry.TryAddBuilder("A", (builder, context) =>
{
    // Define your pipeline
    builder.AddRetry(new RetryStrategyOptions());
});

// Register generic builder for pipeline "A"; you can use the same key
// because generic and non-generic pipelines are stored separately
registry.TryAddBuilder<HttpResponseMessage>("A", (builder, context) =>
{
    // Define your pipeline
    builder.AddRetry(new RetryStrategyOptions<HttpResponseMessage>());
});

// Fetch pipeline "A"
ResiliencePipeline pipelineA = registry.GetPipeline("A");

// Fetch generic pipeline "A"
ResiliencePipeline<HttpResponseMessage> genericPipelineA = registry.GetPipeline<HttpResponseMessage>("A");

// Returns false since pipeline "unknown" isn't registered
var doesPipelineExist = registry.TryGetPipeline("unknown", out var pipeline);

// Throws KeyNotFoundException because pipeline "unknown" isn't registered
try
{
    registry.GetPipeline("unknown");
}
catch (KeyNotFoundException)
{
    // Handle the exception
}
```

Sources: [src/Snippets/Docs/ResiliencePipelineRegistry.cs:15-50](https://github.com/App-vNext/Polly/blob/main/src/Snippets/Docs/ResiliencePipelineRegistry.cs#L15-L50)

Pipelines can also be retrieved or created dynamically without explicit builder registration using `GetOrAddPipeline`:

```csharp
var registry = new ResiliencePipelineRegistry<string>();

// Dynamically retrieve or create pipeline "A"
ResiliencePipeline pipeline = registry.GetOrAddPipeline("A", (builder, context) =>
{
    // Define your pipeline
    builder.AddRetry(new RetryStrategyOptions());
});

// Dynamically retrieve or create generic pipeline "A"
ResiliencePipeline<HttpResponseMessage> genericPipeline = registry.GetOrAddPipeline<HttpResponseMessage>("A", (builder, context) =>
{
    // Define your pipeline
    builder.AddRetry(new RetryStrategyOptions<HttpResponseMessage>());
});
```

Sources: [src/Snippets/Docs/ResiliencePipelineRegistry.cs:58-74](https://github.com/App-vNext/Polly/blob/main/src/Snippets/Docs/ResiliencePipelineRegistry.cs#L58-L74)

### Registry Customization Options

You can configure `ResiliencePipelineRegistryOptions<TKey>` to customize comparers, formatting, and default builder behavior:

```csharp
var options = new ResiliencePipelineRegistryOptions<string>
{
    BuilderComparer = StringComparer.OrdinalIgnoreCase,
    PipelineComparer = StringComparer.OrdinalIgnoreCase,
    BuilderFactory = () => new ResiliencePipelineBuilder
    {
        InstanceName = "lets change the default of InstanceName",
        Name = "lets change the default of Name",
    },
    BuilderNameFormatter = key => $"key:{key}",
    InstanceNameFormatter = key => $"instance-key:{key}",
};

var registry = new ResiliencePipelineRegistry<string>();
```

Sources: [src/Snippets/Docs/ResiliencePipelineRegistry.cs:81-96](https://github.com/App-vNext/Polly/blob/main/src/Snippets/Docs/ResiliencePipelineRegistry.cs#L81-L96)

### Handling Dynamic Reloads and Disposals

Dynamic reloads are supported by passing a cancellation token via `context.AddReloadToken(...)` inside the builder delegate. If the token triggers, the pipeline is rebuilt upon next access, while existing pipeline instances remain valid.

```csharp
var registry = new ResiliencePipelineRegistry<string>();

registry.TryAddBuilder("A", (builder, context) =>
{
    var cancellation = new CancellationTokenSource();

    // Register the source for potential external triggering
    RegisterCancellationSource(cancellation);

    // Add the reload token; note that an already cancelled token is disregarded
    context.AddReloadToken(cancellation.Token);

    // Configure your pipeline
    builder.AddRetry(new RetryStrategyOptions());

    context.OnPipelineDisposed(() => cancellation.Dispose());
});
```

Sources: [src/Snippets/Docs/ResiliencePipelineRegistry.cs:151-170](https://github.com/App-vNext/Polly/blob/main/src/Snippets/Docs/ResiliencePipelineRegistry.cs#L151-L170)

> [!WARNING]
> Tokens that are already canceled when passed to `context.AddReloadToken(...)` are ignored. 

Sources: [src/Snippets/Docs/ResiliencePipelineRegistry.cs:110](https://github.com/App-vNext/Polly/blob/main/src/Snippets/Docs/ResiliencePipelineRegistry.cs#L110), [src/Snippets/Docs/ResiliencePipelineRegistry.cs:160](https://github.com/App-vNext/Polly/blob/main/src/Snippets/Docs/ResiliencePipelineRegistry.cs#L160)

When the registry is disposed, any active pipelines derived from it will throw an `ObjectDisposedException` upon execution if resources require manual cleanup:

```csharp
var registry = new ResiliencePipelineRegistry<string>();

// This instance is valid even after reload.
ResiliencePipeline pipeline = registry
    .GetOrAddPipeline("A", (builder, context) => builder.AddTimeout(TimeSpan.FromSeconds(10)));

// Dispose the registry
registry.Dispose();

try
{
    pipeline.Execute(() => { });
}
catch (ObjectDisposedException)
{
    // Using a pipeline that was disposed by the registry
}
```

Sources: [src/Snippets/Docs/ResiliencePipelineRegistry.cs:126-143](https://github.com/App-vNext/Polly/blob/main/src/Snippets/Docs/ResiliencePipelineRegistry.cs#L126-L143)

## Performance and Execution Context

### Overview

Optimizing execution performance in Polly involves eliminating unnecessary heap allocations during frequent calls and leveraging structural features like `ResilienceContext`. Capturing outer-scope variables within execution lambdas causes closure allocations on every invocation. Passing state explicitly as an argument avoids this overhead by utilizing static lambdas.

```csharp
// This call allocates for each invocation since the "userId" variable is captured from the outer scope.
await resiliencePipeline.ExecuteAsync(
    cancellationToken => GetMemberAsync(userId, cancellationToken),
    cancellationToken);

// This approach uses a static lambda, avoiding allocations.
// The "userId" is passed to the execution via the state argument, and the lambda consumes it as the first
// parameter passed to the GetMemberAsync() method. In this case, userIdAsState and userId are the same value.
await resiliencePipeline.ExecuteAsync(
    static (userIdAsState, cancellationToken) => GetMemberAsync(userIdAsState, cancellationToken),
    userId,
    cancellationToken);
```

Sources: [src/Snippets/Docs/Performance.cs:17-32](https://github.com/App-vNext/Polly/blob/main/src/Snippets/Docs/Performance.cs#L17-L32)

### Configuring Exception Predicates

Using `PredicateBuilder` configures which exceptions a strategy handles, but switch expressions on exception outcomes offer optimal performance for high-throughput pipelines.

```csharp
// Here, PredicateBuilder is used to configure which exceptions the retry strategy should handle.
new ResiliencePipelineBuilder()
    .AddRetry(new()
    {
        ShouldHandle = new PredicateBuilder()
            .Handle<SomeExceptionType>()
            .Handle<InvalidOperationException>()
            .Handle<HttpRequestException>()
    })
    .Build();

// For optimal performance, it's recommended to use switch expressions instead of PredicateBuilder.
new ResiliencePipelineBuilder()
    .AddRetry(new()
    {
        ShouldHandle = args => args.Outcome.Exception switch
        {
            SomeExceptionType => PredicateResult.True(),
            InvalidOperationException => PredicateResult.True(),
            HttpRequestException => PredicateResult.True(),
            _ => PredicateResult.False()
        }
    })
    .Build();
```

Sources: [src/Snippets/Docs/Performance.cs:37-64](https://github.com/App-vNext/Polly/blob/main/src/Snippets/Docs/Performance.cs#L37-L64)

### Execution Outcome Handling and Context Pooling

The `ResilienceContext` class provides an execution-scoped instance that accompanies each execution across all strategies in a pipeline, serving to share state and facilitate information exchange. Because context instances are resource-intensive to create, the `ResilienceContextPool` enables renting, configuring, and returning instances to minimize allocation overhead.

```csharp
// Acquire a context from the pool
ResilienceContext context = ResilienceContextPool.Shared.Get(cancellationToken);

// Instead of wrapping pipeline execution with try-catch, use ExecuteOutcomeAsync(...).
// Certain strategies are optimized for this method, returning an exception instance without actually throwing it.
Outcome<Member> outcome = await pipeline.ExecuteOutcomeAsync(
    static async (context, state) =>
    {
        // The callback for ExecuteOutcomeAsync must return an Outcome<T> instance. Hence, some wrapping is needed.
        try
        {
            return Outcome.FromResult(await GetMemberAsync(state, context.CancellationToken));
        }
        catch (Exception e)
        {
            return Outcome.FromException<Member>(e);
        }
    },
    context,
    id);

// Handle exceptions using the Outcome<T> instance instead of try-catch.
if (outcome.Exception is not null)
{
    logger.LogWarning(outcome.Exception, "Failed to get member with id '{id}'.", id);
}

// Release the context back to the pool
ResilienceContextPool.Shared.Return(context);
```

Sources: [src/Snippets/Docs/Performance.cs:74-119](https://github.com/App-vNext/Polly/blob/main/src/Snippets/Docs/Performance.cs#L74-L119)

The `ResilienceContext` class exposes several properties: `OperationKey`, `CancellationToken`, `Properties` (an instance of `ResilienceProperties`), and `ContinueOnCapturedContext`. 

> [!TIP]
> When using a custom `ResilienceContext`, ensure that your usage is correct to avoid the context being treated as custom _state_ for the execution instead of as the _context_ for the execution. Otherwise, the delegate invoked by the resilience pipeline will be a different instance obtained from the shared pool, rather than the value specified for your execution.

Sources: [docs/advanced/resilience-context.md:5-16](https://github.com/App-vNext/Polly/blob/main/docs/advanced/resilience-context.md#L5-L16)

The pool offers several `Get` overloads to initialize properties upon retrieval:

```csharp
// Retrieve a context with a cancellation token
ResilienceContext context = ResilienceContextPool.Shared.Get(cancellationToken);

try
{
    // Retrieve a context with a specific operation key
    context = ResilienceContextPool.Shared.Get("my-operation-key", cancellationToken);

    // Retrieve a context with multiple properties
    context = ResilienceContextPool.Shared.Get(
        operationKey: "my-operation-key",
        continueOnCapturedContext: true,
        cancellationToken: cancellationToken);

    // Use the pool here
}
finally
{
    // Returning the context back to the pool is recommended, but not required as it reduces the allocations.
    // It is also OK to not return the context in case of exceptions, if you want to avoid try-catch blocks.
    ResilienceContextPool.Shared.Return(context);
}
```

Sources: [docs/advanced/resilience-context.md:115-140](https://github.com/App-vNext/Polly/blob/main/docs/advanced/resilience-context.md#L115-L140)

## Testing and Migration Patterns

### Overview

Testing resilience pipelines and mocking dependencies in Polly v8 leverages the `Polly.Testing` package and standard mocking libraries such as NSubstitute. When unit testing services that consume resilience pipelines via dependency injection, the `ResiliencePipelineProvider<TKey>` interface can be mocked directly to supply test pipelines. Additionally, pipelines support introspection via the `GetPipelineDescriptor()` extension method, enabling assertions on the configured strategies and their options without executing the pipeline.

```csharp
ResiliencePipelineProvider<string> pipelineProvider = Substitute.For<ResiliencePipelineProvider<string>>();

// Mock the pipeline provider to return an empty pipeline for testing
pipelineProvider
    .GetPipeline("my-pipeline")
    .Returns(ResiliencePipeline.Empty);

// Use the mocked pipeline provider in your code
var api = new MyApi(pipelineProvider);
```

Sources: [src/Snippets/Docs/Testing.cs:65-82](https://github.com/App-vNext/Polly/blob/main/src/Snippets/Docs/Testing.cs#L65-L82)

### Pipeline Inspection and Descriptors

The `GetPipelineDescriptor()` method inspects a built `ResiliencePipeline` or `ResiliencePipeline<T>` instance, returning a `ResiliencePipelineDescriptor` that exposes the ordered list of strategies and their associated options. This allows direct unit testing of pipeline composition, retry counts, timeout durations, and other strategy properties.

```csharp
// Build your resilience pipeline.
ResiliencePipeline pipeline = new ResiliencePipelineBuilder()
    .AddRetry(new RetryStrategyOptions
    {
        MaxRetryAttempts = 4
    })
    .AddTimeout(TimeSpan.FromSeconds(1))
    .Build();

// Retrieve the descriptor.
ResiliencePipelineDescriptor descriptor = pipeline.GetPipelineDescriptor();

// Check the pipeline's composition with the descriptor.
Assert.Equal(2, descriptor.Strategies.Count);

// Verify the retry settings.
var retryOptions = Assert.IsType<RetryStrategyOptions>(descriptor.Strategies[0].Options);
Assert.Equal(4, retryOptions.MaxRetryAttempts);

// Confirm the timeout settings.
var timeoutOptions = Assert.IsType<TimeoutStrategyOptions>(descriptor.Strategies[1].Options);
Assert.Equal(TimeSpan.FromSeconds(1), timeoutOptions.Timeout);
```

Sources: [src/Snippets/Docs/Testing.cs:13-41](https://github.com/App-vNext/Polly/blob/main/src/Snippets/Docs/Testing.cs#L13-L41)

Generic pipelines also support descriptor retrieval:

```csharp
// Construct your resilience pipeline.
ResiliencePipeline<string> pipeline = new ResiliencePipelineBuilder<string>()
    .AddRetry(new RetryStrategyOptions<string>
    {
        MaxRetryAttempts = 4
    })
    .AddTimeout(TimeSpan.FromSeconds(1))
    .Build();

// Obtain the descriptor.
ResiliencePipelineDescriptor descriptor = pipeline.GetPipelineDescriptor();
```

Sources: [src/Snippets/Docs/Testing.cs:43-63](https://github.com/App-vNext/Polly/blob/main/src/Snippets/Docs/Testing.cs#L43-L63)

### Migrating Legacy v7 Policies to v8 Strategies

Migrating from Polly v7 policy definitions to Polly v8 resilience pipelines replaces legacy interfaces (`ISyncPolicy`, `IAsyncPolicy`, `ISyncPolicy<T>`, `IAsyncPolicy<T>`) with `ResiliencePipeline` and `ResiliencePipeline<T>`. Pipeline builders such as `ResiliencePipelineBuilder` and `ResiliencePipelineBuilder<T>` configure strategies using options classes like `RetryStrategyOptions` and `RetryStrategyOptions<T>`.

| v7 Policy Type | v8 Resilience Pipeline Type | v7 Configuration Syntax | v8 Configuration Syntax |
| :--- | :--- | :--- | :--- |
| `ISyncPolicy` / `IAsyncPolicy` | `ResiliencePipeline` | `Policy.Handle<Exception>().WaitAndRetry(...)` | `new ResiliencePipelineBuilder().AddRetry(...)` |
| `ISyncPolicy<T>` / `IAsyncPolicy<T>` | `ResiliencePipeline<T>` | `Policy<T>.HandleResult(...).WaitAndRetry(...)` | `new ResiliencePipelineBuilder<T>().AddRetry(...)` |

Sources: [src/Snippets/Docs/Migration.Policies.cs:14-54](https://github.com/App-vNext/Polly/blob/main/src/Snippets/Docs/Migration.Policies.cs#L14-L54), [src/Snippets/Docs/Migration.Policies.cs:67-118](https://github.com/App-vNext/Polly/blob/main/src/Snippets/Docs/Migration.Policies.cs#L67-L118)

The following example demonstrates building a non-generic resilience pipeline with constant retry backoff in v8, replacing the v7 `WaitAndRetryAsync` setup:

```csharp
ResiliencePipeline pipeline = new ResiliencePipelineBuilder()
    .AddRetry(new RetryStrategyOptions
    {
        ShouldHandle = new PredicateBuilder().Handle<Exception>(),
        Delay = TimeSpan.FromSeconds(1),
        MaxRetryAttempts = 3,
        BackoffType = DelayBackoffType.Constant
    })
    .Build();

await pipeline.ExecuteAsync(static async token =>
{
    // Your code goes here
}, cancellationToken);
```

Sources: [src/Snippets/Docs/Migration.Policies.cs:67-87](https://github.com/App-vNext/Polly/blob/main/src/Snippets/Docs/Migration.Policies.cs#L67-L87)

For generic pipelines handling results (such as verifying HTTP response status codes), `ResiliencePipelineBuilder<HttpResponseMessage>` uses `RetryStrategyOptions<HttpResponseMessage>` alongside `PredicateBuilder<HttpResponseMessage>`:

```csharp
ResiliencePipeline<HttpResponseMessage> pipelineT = new ResiliencePipelineBuilder<HttpResponseMessage>()
    .AddRetry(new RetryStrategyOptions<HttpResponseMessage>
    {
        ShouldHandle = new PredicateBuilder<HttpResponseMessage>()
            .Handle<Exception>()
            .HandleResult(static result => !result.IsSuccessStatusCode),
        Delay = TimeSpan.FromSeconds(1),
        MaxRetryAttempts = 3,
        BackoffType = DelayBackoffType.Constant
    })
    .Build();

await pipelineT.ExecuteAsync(static async token =>
{
    return await GetResponseAsync(token);
}, cancellationToken);
```

Sources: [src/Snippets/Docs/Migration.Policies.cs:93-118](https://github.com/App-vNext/Polly/blob/main/src/Snippets/Docs/Migration.Policies.cs#L93-L118)

## Related

- [[Overview]]
- [[Resilience Pipelines]]
- [[Dependency Injection Integration]]

