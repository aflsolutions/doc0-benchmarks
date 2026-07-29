# Collections & Support Helpers

<details>
<summary>Relevant source files</summary>

The following files were used as context for generating this wiki page:

- [src/Illuminate/Collections/LazyCollection.php](https://github.com/laravel/framework/blob/main/src/Illuminate/Collections/LazyCollection.php)
- [src/Illuminate/Collections/Collection.php](https://github.com/laravel/framework/blob/main/src/Illuminate/Collections/Collection.php)
- [types/Support/LazyCollection.php](https://github.com/laravel/framework/blob/main/types/Support/LazyCollection.php)
- [src/Illuminate/Collections/helpers.php](https://github.com/laravel/framework/blob/main/src/Illuminate/Collections/helpers.php)
- [src/Illuminate/Collections/Enumerable.php](https://github.com/laravel/framework/blob/main/src/Illuminate/Collections/Enumerable.php)
</details>

## Overview

The Laravel collections and support helpers component provides a fluent, powerful wrapper for interacting with arrays and enumerable data structures. At its core, the shared `Enumerable` contract unifies array, JSON, and iterator behaviors, ensuring consistent method availability across both synchronous in-memory collections and generator-backed stream processing pipelines. Sources: [src/Illuminate/Collections/Enumerable.php:21-22](https://github.com/laravel/framework/blob/main/src/Illuminate/Collections/Enumerable.php#L21-L22)

To solve memory exhaustion and performance bottlenecks when handling large datasets or streaming workloads, the component offers both eager structures via `Collection` and memory-efficient iterators via `LazyCollection`. These classes are complemented by a rich set of global array and data helpers—such as `collect`, `data_get`, and `data_set`—which simplify complex multi-dimensional traversal using dot notation. Designed for extensibility, the architecture supports generic type annotations, custom collection subclasses, and runtime method injection through macroable traits. Sources: [src/Illuminate/Collections/LazyCollection.php:13-31](https://github.com/laravel/framework/blob/main/src/Illuminate/Collections/LazyCollection.php#L13-L31), [src/Illuminate/Collections/Collection.php:29-30](https://github.com/laravel/framework/blob/main/src/Illuminate/Collections/Collection.php#L29-L30), [src/Illuminate/Collections/helpers.php:16-19](https://github.com/laravel/framework/blob/main/src/Illuminate/Collections/helpers.php#L16-L19)

## Enumerable Contract and Core Interfaces

### Overview

The `Enumerable` interface serves as the unified contract defining arrayable, countable, iterable, jsonable, and JSON-serializable behavior across concrete collection implementations. By extending contracts like `Arrayable`, `Countable`, `IteratorAggregate`, `Jsonable`, and `JsonSerializable`, `Enumerable` guarantees that both eager `Collection` and generator-backed `LazyCollection` instances share a consistent, fluent API for data manipulation. Sources: [src/Illuminate/Collections/Enumerable.php:21-22](https://github.com/laravel/framework/blob/main/src/Illuminate/Collections/Enumerable.php#L21-L22)

### Core Interfaces and Contract Architecture

The `Enumerable` interface establishes a common set of foundational methods and type constraints for data collections in Laravel. Concrete classes such as `Collection` and `LazyCollection` implement this contract while integrating specific storage and traversal mechanisms.

| Interface / Contract | Source File | Description |
| :--- | :--- | :--- |
| `Enumerable` | [src/Illuminate/Collections/Enumerable.php:21-22](https://github.com/laravel/framework/blob/main/src/Illuminate/Collections/Enumerable.php#L21-L22) | Unified collection contract extending support and iterator interfaces. |
| `Arrayable` | [src/Illuminate/Collections/Enumerable.php:7-18](https://github.com/laravel/framework/blob/main/src/Illuminate/Collections/Enumerable.php#L7-L18) | Contract for classes that can be transformed into an array. |
| `Jsonable` | [src/Illuminate/Collections/Enumerable.php:8-8](https://github.com/laravel/framework/blob/main/src/Illuminate/Collections/Enumerable.php#L8-L8) | Contract for classes that can be converted to a JSON string. |
| `Countable` | [src/Illuminate/Collections/Enumerable.php:6-6](https://github.com/laravel/framework/blob/main/src/Illuminate/Collections/Enumerable.php#L6-L6) | Built-in PHP interface allowing `count()` execution on instances. |
| `IteratorAggregate` | [src/Illuminate/Collections/Enumerable.php:9-19](https://github.com/laravel/framework/blob/main/src/Illuminate/Collections/Enumerable.php#L9-L19) | Built-in PHP interface requiring the creation of an external iterator. |

Sources: [src/Illuminate/Collections/Enumerable.php:6-22](https://github.com/laravel/framework/blob/main/src/Illuminate/Collections/Enumerable.php#L6-L22)

### Contract Design Trade-Offs

| Design Choice | Benefit | Cost |
| :--- | :--- | :--- |
| Shared `Enumerable` contract interface | Ensures identical method signatures across eager and lazy implementations. | Requires implementing classes to handle divergent execution models under a common type. |
| Extension of PHP native interfaces (`Countable`, `IteratorAggregate`) | Native interoperability with standard PHP constructs like `foreach` and `count()`. | Couples collection design closely with PHP core interface specifications. |
| Covariant return types and generics (`@template-covariant TValue`) | Enhanced static analysis and precise IDE type inference for collection items. | Increased complexity in docblock annotations and template type constraints. |

Sources: [src/Illuminate/Collections/Enumerable.php:13-22](https://github.com/laravel/framework/blob/main/src/Illuminate/Collections/Enumerable.php#L13-L22), [src/Illuminate/Collections/Collection.php:16-24](https://github.com/laravel/framework/blob/main/src/Illuminate/Collections/Collection.php#L16-L24)

> [!NOTE]
> The `Enumerable` interface defines static factory methods such as `make`, `times`, `range`, `wrap`, `unwrap`, and `empty` to instantiate collection objects uniformly regardless of the underlying concrete implementation. Sources: [src/Illuminate/Collections/Enumerable.php:32-81](https://github.com/laravel/framework/blob/main/src/Illuminate/Collections/Enumerable.php#L32-L81)

## Eager In Memory Collection Processing

### Overview

The `Collection` class provides a synchronous, in-memory array wrapper that implements `ArrayAccess`, `CanBeEscapedWhenCastToString`, and `Enumerable`. It uses traits like `EnumeratesValues`, `Macroable`, and `TransformsToResourceCollection` to deliver fluent transformations, sorting mechanisms, and eager aggregation methods. Data is held fully loaded in memory within the protected `$items` array, enabling immediate operations such as sorting, grouping, and statistical calculations without deferred execution. Sources: [src/Illuminate/Collections/Collection.php:24-36](https://github.com/laravel/framework/blob/main/src/Illuminate/Collections/Collection.php#L24-L36)

### Sorting and Ordering Mechanism Walkthrough

Complex sorting operations within the eager collection involve passing data through specific internal methods. When `sortBy()` is invoked with an array of criteria, it delegates execution through the sorting pipeline:

1. `sortBy()` intercepts array parameters and delegates to `sortByMany()`. Sources: [src/Illuminate/Collections/Collection.php:1584-1588](https://github.com/laravel/framework/blob/main/src/Illuminate/Collections/Collection.php#L1584-L1588)
2. `sortByMany()` copies the underlying `$this->items` array and applies `uasort()`. Sources: [src/Illuminate/Collections/Collection.php:1623-1627](https://github.com/laravel/framework/blob/main/src/Illuminate/Collections/Collection.php#L1623-L1627)
3. Inside the sorting closure, `Arr::wrap()` normalizes each comparison rule, extracting the target property `$prop` and resolved sorting direction (`SortDirection::Ascending` or `SortDirection::Descending`). Sources: [src/Illuminate/Collections/Collection.php:1628-1637](https://github.com/laravel/framework/blob/main/src/Illuminate/Collections/Collection.php#L1628-L1637)
4. Values are retrieved via `data_get()`, reversed if descending, and evaluated against bitmasked comparison flags like `SORT_NATURAL` or `SORT_FLAG_CASE` using operators such as `strnatcasecmp` or spaceship (`<=>`) comparison. Sources: [src/Illuminate/Collections/Collection.php:1642-1662](https://github.com/laravel/framework/blob/main/src/Illuminate/Collections/Collection.php#L1642-L1662)

> [!NOTE]
> During `sortByMany` execution, if a comparison result is zero (`$result === 0`), the sorting iteration skips to the next comparison criteria in the array, mirroring multi-column SQL `ORDER BY` behavior. Sources: [src/Illuminate/Collections/Collection.php:1665-1668](https://github.com/laravel/framework/blob/main/src/Illuminate/Collections/Collection.php#L1665-L1668)

### In-Memory Aggregation Methods

The collection offers several built-in aggregation and statistical helpers operating directly on in-memory array contents.

| Method | Signature | Description |
| :--- | :--- | :--- |
| `median` | `median($key = null)` | Calculates the median value for a given key, averaging the two middle items when count is even. |
| `mode` | `mode($key = null)` | Computes the statistical mode, returning an array of values with the highest frequency. |
| `duplicates` | `duplicates($callback = null, $strict = false)` | Identifies duplicate values or mapped results within the collection. |
| `contains` | `contains($key, $operator = null, $value = null)` | Determines whether an item exists using callables, exact values, or operators. |
| `groupBy` | `groupBy($groupBy, $preserveKeys = false)` | Groups collection items by a given callback or attribute key. |

Sources: [src/Illuminate/Collections/Collection.php:98-145](https://github.com/laravel/framework/blob/main/src/Illuminate/Collections/Collection.php#L98-L145), [src/Illuminate/Collections/Collection.php:195-206](https://github.com/laravel/framework/blob/main/src/Illuminate/Collections/Collection.php#L195-L206), [src/Illuminate/Collections/Collection.php:348-367](https://github.com/laravel/framework/blob/main/src/Illuminate/Collections/Collection.php#L348-L367), [src/Illuminate/Collections/Collection.php:527-533](https://github.com/laravel/framework/blob/main/src/Illuminate/Collections/Collection.php#L527-L533)

> [!WARNING]
> Methods like `duplicates()` and `unique()` utilize strict or loose PHP in-memory array searches (`in_array`). Large data sets processed with multiple nested transformations can consume significant memory because intermediate states instantiate new `Collection` instances via `newInstance()`. Sources: [src/Illuminate/Collections/Collection.php:54-57](https://github.com/laravel/framework/blob/main/src/Illuminate/Collections/Collection.php#L54-L57), [src/Illuminate/Collections/Collection.php:1842-1858](https://github.com/laravel/framework/blob/main/src/Illuminate/Collections/Collection.php#L1842-L1858)

### Design Trade-Offs

| Design Choice | Benefit | Cost |
| :--- | :--- | :--- |
| Immediate execution and storage in protected `$items` array | Zero overhead from iterator generators; direct access via `ArrayAccess`. | High memory footprint for large data sets since all items reside in memory simultaneously. |
| Frequent instantiation of new static instances (`newInstance()`) | Ensures immutable-style fluent chaining without mutating original collection objects. | Allocates extra garbage collection overhead during deep method chains. |
| Delegation to native PHP functions (`array_map`, `array_filter`, `uasort`) | Leverages highly optimized C-level internal array routines. | Behavior matches PHP array quirks (e.g., loose typing on keys, array re-indexing). |

Sources: [src/Illuminate/Collections/Collection.php:31-36](https://github.com/laravel/framework/blob/main/src/Illuminate/Collections/Collection.php#L31-L36), [src/Illuminate/Collections/Collection.php:54-57](https://github.com/laravel/framework/blob/main/src/Illuminate/Collections/Collection.php#L54-L57), [src/Illuminate/Collections/Collection.php:1550-1558](https://github.com/laravel/framework/blob/main/src/Illuminate/Collections/Collection.php#L1550-L1558)

### Worked Example: Eager Processing Lifecycle

The following example demonstrates instantiating a `Collection`, applying an eager sorting chain with multiple comparison fields, computing the median, and retrieving unique subsets.

```php
use Illuminate\Support\Collection;

$collection = new Collection([
    ['department' => 'Engineering', 'salary' => 95000],
    ['department' => 'Engineering', 'salary' => 120000],
    ['department' => 'Marketing', 'salary' => 85000],
    ['department' => 'Marketing', 'salary' => 95000],
]);

// Sort by department ascending, then salary descending
$sorted = $collection->sortBy([
    ['department', 'asc'],
    ['salary', 'desc'],
]);

// Extract salaries and find the median
$medianSalary = $sorted->pluck('salary')->median();

// Retrieve unique departments
$departments = $sorted->unique('department')->values();
```

Sources: [src/Illuminate/Collections/Collection.php:43-46](https://github.com/laravel/framework/blob/main/src/Illuminate/Collections/Collection.php#L43-L46), [src/Illuminate/Collections/Collection.php:98-102](https://github.com/laravel/framework/blob/main/src/Illuminate/Collections/Collection.php#L98-L102), [src/Illuminate/Collections/Collection.php:812-815](https://github.com/laravel/framework/blob/main/src/Illuminate/Collections/Collection.php#L812-L815), [src/Illuminate/Collections/Collection.php:1584-1588](https://github.com/laravel/framework/blob/main/src/Illuminate/Collections/Collection.php#L1584-L1588), [src/Illuminate/Collections/Collection.php:1842-1846](https://github.com/laravel/framework/blob/main/src/Illuminate/Collections/Collection.php#L1842-L1846), [src/Illuminate/Collections/Collection.php:1866-1869](https://github.com/laravel/framework/blob/main/src/Illuminate/Collections/Collection.php#L1866-L1869)

## LazyCollection and Generator Stream Processing

### Overview

`LazyCollection` wraps generators, iterables, and custom traversables to process large data streams with minimal memory overhead. Instead of loading an entire dataset into memory simultaneously, items are pulled and evaluated one at a time via PHP iterators.
Sources: [src/Illuminate/Collections/LazyCollection.php:19-60](https://github.com/laravel/framework/blob/main/src/Illuminate/Collections/LazyCollection.php#L19-L60)

### Initialization and Iterator Resolution

When a `LazyCollection` is instantiated, the constructor examines the provided `$source`. Passing raw `Generator` objects directly throws an `InvalidArgumentException`, requiring a generator function or closure instead.
Sources: [src/Illuminate/Collections/LazyCollection.php:47-60](https://github.com/laravel/framework/blob/main/src/Illuminate/Collections/LazyCollection.php#L47-L60)

The internal `makeIterator()` method resolves sources into a `Traversable` instance using the following delegation path:
`makeIterator()` → checks if `IteratorAggregate` (calls `getIterator()`) → checks if `array` (returns `ArrayIterator`) → checks if callable (invokes closure and validates or wraps result) → falls back to casting to array and wrapping in `ArrayIterator`.
Sources: [src/Illuminate/Collections/LazyCollection.php:1886-1905](https://github.com/laravel/framework/blob/main/src/Illuminate/Collections/LazyCollection.php#L1886-L1905)

> [!CAUTION]
> Passing a raw `Generator` instance directly to `__construct()` triggers an `InvalidArgumentException`. Always pass a closure or factory function that returns the generator.
> Sources: [src/Illuminate/Collections/LazyCollection.php:53-57](https://github.com/laravel/framework/blob/main/src/Illuminate/Collections/LazyCollection.php#L53-L57)

### Stream Processing Options

`LazyCollection` provides specialized methods for rate-limiting, chunking, and timing out streams without building intermediate arrays.

| Method | Parameters | Return Type | Purpose |
| :--- | :--- | :--- | :--- |
| `throttle` | `float $seconds` | `static<TKey, TValue>` | Releases items at most once per given seconds using precise timestamps and microsecond sleeps. |
| `chunk` | `int $size, bool $preserveKeys = true` | `static<int, static>` | Groups items into chunks of fixed size lazily. |
| `sliding` | `positive-int $size = 2, positive-int $step = 1` | `static<int, static>` | Creates a sliding window view of chunks across the stream. |
| `takeUntilTimeout` | `DateTimeInterface $timeout, ?callable $callback = null` | `static<TKey, TValue>` | Yields items until the specified timestamp is reached. |
| `withHeartbeat` | `DateInterval|int $interval, callable $callback` | `static<TKey, TValue>` | Executes a callback at regular time intervals during iteration. |

Sources: [src/Illuminate/Collections/LazyCollection.php:1193-1228](https://github.com/laravel/framework/blob/main/src/Illuminate/Collections/LazyCollection.php#L1193-L1228), [src/Illuminate/Collections/LazyCollection.php:1399-1434](https://github.com/laravel/framework/blob/main/src/Illuminate/Collections/LazyCollection.php#L1399-L1434), [src/Illuminate/Collections/LazyCollection.php:1626-1651](https://github.com/laravel/framework/blob/main/src/Illuminate/Collections/LazyCollection.php#L1626-L1651), [src/Illuminate/Collections/LazyCollection.php:1689-1703](https://github.com/laravel/framework/blob/main/src/Illuminate/Collections/LazyCollection.php#L1689-L1703), [src/Illuminate/Collections/LazyCollection.php:1769-1787](https://github.com/laravel/framework/blob/main/src/Illuminate/Collections/LazyCollection.php#L1769-L1787)

> [!NOTE]
> Methods like `sort()`, `shuffle()`, `groupBy()`, and `crossJoin()` cannot operate lazily on unbounded streams because they require complete dataset visibility. They invoke `passthru()` to collect items into an eager `Collection` internally.
> Sources: [src/Illuminate/Collections/LazyCollection.php:324-327](https://github.com/laravel/framework/blob/main/src/Illuminate/Collections/LazyCollection.php#L324-L327), [src/Illuminate/Collections/LazyCollection.php:1930-1934](https://github.com/laravel/framework/blob/main/src/Illuminate/Collections/LazyCollection.php#L1930-L1934)

### Design Trade-Offs

| Design Choice | Benefit | Cost |
| :--- | :--- | :--- |
| Generator-backed closures for transformations | Processes infinite or massive data sets with constant O(1) memory usage. | Cannot seek back or count elements directly without traversing the entire iterator. |
| Passthrough methods for sorting and grouping | Preserves complete compatibility with eager collection operations. | Forces eager materialization into memory when invoked on lazy collections. |
| Precise microsecond timing in `throttle()` and `withHeartbeat()` | Enables accurate rate limiting and heartbeat monitoring during long-running tasks. | Relies on system time checks (`preciseNow()`) on every iteration step. |

Sources: [src/Illuminate/Collections/LazyCollection.php:1689-1703](https://github.com/laravel/framework/blob/main/src/Illuminate/Collections/LazyCollection.php#L1689-L1703), [src/Illuminate/Collections/LazyCollection.php:1769-1787](https://github.com/laravel/framework/blob/main/src/Illuminate/Collections/LazyCollection.php#L1769-L1787), [src/Illuminate/Collections/LazyCollection.php:1930-1934](https://github.com/laravel/framework/blob/main/src/Illuminate/Collections/LazyCollection.php#L1930-L1934)

### Worked Example: Throttled Generator Pipeline

The following example demonstrates creating a generator-backed lazy collection, filtering records, throttling emission rates, and adding a periodic heartbeat callback.

```php
use Illuminate\Support\LazyCollection;

$stream = LazyCollection::make(function () {
    for ($i = 1; $i <= 1000; $i++) {
        yield $i;
    }
});

$processed = $stream
    ->filter(fn ($number) => $number % 2 === 0)
    ->throttle(0.05)
    ->withHeartbeat(10, function () {
        // Run heartbeat action every 10 seconds
    });

foreach ($processed as $key => $value) {
    // Consumes items lazily one by one
}
```

Sources: [src/Illuminate/Collections/LazyCollection.php:43-60](https://github.com/laravel/framework/blob/main/src/Illuminate/Collections/LazyCollection.php#L43-L60), [src/Illuminate/Collections/LazyCollection.php:443-455](https://github.com/laravel/framework/blob/main/src/Illuminate/Collections/LazyCollection.php#L443-L455), [src/Illuminate/Collections/LazyCollection.php:1689-1703](https://github.com/laravel/framework/blob/main/src/Illuminate/Collections/LazyCollection.php#L1689-L1703), [src/Illuminate/Collections/LazyCollection.php:1769-1787](https://github.com/laravel/framework/blob/main/src/Illuminate/Collections/LazyCollection.php#L1769-L1787)

## Global Array and Data Helpers

### Overview

Nested array and object manipulation utilities offer robust dot-notation traversal, existence checking, retrieval, setting, and forgetting capabilities. These standalone global helpers operate on arrays, accessible collections, and standard objects without requiring explicit instantiation.
Sources: [src/Illuminate/Collections/helpers.php:37-225](https://github.com/laravel/framework/blob/main/src/Illuminate/Collections/helpers.php#L37-L225)

### Global Data Manipulation Reference

The helper functions exposed in [src/Illuminate/Collections/helpers.php](https://github.com/laravel/framework/blob/main/src/Illuminate/Collections/helpers.php) manage nested payload structures via dot notation. The behavior, argument signatures, and return structures of each utility are detailed below.

| Function Name | Signature | Return Type | Description |
| :--- | :--- | :--- | :--- |
| `collect` | `$value = []` | `Collection` | Creates an eager collection from the given value. |
| `data_fill` | `&$target, $key, $value` | `mixed` | Fills in data where it is missing by invoking `data_set` with `$overwrite = false`. |
| `data_has` | `$target, $key` | `bool` | Determines if a key or property exists on an array or object using dot notation. |
| `data_get` | `$target, $key, $default = null` | `mixed` | Retrieves an item from an array or object using dot notation, supporting wildcards and first/last selectors. |
| `data_set` | `&$target, $key, $value, $overwrite = true` | `mixed` | Sets an item on an array or object using dot notation, creating missing intermediate keys. |
| `data_forget` | `&$target, $key` | `mixed` | Removes or unsets an item from an array or object using dot notation. |
| `head` | `$array` | `mixed` | Gets the first element of an array, returning `false` if empty. |
| `last` | `$array` | `mixed` | Gets the last element from an array, returning `false` if empty. |
| `value` | `$value, ...$args` | `TValue` | Returns the default value, evaluating closures with optional arguments. |
| `when` | `$condition, $value, $default = null` | `mixed` | Returns a evaluated value if the given condition evaluates to true. |

Sources: [src/Illuminate/Collections/helpers.php:6-293](https://github.com/laravel/framework/blob/main/src/Illuminate/Collections/helpers.php#L6-L293)

### Call-Chain Execution Walkthrough: `data_get()`

The `data_get` function processes dot-notation keys through a precise, iterative traversal sequence across arrays, collections, and objects.

1. **Initial Null Check:** If `$key` is `null`, `data_get` immediately returns the full `$target` unmodified.
   Sources: [src/Illuminate/Collections/helpers.php:78-80](https://github.com/laravel/framework/blob/main/src/Illuminate/Collections/helpers.php#L78-L80)
2. **Segment Parsing:** The function ensures `$key` is an array by exploding string keys on the dot (`.`) separator.
   Sources: [src/Illuminate/Collections/helpers.php:82-82](https://github.com/laravel/framework/blob/main/src/Illuminate/Collections/helpers.php#L82-L82)
3. **Iteration and Wildcards:** It loops over each `$segment`, unsetting it from the active key array. If a segment is `*`, `data_get` inspects whether `$target` is a `Collection` (converting it via `all()`) or checks if it is iterable. It then recursively invokes `data_get` on each item, collapsing nested results if multiple wildcards exist.
   Sources: [src/Illuminate/Collections/helpers.php:84-105](https://github.com/laravel/framework/blob/main/src/Illuminate/Collections/helpers.php#L84-L105)
4. **Special Segment Resolution:** String segments are matched against dynamic positional selectors via a `match` expression: escaping literal asterisks (`'\*'`), literal first/last braces (`'\{first}'`, `'\{last}'`), or dynamic positional keys (`'{first}'` mapping to `array_key_first(Arr::from($target))` and `{last}` mapping to `array_key_last(Arr::from($target))`).
   Sources: [src/Illuminate/Collections/helpers.php:107-114](https://github.com/laravel/framework/blob/main/src/Illuminate/Collections/helpers.php#L107-L114)
5. **Target Traversal and Fallback:** The loop checks whether the target is accessible via `Arr::accessible()` or is an object with the property set. If found, `$target` descends deeper; otherwise, it returns the evaluated `$default` value via `value($default)`.
   Sources: [src/Illuminate/Collections/helpers.php:116-122](https://github.com/laravel/framework/blob/main/src/Illuminate/Collections/helpers.php#L116-L122)

> [!WARNING]
> When evaluating wildcard segments (`*`) in `data_get`, passing a non-iterable target that is not a `Collection` immediately short-circuits execution and returns the evaluated `$default` value.
> Sources: [src/Illuminate/Collections/helpers.php:92-96](https://github.com/laravel/framework/blob/main/src/Illuminate/Collections/helpers.php#L92-L96)

### Design Trade-Offs

| Design Choice | Benefit | Cost |
| :--- | :--- | :--- |
| Exploding dot-notation strings into arrays | Provides intuitive human-readable nesting syntax for configuration and data payloads. | Allocates temporary array segments on every lookup or modification call. |
| Pass-by-reference targeting in `data_set` and `data_forget` | Enables in-place mutation of nested array and object structures. | Requires careful handling of variable references to avoid unintended side effects. |
| Strict type checking via `Arr::accessible()` and `is_object()` | Prevents fatal errors when traversing malformed data payloads or scalar targets. | Adds conditional branch overhead during deep traversal loops. |

Sources: [src/Illuminate/Collections/helpers.php:141-221](https://github.com/laravel/framework/blob/main/src/Illuminate/Collections/helpers.php#L141-L221)

### Full Worked Example: Data Helper Operations

The following example demonstrates utilizing `data_get`, `data_set`, `data_fill`, `data_has`, and `data_forget` on a nested array structure.

```php
use function Illuminate\Support\data_get;
use function Illuminate\Support\data_set;
use function Illuminate\Support\data_fill;
use function Illuminate\Support\data_has;
use function Illuminate\Support\data_forget;

$data = [
    'developer' => [
        'name' => 'Taylor',
        'languages' => ['PHP', 'JavaScript'],
    ],
];

// Check if nested key exists
$hasLanguage = data_has($data, 'developer.languages.0'); // true

// Retrieve nested item using dot notation and wildcard
$languages = data_get($data, 'developer.languages.*'); // ['PHP', 'JavaScript']

// Set a nested value (creates intermediate arrays if missing)
data_set($data, 'developer.contact.email', 'taylor@laravel.com');

// Fill in data only if it does not already exist (overwrite = false)
data_fill($data, 'developer.name', 'Default Name'); // Keeps 'Taylor'
data_fill($data, 'developer.age', 30); // Sets age to 30

// Remove an item using dot notation
data_forget($data, 'developer.languages.1');
```

Sources: [src/Illuminate/Collections/helpers.php:31-224](https://github.com/laravel/framework/blob/main/src/Illuminate/Collections/helpers.php#L31-L224)

## Type Annotations and Macro Extensions

### Overview

Laravel collections leverage PHPStan generic annotations and trait composition to provide rigorous type inference and dynamic extensibility. Both `Collection` and `LazyCollection` use `@template TKey of array-key` and `@template-covariant TValue` parameters, paired with the `Macroable` trait, allowing developers to extend collection instances at runtime while maintaining precise static analysis guarantees.
Sources: [src/Illuminate/Collections/Collection.php:16-29](https://github.com/laravel/framework/blob/main/src/Illuminate/Collections/Collection.php#L16-L29), [src/Illuminate/Collections/LazyCollection.php:19-31](https://github.com/laravel/framework/blob/main/src/Illuminate/Collections/LazyCollection.php#L19-L31)

### Generic Type Annotations and Custom Structures

Static analysis tools track precise input and output types across collection methods via advanced PHPDoc generics. For instance, extending `LazyCollection` requires declaring custom template parameters matching `TKey` and `TValue` constraints.
Sources: [types/Support/LazyCollection.php:928-936](https://github.com/laravel/framework/blob/main/types/Support/LazyCollection.php#L928-L936)

> [!NOTE]
> Passing raw PHP `Generator` objects directly to `LazyCollection` constructors throws an `InvalidArgumentException`; developers must always pass a generator closure factory instead.
> Sources: [src/Illuminate/Collections/LazyCollection.php:53-57](https://github.com/laravel/framework/blob/main/src/Illuminate/Collections/LazyCollection.php#L53-L57)

### Macroable Extension Mechanism

The `Macroable` trait (included in both `Collection` and `LazyCollection`) injects dynamic methods into classes at runtime using `macro()` and `mixin()`, routing calls through closure bindings.
Sources: [src/Illuminate/Collections/Collection.php:29-29](https://github.com/laravel/framework/blob/main/src/Illuminate/Collections/Collection.php#L29-L29), [src/Illuminate/Collections/LazyCollection.php:31-31](https://github.com/laravel/framework/blob/main/src/Illuminate/Collections/LazyCollection.php#L31-L31)

### Design Trade-Offs

| Design Choice | Benefit | Cost |
| :--- | :--- | :--- |
| Covariant value type templates (`@template-covariant`) | Enables safe subtyping assignments where collections of subclasses substitute parent collections. | Restricts template usage on method parameter positions to maintain type safety. |
| Runtime macro registration via `Macroable` trait | Allows flexible third-party package extensions without modifying core classes. | Bypasses static analysis type inference unless explicit IDE helper mixins are declared. |
| Closure-backed `LazyCollection` sources | Defers execution and evaluation until iteration occurs, saving memory on large datasets. | Increases debugging complexity when inspecting stack traces inside generator loops. |

Sources: [src/Illuminate/Collections/Collection.php:16-29](https://github.com/laravel/framework/blob/main/src/Illuminate/Collections/Collection.php#L16-L29), [src/Illuminate/Collections/LazyCollection.php:19-38](https://github.com/laravel/framework/blob/main/src/Illuminate/Collections/LazyCollection.php#L19-L38)

### Full Worked Example: Custom Lazy Collection and Static Types

The following example demonstrates instantiating typed lazy collections, utilizing factory methods, and leveraging static assertions with custom class structures.
Sources: [types/Support/LazyCollection.php:18-44](https://github.com/laravel/framework/blob/main/types/Support/LazyCollection.php#L18-L44)

```php
use Illuminate\Support\LazyCollection;
use Illuminate\Contracts\Support\Arrayable;

class Users implements Arrayable {
    public function toArray(): array {
        return [new User];
    }
}

$arrayable = new Users;
$generator = function () {
    yield new User;
};

// Creating typed lazy collections via constructor and static factory methods
$collectionFromGenerator = LazyCollection::make($generator);
$collectionFromArrayable = LazyCollection::make($arrayable);
$associativeCollection = new LazyCollection(['Sam' => new User]);
```
Sources: [types/Support/LazyCollection.php:9-44](https://github.com/laravel/framework/blob/main/types/Support/LazyCollection.php#L9-L44)

## Related

- [[Dependency Injection Container]]

