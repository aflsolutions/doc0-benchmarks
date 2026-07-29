# POST Create a new dude

<APIEndpoint
  method={"POST"}
  path={"/api/dudes"}
  summary={"Create a new dude"}
  deprecated={false}
  baseUrl={""}
/>

## Request Body

Dude creation request

<APIRequestBody
  contentType={"application/json"}
  required={false}
  schema={{"type":"object","properties":{"name":{"type":"string"}},"required":["name"]}}
/>

## Responses

<APIResponse
  statusCode={"201"}
  description={"Created dude"}
  contentType={"application/json"}
  schema={{"type":"object","properties":{"id":{"type":"integer"},"name":{"type":"string"}},"required":["id","name"]}}
/>

<APIResponse
  statusCode={"400"}
  description={""}
  contentType={"application/json"}
  schema={{"type":"object","properties":{"code":{"type":"string"},"message":{"type":"string"},"details":{}},"required":["code","message"]}}
/>

## Try It

<APIPlayground
  method={"POST"}
  path={"/api/dudes"}
  parameters={[]}
  requestBody={{"required":false,"description":"Dude creation request","contentType":"application/json","schema":{"type":"object","properties":{"name":{"type":"string"}},"required":["name"]}}}
  baseUrl={""}
/>

