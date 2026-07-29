# POST Save a new user.

<APIEndpoint
  method={"POST"}
  path={"/api/users"}
  summary={"Save a new user."}
  deprecated={false}
  baseUrl={""}
/>

## Request Body

The user to save.

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
  path={"/api/users"}
  parameters={[]}
  requestBody={{"required":false,"description":"The user to save.","contentType":"application/json","schema":{"type":"object","properties":{"id":{"type":"string"},"name":{"type":"string"}},"required":["id","name"]}}}
  baseUrl={""}
/>

