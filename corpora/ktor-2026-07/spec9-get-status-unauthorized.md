# GET Unauthorized response

<APIEndpoint
  method={"GET"}
  path={"/status/unauthorized"}
  summary={"Unauthorized response"}
  deprecated={false}
  baseUrl={""}
/>

## Responses

<APIResponse
  statusCode={"401"}
  description={"Authentication required"}
  contentType={"application/json"}
  schema={{"type":"object","properties":{"code":{"type":"string"},"message":{"type":"string"},"details":{}},"required":["code","message"]}}
/>

## Try It

<APIPlayground
  method={"GET"}
  path={"/status/unauthorized"}
  parameters={[]}
  baseUrl={""}
/>

