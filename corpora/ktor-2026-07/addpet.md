# POST Create Pets

<APIEndpoint
  method={"POST"}
  path={"/pets"}
  description={"Creates a new pet in the store. Duplicates are allowed"}
  deprecated={false}
  baseUrl={"https://petstore.swagger.io/v2"}
/>

## Request Body

Pet to add to the store

<APIRequestBody
  contentType={"application/json"}
  required={true}
  schema={{"type":"object","properties":{"name":{"type":"string"},"tag":{"type":"string"}},"required":["name"]}}
/>

## Responses

<APIResponse
  statusCode={"200"}
  description={"pet response"}
  contentType={"application/json"}
  schema={{}}
/>

<APIResponse
  statusCode={"default"}
  description={"unexpected error"}
  contentType={"application/json"}
  schema={{"type":"object","properties":{"code":{"type":"integer","format":"int32"},"message":{"type":"string"}},"required":["code","message"]}}
/>

## Try It

<APIPlayground
  method={"POST"}
  path={"/pets"}
  parameters={[]}
  requestBody={{"required":true,"description":"Pet to add to the store","contentType":"application/json","schema":{"type":"object","properties":{"name":{"type":"string"},"tag":{"type":"string"}},"required":["name"]}}}
  baseUrl={"https://petstore.swagger.io/v2"}
/>

