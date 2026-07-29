# GET Bad Request response

<APIEndpoint
  method={"GET"}
  path={"/status/bad-request"}
  summary={"Bad Request response"}
  deprecated={false}
  baseUrl={""}
/>

## Responses

<APIResponse
  statusCode={"400"}
  description={"Bad request"}
  contentType={"application/json"}
  schema={{"type":"object","properties":{"code":{"type":"string"},"message":{"type":"string"},"details":{}},"required":["code","message"]}}
/>

## Try It

<APIPlayground
  method={"GET"}
  path={"/status/bad-request"}
  parameters={[]}
  baseUrl={""}
/>

