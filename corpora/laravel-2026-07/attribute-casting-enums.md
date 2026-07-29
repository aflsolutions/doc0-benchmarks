# Attribute Casting & Enums

<details>
<summary>Relevant source files</summary>

The following files were used as context for generating this wiki page:

- [src/Illuminate/Database/Eloquent/Concerns/HasAttributes.php](https://github.com/laravel/framework/blob/main/src/Illuminate/Database/Eloquent/Concerns/HasAttributes.php)
- [src/Illuminate/Database/Eloquent/Model.php](https://github.com/laravel/framework/blob/main/src/Illuminate/Database/Eloquent/Model.php)
- [src/Illuminate/Database/Eloquent/Casts/AsEnumArrayObject.php](https://github.com/laravel/framework/blob/main/src/Illuminate/Database/Eloquent/Casts/AsEnumArrayObject.php)
- [src/Illuminate/Database/Eloquent/Casts/AsEnumCollection.php](https://github.com/laravel/framework/blob/main/src/Illuminate/Database/Eloquent/Casts/AsEnumCollection.php)
- [src/Illuminate/Database/Eloquent/Casts/AsFluent.php](https://github.com/laravel/framework/blob/main/src/Illuminate/Database/Eloquent/Casts/AsFluent.php)
- [src/Illuminate/Database/Eloquent/Casts/AsBinary.php](https://github.com/laravel/framework/blob/main/src/Illuminate/Database/Eloquent/Casts/AsBinary.php)
- [src/Illuminate/Database/Eloquent/Casts/AsStringable.php](https://github.com/laravel/framework/blob/main/src/Illuminate/Database/Eloquent/Casts/AsStringable.php)
- [src/Illuminate/Contracts/Database/Eloquent/SerializesCastableAttributes.php](https://github.com/laravel/framework/blob/main/src/Illuminate/Contracts/Database/Eloquent/SerializesCastableAttributes.php)
- [src/Illuminate/Database/Eloquent/Casts/Json.php](https://github.com/laravel/framework/blob/main/src/Illuminate/Database/Eloquent/Casts/Json.php)
- [types/Database/Eloquent/Casts/Castable.php](https://github.com/laravel/framework/blob/main/types/Database/Eloquent/Casts/Castable.php)
- [src/Illuminate/Contracts/Database/Eloquent/CastsAttributes.php](https://github.com/laravel/framework/blob/main/src/Illuminate/Contracts/Database/Eloquent/CastsAttributes.php)
- [types/Database/Eloquent/Casts/CastsAttributes.php](https://github.com/laravel/framework/blob/main/types/Database/Eloquent/Casts/CastsAttributes.php)
- [src/Illuminate/Database/Eloquent/Casts/AsArrayObject.php](https://github.com/laravel/framework/blob/main/src/Illuminate/Database/Eloquent/Casts/AsArrayObject.php)
- [src/Illuminate/Database/Eloquent/Casts/Attribute.php](https://github.com/laravel/framework/blob/main/src/Illuminate/Database/Eloquent/Casts/Attribute.php)
</details>

## Overview

Attribute casting and enums in Eloquent provide a robust data transformation layer that seamlessly converts database column values into rich PHP types and structures during retrieval and serialization. By bridging the gap between database primitives and domain models, this mechanism solves the friction of handling dates, JSON objects, cryptographic encryption, hashes, native enums, and custom data structures without manual transformations inside controllers or repositories. Core components such as the `HasAttributes` trait and `Model` class orchestrate internal control flows including attribute casting pipelines, accessor and mutator resolution, and dirty state tracking. Contracts like `CastsAttributes`, `Castable`, and `SerializesCastableAttributes` standardize custom caster implementations and serialization behavior across built-in object structures like `AsArrayObject`, `AsCollection`, `AsFluent`, `AsStringable`, `AsBinary`, and native enumeration classes.

Sources: [src/Illuminate/Database/Eloquent/Concerns/HasAttributes.php:1-53](https://github.com/laravel/framework/blob/main/src/Illuminate/Database/Eloquent/Concerns/HasAttributes.php#L1-L53), [src/Illuminate/Database/Eloquent/Concerns/HasAttributes.php:846-911](https://github.com/laravel/framework/blob/main/src/Illuminate/Database/Eloquent/Concerns/HasAttributes.php#L846-L911), [src/Illuminate/Database/Eloquent/Concerns/HasAttributes.php:1076-1134](https://github.com/laravel/framework/blob/main/src/Illuminate/Database/Eloquent/Concerns/HasAttributes.php#L1076-L1134); [src/Illuminate/Database/Eloquent/Model.php:43-55](https://github.com/laravel/framework/blob/main/src/Illuminate/Database/Eloquent/Model.php#L43-L55); [src/Illuminate/Contracts/Database/Eloquent/CastsAttributes.php:11-34](https://github.com/laravel/framework/blob/main/src/Illuminate/Contracts/Database/Eloquent/CastsAttributes.php#L11-L34); [src/Illuminate/Contracts/Database/Eloquent/SerializesCastableAttributes.php:7-19](https://github.com/laravel/framework/blob/main/src/Illuminate/Contracts/Database/Eloquent/SerializesCastableAttributes.php#L7-L19); [types/Database/Eloquent/Casts/Castable.php:1-38](https://github.com/laravel/framework/blob/main/types/Database/Eloquent/Casts/Castable.php#L1-L38)

## Core Attribute Casting Pipeline

### Overview

The core attribute casting pipeline is responsible for intercepting raw database values and transforming them into desired PHP types and structures when attributes are accessed or assigned on an Eloquent model. Orchestrated primarily through the `HasAttributes` trait and the `Model` base class, this pipeline controls how primitive database columns, encrypted payloads, JSON structures, dates, enums, and custom classes flow between storage representation and application-layer objects.

Sources: [src/Illuminate/Database/Eloquent/Concerns/HasAttributes.php:53-138](https://github.com/laravel/framework/blob/main/src/Illuminate/Database/Eloquent/Concerns/HasAttributes.php#L53-L138), [src/Illuminate/Database/Eloquent/Concerns/HasAttributes.php:846-911](https://github.com/laravel/framework/blob/main/src/Illuminate/Database/Eloquent/Concerns/HasAttributes.php#L846-L911), [src/Illuminate/Database/Eloquent/Concerns/HasAttributes.php:1076-1134](https://github.com/laravel/framework/blob/main/src/Illuminate/Database/Eloquent/Concerns/HasAttributes.php#L1076-L1134)

### Control Flow and Call-Chain Execution

When a model property is retrieved via `$model->key` or `__get()`, execution flows through a precise sequence of methods in `HasAttributes`:

`__get()` → `getAttribute()` → `getAttributeValue()` → `transformModelValue()` → `castAttribute()`

1. **`__get($key)`**: Intercepts dynamic property access on the model and delegates immediately to `getAttribute($key)`.
2. **`getAttribute($key)`**: Determines if the key represents a valid attribute, cast, mutator, or relationship. If it qualifies as an attribute or cast, it invokes `getAttributeValue($key)`.
3. **`getAttributeValue($key)`**: Fetches the raw value from the underlying array via `getAttributeFromArray($key)` and passes both key and value to `transformModelValue($key, $value)`.
4. **`transformModelValue($key, $value)`**: Checks for `get` mutators, attribute mutators, casts, or dates. If a cast is defined, it delegates to `castAttribute($key, $value)`.
5. **`castAttribute($key, $value)`**: Resolves the cast type via `getCastType($key)`, handles primitive type widening, decrypts encrypted payloads if necessary, and casts the value into its final representation (such as `int`, `float`, `object`, `array`, `collection`, `date`, or custom classes).

Sources: [src/Illuminate/Database/Eloquent/Concerns/HasAttributes.php:485-555](https://github.com/laravel/framework/blob/main/src/Illuminate/Database/Eloquent/Concerns/HasAttributes.php#L485-L555), [src/Illuminate/Database/Eloquent/Concerns/HasAttributes.php:846-911](https://github.com/laravel/framework/blob/main/src/Illuminate/Database/Eloquent/Concerns/HasAttributes.php#L846-L911), [src/Illuminate/Database/Eloquent/Concerns/HasAttributes.php:973-994](https://github.com/laravel/framework/blob/main/src/Illuminate/Database/Eloquent/Concerns/HasAttributes.php#L973-L994), [src/Illuminate/Database/Eloquent/Concerns/HasAttributes.php:2399-2439](https://github.com/laravel/framework/blob/main/src/Illuminate/Database/Eloquent/Concerns/HasAttributes.php#L2399-L2439); [src/Illuminate/Database/Eloquent/Model.php:2723-2726](https://github.com/laravel/framework/blob/main/src/Illuminate/Database/Eloquent/Model.php#L2723-L2726)

> [!NOTE]
> Primitive cast types like `int`, `string`, `bool`, and `array` will immediately return `null` if the raw database value is `null`, bypassing further transformation logic inside `castAttribute`.
> Sources: [src/Illuminate/Database/Eloquent/Concerns/HasAttributes.php:852-854](https://github.com/laravel/framework/blob/main/src/Illuminate/Database/Eloquent/Concerns/HasAttributes.php#L852-L854)

### Primitive Cast Types

Eloquent supports a broad set of built-in primitive and composite cast types out-of-the-box. The `HasAttributes::$primitiveCastTypes` property registers the valid identifiers recognized during cast resolution.

| Cast Identifier | Resolved Internal Type / Behavior | Conversion Target |
| :--- | :--- | :--- |
| `int`, `integer` | `int` | Casts value to native integer |
| `real`, `float`, `double` | `float` | Parses floats, handles `Infinity`, `-Infinity`, and `NaN` strings |
| `decimal:<digits>` | `decimal` | Converts to string via `Brick\Math\BigDecimal` using scale and `RoundingMode::HalfUp` |
| `string` | `string` | Casts value to native string |
| `bool`, `boolean` | `bool` | Casts value to native boolean |
| `object` | `object` | Decodes JSON string into standard `stdClass` object |
| `array`, `json`, `json:unicode` | `array` | Decodes JSON string into associative array (with optional unicode unescaping flags) |
| `collection` | `collection` | Decodes JSON string and wraps in an `Illuminate\Support\Collection` instance |
| `date`, `datetime`, `custom_datetime` | `datetime` | Parses value into a `Carbon` or `CarbonImmutable` instance |
| `timestamp` | `timestamp` | Converts date or numeric value into a Unix integer timestamp |
| `encrypted`, `encrypted:array`, etc. | `encrypted` | Decrypts stored payload using `Encrypter` before applying inner cast |
| `hashed` | `hashed` | Automatically hashes plain-text values using `Hash` facade on assignment |

Sources: [src/Illuminate/Database/Eloquent/Concerns/HasAttributes.php:109-137](https://github.com/laravel/framework/blob/main/src/Illuminate/Database/Eloquent/Concerns/HasAttributes.php#L109-L137), [src/Illuminate/Database/Eloquent/Concerns/HasAttributes.php:865-900](https://github.com/laravel/framework/blob/main/src/Illuminate/Database/Eloquent/Concerns/HasAttributes.php#L865-L900)

### Design Trade-Offs in Attribute Transformation

| Design Choice | Benefit | Cost |
| :--- | :--- | :--- |
| **On-demand transformation via `transformModelValue()`** | Keeps memory overhead low by deferring type instantiation until properties are explicitly read. | Repeated type instantiation or parsing overhead if attributes are accessed multiple times without caching. |
| **Automatic Primary Key type inclusion** | Guarantees models with auto-incrementing keys automatically treat primary keys as integers or appropriate key types without explicit declarations. | Implicitly modifies the `casts` array, which can occasionally conflict with custom key representation requirements. |
| **Cached class and attribute cast arrays (`classCastCache`, `attributeCastCache`)** | Prevents redundant object instantiation and state loss across repeated reads of complex custom casters and Attribute objects. | Requires careful cache invalidation and merging during save, update, and mass assignment operations. |

Sources: [src/Illuminate/Database/Eloquent/Concerns/HasAttributes.php:95-103](https://github.com/laravel/framework/blob/main/src/Illuminate/Database/Eloquent/Concerns/HasAttributes.php#L95-L103), [src/Illuminate/Database/Eloquent/Concerns/HasAttributes.php:743-762](https://github.com/laravel/framework/blob/main/src/Illuminate/Database/Eloquent/Concerns/HasAttributes.php#L743-L762), [src/Illuminate/Database/Eloquent/Concerns/HasAttributes.php:920-943](https://github.com/laravel/framework/blob/main/src/Illuminate/Database/Eloquent/Concerns/HasAttributes.php#L920-L943), [src/Illuminate/Database/Eloquent/Concerns/HasAttributes.php:1715-1720](https://github.com/laravel/framework/blob/main/src/Illuminate/Database/Eloquent/Concerns/HasAttributes.php#L1715-L1720)

## Custom Cast Interfaces and Contracts

### Overview

Custom cast development relies on dedicated contracts and interfaces that dictate how attributes are retrieved, stored, and serialized. The `Illuminate\Contracts\Database\Eloquent\CastsAttributes` interface defines the core transformation contract using template types (`TGet` and `TSet`), while `Illuminate\Contracts\Database\Eloquent\SerializesCastableAttributes` provides optional array serialization behavior.

Sources: [src/Illuminate/Contracts/Database/Eloquent/CastsAttributes.php:1-34](https://github.com/laravel/framework/blob/main/src/Illuminate/Contracts/Database/Eloquent/CastsAttributes.php#L1-L34); [src/Illuminate/Contracts/Database/Eloquent/SerializesCastableAttributes.php:7-19](https://github.com/laravel/framework/blob/main/src/Illuminate/Contracts/Database/Eloquent/SerializesCastableAttributes.php#L7-L19)

### Custom Cast Interfaces and Methods

Custom casters must implement specific methods depending on whether they handle retrieval, persistence, or serialization. The table below outlines the methods required by each contract.

| Interface | Method Signature | Purpose |
| :--- | :--- | :--- |
| `CastsAttributes` | `get(Model $model, string $key, mixed $value, array $attributes)` | Transforms raw database attributes into custom PHP object types (`TGet|null`). |
| `CastsAttributes` | `set(Model $model, string $key, mixed $value, array $attributes)` | Transforms model assignment values back into underlying database-compatible types (`mixed`). |
| `SerializesCastableAttributes` | `serialize(Model $model, string $key, mixed $value, array $attributes)` | Controls how cast objects are serialized when converting the parent model to an array. |

Sources: [src/Illuminate/Contracts/Database/Eloquent/CastsAttributes.php:11-34](https://github.com/laravel/framework/blob/main/src/Illuminate/Contracts/Database/Eloquent/CastsAttributes.php#L11-L34); [src/Illuminate/Contracts/Database/Eloquent/SerializesCastableAttributes.php:7-19](https://github.com/laravel/framework/blob/main/src/Illuminate/Contracts/Database/Eloquent/SerializesCastableAttributes.php#L7-L19)

> [!NOTE]
> The `CastsAttributes` interface uses PHPStan templates `@template TGet` and `@template TSet` to enforce strict type guarantees when retrieving values from models or passing assignment values via `set()`.
> Sources: [src/Illuminate/Contracts/Database/Eloquent/CastsAttributes.php:7-10](https://github.com/laravel/framework/blob/main/src/Illuminate/Contracts/Database/Eloquent/CastsAttributes.php#L7-L10)

### Custom Cast Implementation Example

The following example implements `CastsAttributes` to manage a `Stringable` object lifecycle, demonstrating how values are received, assigned, and processed according to contract signatures.

```php
use Illuminate\Contracts\Database\Eloquent\CastsAttributes;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;
use Illuminate\Support\Stringable;

/**
 * @implements CastsAttributes<Stringable, string|Stringable>
 */
class AsStringableCaster implements CastsAttributes
{
    public function get(Model $model, string $key, mixed $value, array $attributes): ?Stringable
    {
        return isset($value) ? Str::of($value) : null;
    }

    public function set(Model $model, string $key, mixed $value, array $attributes): ?string
    {
        if ($value instanceof Stringable) {
            return (string) $value;
        }

        return $value;
    }
}
```

Sources: [src/Illuminate/Contracts/Database/Eloquent/CastsAttributes.php:11-34](https://github.com/laravel/framework/blob/main/src/Illuminate/Contracts/Database/Eloquent/CastsAttributes.php#L11-L34); [types/Database/Eloquent/Casts/CastsAttributes.php:1-12](https://github.com/laravel/framework/blob/main/types/Database/Eloquent/Casts/CastsAttributes.php#L1-L12)

## Built-in Object and Structure Casts

### Built-in Object and Structure Casts

### Overview

Eloquent provides built-in `Castable` implementations that transform database scalar attributes into specialized PHP structures and objects. These include `AsFluent`, `AsStringable`, `AsBinary`, and `AsArrayObject`. Each class implements `Illuminate\Contracts\Database\Eloquent\Castable` via its static `castUsing` method, returning an anonymous `CastsAttributes` instance that defines retrieval, persistence, and serialization logic.

Sources: [src/Illuminate/Database/Eloquent/Casts/AsFluent.php:9-31](https://github.com/laravel/framework/blob/main/src/Illuminate/Database/Eloquent/Casts/AsFluent.php#L9-L31); [src/Illuminate/Database/Eloquent/Casts/AsBinary.php:10-50](https://github.com/laravel/framework/blob/main/src/Illuminate/Database/Eloquent/Casts/AsBinary.php#L10-L50); [src/Illuminate/Database/Eloquent/Casts/AsStringable.php:9-31](https://github.com/laravel/framework/blob/main/src/Illuminate/Database/Eloquent/Casts/AsStringable.php#L9-L31); [src/Illuminate/Database/Eloquent/Casts/AsArrayObject.php:8-41](https://github.com/laravel/framework/blob/main/src/Illuminate/Database/Eloquent/Casts/AsArrayObject.php#L8-L41)

### Structure Cast Classes and Methods

The built-in structure cast classes supply specific static factories and helper methods to instantiate or configure their underlying codec behaviors.

| Class | Method | Return Type | Purpose |
| :--- | :--- | :--- | :--- |
| `AsFluent` | `castUsing(array $arguments)` | `CastsAttributes` | Instantiates anonymous caster for `Fluent` objects backed by JSON-encoded strings. |
| `AsStringable` | `castUsing(array $arguments)` | `CastsAttributes` | Instantiates anonymous caster for `Stringable` text attributes. |
| `AsBinary` | `castUsing(array $arguments)` | `CastsAttributes` | Instantiates binary codec caster, validating the provided format against `BinaryCodec::formats()`. |
| `AsBinary` | `uuid()` | `string` | Returns the alias string `Illuminate\Database\Eloquent\Casts\AsBinary:uuid`. |
| `AsBinary` | `ulid()` | `string` | Returns the alias string `Illuminate\Database\Eloquent\Casts\AsBinary:ulid`. |
| `AsBinary` | `of(string $format)` | `string` | Returns the parameterized alias string `Illuminate\Database\Eloquent\Casts\AsBinary:{format}`. |
| `AsArrayObject` | `castUsing(array $arguments)` | `CastsAttributes` | Instantiates caster for `ArrayObject` structures with `ArrayObject::ARRAY_AS_PROPS` enabled. |

Sources: [src/Illuminate/Database/Eloquent/Casts/AsFluent.php:17-31](https://github.com/laravel/framework/blob/main/src/Illuminate/Database/Eloquent/Casts/AsFluent.php#L17-L31); [src/Illuminate/Database/Eloquent/Casts/AsBinary.php:20-74](https://github.com/laravel/framework/blob/main/src/Illuminate/Database/Eloquent/Casts/AsBinary.php#L20-L74); [src/Illuminate/Database/Eloquent/Casts/AsStringable.php:17-31](https://github.com/laravel/framework/blob/main/src/Illuminate/Database/Eloquent/Casts/AsStringable.php#L17-L31); [src/Illuminate/Database/Eloquent/Casts/AsArrayObject.php:16-41](https://github.com/laravel/framework/blob/main/src/Illuminate/Database/Eloquent/Casts/AsArrayObject.php#L16-L41)

### Execution Walkthrough and Binary Codec Validation

When using `AsBinary`, instantiation triggers strict format validation before any database interaction occurs. The call sequence executes as follows: `AsBinary::castUsing()` is invoked with arguments → the anonymous `CastsAttributes` constructor receives the arguments array → `$this->arguments[0]` is evaluated and checked for existence, throwing an `InvalidArgumentException` (`'The binary codec format is required.'`) if missing → the format is verified via `in_array($this->format, BinaryCodec::formats(), true)` → if unsupported, an `InvalidArgumentException` is thrown listing all allowed formats via `BinaryCodec::formats()`.

Sources: [src/Illuminate/Database/Eloquent/Casts/AsBinary.php:20-38](https://github.com/laravel/framework/blob/main/src/Illuminate/Database/Eloquent/Casts/AsBinary.php#L20-L38)

> [!CAUTION]
> `AsBinary` will throw an `InvalidArgumentException` during caster construction if the format argument is omitted or unrecognized against `BinaryCodec::formats()`. Ensure custom binary formats are registered with the codec before referencing them in model casts.
> Sources: [src/Illuminate/Database/Eloquent/Casts/AsBinary.php:26-37](https://github.com/laravel/framework/blob/main/src/Illuminate/Database/Eloquent/Casts/AsBinary.php#L26-L37)

### Structure Cast Implementation Example

The following example demonstrates how to configure and utilize `AsFluent`, `AsStringable`, `AsBinary`, and `AsArrayObject` within an Eloquent model definition.

```php
use Illuminate\Database\Eloquent\Casts\AsArrayObject;
use Illuminate\Database\Eloquent\Casts\AsBinary;
use Illuminate\Database\Eloquent\Casts\AsFluent;
use Illuminate\Database\Eloquent\Casts\AsStringable;
use Illuminate\Database\Eloquent\Model;

class UserSettings extends Model
{
    protected $casts = [
        'options' => AsFluent::class,
        'bio' => AsStringable::class,
        'token_hash' => AsBinary::class.':uuid',
        'metadata' => AsArrayObject::class,
    ];
}
```

Sources: [src/Illuminate/Database/Eloquent/Casts/AsFluent.php:9-31](https://github.com/laravel/framework/blob/main/src/Illuminate/Database/Eloquent/Casts/AsFluent.php#L9-L31); [src/Illuminate/Database/Eloquent/Casts/AsBinary.php:10-58](https://github.com/laravel/framework/blob/main/src/Illuminate/Database/Eloquent/Casts/AsBinary.php#L10-L58); [src/Illuminate/Database/Eloquent/Casts/AsStringable.php:9-31](https://github.com/laravel/framework/blob/main/src/Illuminate/Database/Eloquent/Casts/AsStringable.php#L9-L31); [src/Illuminate/Database/Eloquent/Casts/AsArrayObject.php:8-41](https://github.com/laravel/framework/blob/main/src/Illuminate/Database/Eloquent/Casts/AsArrayObject.php#L8-L41)

## Backed Enums and Enum Collections

### Backed Enums and Enum Collections

Eloquent provides native support for casting model attributes directly to PHP Enums, as well as handling collections and array objects containing enum instances via `AsEnumCollection` and `AsEnumArrayObject`. Single enums are checked via `isEnumCastable()` and transformed into enum instances or storable primitive values through `getEnumCastableAttributeValue()` and `setEnumCastableAttribute()`. When dealing with collections or array objects of enums, `AsEnumCollection` and `AsEnumArrayObject` implement the `Castable` contract, defining custom `castUsing()` routines that map raw JSON database arrays into collections or `ArrayObject` instances populated with validated enum cases.

Sources: [src/Illuminate/Database/Eloquent/Concerns/HasAttributes.php:902-904](https://github.com/laravel/framework/blob/main/src/Illuminate/Database/Eloquent/Concerns/HasAttributes.php#L902-L904), [src/Illuminate/Database/Eloquent/Concerns/HasAttributes.php:1100-1104](https://github.com/laravel/framework/blob/main/src/Illuminate/Database/Eloquent/Concerns/HasAttributes.php#L1100-L1104), [src/Illuminate/Database/Eloquent/Concerns/HasAttributes.php:1807-1830](https://github.com/laravel/framework/blob/main/src/Illuminate/Database/Eloquent/Concerns/HasAttributes.php#L1807-L1830); [src/Illuminate/Database/Eloquent/Casts/AsEnumArrayObject.php:12-85](https://github.com/laravel/framework/blob/main/src/Illuminate/Database/Eloquent/Casts/AsEnumArrayObject.php#L12-L85); [src/Illuminate/Database/Eloquent/Casts/AsEnumCollection.php:12-81](https://github.com/laravel/framework/blob/main/src/Illuminate/Database/Eloquent/Casts/AsEnumCollection.php#L12-L81)

### Enum Conversion and Persistence Methods

| Class / Trait | Method | Return Type | Description |
| --- | --- | --- | --- |
| `HasAttributes` | `isEnumCastable(string $key)` | `bool` | Determines whether an attribute is cast using a valid non-Castable enum class. |
| `HasAttributes` | `getEnumCaseFromValue(string $enumClass, string\|int $value)` | `\UnitEnum` | Instantiates a backed enum via `::from()` or a pure unit enum via `constant()`. |
| `HasAttributes` | `getStorableEnumValue(string $expectedEnum, \UnitEnum $value)` | `string\|int` | Validates that a value matches the expected enum instance and extracts its storable scalar value. |
| `AsEnumArrayObject` | `castUsing(array $arguments)` | `CastsAttributes` | Returns an anonymous caster converting JSON arrays to `ArrayObject` instances of enum items. |
| `AsEnumCollection` | `castUsing(array $arguments)` | `CastsAttributes` | Returns an anonymous caster converting JSON arrays to `Collection` instances of enum items. |
| `AsEnumArrayObject` | `of(string $class)` | `string` | Returns the parameterized alias string `Illuminate\Database\Eloquent\Casts\AsEnumArrayObject:{class}`. |

Sources: [src/Illuminate/Database/Eloquent/Concerns/HasAttributes.php:1314-1337](https://github.com/laravel/framework/blob/main/src/Illuminate/Database/Eloquent/Concerns/HasAttributes.php#L1314-L1337), [src/Illuminate/Database/Eloquent/Concerns/HasAttributes.php:1807-1830](https://github.com/laravel/framework/blob/main/src/Illuminate/Database/Eloquent/Concerns/HasAttributes.php#L1807-L1830); [src/Illuminate/Database/Eloquent/Casts/AsEnumArrayObject.php:22-85](https://github.com/laravel/framework/blob/main/src/Illuminate/Database/Eloquent/Casts/AsEnumArrayObject.php#L22-L85), [src/Illuminate/Database/Eloquent/Casts/AsEnumArrayObject.php:93-96](https://github.com/laravel/framework/blob/main/src/Illuminate/Database/Eloquent/Casts/AsEnumArrayObject.php#L93-L96); [src/Illuminate/Database/Eloquent/Casts/AsEnumCollection.php:22-81](https://github.com/laravel/framework/blob/main/src/Illuminate/Database/Eloquent/Casts/AsEnumCollection.php#L22-L81), [src/Illuminate/Database/Eloquent/Casts/AsEnumCollection.php:89-92](https://github.com/laravel/framework/blob/main/src/Illuminate/Database/Eloquent/Casts/AsEnumCollection.php#L89-L92)

> [!NOTE]
> When retrieving enum collections or array objects, `AsEnumCollection` and `AsEnumArrayObject` verify that the decoded JSON payload is a valid array and map each element by checking whether the enum is a `BackedEnum` (calling `::from($value)`) or a unit enum (calling `constant($enumClass.'::'.$value)`).
> Sources: [src/Illuminate/Database/Eloquent/Casts/AsEnumArrayObject.php:41-51](https://github.com/laravel/framework/blob/main/src/Illuminate/Database/Eloquent/Casts/AsEnumArrayObject.php#L41-L51); [src/Illuminate/Database/Eloquent/Casts/AsEnumCollection.php:41-51](https://github.com/laravel/framework/blob/main/src/Illuminate/Database/Eloquent/Casts/AsEnumCollection.php#L41-L51)

### Enum Casting Call-Chain Execution

When an attribute configured with `AsEnumCollection` is retrieved from an Eloquent model, execution follows a distinct path through the casting engine: `getAttribute()` → `getAttributeValue()` → `transformModelValue()` identifies the attribute has a cast via `hasCast()` → `castAttribute()` executes → `isEnumCastable()` evaluates false for custom class casts implementing `Castable`, allowing control to fall through to `getClassCastableAttributeValue()` → `resolveCasterClass()` invokes `AsEnumCollection::castUsing($arguments)` → the anonymous caster's `get()` method decodes the attribute JSON via `Json::decode()` → `Collection::map()` iterates over decoded values, instantiating the target enum case via `BackedEnum::from()` or `constant()`.

Sources: [src/Illuminate/Database/Eloquent/Concerns/HasAttributes.php:485-496](https://github.com/laravel/framework/blob/main/src/Illuminate/Database/Eloquent/Concerns/HasAttributes.php#L485-L496), [src/Illuminate/Database/Eloquent/Concerns/HasAttributes.php:850-911](https://github.com/laravel/framework/blob/main/src/Illuminate/Database/Eloquent/Concerns/HasAttributes.php#L850-L911), [src/Illuminate/Database/Eloquent/Concerns/HasAttributes.php:1810-1830](https://github.com/laravel/framework/blob/main/src/Illuminate/Database/Eloquent/Concerns/HasAttributes.php#L1810-L1830), [src/Illuminate/Database/Eloquent/Concerns/HasAttributes.php:1885-1907](https://github.com/laravel/framework/blob/main/src/Illuminate/Database/Eloquent/Concerns/HasAttributes.php#L1885-L1907), [src/Illuminate/Database/Eloquent/Concerns/HasAttributes.php:2419-2428](https://github.com/laravel/framework/blob/main/src/Illuminate/Database/Eloquent/Concerns/HasAttributes.php#L2419-L2428); [src/Illuminate/Database/Eloquent/Casts/AsEnumCollection.php:22-52](https://github.com/laravel/framework/blob/main/src/Illuminate/Database/Eloquent/Casts/AsEnumCollection.php#L22-L52)

> [!WARNING]
> Attempting to pass a value to `getStorableEnumValue()` that does not conform to the expected enum type will trigger a `ValueError` exception indicating that the value is not of the expected enum type.
> Sources: [src/Illuminate/Database/Eloquent/Concerns/HasAttributes.php:1330-1335](https://github.com/laravel/framework/blob/main/src/Illuminate/Database/Eloquent/Concerns/HasAttributes.php#L1330-L1335)

### Enum Collection Usage Example

The following example demonstrates how to configure backed enums and enum collections on an Eloquent model using `AsEnumCollection` and `AsEnumArrayObject`.

```php
use Illuminate\Database\Eloquent\Casts\AsEnumArrayObject;
use Illuminate\Database\Eloquent\Casts\AsEnumCollection;
use Illuminate\Database\Eloquent\Model;

enum ServerStatus: string
{
    case Active = 'active';
    case Pending = 'pending';
    case Suspended = 'suspended';
}

class Server extends Model
{
    protected $casts = [
        'status' => ServerStatus::class,
        'statuses' => AsEnumCollection::class.':'.ServerStatus::class,
        'audit_trail' => AsEnumArrayObject::of(ServerStatus::class),
    ];
}
```

Sources: [src/Illuminate/Database/Eloquent/Concerns/HasAttributes.php:1807-1830](https://github.com/laravel/framework/blob/main/src/Illuminate/Database/Eloquent/Concerns/HasAttributes.php#L1807-L1830); [src/Illuminate/Database/Eloquent/Casts/AsEnumArrayObject.php:12-96](https://github.com/laravel/framework/blob/main/src/Illuminate/Database/Eloquent/Casts/AsEnumArrayObject.php#L12-L96); [src/Illuminate/Database/Eloquent/Casts/AsEnumCollection.php:12-93](https://github.com/laravel/framework/blob/main/src/Illuminate/Database/Eloquent/Casts/AsEnumCollection.php#L12-L93)

## JSON Attribute Encoding and Serialization

### JSON Attribute Encoding and Serialization

Eloquent provides robust mechanisms for managing JSON attributes through the `Json` management class and built-in trait methods in `HasAttributes`. The `Json` class serves as an abstraction wrapper around PHP's native JSON functions, exposing `encode()` and `decode()` static methods alongside configuration hooks via `encodeUsing()` and `decodeUsing()` to override default serialization callables globally.
Sources: [src/Illuminate/Database/Eloquent/Casts/Json.php:5-56](https://github.com/laravel/framework/blob/main/src/Illuminate/Database/Eloquent/Casts/Json.php#L5-L56)

When persisting or updating attributes with JSON casts (such as `array`, `json`, `object`, or `collection`), Eloquent automatically invokes `castAttributeAsJson()`, which retrieves JSON casting flags via `getJsonCastFlags()` (checking for `json:unicode` options like `JSON_UNESCAPED_UNICODE`) before passing the payload to `asJson()`. If encoding fails, a `JsonEncodingException` is thrown containing the underlying JSON error message.
Sources: [src/Illuminate/Database/Eloquent/Concerns/HasAttributes.php:1374-1422](https://github.com/laravel/framework/blob/main/src/Illuminate/Database/Eloquent/Concerns/HasAttributes.php#L1374-L1422)

> [!WARNING]
> If `Json::encode()` returns `false` during attribute serialization, Eloquent immediately halts and raises a `JsonEncodingException` via `JsonEncodingException::forAttribute()`, capturing `json_last_error_msg()`.
> Sources: [src/Illuminate/Database/Eloquent/Concerns/HasAttributes.php:1382-1392](https://github.com/laravel/framework/blob/main/src/Illuminate/Database/Eloquent/Concerns/HasAttributes.php#L1382-L1392)

### Fluent Attribute Objects

The `Attribute` class provides a fluent object interface for defining sophisticated accessors and mutators with fine-grained caching controls. Using static constructors or instance methods, developers can configure getter and setter callbacks alongside caching behaviors.
Sources: [src/Illuminate/Database/Eloquent/Casts/Attribute.php:5-104](https://github.com/laravel/framework/blob/main/src/Illuminate/Database/Eloquent/Casts/Attribute.php#L5-L104)

| Method / Property | Type / Default | Purpose |
| :--- | :--- | :--- |
| `$get` | `callable\|null` | The attribute accessor callback executed upon retrieval. |
| `$set` | `callable\|null` | The attribute mutator callback executed upon assignment. |
| `$withCaching` | `bool (false)` | Indicates whether general attribute caching is enabled. |
| `$withObjectCaching` | `bool (true)` | Indicates whether object instances returned by the accessor are cached. |
| `make(?callable, ?callable)` | static | Creates a new attribute accessor and/or mutator instance. |
| `get(callable)` | static | Creates a new attribute instance with only an accessor. |
| `set(callable)` | static | Creates a new attribute instance with only a mutator. |
| `withoutObjectCaching()` | `$this` | Disables object instance caching for the attribute. |
| `shouldCache()` | `$this` | Enables caching for the attribute. |

Sources: [src/Illuminate/Database/Eloquent/Casts/Attribute.php:10-103](https://github.com/laravel/framework/blob/main/src/Illuminate/Database/Eloquent/Casts/Attribute.php#L10-L103)

### Nested JSON Path Assignment

Eloquent supports setting deeply nested values inside JSON attributes using dot or arrow notation via `fillJsonAttribute()`. When an assignment targets a path containing `->`, execution flows through a precise sequence: `setAttribute()` → detects `->` separator → `fillJsonAttribute()` splits the attribute key and JSON path → `getArrayAttributeByKey()` decodes the existing JSON string (handling encryption if configured) → `getArrayAttributeWithValue()` uses `Arr::set()` to inject the value into the underlying array at the specified path → `asJson()` re-encodes the structure → persists the final payload back into attributes.
Sources: [src/Illuminate/Database/Eloquent/Concerns/HasAttributes.php:1119-1121](https://github.com/laravel/framework/blob/main/src/Illuminate/Database/Eloquent/Concerns/HasAttributes.php#L1119-L1121), [src/Illuminate/Database/Eloquent/Concerns/HasAttributes.php:1239-1256](https://github.com/laravel/framework/blob/main/src/Illuminate/Database/Eloquent/Concerns/HasAttributes.php#L1239-L1256), [src/Illuminate/Database/Eloquent/Concerns/HasAttributes.php:1347-1371](https://github.com/laravel/framework/blob/main/src/Illuminate/Database/Eloquent/Concerns/HasAttributes.php#L1347-L1371)

## Related

- [[Eloquent Models]]

