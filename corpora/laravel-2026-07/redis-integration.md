# Redis Integration

<details>
<summary>Relevant source files</summary>

The following files were used as context for generating this wiki page:

- [src/Illuminate/Redis/RedisManager.php](https://github.com/laravel/framework/blob/main/src/Illuminate/Redis/RedisManager.php)
- [src/Illuminate/Redis/Connectors/PhpRedisConnector.php](https://github.com/laravel/framework/blob/main/src/Illuminate/Redis/Connectors/PhpRedisConnector.php)
- [src/Illuminate/Queue/QueueServiceProvider.php](https://github.com/laravel/framework/blob/main/src/Illuminate/Queue/QueueServiceProvider.php)
- [src/Illuminate/Support/Facades/Redis.php](https://github.com/laravel/framework/blob/main/src/Illuminate/Support/Facades/Redis.php)
- [src/Illuminate/Redis/Connectors/PredisConnector.php](https://github.com/laravel/framework/blob/main/src/Illuminate/Redis/Connectors/PredisConnector.php)
- [src/Illuminate/Cache/RedisStore.php](https://github.com/laravel/framework/blob/main/src/Illuminate/Cache/RedisStore.php)
- [src/Illuminate/Redis/Connections/PhpRedisConnection.php](https://github.com/laravel/framework/blob/main/src/Illuminate/Redis/Connections/PhpRedisConnection.php)
- [src/Illuminate/Cache/CacheManager.php](https://github.com/laravel/framework/blob/main/src/Illuminate/Cache/CacheManager.php)
- [src/Illuminate/Redis/Connections/Connection.php](https://github.com/laravel/framework/blob/main/src/Illuminate/Redis/Connections/Connection.php)
- [src/Illuminate/Foundation/Testing/Concerns/InteractsWithRedis.php](https://github.com/laravel/framework/blob/main/src/Illuminate/Foundation/Testing/Concerns/InteractsWithRedis.php)
- [src/Illuminate/Redis/RedisServiceProvider.php](https://github.com/laravel/framework/blob/main/src/Illuminate/Redis/RedisServiceProvider.php)
- [types/Managers/RedisManager.php](https://github.com/laravel/framework/blob/main/types/Managers/RedisManager.php)
- [src/Illuminate/Redis/Connections/PredisConnection.php](https://github.com/laravel/framework/blob/main/src/Illuminate/Redis/Connections/PredisConnection.php)
- [types/Managers/CacheManager.php](https://github.com/laravel/framework/blob/main/types/Managers/CacheManager.php)
- [config/database.php](https://github.com/laravel/framework/blob/main/config/database.php)
- [src/Illuminate/Contracts/Redis/Connector.php](https://github.com/laravel/framework/blob/main/src/Illuminate/Contracts/Redis/Connector.php)
</details>

## Overview

Laravel's Redis integration provides a robust, extensible foundation for interacting with Redis servers and clusters across multiple backend clients. It solves the complexity of managing disparate connection configurations, driver-specific idiosyncrasies, and lifecycle events by offering a unified manager and connection architecture. Centralized through the `RedisManager` and registered via service providers, the component abstracts client instantiation, supports custom driver extensions, and integrates deeply with Laravel's caching and queue subsystems to handle high-performance data storage, pub/sub messaging, and distributed locking.

Sources: [src/Illuminate/Redis/RedisManager.php:22-289](https://github.com/laravel/framework/blob/main/src/Illuminate/Redis/RedisManager.php#L22-L289), [src/Illuminate/Redis/RedisServiceProvider.php:9-27](https://github.com/laravel/framework/blob/main/src/Illuminate/Redis/RedisServiceProvider.php#L9-L27), [src/Illuminate/Cache/RedisStore.php:16-254](https://github.com/laravel/framework/blob/main/src/Illuminate/Cache/RedisStore.php#L16-L254)

## Service Registration and Configuration

### Service Provider Binding and Facade Access

The `RedisServiceProvider` manages the binding of Redis services into Laravel's service container, implementing `DeferrableProvider` to defer loading until required. It registers two container bindings: a singleton for `'redis'` returning a configured `RedisManager` instance, and a binding for `'redis.connection'` that fetches the default connection directly from the manager. 

Sources: [src/Illuminate/Redis/RedisServiceProvider.php:9-27](https://github.com/laravel/framework/blob/main/src/Illuminate/Redis/RedisServiceProvider.php#L9-L27)

```php
$this->app->singleton('redis', function ($app) {
    $config = $app->make('config')->get('database.redis', []);

    return new RedisManager($app, Arr::pull($config, 'client', 'phpredis'), $config);
});

$this->app->bind('redis.connection', function ($app) {
    return $app['redis']->connection();
});
```
Sources: [src/Illuminate/Redis/RedisServiceProvider.php:18-26](https://github.com/laravel/framework/blob/main/src/Illuminate/Redis/RedisServiceProvider.php#L18-L26)

The `Redis` facade extends Laravel's base `Facade` class, resolving to the container accessor string `'redis'`. Through extensive phpdoc method annotations, it proxies static calls directly to the underlying `RedisManager` instance and active connection drivers.

Sources: [src/Illuminate/Support/Facades/Redis.php:311-321](https://github.com/laravel/framework/blob/main/src/Illuminate/Support/Facades/Redis.php#L311-L321)

```php
class Redis extends Facade
{
    protected static function getFacadeAccessor()
    {
        return 'redis';
    }
}
```
Sources: [src/Illuminate/Support/Facades/Redis.php:311-321](https://github.com/laravel/framework/blob/main/src/Illuminate/Support/Facades/Redis.php#L311-L321)

### Configuration Parsing and Database Options

Redis configuration is loaded from the `database.redis` configuration array. During service resolution, the `client` option is extracted via `Arr::pull()` with a fallback default of `phpredis`. The remaining configuration array is passed to `RedisManager`, which processes individual connection settings and parses URL strings using `ConfigurationUrlParser`.

Sources: [src/Illuminate/Redis/RedisManager.php:181-199](https://github.com/laravel/framework/blob/main/src/Illuminate/Redis/RedisManager.php#L181-L199), [src/Illuminate/Redis/RedisServiceProvider.php:18-22](https://github.com/laravel/framework/blob/main/src/Illuminate/Redis/RedisServiceProvider.php#L18-L22), [config/database.php:156-192](https://github.com/laravel/framework/blob/main/config/database.php#L156-L192)

```php
protected function parseConnectionConfiguration($config)
{
    $parsed = (new ConfigurationUrlParser)->parseConfiguration($config);

    $driver = strtolower($parsed['driver'] ?? '');

    if (in_array($driver, ['tcp', 'tls'])) {
        $parsed['scheme'] = $driver;
    }

    return array_filter($parsed, function ($key) {
        return $key !== 'driver';
    }, ARRAY_FILTER_USE_KEY);
}
```
Sources: [src/Illuminate/Redis/RedisManager.php:186-199](https://github.com/laravel/framework/blob/main/src/Illuminate/Redis/RedisManager.php#L186-L199)

The default configuration structure defines global client settings, cluster options, and named connections such as `default` and `cache`.

Sources: [config/database.php:156-191](https://github.com/laravel/framework/blob/main/config/database.php#L156-L191)

| Configuration Key | Default Value | Purpose |
| :--- | :--- | :--- |
| `client` | `env('REDIS_CLIENT', 'phpredis')` | The underlying Redis client library driver (`phpredis` or `predis`). |
| `options.cluster` | `env('REDIS_CLUSTER', 'redis')` | The clustering strategy driver used when connecting to clusters. |
| `options.prefix` | `env('REDIS_PREFIX', ...)` | Global key prefix applied to all stored keys for namespacing. |
| `options.persistent` | `env('REDIS_PERSISTENT', false)` | Determines whether persistent socket connections should be utilized. |
| `default.port` | `env('REDIS_PORT', '6379')` | Network port for the default server connection. |
| `default.database` | `env('REDIS_DB', '0')` | Numeric Redis database index selected upon connection. |

Sources: [config/database.php:158-177](https://github.com/laravel/framework/blob/main/config/database.php#L158-L177)

## Redis Manager Connection Resolution

### Overview

The `RedisManager` class acts as the central connection factory and manager for all Redis operations in Laravel. It implements the `Illuminate\Contracts\Redis\Factory` contract and manages connection resolution, driver switching, cluster setup, event configuration, and custom driver extensions.

Sources: [src/Illuminate/Redis/RedisManager.php:22-23](https://github.com/laravel/framework/blob/main/src/Illuminate/Redis/RedisManager.php#L22-L23)

### Connection Resolution and Configuration Flow

When an application requests a Redis connection via `connection($name)`, `RedisManager` executes a precise resolution sequence. First, `enum_value($name)` or the default string `'default'` resolves the target identifier. The manager checks its local `$connections` cache; if the connection does not exist, it delegates to `resolve($name)` and passes the result through `configure()`.

Sources: [src/Illuminate/Redis/RedisManager.php:88-95](https://github.com/laravel/framework/blob/main/src/Illuminate/Redis/RedisManager.php#L88-L95)

```php
public function connection($name = null)
{
    $name = enum_value($name) ?: 'default';

    return $this->connections[$name] ?? $this->connections[$name] = $this->configure(
        $this->resolve($name), $name
    );
}
```
Sources: [src/Illuminate/Redis/RedisManager.php:88-95](https://github.com/laravel/framework/blob/main/src/Illuminate/Redis/RedisManager.php#L88-L95)

The resolution call-chain follows this execution path: `connection()` → `resolve()` → `connector()` → `Connector::connect()` or `Connector::connectToCluster()`. Within `resolve($name)`, the manager checks if an individual connection config (`$this->config[$name]`) or a cluster config (`$this->config['clusters'][$name]`) exists. If neither is found, an `InvalidArgumentException` is thrown.

Sources: [src/Illuminate/Redis/RedisManager.php:98-123](https://github.com/laravel/framework/blob/main/src/Illuminate/Redis/RedisManager.php#L98-L123)

> [!NOTE]
> During individual connection resolution, `resolve()` filters connection options, extracting parameters specific to the requested connection name via `Arr::get($options, 'parameters.'.$name, Arr::get($options, 'parameters', []))`.

Sources: [src/Illuminate/Redis/RedisManager.php:112-115](https://github.com/laravel/framework/blob/main/src/Illuminate/Redis/RedisManager.php#L112-L115)

### Driver Resolution and Custom Creators

`RedisManager` resolves the appropriate connection driver through the `connector()` method. If a custom driver creator has been registered using the `extend()` method, that closure is invoked. Otherwise, it matches against supported built-in drivers.

Sources: [src/Illuminate/Redis/RedisManager.php:165-178](https://github.com/laravel/framework/blob/main/src/Illuminate/Redis/RedisManager.php#L165-L178)

| Driver Identifier | Connector Class | Purpose |
| :--- | :--- | :--- |
| `predis` | `Illuminate\Redis\Connectors\PredisConnector` | Creates connections using the Predis pure-PHP library. |
| `phpredis` | `Illuminate\Redis\Connectors\PhpRedisConnector` | Creates connections using the PhpRedis C extension. |
| Custom (`extend`) | Custom `Closure` | Executes user-defined creator callbacks bound to `RedisManager`. |

Sources: [src/Illuminate/Redis/RedisManager.php:167-177](https://github.com/laravel/framework/blob/main/src/Illuminate/Redis/RedisManager.php#L167-L177), [src/Illuminate/Redis/RedisManager.php:265-276](https://github.com/laravel/framework/blob/main/src/Illuminate/Redis/RedisManager.php#L265-L276)

Custom driver registration uses `RebindsCallbacksToSelf` to bind the closure scope to the `RedisManager` instance before storing it in `$customCreators`:

```php
public function extend($driver, Closure $callback)
{
    try {
        $callback = $this->bindCallbackToSelf($callback) ?? throw new RuntimeException('Unable to bind custom driver callback');
    } catch (ReflectionException $e) {
        throw new RuntimeException('Unable to bind custom driver callback', previous: $e);
    }

    $this->customCreators[$driver] = $callback;

    return $this;
}
```
Sources: [src/Illuminate/Redis/RedisManager.php:265-276](https://github.com/laravel/framework/blob/main/src/Illuminate/Redis/RedisManager.php#L265-L276)

### Cluster Setup and Configuration Parsing

When a cluster configuration matches the requested name, `resolveCluster($name)` maps over each cluster node configuration using `parseConnectionConfiguration()`. It then invokes `connectToCluster()` on the active connector instance, passing the parsed node configs, cluster options, and global options.

Sources: [src/Illuminate/Redis/RedisManager.php:131-140](https://github.com/laravel/framework/blob/main/src/Illuminate/Redis/RedisManager.php#L131-L140)

```php
protected function resolveCluster($name)
{
    return $this->connector()->connectToCluster(
        array_map(function ($config) {
            return $this->parseConnectionConfiguration($config);
        }, $this->config['clusters'][$name]),
        $this->config['clusters']['options'] ?? [],
        $this->config['options'] ?? []
    );
}
```
Sources: [src/Illuminate/Redis/RedisManager.php:131-140](https://github.com/laravel/framework/blob/main/src/Illuminate/Redis/RedisManager.php#L131-L140)

> [!WARNING]
> `parseConnectionConfiguration()` normalizes URL connection strings and converts driver keys matching `'tcp'` or `'tls'` into the `'scheme'` option, filtering out the `'driver'` key from final options array.

Sources: [src/Illuminate/Redis/RedisManager.php:186-199](https://github.com/laravel/framework/blob/main/src/Illuminate/Redis/RedisManager.php#L186-L199)

## PhpRedis and Predis Connector Architectures

### Overview

The `Connector` contract defines two core operations across database drivers: establishing a standard single connection via `connect(array $config, array $options)` and establishing a clustered connection via `connectToCluster(array $config, array $clusterOptions, array $options)`. The framework implements this contract through `PhpRedisConnector` and `PredisConnector`, which parse host schemes, configure SSL contexts, and construct underlying C-extension or pure-PHP client instances.

Sources: [src/Illuminate/Contracts/Redis/Connector.php:5-25](https://github.com/laravel/framework/blob/main/src/Illuminate/Contracts/Redis/Connector.php#L5-L25), [src/Illuminate/Redis/Connectors/PhpRedisConnector.php:16-57](https://github.com/laravel/framework/blob/main/src/Illuminate/Redis/Connectors/PhpRedisConnector.php#L16-L57), [src/Illuminate/Redis/Connectors/PredisConnector.php:15-68](https://github.com/laravel/framework/blob/main/src/Illuminate/Redis/Connectors/PredisConnector.php#L15-L68)

### PhpRedis Client Connection and Cluster Building

`PhpRedisConnector` handles connection instantiation through the `PhpRedis` extension. During single connection establishment, `connect()` extracts configuration options, builds a closure-wrapped client initializer, and returns a `PhpRedisConnection`. The call chain flows through `connect()` → `createClient()` → `establishConnection()`, where parameters are assembled based on the installed PHP Redis version.

Sources: [src/Illuminate/Redis/Connectors/PhpRedisConnector.php:25-40](https://github.com/laravel/framework/blob/main/src/Illuminate/Redis/Connectors/PhpRedisConnector.php#L25-L40), [src/Illuminate/Redis/Connectors/PhpRedisConnector.php:78-156](https://github.com/laravel/framework/blob/main/src/Illuminate/Redis/Connectors/PhpRedisConnector.php#L78-L156), [src/Illuminate/Redis/Connectors/PhpRedisConnector.php:165-186](https://github.com/laravel/framework/blob/main/src/Illuminate/Redis/Connectors/PhpRedisConnector.php#L165-L186)

| PhpRedis Backoff Algorithm | Constant Value Mapping |
| :--- | :--- |
| `default` | `Redis::BACKOFF_ALGORITHM_DEFAULT` |
| `decorrelated_jitter` | `Redis::BACKOFF_ALGORITHM_DECORRELATED_JITTER` |
| `equal_jitter` | `Redis::BACKOFF_ALGORITHM_EQUAL_JITTER` |
| `exponential` | `Redis::BACKOFF_ALGORITHM_EXPONENTIAL` |
| `uniform` | `Redis::BACKOFF_ALGORITHM_UNIFORM` |
| `constant` | `Redis::BACKOFF_ALGORITHM_CONSTANT` |

Sources: [src/Illuminate/Redis/Connectors/PhpRedisConnector.php:366-374](https://github.com/laravel/framework/blob/main/src/Illuminate/Redis/Connectors/PhpRedisConnector.php#L366-L374)

When constructing cluster instances via `connectToCluster()`, `PhpRedisConnector` maps server configurations into seed strings using `buildClusterConnectionString()` and instantiates a `RedisCluster` client.

Sources: [src/Illuminate/Redis/Connectors/PhpRedisConnector.php:50-57](https://github.com/laravel/framework/blob/main/src/Illuminate/Redis/Connectors/PhpRedisConnector.php#L50-L57), [src/Illuminate/Redis/Connectors/PhpRedisConnector.php:65-68](https://github.com/laravel/framework/blob/main/src/Illuminate/Redis/Connectors/PhpRedisConnector.php#L65-L68)

> [!WARNING]
> If a global `Redis` facade alias conflicts with the underlying C extension during `createClient()`, a `LogicException` is thrown instructing the user to remove or rename the facade alias or ensure the extension is installed.

Sources: [src/Illuminate/Redis/Connectors/PhpRedisConnector.php:81-87](https://github.com/laravel/framework/blob/main/src/Illuminate/Redis/Connectors/PhpRedisConnector.php#L81-L87)

### Predis Connector and Retry Strategies

`PredisConnector` implements the same `Connector` contract using the pure-PHP Predis library. Single connections parse retry rules and host URI schemas before instantiating `Predis\Client`.

Sources: [src/Illuminate/Redis/Connectors/PredisConnector.php:15-39](https://github.com/laravel/framework/blob/main/src/Illuminate/Redis/Connectors/PredisConnector.php#L15-L39)

```php
public function connect(array $config, array $options)
{
    $config = $this->formatRetry($config);

    $formattedOptions = array_merge(
        ['timeout' => 10.0], $options, Arr::pull($config, 'options', [])
    );

    if (isset($config['prefix'])) {
        $formattedOptions['prefix'] = $config['prefix'];
    }

    $config = $this->formatHost($config);

    return new PredisConnection(new Client($config, $formattedOptions));
}
```
Sources: [src/Illuminate/Redis/Connectors/PredisConnector.php:24-39](https://github.com/laravel/framework/blob/main/src/Illuminate/Redis/Connectors/PredisConnector.php#L24-L39)

Cluster connections are built via `connectToCluster()`, which extracts cluster options, formats server hosts, handles retry parameters if configured, and wraps a multi-node `Predis\Client` inside a `PredisClusterConnection`.

Sources: [src/Illuminate/Redis/Connectors/PredisConnector.php:49-68](https://github.com/laravel/framework/blob/main/src/Illuminate/Redis/Connectors/PredisConnector.php#L49-L68)

> [!NOTE]
> Predis retry configuration requires `predis/predis` version 3.4.0 or newer. `formatRetry()` validates that the chosen strategy implements `RetryStrategyInterface` before building the `Predis\Retry\Retry` instance.

Sources: [src/Illuminate/Redis/Connectors/PredisConnector.php:106-130](https://github.com/laravel/framework/blob/main/src/Illuminate/Redis/Connectors/PredisConnector.php#L106-L130)

## Command Execution and Event Dispatching

### Overview

Command execution across backend connections relies on the base `Connection` class to handle timing, exception handling, event dispatching, and dynamic macro invocation. When any method is called on a connection, the `__call` magic method checks if a macro exists, delegating to the macro implementation; otherwise, it passes the call directly into the core `command()` execution wrapper.

Sources: [src/Illuminate/Redis/Connections/Connection.php:17-21](https://github.com/laravel/framework/blob/main/src/Illuminate/Redis/Connections/Connection.php#L17-L21), [src/Illuminate/Redis/Connections/Connection.php:278-285](https://github.com/laravel/framework/blob/main/src/Illuminate/Redis/Connections/Connection.php#L278-L285)

### Command Execution Lifecycle

The abstract `Connection` class defines the central `command()` method, which orchestrates the execution flow against the underlying client instance. 

The execution walk proceeds through the following steps:
1. `microtime(true)` records the execution start timestamp.
2. `$this->client->{$method}(...$parameters)` invokes the native command on the underlying client.
3. If an exception occurs, a `CommandFailed` event is dispatched with parsed parameters, and the exception is rethrown.
4. If successful, execution duration is calculated in milliseconds, rounded to two decimal places, and a `CommandExecuted` event is dispatched.
5. The raw result from the client is returned.

Sources: [src/Illuminate/Redis/Connections/Connection.php:119-140](https://github.com/laravel/framework/blob/main/src/Illuminate/Redis/Connections/Connection.php#L119-L140)

> [!NOTE]
> `PhpRedisConnection` overrides `command()` to catch `RedisException` instances. If the exception message indicates connection loss, read errors, or read-only cluster states, it attempts to re-establish the connection using the configured connector callback before bubbling the exception.

Sources: [src/Illuminate/Redis/Connections/PhpRedisConnection.php:528-539](https://github.com/laravel/framework/blob/main/src/Illuminate/Redis/Connections/PhpRedisConnection.php#L528-L539)

### Event Dispatching and Listeners

Connections support telemetry through event listeners registered with the internal event dispatcher. Listeners can be bound for successful command execution or failures.

| Listener Method | Event Dispatched | Purpose |
| :--- | :--- | :--- |
| `listen(Closure $callback)` | `Illuminate\Redis\Events\CommandExecuted` | Registers a callback invoked after a command successfully executes. |
| `listenForFailures(Closure $callback)` | `Illuminate\Redis\Events\CommandFailed` | Registers a callback invoked when a command throws an exception. |

Sources: [src/Illuminate/Redis/Connections/Connection.php:172-186](https://github.com/laravel/framework/blob/main/src/Illuminate/Redis/Connections/Connection.php#L172-L186)

Backend drivers can customize how command arguments are presented to telemetry events. For instance, `PredisConnection` overrides `parseParametersForEvent()` to transform any `ArrayableArgument` instances into standard arrays via `toArray()`.

Sources: [src/Illuminate/Redis/Connections/PredisConnection.php:61-69](https://github.com/laravel/framework/blob/main/src/Illuminate/Redis/Connections/PredisConnection.php#L61-L69)

## Cache and Queue Integration Bridges

### Cache and Queue Integration Bridges

### Overview

Laravel connects Redis directly into its caching and queuing subsystems via dedicated cache stores, queue connectors, and manager classes. The `CacheManager` resolves the Redis cache driver by instantiating a `RedisStore` configured with a prefix, database connection, and optional serializable classes. Concurrently, the `QueueServiceProvider` registers the Redis queue connector on the `QueueManager`, supplying an instance of the Redis container factory to build queue connections.

Sources: [src/Illuminate/Queue/QueueServiceProvider.php:202-207](https://github.com/laravel/framework/blob/main/src/Illuminate/Queue/QueueServiceProvider.php#L202-L207), [src/Illuminate/Cache/RedisStore.php:59-72](https://github.com/laravel/framework/blob/main/src/Illuminate/Cache/RedisStore.php#L59-L72), [src/Illuminate/Cache/CacheManager.php:352-374](https://github.com/laravel/framework/blob/main/src/Illuminate/Cache/CacheManager.php#L352-L374)

### CacheManager and RedisStore Bridge

The `CacheManager` class provides driver resolution methods like `createRedisDriver()`, which inspects configuration arrays to establish a `RedisStore` instance and set up separate lock connections if configured.

```php
protected function createRedisDriver(array $config)
{
    $redis = $this->app['redis'];

    $connection = $config['connection'] ?? 'default';

    $store = new RedisStore(
        $redis,
        $this->getPrefix($config),
        $connection,
        $this->getSerializableClasses($config),
    );

    return $this->repository(
        $store->setLockConnection($config['lock_connection'] ?? $connection),
        $config
    );
}
```

Sources: [src/Illuminate/Cache/CacheManager.php:352-374](https://github.com/laravel/framework/blob/main/src/Illuminate/Cache/CacheManager.php#L352-L374)

The `RedisStore` implementation coordinates read, write, and serialization behaviors across underlying `PhpRedisConnection`, `PredisConnection`, and cluster connection instances. Operations such as `get`, `put`, `add`, and `many` handle prefix appending and connection-aware serialization.

| Store Method | Underlying Redis Command / Lua Script | Behavior |
| :--- | :--- | :--- |
| `get($key)` | `GET` | Retrieves prefixed key and unserializes value using connection-aware rules. |
| `put($key, $value, $seconds)` | `SETEX` | Stores serialized value with expiration, enforcing a minimum of 1 second. |
| `add($key, $value, $seconds)` | `EVAL` (LuaScripts::add()) | Atomically stores item if the key does not exist. |
| `increment($key, $value)` | `INCRBY` | Increments numeric cache value by specified step. |
| `decrement($key, $value)` | `DECRBY` | Decrements numeric cache value by specified step. |
| `forever($key, $value)` | `SET` | Stores item indefinitely without expiration. |

Sources: [src/Illuminate/Cache/RedisStore.php:80-234](https://github.com/laravel/framework/blob/main/src/Illuminate/Cache/RedisStore.php#L80-L234)

> [!NOTE]
> `RedisStore` checks if a value is numeric and finite via `shouldBeStoredWithoutSerialization()`. Numeric values bypass PHP `serialize()` calls to optimize memory usage and performance in Redis strings.

Sources: [src/Illuminate/Cache/RedisStore.php:516-519](https://github.com/laravel/framework/blob/main/src/Illuminate/Cache/RedisStore.php#L516-L519)

### Queue Service Provider Connector Registration

The `QueueServiceProvider` registers all core queue connectors by iterating through an array of driver names inside `registerConnectors()`, wiring up the Redis connector via `registerRedisConnector()`.

```php
public function registerConnectors($manager)
{
    foreach (['Null', 'Sync', 'Deferred', 'Background', 'Failover', 'Database', 'Redis', 'Beanstalkd', 'Sqs'] as $connector) {
        $this->{"register{$connector}Connector"}($manager);
    }
}

protected function registerRedisConnector($manager)
{
    $manager->addConnector('redis', function () {
        return new RedisConnector($this->app['redis']);
    });
}
```

Sources: [src/Illuminate/Queue/QueueServiceProvider.php:108-113](https://github.com/laravel/framework/blob/main/src/Illuminate/Queue/QueueServiceProvider.php#L108-L113), [src/Illuminate/Queue/QueueServiceProvider.php:202-207](https://github.com/laravel/framework/blob/main/src/Illuminate/Queue/QueueServiceProvider.php#L202-L207)

## Testing Suite Redis Interactions

### Overview

The `InteractsWithRedis` trait manages test environment setup, conditional execution, and teardown routines for Redis connections. It inspects environment variables, instantiates `RedisManager` instances for both `predis` and `phpredis` drivers, and configures test prefixes to isolate test data.

Sources: [src/Illuminate/Foundation/Testing/Concerns/InteractsWithRedis.php:11-150](https://github.com/laravel/framework/blob/main/src/Illuminate/Foundation/Testing/Concerns/InteractsWithRedis.php#L11-L150)

### Setup and Configuration

The `setUpRedis()` method checks whether the `redis` extension is loaded, reads `REDIS_HOST` and `REDIS_PORT` defaults via `Env::get()`, and populates test configurations with a key prefix of `test_`. If `REDIS_CLUSTER_HOSTS_AND_PORTS` is present, it constructs a cluster configuration by mapping host and port pairs. Otherwise, it configures standard `default` (database 5, timeout 0.5) and `cache` (database 6, timeout 0.5) connections.

```php
public function setUpRedis()
{
    if (! extension_loaded('redis')) {
        $this->markTestSkipped('The redis extension is not installed. Please install the extension to enable '.__CLASS__);
    }

    if (static::$connectionFailedOnceWithDefaultsSkip) {
        $this->markTestSkipped('Trying default host/port failed, please set environment variable REDIS_HOST & REDIS_PORT to enable '.__CLASS__);
    }

    $app = $this->app ?? new Application;
    $host = Env::get('REDIS_HOST', '127.0.0.1');
    $port = Env::get('REDIS_PORT', 6379);

    foreach (static::redisDriverProvider() as $driver) {
        if (Env::get('REDIS_CLUSTER_HOSTS_AND_PORTS')) {
            $config = [
                'options' => [
                    'cluster' => 'redis',
                    'prefix' => 'test_',
                ],
                'clusters' => [
                    'default' => array_map(
                        static fn ($hostAndPort) => [
                            'host' => explode(':', $hostAndPort)[0],
                            'port' => explode(':', $hostAndPort)[1],
                        ],
                        explode(',', Env::get('REDIS_CLUSTER_HOSTS_AND_PORTS')),
                    ),
                ],
            ];
        } else {
            $config = [
                'options' => [
                    'prefix' => 'test_',
                ],
                'default' => [
                    'host' => $host,
                    'port' => $port,
                    'database' => 5,
                    'timeout' => 0.5,
                    'name' => 'default',
                ],
                'cache' => [
                    'host' => $host,
                    'port' => $port,
                    'database' => 6,
                    'timeout' => 0.5,
                ],
            ];
        }
        $this->redis[$driver[0]] = new RedisManager($app, $driver[0], $config);
    }

    $defaultDriver = Env::get('REDIS_CLIENT', 'phpredis');

    try {
        $this->redis[$defaultDriver]->connection()->flushdb();
    } catch (Exception) {
        if ($host === '127.0.0.1' && $port === 6379 && Env::get('REDIS_HOST') === null) {
            static::$connectionFailedOnceWithDefaultsSkip = true;

            $this->markTestSkipped('Trying default host/port failed, please set environment variable REDIS_HOST & REDIS_PORT to enable '.__CLASS__);
        }
    }

    $app->instance('redis', $this->redis[$defaultDriver]);
}
```

Sources: [src/Illuminate/Foundation/Testing/Concerns/InteractsWithRedis.php:32-99](https://github.com/laravel/framework/blob/main/src/Illuminate/Foundation/Testing/Concerns/InteractsWithRedis.php#L32-L99)

> [!WARNING]
> If a connection attempt fails using default fallback parameters (`127.0.0.1:6379` with no explicit `REDIS_HOST` environment variable set), `InteractsWithRedis` flags the failure via `static::$connectionFailedOnceWithDefaultsSkip` and skips subsequent tests to prevent cascading timeouts.

Sources: [src/Illuminate/Foundation/Testing/Concerns/InteractsWithRedis.php:38-40](https://github.com/laravel/framework/blob/main/src/Illuminate/Foundation/Testing/Concerns/InteractsWithRedis.php#L38-L40), [src/Illuminate/Foundation/Testing/Concerns/InteractsWithRedis.php:91-95](https://github.com/laravel/framework/blob/main/src/Illuminate/Foundation/Testing/Concerns/InteractsWithRedis.php#L91-L95)

### Conditional Execution and Teardown

The trait provides `ifRedisAvailable()` to wrap individual test callbacks with automatic setup and teardown handling, while `tearDownRedis()` flushes the `phpredis` database and disconnects all initialized drivers.

```php
public function tearDownRedis()
{
    if (static::$connectionFailedOnceWithDefaultsSkip === true) {
        return;
    }

    if (isset($this->redis['phpredis'])) {
        $this->redis['phpredis']->connection()->flushdb();
    }

    foreach (static::redisDriverProvider() as $driver) {
        if (isset($this->redis[$driver[0]])) {
            $this->redis[$driver[0]]->connection()->disconnect();
        }
    }
}

public static function redisDriverProvider()
{
    return [
        ['predis'],
        ['phpredis'],
    ];
}

public function ifRedisAvailable($callback)
{
    $this->setUpRedis();

    $callback();

    $this->tearDownRedis();
}
```

Sources: [src/Illuminate/Foundation/Testing/Concerns/InteractsWithRedis.php:106-150](https://github.com/laravel/framework/blob/main/src/Illuminate/Foundation/Testing/Concerns/InteractsWithRedis.php#L106-L150)

## Related

- [[Cache Storage Backends]]

