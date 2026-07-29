# GET Internal Server Error response

<APIEndpoint
  method={"GET"}
  path={"/status/server-error"}
  summary={"Internal Server Error response"}
  deprecated={false}
  baseUrl={""}
/>

## Responses

<APIResponse
  statusCode={"500"}
  description={"Server error"}
  contentType={"application/json"}
  schema={{"type":"object","properties":{"code":{"type":"string"},"message":{"type":"string"},"details":{}},"required":["code","message"]}}
/>

## Try It

<APIPlayground
  method={"GET"}
  path={"/status/server-error"}
  parameters={[]}
  baseUrl={""}
/>

