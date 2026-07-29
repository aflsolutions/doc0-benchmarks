# Project Structure

<details>
<summary>Relevant source files</summary>

The following files were used as context for generating this wiki page:

- [docs/Extensions.html](https://github.com/Alamofire/Alamofire/blob/main/docs/Extensions.html)
- [docs/docsets/Alamofire.docset/Contents/Resources/Documents/Extensions.html](https://github.com/Alamofire/Alamofire/blob/main/docs/docsets/Alamofire.docset/Contents/Resources/Documents/Extensions.html)
- [docs/Structs/AlamofireExtension.html](https://github.com/Alamofire/Alamofire/blob/main/docs/Structs/AlamofireExtension.html)
- [docs/Extensions/URLSessionConfiguration.html](https://github.com/Alamofire/Alamofire/blob/main/docs/Extensions/URLSessionConfiguration.html)
</details>

## Overview

The project structure organizes Alamofire's generated reference documentation, extension protocol architecture, and system type integrations into a cohesive framework. By establishing standardized extension entry points and documentation bundles, the architecture simplifies navigation across Foundation types, security components, and core networking utilities. Sources: [docs/Extensions.html:282-342](https://github.com/Alamofire/Alamofire/blob/main/docs/Extensions.html#L282-L342), [docs/Structs/AlamofireExtension.html:573-583](https://github.com/Alamofire/Alamofire/blob/main/docs/Structs/AlamofireExtension.html#L573-L583)

Designed around the generic `AlamofireExtension` wrapper and `AlamofireExtended` protocols, the codebase cleanly separates native Foundation integrations—such as `URLSessionConfiguration` and `Bundle` extensions—from custom networking logic. This modular layout ensures that developers can easily explore reference artifacts via generated docsets and structured API pages. Sources: [docs/Structs/AlamofireExtension.html:573-583](https://github.com/Alamofire/Alamofire/blob/main/docs/Structs/AlamofireExtension.html#L573-L583), [docs/Extensions/URLSessionConfiguration.html:1-56](https://github.com/Alamofire/Alamofire/blob/main/docs/Extensions/URLSessionConfiguration.html#L1-L56)

## Root Documentation and Package Layout

### Overview

Alamofire maintains its top-level reference documentation under the `docs/` directory, containing generated HTML files, cascading style sheets, scripts, and pre-packaged docsets. The documentation is generated using Jazzy v0.15.4 by the Alamofire Software Foundation and reflects comprehensive API coverage for version 5.12.0. Sources: [docs/Extensions.html:1-48](https://github.com/Alamofire/Alamofire/blob/main/docs/Extensions.html#L1-L48), [docs/Extensions.html:1131-1134](https://github.com/Alamofire/Alamofire/blob/main/docs/Extensions.html#L1131-L1134)

### Documentation Directory and Docset Structure

The generated documentation distribution provides both standard web-browsable HTML references and offline documentation bundles. The root directory houses category-specific pages such as `Extensions.html`, `Classes.html`, `Protocols.html`, `Structs.html`, and `Enums.html`, alongside top-level assets and search indices powered by Lunr and Typeahead. Sources: [docs/Extensions.html:5-14](https://github.com/Alamofire/Alamofire/blob/main/docs/Extensions.html#L5-L14), [docs/Extensions.html:58-422](https://github.com/Alamofire/Alamofire/blob/main/docs/Extensions.html#L58-L422)

The offline documentation feed is organized as a macOS Dash docset under `docs/docsets/Alamofire.docset/`. This bundle mirrors the structure of the web documentation, establishing self-contained XML feeds, resource references, and document catalogs designed for local integration and offline API lookup. Sources: [docs/Extensions.html:43-47](https://github.com/Alamofire/Alamofire/blob/main/docs/Extensions.html#L43-L47), [docs/docsets/Alamofire.docset/Contents/Resources/Documents/Extensions.html:1-48](https://github.com/Alamofire/Alamofire/blob/main/docs/docsets/Alamofire.docset/Contents/Resources/Documents/Extensions.html#L1-L48)

Sources: [docs/Extensions.html:1-48](https://github.com/Alamofire/Alamofire/blob/main/docs/Extensions.html#L1-L48), [docs/docsets/Alamofire.docset/Contents/Resources/Documents/Extensions.html:1-48](https://github.com/Alamofire/Alamofire/blob/main/docs/docsets/Alamofire.docset/Contents/Resources/Documents/Extensions.html#L1-L48)

## Alamofire Extension Protocol Architecture

### Overview

Alamofire implements a generic wrapper architecture via the `AlamofireExtension<ExtendedType>` struct to namespace custom properties and methods across native and framework types. Tied to the `AlamofireExtended` protocol, this structure encapsulates an underlying `type` property storing the extended instance or meta-type, initialised via `init(_:)`. Sources: [docs/Structs/AlamofireExtension.html:573-662](https://github.com/Alamofire/Alamofire/blob/main/docs/Structs/AlamofireExtension.html#L573-L662)

### Wrapper Specializations and Conditional Extensions

The `AlamofireExtension` struct provides conditional extensions tailored to specific types including `URLSessionConfiguration`, `Bundle`, `SecTrust`, `SecPolicy`, `[SecCertificate]`, `SecCertificate`, `OSStatus`, and `SecTrustResultType`. Each conditional extension exposes distinct static variables, properties, or evaluation methods appropriate for networking configurations, certificate inspection, and cryptographic validation. Sources: [docs/Structs/AlamofireExtension.html:665-1700](https://github.com/Alamofire/Alamofire/blob/main/docs/Structs/AlamofireExtension.html#L665-L1700)

| Extended Type | Members / Methods Provided | Sources |
| --- | --- | --- |
| `URLSessionConfiguration` | `default`, `ephemeral` | Sources: [docs/Structs/AlamofireExtension.html:665-733](https://github.com/Alamofire/Alamofire/blob/main/docs/Structs/AlamofireExtension.html#L665-L733) |
| `Bundle` | `certificates`, `publicKeys`, `paths(forResourcesOfTypes:)` | Sources: [docs/Structs/AlamofireExtension.html:734-850](https://github.com/Alamofire/Alamofire/blob/main/docs/Structs/AlamofireExtension.html#L734-L850) |
| `SecTrust` | `evaluate(afterApplying:)`, `validate(policy:errorProducer:)`, `apply(policy:)`, `evaluate()`, `validate(errorProducer:)`, `setAnchorCertificates(_:)`, `publicKeys`, `certificates`, `certificateData`, `performDefaultValidation(forHost:)`, `performValidation(forHost:)` | Sources: [docs/Structs/AlamofireExtension.html:851-1362](https://github.com/Alamofire/Alamofire/blob/main/docs/Structs/AlamofireExtension.html#L851-L1362) |
| `SecPolicy` | `default`, `hostname(_:)`, `revocation(options:)` | Sources: [docs/Structs/AlamofireExtension.html:1363-1508](https://github.com/Alamofire/Alamofire/blob/main/docs/Structs/AlamofireExtension.html#L1363-L1508) |
| `[SecCertificate]` | `data`, `publicKeys` | Sources: [docs/Structs/AlamofireExtension.html:1509-1575](https://github.com/Alamofire/Alamofire/blob/main/docs/Structs/AlamofireExtension.html#L1509-L1575) |
| `SecCertificate` | `publicKey` | Sources: [docs/Structs/AlamofireExtension.html:1576-1620](https://github.com/Alamofire/Alamofire/blob/main/docs/Structs/AlamofireExtension.html#L1576-L1620) |
| `OSStatus` | `isSuccess` | Sources: [docs/Structs/AlamofireExtension.html:1621-1660](https://github.com/Alamofire/Alamofire/blob/main/docs/Structs/AlamofireExtension.html#L1621-L1660) |
| `SecTrustResultType` | `isSuccess` | Sources: [docs/Structs/AlamofireExtension.html:1661-1700](https://github.com/Alamofire/Alamofire/blob/main/docs/Structs/AlamofireExtension.html#L1661-L1700) |

Sources: [docs/Structs/AlamofireExtension.html:665-1700](https://github.com/Alamofire/Alamofire/blob/main/docs/Structs/AlamofireExtension.html#L665-L1700)

> [!NOTE]
> When inspecting single `SecCertificate` instances, public key extraction via `.publicKey` is limited to RSA and ECDSA keys on 2020 operating systems and newer. Sources: [docs/Structs/AlamofireExtension.html:1590-1605](https://github.com/Alamofire/Alamofire/blob/main/docs/Structs/AlamofireExtension.html#L1590-L1605)

Sources: [docs/Structs/AlamofireExtension.html:1590-1605](https://github.com/Alamofire/Alamofire/blob/main/docs/Structs/AlamofireExtension.html#L1590-L1605)

Sources: [docs/Structs/AlamofireExtension.html:573-662](https://github.com/Alamofire/Alamofire/blob/main/docs/Structs/AlamofireExtension.html#L573-L662), [docs/Structs/AlamofireExtension.html:665-1700](https://github.com/Alamofire/Alamofire/blob/main/docs/Structs/AlamofireExtension.html#L665-L1700)

## Foundation Framework Integrations

### Overview

Alamofire extends `URLSessionConfiguration` and standard Foundation types through targeted extension mechanisms, providing specialized initializers and integration helpers for network session setup. The `URLSessionConfiguration` extension reference documents the specific properties and static factories exposed via Alamofire's namespaced wrapper architecture for configuring underlying transport sessions. Sources: [docs/Extensions/URLSessionConfiguration.html:1-56](https://github.com/Alamofire/Alamofire/blob/main/docs/Extensions/URLSessionConfiguration.html#L1-L56)

### URLSessionConfiguration Extension Reference

The `URLSessionConfiguration` extension injects Alamofire-specific convenience static properties into Foundation's `URLSessionConfiguration` class. These extensions supply pre-configured session configurations tailored for default and ephemeral networking use cases within the Alamofire framework. Sources: [docs/Extensions/URLSessionConfiguration.html:1-56](https://github.com/Alamofire/Alamofire/blob/main/docs/Extensions/URLSessionConfiguration.html#L1-L56)

| Extended Class | Extension Member | Return Type | Description | Sources |
| --- | --- | --- | --- | --- |
| `URLSessionConfiguration` | `default` | `URLSessionConfiguration` | Returns a default session configuration preset with Alamofire's default header fields and caching parameters. | Sources: [docs/Extensions/URLSessionConfiguration.html:40-56](https://github.com/Alamofire/Alamofire/blob/main/docs/Extensions/URLSessionConfiguration.html#L40-L56) |
| `URLSessionConfiguration` | `ephemeral` | `URLSessionConfiguration` | Returns an ephemeral session configuration preset avoiding persistent storage on disk for cookies, cache, or credentials. | Sources: [docs/Extensions/URLSessionConfiguration.html:40-56](https://github.com/Alamofire/Alamofire/blob/main/docs/Extensions/URLSessionConfiguration.html#L40-L56) |

Sources: [docs/Extensions/URLSessionConfiguration.html:40-56](https://github.com/Alamofire/Alamofire/blob/main/docs/Extensions/URLSessionConfiguration.html#L40-L56)

> [!NOTE]
> Modifying properties on `URLSessionConfiguration.af.default` or `URLSessionConfiguration.af.ephemeral` should be performed immediately after retrieval and prior to initializing a `Session` instance, as `URLSession` copies configuration settings upon creation. Sources: [docs/Extensions/URLSessionConfiguration.html:45-56](https://github.com/Alamofire/Alamofire/blob/main/docs/Extensions/URLSessionConfiguration.html#L45-L56)

Sources: [docs/Extensions/URLSessionConfiguration.html:45-56](https://github.com/Alamofire/Alamofire/blob/main/docs/Extensions/URLSessionConfiguration.html#L45-L56)

Sources: [docs/Extensions/URLSessionConfiguration.html:1-56](https://github.com/Alamofire/Alamofire/blob/main/docs/Extensions/URLSessionConfiguration.html#L1-L56)

## Feature and Modular Extension Points

### Overview

Alamofire organizes framework extensions and public API entry points across global extensions, system type integrations, and protocol conformances. The global extension catalog surfaces types that receive automatic protocol conformances or namespace-scoped helper methods, establishing consistent extension points throughout the library. Sources: [docs/Extensions.html:569-575](https://github.com/Alamofire/Alamofire/blob/main/docs/Extensions.html#L569-L575)

### Global and System Type Extension Points

The global extension registry exposes protocol conformances and helper APIs for standard library types, Foundation classes, and security primitives. Types such as `Error`, `URLRequest`, `HTTPURLResponse`, `URLSessionConfiguration`, `Notification`, `String`, `URL`, `URLComponents`, `JSONDecoder`, `PropertyListDecoder`, `Bundle`, `CharacterSet`, `OSStatus`, `SecCertificate`, `SecPolicy`, `SecTrust`, `SecTrustResultType`, `Array`, and `[ServerTrustEvaluating]` receive specialized method groupings and protocol bindings. Sources: [docs/Extensions.html:283-341](https://github.com/Alamofire/Alamofire/blob/main/docs/Extensions.html#L283-L341), [docs/Extensions.html:577-1124](https://github.com/Alamofire/Alamofire/blob/main/docs/Extensions.html#L577-L1124)

| Extended Type | Conformance or Feature Grouping | Primary Extension Members / Purpose | Sources |
| --- | --- | --- | --- |
| `Error` | Global Error Extension | General error extensions and utility properties. | Sources: [docs/Extensions.html:581-607](https://github.com/Alamofire/Alamofire/blob/main/docs/Extensions.html#L581-L607) |
| `URLRequest` | System Type Extensions | Conforms to `URLRequestConvertible` and provides request transformation utilities. | Sources: [docs/Extensions.html:621-648](https://github.com/Alamofire/Alamofire/blob/main/docs/Extensions.html#L621-L648) |
| `HTTPURLResponse` | System Type Extensions | Response inspection and status validation helpers. | Sources: [docs/Extensions.html:649-675](https://github.com/Alamofire/Alamofire/blob/main/docs/Extensions.html#L649-L675) |
| `URLSessionConfiguration` | System Type Extensions | Conforms to `AlamofireExtended` for namespaced configuration wrappers (`.default`, `.ephemeral`). | Sources: [docs/Extensions.html:676-704](https://github.com/Alamofire/Alamofire/blob/main/docs/Extensions.html#L676-L704) |
| `String`, `URL`, `URLComponents` | URL Conversion | Conforms to `URLConvertible` for flexible URL parameter passing. | Sources: [docs/Extensions.html:738-816](https://github.com/Alamofire/Alamofire/blob/main/docs/Extensions.html#L738-L816) |
| `JSONDecoder`, `PropertyListDecoder` | DataDecoder Protocol | Automatic conformance to the `DataDecoder` protocol for response serialization. | Sources: [docs/Extensions.html:828-883](https://github.com/Alamofire/Alamofire/blob/main/docs/Extensions.html#L828-L883) |
| `Bundle`, `SecTrust`, `SecPolicy`, `Array`, `SecCertificate`, `OSStatus`, `SecTrustResultType` | AlamofireExtended Security Groupings | Namespaced certificate extraction, trust evaluation, and status code verification helpers. | Sources: [docs/Extensions.html:915-1124](https://github.com/Alamofire/Alamofire/blob/main/docs/Extensions.html#L915-L1124) |

Sources: [docs/Extensions.html:577-1124](https://github.com/Alamofire/Alamofire/blob/main/docs/Extensions.html#L577-L1124)

> [!WARNING]
> Direct extensions on system classes without the `.af` namespace wrapper are restricted to protocol conformances and properties that do not risk colliding with future Foundation or Swift standard library additions. Sources: [docs/Extensions.html:621-704](https://github.com/Alamofire/Alamofire/blob/main/docs/Extensions.html#L621-L704)

Sources: [docs/Extensions.html:621-704](https://github.com/Alamofire/Alamofire/blob/main/docs/Extensions.html#L621-L704)

Sources: [docs/Extensions.html:283-341](https://github.com/Alamofire/Alamofire/blob/main/docs/Extensions.html#L283-L341), [docs/Extensions.html:569-1124](https://github.com/Alamofire/Alamofire/blob/main/docs/Extensions.html#L569-L1124)

## Docset Resources and Build Structure

### Overview

Alamofire's documentation distribution leverages Jazzy-generated docset bundles and web reference artifacts. These bundles package HTML reference pages, navigation trees, and search indices to support offline documentation viewers and browser-based reference browsing. Sources: [docs/docsets/Alamofire.docset/Contents/Resources/Documents/Extensions.html:1-14](https://github.com/Alamofire/Alamofire/blob/main/docs/docsets/Alamofire.docset/Contents/Resources/Documents/Extensions.html#L1-L14)

### Documentation Artifacts and Viewer Integration

The generated documentation distribution incorporates search indices powered by Lunr and Typeahead, alongside stylesheet assets and Dash integration links. The navigation hierarchy indexes top-level categories such as Classes, Global Variables, Enumerations, Extensions, Protocols, and Structures, providing direct anchors for every public symbol. Sources: [docs/docsets/Alamofire.docset/Contents/Resources/Documents/Extensions.html:5-48](https://github.com/Alamofire/Alamofire/blob/main/docs/docsets/Alamofire.docset/Contents/Resources/Documents/Extensions.html#L5-L48), [docs/docsets/Alamofire.docset/Contents/Resources/Documents/Extensions.html:58-565](https://github.com/Alamofire/Alamofire/blob/main/docs/docsets/Alamofire.docset/Contents/Resources/Documents/Extensions.html#L58-L565)

| Artifact Category | Primary File / Asset | Purpose / Function | Sources |
| --- | --- | --- | --- |
| Search Engine | `js/lunr.min.js`, `js/typeahead.jquery.js`, `js/jazzy.search.js`, `search.json` | Client-side full-text search indexing and query autocompletion across all reference types. | Sources: [docs/docsets/Alamofire.docset/Contents/Resources/Documents/Extensions.html:10-13](https://github.com/Alamofire/Alamofire/blob/main/docs/docsets/Alamofire.docset/Contents/Resources/Documents/Extensions.html#L10-L13), [docs/docsets/Alamofire.docset/Contents/Resources/Documents/Extensions.html:30-33](https://github.com/Alamofire/Alamofire/blob/main/docs/docsets/Alamofire.docset/Contents/Resources/Documents/Extensions.html#L30-L33) |
| Offline Integration | `dash-feed://.../Alamofire.xml` | Dash docset feed URL allowing direct installation into macOS offline documentation viewers via custom URI schemes. | Sources: [docs/docsets/Alamofire.docset/Contents/Resources/Documents/Extensions.html:42-47](https://github.com/Alamofire/Alamofire/blob/main/docs/docsets/Alamofire.docset/Contents/Resources/Documents/Extensions.html#L42-L47) |
| Styling & Interactivity | `css/jazzy.css`, `css/highlight.css`, `js/jquery.min.js`, `js/jazzy.js` | Visual layout formatting, syntax highlighting for Swift declarations, and DOM behavior handlers. | Sources: [docs/docsets/Alamofire.docset/Contents/Resources/Documents/Extensions.html:5-9](https://github.com/Alamofire/Alamofire/blob/main/docs/docsets/Alamofire.docset/Contents/Resources/Documents/Extensions.html#L5-L9) |
| Symbol Navigation | `nav-groups`, `Extensions.html` | Hierarchical sidebar grouping all classes, protocols, structures, and extensions with dash anchors. | Sources: [docs/docsets/Alamofire.docset/Contents/Resources/Documents/Extensions.html:17-19](https://github.com/Alamofire/Alamofire/blob/main/docs/docsets/Alamofire.docset/Contents/Resources/Documents/Extensions.html#L17-L19), [docs/docsets/Alamofire.docset/Contents/Resources/Documents/Extensions.html:57-565](https://github.com/Alamofire/Alamofire/blob/main/docs/docsets/Alamofire.docset/Contents/Resources/Documents/Extensions.html#L57-L565) |

Sources: [docs/docsets/Alamofire.docset/Contents/Resources/Documents/Extensions.html:5-565](https://github.com/Alamofire/Alamofire/blob/main/docs/docsets/Alamofire.docset/Contents/Resources/Documents/Extensions.html#L5-L565)

> [!NOTE]
> Dash docset integration utilizes the custom `dash-feed://` URI scheme to trigger direct one-click installation into offline developer documentation organizers. Sources: [docs/docsets/Alamofire.docset/Contents/Resources/Documents/Extensions.html:42-47](https://github.com/Alamofire/Alamofire/blob/main/docs/docsets/Alamofire.docset/Contents/Resources/Documents/Extensions.html#L42-L47)

Sources: [docs/docsets/Alamofire.docset/Contents/Resources/Documents/Extensions.html:42-47](https://github.com/Alamofire/Alamofire/blob/main/docs/docsets/Alamofire.docset/Contents/Resources/Documents/Extensions.html#L42-L47)

Sources: [docs/docsets/Alamofire.docset/Contents/Resources/Documents/Extensions.html:1-14](https://github.com/Alamofire/Alamofire/blob/main/docs/docsets/Alamofire.docset/Contents/Resources/Documents/Extensions.html#L1-L14), [docs/docsets/Alamofire.docset/Contents/Resources/Documents/Extensions.html:58-565](https://github.com/Alamofire/Alamofire/blob/main/docs/docsets/Alamofire.docset/Contents/Resources/Documents/Extensions.html#L58-L565)

## Related

- [[Overview]]
- [[Session Management]]

