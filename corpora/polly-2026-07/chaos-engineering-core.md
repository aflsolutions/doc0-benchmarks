# Chaos Engineering Core

<details>
<summary>Relevant source files</summary>

The following files were used as context for generating this wiki page:

- [src/Snippets/Docs/Chaos.Index.cs](https://github.com/App-vNext/Polly/blob/main/src/Snippets/Docs/Chaos.Index.cs)
- [docs/chaos/index.md](https://github.com/App-vNext/Polly/blob/main/docs/chaos/index.md)
- [src/Snippets/Docs/Chaos.Outcome.cs](https://github.com/App-vNext/Polly/blob/main/src/Snippets/Docs/Chaos.Outcome.cs)
- [docs/chaos/outcome.md](https://github.com/App-vNext/Polly/blob/main/docs/chaos/outcome.md)
- [src/Snippets/Docs/Chaos.Behavior.cs](https://github.com/App-vNext/Polly/blob/main/src/Snippets/Docs/Chaos.Behavior.cs)
- [docs/chaos/behavior.md](https://github.com/App-vNext/Polly/blob/main/docs/chaos/behavior.md)
- [src/Polly.Core/Simmy/Utils/ChaosStrategyHelper.cs](https://github.com/App-vNext/Polly/blob/main/src/Polly.Core/Simmy/Utils/ChaosStrategyHelper.cs)
- [docs/chaos/fault.md](https://github.com/App-vNext/Polly/blob/main/docs/chaos/fault.md)
- [src/Polly.Core/Simmy/ChaosStrategyConstants.cs](https://github.com/App-vNext/Polly/blob/main/src/Polly.Core/Simmy/ChaosStrategyConstants.cs)
- [src/Polly.Core/Simmy/ChaosStrategyOptions.cs](https://github.com/App-vNext/Polly/blob/main/src/Polly.Core/Simmy/ChaosStrategyOptions.cs)
- [src/Polly.Core/Simmy/ChaosStrategy.cs](https://github.com/App-vNext/Polly/blob/main/src/Polly.Core/Simmy/ChaosStrategy.cs)
- [src/Polly.Core/Simmy/ChaosStrategy.TResult.cs](https://github.com/App-vNext/Polly/blob/main/src/Polly.Core/Simmy/ChaosStrategy.TResult.cs)
- [src/Polly.Core/Simmy/Outcomes/ChaosOutcomePipelineBuilderExtensions.cs](https://github.com/App-vNext/Polly/blob/main/src/Polly.Core/Simmy/Outcomes/ChaosOutcomePipelineBuilderExtensions.cs)
</details>

## Overview

Chaos Engineering Core (Simmy) extends Polly by providing a robust framework for injecting simulated failures, latency, custom behaviors, and fake outcomes into resilience pipelines. By integrating directly with Polly v8, it enables developers to proactively test system resilience under turbulent conditions without waiting for actual production outages.
Sources: [docs/chaos/index.md:11-13](https://github.com/App-vNext/Polly/blob/main/docs/chaos/index.md#L11-L13)

The architecture centers on options-based configuration models and execution helpers that govern when and how chaos is applied through randomized thresholds and enablement predicates. These strategies work alongside standard resilience mechanisms to validate error-handling logic and telemetry tracking across distributed applications.
Sources: [docs/chaos/index.md:137-148](https://github.com/App-vNext/Polly/blob/main/docs/chaos/index.md#L137-L148), [src/Polly.Core/Simmy/Utils/ChaosStrategyHelper.cs:5-31](https://github.com/App-vNext/Polly/blob/main/src/Polly.Core/Simmy/Utils/ChaosStrategyHelper.cs#L5-L31)

## Chaos Strategy Options and Configuration

### Overview

The Simmy chaos engineering framework relies on a foundational options model and constant definitions to control the frequency and execution state of injected failures. The base options class, `ChaosStrategyOptions`, inherits from `ResilienceStrategyOptions` and establishes properties for static thresholds, dynamic generators, enablement flags, and random number generation. These parameters are bounded and initialized using constants defined in `ChaosStrategyConstants`.
Sources: [src/Polly.Core/Simmy/ChaosStrategyConstants.cs:3-12](https://github.com/App-vNext/Polly/blob/main/src/Polly.Core/Simmy/ChaosStrategyConstants.cs#L3-L12), [src/Polly.Core/Simmy/ChaosStrategyOptions.cs:8-51](https://github.com/App-vNext/Polly/blob/main/src/Polly.Core/Simmy/ChaosStrategyOptions.cs#L8-L51)

### Constants and Threshold Boundaries

`ChaosStrategyConstants` is an internal static class that provides the boundaries and default fallback values for chaos injection behavior across all strategies.
Sources: [src/Polly.Core/Simmy/ChaosStrategyConstants.cs:3-12](https://github.com/App-vNext/Polly/blob/main/src/Polly.Core/Simmy/ChaosStrategyConstants.cs#L3-L12)

| Constant Name | Value | Meaning |
| :--- | :--- | :--- |
| `MinInjectionThreshold` | `0` | Minimum inclusive boundary for injection rates. |
| `MaxInjectionThreshold` | `1` | Maximum inclusive boundary for injection rates. |
| `DefaultInjectionRate` | `0.001` | Default injection rate of 0.1% (one in a thousand executions). |
| `DefaultEnabled` | `true` | Default execution state indicating the strategy is enabled. |

Sources: [src/Polly.Core/Simmy/ChaosStrategyConstants.cs:3-12](https://github.com/App-vNext/Polly/blob/main/src/Polly.Core/Simmy/ChaosStrategyConstants.cs#L3-L12)

### Options Model Configuration

`ChaosStrategyOptions` exposes configuration properties that govern whether chaos is evaluated and how frequently it triggers during pipeline execution. Validation attributes enforce that injection thresholds remain within the closed interval `[0, 1]`.
Sources: [src/Polly.Core/Simmy/ChaosStrategyOptions.cs:8-51](https://github.com/App-vNext/Polly/blob/main/src/Polly.Core/Simmy/ChaosStrategyOptions.cs#L8-L51)

> [!NOTE]
> When `InjectionRateGenerator` is specified, the static `InjectionRate` property is completely ignored for the execution. Similarly, specifying an `EnabledGenerator` overrides and ignores the static `Enabled` property.
Sources: [src/Polly.Core/Simmy/ChaosStrategyOptions.cs:14-15](https://github.com/App-vNext/Polly/blob/main/src/Polly.Core/Simmy/ChaosStrategyOptions.cs#L14-L15), [src/Polly.Core/Simmy/ChaosStrategyOptions.cs:22-24](https://github.com/App-vNext/Polly/blob/main/src/Polly.Core/Simmy/ChaosStrategyOptions.cs#L22-L24), [src/Polly.Core/Simmy/ChaosStrategyOptions.cs:30-32](https://github.com/App-vNext/Polly/blob/main/src/Polly.Core/Simmy/ChaosStrategyOptions.cs#L30-L32), [src/Polly.Core/Simmy/ChaosStrategyOptions.cs:38-40](https://github.com/App-vNext/Polly/blob/main/src/Polly.Core/Simmy/ChaosStrategyOptions.cs#L38-L40)

Properties provided by `ChaosStrategyOptions` include:
- `InjectionRate`: A `double` defaulted to `ChaosStrategyConstants.DefaultInjectionRate`, validated against `ChaosStrategyConstants.MinInjectionThreshold` and `ChaosStrategyConstants.MaxInjectionThreshold`.
- `InjectionRateGenerator`: A `Func<InjectionRateGeneratorArguments, ValueTask<double>>?` yielding a dynamic injection rate between 0 and 1.
- `EnabledGenerator`: A `Func<EnabledGeneratorArguments, ValueTask<bool>>?` determining dynamically whether the strategy is active.
- `Enabled`: A `bool` defaulted to `ChaosStrategyConstants.DefaultEnabled`.
- `Randomizer`: A required `Func<double>` defaulted to `RandomUtil.NextDouble`, providing thread-safe values between `0.0` and `1.0` to evaluate injection rates.
Sources: [src/Polly.Core/Simmy/ChaosStrategyOptions.cs:16-51](https://github.com/App-vNext/Polly/blob/main/src/Polly.Core/Simmy/ChaosStrategyOptions.cs#L16-L51)

## Core Execution and Evaluation Helper

### Overview

The Simmy framework provides foundational abstract base classes, `ChaosStrategy` and `ChaosStrategy{T}`, which extend `ResilienceStrategy` and `ResilienceStrategy{T}` respectively to orchestrate fault injection. These classes consume `ChaosStrategyOptions` during initialization, setting up internal delegates for dynamic or static injection rate generation and enablement verification, while keeping a reference to the randomizer function.
Sources: [src/Polly.Core/Simmy/ChaosStrategy.cs:8-24](https://github.com/App-vNext/Polly/blob/main/src/Polly.Core/Simmy/ChaosStrategy.cs#L8-L24), [src/Polly.Core/Simmy/ChaosStrategy.TResult.cs:12-28](https://github.com/App-vNext/Polly/blob/main/src/Polly.Core/Simmy/ChaosStrategy.TResult.cs#L12-L28)

### Strategy Base Implementations

Both `ChaosStrategy` and `ChaosStrategy{T}` check that the provided options and randomizer instances are non-null using guard clauses. If dynamic generators (`InjectionRateGenerator` or `EnabledGenerator`) are omitted from options, they fall back to lambda expressions returning the static options values (`options.InjectionRate` and `options.Enabled`).
Sources: [src/Polly.Core/Simmy/ChaosStrategy.cs:16-24](https://github.com/App-vNext/Polly/blob/main/src/Polly.Core/Simmy/ChaosStrategy.cs#L16-L24), [src/Polly.Core/Simmy/ChaosStrategy.TResult.cs:20-28](https://github.com/App-vNext/Polly/blob/main/src/Polly.Core/Simmy/ChaosStrategy.TResult.cs#L20-L28)

| Member | Type | Source File | Purpose |
| :--- | :--- | :--- | :--- |
| `InjectionRateGenerator` | `Func<InjectionRateGeneratorArguments, ValueTask<double>>` | `ChaosStrategy.cs` / `ChaosStrategy.TResult.cs` | Resolves the injection threshold dynamically per execution. |
| `EnabledGenerator` | `Func<EnabledGeneratorArguments, ValueTask<bool>>` | `ChaosStrategy.cs` / `ChaosStrategy.TResult.cs` | Evaluates whether the strategy is active for the current context. |
| `ShouldInjectAsync` | `ValueTask<bool>` | `ChaosStrategy.cs` / `ChaosStrategy.TResult.cs` | Invokes the evaluation helper to determine if chaos should be triggered. |

Sources: [src/Polly.Core/Simmy/ChaosStrategy.cs:26-44](https://github.com/App-vNext/Polly/blob/main/src/Polly.Core/Simmy/ChaosStrategy.cs#L26-L44), [src/Polly.Core/Simmy/ChaosStrategy.TResult.cs:30-50](https://github.com/App-vNext/Polly/blob/main/src/Polly.Core/Simmy/ChaosStrategy.TResult.cs#L30-L50)

### Execution and Threshold Evaluation Call Chain

When a strategy evaluates whether to inject chaos, it calls `ShouldInjectAsync(ResilienceContext)`, which delegates the sequence of checks to `ChaosStrategyHelper.ShouldInjectAsync`. 

The call-chain execution flow proceeds as follows:
1. `ChaosStrategyHelper.ShouldInjectAsync()` begins by validating that `context` is non-null via `Guard.NotNull(context)`.
2. It immediately evaluates `context.CancellationToken.ThrowIfCancellationRequested()` to abort execution if cancellation was signaled before starting.
3. It awaits `enabledGenerator(new(context))` respecting `context.ContinueOnCapturedContext`. If the result is `false`, execution terminates and returns `false`.
4. It calls `context.CancellationToken.ThrowIfCancellationRequested()` again to catch cancellations triggered during the enabled evaluation delegate.
5. It awaits `injectionRateGenerator(new(context))` to fetch the target injection threshold.
6. It invokes `context.CancellationToken.ThrowIfCancellationRequested()` a third time to check for cancellation during the injection rate evaluation delegate.
7. It passes the resulting threshold into `CoerceInjectionThreshold(injectionThreshold)`, clamping values below `MinInjectionThreshold` or above `MaxInjectionThreshold` to valid bounds.
8. Finally, it invokes `randomizer()` and compares the generated double against the coerced threshold, returning `true` if the random value is strictly less than the injection threshold.

Sources: [src/Polly.Core/Simmy/Utils/ChaosStrategyHelper.cs:5-48](https://github.com/App-vNext/Polly/blob/main/src/Polly.Core/Simmy/Utils/ChaosStrategyHelper.cs#L5-L48)

> [!WARNING]
> Cancellation tokens are explicitly checked three separate times throughout `ChaosStrategyHelper.ShouldInjectAsync`: prior to evaluating enablement, between enablement and injection rate generation, and after resolving the injection rate. This ensures custom delegates do not run if cancellation occurs mid-evaluation.
Sources: [src/Polly.Core/Simmy/Utils/ChaosStrategyHelper.cs:14-28](https://github.com/App-vNext/Polly/blob/main/src/Polly.Core/Simmy/Utils/ChaosStrategyHelper.cs#L14-L28)

## Outcome and Fault Strategy Extensions

### Overview

Pipeline extension methods provide convenient builder syntax for registering outcome overrides and fault injection into resilience pipelines. The core extension class `ChaosOutcomePipelineBuilderExtensions` exposes overloads for attaching `ChaosOutcomeStrategyOptions<TResult>` or simplified parameter sets directly to a `ResiliencePipelineBuilder<TResult>`.
Sources: [src/Polly.Core/Simmy/Outcomes/ChaosOutcomePipelineBuilderExtensions.cs:6-61](https://github.com/App-vNext/Polly/blob/main/src/Polly.Core/Simmy/Outcomes/ChaosOutcomePipelineBuilderExtensions.cs#L6-L61)

### Pipeline Extension Methods

The builder extension methods validate inputs using guard clauses and wire up the strategy instances. 

| Method Signature | Parameters | Purpose | Sources |
| :--- | :--- | :--- | :--- |
| `AddChaosOutcome<TResult>` | `ResiliencePipelineBuilder<TResult> builder`, `double injectionRate`, `Func<TResult?> resultGenerator` | Wraps a simple result generator and injection rate into a `ChaosOutcomeStrategyOptions<TResult>` instance and registers it. | [src/Polly.Core/Simmy/Outcomes/ChaosOutcomePipelineBuilderExtensions.cs:19-35](https://github.com/App-vNext/Polly/blob/main/src/Polly.Core/Simmy/Outcomes/ChaosOutcomePipelineBuilderExtensions.cs#L19-L35) |
| `AddChaosOutcome<TResult>` | `ResiliencePipelineBuilder<TResult> builder`, `ChaosOutcomeStrategyOptions<TResult> options` | Registers a fully configured options instance by instantiating `ChaosOutcomeStrategy<TResult>` with telemetry support. | [src/Polly.Core/Simmy/Outcomes/ChaosOutcomePipelineBuilderExtensions.cs:48-60](https://github.com/App-vNext/Polly/blob/main/src/Polly.Core/Simmy/Outcomes/ChaosOutcomePipelineBuilderExtensions.cs#L48-L60) |

Sources: [src/Polly.Core/Simmy/Outcomes/ChaosOutcomePipelineBuilderExtensions.cs:19-61](https://github.com/App-vNext/Polly/blob/main/src/Polly.Core/Simmy/Outcomes/ChaosOutcomePipelineBuilderExtensions.cs#L19-L61)

### Extension Registration Call Chain

When attaching outcome chaos via the simplified parameter overload, the extension executes a precise delegation sequence before handing off to the underlying pipeline builder:
1. `AddChaosOutcome(builder, injectionRate, resultGenerator)` receives the target builder, rate, and generator function.
2. It calls `Guard.NotNull(builder)` to ensure the resilience pipeline builder reference is valid.
3. It constructs a new `ChaosOutcomeStrategyOptions<TResult>` setting `InjectionRate` to the supplied parameter.
4. It defines an internal `OutcomeGenerator` delegate that wraps the user's `resultGenerator()` call.
5. Inside this wrapper, `resultGenerator()` is invoked, wrapped via `Outcome.FromResult()`, and returned as a `ValueTask<Outcome<TResult>?>`.
6. Finally, it invokes `builder.AddChaosOutcome(options)` to register the populated options object into the pipeline.

Sources: [src/Polly.Core/Simmy/Outcomes/ChaosOutcomePipelineBuilderExtensions.cs:19-35](https://github.com/App-vNext/Polly/blob/main/src/Polly.Core/Simmy/Outcomes/ChaosOutcomePipelineBuilderExtensions.cs#L19-L35)

> [!NOTE]
> Trimming annotations (`[UnconditionalSuppressMessage]`) are applied to the options-based `AddChaosOutcome` overload with `IL2026` justification, ensuring all strategy members remain preserved during ahead-of-time (AOT) trimming and compilation.
Sources: [src/Polly.Core/Simmy/Outcomes/ChaosOutcomePipelineBuilderExtensions.cs:44-47](https://github.com/App-vNext/Polly/blob/main/src/Polly.Core/Simmy/Outcomes/ChaosOutcomePipelineBuilderExtensions.cs#L44-L47)

### Design Patterns and Anti-Patterns

When configuring outcome generators, combining fault injection inside an outcome strategy creates ambiguity in telemetry metrics and execution control. 

| Pattern Type | Implementation Approach | Benefit | Cost / Risk | Sources |
| :--- | :--- | :--- | :--- | :--- |
| **Anti-Pattern** | Registering exceptions within `ChaosOutcomeStrategyOptions` via `OutcomeGenerator` | Requires fewer initial configuration lines | Mixes outcome telemetry with fault telemetry; prevents separate injection rate controls for outcomes versus faults | [docs/chaos/outcome.md:210-253](https://github.com/App-vNext/Polly/blob/main/docs/chaos/outcome.md#L210-L253) |
| **Recommended Pattern** | Pairing `AddChaosFault` and `AddChaosOutcome` as separate strategy entries | Separates control knobs; tracks faults independently via `Chaos.OnFault` telemetry events | Requires configuring two distinct strategy options blocks | [docs/chaos/outcome.md:256-307](https://github.com/App-vNext/Polly/blob/main/docs/chaos/outcome.md#L256-L307) |

Sources: [docs/chaos/outcome.md:210-337](https://github.com/App-vNext/Polly/blob/main/docs/chaos/outcome.md#L210-L337)

### Full Worked Example

The following pipeline setup demonstrates the recommended pattern of separating fault injection and outcome injection using distinct strategy options, individual injection rates, and dedicated enablement generators:

```csharp
var pipeline = new ResiliencePipelineBuilder<HttpResponseMessage>()
    .AddChaosFault(new ChaosFaultStrategyOptions
    {
        InjectionRate = 0.1,
        EnabledGenerator = static args => ValueTask.FromResult(true),
        FaultGenerator = static args =>
        {
            Exception? exception = Random.Shared.Next(350) switch
            {
                >= 250 and < 350 => new HttpRequestException("Chaos request exception."),
                _ => null
            };
            return ValueTask.FromResult(exception);
        },
        OnFaultInjected = static args =>
        {
            Console.WriteLine($"OnFaultInjected, Exception: {args.Fault.Message}, Operation: {args.Context.OperationKey}.");
            return default;
        }
    })
    .AddChaosOutcome(new ChaosOutcomeStrategyOptions<HttpResponseMessage>
    {
        InjectionRate = 0.5,
        EnabledGenerator = static args => ValueTask.FromResult(true),
        OutcomeGenerator = static args =>
        {
            HttpStatusCode statusCode = Random.Shared.Next(350) switch
            {
                < 100 => HttpStatusCode.InternalServerError,
                < 150 => HttpStatusCode.TooManyRequests,
                _ => HttpStatusCode.OK
            };
            return ValueTask.FromResult<Outcome<HttpResponseMessage>?>(Outcome.FromResult(new HttpResponseMessage(statusCode)));
        },
        OnOutcomeInjected = static args =>
        {
            Console.WriteLine($"OnBehaviorInjected, Outcome: {args.Outcome.Result}, Operation: {args.Context.OperationKey}.");
            return default;
        }
    })
    .Build();
```
Sources: [src/Snippets/Docs/Chaos.Outcome.cs:161-208](https://github.com/App-vNext/Polly/blob/main/src/Snippets/Docs/Chaos.Outcome.cs#L161-L208), [docs/chaos/outcome.md:260-307](https://github.com/App-vNext/Polly/blob/main/docs/chaos/outcome.md#L260-L307)

## Behavior Chaos Injection Strategies

### Overview

The behavior chaos strategy provides a flexible mechanism to inject custom behaviors into system operations right before invocation. This proactive strategy allows you to alter inputs, simulate resource exhaustion, or establish specific pre-conditions.

Sources: [docs/chaos/behavior.md:13-14](https://github.com/App-vNext/Polly/blob/main/docs/chaos/behavior.md#L13-L14)

### Configuration Options and Usage

Options are configured using `ChaosBehaviorStrategyOptions`, which requires a `BehaviorGenerator` delegate and an optional `OnBehaviorInjected` notification callback.

| Property | Default Value | Description |
| :--- | :--- | :--- |
| `BehaviorGenerator` | `null` | A required delegate allowing custom behavior execution using runtime context. |
| `OnBehaviorInjected` | `null` | Optional callback invoked immediately after successful behavior injection. |

Sources: [docs/chaos/behavior.md:6-10](https://github.com/App-vNext/Polly/blob/main/docs/chaos/behavior.md#L6-L10), [docs/chaos/behavior.md:71-75](https://github.com/App-vNext/Polly/blob/main/docs/chaos/behavior.md#L71-L75)

> [!NOTE]
> The `Chaos.OnBehavior` telemetry event is reported with `Information` severity only when a custom behavior is successfully injected and does not throw an exception. The telemetry `Result` field remains always empty for this event.
Sources: [docs/chaos/behavior.md:78-82](https://github.com/App-vNext/Polly/blob/main/docs/chaos/behavior.md#L78-L82), [docs/chaos/behavior.md:92-97](https://github.com/App-vNext/Polly/blob/main/docs/chaos/behavior.md#L92-L97)

### Design Patterns and Anti-Patterns

| Pattern Type | Implementation Approach | Benefit | Cost / Risk | Sources |
| :--- | :--- | :--- | :--- | :--- |
| **Anti-Pattern** | Using `ChaosBehaviorStrategyOptions` with `Task.Delay` inside `BehaviorGenerator` | Executes arbitrary code asynchronously | Bypasses dedicated latency management features, cancellation safety, and correct metric tracking | [docs/chaos/behavior.md:146-164](https://github.com/App-vNext/Polly/blob/main/docs/chaos/behavior.md#L146-L164) |
| **Recommended Pattern** | Using `AddChaosLatency` via `ChaosLatencyStrategyOptions` | Correctly manages synchronous and asynchronous delays, cancellations, and telemetry | Requires using the dedicated latency strategy extension | [docs/chaos/behavior.md:166-179](https://github.com/App-vNext/Polly/blob/main/docs/chaos/behavior.md#L166-L179) |

Sources: [docs/chaos/behavior.md:144-180](https://github.com/App-vNext/Polly/blob/main/docs/chaos/behavior.md#L144-L180)

### Full Worked Example

The following resilience pipeline configuration demonstrates registering a retry strategy combined with a behavior strategy that restarts Redis via custom options and logs telemetry notifications:

```csharp
var pipeline = new ResiliencePipelineBuilder()
    .AddRetry(new RetryStrategyOptions
    {
        ShouldHandle = new PredicateBuilder().Handle<RedisConnectionException>(),
        BackoffType = DelayBackoffType.Exponential,
        UseJitter = true,  
        MaxRetryAttempts = 4,
        Delay = TimeSpan.FromSeconds(3),
    })
    .AddChaosBehavior(new ChaosBehaviorStrategyOptions 
    {
        BehaviorGenerator = static args => RestartRedisAsync(args.Context.CancellationToken),
        InjectionRate = 0.05,
        OnBehaviorInjected = static args =>
        {
            Console.WriteLine("OnBehaviorInjected, Operation: {0}.", args.Context.OperationKey);
            return default;
        }
    })
    .Build();
```
Sources: [src/Snippets/Docs/Chaos.Behavior.cs:22-31](https://github.com/App-vNext/Polly/blob/main/src/Snippets/Docs/Chaos.Behavior.cs#L22-L31), [src/Snippets/Docs/Chaos.Behavior.cs:41-57](https://github.com/App-vNext/Polly/blob/main/src/Snippets/Docs/Chaos.Behavior.cs#L41-L57)

## Chaos Pipeline Integration and Usage

### Overview

Combining chaos strategies within resilience pipelines requires careful ordering and selective configuration to control blast radius and ensure meaningful test coverage. Standard resilience strategies such as rate limiters, retries, circuit breakers, and timeouts should precede chaos strategies so that resilience mechanisms can actively intercept and handle injected faults.

Sources: [docs/chaos/index.md:21-31](https://github.com/App-vNext/Polly/blob/main/docs/chaos/index.md#L21-L31), [src/Snippets/Docs/Chaos.Index.cs:19-29](https://github.com/App-vNext/Polly/blob/main/src/Snippets/Docs/Chaos.Index.cs#L19-L29)

### Strategy Composition and Execution Order

When multiple chaos strategies are chained together in a pipeline, they execute sequentially in the order they are registered. Placing a fault strategy before a latency strategy can save waiting time by failing fast, whereas reversing them changes the operational behavior.

Sources: [docs/chaos/index.md:129-131](https://github.com/App-vNext/Polly/blob/main/docs/chaos/index.md#L129-L131)

```csharp
var builder = new ResiliencePipelineBuilder<HttpResponseMessage>();

builder
    .AddConcurrencyLimiter(10, 100)
    .AddRetry(new RetryStrategyOptions<HttpResponseMessage> { /* configure options */ })
    .AddCircuitBreaker(new CircuitBreakerStrategyOptions<HttpResponseMessage> { /* configure options */ })
    .AddTimeout(TimeSpan.FromSeconds(5));

const double FaultInjectionRate = 0.02;
const double LatencyInjectionRate = 0.50;
const double OutcomeInjectionRate = 0.10;
const double BehaviorInjectionRate = 0.01;

builder
    .AddChaosFault(FaultInjectionRate, () => new InvalidOperationException("Injected by chaos strategy!"))
    .AddChaosLatency(LatencyInjectionRate, TimeSpan.FromMinutes(1))
    .AddChaosOutcome(OutcomeInjectionRate, () => new HttpResponseMessage(System.Net.HttpStatusCode.InternalServerError))
    .AddChaosBehavior(BehaviorInjectionRate, cancellationToken => RestartRedisAsync(cancellationToken));
```

Sources: [docs/chaos/index.md:21-48](https://github.com/App-vNext/Polly/blob/main/docs/chaos/index.md#L21-L48), [src/Snippets/Docs/Chaos.Index.cs:19-46](https://github.com/App-vNext/Polly/blob/main/src/Snippets/Docs/Chaos.Index.cs#L19-L46)

> [!NOTE]
> Chaos strategies are enabled by default in the V8 API. To control when chaos applies, you can opt-out or selectively enable strategies using `Enabled`, `EnabledGenerator`, `InjectionRate`, or `InjectionRateGenerator`.
Sources: [docs/chaos/index.md:185-189](https://github.com/App-vNext/Polly/blob/main/docs/chaos/index.md#L185-L189)

### Selective Chaos Application

To limit chaos exposure in production environments, you can implement selective evaluation using environment checks or a dedicated `IChaosManager` interface.

```csharp
public interface IChaosManager
{
    ValueTask<bool> IsChaosEnabled(ResilienceContext context);

    ValueTask<double> GetInjectionRate(ResilienceContext context);
}
```

Sources: [docs/chaos/index.md:284-290](https://github.com/App-vNext/Polly/blob/main/docs/chaos/index.md#L284-L290), [src/Snippets/Docs/Chaos.Index.cs:251-256](https://github.com/App-vNext/Polly/blob/main/src/Snippets/Docs/Chaos.Index.cs#L251-L256)

Using `IChaosManager`, you can wire dynamic activation and rates into multiple strategies uniformly:

```csharp
services.AddResiliencePipeline("chaos-pipeline", (builder, context) =>
{
    var chaosManager = context.ServiceProvider.GetRequiredService<IChaosManager>();

    builder
        .AddChaosFault(new ChaosFaultStrategyOptions
        {
            EnabledGenerator = args => chaosManager.IsChaosEnabled(args.Context),
            InjectionRateGenerator = args => chaosManager.GetInjectionRate(args.Context),
            FaultGenerator = new FaultGenerator()
                .AddException<TimeoutException>()
                .AddException<HttpRequestException>()
        })
        .AddChaosLatency(new ChaosLatencyStrategyOptions
        {
            EnabledGenerator = args => chaosManager.IsChaosEnabled(args.Context),
            InjectionRateGenerator = args => chaosManager.GetInjectionRate(args.Context),
            Latency = TimeSpan.FromSeconds(60)
        });
});
```

Sources: [docs/chaos/index.md:295-317](https://github.com/App-vNext/Polly/blob/main/docs/chaos/index.md#L295-L317), [src/Snippets/Docs/Chaos.Index.cs:114-133](https://github.com/App-vNext/Polly/blob/main/src/Snippets/Docs/Chaos.Index.cs#L114-L133)

### Integration Architecture Trade-Offs

| Integration Approach | Benefit | Cost / Risk | Sources |
| :--- | :--- | :--- | :--- |
| **Central Pipeline via `AddPipeline`** | Central management of chaos rules allows easy reuse across multiple resilience pipelines. | Harder to correlate telemetry across different pipeline scopes; inflexible for per-pipeline tuning. | [docs/chaos/index.md:375-380](https://github.com/App-vNext/Polly/blob/main/docs/chaos/index.md#L375-L380) |
| **Custom Extension Methods** | Enables fine-grained configuration per pipeline and simplifies telemetry correlation under a single name. | Requires writing and maintaining extension code and options classes, adding complexity. | [docs/chaos/index.md:447-453](https://github.com/App-vNext/Polly/blob/main/docs/chaos/index.md#L447-L453) |

Sources: [docs/chaos/index.md:323-454](https://github.com/App-vNext/Polly/blob/main/docs/chaos/index.md#L323-L454)

## Related

- [[Section Chaos Engineering Strategy]]

