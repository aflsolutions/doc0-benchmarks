# Overview

<details>
<summary>Relevant source files</summary>

The following files were used as context for generating this wiki page:

- [README.md](https://github.com/App-vNext/Polly/blob/main/README.md)
- [docs/strategies/index.md](https://github.com/App-vNext/Polly/blob/main/docs/strategies/index.md)
- [docs/chaos/index.md](https://github.com/App-vNext/Polly/blob/main/docs/chaos/index.md)
- [AGENTS.md](https://github.com/App-vNext/Polly/blob/main/AGENTS.md)
- [docs/index.md](https://github.com/App-vNext/Polly/blob/main/docs/index.md)
- [docs/community/resources.md](https://github.com/App-vNext/Polly/blob/main/docs/community/resources.md)
- [docs/getting-started.md](https://github.com/App-vNext/Polly/blob/main/docs/getting-started.md)
- [docs/pipelines/index.md](https://github.com/App-vNext/Polly/blob/main/docs/pipelines/index.md)
- [docs/strategies/retry.md](https://github.com/App-vNext/Polly/blob/main/docs/strategies/retry.md)
- [package-readme.md](https://github.com/App-vNext/Polly/blob/main/package-readme.md)
- [src/Polly.Core/README.md](https://github.com/App-vNext/Polly/blob/main/src/Polly.Core/README.md)
- [docs/extensibility/index.md](https://github.com/App-vNext/Polly/blob/main/docs/extensibility/index.md)
- [docs/general.md](https://github.com/App-vNext/Polly/blob/main/docs/general.md)
- [src/Polly.Extensions/README.md](https://github.com/App-vNext/Polly/blob/main/src/Polly.Extensions/README.md)
- [docs/community/libraries-and-contributions.md](https://github.com/App-vNext/Polly/blob/main/docs/community/libraries-and-contributions.md)
- [src/Polly/Policy.cs](https://github.com/App-vNext/Polly/blob/main/src/Polly/Policy.cs)
</details>

## Overview

Polly is a robust .NET resilience and transient-fault-handling library designed to help developers gracefully manage service interruptions, transient errors, and system overloads. At its core, Polly allows developers to compose and execute robust resilience pipelines that wrap user callbacks with various reactive and proactive strategies, such as retries, circuit breakers, timeouts, rate limiters, hedging, and fallbacks. 
Sources: [README.md:3-3](https://github.com/App-vNext/Polly/blob/main/README.md#L3-L3)

The architecture centers around modern V8 core abstractions like `ResiliencePipeline` and fluent pipeline builders, while retaining support for legacy v7 policy patterns. Through modular extensions, dependency injection containers, and integrated telemetry, Polly provides production-ready mechanisms to inspect, test, and customize fault-handling behavior across complex distributed applications.
Sources: [README.md:28-32](https://github.com/App-vNext/Polly/blob/main/README.md#L28-L32), [AGENTS.md:40-48](https://github.com/App-vNext/Polly/blob/main/AGENTS.md#L40-L48)

## Public API Surface and Architecture

### Overview

The architecture of Polly is centered around the unified, non-allocating V8 resilience API, moving away from fragmented policy hierarchies toward streamlined pipeline abstractions. At the heart of this architecture lies the `ResiliencePipeline` class and its generic counterpart `ResiliencePipeline<T>`, which are responsible for executing user-provided callbacks wrapped in one or more resilience strategies. 
Sources: [src/Polly.Core/README.md:3-3](https://github.com/App-vNext/Polly/blob/main/src/Polly.Core/README.md#L3-L3), [src/Polly.Core/README.md:57-58](https://github.com/App-vNext/Polly/blob/main/src/Polly.Core/README.md#L57-L58)

### Core V8 Components

The V8 API replaces the disparate Polly v7 policy abstractions (`ISyncPolicy`, `IAsyncPolicy`, `ISyncPolicy<T>`, and `IAsyncPolicy<T>`) with a single, highly performant `ResiliencePipeline` execution engine. The core execution surface supports synchronous and asynchronous callbacks with or without return values, accepting execution contexts and cancellation tokens.
Sources: [src/Polly.Core/README.md:3-9](https://github.com/App-vNext/Polly/blob/main/src/Polly.Core/README.md#L3-L9), [src/Polly.Core/README.md:48-54](https://github.com/App-vNext/Polly/blob/main/src/Polly.Core/README.md#L48-L54)

```csharp
public abstract class ResiliencePipeline
{
    public void Execute(Action callback);

    public TResult Execute<TResult>(Func<TResult> callback);

    public Task ExecuteAsync(
        Func<CancellationToken, Task> callback,
        CancellationToken cancellationToken = default);

    public Task<TResult> ExecuteAsync(
        Func<CancellationToken, Task<TResult>> callback,
        CancellationToken cancellationToken = default);

    public ValueTask ExecuteAsync(
        Func<CancellationToken, ValueTask> callback,
        CancellationToken cancellationToken = default);

    public ValueTask<TResult> ExecuteAsync(
        Func<CancellationToken, ValueTask<TResult>> callback,
        CancellationToken cancellationToken = default);
}
```
Sources: [src/Polly.Core/README.md:11-32](https://github.com/App-vNext/Polly/blob/main/src/Polly.Core/README.md#L11-L32)

Execution metadata and ambient state flow through `ResilienceContext`, which encapsulates the operation key, cancellation token, execution flow flags, and custom extensible properties.
Sources: [src/Polly.Core/README.md:37-47](https://github.com/App-vNext/Polly/blob/main/src/Polly.Core/README.md#L37-L47)

```csharp
public sealed class ResilienceContext
{
    public string? OperationKey { get; }
    public CancellationToken CancellationToken { get; }
    public bool ContinueOnCapturedContext { get; }
    public ResilienceProperties Properties { get; }
}
```
Sources: [src/Polly.Core/README.md:39-47](https://github.com/App-vNext/Polly/blob/main/src/Polly.Core/README.md#L39-L47)

> [!NOTE]
> `ResiliencePipeline<T>` is a specialized pipeline class optimized for scenarios where callers deal exclusively with a single result type `T`, eliminating boxing overhead during pipeline execution.
> Sources: [src/Polly.Core/README.md:56-58](https://github.com/App-vNext/Polly/blob/main/src/Polly.Core/README.md#L56-L58)

### Legacy Policy Abstractions

To maintain backwards compatibility and support migration from older codebases, Polly preserves legacy API constructs in dedicated packages. The `Polly` NuGet package houses the legacy API exposed by versions before v8, including abstract base classes such as `Policy` which extends `PolicyBase` to handle transient exceptions across synchronous delegates using exception predicates or `PolicyBuilder` instances.
Sources: [README.md:32-32](https://github.com/App-vNext/Polly/blob/main/README.md#L32-L32), [src/Polly/Policy.cs:4-25](https://github.com/App-vNext/Polly/blob/main/src/Polly/Policy.cs#L4-L25)

## Resilience Pipeline Configuration and Execution

### Overview

Resilience pipelines combine one or more resilience strategies, such as retry, timeout, and concurrency limiters, into a unified execution flow. Using `ResiliencePipelineBuilder`, strategies are assembled in order before calling `.Build()` to generate an immutable, executable pipeline instance.
Sources: [docs/getting-started.md:3-19](https://github.com/App-vNext/Polly/blob/main/docs/getting-started.md#L3-L19), [docs/pipelines/index.md:3-14](https://github.com/App-vNext/Polly/blob/main/docs/pipelines/index.md#L3-L14)

```csharp
ResiliencePipeline pipeline = new ResiliencePipelineBuilder()
    .AddRetry(new RetryStrategyOptions())
    .AddTimeout(TimeSpan.FromSeconds(10))
    .Build();

await pipeline.ExecuteAsync(static async token => { /* Custom logic */ }, cancellationToken);
```
Sources: [docs/getting-started.md:16-23](https://github.com/App-vNext/Polly/blob/main/docs/getting-started.md#L16-L23)

Pipelines can be registered and resolved through dependency injection using `IServiceCollection` extensions from the `Polly.Extensions` package and retrieved via `ResiliencePipelineProvider<string>`.
Sources: [docs/getting-started.md:32-63](https://github.com/App-vNext/Polly/blob/main/docs/getting-started.md#L32-L63), [docs/pipelines/index.md:65-76](https://github.com/App-vNext/Polly/blob/main/docs/pipelines/index.md#L65-L76)

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
Sources: [docs/getting-started.md:42-59](https://github.com/App-vNext/Polly/blob/main/docs/getting-started.md#L42-L59)

> [!NOTE]
> Asynchronous execution methods in the Polly API return `ValueTask` or `ValueTask<T>` instead of `Task` or `Task<T>` to optimize performance in high-throughput paths.
> Sources: [docs/getting-started.md:26-27](https://github.com/App-vNext/Polly/blob/main/docs/getting-started.md#L26-L27)

### Execution Flow and Outcome Handling

When executing a pipeline, the request flows through each strategy layer. The execution mechanics can bypass exception throwing by utilizing `ExecuteOutcomeAsync(...)`, which captures both results and exceptions inside an `Outcome<T>` struct.
Sources: [docs/pipelines/index.md:91-96](https://github.com/App-vNext/Polly/blob/main/docs/pipelines/index.md#L91-L96)

```csharp
ResilienceContext context = ResilienceContextPool.Shared.Get();

Outcome<bool> outcome = await pipeline.ExecuteOutcomeAsync(
    static async (context, state) =>
    {
        try
        {
            await MyMethodAsync(context.CancellationToken);
            return Outcome.FromResult(true);
        }
        catch (Exception e)
        {
            return Outcome.FromException<bool>(e);
        }
    },
    context,
    "my-state");

ResilienceContextPool.Shared.Return(context);
```
Sources: [docs/pipelines/index.md:96-122](https://github.com/App-vNext/Polly/blob/main/docs/pipelines/index.md#L96-L122)

> [!TIP]
> Use the `state` parameter in execution methods to pass caller state without allocating closures, while using `ResilienceContext` to share data across strategy delegates or retry attempts.
> Sources: [docs/pipelines/index.md:140-161](https://github.com/App-vNext/Polly/blob/main/docs/pipelines/index.md#L140-L161)

### Pipeline Variants and Special Constructs

Specialized pipeline constructs handle test scenarios and specific typing requirements without strategy overhead or boxing costs.

| Construct / Property | Type | Purpose |
| :--- | :--- | :--- |
| `ResiliencePipeline.Empty` | `ResiliencePipeline` | An empty pipeline lacking resilience strategies, useful for test scenarios. |
| `ResiliencePipeline<T>.Empty` | `ResiliencePipeline<T>` | A generic empty pipeline for typed test scenarios. |
| `Outcome<T>` | Struct | Stores execution results or exceptions to avoid throwing exceptions. |
| `ResilienceContext` | Class | Manages operation keys, cancellation tokens, and property bags. |

Sources: [src/Polly.Core/README.md:39-47](https://github.com/App-vNext/Polly/blob/main/src/Polly.Core/README.md#L39-L47), [docs/pipelines/index.md:81-93](https://github.com/App-vNext/Polly/blob/main/docs/pipelines/index.md#L81-L93)

## Reactive and Proactive Resilience Strategies

### Overview

Polly categorizes built-in resilience strategies into two principal groups based on their runtime behavior: **Reactive** and **Proactive**. Reactive strategies handle specific exceptions thrown or result objects returned by executed callbacks, whereas proactive strategies make independent decisions to cancel or reject execution prior to or during invocation without reacting to specific callback exceptions.
Sources: [docs/strategies/index.md:5-9](https://github.com/App-vNext/Polly/blob/main/docs/strategies/index.md#L5-L9)

| Group | Strategy | Premise | Primary Mechanism |
| :--- | :--- | :--- | :--- |
| Reactive | Retry | Many faults are transient and may self-correct after a short delay. | Re-executes failed callbacks up to a maximum attempt count with calculated delays. |
| Reactive | Circuit-breaker | Failing fast protects a struggling system and helps it recover. | Breaks the circuit (blocking executions) when faults exceed a configured threshold. |
| Reactive | Fallback | Plan actions for when things fail. | Returns an alternative value or executes an alternative action upon failure. |
| Reactive | Hedging | Slow operations can be mitigated by parallelism. | Executes parallel actions when operations are slow and waits for the fastest result. |
| Proactive | Timeout | Beyond a specified wait duration, success is unlikely. | Guarantees the caller does not wait beyond the configured timeout limit. |
| Proactive | Rate Limiter | Limiting request rates controls load on downstream services. | Constrains execution frequency to prevent exceeding specified rate limits. |

Sources: [docs/strategies/index.md:12-27](https://github.com/App-vNext/Polly/blob/main/docs/strategies/index.md#L12-L27)

---

### Built-in Strategy Configuration and Fault Handling

Reactive strategies expose the `ShouldHandle` predicate property, allowing precise evaluation of whether a fault or result requires intervention. Predicates can be configured manually using asynchronous delegates or switch expressions with `Args<TResult>`, or via utility builder classes like `PredicateBuilder` and `PredicateBuilder<TResult>`.
Sources: [docs/strategies/index.md:62-69](https://github.com/App-vNext/Polly/blob/main/docs/strategies/index.md#L62-L69)

```csharp
var options = new RetryStrategyOptions<HttpResponseMessage>
{
    ShouldHandle = new PredicateBuilder<HttpResponseMessage>()
        .HandleResult(response => !response.IsSuccessStatusCode)
        .Handle<HttpRequestException>()
        .Handle<TimeoutRejectedException>()
};
```
Sources: [docs/strategies/index.md:137-144](https://github.com/App-vNext/Polly/blob/main/docs/strategies/index.md#L137-L144)

> [!NOTE]
> Using `PredicateBuilder` registers individual predicates sequentially on each method call, introducing a minor performance overhead during outcome evaluation compared to manual switch expression delegates.
> Sources: [docs/strategies/index.md:152-153](https://github.com/App-vNext/Polly/blob/main/docs/strategies/index.md#L152-L153)

---

### Retry Strategy Mechanics and Delay Calculation

The retry strategy re-executes failed callbacks after waiting for calculated backoff intervals. When `ShouldHandle` returns `true` and attempt counts remain within `MaxRetryAttempts`, the retry strategy computes the next delay using configured parameters including `BackoffType`, `Delay`, `MaxDelay`, `DelayGenerator`, and `UseJitter`.
Sources: [docs/strategies/retry.md:14-15](https://github.com/App-vNext/Polly/blob/main/docs/strategies/retry.md#L14-L15), [docs/strategies/retry.md:175-185](https://github.com/App-vNext/Polly/blob/main/docs/strategies/retry.md#L175-L185)

| Property | Default Value | Description |
| :--- | :--- | :--- |
| `ShouldHandle` | Any exceptions other than `OperationCanceledException` | Predicate determining handled results or exceptions. |
| `MaxRetryAttempts` | `3` | Maximum retry attempts executed in addition to the original call. |
| `BackoffType` | `DelayBackoffType.Constant` | Algorithm type used to generate delays between attempts (`Constant`, `Linear`, or `Exponential`). |
| `Delay` | `2 seconds` | Base delay duration between retry attempts. |
| `MaxDelay` | `null` | Optional ceiling cap for calculated retry delays. |
| `UseJitter` | `false` | When `true`, adds randomized factors to retry delays. |
| `DelayGenerator` | `null` | Dynamic delegate for runtime delay calculation based on attempt data. |
| `OnRetry` | `null` | Callback executed prior to waiting for the next retry attempt. |

Sources: [docs/strategies/retry.md:103-112](https://github.com/App-vNext/Polly/blob/main/docs/strategies/retry.md#L103-L112)

> [!WARNING]
> Jitter calculations based on exponential backoff utilize the `DecorrelatedJitterBackoffV2` formula, whereas constant and linear backoffs add a random value between -25% and +25% of the calculated base delay.
> Sources: [docs/strategies/retry.md:185-186](https://github.com/App-vNext/Polly/blob/main/docs/strategies/retry.md#L185-L186)

---

### Strategy Options and Telemetry Integration

Resilience strategy builders accept configuration options classes such as `RetryStrategyOptions` and `RetryStrategyOptions<T>` across pipeline builders. Telemetry events such as `ExecutionAttempt` and `OnRetry` are emitted with severity levels ranging from `Information` to `Error` depending on execution success and retry exhaustion.
Sources: [docs/strategies/index.md:41-44](https://github.com/App-vNext/Polly/blob/main/docs/strategies/index.md#L41-L44), [docs/strategies/retry.md:5-7](https://github.com/App-vNext/Polly/blob/main/docs/strategies/retry.md#L5-L7), [docs/strategies/retry.md:116-121](https://github.com/App-vNext/Polly/blob/main/docs/strategies/retry.md#L116-L121)

```csharp
var complexRetryOptions = new RetryStrategyOptions
{
    ShouldHandle = new PredicateBuilder().Handle<HttpRequestException>(),
    BackoffType = DelayBackoffType.Exponential,
    UseJitter = true,
    MaxRetryAttempts = 4,
    Delay = TimeSpan.FromSeconds(3),
    OnRetry = static args =>
    {
        Console.WriteLine("Retry attempt {0} executed.", args.AttemptNumber);
        return default;
    }
};

ResiliencePipeline pipeline = new ResiliencePipelineBuilder()
    .AddRetry(complexRetryOptions)
    .Build();
```
Sources: [docs/strategies/retry.md:32-87](https://github.com/App-vNext/Polly/blob/main/docs/strategies/retry.md#L32-L87), [docs/strategies/retry.md:96-96](https://github.com/App-vNext/Polly/blob/main/docs/strategies/retry.md#L96-L96)

## Chaos Engineering Fault Injection

### Overview

Simmy integrates chaos engineering and simulated fault injection directly into Polly v8 pipelines via the `ChaosStrategy` architecture. Chaos strategies serve as the minimum unit of chaos, operating as specialized resilience strategies that selectively inject faults, latencies, fake outcomes, or custom behaviors during execution. By placing chaos strategies at the end of a resilience pipeline, executions flow through standard protective strategies like retries and circuit breakers before encountering injected failures, allowing developers to test resilience configurations deterministically.
Sources: [docs/chaos/index.md:11-14](https://github.com/App-vNext/Polly/blob/main/docs/chaos/index.md#L11-L14), [docs/chaos/index.md:125-127](https://github.com/App-vNext/Polly/blob/main/docs/chaos/index.md#L125-L127), [docs/chaos/index.md:168-170](https://github.com/App-vNext/Polly/blob/main/docs/chaos/index.md#L168-L170)

### Built-In Chaos Strategies and Options

Simmy provides four core built-in strategies categorized by their execution phase: `Fault` (proactive injection of exceptions), `Outcome` (reactive injection of fake results or exceptions), `Latency` (proactive injection of execution delays), and `Behavior` (proactive injection of custom asynchronous behaviors). All strategy options inherit from `ChaosStrategyOptions`, which governs activation and injection rates.
Sources: [docs/chaos/index.md:175-183](https://github.com/App-vNext/Polly/blob/main/docs/chaos/index.md#L175-L183)

| Property | Default Value | Description |
| :--- | :--- | :--- |
| `InjectionRate` | `0.001` | Decimal between 0 and 1 defining the random proportion of executions subjected to chaos. |
| `InjectionRateGenerator` | `null` | Dynamic delegate generating the injection rate for a given execution context. |
| `Enabled` | `true` | Determines whether the strategy is active. |
| `EnabledGenerator` | `null` | Dynamic delegate indicating whether the strategy is enabled for a given execution context. |

Sources: [docs/chaos/index.md:191-195](https://github.com/App-vNext/Polly/blob/main/docs/chaos/index.md#L191-L195)

> [!IMPORTANT]
> Unlike legacy Simmy versions where monkey policies required explicit opt-in, Polly v8 chaos strategies are enabled by default. To disable a strategy, you must explicitly configure `Enabled = false` or provide an `EnabledGenerator`.
> Sources: [docs/chaos/index.md:185-188](https://github.com/App-vNext/Polly/blob/main/docs/chaos/index.md#L185-L188)

> [!NOTE]
> When both `InjectionRate` and `InjectionRateGenerator` are specified, `InjectionRate` is ignored. Similarly, specifying both `Enabled` and `EnabledGenerator` causes `Enabled` to be ignored.
> Sources: [docs/chaos/index.md:197-200](https://github.com/App-vNext/Polly/blob/main/docs/chaos/index.md#L197-L200)

### Execution Walkthrough and Pipeline Integration

When a caller invokes `ExecuteAsync` on a resilience pipeline configured with Simmy, execution flows sequentially through the strategy chain: `Caller` → `Pipeline` → `ChaosFault` → `ChaosLatency` → `ChaosOutcome` → `ChaosBehavior` → `DecoratedUserCallback`. Each strategy evaluates its injection criteria independently. For instance, the fault strategy determines injection, and if triggered, short-circuits execution by throwing an exception back to the caller; otherwise, it passes control to the latency strategy via `ExecuteCore`.
Sources: [docs/chaos/index.md:61-121](https://github.com/App-vNext/Polly/blob/main/docs/chaos/index.md#L61-L121)

```csharp
var builder = new ResiliencePipelineBuilder<HttpResponseMessage>();

builder
    .AddRetry(new RetryStrategyOptions<HttpResponseMessage>())
    .AddChaosFault(0.02, () => new InvalidOperationException("Injected by chaos strategy!"))
    .AddChaosLatency(0.50, TimeSpan.FromMinutes(1))
    .AddChaosOutcome(0.10, () => new HttpResponseMessage(System.Net.HttpStatusCode.InternalServerError))
    .AddChaosBehavior(0.01, cancellationToken => RestartRedisAsync(cancellationToken));
```
Sources: [docs/chaos/index.md:21-47](https://github.com/App-vNext/Polly/blob/main/docs/chaos/index.md#L21-L47)

## Extensions Ecosystem and Telemetry

### Overview

The `Polly.Extensions` package extends core resilience capabilities by integrating natively with standard .NET dependency injection infrastructure and providing built-in telemetry mechanisms. These features allow applications to seamlessly register resilience pipelines into an `IServiceCollection` and translate internal execution events into structured diagnostics, logs, and metrics.
Sources: [src/Polly.Extensions/README.md:1-7](https://github.com/App-vNext/Polly/blob/main/src/Polly.Extensions/README.md#L1-L7)

### Dependency Injection and Telemetry Integration

The extensions package provides core integration features designed to bridge Polly pipelines with broader application infrastructure:

- Incorporates dependency injection support and integrates directly with `IServiceCollection`.
- Offers telemetry support by implementing the `TelemetryListener` component, which translates native Polly execution events into logs and metrics.
Sources: [src/Polly.Extensions/README.md:3-7](https://github.com/App-vNext/Polly/blob/main/src/Polly.Extensions/README.md#L3-L7)

## Extensibility Model and Custom Strategies

### Overview

Polly provides a robust extensibility model enabling developers to create custom resilience strategies tailored to specific application requirements. Polly classifies strategies into two primary types: **Reactive** strategies, which handle specific exceptions thrown or results returned by executed callbacks, and **Proactive** strategies, which make independent decisions to cancel or reject execution without waiting for callback failures. Every custom strategy relies on a core set of components including a strategy class inheriting from `ResilienceStrategy`, an options class inheriting from `ResilienceStrategyOptions`, builder extensions, and custom argument types for event delegates.
Sources: [docs/extensibility/index.md:3-17](https://github.com/App-vNext/Polly/blob/main/docs/extensibility/index.md#L3-L17)

### Delegates and Argument Encapsulation

Resilience strategies leverage asynchronous delegates categorized into predicates, events, and generators. These delegates accept strongly typed arguments that encapsulate event telemetry and context, ensuring that adding new properties remains a non-breaking API change. Argument structs always include a `ResilienceContext` property and carry an `Arguments` suffix.
Sources: [docs/extensibility/index.md:53-123](https://github.com/App-vNext/Polly/blob/main/docs/extensibility/index.md#L53-L123)

| Delegate Category | Reactive Signature | Proactive Signature | Purpose |
| :--- | :--- | :--- | :--- |
| **Predicates** | `Func<Args<TResult>, ValueTask<bool>>` | *N/A* | Determines whether a resilience strategy should handle a specific result or exception. |
| **Events** | `Func<Args<TResult>, ValueTask>` | `Func<Args, ValueTask>` | Triggered upon significant state changes or actions within the strategy. |
| **Generators** | `Func<Args<TResult>, ValueTask<TValue>>` | `Func<Args, ValueTask<TValue>>` | Invoked when the strategy needs dynamic values or configuration parameters. |

Sources: [docs/extensibility/index.md:63-76](https://github.com/App-vNext/Polly/blob/main/docs/extensibility/index.md#L63-L76)

> [!NOTE]
> When configuring asynchronous delegates that interact with UI frameworks like Windows Forms or WPF, developers should utilize `ResilienceContext.ContinueOnCapturedContext` to manage synchronization contexts correctly.
> Sources: [docs/extensibility/index.md:79-81](https://github.com/App-vNext/Polly/blob/main/docs/extensibility/index.md#L79-L81)

### Implementation Components and Configuration

To build and register a custom strategy, you must define the options class, implement the strategy behavior, and supply builder extension methods. The following options structure illustrates how proactive argument types encapsulate event metadata and execution state:

```csharp
public readonly struct OnThresholdExceededArguments
{
    public OnThresholdExceededArguments(ResilienceContext context, TimeSpan threshold, TimeSpan duration)
    {
        Context = context;
        Threshold = threshold;
        Duration = duration;
    }

    public TimeSpan Threshold { get; }

    public TimeSpan Duration { get; }

    public ResilienceContext Context { get; }
}
```
Sources: [docs/extensibility/index.md:125-140](https://github.com/App-vNext/Polly/blob/main/docs/extensibility/index.md#L125-L140)

Strategies use strongly typed predicates to evaluate execution outcomes during pipeline configuration, handling exceptions, string matches, or numeric error codes:

```csharp
new ResiliencePipelineBuilder()
    .AddRetry(new RetryStrategyOptions
    {
        ShouldHandle = args => args.Outcome switch
        {
            { Exception: InvalidOperationException } => PredicateResult.True(),
            { Result: string result } when result is "Failure" => PredicateResult.True(),
            { Result: int result } when result is -1 => PredicateResult.True(),
            _ => PredicateResult.False(),
        },
    })
    .Build();
```
Sources: [docs/extensibility/index.md:87-100](https://github.com/App-vNext/Polly/blob/main/docs/extensibility/index.md#L87-L100)

## Related

- [[Quick Start]]
- [[Project Structure]]
- [[Resilience Pipelines]]

