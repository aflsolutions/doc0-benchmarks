# CSS in JS

<details>
<summary>Relevant source files</summary>

The following files were used as context for generating this wiki page:

- [src/jsx/dom/render.ts](https://github.com/honojs/hono/blob/main/src/jsx/dom/render.ts)
- [src/middleware/secure-headers/secure-headers.ts](https://github.com/honojs/hono/blob/main/src/middleware/secure-headers/secure-headers.ts)
- [src/helper/css/common.ts](https://github.com/honojs/hono/blob/main/src/helper/css/common.ts)
- [src/helper/css/index.ts](https://github.com/honojs/hono/blob/main/src/helper/css/index.ts)
- [src/jsx/hooks/index.ts](https://github.com/honojs/hono/blob/main/src/jsx/hooks/index.ts)
- [src/jsx/base.ts](https://github.com/honojs/hono/blob/main/src/jsx/base.ts)
- [package.json](https://github.com/honojs/hono/blob/main/package.json)
- [src/jsx/context.ts](https://github.com/honojs/hono/blob/main/src/jsx/context.ts)
- [src/jsx/dom/css.ts](https://github.com/honojs/hono/blob/main/src/jsx/dom/css.ts)
- [src/jsx/utils.ts](https://github.com/honojs/hono/blob/main/src/jsx/utils.ts)
- [src/jsx/dom/intrinsic-element/components.ts](https://github.com/honojs/hono/blob/main/src/jsx/dom/intrinsic-element/components.ts)
- [src/jsx/streaming.ts](https://github.com/honojs/hono/blob/main/src/jsx/streaming.ts)
- [src/jsx/intrinsic-element/components.ts](https://github.com/honojs/hono/blob/main/src/jsx/intrinsic-element/components.ts)
- [src/helper/streaming/sse.ts](https://github.com/honojs/hono/blob/main/src/helper/streaming/sse.ts)
- [src/utils/html.ts](https://github.com/honojs/hono/blob/main/src/utils/html.ts)
- [src/jsx/jsx-runtime.ts](https://github.com/honojs/hono/blob/main/src/jsx/jsx-runtime.ts)
- [src/jsx/dom/client.ts](https://github.com/honojs/hono/blob/main/src/jsx/dom/client.ts)
- [src/helper/ssg/ssg.ts](https://github.com/honojs/hono/blob/main/src/helper/ssg/ssg.ts)
- [src/helper/html/index.ts](https://github.com/honojs/hono/blob/main/src/helper/html/index.ts)
- [src/jsx/intrinsic-element/common.ts](https://github.com/honojs/hono/blob/main/src/jsx/intrinsic-element/common.ts)
- [jsr.json](https://github.com/honojs/hono/blob/main/jsr.json)
</details>

CSS-in-JS in Hono provides a type-safe, performant mechanism for defining and applying styles directly within your components. By leveraging tagged template literals, it allows developers to write standard CSS syntax that is automatically scoped, minified, and injected into the document, solving the common challenges of global CSS namespace collisions and dead code management.

The subsystem is architected to be environment-agnostic, supporting both server-side rendering (SSR) and client-side DOM updates. On the server, it collects styles during the render pass to inject them efficiently, while in the browser, it uses `CSSStyleSheet` to manipulate rules programmatically. This duality ensures that styles are delivered precisely when needed, regardless of how the application is rendered.

By integrating deeply with Hono's JSX runtime, the system automatically deduplicates rules via deterministic hashing. This creates a predictable and highly optimized CSS output, ensuring that even complex UI component trees do not suffer from redundant CSS injections. It is an essential component for developers building modular and scalable interfaces with Hono.

## Core API and Interface Surface

The CSS-in-JS subsystem exposes a simple, functional interface. Key entry points include `css` for defining styles, `cx` for merging class names, `keyframes` for animation definitions, and `viewTransition` for view-transition support. Each of these utilities returns a `CssClassName` object—a type that encapsulates the CSS selector, the generated class name, the minified CSS string, and references to dependencies (like keyframes or external classes).

| Function | Signature | Purpose |
| :--- | :--- | :--- |
| `css` | `(strings: TemplateStringsArray, ...values: CssVariableType[])` | Generates a scoped CSS class from a template. |
| `cx` | `(...args: (string \| CssClassName)[])` | Merges multiple class names/selectors safely. |
| `keyframes` | `(strings: TemplateStringsArray, ...values: CssVariableType[])` | Creates a global `@keyframes` rule. |
| `Style` | `(args?: { nonce?: string })` | Renders a `<style>` tag for SSR/injection. |

Sources: [src/helper/css/index.ts:169-214](https://github.com/honojs/hono/blob/main/src/helper/css/index.ts#L169-L214)

## Hashing and Class Name Generation

The system uses a non-cryptographic hashing algorithm to map style content to unique class names. By hashing the label (if provided) and the minified CSS string, it generates a deterministic identifier starting with `css-`. This hashing ensures that identical style blocks share the same class name, effectively deduplicating CSS rules and keeping the generated stylesheet compact.

The `toHash` function implements a polynomial rolling hash on the input string:
```typescript
const toHash = (str: string): string => {
  let i = 0,
    out = 11
  while (i < str.length) {
    out = (101 * out + str.charCodeAt(i++)) >>> 0
  }
  return 'css-' + out
}
```
Sources: [src/helper/css/common.ts:43-50](https://github.com/honojs/hono/blob/main/src/helper/css/common.ts#L43-L50)

## The Build Pipeline: `buildStyleString`

Before style injection, `buildStyleString` processes the tagged template literal. This is where CSS variables are resolved, nested classes or keyframes are identified, and the CSS is minified to remove redundant whitespace and comments.

1. **Extraction:** It detects an optional label (e.g., `/* label */`) at the start of the template.
2. **Variable Resolution:** It flattens nested arrays of variables.
3. **Escaping:** It ensures user-provided string values are correctly escaped to prevent malicious CSS injections.
4. **Minification:** The `minify` utility uses a regular expression to strip comments, extra spaces, and redundant delimiters.

Sources: [src/helper/css/common.ts:139-199](https://github.com/honojs/hono/blob/main/src/helper/css/common.ts#L139-L199)

## Browser DOM Lifecycle

When using `hono/jsx/dom`, the CSS-in-JS system integrates with `CSSStyleSheet` for efficient rule application. The core logic resides in `createCssJsxDomObjects`, which maintains a `styleSheet` reference.

Sources: [src/jsx/dom/css.ts:77-90](https://github.com/honojs/hono/blob/main/src/jsx/dom/css.ts#L77-L90)

When a component is mounted or updated, `insertRule` is invoked:
1. It looks up the associated `CSSStyleSheet` for the given ID.
2. It tracks added rules in a `Set` to prevent duplicate injections.
3. It uses `sheet.insertRule()` to add the CSS rule to the browser’s internal stylesheet object, rather than rebuilding the DOM node repeatedly.

Sources: [src/jsx/dom/css.ts:92-113](https://github.com/honojs/hono/blob/main/src/jsx/dom/css.ts#L92-L113)

> [!NOTE]
> Rule splitting is critical: the `splitRule` function correctly handles block-level rules (like `@keyframes` or media queries) by tracking depth, ensuring nested `{...}` blocks are inserted as single, coherent units.

Sources: [src/jsx/dom/css.ts:27-66](https://github.com/honojs/hono/blob/main/src/jsx/dom/css.ts#L27-L66)

## Call-Chain Execution: `cx` -> `newCssClassNameObject`

Tracing how `cx` (class name merger) resolves to a CSS object:

1. `cx` (src/helper/css/index.ts:173) validates and flattens input arguments via `cxCommon`.
2. It converts these args into a single CSS object by calling `css()` as if it were a new declaration (src/helper/css/index.ts:177).
3. The resulting `CssClassName` object is passed to `newCssClassNameObject` (src/helper/css/index.ts:88), which attaches the `HtmlEscapedCallback` to the object's `callbacks` property, allowing the `Style` component to collect and render it during the rendering phase.

Sources: [src/helper/css/index.ts:173-177](https://github.com/honojs/hono/blob/main/src/helper/css/index.ts#L173-L177)

## Design Trade-offs

| Design Choice | Benefit | Cost |
| :--- | :--- | :--- |
| **Tagged Template Literals** | Familiar syntax, easy tool integration | Requires processing during runtime/build |
| **Hashing Content** | Automatic deduplication of identical styles | Slight overhead for hash calculation on every call |
| **`CSSStyleSheet.insertRule`** | High performance, avoids DOM thrashing | More complex state management for styles |

Sources: [src/helper/css/common.ts:139-199](https://github.com/honojs/hono/blob/main/src/helper/css/common.ts#L139-L199), [src/jsx/dom/css.ts:92-113](https://github.com/honojs/hono/blob/main/src/jsx/dom/css.ts#L92-L113)

## Worked Example: Component Styling

This example demonstrates how to define styles and merge them dynamically using `css` and `cx`.

```typescript
import { css, cx } from 'hono/css'

const baseStyle = css`
  color: blue;
  padding: 10px;
`

const App = () => {
  const isActive = true
  const dynamicStyle = css`
    font-weight: bold;
  `
  
  return (
    <div className={cx(baseStyle, isActive && dynamicStyle)}>
      Hello, CSS-in-JS!
    </div>
  )
}
```
Sources: [src/helper/css/index.ts:234-241](https://github.com/honojs/hono/blob/main/src/helper/css/index.ts#L234-L241)

## Related

- [[JSX Runtime]]
