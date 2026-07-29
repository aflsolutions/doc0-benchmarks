# Job Testing Harness

<details>
<summary>Relevant source files</summary>

The following files were used as context for generating this wiki page:

- [lib/sidekiq/job.rb](https://github.com/sidekiq/sidekiq/blob/main/lib/sidekiq/job.rb)
- [lib/sidekiq/client.rb](https://github.com/sidekiq/sidekiq/blob/main/lib/sidekiq/client.rb)
- [lib/sidekiq/test_api.rb](https://github.com/sidekiq/sidekiq/blob/main/lib/sidekiq/test_api.rb)
- [lib/sidekiq/api.rb](https://github.com/sidekiq/sidekiq/blob/main/lib/sidekiq/api.rb)
- [lib/active_job/queue_adapters/sidekiq_adapter.rb](https://github.com/sidekiq/sidekiq/blob/main/lib/active_job/queue_adapters/sidekiq_adapter.rb)
- [lib/sidekiq/processor.rb](https://github.com/sidekiq/sidekiq/blob/main/lib/sidekiq/processor.rb)
- [lib/sidekiq/job_util.rb](https://github.com/sidekiq/sidekiq/blob/main/lib/sidekiq/job_util.rb)
- [lib/sidekiq.rb](https://github.com/sidekiq/sidekiq.rb)
- [myapp/app/controllers/job_controller.rb](https://github.com/sidekiq/sidekiq/blob/main/myapp/app/controllers/job_controller.rb)
- [myapp/config/initializers/sidekiq.rb](https://github.com/sidekiq/sidekiq/blob/main/myapp/config/initializers/sidekiq.rb)
- [lib/sidekiq/testing/inline.rb](https://github.com/sidekiq/sidekiq/blob/main/lib/sidekiq/testing/inline.rb)
- [lib/sidekiq/embedded.rb](https://github.com/sidekiq/sidekiq/blob/main/lib/sidekiq/embedded.rb)
- [lib/sidekiq/transaction_aware_client.rb](https://github.com/sidekiq/sidekiq/blob/main/lib/sidekiq/transaction_aware_client.rb)
- [lib/sidekiq/testing.rb](https://github.com/sidekiq/sidekiq/blob/main/lib/sidekiq/testing.rb)
- [myapp/app/sidekiq/exit_job.rb](https://github.com/sidekiq/sidekiq/blob/main/myapp/app/sidekiq/exit_job.rb)
- [myapp/app/jobs/exit_job.rb](https://github.com/sidekiq/sidekiq/blob/main/myapp/app/jobs/exit_job.rb)
- [myapp/app/sidekiq/hard_job.rb](https://github.com/sidekiq/sidekiq/blob/main/myapp/app/sidekiq/hard_job.rb)
- [myapp/app/sidekiq/lazy_job.rb](https://github.com/sidekiq/sidekiq/blob/main/myapp/app/sidekiq/lazy_job.rb)
- [docs/internals.md](https://github.com/sidekiq/sidekiq/blob/main/docs/internals.md)
- [bare/boot.rb](https://github.com/sidekiq/sidekiq/blob/main/bare/boot.rb)
- [README.md](https://github.com/sidekiq/sidekiq/blob/main/README.md)
</details>

## Overview

The Sidekiq Job Testing Harness provides testing infrastructure designed to bypass external network dependencies during test suites, allowing developers to verify job enqueuing, inspect payload parameters, and execute background tasks deterministically. By intercepting client pushes through configurable test modes, the testing harness isolates application logic from Redis and ensures clean test isolation across threads and test runs. 
Sources: [lib/sidekiq/test_api.rb:209-215](https://github.com/sidekiq/sidekiq/blob/main/lib/sidekiq/test_api.rb#L209-L215)

## Test Mode Configuration and State

### Overview

The Sidekiq testing subsystem manages test states globally and per-thread through helper methods. Test mode state determines how client job pushes behave, routing payloads into internal memory collections, executing them synchronously, or falling back to standard Redis operations. 
Sources: [lib/sidekiq/test_api.rb:6-34](https://github.com/sidekiq/sidekiq/blob/main/lib/sidekiq/test_api.rb#L6-L34), [lib/sidekiq.rb:50-55](https://github.com/sidekiq/sidekiq/blob/main/lib/sidekiq.rb#L50-L55)

### Test Mode Configuration and State Management

Testing modes are configured via helper methods. The supported testing modes are `:fake`, `:inline`, and `:disable`. Passing an unknown symbol raises an error. 
Sources: [lib/sidekiq/test_api.rb:44-54](https://github.com/sidekiq/sidekiq/blob/main/lib/sidekiq/test_api.rb#L44-L54), [lib/sidekiq.rb:50-51](https://github.com/sidekiq/sidekiq/blob/main/lib/sidekiq.rb#L50-L51)

| Testing Mode | Helper Method / Value | Behavior |
| :--- | :--- | :--- |
| `:fake` | `fake!` | Intercepts job pushes without hitting the network, storing payloads in per-class and per-queue arrays for assertion. |
| `:inline` | `inline!` | Executes enqueued jobs immediately in the calling thread upon push. |
| `:disable` | `disable!` | Disables the testing harness, routing client pushes to standard Redis operations. |

Sources: [lib/sidekiq/test_api.rb:44-70](https://github.com/sidekiq/sidekiq/blob/main/lib/sidekiq/test_api.rb#L44-L70)

State resolution checks thread-local configuration before falling back to global state. Calling any test mode configuration method with a block restricts the mode change exclusively to the current thread for the duration of that block, ensuring thread-safe isolation in multi-threaded test runners. 
Sources: [lib/sidekiq/test_api.rb:12-38](https://github.com/sidekiq/sidekiq/blob/main/lib/sidekiq/test_api.rb#L12-L38)

> [!CAUTION]
> Nesting test mode blocks within the same thread raises an error because reentrant testing modes produce difficult-to-reason-about execution paths. Set testing modes once globally or override them once per thread. 
> Sources: [lib/sidekiq/test_api.rb:15-21](https://github.com/sidekiq/sidekiq/blob/main/lib/sidekiq/test_api.rb#L15-L21)

## Fake Mode Push Assertions

### Overview

When fake mode is enabled, the client push pipeline intercepts outgoing job payloads and diverts them away from Redis. Instead of serializing to network sockets, jobs are captured in memory structures maintained in memory and accessed through worker class collections like `HardJob.jobs`. 
Sources: [lib/sidekiq/test_api.rb:84-90](https://github.com/sidekiq/sidekiq/blob/main/lib/sidekiq/test_api.rb#L84-L90), [lib/sidekiq/test_api.rb:209-214](https://github.com/sidekiq/sidekiq/blob/main/lib/sidekiq/test_api.rb#L209-L214)

### Call-Chain Execution Walkthrough

When an application invokes `perform_async` on a worker class during fake mode, execution flows through the client and test interception modules in a precise sequence:

1. Client push methods normalize the incoming job hash, execute client middleware, verify JSON safety, and invoke push routines. 
Sources: [lib/sidekiq/client.rb:101-111](https://github.com/sidekiq/sidekiq/blob/main/lib/sidekiq/client.rb#L101-L111), [lib/sidekiq/client.rb:139-185](https://github.com/sidekiq/sidekiq/blob/main/lib/sidekiq/client.rb#L139-L185)
2. Push routines delegate to connection pools and call atomic push routines inside pipelined blocks. 
Sources: [lib/sidekiq/client.rb:260-266](https://github.com/sidekiq/sidekiq/blob/main/lib/sidekiq/client.rb#L260-L266)
3. Testing hooks intercept the call via module prepend. 
Sources: [lib/sidekiq/test_api.rb:82-85](https://github.com/sidekiq/sidekiq/blob/main/lib/sidekiq/test_api.rb#L82-L85)
4. For each payload, it clones and deep-loads/dumps JSON to simulate serialization isolation, sets enqueued timestamps if no timestamp is present, and pushes the job into memory queues. 
Sources: [lib/sidekiq/test_api.rb:85-89](https://github.com/sidekiq/sidekiq/blob/main/lib/sidekiq/test_api.rb#L85-L89)
5. Memory queue structures concurrently insert the payload into two separate hash structures: one keyed by queue name and another keyed by worker class name, ensuring that both queue inspections and worker `.jobs` array references remain synchronized. 
Sources: [lib/sidekiq/test_api.rb:107-117](https://github.com/sidekiq/sidekiq/blob/main/lib/sidekiq/test_api.rb#L107-L117), [lib/sidekiq/test_api.rb:178-181](https://github.com/sidekiq/sidekiq/blob/main/lib/sidekiq/test_api.rb#L178-L181)

Sources: [lib/sidekiq/client.rb:101-111](https://github.com/sidekiq/sidekiq/blob/main/lib/sidekiq/client.rb#L101-L111), [lib/sidekiq/client.rb:260-266](https://github.com/sidekiq/sidekiq/blob/main/lib/sidekiq/client.rb#L260-L266), [lib/sidekiq/test_api.rb:82-117](https://github.com/sidekiq/sidekiq/blob/main/lib/sidekiq/test_api.rb#L82-L117), [lib/sidekiq/test_api.rb:178-181](https://github.com/sidekiq/sidekiq/blob/main/lib/sidekiq/test_api.rb#L178-L181)

### Dual-Hash Collection Architecture

To support test assertions like `expect(HardJob.jobs.size).to eq(1)` alongside queue-level checks, internal test queues maintain two independent hash stores referencing the exact same job hash instances in memory. 
Sources: [lib/sidekiq/test_api.rb:107-117](https://github.com/sidekiq/sidekiq/blob/main/lib/sidekiq/test_api.rb#L107-L117)

| Data Structure Method | Underlying Hash Store | Key Type | Purpose |
| :--- | :--- | :--- | :--- |
| Queue lookup | Queue hash store | String queue name (e.g. `"default"`) | Groups all enqueued payloads destined for a specific Redis queue. |
| `WorkerClass.jobs` | Worker class hash store | String class name (e.g. `"HardJob"`) | Provides direct reference arrays per job class for RSpec and Minitest assertions. |

Sources: [lib/sidekiq/test_api.rb:173-191](https://github.com/sidekiq/sidekiq/blob/main/lib/sidekiq/test_api.rb#L173-L191), [lib/sidekiq/test_api.rb:255-258](https://github.com/sidekiq/sidekiq/blob/main/lib/sidekiq/test_api.rb#L255-L258)

> [!NOTE]
> Maintaining two separate hash collections prevents RSpec matchers like `change(HardJob.jobs, :size)` from failing. If worker jobs were derived via dynamic array filtering on a single queue list, reference equality would be lost and test matchers would fail to detect size mutations. 
> Sources: [lib/sidekiq/test_api.rb:109-117](https://github.com/sidekiq/sidekiq/blob/main/lib/sidekiq/test_api.rb#L109-L117)

### Fake Mode Assertion Example

The following example demonstrates how to configure fake mode and assert that job push parameters, arguments, and queue assignments match expectations without connecting to Redis:

```ruby
require 'sidekiq/testing'

Sidekiq.testing!(:fake)

# Clear any lingering jobs from prior tests
Sidekiq::Job.clear_all

# Enqueue a job via standard client push
HardJob.perform_async(1, 2, :bat => 'bar')

# Verify job count and payload attributes
assert_equal 1, HardJob.jobs.size
assert_equal "default", HardJob.jobs[0]["queue"]
assert_equal [1, 2, {"bat" => "bar"}], HardJob.jobs[0]["args"]
assert_nil HardJob.jobs[0]["at"]
```

Sources: [lib/sidekiq/test_api.rb:210-227](https://github.com/sidekiq/sidekiq/blob/main/lib/sidekiq/test_api.rb#L210-L227), [lib/sidekiq/job_util.rb:93-93](https://github.com/sidekiq/sidekiq/blob/main/lib/sidekiq/job_util.rb#L93-L93)

## Synchronous Execution in Inline Mode

### Overview

When inline mode is enabled, jobs pushed via `perform_async` bypass the Redis queue entirely and execute immediately within the caller's thread. This mode intercepts atomic client pushes and delegates execution directly to the target worker class. 
Sources: [lib/sidekiq/test_api.rb:91-98](https://github.com/sidekiq/sidekiq/blob/main/lib/sidekiq/test_api.rb#L91-L98)

### Inline Mode Call-Chain Walkthrough

The synchronous execution path in inline mode follows a strict sequence of calls from client push interception through server-side processing:

1. Testing push interceptors check for inline mode, iterate over the payload array, assign a secure random ID if absent, and load/dump the payload via JSON. 
Sources: [lib/sidekiq/test_api.rb:91-96](https://github.com/sidekiq/sidekiq/blob/main/lib/sidekiq/test_api.rb#L91-L96)
2. It constantizes the worker class using `Object.const_get(job["class"])`. 
Sources: [lib/sidekiq/test_api.rb:93-93](https://github.com/sidekiq/sidekiq/blob/main/lib/sidekiq/test_api.rb#L93-L93)
3. It invokes class-level job processing methods with the job hash. 
Sources: [lib/sidekiq/test_api.rb:96-96](https://github.com/sidekiq/sidekiq/blob/main/lib/sidekiq/test_api.rb#L96-L96)
4. Job processing class methods instantiate the worker, assign identifiers, and wrap execution in server middleware chains. 
Sources: [lib/sidekiq/job.rb:282-289](https://github.com/sidekiq/sidekiq/blob/main/lib/sidekiq/job.rb#L282-L289)
5. Finally, execution routines call `worker.perform(*args)`. 
Sources: [lib/sidekiq/job.rb:291-293](https://github.com/sidekiq/sidekiq/blob/main/lib/sidekiq/job.rb#L291-L293)

Sources: [lib/sidekiq/job.rb:282-293](https://github.com/sidekiq/sidekiq/blob/main/lib/sidekiq/job.rb#L282-L293), [lib/sidekiq/test_api.rb:91-98](https://github.com/sidekiq/sidekiq/blob/main/lib/sidekiq/test_api.rb#L91-L98)

| Inline Execution Step | Target Module / Class | Action Performed |
| :--- | :--- | :--- |
| Payload Interception | Testing client module | Intercepts atomic push operations when inline mode is active. |
| ID Generation | Testing client module | Generates a 12-byte hex ID if missing. |
| Job Processing | Job class methods | Instantiates the job class, sets identifiers, and runs server middleware. |
| Method Dispatch | Job class methods | Calls `worker.perform(*args)` inside the middleware invocation block. |

Sources: [lib/sidekiq/job.rb:282-293](https://github.com/sidekiq/sidekiq/blob/main/lib/sidekiq/job.rb#L282-L293), [lib/sidekiq/test_api.rb:91-98](https://github.com/sidekiq/sidekiq/blob/main/lib/sidekiq/test_api.rb#L91-L98)

> [!WARNING]
> Requiring the inline testing file directly (`require "sidekiq/testing/inline"`) triggers a deprecation warning and is scheduled for removal in Sidekiq 9.0. Instead, configure inline mode explicitly via `Sidekiq.testing!(:inline)` or use block syntax. 
> Sources: [lib/sidekiq/testing/inline.rb:1-3](https://github.com/sidekiq/sidekiq/blob/main/lib/sidekiq/testing/inline.rb#L1-L3)

### Inline Execution Design Trade-Offs

| Design Choice | Benefit | Cost |
| :--- | :--- | :--- |
| Direct client push interception | Executes jobs immediately without spinning up a background thread or Redis connection. | Blocks the calling thread until the job finishes executing. |
| JSON round-trip serialization in client push | Mimics real network payload serialization constraints during testing. | Incurs serialization overhead on every synchronous job invocation. |

Sources: [lib/sidekiq/test_api.rb:91-98](https://github.com/sidekiq/sidekiq/blob/main/lib/sidekiq/test_api.rb#L91-L98)

## Test API Helper Methods

### Overview

Sidekiq provides test API helper methods via job and queue modules to inspect, clear, drain, and execute enqueued fake jobs without touching Redis. These utilities allow developers to manage the fake job state between test runs and simulate worker execution flow. 
Sources: [lib/sidekiq/test_api.rb:107-173](https://github.com/sidekiq/sidekiq/blob/main/lib/sidekiq/test_api.rb#L107-L173), [lib/sidekiq/test_api.rb:209-317](https://github.com/sidekiq/sidekiq/blob/main/lib/sidekiq/test_api.rb#L209-L317)

### Queue and Job Management Helpers

The test API organizes inspection and manipulation methods across global, queue-specific, and worker-class namespaces.

| Helper Method | Target Scope | Action Performed |
| :--- | :--- | :--- |
| `Sidekiq::Job.clear_all` | Global | Clears all queued jobs across every worker and queue. |
| `Sidekiq::Job.drain_all` | Global | Loops while jobs exist, fetches unique job classes, and invokes `.drain` on each class. |
| `Sidekiq::Queues.clear_all` | Global | Clears internal tracking hashes. |
| `WorkerClass.drain` | Worker-Class | Deletes and processes jobs sequentially until `jobs` is empty. |
| `WorkerClass.perform_one` | Worker-Class | Pops and executes a single job from the queue; raises an error if empty. |
| `WorkerClass.clear` | Worker-Class | Clears all jobs specifically assigned to that worker class. |

Sources: [lib/sidekiq/test_api.rb:202-205](https://github.com/sidekiq/sidekiq/blob/main/lib/sidekiq/test_api.rb#L202-L205), [lib/sidekiq/test_api.rb:260-315](https://github.com/sidekiq/sidekiq/blob/main/lib/sidekiq/test_api.rb#L260-L315)

> [!WARNING]
> Calling `perform_one` on an empty job queue raises an error with the message `"perform_one called with empty job queue"`. Always verify `jobs.empty?` or ensure jobs are enqueued before invoking `perform_one`. 
> Sources: [lib/sidekiq/test_api.rb:80-80](https://github.com/sidekiq/sidekiq/blob/main/lib/sidekiq/test_api.rb#L80-L80), [lib/sidekiq/test_api.rb:274-280](https://github.com/sidekiq/sidekiq/blob/main/lib/sidekiq/test_api.rb#L274-L280)

### Job Drain Call-Chain Walkthrough

When draining jobs for a specific worker class or globally across the test suite, execution follows a precise extraction and execution pipeline:

1. Worker drain methods enter a `while jobs.any?` loop checking the worker's enqueued jobs array. 
Sources: [lib/sidekiq/test_api.rb:267-267](https://github.com/sidekiq/sidekiq/blob/main/lib/sidekiq/test_api.rb#L267-L267)
2. It retrieves the next pending payload using `next_job = jobs.first`. 
Sources: [lib/sidekiq/test_api.rb:268-268](https://github.com/sidekiq/sidekiq/blob/main/lib/sidekiq/test_api.rb#L268-L268)
3. It removes the job from tracking structures via queue deletion utilities. 
Sources: [lib/sidekiq/test_api.rb:269-269](https://github.com/sidekiq/sidekiq/blob/main/lib/sidekiq/test_api.rb#L269-L269)
4. It passes the payload to job processing routines. 
Sources: [lib/sidekiq/test_api.rb:270-270](https://github.com/sidekiq/sidekiq/blob/main/lib/sidekiq/test_api.rb#L270-L270)
5. Processing routines instantiate the worker, assign identifiers, and invoke server middleware chains. 
Sources: [lib/sidekiq/test_api.rb:282-288](https://github.com/sidekiq/sidekiq/blob/main/lib/sidekiq/test_api.rb#L282-L288)
6. Inside the middleware block, execution routines call `worker.perform(*args)`. 
Sources: [lib/sidekiq/test_api.rb:291-293](https://github.com/sidekiq/sidekiq/blob/main/lib/sidekiq/test_api.rb#L291-L293)

Sources: [lib/sidekiq/test_api.rb:265-293](https://github.com/sidekiq/sidekiq/blob/main/lib/sidekiq/test_api.rb#L265-L293)

> [!NOTE]
> `Sidekiq::Job.drain_all` inspects all pending jobs globally, extracts their unique classes, and delegates to each class's `.drain` method repeatedly until no jobs remain. 
> Sources: [lib/sidekiq/test_api.rb:306-315](https://github.com/sidekiq/sidekiq/blob/main/lib/sidekiq/test_api.rb#L306-L315)

## ActiveJob and Transactional Testing Strategy

### Overview

ActiveJob integration and transactional testing rely on specialized adapter classes and client push hooks to bridge Rails workflows with Sidekiq processing. Queue adapters integrate ActiveJob via wrapper classes, delegating immediate jobs to asynchronous push methods, scheduled jobs to scheduled push methods, and bulk enqueuing to bulk push routines. Transaction-aware testing is managed by transaction-aware client implementations, which coordinate push operations with database transaction lifecycles across ActiveRecord. 
Sources: [lib/active_job/queue_adapters/sidekiq_adapter.rb:47-111](https://github.com/sidekiq/sidekiq/blob/main/lib/active_job/queue_adapters/sidekiq_adapter.rb#L47-L111), [lib/sidekiq/transaction_aware_client.rb:7-39](https://github.com/sidekiq/sidekiq/blob/main/lib/sidekiq/transaction_aware_client.rb#L7-L39)

### ActiveJob Adapter Execution Mechanics

When an ActiveJob instance is enqueued using the Sidekiq adapter, execution follows a precise call sequence that wraps the job payload for worker consumption:

1. Adapter enqueue methods construct an options hash containing `wrapped: job.class` and `queue: job.queue_name`, adding `profile` if supported. 
Sources: [lib/active_job/queue_adapters/sidekiq_adapter.rb:63-68](https://github.com/sidekiq/sidekiq/blob/main/lib/active_job/queue_adapters/sidekiq_adapter.rb#L63-L68)
2. It sets up wrapper job options for enqueuing. 
Sources: [lib/active_job/queue_adapters/sidekiq_adapter.rb:69-69](https://github.com/sidekiq/sidekiq/blob/main/lib/active_job/queue_adapters/sidekiq_adapter.rb#L69-L69)
3. It pushes the job asynchronously, assigning the returned JID to `job.provider_job_id`. 
Sources: [lib/active_job/queue_adapters/sidekiq_adapter.rb:70-70](https://github.com/sidekiq/sidekiq/blob/main/lib/active_job/queue_adapters/sidekiq_adapter.rb#L70-L70)
4. When executed by the server, wrapper jobs call `::ActiveJob::Base.execute(job_data.merge("provider_job_id" => jid))`. 
Sources: [lib/active_job/queue_adapters/sidekiq_adapter.rb:13-15](https://github.com/sidekiq/sidekiq/blob/main/lib/active_job/queue_adapters/sidekiq_adapter.rb#L13-L15)

Sources: [lib/active_job/queue_adapters/sidekiq_adapter.rb:13-15](https://github.com/active_job/queue_adapters/sidekiq_adapter.rb#L13-L15), [lib/active_job/queue_adapters/sidekiq_adapter.rb:63-70](https://github.com/active_job/queue_adapters/sidekiq_adapter.rb#L63-L70)

### Transaction-Aware Client Push Hooks

Transaction-aware clients defer job pushes until database transactions commit, preventing phantom jobs from being queued when database transactions roll back.

| Method | Condition / Branch | Action Performed |
| :--- | :--- | :--- |
| `initialize` | `ActiveRecord.version >= Gem::Version.new("7.2")` | Assigns transaction backend to `ActiveRecord.method(:after_all_transactions_commit)`. |
| `initialize` | ActiveRecord `< 7.2` | Assigns transaction backend to `AfterCommitEverywhere.method(:after_commit)`. |
| `push` | Batching active (`Thread.current[:sidekiq_batch]`) | Bypasses transaction deferral and directly executes client push. |
| `push` | Standard non-batch transaction flow | Pre-allocates identifiers, wraps push in transaction backend callbacks, and returns the job ID. |
| `push_bulk` | Bulk items processing | Directly delegates to underlying bulk push routines without transaction awareness. |

Sources: [lib/sidekiq/transaction_aware_client.rb:7-40](https://github.com/sidekiq/sidekiq/blob/main/lib/sidekiq/transaction_aware_client.rb#L7-L40)

> [!WARNING]
> Bulk push implementations in transaction-aware clients do not provide transactionality. This is a deliberate design choice to avoid holding hundreds of thousands of job records in memory during long-running bulk enqueue operations. 
> Sources: [lib/sidekiq/transaction_aware_client.rb:33-39](https://github.com/sidekiq/sidekiq/blob/main/lib/sidekiq/transaction_aware_client.rb#L33-L39)

## Related

- [[Job Definition]]
- [[Client Enqueueing]]

