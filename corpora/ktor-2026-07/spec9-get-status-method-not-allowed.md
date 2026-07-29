# GET Method Not Allowed response

<APIEndpoint
  method={"GET"}
  path={"/status/method-not-allowed"}
  summary={"Method Not Allowed response"}
  deprecated={false}
  baseUrl={""}
/>

## Responses

<APIResponse
  statusCode={"405"}
  description={"Method not allowed"}
  contentType={"application/json"}
  schema={{"type":"object","properties":{"code":{"type":"string"},"message":{"type":"string"},"details":{}},"required":["code","message"]}}
/>

## Try It

<APIPlayground
  method={"GET"}
  path={"/status/method-not-allowed"}
  parameters={[]}
  baseUrl={""}
/>

