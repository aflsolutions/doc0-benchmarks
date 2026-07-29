# POST Create Node

<APIEndpoint
  method={"POST"}
  path={"/node"}
  deprecated={false}
  baseUrl={""}
/>

## Request Body

<APIRequestBody
  contentType={"application/json"}
  required={false}
  schema={{"type":"object","properties":{"name":{"type":"string"},"parent":{}},"required":["name"]}}
/>

## Responses

<APIResponse
  statusCode={"200"}
  description={""}
  contentType={"application/json"}
  schema={{"type":"object","properties":{"name":{"type":"string"},"parent":{}},"required":["name"]}}
/>

## Try It

<APIPlayground
  method={"POST"}
  path={"/node"}
  parameters={[]}
  requestBody={{"required":false,"description":null,"contentType":"application/json","schema":{"type":"object","properties":{"name":{"type":"string"},"parent":{}},"required":["name"]}}}
  baseUrl={""}
/>

