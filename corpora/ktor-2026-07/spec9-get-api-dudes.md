# GET Get list of dudes

<APIEndpoint
  method={"GET"}
  path={"/api/dudes"}
  summary={"Get list of dudes"}
  deprecated={false}
  baseUrl={""}
/>

## Responses

<APIResponse
  statusCode={"200"}
  description={"List of dudes"}
  contentType={"application/json"}
  schema={{"type":"array","items":{"type":"object","properties":{"id":{"type":"integer"},"name":{"type":"string"}},"required":["id","name"]}}}
/>

## Try It

<APIPlayground
  method={"GET"}
  path={"/api/dudes"}
  parameters={[]}
  baseUrl={""}
/>

