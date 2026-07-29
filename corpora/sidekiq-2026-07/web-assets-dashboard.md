# Web Assets Dashboard

<details>
<summary>Relevant source files</summary>

The following files were used as context for generating this wiki page:

- [lib/sidekiq/web/application.rb](https://github.com/sidekiq/sidekiq/blob/main/lib/sidekiq/web/application.rb)
- [web/assets/javascripts/application.js](https://github.com/sidekiq/sidekiq/blob/main/web/assets/javascripts/application.js)
- [web/assets/stylesheets/style.css](https://github.com/sidekiq/sidekiq/blob/main/web/assets/stylesheets/style.css)
- [lib/sidekiq/tui/tabs/metrics.rb](https://github.com/sidekiq/tui/tabs/metrics.rb)
- [lib/sidekiq/web/helpers.rb](https://github.com/sidekiq/sidekiq/blob/main/lib/sidekiq/web/helpers.rb)
- [web/assets/javascripts/dashboard-charts.js](https://github.com/sidekiq/sidekiq/blob/main/web/assets/javascripts/dashboard-charts.js)
- [lib/sidekiq/tui/tabs/home.rb](https://github.com/sidekiq/tui/tabs/home.rb)
- [web/assets/javascripts/metrics.js](https://github.com/sidekiq/sidekiq/blob/main/web/assets/javascripts/metrics.js)
- [web/assets/javascripts/dashboard.js](https://github.com/sidekiq/sidekiq/blob/main/web/assets/javascripts/dashboard.js)
- [web/locales/en.yml](https://github.com/sidekiq/sidekiq/blob/main/web/locales/en.yml)
- [web/assets/javascripts/base-charts.js](https://github.com/sidekiq/sidekiq/blob/main/web/assets/javascripts/base-charts.js)
- [web/locales/da.yml](https://github.com/sidekiq/sidekiq/blob/main/web/locales/da.yml)
- [web/locales/gd.yml](https://github.com/sidekiq/sidekiq/blob/main/web/locales/gd.yml)
- [web/locales/tr.yml](https://github.com/sidekiq/sidekiq/blob/main/web/locales/tr.yml)
- [web/locales/pt-BR.yml](https://github.com/sidekiq/sidekiq/blob/main/web/locales/pt-BR.yml)
- [docs/webui.md](https://github.com/sidekiq/sidekiq/blob/main/docs/webui.md)
- [web/locales/nb.yml](https://github.com/sidekiq/sidekiq/blob/main/web/locales/nb.yml)
- [web/locales/ta.yml](https://github.com/sidekiq/sidekiq/blob/main/web/locales/ta.yml)
</details>

## Overview

The Sidekiq Web UI architecture encompasses comprehensive routing, asset management, and visualization layers designed for monitoring and managing background processing infrastructure. It delivers robust web application routing through Rack applications, secure asset delivery using content security policy nonces, and real-time client-side polling mechanisms that dynamically update page fragments and timestamps. Furthermore, it integrates a sophisticated charting infrastructure powered by a BaseChart class hierarchy, custom legend rendering, cursor overlays, and dynamic job metrics visualizations equipped with class swatch toggles. Internationalization is seamlessly supported across various localized UI dictionaries and translation helpers.

Sources: [lib/sidekiq/web/application.rb:1-478](https://github.com/sidekiq/sidekiq/blob/main/lib/sidekiq/web/application.rb#L1-L478), [web/assets/javascripts/application.js:1-184](https://github.com/sidekiq/sidekiq/blob/main/web/assets/javascripts/application.js#L1-L184), [web/assets/stylesheets/style.css:1-620](https://github.com/sidekiq/sidekiq/blob/main/web/assets/stylesheets/style.css#L1-L620), [lib/sidekiq/web/helpers.rb:1-473](https://github.com/sidekiq/sidekiq/blob/main/lib/sidekiq/web/helpers.rb#L1-L473), [web/assets/javascripts/dashboard-charts.js:1-194](https://github.com/sidekiq/sidekiq/blob/main/web/assets/javascripts/dashboard-charts.js#L1-L194), [web/assets/javascripts/metrics.js:1-280](https://github.com/sidekiq/sidekiq/blob/main/web/assets/javascripts/metrics.js#L1-L280), [web/assets/javascripts/base-charts.js:1-120](https://github.com/sidekiq/sidekiq/blob/main/web/assets/javascripts/base-charts.js#L1-L120)

## Web Application Routing and Asset Delivery

### Overview

The `Sidekiq::Web` Rack application manages HTTP request routing, asset helper integration, and strict security header enforcement. Incoming requests are processed through `Sidekiq::Web::Application#call`, which matches route endpoints, populates request-scoped response headers, and executes action blocks within a per-request thread Redis pool. Asset delivery and script or stylesheet inclusion rely on helper methods that automatically inject per-request Content Security Policy (CSP) nonces to prevent unauthorized inline injections.

Sources: [lib/sidekiq/web/application.rb:7-463](https://github.com/sidekiq/sidekiq/blob/main/lib/sidekiq/web/application.rb#L7-L463), [lib/sidekiq/web/helpers.rb:24-48](https://github.com/sidekiq/sidekiq/blob/main/lib/sidekiq/web/helpers.rb#L24-L48)

### Rack Application Routing and Execution Flow

The request life cycle follows an explicit call chain through initialization, matching, header assignment, execution, and rendering:

`Sidekiq::Web::Application#initialize(inst)` → `Sidekiq::Web::Application#call(env)` → `match(env)` → `process_csp(env, CSP_HEADER_TEMPLATE)` → `action.instance_exec env, &action.block` → `[200, env["response_headers"], [resp]]`

When a request enters `#call`, it attempts to match an endpoint via `match(env)`. If no matching route is found, it immediately halts and returns a `404` status with `x-cascade => pass`. If an action matches, response headers are initialized with mandatory security directives, including a dynamically populated Content-Security-Policy header generated by replacing `!placeholder!` with the request-specific `env[:csp_nonce]` via `process_csp`. The Redis connection pool is bound to `Thread.current[:sidekiq_redis_pool]`, and the action block executes within the action instance context via `instance_exec`.

Sources: [lib/sidekiq/web/application.rb:40-463](https://github.com/sidekiq/sidekiq/blob/main/lib/sidekiq/web/application.rb#L40-L463)

> [!WARNING]
> During request execution, `Thread.current[:sidekiq_redis_pool]` is explicitly managed around action evaluation using an `ensure` block. Omitting this pool context assignment will result in Redis connection failures inside web actions or extension endpoints.

Sources: [lib/sidekiq/web/application.rb:447-452](https://github.com/sidekiq/sidekiq/blob/main/lib/sidekiq/web/application.rb#L447-L452)

### Asset Helper Methods and Tag Generation

Assets and stylesheets are injected into the document head or body using helper methods defined in `Sidekiq::WebHelpers`. These helpers evaluate whether resource paths are absolute URLs or local routes, automatically appending `root_path` where necessary and attaching the active request CSP nonce.

| Helper Method | Arguments | Attributes Generated | Purpose |
| :--- | :--- | :--- | :--- |
| `style_tag` | `location, **kwargs` | `type`, `media`, `rel`, `nonce`, `href` | Injects a stylesheet link tag into the document head via `add_to_head` |
| `script_tag` | `location, **kwargs` | `type`, `nonce`, `src` | Renders a script tag with an integrated CSP nonce |
| `html_tag` | `tagname, attrs` | Custom attributes + block content | Private builder for HTML structural and asset tags |

Sources: [lib/sidekiq/web/helpers.rb:24-66](https://github.com/sidekiq/sidekiq/blob/main/lib/sidekiq/web/helpers.rb#L24-L66)

### Security Headers and Content Security Policy

The application enforces rigid isolation and asset protection through default response headers applied to every HTML response. The core security template defines restrictive sources for scripts, styles, frames, and worker contexts.

```ruby
CSP_HEADER_TEMPLATE = [
  "default-src 'self' https: http:",
  "child-src 'self'",
  "connect-src 'self' https: http: wss: ws:",
  "font-src 'none'",
  "frame-src 'self'",
  "img-src 'self' https: http: data:",
  "manifest-src 'self'",
  "media-src 'self'",
  "object-src 'none'",
  "script-src 'self' 'nonce-!placeholder!'",
  "style-src 'self' 'nonce-!placeholder!'",
  "worker-src 'self'",
  "base-uri 'self'"
].join("; ").freeze
```

Sources: [lib/sidekiq/web/application.rb:14-28](https://github.com/sidekiq/sidekiq/blob/main/lib/sidekiq/web/application.rb#L14-L28)

Every request receives standard defensive headers alongside the CSP string:
- `content-type`: `text/html`
- `cache-control`: `private, no-store`
- `x-content-type-options`: `nosniff`
- `content-security-policy`: Dynamically bound via `process_csp(env, CSP_HEADER_TEMPLATE)`

Sources: [lib/sidekiq/web/application.rb:439-445](https://github.com/sidekiq/sidekiq/blob/main/lib/sidekiq/web/application.rb#L439-L445)

## Real-Time Polling and DOM Updates

### Overview

Client-side polling schedules, page fragment replacements, and fuzzy timestamp rendering are orchestrated via lifecycle event listeners and interval-driven background timers defined in `application.js` and `dashboard.js`. When the document reaches readiness, `addListeners` registers bulk checkboxes, shift-click selection handlers, number formatters, progress bars, and live polling controls. Live polling reads its initial configuration from URL parameters via `setLivePollFromUrl` and synchronizes button states through `updateLivePollButton`.

Sources: [web/assets/javascripts/application.js:7-45](https://github.com/sidekiq/sidekiq/blob/main/web/assets/javascripts/application.js#L7-L45), [web/assets/javascripts/application.js:126-142](https://github.com/sidekiq/sidekiq/blob/main/web/assets/javascripts/application.js#L126-L142)

### Client-Side Polling Execution and Call Chain

The background update process follows an explicit asynchronous call chain triggered by interval timers or user interactions:

`scheduleLivePoll()` → `setTimeout(livePollTimer, ti)` → `livePollCallback()` → `fetch(window.location.href)` → `checkResponse(resp)` → `resp.text()` → `replacePage(text)` → `scheduleLivePoll()`

When `scheduleLivePoll` evaluates the polling interval `ti`, it retrieves `localStorage.sidekiqTimeInterval` defaulting to `5000` milliseconds, enforcing a strict minimum threshold of `2000` milliseconds. If an error occurs during fetch or response validation, `showError` logs the exception to the console while preserving the scheduling loop via the `finally` block.

Sources: [web/assets/javascripts/application.js:144-166](https://github.com/sidekiq/sidekiq/blob/main/web/assets/javascripts/application.js#L144-L166), [web/assets/javascripts/application.js:178-180](https://github.com/sidekiq/sidekiq/blob/main/web/assets/javascripts/application.js#L178-L180)

> [!WARNING]
> Polling frequency is bounded by a hardcoded floor of `2000` milliseconds. Setting `localStorage.sidekiqTimeInterval` below this value via the UI slider or local storage directly will automatically cause `scheduleLivePoll` to clamp the timeout back to `2000` ms.

Sources: [web/assets/javascripts/application.js:162-166](https://github.com/sidekiq/sidekiq/blob/main/web/assets/javascripts/application.js#L162-L166)

### Page Fragment Replacement and DOM Hydration

When `replacePage` receives the HTML response string, it parses the payload into a temporary DOM document using `DOMParser`, isolates the `#page` element container, and swaps it into the active live document using `Element#replaceWith`. Immediately following the fragment replacement, `addListeners` is re-invoked to rebind event listeners on the newly injected elements.

```javascript
function replacePage(text) {
  var parser = new DOMParser();
  var doc = parser.parseFromString(text, "text/html");

  var page = doc.querySelector('#page')
  document.querySelector("#page").replaceWith(page)

  addListeners();
}
```

Sources: [web/assets/javascripts/application.js:168-176](https://github.com/sidekiq/sidekiq/blob/main/web/assets/javascripts/application.js#L168-L176)

### Fuzzy Timestamp Rendering and Locale Management

Relative timestamps are dynamically calculated and rendered across all `<time>` tags using the bundled `timeago.js` engine. The function `updateFuzzyTimes` reads the locale configuration from `document.body.dataset.locale`, normalizes hyphenated locale codes (such as converting region subcodes to uppercase underscore format), applies the formatting to all time elements, and tears down the render references.

Sources: [web/assets/javascripts/application.js:99-110](https://github.com/sidekiq/sidekiq/blob/main/web/assets/javascripts/application.js#L99-L110)

## Base Chart Infrastructure and Themes

### Overview

Chart rendering infrastructure combines an object-oriented chart base class (`BaseChart`), a dynamic color allocation manager (`Colors`), and comprehensive OKLCH-based theme definitions in CSS and JavaScript. Global default properties for Chart.js are conditionally initialized based on the active color scheme media query.

Sources: [web/assets/javascripts/base-charts.js:1-6](https://github.com/sidekiq/sidekiq/blob/main/web/assets/javascripts/base-charts.js#L1-L6)

### Color Palette Configuration and Allocation

The `Colors` class manages dynamic color assignment for data series using the OKLCH color space. Lightness (`l`) and chroma (`c`) parameters adapt dynamically depending on the user's color scheme preference, applying a lightness of `48%` and chroma of `0.2` in light mode, or `65%` and `0.15` in dark mode.

Sources: [web/assets/javascripts/base-charts.js:8-18](https://github.com/sidekiq/sidekiq/blob/main/web/assets/javascripts/base-charts.js#L8-L18)

| Property Name | Light Mode Value | Dark Mode Value | Purpose |
| --- | --- | --- | --- |
| `light` | `48%` | `65%` | Base lightness percentage for generated OKLCH color strings |
| `chroma` | `0.2` | `0.15` | Base chroma value ensuring consistent perceptual saturation |
| `success` | `oklch(48% 0.2 179)` | `oklch(65% 0.15 179)` | Semantic success indicator color |
| `failure` | `oklch(48% 0.2 29)` | `oklch(65% 0.15 29)` | Semantic failure indicator color |
| `fallback` | `oklch(48% 0.02 269)` | `oklch(65% 0.02 269)` | Fallback neutral color when available palette is exhausted |
| `primary` | `oklch(48% 0.2 269)` | `oklch(65% 0.15 269)` | Primary brand/chart color |

Sources: [web/assets/javascripts/base-charts.js:8-21](https://github.com/sidekiq/sidekiq/blob/main/web/assets/javascripts/base-charts.js#L8-L21)

> [!TIP]
> The `Colors` class maintains an `assignments` lookup map and an `available` array containing ten distinct hue angles (256, 196, 46, 316, 106, 226, 136, 269, 286, and 16). Calling `checkOut(assignee)` assigns and caches a color for a series, while `checkIn(assignee)` releases it back to the available queue.

Sources: [web/assets/javascripts/base-charts.js:22-50](https://github.com/sidekiq/sidekiq/blob/main/web/assets/javascripts/base-charts.js#L22-L50)

### BaseChart Class Lifecycle and Call Chain

The `BaseChart` class initializes and updates Chart.js instances. Its execution lifecycle follows an explicit instantiation and configuration generation order:

`new BaseChart(el, options)` → `new Colors()` → `init()` → `new Chart(...)` using `this.chartOptions`

When `init()` executes, it constructs a new Chart.js instance with the type specified in `this.options.chartType`, datasets, and computed `chartOptions`. When `update()` is called, it reassigns `this.chart.options` and invokes `this.chart.update()`.

Sources: [web/assets/javascripts/base-charts.js:53-72](https://github.com/sidekiq/sidekiq/blob/main/web/assets/javascripts/base-charts.js#L53-L72)

### Dark Mode Stylesheet Rules and CSS Custom Properties

The stylesheet establishes a comprehensive design token system using `:root` CSS custom properties anchored on the OKLCH color space. Light mode sets the primary brand color to `oklch(48% 0.2 13)` and background to `oklch(99% 0.005 256)`. Under `prefers-color-scheme: dark`, these values are overridden to deep charcoal and muted tones.

Sources: [web/assets/stylesheets/style.css:1-16](https://github.com/sidekiq/sidekiq/blob/main/web/assets/stylesheets/style.css#L1-L16), [web/assets/stylesheets/style.css:563-580](https://github.com/sidekiq/sidekiq/blob/main/web/assets/stylesheets/style.css#L563-L580)

## Dashboard Metric Chart Rendering Components

### Overview

`DashboardChart` and `RealtimeChart` extend `BaseChart` to render line graphs tracking job processing and failure rates over time. `DashboardChart` configures static historical metrics with a 4:1 aspect ratio and date formatting that strips year values from x-axis ticks. `RealtimeChart` introduces polling loops, interval updates via DOM events, custom legend rendering, and annotation-based cursor overlays.

Sources: [web/assets/javascripts/dashboard-charts.js:1-55](https://github.com/sidekiq/sidekiq/blob/main/web/assets/javascripts/dashboard-charts.js#L1-L55), [web/assets/javascripts/dashboard-charts.js:57-181](https://github.com/sidekiq/sidekiq/blob/main/web/assets/javascripts/dashboard-charts.js#L57-L181)

### RealtimeChart Polling and Update Call Chain

`RealtimeChart` manages periodic metric fetches and chart updates. The initialization and polling execution walkthrough follows this order:

`new RealtimeChart(el, options)` → `super(el, options)` → `startPolling()` → `fetchStats()` → `setInterval(this.poll.bind(this), this.delay)`

When an interval tick triggers `poll()`, the sequence executes as follows:

`poll()` → `fetchStats()` → calculates `processed` and `failed` deltas → `shift()` and `push()` chart data labels and datasets → `chart.update()` → `updateScreenReaderDashboardValues()` → `updateStatsSummary()` → `updateRedisStats()` → `updateFooterUTCTime()` → `updateNumbers()` → `pulseBeacon()` → updates `this.stats`.

Sources: [web/assets/javascripts/dashboard-charts.js:57-95](https://github.com/sidekiq/sidekiq/blob/main/web/assets/javascripts/dashboard-charts.js#L57-L95)

> [!WARNING]
> `RealtimeChart` enforces a minimum polling interval of 2,000 milliseconds. If `localStorage.sidekiqTimeInterval` is set below `2000`, the constructor clamps `this.delay` to `2000` regardless of stored configuration.

Sources: [web/assets/javascripts/dashboard-charts.js:60-62](https://github.com/sidekiq/sidekiq/blob/main/web/assets/javascripts/dashboard-charts.js#L60-L62)

### Custom Legend Generation and Cursor Overlays

`RealtimeChart` disables default Chart.js tooltips (`enabled: false`) and uses an external tooltip handler to trigger `renderLegend(dp)` and `renderCursor(dp)`. The legend generator constructs swatch elements using dataset border colors and formatted values.

Sources: [web/assets/javascripts/dashboard-charts.js:108-179](https://github.com/sidekiq/sidekiq/blob/main/web/assets/javascripts/dashboard-charts.js#L108-L179)

| Method Name | Parameters | Return Type | Purpose |
| --- | --- | --- | --- |
| `startPolling` | none | `Promise<void>` | Fetches initial statistics and starts the polling interval timer |
| `poll` | none | `Promise<void>` | Fetches latest stats, calculates step deltas, shifts/pushes chart data arrays, and triggers UI updates |
| `fetchStats` | none | `Promise<Object>` | Executes an asynchronous `fetch()` call against `this.options.updateUrl` and parses JSON |
| `handleUpdate` | `e` (Event) | `void` | Handles `interval:update` DOM events, clears existing intervals, and restarts polling with new delay |
| `registerLegend` | `el` (HTMLElement) | `void` | Registers the external legend container element |
| `renderLegend` | `dp` (Array) | `void` | Replaces children of the legend element with data point entries and timestamp span |
| `legendEntry` | `dp` (Object) | `HTMLElement` | Creates a wrapper span containing a colored swatch and formatted label text |
| `renderCursor` | `dp` (Array) | `void` | Updates `this.cursorX` if label changes and triggers a chart update |

Sources: [web/assets/javascripts/dashboard-charts.js:67-141](https://github.com/sidekiq/sidekiq/blob/main/web/assets/javascripts/dashboard-charts.js#L67-L141)

## Job Metrics Visualizations and Filtering

### Overview

The job metrics interface utilizes three specialized Chart.js subclasses extending `BaseChart`: `JobMetricsOverviewChart`, `HistTotalsChart`, and `HistBubbleChart`. These components render overview time-series graphs with interactive class swatches, distribution totals bar charts, and multi-dimensional bubble charts displaying historical latency distributions alongside operational event markers.

Sources: [web/assets/javascripts/metrics.js:1-245](https://github.com/sidekiq/sidekiq/blob/main/web/assets/javascripts/metrics.js#L1-L245)

### Job Metrics Overview and Swatch Toggle Call Chain

`JobMetricsOverviewChart` maps job classes to time-series datasets and coordinates checkbox input swatches. The dynamic toggle execution walkthrough follows this order:

`registerSwatch(id)` → `document.getElementById(id)` → adds `"change"` event listener → `toggleKls(el.value, el.checked)`

When a swatch checkbox changes state, `toggleKls(kls, visible)` executes the following sequence:

`toggleKls(kls, visible)` → checks `visible` boolean:
- If `visible` is true: `this.chart.data.datasets.push(this.buildDataset(kls))`
- If `visible` is false: finds dataset index `i` by label → `this.colors.checkIn(kls)` → `this.chart.data.datasets.splice(i, 1)`
→ `this.updateSwatch(kls, visible)` → `this.update()`

Sources: [web/assets/javascripts/metrics.js:24-48](https://github.com/sidekiq/sidekiq/blob/main/web/assets/javascripts/metrics.js#L24-L48)

> [!WARNING]
> When hiding a job class via `toggleKls`, the chart invokes `this.colors.checkIn(kls)` to return the assigned color to the palette pool before splicing the dataset out of `this.chart.data.datasets`. Re-enabling the class later calls `this.colors.checkOut(kls)` to acquire a color assignment.

Sources: [web/assets/javascripts/metrics.js:41-43](https://github.com/sidekiq/sidekiq/blob/main/web/assets/javascripts/metrics.js#L41-L43), [web/assets/javascripts/metrics.js:51](https://github.com/sidekiq/sidekiq/blob/main/web/assets/javascripts/metrics.js#L51)

### Bubble Chart Radius Calculation and Interval Mapping

`HistBubbleChart` constructs multi-dimensional datasets where the X-axis represents time buckets, the Y-axis represents latency thresholds in seconds, and bubble size (`r`) represents frequency counts. Because Chart.js does not calculate bubble radius automatically, the implementation computes radii programmatically.

The dataset generation sequence executes as follows:

`datasets` getter → iterates over `this.options.hist` entries → maps `histBucket` indices using `this.options.histIntervals.length - 1 - histBucket` to invert slowest-to-fastest histogram storage into fastest-to-slowest chart ordering → calculates `maxCount` → computes `maxRadius = this.el.offsetWidth / 100` → calculates `multiplier = (maxRadius / maxCount) * 1.5` → assigns `entry.r = entry.count * multiplier + minRadius`.

Sources: [web/assets/javascripts/metrics.js:168-205](https://github.com/sidekiq/sidekiq/blob/main/web/assets/javascripts/metrics.js#L168-L205)

> [!NOTE]
> Histogram data is stored in the options payload ordered from fastest to slowest, but `this.options.histIntervals` is ordered from slowest to fastest so that the Y-axis displays correctly on the chart.

Sources: [web/assets/javascripts/metrics.js:175-177](https://github.com/sidekiq/sidekiq/blob/main/web/assets/javascripts/metrics.js#L175-L177)

### Metrics Chart Classes and Configuration Reference

| Class Name | Chart Type | Aspect Ratio | Key Configuration Options | Tooltip / Footer Behavior |
| --- | --- | --- | --- | --- |
| `JobMetricsOverviewChart` | `line` | `4` | Time scale (`starts_at`, `ends_at`), filtered datasets by `visibleKls` | Formats label with `.toFixed(1)` units; appends marker messages matching bucket timestamp |
| `HistTotalsChart` | `bar` | `6` | Y-axis zero baseline, X and Y axis title text | Formats label with integer count and `units` |
| `HistBubbleChart` | `bubble` | `3` | Time scale X-axis (`starts_at`, `ends_at`), dynamic radius (`r`) sizing | Formats label as `yUnits: count zUnits`; appends matching event markers in footer |

Sources: [web/assets/javascripts/metrics.js:1-108](https://github.com/sidekiq/sidekiq/blob/main/web/assets/javascripts/metrics.js#L1-L108), [web/assets/javascripts/metrics.js:111-160](https://github.com/sidekiq/sidekiq/blob/main/web/assets/javascripts/metrics.js#L111-L160), [web/assets/javascripts/metrics.js:162-245](https://github.com/sidekiq/sidekiq/blob/main/web/assets/javascripts/metrics.js#L162-L245)

### Period Selector Debounce Initialization

The metrics form attaches a debounced input listener to all period selector elements to automate form submission upon user interaction.

```javascript
var form = document.getElementById("metrics-form")
document.querySelectorAll("#period-selector").forEach(node => {
  node.addEventListener("input", debounce(() => form.submit()))
})

function debounce(func, timeout = 300) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => { func.apply(this, args); }, timeout);
  };
}
```

Sources: [web/assets/javascripts/metrics.js:269-280](https://github.com/sidekiq/sidekiq/blob/main/web/assets/javascripts/metrics.js#L269-L280)

## Web UI Internationalization and Locales

### Overview

Sidekiq Web UI internationalization relies on YAML locale dictionaries, language parsing heuristics, and a dedicated translation lookup helper. Translation files define localized key-value pairs along with a `LanguageName` metadata entry, supporting languages such as English (`en`), Danish (`da`), Scottish Gaelic (`gd`), Turkish (`tr`), Brazilian Portuguese (`pt-BR`), Norwegian Bokmål (`nb`), and Tamil (`ta`).

Sources: [web/locales/en.yml:1-111](https://github.com/sidekiq/sidekiq/blob/main/web/locales/en.yml#L1-L111), [web/locales/da.yml:1-78](https://github.com/sidekiq/sidekiq/blob/main/web/locales/da.yml#L1-L78), [web/locales/gd.yml:1-111](https://github.com/sidekiq/sidekiq/blob/main/web/locales/gd.yml#L1-L111), [web/locales/tr.yml:1-103](https://github.com/sidekiq/sidekiq/blob/main/web/locales/tr.yml#L1-L103), [web/locales/pt-BR.yml:1-98](https://github.com/sidekiq/sidekiq/blob/main/web/locales/pt-BR.yml#L1-L98), [web/locales/nb.yml:1-80](https://github.com/sidekiq/sidekiq/blob/main/web/locales/nb.yml#L1-L80), [web/locales/ta.yml:1-77](https://github.com/sidekiq/sidekiq/blob/main/web/locales/ta.yml#L1-L77)

### Locale Dictionary Loading and Parsing

The `WebHelpers` module manages dictionary caching and custom YAML parsing via `parse_yaml` and `strings(lang)`. The parser reads lines sequentially, ignoring comments, extracting the locale root key, and unquoting string values.

The dictionary loading sequence executes as follows:

`strings(lang)` → checks `@@strings[lang]` cache → evaluates `config.locales` paths via `find_locale_files(lang)` → parses each file with `parse_yaml(file)` → merges parsed translations into the global locale hash.

```ruby
def parse_yaml(path)
  locale = nil
  map = {}
  IO.readlines(path, chomp: true).each do |line|
    case line
    when /\A\s*\#.*/
      # line comment
    when !locale && /\A([a-zA-Z\-_]+):/
      locale = $1
      map[locale] = {}
    when /\A\s+(\w+):\s+(.+)\z/
      key = $1
      s = $2
      s = s[1..] if s[0] == "\""
      s = s[0..-2] if s[-1] == "\""
      map[locale][key] = s
    else
      raise ArgumentError, "unable to parse #{path}: #{line}"
    end
  end
  map
end
```

Sources: [lib/sidekiq/web/helpers.rb:68-104](https://github.com/sidekiq/sidekiq/blob/main/lib/sidekiq/web/helpers.rb#L68-L104)

> [!WARNING]
> The `parse_yaml` helper expects strict formatting with specific indentation for key-value entries and will raise an `ArgumentError` if an unexpected line structure is encountered.

Sources: [lib/sidekiq/web/helpers.rb:81-104](https://github.com/sidekiq/sidekiq/blob/main/lib/sidekiq/web/helpers.rb#L81-L104)

### Translation Lookup and Language Resolution

The translation method `t(msg, options = {})` resolves keys by querying the active locale dictionary first, falling back to the English dictionary (`en`), and defaulting to the raw message key if missing. If interpolation options are provided, it formats the resulting string using Kernel `%`.

```ruby
def t(msg, options = {})
  string = get_locale[msg] || strings("en")[msg] || msg
  if options.empty?
    string
  else
    string % options
  end
end
```

Sources: [lib/sidekiq/web/helpers.rb:250-257](https://github.com/sidekiq/sidekiq/blob/main/lib/sidekiq/web/helpers.rb#L250-L257)

User locale resolution inspects `session[:locale]`, parses `HTTP_ACCEPT_LANGUAGE` headers via `user_preferred_languages` to match case-insensitive exact or base language subtags against `available_locales`, and falls back to `"en"`.

Sources: [lib/sidekiq/web/helpers.rb:197-238](https://github.com/sidekiq/sidekiq/blob/main/lib/sidekiq/web/helpers.rb#L197-L238)

## Related

- [[Web UI Routing]]
- [[Metrics Query Collection]]

