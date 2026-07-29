# GET Get a list of users.

<APIEndpoint
  method={"GET"}
  path={"/api/users"}
  summary={"Get a list of users."}
  deprecated={false}
  baseUrl={""}
/>

## Parameters

<APIParameters parameters={[{"name":"q","in":"query","required":false,"description":"Search query","schema":{"type":"string"}},{"name":"limit","in":"query","required":false,"description":"Max items to return","schema":{"type":"integer"}}]} />

## Responses

<APIResponse
  statusCode={"200"}
  description={"A list of users."}
  contentType={"application/json"}
  schema={{"type":"array","items":{"type":"object","properties":{"id":{"type":"integer"},"name":{"type":"string"}},"required":["id","name"]}}}
/>

## Try It

<APIPlayground
  method={"GET"}
  path={"/api/users"}
  parameters={[{"name":"q","in":"query","required":false,"description":"Search query","schema":{"type":"string"}},{"name":"limit","in":"query","required":false,"description":"Max items to return","schema":{"type":"integer"}}]}
  baseUrl={""}
/>

