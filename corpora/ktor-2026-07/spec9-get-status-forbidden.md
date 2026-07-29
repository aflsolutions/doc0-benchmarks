# GET Forbidden response

<APIEndpoint
  method={"GET"}
  path={"/status/forbidden"}
  summary={"Forbidden response"}
  deprecated={false}
  baseUrl={""}
/>

## Responses

<APIResponse
  statusCode={"403"}
  description={"Permission denied"}
  contentType={"application/json"}
  schema={{"type":"object","properties":{"code":{"type":"string"},"message":{"type":"string"},"details":{}},"required":["code","message"]}}
/>

## Try It

<APIPlayground
  method={"GET"}
  path={"/status/forbidden"}
  parameters={[]}
  baseUrl={""}
/>

