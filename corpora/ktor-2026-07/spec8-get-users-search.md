# GET Search for users.

<APIEndpoint
  method={"GET"}
  path={"/users/search"}
  summary={"Search for users."}
  deprecated={false}
  baseUrl={""}
/>

## Parameters

<APIParameters parameters={[{"name":"query","in":"query","required":true,"description":null,"schema":{"type":"string"}},{"name":"limit","in":"query","required":false,"description":null,"schema":{"type":"integer"}},{"name":"offset","in":"query","required":false,"description":null,"schema":{"type":"integer"}}]} />

## Responses

<APIResponse
  statusCode={"200"}
  description={""}
  contentType={"text/plain"}
  schema={{}}
/>

## Try It

<APIPlayground
  method={"GET"}
  path={"/users/search"}
  parameters={[{"name":"query","in":"query","required":true,"description":null,"schema":{"type":"string"}},{"name":"limit","in":"query","required":false,"description":null,"schema":{"type":"integer"}},{"name":"offset","in":"query","required":false,"description":null,"schema":{"type":"integer"}}]}
  baseUrl={""}
/>

