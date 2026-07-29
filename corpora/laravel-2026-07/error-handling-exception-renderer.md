# Error Handling & Exception Renderer

<details>
<summary>Relevant source files</summary>

The following files were used as context for generating this wiki page:

- [src/Illuminate/Foundation/Exceptions/Handler.php](https://github.com/laravel/framework/blob/main/src/Illuminate/Foundation/Exceptions/Handler.php)
- [src/Illuminate/Foundation/Bootstrap/HandleExceptions.php](https://github.com/laravel/framework/blob/main/src/Illuminate/Foundation/Bootstrap/HandleExceptions.php)
- [src/Illuminate/Foundation/Providers/FoundationServiceProvider.php](https://github.com/laravel/framework/blob/main/src/Illuminate/Foundation/Providers/FoundationServiceProvider.php)
- [src/Illuminate/Foundation/Exceptions/Renderer/Exception.php](https://github.com/laravel/framework/blob/main/src/Illuminate/Foundation/Exceptions/Renderer/Exception.php)
- [src/Illuminate/Foundation/Exceptions/Renderer/Renderer.php](https://github.com/laravel/framework/blob/main/src/Illuminate/Foundation/Exceptions/Renderer/Renderer.php)
- [src/Illuminate/Support/Facades/Exceptions.php](https://github.com/laravel/framework/blob/main/src/Illuminate/Support/Facades/Exceptions.php)
- [src/Illuminate/Foundation/Exceptions/Whoops/WhoopsExceptionRenderer.php](https://github.com/laravel/framework/blob/main/src/Illuminate/Foundation/Exceptions/Whoops/WhoopsExceptionRenderer.php)
- [src/Illuminate/Foundation/Exceptions/Renderer/Frame.php](https://github.com/laravel/framework/blob/main/src/Illuminate/Foundation/Exceptions/Renderer/Frame.php)
- [src/Illuminate/Contracts/Foundation/ExceptionRenderer.php](https://github.com/laravel/framework/blob/main/src/Illuminate/Contracts/Foundation/ExceptionRenderer.php)
- [src/Illuminate/Foundation/Configuration/Exceptions.php](https://github.com/laravel/framework/blob/main/src/Illuminate/Foundation/Configuration/Exceptions.php)
- [src/Illuminate/Foundation/resources/exceptions/renderer/show.blade.php](https://github.com/laravel/framework/blob/main/src/Illuminate/Foundation/resources/exceptions/renderer/show.blade.php)
- [src/Illuminate/Foundation/resources/exceptions/renderer/markdown.blade.php](https://github.com/laravel/framework/blob/main/src/Illuminate/Foundation/resources/exceptions/renderer/markdown.blade.php)
- [src/Illuminate/Contracts/Debug/ExceptionHandler.php](https://github.com/laravel/framework/blob/main/src/Illuminate/Contracts/Debug/ExceptionHandler.php)
- [src/Illuminate/Foundation/Testing/Concerns/InteractsWithExceptionHandling.php](https://github.com/laravel/framework/blob/main/src/Illuminate/Foundation/Testing/Concerns/InteractsWithExceptionHandling.php)
- [src/Illuminate/Foundation/resources/exceptions/renderer/components/header.blade.php](https://github.com/laravel/framework/blob/main/src/Illuminate/Foundation/resources/exceptions/renderer/components/header.blade.php)
- [types/Foundation/Configuration/Exceptions.php](https://github.com/laravel/framework/blob/main/types/Foundation/Configuration/Exceptions.php)
- [src/Illuminate/Foundation/Exceptions/views/layout.blade.php](https://github.com/laravel/framework/blob/main/src/Illuminate/Foundation/Exceptions/views/layout.blade.php)
- [src/Illuminate/Foundation/resources/exceptions/renderer/components/trace.blade.php](https://github.com/laravel/framework/blob/main/src/Illuminate/Foundation/resources/exceptions/renderer/components/trace.blade.php)
</details>

## Overview

Laravel’s error handling and exception rendering architecture provides a robust, extensible pipeline for capturing runtime errors, reporting them to logging services, and transforming them into appropriate HTTP or console responses. By bootstrapping native PHP error handlers, setting up robust suppression and context building, and integrating specialized rendering engines like Whoops and custom Blade views, the framework ensures that exceptions are managed predictably across both production and development environments. Sources: [src/Illuminate/Foundation/Exceptions/Handler.php#L56-L1212](https://github.com/laravel/framework/blob/main/src/Illuminate/Foundation/Exceptions/Handler.php#L56-L1212), [src/Illuminate/Foundation/Bootstrap/HandleExceptions.php#L19-L360](https://github.com/laravel/framework/blob/main/src/Illuminate/Foundation/Bootstrap/HandleExceptions.php#L19-L360), [src/Illuminate/Foundation/Providers/FoundationServiceProvider.php#L39-L298](https://github.com/laravel/framework/blob/main/src/Illuminate/Foundation/Providers/FoundationServiceProvider.php#L39-L298), [src/Illuminate/Foundation/Exceptions/Renderer/Exception.php#L13-L294](https://github.com/laravel/framework/blob/main/src/Illuminate/Foundation/Exceptions/Renderer/Exception.php#L13-L294), [src/Illuminate/Foundation/Exceptions/Renderer/Renderer.php#L11-L132](https://github.com/laravel/framework/blob/main/src/Illuminate/Foundation/Exceptions/Renderer/Renderer.php#L11-L132)

## Exception Handling Contracts and Facades

### Exception Handling Contracts and Facades

Laravel defines the core exception handling behavior through public contract interfaces and static facade bindings. The primary interface contract is `Illuminate\Contracts\Debug\ExceptionHandler`, which outlines the standard framework methods required for processing and presenting exceptions. This contract mandates methods for reporting or logging an exception via `report(Throwable $e)`, determining reporting eligibility via `shouldReport(Throwable $e)`, rendering exceptions into HTTP responses via `render($request, Throwable $e)`, and formatting output for the console via `renderForConsole($output, Throwable $e)`. Additionally, the internal contract `Illuminate\Contracts\Foundation\ExceptionRenderer` specifies a dedicated interface for rendering a given throwable specifically as an HTML string using its `render($throwable)` method.

Sources: [src/Illuminate/Contracts/Debug/ExceptionHandler.php#L12-L53](https://github.com/laravel/framework/blob/main/src/Illuminate/Contracts/Debug/ExceptionHandler.php#L12-L53), [src/Illuminate/Contracts/Foundation/ExceptionRenderer.php#L5-L14](https://github.com/laravel/framework/blob/main/src/Illuminate/Contracts/Foundation/ExceptionRenderer.php#L5-L14)

### Facade Binding and Component Access

The `Illuminate\Support\Facades\Exceptions` facade proxies static method calls directly to the underlying `ExceptionHandler` container binding (`ExceptionHandler::class`), while also supporting testing assertions through `ExceptionHandlerFake`. The facade's `getFacadeAccessor()` method resolves the component name using `ExceptionHandler::class`. 

When invoking `Exceptions::fake(array|string $exceptions = [])`, the facade inspects whether an existing fake is active via `static::isFake()`. If a fake is already registered, it retrieves the inner handler from the root via `static::getFacadeRoot()->handler()`; otherwise, it targets the current root instance. It then instantiates an `ExceptionHandlerFake` wrapping the handler and target exceptions, swaps the container binding, and returns the fake instance.

```php
public static function fake(array|string $exceptions = [])
{
    $exceptionHandler = static::isFake()
        ? static::getFacadeRoot()->handler()
        : static::getFacadeRoot();

    return tap(new ExceptionHandlerFake($exceptionHandler, Arr::wrap($exceptions)), function ($fake) {
        static::swap($fake);
    });
}
```

Sources: [src/Illuminate/Support/Facades/Exceptions.php#L47-L74](https://github.com/laravel/framework/blob/main/src/Illuminate/Support/Facades/Exceptions.php#L47-L74)

## PHP Error Bootstrapping and Shutdown Handling

### PHP Error Bootstrapping and Shutdown Handling

### Overview

The `Illuminate\Foundation\Bootstrap\HandleExceptions` class initializes runtime error capture during the application bootstrap phase. When `bootstrap(Application $app)` is invoked, it allocates 32,768 bytes of reserved memory (`str_repeat('x', 32768)`) to prevent out-of-memory crashes from obscuring fatal errors, stores the application instance, forces error reporting to `-1`, and registers native PHP handlers via `set_error_handler`, `set_exception_handler`, and `register_shutdown_function`. Unless running within a testing environment, `display_errors` is set to `Off`.

Sources: [src/Illuminate/Foundation/Bootstrap/HandleExceptions.php#L41-L58](https://github.com/laravel/framework/blob/main/src/Illuminate/Foundation/Bootstrap/HandleExceptions.php#L41-L58)

### Call-Chain Execution Walkthrough

When PHP encounters a runtime error, uncaught exception, or fatal termination, the bootstrapper routes execution through dedicated internal methods:

1. **Error interception:** `handleError($level, $message, $file, $line)` checks if the error level is a deprecation via `isDeprecation($level)`. If true, it calls `handleDeprecationError(...)`. Otherwise, if `error_reporting() & $level` matches, it throws a new `ErrorException`.
2. **Exception handling:** `handleException(Throwable $e)` nullifies `static::$reservedMemory` to free emergency space, reports the throwable through the container's `ExceptionHandler`, and checks `runningInConsole()` to branch between `renderForConsole()` or `renderHttpResponse()`.
3. **Shutdown handling:** `handleShutdown()` nullifies `static::$reservedMemory` and inspects `error_get_last()`. If an error exists and `isFatal($error['type'])` evaluates to true, it generates a `FatalError` via `fatalErrorFromPhpError($error, 0)` and passes it directly to `handleException()`.

Sources: [src/Illuminate/Foundation/Bootstrap/HandleExceptions.php#L41-L58](https://github.com/laravel/framework/blob/main/src/Illuminate/Foundation/Bootstrap/HandleExceptions.php#L41-L58), [src/Illuminate/Foundation/Bootstrap/HandleExceptions.php#L71-L78](https://github.com/laravel/framework/blob/main/src/Illuminate/Foundation/Bootstrap/HandleExceptions.php#L71-L78), [src/Illuminate/Foundation/Bootstrap/HandleExceptions.php#L186-L205](https://github.com/laravel/framework/blob/main/src/Illuminate/Foundation/Bootstrap/HandleExceptions.php#L186-L205), [src/Illuminate/Foundation/Bootstrap/HandleExceptions.php#L234-L241](https://github.com/laravel/framework/blob/main/src/Illuminate/Foundation/Bootstrap/HandleExceptions.php#L234-L241)

> [!WARNING]
> During memory exhaustion, `handleException()` and `handleShutdown()` immediately set `static::$reservedMemory = null`. This explicit release frees the pre-allocated 32KB string buffer so that error rendering and logging routines possess sufficient memory overhead to execute without triggering secondary exhaustion.
> 
> Sources: [src/Illuminate/Foundation/Bootstrap/HandleExceptions.php#L188-L188](https://github.com/laravel/framework/blob/main/src/Illuminate/Foundation/Bootstrap/HandleExceptions.php#L188-L188), [src/Illuminate/Foundation/Bootstrap/HandleExceptions.php#L236-L236](https://github.com/laravel/framework/blob/main/src/Illuminate/Foundation/Bootstrap/HandleExceptions.php#L236-L236)

### Error Types and Levels Reference

The `HandleExceptions` bootstrapper evaluates specific error constants to determine classification and handling behavior.

| Method / Check | Evaluated Constants / Values | Purpose | Sources |
| :--- | :--- | :--- | :--- |
| `isDeprecation($level)` | `E_DEPRECATED`, `E_USER_DEPRECATED` | Identifies whether an error level represents a PHP deprecation warning. | [src/Illuminate/Foundation/Bootstrap/HandleExceptions.php#L273-L276](https://github.com/laravel/framework/blob/main/src/Illuminate/Foundation/Bootstrap/HandleExceptions.php#L273-L276) |
| `isFatal($type)` | `E_COMPILE_ERROR`, `E_CORE_ERROR`, `E_ERROR`, `E_PARSE` | Determines if a shutdown error array describes a fatal execution halt. | [src/Illuminate/Foundation/Bootstrap/HandleExceptions.php#L284-L287](https://github.com/laravel/framework/blob/main/src/Illuminate/Foundation/Bootstrap/HandleExceptions.php#L284-L287) |
| `bootstrap($app)` | `-1` (error reporting) | Sets `error_reporting(-1)` to capture all available PHP error levels. | [src/Illuminate/Foundation/Bootstrap/HandleExceptions.php#L47-L47](https://github.com/laravel/framework/blob/main/src/Illuminate/Foundation/Bootstrap/HandleExceptions.php#L47-L47) |

Sources: [src/Illuminate/Foundation/Bootstrap/HandleExceptions.php#L47-L47](https://github.com/laravel/framework/blob/main/src/Illuminate/Foundation/Bootstrap/HandleExceptions.php#L47-L47), [src/Illuminate/Foundation/Bootstrap/HandleExceptions.php#L273-L276](https://github.com/laravel/framework/blob/main/src/Illuminate/Foundation/Bootstrap/HandleExceptions.php#L273-L276), [src/Illuminate/Foundation/Bootstrap/HandleExceptions.php#L284-L287](https://github.com/laravel/framework/blob/main/src/Illuminate/Foundation/Bootstrap/HandleExceptions.php#L284-L287)

## Handler Pipeline and Exception Reporting

### Overview

The Illuminate exception handler coordinates reporting workflows, duplicate suppression, context augmentation, and type mapping through `Illuminate\Foundation\Exceptions\Handler`. When an application encounters a failure, the handler inspects, maps, and processes the exception before passing it to logging channels or rendering mechanisms.

Sources: [src/Illuminate/Foundation/Exceptions/Handler.php#L56-L1212](https://github.com/laravel/framework/blob/main/src/Illuminate/Foundation/Exceptions/Handler.php#L56-L1212)

### Call-Chain Execution Walkthrough

When an exception is passed to the handler for logging or notification, it traverses a strict execution pipeline:

1. **Mapping:** `report(Throwable $e)` initiates by calling `mapException($e)`, which unwraps inner exceptions via `getInnerException()` or translates types using registered `exceptionMap` closures.
2. **Filtering:** `shouldntReport($e)` evaluates whether the exception is flagged by duplicate suppression (`withoutDuplicates`), implements `ShouldntReport`, matches types in `dontReport` or `internalDontReport`, satisfies `dontReportCallbacks`, or exceeds rate limits configured via `throttle()`.
3. **Dispatching:** If reporting is approved, `reportThrowable($e)` executes. It marks the exception inside `reportedExceptionMap`, attempts to invoke an instance-level `report()` method on the exception object if callable, iterates through custom `reportCallbacks`, retrieves a logger instance via `newLogger()`, maps the log level through `mapLogLevel($e)`, and builds diagnostic context.

Sources: [src/Illuminate/Foundation/Exceptions/Handler.php#L425-L434](https://github.com/laravel/framework/blob/main/src/Illuminate/Foundation/Exceptions/Handler.php#L425-L434), [src/Illuminate/Foundation/Exceptions/Handler.php#L444-L480](https://github.com/laravel/framework/blob/main/src/Illuminate/Foundation/Exceptions/Handler.php#L444-L480), [src/Illuminate/Foundation/Exceptions/Handler.php#L507-L545](https://github.com/laravel/framework/blob/main/src/Illuminate/Foundation/Exceptions/Handler.php#L507-L545), [src/Illuminate/Foundation/Exceptions/Handler.php#L782-L796](https://github.com/laravel/framework/blob/main/src/Illuminate/Foundation/Exceptions/Handler.php#L782-L796)

> [!NOTE]
> During exception reporting, `reportThrowable()` temporarily reassigns `currentlyReporting` to the active exception, allowing `isReporting(Throwable $e)` to prevent infinite recursion loops if logging infrastructure itself throws exceptions.
> 
> Sources: [src/Illuminate/Foundation/Exceptions/Handler.php#L467-L479](https://github.com/laravel/framework/blob/main/src/Illuminate/Foundation/Exceptions/Handler.php#L467-L479), [src/Illuminate/Foundation/Exceptions/Handler.php#L485-L488](https://github.com/laravel/framework/blob/main/src/Illuminate/Foundation/Exceptions/Handler.php#L485-L488)

### Internal Ignored Exceptions

By default, the handler suppresses logging for common framework exceptions that represent standard operational flow control rather than system failures.

| Exception Class | Description / Context | Sources |
| :--- | :--- | :--- |
| `Illuminate\Auth\AuthenticationException` | Unauthenticated visitor redirect or response flow. | [src/Illuminate/Foundation/Exceptions/Handler.php#L171-L171](https://github.com/laravel/framework/blob/main/src/Illuminate/Foundation/Exceptions/Handler.php#L171-L171) |
| `Illuminate\Auth\Access\AuthorizationException` | Policy or gate authorization denial. | [src/Illuminate/Foundation/Exceptions/Handler.php#L172-L172](https://github.com/laravel/framework/blob/main/src/Illuminate/Foundation/Exceptions/Handler.php#L172-L172) |
| `Illuminate\Routing\Exceptions\BackedEnumCaseNotFoundException` | Invalid routing parameter enum binding. | [src/Illuminate/Foundation/Exceptions/Handler.php#L173-L173](https://github.com/laravel/framework/blob/main/src/Illuminate/Foundation/Exceptions/Handler.php#L173-L173) |
| `Symfony\Component\HttpKernel\Exception\HttpException` | Standard HTTP status exceptions. | [src/Illuminate/Foundation/Exceptions/Handler.php#L174-L174](https://github.com/laravel/framework/blob/main/src/Illuminate/Foundation/Exceptions/Handler.php#L174-L174) |
| `Illuminate\Http\Exceptions\HttpResponseException` | Direct short-circuit response exceptions. | [src/Illuminate/Foundation/Exceptions/Handler.php#L175-L175](https://github.com/laravel/framework/blob/main/src/Illuminate/Foundation/Exceptions/Handler.php#L175-L175) |
| `Illuminate\Database\Eloquent\ModelNotFoundException` | Database query model lookup failure. | [src/Illuminate/Foundation/Exceptions/Handler.php#L176-L176](https://github.com/laravel/framework/blob/main/src/Illuminate/Foundation/Exceptions/Handler.php#L176-L176) |
| `Illuminate\Http\Exceptions\OriginMismatchException` | CSRF or request origin mismatch. | [src/Illuminate/Foundation/Exceptions/Handler.php#L177-L177](https://github.com/laravel/framework/blob/main/src/Illuminate/Foundation/Exceptions/Handler.php#L177-L177) |
| `Illuminate\Database\RecordNotFoundException` | Database record retrieval failure. | [src/Illuminate/Foundation/Exceptions/Handler.php#L178-L178](https://github.com/laravel/framework/blob/main/src/Illuminate/Foundation/Exceptions/Handler.php#L178-L178) |
| `Illuminate\Database\RecordsNotFoundException` | Database collection record absence. | [src/Illuminate/Foundation/Exceptions/Handler.php#L179-L179](https://github.com/laravel/framework/blob/main/src/Illuminate/Foundation/Exceptions/Handler.php#L179-L179) |
| `Symfony\Component\HttpFoundation\Exception\RequestExceptionInterface` | Malformed HTTP request interface errors. | [src/Illuminate/Foundation/Exceptions/Handler.php#L180-L180](https://github.com/laravel/framework/blob/main/src/Illuminate/Foundation/Exceptions/Handler.php#L180-L180) |
| `Illuminate\Session\TokenMismatchException` | Expired or invalid CSRF session tokens. | [src/Illuminate/Foundation/Exceptions/Handler.php#L181-L181](https://github.com/laravel/framework/blob/main/src/Illuminate/Foundation/Exceptions/Handler.php#L181-L181) |
| `Illuminate\Validation\ValidationException` | Form request or validator input failure. | [src/Illuminate/Foundation/Exceptions/Handler.php#L182-L182](https://github.com/laravel/framework/blob/main/src/Illuminate/Foundation/Exceptions/Handler.php#L182-L182) |

Sources: [src/Illuminate/Foundation/Exceptions/Handler.php#L170-L183](https://github.com/laravel/framework/blob/main/src/Illuminate/Foundation/Exceptions/Handler.php#L170-L183)

### Exception Mapping and Context Building

Exceptions can be translated into alternate exception instances before entering reporting or rendering pipelines. Developers register mappings using `map($from, $to)`, which accepts either a factory closure or a target exception class string. When `mapException(Throwable $e)` runs, it checks whether `getInnerException()` returns a valid throwable, then tests instances against registered mappings in `exceptionMap`.

Context assembly is handled by `buildExceptionContext(Throwable $e)`, which merges data returned by `buildContextForException($e)`, application-wide context callbacks registered via `context()`, and the exception instance itself under the `'exception'` key.

Sources: [src/Illuminate/Foundation/Exceptions/Handler.php#L269-L294](https://github.com/laravel/framework/blob/main/src/Illuminate/Foundation/Exceptions/Handler.php#L269-L294), [src/Illuminate/Foundation/Exceptions/Handler.php#L616-L623](https://github.com/laravel/framework/blob/main/src/Illuminate/Foundation/Exceptions/Handler.php#L616-L623), [src/Illuminate/Foundation/Exceptions/Handler.php#L782-L796](https://github.com/laravel/framework/blob/main/src/Illuminate/Foundation/Exceptions/Handler.php#L782-L796)

## HTTP Exception Response Rendering Engine

### Overview

The exception rendering engine converts captured runtime exceptions into HTTP responses, JSON payloads, or console outputs. The main entry point is the `render($request, Throwable $e)` method on `Handler`, which orchestrates mapping, custom render hooks, response serialization, and finalization callbacks.

Sources: [src/Illuminate/Foundation/Exceptions/Handler.php#L694-L722](https://github.com/laravel/framework/blob/main/src/Illuminate/Foundation/Exceptions/Handler.php#L694-L722)

### Rendering Call-Chain Execution

When an exception is rendered for an incoming HTTP request, `Handler::render()` executes a precise sequence of checks and transformations:

1. `mapException()` — Translates the exception using inner exception retrieval or registered exception maps.
2. Custom render method or `Responsable` check — Checks if the exception implements its own `render($request)` method or the `Responsable` contract (`toResponse($request)`).
3. `prepareException()` — Converts domain-specific exceptions (such as `ModelNotFoundException` or `AuthorizationException`) into standard Symfony/Laravel HTTP exceptions.
4. `renderViaCallbacks()` — Iterates through registered closure callbacks via `renderable()` to see if any custom handler intercepts the exception type.
5. Specialized type matching — Evaluates specific response generators via `match (true)` for `HttpResponseException`, `AuthenticationException`, `ValidationException`, or fallback exception responses.
6. `prepareResponse()` or `prepareJsonResponse()` — Inspects whether JSON is requested (`shouldReturnJson`) and generates either an HTML/Error-Renderer response or a pretty-printed JSON structure containing exception messages, files, and traces.
7. `finalizeRenderedResponse()` — Passes the finished response through any registered `respondUsing` callback before returning it to the client.

Sources: [src/Illuminate/Foundation/Exceptions/Handler.php#L694-L737](https://github.com/laravel/framework/blob/main/src/Illuminate/Foundation/Exceptions/Handler.php#L694-L737), [src/Illuminate/Foundation/Exceptions/Handler.php#L753-L774](https://github.com/laravel/framework/blob/main/src/Illuminate/Foundation/Exceptions/Handler.php#L753-L774), [src/Illuminate/Foundation/Exceptions/Handler.php#L807-L820](https://github.com/laravel/framework/blob/main/src/Illuminate/Foundation/Exceptions/Handler.php#L807-L820)

> [!NOTE]
> During exception preparation, `prepareException` maps internal database and validation errors like `BackedEnumCaseNotFoundException` and `ModelNotFoundException` directly into `NotFoundHttpException` instances with 404 status codes.
> Sources: [src/Illuminate/Foundation/Exceptions/Handler.php#L760-L762](https://github.com/laravel/framework/blob/main/src/Illuminate/Foundation/Exceptions/Handler.php#L760-L762)

### Exception Preparation and Mapping Reference

| Exception Type | Mapped / Rendered Result | Status Code / Details | Sources |
| :--- | :--- | :--- | :--- |
| `BackedEnumCaseNotFoundException` | `NotFoundHttpException` | 404 Not Found | [src/Illuminate/Foundation/Exceptions/Handler.php#L761-L761](https://github.com/laravel/framework/blob/main/src/Illuminate/Foundation/Exceptions/Handler.php#L761-L761) |
| `ModelNotFoundException` | `NotFoundHttpException` | 404 Not Found | [src/Illuminate/Foundation/Exceptions/Handler.php#L762-L762](https://github.com/laravel/framework/blob/main/src/Illuminate/Foundation/Exceptions/Handler.php#L762-L762) |
| `AuthorizationException` (with status) | `HttpException` | Uses custom status and response message | [src/Illuminate/Foundation/Exceptions/Handler.php#L763-L765](https://github.com/laravel/framework/blob/main/src/Illuminate/Foundation/Exceptions/Handler.php#L763-L765) |
| `AuthorizationException` (without status) | `AccessDeniedHttpException` | 403 Forbidden | [src/Illuminate/Foundation/Exceptions/Handler.php#L766-L766](https://github.com/laravel/framework/blob/main/src/Illuminate/Foundation/Exceptions/Handler.php#L766-L766) |
| `OriginMismatchException` | `HttpException` | 403 Forbidden | [src/Illuminate/Foundation/Exceptions/Handler.php#L767-L767](https://github.com/laravel/framework/blob/main/src/Illuminate/Foundation/Exceptions/Handler.php#L767-L767) |
| `TokenMismatchException` | `HttpException` | 419 Page Expired | [src/Illuminate/Foundation/Exceptions/Handler.php#L768-L768](https://github.com/laravel/framework/blob/main/src/Illuminate/Foundation/Exceptions/Handler.php#L768-L768) |
| `RequestExceptionInterface` | `BadRequestHttpException` | 400 Bad Request | [src/Illuminate/Foundation/Exceptions/Handler.php#L769-L769](https://github.com/laravel/framework/blob/main/src/Illuminate/Foundation/Exceptions/Handler.php#L769-L769) |
| `RecordNotFoundException` | `NotFoundHttpException` | 404 Not Found | [src/Illuminate/Foundation/Exceptions/Handler.php#L770-L770](https://github.com/laravel/framework/blob/main/src/Illuminate/Foundation/Exceptions/Handler.php#L770-L770) |
| `RecordsNotFoundException` | `NotFoundHttpException` | 404 Not Found | [src/Illuminate/Foundation/Exceptions/Handler.php#L771-L771](https://github.com/laravel/framework/blob/main/src/Illuminate/Foundation/Exceptions/Handler.php#L771-L771) |

Sources: [src/Illuminate/Foundation/Exceptions/Handler.php#L760-L771](https://github.com/laravel/framework/blob/main/src/Illuminate/Foundation/Exceptions/Handler.php#L760-L771)

### Response Rendering Engine Design Choices

| Design Choice | Benefit | Cost | Sources |
| :--- | :--- | :--- | :--- |
| Explicit exception type matching (`match (true)`) | Predictable, deterministic routing of framework exceptions to specialized response builders | Requires updating match arms when new framework exception types are introduced | [src/Illuminate/Foundation/Exceptions/Handler.php#L716-L721](https://github.com/laravel/framework/blob/main/src/Illuminate/Foundation/Exceptions/Handler.php#L716-L721) |
| Custom `ExceptionRenderer` and `Renderer` container binding checks | Allows applications to swap default Symfony error views for advanced interactive debugging UIs | Adds conditional overhead and try-catch fallback blocks during content rendering | [src/Illuminate/Foundation/Exceptions/Handler.php#L977-L990](https://github.com/laravel/framework/blob/main/src/Illuminate/Foundation/Exceptions/Handler.php#L977-L990) |
| WeakMap-backed reported exception tracking | Prevents duplicate reporting of identical exception object instances without memory leaks | Requires PHP runtime support for weak references on object keys | [src/Illuminate/Foundation/Exceptions/Handler.php#L219-L219](https://github.com/laravel/framework/blob/main/src/Illuminate/Foundation/Exceptions/Handler.php#L219-L219) |

Sources: [src/Illuminate/Foundation/Exceptions/Handler.php#L219-L219](https://github.com/laravel/framework/blob/main/src/Illuminate/Foundation/Exceptions/Handler.php#L219-L219), [src/Illuminate/Foundation/Exceptions/Handler.php#L716-L721](https://github.com/laravel/framework/blob/main/src/Illuminate/Foundation/Exceptions/Handler.php#L716-L721), [src/Illuminate/Foundation/Exceptions/Handler.php#L977-L990](https://github.com/laravel/framework/blob/main/src/Illuminate/Foundation/Exceptions/Handler.php#L977-L990)

## Debug Frames and Visual View Components

### Overview

Laravel provides an interactive visual exception rendering subsystem that processes flattened stack traces, filters vendor frames, and displays debug interfaces via custom Blade view components and Whoops integrations. The exception renderer extracts frames from flattened exceptions, maps classes against composer class maps, and groups traces by vendor paths to separate framework and library internals from application code.

Sources: [src/Illuminate/Foundation/Exceptions/Renderer/Exception.php#L126-L196](https://github.com/laravel/framework/blob/main/src/Illuminate/Foundation/Exceptions/Renderer/Exception.php#L126-L196), [src/Illuminate/Foundation/Exceptions/Renderer/Frame.php#L65-L246](https://github.com/laravel/framework/blob/main/src/Illuminate/Foundation/Exceptions/Renderer/Frame.php#L65-L246), [src/Illuminate/Foundation/Exceptions/Whoops/WhoopsExceptionRenderer.php#L10-L38](https://github.com/laravel/framework/blob/main/src/Illuminate/Foundation/Exceptions/Whoops/WhoopsExceptionRenderer.php#L10-L38)

### Frame Processing and Vendor Filtering Walkthrough

The trace inspection and rendering engine processes exception frames through a specific call chain:

1. `frames()` — Retrieves the trace array from the flattened exception, sanitizes empty entry points, filters out entries without files, strips `HandleExceptions` bootstrap frames, and wraps each item in a `Frame` instance.
2. `isFromVendor()` — Evaluates whether a frame's file path sits outside the application base path or inside the `vendor` subdirectory.
3. `frameGroups()` — Iterates over frames to group consecutive vendor or application frames together into structured arrays (`is_vendor` and `frames`).
4. `markAsMain()` — Scans reversed frames to identify the first non-vendor frame and marks it as the main execution entry point.

Sources: [src/Illuminate/Foundation/Exceptions/Renderer/Exception.php#L126-L170](https://github.com/laravel/framework/blob/main/src/Illuminate/Foundation/Exceptions/Renderer/Exception.php#L126-L170), [src/Illuminate/Foundation/Exceptions/Renderer/Exception.php#L178-L196](https://github.com/laravel/framework/blob/main/src/Illuminate/Foundation/Exceptions/Renderer/Exception.php#L178-L196), [src/Illuminate/Foundation/Exceptions/Renderer/Frame.php#L208-L216](https://github.com/laravel/framework/blob/main/src/Illuminate/Foundation/Exceptions/Renderer/Frame.php#L208-L216)

> [!NOTE]
> During trace sanitization, if the first trace entry lacks a class or function while subsequent entries exist, Laravel automatically inherits class, type, function, and argument properties from the second trace index.
> Sources: [src/Illuminate/Foundation/Exceptions/Renderer/Exception.php#L135-L140](https://github.com/laravel/framework/blob/main/src/Illuminate/Foundation/Exceptions/Renderer/Exception.php#L135-L140)

### Exception Renderer Methods Reference

| Method Name | Return Type | Purpose | Sources |
| :--- | :--- | :--- | :--- |
| `title()` | `string` | Retrieves the status text from the flattened exception instance. | [src/Illuminate/Foundation/Exceptions/Renderer/Exception.php#L64-L67](https://github.com/laravel/framework/blob/main/src/Illuminate/Foundation/Exceptions/Renderer/Exception.php#L64-L67) |
| `message()` | `string` | Returns the raw exception message string. | [src/Illuminate/Foundation/Exceptions/Renderer/Exception.php#L73-L77](https://github.com/laravel/framework/blob/main/src/Illuminate/Foundation/Exceptions/Renderer/Exception.php#L73-L77) |
| `class()` | `string` | Obtains the fully qualified exception class name. | [src/Illuminate/Foundation/Exceptions/Renderer/Exception.php#L83-L87](https://github.com/laravel/framework/blob/main/src/Illuminate/Foundation/Exceptions/Renderer/Exception.php#L83-L87) |
| `code()` | `int\|string` | Returns the exception code identifier. | [src/Illuminate/Foundation/Exceptions/Renderer/Exception.php#L93-L97](https://github.com/laravel/framework/blob/main/src/Illuminate/Foundation/Exceptions/Renderer/Exception.php#L93-L97) |
| `httpStatusCode()` | `int` | Gets the resolved HTTP status code. | [src/Illuminate/Foundation/Exceptions/Renderer/Exception.php#L103-L107](https://github.com/laravel/framework/blob/main/src/Illuminate/Foundation/Exceptions/Renderer/Exception.php#L103-L107) |
| `previousExceptions()` | `Collection` | Maps and returns a collection of wrapped previous exceptions in the chain. | [src/Illuminate/Foundation/Exceptions/Renderer/Exception.php#L114-L119](https://github.com/laravel/framework/blob/main/src/Illuminate/Foundation/Exceptions/Renderer/Exception.php#L114-L119) |
| `frames()` | `Collection` | Sanitizes traces, builds `Frame` objects, and returns frame collections. | [src/Illuminate/Foundation/Exceptions/Renderer/Exception.php#L126-L171](https://github.com/laravel/framework/blob/main/src/Illuminate/Foundation/Exceptions/Renderer/Exception.php#L126-L171) |
| `frameGroups()` | `array` | Groups consecutive vendor and application frames into structured blocks. | [src/Illuminate/Foundation/Exceptions/Renderer/Exception.php#L178-L196](https://github.com/laravel/framework/blob/main/src/Illuminate/Foundation/Exceptions/Renderer/Exception.php#L178-L196) |
| `requestHeaders()` | `array` | Flattens request headers into comma-separated string pairs. | [src/Illuminate/Foundation/Exceptions/Renderer/Exception.php#L213-L218](https://github.com/laravel/framework/blob/main/src/Illuminate/Foundation/Exceptions/Renderer/Exception.php#L213-L218) |
| `requestBody()` | `string\|null` | Encodes request payloads into pretty-printed JSON strings without slashes. | [src/Illuminate/Foundation/Exceptions/Renderer/Exception.php#L225-L234](https://github.com/laravel/framework/blob/main/src/Illuminate/Foundation/Exceptions/Renderer/Exception.php#L225-L234) |
| `applicationRouteContext()` | `array` | Collects controller names, route names, and resolved middleware lists. | [src/Illuminate/Foundation/Exceptions/Renderer/Exception.php#L241-L252](https://github.com/laravel/framework/blob/main/src/Illuminate/Foundation/Exceptions/Renderer/Exception.php#L241-L252) |
| `applicationQueries()` | `array` | Replaces SQL query bindings with escaped literal values for debugging. | [src/Illuminate/Foundation/Exceptions/Renderer/Exception.php#L274-L293](https://github.com/laravel/framework/blob/main/src/Illuminate/Foundation/Exceptions/Renderer/Exception.php#L274-L293) |

Sources: [src/Illuminate/Foundation/Exceptions/Renderer/Exception.php#L60-L293](https://github.com/laravel/framework/blob/main/src/Illuminate/Foundation/Exceptions/Renderer/Exception.php#L60-L293)

### Debug Renderer Design Choices

| Design Choice | Benefit | Cost | Sources |
| :--- | :--- | :--- | :--- |
| Composer class-map resolution in frames | Accurately identifies class names for files lacking explicit stack trace class definitions | Requires active class-map loaders from Composer during rendering | [src/Illuminate/Foundation/Exceptions/Renderer/Frame.php#L102-L111](https://github.com/laravel/framework/blob/main/src/Illuminate/Foundation/Exceptions/Renderer/Frame.php#L102-L111) |
| Consecutive vendor frame grouping | Collapses verbose framework internals into concise blocks to emphasize application code | Increases complexity of template iteration logic across trace components | [src/Illuminate/Foundation/Exceptions/Renderer/Exception.php#L178-L196](https://github.com/laravel/framework/blob/main/src/Illuminate/Foundation/Exceptions/Renderer/Exception.php#L178-L196) |
| Static binding of previous exceptions via `once()` | Prevents redundant instantiation loops when traversing nested exception chains | Holds instantiated collection state in memory during the request lifecycle | [src/Illuminate/Foundation/Exceptions/Renderer/Exception.php#L114-L119](https://github.com/laravel/framework/blob/main/src/Illuminate/Foundation/Exceptions/Renderer/Exception.php#L114-L119) |

Sources: [src/Illuminate/Foundation/Exceptions/Renderer/Exception.php#L114-L119](https://github.com/laravel/framework/blob/main/src/Illuminate/Foundation/Exceptions/Renderer/Exception.php#L114-L119), [src/Illuminate/Foundation/Exceptions/Renderer/Exception.php#L178-L196](https://github.com/laravel/framework/blob/main/src/Illuminate/Foundation/Exceptions/Renderer/Exception.php#L178-L196), [src/Illuminate/Foundation/Exceptions/Renderer/Frame.php#L102-L111](https://github.com/laravel/framework/blob/main/src/Illuminate/Foundation/Exceptions/Renderer/Frame.php#L102-L111)

### Whoops and Blade View Integration Example

The interactive debugging interface delegates HTML error rendering to either Whoops or the built-in Blade exception renderer templates (`show.blade.php`, `markdown.blade.php`, and component partials).

```php
use Illuminate\Foundation\Exceptions\Renderer\Exception as ExceptionRenderer;
use Illuminate\Foundation\Exceptions\Whoops\WhoopsExceptionRenderer;
use Illuminate\Http\Request;
use Symfony\Component\ErrorHandler\Exception\FlattenException;

// Rendering via Whoops exception renderer adapter
$whoopsRenderer = new WhoopsExceptionRenderer();
$htmlOutput = $whoopsRenderer->render($throwable);

// Inspecting exception renderer context properties
$flattened = FlattenException::createFromThrowable($throwable);
$renderer = new ExceptionRenderer($flattened, Request::capture(), $listener, base_path());

$exceptionTitle = $renderer->title();
$mainFrames = $renderer->frames();
$routeContext = $renderer->applicationRouteContext();
```

Sources: [src/Illuminate/Foundation/Exceptions/Renderer/Exception.php#L51-L57](https://github.com/laravel/framework/blob/main/src/Illuminate/Foundation/Exceptions/Renderer/Exception.php#L51-L57), [src/Illuminate/Foundation/Exceptions/Renderer/Exception.php#L64-L252](https://github.com/laravel/framework/blob/main/src/Illuminate/Foundation/Exceptions/Renderer/Exception.php#L64-L252), [src/Illuminate/Foundation/Exceptions/Whoops/WhoopsExceptionRenderer.php#L18-L27](https://github.com/laravel/framework/blob/main/src/Illuminate/Foundation/Exceptions/Whoops/WhoopsExceptionRenderer.php#L18-L27), [src/Illuminate/Foundation/resources/exceptions/renderer/show.blade.php#L1-L43](https://github.com/laravel/framework/blob/main/src/Illuminate/Foundation/resources/exceptions/renderer/show.blade.php#L1-L43)

## Testing Utilities for Exception Handling

### Overview

Automated test execution relies on exception interception utilities defined in the `InteractsWithExceptionHandling` trait. This trait provides methods to disable normal exception reporting, selectively allow specific exceptions to pass through the handler, and assert that closures throw or do not throw specific exceptions during testing.

Sources: [src/Illuminate/Foundation/Testing/Concerns/InteractsWithExceptionHandling.php#L15-L243](https://github.com/laravel/framework/blob/main/src/Illuminate/Foundation/Testing/Concerns/InteractsWithExceptionHandling.php#L15-L243)

### Exception Handling Modification Methods

The trait offers several primary configuration methods to manage the container's exception handler instance during test execution.

| Method | Parameters | Return Type | Purpose | Sources |
| :--- | :--- | :--- | :--- | :--- |
| `withExceptionHandling()` | None | `$this` | Restores the original exception handler instance to the application container. | [src/Illuminate/Foundation/Testing/Concerns/InteractsWithExceptionHandling.php#L31-L42](https://github.com/laravel/framework/blob/main/src/Illuminate/Foundation/Testing/Concerns/InteractsWithExceptionHandling.php#L31-L42) |
| `handleExceptions()` | `array $exceptions` | `$this` | Delegates specific exception classes to be handled normally via `withoutExceptionHandling($exceptions)`. | [src/Illuminate/Foundation/Testing/Concerns/InteractsWithExceptionHandling.php#L50-L53](https://github.com/laravel/framework/blob/main/src/Illuminate/Foundation/Testing/Concerns/InteractsWithExceptionHandling.php#L50-L53) |
| `handleValidationExceptions()` | None | `$this` | Restricts handled exceptions exclusively to `ValidationException::class`. | [src/Illuminate/Foundation/Testing/Concerns/InteractsWithExceptionHandling.php#L60-L63](https://github.com/laravel/framework/blob/main/src/Illuminate/Foundation/Testing/Concerns/InteractsWithExceptionHandling.php#L60-L63) |
| `withoutExceptionHandling()` | `array $except = []` | `$this` | Binds an anonymous exception handler implementation that bypasses reporting and rethrows unhandled exceptions. | [src/Illuminate/Foundation/Testing/Concerns/InteractsWithExceptionHandling.php#L71-L169](https://github.com/laravel/framework/blob/main/src/Illuminate/Foundation/Testing/Concerns/InteractsWithExceptionHandling.php#L71-L169) |
| `assertThrows()` | `Closure $test`, `string\|Closure $expectedClass`, `?string $expectedMessage` | `$this` | Asserts that invoking the test closure throws an exception matching the given class and optional message string. | [src/Illuminate/Foundation/Testing/Concerns/InteractsWithExceptionHandling.php#L179-L215](https://github.com/laravel/framework/blob/main/src/Illuminate/Foundation/Testing/Concerns/InteractsWithExceptionHandling.php#L179-L215) |
| `assertDoesntThrow()` | `Closure $test` | `$this` | Asserts that invoking the test closure completes without throwing any exceptions. | [src/Illuminate/Foundation/Testing/Concerns/InteractsWithExceptionHandling.php#L223-L242](https://github.com/laravel/framework/blob/main/src/Illuminate/Foundation/Testing/Concerns/InteractsWithExceptionHandling.php#L223-L242) |

Sources: [src/Illuminate/Foundation/Testing/Concerns/InteractsWithExceptionHandling.php#L31-L242](https://github.com/laravel/framework/blob/main/src/Illuminate/Foundation/Testing/Concerns/InteractsWithExceptionHandling.php#L31-L242)

> [!NOTE]
> When `withoutExceptionHandling()` is called, any `NotFoundHttpException` encountered during rendering is caught and rethrown with a modified message containing the HTTP method and request URL, while all other non-excepted exceptions are rethrown directly.

Sources: [src/Illuminate/Foundation/Testing/Concerns/InteractsWithExceptionHandling.php#L140-L147](https://github.com/laravel/framework/blob/main/src/Illuminate/Foundation/Testing/Concerns/InteractsWithExceptionHandling.php#L140-L147)

### Exception Assertion and Management Example

Tests can assert specific exception behaviors and temporarily bypass error handling using the methods exposed by the trait.

```php
use Illuminate\Foundation\Testing\Concerns\InteractsWithExceptionHandling;
use Illuminate\Validation\ValidationException;
use RuntimeException;

class ExampleTestCase 
{
    use InteractsWithExceptionHandling;

    public function testExceptionBehaviors()
    {
        // Disable exception handling globally except for validation exceptions
        $this->handleValidationExceptions();

        // Assert that a closure throws a specific exception and message
        $this->assertThrows(function () {
            throw new RuntimeException('Primary database failure.');
        }, RuntimeException::class, 'database failure');

        // Assert that a clean operation does not throw any exceptions
        $this->assertDoesntThrow(function () {
            // Successful execution path
        });

        // Restore default exception handling
        $this->withExceptionHandling();
    }
}
```

Sources: [src/Illuminate/Foundation/Testing/Concerns/InteractsWithExceptionHandling.php#L31-L63](https://github.com/laravel/framework/blob/main/src/Illuminate/Foundation/Testing/Concerns/InteractsWithExceptionHandling.php#L31-L63), [src/Illuminate/Foundation/Testing/Concerns/InteractsWithExceptionHandling.php#L179-L242](https://github.com/laravel/framework/blob/main/src/Illuminate/Foundation/Testing/Concerns/InteractsWithExceptionHandling.php#L179-L242)

## Related

- [[Testing Framework & HTTP Assertions]]

