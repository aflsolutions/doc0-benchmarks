# HTTP Headers and Methods

<details>
<summary>Relevant source files</summary>

The following files were used as context for generating this wiki page:

- [Source/Core/HTTPHeaders.swift](https://github.com/Alamofire/Alamofire/blob/main/Source/Core/HTTPHeaders.swift)
- [docs/docsets/Alamofire.docset/Contents/Resources/Documents/Structs/HTTPHeaders.html](https://github.com/Alamofire/Alamofire/blob/main/docs/docsets/Alamofire.docset/Contents/Resources/Documents/Structs/HTTPHeaders.html)
- [docs/docsets/Alamofire.docset/Contents/Resources/Documents/Extensions/URLRequest.html](https://github.com/Alamofire/Alamofire/blob/main/docs/docsets/Alamofire.docset/Contents/Resources/Documents/Extensions/URLRequest.html)
- [docs/docsets/Alamofire.docset/Contents/Resources/Documents/Enums/AF.html](https://github.com/Alamofire/Alamofire/blob/main/docs/docsets/Alamofire.docset/Contents/Resources/Documents/Enums/AF.html)
</details>

## Overview

Alamofire provides robust, type-safe abstractions for managing HTTP headers and request methods through the `HTTPHeaders` struct, `HTTPHeader` model, and `HTTPMethod` enumeration. These components bridge high-level Swift application code with native Foundation networking primitives like `URLRequest`, `HTTPURLResponse`, and `URLSessionConfiguration`, solving common development challenges such as case-insensitive header collisions, randomized dictionary ordering, and cumbersome request construction. By embodying design principles focused on order preservation, automatic case normalization, standard protocol defaults, and seamless integration with Swift's collection protocols, these types streamline the configuration, mutation, and inspection of network traffic across all supported platforms.
Sources: [Source/Core/HTTPHeaders.swift:27-30](https://github.com/Alamofire/Alamofire/blob/main/Source/Core/HTTPHeaders.swift#L27-L30), [docs/docsets/Alamofire.docset/Contents/Resources/Documents/Extensions/URLRequest.html:603-611](https://github.com/Alamofire/Alamofire/blob/main/docs/docsets/Alamofire.docset/Contents/Resources/Documents/Extensions/URLRequest.html#L603-L611)

## HTTPHeaders Struct Data Model

The `HTTPHeaders` type serves as an order-preserving, case-insensitive representation of HTTP headers, wrapping an internal storage array of `HTTPHeader` elements. Rather than using a standard Swift dictionary—which inherently scrambles key iteration order due to randomized hashing—`HTTPHeaders` stores elements sequentially to maintain insertion order while offering lookup semantics that ignore capitalization differences.
Sources: [Source/Core/HTTPHeaders.swift:27-30](https://github.com/Alamofire/Alamofire/blob/main/Source/Core/HTTPHeaders.swift#L27-L30)

Under the hood, `HTTPHeaders` maintains a private array `private var headers: [HTTPHeader] = []`. Each individual header is modeled by the `HTTPHeader` struct, which encapsulates an immutable `name: String` and `value: String`.
Sources: [Source/Core/HTTPHeaders.swift:29-30](https://github.com/Alamofire/Alamofire/blob/main/Source/Core/HTTPHeaders.swift#L29-L30), [Source/Core/HTTPHeaders.swift:188-204](https://github.com/Alamofire/Alamofire/blob/main/Source/Core/HTTPHeaders.swift#L188-L204)

The struct provides multiple initializers to convert from collections or start fresh: `init()` creates an empty headers instance; `init(_ headers: [HTTPHeader])` constructs an instance from an array of `HTTPHeader` items by evaluating each entry through update logic; and `init(_ dictionary: [String: String])` converts a standard key-value dictionary into `HTTPHeader` instances and updates the internal collection.
Sources: [Source/Core/HTTPHeaders.swift:31-45](https://github.com/Alamofire/Alamofire/blob/main/Source/Core/HTTPHeaders.swift#L31-L45)

> [!NOTE]
> When initializing from an array or a dictionary containing duplicate header names with differing capitalizations, duplicate case-insensitive names are collapsed into the last name and value encountered via the update mechanism.
Sources: [Source/Core/HTTPHeaders.swift:35-44](https://github.com/Alamofire/Alamofire/blob/main/Source/Core/HTTPHeaders.swift#L35-L44)

When headers are populated or modified, data flows through a strict call chain to enforce case-insensitive uniqueness and preserve sequence order. Entry point methods like `add(name:value:)`, `add(_:)`, `update(name:value:)`, or dictionary initializers invoke `update(_ header: HTTPHeader)`.
Sources: [Source/Core/HTTPHeaders.swift:51-74](https://github.com/Alamofire/Alamofire/blob/main/Source/Core/HTTPHeaders.swift#L51-L74)

Inside `update(_ header: HTTPHeader)`, the code queries `headers.index(of: header.name)` to locate any existing header matching the name case-insensitively.
Sources: [Source/Core/HTTPHeaders.swift:74-75](https://github.com/Alamofire/Alamofire/blob/main/Source/Core/HTTPHeaders.swift#L74-L75)

The decisive branch occurs depending on the lookup result: if no matching index is found (`nil`), the new header is directly appended to the storage array via `headers.append(header)`. If an existing index is found, the existing element is replaced in place using `headers.replaceSubrange(index...index, with: [header])`, preserving its original insertion slot while updating its value and canonical case representation.
Sources: [Source/Core/HTTPHeaders.swift:75-81](https://github.com/Alamofire/Alamofire/blob/main/Source/Core/HTTPHeaders.swift#L75-L81)

The `HTTPHeader` struct exposes static helper methods to construct common web headers with correct naming conventions and pre-formatted values, such as `HTTPHeader.accept(_:)`, `HTTPHeader.acceptCharset(_:)`, `HTTPHeader.acceptLanguage(_:)`, `HTTPHeader.acceptEncoding(_:)`, `HTTPHeader.authorization(username:password:)`, `HTTPHeader.authorization(bearerToken:)`, `HTTPHeader.authorization(_:)`, `HTTPHeader.contentDisposition(_:)`, `HTTPHeader.contentEncoding(_:)`, `HTTPHeader.contentType(_:)`, `HTTPHeader.userAgent(_:)`, and `HTTPHeader.websocketProtocol(_:)`.
Sources: [Source/Core/HTTPHeaders.swift:212-334](https://github.com/Alamofire/Alamofire/blob/main/Source/Core/HTTPHeaders.swift#L212-L334)

## Header Case Normalization and Lookups

HTTP header names are case-insensitive per specification, meaning fields like `Content-Type`, `content-type`, and `CONTENT-TYPE` must be treated as identical entries. Alamofire manages this requirement through normalized lookups implemented as an extension on arrays of `HTTPHeader`.
Sources: [Source/Core/HTTPHeaders.swift:336-342](https://github.com/Alamofire/Alamofire/blob/main/Source/Core/HTTPHeaders.swift#L336-L342)

When searching for or modifying headers, Alamofire avoids strict string comparisons by lowercasing both the query string and stored header names. The matching logic is handled by the `index(of:)` method on `[HTTPHeader]`:
Sources: [Source/Core/HTTPHeaders.swift:336-342](https://github.com/Alamofire/Alamofire/blob/main/Source/Core/HTTPHeaders.swift#L336-L342)

```swift
extension [HTTPHeader] {
    func index(of name: String) -> Int? {
        let lowercasedName = name.lowercased()
        return firstIndex { $0.name.lowercased() == lowercasedName }
    }
}
```
Sources: [Source/Core/HTTPHeaders.swift:336-342](https://github.com/Alamofire/Alamofire/blob/main/Source/Core/HTTPHeaders.swift#L336-L342)

This helper method performs the following operations: it converts the target search `name` to lowercase via `name.lowercased()`, evaluates the underlying collection using `firstIndex`, comparing each element's lowercased `name` against the target lowercased string, and returns the matching collection index as an optional `Int`, or `nil` if no match exists.
Sources: [Source/Core/HTTPHeaders.swift:338-342](https://github.com/Alamofire/Alamofire/blob/main/Source/Core/HTTPHeaders.swift#L338-L342)

> [!NOTE]
> Lowercasing occurs dynamically during search operations rather than mutating the original storage array keys. This preserves the exact casing provided by the caller while ensuring lookups succeed regardless of casing variations.
Sources: [Source/Core/HTTPHeaders.swift:27-29](https://github.com/Alamofire/Alamofire/blob/main/Source/Core/HTTPHeaders.swift#L27-L29), [Source/Core/HTTPHeaders.swift:336-342](https://github.com/Alamofire/Alamofire/blob/main/Source/Core/HTTPHeaders.swift#L336-L342)

The `HTTPHeaders` structure exposes case-insensitive accessors that rely on `index(of:)` internally: `value(for:)` locates a header index and returns its value, while subscript access `[name: String]` provides getter and setter syntax that delegates to `value(for:)`, `update(name:value:)`, or `remove(name:)`.
Sources: [Source/Core/HTTPHeaders.swift:107-130](https://github.com/Alamofire/Alamofire/blob/main/Source/Core/HTTPHeaders.swift#L107-L130)

## HTTP Method Representation and Usage

Alamofire models HTTP verbs through the `HTTPMethod` structure, providing type-safe representations for standard request verbs. This abstraction eliminates raw string usage across request builders and session methods.
Sources: [docs/docsets/Alamofire.docset/Contents/Resources/Documents/Structs/HTTPMethod.html:486-488](https://github.com/Alamofire/Alamofire/blob/main/docs/docsets/Alamofire.docset/Contents/Resources/Documents/Structs/HTTPMethod.html#L486-L488)

The `HTTPMethod` type wraps a raw string value (`rawValue: String`), conforming to protocols including `RawRepresentable`, `Equatable`, `Hashable`, and `Sendable`. Alamofire defines standard protocol method defaults as static properties on the structure: `connect`, `delete`, `get`, `head`, `options`, `patch`, `post`, `put`, and `trace`.
Sources: [docs/docsets/Alamofire.docset/Contents/Resources/Documents/Structs/HTTPMethod.html:486-488](https://github.com/Alamofire/Alamofire/blob/main/docs/docsets/Alamofire.docset/Contents/Resources/Documents/Structs/HTTPMethod.html#L486-L488)

> [!NOTE]
> Custom HTTP verbs not explicitly defined as static properties can be instantiated directly via the memberwise initializer `HTTPMethod(rawValue: "CUSTOM")`, enabling full support for non-standard or proprietary extensions.
Sources: [docs/docsets/Alamofire.docset/Contents/Resources/Documents/Structs/HTTPMethod.html:486-488](https://github.com/Alamofire/Alamofire/blob/main/docs/docsets/Alamofire.docset/Contents/Resources/Documents/Structs/HTTPMethod.html#L486-L488)

Global helper functions and initializers assign sensible method defaults based on the semantic intent of the operation. For instance, data retrieval via `AF.request(_:method:parameters:encoding:headers:interceptor:)` defaults `method` to `.get`, whereas payload submission via `AF.upload(_:to:method:headers:interceptor:fileManager:)` defaults `method` to `.post`.
Sources: [docs/docsets/Alamofire.docset/Contents/Resources/Documents/Enums/AF.html:466-471](https://github.com/Alamofire/Alamofire/blob/main/docs/docsets/Alamofire.docset/Contents/Resources/Documents/Enums/AF.html#L466-L471), [docs/docsets/Alamofire.docset/Contents/Resources/Documents/Enums/AF.html:1243-1248](https://github.com/Alamofire/Alamofire/blob/main/docs/docsets/Alamofire.docset/Contents/Resources/Documents/Enums/AF.html#L1243-L1248)

## Collection Conformance and Quality Encoding

`HTTPHeaders` conforms to several standard Swift protocols to provide seamless integration with language idioms and collection APIs. Through extensions on `HTTPHeaders`, the struct adopts `ExpressibleByDictionaryLiteral`, `ExpressibleByArrayLiteral`, `Sequence`, and `Collection`.
Sources: [Source/Core/HTTPHeaders.swift:142-176](https://github.com/Alamofire/Alamofire/blob/main/Source/Core/HTTPHeaders.swift#L142-L176)

The `ExpressibleByDictionaryLiteral` conformance is implemented via `init(dictionaryLiteral elements: (String, String)...)`, which iterates over given key-value tuples and updates the underlying header array case-insensitively. Similarly, `ExpressibleByArrayLiteral` adopts `init(arrayLiteral elements: HTTPHeader...)`, allowing array-based initialization.
Sources: [Source/Core/HTTPHeaders.swift:142-152](https://github.com/Alamofire/Alamofire/blob/main/Source/Core/HTTPHeaders.swift#L142-L152)

The `Collection` conformance forwards operations directly to the backing `[HTTPHeader]` array. `startIndex` and `endIndex` evaluate to `headers.startIndex` and `headers.endIndex`, the integer index subscript accesses individual elements, and `index(after i: Int)` invokes `headers.index(after: i)`. Additionally, `Sequence` conformance provides `makeIterator()`, returning an `IndexingIterator<[HTTPHeader]>` for iteration loops.
Sources: [Source/Core/HTTPHeaders.swift:154-176](https://github.com/Alamofire/Alamofire/blob/main/Source/Core/HTTPHeaders.swift#L154-L176)

Sorting functionality is available via mutating `sort()` and non-mutating `sorted()` methods. The sorting logic orders headers case-insensitively by comparing their lowercased name strings using `headers.sort { $0.name.lowercased() < $1.name.lowercased() }`.
Sources: [Source/Core/HTTPHeaders.swift:92-105](https://github.com/Alamofire/Alamofire/blob/main/Source/Core/HTTPHeaders.swift#L92-L105)

Content negotiation headers such as `Accept-Encoding` and `Accept-Language` utilize an extension on `Collection<String>` providing the `qualityEncoded()` helper function. This function iterates through collection elements with `enumerated()`, computing a quality weight (`q-value`) starting at `1.0` and decrementing by `0.1` for each subsequent index via `1.0 - (Double(index) * 0.1)`. Each element is formatted into an `encoding;q=value` string and joined with commas.
Sources: [Source/Core/HTTPHeaders.swift:435-442](https://github.com/Alamofire/Alamofire/blob/main/Source/Core/HTTPHeaders.swift#L435-L442)

## URLRequest Integration and Header Mutation

Alamofire integrates directly with Foundation's native `URLRequest` structure, bridging Foundation's optional dictionary representation of header fields (`allHTTPHeaderFields`) with Alamofire's robust `HTTPHeaders` type. This bidirectional adaptation enables developers to seamlessly convert, inspect, and mutate headers on standard network requests.
Sources: [Source/Core/HTTPHeaders.swift:446-452](https://github.com/Alamofire/Alamofire/blob/main/Source/Core/HTTPHeaders.swift#L446-L452)

An extension on `URLRequest` adds a computed `headers` property. The getter inspects `allHTTPHeaderFields`, mapping an existing dictionary through `HTTPHeaders.init(_:)` or returning an empty `HTTPHeaders` instance if `allHTTPHeaderFields` is `nil`. Conversely, the setter serializes an `HTTPHeaders` instance back into the native format by assigning `newValue.dictionary` to `allHTTPHeaderFields`.
Sources: [Source/Core/HTTPHeaders.swift:446-452](https://github.com/Alamofire/Alamofire/blob/main/Source/Core/HTTPHeaders.swift#L446-L452)

Additionally, `URLRequest` receives a specialized convenience initializer that accepts an explicit `URLConvertible` destination, an `HTTPMethod`, and an optional `HTTPHeaders` collection.
Sources: [docs/docsets/Alamofire.docset/Contents/Resources/Documents/Extensions/URLRequest.html:657-718](https://github.com/Alamofire/Alamofire/blob/main/docs/docsets/Alamofire.docset/Contents/Resources/Documents/Extensions/URLRequest.html#L657-L718)

Beyond `URLRequest`, Alamofire extends `HTTPURLResponse` and `URLSessionConfiguration` to expose the same unified `headers` interface. `HTTPURLResponse` provides a read-only `headers` computed property that converts `allHeaderFields` into `HTTPHeaders`, while `URLSessionConfiguration` provides a read-write `headers` property wrapping `httpAdditionalHeaders`.
Sources: [Source/Core/HTTPHeaders.swift:454-467](https://github.com/Alamofire/Alamofire/blob/main/Source/Core/HTTPHeaders.swift#L454-L467)

> [!NOTE]
> Assigning to `URLRequest.headers` overwrites the underlying `allHTTPHeaderFields` dictionary with the key-value pairs generated by `HTTPHeaders.dictionary`. Because the standard dictionary representation collapses duplicate case-insensitive keys by keeping the last encountered value, ensure any order-dependent duplicates are resolved before conversion.
Sources: [Source/Core/HTTPHeaders.swift:40-44](https://github.com/Alamofire/Alamofire/blob/main/Source/Core/HTTPHeaders.swift#L40-L44), [Source/Core/HTTPHeaders.swift:135-139](https://github.com/Alamofire/Alamofire/blob/main/Source/Core/HTTPHeaders.swift#L135-L139), [Source/Core/HTTPHeaders.swift:446-452](https://github.com/Alamofire/Alamofire/blob/main/Source/Core/HTTPHeaders.swift#L446-L452)

## Related

- [[Parameter Encoding]]
- [[URL Routing Protocols]]

