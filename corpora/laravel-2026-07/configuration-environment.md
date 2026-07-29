# Configuration & Environment

<details>
<summary>Relevant source files</summary>

The following files were used as context for generating this wiki page:

- [src/Illuminate/Foundation/Bootstrap/LoadConfiguration.php](https://github.com/laravel/framework/blob/main/src/Illuminate/Foundation/Bootstrap/LoadConfiguration.php)
- [src/Illuminate/Foundation/Application.php](https://github.com/laravel/framework/blob/main/src/Illuminate/Foundation/Application.php)
- [src/Illuminate/Cache/Repository.php](https://github.com/laravel/framework/blob/main/src/Illuminate/Cache/Repository.php)
- [src/Illuminate/Config/Repository.php](https://github.com/laravel/framework/blob/main/src/Illuminate/Config/Repository.php)
- [src/Illuminate/Container/Container.php](https://github.com/laravel/framework/blob/main/src/Illuminate/Container/Container.php)
- [src/Illuminate/Foundation/Console/AboutCommand.php](https://github.com/laravel/framework/blob/main/src/Illuminate/Foundation/Console/AboutCommand.php)
- [src/Illuminate/Support/Env.php](https://github.com/laravel/framework/blob/main/src/Illuminate/Support/Env.php)
- [src/Illuminate/Cache/CacheManager.php](https://github.com/laravel/framework/blob/main/src/Illuminate/Cache/CacheManager.php)
- [src/Illuminate/Foundation/helpers.php](https://github.com/laravel/framework/blob/main/src/Illuminate/Foundation/helpers.php)
</details>

## Overview

The configuration and environment management system in Laravel provides a unified, robust framework for handling runtime configuration values, environment variable resolution, and application bootstrapping. By loading, merging, and caching nested configuration files into centralized repositories, the system ensures high performance and consistent access across the application lifecycle. It integrates deeply with the service container to bind configuration and cache repositories, supports multiple storage drivers, and exposes comprehensive status inspection capabilities through command-line utilities.

Sources: [src/Illuminate/Foundation/Bootstrap/LoadConfiguration.php:28-68](https://github.com/laravel/framework/blob/main/src/Illuminate/Foundation/Bootstrap/LoadConfiguration.php#L28-L68), [src/Illuminate/Config/Repository.php:24-31](https://github.com/laravel/framework/blob/main/src/Illuminate/Config/Repository.php#L24-L31), [src/Illuminate/Support/Env.php:76-93](https://github.com/laravel/framework/blob/main/src/Illuminate/Support/Env.php#L76-L93)

## Environment Variable Resolution and Isolation

### Overview

The environment variable resolution subsystem handles environment access, adapter configuration, string casting, and runtime environment detection. Powered by `Illuminate\Support\Env` and `Illuminate\Foundation\Application`, it establishes repository layers over environment variables, parses special string representations into native types, and detects the application state during bootstrapping.

Sources: [src/Illuminate/Support/Env.php:12-93](https://github.com/laravel/framework/blob/main/src/Illuminate/Support/Env.php#L12-L93), [src/Illuminate/Foundation/Application.php:751-800](https://github.com/laravel/framework/blob/main/src/Illuminate/Foundation/Application.php#L751-L800)

### Environment Variable Resolution via Env Helper

The `Env` helper class manages an immutable repository instance built via `RepositoryBuilder`. By default, it integrates standard environment adapters alongside `PutenvAdapter` when enabled. Custom adapters can be registered dynamically via extension callbacks, which reset the active repository instance.

```php
// Enabling or extending environment adapters
Env::enablePutenv();
Env::disablePutenv();
Env::extend(fn () => new CustomAdapter, 'custom');
```

Sources: [src/Illuminate/Support/Env.php:36-93](https://github.com/laravel/framework/blob/main/src/Illuminate/Support/Env.php#L36-L93)

When reading variables through `Env::get()`, the value passes through an option-mapping pipeline that casts string representations to native PHP types.

```
Env::get() → Env::getOption() → Option::fromValue() → Type Casting / Regex Unquoting → Resolved Native Value
```

Sources: [src/Illuminate/Support/Env.php:102-105](https://github.com/laravel/framework/blob/main/src/Illuminate/Support/Env.php#L102-L105), [src/Illuminate/Support/Env.php:252-277](https://github.com/laravel/framework/blob/main/src/Illuminate/Support/Env.php#L252-L277)

> [!NOTE]
> The `Env::getOption()` parser converts specific string tokens into booleans, empty strings, or `null` values automatically.

Sources: [src/Illuminate/Support/Env.php:252-277](https://github.com/laravel/framework/blob/main/src/Illuminate/Support/Env.php#L252-L277)

| String Token | Casted Value | Meaning |
| :--- | :--- | :--- |
| `'true'`, `'(true)'` | `true` | Boolean true |
| `'false'`, `'(false)'` | `false` | Boolean false |
| `'empty'`, `'(empty)'` | `''` | Empty string |
| `'null'`, `'(null)'` | `null` | Null value |

Sources: [src/Illuminate/Support/Env.php:256-269](https://github.com/laravel/framework/blob/main/src/Illuminate/Support/Env.php#L256-L269)

### Environment Detection and Application State

The `Application` class interfaces directly with environment variables to determine the active environment state, console execution mode, and unit test execution. Environment detection uses an external `EnvironmentDetector` callback supplied with command-line arguments when running in the console.

```php
// Detecting the environment via Application instance
$app->detectEnvironment(function () {
    return Env::get('APP_ENV', 'production');
});
```

Sources: [src/Illuminate/Foundation/Application.php:788-800](https://github.com/laravel/framework/blob/main/src/Illuminate/Foundation/Application.php#L788-L800)

> [!WARNING]
> Calling `runningInConsole()` checks `APP_RUNNING_IN_CONSOLE` via `Env::get()` before falling back to PHP SAPI constants `cli` or `phpdbg`.

Sources: [src/Illuminate/Foundation/Application.php:807-814](https://github.com/laravel/framework/blob/main/src/Illuminate/Foundation/Application.php#L807-L814)

## Bootstrap and Lifecycle Configuration Loading

### Overview

Configuration loading during application bootstrapping is managed primarily by `Illuminate\Foundation\Bootstrap\LoadConfiguration`. This bootstrapper loads nested configuration files, merges framework defaults with user-defined options, and handles configuration caching to optimize runtime performance.

Sources: [src/Illuminate/Foundation/Bootstrap/LoadConfiguration.php:13-68](https://github.com/laravel/framework/blob/main/src/Illuminate/Foundation/Bootstrap/LoadConfiguration.php#L13-L68)

### Configuration Loading Call Chain

When the application runs its bootstrap sequence, `LoadConfiguration::bootstrap()` executes to populate the configuration repository into the container. The call flow resolves cached files or traverses directory structures to merge settings.

```
LoadConfiguration::bootstrap() → [Cache Check / alwaysUseConfig] → getConfigurationFiles() → getNestedDirectory() → loadConfigurationFile() → Repository::set()
```

Sources: [src/Illuminate/Foundation/Bootstrap/LoadConfiguration.php:28-68](https://github.com/laravel/framework/blob/main/src/Illuminate/Foundation/Bootstrap/LoadConfiguration.php#L28-L68), [src/Illuminate/Foundation/Bootstrap/LoadConfiguration.php:113-197](https://github.com/laravel/framework/blob/main/src/Illuminate/Foundation/Bootstrap/LoadConfiguration.php#L113-L197)

> [!NOTE]
> If a static configuration closure has been registered via `LoadConfiguration::alwaysUse()`, or if a compiled configuration cache file exists at `$app->getCachedConfigPath()`, file traversal is bypassed entirely and items are loaded directly from the cache.

Sources: [src/Illuminate/Foundation/Bootstrap/LoadConfiguration.php:37-45](https://github.com/laravel/framework/blob/main/src/Illuminate/Foundation/Bootstrap/LoadConfiguration.php#L37-L45)

### Nested File Discovery and Merging Rules

When loading configuration files dynamically from disk, `LoadConfiguration` uses Symfony Finder to locate all `.php` files in the configuration directory, computing nested dot-notation keys using `getNestedDirectory()`.

```php
protected function getNestedDirectory(SplFileInfo $file, $configPath)
{
    $directory = $file->getPath();

    if ($nested = trim(str_replace($configPath, '', $directory), DIRECTORY_SEPARATOR)) {
        $nested = str_replace(DIRECTORY_SEPARATOR, '.', $nested).'.';
    }

    return $nested;
}
```

Sources: [src/Illuminate/Foundation/Bootstrap/LoadConfiguration.php:182-197](https://github.com/laravel/framework/blob/main/src/Illuminate/Foundation/Bootstrap/LoadConfiguration.php#L182-L197)

Certain configuration files require recursive merging of nested option arrays (such as connection lists or driver arrays) rather than top-level overwriting.

| Configuration File | Mergeable Sub-Keys |
| :--- | :--- |
| `auth` | `guards`, `providers`, `passwords` |
| `broadcasting` | `connections` |
| `cache` | `stores` |
| `database` | `connections` |
| `filesystems` | `disks` |
| `logging` | `channels` |
| `mail` | `mailers` |
| `queue` | `connections` |

Sources: [src/Illuminate/Foundation/Bootstrap/LoadConfiguration.php:140-152](https://github.com/laravel/framework/blob/main/src/Illuminate/Foundation/Bootstrap/LoadConfiguration.php#L140-L152)

> [!WARNING]
> Framework configuration merging can be explicitly disabled on the application instance by calling `$app->dontMergeFrameworkConfiguration()`, which causes `shouldMergeFrameworkConfiguration()` to return `false`.

Sources: [src/Illuminate/Foundation/Application.php:1257-1272](https://github.com/laravel/framework/blob/main/src/Illuminate/Foundation/Application.php#L1257-L1272), [src/Illuminate/Foundation/Bootstrap/LoadConfiguration.php:83-89](https://github.com/laravel/framework/blob/main/src/Illuminate/Foundation/Bootstrap/LoadConfiguration.php#L83-L89)

## Configuration Repository and Access Mechanics

### Overview

The `Illuminate\Config\Repository` class manages configuration items in memory, supporting array access, dot-notation retrieval, typed casting, and mutations. It implements both `ArrayAccess` and `Illuminate\Contracts\Config\Repository`, and utilizes the `Macroable` trait.

Sources: [src/Illuminate/Config/Repository.php:5-14](https://github.com/laravel/framework/blob/main/src/Illuminate/Config/Repository.php#L5-L14)

### Retrieval and Mutation Mechanics

Configuration retrieval is routed through the repository's access methods, which delegate to `Illuminate\Support\Arr` to traverse the `$items` array using dot notation. The call chain for retrieving single configuration values flows as:

`Repository::get()` → `Arr::get()`

When retrieving multiple keys via `getMany()`, numeric indices map keys with null defaults whereas associative keys map explicitly defined default values:

`Repository::getMany()` → `Arr::get()`

Sources: [src/Illuminate/Config/Repository.php:51-78](https://github.com/laravel/framework/blob/main/src/Illuminate/Config/Repository.php#L51-L78)

Typed getters enforce strict primitive return types by verifying values through type guards before returning them or throwing an exception.

| Method | Enforced Type | Exception Type | Sources |
| :--- | :--- | :--- | :--- |
| `string($key, $default)` | `string` | `InvalidArgumentException` | [src/Illuminate/Config/Repository.php:90-101](https://github.com/laravel/framework/blob/main/src/Illuminate/Config/Repository.php#L90-L101) |
| `integer($key, $default)` | `int` | `InvalidArgumentException` | [src/Illuminate/Config/Repository.php:112-123](https://github.com/laravel/framework/blob/main/src/Illuminate/Config/Repository.php#L112-L123) |
| `float($key, $default)` | `float` | `InvalidArgumentException` | [src/Illuminate/Config/Repository.php:134-145](https://github.com/laravel/framework/blob/main/src/Illuminate/Config/Repository.php#L134-L145) |
| `boolean($key, $default)` | `bool` | `InvalidArgumentException` | [src/Illuminate/Config/Repository.php:156-167](https://github.com/laravel/framework/blob/main/src/Illuminate/Config/Repository.php#L156-L167) |
| `array($key, $default)` | `array` | `InvalidArgumentException` | [src/Illuminate/Config/Repository.php:178-189](https://github.com/laravel/framework/blob/main/src/Illuminate/Config/Repository.php#L178-L189) |

> [!CAUTION]
| Typed getters such as `integer()` and `boolean()` will throw an `InvalidArgumentException` if the resolved configuration value does not strictly match the expected type, rather than attempting silent coercion.

Sources: [src/Illuminate/Config/Repository.php:116-120](https://github.com/laravel/framework/blob/main/src/Illuminate/Config/Repository.php#L116-L120), [src/Illuminate/Config/Repository.php:160-164](https://github.com/laravel/framework/blob/main/src/Illuminate/Config/Repository.php#L160-L164)

### Array Mutation and ArrayAccess Implementation

Mutations can assign individual values or multiple dot-notation keys via `set()`, while array-specific values can be prepended or appended using `prepend()` and `push()`.

```php
$config = new Repository([
    'database' => [
        'connections' => ['mysql']
    ]
]);

$config->push('database.connections', 'sqlite');
$config->prepend('database.connections', 'pgsql');
$timeout = $config->integer('database.timeout', 30);
```

Sources: [src/Illuminate/Config/Repository.php:210-249](https://github.com/laravel/framework/blob/main/src/Illuminate/Config/Repository.php#L210-L249)

The repository implements `ArrayAccess` mapping array syntax directly to repository methods: `offsetExists()` calls `has()`, `offsetGet()` calls `get()`, `offsetSet()` calls `set()`, and `offsetUnset()` sets the offset value to `null`.

Sources: [src/Illuminate/Config/Repository.php:267-304](https://github.com/laravel/framework/blob/main/src/Illuminate/Config/Repository.php#L267-L304)

## Container Integration and Service Binding

### Container Integration and Service Binding

### Overview

The Laravel application container (`Illuminate\Foundation\Application`), which extends `Illuminate\Container\Container`, manages dependency resolution, service bindings, deferred provider loading, and application path bindings. During instantiation, the container registers foundational service providers, core container aliases, and maps absolute paths into the container.

Sources: [src/Illuminate/Foundation/Application.php:39-40](https://github.com/laravel/framework/blob/main/src/Illuminate/Foundation/Application.php#L39-L40), [src/Illuminate/Foundation/Application.php:223-233](https://github.com/laravel/framework/blob/main/src/Illuminate/Foundation/Application.php#L223-L233)

### Core Container Aliases

The container establishes core type mappings and interface aliases through `registerCoreContainerAliases()`, binding string keys to concrete implementations and contract interfaces.

| Container Key | Aliased Classes and Interfaces | Sources |
| :--- | :--- | :--- |
| `app` | `Illuminate\Foundation\Application`, `Illuminate\Contracts\Container\Container`, `Illuminate\Contracts\Foundation\Application`, `Psr\Container\ContainerInterface` | [src/Illuminate/Foundation/Application.php:1645-1646](https://github.com/laravel/framework/blob/main/src/Illuminate/Foundation/Application.php#L1645-L1646) |
| `auth` | `Illuminate\Auth\AuthManager`, `Illuminate\Contracts\Auth\Factory` | [src/Illuminate/Foundation/Application.php:1647](https://github.com/laravel/framework/blob/main/src/Illuminate/Foundation/Application.php#L1647) |
| `config` | `Illuminate\Config\Repository`, `Illuminate\Contracts\Config\Repository` | [src/Illuminate/Foundation/Application.php:1655](https://github.com/laravel/framework/blob/main/src/Illuminate/Foundation/Application.php#L1655) |
| `db` | `Illuminate\Database\DatabaseManager`, `Illuminate\Database\ConnectionResolverInterface` | [src/Illuminate/Foundation/Application.php:1657](https://github.com/laravel/framework/blob/main/src/Illuminate/Foundation/Application.php#L1657) |
| `events` | `Illuminate\Events\Dispatcher`, `Illuminate\Contracts\Events\Dispatcher` | [src/Illuminate/Foundation/Application.php:1661](https://github.com/laravel/framework/blob/main/src/Illuminate/Foundation/Application.php#L1661) |
| `files` | `Illuminate\Filesystem\Filesystem` | [src/Illuminate/Foundation/Application.php:1662](https://github.com/laravel/framework/blob/main/src/Illuminate/Foundation/Application.php#L1662) |
| `log` | `Illuminate\Log\LogManager`, `Psr\Log\LoggerInterface` | [src/Illuminate/Foundation/Application.php:1669](https://github.com/laravel/framework/blob/main/src/Illuminate/Foundation/Application.php#L1669) |
| `router` | `Illuminate\Routing\Router`, `Illuminate\Contracts\Routing\Registrar`, `Illuminate\Contracts\Routing\BindingRegistrar` | [src/Illuminate/Foundation/Application.php:1679](https://github.com/laravel/framework/blob/main/src/Illuminate/Foundation/Application.php#L1679) |

Sources: [src/Illuminate/Foundation/Application.php:1643-1691](https://github.com/laravel/framework/blob/main/src/Illuminate/Foundation/Application.php#L1643-L1691)

### Resolution and Dependency Injection Call Chain

When resolving dependencies, the container executes a structured resolution sequence. The call chain for resolving an abstract type flows as:

`Application::make()` → `Application::loadDeferredProviderIfNeeded()` → `Container::resolve()` → `Container::build()` → `Container::resolveDependencies()`

During dependency resolution, parameters are inspected and recursively instantiated.

> [!NOTE]
> If a class constructor parameter has a default value and no explicit container binding exists for that class, the container returns the default parameter value instead of triggering resolution.

Sources: [src/Illuminate/Foundation/Application.php:1061-1066](https://github.com/laravel/framework/blob/main/src/Illuminate/Foundation/Application.php#L1061-L1066), [src/Illuminate/Container/Container.php:905-968](https://github.com/laravel/framework/blob/main/src/Illuminate/Container/Container.php#L905-L968), [src/Illuminate/Container/Container.php:1342-1373](https://github.com/laravel/framework/blob/main/src/Illuminate/Container/Container.php#L1342-L1373)

### Container Design Trade-Offs

| Design Choice | Benefit | Cost | Sources |
| :--- | :--- | :--- | :--- |
| **Reflection-based building** | Automatic resolution without explicit wiring of simple classes | Higher CPU overhead during initial class instantiation | [src/Illuminate/Container/Container.php:1143-1194](https://github.com/laravel/framework/blob/main/src/Illuminate/Container/Container.php#L1143-L1194) |
| **Deferred service loading** | Reduces boot time by delaying provider registration until needed | Extra alias and existence checks during the initial `make` call | [src/Illuminate/Foundation/Application.php:1009-1023](https://github.com/laravel/framework/blob/main/src/Illuminate/Foundation/Application.php#L1009-L1023) |
| **Contextual binding maps** | Allows injecting different implementations per consumer class | Increased memory overhead and lookup complexity per resolution | [src/Illuminate/Container/Container.php:475-478](https://github.com/laravel/framework/blob/main/src/Illuminate/Container/Container.php#L475-L478), [src/Illuminate/Container/Container.php:1100-1103](https://github.com/laravel/framework/blob/main/src/Illuminate/Container/Container.php#L1100-L1103) |

Sources: [src/Illuminate/Container/Container.php:475-478](https://github.com/laravel/framework/blob/main/src/Illuminate/Container/Container.php#L475-L478), [src/Illuminate/Container/Container.php:1100-1103](https://github.com/laravel/framework/blob/main/src/Illuminate/Container/Container.php#L1100-L1103), [src/Illuminate/Container/Container.php:1143-1194](https://github.com/laravel/framework/blob/main/src/Illuminate/Container/Container.php#L1143-L1194), [src/Illuminate/Foundation/Application.php:1009-1023](https://github.com/laravel/framework/blob/main/src/Illuminate/Foundation/Application.php#L1009-L1023)

## Cache Store Interactions for Configuration

### Overview

The caching subsystem provides repository wrappers around underlying storage backends via `CacheManager` and `Repository`. Configuration states are managed by dynamically resolving stores through configuration definitions and memoized driver instances.

Sources: [src/Illuminate/Cache/CacheManager.php:24-106](https://github.com/laravel/framework/blob/main/src/Illuminate/Cache/CacheManager.php#L24-L106), [src/Illuminate/Cache/Repository.php:44-99](https://github.com/laravel/framework/blob/main/src/Illuminate/Cache/Repository.php#L44-L99)

### Cache Driver Resolution Call Chain

When interacting with configured cache stores, the manager resolves the driver instance before wrapping it in a repository. The execution flow for store resolution follows:

`CacheManager::store()` → `CacheManager::resolve()` → `CacheManager::getConfig()` → `CacheManager::build()` → `CacheManager::repository()`

During `build()`, the manager checks for custom creators or invokes driver-specific creator methods.

Sources: [src/Illuminate/Cache/CacheManager.php:65-70](https://github.com/laravel/framework/blob/main/src/Illuminate/Cache/CacheManager.php#L65-L70), [src/Illuminate/Cache/CacheManager.php:116-127](https://github.com/laravel/framework/blob/main/src/Illuminate/Cache/CacheManager.php#L116-L127), [src/Illuminate/Cache/CacheManager.php:137-152](https://github.com/laravel/framework/blob/main/src/Illuminate/Cache/CacheManager.php#L137-L152), [src/Illuminate/Cache/CacheManager.php:418-425](https://github.com/laravel/framework/blob/main/src/Illuminate/Cache/CacheManager.php#L418-L425), [src/Illuminate/Cache/CacheManager.php:482-487](https://github.com/laravel/framework/blob/main/src/Illuminate/Cache/CacheManager.php#L482-L487)

> [!NOTE]
> If a store configuration is missing during `resolve()`, an `InvalidArgumentException` is thrown before any repository instance can be constructed.

Sources: [src/Illuminate/Cache/CacheManager.php:116-123](https://github.com/laravel/framework/blob/main/src/Illuminate/Cache/CacheManager.php#L116-L123)

### Supported Cache Drivers

The `CacheManager` class implements native creation methods for several cache backends.

| Driver Method | Underlying Store Class | Description |
| :--- | :--- | :--- |
| `createApcDriver` | `ApcStore` | APC/APCu shared memory cache driver |
| `createArrayDriver` | `ArrayStore` | In-memory runtime array cache driver |
| `createDatabaseDriver` | `DatabaseStore` | Database-backed cache storage driver |
| `createDynamodbDriver` | `DynamoDbStore` | AWS DynamoDB-backed cache storage driver |
| `createFailoverDriver` | `FailoverStore` | Fallback wrapper across multiple cache stores |
| `createFileDriver` | `FileStore` | Filesystem-backed cache storage driver |
| `createStorageDriver` | `StorageStore` | Flysystem-backed storage cache driver |
| `createMemcachedDriver` | `MemcachedStore` | Memcached distributed memory cache driver |
| `createNullDriver` | `NullStore` | Null driver that discards all cache writes |
| `createRedisDriver` | `RedisStore` | Redis-backed cache storage driver |
| `createSessionDriver` | `SessionStore` | HTTP session-backed cache storage driver |

Sources: [src/Illuminate/Cache/CacheManager.php:171-391](https://github.com/laravel/framework/blob/main/src/Illuminate/Cache/CacheManager.php#L171-L391), [src/Illuminate/Cache/CacheManager.php:346-349](https://github.com/laravel/framework/blob/main/src/Illuminate/Cache/CacheManager.php#L346-L349)

## Environment Inspection and Status Reporting

### Environment Inspection and Status Reporting

### Overview

Runtime configuration and environment information are gathered, formatted, and rendered via the `AboutCommand` console class. The command aggregates application metadata, cache status, driver configurations, and storage symlink states, allowing developers to inspect system health and runtime states directly from the CLI or in structured JSON.

Sources: [src/Illuminate/Foundation/Console/AboutCommand.php:13-22](https://github.com/laravel/framework/blob/main/src/Illuminate/Foundation/Console/AboutCommand.php#L13-L22), [src/Illuminate/Foundation/Console/AboutCommand.php:161-264](https://github.com/laravel/framework/blob/main/src/Illuminate/Foundation/Console/AboutCommand.php#L161-L264)

### Execution Call Chain

When the `about` command is invoked, it processes data collection and rendering through a defined sequence of methods:

`AboutCommand::handle()` → `AboutCommand::gatherApplicationInformation()` → `AboutCommand::display()` → `AboutCommand::displayDetail()` (or `AboutCommand::displayJson()`)

During `gatherApplicationInformation()`, entries are registered under sections via `addToSection()`. The main `handle()` method then maps over `static::$data`, resolves string class references or callables via the service container, flattens the items, sorts sections, applies filtering via the `--only` option, and passes the result to the display handler.

Sources: [src/Illuminate/Foundation/Console/AboutCommand.php:69-99](https://github.com/laravel/framework/blob/main/src/Illuminate/Foundation/Console/AboutCommand.php#L69-L99), [src/Illuminate/Foundation/Console/AboutCommand.php:111-154](https://github.com/laravel/framework/blob/main/src/Illuminate/Foundation/Console/AboutCommand.php#L111-L154), [src/Illuminate/Foundation/Console/AboutCommand.php:161-264](https://github.com/laravel/framework/blob/main/src/Illuminate/Foundation/Console/AboutCommand.php#L161-L264), [src/Illuminate/Foundation/Console/AboutCommand.php:315-326](https://github.com/laravel/framework/blob/main/src/Illuminate/Foundation/Console/AboutCommand.php#L315-L326)

> [!NOTE]
> Section ordering in CLI output is explicitly sorted: `Environment`, `Cache`, and `Drivers` are prioritized in that exact order via `array_search`, while unlisted sections receive an index of `99`.

Sources: [src/Illuminate/Foundation/Console/AboutCommand.php:90-94](https://github.com/laravel/framework/blob/main/src/Illuminate/Foundation/Console/AboutCommand.php#L90-L94)

### Command Options and Sections

The `AboutCommand` defines specific input options and categorizes runtime metrics into standard sections.

| Option / Method | Type | Description |
| :--- | :--- | :--- |
| `--only` | CLI Option | Filters output to display only specified sections |
| `--json` | CLI Option | Formats and outputs gathered information as JSON |
| `Environment` section | Section Data | Name, Laravel version, PHP version, Composer version, Environment, Debug mode, URL, Maintenance mode, Timezone, Locale |
| `Cache` section | Section Data | Config cache, Events cache, Routes cache, Views cache status |
| `Drivers` section | Section Data | Broadcasting, Cache, Database, Logs, Mail, Octane, Queue, Scout, Session drivers |
| `Storage` section | Section Data | Status of symbolic links defined in filesystems configuration |

Sources: [src/Illuminate/Foundation/Console/AboutCommand.php:21-22](https://github.com/laravel/framework/blob/main/src/Illuminate/Foundation/Console/AboutCommand.php#L21-L22), [src/Illuminate/Foundation/Console/AboutCommand.php:169-261](https://github.com/laravel/framework/blob/main/src/Illuminate/Foundation/Console/AboutCommand.php#L169-L261)

### Command Design Trade-Offs

| Design choice | Benefit | Cost |
| :--- | :--- | :--- |
| Static `$data` and `$customDataResolvers` arrays | Allows plugins and packages to register custom environment checks via `AboutCommand::add()` globally | Relies on mutable static state that requires explicit flushing during tests via `flushState()` |
| Dual closures for CLI and JSON formatting | Enables rich ANSI terminal styling for console output while preserving clean raw primitives for JSON payloads | Increases closure complexity when formatting composite drivers like failovers or stacks |

Sources: [src/Illuminate/Foundation/Console/AboutCommand.php:41-51](https://github.com/laravel/framework/blob/main/src/Illuminate/Foundation/Console/AboutCommand.php#L41-L51), [src/Illuminate/Foundation/Console/AboutCommand.php:302-305](https://github.com/laravel/framework/blob/main/src/Illuminate/Foundation/Console/AboutCommand.php#L302-L305), [src/Illuminate/Foundation/Console/AboutCommand.php:349-360](https://github.com/laravel/framework/blob/main/src/Illuminate/Foundation/Console/AboutCommand.php#L349-L360), [src/Illuminate/Foundation/Console/AboutCommand.php:378-383](https://github.com/laravel/framework/blob/main/src/Illuminate/Foundation/Console/AboutCommand.php#L378-L383)

## Related

- [[Application Lifecycle]]

