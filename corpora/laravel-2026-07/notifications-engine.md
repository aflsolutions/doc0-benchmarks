# Notifications Engine

<details>
<summary>Relevant source files</summary>

The following files were used as context for generating this wiki page:

- [src/Illuminate/Notifications/NotificationSender.php](https://github.com/laravel/framework/blob/main/src/Illuminate/Notifications/NotificationSender.php)
- [src/Illuminate/Notifications/Channels/MailChannel.php](https://github.com/laravel/framework/blob/main/src/Illuminate/Notifications/Channels/MailChannel.php)
- [src/Illuminate/Broadcasting/BroadcastManager.php](https://github.com/laravel/framework/blob/main/src/Illuminate/Broadcasting/BroadcastManager.php)
- [src/Illuminate/Notifications/SendQueuedNotifications.php](https://github.com/laravel/framework/blob/main/src/Illuminate/Notifications/SendQueuedNotifications.php)
- [src/Illuminate/Events/Dispatcher.php](https://github.com/laravel/framework/blob/main/src/Illuminate/Events/Dispatcher.php)
- [src/Illuminate/Notifications/ChannelManager.php](https://github.com/laravel/framework/blob/main/src/Illuminate/Notifications/ChannelManager.php)
- [src/Illuminate/Support/Testing/Fakes/NotificationFake.php](https://github.com/laravel/framework/blob/main/src/Illuminate/Support/Testing/Fakes/NotificationFake.php)
- [src/Illuminate/Support/Facades/Notification.php](https://github.com/laravel/framework/blob/main/src/Illuminate/Support/Facades/Notification.php)
- [src/Illuminate/Notifications/Channels/DatabaseChannel.php](https://github.com/laravel/framework/blob/main/src/Illuminate/Notifications/Channels/DatabaseChannel.php)
- [src/Illuminate/Notifications/RoutesNotifications.php](https://github.com/laravel/framework/blob/main/src/Illuminate/Notifications/RoutesNotifications.php)
- [src/Illuminate/Notifications/NotificationServiceProvider.php](https://github.com/laravel/framework/blob/main/src/Illuminate/Notifications/NotificationServiceProvider.php)
- [src/Illuminate/Notifications/Channels/BroadcastChannel.php](https://github.com/laravel/framework/blob/main/src/Illuminate/Notifications/Channels/BroadcastChannel.php)
- [src/Illuminate/Support/Facades/Mail.php](https://github.com/laravel/framework/blob/main/src/Illuminate/Support/Facades/Mail.php)
- [src/Illuminate/Notifications/AnonymousNotifiable.php](https://github.com/laravel/framework/blob/main/src/Illuminate/Notifications/AnonymousNotifiable.php)
- [src/Illuminate/Contracts/Notifications/Dispatcher.php](https://github.com/laravel/framework/blob/main/src/Illuminate/Contracts/Notifications/Dispatcher.php)
- [src/Illuminate/Notifications/Notifiable.php](https://github.com/laravel/framework/blob/main/src/Illuminate/Notifications/Notifiable.php)
- [src/Illuminate/Contracts/Notifications/Factory.php](https://github.com/laravel/framework/blob/main/src/Illuminate/Contracts/Notifications/Factory.php)
- [src/Illuminate/Notifications/Messages/DatabaseMessage.php](https://github.com/laravel/framework/blob/main/src/Illuminate/Notifications/Messages/DatabaseMessage.php)
- [src/Illuminate/Notifications/Events/NotificationSending.php](https://github.com/laravel/framework/blob/main/src/Illuminate/Notifications/Events/NotificationSending.php)
- [src/Illuminate/Notifications/Notification.php](https://github.com/laravel/framework/blob/main/src/Illuminate/Notifications/Notification.php)
</details>

## Overview

The Notifications Engine provides a robust, channel-agnostic notification delivery system capable of dispatching messages across multiple delivery mechanisms such as mail, database, and real-time broadcasting. It addresses the problem of fragmented messaging by supplying unified dispatch interfaces, such as the `Notifiable` trait and `AnonymousNotifiable` routing, alongside facade entry points via `Notification`. The system embodies design decisions centered around extensible driver resolution through `ChannelManager`, asynchronous queue offloading via `SendQueuedNotifications`, and fine-grained event integration with `NotificationSender` and the central event dispatcher. Additionally, it offers comprehensive testing utilities through `NotificationFake` to assert and inspect sent notifications without triggering actual external side effects.

Sources: [src/Illuminate/Notifications/NotificationSender.php:23-312](https://github.com/laravel/framework/blob/main/src/Illuminate/Notifications/NotificationSender.php#L23-L312), [src/Illuminate/Notifications/ChannelManager.php:14-192](https://github.com/laravel/framework/blob/main/src/Illuminate/Notifications/ChannelManager.php#L14-L192), [src/Illuminate/Notifications/SendQueuedNotifications.php:21-196](https://github.com/laravel/framework/blob/main/src/Illuminate/Notifications/SendQueuedNotifications.php#L21-L196), [src/Illuminate/Support/Testing/Fakes/NotificationFake.php:18-405](https://github.com/laravel/framework/blob/main/src/Illuminate/Support/Testing/Fakes/NotificationFake.php#L18-L405), [src/Illuminate/Support/Facades/Notification.php:46-98](https://github.com/laravel/framework/blob/main/src/Illuminate/Support/Facades/Notification.php#L46-L98)

## Dispatch Interfaces and On Demand Routing

### Overview

The public dispatch surface of the notifications engine bridges user-space entry points with the underlying `Illuminate\Contracts\Notifications\Dispatcher` contract. Applications initiate notification delivery through the `Notification` facade, the `Notifiable` trait, or on-demand `AnonymousNotifiable` routing instances.

Sources: [src/Illuminate/Support/Facades/Notification.php:46-98](https://github.com/laravel/framework/blob/main/src/Illuminate/Support/Facades/Notification.php#L46-L98), [src/Illuminate/Notifications/RoutesNotifications.php:8-52](https://github.com/laravel/framework/blob/main/src/Illuminate/Notifications/RoutesNotifications.php#L8-L52), [src/Illuminate/Notifications/AnonymousNotifiable.php:8-79](https://github.com/laravel/framework/blob/main/src/Illuminate/Notifications/AnonymousNotifiable.php#L8-L79), [src/Illuminate/Contracts/Notifications/Dispatcher.php:5-25](https://github.com/laravel/framework/blob/main/src/Illuminate/Contracts/Notifications/Dispatcher.php#L5-L25), [src/Illuminate/Notifications/Notifiable.php:5-9](https://github.com/laravel/framework/blob/main/src/Illuminate/Notifications/Notifiable.php#L5-L9)

### Dispatch Mechanics and Routing Call-Chain

When an application calls `notify()` on an entity using the `RoutesNotifications` trait or an `AnonymousNotifiable` instance, the call flows directly into the underlying dispatcher contract resolved from the container. 

The execution sequence proceeds as follows:
1. `Notifiable::notify($instance)` or `AnonymousNotifiable::notify($notification)` invokes `app(Dispatcher::class)->send($this, $instance)`.
2. Alternatively, immediate synchronous dispatch calls `notifyNow($instance, $channels)` which executes `app(Dispatcher::class)->sendNow($this, $instance, $channels)`.
3. For routing resolution, `routeNotificationFor($driver, $notification)` checks for a custom method named `routeNotificationFor{Driver}` via `Str::studly($driver)`. If absent, it falls back to matching `'database'` to `$this->notifications()` or `'mail'` to `$this->email`, returning `null` for unknown drivers.
4. For on-demand delivery, `Notification::route($channel, $route)` or `Notification::routes(array $channels)` instantiates an `AnonymousNotifiable` object, populates its `$routes` array, and rejects the `'database'` channel by throwing an `InvalidArgumentException`.

Sources: [src/Illuminate/Notifications/RoutesNotifications.php:16-51](https://github.com/laravel/framework/blob/main/src/Illuminate/Notifications/RoutesNotifications.php#L16-L51), [src/Illuminate/Notifications/AnonymousNotifiable.php:26-68](https://github.com/laravel/framework/blob/main/src/Illuminate/Notifications/AnonymousNotifiable.php#L26-L68), [src/Illuminate/Support/Facades/Notification.php:66-87](https://github.com/laravel/framework/blob/main/src/Illuminate/Support/Facades/Notification.php#L66-L87)

> [!WARNING]
> Attempting to route an on-demand notification through the database channel via `AnonymousNotifiable::route('database', ...)` immediately throws an `InvalidArgumentException` because anonymous entities lack persistent model identifiers.

Sources: [src/Illuminate/Notifications/AnonymousNotifiable.php:28-30](https://github.com/laravel/framework/blob/main/src/Illuminate/Notifications/AnonymousNotifiable.php#L28-L30)

### Public Dispatch Interface Components

| Class or Trait | Role / Responsibility | Key Methods / Properties |
| :--- | :--- | :--- |
| `Illuminate\Support\Facades\Notification` | Facade entry point providing static helper methods for dispatching and testing. | `fake()`, `routes(array $channels)`, `route($channel, $route)` |
| `Illuminate\Notifications\Notifiable` | Trait composing database notification capabilities and routing definitions into Eloquent models. | Uses `HasDatabaseNotifications`, `RoutesNotifications` |
| `Illuminate\Notifications\RoutesNotifications` | Trait implementing standard notification triggers and dynamic driver routing resolution. | `notify($instance)`, `notifyNow($instance, ?array $channels)`, `routeNotificationFor($driver, $notification)` |
| `Illuminate\Notifications\AnonymousNotifiable` | Container for ad-hoc notification routing without requiring a database model. | `$routes`, `route($channel, $route)`, `notify($notification)`, `notifyNow($notification)`, `routeNotificationFor($driver)`, `getKey()` |
| `Illuminate\Contracts\Notifications\Dispatcher` | Core contract defining standard and immediate notification dispatch signatures. | `send($notifiables, $notification)`, `sendNow($notifiables, $notification, ?array $channels)` |

Sources: [src/Illuminate/Support/Facades/Notification.php:46-98](https://github.com/laravel/framework/blob/main/src/Illuminate/Support/Facades/Notification.php#L46-L98), [src/Illuminate/Notifications/RoutesNotifications.php:8-52](https://github.com/laravel/framework/blob/main/src/Illuminate/Notifications/RoutesNotifications.php#L8-L52), [src/Illuminate/Notifications/AnonymousNotifiable.php:8-79](https://github.com/laravel/framework/blob/main/src/Illuminate/Notifications/AnonymousNotifiable.php#L8-L79), [src/Illuminate/Contracts/Notifications/Dispatcher.php:5-25](https://github.com/laravel/framework/blob/main/src/Illuminate/Contracts/Notifications/Dispatcher.php#L5-L25), [src/Illuminate/Notifications/Notifiable.php:5-9](https://github.com/laravel/framework/blob/main/src/Illuminate/Notifications/Notifiable.php#L5-L9)

### Public Dispatch Design Trade-Offs

| Design Choice | Benefit | Cost |
| :--- | :--- | :--- |
| **Trait-based Composition (`Notifiable`)** | Allows any Eloquent model or object to gain notification capabilities with zero boilerplate. | Couples domain models directly to notification triggers and routing logic. |
| **Anonymous Notifiable Container** | Enables sending notifications to arbitrary endpoints (like email strings or phone numbers) without creating database records. | Restricts certain stateful channels such as database notifications that require persistent entity primary keys. |
| **Dynamic Method Resolution (`routeNotificationFor`)** | Automatically maps driver names like `mail` or `slack` to explicit model methods like `routeNotificationForSlack()`. | Relies on string casing conventions via `Str::studly()` which can obscure typos at compile time. |

Sources: [src/Illuminate/Notifications/RoutesNotifications.php:8-51](https://github.com/laravel/framework/blob/main/src/Illuminate/Notifications/RoutesNotifications.php#L8-L51), [src/Illuminate/Notifications/AnonymousNotifiable.php:8-79](https://github.com/laravel/framework/blob/main/src/Illuminate/Notifications/AnonymousNotifiable.php#L8-L79)

## Channel Resolution and Dispatch Orchestration

### Overview

The notification delivery pipeline relies on service container bindings, driver creation factories, and dispatch orchestration handlers to route messages across synchronous and asynchronous channels.

Sources: [src/Illuminate/Notifications/NotificationServiceProvider.php:32-44](https://github.com/laravel/framework/blob/main/src/Illuminate/Notifications/NotificationServiceProvider.php#L32-L44), [src/Illuminate/Notifications/ChannelManager.php:14-148](https://github.com/laravel/framework/blob/main/src/Illuminate/Notifications/ChannelManager.php#L14-L148), [src/Illuminate/Notifications/NotificationSender.php:23-312](https://github.com/laravel/framework/blob/main/src/Illuminate/Notifications/NotificationSender.php#L23-L312)

### Service Provider Bindings and ChannelManager

The `NotificationServiceProvider` registers `ChannelManager` as a singleton inside the application container and binds it to both `DispatcherContract` and `FactoryContract`. `ChannelManager` extends Laravel's base `Manager` class and uses `ResolvesQueueRoutes` and `Macroable`.

| Binding Key | Concrete Target / Implementation | Purpose |
| :--- | :--- | :--- |
| `Illuminate\Notifications\ChannelManager` | `Illuminate\Notifications\ChannelManager` (singleton) | Main factory and dispatcher for notification channels. |
| `Illuminate\Contracts\Notifications\Dispatcher` | Alias to `ChannelManager` | Contract for standard and immediate dispatch operations. |
| `Illuminate\Contracts\Notifications\Factory` | Alias to `ChannelManager` | Contract for retrieving specific channel driver instances. |

Sources: [src/Illuminate/Notifications/NotificationServiceProvider.php:34-43](https://github.com/laravel/framework/blob/main/src/Illuminate/Notifications/NotificationServiceProvider.php#L34-L43), [src/Illuminate/Notifications/ChannelManager.php:14-16](https://github.com/laravel/framework/blob/main/src/Illuminate/Notifications/ChannelManager.php#L14-L16)

### Driver Creation and Resolution

`ChannelManager` manages built-in channel drivers and supports custom driver instantiation. When `driver($driver)` or `channel($name)` is invoked, it checks for a dedicated creator method or falls back to resolving a custom class from the container.

| Driver Creator Method | Target Channel Class | Default Driver Name |
| :--- | :--- | :--- |
| `createDatabaseDriver()` | `Illuminate\Notifications\Channels\DatabaseChannel` | `mail` |
| `createBroadcastDriver()` | `Illuminate\Notifications\Channels\BroadcastChannel` | `mail` |
| `createMailDriver()` | `Illuminate\Notifications\Channels\MailChannel` | `mail` |
| `createDriver($driver)` | Resolves custom class via `$this->container->make($driver)` if class exists | `mail` |

Sources: [src/Illuminate/Notifications/ChannelManager.php:30-31](https://github.com/laravel/framework/blob/main/src/Illuminate/Notifications/ChannelManager.php#L30-L31), [src/Illuminate/Notifications/ChannelManager.php:87-135](https://github.com/laravel/framework/blob/main/src/Illuminate/Notifications/ChannelManager.php#L87-L135)

> [!NOTE]
> When `createDriver` encounters an invalid argument exception from the base manager, it checks whether `$driver` exists as a valid class name using `class_exists($driver)`. If true, it resolves the custom channel directly from the service container.

Sources: [src/Illuminate/Notifications/ChannelManager.php:124-135](https://github.com/laravel/framework/blob/main/src/Illuminate/Notifications/ChannelManager.php#L124-L135)

### NotificationSender Dispatch Execution

`NotificationSender` handles the core dispatch execution loop. The execution call-chain proceeds as follows: `NotificationSender::send()` → checks `ShouldQueue` instance status → branches to either `queueNotification()` or `sendNow()` → `formatNotifiables()` → iterates over notifiables and channels → `sendToNotifiable()`.

Within `sendToNotifiable()`, the execution performs these steps: `notification->id` assignment → `shouldSendNotification()` verification → `manager->driver($channel)->send()` invocation → exception handling with `NotificationFailed` event dispatch or successful `NotificationSent` event dispatch and `afterSending()` callback execution.

Sources: [src/Illuminate/Notifications/NotificationSender.php:87-189](https://github.com/laravel/framework/blob/main/src/Illuminate/Notifications/NotificationSender.php#L87-L189)

### Design Trade-Offs

| Design Choice | Benefit | Cost |
| :--- | :--- | :--- |
| **Singleton ChannelManager Binding** | Centralizes channel driver instantiation and shares state across requests. | Retains cached notification sender and default channel configurations throughout container lifecycle. |
| **Automatic Class-Exists Driver Fallback** | Allows arbitrary invokable classes to act as custom notification channels without explicit manager extensions. | Obscures driver configuration errors if a typo matches an existing class name in the application space. |
| **Queue vs Immediate Branching in Sender** | Decouples asynchronous job wrapping from synchronous execution paths cleanly via `ShouldQueue`. | Requires duplicate handling for formatting notifiables and resolving channel loops across both flows. |

Sources: [src/Illuminate/Notifications/NotificationServiceProvider.php:34-35](https://github.com/laravel/framework/blob/main/src/Illuminate/Notifications/NotificationServiceProvider.php#L34-L35), [src/Illuminate/Notifications/ChannelManager.php:124-135](https://github.com/laravel/framework/blob/main/src/Illuminate/Notifications/ChannelManager.php#L124-L135), [src/Illuminate/Notifications/NotificationSender.php:87-94](https://github.com/laravel/framework/blob/main/src/Illuminate/Notifications/NotificationSender.php#L87-L94)

## Built In Channel Drivers Delivery

### Overview

The notification engine provides built-in channel drivers for delivering messages over email, database persistence, and broadcasting events. Each channel implements specific payload generation, recipient routing, and transport handoff routines.

Sources: [src/Illuminate/Notifications/Channels/MailChannel.php:18-307](https://github.com/laravel/framework/blob/main/src/Illuminate/Notifications/Channels/MailChannel.php#L18-L307), [src/Illuminate/Notifications/Channels/DatabaseChannel.php:8-68](https://github.com/laravel/framework/blob/main/src/Illuminate/Notifications/Channels/DatabaseChannel.php#L8-L68), [src/Illuminate/Notifications/Channels/BroadcastChannel.php:11-74](https://github.com/laravel/framework/blob/main/src/Illuminate/Notifications/Channels/BroadcastChannel.php#L11-L74)

### MailChannel Payload and Transport Execution

The `MailChannel` processes notification objects implementing `toMail()`, managing custom mailables, Markdown themes, attachments, tags, and metadata headers. 

The execution call-chain for sending a mail notification proceeds as follows: `MailChannel::send()` → resolves `$message = $notification->toMail($notifiable)` → checks route presence and instance type → branches to either `$message->send($this->mailer)` or `mailer->send()` using `buildView()`, data merging via `additionalMessageData()`, and `messageBuilder()` → `buildMessage()` → `addressMessage()` → `addSender()`, `getRecipients()`, subject resolution, `addAttachments()`, priority, `TagHeader`, `MetadataHeader`, and `runCallbacks()`.

Sources: [src/Illuminate/Notifications/Channels/MailChannel.php:53-306](https://github.com/laravel/framework/blob/main/src/Illuminate/Notifications/Channels/MailChannel.php#L53-L306)

```php
// Call-chain execution flow within MailChannel
$message = $notification->toMail($notifiable);
$this->mailer->mailer($message->mailer ?? null)->send(
    $this->buildView($message),
    array_merge($message->data(), $this->additionalMessageData($notification)),
    $this->messageBuilder($notifiable, $notification, $message)
);
```

Sources: [src/Illuminate/Notifications/Channels/MailChannel.php:55-70](https://github.com/laravel/framework/blob/main/src/Illuminate/Notifications/Channels/MailChannel.php#L55-L70)

> [!WARNING]
> If a notifiable model does not define a `mail` routing destination (`routeNotificationFor('mail')`) and the returned message object is not an instance of `Illuminate\Contracts\Mail\Mailable`, `MailChannel::send()` terminates early and returns `null` without sending an email.

Sources: [src/Illuminate/Notifications/Channels/MailChannel.php:57-60](https://github.com/laravel/framework/blob/main/src/Illuminate/Notifications/Channels/MailChannel.php#L57-L60)

### DatabaseChannel and BroadcastChannel Payload Generation

Both `DatabaseChannel` and `BroadcastChannel` inspect the notification object for specific methods to construct structured payloads before persisting or dispatching them.

| Channel Class | Payload Construction Method | Fallback Method | Exception Thrown on Failure |
| :--- | :--- | :--- | :--- |
| `DatabaseChannel` | `notification->toDatabase($notifiable)` | `notification->toArray($notifiable)` | `RuntimeException('Notification is missing toDatabase / toArray method.')` |
| `BroadcastChannel` | `notification->toBroadcast($notifiable)` | `notification->toArray($notifiable)` | `RuntimeException('Notification is missing toBroadcast / toArray method.')` |

Sources: [src/Illuminate/Notifications/Channels/DatabaseChannel.php:31-67](https://github.com/laravel/framework/blob/main/src/Illuminate/Notifications/Channels/DatabaseChannel.php#L31-L67), [src/Illuminate/Notifications/Channels/BroadcastChannel.php:37-73](https://github.com/laravel/framework/blob/main/src/Illuminate/Notifications/Channels/BroadcastChannel.php#L37-L73)

`DatabaseChannel::send()` invokes `$notifiable->routeNotificationFor('database', $notification)->create($this->buildPayload(...))` where the generated payload array includes `id`, `type` (checking `databaseType()` method existence), `data`, and `read_at` (checking `initialDatabaseReadAtValue()` method existence).

Sources: [src/Illuminate/Notifications/Channels/DatabaseChannel.php:17-43](https://github.com/laravel/framework/blob/main/src/Illuminate/Notifications/Channels/DatabaseChannel.php#L17-L43)

`BroadcastChannel::send()` retrieves message data, instantiates `BroadcastNotificationCreated`, configures connection and queue properties if the message is an instance of `BroadcastMessage`, and dispatches the event via the event dispatcher.

Sources: [src/Illuminate/Notifications/Channels/BroadcastChannel.php:37-51](https://github.com/laravel/framework/blob/main/src/Illuminate/Notifications/Channels/BroadcastChannel.php#L37-L51)

## Queued Notifications and Retries

### Queued Notifications and Retries

The `SendQueuedNotifications` class acts as the asynchronous job wrapper implementing `ShouldQueue` to handle notifications dispatched to a queue background worker. During construction, it processes notifiable entities, channels, and extracts configuration attributes using queue attributes and notification properties.

Sources: [src/Illuminate/Notifications/SendQueuedNotifications.php:21-103](https://github.com/laravel/framework/blob/main/src/Illuminate/Notifications/SendQueuedNotifications.php#L21-L103)

The constructor execution call-chain processes input parameters as follows: `__construct()` → `$this->wrapNotifiables($notifiables)` → extracts attributes via `$this->getAttributeValue()` for `Tries::class`, `Timeout::class`, `MaxExceptions::class`, and `DeleteWhenMissingModels::class` → evaluates `ShouldQueueAfterCommit` or property existence for `afterCommit` → checks `ShouldBeEncrypted` interface conformance for `shouldBeEncrypted`.

Sources: [src/Illuminate/Notifications/SendQueuedNotifications.php:86-103](https://github.com/laravel/framework/blob/main/src/Illuminate/Notifications/SendQueuedNotifications.php#L86-L103)

| Property / Method | Type / Return | Purpose / Behavior |
| :--- | :--- | :--- |
| `notifiables` | `Collection` | Container wrapping single or multiple target entities via `wrapNotifiables()`. |
| `notification` | `Notification` | The underlying notification instance being transmitted. |
| `channels` | `array\|null` | Specific delivery channels, or `null` to use defaults. |
| `tries` | `int` | Maximum attempt count resolved from attributes or notification property. |
| `timeout` | `int` | Maximum execution time in seconds before timeout. |
| `maxExceptions` | `int` | Maximum unhandled exceptions allowed before permanent failure. |
| `shouldBeEncrypted` | `bool` | Flag set to `true` when notification implements `ShouldBeEncrypted`. |
| `deleteWhenMissingModels` | `bool` | Flag indicating whether to delete the job when Eloquent models go missing. |
| `displayName()` | `string` | Returns the fully qualified class name of the inner notification. |
| `backoff()` | `mixed` | Resolves retry backoff via attribute or notification `backoff()` method. |
| `retryUntil()` | `DateTime\|null` | Determines the absolute timeout ceiling for retries. |

Sources: [src/Illuminate/Notifications/SendQueuedNotifications.php:25-184](https://github.com/laravel/framework/blob/main/src/Illuminate/Notifications/SendQueuedNotifications.php#L25-L184)

> [!NOTE]
> When cloning a `SendQueuedNotifications` job instance via `__clone()`, both the `notifiables` collection and the `notification` object are explicitly deep-cloned to prevent shared mutable state across job retries or queue serialization boundaries.

Sources: [src/Illuminate/Notifications/SendQueuedNotifications.php:191-195](https://github.com/laravel/framework/blob/main/src/Illuminate/Notifications/SendQueuedNotifications.php#L191-L195)

```php
// Lifecycle execution methods within SendQueuedNotifications
public function handle(ChannelManager $manager)
{
    $manager->sendNow($this->notifiables, $this->notification, $this->channels);
}

public function failed($e)
{
    if (method_exists($this->notification, 'failed')) {
        $this->notification->failed($e);
    }
}
```

Sources: [src/Illuminate/Notifications/SendQueuedNotifications.php:128-154](https://github.com/laravel/framework/blob/main/src/Illuminate/Notifications/SendQueuedNotifications.php#L128-L154)

## Broadcasting Drivers and Event Integration

### Overview

The broadcasting engine integrates real-time messaging with underlying WebSocket and pub/sub drivers via `BroadcastManager` and hooks into the central event dispatcher (`Illuminate\Events\Dispatcher`) to automatically intercept and queue events implementing `ShouldBroadcast`. When an event occurs, the dispatcher evaluates broadcast eligibility and queues payload serialization through the broadcasting contract.

Sources: [src/Illuminate/Broadcasting/BroadcastManager.php:38-180](https://github.com/laravel/framework/blob/main/src/Illuminate/Broadcasting/BroadcastManager.php#L38-L180), [src/Illuminate/Events/Dispatcher.php:307-395](https://github.com/laravel/framework/blob/main/src/Illuminate/Events/Dispatcher.php#L307-L395)

### BroadcastManager Drivers and Connection Resolution

`BroadcastManager` implements `FactoryContract` and manages connections for multiple driver backends. Drivers are instantiated lazily on demand, cached locally in the `$drivers` array, and purged when needed via `purge()`. Custom drivers can be registered using `extend()`, which binds driver callbacks to self.

Sources: [src/Illuminate/Broadcasting/BroadcastManager.php:38-62](https://github.com/laravel/framework/blob/main/src/Illuminate/Broadcasting/BroadcastManager.php#L38-L62), [src/Illuminate/Broadcasting/BroadcastManager.php:260-321](https://github.com/laravel/framework/blob/main/src/Illuminate/Broadcasting/BroadcastManager.php#L260-L321), [src/Illuminate/Broadcasting/BroadcastManager.php:487-520](https://github.com/laravel/framework/blob/main/src/Illuminate/Broadcasting/BroadcastManager.php#L487-L520)

The driver resolution call-chain proceeds as follows: `driver($name)` → `get($name)` → `resolve($name)` → reads connection config via `getConfig($name)` → invokes driver creation method (`createPusherDriver`, `createAblyDriver`, `createRedisDriver`, `createLogDriver`, `createNullDriver`, or `createReverbDriver`) or falls back to custom creators.

Sources: [src/Illuminate/Broadcasting/BroadcastManager.php:271-321](https://github.com/laravel/framework/blob/main/src/Illuminate/Broadcasting/BroadcastManager.php#L271-L321)

| Driver Method | Created Broadcaster Instance | Underlying Client / Dependency |
| :--- | :--- | :--- |
| `createPusherDriver()` | `PusherBroadcaster` | `Pusher\Pusher` with Guzzle HTTP client |
| `createReverbDriver()` | `PusherBroadcaster` | Reverb shares the Pusher protocol and driver |
| `createAblyDriver()` | `AblyBroadcaster` | `Ably\AblyRest` |
| `createRedisDriver()` | `RedisBroadcaster` | Redis connection container repository |
| `createLogDriver()` | `LogBroadcaster` | PSR-3 `LoggerInterface` |
| `createNullDriver()` | `NullBroadcaster` | None (no-op broadcaster) |

Sources: [src/Illuminate/Broadcasting/BroadcastManager.php:340-448](https://github.com/laravel/framework/blob/main/src/Illuminate/Broadcasting/BroadcastManager.php#L340-L448)

> [!NOTE]
> When instantiating the Pusher client in `pusher()`, `BroadcastManager` enforces strict TLS defaults with `connect_timeout` set to 10 seconds, `timeout` set to 30 seconds, and `crypto_method` locked to `STREAM_CRYPTO_METHOD_TLSv1_2_CLIENT`.

Sources: [src/Illuminate/Broadcasting/BroadcastManager.php:362-381](https://github.com/laravel/framework/blob/main/src/Illuminate/Broadcasting/BroadcastManager.php#L362-L381)

### Central Event Dispatcher Integration

The central `Dispatcher` inspects fired payloads during `dispatch()`. If the event object implements `ShouldBroadcast`, the dispatcher evaluates `broadcastWhen()` and automatically routes the event to `BroadcastFactory::queue($event)`.

Sources: [src/Illuminate/Events/Dispatcher.php:307-395](https://github.com/laravel/framework/blob/main/src/Illuminate/Events/Dispatcher.php#L307-L395)

> [!WARNING]
> Events marked with `ShouldDispatchAfterCommit` delay invocation of listener callbacks until the database transaction commits successfully; however, immediate broadcasting logic within `invokeListeners()` executes during the dispatch cycle prior to commit unless governed separately.

Sources: [src/Illuminate/Events/Dispatcher.php:293-318](https://github.com/laravel/framework/blob/main/src/Illuminate/Events/Dispatcher.php#L293-L318)

```php
// Dispatcher event broadcasting check
protected function shouldBroadcast(array $payload)
{
    return isset($payload[0]) &&
           $payload[0] instanceof ShouldBroadcast &&
           $this->broadcastWhen($payload[0]);
}

protected function broadcastEvent($event)
{
    $this->container->make(BroadcastFactory::class)->queue($event);
}
```

Sources: [src/Illuminate/Events/Dispatcher.php:366-395](https://github.com/laravel/framework/blob/main/src/Illuminate/Events/Dispatcher.php#L366-L395)

## Testing Infrastructure and Fakes

### Overview

Testing notifications requires intercepting dispatch operations without transmitting external emails, chat messages, or network payloads. `NotificationFake` implements both `NotificationDispatcher` and `NotificationFactory` contracts, replacing real channels to store dispatched notifications in memory for assertions.

Sources: [src/Illuminate/Support/Testing/Fakes/NotificationFake.php:7-19](https://github.com/laravel/framework/blob/main/src/Illuminate/Support/Testing/Fakes/NotificationFake.php#L7-L19)

### Trapped Message Inspection and Capture Mechanics

When `sendNow()` is executed against `NotificationFake`, it iterates through target notifiables, resolves channels via `$notification->via($notifiable)` or conditional filters via `shouldSend()`, assigns a UUID if missing, and captures the payload array into `$this->notifications`.

Sources: [src/Illuminate/Support/Testing/Fakes/NotificationFake.php:309-346](https://github.com/laravel/framework/blob/main/src/Illuminate/Support/Testing/Fakes/NotificationFake.php#L309-L346)

> [!NOTE]
> The fake inspection call-chain follows a strict sequence: `assertSentTo()` → `sent()` → `hasSent()` → `notificationsFor()`, which drills down into `this->notifications[get_class($notifiable)][(string) $notifiable->getKey()][$notification]`.

Sources: [src/Illuminate/Support/Testing/Fakes/NotificationFake.php:67-93](https://github.com/laravel/framework/blob/main/src/Illuminate/Support/Testing/Fakes/NotificationFake.php#L67-L93), [src/Illuminate/Support/Testing/Fakes/NotificationFake.php:250-287](https://github.com/laravel/framework/blob/main/src/Illuminate/Support/Testing/Fakes/NotificationFake.php#L250-L287)

### Assertion Methods Reference

| Assertion Method | Signature | Purpose & Verification Logic |
| :--- | :--- | :--- |
| `assertSentTo` | `($notifiable, $notification, $callback = null)` | Asserts that a specific notifiable received the given notification, optionally filtering via closure callback or count. |
| `assertNotSentTo` | `($notifiable, $notification, $callback = null)` | Asserts that the notification was never sent to the specified notifiable entity matching the callback criteria. |
| `assertSentToTimes` | `($notifiable, $notification, $times = 1)` | Asserts an exact count of how many times a particular notification was sent to a notifiable. |
| `assertSentOnDemand` | `($notification, $callback = null)` | Shortcut asserting notifications sent to an `AnonymousNotifiable` instance. |
| `assertNothingSent` | `()` | Asserts that zero notifications of any type or target were sent during test execution. |
| `assertNothingSentTo` | `($notifiable)` | Asserts that no notifications were dispatched to a specific model instance. |
| `assertSentTimes` | `($notification, $expectedCount)` | Asserts the global cumulative count of a notification type across all notifiables. |
| `assertCount` | `($expectedCount)` | Asserts the total flat count of every notification payload registered in the fake. |

Sources: [src/Illuminate/Support/Testing/Fakes/NotificationFake.php:52-240](https://github.com/laravel/framework/blob/main/src/Illuminate/Support/Testing/Fakes/NotificationFake.php#L52-L240)

> [!WARNING]
> When passing an array or Collection of notifiables to assertion helpers, passing an empty collection throws an explicit `Exception('No notifiable given.')` instead of silently succeeding.

Sources: [src/Illuminate/Support/Testing/Fakes/NotificationFake.php:69-72](https://github.com/laravel/framework/blob/main/src/Illuminate/Support/Testing/Fakes/NotificationFake.php#L69-L72), [src/Illuminate/Support/Testing/Fakes/NotificationFake.php:137-140](https://github.com/laravel/framework/blob/main/src/Illuminate/Support/Testing/Fakes/NotificationFake.php#L137-L140)

### Simulation Configuration

`NotificationFake` supports helper modifiers to mimic runtime environmental states:

- `locale(string $locale)`: Sets a static `$locale` property applied to recorded notification payloads.
- `serializeAndRestore(bool $serializeAndRestore = true)`: Toggles `$serializeAndRestore`. When active, notifications implementing `ShouldQueue` are passed through `serializeAndRestoreNotification()` (`unserialize(serialize($notification))`) during `sendNow()`.

Sources: [src/Illuminate/Support/Testing/Fakes/NotificationFake.php:34-41](https://github.com/laravel/framework/blob/main/src/Illuminate/Support/Testing/Fakes/NotificationFake.php#L34-L41), [src/Illuminate/Support/Testing/Fakes/NotificationFake.php:334-336](https://github.com/laravel/framework/blob/main/src/Illuminate/Support/Testing/Fakes/NotificationFake.php#L334-L336), [src/Illuminate/Support/Testing/Fakes/NotificationFake.php:365-394](https://github.com/laravel/framework/blob/main/src/Illuminate/Support/Testing/Fakes/NotificationFake.php#L365-L394)

## Related

- [[Mail & Mailable Classes]]
- [[Event Broadcasting]]

