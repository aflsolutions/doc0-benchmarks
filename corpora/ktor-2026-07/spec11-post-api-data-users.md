# POST Create Users

<APIEndpoint
  method={"POST"}
  path={"/api/data/users"}
  deprecated={false}
  baseUrl={""}
/>

## Request Body

<APIRequestBody
  contentType={"application/json"}
  required={false}
  schema={{"type":"object","properties":{"id":{"type":"string"},"name":{"type":"string"}},"required":["id","name"]}}
/>

## Responses

<APIResponse
  statusCode={"201"}
  description={""}
/>

## Try It

<APIPlayground
  method={"POST"}
  path={"/api/data/users"}
  parameters={[]}
  requestBody={{"required":false,"description":null,"contentType":"application/json","schema":{"type":"object","properties":{"id":{"type":"string"},"name":{"type":"string"}},"required":["id","name"]}}}
  baseUrl={""}
/>

