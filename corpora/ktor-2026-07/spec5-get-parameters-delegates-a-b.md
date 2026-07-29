# GET Get Delegates

<APIEndpoint
  method={"GET"}
  path={"/parameters/delegates/{a}/{b}"}
  deprecated={false}
  baseUrl={""}
/>

## Parameters

<APIParameters parameters={[{"name":"a","in":"path","required":true,"description":null,"schema":{"type":"string"}},{"name":"b","in":"path","required":true,"description":null,"schema":{"type":"integer"}},{"name":"c","in":"query","required":false,"description":null,"schema":{"type":"string"}}]} />

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
  path={"/parameters/delegates/{a}/{b}"}
  parameters={[{"name":"a","in":"path","required":true,"description":null,"schema":{"type":"string"}},{"name":"b","in":"path","required":true,"description":null,"schema":{"type":"integer"}},{"name":"c","in":"query","required":false,"description":null,"schema":{"type":"string"}}]}
  baseUrl={""}
/>

