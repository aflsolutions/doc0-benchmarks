# Command Generators & Stubs

<details>
<summary>Relevant source files</summary>

The following files were used as context for generating this wiki page:

- [src/Illuminate/Console/GeneratorCommand.php](https://github.com/laravel/framework/blob/main/src/Illuminate/Console/GeneratorCommand.php)
- [src/Illuminate/Foundation/Console/StubPublishCommand.php](https://github.com/laravel/framework/blob/main/src/Illuminate/Foundation/Console/StubPublishCommand.php)
- [src/Illuminate/Foundation/Console/ModelMakeCommand.php](https://github.com/laravel/framework/blob/main/src/Illuminate/Foundation/Console/ModelMakeCommand.php)
- [src/Illuminate/Routing/Console/ControllerMakeCommand.php](https://github.com/laravel/framework/blob/main/src/Illuminate/Routing/Console/ControllerMakeCommand.php)
- [src/Illuminate/Foundation/Providers/ArtisanServiceProvider.php](https://github.com/laravel/framework/blob/main/src/Illuminate/Foundation/Providers/ArtisanServiceProvider.php)
- [src/Illuminate/Database/Migrations/MigrationCreator.php](https://github.com/laravel/framework/blob/main/src/Illuminate/Database/Migrations/MigrationCreator.php)
- [src/Illuminate/Database/Console/Factories/FactoryMakeCommand.php](https://github.com/laravel/framework/blob/main/src/Illuminate/Database/Console/Factories/FactoryMakeCommand.php)
- [src/Illuminate/Console/MigrationGeneratorCommand.php](https://github.com/laravel/framework/blob/main/src/Illuminate/Console/MigrationGeneratorCommand.php)
- [src/Illuminate/Foundation/Console/ConsoleMakeCommand.php](https://github.com/laravel/framework/blob/main/src/Illuminate/Foundation/Console/ConsoleMakeCommand.php)
- [src/Illuminate/Foundation/Console/VendorPublishCommand.php](https://github.com/laravel/framework/blob/main/src/Illuminate/Foundation/Console/VendorPublishCommand.php)
- [src/Illuminate/Foundation/Console/ObserverMakeCommand.php](https://github.com/laravel/framework/blob/main/src/Illuminate/Foundation/Console/ObserverMakeCommand.php)
- [src/Illuminate/Foundation/Console/TestMakeCommand.php](https://github.com/laravel/framework/blob/main/src/Illuminate/Foundation/Console/TestMakeCommand.php)
- [src/Illuminate/Foundation/Console/ResourceMakeCommand.php](https://github.com/laravel/framework/blob/main/src/Illuminate/Foundation/Console/ResourceMakeCommand.php)
- [src/Illuminate/Database/Console/Seeds/SeederMakeCommand.php](https://github.com/laravel/framework/blob/main/src/Illuminate/Database/Console/Seeds/SeederMakeCommand.php)
- [src/Illuminate/Foundation/Console/ClassMakeCommand.php](https://github.com/laravel/framework/blob/main/src/Illuminate/Foundation/Console/ClassMakeCommand.php)
- [src/Illuminate/Foundation/Events/PublishingStubs.php](https://github.com/laravel/framework/blob/main/src/Illuminate/Foundation/Events/PublishingStubs.php)
</details>

## Overview

Laravel's command generators and stubs subsystem provides a robust, extensible foundation for scaffolding application source code, configuration files, database migrations, and test suites via Artisan console commands. At its core, the architecture relies on the abstract `GeneratorCommand` class to handle input validation, namespace qualification, collision detection, directory creation, and stub-based file rendering. The framework integrates these generators into the application container through `ArtisanServiceProvider`, automatically registering standard and development commands as singletons. Developers can customize the underlying templates by publishing framework stubs via `StubPublishCommand`, which fires `PublishingStubs` events to allow programmatic interception. Furthermore, advanced composite generators such as `ModelMakeCommand` and `ControllerMakeCommand` orchestrate the recursive creation of dependent components—including migrations, factories, seeders, policies, and form requests—streamlining the rapid development of robust enterprise applications.

Sources: [src/Illuminate/Console/GeneratorCommand.php:17-536](https://github.com/laravel/framework/blob/main/src/Illuminate/Console/GeneratorCommand.php#L17-L536), [src/Illuminate/Foundation/Console/StubPublishCommand.php:10-110](https://github.com/laravel/framework/blob/main/src/Illuminate/Foundation/Console/StubPublishCommand.php#L10-L110), [src/Illuminate/Foundation/Console/ModelMakeCommand.php:18-331](https://github.com/laravel/framework/blob/main/src/Illuminate/Foundation/Console/ModelMakeCommand.php#L18-L331), [src/Illuminate/Routing/Console/ControllerMakeCommand.php:17-340](https://github.com/laravel/framework/blob/main/src/Illuminate/Routing/Console/ControllerMakeCommand.php#L17-L340), [src/Illuminate/Foundation/Providers/ArtisanServiceProvider.php:120-964](https://github.com/laravel/framework/blob/main/src/Illuminate/Foundation/Providers/ArtisanServiceProvider.php#L120-L964), [src/Illuminate/Foundation/Events/PublishingStubs.php:5-39](https://github.com/laravel/framework/blob/main/src/Illuminate/Foundation/Events/PublishingStubs.php#L5-L39)

## Artisan Command Registration Architecture

### Overview

The registration architecture of Laravel's console subsystem is governed by `ArtisanServiceProvider`, which implements `DeferrableProvider` to defer loading until console commands are actually requested or invoked. The provider defines two primary arrays containing fully qualified class names: core commands mapped in `$commands` and development scaffolding commands mapped in `$devCommands`. During container resolution, the provider processes these mappings to bind each command into the service container and register them with the console application instance.

Sources: [src/Illuminate/Foundation/Providers/ArtisanServiceProvider.php:120-246](https://github.com/laravel/framework/blob/main/src/Illuminate/Foundation/Providers/ArtisanServiceProvider.php#L120-L246)

### Registration Call-Chain

When the container loads `ArtisanServiceProvider`, the initialization lifecycle executes a precise sequence of calls to inspect, configure, and bind each command class into the application. 

The execution walkthrough follows this call chain:
`register()` → `registerCommands()` → `method_exists()` branch:
- If a dedicated custom registration method exists (e.g., `registerCastMakeCommand()`), it invokes that method to bind the command singleton with explicit constructor dependencies resolved from the container (such as `$app['files']`).
- If no custom method exists, it falls back to a standard container singleton binding via `$this->app->singleton($command)`.
Finally, `registerCommands()` calls `$this->commands(array_values($commands))` to register all resolved command instances with the underlying Artisan console application.

Sources: [src/Illuminate/Foundation/Providers/ArtisanServiceProvider.php:253-295](https://github.com/laravel/framework/blob/main/src/Illuminate/Foundation/Providers/ArtisanServiceProvider.php#L253-L295)

> [!NOTE]
> `ArtisanServiceProvider` implements `DeferrableProvider`. Its `provides()` method returns the merged array of all values from both `$commands` and `$devCommands`, ensuring the container only boots the provider when console services are required.
> 
> Sources: [src/Illuminate/Foundation/Providers/ArtisanServiceProvider.php:120-121](https://github.com/laravel/framework/blob/main/src/Illuminate/Foundation/Providers/ArtisanServiceProvider.php#L120-L121), [src/Illuminate/Foundation/Providers/ArtisanServiceProvider.php:960-963](https://github.com/laravel/framework/blob/main/src/Illuminate/Foundation/Providers/ArtisanServiceProvider.php#L960-L963)

### Container Binding Architecture

The provider differentiates between commands that require explicit constructor dependency injection and those that can be automatically resolved. 

| Registration Strategy | Resolution Mechanism | Example Commands | Sources |
| :--- | :--- | :--- | :--- |
| **Custom Singleton Method** | Explicitly instantiates the command with container dependencies like `$app['files']` or `$app['composer']`. | `CastMakeCommand`, `ModelMakeCommand`, `AboutCommand` | [src/Illuminate/Foundation/Providers/ArtisanServiceProvider.php:302-307](https://github.com/laravel/framework/blob/main/src/Illuminate/Foundation/Providers/ArtisanServiceProvider.php#L302-L307), [src/Illuminate/Foundation/Providers/ArtisanServiceProvider.php:350-355](https://github.com/laravel/framework/blob/main/src/Illuminate/Foundation/Providers/ArtisanServiceProvider.php#L350-L355) |
| **Fallback Singleton Binding** | Binds the command class name directly into the container via `$this->app->singleton($command)`. | `CacheClearCommand`, `DbCommand`, `RouteCacheCommand` | [src/Illuminate/Foundation/Providers/ArtisanServiceProvider.php:289-292](https://github.com/laravel/framework/blob/main/src/Illuminate/Foundation/Providers/ArtisanServiceProvider.php#L289-L292) |

> [!TIP]
> During container registration, `Signals::resolveAvailabilityUsing()` is configured inside `register()` to check if the application is running in the console, not running unit tests, and has the `pcntl` extension loaded before enabling signal handling.
> 
> Sources: [src/Illuminate/Foundation/Providers/ArtisanServiceProvider.php:260-264](https://github.com/laravel/framework/blob/main/src/Illuminate/Foundation/Providers/ArtisanServiceProvider.php#L260-L264)

## Base Generator Command Lifecycle

### Overview

The generation of files within `GeneratorCommand` follows a strict execution pipeline coordinated by the `handle()` method. When a console command is invoked, it evaluates input validation, namespace qualification, filesystem existence checks, directory provisioning, stub replacement, and optional test generation in a fixed sequence.

Sources: [src/Illuminate/Console/GeneratorCommand.php:154-198](https://github.com/laravel/framework/blob/main/src/Illuminate/Console/GeneratorCommand.php#L154-L198)

### Execution Pipeline Call-Chain

The core file creation workflow flows through a distinct chain of internal methods:
`handle()` → `isReservedName()` → `qualifyClass()` → `getPath()` → `alreadyExists()` → `makeDirectory()` → `buildClass()` → `sortImports()` → `handleTestCreation()`

- `isReservedName()`: Validates that the requested name input is not a reserved PHP keyword or construct.
- `qualifyClass()`: Prefixes the input name with the application root namespace and default namespace.
- `getPath()`: Resolves the absolute file system path for the destination `.php` file.
- `alreadyExists()`: Checks if the target file already exists on disk unless the `force` option is supplied.
- `makeDirectory()`: Ensures parent directories exist recursively with `0777` permissions using `Filesystem::makeDirectory()`.
- `buildClass()`: Loads the stub file from `getStub()` and invokes `replaceNamespace()` and `replaceClass()`.
- `sortImports()`: Alphabetically sorts `use` statements within the generated file content.
- `handleTestCreation()`: Conditionally creates a matching test file if the `CreatesMatchingTest` trait is attached.

Sources: [src/Illuminate/Console/GeneratorCommand.php:154-198](https://github.com/laravel/framework/blob/main/src/Illuminate/Console/GeneratorCommand.php#L154-L198), [src/Illuminate/Console/GeneratorCommand.php:318-410](https://github.com/laravel/framework/blob/main/src/Illuminate/Console/GeneratorCommand.php#L318-L410)

> [!WARNING]
> If a class name matches any entry in the protected `$reservedNames` array (such as `class`, `interface`, `trait`, or `fn`), `handle()` immediately writes an error component and returns `false` to prevent filesystem pollution.
> 
> Sources: [src/Illuminate/Console/GeneratorCommand.php:40-124](https://github.com/laravel/framework/blob/main/src/Illuminate/Console/GeneratorCommand.php#L40-L124), [src/Illuminate/Console/GeneratorCommand.php:159-163](https://github.com/laravel/framework/blob/main/src/Illuminate/Console/GeneratorCommand.php#L159-L163)

### Namespace Qualification and Stub Replacements

Namespace resolution relies on `qualifyClass()`, which strips leading slashes, normalizes path separators, and prepends the root namespace combined with any default namespace returned by `getDefaultNamespace()`. Once the qualified name and target path are established, `buildClass()` executes string replacement operations across the loaded stub content.

The stub replacement logic handles three distinct syntaxes for placeholders across three targeted variables:

| Placeholder Variant Set | Namespace Replacement | Root Namespace Replacement | UserModel Replacement | Sources |
| :--- | :--- | :--- | :--- | :--- |
| **Legacy Uppercase** | `DummyNamespace` | `DummyRootNamespace` | `NamespacedDummyUserModel` | [src/Illuminate/Console/GeneratorCommand.php:352-352](https://github.com/laravel/framework/blob/main/src/Illuminate/Console/GeneratorCommand.php#L352-L352) |
| **Double Brace Spaced** | `{{ namespace }}` | `{{ rootNamespace }}` | `{{ namespacedUserModel }}` | [src/Illuminate/Console/GeneratorCommand.php:353-353](https://github.com/laravel/framework/blob/main/src/Illuminate/Console/GeneratorCommand.php#L353-L353) |
| **Double Brace Compact** | `{{namespace}}` | `{{rootNamespace}}` | `{{namespacedUserModel}}` | [src/Illuminate/Console/GeneratorCommand.php:354-354](https://github.com/laravel/framework/blob/main/src/Illuminate/Console/GeneratorCommand.php#L354-L354) |

Sources: [src/Illuminate/Console/GeneratorCommand.php:206-221](https://github.com/laravel/framework/blob/main/src/Illuminate/Console/GeneratorCommand.php#L206-L221), [src/Illuminate/Console/GeneratorCommand.php:349-366](https://github.com/laravel/framework/blob/main/src/Illuminate/Console/GeneratorCommand.php#L349-L366)

## Stub Publishing and Event Hooking

### Overview

The `StubPublishCommand` class (`stub:publish`) exposes framework and database stubs so developers can customize code generation templates locally. It builds an extensive array mapping framework stub source paths to their base filenames, fires the `PublishingStubs` event to allow package or application customization of the stub collection, and writes the files to the application's base `stubs` directory.

Sources: [src/Illuminate/Foundation/Console/StubPublishCommand.php:10-110](https://github.com/laravel/framework/blob/main/src/Illuminate/Foundation/Console/StubPublishCommand.php#L10-L110), [src/Illuminate/Foundation/Events/PublishingStubs.php:5-39](https://github.com/laravel/framework/blob/main/src/Illuminate/Foundation/Events/PublishingStubs.php#L5-L39)

### Stub Publishing Call-Chain and Options

The execution flow of the stub publishing command follows a direct programmatic sequence:
`handle()` → `Filesystem::makeDirectory()` → `$events->dispatch()` → `file_put_contents()`

- `handle()`: Validates or creates the base `stubs` directory, compiles the master array of 48 default stubs, and instantiates the `PublishingStubs` event.
- `Filesystem::makeDirectory()`: Provisions the target `base_path('stubs')` directory recursively if it does not already exist.
- `$events->dispatch()`: Dispatches the `PublishingStubs` event holding the stub map, permitting listeners to call `add(string $path, string $name)` to inject or modify stubs.
- `file_put_contents()`: Iterates through the finalized `$event->stubs` collection, respecting command options to copy template contents.

Sources: [src/Illuminate/Foundation/Console/StubPublishCommand.php:34-106](https://github.com/laravel/framework/blob/main/src/Illuminate/Foundation/Console/StubPublishCommand.php#L34-L106), [src/Illuminate/Foundation/Events/PublishingStubs.php:21-38](https://github.com/laravel/framework/blob/main/src/Illuminate/Foundation/Events/PublishingStubs.php#L21-L38)

The command supports two CLI flags that alter copy behavior:

| Option | Description | Sources |
| :--- | :--- | :--- |
| `--existing` | Publish and overwrite only the files that have already been published. | [src/Illuminate/Foundation/Console/StubPublishCommand.php:19-19](https://github.com/laravel/framework/blob/main/src/Illuminate/Foundation/Console/StubPublishCommand.php#L19-L19) |
| `--force` | Overwrite any existing files regardless of publication status. | [src/Illuminate/Foundation/Console/StubPublishCommand.php:20-20](https://github.com/laravel/framework/blob/main/src/Illuminate/Foundation/Console/StubPublishCommand.php#L20-L20) |

Sources: [src/Illuminate/Foundation/Console/StubPublishCommand.php:18-20](https://github.com/laravel/framework/blob/main/src/Illuminate/Foundation/Console/StubPublishCommand.php#L18-L20)

> [!NOTE]
> When neither `--existing` nor `--force` is provided, `StubPublishCommand` will skip any target stub file that already exists on disk, preserving local modifications. If `--force` is set, existing files are unconditionally overwritten.
> 
> Sources: [src/Illuminate/Foundation/Console/StubPublishCommand.php:102-105](https://github.com/laravel/framework/blob/main/src/Illuminate/Foundation/Console/StubPublishCommand.php#L102-L105)

### PublishingStubs Event API

The `PublishingStubs` event acts as an extension point during stub export. It stores the array of stubs internally and exposes an `add()` method for fluent registration of custom stubs by service providers or listeners.

```php
use Illuminate\Foundation\Events\PublishingStubs;

class AppServiceProvider
{
    public function boot(): void
    {
        // Adding a custom stub during publication
        app('events')->listen(PublishingStubs::class, function (PublishingStubs $event) {
            $event->add(__DIR__.'/stubs/custom.stub', 'custom.stub');
        });
    }
}
```

Sources: [src/Illuminate/Foundation/Events/PublishingStubs.php:5-39](https://github.com/laravel/framework/blob/main/src/Illuminate/Foundation/Events/PublishingStubs.php#L5-L39)

## Model and Controller Code Generation

### Overview

Model and controller code generation commands orchestrate the recursive creation of dependent architectural components such as factories, database migrations, seeders, policies, resource controllers, and form requests. `ModelMakeCommand` (`make:model`) and `ControllerMakeCommand` (`make:controller`) leverage interactive Laravel Prompts (`confirm`, `multiselect`, `select`, `suggest`) to prompt developers for missing options, dynamically spawning sub-commands via `$this->call()` to build an entire feature stack in a single execution flow.

Sources: [src/Illuminate/Foundation/Console/ModelMakeCommand.php:49-93](https://github.com/laravel/framework/blob/main/src/Illuminate/Foundation/Console/ModelMakeCommand.php#L49-L93), [src/Illuminate/Routing/Console/ControllerMakeCommand.php:311-339](https://github.com/laravel/framework/blob/main/src/Illuminate/Routing/Console/ControllerMakeCommand.php#L311-L339)

### Recursive Generation Call-Chain

When executing `make:model` with aggregate flags or interactive prompts, the command sequences child generators through a deterministic execution pipeline:
`handle()` → `createFactory()` / `createMigration()` / `createSeeder()` / `createController()` → `make:factory` / `make:migration` / `make:seeder` / `make:controller`

- `handle()`: Evaluates command inputs, checks options like `--all`, and dispatches individual builder methods.
- `createController()`: Constructs a controller command call, passing qualified model names and flags (`--api`, `--requests`, `--test`, `--pest`).
- `ControllerMakeCommand::buildModelReplacements()`: Intercepts model binding options, checks if the target model class exists on disk, and interactively prompts the user via `confirm()` to automatically generate missing models using `make:model`.
- `generateFormRequests()`: Spawns `make:request` commands for both `Store{Model}Request` and `Update{Model}Request`.

Sources: [src/Illuminate/Foundation/Console/ModelMakeCommand.php:49-93](https://github.com/laravel/framework/blob/main/src/Illuminate/Foundation/Console/ModelMakeCommand.php#L49-L93), [src/Illuminate/Routing/Console/ControllerMakeCommand.php:177-198](https://github.com/laravel/framework/blob/main/src/Illuminate/Routing/Console/ControllerMakeCommand.php#L177-L198)

> [!WARNING]
> If a controller is generated with a model option pointing to a non-existent class, `ControllerMakeCommand` triggers an interactive `confirm()` prompt. If accepted, it recursively invokes `make:model` before completing the controller's stub replacement phase.
> 
> Sources: [src/Illuminate/Routing/Console/ControllerMakeCommand.php:177-184](https://github.com/laravel/framework/blob/main/src/Illuminate/Routing/Console/ControllerMakeCommand.php#L177-L184)

### Command Options Reference

Both commands expose comprehensive CLI options that govern stub resolution and dependent generation behavior:

| Command | Option Name | Shortcut | Value Type | Purpose | Sources |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `ModelMakeCommand` | `--all` | `-a` | VALUE_NONE | Generate migration, seeder, factory, policy, resource controller, and form requests. | [src/Illuminate/Foundation/Console/ModelMakeCommand.php:294-294](https://github.com/laravel/framework/blob/main/src/Illuminate/Foundation/Console/ModelMakeCommand.php#L294-L294) |
| `ModelMakeCommand` | `--pivot` | `-p` | VALUE_NONE | Generate a custom intermediate table model with singular snake-case naming. | [src/Illuminate/Foundation/Console/ModelMakeCommand.php:302-302](https://github.com/laravel/framework/blob/main/src/Illuminate/Foundation/Console/ModelMakeCommand.php#L302-L302) |
| `ModelMakeCommand` | `--morph-pivot` | none | VALUE_NONE | Generate a custom polymorphic intermediate table model. | [src/Illuminate/Foundation/Console/ModelMakeCommand.php:299-299](https://github.com/laravel/framework/blob/main/src/Illuminate/Foundation/Console/ModelMakeCommand.php#L299-L299) |
| `ControllerMakeCommand` | `--model` | `-m` | VALUE_OPTIONAL | Generate a resource controller for the given model. | [src/Illuminate/Routing/Console/ControllerMakeCommand.php:295-295](https://github.com/laravel/framework/blob/main/src/Illuminate/Routing/Console/ControllerMakeCommand.php#L295-L295) |
| `ControllerMakeCommand` | `--parent` | `-p` | VALUE_OPTIONAL | Generate a nested resource controller class. | [src/Illuminate/Routing/Console/ControllerMakeCommand.php:296-296](https://github.com/laravel/framework/blob/main/src/Illuminate/Routing/Console/ControllerMakeCommand.php#L296-L296) |
| `ControllerMakeCommand` | `--requests` | `-R` | VALUE_NONE | Generate FormRequest classes for store and update actions. | [src/Illuminate/Routing/Console/ControllerMakeCommand.php:298-298](https://github.com/laravel/framework/blob/main/src/Illuminate/Routing/Console/ControllerMakeCommand.php#L298-L298) |
| `ControllerMakeCommand` | `--type` | none | VALUE_REQUIRED | Manually specify a custom controller stub file. | [src/Illuminate/Routing/Console/ControllerMakeCommand.php:292-292](https://github.com/laravel/framework/blob/main/src/Illuminate/Routing/Console/ControllerMakeCommand.php#L292-L292) |

Sources: [src/Illuminate/Foundation/Console/ModelMakeCommand.php:291-307](https://github.com/laravel/framework/blob/main/src/Illuminate/Foundation/Console/ModelMakeCommand.php#L291-L307), [src/Illuminate/Routing/Console/ControllerMakeCommand.php:288-302](https://github.com/laravel/framework/blob/main/src/Illuminate/Routing/Console/ControllerMakeCommand.php#L288-L302)

### Design Trade-offs in Composite Generators

| Design Choice | Benefit | Cost | Sources |
| :--- | :--- | :--- | :--- |
| Delegating via `$this->call()` | Promotes code reuse and maintains isolated command responsibilities across disparate domain generators. | Increases inter-command coupling and propagates console output overhead across sub-processes. | [src/Illuminate/Foundation/Console/ModelMakeCommand.php:104-107](https://github.com/laravel/framework/blob/main/src/Illuminate/Foundation/Console/ModelMakeCommand.php#L104-L107), [src/Illuminate/Routing/Console/ControllerMakeCommand.php:270-272](https://github.com/laravel/framework/blob/main/src/Illuminate/Routing/Console/ControllerMakeCommand.php#L270-L272) |
| Interactive fallback prompts | Lowers barrier to entry for rapid scaffolding when arguments are omitted. | Can block automated CI/CD environments if missing arguments trigger interactive `confirm()` or `multiselect()` calls. | [src/Illuminate/Foundation/Console/ModelMakeCommand.php:56-60](https://github.com/laravel/framework/blob/main/src/Illuminate/Foundation/Console/ModelMakeCommand.php#L56-L60), [src/Illuminate/Routing/Console/ControllerMakeCommand.php:317-323](https://github.com/laravel/framework/blob/main/src/Illuminate/Routing/Console/ControllerMakeCommand.php#L317-L323) |
| Dynamic stub string replacements | Allows flexible injection of imports, namespaces, and traits based on enabled flags. | Relies heavily on precise placeholder string matching which can fail if custom stubs drift from framework standards. | [src/Illuminate/Foundation/Console/ModelMakeCommand.php:261-284](https://github.com/laravel/framework/blob/main/src/Illuminate/Foundation/Console/ModelMakeCommand.php#L261-L284), [src/Illuminate/Routing/Console/ControllerMakeCommand.php:111-142](https://github.com/laravel/framework/blob/main/src/Illuminate/Routing/Console/ControllerMakeCommand.php#L111-L142) |

Sources: [src/Illuminate/Foundation/Console/ModelMakeCommand.php:49-93](https://github.com/laravel/framework/blob/main/src/Illuminate/Foundation/Console/ModelMakeCommand.php#L49-L93), [src/Illuminate/Routing/Console/ControllerMakeCommand.php:111-142](https://github.com/laravel/framework/blob/main/src/Illuminate/Routing/Console/ControllerMakeCommand.php#L111-L142)

## Specialized Class Generator Implementations

### Overview

Specialized generators adapt the base `GeneratorCommand` pipeline to handle domain-specific files such as database factories, seeders, test suites, console commands, resource transformers, and observers. Each specialized command implements tailored stub resolution, filesystem path calculation, and placeholder replacement logic to accommodate unconventional directory structures outside standard `app/` namespaces.

Sources: [src/Illuminate/Database/Console/Factories/FactoryMakeCommand.php:12-144](https://github.com/laravel/framework/blob/main/src/Illuminate/Database/Console/Factories/FactoryMakeCommand.php#L12-L144), [src/Illuminate/Foundation/Console/ConsoleMakeCommand.php:12-103](https://github.com/laravel/framework/blob/main/src/Illuminate/Foundation/Console/ConsoleMakeCommand.php#L12-L103), [src/Illuminate/Foundation/Console/ObserverMakeCommand.php:14-169](https://github.com/laravel/framework/blob/main/src/Illuminate/Foundation/Console/ObserverMakeCommand.php#L14-L169), [src/Illuminate/Foundation/Console/TestMakeCommand.php:14-157](https://github.com/laravel/framework/blob/main/src/Illuminate/Foundation/Console/TestMakeCommand.php#L14-L157), [src/Illuminate/Foundation/Console/ResourceMakeCommand.php:9-109](https://github.com/laravel/framework/blob/main/src/Illuminate/Foundation/Console/ResourceMakeCommand.php#L9-L109), [src/Illuminate/Database/Console/Seeds/SeederMakeCommand.php:9-92](https://github.com/laravel/framework/blob/main/src/Illuminate/Database/Console/Seeds/SeederMakeCommand.php#L9-L92), [src/Illuminate/Foundation/Console/ClassMakeCommand.php:9-70](https://github.com/laravel/framework/blob/main/src/Illuminate/Foundation/Console/ClassMakeCommand.php#L9-L70)

### Stub Resolution and Namespace Customization

Specialized generators depart from standard application path resolution by targeting specialized directories like `database/factories`, `database/seeders`, and `tests`. For instance, `SeederMakeCommand` overrides `rootNamespace()` to return `Database\Seeders\\` and inspects disk paths to support legacy `database/seeds/` directories alongside modern `database/seeders/` paths. Similarly, `TestMakeCommand` switches between Pest and PHPUnit stubs (`.stub` vs `.unit.stub`) by evaluating `usingPest()`, while scoping output classes under `Tests\Feature` or `Tests\Unit`.

Sources: [src/Illuminate/Database/Console/Seeds/SeederMakeCommand.php:48-91](https://github.com/laravel/framework/blob/main/src/Illuminate/Database/Console/Seeds/SeederMakeCommand.php#L48-L91), [src/Illuminate/Foundation/Console/TestMakeCommand.php:43-101](https://github.com/laravel/framework/blob/main/src/Illuminate/Foundation/Console/TestMakeCommand.php#L43-L101), [src/Illuminate/Foundation/Console/TestMakeCommand.php:147-156](https://github.com/laravel/framework/blob/main/src/Illuminate/Foundation/Console/TestMakeCommand.php#L147-L156)

> [!NOTE]
> `SeederMakeCommand::getPath()` checks whether `database/seeds` exists on disk before defaulting to `database/seeders`, ensuring backward compatibility for legacy directory structures.
> 
> Sources: [src/Illuminate/Database/Console/Seeds/SeederMakeCommand.php:72-81](https://github.com/laravel/framework/blob/main/src/Illuminate/Database/Console/Seeds/SeederMakeCommand.php#L72-L81)

### Replacement Mechanics and Model Guessing

Generators such as `FactoryMakeCommand`, `ObserverMakeCommand`, and `ConsoleMakeCommand` parse command-line options to populate dynamic template placeholders. `FactoryMakeCommand` resolves model bindings via `guessModelName()`, falling back to `Models\Model` if an explicit `--model` option is omitted. `ObserverMakeCommand` supports conditional stub selection (`observer.stub` versus `observer.plain.stub`) based on the presence of the `--model` flag, and utilizes interactive `suggest` prompts when arguments are missing.

Sources: [src/Illuminate/Database/Console/Factories/FactoryMakeCommand.php:64-93](https://github.com/laravel/framework/blob/main/src/Illuminate/Database/Console/Factories/FactoryMakeCommand.php#L64-L93), [src/Illuminate/Database/Console/Factories/FactoryMakeCommand.php:114-131](https://github.com/laravel/framework/blob/main/src/Illuminate/Database/Console/Factories/FactoryMakeCommand.php#L114-L131), [src/Illuminate/Foundation/Console/ObserverMakeCommand.php:44-79](https://github.com/laravel/framework/blob/main/src/Illuminate/Foundation/Console/ObserverMakeCommand.php#L44-L79), [src/Illuminate/Foundation/Console/ObserverMakeCommand.php:103-108](https://github.com/laravel/framework/blob/main/src/Illuminate/Foundation/Console/ObserverMakeCommand.php#L103-L108), [src/Illuminate/Foundation/Console/ObserverMakeCommand.php:154-168](https://github.com/laravel/framework/blob/main/src/Illuminate/Foundation/Console/ObserverMakeCommand.php#L154-L168)

| Command Class | Target Directory | Default Stub File | Key CLI Options | Sources |
| :--- | :--- | :--- | :--- | :--- |
| `FactoryMakeCommand` | `database/factories` | `/stubs/factory.stub` | `--model` (`-m`) | [src/Illuminate/Database/Console/Factories/FactoryMakeCommand.php:40-143](https://github.com/laravel/framework/blob/main/src/Illuminate/Database/Console/Factories/FactoryMakeCommand.php#L40-L143) |
| `SeederMakeCommand` | `database/seeders` (or `seeds`) | `/stubs/seeder.stub` | None | [src/Illuminate/Database/Console/Seeds/SeederMakeCommand.php:48-91](https://github.com/laravel/framework/blob/main/src/Illuminate/Database/Console/Seeds/SeederMakeCommand.php#L48-L91) |
| `TestMakeCommand` | `tests/Feature` or `tests/Unit` | `/stubs/test.stub` (or `.unit.stub`) | `--unit` (`-u`), `--pest`, `--phpunit`, `--force` (`-f`) | [src/Illuminate/Foundation/Console/TestMakeCommand.php:43-116](https://github.com/laravel/framework/blob/main/src/Illuminate/Foundation/Console/TestMakeCommand.php#L43-L116) |
| `ObserverMakeCommand` | `app/Observers` | `/stubs/observer.stub` or `observer.plain.stub` | `--model` (`-m`), `--force` (`-f`) | [src/Illuminate/Foundation/Console/ObserverMakeCommand.php:103-145](https://github.com/laravel/framework/blob/main/src/Illuminate/Foundation/Console/ObserverMakeCommand.php#L103-L145) |
| `ResourceMakeCommand` | `app/Http/Resources` | `/stubs/resource.stub` | `--json-api` (`-j`), `--collection` (`-c`), `--force` (`-f`) | [src/Illuminate/Foundation/Console/ResourceMakeCommand.php:52-108](https://github.com/laravel/framework/blob/main/src/Illuminate/Foundation/Console/ResourceMakeCommand.php#L52-L108) |
| `ConsoleMakeCommand` | `app/Console/Commands` | `/stubs/console.stub` | `--command`, `--force` (`-f`) | [src/Illuminate/Foundation/Console/ConsoleMakeCommand.php:59-102](https://github.com/laravel/framework/blob/main/src/Illuminate/Foundation/Console/ConsoleMakeCommand.php#L59-L102) |
| `ClassMakeCommand` | `app` (or custom subnamespace) | `/stubs/class.stub` | `--invokable` (`-i`), `--force` (`-f`) | [src/Illuminate/Foundation/Console/ClassMakeCommand.php:37-69](https://github.com/laravel/framework/blob/main/src/Illuminate/Foundation/Console/ClassMakeCommand.php#L37-L69) |

Sources: [src/Illuminate/Database/Console/Factories/FactoryMakeCommand.php:40-143](https://github.com/laravel/framework/blob/main/src/Illuminate/Database/Console/Factories/FactoryMakeCommand.php#L40-L143)

### Design Trade-offs in Specialized Generators

| Design Choice | Benefit | Cost | Sources |
| :--- | :--- | :--- | :--- |
| Dynamic model guessing (`guessModelName`) | Enables zero-configuration scaffolding when creating factories matching standard naming conventions. | Can resolve incorrect model namespaces if custom directory layouts deviate from conventional `App\Models` paths. | [src/Illuminate/Database/Console/Factories/FactoryMakeCommand.php:114-131](https://github.com/laravel/framework/blob/main/src/Illuminate/Database/Console/Factories/FactoryMakeCommand.php#L114-L131) |
| Conditional stub selection (`usingPest()`) | Seamlessly supports modern Pest testing syntax alongside traditional PHPUnit test cases. | Couples generator execution logic to external framework presence checks and filesystem inspections. | [src/Illuminate/Foundation/Console/TestMakeCommand.php:43-50](https://github.com/laravel/framework/blob/main/src/Illuminate/Foundation/Console/TestMakeCommand.php#L43-L50), [src/Illuminate/Foundation/Console/TestMakeCommand.php:147-156](https://github.com/laravel/framework/blob/main/src/Illuminate/Foundation/Console/TestMakeCommand.php#L147-L156) |
| Hardcoded path overrides (`getPath()`) | Directs framework files to specialized locations like `database/factories` and `tests/Feature`. | Prevents generalized base class reuse without overriding path calculation methods in each subclass. | [src/Illuminate/Database/Console/Factories/FactoryMakeCommand.php:101-106](https://github.com/laravel/framework/blob/main/src/Illuminate/Database/Console/Factories/FactoryMakeCommand.php#L101-L106), [src/Illuminate/Foundation/Console/TestMakeCommand.php:71-76](https://github.com/laravel/framework/blob/main/src/Illuminate/Foundation/Console/TestMakeCommand.php#L71-L76), [src/Illuminate/Database/Console/Seeds/SeederMakeCommand.php:72-81](https://github.com/laravel/framework/blob/main/src/Illuminate/Database/Console/Seeds/SeederMakeCommand.php#L72-L81) |

Sources: [src/Illuminate/Database/Console/Factories/FactoryMakeCommand.php:101-131](https://github.com/laravel/framework/blob/main/src/Illuminate/Database/Console/Factories/FactoryMakeCommand.php#L101-L131)

## Database Migration Creation Pipeline

### Overview

The migration creation pipeline coordinates `MigrationGeneratorCommand` and `MigrationCreator` to manufacture timestamped database migration files from template stubs. `MigrationGeneratorCommand` serves as an abstract base command that initiates checks against existing migrations before requesting a base migration file from the container-bound `migration.creator` instance.

Sources: [src/Illuminate/Database/Migrations/MigrationCreator.php:64-87](https://github.com/laravel/framework/blob/main/src/Illuminate/Database/Migrations/MigrationCreator.php#L64-L87), [src/Illuminate/Console/MigrationGeneratorCommand.php:45-66](https://github.com/laravel/framework/blob/main/src/Illuminate/Console/MigrationGeneratorCommand.php#L45-L66)

### Call-Chain Execution Walkthrough

When an abstract migration generator command executes, it follows a strict sequence of validation and file generation calls:

1. `MigrationGeneratorCommand::handle()` — Resolves the target table via `migrationTableName()`, checks existence via `migrationExists()`, and triggers base migration creation.
2. `MigrationGeneratorCommand::createBaseMigration()` — Delegates to the container binding `migration.creator->create()` with the constructed migration name and database path.
3. `MigrationCreator::create()` — Orchestrates the core file creation flow by executing `ensureMigrationDoesntAlreadyExist()`, `getStub()`, `getCollisionFreePath()`, `files->ensureDirectoryExists()`, `files->put()`, and `firePostCreateHooks()`.
4. `MigrationCreator::getDatePrefix()` — Evaluates whether a collision exists in the target directory, looping and incrementing seconds via `Date::now()->addSecond()` if a file with the identical timestamp suffix already exists.
5. `MigrationGeneratorCommand::replaceMigrationPlaceholders()` — Reads the stub returned by `migrationStubFile()`, replaces the `{{table}}` placeholder with the target table name, and overwrites the file content.

Sources: [src/Illuminate/Database/Migrations/MigrationCreator.php:64-87](https://github.com/laravel/framework/blob/main/src/Illuminate/Database/Migrations/MigrationCreator.php#L64-L87), [src/Illuminate/Database/Migrations/MigrationCreator.php:191-247](https://github.com/laravel/framework/blob/main/src/Illuminate/Database/Migrations/MigrationCreator.php#L191-L247), [src/Illuminate/Console/MigrationGeneratorCommand.php:45-95](https://github.com/laravel/framework/blob/main/src/Illuminate/Console/MigrationGeneratorCommand.php#L45-L95)

> [!WARNING]
> During rapid batch generation within the same second, `MigrationCreator::getDatePrefix()` inspects the filesystem via `$this->files->glob()` and increments the timestamp by one second until a collision-free filename is guaranteed, preventing overwrites.
>
> Sources: [src/Illuminate/Database/Migrations/MigrationCreator.php:240-246](https://github.com/laravel/framework/blob/main/src/Illuminate/Database/Migrations/MigrationCreator.php#L240-L246)

### Stub Resolution Strategy

`MigrationCreator::getStub()` resolves migration templates by checking custom stub directories before falling back to framework default stubs. 

| Condition | Custom Stub Checked | Default Framework Stub | Sources |
| :--- | :--- | :--- | :--- |
| `is_null($table)` | `$this->customStubPath.'/migration.stub'` | `$this->stubPath().'/migration.stub'` | [src/Illuminate/Database/Migrations/MigrationCreator.php:122-125](https://github.com/laravel/framework/blob/main/src/Illuminate/Database/Migrations/MigrationCreator.php#L122-L125) |
| `!is_null($table) && $create` | `$this->customStubPath.'/migration.create.stub'` | `$this->stubPath().'/migration.create.stub'` | [src/Illuminate/Database/Migrations/MigrationCreator.php:126-129](https://github.com/laravel/framework/blob/main/src/Illuminate/Database/Migrations/MigrationCreator.php#L126-L129) |
| `!is_null($table) && !$create` | `$this->customStubPath.'/migration.update.stub'` | `$this->stubPath().'/migration.update.stub'` | [src/Illuminate/Database/Migrations/MigrationCreator.php:130-134](https://github.com/laravel/framework/blob/main/src/Illuminate/Database/Migrations/MigrationCreator.php#L130-L134) |

Sources: [src/Illuminate/Database/Migrations/MigrationCreator.php:120-137](https://github.com/laravel/framework/blob/main/src/Illuminate/Database/Migrations/MigrationCreator.php#L120-L137)

> [!NOTE]
> `MigrationCreator` allows developers to register custom post-creation callbacks using `afterCreate(Closure $callback)`, which are invoked with the table name and file path after the file is written to disk.
>
> Sources: [src/Illuminate/Database/Migrations/MigrationCreator.php:209-225](https://github.com/laravel/framework/blob/main/src/Illuminate/Database/Migrations/MigrationCreator.php#L209-L225)

## Related

- [[Artisan Console Kernel]]

