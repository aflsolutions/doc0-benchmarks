# GET Get Messages

<APIEndpoint
  method={"GET"}
  path={"/api/data/messages"}
  deprecated={false}
  baseUrl={""}
/>

## Responses

<APIResponse
  statusCode={"200"}
  description={""}
  contentType={"application/json"}
  schema={{"type":"array","items":{"type":"object","properties":{"id":{"type":"string"},"text":{"type":"string"}},"required":["id","text"]}}}
/>

## Try It

<APIPlayground
  method={"GET"}
  path={"/api/data/messages"}
  parameters={[]}
  baseUrl={""}
/>

