# Performance Guidelines

<details>
<summary>Relevant source files</summary>

The following files were used as context for generating this wiki page:

- [src/Snippets/Docs/Performance.cs](https://github.com/App-vNext/Polly/blob/main/src/Snippets/Docs/Performance.cs)
- [docs/advanced/performance.md](https://github.com/App-vNext/Polly/blob/main/docs/advanced/performance.md)
- [README.md](https://github.com/App-vNext/Polly/blob/main/README.md)
- [docs/pipelines/index.md](https://github.com/App-vNext/Polly/blob/main/docs/pipelines/index.md)
- [AGENTS.md](https://github.com/App-vNext/Polly/blob/main/AGENTS.md)
- [docs/general.md](https://github.com/App-vNext/Polly/blob/main/docs/general.md)
- [docs/advanced/resilience-context.md](https://github.com/App-vNext/Polly/blob/main/docs/advanced/resilience-context.md)
- [docs/advanced/telemetry.md](https://github.com/App-vNext/Polly/blob/main/docs/advanced/telemetry.md)
- [src/Polly/Utilities/EmptyStruct.cs](https://github.com/App-vNext/Polly/blob/main/src/Polly/Utilities/EmptyStruct.cs)
- [src/Polly.Core/README.md](https://github.com/App-vNext/Polly/blob/main/src/Polly.Core/README.md)
- [src/Polly.Extensions/Telemetry/TagsList.cs](https://github.com/App-vNext/Polly/blob/main/src/Polly.Extensions/Telemetry/TagsList.cs)
- [src/Polly/NoOp/NoOpPolicy.cs](https://github.com/App-vNext/Polly/blob/main/src/Polly/NoOp/NoOpPolicy.cs)
- [src/Polly/NoOp/NoOpTResultSyntax.cs](https://github.com/App-vNext/Polly/blob/main/src/Polly/NoOp/NoOpTResultSyntax.cs)
- [cake.cs](https://github.com/App-vNext/Polly/blob/main/cake.cs)
- [src/Polly/NoOp/NoOpEngine.cs](https://github.com/App-vNext/Polly/blob/main/src/Polly/NoOp/NoOpEngine.cs)
- [src/Polly/NoOp/NoOpSyntax.cs](https://github.com/App-vNext/Polly/blob/main/src/Polly/NoOp/NoOpSyntax.cs)
- [src/Polly/NoOp/INoOpPolicy.cs](https://github.com/App-vNext/Polly/blob/main/src/Polly/NoOp/INoOpPolicy.cs)
- [docs/community/resources.md](https://github.com/App-vNext/Polly/blob/main/docs/community/resources.md)
- [CONTRIBUTING.md](https://github.com/App-vNext/Polly/blob/main/CONTRIBUTING.md)
- [docs/community/libraries-and-contributions.md](https://github.com/App-vNext/Polly/blob/main/docs/community/libraries-and-contributions.md)
- [docs/index.md](https://github.com/App-vNext/Polly/blob/main/docs/index.md)
</details>

## Overview

Polly is designed from the ground up for high-performance execution, minimizing allocations and reducing overhead across all resilience pipelines and strategies. These performance guidelines explore essential practices and architectural optimizations available in Polly v8 to achieve maximum throughput and memory efficiency in production applications.

Sources: [docs/advanced/performance.md:1-24](https://github.com/App-vNext/Polly/blob/main/docs/advanced/performance.md#L1-L24), [src/Polly.Core/README.md:1-3](https://github.com/App-vNext/Polly/blob/main/src/Polly.Core/README.md#L1-L3)

## Zero-Allocation Core Execution Paths

### Overview

Polly v8 is engineered for high-performance execution, achieving dramatic memory efficiency compared to older versions. For instance, executing an advanced pipeline composed of an outer timeout, rate limiter, retry, circuit breaker, and inner timeout allocates only 40 bytes with zero Gen0 collections in v8, contrasted with 2,824 bytes and 0.1106 Gen0 collections in v7. To maintain zero-allocation core execution paths, several design patterns should be applied.

Sources: [docs/advanced/performance.md:5-22](https://github.com/App-vNext/Polly/blob/main/docs/advanced/performance.md#L5-L22)

### Avoiding Lambda Captures

Lambdas that capture local variables from their outer scope allocate memory on every invocation. Polly provides state-passing overloads to eliminate this overhead through static lambdas.

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

Sources: [src/Snippets/Docs/Performance.cs:17-32](https://github.com/App-vNext/Polly/blob/main/src/Snippets/Docs/Performance.cs#L17-L32), [docs/advanced/performance.md:32-47](https://github.com/App-vNext/Polly/blob/main/docs/advanced/performance.md#L32-L47)

### Optimizing Predicates with Switch Expressions

The `PredicateBuilder` maintains an internal list of registered predicates and iterates over them during evaluation. Using C# switch expressions bypasses this list-maintenance overhead entirely for optimal performance.

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

Sources: [src/Snippets/Docs/Performance.cs:37-64](https://github.com/App-vNext/Polly/blob/main/src/Snippets/Docs/Performance.cs#L37-L64), [docs/advanced/performance.md:53-80](https://github.com/App-vNext/Polly/blob/main/docs/advanced/performance.md#L53-L80)

### Avoiding Exception Throws via ExecuteOutcomeAsync

When employing exception-heavy resilience strategies such as circuit breakers, wrapping execution in standard `try-catch` blocks incurs overhead. Instead, pooling a `ResilienceContext` and utilizing `ExecuteOutcomeAsync` allows certain strategies to return an exception instance wrapped in an `Outcome<T>` without actually throwing it.

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

Sources: [src/Snippets/Docs/Performance.cs:87-119](https://github.com/App-vNext/Polly/blob/main/src/Snippets/Docs/Performance.cs#L87-L119), [docs/advanced/performance.md:99-131](https://github.com/App-vNext/Polly/blob/main/docs/advanced/performance.md#L99-L131)

> [!NOTE]
> You can also define your pipeline on startup using dependency injection and then use `ResiliencePipelineProvider<T>` to retrieve the instance rather than instantiating pipelines dynamically per call.

Sources: [docs/advanced/performance.md:173-175](https://github.com/App-vNext/Polly/blob/main/docs/advanced/performance.md#L173-L175)

## Resilience Pipeline Performance Optimization

### Overview

The Polly V8 API offers a unified, non-allocating resilience API centered around the `ResiliencePipeline` class, which handles all scenarios previously covered by Polly V7 policies (`ISyncPolicy`, `IAsyncPolicy`, `ISyncPolicy<T>`, and `IAsyncPolicy<T>`). Defining pipelines once at startup using dependency injection with `IServiceCollection` extensions and retrieving them via `ResiliencePipelineProvider<string>` or `ResiliencePipelineRegistry<string>` prevents dynamic instantiation overhead per call.

Sources: [src/Polly.Core/README.md:1-9](https://github.com/App-vNext/Polly/blob/main/src/Polly.Core/README.md#L1-L9), [docs/pipelines/index.md:62-65](https://github.com/App-vNext/Polly/blob/main/docs/pipelines/index.md#L62-L65)

### Pipeline Builder Configuration and Execution Pathways

Pipelines are constructed using `ResiliencePipelineBuilder` to combine strategies such as concurrency limiters, retries, and timeouts. The resulting `ResiliencePipeline` supports synchronous and asynchronous callbacks with lightweight execution pathways that bypass closure allocations.

```csharp
// Creating a new resilience pipeline
ResiliencePipeline pipeline = new ResiliencePipelineBuilder()
    .AddConcurrencyLimiter(100)
    .Build();

// Executing an asynchronous void callback without allocating a lambda
await pipeline.ExecuteAsync(
    static async (state, token) => await state.httpClient.GetAsync(state.endpoint, token),
    (httpClient, endpoint),  // State provided here
    cancellationToken);
```

Sources: [docs/pipelines/index.md:11-34](https://github.com/App-vNext/Polly/blob/main/docs/pipelines/index.md#L11-L34)

For test scenarios where resilience strategies could slow down execution or complicate setup, applications can utilize the empty resilience pipeline construct via `ResiliencePipeline.Empty` or `ResiliencePipeline<T>.Empty`.

Sources: [docs/pipelines/index.md:81-88](https://github.com/App-vNext/Polly/blob/main/docs/pipelines/index.md#L81-L88)

> [!NOTE]
> `ResiliencePipeline` provides methods like `ExecuteOutcomeAsync(...)` to avoid re-throwing exceptions in high-performance scenarios, storing results or exceptions within an `Outcome<T>` struct.

Sources: [docs/pipelines/index.md:90-93](https://github.com/App-vNext/Polly/blob/main/docs/pipelines/index.md#L90-L93), [docs/pipelines/index.md:136-136](https://github.com/App-vNext/Polly/blob/main/docs/pipelines/index.md#L136)

## Efficient Context and State Management

### Overview

The `ResilienceContext` class provides an execution-scoped instance accompanying each execution through a resilience pipeline and across all strategies, serving to share context and facilitate information exchange between pre-execution, mid-execution, and post-execution phases. Because `ResilienceContext` objects are resource-intensive to create, recreating them for each execution would negatively impact performance; Polly provides `ResilienceContextPool` to obtain, reuse, and reset these instances.

Sources: [docs/advanced/resilience-context.md:3-3](https://github.com/App-vNext/Polly/blob/main/docs/advanced/resilience-context.md#L3), [docs/advanced/resilience-context.md:110-110](https://github.com/App-vNext/Polly/blob/main/docs/advanced/resilience-context.md#L110)

### Utility Structs for Non-Generic Operations

To support policies and actions which do not return a `TResult`, Polly defines internal utility structs such as `EmptyStruct`, providing a lightweight representation without allocation overhead.

```csharp
internal readonly struct EmptyStruct
{
    internal static readonly EmptyStruct Instance;
}
```

Sources: [src/Polly/Utilities/EmptyStruct.cs:3-9](https://github.com/App-vNext/Polly/blob/main/src/Polly/Utilities/EmptyStruct.cs#L3-L9)

> [!TIP]
> When using a custom `ResilienceContext`, ensure your usage is correct to avoid the context being treated as custom *state* for the execution instead of as the *context* for the execution. Otherwise, the delegate invoked by the resilience pipeline will be a different instance obtained from the shared pool rather than the value specified for your execution.

Sources: [docs/advanced/resilience-context.md:12-15](https://github.com/App-vNext/Polly/blob/main/docs/advanced/resilience-context.md#L12-L15)

### Context Pooling and Properties

`ResilienceContextPool` offers several `Get` methods allowing you to initialize properties upon retrieval. Additionally, `ResilienceContext` exposes properties including `OperationKey`, `CancellationToken`, `Properties` (an instance of `ResilienceProperties` for attaching custom data), and `ContinueOnCapturedContext`.

| Property / Method | Type | Purpose / Description |
| :--- | :--- | :--- |
| `OperationKey` | `string` | A user-defined identifier for the operation, reported in telemetry. |
| `CancellationToken` | `CancellationToken` | The cancellation token linked to the operation. |
| `Properties` | `ResilienceProperties` | An instance for attaching custom data to the context. |
| `ContinueOnCapturedContext` | `bool` | Specifies whether asynchronous execution should continue on captured context. |
| `ResilienceContextPool.Shared.Get(...)` | Method | Obtains a pooled context instance, optionally accepting cancellation tokens, operation keys, and capture settings. |

Sources: [docs/advanced/resilience-context.md:7-10](https://github.com/App-vNext/Polly/blob/main/docs/advanced/resilience-context.md#L7-L10), [docs/advanced/resilience-context.md:113-118](https://github.com/App-vNext/Polly/blob/main/docs/advanced/resilience-context.md#L113-L118), [docs/advanced/resilience-context.md:122-130](https://github.com/App-vNext/Polly/blob/main/docs/advanced/resilience-context.md#L122-L130), [docs/advanced/resilience-context.md:143-143](https://github.com/App-vNext/Polly/blob/main/docs/advanced/resilience-context.md#L143)

> [!NOTE]
> Returning the context back to the pool via `ResilienceContextPool.Shared.Return(context)` is recommended to reduce allocations, but it is not required. It is also acceptable not to return the context in case of exceptions if you want to avoid `try-catch` blocks.

Sources: [docs/advanced/resilience-context.md:135-136](https://github.com/App-vNext/Polly/blob/main/docs/advanced/resilience-context.md#L135-L136)

## Telemetry Tag Allocation Controls

### Overview

Polly incorporates optimization mechanisms designed to reduce allocation overhead during telemetry event generation and processing. The internal `TagsList` class acts as a specialized collection for telemetry tags, utilizing an object pool to avoid repeated memory allocations across high-frequency telemetry events.

Sources: [src/Polly.Extensions/Telemetry/TagsList.cs:8-10](https://github.com/App-vNext/Polly/blob/main/src/Polly.Extensions/Telemetry/TagsList.cs#L8-L10)

### TagsList Mechanics and Object Pooling

The `TagsList` class inherits from `List<KeyValuePair<string, object?>>` and provides static `Get()` and `Return(TagsList context)` methods backed by an internal `ObjectPool<TagsList>`. 

```csharp
internal sealed class TagsList : List<KeyValuePair<string, object?>>
{
    private static readonly ObjectPool<TagsList> ContextPool = new(static () => new TagsList(), static _ => true);

#if !NET
    private KeyValuePair<string, object?>[] _tagsArray = new KeyValuePair<string, object?>[20];
#endif

    private TagsList()
    {
    }

    internal static TagsList Get() => ContextPool.Get();

    internal static void Return(TagsList context)
    {
#if !NET
        Array.Clear(context._tagsArray, 0, context.Count);
#endif
        context.Clear();
        ContextPool.Return(context);
    }
}
```

Sources: [src/Polly.Extensions/Telemetry/TagsList.cs:8-29](https://github.com/App-vNext/Polly/blob/main/src/Polly.Extensions/Telemetry/TagsList.cs#L8-L29)

> [!NOTE]
> When targeting non-.NET runtimes (`#if !NET`), `TagsList` maintains a pre-allocated array of 20 key-value pairs (`_tagsArray`) to back span conversions without heap allocations, clearing the array and clearing the underlying list upon return.

Sources: [src/Polly.Extensions/Telemetry/TagsList.cs:12-14](https://github.com/App-vNext/Polly/blob/main/src/Polly.Extensions/Telemetry/TagsList.cs#L12-L14), [src/Polly.Extensions/Telemetry/TagsList.cs:24-28](https://github.com/App-vNext/Polly/blob/main/src/Polly.Extensions/Telemetry/TagsList.cs#L24-L28)

### Span Exposure and Runtime Adaptation

The `TagsSpan` property returns a `ReadOnlySpan<KeyValuePair<string, object?>>` representing the current tags. Under modern .NET runtimes, it leverages `CollectionsMarshal.AsSpan(this)` for direct span access over the list storage, whereas older targets resize and copy data into `_tagsArray` dynamically if collection counts exceed the initial threshold.

```csharp
    internal ReadOnlySpan<KeyValuePair<string, object?>> TagsSpan
    {
        get
        {
#if NET
            return CollectionsMarshal.AsSpan(this);
#else
            // stryker disable once equality : no means to test this
            if (Count > _tagsArray.Length)
            {
                Array.Resize(ref _tagsArray, Count);
            }

            CopyTo(_tagsArray, 0);
            return _tagsArray.AsSpan(0, Count);
#endif
        }
    }
```

Sources: [src/Polly.Extensions/Telemetry/TagsList.cs:31-48](https://github.com/App-vNext/Polly/blob/main/src/Polly.Extensions/Telemetry/TagsList.cs#L31-L48)

## No-Op Policy Overhead Minimization

### Overview

The No-Op policy components provide a lightweight resilience structure that executes delegates without applying any custom resilience behavior or interception overhead. By bypassing complex state machines, timer allocations, and wrapping decorators, No-Op policies achieve minimal execution latency.

Sources: [src/Polly/NoOp/NoOpPolicy.cs:7-8](https://github.com/App-vNext/Polly/blob/main/src/Polly/NoOp/NoOpPolicy.cs#L7-L8), [src/Polly/NoOp/NoOpSyntax.cs:10-10](https://github.com/App-vNext/Polly/blob/main/src/Polly/NoOp/NoOpSyntax.cs#L10)

### Execution Path and Call-Chain Walkthrough

When an action is executed through a NoOp policy, control flows directly through a streamlined validation and dispatch path. The call-chain follows this exact sequence:

1. `NoOpPolicy.Implementation(...)` / `NoOpPolicy<TResult>.Implementation(...)` — Validates that the input action delegate is not `null`, throwing an `ArgumentNullException` if invalid.
2. `NoOpEngine.Implementation(...)` — Directly invokes the passed delegate with the provided `Context` and `CancellationToken`.

```csharp
internal static partial class NoOpEngine
{
    internal static TResult Implementation<TResult>(Func<Context, CancellationToken, TResult> action, Context context, CancellationToken cancellationToken) =>
        action(context, cancellationToken);
}
```

Sources: [src/Polly/NoOp/NoOpPolicy.cs:14-24](https://github.com/App-vNext/Polly/blob/main/src/Polly/NoOp/NoOpPolicy.cs#L14-L24), [src/Polly/NoOp/NoOpPolicy.cs:37-47](https://github.com/App-vNext/Polly/blob/main/src/Polly/NoOp/NoOpPolicy.cs#L37-L47), [src/Polly/NoOp/NoOpEngine.cs:4-8](https://github.com/App-vNext/Polly/blob/main/src/Polly/NoOp/NoOpEngine.cs#L4-L8)

> [!NOTE]
> Methods annotated with `[DebuggerStepThrough]` ensure that the debugger steps directly into user-supplied delegates without stopping inside the NoOp policy framework wrappers.

Sources: [src/Polly/NoOp/NoOpPolicy.cs:14-14](https://github.com/App-vNext/Polly/blob/main/src/Polly/NoOp/NoOpPolicy.cs#L14), [src/Polly/NoOp/NoOpPolicy.cs:37-37](https://github.com/App-vNext/Polly/blob/main/src/Polly/NoOp/NoOpPolicy.cs#L37)

### No-Op Components Reference Table

| Component Name | Base Class / Interface | Purpose |
| :--- | :--- | :--- |
| `NoOpPolicy` | `Policy`, `INoOpPolicy` | Non-generic No-Op policy implementation for arbitrary delegates. |
| `NoOpPolicy<TResult>` | `Policy<TResult>`, `INoOpPolicy<TResult>` | Strongly-typed No-Op policy handling return values of type `TResult`. |
| `INoOpPolicy` | `IsPolicy` | Marker interface defining common properties for all NoOp policies. |
| `INoOpPolicy<TResult>` | `INoOpPolicy` | Generic marker interface for result-typed NoOp policies. |
| `NoOpEngine` | *Static class* | Minimal execution engine passing actions straight through to invocation. |

Sources: [src/Polly/NoOp/NoOpPolicy.cs:7-8](https://github.com/App-vNext/Polly/blob/main/src/Polly/NoOp/NoOpPolicy.cs#L7-L8), [src/Polly/NoOp/NoOpPolicy.cs:30-31](https://github.com/App-vNext/Polly/blob/main/src/Polly/NoOp/NoOpPolicy.cs#L30-L31), [src/Polly/NoOp/INoOpPolicy.cs:7-9](https://github.com/App-vNext/Polly/blob/main/src/Polly/NoOp/INoOpPolicy.cs#L7-L9), [src/Polly/NoOp/INoOpPolicy.cs:15-17](https://github.com/App-vNext/Polly/blob/main/src/Polly/NoOp/INoOpPolicy.cs#L15-L17), [src/Polly/NoOp/NoOpEngine.cs:4-8](https://github.com/App-vNext/Polly/blob/main/src/Polly/NoOp/NoOpEngine.cs#L4-L8)

### Syntax Builders and Worked Example

NoOp policies are instantiated fluently via static factory methods on the `Policy` class. Both non-generic and generic variants are supported.

```csharp
// Build a non-generic NoOp policy
NoOpPolicy noOpPolicy = Policy.NoOp();

// Build a generic NoOp policy returning a string result
NoOpPolicy<string> noOpResultPolicy = Policy.NoOp<string>();

// Execute a delegate through the NoOp policy
string result = noOpResultPolicy.Execute(
    static (context, token) => "Executed without overhead", 
    new Context("OperationKey"), 
    CancellationToken.None);
```

Sources: [src/Polly/NoOp/NoOpSyntax.cs:10-10](https://github.com/App-vNext/Polly/blob/main/src/Polly/NoOp/NoOpSyntax.cs#L10), [src/Polly/NoOp/NoOpTResultSyntax.cs:11-11](https://github.com/App-vNext/Polly/blob/main/src/Polly/NoOp/NoOpTResultSyntax.cs#L11), [src/Polly/NoOp/NoOpPolicy.cs:38-46](https://github.com/App-vNext/Polly/blob/main/src/Polly/NoOp/NoOpPolicy.cs#L38-L46)

## Related

- [[Pooling and Utilities]]

