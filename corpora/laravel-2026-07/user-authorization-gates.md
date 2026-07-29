# User Authorization & Gates

<details>
<summary>Relevant source files</summary>

The following files were used as context for generating this wiki page:

- [src/Illuminate/Auth/Access/Gate.php](https://github.com/laravel/framework/blob/main/src/Illuminate/Auth/Access/Gate.php)
- [src/Illuminate/Auth/AuthServiceProvider.php](https://github.com/laravel/framework/blob/main/src/Illuminate/Auth/AuthServiceProvider.php)
- [src/Illuminate/Foundation/Auth/Access/AuthorizesRequests.php](https://github.com/laravel/framework/blob/main/src/Illuminate/Foundation/Auth/Access/AuthorizesRequests.php)
- [src/Illuminate/Auth/Middleware/Authorize.php](https://github.com/laravel/framework/blob/main/src/Illuminate/Auth/Middleware/Authorize.php)
- [src/Illuminate/Contracts/Auth/Access/Gate.php](https://github.com/laravel/framework/blob/main/src/Illuminate/Contracts/Auth/Access/Gate.php)
- [src/Illuminate/Support/Facades/Gate.php](https://github.com/laravel/framework/blob/main/src/Illuminate/Support/Facades/Gate.php)
- [src/Illuminate/Foundation/Support/Providers/AuthServiceProvider.php](https://github.com/laravel/framework/blob/main/src/Illuminate/Foundation/Support/Providers/AuthServiceProvider.php)
- [src/Illuminate/Foundation/Auth/Access/Authorizable.php](https://github.com/laravel/framework/blob/main/src/Illuminate/Foundation/Auth/Access/Authorizable.php)
- [src/Illuminate/Auth/Access/Events/GateEvaluated.php](https://github.com/laravel/framework/blob/main/src/Illuminate/Auth/Access/Events/GateEvaluated.php)
- [src/Illuminate/Auth/Access/Response.php](https://github.com/laravel/framework/blob/main/src/Illuminate/Auth/Access/Response.php)
- [src/Illuminate/Validation/Rules/Can.php](https://github.com/laravel/framework/blob/main/src/Illuminate/Validation/Rules/Can.php)
- [src/Illuminate/Broadcasting/Broadcasters/PusherBroadcaster.php](https://github.com/laravel/framework/blob/main/src/Illuminate/Broadcasting/Broadcasters/PusherBroadcaster.php)
- [src/Illuminate/Auth/Access/HandlesAuthorization.php](https://github.com/laravel/framework/blob/main/src/Illuminate/Auth/Access/HandlesAuthorization.php)
- [src/Illuminate/Broadcasting/Broadcasters/Broadcaster.php](https://github.com/laravel/framework/blob/main/src/Illuminate/Broadcasting/Broadcasters/Broadcaster.php)
- [src/Illuminate/View/Compilers/Concerns/CompilesAuthorizations.php](https://github.com/laravel/framework/blob/main/src/Illuminate/View/Compilers/Concerns/CompilesAuthorizations.php)
- [src/Illuminate/Contracts/Auth/Access/Authorizable.php](https://github.com/laravel/framework/blob/main/src/Illuminate/Contracts/Auth/Access/Authorizable.php)
- [src/Illuminate/Routing/Attributes/Controllers/Authorize.php](https://github.com/laravel/framework/blob/main/src/Illuminate/Routing/Attributes/Controllers/Authorize.php)
- [src/Illuminate/Support/Facades/Auth.php](https://github.com/laravel/framework/blob/main/src/Illuminate/Support/Facades/Auth.php)
</details>

## Overview

User authorization and gates in the framework provide a flexible, expressive mechanism for determining if an authenticated user is permitted to perform specific actions against application resources. By organizing security logic into centralized abilities and policy classes, the system eliminates scattered conditional checks and standardizes permission handling across HTTP middleware, controller helpers, validation rules, and view templates.
Sources: [src/Illuminate/Auth/Access/Gate.php:40-51](https://github.com/laravel/framework/blob/main/src/Illuminate/Auth/Access/Gate.php#L40-L51), [src/Illuminate/Foundation/Auth/Access/AuthorizesRequests.php:21-26](https://github.com/laravel/framework/blob/main/src/Illuminate/Foundation/Auth/Access/AuthorizesRequests.php#L21-L26), [src/Illuminate/Auth/Middleware/Authorize.php:55-60](https://github.com/laravel/framework/blob/main/src/Illuminate/Auth/Middleware/Authorize.php#L55-L60), [src/Illuminate/View/Compilers/Concerns/CompilesAuthorizations.php:13-16](https://github.com/laravel/framework/blob/main/src/Illuminate/View/Compilers/Concerns/CompilesAuthorizations.php#L13-L16)

The architecture centers around the `Gate` contract engine, service providers, and fluent response objects that manage authorization lifecycle callbacks and event dispatching. Through trait integration on user models and extensible routing annotations, applications can seamlessly evaluate permissions dynamically.
Sources: [src/Illuminate/Contracts/Auth/Access/Gate.php:5-150](https://github.com/laravel/framework/blob/main/src/Illuminate/Contracts/Auth/Access/Gate.php#L5-L150), [src/Illuminate/Auth/AuthServiceProvider.php:53-62](https://github.com/laravel/framework/blob/main/src/Illuminate/Auth/AuthServiceProvider.php#L53-L62), [src/Illuminate/Foundation/Auth/Access/Authorizable.php:7-56](https://github.com/laravel/framework/blob/main/src/Illuminate/Foundation/Auth/Access/Authorizable.php#L7-L56), [src/Illuminate/Auth/Access/Response.php:8-215](https://github.com/laravel/framework/blob/main/src/Illuminate/Auth/Access/Response.php#L8-L215)

## Gate Contracts and Core Engine

### Overview

The core authorization engine is anchored by the `Illuminate\Contracts\Auth\Access\Gate` interface, implemented concrete-side by `Illuminate\Auth\Access\Gate`, and exposed statically through the `Illuminate\Support\Facades\Gate` facade which resolves to `GateContract::class`. This architecture decouples static facade calls from the underlying container binding, routing evaluation requests through centralized ability definitions, policy resolution mechanisms, and global interceptor callbacks.
Sources: [src/Illuminate/Contracts/Auth/Access/Gate.php:5-150](https://github.com/laravel/framework/blob/main/src/Illuminate/Contracts/Auth/Access/Gate.php#L5-L150), [src/Illuminate/Auth/Access/Gate.php:21-22](https://github.com/laravel/framework/blob/main/src/Illuminate/Auth/Access/Gate.php#L21-L22), [src/Illuminate/Support/Facades/Gate.php:5-47](https://github.com/laravel/framework/blob/main/src/Illuminate/Support/Facades/Gate.php#L5-L47)

### Evaluation Engine and Call-Chain Execution

When an authorization check is initiated via methods like `allows()`, `check()`, or `authorize()`, the execution flows through a precise sequence of evaluation steps managed by the core gate engine. 

The execution walkthrough follows this exact path: `allows()` / `check()` → `inspect()` → `raw()` → `callBeforeCallbacks()` → `callAuthCallback()` → `resolveAuthCallback()` → `callPolicyBefore()` → policy method execution → `callAfterCallbacks()` → `dispatchGateEvaluatedEvent()`. Throughout this sequence, if any `before` callback returns a non-null value, it immediately bypasses standard ability and policy evaluation to short-circuit the result.
Sources: [src/Illuminate/Auth/Access/Gate.php:326-355](https://github.com/laravel/framework/blob/main/src/Illuminate/Auth/Access/Gate.php#L326-L355), [src/Illuminate/Auth/Access/Gate.php:390-453](https://github.com/laravel/framework/blob/main/src/Illuminate/Auth/Access/Gate.php#L390-L453), [src/Illuminate/Auth/Access/Gate.php:543-568](https://github.com/laravel/framework/blob/main/src/Illuminate/Auth/Access/Gate.php#L543-L568)

> [!NOTE]
> During `raw()` evaluation, the `before` callbacks execute prior to resolving policy or closure callbacks. If a `before` callback returns a non-null response, the engine immediately returns that response and skips all subsequent policy or ability checks.
> Sources: [src/Illuminate/Auth/Access/Gate.php:434-443](https://github.com/laravel/framework/blob/main/src/Illuminate/Auth/Access/Gate.php#L434-L443)

> [!IMPORTANT]
> When evaluating policy callbacks, the engine inspects the first argument passed to the check. If a policy is registered for that object's class, or discovered via attributes or naming conventions, the policy's specific method corresponding to the ability is invoked.
> Sources: [src/Illuminate/Auth/Access/Gate.php:623-627](https://github.com/laravel/framework/blob/main/src/Illuminate/Auth/Access/Gate.php#L623-L627), [src/Illuminate/Auth/Access/Gate.php:768-793](https://github.com/laravel/framework/blob/main/src/Illuminate/Auth/Access/Gate.php#L768-L793)

### Core Gate Interface Methods

| Method Signature | Return Type | Purpose |
| :--- | :--- | :--- |
| `has($ability)` | `bool` | Determine if a given ability has been defined. |
| `define($ability, $callback)` | `$this` | Define a new authorization ability. |
| `resource($name, $class, ?array $abilities = null)` | `$this` | Define resource-based abilities mapping to a policy class. |
| `policy($class, $policy)` | `$this` | Define a policy class for a given model or class type. |
| `before(callable $callback)` | `$this` | Register a global callback to run before all Gate checks. |
| `after(callable $callback)` | `$this` | Register a global callback to run after all Gate checks. |
| `allows($ability, $arguments = [])` | `bool` | Determine if all given abilities are granted for the current user. |
| `denies($ability, $arguments = [])` | `bool` | Determine if any given abilities are denied for the current user. |
| `check($abilities, $arguments = [])` | `bool` | Determine if all given abilities are granted for current user. |
| `any($abilities, $arguments = [])` | `bool` | Determine if any one of the given abilities is granted. |
| `authorize($ability, $arguments = [])` | `Response` | Determine if ability is granted, throwing an exception upon failure. |
| `inspect($ability, $arguments = [])` | `Response` | Inspect user for ability and return a structured Response instance. |
| `raw($ability, $arguments = [])` | `mixed` | Get the raw result from the underlying authorization callback. |
| `getPolicyFor($class)` | `mixed` | Retrieve a policy instance associated with a given class or object. |
| `forUser($user)` | `static` | Create a scoped gate instance bound to a specific user. |
| `abilities()` | `array` | Get all registered abilities. |
Sources: [src/Illuminate/Contracts/Auth/Access/Gate.php:7-149](https://github.com/laravel/framework/blob/main/src/Illuminate/Contracts/Auth/Access/Gate.php#L7-L149)

### Architectural Design Trade-Offs

| Design Choice | Benefit | Cost |
| :--- | :--- | :--- |
| **Container-backed policy resolution (`resolvePolicy`)** | Enables full dependency injection into policy constructors via the service container. | Introduces container resolution overhead during authorization evaluations. |
| **Global `before` and `after` interceptor callbacks** | Provides centralized hooks for super-admin bypasses and comprehensive audit logging. | Requires careful ordering and null-return handling to prevent unintended short-circuiting. |
| **Automatic policy name guessing and attribute discovery** | Removes boilerplate configuration by inferring policy paths and reading `UsePolicy` attributes. | Relies on strict naming conventions and reflection inspection, which can impact performance if uncached. |
Sources: [src/Illuminate/Auth/Access/Gate.php:434-453](https://github.com/laravel/framework/blob/main/src/Illuminate/Auth/Access/Gate.php#L434-L453), [src/Illuminate/Auth/Access/Gate.php:653-684](https://github.com/laravel/framework/blob/main/src/Illuminate/Auth/Access/Gate.php#L653-L684), [src/Illuminate/Auth/Access/Gate.php:754-757](https://github.com/laravel/framework/blob/main/src/Illuminate/Auth/Access/Gate.php#L754-L757)

## Authorization Service Registration

### Overview

Authorization services, gate instances, and policy mappings are bound into the application container through specialized service providers. The framework provides two core service providers that manage authentication and policy registration: `Illuminate\Auth\AuthServiceProvider` and `Illuminate\Foundation\Support\Providers\AuthServiceProvider`.
Sources: [src/Illuminate/Auth/AuthServiceProvider.php:13-28](https://github.com/laravel/framework/blob/main/src/Illuminate/Auth/AuthServiceProvider.php#L13-L28), [src/Illuminate/Foundation/Support/Providers/AuthServiceProvider.php:8-27](https://github.com/laravel/framework/blob/main/src/Illuminate/Foundation/Support/Providers/AuthServiceProvider.php#L8-L27)

### Service Registration Call-Chain

When the framework boots the core authorization infrastructure, `AuthServiceProvider::register()` executes a precise sequence of service bindings and re-binding listeners. The registration sequence proceeds as follows:

`registerAuthenticator()` → `registerUserResolver()` → `registerAccessGate()` → `registerRequirePassword()` → `registerRequestRebindHandler()` → `registerEventRebindHandler()`

1. **`registerAuthenticator()`**: Binds `'auth'` as a singleton returning an `AuthManager` instance, and `'auth.driver'` as a singleton resolving the default guard.
2. **`registerUserResolver()`**: Binds `AuthenticatableContract::class` to evaluate the user resolver callback from the auth manager.
3. **`registerAccessGate()`**: Binds `GateContract::class` as a singleton returning an instance of `Illuminate\Auth\Access\Gate` initialized with the container and user resolver.
4. **`registerRequirePassword()`**: Binds `RequirePassword` middleware with the response factory, URL generator, and password timeout configuration value.
5. **`registerRequestRebindHandler()`**: Registers a rebinding listener for `'request'` that re-applies the user resolver callback to incoming request instances.
6. **`registerEventRebindHandler()`**: Registers a rebinding listener for `'events'` that configures event dispatchers on resolved guards when available.
Sources: [src/Illuminate/Auth/AuthServiceProvider.php:20-111](https://github.com/laravel/framework/blob/main/src/Illuminate/Auth/AuthServiceProvider.php#L20-L111)

### Policy Registration Mechanism

Application-level policies are registered via the foundation `AuthServiceProvider`. The provider maintains a protected `$policies` array that maps model classes to their respective policy classes. During the boot lifecycle, the provider invokes `registerPolicies()`, which iterates over the defined policy mappings and registers each one against the `Gate` facade.

```php
namespace App\Providers;

use App\Models\Post;
use App\Policies\PostPolicy;
use Illuminate\Foundation\Support\Providers\AuthServiceProvider as ServiceProvider;
use Illuminate\Support\Facades\Gate;

class AuthServiceProvider extends ServiceProvider
{
    /**
     * The policy mappings for the application.
     *
     * @var array<class-string, class-string>
     */
    protected $policies = [
        Post::class => PostPolicy::class,
    ];

    /**
     * Register any authentication / authorization services.
     *
     * @return void
     */
    public function boot(): void
    {
        $this->registerPolicies();
    }
}
```
Sources: [src/Illuminate/Foundation/Support/Providers/AuthServiceProvider.php:8-50](https://github.com/laravel/framework/blob/main/src/Illuminate/Foundation/Support/Providers/AuthServiceProvider.php#L8-L50)

> [!NOTE]
> The foundation `AuthServiceProvider` defers policy registration until the application's boot phase by wrapping `registerPolicies()` inside a `$this->booting()` callback during the `register()` method.
> Sources: [src/Illuminate/Foundation/Support/Providers/AuthServiceProvider.php:22-27](https://github.com/laravel/framework/blob/main/src/Illuminate/Foundation/Support/Providers/AuthServiceProvider.php#L22-L27)

### Service Provider Registration Bindings

| Service Binding Key / Contract | Implementation / Resolver | Purpose |
| :--- | :--- | :--- |
| `'auth'` | `fn ($app) => new AuthManager($app)` | Singleton manager handling authentication guards and drivers. |
| `'auth.driver'` | `fn ($app) => $app['auth']->guard()` | Singleton resolving the default active authentication guard. |
| `AuthenticatableContract::class` | `fn ($app) => call_user_func($app['auth']->userResolver())` | Container binding resolving the currently authenticated user instance. |
| `GateContract::class` | `fn ($app) => new Gate($app, fn () => call_user_func($app['auth']->userResolver()))` | Singleton access gate instance configured with application container and user resolver. |
| `RequirePassword::class` | `fn ($app) => new RequirePassword(...)` | Binds the password confirmation timeout middleware with response factory and URL generator. |
| `'request'` (rebinding) | `$request->setUserResolver(...)` | Re-binds user resolver callbacks whenever the HTTP request instance is refreshed. |
| `'events'` (rebinding) | `$guard->setDispatcher($dispatcher)` | Automatically injects the event dispatcher into resolved guards upon event rebinding. |
Sources: [src/Illuminate/Auth/AuthServiceProvider.php:37-110](https://github.com/laravel/framework/blob/main/src/Illuminate/Auth/AuthServiceProvider.php#L37-L110)

## User Authorizable Trait Integration

### Overview

The `Illuminate\Contracts\Auth\Access\Authorizable` contract and its concrete implementation via the `Illuminate\Foundation\Auth\Access\Authorizable` trait allow Eloquent models and authenticatable entities to verify user abilities directly. By delegating authorization queries to the container-resolved `Gate` contract scoped specifically to the current user instance (`$this`), the trait bridges user models with the central access control engine.

Sources: [src/Illuminate/Contracts/Auth/Access/Authorizable.php:5-15](https://github.com/laravel/framework/blob/main/src/Illuminate/Contracts/Auth/Access/Authorizable.php#L5-L15), [src/Illuminate/Foundation/Auth/Access/Authorizable.php:7-56](https://github.com/laravel/framework/blob/main/src/Illuminate/Foundation/Auth/Access/Authorizable.php#L7-L56)

### Capability Check Delegations

The trait provides four core methods for evaluating permissions, accepting abilities as a string, an iterable collection, or a `\UnitEnum` instance, alongside optional policy arguments.

| Trait Method Signature | Delegate Call / Return Expression | Purpose |
| :--- | :--- | :--- |
| `can($abilities, $arguments = [])` | `app(Gate::class)->forUser($this)->check($abilities, $arguments)` | Determines if the entity possesses all specified abilities. |
| `canAny($abilities, $arguments = [])` | `app(Gate::class)->forUser($this)->any($abilities, $arguments)` | Determines if the entity possesses any of the specified abilities. |
| `cant($abilities, $arguments = [])` | `! $this->can($abilities, $arguments)` | Determines if the entity lacks the specified abilities. |
| `cannot($abilities, $arguments = [])` | `$this->cant($abilities, $arguments)` | Alias for `cant()`, determining if the entity lacks the specified abilities. |

Sources: [src/Illuminate/Foundation/Auth/Access/Authorizable.php:16-55](https://github.com/laravel/framework/blob/main/src/Illuminate/Foundation/Auth/Access/Authorizable.php#L16-L55)

> [!NOTE]
> Both `cant()` and `cannot()` do not execute direct container gate calls; instead, they invert the boolean output generated by `can()`, ensuring consistent negation behavior across all check variations.
> Sources: [src/Illuminate/Foundation/Auth/Access/Authorizable.php:40-55](https://github.com/laravel/framework/blob/main/src/Illuminate/Foundation/Auth/Access/Authorizable.php#L40-L55)

## Middleware and Controller Authorization

### Overview

HTTP request authorization middleware, route attribute declarations, and controller helper methods link incoming web requests directly to the core authorization engine. The `Illuminate\Auth\Middleware\Authorize` middleware evaluates abilities against route parameters and request state before reaching controller actions. This mechanism is complemented by the `Illuminate\Routing\Attributes\Controllers\Authorize` route attribute and the `Illuminate\Foundation\Auth\Access\AuthorizesRequests` trait, which provides controller-level convenience methods for checking permissions and registering resource-based authorization middleware.

Sources: [src/Illuminate/Auth/Middleware/Authorize.php:12-60](https://github.com/laravel/framework/blob/main/src/Illuminate/Auth/Middleware/Authorize.php#L12-L60), [src/Illuminate/Routing/Attributes/Controllers/Authorize.php:10-26](https://github.com/laravel/framework/blob/main/src/Illuminate/Routing/Attributes/Controllers/Authorize.php#L10-L26), [src/Illuminate/Foundation/Auth/Access/AuthorizesRequests.php:10-135](https://github.com/laravel/framework/blob/main/src/Illuminate/Foundation/Auth/Access/AuthorizesRequests.php#L10-L135)

### Middleware Execution and Argument Resolution

The `Authorize` middleware processes incoming requests inside its `handle()` method by interacting with the container-resolved `Gate` contract. When assigned to a route, the middleware extracts required arguments using `getGateArguments()`, resolving Eloquent model instances from the current route bag or checking if a class name was provided.

```mermaid
sequenceDiagram
    participant Request as Illuminate\Http\Request
    participant Middleware as Illuminate\Auth\Middleware\Authorize
    participant Gate as Illuminate\Contracts\Auth\Access\Gate

    Request->>Middleware: handle($request, $next, $ability, ...$models)
    Middleware->>Middleware: getGateArguments($request, $models)
    Note over Middleware: Maps models via getModel() (class names or route parameters)
    Middleware->>Gate: authorize($ability, $arguments)
    Gate--s->Middleware: Evaluation Result (Success / Exception)
    Middleware->>Request: $next($request)
```

Sources: [src/Illuminate/Auth/Middleware/Authorize.php:44-78](https://github.com/laravel/framework/blob/main/src/Illuminate/Auth/Middleware/Authorize.php#L44-L78)

> [!WARNING]
> When resolving arguments via `getModel()`, string parameters containing backslashes are treated directly as fully-qualified class names, whereas other strings are evaluated against incoming route parameters. If a route parameter is missing, it falls back to a literal string match if enclosed in quotes, or `null`.
> Sources: [src/Illuminate/Auth/Middleware/Authorize.php:87-95](https://github.com/laravel/framework/blob/main/src/Illuminate/Auth/Middleware/Authorize.php#L87-L95)

### Controller Authorization Helpers

Controllers utilizing the `AuthorizesRequests` trait can verify actions programmatically or set up resource middleware automatically. The `authorize()` method parses the given ability and arguments before executing `app(Gate::class)->authorize()`, while `authorizeResource()` maps standard resource controller methods to corresponding policy abilities.

| Resource Method | Mapped Policy Ability | Requires Model Parameter |
| :--- | :--- | :--- |
| `index` | `viewAny` | No (`resourceMethodsWithoutModels`) |
| `show` | `view` | Yes |
| `create` | `create` | No (`resourceMethodsWithoutModels`) |
| `store` | `create` | No (`resourceMethodsWithoutModels`) |
| `edit` | `update` | Yes |
| `update` | `update` | Yes |
| `destroy` | `delete` | Yes |

Sources: [src/Illuminate/Foundation/Auth/Access/AuthorizesRequests.php:21-26](https://github.com/laravel/framework/blob/main/src/Illuminate/Foundation/Auth/Access/AuthorizesRequests.php#L21-L26), [src/Illuminate/Foundation/Auth/Access/AuthorizesRequests.php:79-134](https://github.com/laravel/framework/blob/main/src/Illuminate/Foundation/Auth/Access/AuthorizesRequests.php#L79-L134)

## Authorization Responses and Events

### Overview

Structured evaluation response objects and authorization event dispatching provide granular control over authorization failures and telemetry tracking. The `Illuminate\Auth\Access\Response` class implements `Arrayable` and `Stringable` to represent success or failure states with accompanying messages, status codes, and error reasons. Concurrently, the `Illuminate\Auth\Access\Events\GateEvaluated` event captures runtime metrics whenever an ability evaluation completes.

Sources: [src/Illuminate/Auth/Access/Response.php:8-16](https://github.com/laravel/framework/blob/main/src/Illuminate/Auth/Access/Response.php#L8-L16), [src/Illuminate/Auth/Access/Events/GateEvaluated.php:5-12](https://github.com/laravel/framework/blob/main/src/Illuminate/Auth/Access/Events/GateEvaluated.php#L5-L12)

### Response Construction and Exception Throwing

The `Response` class provides static factory methods to instantiate allowed or denied outcomes with custom error messages, reason codes, and HTTP statuses. When a denied response encounters `authorize()`, it evaluates the denial state and throws an `AuthorizationException` populated with the stored message, reason code, and HTTP status.

```mermaid
sequenceDiagram
    participant App as Application Code
    participant Response as Illuminate\Auth\Access\Response
    participant Exception as Illuminate\Auth\Access\AuthorizationException

    App->>Response: denyWithStatus(404, 'Not Found', 'code_123')
    Response->>Response: withStatus(404)
    App->>Response: authorize()
    Response->>Response: denied() -> true
    Response->>Exception: new AuthorizationException($message, $code)
    Exception->>Exception: setResponse($response)->withStatus(404)
    Exception--s->App: Throws AuthorizationException
```

Sources: [src/Illuminate/Auth/Access/Response.php:53-157](https://github.com/laravel/framework/blob/main/src/Illuminate/Auth/Access/Response.php#L53-L157)

> [!WARNING]
> Calling `authorize()` on an allowed response returns the response instance itself without throwing, whereas calling it on a denied response immediately halts execution by throwing an `AuthorizationException`.
> Sources: [src/Illuminate/Auth/Access/Response.php:148-157](https://github.com/laravel/framework/blob/main/src/Illuminate/Auth/Access/Response.php#L148-L157)

### Response Factory Methods and Properties

The `Response` class exposes explicit factory helpers for defining the exact shape of an authorization failure or success condition. Each factory method initializes internal properties that map directly to array serialization and string conversions.

| Method | Parameters | Allowed Status Code | Purpose |
| :--- | :--- | :--- | :--- |
| `allow` | `$message = null, $code = null` | `true` (`null`) | Create a successful authorization response. |
| `deny` | `$message = null, $code = null` | `false` (`null`) | Create a failed authorization response. |
| `denyWithStatus` | `$status, $message = null, $code = null` | `false` (`$status`) | Create a failed response with a custom HTTP status. |
| `denyAsNotFound` | `$message = null, $code = null` | `false` (`404`) | Create a failed response with a 404 HTTP status. |

Sources: [src/Illuminate/Auth/Access/Response.php:59-99](https://github.com/laravel/framework/blob/main/src/Illuminate/Auth/Access/Response.php#L59-L99)

### Gate Evaluation Event Lifecycle

The `GateEvaluated` event class acts as a simple data container instantiated during authorization checks. Its constructor accepts four public properties that capture the exact context of an evaluation step for listeners and subscribers.

```php
public function __construct($user, $ability, $result, $arguments)
{
    $this->user = $user;
    $this->ability = $ability;
    $this->result = $result;
    $this->arguments = $arguments;
}
```

Sources: [src/Illuminate/Auth/Access/Events/GateEvaluated.php:43-50](https://github.com/laravel/framework/blob/main/src/Illuminate/Auth/Access/Events/GateEvaluated.php#L43-L50)

## Validation and View Authorization

### Overview

Authorization checks extend directly into input validation rules and template compilation engines through specialized validation classes and Blade compiler traits. The `Illuminate\Validation\Rules\Can` validation rule integrates policy evaluation into form request validation pipelines, while the `Illuminate\View\Compilers\Concerns\CompilesAuthorizations` trait transforms shorthand view directives into explicit `Gate` evaluation blocks at compile time.

Sources: [src/Illuminate/Validation/Rules/Can.php:9-16](https://github.com/laravel/framework/blob/main/src/Illuminate/Validation/Rules/Can.php#L9-L16), [src/Illuminate/View/Compilers/Concerns/CompilesAuthorizations.php:5-7](https://github.com/laravel/framework/blob/main/src/Illuminate/View/Compilers/Concerns/CompilesAuthorizations.php#L5-L7)

### Validation Rule Integration

The `Can` rule implements both `Rule` and `ValidatorAwareRule` interfaces, enabling validation logic to inspect input values against registered gate abilities. During execution, `passes()` extracts the primary model instance from configured arguments, appends the validated field value, and delegates evaluation to `Gate::allows()`.

```mermaid
sequenceDiagram
    participant Validator as Validator Instance
    participant CanRule as Illuminate\Validation\Rules\Can
    participant Gate as Illuminate\Support\Facades\Gate

    Validator->>CanRule: setValidator($validator)
    Validator->>CanRule: passes($attribute, $value)
    CanRule->>CanRule: array_shift($arguments) -> $model
    CanRule->>Gate: allows($ability, [$model, ..., $value])
    Gate--s->CanRule: bool (allowed/denied)
    CanRule--s->Validator: evaluation result
```

Sources: [src/Illuminate/Validation/Rules/Can.php:9-86](https://github.com/laravel/framework/blob/main/src/Illuminate/Validation/Rules/Can.php#L9-L86)

> [!NOTE]
> The `Can` validation rule automatically falls back to a default translation string (`validation.can`) if a custom localization key is missing from the translation files.
> Sources: [src/Illuminate/Validation/Rules/Can.php:65-72](https://github.com/laravel/framework/blob/main/src/Illuminate/Validation/Rules/Can.php#L65-L72)

### Blade View Compilation Directives

The `CompilesAuthorizations` trait provides compiler directives that translate authorization shorthand into native PHP access checks resolving through the container's `Gate` contract.

| Directive Method | Compiled Output Template | Purpose |
| :--- | :--- | :--- |
| `compileCan` | `<?php if (app(\Illuminate\Contracts\Auth\Access\Gate::class)->check{$expression}): ?>` | Checks if user passes ability. |
| `compileCannot` | `<?php if (app(\Illuminate\Contracts\Auth\Access\Gate::class)->denies{$expression}): ?>` | Checks if user fails ability. |
| `compileCanany` | `<?php if (app(\Illuminate\Contracts\Auth\Access\Gate::class)->any{$expression}): ?>` | Checks if user passes any ability. |
| `compileElsecan` | `<?php elseif (app(\Illuminate\Contracts\Auth\Access\Gate::class)->check{$expression}): ?>` | Alternative conditional check. |
| `compileElsecannot` | `<?php elseif (app(\Illuminate\Contracts\Auth\Access\Gate::class)->denies{$expression}): ?>` | Alternative negative conditional. |
| `compileElsecanany` | `<?php elseif (app(\Illuminate\Contracts\Auth\Access\Gate::class)->any{$expression}): ?>` | Alternative multi-ability check. |
| `compileEndcan` | `<?php endif; ?>` | Terminates `@can` block. |
| `compileEndcannot` | `<?php endif; ?>` | Terminates `@cannot` block. |
| `compileEndcanany` | `<?php endif; ?>` | Terminates `@canany` block. |

Sources: [src/Illuminate/View/Compilers/Concerns/CompilesAuthorizations.php:5-101](https://github.com/laravel/framework/blob/main/src/Illuminate/View/Compilers/Concerns/CompilesAuthorizations.php#L5-L101)

## Related

- [[Authentication & Guards]]

