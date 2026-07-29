# Request Compression

<details>
<summary>Relevant source files</summary>

The following files were used as context for generating this wiki page:

- [Source/Features/RequestCompression.swift](https://github.com/Alamofire/Alamofire/blob/main/Source/Features/RequestCompression.swift)
- [docs/docsets/Alamofire.docset/Contents/Resources/Documents/Structs/DeflateRequestCompressor.html](https://github.com/Alamofire/Alamofire/blob/main/docs/docsets/Alamofire.docset/Contents/Resources/Documents/Structs/DeflateRequestCompressor.html)
- [docs/Structs/DeflateRequestCompressor.html](https://github.com/Alamofire/Alamofire/blob/main/docs/Structs/DeflateRequestCompressor.html)
- [Tests/RequestTests.swift](https://github.com/Alamofire/Alamofire/blob/main/Tests/RequestTests.swift)
- [docs/docsets/Alamofire.docset/Contents/Resources/Documents/Protocols/RequestInterceptor.html](https://github.com/Alamofire/Alamofire/blob/main/docs/docsets/Alamofire.docset/Contents/Resources/Documents/Protocols/RequestInterceptor.html)
</details>

## Overview

Request compression provides a mechanism for reducing network bandwidth consumption by compressing outgoing HTTP request bodies using the `deflate` content encoding and appending the appropriate header. Designed as a synchronous feature, it integrates directly into Alamofire's interception and adaptation pipeline to transparently prepare requests prior to transmission over the network. Because compression introduces CPU overhead and is generally counterproductive for small payloads or already compressed data like media files, it requires careful measurement and targeted configuration. The architecture provides fine-grained control over header collisions and body evaluation criteria through customizable parameters, ensuring robust error handling during stream processing and reliable lifecycle management across network sessions.

Sources: [Source/Features/RequestCompression.swift:29-37](https://github.com/Alamofire/Alamofire/blob/main/Source/Features/RequestCompression.swift#L29-L37), [docs/docsets/Alamofire.docset/Contents/Resources/Documents/Structs/DeflateRequestCompressor.html:582-591](https://github.com/Alamofire/Alamofire/blob/main/docs/docsets/Alamofire.docset/Contents/Resources/Documents/Structs/DeflateRequestCompressor.html#L582-L591)

## Deflate Request Compressor Architecture

### Overview

The `DeflateRequestCompressor` struct is designed as a `Sendable` type conforming to `RequestInterceptor` that prepares outgoing `URLRequest` instances by compressing their body data with the `deflate` content encoding and updating corresponding request headers. Compilation of the compression features depends on the availability of the `zlib` library while excluding target environments such as Android.

Sources: [Source/Features/RequestCompression.swift:25-39](https://github.com/Alamofire/Alamofire/blob/main/Source/Features/RequestCompression.swift#L25-L39), [docs/docsets/Alamofire.docset/Contents/Resources/Documents/Structs/DeflateRequestCompressor.html:573-578](https://github.com/Alamofire/Alamofire/blob/main/docs/docsets/Alamofire.docset/Contents/Resources/Documents/Structs/DeflateRequestCompressor.html#L573-L578)

### Configuration Options and Properties

The compressor struct maintains two primary configuration properties: `duplicateHeaderBehavior` and `shouldCompressBodyData`. The `duplicateHeaderBehavior` property accepts a `DuplicateHeaderBehavior` enum value that dictates how the compressor responds if the incoming request already possesses a `Content-Encoding` header. The `shouldCompressBodyData` property holds an isolated `@Sendable` closure taking `Data` and returning a `Bool` to selectively decide whether a given request body warrants compression.

Sources: [Source/Features/RequestCompression.swift:40-58](https://github.com/Alamofire/Alamofire/blob/main/Source/Features/RequestCompression.swift#L40-L58), [docs/docsets/Alamofire.docset/Contents/Resources/Documents/Structs/DeflateRequestCompressor.html:661-710](https://github.com/Alamofire/Alamofire/blob/main/docs/docsets/Alamofire.docset/Contents/Resources/Documents/Structs/DeflateRequestCompressor.html#L661-L710)

| Option / Property | Type | Default Value | Purpose |
| :--- | :--- | :--- | :--- |
| `duplicateHeaderBehavior` | `DuplicateHeaderBehavior` | `.error` | Determines the action taken when the `URLRequest` already contains a `Content-Encoding` header. |
| `shouldCompressBodyData` | `@Sendable (Data) -> Bool` | `{ _ in true }` | Evaluates outgoing body data to determine whether compression should be executed. |

Sources: [Source/Features/RequestCompression.swift:40-68](https://github.com/Alamofire/Alamofire/blob/main/Source/Features/RequestCompression.swift#L40-L68), [docs/docsets/Alamofire.docset/Contents/Resources/Documents/Structs/DeflateRequestCompressor.html:661-767](https://github.com/Alamofire/Alamofire/blob/main/docs/docsets/Alamofire.docset/Contents/Resources/Documents/Structs/DeflateRequestCompressor.html#L661-L767)

### Duplicate Header Behaviors

When a request already includes a `Content-Encoding` header, `DuplicateHeaderBehavior` defines three distinct strategies through its enumeration cases:

- `error`: Throws a `DuplicateHeaderError`, terminating the adaptation process with a failure result. This serves as the default behavior.
- `replace`: Replaces the pre-existing header value with `deflate` once compression finishes successfully.
- `skip`: Silently bypasses compression and returns the unmodified request.

Sources: [Source/Features/RequestCompression.swift:41-48](https://github.com/Alamofire/Alamofire/blob/main/Source/Features/RequestCompression.swift#L41-L48), [docs/docsets/Alamofire.docset/Contents/Resources/Documents/Structs/DeflateRequestCompressor.html:605-618](https://github.com/Alamofire/Alamofire/blob/main/docs/docsets/Alamofire.docset/Contents/Resources/Documents/Structs/DeflateRequestCompressor.html#L605-L618)

> [!NOTE]
> `DuplicateHeaderError` is an empty error struct produced specifically when `duplicateHeaderBehavior` is set to `.error` and a pre-existing `Content-Encoding` header is encountered on the outgoing request.

Sources: [Source/Features/RequestCompression.swift:50-53](https://github.com/Alamofire/Alamofire/blob/main/Source/Features/RequestCompression.swift#L50-L53), [docs/docsets/Alamofire.docset/Contents/Resources/Documents/Structs/DeflateRequestCompressor.html:633-646](https://github.com/Alamofire/Alamofire/blob/main/docs/docsets/Alamofire.docset/Contents/Resources/Documents/Structs/DeflateRequestCompressor.html#L633-L646)

### Static Factory Extensions

Conforming extensions on `RequestInterceptor` where `Self == DeflateRequestCompressor` provide convenient factory constructors for instantiating the compressor. These static members include `deflateCompressor` with default parameters and an overloaded `deflateCompressor(duplicateHeaderBehavior:shouldCompressBodyData:)` method allowing custom closure and behavior injections.

Sources: [Source/Features/RequestCompression.swift:123-145](https://github.com/Alamofire/Alamofire/blob/main/Source/Features/RequestCompression.swift#L123-L145)

## RequestInterceptor Protocol Integration

### Overview

`DeflateRequestCompressor` implements the `RequestInterceptor` protocol, conforming to both `RequestAdapter` and `RequestRetrier` functionalities to adapt outgoing `URLRequest` instances transparently before dispatch. Through the required `adapt(_:for:completion:)` method, the compressor intercepts HTTP requests, evaluates their suitability for compression, and injects compressed payloads and headers.

Sources: [Source/Features/RequestCompression.swift:39-70](https://github.com/Alamofire/Alamofire/blob/main/Source/Features/RequestCompression.swift#L39-L70), [docs/docsets/Alamofire.docset/Contents/Resources/Documents/Protocols/RequestInterceptor.html:573-583](https://github.com/Alamofire/Alamofire/blob/main/docs/docsets/Alamofire.docset/Contents/Resources/Documents/Protocols/RequestInterceptor.html#L573-L583)

### Adaptation Call-Chain Execution

When a request passes through the session pipeline, `DeflateRequestCompressor` executes a strict, ordered sequence of validation checks inside `adapt(_:for:completion:)` before invoking the underlying compression routines. 

The adaptation workflow proceeds along the following call path:

`adapt(_:for:completion:)` → `urlRequest.httpBody` guard → `shouldCompressBodyData(_:)` evaluation → `Content-Encoding` header check → `duplicateHeaderBehavior` branch resolution → `deflate(_:)` transformation → `completion(.success(_))`

1. **Body Presence Check:** The method inspects `urlRequest.httpBody`. If no body data exists (or if streams are utilized), adaptation immediately bypasses compression and returns `completion(.success(urlRequest))`.
2. **Predicate Evaluation:** The request body data is passed into the `shouldCompressBodyData` closure. If this returns `false`, the unmodified request is returned via `completion(.success(urlRequest))`.
3. **Existing Header Inspection:** The method checks whether `urlRequest.headers.value(for: "Content-Encoding")` is non-nil. When a pre-existing header is discovered, execution branches based on `duplicateHeaderBehavior`:
   - `.error`: Immediately invokes `completion(.failure(DuplicateHeaderError()))`.
   - `.skip`: Instantly exits via `completion(.success(urlRequest))`.
   - `.replace`: Bypasses early termination and proceeds to compress the body, overwriting the header subsequently.
4. **Compression and Completion:** The body data is compressed via `deflate(_:)`, the `Content-Encoding` header is updated to `"deflate"`, and the modified request is returned via `completion(.success(compressedRequest))`. Any thrown errors during compression are caught and forwarded via `completion(.failure(error))`.

Sources: [Source/Features/RequestCompression.swift:70-105](https://github.com/Alamofire/Alamofire/blob/main/Source/Features/RequestCompression.swift#L70-L105)

> [!WARNING]
> `DeflateRequestCompressor` has no support for compressing streaming bodies (`httpBodyStream`). If an outgoing request utilizes a body stream rather than in-memory `httpBody` data, the compressor will skip compression entirely and pass the request through uncompressed.

Sources: [Source/Features/RequestCompression.swift:71-75](https://github.com/Alamofire/Alamofire/blob/main/Source/Features/RequestCompression.swift#L71-L75)

### Adaptation Logic Reference

| Guard / Branch Condition | Trigger Criterion | Action Taken |
| :--- | :--- | :--- |
| `httpBody` check | `urlRequest.httpBody == nil` | Completes immediately with `.success(urlRequest)`. |
| `shouldCompressBodyData` | Closure evaluates to `false` | Completes immediately with `.success(urlRequest)`. |
| Header check (`.error`) | `Content-Encoding` header present + `.error` behavior | Completes with `.failure(DuplicateHeaderError())`. |
| Header check (`.skip`) | `Content-Encoding` header present + `.skip` behavior | Completes immediately with `.success(urlRequest)`. |
| Header check (`.replace`) | `Content-Encoding` header present + `.replace` behavior | Proceeds to compress body and updates header value to `"deflate"`. |

Sources: [Source/Features/RequestCompression.swift:71-94](https://github.com/Alamofire/Alamofire/blob/main/Source/Features/RequestCompression.swift#L71-L94)

## Deflate and Zlib Stream Processing

### Deflation and Adler-32 Checksum Assembly

When a request clears all upstream validation guards, `DeflateRequestCompressor` processes the raw payload by invoking its internal `deflate(_:)` and `adler32Checksum(of:)` helper methods. This pipeline builds a conforming zlib container stream around the compressed byte sequence.

The deflation and checksum generation workflow proceeds along the following call path:

`deflate(_:)` → `Data([0x78, 0x5E])` header allocation → `(data as NSData).compressed(using: .zlib)` transformation → `adler32Checksum(of:)` computation → `adler32(1, buffer.baseAddress, UInt32(buffer.count))` invocation → `.bigEndian` byte conversion → `output.append(...)` trailer injection

1. **Header Initialization:** The `deflate(_:)` method initializes an output `Data` container prepended with the two-byte zlib header sequence `[0x78, 0x5E]`.
2. **Compression Invocation:** It casts the incoming `Data` payload to `NSData` and invokes the native compression routine using the `.zlib` algorithm.
3. **Checksum Calculation:** Simultaneously, `adler32Checksum(of:)` accesses the raw memory bytes of the original request body via `data.withUnsafeBytes`, passing the buffer pointer and initial Adler-32 seed value (`1`) to the underlying C `adler32` function.
4. **Endianness Correction and Assembly:** The resulting 32-bit checksum is converted to big-endian byte order and appended directly to the end of the compressed output buffer.

Sources: [Source/Features/RequestCompression.swift:107-120](https://github.com/Alamofire/Alamofire/blob/main/Source/Features/RequestCompression.swift#L107-L120)

> [!NOTE]
> The `deflate(_:)` implementation manually constructs a standard zlib wrapper by prepending the `0x785E` header bytes and appending the big-endian Adler-32 checksum trailer around the output returned by Foundation's `.zlib` compressor.

Sources: [Source/Features/RequestCompression.swift:107-113](https://github.com/Alamofire/Alamofire/blob/main/Source/Features/RequestCompression.swift#L107-L113)

### Stream Processing Reference

| Internal Method | Input Type | Return Type | Underlying Operation / C Function |
| :--- | :--- | :--- | :--- |
| `deflate(_:)` | `Data` | `Data` | Appends zlib header `0x785E`, compresses via `.zlib`, and appends Adler-32 checksum. |
| `adler32Checksum(of:)` | `Data` | `UInt32` | Uses `withUnsafeBytes` to invoke zlib's `adler32` function with an initial seed of `1`. |

Sources: [Source/Features/RequestCompression.swift:107-120](https://github.com/Alamofire/Alamofire/blob/main/Source/Features/RequestCompression.swift#L107-L120)

## Automated Request Compression Testing

### Overview

The test suite for request compression is encapsulated within the `RequestCompressionTests` suite, which is conditionally compiled when `zlib` is available and the operating system is not Android. These tests validate both standard compression workflows and edge-case behavior concerning duplicate headers, custom skip conditions, and error propagation.

Sources: [Tests/RequestTests.swift:1777-1779](https://github.com/Alamofire/Alamofire/blob/main/Tests/RequestTests.swift#L1777-L1779)

### Core Test Coverage and Assertions

The test cases exercise various configurations of `DeflateRequestCompressor` by leveraging Alamofire's async/await testing infrastructure alongside Swift Testing (`#expect`) macros. Each test targets a specific validation or execution branch within the request adaptation pipeline:

- `thatRequestsCanBeCompressed()` verifies that a standard POST request with JSON-encoded parameters successfully completes when configured with `.deflateCompressor`.
- `thatDeflateCompressorThrowsErrorByDefaultWhenRequestAlreadyhasHeader()` and `thatDeflateCompressorThrowsErrorWhenConfigured()` both validate that pre-existing `Content-Encoding` headers trigger a failure containing a `DeflateRequestCompressor.DuplicateHeaderError` under default or explicitly configured `.error` behavior.
- `thatDeflateCompressorReplacesHeaderWhenConfigured()` confirms that setting duplicate header behavior to `.replace` allows compression to succeed even when a `Content-Encoding` header is already present.
- `thatDeflateCompressorSkipsCompressionWhenConfigured()` checks that `.skip` behavior passes the request through uncompressed, resulting in failure when a server expects specific compression.
- `thatDeflateCompressorDoesNotCompressDataWhenClosureReturnsFalse()` ensures that when the filtering closure evaluates to `false`, the request body remains uncompressed and lacks the `Content-Encoding` response header.

Sources: [Tests/RequestTests.swift:1780-1914](https://github.com/Alamofire/Alamofire/blob/main/Tests/RequestTests.swift#L1780-L1914)

> [!TIP]
> The test suite uses conditional compilation guards (`#if canImport(zlib) && !os(Android)`) matching `DeflateRequestCompressor` to ensure test execution is safely bypassed on unsupported target platforms.

Sources: [Tests/RequestTests.swift:1777-1777](https://github.com/Alamofire/Alamofire/blob/main/Tests/RequestTests.swift#L1777-L1777)

### Test Scenarios Reference

| Test Case Method | Configuration / Interceptor Option | Expected Outcome | Assertion / Validation |
| :--- | :--- | :--- | :--- |
| `thatRequestsCanBeCompressed` | `.deflateCompressor` | Success | `#expect(result.isSuccess)` |
| `thatDeflateCompressorThrowsErrorByDefaultWhenRequestAlreadyHasHeader` | `.deflateCompressor` (with preset header) | Failure | `#expect(result.failure?.underlyingError as? DeflateRequestCompressor.DuplicateHeaderError != nil)` |
| `thatDeflateCompressorThrowsErrorWhenConfigured` | `.deflateCompressor(duplicateHeaderBehavior: .error)` | Failure | `#expect(result.failure?.underlyingError as? DeflateRequestCompressor.DuplicateHeaderError != nil)` |
| `thatDeflateCompressorReplacesHeaderWhenConfigured` | `.deflateCompressor(duplicateHeaderBehavior: .replace)` | Success | `#expect(result.isSuccess)` |
| `thatDeflateCompressorSkipsCompressionWhenConfigured` | `.deflateCompressor(duplicateHeaderBehavior: .skip)` | Failure | `#expect(result.isFailure)` |
| `thatDeflateCompressorDoesNotCompressDataWhenClosureReturnsFalse` | `.deflateCompressor { _ in false }` | Success | `#expect(result.success?.headers["Content-Encoding"] == nil)` |

Sources: [Tests/RequestTests.swift:1780-1914](https://github.com/Alamofire/Alamofire/blob/main/Tests/RequestTests.swift#L1780-L1914)

## Error Handling and Lifecycle Management

### Overview

The `DeflateRequestCompressor` manages error generation and asynchronous completion signaling during request adaptation through its conformance to `RequestInterceptor`. When an outgoing `URLRequest` enters the adaptation pipeline, failures are caught and surfaced via standard `Result` completion blocks, separating duplicate header violations from stream compression exceptions.

Sources: [Source/Features/RequestCompression.swift:39-48](https://github.com/Alamofire/Alamofire/blob/main/Source/Features/RequestCompression.swift#L39-L48), [Source/Features/RequestCompression.swift:70-105](https://github.com/Alamofire/Alamofire/blob/main/Source/Features/RequestCompression.swift#L70-L105)

### Error Generation and Completion Flow

The error lifecycle is governed by the state of the request body and pre-existing header fields. The adaptation pipeline executes a precise sequence of checks within the `adapt(_:for:completion:)` method:

1. `urlRequest.httpBody` is evaluated to ensure body data is present. If absent, `completion(.success(urlRequest))` returns immediately without error.
2. `shouldCompressBodyData(bodyData)` is invoked; if it returns `false`, `completion(.success(urlRequest))` finishes the lifecycle successfully.
3. The existence of a `Content-Encoding` header triggers a check against `duplicateHeaderBehavior`:
   - `.error`: `completion(.failure(DuplicateHeaderError()))` is invoked.
   - `.replace`: Compression proceeds, overwriting the header.
   - `.skip`: `completion(.success(urlRequest))` exits early.
4. The `deflate(_:)` method is executed inside a `do-catch` block. If compression or checksum calculation throws an error, `completion(.failure(error))` forwards it to the caller.

Sources: [Source/Features/RequestCompression.swift:71-104](https://github.com/Alamofire/Alamofire/blob/main/Source/Features/RequestCompression.swift#L71-L104)

> [!WARNING]
> Body compression is a synchronous operation executed entirely on the calling queue during request adaptation. If a large payload blocks the queue, consider supplying a dedicated `requestQueue` in your `Session` instance to protect the main thread or critical worker threads.

Sources: [Source/Features/RequestCompression.swift:35-36](https://github.com/Alamofire/Alamofire/blob/main/Source/Features/RequestCompression.swift#L35-L36)

### Lifecycle Error Reference

| Error Type / Condition | Trigger Condition | Interceptor Action | Completion Result |
| :--- | :--- | :--- | :--- |
| `DuplicateHeaderError` | Pre-existing `Content-Encoding` header with `.error` behavior | Halts compression | `.failure(DuplicateHeaderError())` |
| Underlying Compression Error | Failure during `NSData.compressed(using: .zlib)` or `adler32` | Catches thrown exception | `.failure(error)` |
| Stream Absence | `urlRequest.httpBody` is `nil` | Bypasses compression | `.success(urlRequest)` |
| Closure Filter Rejection | `shouldCompressBodyData` returns `false` | Bypasses compression | `.success(urlRequest)` |

Sources: [Source/Features/RequestCompression.swift:50-53](https://github.com/Alamofire/Alamofire/blob/main/Source/Features/RequestCompression.swift#L50-L53), [Source/Features/RequestCompression.swift:71-104](https://github.com/Alamofire/Alamofire/blob/main/Source/Features/RequestCompression.swift#L71-L104)

## Related

- [[Request Lifecycle]]

