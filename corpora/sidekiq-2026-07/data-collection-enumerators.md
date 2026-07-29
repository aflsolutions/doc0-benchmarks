# Data Collection Enumerators

<details>
<summary>Relevant source files</summary>

The following files were used as context for generating this wiki page:

- [lib/sidekiq/job/iterable.rb](https://github.com/sidekiq/sidekiq/blob/main/lib/sidekiq/job/iterable.rb)
- [lib/sidekiq/api.rb](https://github.com/sidekiq/sidekiq/blob/main/lib/sidekiq/api.rb)
- [lib/sidekiq/metrics/query.rb](https://github.com/sidekiq/sidekiq/blob/main/lib/sidekiq/metrics/query.rb)
- [lib/sidekiq/tui/tabs/set_tab.rb](https://github.com/sidekiq/sidekiq/blob/main/lib/sidekiq/tui/tabs/set_tab.rb)
- [lib/sidekiq/job/iterable/enumerators.rb](https://github.com/sidekiq/sidekiq/blob/main/lib/sidekiq/job/iterable/enumerators.rb)
- [lib/sidekiq/job/iterable/active_record_enumerator.rb](https://github.com/sidekiq/sidekiq/blob/main/lib/sidekiq/job/iterable/active_record_enumerator.rb)
- [lib/sidekiq/processor.rb](https://github.com/sidekiq/sidekiq/blob/main/lib/sidekiq/processor.rb)
- [lib/sidekiq/metrics/shared.rb](https://github.com/sidekiq/sidekiq/blob/main/lib/sidekiq/metrics/shared.rb)
- [myapp/app/jobs/post_updater.rb](https://github.com/sidekiq/sidekiq/blob/main/myapp/app/jobs/post_updater.rb)
- [lib/sidekiq/job/iterable/csv_enumerator.rb](https://github.com/sidekiq/sidekiq/blob/main/lib/sidekiq/job/iterable/csv_enumerator.rb)
- [myapp/app/jobs/post_creator.rb](https://github.com/sidekiq/sidekiq/blob/main/myapp/app/jobs/post_creator.rb)
- [lib/sidekiq/iterable_job.rb](https://github.com/sidekiq/sidekiq/blob/main/lib/sidekiq/iterable_job.rb)
- [lib/sidekiq/metrics/tracking.rb](https://github.com/sidekiq/sidekiq/blob/main/lib/sidekiq/metrics/tracking.rb)
- [lib/sidekiq/tui/tabs/base_tab.rb](https://github.com/sidekiq/sidekiq/blob/main/lib/sidekiq/tui/tabs/base_tab.rb)
- [lib/sidekiq/scheduled.rb](https://github.com/sidekiq/sidekiq/blob/main/lib/sidekiq/scheduled.rb)
- [docs/Pro-2.0-Upgrade.md](https://github.com/sidekiq/sidekiq/blob/main/docs/Pro-2.0-Upgrade.md)
- [lib/sidekiq/ring_buffer.rb](https://github.com/sidekiq/sidekiq/blob/main/lib/sidekiq/ring_buffer.rb)
</details>

## Overview

Sidekiq provides robust data collection enumerators designed to handle large-scale datasets, database relations, and file streams safely within background jobs. By combining the `IterableJob` mixin with specialized enumerator factories, developers can process millions of records in memory-efficient chunks without overwhelming application resources or timing out during server deployments.
Sources: [lib/sidekiq/job/iterable.rb:9-15](https://github.com/sidekiq/sidekiq/blob/main/lib/sidekiq/job/iterable.rb#L9-L15), [lib/sidekiq/iterable_job.rb:33-38](https://github.com/sidekiq/sidekiq/blob/main/lib/sidekiq/iterable_job.rb#L33-L38)

These components solve the common problem of long-running job memory bloat and interruption recovery by persisting cursor state and execution metrics directly in Redis. Whether streaming records from ActiveRecord relations or parsing rows from CSV streams, the framework automatically handles graceful shutdowns, cursor serialization, and job resumption across process restarts.
Sources: [lib/sidekiq/job/iterable.rb:183-192](https://github.com/sidekiq/sidekiq/blob/main/lib/sidekiq/job/iterable.rb#L183-L192), [lib/sidekiq/job/iterable/enumerators.rb:46-131](https://github.com/sidekiq/sidekiq/blob/main/lib/sidekiq/job/iterable/enumerators.rb#L46-L131)

## Iterable Job Module Integration

### Overview

The entry point and mixin architecture for iterable jobs is established through `Sidekiq::IterableJob` and `Sidekiq::Job::Iterable`. When a class includes `Sidekiq::IterableJob`, it automatically incorporates both core Sidekiq job execution features and the iterable module extensions via its `included` callback hook.
Sources: [lib/sidekiq/iterable_job.rb:33-38](https://github.com/sidekiq/sidekiq/blob/main/lib/sidekiq/iterable_job.rb#L33-L38)

Classes adopting this architecture must not define a `#perform` method. The `Sidekiq::Job::Iterable::ClassMethods#method_added` hook inspects added methods and immediately raises a runtime error if a `#perform` method is detected on the including class, reserving the internal execution pipeline for the iterable engine.
Sources: [lib/sidekiq/job/iterable.rb:18-23](https://github.com/sidekiq/sidekiq/blob/main/lib/sidekiq/job/iterable.rb#L18-L23)

### Execution Call-Chain Walkthrough

When an iterable job is triggered via `ProcessUserSet.perform_async(123)`, Sidekiq invokes the internal `#perform` method rather than user-defined job logic. The execution call-chain proceeds through specific internal methods:

1. `perform(*args)` — Duplicates and freezes arguments, calls `fetch_previous_iteration_state` to load execution metadata from Redis, increments `@_executions`, and timestamps the start via `mono_now`.
Sources: [lib/sidekiq/job/iterable.rb:141-147](https://github.com/sidekiq/sidekiq/blob/main/lib/sidekiq/job/iterable.rb#L141-L147)

2. `build_enumerator(*args, cursor: @_cursor)` — Invokes the subclass implementation to generate the sequence, returning `nil` to skip processing or raising an `ArgumentError` via `assert_enumerator!` if the result is not a Ruby `Enumerator`.
Sources: [lib/sidekiq/job/iterable.rb:148-154](https://github.com/sidekiq/sidekiq/blob/main/lib/sidekiq/job/iterable.rb#L148-L154)

3. Lifecycle hooks (`on_start` or `on_resume`) — Dispatches `on_start` if `@_executions` equals 1, or `on_resume` for subsequent retries and continued executions.
Sources: [lib/sidekiq/job/iterable.rb:156-160](https://github.com/sidekiq/sidekiq/blob/main/lib/sidekiq/job/iterable.rb#L156-L160)

4. `iterate_with_enumerator(enumerator, arguments)` — Loops through yielded items, checking cancellation status, evaluating time limits, flushing state every 5 seconds, and executing `around_iteration` wrapping `each_iteration(object, *arguments)`.
Sources: [lib/sidekiq/job/iterable.rb:198-236](https://github.com/sidekiq/sidekiq/blob/main/lib/sidekiq/job/iterable.rb#L198-L236)

5. Completion handling (`on_stop`, `handle_completed`, `on_complete`, `cleanup` or `reenqueue_iteration_job`) — Runs `on_stop`, normalizes completion status, and either cleans up Redis keys upon full completion or raises `Sidekiq::Job::Interrupted` to reschedule the job with its saved cursor.
Sources: [lib/sidekiq/job/iterable.rb:166-174](https://github.com/sidekiq/sidekiq/blob/main/lib/sidekiq/job/iterable.rb#L166-L174)

> [!WARNING]
> Defining a custom `#perform` method inside an iterable job class will trigger an immediate runtime exception upon definition. Subclasses must implement `#build_enumerator` and `#each_iteration` instead.
> Sources: [lib/sidekiq/job/iterable.rb:18-23](https://github.com/sidekiq/sidekiq/blob/main/lib/sidekiq/job/iterable.rb#L18-L23)

### Lifecycle Hooks and Configuration Reference

Iterable jobs expose several hook methods and configuration constants that control execution pacing, state retention, and cleanup.

| Method / Constant | Type / Return | Purpose |
| :--- | :--- | :--- |
| `on_start` | Hook (void) | Called only once when the iterable job begins execution for the first time. |
| `on_resume` | Hook (void) | Called when the job resumes iterating after a previous interruption or re-queue. |
| `around_iteration` | Hook (yield) | Wraps each individual iteration block execution, useful for metrics and performance tracking. |
| `on_stop` | Hook (void) | Called every time the job stops iterating, regardless of completion status. |
| `on_cancel` | Hook (void) | Called when the job detects a cancellation flag set in Redis. |
| `on_complete` | Hook (void) | Called once when the enumerator finishes processing all items successfully. |
| `STATE_FLUSH_INTERVAL` | Integer (5) | Frequency in seconds at which execution state is flushed to Redis during iteration. |
| `STATE_TTL` | Integer (2592000) | Time-to-live for the iteration state hash in Redis, set to one month to support long retry windows. |
| `CANCELLATION_PERIOD` | String ("259200") | Duration string used when retaining cancellation keys in Redis. |

Sources: [lib/sidekiq/job/iterable.rb:50](https://github.com/sidekiq/sidekiq/blob/main/lib/sidekiq/job/iterable.rb#L50), [lib/sidekiq/job/iterable.rb:77-112](https://github.com/sidekiq/sidekiq/blob/main/lib/sidekiq/job/iterable.rb#L77-L112), [lib/sidekiq/job/iterable.rb:193-196](https://github.com/sidekiq/sidekiq/blob/main/lib/sidekiq/job/iterable.rb#L193-L196)

### Iterable Job Implementation Example

The following complete example demonstrates a custom iterable job incorporating the required interface methods and optional lifecycle hooks:

```ruby
class ProcessUserSet
  include Sidekiq::IterableJob

  def build_enumerator(shop_id, cursor:)
    shop = Shop.find(shop_id)
    active_record_records_enumerator(shop.users.order(:id), cursor: cursor)
  end

  def each_iteration(user, shop_id)
    user.process_membership!(shop_id)
  end

  def on_start
    logger.info("Starting user set processing job for JID #{jid}")
  end

  def on_complete
    logger.info("Successfully finished processing all users.")
  end
end
```

Sources: [lib/sidekiq/job/iterable.rb:77-112](https://github.com/sidekiq/sidekiq/blob/main/lib/sidekiq/job/iterable.rb#L77-L112), [lib/sidekiq/iterable_job.rb:33-38](https://github.com/sidekiq/sidekiq/blob/main/lib/sidekiq/iterable_job.rb#L33-L38)

## Enumerator Helper Factory Interface

### Overview

The `Sidekiq::Job::Iterable::Enumerators` module supplies helper factory methods designed to instantiate standard Ruby enumerators and specialized streaming enumerators for arrays, `ActiveRecord::Relation` queries, and CSV files. These factory methods are included directly into iterable job classes, allowing developers to construct pagination and batching iterators without manually managing offset cursors or low-level streaming loops.

Sources: [lib/sidekiq/job/iterable/enumerators.rb:6-11](https://github.com/sidekiq/sidekiq/blob/main/lib/sidekiq/job/iterable/enumerators.rb#L6-L11)

### Enumerator Factory Methods Reference

The `Enumerators` module defines six primary factory functions. Each method accepts a data source along with a required `cursor:` keyword argument and optional configuration keyword arguments.

| Method Name | Arguments | Return Type | Description |
| :--- | :--- | :--- | :--- |
| `array_enumerator` | `array, cursor:` | `Enumerator` | Builds an Enumerator from a Ruby Array, dropping items up to the specified integer offset `cursor`. |
| `active_record_records_enumerator` | `relation, cursor:, **options` | `ActiveRecordEnumerator` (records) | Enumerates individual records from an `ActiveRecord::Relation`, advancing one row per tick. |
| `active_record_batches_enumerator` | `relation, cursor:, **options` | `ActiveRecordEnumerator` (batches) | Enumerates fixed-size arrays of records from an `ActiveRecord::Relation`, advancing by `batch_size` per tick. |
| `active_record_relations_enumerator` | `relation, cursor:, **options` | `ActiveRecordEnumerator` (relations) | Enumerates sub-relation scopes from an `ActiveRecord::Relation`, yielding relation objects per batch. |
| `csv_enumerator` | `csv, cursor:` | `Enumerator` (rows) | Enumerates individual rows from a CSV instance, starting iteration from the given integer cursor offset. |
| `csv_batches_enumerator` | `csv, cursor:, **options` | `Enumerator` (batches) | Enumerates batches of rows from a CSV instance, configured by an optional `batch_size` option. |

Sources: [lib/sidekiq/job/iterable/enumerators.rb:20-131](https://github.com/sidekiq/sidekiq/blob/main/lib/sidekiq/job/iterable/enumerators.rb#L20-L131)

### Array Enumerator Construction Mechanics

The `array_enumerator` method validates that the provided input is a valid Ruby `Array`, raising an `ArgumentError` if any other object type is supplied. It chains `each_with_index` and `drop(cursor || 0)` on the collection, then wraps the resulting enumerator in a sizing block using `x.to_enum { x.size }`.

```ruby
def array_enumerator(array, cursor:)
  raise ArgumentError, "array must be an Array" unless array.is_a?(Array)

  x = array.each_with_index.drop(cursor || 0)
  x.to_enum { x.size }
end
```

Sources: [lib/sidekiq/job/iterable/enumerators.rb:20-25](https://github.com/sidekiq/sidekiq/blob/main/lib/sidekiq/job/iterable/enumerators.rb#L20-L25)

> [!WARNING]
> Passing a non-array object (such as a Hash or a plain Enumerator) to `array_enumerator` triggers an immediate `ArgumentError` (`array must be an Array`). Always ensure input collections are converted to arrays or use the appropriate ActiveRecord or CSV factory.
> Sources: [lib/sidekiq/job/iterable/enumerators.rb:20-22](https://github.com/sidekiq/sidekiq/blob/main/lib/sidekiq/job/iterable/enumerators.rb#L20-L22)

### ActiveRecord and CSV Integration Examples

Iterable job implementations invoke these factory methods inside their `#build_enumerator` definitions. For instance, `PostCreator` instantiates an array enumerator over a generated range of numeric identifiers, while `PostUpdater` constructs an ActiveRecord batch enumerator targeting a subset of posts.

```ruby
class PostCreator
  include Sidekiq::IterableJob

  def build_enumerator(start_at, count, **kwargs)
    @start_at = start_at
    @count = count
    array_enumerator((start_at...(start_at + count)).to_a, **kwargs)
  end

  def each_iteration(pid, *)
    Post.create!(id: pid, title: "Post #{pid}", body: "Body of post #{pid}")
  end
end
```

Sources: [myapp/app/jobs/post_creator.rb:1-21](https://github.com/sidekiq/sidekiq/blob/main/myapp/app/jobs/post_creator.rb#L1-L21)

Similarly, database relation batching and CSV file parsing delegate construction directly to `ActiveRecordEnumerator` and `CsvEnumerator` instances respectively:

```ruby
class PostUpdater
  include Sidekiq::IterableJob

  def build_enumerator(start_at, count, cursor:)
    active_record_batches_enumerator(
      Post.where("id >= ? and id < ?", start_at, start_at + count),
      cursor: cursor,
      batch_size: 10
    )
  end

  def each_iteration(batch, *)
    Post.transaction do
      batch.each do |post|
        post.body = "Updated"
        post.save!
      end
    end
  end
end
```

Sources: [lib/sidekiq/job/iterable/enumerators.rb:68-70](https://github.com/sidekiq/sidekiq/blob/main/lib/sidekiq/job/iterable/enumerators.rb#L68-L70), [lib/sidekiq/job/iterable/enumerators.rb:129-131](https://github.com/sidekiq/sidekiq/blob/main/lib/sidekiq/job/iterable/enumerators.rb#L129-L131), [myapp/app/jobs/post_updater.rb:1-22](https://github.com/sidekiq/sidekiq/blob/main/myapp/app/jobs/post_updater.rb#L1-L22)

## ActiveRecord Batched Streaming Enumerator

### ActiveRecord Batched Streaming Enumerator

The `ActiveRecordEnumerator` class provides streaming capabilities for `ActiveRecord::Relation` objects, managing cursor state and supporting three distinct iteration granularities: individual records, record batches, and sub-relation scopes. It accepts an ActiveRecord relation, an optional cursor, and arbitrary configuration options during initialization.

Sources: [lib/sidekiq/job/iterable/active_record_enumerator.rb:7-12](https://github.com/sidekiq/sidekiq/blob/main/lib/sidekiq/job/iterable/active_record_enumerator.rb#L7-L12)

### Enumeration Modes and Methods

`ActiveRecordEnumerator` exposes three primary methods that wrap Ruby's `Enumerator` class with relation sizing blocks:

- `#records`: Invokes `@relation.find_each(**@options, start: @cursor)` and yields each record alongside its `record.id` as the cursor token.
- `#batches`: Invokes `@relation.find_in_batches(**@options, start: @cursor)` and yields each array batch alongside `batch.first.id`.
- `#relations`: Invokes `@relation.in_batches` after aliasing `:batch_size` to `:of`, yielding each sub-relation scope alongside `first_record.id`.

Sources: [lib/sidekiq/job/iterable/active_record_enumerator.rb:14-42](https://github.com/sidekiq/sidekiq/blob/main/lib/sidekiq/job/iterable/active_record_enumerator.rb#L14-L42)

```ruby
def records
  Enumerator.new(-> { @relation.count }) do |yielder|
    @relation.find_each(**@options, start: @cursor) do |record|
      yielder.yield(record, record.id)
    end
  end
end
```

Sources: [lib/sidekiq/job/iterable/active_record_enumerator.rb:14-20](https://github.com/sidekiq/sidekiq/blob/main/lib/sidekiq/job/iterable/active_record_enumerator.rb#L14-L20)

### Size Calculation and Batch Options

For sub-relation iteration, `relations_size` computes the total number of batches using ceiling division against the configured `:batch_size` option (defaulting to 1000).

```ruby
def relations_size
  batch_size = @options[:batch_size] || 1000
  (@relation.count + batch_size - 1) / batch_size # ceiling division
end
```

Sources: [lib/sidekiq/job/iterable/active_record_enumerator.rb:46-49](https://github.com/sidekiq/sidekiq/blob/main/lib/sidekiq/job/iterable/active_record_enumerator.rb#L46-L49)

> [!NOTE]
> In `#relations`, `options[:of] ||= options.delete(:batch_size)` ensures compatibility with ActiveRecord's underlying `in_batches` method by translating Sidekiq's `:batch_size` parameter into Rails' expected `:of` keyword argument.
> Sources: [lib/sidekiq/job/iterable/active_record_enumerator.rb:34-36](https://github.com/sidekiq/sidekiq/blob/main/lib/sidekiq/job/iterable/active_record_enumerator.rb#L34-L36)

## CSV File Streaming Enumerator

### Overview

The CSV file streaming subsystem provides mechanisms to iterate over comma-separated value data streams either row by row or in batch slices, tracking position using integer offset cursors. It is anchored by the `CsvEnumerator` class, which enforces that initialized sources are valid instances of the Ruby standard library `CSV` class.

Sources: [lib/sidekiq/job/iterable/csv_enumerator.rb:7-14](https://github.com/sidekiq/sidekiq/blob/main/lib/sidekiq/job/iterable/csv_enumerator.rb#L7-L14)

### CsvEnumerator Interface and Methods

`CsvEnumerator` relies on lazy enumeration to process files efficiently without loading entire data streams into memory at once. It exposes two public methods for iteration building alongside a private row-counting utility.

- `initialize(csv)`: Validates that `defined?(CSV)` is true and that `csv.instance_of?(CSV)` evaluates to true; otherwise, it raises an `ArgumentError`.
- `rows(cursor:)`: Wraps the CSV stream in a lazy enumerator, pairs each row with an index using `each_with_index`, drops entries up to the offset specified by `cursor || 0`, and constructs an Enumerator with a lazy size calculation block calling `count_of_rows_in_file`.
- `batches(cursor:, batch_size: 100)`: Slices the lazy CSV stream into chunks of `batch_size` via `each_slice`, attaches indices with `with_index`, drops slices up to the `cursor || 0` offset, and builds an Enumerator whose size block evaluates ceiling division of the total row count by the batch size.

Sources: [lib/sidekiq/job/iterable/csv_enumerator.rb:8-29](https://github.com/sidekiq/sidekiq/blob/main/lib/sidekiq/job/iterable/csv_enumerator.rb#L8-L29)

```ruby
def rows(cursor:)
  @csv.lazy
    .each_with_index
    .drop(cursor || 0)
    .to_enum { count_of_rows_in_file }
end

def batches(cursor:, batch_size: 100)
  @csv.lazy
    .each_slice(batch_size)
    .with_index
    .drop(cursor || 0)
    .to_enum { (count_of_rows_in_file.to_f / batch_size).ceil }
end
```

Sources: [lib/sidekiq/job/iterable/csv_enumerator.rb:16-29](https://github.com/sidekiq/sidekiq/blob/main/lib/sidekiq/job/iterable/csv_enumerator.rb#L16-L29)

### Row Counting and File Path Resolution

To determine enumerator sizes for progress tracking, `count_of_rows_in_file` inspects `@csv.path`. If a file path is present, it invokes system command line utilities to count lines, automatically adjusting for header rows when configured.

```ruby
def count_of_rows_in_file
  filepath = @csv.path
  return unless filepath

  count = IO.popen(["wc", "-l", filepath]) do |out|
    out.read.strip.to_i
  end

  count -= 1 if @csv.headers
  count
end
```

Sources: [lib/sidekiq/job/iterable/csv_enumerator.rb:33-43](https://github.com/sidekiq/sidekiq/blob/main/lib/sidekiq/job/iterable/csv_enumerator.rb#L33-L43)

> [!WARNING]
> `count_of_rows_in_file` relies directly on `@csv.path` and executes an external `wc -l` process via `IO.popen`. CSV sources that exist purely in-memory as StringIO objects without an underlying file path will return `nil` for size calculations.
> Sources: [lib/sidekiq/job/iterable/csv_enumerator.rb:33-35](https://github.com/sidekiq/sidekiq/blob/main/lib/sidekiq/job/iterable/csv_enumerator.rb#L33-L35)

### Enumerator Helper Factory Integration

The `Enumerators` module exposes high-level factory methods—`csv_enumerator` and `csv_batches_enumerator`—which delegate directly to `CsvEnumerator` instance methods for consumption inside iterable jobs.

```ruby
def csv_enumerator(csv, cursor:)
  CsvEnumerator.new(csv).rows(cursor: cursor)
end

def csv_batches_enumerator(csv, cursor:, **options)
  CsvEnumerator.new(csv).batches(cursor: cursor, **options)
end
```

Sources: [lib/sidekiq/job/iterable/enumerators.rb:109-131](https://github.com/sidekiq/sidekiq/blob/main/lib/sidekiq/job/iterable/enumerators.rb#L109-L131)

## Iteration State Persistence and Resumption

### Overview

The iterable job subsystem persists execution state to Redis and handles process interrupts to support resumable long-running loops across multiple job executions. State persistence involves serializing iteration execution counts, cursors, and runtimes into a Redis hash keyed by `it-#{jid}`, accompanied by TTL and cancellation flag management.

Sources: [lib/sidekiq/job/iterable.rb:136-191](https://github.com/sidekiq/sidekiq/blob/main/lib/sidekiq/job/iterable.rb#L136-L191), [lib/sidekiq/job/iterable.rb:281-296](https://github.com/sidekiq/sidekiq/blob/main/lib/sidekiq/job/iterable.rb#L281-L296)

### Call-Chain Execution Walkthrough

When an iterable job executes, it coordinates state retrieval, enumeration, interval flushing, and interruption or completion cleanup through a structured method call chain.

`perform` → `fetch_previous_iteration_state` → `build_enumerator` → `iterate_with_enumerator` → `flush_state` / `reenqueue_iteration_job` / `cleanup`

1. `perform(*args)`: Initializes arguments, invokes `fetch_previous_iteration_state` to load persisted cursor and execution counts from Redis, tracks start time, and builds the enumerator.
Sources: [lib/sidekiq/job/iterable.rb:141-175](https://github.com/sidekiq/sidekiq/blob/main/lib/sidekiq/job/iterable.rb#L141-L175)

2. `fetch_previous_iteration_state`: Queries `it-#{jid}` in Redis via `hgetall`, setting `@_executions`, `@_cursor`, and `@_runtime` if state exists.
Sources: [lib/sidekiq/job/iterable.rb:183-303](https://github.com/sidekiq/sidekiq/blob/main/lib/sidekiq/job/iterable.rb#L183-L303)

3. `iterate_with_enumerator(enumerator, arguments)`: Iterates over the enumerator elements, updating `@_cursor` and `@current_object`, periodically checking cancellation flags and flushing state every 5 seconds or upon interruption.
Sources: [lib/sidekiq/job/iterable.rb:136-138](https://github.com/sidekiq/sidekiq/blob/main/lib/sidekiq/job/iterable.rb#L136-L138), [lib/sidekiq/job/iterable.rb:214-224](https://github.com/sidekiq/sidekiq/blob/main/lib/sidekiq/job/iterable.rb#L214-L224), [lib/sidekiq/job/iterable.rb:254-259](https://github.com/sidekiq/sidekiq/blob/main/lib/sidekiq/job/iterable.rb#L254-L259), [lib/sidekiq/job/iterable.rb:302-303](https://github.com/sidekiq/sidekiq/blob/main/lib/sidekiq/job/iterable.rb#L302-L303)

4. `reenqueue_iteration_job`: If interrupted, flushes state to Redis and raises `Sidekiq::Job::Interrupted`, which re-queues the job to continue from the saved cursor.
Sources: [lib/sidekiq/job/iterable.rb:141-175](https://github.com/sidekiq/sidekiq/blob/main/lib/sidekiq/job/iterable.rb#L141-L175)

5. `cleanup`: If iteration completes successfully, unlinks the Redis iteration key and logs final metrics.
Sources: [lib/sidekiq/job/iterable.rb:183-303](https://github.com/sidekiq/sidekiq/blob/main/lib/sidekiq/job/iterable.rb#L183-L303)

### State Persistence Constants and Structure

Iteration state is stored under a Redis hash key using explicit schema keys and retention constants.

| Constant / Field | Value / Key | Meaning |
| :--- | :--- | :--- |
| `iteration_key` | `"it-#{jid}"` | Redis hash key identifying the iterable job state by JID |
| `STATE_FLUSH_INTERVAL` | `5` seconds | Minimum frequency for flushing iteration state and checking cancellation |
| `STATE_TTL` | `2592000` (1 month) | Expiration TTL applied to the iteration hash key |
| `CANCELLATION_PERIOD` | `259200` (3 days) | TTL window ensuring cancellation flags persist prior to retry execution |
| State Hash `"ex"` | Integer | Total execution count (`@_executions`) |
| State Hash `"c"` | JSON string | Serialized cursor position (`@_cursor`) |
| State Hash `"rt"` | Float | Accumulated runtime (`@_runtime`) |

Sources: [lib/sidekiq/job/iterable.rb:50-64](https://github.com/sidekiq/sidekiq/blob/main/lib/sidekiq/job/iterable.rb#L50-L64), [lib/sidekiq/job/iterable.rb:136-138](https://github.com/sidekiq/sidekiq/blob/main/lib/sidekiq/job/iterable.rb#L136-L138), [lib/sidekiq/job/iterable.rb:183-196](https://github.com/sidekiq/sidekiq/blob/main/lib/sidekiq/job/iterable.rb#L183-L196), [lib/sidekiq/job/iterable.rb:281-296](https://github.com/sidekiq/sidekiq/blob/main/lib/sidekiq/job/iterable.rb#L281-L296)

> [!WARNING]
> If `each_iteration` raises an exception, state is immediately flushed to Redis via `flush_state` before the exception propagates upward, ensuring the cursor position is preserved for subsequent retries.
> Sources: [lib/sidekiq/job/iterable.rb:228-235](https://github.com/sidekiq/sidekiq/blob/main/lib/sidekiq/job/iterable.rb#L228-L235)

### Design Trade-Offs

| Design Choice | Benefit | Cost |
| :--- | :--- | :--- |
| Periodic Redis state flushing (`5`s interval) | Limits data loss on crash; avoids per-item Redis bottleneck | Incurs network round-trip overhead during tight loops |
| Separate `it-#{jid}` hash keys | Keeps iteration state isolated from primary job payloads | Leaves orphaned keys if cleanup fails before TTL expiration |
| Raising `Interrupted` exception on pause | Integrates cleanly with Sidekiq's retry and backoff infrastructure | Relies on exception control flow to manage yield loops |

Sources: [lib/sidekiq/job/iterable.rb:136-138](https://github.com/sidekiq/sidekiq/blob/main/lib/sidekiq/job/iterable.rb#L136-L138), [lib/sidekiq/job/iterable.rb:214-224](https://github.com/sidekiq/sidekiq/blob/main/lib/sidekiq/job/iterable.rb#L214-L224), [lib/sidekiq/job/iterable.rb:254-259](https://github.com/sidekiq/sidekiq/blob/main/lib/sidekiq/job/iterable.rb#L254-L259), [lib/sidekiq/job/iterable.rb:302-303](https://github.com/sidekiq/sidekiq/blob/main/lib/sidekiq/job/iterable.rb#L302-L303)

## Related

- [[Iterable Job Processing]]

