# Session Management

<details>
<summary>Relevant source files</summary>

The following files were used as context for generating this wiki page:

- [src/Illuminate/Session/Middleware/StartSession.php](https://github.com/laravel/framework/blob/main/src/Illuminate/Session/Middleware/StartSession.php)
- [src/Illuminate/Auth/SessionGuard.php](https://github.com/laravel/framework/blob/main/src/Illuminate/Auth/SessionGuard.php)
- [src/Illuminate/Session/SessionManager.php](https://github.com/laravel/framework/blob/main/src/Illuminate/Session/SessionManager.php)
- [src/Illuminate/Session/DatabaseSessionHandler.php](https://github.com/laravel/framework/blob/main/src/Illuminate/Session/DatabaseSessionHandler.php)
- [config/session.php](https://github.com/laravel/framework/blob/main/config/session.php)
- [src/Illuminate/Session/Store.php](https://github.com/laravel/framework/blob/main/src/Illuminate/Session/Store.php)
- [src/Illuminate/Session/CookieSessionHandler.php](https://github.com/laravel/framework/blob/main/src/Illuminate/Session/CookieSessionHandler.php)
- [src/Illuminate/Session/SessionServiceProvider.php](https://github.com/laravel/framework/blob/main/src/Illuminate/Session/SessionServiceProvider.php)
- [src/Illuminate/Cache/CacheManager.php](https://github.com/laravel/framework/blob/main/src/Illuminate/Cache/CacheManager.php)
- [src/Illuminate/Support/Facades/Session.php](https://github.com/laravel/framework/blob/main/src/Illuminate/Support/Facades/Session.php)
- [src/Illuminate/Session/CacheBasedSessionHandler.php](https://github.com/laravel/framework/blob/main/src/Illuminate/Session/CacheBasedSessionHandler.php)
- [config/cache.php](https://github.com/laravel/framework/blob/main/config/cache.php)
- [src/Illuminate/Session/ArraySessionHandler.php](https://github.com/laravel/framework/blob/main/src/Illuminate/Session/ArraySessionHandler.php)
- [src/Illuminate/Session/EncryptedStore.php](https://github.com/laravel/framework/blob/main/src/Illuminate/Session/EncryptedStore.php)
- [src/Illuminate/Contracts/Session/Session.php](https://github.com/laravel/framework/blob/main/src/Illuminate/Contracts/Session/Session.php)
</details>

## Overview

Session management in Laravel provides a robust, decoupled architecture for storing and retrieving conversational user state across HTTP requests. By bypassing native PHP sessions entirely, the framework handles session lifecycles through a modular driver system that supports database, cookie, cache-based, and array backends. It integrates tightly with the HTTP middleware pipeline, authentication guards, and encryption services to ensure secure payload persistence and synchronized user state.

Sources: [src/Illuminate/Session/Middleware/StartSession.php:111-113](https://github.com/laravel/framework/blob/main/src/Illuminate/Session/Middleware/StartSession.php#L111-L113), [src/Illuminate/Session/SessionManager.php:30-151](https://github.com/laravel/framework/blob/main/src/Illuminate/Session/SessionManager.php#L30-L151)

## Service Registration and Manager Factory

### Overview

The service registration and manager factory layer coordinates how session components bind into the container and how underlying storage drivers are resolved. `SessionServiceProvider` registers both `SessionManager` as a singleton bound to `'session'` and `StartSession` middleware into the application container. When the `'session.store'` binding is resolved, it calls `$app->make('session')->driver()`, triggering the manager factory to construct the configured backend handler and wrap it in a session store instance.

Sources: [src/Illuminate/Session/SessionServiceProvider.php:16-54](https://github.com/laravel/framework/blob/main/src/Illuminate/Session/SessionServiceProvider.php#L16-L54)

### Driver Resolution and Construction

`SessionManager` extends `Illuminate\Support\Manager` and maps configuration drivers to specific creation methods. Supported driver identifiers include `null`, `array`, `cookie`, `file`, `database`, `apc`, `memcached`, `redis`, and `dynamodb`. Each creation method instantiates the corresponding session handler interface and passes it through `buildSession()`.

| Driver Name | Creation Method | Handler Class | Dependencies & Configuration |
| :--- | :--- | :--- | :--- |
| `null` | `createNullDriver()` | `NullSessionHandler` | None |
| `array` | `createArrayDriver()` | `ArraySessionHandler` | `session.lifetime` |
| `cookie` | `createCookieDriver()` | `CookieSessionHandler` | `cookie` encrypter, `session.lifetime`, `session.expire_on_close` |
| `file` | `createFileDriver()` / `createNativeDriver()` | `FileSessionHandler` | `files` disk, `session.files` path, `session.lifetime` |
| `database` | `createDatabaseDriver()` | `DatabaseSessionHandler` | Database connection, `session.table`, `session.lifetime` |
| `apc` / `memcached` / `dynamodb` | `createCacheBased()` | `CacheBasedSessionHandler` | Cache store, `session.lifetime` |
| `redis` | `createRedisDriver()` | `CacheBasedSessionHandler` | Cache store, connection, prefix, `session.lifetime` |

Sources: [src/Illuminate/Session/SessionManager.php:30-161](https://github.com/laravel/framework/blob/main/src/Illuminate/Session/SessionManager.php#L30-L161), [src/Illuminate/Session/SessionServiceProvider.php:34-54](https://github.com/laravel/framework/blob/main/src/Illuminate/Session/SessionServiceProvider.php#L34-L54), [config/session.php:16-17](https://github.com/laravel/framework/blob/main/config/session.php#L16-L17)

### Session Building and Encryption

Once a handler is instantiated, `buildSession()` checks whether `session.encrypt` is enabled. If true, it delegates to `buildEncryptedSession()`, wrapping the handler in an `EncryptedStore` instance alongside the container's encrypter. Otherwise, it instantiates a standard `Store` using the cookie name, handler, null ID, and serialization format.

```php
protected function buildSession($handler)
{
    return $this->config->get('session.encrypt')
        ? $this->buildEncryptedSession($handler)
        : new Store(
            $this->config->get('session.cookie'),
            $handler,
            $id = null,
            $this->config->get('session.serialization', 'php')
        );
}
```

Sources: [src/Illuminate/Session/SessionManager.php:191-206](https://github.com/laravel/framework/blob/main/src/Illuminate/Session/SessionManager.php#L191-L206)

> [!NOTE]
> The `redis` driver performs additional configuration after creating the cache handler by pulling `session.connection` and `session.prefix` values from the configuration repository and applying them directly to the underlying store instance before building the session store.

Sources: [src/Illuminate/Session/SessionManager.php:138-151](https://github.com/laravel/framework/blob/main/src/Illuminate/Session/SessionManager.php#L138-L151)

## HTTP Request Middleware Lifecycle

### Overview

The `StartSession` middleware controls the HTTP request lifecycle for sessions, handling driver verification, concurrent request blocking, session startup, garbage collection, and final response persistence. When an incoming request reaches `StartSession::handle()`, it first verifies if a session driver is configured via `sessionConfigured()`. If no driver is configured, execution immediately skips to the next middleware via `$next($request)`. Otherwise, `getSession($request)` retrieves the driver from `SessionManager` and populates the session ID from the request cookie using `$session->setName()` and `$session->setId()`.

Sources: [src/Illuminate/Session/Middleware/StartSession.php:50-64](https://github.com/laravel/framework/blob/main/src/Illuminate/Session/Middleware/StartSession.php#L50-L64), [src/Illuminate/Session/Middleware/StartSession.php:156-161](https://github.com/laravel/framework/blob/main/src/Illuminate/Session/Middleware/StartSession.php#L156-L161), [src/Illuminate/Session/Middleware/StartSession.php:281-284](https://github.com/laravel/framework/blob/main/src/Illuminate/Session/Middleware/StartSession.php#L281-L284)

### Route Blocking and Concurrency Control

Before entering stateful processing, the middleware evaluates whether the request requires concurrency locking. If either the session manager dictates blocking (`$this->manager->shouldBlock()`) or the matched route explicitly defines a lock (`$request->route()->locksFor()`), control passes to `handleRequestWhileBlocking()`. This method validates that the request matches a concrete `Route` instance, constructs a cache lock using the `session:` prefix combined with the session ID, configures retry intervals, and attempts to acquire the lock before executing the inner request stack.

```php
protected function handleRequestWhileBlocking(Request $request, $session, Closure $next)
{
    if (! $request->route() instanceof Route) {
        return;
    }

    $lockFor = $request->route() && $request->route()->locksFor()
        ? $request->route()->locksFor()
        : $this->manager->defaultRouteBlockLockSeconds();

    $lock = $this->cache($this->manager->blockDriver())
        ->lock('session:'.$session->getId(), $lockFor)
        ->betweenBlockedAttemptsSleepFor(50);

    try {
        $lock->block(
            ! is_null($request->route()->waitsFor())
                ? $request->route()->waitsFor()
                : $this->manager->defaultRouteBlockWaitSeconds()
        );

        return $this->handleStatefulRequest($request, $session, $next);
    } finally {
        $lock?->release();
    }
}
```

Sources: [src/Illuminate/Session/Middleware/StartSession.php:58-99](https://github.com/laravel/framework/blob/main/src/Illuminate/Session/Middleware/StartSession.php#L58-L99)

> [!WARNING]
> If a blocking request fails to acquire the cache lock within the allotted wait time (controlled by route specifications or `defaultRouteBlockWaitSeconds()`), an exception is thrown by the cache lock driver. The `finally` block guarantees that `$lock->release()` executes whenever the lock was successfully acquired.

Sources: [src/Illuminate/Session/Middleware/StartSession.php:88-98](https://github.com/laravel/framework/blob/main/src/Illuminate/Session/Middleware/StartSession.php#L88-L98)

### Stateful Request Lifecycle and Persistence

Once concurrency handling concludes, `handleStatefulRequest()` executes the core session lifecycle sequence. It binds the session to the request, runs probabilistic garbage collection, dispatches the application stack, records navigation history, attaches response cookies, and saves session payloads back to storage.

```
StartSession::handleStatefulRequest() 
  → $request->setLaravelSession($this->startSession()) 
  → $this->collectGarbage() 
  → $response = $next($request) 
  → $this->storeCurrentUrl() 
  → $this->addCookieToResponse() 
  → $this->saveSession()
```

Sources: [src/Illuminate/Session/Middleware/StartSession.php:109-132](https://github.com/laravel/framework/blob/main/src/Illuminate/Session/Middleware/StartSession.php#L109-L132)

Garbage collection runs conditionally via `collectGarbage()`, which fetches session configuration odds and evaluates `configHitsLottery()`. If random generation hits the threshold, `$session->getHandler()->gc()` purges expired records. After the application response is generated, `storeCurrentUrl()` updates previous URL tracking for qualifying `GET` requests, provided the request is not AJAX, prefetch, or precognitive. Finally, `addCookieToResponse()` appends the persistent session cookie, and `saveSession()` invokes `$this->manager->driver()->save()` unless the request is precognitive.

Sources: [src/Illuminate/Session/Middleware/StartSession.php:118-130](https://github.com/laravel/framework/blob/main/src/Illuminate/Session/Middleware/StartSession.php#L118-L130), [src/Illuminate/Session/Middleware/StartSession.php:169-190](https://github.com/laravel/framework/blob/main/src/Illuminate/Session/Middleware/StartSession.php#L169-L190), [src/Illuminate/Session/Middleware/StartSession.php:199-250](https://github.com/laravel/framework/blob/main/src/Illuminate/Session/Middleware/StartSession.php#L199-L250)

> [!TIP]
> The lottery odds array retrieved from `session.lottery` uses a two-element format `[chance, out_of]`. `configHitsLottery()` executes `random_int(1, $config['lottery'][1]) <= $config['lottery'][0]`, determining whether session garbage collection executes on the current request.

Sources: [src/Illuminate/Session/Middleware/StartSession.php:171-190](https://github.com/laravel/framework/blob/main/src/Illuminate/Session/Middleware/StartSession.php#L171-L190)

## Session Store Data Operations

### Overview

The `Illuminate\Session\Store` class implements the `Illuminate\Contracts\Session\Session` interface to manage session state, attribute manipulation, ID generation, and flash data aging. Core attributes are held in an internal array and synchronized through a `SessionHandlerInterface` driver using either `php` or `json` serialization strategies.

Sources: [src/Illuminate/Session/Store.php:24-91](https://github.com/laravel/framework/blob/main/src/Illuminate/Session/Store.php#L24-L91), [src/Illuminate/Contracts/Session/Session.php:5-213](https://github.com/laravel/framework/blob/main/src/Illuminate/Contracts/Session/Session.php#L5-L213)

### State Initialization and Serialization Flow

When a session starts or saves, data passes through well-defined serialization and marshaling steps. The sequence differs depending on whether JSON or PHP native serialization is configured.

```
Store::start() 
  → loadSession() 
  → readFromHandler() 
  → handler->read() 
  → unserialize() or json_decode() 
  → marshalErrorBag()
```

Sources: [src/Illuminate/Session/Store.php:98-141](https://github.com/laravel/framework/blob/main/src/Illuminate/Session/Store.php#L98-L141)

When saving via `save()`, flash data ages, view error bags are prepared for serialization, and attributes are written back to the handler:

```
Store::save() 
  → ageFlashData() 
  → prepareErrorBagForSerialization() 
  → handler->write() 
  → prepareForStorage()
```

Sources: [src/Illuminate/Session/Store.php:181-192](https://github.com/laravel/framework/blob/main/src/Illuminate/Session/Store.php#L181-L192)

> [!NOTE]
> During `ageFlashData()`, items currently in `_flash.old` are forgotten, items in `_flash.new` are moved to `_flash.old`, and `_flash.new` is cleared to an empty array.

Sources: [src/Illuminate/Session/Store.php:233-240](https://github.com/laravel/framework/blob/main/src/Illuminate/Session/Store.php#L233-L240)

### Attribute Manipulation and Flash Operations

`Store` provides comprehensive methods for reading, writing, incrementing, and flashing attributes, supporting both string keys and `UnitEnum` or `BackedEnum` instances via `enum_value()`.

| Operation Method | Argument Signature | Behavior |
| :--- | :--- | :--- |
| `get` | `$key, $default = null` | Retrieves an attribute using dot notation, evaluating enum values. |
| `put` | `$key, $value = null` | Sets a key/value pair or an array of pairs into session attributes. |
| `pull` | `$key, $default = null` | Retrieves a value and immediately removes it from session attributes. |
| `forget` | `$keys` | Removes one or many keys using dot notation. |
| `flash` | `$key, $value = true` | Sets a value, registers the key in `_flash.new`, and removes it from `_flash.old`. |
| `now` | `$key, $value` | Sets a value and registers the key immediately in `_flash.old`. |
| `increment` | `$key, $amount = 1` | Increments a numeric session value by a given amount (default `1`). |
| `decrement` | `$key, $amount = 1` | Decrements a numeric session value by calling `increment` with a negative multiplier. |

Sources: [src/Illuminate/Session/Store.php:327-496](https://github.com/laravel/framework/blob/main/src/Illuminate/Session/Store.php#L327-L496)

> [!WARNING]
> Session IDs generated or validated by `setId()` and `isValidId()` must be exactly 40 characters long (`SESSION_ID_LENGTH`), consist purely of alphanumeric characters (`ctype_alnum`), and be strings. Invalid IDs automatically trigger generation of a new random ID via `generateSessionId()`.

Sources: [src/Illuminate/Session/Store.php:33](https://github.com/laravel/framework/blob/main/src/Illuminate/Session/Store.php#L33), [src/Illuminate/Session/Store.php:701-725](https://github.com/laravel/framework/blob/main/src/Illuminate/Session/Store.php#L701-L725)

### Session Store Design Trade-Offs

| Design Choice | Benefit | Cost |
| :--- | :--- | :--- |
| In-memory `attributes` array | Fast read/write access during request lifecycle without repeated storage queries. | High memory consumption for large payloads; requires explicit serialization on save. |
| Two-tier flash arrays (`_flash.new` and `_flash.old`) | Precise tracking of flash lifespan across request boundaries without expiry timers. | Overhead of array mutations and array diff operations during `ageFlashData()`. |
| Fixed 40-character alphanumeric session IDs | High collision resistance and uniform length constraints across standard storage layers. | Strict validation rules prevent custom short or non-alphanumeric IDs. |

Sources: [src/Illuminate/Session/Store.php:50-54](https://github.com/laravel/framework/blob/main/src/Illuminate/Session/Store.php#L50-L54), [src/Illuminate/Session/Store.php:233-240](https://github.com/laravel/framework/blob/main/src/Illuminate/Session/Store.php#L233-L240), [src/Illuminate/Session/Store.php:712-715](https://github.com/laravel/framework/blob/main/src/Illuminate/Session/Store.php#L712-L715)

## Session Encryption and Security

### Overview

The `EncryptedStore` class extends `Store` to provide transparent authenticated encryption for all session payloads. When encryption is enabled via configuration (`session.encrypt`), `SessionManager` instantiates `EncryptedStore` instead of the base `Store` class, injecting an implementation of `EncrypterContract` into its constructor alongside the name, handler, session ID, and serialization format.

Sources: [src/Illuminate/Session/EncryptedStore.php:9-32](https://github.com/laravel/framework/blob/main/src/Illuminate/Session/EncryptedStore.php#L9-L32), [src/Illuminate/Session/SessionManager.php:214-223](https://github.com/laravel/framework/blob/main/src/Illuminate/Session/SessionManager.php#L214-L223)

### Encryption and Decryption Workflow

During session loading and storage persistence, `EncryptedStore` intercepts the data payload to encrypt outgoing strings and decrypt incoming payloads. 

```
Store::loadSession() 
  → readFromHandler() 
  → handler->read() 
  → EncryptedStore::prepareForUnserialize() 
  → encrypter->decrypt()
```

Sources: [src/Illuminate/Session/EncryptedStore.php:40-47](https://github.com/laravel/framework/blob/main/src/Illuminate/Session/EncryptedStore.php#L40-L47), [src/Illuminate/Session/Store.php:114-133](https://github.com/laravel/framework/blob/main/src/Illuminate/Session/Store.php#L114-L133)

When saving session state, the data goes through serialization followed by encryption:

```
Store::save() 
  → handler->write() 
  → EncryptedStore::prepareForStorage() 
  → encrypter->encrypt()
```

Sources: [src/Illuminate/Session/EncryptedStore.php:50-58](https://github.com/laravel/framework/blob/main/src/Illuminate/Session/EncryptedStore.php#L50-L58), [src/Illuminate/Session/Store.php:181-189](https://github.com/laravel/framework/blob/main/src/Illuminate/Session/Store.php#L181-L189)

> [!WARNING]
> If decryption fails and throws a `DecryptException` due to key rotation, payload tampering, or corruption, `prepareForUnserialize()` catches the exception and returns an empty array encoded appropriately for the configured serialization format (`json_encode([])` for JSON or `serialize([])` for PHP serialization) rather than failing the request.

Sources: [src/Illuminate/Session/EncryptedStore.php:40-47](https://github.com/laravel/framework/blob/main/src/Illuminate/Session/EncryptedStore.php#L40-L47)

## Session Handler Storage Implementations

### Overview

Laravel provides multiple built-in session storage handlers implementing PHP's `SessionHandlerInterface` (and optionally `ExistenceAwareInterface`). These handlers dictate how session payloads are persisted across requests, supporting relational databases, encrypted client-side cookies, cache repositories, and volatile runtime arrays.

Sources: [src/Illuminate/Session/DatabaseSessionHandler.php:14-15](https://github.com/laravel/framework/blob/main/src/Illuminate/Session/DatabaseSessionHandler.php#L14-L15), [src/Illuminate/Session/CookieSessionHandler.php:10](https://github.com/laravel/framework/blob/main/src/Illuminate/Session/CookieSessionHandler.php#L10), [src/Illuminate/Session/CacheBasedSessionHandler.php:8](https://github.com/laravel/framework/blob/main/src/Illuminate/Session/CacheBasedSessionHandler.php#L8), [src/Illuminate/Session/ArraySessionHandler.php:8](https://github.com/laravel/framework/blob/main/src/Illuminate/Session/ArraySessionHandler.php#L8)

### Database Handler

The `DatabaseSessionHandler` persists session data in a relational database table using a database connection instance. It implements `ExistenceAwareInterface` to optimize insert and update operations by tracking whether a session record already exists in storage.

When a session is read via `read($sessionId)`, the handler queries the configured table, checks if the session is expired via `expired()`, and decodes the base64-encoded payload string.

```
DatabaseSessionHandler::read() 
  → getQuery()->find($sessionId) 
  → expired() 
  → base64_decode($session->payload)
```

Sources: [src/Illuminate/Session/DatabaseSessionHandler.php:14-15](https://github.com/laravel/framework/blob/main/src/Illuminate/Session/DatabaseSessionHandler.php#L14-L15), [src/Illuminate/Session/DatabaseSessionHandler.php:94-111](https://github.com/laravel/framework/blob/main/src/Illuminate/Session/DatabaseSessionHandler.php#L94-L111)

When writing session data, `write($sessionId, $data)` constructs a default payload containing the base64-encoded data, current timestamp, and optionally authenticated user ID, request IP address, and truncated user agent string if a container instance is bound.

Sources: [src/Illuminate/Session/DatabaseSessionHandler.php:130-145](https://github.com/laravel/framework/blob/main/src/Illuminate/Session/DatabaseSessionHandler.php#L130-L145), [src/Illuminate/Session/DatabaseSessionHandler.php:181-196](https://github.com/laravel/framework/blob/main/src/Illuminate/Session/DatabaseSessionHandler.php#L181-L196)

> [!NOTE]
> During `performInsert()`, if a `QueryException` occurs due to a concurrent write or primary key collision on the session ID, the handler catches the exception and falls back to invoking `performUpdate()`.

Sources: [src/Illuminate/Session/DatabaseSessionHandler.php:154-161](https://github.com/laravel/framework/blob/main/src/Illuminate/Session/DatabaseSessionHandler.php#L154-L161)

### Cookie Handler

The `CookieSessionHandler` stores session payloads directly inside encrypted HTTP cookies managed by the application's queueing cookie factory. 

In `read($sessionId)`, the handler inspects the incoming request cookies, decodes the JSON payload, and verifies that the expiration timestamp has not elapsed before returning the raw data string.

```
CookieSessionHandler::read() 
  → request->cookies->get($sessionId) 
  → json_decode() 
  → currentTime() <= decoded['expires']
```

Sources: [src/Illuminate/Session/CookieSessionHandler.php:10](https://github.com/laravel/framework/blob/main/src/Illuminate/Session/CookieSessionHandler.php#L10), [src/Illuminate/Session/CookieSessionHandler.php:81-91](https://github.com/laravel/framework/blob/main/src/Illuminate/Session/CookieSessionHandler.php#L81-L91)

The `write($sessionId, $data)` method serializes the session data and expiration time into a JSON string and queues it via the cookie jar. Garbage collection (`gc()`) is a no-op returning `0` since browser cookies handle their own lifespan expiration.

Sources: [src/Illuminate/Session/CookieSessionHandler.php:98-128](https://github.com/laravel/framework/blob/main/src/Illuminate/Session/CookieSessionHandler.php#L98-L128)

### Cache-Based and Array Handlers

The `CacheBasedSessionHandler` delegates persistence to any underlying PSR-16 or Illuminate cache repository. 

* `read($sessionId)` calls `$this->cache->get($sessionId, '')`.
* `write($sessionId, $data)` calls `$this->cache->put($sessionId, $data, $this->minutes * 60)`.
* `destroy($sessionId)` calls `$this->cache->forget($sessionId)`.

Sources: [src/Illuminate/Session/CacheBasedSessionHandler.php:8](https://github.com/laravel/framework/blob/main/src/Illuminate/Session/CacheBasedSessionHandler.php#L8), [src/Illuminate/Session/CacheBasedSessionHandler.php:61-84](https://github.com/laravel/framework/blob/main/src/Illuminate/Session/CacheBasedSessionHandler.php#L61-L84)

The `ArraySessionHandler` stores session states in a volatile in-memory PHP array (`$storage`), making it suitable for testing environments and non-persistent single-request command executions.

Sources: [src/Illuminate/Session/ArraySessionHandler.php:8-17](https://github.com/laravel/framework/blob/main/src/Illuminate/Session/ArraySessionHandler.php#L8-L17)

### Session Handler Reference Table

| Handler Class | Storage Backend | Implements Interfaces | Key Methods |
| :--- | :--- | :--- | :--- |
| `DatabaseSessionHandler` | Relational Database | `SessionHandlerInterface`, `ExistenceAwareInterface` | `read()`, `write()`, `destroy()`, `gc()` |
| `CookieSessionHandler` | HTTP Cookies | `SessionHandlerInterface` | `read()`, `write()`, `destroy()`, `gc()` |
| `CacheBasedSessionHandler` | Cache Store | `SessionHandlerInterface` | `read()`, `write()`, `destroy()`, `gc()` |
| `ArraySessionHandler` | In-Memory Array | `SessionHandlerInterface` | `read()`, `write()`, `destroy()`, `gc()` |

Sources: [src/Illuminate/Session/DatabaseSessionHandler.php:14-15](https://github.com/laravel/framework/blob/main/src/Illuminate/Session/DatabaseSessionHandler.php#L14-L15), [src/Illuminate/Session/CookieSessionHandler.php:10](https://github.com/laravel/framework/blob/main/src/Illuminate/Session/CookieSessionHandler.php#L10), [src/Illuminate/Session/CacheBasedSessionHandler.php:8](https://github.com/laravel/framework/blob/main/src/Illuminate/Session/CacheBasedSessionHandler.php#L8), [src/Illuminate/Session/ArraySessionHandler.php:8](https://github.com/laravel/framework/blob/main/src/Illuminate/Session/ArraySessionHandler.php#L8)

## Authentication Guard Integration

### Overview

The `SessionGuard` class integrates session state management with user authentication, bridging session persistence and user identity retrieval. When determining the currently authenticated user via `user()`, the guard inspects the session store using a dynamically computed session name (`login_` followed by the guard name and a SHA-1 hash of the static class name) to fetch a stored user identifier.

Sources: [src/Illuminate/Auth/SessionGuard.php:30-31](https://github.com/laravel/framework/blob/main/src/Illuminate/Auth/SessionGuard.php#L30-L31), [src/Illuminate/Auth/SessionGuard.php:171-185](https://github.com/laravel/framework/blob/main/src/Illuminate/Auth/SessionGuard.php#L171-L185), [src/Illuminate/Auth/SessionGuard.php:874-877](https://github.com/laravel/framework/blob/main/src/Illuminate/Auth/SessionGuard.php#L874-L877)

### User Retrieval and Re-Authentication Flow

When `user()` is invoked, the guard follows an execution path that resolves the user from memory, session storage, or remember-me cookies:

`user()` → Checks `$this->user` in memory → Reads session store key via `$this->session->get($this->getName())` → Calls `$this->provider->retrieveById($id)` → Fires `Authenticated` event if found → Falls back to `recaller()` and `userFromRecaller()` if null.

Sources: [src/Illuminate/Auth/SessionGuard.php:171-207](https://github.com/laravel/framework/blob/main/src/Illuminate/Auth/SessionGuard.php#L171-L207)

If the primary session lookup returns null and a recaller cookie is present, `userFromRecaller($recaller)` validates the token, retrieves the user via `$this->provider->retrieveByToken()`, updates the session store with the user's authentication identifier, and fires a `Login` event.

Sources: [src/Illuminate/Auth/SessionGuard.php:196-204](https://github.com/laravel/framework/blob/main/src/Illuminate/Auth/SessionGuard.php#L196-L204), [src/Illuminate/Auth/SessionGuard.php:215-231](https://github.com/laravel/framework/blob/main/src/Illuminate/Auth/SessionGuard.php#L215-L231)

```
SessionGuard::user()
  ├── 1. Check loggedOut flag & cached $this->user
  ├── 2. Retrieve ID from $this->session->get($this->getName())
  ├── 3. If ID exists → $this->provider->retrieveById($id) → fireAuthenticatedEvent()
  └── 4. If user is null & recaller exists → userFromRecaller() → updateSession() → fireLoginEvent()
```

Sources: [src/Illuminate/Auth/SessionGuard.php:171-207](https://github.com/laravel/framework/blob/main/src/Illuminate/Auth/SessionGuard.php#L171-L207)

> [!NOTE]
> During a successful login via `login($user, $remember)`, the guard immediately invokes `updateSession($id)`, which writes the user identifier to the session store and calls `$this->session->regenerate(true)` to prevent session fixation attacks.

Sources: [src/Illuminate/Auth/SessionGuard.php:557-590](https://github.com/laravel/framework/blob/main/src/Illuminate/Auth/SessionGuard.php#L557-L590)

## Related

- [[Cache Storage Backends]]
- [[HTTP Request & Response]]

