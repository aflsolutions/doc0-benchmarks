# POST Create Nullable Value Classes

<APIEndpoint
  method={"POST"}
  path={"/nullable-value-classes"}
  deprecated={false}
  baseUrl={""}
/>

## Request Body

<APIRequestBody
  contentType={"application/json"}
  required={false}
  schema={{"type":"object","properties":{"nullableText":{},"token":{"type":"string"},"optionalToken":{},"tokenWithNullableContent":{},"optionalCount":{}},"required":["token","tokenWithNullableContent"]}}
/>

## Responses

<APIResponse
  statusCode={"200"}
  description={""}
  contentType={"application/json"}
  schema={{"type":"object","properties":{"nullableText":{},"token":{"type":"string"},"optionalToken":{},"tokenWithNullableContent":{},"optionalCount":{}},"required":["token","tokenWithNullableContent"]}}
/>

## Try It

<APIPlayground
  method={"POST"}
  path={"/nullable-value-classes"}
  parameters={[]}
  requestBody={{"required":false,"description":null,"contentType":"application/json","schema":{"type":"object","properties":{"nullableText":{},"token":{"type":"string"},"optionalToken":{},"tokenWithNullableContent":{},"optionalCount":{}},"required":["token","tokenWithNullableContent"]}}}
  baseUrl={""}
/>

