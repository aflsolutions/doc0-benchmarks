# Error Handling

<details>
<summary>Relevant source files</summary>

The following files were used as context for generating this wiki page:

- [Source/Core/AFError.swift](https://github.com/Alamofire/Alamofire/blob/main/Source/Core/AFError.swift)
- [docs/docsets/Alamofire.docset/Contents/Resources/Documents/Enums/AFError.html](https://github.com/Alamofire/Alamofire/blob/main/docs/docsets/Alamofire.docset/Contents/Resources/Documents/Enums/AFError.html)
- [docs/Enums/AFError.html](https://github.com/Alamofire/Alamofire/blob/main/docs/Enums/AFError.html)
</details>

## Overview

`AFError` serves as the centralized error type returned throughout Alamofire, encapsulating various networking, serialization, validation, and encoding failures into distinct, strongly typed domain categories. By adopting Swift's `Error` and `Sendable` protocols, it provides robust compile-time safety and seamless integration across concurrency domains. Each failure case carries detailed associated reasons or underlying system errors, enabling developers to precisely diagnose issues such as invalid URLs, failed response validations, or corrupted multipart encodings.

Sources: [Source/Core/AFError.swift:31-33](https://github.com/Alamofire/Alamofire/blob/main/Source/Core/AFError.swift#L31-L33)

## AFError Structure and Primary Categories

### Overview

At its core, `AFError` is implemented as a public Swift enumeration conforming to both the standard `Error` and `Sendable` protocols, ensuring safety across modern concurrent execution contexts. The enum design utilizes associated values to delegate complex failure classification into specialized, domain-specific nested structures and enums. This classification cleanly separates high-level lifecycle events—such as session invalidation or explicit cancellation—from low-level subsystems like parameter encoding, multipart assembly, response validation, serialization, and cryptographic server trust evaluations.

Sources: [Source/Core/AFError.swift:31-33](https://github.com/Alamofire/Alamofire/blob/main/Source/Core/AFError.swift#L31-L33)

### Primary Domain Classification

The enumeration defines top-level cases that partition failures into distinct operational domains within Alamofire's request lifecycle. Each primary case provides specific context parameters or delegates to nested failure reason enums.

| Top-Level Case | Associated Payload / Reason Type | Primary Operational Domain |
| :--- | :--- | :--- |
| `createUploadableFailed` | `error: any Error` | Uploadable preparation failure |
| `createURLRequestFailed` | `error: any Error` | URL request convertible conversion failure |
| `downloadedFileMoveFailed` | `error: any Error, source: URL, destination: URL` | File management during downloads |
| `explicitlyCancelled` | None | Request lifecycle cancellation |
| `invalidURL` | `url: any URLConvertible` | URL conversion failure |
| `multipartEncodingFailed` | `MultipartEncodingFailureReason` | Multipart form body encoding |
| `parameterEncodingFailed` | `ParameterEncodingFailureReason` | Legacy parameter encoding |
| `parameterEncoderFailed` | `ParameterEncoderFailureReason` | Modern parameter encoder execution |
| `requestAdaptationFailed` | `error: any Error` | Request interceptor adaptation |
| `requestRetryFailed` | `retryError: any Error, originalError: any Error` | Request interceptor retry handling |
| `responseValidationFailed` | `ResponseValidationFailureReason` | Response content and status validation |
| `responseSerializationFailed` | `ResponseSerializationFailureReason` | Data or file response serialization |
| `serverTrustEvaluationFailed` | `ServerTrustFailureReason` | Security and SSL evaluation |
| `sessionDeinitialized` | None | Session lifecycle deallocation |
| `sessionInvalidated` | `error: (any Error)?` | Session explicit invalidation |
| `sessionTaskFailed` | `error: any Error` | Underlying `URLSessionTask` failure |
| `urlRequestValidationFailed` | `URLRequestValidationFailureReason` | Request structural validation |

Sources: [Source/Core/AFError.swift:194-230](https://github.com/Alamofire/Alamofire/blob/main/Source/Core/AFError.swift#L194-L230)

> [!NOTE]
> Conditional compilation guards protect security-related failure categories. The `ServerTrustFailureReason` nested enum and its associated top-level case `serverTrustEvaluationFailed` are compiled only when the `Security` framework can be imported.

Sources: [Source/Core/AFError.swift:27-29](https://github.com/Alamofire/Alamofire/blob/main/Source/Core/AFError.swift#L27-L29), [Source/Core/AFError.swift:136-186](https://github.com/Alamofire/Alamofire/blob/main/Source/Core/AFError.swift#L136-L186), [Source/Core/AFError.swift:218-221](https://github.com/Alamofire/Alamofire/blob/main/Source/Core/AFError.swift#L218-L221)

## Parameter and Multipart Encoding Failures

### Overview

Parameter and multipart encoding failures are categorized under dedicated nested structures within `AFError`. When request parameters fail to transform into valid query strings or bodies, or when multipart form-data assembly encounters file system or stream issues, Alamofire wraps these occurrences into specific failure reasons that preserve underlying system errors and contextual metadata.

Sources: [Source/Core/AFError.swift:35-62](https://github.com/Alamofire/Alamofire/blob/main/Source/Core/AFError.swift#L35-L62), [Source/Core/AFError.swift:74-97](https://github.com/Alamofire/Alamofire/blob/main/Source/Core/AFError.swift#L74-L97)

### Parameter Encoding and Encoder Failures

Parameter encoding distinguishes between traditional legacy parameter encoders (`ParameterEncodingFailureReason`) and modern protocol-based encoders (`ParameterEncoderFailureReason`). The legacy reason enumeration covers missing destination URLs, JSON serialization errors, and custom closures, whereas the modern encoder model tracks missing required request components and underlying encoder failures.

| Failure Reason Enum | Case Name | Associated Value / Payload | Meaning / Cause |
| :--- | :--- | :--- | :--- |
| `ParameterEncodingFailureReason` | `missingURL` | None | The `URLRequest` did not have a `URL` to encode. |
| `ParameterEncodingFailureReason` | `jsonEncodingFailed` | `error: any Error` | JSON serialization failed with an underlying system error. |
| `ParameterEncodingFailureReason` | `customEncodingFailed` | `error: any Error` | Custom parameter encoding failed due to the associated error. |
| `ParameterEncoderFailureReason` | `missingRequiredComponent` | `RequiredComponent` | A required request component was missing during encoding. |
| `ParameterEncoderFailureReason` | `encoderFailed` | `error: any Error` | The underlying encoder failed with the associated error. |

Sources: [Source/Core/AFError.swift:74-97](https://github.com/Alamofire/Alamofire/blob/main/Source/Core/AFError.swift#L74-L97)

> [!NOTE]
> The `ParameterEncoderFailureReason.RequiredComponent` enum defines specific missing elements as either `case url` when the URL cannot be extracted or `case httpMethod(rawValue: String)` when the HTTP method is unrecognized or missing.

Sources: [Source/Core/AFError.swift:85-91](https://github.com/Alamofire/Alamofire/blob/main/Source/Core/AFError.swift#L85-L91)

### Multipart Form Encoding Failures

Multipart form building validates file URLs, reachability, stream creation, and disk output streams. The `MultipartEncodingFailureReason` enumeration details file system and stream anomalies encountered while assembling body parts.

| Case Name | Associated Payload | Description |
| :--- | :--- | :--- |
| `bodyPartURLInvalid` | `url: URL` | Provided file URL is not a valid file URL. |
| `bodyPartFilenameInvalid` | `in: URL` | Filename has an empty `lastPathComponent` or `pathExtension`. |
| `bodyPartFileNotReachable` | `at: URL` | File at the provided URL was not reachable. |
| `bodyPartFileNotReachableWithError` | `atURL: URL, error: any Error` | Reachability check threw an underlying system error. |
| `bodyPartFileIsDirectory` | `at: URL` | Provided URL points to a directory instead of a file. |
| `bodyPartFileSizeNotAvailable` | `at: URL` | System did not return a file size. |
| `bodyPartFileSizeQueryFailedWithError` | `forURL: URL, error: any Error` | File size query threw an underlying error. |
| `bodyPartInputStreamCreationFailed` | `for: URL` | An `InputStream` could not be created for the file. |
| `outputStreamCreationFailed` | `for: URL` | An `OutputStream` could not be created for disk writing. |
| `outputStreamFileAlreadyExists` | `at: URL` | A file already exists at the target destination URL. |
| `outputStreamURLInvalid` | `url: URL` | Disk write target URL is not a file URL. |
| `outputStreamWriteFailed` | `error: any Error` | Writing encoded body data to disk failed. |
| `inputStreamReadFailed` | `error: any Error` | Reading an encoded body part input stream failed. |

Sources: [Source/Core/AFError.swift:35-62](https://github.com/Alamofire/Alamofire/blob/main/Source/Core/AFError.swift#L35-L62)

> [!TIP]
> When `inputStreamReadFailed` occurs during multipart encoding, it may embed an `UnexpectedInputStreamLength` structure containing explicit `bytesExpected` and `bytesRead` properties to diagnose data truncation or stream mismatch.

Sources: [Source/Core/AFError.swift:64-71](https://github.com/Alamofire/Alamofire/blob/main/Source/Core/AFError.swift#L64-L71)

## Response Validation and Serialization Errors

### Response Validation and Serialization Failures

Alamofire separates server response validation rules from data serialization operations. Response validation checks whether the downloaded or received response file exists, matches expected content types, satisfies HTTP status code rules, or passes custom validation closures. Serialization transforms raw input data or response files into typed objects, strings, JSON structures, or decoded models. Both subsystems report detailed failures through specialized underlying reason enumerations nested inside `AFError`.

| Failure Category | Case Name | Associated Payload | Meaning / Cause |
| :--- | :--- | :--- | :--- |
| `ResponseValidationFailureReason` | `dataFileNil` | None | The data file containing the server response did not exist. |
| `ResponseValidationFailureReason` | `dataFileReadFailed` | `at: URL` | The data file at the associated URL could not be read. |
| `ResponseValidationFailureReason` | `missingContentType` | `acceptableContentTypes: [String]` | Response lacked a `Content-Type` header and acceptable types omitted wildcards. |
| `ResponseValidationFailureReason` | `unacceptableContentType` | `acceptableContentTypes: [String], responseContentType: String` | Response content type did not match any acceptable type. |
| `ResponseValidationFailureReason` | `unacceptableStatusCode` | `code: Int` | The HTTP response status code was not acceptable. |
| `ResponseValidationFailureReason` | `customValidationFailed` | `error: any Error` | Custom response validation failed due to the associated error. |
| `ResponseSerializationFailureReason` | `inputDataNilOrZeroLength` | None | The server response contained no data or zero length data. |
| `ResponseSerializationFailureReason` | `inputFileNil` | None | The file containing the server response did not exist. |
| `ResponseSerializationFailureReason` | `inputFileReadFailed` | `at: URL` | The server response file could not be read from the URL. |
| `ResponseSerializationFailureReason` | `stringSerializationFailed` | `encoding: String.Encoding` | String serialization failed using the provided encoding. |
| `ResponseSerializationFailureReason` | `jsonSerializationFailed` | `error: any Error` | JSON serialization failed with an underlying system error. |
| `ResponseSerializationFailureReason` | `decodingFailed` | `error: any Error` | A `DataDecoder` failed to decode the response due to an error. |
| `ResponseSerializationFailureReason` | `customSerializationFailed` | `error: any Error` | A custom response serializer failed due to an error. |
| `ResponseSerializationFailureReason` | `invalidEmptyResponse` | `type: String` | Generic serialization failed for an empty response not of type `Empty`. |

Sources: [Source/Core/AFError.swift:99-134](https://github.com/Alamofire/Alamofire/blob/main/Source/Core/AFError.swift#L99-L134)

> [!WARNING]
> When handling empty responses, expecting a custom model type instead of Alamofire's built-in `Empty` structure triggers the `.invalidEmptyResponse(type: String)` serialization failure reason.

Sources: [Source/Core/AFError.swift:132-133](https://github.com/Alamofire/Alamofire/blob/main/Source/Core/AFError.swift#L132-L133)

### Extracting Validation and Serialization Metadata

The `AFError` type provides computed helper properties that inspect nested failure reasons to extract context without manual switch statements. For validation errors, properties expose acceptable content types, the actual response content type, and the failing response code. For serialization errors, properties expose failed string encodings and underlying decoding or parsing errors.

| AFError Computed Property | Return Type | Source Failure Reason Case |
| :--- | :--- | :--- |
| `acceptableContentTypes` | `[String]?` | `.missingContentType`, `.unacceptableContentType` |
| `responseContentType` | `String?` | `.unacceptableContentType` |
| `responseCode` | `Int?` | `.unacceptableStatusCode` |
| `failedStringEncoding` | `String.Encoding?` | `.stringSerializationFailed` |
| `underlyingError` | `(any Error)?` | `.customValidationFailed`, `.jsonSerializationFailed`, `.decodingFailed`, `.customSerializationFailed` |

Sources: [Source/Core/AFError.swift:384-444](https://github.com/Alamofire/Alamofire/blob/main/Source/Core/AFError.swift#L384-L444), [Source/Core/AFError.swift:571-582](https://github.com/Alamofire/Alamofire/blob/main/Source/Core/AFError.swift#L571-L582), [Source/Core/AFError.swift:601-614](https://github.com/Alamofire/Alamofire/blob/main/Source/Core/AFError.swift#L601-L614)

> [!TIP]
> Use `.isResponseValidationError` or `.isResponseSerializationError` booleans to quickly branch on failure categories before extracting granular metadata like `responseCode` or `failedStringEncoding`.

Sources: [Source/Core/AFError.swift:309-319](https://github.com/Alamofire/Alamofire/blob/main/Source/Core/AFError.swift#L309-L319)

## Server Trust and Security Evaluation Failures

### Overview

When SSL pinning or server trust evaluations fail during a secure network request, Alamofire encapsulates the security failure inside the `.serverTrustEvaluationFailed(reason:)` case of `AFError`. This case wraps the `ServerTrustFailureReason` enumeration, which provides detailed failure contexts conditional on the availability of the `Security` framework (`#if canImport(Security)`). 

Sources: [Source/Core/AFError.swift:136-138](https://github.com/Alamofire/Alamofire/blob/main/Source/Core/AFError.swift#L136-L138), [Source/Core/AFError.swift:218-221](https://github.com/Alamofire/Alamofire/blob/main/Source/Core/AFError.swift#L218-L221)

### Server Trust Failure Reasons

The `ServerTrustFailureReason` enum enumerates all possible evaluation exceptions, ranging from missing evaluators and anchor configuration failures to certificate and public key pinning mismatches. The `Output` structure captures contextual metadata including the host, the evaluated `SecTrust` object, the resulting `OSStatus`, and the `SecTrustResultType`.

| ServerTrustFailureReason Case | Associated Values | Description |
| :--- | :--- | :--- |
| `noRequiredEvaluator` | `host: String` | No `ServerTrustEvaluator` was found for the target host. |
| `noCertificatesFound` | None | No certificates were found with which to perform the trust evaluation. |
| `noPublicKeysFound` | None | No public keys were found with which to perform the trust evaluation. |
| `policyApplicationFailed` | `trust: SecTrust, policy: SecPolicy, status: OSStatus` | Application of the associated `SecPolicy` failed during evaluation. |
| `settingAnchorCertificatesFailed` | `status: OSStatus, certificates: [SecCertificate]` | Setting anchor certificates failed during evaluation. |
| `revocationPolicyCreationFailed` | None | Creation of the revocation policy failed. |
| `trustEvaluationFailed` | `error: (any Error)?` | `SecTrust` evaluation failed with an optional underlying error. |
| `defaultEvaluationFailed` | `output: Output` | Default evaluation failed, containing host, trust, status, and result. |
| `hostValidationFailed` | `output: Output` | Host validation failed, containing evaluation output metadata. |
| `revocationCheckFailed` | `output: Output, options: RevocationTrustEvaluator.Options` | Revocation check failed with output and revocation options. |
| `certificatePinningFailed` | `host: String, trust: SecTrust, pinnedCertificates: [SecCertificate], serverCertificates: [SecCertificate]` | Certificate pinning validation failed against pinned certificates. |
| `publicKeyPinningFailed` | `host: String, trust: SecTrust, pinnedKeys: [SecKey], serverKeys: [SecKey]` | Public key pinning validation failed against pinned keys. |
| `customEvaluationFailed` | `error: any Error` | Custom server trust evaluation failed due to an associated error. |

Sources: [Source/Core/AFError.swift:138-185](https://github.com/Alamofire/Alamofire/blob/main/Source/Core/AFError.swift#L138-L185)

> [!WARNING]
> Server trust failure reasons involving evaluation outputs (`.defaultEvaluationFailed`, `.hostValidationFailed`, `.revocationCheckFailed`) embed an `Output` struct containing the live `SecTrust` reference and `OSStatus` code, which must be handled carefully when logging or inspecting security states.

Sources: [Source/Core/AFError.swift:139-157](https://github.com/Alamofire/Alamofire/blob/main/Source/Core/AFError.swift#L139-L157), [Source/Core/AFError.swift:619-624](https://github.com/Alamofire/Alamofire/blob/main/Source/Core/AFError.swift#L619-L624)

## Underlying Network and System Errors

### Overview

Alamofire wraps raw system-level networking faults, stream failures, task completion errors, and session lifecycle anomalies into dedicated cases of `AFError`. These errors map low-level `URLSessionTask` and input/output exceptions into unified domain errors with accessible underlying error inspection and helper properties.

Sources: [Source/Core/AFError.swift:222-229](https://github.com/Alamofire/Alamofire/blob/main/Source/Core/AFError.swift#L222-L229)

### System-Level and Session Error Cases

The top-level `AFError` enum provides several cases specifically targeting lower-level lifecycle and task failures, such as explicit cancellation, session deinitialization, session invalidation, and raw task failures.

| AFError Case | Associated Values | Description |
| :--- | :--- | :--- |
| `explicitlyCancelled` | None | The request was explicitly cancelled. |
| `sessionDeinitialized` | None | The `Session` instance issued the request was deinitialized prematurely. |
| `sessionInvalidated` | `error: (any Error)?` | The `Session` was explicitly invalidated, optionally wrapping an underlying error. |
| `sessionTaskFailed` | `error: any Error` | The underlying `URLSessionTask` completed with a raw system error. |
| `downloadedFileMoveFailed` | `error: any Error, source: URL, destination: URL` | The file manager failed to move a downloaded temporary file to its destination. |

Sources: [Source/Core/AFError.swift:198-201](https://github.com/Alamofire/Alamofire/blob/main/Source/Core/AFError.swift#L198-L201), [Source/Core/AFError.swift:222-227](https://github.com/Alamofire/Alamofire/blob/main/Source/Core/AFError.swift#L222-L227)

### Inspecting Underlying Errors and Resume Data

When dealing with download tasks or network connection failures, underlying `URLError` instances and download resume data can be extracted directly through convenience properties on `AFError`.

```swift
let error: AFError = /* caught error */

// Extract underlying URLSession or system error
if let underlying = error.underlyingError {
    print("Underlying system error: \(underlying)")
}

// Retrieve download resume data from underlying URLError userInfo
#if canImport(Security)
if let resumeData = error.downloadResumeData {
    print("Found download resume data of length: \(resumeData.count)")
}
#endif
```

Sources: [Source/Core/AFError.swift:384-420](https://github.com/Alamofire/Alamofire/blob/main/Source/Core/AFError.swift#L384-L420), [Source/Core/AFError.swift:458-463](https://github.com/Alamofire/Alamofire/blob/main/Source/Core/AFError.swift#L458-L463)

> [!NOTE]
> The `downloadResumeData` property inspects the `underlyingError` as a `URLError` and extracts `NSURLSessionDownloadTaskResumeData` from its `userInfo` dictionary.

Sources: [Source/Core/AFError.swift:458-463](https://github.com/Alamofire/Alamofire/blob/main/Source/Core/AFError.swift#L458-L463)

## Related

- [[Response Validation]]
- [[Response Serialization]]

