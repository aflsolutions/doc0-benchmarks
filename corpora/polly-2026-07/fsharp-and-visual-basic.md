# FSharp and Visual Basic

<details>
<summary>Relevant source files</summary>

The following files were used as context for generating this wiki page:

- [README.md](https://github.com/App-vNext/Polly/blob/main/README.md)
- [docs/advanced/use-with-fsharp-and-visual-basic.md](https://github.com/App-vNext/Polly/blob/main/docs/advanced/use-with-fsharp-and-visual-basic.md)
- [src/Snippets/Docs/ResiliencePipelines.cs](https://github.com/App-vNext/Polly/blob/main/src/Snippets/Docs/ResiliencePipelines.cs)
- [docs/community/resources.md](https://github.com/App-vNext/Polly/blob/main/docs/community/resources.md)
- [docs/community/http-client-integrations.md](https://github.com/App-vNext/Polly/blob/main/docs/community/http-client-integrations.md)
- [docs/pipelines/index.md](https://github.com/App-vNext/Polly/blob/main/docs/pipelines/index.md)
- [docs/getting-started.md](https://github.com/App-vNext/Polly/blob/main/docs/getting-started.md)
- [AGENTS.md](https://github.com/App-vNext/Polly/blob/main/AGENTS.md)
- [docs/index.md](https://github.com/App-vNext/Polly/blob/main/docs/index.md)
- [src/Snippets/Docs/Readme.cs](https://github.com/App-vNext/Polly/blob/main/src/Snippets/Docs/Readme.cs)
- [src/Snippets/Docs/Migration.Interoperability.cs](https://github.com/App-vNext/Polly/blob/main/src/Snippets/Docs/Migration.Interoperability.cs)
- [src/Polly.Core/README.md](https://github.com/App-vNext/Polly/blob/main/src/Polly.Core/README.md)
- [docs/strategies/index.md](https://github.com/App-vNext/Polly/blob/main/docs/strategies/index.md)
- [docs/general.md](https://github.com/App-vNext/Polly/blob/main/docs/general.md)
- [package-readme.md](https://github.com/App-vNext/Polly/blob/main/package-readme.md)
</details>

## Overview

Integrating Polly into F# and Visual Basic .NET applications requires navigating language-specific runtime differences, particularly regarding asynchronous return types and delegate execution models. Because Polly v8 was designed to be optimized for high performance and uses `ValueTask` and `ValueTask<T>` to avoid unnecessary allocations, languages like F# and VB.NET cannot directly await a method returning `ValueTask` or `ValueTask<T>`.

Sources: [docs/advanced/use-with-fsharp-and-visual-basic.md:3-9](https://github.com/App-vNext/Polly/blob/main/docs/advanced/use-with-fsharp-and-visual-basic.md#L3-L9)

To work around this limitation, developers can use language-specific computation builders or the `AsTask()` conversion method to convert `ValueTask` instances to `Task` objects, enabling seamless pipeline composition and execution across F# and Visual Basic.

Sources: [docs/advanced/use-with-fsharp-and-visual-basic.md:14-16](https://github.com/App-vNext/Polly/blob/main/docs/advanced/use-with-fsharp-and-visual-basic.md#L14-L16)

## Language Interoperability Overview

### Overview

Asynchronous methods in the Polly.Core API return either `ValueTask` or `ValueTask<T>` instead of `Task` or `Task<T>` to optimize for high performance and eliminate unnecessary allocations.

Sources: [docs/advanced/use-with-fsharp-and-visual-basic.md:3-5](https://github.com/App-vNext/Polly/blob/main/docs/advanced/use-with-fsharp-and-visual-basic.md#L3-L5), [src/Polly.Core/README.md:25-31](https://github.com/App-vNext/Polly/blob/main/src/Polly.Core/README.md#L25-L31)

### Asynchronous Type Compatibility

In Visual Basic and F#, it is not possible to directly await a method that returns `ValueTask` or `ValueTask<T>`; instead, they require the use of `Task` and `Task<T>`. A proposal to support awaiting `ValueTask` can be found in the F# language design repository under [RFC FS-1021 Discussion](https://github.com/fsharp/fslang-design/discussions/118).

Sources: [docs/advanced/use-with-fsharp-and-visual-basic.md:7-12](https://github.com/App-vNext/Polly/blob/main/docs/advanced/use-with-fsharp-and-visual-basic.md#L7-L12)

> [!NOTE]
> Converting a `ValueTask` to a `Task` via `AsTask()` introduces an allocation and makes the code slightly more cumbersome compared to C#.
> Sources: [docs/advanced/use-with-fsharp-and-visual-basic.md:14-16](https://github.com/App-vNext/Polly/blob/main/docs/advanced/use-with-fsharp-and-visual-basic.md#L14-L16)

## Building Pipelines in FSharp and VB

### Overview

The `ResiliencePipelineBuilder` creates a `ResiliencePipeline` that can be executed synchronously or asynchronously and for both void and result-returning user callbacks.

Sources: [docs/advanced/use-with-fsharp-and-visual-basic.md:38-45](https://github.com/App-vNext/Polly/blob/main/docs/advanced/use-with-fsharp-and-visual-basic.md#L38-L45)

### Pipeline Construction in F#

In F#, pipelines are constructed fluently by invoking `ResiliencePipelineBuilder()` and chaining strategy additions such as `.AddTimeout(...)` before calling `.Build()`.

Sources: [docs/advanced/use-with-fsharp-and-visual-basic.md:38-45](https://github.com/App-vNext/Polly/blob/main/docs/advanced/use-with-fsharp-and-visual-basic.md#L38-L45)

```fsharp
let pipeline =
    ResiliencePipelineBuilder()
        .AddTimeout(TimeSpan.FromSeconds(5))
        .Build()
```
Sources: [docs/advanced/use-with-fsharp-and-visual-basic.md:41-44](https://github.com/App-vNext/Polly/blob/main/docs/advanced/use-with-fsharp-and-visual-basic.md#L41-L44)

> [!TIP]
> When defining asynchronous callbacks in F#, using the `valueTask` builder from the `IcedTasks` library makes working with `ValueTask` seamless.
> Sources: [docs/advanced/use-with-fsharp-and-visual-basic.md:52-53](https://github.com/App-vNext/Polly/blob/main/docs/advanced/use-with-fsharp-and-visual-basic.md#L52-L53)

### Pipeline Construction in Visual Basic

Visual Basic constructs pipelines using `New ResiliencePipelineBuilder()` combined with configuration methods and `.Build()`.

Sources: [docs/advanced/use-with-fsharp-and-visual-basic.md:97-100](https://github.com/App-vNext/Polly/blob/main/docs/advanced/use-with-fsharp-and-visual-basic.md#L97-L100)

```vb
Dim pipeline = New ResiliencePipelineBuilder().AddTimeout(TimeSpan.FromSeconds(5)).Build()
```
Sources: [docs/advanced/use-with-fsharp-and-visual-basic.md:100](https://github.com/App-vNext/Polly/blob/main/docs/advanced/use-with-fsharp-and-visual-basic.md#L100)

> [!WARNING]
> VB.NET cannot await `ValueTask` directly; methods returning `ValueTask` must be wrapped and converted using `.AsTask()`.
> Sources: [docs/advanced/use-with-fsharp-and-visual-basic.md:108-114](https://github.com/App-vNext/Polly/blob/main/docs/advanced/use-with-fsharp-and-visual-basic.md#L108-L114)

## Executing Delegates Across Languages

### Overview

Pipeline execution supports both synchronous and asynchronous callbacks for actions and result-returning functions. F# and Visual Basic handle delegate parameters and task conversions according to their respective runtime capabilities.

Sources: [docs/advanced/use-with-fsharp-and-visual-basic.md:38-45](https://github.com/App-vNext/Polly/blob/main/docs/advanced/use-with-fsharp-and-visual-basic.md#L38-L45)

### Delegate Execution in F#

In F#, synchronous execution uses simple lambda arguments, whereas asynchronous execution invokes `pipeline.ExecuteAsync()` supplying a `valueTask` block that yields a `ValueTask`.

Sources: [docs/advanced/use-with-fsharp-and-visual-basic.md:48-62](https://github.com/App-vNext/Polly/blob/main/docs/advanced/use-with-fsharp-and-visual-basic.md#L48-L62)

```fsharp
// Synchronously
pipeline.Execute(fun () -> printfn "Hello, world!")

// Asynchronously
do! pipeline.ExecuteAsync(
    fun token ->
        valueTask {
            printfn "Hello, world! Waiting for 2 seconds..."
            do! Task.Delay(1000, token)
            printfn "Wait complete."
        }
    , token
)
```
Sources: [docs/advanced/use-with-fsharp-and-visual-basic.md:48-62](https://github.com/App-vNext/Polly/blob/main/docs/advanced/use-with-fsharp-and-visual-basic.md#L48-L62)

### Delegate Execution in Visual Basic

Visual Basic executes callbacks via `Sub` and `Function` lambdas. Asynchronous calls wrap the inner task in `New ValueTask(...)` and append `.AsTask()` to the result of `ExecuteAsync()` to allow standard `Await` consumption.

Sources: [docs/advanced/use-with-fsharp-and-visual-basic.md:103-114](https://github.com/App-vNext/Polly/blob/main/docs/advanced/use-with-fsharp-and-visual-basic.md#L103-L114)

```vb
' Synchronously
pipeline.Execute(Sub()
                     Console.WriteLine("Hello, world!")
                 End Sub)

' Asynchronously
Await pipeline.ExecuteAsync(Function(token)
                                Return New ValueTask(GreetAndWaitAsync(token))
                            End Function,
                            CancellationToken.None).AsTask()
```
Sources: [docs/advanced/use-with-fsharp-and-visual-basic.md:103-114](https://github.com/App-vNext/Polly/blob/main/docs/advanced/use-with-fsharp-and-visual-basic.md#L103-L114)

## Dependency Injection and Registry Setup

### Overview

Pipelines can be registered into an `IServiceCollection` using name-based builders and subsequently resolved via providers for consumption across application boundaries.

Sources: [src/Snippets/Docs/Readme.cs:31-39](https://github.com/App-vNext/Polly/blob/main/src/Snippets/Docs/Readme.cs#L31-L39)

### Registering and Resolving Pipelines

Using `Polly.Extensions`, you can define resilience pipelines in service configuration code and retrieve them dynamically using `ResiliencePipelineProvider<string>`.

Sources: [src/Snippets/Docs/Readme.cs:31-45](https://github.com/App-vNext/Polly/blob/main/src/Snippets/Docs/Readme.cs#L31-L45)

```csharp
var services = new ServiceCollection();

services.AddResiliencePipeline("my-pipeline", builder =>
{
    builder
        .AddRetry(new RetryStrategyOptions())
        .AddTimeout(TimeSpan.FromSeconds(10));
});

var serviceProvider = services.BuildServiceProvider();
var pipelineProvider = serviceProvider.GetRequiredService<ResiliencePipelineProvider<string>>();
ResiliencePipeline pipeline = pipelineProvider.GetPipeline("my-pipeline");
```
Sources: [src/Snippets/Docs/Readme.cs:31-48](https://github.com/App-vNext/Polly/blob/main/src/Snippets/Docs/Readme.cs#L31-L48)

> [!NOTE]
> Keyed service retrieval is also supported via `serviceProvider.GetRequiredKeyedService<ResiliencePipeline>("my-pipeline")`.
> Sources: [src/Snippets/Docs/Readme.cs:51](https://github.com/App-vNext/Polly/blob/main/src/Snippets/Docs/Readme.cs#L51)

## Configuring Strategy Options

### Overview

Resilience strategies accept configuration options such as `RetryStrategyOptions` and `TimeoutStrategyOptions` to dictate retry counts, backoff types, jitter factors, and timeout thresholds.

Sources: [README.md:143-157](https://github.com/App-vNext/Polly/blob/main/README.md#L143-L157)

### Configuring Retry Parameters

Strategy options control execution behavior, including exception predicates and delay generation strategies.

Sources: [README.md:143-157](https://github.com/App-vNext/Polly/blob/main/README.md#L143-L157)

```csharp
var optionsComplex = new RetryStrategyOptions
{
    ShouldHandle = new PredicateBuilder().Handle<SomeExceptionType>(),
    BackoffType = DelayBackoffType.Exponential,
    UseJitter = true,
    MaxRetryAttempts = 4,
    Delay = TimeSpan.FromSeconds(3),
};
```
Sources: [README.md:143-157](https://github.com/App-vNext/Polly/blob/main/README.md#L143-L157)

> [!IMPORTANT]
> Configuration options are automatically validated by Polly and come with sensible defaults, so properties only need explicit configuration when customization is required.
> Sources: [docs/strategies/index.md:59-60](https://github.com/App-vNext/Polly/blob/main/docs/strategies/index.md#L59-L60)

## Related

- [[Quick Start]]

