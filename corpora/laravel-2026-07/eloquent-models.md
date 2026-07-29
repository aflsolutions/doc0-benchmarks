# Eloquent Models

<details>
<summary>Relevant source files</summary>

The following files were used as context for generating this wiki page:

- [src/Illuminate/Database/Eloquent/Model.php](https://github.com/laravel/framework/blob/main/src/Illuminate/Database/Eloquent/Model.php)
- [src/Illuminate/Database/Eloquent/Builder.php](https://github.com/laravel/framework/blob/main/src/Illuminate/Database/Eloquent/Builder.php)
- [src/Illuminate/Database/Eloquent/Concerns/HasAttributes.php](https://github.com/laravel/framework/blob/main/src/Illuminate/Database/Eloquent/Concerns/HasAttributes.php)
</details>

## Overview

Eloquent models serve as the foundational ORM layer in Laravel, providing an active record implementation to interact with underlying database tables. Each model class represents a database table, allowing developers to query, persist, and manipulate relational data through expressive object-oriented interfaces. Models coordinate closely with specialized components such as the Eloquent query builder for constructing statements, trait-driven attribute managers for handling raw storage and mutations, and type casters for seamless transformation between database values and native PHP or custom types. Sources: [src/Illuminate/Database/Eloquent/Model.php:43-55](https://github.com/laravel/framework/blob/main/src/Illuminate/Database/Eloquent/Model.php#L43-L55), [src/Illuminate/Database/Eloquent/Builder.php:36-41](https://github.com/laravel/framework/blob/main/src/Illuminate/Database/Eloquent/Builder.php#L36-L41), [src/Illuminate/Database/Eloquent/Concerns/HasAttributes.php:53-55](https://github.com/laravel/framework/blob/main/src/Illuminate/Database/Eloquent/Concerns/HasAttributes.php#L53-L55)

## Model Instance Lifecycle and Persistence

### Overview

Eloquent models manage the complete lifecycle of persistence operations, transitioning records through instantiation, mass-assignment filling, validation event dispatching, database querying, and record deletion. Every persistence method coordinates closely with event listeners and timestamp maintenance routines to ensure consistent state management across database tables. Sources: [src/Illuminate/Database/Eloquent/Model.php:316-323](https://github.com/laravel/framework/blob/main/src/Illuminate/Database/Eloquent/Model.php#L316-L323)

### Instantiation and Filling

When a model is instantiated, it executes boot sequence checks, trait initializers, model attribute resolutions, and original attribute synchronization before passing input attributes to the `fill()` method. Mass assignment protection governs which attributes are assigned during filling. Sources: [src/Illuminate/Database/Eloquent/Model.php:316-323](https://github.com/laravel/framework/blob/main/src/Illuminate/Database/Eloquent/Model.php#L316-L323)

Attributes submitted to `fill()` are filtered against the model's fillable configuration. If an attribute fails fillable constraints while strict mode or `preventsSilentlyDiscardingAttributes()` is active, a `MassAssignmentException` is thrown or handled via `discardedAttributeViolationCallback`. Sources: [src/Illuminate/Database/Eloquent/Model.php:675-715](https://github.com/laravel/framework/blob/main/src/Illuminate/Database/Eloquent/Model.php#L675-L715)

```php
public function fill(array $attributes)
{
    $totallyGuarded = $this->totallyGuarded();
    $fillable = $this->fillableFromArray($attributes);

    foreach ($fillable as $key => $value) {
        if ($this->isFillable($key)) {
            $this->setAttribute($key, $value);
        } elseif ($totallyGuarded || static::preventsSilentlyDiscardingAttributes()) {
            // Throws MassAssignmentException or triggers callback
        }
    }
    return $this;
}
```
Sources: [src/Illuminate/Database/Eloquent/Model.php:675-715](https://github.com/laravel/framework/blob/main/src/Illuminate/Database/Eloquent/Model.php#L675-L715)

### Saving and Updating Workflow

Persistence operations follow an explicit call sequence depending on whether the model instance already exists in the database. 

The primary saving sequence runs through `save()`:
`save()` → `mergeAttributesFromCachedCasts()` → `fireModelEvent('saving')` → `performUpdate()` or `performInsert()` → `finishSave()` (which triggers `saved`, `touchOwners`, and `syncOriginal`). Sources: [src/Illuminate/Database/Eloquent/Model.php:1380-1421](https://github.com/laravel/framework/blob/main/src/Illuminate/Database/Eloquent/Model.php#L1380-L1421)

For insert operations specifically, the call sequence executes:
`performInsert()` → `usesUniqueIds()` (if applicable) → `fireModelEvent('creating')` → `updateTimestamps()` (if enabled) → `getAttributesForInsert()` → `insertAndSetId()` (for incrementing primary keys) or `query->insert()` → sets `$this->exists = true` and `$this->wasRecentlyCreated = true` → `fireModelEvent('created')`. Sources: [src/Illuminate/Database/Eloquent/Model.php:1578-1625](https://github.com/laravel/framework/blob/main/src/Illuminate/Database/Eloquent/Model.php#L1578-L1625)

> [!NOTE]
> If the `saving`, `creating`, or `updating` model event returns `false`, execution halts immediately and the persistence operation returns `false`, aborting database modifications. Sources: [src/Illuminate/Database/Eloquent/Model.php:1389-1391](https://github.com/laravel/framework/blob/main/src/Illuminate/Database/Eloquent/Model.php#L1389-L1391), [src/Illuminate/Database/Eloquent/Model.php:1499-1501](https://github.com/laravel/framework/blob/main/src/Illuminate/Database/Eloquent/Model.php#L1499-L1501), [src/Illuminate/Database/Eloquent/Model.php:1584-1586](https://github.com/laravel/framework/blob/main/src/Illuminate/Database/Eloquent/Model.php#L1584-L1586)

### Deletion and Destruction

Deleting a model instance invokes lifecycle hooks and owner timestamp propagation before executing database removal.

The deletion call chain runs:
`delete()` → `mergeAttributesFromCachedCasts()` → primary key validation check → `fireModelEvent('deleting')` → `touchOwners()` → `performDeleteOnModel()` → `fireModelEvent('deleted')`. Sources: [src/Illuminate/Database/Eloquent/Model.php:1735-1767](https://github.com/laravel/framework/blob/main/src/Illuminate/Database/Eloquent/Model.php#L1735-L1767)

```php
public function delete()
{
    $this->mergeAttributesFromCachedCasts();

    if (is_null($this->getKeyName())) {
        throw new LogicException('No primary key defined on model.');
    }

    if (! $this->exists) {
        return;
    }

    if ($this->fireModelEvent('deleting') === false) {
        return false;
    }

    $this->touchOwners();
    $this->performDeleteOnModel();
    $this->fireModelEvent('deleted', false);

    return true;
}
```
Sources: [src/Illuminate/Database/Eloquent/Model.php:1735-1767](https://github.com/laravel/framework/blob/main/src/Illuminate/Database/Eloquent/Model.php#L1735-L1767)

### Lifecycle Persistence Options

| Method | Transaction Support | Event Triggering | Description |
| :--- | :--- | :--- | :--- |
| `save()` | No | Yes | Persists current attributes, handling insert or update automatically. Sources: [src/Illuminate/Database/Eloquent/Model.php:1380-1421](https://github.com/laravel/framework/blob/main/src/Illuminate/Database/Eloquent/Model.php#L1380-L1421) |
| `saveOrFail()` | Yes | Yes | Executes `save()` wrapped within a database transaction closure. Sources: [src/Illuminate/Database/Eloquent/Model.php:1466-1469](https://github.com/laravel/framework/blob/main/src/Illuminate/Database/Eloquent/Model.php#L1466-L1469) |
| `saveQuietly()` | No | No | Persists model record without raising model events. Sources: [src/Illuminate/Database/Eloquent/Model.php:1369-1372](https://github.com/laravel/framework/blob/main/src/Illuminate/Database/Eloquent/Model.php#L1369-L1372) |
| `update()` | No | Yes | Fills model with given attributes and saves changes. Sources: [src/Illuminate/Database/Eloquent/Model.php:1151-1158](https://github.com/laravel/framework/blob/main/src/Illuminate/Database/Eloquent/Model.php#L1151-L1158) |
| `updateOrFail()` | Yes | Yes | Fills model and saves changes within a transaction. Sources: [src/Illuminate/Database/Eloquent/Model.php:1169-1176](https://github.com/laravel/framework/blob/main/src/Illuminate/Database/Eloquent/Model.php#L1169-L1176) |
| `updateQuietly()` | No | No | Fills and updates model without raising model events. Sources: [src/Illuminate/Database/Eloquent/Model.php:1185-1192](https://github.com/laravel/framework/blob/main/src/Illuminate/Database/Eloquent/Model.php#L1185-L1192) |
| `delete()` | No | Yes | Removes model record from the database. Sources: [src/Illuminate/Database/Eloquent/Model.php:1735-1767](https://github.com/laravel/framework/blob/main/src/Illuminate/Database/Eloquent/Model.php#L1735-L1767) |
| `deleteOrFail()` | Yes | Yes | Removes model record within a database transaction. Sources: [src/Illuminate/Database/Eloquent/Model.php:1786-1793](https://github.com/laravel/framework/blob/main/src/Illuminate/Database/Eloquent/Model.php#L1786-L1793) |
| `deleteQuietly()` | No | No | Removes model record without raising model events. Sources: [src/Illuminate/Database/Eloquent/Model.php:1774-1777](https://github.com/laravel/framework/blob/main/src/Illuminate/Database/Eloquent/Model.php#L1774-L1777) |

Sources: [src/Illuminate/Database/Eloquent/Model.php:1151-1192](https://github.com/laravel/framework/blob/main/src/Illuminate/Database/Eloquent/Model.php#L1151-L1192), [src/Illuminate/Database/Eloquent/Model.php:1369-1469](https://github.com/laravel/framework/blob/main/src/Illuminate/Database/Eloquent/Model.php#L1369-L1469), [src/Illuminate/Database/Eloquent/Model.php:1735-1793](https://github.com/laravel/framework/blob/main/src/Illuminate/Database/Eloquent/Model.php#L1735-L1793)

## Attribute Management and Mutation

### Overview

Eloquent models store raw database columns internally inside the `$attributes` property array while maintaining a baseline snapshot of their pristine state in the `$original` array. Attribute management governs how raw column values are accessed, set, transformed through traditional accessors or modern `Attribute` return-type definitions, and tracked for dirty state changes prior to database synchronization. Sources: [src/Illuminate/Database/Eloquent/Concerns/HasAttributes.php:53-68](https://github.com/laravel/framework/blob/main/src/Illuminate/Database/Eloquent/Concerns/HasAttributes.php#L53-L68)

### Attribute Access and Mutation Workflow

When reading or writing properties dynamically via magic methods (`__get` and `__set`) or array access offsets, Eloquent evaluates attribute existence and mutators following a strict call sequence. 

The retrieval execution path proceeds as follows:
`getAttribute()` → `hasAttribute()` (checking attributes, casts, traditional get mutators, attribute objects, or class casters) → `getAttributeValue()` → `transformModelValue()` → `getAttributeFromArray()`. Sources: [src/Illuminate/Database/Eloquent/Model.php:2723-2738](https://github.com/laravel/framework/blob/main/src/Illuminate/Database/Eloquent/Model.php#L2723-L2738), [src/Illuminate/Database/Eloquent/Concerns/HasAttributes.php:466-542](https://github.com/laravel/framework/blob/main/src/Illuminate/Database/Eloquent/Concerns/HasAttributes.php#L466-L542)

```php
public function getAttribute($key)
{
    if (! $key) {
        return;
    }

    if ($this->hasAttribute($key)) {
        return $this->getAttributeValue($key);
    }

    if (method_exists(self::class, $key)) {
        return $this->throwMissingAttributeExceptionIfApplicable($key);
    }

    return $this->isRelation($key) || $this->relationLoaded($key)
        ? $this->getRelationValue($key)
        : $this->throwMissingAttributeExceptionIfApplicable($key);
}
```
Sources: [src/Illuminate/Database/Eloquent/Concerns/HasAttributes.php:485-508](https://github.com/laravel/framework/blob/main/src/Illuminate/Database/Eloquent/Concerns/HasAttributes.php#L485-L508)

> [!WARNING]
> If a model is retrieved from the database and `preventAccessingMissingAttributes()` is enabled, accessing an attribute name that exists neither in the underlying attributes nor as a relation throws a `MissingAttributeException` instead of quietly returning `null`. Sources: [src/Illuminate/Database/Eloquent/Concerns/HasAttributes.php:518-528](https://github.com/laravel/framework/blob/main/src/Illuminate/Database/Eloquent/Concerns/HasAttributes.php#L518-L528)

### Attribute State and Dirty Tracking

Eloquent tracks changes by comparing current attributes against the pristine snapshot stored in `$original`. Developers can inspect dirty status, retrieve altered attributes, or synchronize state using specific internal properties and inspection methods.

| Property / Method | Type / Return | Description |
| :--- | :--- | :--- |
| `$attributes` | `array<string, mixed>` | Stores the raw underlying attribute values currently held by the model instance. Sources: [src/Illuminate/Database/Eloquent/Concerns/HasAttributes.php:57-60](https://github.com/laravel/framework/blob/main/src/Illuminate/Database/Eloquent/Concerns/HasAttributes.php#L57-L60) |
| `$original` | `array<string, mixed>` | Holds the pristine baseline snapshot of attributes as fetched from or saved to the database. Sources: [src/Illuminate/Database/Eloquent/Concerns/HasAttributes.php:63-67](https://github.com/laravel/framework/blob/main/src/Illuminate/Database/Eloquent/Concerns/HasAttributes.php#L63-L67) |
| `$changes` | `array<string, mixed>` | Captures the attributes that changed during the most recent save or update operation. Sources: [src/Illuminate/Database/Eloquent/Concerns/HasAttributes.php:70-74](https://github.com/laravel/framework/blob/main/src/Illuminate/Database/Eloquent/Concerns/HasAttributes.php#L70-L74) |
| `$previous` | `array<string, mixed>` | Stores the previous state values corresponding to the recorded `$changes`. Sources: [src/Illuminate/Database/Eloquent/Concerns/HasAttributes.php:77-81](https://github.com/laravel/framework/blob/main/src/Illuminate/Database/Eloquent/Concerns/HasAttributes.php#L77-L81) |
| `$classCastCache` | `array` | Cache repository for instantiated custom class-based casters. Sources: [src/Illuminate/Database/Eloquent/Concerns/HasAttributes.php:91-95](https://github.com/laravel/framework/blob/main/src/Illuminate/Database/Eloquent/Concerns/HasAttributes.php#L91-L95) |
| `$attributeCastCache` | `array` | Cache repository for values returned by modern `Attribute` definitions. Sources: [src/Illuminate/Database/Eloquent/Concerns/HasAttributes.php:98-102](https://github.com/laravel/framework/blob/main/src/Illuminate/Database/Eloquent/Concerns/HasAttributes.php#L98-L102) |

Sources: [src/Illuminate/Database/Eloquent/Concerns/HasAttributes.php:53-103](https://github.com/laravel/framework/blob/main/src/Illuminate/Database/Eloquent/Concerns/HasAttributes.php#L53-L103)

## Attribute Casting and Transformation

### Overview

Attribute casting transforms raw database values into native PHP types, immutable or mutable date objects, JSON structures, collections, enums, or custom-classed casters as they are retrieved or persisted. Eloquent declares a comprehensive list of primitive cast types and supplies string normalization, type resolution, caching, and custom serialization hooks via the `HasAttributes` trait. Sources: [src/Illuminate/Database/Eloquent/Concerns/HasAttributes.php:53-137](https://github.com/laravel/framework/blob/main/src/Illuminate/Database/Eloquent/Concerns/HasAttributes.php#L53-L137), [src/Illuminate/Database/Eloquent/Concerns/HasAttributes.php:848-911](https://github.com/laravel/framework/blob/main/src/Illuminate/Database/Eloquent/Concerns/HasAttributes.php#L848-L911)

### Primitive Cast Types and Resolution

When an attribute is accessed, Eloquent resolves its cast definition using `getCastType()`, which normalizes custom date formats, decimals, and class names. Primitive cast types handle basic scalar and structural conversions directly within `castAttribute()`. If a value is `null` and the cast type is primitive, the null value is returned unmodified. Sources: [src/Illuminate/Database/Eloquent/Concerns/HasAttributes.php:850-854](https://github.com/laravel/framework/blob/main/src/Illuminate/Database/Eloquent/Concerns/HasAttributes.php#L850-L854), [src/Illuminate/Database/Eloquent/Concerns/HasAttributes.php:973-994](https://github.com/laravel/framework/blob/main/src/Illuminate/Database/Eloquent/Concerns/HasAttributes.php#L973-L994)

| Cast Type Identifier | Resolved Type / Behavior | Conversion Mechanism |
| :--- | :--- | :--- |
| `int`, `integer` | Integer | Casts value to `(int) $value`. Sources: [src/Illuminate/Database/Eloquent/Concerns/HasAttributes.php:866-868](https://github.com/laravel/framework/blob/main/src/Illuminate/Database/Eloquent/Concerns/HasAttributes.php#L866-L868) |
| `real`, `float`, `double` | Float | Passes value through `$this->fromFloat($value)`. Sources: [src/Illuminate/Database/Eloquent/Concerns/HasAttributes.php:869-872](https://github.com/laravel/framework/blob/main/src/Illuminate/Database/Eloquent/Concerns/HasAttributes.php#L869-L872) |
| `decimal:<digits>` | Decimal | Converts value using `$this->asDecimal($value, digits)`. Sources: [src/Illuminate/Database/Eloquent/Concerns/HasAttributes.php:873-874](https://github.com/laravel/framework/blob/main/src/Illuminate/Database/Eloquent/Concerns/HasAttributes.php#L873-L874) |
| `string` | String | Casts value to `(string) $value`. Sources: [src/Illuminate/Database/Eloquent/Concerns/HasAttributes.php:875-876](https://github.com/laravel/framework/blob/main/src/Illuminate/Database/Eloquent/Concerns/HasAttributes.php#L875-L876) |
| `bool`, `boolean` | Boolean | Casts value to `(bool) $value`. Sources: [src/Illuminate/Database/Eloquent/Concerns/HasAttributes.php:877-879](https://github.com/laravel/framework/blob/main/src/Illuminate/Database/Eloquent/Concerns/HasAttributes.php#L877-L879) |
| `object` | stdClass Object | Decodes JSON string into an object via `$this->fromJson($value, true)`. Sources: [src/Illuminate/Database/Eloquent/Concerns/HasAttributes.php:880-881](https://github.com/laravel/framework/blob/main/src/Illuminate/Database/Eloquent/Concerns/HasAttributes.php#L880-L881) |
| `array`, `json`, `json:unicode` | Array | Decodes JSON string into an associative array via `$this->fromJson($value)`. Sources: [src/Illuminate/Database/Eloquent/Concerns/HasAttributes.php:882-885](https://github.com/laravel/framework/blob/main/src/Illuminate/Database/Eloquent/Concerns/HasAttributes.php#L882-L885) |
| `collection` | Collection | Wraps decoded JSON array into a `BaseCollection`. Sources: [src/Illuminate/Database/Eloquent/Concerns/HasAttributes.php:886-887](https://github.com/laravel/framework/blob/main/src/Illuminate/Database/Eloquent/Concerns/HasAttributes.php#L886-L887) |
| `date`, `datetime`, `custom_datetime` | Carbon / DateTime | Parses value into a date instance via `asDate()` or `asDateTime()`. Sources: [src/Illuminate/Database/Eloquent/Concerns/HasAttributes.php:888-892](https://github.com/laravel/framework/blob/main/src/Illuminate/Database/Eloquent/Concerns/HasAttributes.php#L888-L892) |
| `immutable_date`, `immutable_datetime`, `immutable_custom_datetime` | CarbonImmutable | Parses date and converts it to immutable variant via `toImmutable()`. Sources: [src/Illuminate/Database/Eloquent/Concerns/HasAttributes.php:893-897](https://github.com/laravel/framework/blob/main/src/Illuminate/Database/Eloquent/Concerns/HasAttributes.php#L893-L897) |
| `timestamp` | Integer Timestamp | Converts value to integer timestamp via `$this->asTimestamp($value)`. Sources: [src/Illuminate/Database/Eloquent/Concerns/HasAttributes.php:898-899](https://github.com/laravel/framework/blob/main/src/Illuminate/Database/Eloquent/Concerns/HasAttributes.php#L898-L899) |

Sources: [src/Illuminate/Database/Eloquent/Concerns/HasAttributes.php:109-137](https://github.com/laravel/framework/blob/main/src/Illuminate/Database/Eloquent/Concerns/HasAttributes.php#L109-L137), [src/Illuminate/Database/Eloquent/Concerns/HasAttributes.php:865-900](https://github.com/laravel/framework/blob/main/src/Illuminate/Database/Eloquent/Concerns/HasAttributes.php#L865-L900)

### Custom Caster Classes and Inbound Mechanics

When an attribute is mapped to a custom class caster, Eloquent delegates retrieval and storage operations to the caster instance via `getClassCastableAttributeValue()` and related methods. 

The execution walkthrough for retrieving a class-castable attribute follows this sequence:
`castAttribute()` → `getClassCastableAttributeValue()` → `resolveCasterClass()` → checks `$classCastCache` unless object caching is disabled (`withoutObjectCaching`) → checks if caster implements `CastsInboundAttributes` (returning raw value if inbound-only, or invoking `$caster->get($this, $key, $value, $this->attributes)`) → caches object instance in `$classCastCache` if caching is enabled and value is an object. Sources: [src/Illuminate/Database/Eloquent/Concerns/HasAttributes.php:906-943](https://github.com/laravel/framework/blob/main/src/Illuminate/Database/Eloquent/Concerns/HasAttributes.php#L906-L943)

```php
protected function getClassCastableAttributeValue($key, $value)
{
    $caster = $this->resolveCasterClass($key);

    $objectCachingDisabled = $caster->withoutObjectCaching ?? false;

    if (isset($this->classCastCache[$key]) && ! $objectCachingDisabled) {
        return $this->classCastCache[$key];
    } else {
        $value = $caster instanceof CastsInboundAttributes
            ? $value
            : $caster->get($this, $key, $value, $this->attributes);

        if ($caster instanceof CastsInboundAttributes ||
            ! is_object($value) ||
            $objectCachingDisabled) {
            unset($this->classCastCache[$key]);
        } else {
            $this->classCastCache[$key] = $value;
        }

        return $value;
    }
}
```
Sources: [src/Illuminate/Database/Eloquent/Concerns/HasAttributes.php:920-943](https://github.com/laravel/framework/blob/main/src/Illuminate/Database/Eloquent/Concerns/HasAttributes.php#L920-L943)

> [!WARNING]
> If a custom caster implements `CastsInboundAttributes`, the `get()` method is entirely bypassed during retrieval, and the raw underlying database attribute value is returned without transformation. Sources: [src/Illuminate/Database/Eloquent/Concerns/HasAttributes.php:929-932](https://github.com/laravel/framework/blob/main/src/Illuminate/Database/Eloquent/Concerns/HasAttributes.php#L929-L932)

### Cast Design Trade-Offs

| Design Choice | Benefit | Cost |
| :--- | :--- | :--- |
| Object caching (`$classCastCache`) | Avoids repeated instantiation overhead of custom casters and complex value objects during model lifecycle access. Sources: [src/Illuminate/Database/Eloquent/Concerns/HasAttributes.php:91-95](https://github.com/laravel/framework/blob/main/src/Illuminate/Database/Eloquent/Concerns/HasAttributes.php#L91-L95) | Holds strong references to cast objects in memory, preventing garbage collection across model property reads. Sources: [src/Illuminate/Database/Eloquent/Concerns/HasAttributes.php:926-939](https://github.com/laravel/framework/blob/main/src/Illuminate/Database/Eloquent/Concerns/HasAttributes.php#L926-L939) |
| Encrypted cast prefix (`encrypted:`) | Automatically transparents encryption and decryption layers on top of primitive or JSON casts. Sources: [src/Illuminate/Database/Eloquent/Concerns/HasAttributes.php:119-123](https://github.com/laravel/framework/blob/main/src/Illuminate/Database/Eloquent/Concerns/HasAttributes.php#L119-L123) | Adds computational overhead of encryption/decryption routines on every read and write operation. Sources: [src/Illuminate/Database/Eloquent/Concerns/HasAttributes.php:859-863](https://github.com/laravel/framework/blob/main/src/Illuminate/Database/Eloquent/Concerns/HasAttributes.php#L859-L863) |
| Cast string normalization (`ensureCastsAreStringValues`) | Supports array-based cast definitions with parameters (e.g. decimals or custom formats) by flattening them into standard colon-separated strings. Sources: [src/Illuminate/Database/Eloquent/Concerns/HasAttributes.php:812-839](https://github.com/laravel/framework/blob/main/src/Illuminate/Database/Eloquent/Concerns/HasAttributes.php#L812-L839) | Requires parsing overhead during trait initialization to inspect array items and enforce `Stringable` contract compliance. Sources: [src/Illuminate/Database/Eloquent/Concerns/HasAttributes.php:209-211](https://github.com/laravel/framework/blob/main/src/Illuminate/Database/Eloquent/Concerns/HasAttributes.php#L209-L211) |

Sources: [src/Illuminate/Database/Eloquent/Concerns/HasAttributes.php:91-95](https://github.com/laravel/framework/blob/main/src/Illuminate/Database/Eloquent/Concerns/HasAttributes.php#L91-L95), [src/Illuminate/Database/Eloquent/Concerns/HasAttributes.php:119-123](https://github.com/laravel/framework/blob/main/src/Illuminate/Database/Eloquent/Concerns/HasAttributes.php#L119-L123), [src/Illuminate/Database/Eloquent/Concerns/HasAttributes.php:209-211](https://github.com/laravel/framework/blob/main/src/Illuminate/Database/Eloquent/Concerns/HasAttributes.php#L209-L211), [src/Illuminate/Database/Eloquent/Concerns/HasAttributes.php:812-839](https://github.com/laravel/framework/blob/main/src/Illuminate/Database/Eloquent/Concerns/HasAttributes.php#L812-L839), [src/Illuminate/Database/Eloquent/Concerns/HasAttributes.php:859-863](https://github.com/laravel/framework/blob/main/src/Illuminate/Database/Eloquent/Concerns/HasAttributes.php#L859-L863), [src/Illuminate/Database/Eloquent/Concerns/HasAttributes.php:926-939](https://github.com/laravel/framework/blob/main/src/Illuminate/Database/Eloquent/Concerns/HasAttributes.php#L926-L939)

## Eloquent Query Builder Integration

### Overview

The Eloquent query builder (`Illuminate\Database\Eloquent\Builder`) acts as a specialized wrapper around the lower-level database query builder (`Illuminate\Database\Query\Builder`). It manages model hydration, relationship eager loading, global scopes, and dynamic method forwarding. Models initialize their query builder via `newModelQuery()`, which instantiates the custom Eloquent builder class (or falls back to `Builder::class`) and links it to the model instance using `setModel()`. Sources: [src/Illuminate/Database/Eloquent/Model.php:1857-1862](https://github.com/laravel/framework/blob/main/src/Illuminate/Database/Eloquent/Model.php#L1857-L1862), [src/Illuminate/Database/Eloquent/Builder.php:36-55](https://github.com/laravel/framework/blob/main/src/Illuminate/Database/Eloquent/Builder.php#L36-L55), [src/Illuminate/Database/Eloquent/Builder.php:2137-2144](https://github.com/laravel/framework/blob/main/src/Illuminate/Database/Eloquent/Builder.php#L2137-L2144)

### Query Execution and Hydration Walkthrough

When retrieving records, the query builder executes through a specific sequence of pipeline methods to convert database rows into active model instances:
1. `get($columns)`: Initiates retrieval by calling `applyScopes()` to inject any registered global constraints. Sources: [src/Illuminate/Database/Eloquent/Builder.php:883-886](https://github.com/laravel/framework/blob/main/src/Illuminate/Database/Eloquent/Builder.php#L883-L886)
2. `getModels($columns)`: Fetches raw records from the underlying query builder via `query->get($columns)` and passes them to `model->hydrate()`. Sources: [src/Illuminate/Database/Eloquent/Builder.php:905-910](https://github.com/laravel/framework/blob/main/src/Illuminate/Database/Eloquent/Builder.php#L905-L910)
3. `hydrate(array $items)`: Iterates over the raw items, instantiating fresh models via `newFromBuilder($item)`, which populates raw attributes and fires the `retrieved` model event. Sources: [src/Illuminate/Database/Eloquent/Model.php:792-803](https://github.com/laravel/framework/blob/main/src/Illuminate/Database/Eloquent/Model.php#L792-L803), [src/Illuminate/Database/Eloquent/Builder.php:469-482](https://github.com/laravel/framework/blob/main/src/Illuminate/Database/Eloquent/Builder.php#L469-L482)
4. `eagerLoadRelations($models)`: Processes any specified eager loading constraints (`$eagerLoad`), populating related models to resolve N+1 query performance issues. Sources: [src/Illuminate/Database/Eloquent/Builder.php:890-892](https://github.com/laravel/framework/blob/main/src/Illuminate/Database/Eloquent/Builder.php#L890-L892), [src/Illuminate/Database/Eloquent/Builder.php:918-930](https://github.com/laravel/framework/blob/main/src/Illuminate/Database/Eloquent/Builder.php#L918-L930)
5. `applyAfterQueryCallbacks($result)`: Runs post-query modification callbacks before returning the final `EloquentCollection`. Sources: [src/Illuminate/Database/Eloquent/Builder.php:894-896](https://github.com/laravel/framework/blob/main/src/Illuminate/Database/Eloquent/Builder.php#L894-L896), [src/Illuminate/Database/Eloquent/Builder.php:1044-1051](https://github.com/laravel/framework/blob/main/src/Illuminate/Database/Eloquent/Builder.php#L1044-L1051)

Sources: [src/Illuminate/Database/Eloquent/Model.php:792-803](https://github.com/laravel/framework/blob/main/src/Illuminate/Database/Eloquent/Model.php#L792-L803), [src/Illuminate/Database/Eloquent/Builder.php:469-482](https://github.com/laravel/framework/blob/main/src/Illuminate/Database/Eloquent/Builder.php#L469-L482), [src/Illuminate/Database/Eloquent/Builder.php:883-910](https://github.com/laravel/framework/blob/main/src/Illuminate/Database/Eloquent/Builder.php#L883-L910), [src/Illuminate/Database/Eloquent/Builder.php:918-930](https://github.com/laravel/framework/blob/main/src/Illuminate/Database/Eloquent/Builder.php#L918-L930), [src/Illuminate/Database/Eloquent/Builder.php:1044-1051](https://github.com/laravel/framework/blob/main/src/Illuminate/Database/Eloquent/Builder.php#L1044-L1051)

> [!NOTE]
> When executing nested eager loads, intermediate relation loaders are skipped at the top level and instead configured as query constraints on the relation's query instance so they are correctly hydrated during sub-query execution. Sources: [src/Illuminate/Database/Eloquent/Builder.php:920-927](https://github.com/laravel/framework/blob/main/src/Illuminate/Database/Eloquent/Builder.php#L920-L927)

### Passthru Methods and Dynamic Forwarding

The Eloquent builder explicitly separates methods handled directly by the Eloquent implementation from those passed through to the underlying base query builder (`Illuminate\Database\Query\Builder`) via `__call()`. Methods defined in the `$passthru` array or property accesses matching `$propertyPassthru` are forwarded directly to the base query builder or grammar instance.

| Passthru Method / Property | Type | Purpose |
| :--- | :--- | :--- |
| `aggregate`, `average`, `avg`, `count`, `sum`, `max`, `min` | Method | Executes aggregate database functions directly on the underlying query builder. Sources: [src/Illuminate/Database/Eloquent/Builder.php:106-139](https://github.com/laravel/framework/blob/main/src/Illuminate/Database/Eloquent/Builder.php#L106-L139) |
| `exists`, `doesntexist`, `existsor`, `doesntexistor` | Method | Evaluates record existence checks against base query constraints. Sources: [src/Illuminate/Database/Eloquent/Builder.php:106-139](https://github.com/laravel/framework/blob/main/src/Illuminate/Database/Eloquent/Builder.php#L106-L139) |
| `insert`, `insertGetId`, `insertOrIgnore`, `insertUsing`, `insertOrIgnoreUsing` | Method | Performs raw database insertion queries via the base builder. Sources: [src/Illuminate/Database/Eloquent/Builder.php:106-139](https://github.com/laravel/framework/blob/main/src/Illuminate/Database/Eloquent/Builder.php#L106-L139) |
| `toSql`, `toRawSql`, `dd`, `dump`, `ddRawSql`, `dumpRawSql`, `explain` | Method | Inspects or debugging raw SQL generation and execution bindings. Sources: [src/Illuminate/Database/Eloquent/Builder.php:106-139](https://github.com/laravel/framework/blob/main/src/Illuminate/Database/Eloquent/Builder.php#L106-L139) |
| `from` | Property (`$propertyPassthru`) | Direct read access to the underlying query builder's table source definition. Sources: [src/Illuminate/Database/Eloquent/Builder.php:97-100](https://github.com/laravel/framework/blob/main/src/Illuminate/Database/Eloquent/Builder.php#L97-L100), [src/Illuminate/Database/Eloquent/Builder.php:2228-2230](https://github.com/laravel/framework/blob/main/src/Illuminate/Database/Eloquent/Builder.php#L2228-L2230) |

Sources: [src/Illuminate/Database/Eloquent/Builder.php:97-100](https://github.com/laravel/framework/blob/main/src/Illuminate/Database/Eloquent/Builder.php#L97-L100), [src/Illuminate/Database/Eloquent/Builder.php:106-139](https://github.com/laravel/framework/blob/main/src/Illuminate/Database/Eloquent/Builder.php#L106-L139), [src/Illuminate/Database/Eloquent/Builder.php:2228-2230](https://github.com/laravel/framework/blob/main/src/Illuminate/Database/Eloquent/Builder.php#L2228-L2230)

### Builder Design Trade-Offs

| Design Choice | Benefit | Cost |
| :--- | :--- | :--- |
| Explicit method passthru array (`$passthru`) | Avoids expensive dynamic method dispatch overhead by explicitly white-listing high-frequency query builder methods. Sources: [src/Illuminate/Database/Eloquent/Builder.php:106-139](https://github.com/laravel/framework/blob/main/src/Illuminate/Database/Eloquent/Builder.php#L106-L139) | Requires manual maintenance when new base query builder aggregation or inspection methods are added. Sources: [src/Illuminate/Database/Eloquent/Builder.php:2270-2272](https://github.com/laravel/framework/blob/main/src/Illuminate/Database/Eloquent/Builder.php#L2270-L2272) |
| Proxy forwarding via `ForwardsCalls` | Seamlessly exposes low-level query methods without duplicate boilerplate method declarations on the Eloquent builder. Sources: [src/Illuminate/Database/Eloquent/Builder.php:34-39](https://github.com/laravel/framework/blob/main/src/Illuminate/Database/Eloquent/Builder.php#L34-L39) | Obscures static analysis and IDE autocompletion unless supplemented by comprehensive docblock mixins. Sources: [src/Illuminate/Database/Eloquent/Builder.php:2274-2276](https://github.com/laravel/framework/blob/main/src/Illuminate/Database/Eloquent/Builder.php#L2274-L2276) |
| Query cloning on scope application (`applyScopes`) | Prevents global scopes from mutating shared builder state when queries are branched or reused. Sources: [src/Illuminate/Database/Eloquent/Builder.php:1591-1592](https://github.com/laravel/framework/blob/main/src/Illuminate/Database/Eloquent/Builder.php#L1591-L1592) | Allocates duplicate builder and query state objects in memory during execution. Sources: [src/Illuminate/Database/Eloquent/Builder.php:1591-1592](https://github.com/laravel/framework/blob/main/src/Illuminate/Database/Eloquent/Builder.php#L1591-L1592) |

Sources: [src/Illuminate/Database/Eloquent/Builder.php:34-39](https://github.com/laravel/framework/blob/main/src/Illuminate/Database/Eloquent/Builder.php#L34-L39), [src/Illuminate/Database/Eloquent/Builder.php:106-139](https://github.com/laravel/framework/blob/main/src/Illuminate/Database/Eloquent/Builder.php#L106-L139), [src/Illuminate/Database/Eloquent/Builder.php:1591-1592](https://github.com/laravel/framework/blob/main/src/Illuminate/Database/Eloquent/Builder.php#L1591-L1592), [src/Illuminate/Database/Eloquent/Builder.php:2270-2276](https://github.com/laravel/framework/blob/main/src/Illuminate/Database/Eloquent/Builder.php#L2270-L2276)

## Global and Local Query Scoping

### Overview
Query scopes allow you to encapsulate common query constraints into reusable methods or classes on your models. Laravel supports both global scopes, which are automatically applied to every query executed against a model, and local scopes, which provide named query constraints that can be chained fluently when querying.

Sources: [src/Illuminate/Database/Eloquent/Model.php:1880-1887](https://github.com/laravel/framework/blob/main/src/Illuminate/Database/Eloquent/Model.php#L1880-L1887), [src/Illuminate/Database/Eloquent/Builder.php:1546-1578](https://github.com/laravel/framework/blob/main/src/Illuminate/Database/Eloquent/Builder.php#L1546-L1578)

### Global Scopes

#### Overview
Global scopes are registered and applied during query construction. When a new query is instantiated via `newQuery()`, the model registers all configured global scopes onto the query builder instance before returning it. 

Sources: [src/Illuminate/Database/Eloquent/Model.php:1847-1850](https://github.com/laravel/framework/blob/main/src/Illuminate/Database/Eloquent/Model.php#L1847-L1850), [src/Illuminate/Database/Eloquent/Builder.php:197-206](https://github.com/laravel/framework/blob/main/src/Illuminate/Database/Eloquent/Builder.php#L197-L206)

#### Global Scope Execution Walkthrough
The application of global scopes follows a specific call-chain sequence during query building:
1. `Model::newQuery()` invokes `registerGlobalScopes()` on a fresh query instance. Sources: [src/Illuminate/Database/Eloquent/Model.php:1847-1850](https://github.com/laravel/framework/blob/main/src/Illuminate/Database/Eloquent/Model.php#L1847-L1850)
2. `Model::registerGlobalScopes()` iterates through `getGlobalScopes()` and calls `$builder->withGlobalScope($identifier, $scope)`. Sources: [src/Illuminate/Database/Eloquent/Model.php:1880-1887](https://github.com/laravel/framework/blob/main/src/Illuminate/Database/Eloquent/Model.php#L1880-L1887)
3. `Builder::withGlobalScope()` stores the scope in the internal `$scopes` array and invokes `$scope->extend($this)` if the scope defines an extension method. Sources: [src/Illuminate/Database/Eloquent/Builder.php:197-206](https://github.com/laravel/framework/blob/main/src/Illuminate/Database/Eloquent/Builder.php#L197-L206)
4. When `Builder::get()` or `toBase()` runs, `applyScopes()` clones the builder, loops over each registered scope, and executes `callScope()`. Sources: [src/Illuminate/Database/Eloquent/Builder.php:1585-1613](https://github.com/laravel/framework/blob/main/src/Illuminate/Database/Eloquent/Builder.php#L1585-L1613), [src/Illuminate/Database/Eloquent/Builder.php:2038-2041](https://github.com/laravel/framework/blob/main/src/Illuminate/Database/Eloquent/Builder.php#L2038-L2041)
5. `Builder::callScope()` records the initial `wheres` count, executes the scope callback (invoking `$scope->apply($builder, $this->getModel())`), and if new `where` clauses were added, groups them within a nested query container using `addNewWheresWithinGroup()`. Sources: [src/Illuminate/Database/Eloquent/Builder.php:1625-1644](https://github.com/laravel/framework/blob/main/src/Illuminate/Database/Eloquent/Builder.php#L1625-L1644)

Sources: [src/Illuminate/Database/Eloquent/Model.php:1847-1850](https://github.com/laravel/framework/blob/main/src/Illuminate/Database/Eloquent/Model.php#L1847-L1850), [src/Illuminate/Database/Eloquent/Model.php:1880-1887](https://github.com/laravel/framework/blob/main/src/Illuminate/Database/Eloquent/Model.php#L1880-L1887), [src/Illuminate/Database/Eloquent/Builder.php:197-206](https://github.com/laravel/framework/blob/main/src/Illuminate/Database/Eloquent/Builder.php#L197-L206), [src/Illuminate/Database/Eloquent/Builder.php:1585-1613](https://github.com/laravel/framework/blob/main/src/Illuminate/Database/Eloquent/Builder.php#L1585-L1613), [src/Illuminate/Database/Eloquent/Builder.php:1625-1644](https://github.com/laravel/framework/blob/main/src/Illuminate/Database/Eloquent/Builder.php#L1625-L1644), [src/Illuminate/Database/Eloquent/Builder.php:2038-2041](https://github.com/laravel/framework/blob/main/src/Illuminate/Database/Eloquent/Builder.php#L2038-L2041)

> [!WARNING]
> When global scopes add complex `or` conditions, `applyScopes()` automatically slices and wraps new `where` constraints into a nested `where` group (`createNestedWhere()`) to preserve logical operator precedence. Sources: [src/Illuminate/Database/Eloquent/Builder.php:1634-1684](https://github.com/laravel/framework/blob/main/src/Illuminate/Database/Eloquent/Builder.php#L1634-L1684)

### Local Scopes and Named Scopes
Local scopes allow you to define generic sets of constraints on your model that you may easily re-use throughout your application. Local scopes can be defined using conventional `scope...` method prefixes or by attaching the `\Illuminate\Database\Eloquent\Attributes\Scope` attribute to a method.

Sources: [src/Illuminate/Database/Eloquent/Model.php:1987-2024](https://github.com/laravel/framework/blob/main/src/Illuminate/Database/Eloquent/Model.php#L1987-L2024)

| Scope Inspection / Invocation Method | Target Class | Purpose |
| :--- | :--- | :--- |
| `hasNamedScope($scope)` | `Model` / `Builder` | Determines if a model or builder instance has a matching `scope...` method or a method annotated with the `LocalScope` attribute. Sources: [src/Illuminate/Database/Eloquent/Model.php:1987-1991](https://github.com/laravel/framework/blob/main/src/Illuminate/Database/Eloquent/Model.php#L1987-L1991), [src/Illuminate/Database/Eloquent/Builder.php:1546-1549](https://github.com/laravel/framework/blob/main/src/Illuminate/Database/Eloquent/Builder.php#L1546-L1549) |
| `callNamedScope($scope, $parameters)` | `Model` | Executes the named scope method dynamically, supporting both attribute-annotated and conventional `scope` prefixes. Sources: [src/Illuminate/Database/Eloquent/Model.php:2000-2007](https://github.com/laravel/framework/blob/main/src/Illuminate/Database/Eloquent/Model.php#L2000-L2007) |
| `scopes($scopes)` | `Builder` | Applies an array or list of local named scopes sequentially to the builder instance, handling parameter unpacking for integer-indexed definitions. Sources: [src/Illuminate/Database/Eloquent/Builder.php:1557-1578](https://github.com/laravel/framework/blob/main/src/Illuminate/Database/Eloquent/Builder.php#L1557-L1578) |

Sources: [src/Illuminate/Database/Eloquent/Model.php:1987-2007](https://github.com/laravel/framework/blob/main/src/Illuminate/Database/Eloquent/Model.php#L1987-L2007), [src/Illuminate/Database/Eloquent/Builder.php:1546-1578](https://github.com/laravel/framework/blob/main/src/Illuminate/Database/Eloquent/Builder.php#L1546-L1578)

## Related

- [[Section 4 Database]]
- [[Eloquent Relationships]]
- [[Attribute Casting & Enums]]

