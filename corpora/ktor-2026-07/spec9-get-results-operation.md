# GET Operation with multiple possible outcomes

<APIEndpoint
  method={"GET"}
  path={"/results/operation"}
  summary={"Operation with multiple possible outcomes"}
  deprecated={false}
  baseUrl={""}
/>

## Parameters

<APIParameters parameters={[{"name":"success","in":"query","required":false,"description":"Should the operation succeed","schema":{"type":"boolean"}},{"name":"includeWarning","in":"query","required":false,"description":"Include warning in response","schema":{"type":"boolean"}},{"name":"success","in":"query","required":false,"description":null,"schema":{"type":"string"}},{"name":"includeWarning","in":"query","required":false,"description":null,"schema":{"type":"string"}}]} />

## Responses

<APIResponse
  statusCode={"200"}
  description={"Operation succeeded"}
  contentType={"application/json"}
  schema={{"type":"object","properties":{"message":{"type":"string"},"data":{"type":"object"}},"required":["message","data"]}}
/>

<APIResponse
  statusCode={"207"}
  description={"Operation partially succeeded"}
  contentType={"application/json"}
  schema={{"type":"object","properties":{"message":{"type":"string"},"warnings":{"type":"array","items":{"type":"string"}}},"required":["message","warnings"]}}
/>

<APIResponse
  statusCode={"400"}
  description={"Operation failed - client error"}
  contentType={"application/json"}
  schema={{"type":"object","properties":{"code":{"type":"string"},"message":{"type":"string"},"details":{}},"required":["code","message"]}}
/>

<APIResponse
  statusCode={"500"}
  description={"Operation failed - server error"}
  contentType={"application/json"}
  schema={{"type":"object","properties":{"code":{"type":"string"},"message":{"type":"string"},"details":{}},"required":["code","message"]}}
/>

## Try It

<APIPlayground
  method={"GET"}
  path={"/results/operation"}
  parameters={[{"name":"success","in":"query","required":false,"description":"Should the operation succeed","schema":{"type":"boolean"}},{"name":"includeWarning","in":"query","required":false,"description":"Include warning in response","schema":{"type":"boolean"}},{"name":"success","in":"query","required":false,"description":null,"schema":{"type":"string"}},{"name":"includeWarning","in":"query","required":false,"description":null,"schema":{"type":"string"}}]}
  baseUrl={""}
/>

