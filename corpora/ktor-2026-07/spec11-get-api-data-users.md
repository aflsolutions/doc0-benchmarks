# GET Get Users

<APIEndpoint
  method={"GET"}
  path={"/api/data/users"}
  deprecated={false}
  baseUrl={""}
/>

## Responses

<APIResponse
  statusCode={"200"}
  description={""}
  contentType={"application/json"}
  schema={{"type":"array","items":{"type":"object","properties":{"id":{"type":"string"},"name":{"type":"string"}},"required":["id","name"]}}}
/>

## Try It

<APIPlayground
  method={"GET"}
  path={"/api/data/users"}
  parameters={[]}
  baseUrl={""}
/>

