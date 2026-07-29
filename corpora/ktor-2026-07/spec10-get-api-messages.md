# GET Get a list of messages.

<APIEndpoint
  method={"GET"}
  path={"/api/messages"}
  summary={"Get a list of messages."}
  deprecated={false}
  baseUrl={""}
/>

## Responses

<APIResponse
  statusCode={"200"}
  description={"A list of messages."}
  contentType={"application/json"}
  schema={{"type":"array","items":{"type":"object","properties":{"id":{"type":"string"},"text":{"type":"string"}},"required":["id","text"]}}}
/>

## Try It

<APIPlayground
  method={"GET"}
  path={"/api/messages"}
  parameters={[]}
  baseUrl={""}
/>

