# Middleware Pipeline

<details>
<summary>Relevant source files</summary>

The following files were used as context for generating this wiki page:

- [src/Illuminate/Foundation/Http/Kernel.php](https://github.com/laravel/framework/blob/main/src/Illuminate/Foundation/Http/Kernel.php)
- [src/Illuminate/Pipeline/Pipeline.php](https://github.com/laravel/framework/blob/main/src/Illuminate/Pipeline/Pipeline.php)
- [src/Illuminate/Foundation/Configuration/Middleware.php](https://github.com/laravel/framework/blob/main/src/Illuminate/Foundation/Configuration/Middleware.php)
- [src/Illuminate/Routing/Router.php](https://github.com/laravel/framework/blob/main/src/Illuminate/Routing/Router.php)
- [src/Illuminate/Foundation/Configuration/ApplicationBuilder.php](https://github.com/laravel/framework/blob/main/src/Illuminate/Foundation/Configuration/ApplicationBuilder.php)
- [src/Illuminate/Foundation/Http/Middleware/HandlePrecognitiveRequests.php](https://github.com/laravel/framework/blob/main/src/Illuminate/Foundation/Http/Middleware/HandlePrecognitiveRequests.php)
- [src/Illuminate/Routing/Middleware/ThrottleRequests.php](https://github.com/laravel/Routing/Middleware/ThrottleRequests.php)
- [src/Illuminate/Foundation/Application.php](https://github.com/laravel/framework/blob/main/src/Illuminate/Foundation/Application.php)
- [src/Illuminate/Routing/Route.php](https://github.com/laravel/Routing/Route.php)
</details>

## Overview

The middleware pipeline serves as the foundational architecture for filtering, inspecting, and transforming HTTP requests and responses as they flow through the Laravel application. Powered by an onion-like closure chaining model managed by the pipeline and HTTP kernel components, it intercepts incoming requests before they reach the router and processes outgoing responses on the return journey. This mechanism solves the challenge of cross-cutting request concerns—such as authentication, session management, CSRF protection, and rate limiting—by decoupling them from core controller logic and executing them in a clean, predictable sequence. Key design decisions include container-based pipe resolution, priority-based sorting to guarantee strict execution ordering, and flexible configuration interfaces provided via application builders.

Sources: [src/Illuminate/Foundation/Http/Kernel.php:171-176](https://github.com/laravel/framework/blob/main/src/Illuminate/Foundation/Http/Kernel.php#L171-L176), [src/Illuminate/Pipeline/Pipeline.php:130-143](https://github.com/laravel/framework/blob/main/src/Illuminate/Pipeline/Pipeline.php#L130-L143)

## Kernel Request Dispatching

### Overview

The HTTP kernel initializes and dispatches incoming web requests into the application pipeline, handling lifecycle tracking, exception reporting, and event dispatching. When an incoming request reaches the kernel via `handle($request)`, the start time is recorded using `Carbon::now()`, HTTP method parameter overrides are enabled, and the request is passed through the router and global middleware stack.

Sources: [src/Illuminate/Foundation/Http/Kernel.php:137-156](https://github.com/laravel/framework/blob/main/src/Illuminate/Foundation/Http/Kernel.php#L137-L156)

### Request Dispatching Call-Chain

The execution sequence for dispatching an incoming HTTP request proceeds through specific named methods on the kernel and application instances:

`Kernel::handle()` → `Kernel::sendRequestThroughRouter()` → `Application::instance()` → `Kernel::bootstrap()` → `Pipeline::send()` → `Kernel::dispatchToRouter()` → `Router::dispatch()`

1. **`Kernel::handle($request)`**: Records `$this->requestStartedAt`, enables HTTP method parameter overrides, and delegates to `sendRequestThroughRouter()`. If a `Throwable` is caught during execution, it is reported via `reportException()` and rendered via `renderException()`. Finally, a `RequestHandled` event is dispatched before returning the response.
Sources: [src/Illuminate/Foundation/Http/Kernel.php:137-156](https://github.com/laravel/framework/blob/main/src/Illuminate/Foundation/Http/Kernel.php#L137-L156)

2. **`Kernel::sendRequestThroughRouter($request)`**: Binds the request instance into the container, clears resolved request instances, invokes `bootstrap()`, and constructs a new `Pipeline` instance.
Sources: [src/Illuminate/Foundation/Http/Kernel.php:164-176](https://github.com/laravel/framework/blob/main/src/Illuminate/Foundation/Http/Kernel.php#L164-L176)

3. **`Kernel::bootstrap()`**: Checks whether the application has been bootstrapped via `Application::hasBeenBootstrapped()`. If not, it executes `Application::bootstrapWith()` using the registered bootstrapper classes.
Sources: [src/Illuminate/Foundation/Http/Kernel.php:183-188](https://github.com/laravel/framework/blob/main/src/Illuminate/Foundation/Http/Kernel.php#L183-L188), [src/Illuminate/Foundation/Application.php:393-400](https://github.com/laravel/framework/blob/main/src/Illuminate/Foundation/Application.php#L393-L400)

4. **`Pipeline` Configuration**: Sends the request through the global middleware stack retrieved via `$this->middleware`, or an empty array if `shouldSkipMiddleware()` evaluates to true, ending with the closure returned by `dispatchToRouter()`.
Sources: [src/Illuminate/Foundation/Http/Kernel.php:172-176](https://github.com/laravel/framework/blob/main/src/Illuminate/Foundation/Http/Kernel.php#L172-L176)

5. **`Kernel::dispatchToRouter()`**: Returns a closure that binds the incoming request instance into the container and delegates the request to `$this->router->dispatch($request)`.
Sources: [src/Illuminate/Foundation/Http/Kernel.php:195-202](https://github.com/laravel/framework/blob/main/src/Illuminate/Foundation/Http/Kernel.php#L195-L202)

> [!NOTE]
> If middleware has been disabled via `shouldSkipMiddleware()`, the pipeline receives an empty array (`[]`) for its pipes, bypassing the global middleware stack entirely and executing the router dispatch closure directly.
> Sources: [src/Illuminate/Foundation/Http/Kernel.php:174](https://github.com/laravel/framework/blob/main/src/Illuminate/Foundation/Http/Kernel.php#L174), [src/Illuminate/Foundation/Application.php:1279-1283](https://github.com/laravel/framework/blob/main/src/Illuminate/Foundation/Application.php#L1279-L1283)

### Application Bootstrappers

The kernel initializes application state by running a sequential array of bootstrapper classes when `bootstrap()` is called.

| Bootstrapper Class | Purpose |
| :--- | :--- |
| `\Illuminate\Foundation\Bootstrap\LoadEnvironmentVariables::class` | Loads environment variable files into the environment configuration. |
| `\Illuminate\Foundation\Bootstrap\LoadConfiguration::class` | Loads application configuration files. |
| `\Illuminate\Foundation\Bootstrap\HandleExceptions::class` | Configures error handling and exception reporting for the application. |
| `\Illuminate\Foundation\Bootstrap\RegisterFacades::class` | Registers application facades in the container. |
| `\Illuminate\Foundation\Bootstrap\RegisterProviders::class` | Registers configured service providers with the application. |
| `\Illuminate\Foundation\Bootstrap\BootProviders::class` | Boots all registered service providers. |

Sources: [src/Illuminate/Foundation/Http/Kernel.php:43-50](https://github.com/laravel/framework/blob/main/src/Illuminate/Foundation/Http/Kernel.php#L43-L50)

## Pipeline Processing Mechanics

### Overview

The `Illuminate\Pipeline\Pipeline` class provides an onion-style execution model where data (`passable`) is passed through a stack of callable pipes or resolved container objects. The pipeline processes execution via `then(Closure $destination)`, leveraging `array_reduce`, `array_reverse`, and `carry()` to construct nested closures.

Sources: [src/Illuminate/Pipeline/Pipeline.php:13-143](https://github.com/laravel/framework/blob/main/src/Illuminate/Pipeline/Pipeline.php#L13-L143)

### Pipeline Execution Walkthrough

The pipeline dispatch mechanism chains individual pipes around a final destination closure. When `then()` is invoked, the execution flow follows a strict sequence:

`Pipeline::then()` → `Pipeline::prepareDestination()` → `Pipeline::carry()` → `Pipeline::parsePipeString()` → `Pipeline::handleCarry()` → `Pipeline::handleException()`

1. **`Pipeline::then(Closure $destination)`**: Combines the reversed array of pipes using `array_reduce()`, initializing the reduction accumulator with `prepareDestination($destination)` and applying the closure returned by `carry()`. It optionally wraps execution in a database transaction via `withinTransaction` or executes `$pipeline($this->passable)` directly, ensuring any registered `finally` callback runs in a `finally` block.
Sources: [src/Illuminate/Pipeline/Pipeline.php:128-143](https://github.com/laravel/framework/blob/main/src/Illuminate/Pipeline/Pipeline.php#L128-L143)

2. **`Pipeline::prepareDestination(Closure $destination)`**: Wraps the final destination callback in a try-catch block that catches any `Throwable` and passes it to `handleException()`.
Sources: [src/Illuminate/Pipeline/Pipeline.php:176-185](https://github.com/laravel/framework/blob/main/src/Illuminate/Pipeline/Pipeline.php#L176-L185)

3. **`Pipeline::carry()`**: Returns a higher-order closure acting as the reducer slice. For each pipe, it checks if the pipe is callable, a string identifier, or an instantiated object.
Sources: [src/Illuminate/Pipeline/Pipeline.php:192-227](https://github.com/laravel/framework/blob/main/src/Illuminate/Pipeline/Pipeline.php#L192-L227)

4. **`Pipeline::parsePipeString($pipe)`**: Parses string-based pipe definitions separated by colons (e.g., `CheckRole:admin,editor`) into a class name and an array of constructor or method parameters using `explode(':', $pipe, 2)` and `explode(',', $parameters)`.
Sources: [src/Illuminate/Pipeline/Pipeline.php:236-247](https://github.com/laravel/framework/blob/main/src/Illuminate/Pipeline/Pipeline.php#L236-L247)

5. **`Pipeline::handleCarry($carry)`**: Receives the return value of the current pipe's method execution and returns it to be fed into the next slice of the onion.
Sources: [src/Illuminate/Pipeline/Pipeline.php:307-310](https://github.com/laravel/framework/blob/main/src/Illuminate/Pipeline/Pipeline.php#L307-L310)

6. **`Pipeline::handleException($passable, Throwable $e)`**: Intercepts any `Throwable` thrown during pipe execution and rethrows it by default.
Sources: [src/Illuminate/Pipeline/Pipeline.php:321-324](https://github.com/laravel/framework/blob/main/src/Illuminate/Pipeline/Pipeline.php#L321-L324)

> [!NOTE]
> If a pipe object implements the method specified by `via()` (defaulting to `handle`), that method is invoked with `($passable, $stack, ...$parameters)`. Otherwise, the pipe object is invoked directly as a function (`$pipe($passable, $stack, ...$parameters)`).
> Sources: [src/Illuminate/Pipeline/Pipeline.php:40-44](https://github.com/laravel/framework/blob/main/src/Illuminate/Pipeline/Pipeline.php#L40-L44), [src/Illuminate/Pipeline/Pipeline.php:218-221](https://github.com/laravel/framework/blob/main/src/Illuminate/Pipeline/Pipeline.php#L218-L221)

### Pipe Resolution and Execution Mechanics

Pipes enter the pipeline through `through($pipes)` or `pipe($pipes)`, which normalize inputs into an internal array via `func_get_args()` or array checks. During reduction, `carry()` branches based on the pipe type:

| Pipe Type | Resolution Mechanism | Invocation Arguments |
| :--- | :--- | :--- |
| **Callable** (`is_callable`) | Executed directly without container resolution. | `($passable, $stack)` |
| **String** (`!is_object`) | Parsed via `parsePipeString()`, resolved via container `make($name)`. | `[$passable, $stack, ...$parameters]` |
| **Object** (`is_object`) | Used as-is without container resolution or string parsing. | `[$passable, $stack]` |

Sources: [src/Illuminate/Pipeline/Pipeline.php:89-107](https://github.com/laravel/framework/blob/main/src/Illuminate/Pipeline/Pipeline.php#L89-L107), [src/Illuminate/Pipeline/Pipeline.php:197-216](https://github.com/laravel/framework/blob/main/src/Illuminate/Pipeline/Pipeline.php#L197-L216)

> [!WARNING]
> If a pipeline instance is executed without setting a container using `setContainer()`, calling `getContainer()` during string-based pipe resolution throws a `RuntimeException` stating "A container instance has not been passed to the Pipeline."
> Sources: [src/Illuminate/Pipeline/Pipeline.php:279-286](https://github.com/laravel/framework/blob/main/src/Illuminate/Pipeline/Pipeline.php#L279-L286)

### Pipeline Design Trade-Offs

| Design Choice | Benefit | Cost |
| :--- | :--- | :--- |
| **Onion Closure Chaining (`array_reduce`)** | Enables bidirectional request/response wrapping and middleware nesting. | Increases stack trace depth and memory overhead with large pipe counts. |
| **String Pipe Parsing with Parameters** | Allows concise string definitions with inline arguments (e.g. `role:admin`). | Requires container resolution and string parsing overhead per request. |
| **Optional Database Transaction Wrapping** | Automatically scopes pipeline execution inside a database transaction when configured. | Couples execution flow to database connection state and transaction handlers. |

Sources: [src/Illuminate/Pipeline/Pipeline.php:54-58](https://github.com/laravel/framework/blob/main/src/Illuminate/Pipeline/Pipeline.php#L54-L58), [src/Illuminate/Pipeline/Pipeline.php:130-137](https://github.com/laravel/framework/blob/main/src/Illuminate/Pipeline/Pipeline.php#L130-L137), [src/Illuminate/Pipeline/Pipeline.php:202-210](https://github.com/laravel/framework/blob/main/src/Illuminate/Pipeline/Pipeline.php#L202-L210), [src/Illuminate/Pipeline/Pipeline.php:236-247](https://github.com/laravel/framework/blob/main/src/Illuminate/Pipeline/Pipeline.php#L236-L247)

## Middleware Stack Configuration

### Overview

Declarative configuration of global middleware, routing groups, custom aliases, and execution priority sorting is managed through `ApplicationBuilder::withMiddleware()` paired with the `Illuminate\Foundation\Configuration\Middleware` configuration class. Rather than configuring kernel arrays imperatively, developers invoke fluent methods on the `Middleware` instance passed into the configuration callback.
Sources: [src/Illuminate/Foundation/Configuration/ApplicationBuilder.php:287-326](https://github.com/laravel/framework/blob/main/src/Illuminate/Foundation/Configuration/ApplicationBuilder.php#L287-L326), [src/Illuminate/Foundation/Configuration/Middleware.php:21-163](https://github.com/laravel/framework/blob/main/src/Illuminate/Foundation/Configuration/Middleware.php#L21-L163)

### Application Builder Middleware Integration

The registration lifecycle wires up container resolution hooks for both HTTP and Console kernels. When the HTTP kernel resolves, an instance of `Middleware` is instantiated, pre-configured with a default guest redirect, exposed to the user callback, and finally compiled into kernel properties.
Sources: [src/Illuminate/Foundation/Configuration/ApplicationBuilder.php:287-326](https://github.com/laravel/framework/blob/main/src/Illuminate/Foundation/Configuration/ApplicationBuilder.php#L287-L326)

Tracing the execution path during `withMiddleware()`:
1. **`ApplicationBuilder::withMiddleware(?callable $callback)`**: Registers an `afterResolving` listener on `HttpKernel::class`.
Sources: [src/Illuminate/Foundation/Configuration/ApplicationBuilder.php:287-290](https://github.com/laravel/framework/blob/main/src/Illuminate/Foundation/Configuration/ApplicationBuilder.php#L287-L290)
2. **`Middleware` instantiation**: Creates a new `Middleware` object and sets the default guest redirect using `redirectGuestsTo(fn () => route('login'))`.
Sources: [src/Illuminate/Foundation/Configuration/Middleware.php:539-546](https://github.com/laravel/framework/blob/main/src/Illuminate/Foundation/Configuration/Middleware.php#L539-L546), [src/Illuminate/Foundation/Configuration/ApplicationBuilder.php:290-291](https://github.com/laravel/framework/blob/main/src/Illuminate/Foundation/Configuration/ApplicationBuilder.php#L290-L291)
3. **User callback execution**: If a `$callback` is provided, it invokes `$callback($middleware)` allowing custom modifications.
Sources: [src/Illuminate/Foundation/Configuration/ApplicationBuilder.php:293-295](https://github.com/laravel/framework/blob/main/src/Illuminate/Foundation/Configuration/ApplicationBuilder.php#L293-L295)
4. **Kernel compilation**: Extracts page middleware, global middleware, groups, aliases, and priorities from the configured `Middleware` instance and assigns them to the kernel via `setGlobalMiddleware()`, `setMiddlewareGroups()`, `setMiddlewareAliases()`, and `setMiddlewarePriority()`.
Sources: [src/Illuminate/Foundation/Configuration/ApplicationBuilder.php:297-316](https://github.com/laravel/framework/blob/main/src/Illuminate/Foundation/Configuration/ApplicationBuilder.php#L297-L316)

> [!NOTE]
> For console kernels, `withMiddleware()` registers a separate `afterResolving` listener that invokes the user callback with a fresh `Middleware` instance for command-line context, but does not compile HTTP middleware properties.
> Sources: [src/Illuminate/Foundation/Configuration/ApplicationBuilder.php:319-323](https://github.com/laravel/framework/blob/main/src/Illuminate/Foundation/Configuration/ApplicationBuilder.php#L319-L323)

### Configuration Methods and Operations

The `Middleware` class provides fluent modifiers for managing stack entries. Global middleware can be prepended, appended, removed, or fully replaced. Groups such as `web` and `api` support targeted append, prepend, remove, and replace operations via helper methods or group-specific shortcuts.

| Method Signature | Action | Target Property / Behavior |
| :--- | :--- | :--- |
| `prepend(array\|string $middleware)` | Prepends middleware to the global stack. | `$this->prepends` |
| `append(array\|string $middleware)` | Appends middleware to the global stack. | `$this->appends` |
| `remove(array\|string $middleware)` | Removes middleware from the global stack. | `$this->removals` |
| `replace(string $search, string $replace)` | Replaces a specific global middleware class. | `$this->replacements` |
| `use(array $middleware)` | Overrides the entire global middleware stack. | `$this->global` |
| `group(string $group, array $middleware)` | Defines or overrides a middleware group. | `$this->groups` |
| `prependToGroup(string $group, array\|string $middleware)` | Prepends middleware to a named group. | `$this->groupPrepends` |
| `appendToGroup(string $group, array\|string $middleware)` | Appends middleware to a named group. | `$this->groupAppends` |
| `removeFromGroup(string $group, array\|string $middleware)` | Removes middleware from a named group. | `$this->groupRemovals` |
| `replaceInGroup(string $group, string $search, string $replace)` | Replaces middleware inside a named group. | `$this->groupReplacements` |

Sources: [src/Illuminate/Foundation/Configuration/Middleware.php:169-316](https://github.com/laravel/framework/blob/main/src/Illuminate/Foundation/Configuration/Middleware.php#L169-L316)

> [!TIP]
> When `getGlobalMiddleware()` compiles the final stack, it evaluates user-defined global overrides (`$this->global`), applies class replacements, merges prepended and appended arrays via `array_merge`, removes flagged classes via `array_diff`, and ensures uniqueness.
> Sources: [src/Illuminate/Foundation/Configuration/Middleware.php:451-474](https://github.com/laravel/framework/blob/main/src/Illuminate/Foundation/Configuration/Middleware.php#L451-L474)

### Default Aliases and Priority Configuration

The framework defines built-in middleware aliases and sorting priorities which can be extended or modified declaratively. Custom aliases registered via `alias(array $aliases)` are merged with default aliases during `getMiddlewareAliases()`.

```php
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withMiddleware(function (Middleware $middleware) {
        $middleware->append(\App\Http\Middleware\CustomGlobalMiddleware::class);
        $middleware->alias([
            'role' => \App\Http\Middleware\CheckRole::class,
        ]);
        $middleware->priority([
            \Illuminate\Cookie\Middleware\EncryptCookies::class,
            \Illuminate\Session\Middleware\StartSession::class,
        ]);
    })->create();
```
Sources: [src/Illuminate/Foundation/Configuration/ApplicationBuilder.php:287-326](https://github.com/laravel/framework/blob/main/src/Illuminate/Foundation/Configuration/ApplicationBuilder.php#L287-L326), [src/Illuminate/Foundation/Configuration/Middleware.php:398-416](https://github.com/laravel/framework/blob/main/src/Illuminate/Foundation/Configuration/Middleware.php#L398-L416), [src/Illuminate/Foundation/Configuration/Middleware.php:793-826](https://github.com/laravel/framework/blob/main/src/Illuminate/Foundation/Configuration/Middleware.php#L793-L826)

## Route Middleware Resolution

### Overview

When a matched route is dispatched during an incoming request, the router gathers its associated middleware stack by evaluating definitions attached directly to the route, its controller, and any surrounding route groups. This collection phase is triggered via `runRouteWithinStack()`, which calls `gatherRouteMiddleware()` on the router instance.
Sources: [src/Illuminate/Routing/Router.php:811-835](https://github.com/laravel/framework/blob/main/src/Illuminate/Routing/Router.php#L811-L835)

### Middleware Gathering and Resolution Call Chain

The execution path for resolving route middleware proceeds through a defined series of calls:
`runRouteWithinStack()` → `gatherRouteMiddleware()` → `Route::gatherMiddleware()` → `resolveMiddleware()` → `MiddlewareNameResolver::resolve()` → `sortMiddleware()`
Sources: [src/Illuminate/Routing/Router.php:811-835](https://github.com/laravel/framework/blob/main/src/Illuminate/Routing/Router.php#L811-L835), [src/Illuminate/Routing/Router.php:844-882](https://github.com/laravel/framework/blob/main/src/Illuminate/Routing/Router.php#L844-L882)

The router checks if middleware is disabled via the container binding `middleware.disable`. If active, middleware gathering returns an empty array; otherwise, it invokes `gatherRouteMiddleware($route)`.
Sources: [src/Illuminate/Routing/Router.php:813-816](https://github.com/laravel/framework/blob/main/src/Illuminate/Routing/Router.php#L813-L816)

Inside `resolveMiddleware()`, raw middleware identifiers and groups are mapped through `MiddlewareNameResolver::resolve()`. Excluded middleware classes or inheritance hierarchies are filtered out using `ReflectionClass` subclass checks. Finally, the collection is passed to `sortMiddleware()`, which relies on `SortedMiddleware` to order entries according to the router's `$middlewarePriority` array.
Sources: [src/Illuminate/Routing/Router.php:844-893](https://github.com/laravel/framework/blob/main/src/Illuminate/Routing/Router.php#L844-L893)

> [!WARNING]
> When evaluating excluded middleware, `resolveMiddleware()` checks not only for exact class matches but also uses reflection via `$reflection->isSubclassOf($exclude)` to reject any middleware extending an excluded base class.
> Sources: [src/Illuminate/Routing/Router.php:868-877](https://github.com/laravel/framework/blob/main/src/Illuminate/Routing/Router.php#L868-L877)

## Specialized Middleware Handlers

### Overview

Specialized middleware handlers encapsulate targeted request processing logic such as live validation preview (Precognition) and rate limiting (Request Throttling). These handlers intercept incoming requests to modify container bindings, evaluate rate limits against the cache rate limiter, and append specialized response headers before handing off control to subsequent pipeline layers.
Sources: [src/Illuminate/Foundation/Http/Middleware/HandlePrecognitiveRequests.php:31-56](https://github.com/laravel/framework/blob/main/src/Illuminate/Foundation/Http/Middleware/HandlePrecognitiveRequests.php#L31-L56), [src/Illuminate/Routing/Middleware/ThrottleRequests.php:73-106](https://github.com/laravel/Routing/Middleware/ThrottleRequests.php#L73-L106)

### Precognition Request Handling Flow

The `HandlePrecognitiveRequests` middleware inspects whether an incoming HTTP request is attempting Precognition via `$request->isAttemptingPrecognition()`. If the request is not precognitive, it delegates to `$next($request)` and appends the `Vary: Precognition` header to the response.
Sources: [src/Illuminate/Foundation/Http/Middleware/HandlePrecognitiveRequests.php:37-41](https://github.com/laravel/framework/blob/main/src/Illuminate/Foundation/Http/Middleware/HandlePrecognitiveRequests.php#L37-L41)

When a precognitive request is detected, the middleware executes a precise modification and restoration call chain:
`handle()` → `prepareForPrecognition()` → `$next($request)` → `tap()` response modification → `restoreDispatchers()`
Sources: [src/Illuminate/Foundation/Http/Middleware/HandlePrecognitiveRequests.php:37-56](https://github.com/laravel/framework/blob/main/src/Illuminate/Foundation/Http/Middleware/HandlePrecognitiveRequests.php#L37-L56)

During `prepareForPrecognition()`, the request attribute `precognitive` is set to `true`, and the container bindings for `CallableDispatcherContract` and `ControllerDispatcherContract` are swapped with `PrecognitionCallableDispatcher` and `PrecognitionControllerDispatcher`. Upon completion of the request lifecycle, `restoreDispatchers()` reads the original bindings captured before execution and restores them on the container.
Sources: [src/Illuminate/Foundation/Http/Middleware/HandlePrecognitiveRequests.php:64-103](https://github.com/laravel/framework/blob/main/src/Illuminate/Foundation/Http/Middleware/HandlePrecognitiveRequests.php#L64-L103)

> [!NOTE]
> `HandlePrecognitiveRequests` ensures that dispatcher container bindings are safely restored even when exceptions occur during request handling by wrapping post-processing inside a `tap()` callback.
> Sources: [src/Illuminate/Foundation/Http/Middleware/HandlePrecognitiveRequests.php:49-55](https://github.com/laravel/framework/blob/main/src/Illuminate/Foundation/Http/Middleware/HandlePrecognitiveRequests.php#L49-L55)

### Request Throttling Mechanics

The `ThrottleRequests` middleware interacts with the `RateLimiter` cache instance to enforce attempt caps per signature or named limiter configuration. Request signatures are resolved through `resolveRequestSignature()`, prioritizing authenticated user identifiers (`$user->getAuthIdentifier()`) or falling back to route domain and client IP (`$route->getDomain() . '|' . $request->ip()`).
Sources: [src/Illuminate/Routing/Middleware/ThrottleRequests.php:41-44](https://github.com/laravel/Routing/Middleware/ThrottleRequests.php#L41-L44), [src/Illuminate/Routing/Middleware/ThrottleRequests.php:224-233](https://github.com/laravel/Routing/Middleware/ThrottleRequests.php#L224-L233)

When handling requests, `ThrottleRequests` evaluates whether attempt counts exceed configured maximums before execution via `tooManyAttempts()`. If the limit is breached, it throws a `ThrottleRequestsException` or a custom `HttpResponseException` via `buildException()`.
Sources: [src/Illuminate/Routing/Middleware/ThrottleRequests.php:156-160](https://github.com/laravel/Routing/Middleware/ThrottleRequests.php#L156-L160), [src/Illuminate/Routing/Middleware/ThrottleRequests.php:244-257](https://github.com/laravel/Routing/Middleware/ThrottleRequests.php#L244-L257)

| Throttling Method / Helper | Purpose | Parameters / Return Type | Sources |
| :--- | :--- | :--- | :--- |
| `ThrottleRequests::using()` | Specifies a named rate limiter to load via container or limiter registry | `UnitEnum\|string $name` → `string` | [src/Illuminate/Routing/Middleware/ThrottleRequests.php:52-55](https://github.com/laravel/Routing/Middleware/ThrottleRequests.php#L52-L55) |
| `ThrottleRequests::with()` | Specifies inline rate limiter configuration parameters | `int $maxAttempts`, `int $decayMinutes`, `string $prefix` → `string` | [src/Illuminate/Routing/Middleware/ThrottleRequests.php:67-70](https://github.com/laravel/Routing/Middleware/ThrottleRequests.php#L67-L70) |
| `resolveMaxAttempts()` | Resolves dynamic or pipe-delimited attempt numbers for users | `Request $request`, `int\|string $maxAttempts` → `int` | [src/Illuminate/Routing/Middleware/ThrottleRequests.php:194-214](https://github.com/laravel/Routing/Middleware/ThrottleRequests.php#L194-L214) |
| `resolveRequestSignature()` | Generates a unique rate-limit key based on auth state or IP | `Request $request` → `string` | [src/Illuminate/Routing/Middleware/ThrottleRequests.php:224-233](https://github.com/laravel/Routing/Middleware/ThrottleRequests.php#L224-L233) |
| `shouldHashKeys()` | Toggles whether rate limiter keys are hashed using SHA-1/MD5 | `bool $shouldHashKeys = true` → `void` | [src/Illuminate/Routing/Middleware/ThrottleRequests.php:351-354](https://github.com/laravel/Routing/Middleware/ThrottleRequests.php#L351-L354) |

> [!WARNING]
> If a named rate limiter returns an instance of `Illuminate\Cache\RateLimiting\Unlimited`, the middleware bypasses throttling entirely and directly returns `$next($request)`.
> Sources: [src/Illuminate/Routing/Middleware/ThrottleRequests.php:125-127](https://github.com/laravel/Routing/Middleware/ThrottleRequests.php#L125-L127)

## Related

- [[HTTP Request & Response]]
- [[Routing System]]

