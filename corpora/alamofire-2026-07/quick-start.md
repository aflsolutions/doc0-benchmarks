# Quick Start

<details>
<summary>Relevant source files</summary>

The following files were used as context for generating this wiki page:

- [README.md](https://github.com/Alamofire/Alamofire/blob/main/README.md)
- [docs/docsets/Alamofire.docset/Contents/Resources/Documents/Enums/AF.html](https://github.com/Alamofire/Alamofire/blob/main/docs/docsets/Alamofire.docset/Contents/Resources/Documents/Enums/AF.html)
- [docs/Enums/AF.html](https://github.com/Alamofire/Alamofire/blob/main/docs/Enums/AF.html)
</details>

## Overview

Getting started with Alamofire's default interface allows developers to execute network tasks quickly using concise, chainable Swift syntax. By leveraging the global `AF` namespace, you can initiate robust HTTP communication, serialize complex data structures, and handle responses or errors efficiently. Sources: [README.md:38-80](https://github.com/Alamofire/Alamofire/blob/main/README.md#L38-L80)

Sources: [docs/docsets/Alamofire.docset/Contents/Resources/Documents/Enums/AF.html:422-430](https://github.com/Alamofire/Alamofire/blob/main/docs/docsets/Alamofire.docset/Contents/Resources/Documents/Enums/AF.html#L422-L430)

## Making Basic HTTP Requests

### Overview

Alamofire provides the global `AF` enumeration namespace as an entry point for interacting with the default `Session` instance, enabling the rapid execution of standard HTTP operations. Through methods such as `request(_:method:parameters:encoding:headers:interceptor:)` and various `upload` overloads, developers can dispatch `GET`, `POST`, and custom HTTP requests with minimal boilerplate. Sources: [README.md:54-79](https://github.com/Alamofire/Alamofire/blob/main/README.md#L54-L79)

Sources: [docs/docsets/Alamofire.docset/Contents/Resources/Documents/Enums/AF.html:422-474](https://github.com/Alamofire/Alamofire/blob/main/docs/docsets/Alamofire.docset/Contents/Resources/Documents/Enums/AF.html#L422-L474)

Sources: [docs/docsets/Alamofire.docset/Contents/Resources/Documents/Enums/AF.html:1243-1250](https://github.com/Alamofire/Alamofire/blob/main/docs/docsets/Alamofire.docset/Contents/Resources/Documents/Enums/AF.html#L1243-L1250)

### Initiating GET Requests via AF

The `AF.request` method automatically converts string URLs into valid request structures using `URLConvertible` types. By default, calling `AF.request` without specifying an HTTP method defaults to `.get`. Sources: [README.md:58-60](https://github.com/Alamofire/Alamofire/blob/main/README.md#L58-L60)

Sources: [docs/docsets/Alamofire.docset/Contents/Resources/Documents/Enums/AF.html:466-471](https://github.com/Alamofire/Alamofire/blob/main/docs/docsets/Alamofire.docset/Contents/Resources/Documents/Enums/AF.html#L466-L471)

```swift
let request = AF.request("https://httpbin.org/get")
                .responseDecodable(of: DecodableType.self) { response in
                    debugPrint(response)
                }
```
Sources: [README.md:58-60](https://github.com/Alamofire/Alamofire/blob/main/README.md#L58-L60)

Sources: [docs/docsets/Alamofire.docset/Contents/Resources/Documents/Enums/AF.html:466-471](https://github.com/Alamofire/Alamofire/blob/main/docs/docsets/Alamofire.docset/Contents/Resources/Documents/Enums/AF.html#L466-L471)

### Initiating POST and Upload Requests

For resource creation or payload transmission, `AF.upload` creates an `UploadRequest` instance. You can pass raw `Data`, a file `URL`, an `InputStream`, or prebuilt `MultipartFormData` closures. By default, `AF.upload` configures the underlying request with the `.post` HTTP method. Sources: [docs/docsets/Alamofire.docset/Contents/Resources/Documents/Enums/AF.html:1243-1250](https://github.com/Alamofire/Alamofire/blob/main/docs/docsets/Alamofire.docset/Contents/Resources/Documents/Enums/AF.html#L1243-L1250)

Sources: [docs/docsets/Alamofire.docset/Contents/Resources/Documents/Enums/AF.html:1243-1250](https://github.com/Alamofire/Alamofire/blob/main/docs/docsets/Alamofire.docset/Contents/Resources/Documents/Enums/AF.html#L1243-L1250)

```swift
let uploadRequest = AF.upload(Data("payload".utf8), to: "https://httpbin.org/post")
                      .response { response in
                          debugPrint(response)
                      }
```
Sources: [docs/docsets/Alamofire.docset/Contents/Resources/Documents/Enums/AF.html:1243-1250](https://github.com/Alamofire/Alamofire/blob/main/docs/docsets/Alamofire.docset/Contents/Resources/Documents/Enums/AF.html#L1243-L1250)

Sources: [docs/docsets/Alamofire.docset/Contents/Resources/Documents/Enums/AF.html:1243-1250](https://github.com/Alamofire/Alamofire/blob/main/docs/docsets/Alamofire.docset/Contents/Resources/Documents/Enums/AF.html#L1243-L1250)

## Parameter Encoding and Custom Headers

### Overview

Alamofire provides flexible parameter encoding and HTTP header configuration mechanisms through `AF.request` parameters. By supplying dictionary parameters or `Encodable` models alongside explicit encoding strategies and `HTTPHeaders` values, you can append query strings to URLs or serialize payloads directly into JSON body data. Sources: [README.md:41-41](https://github.com/Alamofire/Alamofire/blob/main/README.md#L41-L41)

Sources: [docs/docsets/Alamofire.docset/Contents/Resources/Documents/Enums/AF.html:466-474](https://github.com/Alamofire/Alamofire/blob/main/docs/docsets/Alamofire.docset/Contents/Resources/Documents/Enums/AF.html#L466-L474)

### Parameter Encoding and Custom Headers Example

The following example demonstrates passing custom URL query parameters with `URLEncoding.default`, a JSON body payload using `JSONEncoding.default`, and custom HTTP header fields via `HTTPHeaders`: Sources: [README.md:41-41](https://github.com/Alamofire/Alamofire/blob/main/README.md#L41-L41)

Sources: [docs/docsets/Alamofire.docset/Contents/Resources/Documents/Enums/AF.html:466-474](https://github.com/Alamofire/Alamofire/blob/main/docs/docsets/Alamofire.docset/Contents/Resources/Documents/Enums/AF.html#L466-L474)

```swift
import Alamofire

let parameters: Parameters = ["foo": "bar"]
let headers: HTTPHeaders = [
    "Authorization": "Bearer token_abc123",
    "Accept": "application/json"
]

// Query parameter request using URLEncoding
let getRequest = AF.request("https://httpbin.org/get", parameters: parameters, encoding: URLEncoding.default, headers: headers)

// JSON body payload request using JSONEncoding
let postRequest = AF.request("https://httpbin.org/post", method: .post, parameters: parameters, encoding: JSONEncoding.default, headers: headers)
```
Sources: [README.md:41-41](https://github.com/Alamofire/Alamofire/blob/main/README.md#L41-L41)

Sources: [docs/docsets/Alamofire.docset/Contents/Resources/Documents/Enums/AF.html:466-474](https://github.com/Alamofire/Alamofire/blob/main/docs/docsets/Alamofire.docset/Contents/Resources/Documents/Enums/AF.html#L466-L474)

## Handling HTTP Responses

### Overview

Alamofire provides robust response handling mechanisms to process raw network bytes, deserialize JSON structures, and automatically parse responses into Swift `Decodable` types using background parsing. Responses can be consumed via completion closures or combined with Swift concurrency. Sources: [README.md:73-76](https://github.com/Alamofire/Alamofire/blob/main/README.md#L73-L76)

Sources: [README.md:73-76](https://github.com/Alamofire/Alamofire/blob/main/README.md#L73-L76)

### Automatic Decodable Parsing and Deserialization

When working with model objects, you can leverage `.serializingDecodable(_:completionHandler:)` or `.responseDecodable(of:completionHandler:)` to parse server payloads directly into conforming types. This automatically handles background decoding to prevent blocking the main thread. Sources: [README.md:73-76](https://github.com/Alamofire/Alamofire/blob/main/README.md#L73-L76)

Sources: [README.md:73-76](https://github.com/Alamofire/Alamofire/blob/main/README.md#L73-L76)

```swift
let response = await AF.request("https://httpbin.org/get")
                       .validate()
                       .serializingDecodable(DecodableType.self)
                       .response

debugPrint(response)
```
Sources: [README.md:60-78](https://github.com/Alamofire/Alamofire/blob/main/README.md#L60-L78)

Sources: [README.md:60-78](https://github.com/Alamofire/Alamofire/blob/main/README.md#L60-L78)

## Validating Response Status Codes

### Overview

Alamofire provides built-in response validation to ensure that HTTP responses meet specific criteria before completion handlers or response serializers execute. By invoking `.validate()` on a request chain, you can filter incoming HTTP status codes and content types to verify server success conditions. Sources: [README.md:45-45](https://github.com/Alamofire/Alamofire/blob/main/README.md#L45-L45)

Sources: [README.md:67-68](https://github.com/Alamofire/Alamofire/blob/main/README.md#L67-L68)

### Default and Custom Response Validation

When you append `.validate()` without arguments, Alamofire applies default validation rules checking that the response status code falls within the acceptable range of `200...299`. If the validation fails, the request produces an error that propagates through the response handlers. Sources: [README.md:67-68](https://github.com/Alamofire/Alamofire/blob/main/README.md#L67-L68)

Sources: [README.md:67-68](https://github.com/Alamofire/Alamofire/blob/main/README.md#L67-L68)

```swift
let request = AF.request("https://httpbin.org/get")
                .validate()
                .responseDecodable(of: MyModel.self) { response in
                    switch response.result {
                    case .success(let model):
                        print("Validated and decoded: \(model)")
                    case .failure(let error):
                        print("Validation or network error: \(error)")
                    }
                }
```
Sources: [README.md:60-76](https://github.com/Alamofire/Alamofire/blob/main/README.md#L60-L76)

Sources: [docs/docsets/Alamofire.docset/Contents/Resources/Documents/Enums/AF.html:466-471](https://github.com/Alamofire/Alamofire/blob/main/docs/docsets/Alamofire.docset/Contents/Resources/Documents/Enums/AF.html#L466-L471)

## Basic Response Error Handling

### Overview

Alamofire encapsulates network and processing failures within the `AFError` enumeration, providing precise failure reasons across different execution stages. When inspecting request results, handling `AFError` instances allows developers to distinguish between parameter encoding faults, network connectivity issues, server trust evaluation errors, validation failures, and response serialization exceptions. Sources: [README.md:45-51](https://github.com/Alamofire/Alamofire/blob/main/README.md#L45-L51)

Sources: [README.md:45-51](https://github.com/Alamofire/Alamofire/blob/main/README.md#L45-L51)

### AFError Failure Reasons

The `AFError` enum defines nested failure reason types that categorize exact error contexts encountered during request building, validation, and serialization. Sources: [README.md:45-51](https://github.com/Alamofire/Alamofire/blob/main/README.md#L45-L51)

Sources: [README.md:45-51](https://github.com/Alamofire/Alamofire/blob/main/README.md#L45-L51)

| Error Type / Reason Enum | Description |
|-------------------------|-------------|
| `AFError.ParameterEncodingFailureReason` | Encapsulates failures that occur when encoding parameters into a URL request. |
| `AFError.ParameterEncoderFailureReason` | Describes failures originating from concrete parameter encoders during payload formatting. |
| `AFError.MultipartEncodingFailureReason` | Details structural or stream reading failures during multipart form data assembly. |
| `AFError.ResponseValidationFailureReason` | Captures validation errors such as unacceptable status codes or content types. |
| `AFError.ResponseSerializationFailureReason` | Represents data serialization and decoding faults, including JSON parsing or `Decodable` mapping errors. |
| `AFError.ServerTrustFailureReason` | Highlights trust evaluation and certificate/public key pinning validation failures. |
| `AFError.URLRequestValidationFailureReason` | Identifies invalid URL request configurations prior to dispatch. |
Sources: [README.md:45-51](https://github.com/Alamofire/Alamofire/blob/main/README.md#L45-L51)

Sources: [README.md:45-51](https://github.com/Alamofire/Alamofire/blob/main/README.md#L45-L51)

### Inspecting and Managing Request Failures

When handling response results, matching against `AFError` cases provides granular control over failure recovery and logging. Sources: [README.md:60-76](https://github.com/Alamofire/Alamofire/blob/main/README.md#L60-L76)

Sources: [README.md:60-76](https://github.com/Alamofire/Alamofire/blob/main/README.md#L60-L76)

```swift
AF.request("https://httpbin.org/get")
  .validate()
  .responseDecodable(of: MyModel.self) { response in
      switch response.result {
      case .success(let model):
          print("Successfully processed: \(model)")
      case .failure(let error):
          if let afError = error.asAFError {
              switch afError {
              case .responseValidationFailed(let reason):
                  print("Validation failed: \(reason)")
              case .responseSerializationFailed(let reason):
                  print("Serialization failed: \(reason)")
              default:
                  print("Other Alamofire error: \(afError)")
              }
          } else {
              print("Underlying URLSession error: \(error)")
          }
      }
  }
```
Sources: [README.md:60-76](https://github.com/Alamofire/Alamofire/blob/main/README.md#L60-L76)

Sources: [README.md:60-76](https://github.com/Alamofire/Alamofire/blob/main/README.md#L60-L76)

## Related

- [[Overview]]
- [[Session And Requests]]
- [[Response Serialization]]

