# GET Not Found response

<APIEndpoint
  method={"GET"}
  path={"/status/not-found"}
  summary={"Not Found response"}
  deprecated={false}
  baseUrl={""}
/>

## Responses

<APIResponse
  statusCode={"404"}
  description={"Resource not found"}
  contentType={"application/json"}
  schema={{"type":"object","properties":{"code":{"type":"string"},"message":{"type":"string"},"details":{}},"required":["code","message"]}}
/>

## Try It

<APIPlayground
  method={"GET"}
  path={"/status/not-found"}
  parameters={[]}
  baseUrl={""}
/>

