# GET Get a list of users.

<APIEndpoint
  method={"GET"}
  path={"/api/users"}
  summary={"Get a list of users."}
  deprecated={false}
  baseUrl={""}
/>

## Responses

<APIResponse
  statusCode={"200"}
  description={"A list of users."}
  contentType={"application/json"}
  schema={{"type":"array","items":{"type":"object","properties":{"id":{"type":"string"},"name":{"type":"string"}},"required":["id","name"]}}}
/>

## Try It

<APIPlayground
  method={"GET"}
  path={"/api/users"}
  parameters={[]}
  baseUrl={""}
/>

