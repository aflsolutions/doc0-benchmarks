# GET External type reference.

<APIEndpoint
  method={"GET"}
  path={"/server"}
  summary={"External type reference."}
  deprecated={false}
  baseUrl={""}
/>

## Responses

<APIResponse
  statusCode={"200"}
  description={"A server"}
  contentType={"application/json"}
  schema={{"type":"object","properties":{"url":{"type":"string"},"description":{},"extensions":{}},"required":["url"]}}
/>

<APIResponse
  statusCode={"502"}
  description={""}
/>

## Try It

<APIPlayground
  method={"GET"}
  path={"/server"}
  parameters={[]}
  baseUrl={""}
/>

