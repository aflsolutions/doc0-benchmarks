# Eloquent Relationships

<details>
<summary>Relevant source files</summary>

The following files were used as context for generating this wiki page:

- [types/Database/Eloquent/Relations.php](https://github.com/laravel/framework/blob/main/types/Database/Eloquent/Relations.php)
- [src/Illuminate/Database/Eloquent/Concerns/HasRelationships.php](https://github.com/laravel/framework/blob/main/src/Illuminate/Database/Eloquent/Concerns/HasRelationships.php)
- [src/Illuminate/Database/Eloquent/Model.php](https://github.com/laravel/framework/blob/main/src/Illuminate/Database/Eloquent/Model.php)
- [src/Illuminate/Database/Eloquent/Relations/Relation.php](https://github.com/laravel/framework/blob/main/src/Illuminate/Database/Eloquent/Relations/Relation.php)
- [src/Illuminate/Database/Eloquent/Relations/HasOneOrMany.php](https://github.com/laravel/framework/blob/main/src/Illuminate/Database/Eloquent/Relations/HasOneOrMany.php)
- [src/Illuminate/Database/Eloquent/Builder.php](https://github.com/laravel/framework/blob/main/src/Illuminate/Database/Eloquent/Builder.php)
</details>

## Overview

Eloquent Relationships power the connectivity between database models in Laravel, enabling developers to map and navigate one-to-one, one-to-many, many-to-many, and polymorphic associations declaratively. Built on top of the abstract `Relation` architecture, relationship methods leverage the Eloquent query builder to bind models, apply structural constraints, and manage persistence lifecycle operations. By handling complex database joins, dictionary key lookups, and eager loading parsing seamlessly, relationships integrate tightly with parent-child instances to support dynamic attribute resolution, relationship caching, and automatic relation loading.

Sources: [types/Database/Eloquent/Relations.php:21-130](https://github.com/laravel/framework/blob/main/types/Database/Eloquent/Relations.php#L21-L130), [src/Illuminate/Database/Eloquent/Concerns/HasRelationships.php:28-57](https://github.com/laravel/framework/blob/main/src/Illuminate/Database/Eloquent/Concerns/HasRelationships.php#L28-L57), [src/Illuminate/Database/Eloquent/Relations/Relation.php:24-100](https://github.com/laravel/framework/blob/main/src/Illuminate/Database/Eloquent/Relations/Relation.php#L24-L100), [src/Illuminate/Database/Eloquent/Relations/HasOneOrMany.php:21-53](https://github.com/laravel/framework/blob/main/src/Illuminate/Database/Eloquent/Relations/HasOneOrMany.php#L21-L53)

## Defining Eloquent Model Relationships

### Overview

Eloquent models define their database associations through methods declared directly on the model class, leveraging the `HasRelationships` trait. These methods instantiate relationship objects—such as `HasOne`, `HasMany`, `BelongsTo`, `BelongsToMany`, `HasOneThrough`, `HasManyThrough`, `MorphOne`, `MorphMany`, `MorphTo`, and `MorphToMany`—by pairing a related model query with appropriate foreign keys, local keys, and intermediate pivot parameters.

Sources: [src/Illuminate/Database/Eloquent/Concerns/HasRelationships.php:28-35](https://github.com/laravel/framework/blob/main/src/Illuminate/Database/Eloquent/Concerns/HasRelationships.php#L28-L35), [src/Illuminate/Database/Eloquent/Concerns/HasRelationships.php:218-236](https://github.com/laravel/framework/blob/main/src/Illuminate/Database/Eloquent/Concerns/HasRelationships.php#L218-L236)

### Declaring Basic and Through Relationships

Models declare basic cardinalities like one-to-one and one-to-many via `hasOne()` and `hasMany()`, supplying the related class string, foreign key, and local key. Inverse relationships are established via `belongsTo()`, which inspects backtraces using `guessBelongsToRelation()` and constructs the foreign key as snake-case relationship name concatenated with the related model's key name. Indirect relationships across an intermediate table are defined using `hasOneThrough()` and `hasManyThrough()`, or fluently via the `through()` method.

```php
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class User extends Model
{
    public function address(): HasOne
    {
        return $this->hasOne(Address::class, 'user_id', 'id');
    }

    public function posts(): HasMany
    {
        return $this->hasMany(Post::class, 'user_id', 'id');
    }
}

class Post extends Model
{
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id', 'id', 'user');
    }
}
```

Sources: [src/Illuminate/Database/Eloquent/Concerns/HasRelationships.php:227-236](https://github.com/laravel/framework/blob/main/src/Illuminate/Database/Eloquent/Concerns/HasRelationships.php#L227-L236), [src/Illuminate/Database/Eloquent/Concerns/HasRelationships.php:361-387](https://github.com/laravel/framework/blob/main/src/Illuminate/Database/Eloquent/Concerns/HasRelationships.php#L361-L387), [src/Illuminate/Database/Eloquent/Concerns/HasRelationships.php:549-560](https://github.com/laravel/framework/blob/main/src/Illuminate/Database/Eloquent/Concerns/HasRelationships.php#L549-L560), [src/Illuminate/Database/Eloquent/Concerns/HasRelationships.php:593-610](https://github.com/laravel/framework/blob/main/src/Illuminate/Database/Eloquent/Concerns/HasRelationships.php#L593-L610)

> [!NOTE]
> When defining a `belongsTo` relationship without explicit arguments, `guessBelongsToRelation()` uses `debug_backtrace()` to extract the calling method's name as the relationship identifier.

Sources: [src/Illuminate/Database/Eloquent/Concerns/HasRelationships.php:366-368](https://github.com/laravel/framework/blob/main/src/Illuminate/Database/Eloquent/Concerns/HasRelationships.php#L366-L368), [src/Illuminate/Database/Eloquent/Concerns/HasRelationships.php:507-512](https://github.com/laravel/framework/blob/main/src/Illuminate/Database/Eloquent/Concerns/HasRelationships.php#L507-L512)

### Many-to-Many and Polymorphic Declarations

Many-to-many associations are declared using `belongsToMany()`, which automatically resolves joining tables alphabetically via `joiningTable()` if no custom table or pivot model is supplied. Polymorphic variants—including `morphOne()`, `morphMany()`, `morphToMany()`, and `morphedByMany()`—derive type and ID columns using `getMorphs()` and manage polymorphic pivot structures.

```php
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\MorphMany;

class User extends Model
{
    public function roles(): BelongsToMany
    {
        return $this->belongsToMany(Role::class);
    }
}

class Post extends Model
{
    public function comments(): MorphMany
    {
        return $this->morphMany(Comment::class, 'commentable');
    }
}
```

Sources: [src/Illuminate/Database/Eloquent/Concerns/HasRelationships.php:645-657](https://github.com/laravel/framework/blob/main/src/Illuminate/Database/Eloquent/Concerns/HasRelationships.php#L645-L657), [src/Illuminate/Database/Eloquent/Concerns/HasRelationships.php:693-734](https://github.com/laravel/framework/blob/main/src/Illuminate/Database/Eloquent/Concerns/HasRelationships.php#L693-L734), [src/Illuminate/Database/Eloquent/Concerns/HasRelationships.php:942-960](https://github.com/laravel/framework/blob/main/src/Illuminate/Database/Eloquent/Concerns/HasRelationships.php#L942-L960)

> [!WARNING]
> If a polymorphic class map is enabled, calling `morphTo()` inspects stored type attributes; if a class violates morph mapping requirements without a registered map, a `ClassMorphViolationException` is thrown.

Sources: [src/Illuminate/Database/Eloquent/Concerns/HasRelationships.php:430-433](https://github.com/laravel/framework/blob/main/src/Illuminate/Database/Eloquent/Concerns/HasRelationships.php#L430-L433), [src/Illuminate/Database/Eloquent/Concerns/HasRelationships.php:1025-1042](https://github.com/laravel/framework/blob/main/src/Illuminate/Database/Eloquent/Concerns/HasRelationships.php#L1025-L1042)

## Base Relation Architecture and Hierarchy

### Overview

The `Illuminate\Database\Eloquent\Relations\Relation` abstract class serves as the architectural foundation for all Eloquent relationship types, implementing both `Illuminate\Contracts\Database\Eloquent\Builder` and utilizing the `ForwardsCalls` and `Macroable` traits. Every relationship instance manages an Eloquent query builder instance ($query), a parent model instance ($parent), and a related model instance ($related), establishing constraints immediately upon construction via `__construct()`.

Sources: [src/Illuminate/Database/Eloquent/Relations/Relation.php:24-99](https://github.com/laravel/framework/blob/main/src/Illuminate/Database/Eloquent/Relations/Relation.php#L24-L99)

### Core Abstract Architecture and Contracts

Subclasses of `Relation` must implement six core abstract methods that govern query constraint application, eager loading orchestration, initialization, result matching, and result resolution. 

| Abstract Method | Return Type | Purpose |
| --- | --- | --- |
| `addConstraints()` | `void` | Sets the base query constraints for the relationship (e.g. foreign key matching). |
| `addEagerConstraints(array $models)` | `void` | Adds batch constraints (such as `whereIn`) when eager loading relationships for a collection of models. |
| `initRelation(array $models, $relation)` | `array` | Initializes the default relationship attribute on an array of parent models. |
| `match(array $models, EloquentCollection $results, $relation)` | `array` | Matches eagerly loaded results back to their respective parent models. |
| `getResults()` | `TResult` | Executes the query and returns the final resolved relationship value. |

Sources: [src/Illuminate/Database/Eloquent/Relations/Relation.php:130-164](https://github.com/laravel/framework/blob/main/src/Illuminate/Database/Eloquent/Relations/Relation.php#L130-L164)

### Macro Support and Method Forwarding

The `Relation` base class uses `Macroable` combined with `ForwardsCalls` via its `__call()` magic method. When a dynamic method call is made to a relationship instance, `__call()` first inspects whether a macro exists using `static::hasMacro($method)`. If a macro is registered, it invokes `macroCall()`; otherwise, it delegates the call directly to the underlying query builder using `forwardDecoratedCallTo($this->query, $method, $parameters)`.

```php
public function __call($method, $parameters)
{
    if (static::hasMacro($method)) {
        return $this->macroCall($method, $parameters);
    }

    return $this->forwardDecoratedCallTo($this->query, $method, $parameters);
}
```

Sources: [src/Illuminate/Database/Eloquent/Relations/Relation.php:26-28](https://github.com/laravel/framework/blob/main/src/Illuminate/Database/Eloquent/Relations/Relation.php#L26-L28), [src/Illuminate/Database/Eloquent/Relations/Relation.php:532-539](https://github.com/laravel/framework/blob/main/src/Illuminate/Database/Eloquent/Relations/Relation.php#L532-L539)

> [!NOTE]
> Cloning a `Relation` instance via `__clone()` forces a deep clone of the underlying Eloquent query builder instance to prevent cross-contamination of query modifications between cloned relationships.

Sources: [src/Illuminate/Database/Eloquent/Relations/Relation.php:546-549](https://github.com/laravel/framework/blob/main/src/Illuminate/Database/Eloquent/Relations/Relation.php#L546-L549)

### Constraint Handling and Polymorphic Morph Maps

Relationship constraint generation can be globally bypassed or toggled via static properties and methods. The static `noConstraints(Closure $callback)` method sets `static::$constraints` to `false` within a `try...finally` block, ensuring previous constraint states are safely restored even if exceptions occur during execution.

```php
public static function noConstraints(Closure $callback)
{
    $previous = static::$constraints;

    static::$constraints = false;

    try {
        return $callback();
    } finally {
        static::$constraints = $previous;
    }
}
```

Sources: [src/Illuminate/Database/Eloquent/Relations/Relation.php:59-64](https://github.com/laravel/framework/blob/main/src/Illuminate/Database/Eloquent/Relations/Relation.php#L59-L64), [src/Illuminate/Database/Eloquent/Relations/Relation.php:109-123](https://github.com/laravel/framework/blob/main/src/Illuminate/Database/Eloquent/Relations/Relation.php#L109-L123)

Polymorphic mapping utilities on `Relation` manage type-to-class alias resolution. The framework maintains `static::$morphMap` and supports strict alias lookups via `getMorphAlias()`, custom model mapping through `getMorphedModel()`, and enforcement via `enforceMorphMap()`.

| Morph Method | Arguments | Purpose |
| --- | --- | --- |
| `morphMap` | `?array $map, bool $merge = true` | Sets or gets the table-keyed or model-listed morph map array. |
| `enforceMorphMap` | `array $map, bool $merge = true` | Requires all polymorphic models to be explicitly mapped and registers the map. |
| `getMorphedModel` | `string $alias` | Retrieves the model class name associated with a custom polymorphic alias. |
| `getMorphAlias` | `string $className` | Retrieves the registered alias string for a given model class name. |

Sources: [src/Illuminate/Database/Eloquent/Relations/Relation.php:66-78](https://github.com/laravel/framework/blob/main/src/Illuminate/Database/Eloquent/Relations/Relation.php#L66-L78), [src/Illuminate/Database/Eloquent/Relations/Relation.php:437-523](https://github.com/laravel/framework/blob/main/src/Illuminate/Database/Eloquent/Relations/Relation.php#L437-L523)

## HasOne and HasMany Execution Logic

### Overview

The `HasOneOrMany` abstract class serves as the foundation for both one-to-one (`HasOne`, `MorphOne`) and one-to-many (`HasMany`, `MorphMany`) relationships. It incorporates both `InteractsWithDictionary` and `SupportsInverseRelations` to manage eager-load matching, key dictionaries, and persistence operations.

Sources: [src/Illuminate/Database/Eloquent/Relations/HasOneOrMany.php:21-24](https://github.com/laravel/framework/blob/main/src/Illuminate/Database/Eloquent/Relations/HasOneOrMany.php#L21-L24)

### Dictionary Creation and Matching Logic

During eager loading, `HasOneOrMany` constructs a lookup dictionary via `buildDictionary()`, iterating over the collection results and grouping items by their foreign key value. The `matchOneOrMany()` execution path retrieves matching entries using `getRelationValue()`, dispatching either `reset()` for single models or `newCollection()` for many relations.

```php
protected function matchOneOrMany(array $models, EloquentCollection $results, $relation, $type)
{
    $dictionary = $this->buildDictionary($results);

    foreach ($models as $model) {
        $key = $this->getDictionaryKey($model->getAttribute($this->localKey));

        if ($key !== null && isset($dictionary[$key])) {
            $related = $this->getRelationValue($dictionary, $key, $type);

            $model->setRelation($relation, $related);

            $type === 'one'
                ? $this->applyInverseRelationToModel($related, $model)
                : $this->applyInverseRelationToCollection($related, $model);
        }
    }

    return $models;
}
```

Sources: [src/Illuminate/Database/Eloquent/Relations/HasOneOrMany.php:150-173](https://github.com/laravel/framework/blob/main/src/Illuminate/Database/Eloquent/Relations/HasOneOrMany.php#L150-L173), [src/Illuminate/Database/Eloquent/Relations/HasOneOrMany.php:183-188](https://github.com/laravel/framework/blob/main/src/Illuminate/Database/Eloquent/Relations/HasOneOrMany.php#L183-L188)

> [!NOTE]
> When `createOrFirst()` encounters a `UniqueConstraintViolationException`, it automatically opens a savepoint if needed, catches the violation, switches to the write PDO connection, and queries for the existing record.

Sources: [src/Illuminate/Database/Eloquent/Relations/HasOneOrMany.php:282-289](https://github.com/laravel/framework/blob/main/src/Illuminate/Database/Eloquent/Relations/HasOneOrMany.php#L282-L289)

### Persistence and Instantiation Methods

`HasOneOrMany` provides numerous creation and persistence helpers that automatically inject foreign attributes and apply inverse relations.

| Method | Signature | Purpose |
| --- | --- | --- |
| `make` | `array $attributes = []` | Creates an un-saved instance of the related model with foreign attributes set. |
| `makeMany` | `iterable $records` | Iterates over records, returning a collection of un-saved related models. |
| `save` | `Model $model` | Attaches and saves a model instance to the parent model. |
| `create` | `array $attributes = []` | Instantiates, populates foreign keys, saves, and applies inverse relations. |
| `forceCreate` | `array $attributes = []` | Bypasses mass-assignment protection to create and persist a related model. |
| `updateOrCreate` | `array $attributes, Closure\|array $values = []` | Finds or creates a record matching attributes, then updates it with values. |

Sources: [src/Illuminate/Database/Eloquent/Relations/HasOneOrMany.php:61-67](https://github.com/laravel/framework/blob/main/src/Illuminate/Database/Eloquent/Relations/HasOneOrMany.php#L61-L67), [src/Illuminate/Database/Eloquent/Relations/HasOneOrMany.php:75-84](https://github.com/laravel/framework/blob/main/src/Illuminate/Database/Eloquent/Relations/HasOneOrMany.php#L75-L84), [src/Illuminate/Database/Eloquent/Relations/HasOneOrMany.php:334-339](https://github.com/laravel/framework/blob/main/src/Illuminate/Database/Eloquent/Relations/HasOneOrMany.php#L334-L339), [src/Illuminate/Database/Eloquent/Relations/HasOneOrMany.php:388-397](https://github.com/laravel/framework/blob/main/src/Illuminate/Database/Eloquent/Relations/HasOneOrMany.php#L388-L397), [src/Illuminate/Database/Eloquent/Relations/HasOneOrMany.php:416-421](https://github.com/laravel/framework/blob/main/src/Illuminate/Database/Eloquent/Relations/HasOneOrMany.php#L416-L421), [src/Illuminate/Database/Eloquent/Relations/HasOneOrMany.php:298-305](https://github.com/laravel/framework/blob/main/src/Illuminate/Database/Eloquent/Relations/HasOneOrMany.php#L298-L305)

## Querying and Eager Loading Relations

### Overview

Eloquent query builders (`Illuminate\Database\Eloquent\Builder`) and relationship instances (`Illuminate\Database\Eloquent\Relations\Relation`) collaborate closely to parse eager loads, enforce relationship existence constraints, and constrain queries based on related model states.

Sources: [src/Illuminate/Database/Eloquent/Builder.php:65-70](https://github.com/laravel/framework/blob/main/src/Illuminate/Database/Eloquent/Builder.php#L65-L70), [src/Illuminate/Database/Eloquent/Relations/Relation.php:249-271](https://github.com/laravel/framework/blob/main/src/Illuminate/Database/Eloquent/Relations/Relation.php#L249-L271)

### Eager Load Parsing and Constraint Integration

When developers pass nested or constrained relationships to queries via `Model::with()` or `Builder::with()`, the builder maintains an `$eagerLoad` array mapping relationship names to their respective customization closures.

```php
public function with($relations, $callback = null)
{
    if ($this->model->hasNamedScope($name)) {
        // ...
    }
    // ...
}
```

When a closure-based `where` clause is evaluated on an Eloquent builder, any nested eager loads defined inside the closure are automatically merged into the parent builder's eager load stack:

```php
$column($query = $this->model->newQueryWithoutRelationships());

$this->eagerLoad = array_merge($this->eagerLoad, $query->getEagerLoads());
```

Sources: [src/Illuminate/Database/Eloquent/Builder.php:355-359](https://github.com/laravel/framework/blob/main/src/Illuminate/Database/Eloquent/Builder.php#L355-L359)

> [!NOTE]
> Relationship existence queries (`has`, `whereHas`) rely on `getRelationExistenceQuery()` or `getRelationExistenceCountQuery()` from the `Relation` class, which inject `count(*)` expressions and qualified column constraints (`whereColumn`) to link parent and related table keys.

Sources: [src/Illuminate/Database/Eloquent/Relations/Relation.php:249-271](https://github.com/laravel/framework/blob/main/src/Illuminate/Database/Eloquent/Relations/Relation.php#L249-L271)

### Primary Key and Scope Builder Helpers

The `Builder` class supplies specialized helper methods for qualifying columns, filtering by primary keys, and dynamically registering or stripping global scopes during query construction.

| Method | Signature | Purpose |
| --- | --- | --- |
| `whereKey` | `mixed $id` | Adds a `where` clause constraining the primary key to a scalar, array, or model instance. |
| `whereKeyNot` | `mixed $id` | Adds an exclusion clause (`!=` or `not in`) for the primary key. |
| `except` | `iterable\|mixed $models` | Excludes specific model instances or collections from query results. |
| `withoutGlobalScope` | `Scope\|string $scope` | Removes a single globally registered scope from the query instance. |
| `withoutGlobalScopes` | `?array $scopes = null` | Removes multiple or all global scopes from the query builder. |

Sources: [src/Illuminate/Database/Eloquent/Builder.php:277-298](https://github.com/laravel/framework/blob/main/src/Illuminate/Database/Eloquent/Builder.php#L277-L298), [src/Illuminate/Database/Eloquent/Builder.php:306-327](https://github.com/laravel/framework/blob/main/src/Illuminate/Database/Eloquent/Builder.php#L306-L327), [src/Illuminate/Database/Eloquent/Builder.php:335-342](https://github.com/laravel/framework/blob/main/src/Illuminate/Database/Eloquent/Builder.php#L335-L342), [src/Illuminate/Database/Eloquent/Builder.php:214-225](https://github.com/laravel/framework/blob/main/src/Illuminate/Database/Eloquent/Builder.php#L214-L225), [src/Illuminate/Database/Eloquent/Builder.php:233-244](https://github.com/laravel/framework/blob/main/src/Illuminate/Database/Eloquent/Builder.php#L233-L244)

## Dynamic Attribute Resolution and Autoloading

### Overview

Eloquent models manage dynamic relationship resolution, in-memory caching via the `$relations` property, recursive tree propagation, and automatic relationship autoloading through methods defined across `Model` and the `HasRelationships` trait.

Sources: [src/Illuminate/Database/Eloquent/Model.php:2723-2726](https://github.com/laravel/framework/blob/main/src/Illuminate/Database/Eloquent/Model.php#L2723-L2726), [src/Illuminate/Database/Eloquent/Concerns/HasRelationships.php:35-56](https://github.com/laravel/framework/blob/main/src/Illuminate/Database/Eloquent/Concerns/HasRelationships.php#L35-L56)

### Dynamic Attribute Access and Resolution

When dynamic properties or methods are accessed on a model instance, PHP invokes `__get()` or `__call()`. The `__get()` method delegates directly to `getAttribute($key)`, which inspects both raw attributes and loaded relations.

```php
public function __get($key)
{
    return $this->getAttribute($key);
}
```

Sources: [src/Illuminate/Database/Eloquent/Model.php:2723-2726](https://github.com/laravel/framework/blob/main/src/Illuminate/Database/Eloquent/Model.php#L2723-L2726)

When a method call does not match an explicit function, `__call()` checks for a dynamic relationship resolver registered via `resolveRelationUsing()`. If defined, the resolver closure is executed with the model instance.

```php
if ($resolver = $this->relationResolver(static::class, $method)) {
    return $resolver($this);
}
```

Sources: [src/Illuminate/Database/Eloquent/Concerns/HasRelationships.php:96-107](https://github.com/laravel/framework/blob/main/src/Illuminate/Database/Eloquent/Concerns/HasRelationships.php#L96-L107), [src/Illuminate/Database/Eloquent/Model.php:2833-2835](https://github.com/laravel/framework/blob/main/src/Illuminate/Database/Eloquent/Model.php#L2833-L2835)

> [!TIP]
> The `relationResolver()` method recursively inspects parent classes using `get_parent_class($class)` if a resolver is not found on the exact model class, ensuring inherited dynamic relationships remain accessible.

Sources: [src/Illuminate/Database/Eloquent/Concerns/HasRelationships.php:96-107](https://github.com/laravel/framework/blob/main/src/Illuminate/Database/Eloquent/Concerns/HasRelationships.php#L96-L107)

### Relationship Caching and Lifecycle Methods

Loaded relationships are stored in the protected `$relations` array. Models provide methods to inspect, set, propagate, and clear these cached relationships without hitting the database.

| Method | Signature | Purpose |
| --- | --- | --- |
| `relationLoaded` | `string $key` | Determines if a given relationship key exists in the `$relations` array. |
| `getRelation` | `string $relation` | Retrieves a specific relationship value from the `$relations` cache. |
| `setRelation` | `string $relation, mixed $value` | Caches a relationship value and propagates autoload callbacks to related models. |
| `unsetRelation` | `string $relation` | Removes a single relationship from the `$relations` cache. |
| `unsetRelations` | `void` | Clears all loaded relationships from the instance. |
| `withoutRelations` | `void` | Clones the model instance and unsets all loaded relationships. |

Sources: [src/Illuminate/Database/Eloquent/Concerns/HasRelationships.php:1091-1104](https://github.com/laravel/framework/blob/main/src/Illuminate/Database/Eloquent/Concerns/HasRelationships.php#L1091-L1104), [src/Illuminate/Database/Eloquent/Concerns/HasRelationships.php:1113-1120](https://github.com/laravel/framework/blob/main/src/Illuminate/Database/Eloquent/Concerns/HasRelationships.php#L1113-L1120), [src/Illuminate/Database/Eloquent/Concerns/HasRelationships.php:1128-1133](https://github.com/laravel/framework/blob/main/src/Illuminate/Database/Eloquent/Concerns/HasRelationships.php#L1128-L1133), [src/Illuminate/Database/Eloquent/Concerns/HasRelationships.php:1194-1199](https://github.com/laravel/framework/blob/main/src/Illuminate/Database/Eloquent/Concerns/HasRelationships.php#L1194-L1199), [src/Illuminate/Database/Eloquent/Concerns/HasRelationships.php:1165-1170](https://github.com/laravel/framework/blob/main/src/Illuminate/Database/Eloquent/Concerns/HasRelationships.php#L1165-L1170)

### Relationship Autoloading Mechanics

Relationship autoloading is managed via `autoloadRelationsUsing()`, `attemptToAutoloadRelation()`, and `propagateRelationAutoloadCallbackToRelation()`. When a callback is assigned, it checks for circular references using `$this->relationAutoloadContext === $context`.

```php
public function autoloadRelationsUsing(Closure $callback, $context = null)
{
    if ($context && $this->relationAutoloadContext === $context) {
        return $this;
    }

    $this->relationAutoloadCallback = $callback;
    $this->relationAutoloadContext = $context;

    foreach ($this->relations as $key => $value) {
        $this->propagateRelationAutoloadCallbackToRelation($key, $value);
    }

    return $this;
}
```

Sources: [src/Illuminate/Database/Eloquent/Concerns/HasRelationships.php:141-156](https://github.com/laravel/framework/blob/main/src/Illuminate/Database/Eloquent/Concerns/HasRelationships.php#L141-L156)

When a relation is set or loaded, `propagateRelationAutoloadCallbackToRelation()` wraps the current model's context and propagates the autoloader down to child models or collections:

```php
protected function propagateRelationAutoloadCallbackToRelation($key, $models)
{
    if (! $this->hasRelationAutoloadCallback() || ! $models) {
        return;
    }

    if ($models instanceof Model) {
        $models = [$models];
    }

    if (! is_iterable($models)) {
        return;
    }

    $callback = fn (array $tuples) => $this->invokeRelationAutoloadCallbackFor($key, $tuples);

    foreach ($models as $model) {
        $model->autoloadRelationsUsing($callback, $this->relationAutoloadContext);
    }
}
```

Sources: [src/Illuminate/Database/Eloquent/Concerns/HasRelationships.php:196-215](https://github.com/laravel/framework/blob/main/src/Illuminate/Database/Eloquent/Concerns/HasRelationships.php#L196-L215)

> [!WARNING]
> During PHP serialization (`__sleep()`), `relationAutoloadCallback` and `relationAutoloadContext` are explicitly nulled out to prevent closure serialization failures, and are re-initialized upon wakeup if automatic eager loading is enabled.

Sources: [src/Illuminate/Database/Eloquent/Model.php:2891-2927](https://github.com/laravel/framework/blob/main/src/Illuminate/Database/Eloquent/Model.php#L2891-L2927)

## Related

- [[Eloquent Models]]

