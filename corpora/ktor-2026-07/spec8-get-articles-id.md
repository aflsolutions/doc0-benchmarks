# GET Get a single article by ID.

<APIEndpoint
  method={"GET"}
  path={"/articles/{id}"}
  summary={"Get a single article by ID."}
  deprecated={false}
  baseUrl={""}
/>

## Parameters

<APIParameters parameters={[{"name":"id","in":"path","required":true,"description":null,"schema":{"type":"integer"}}]} />

## Responses

<APIResponse
  statusCode={"200"}
  description={""}
  contentType={"application/json"}
  schema={{"type":"object","properties":{"id":{"type":"integer"},"title":{"type":"string"},"content":{"type":"string"},"authorId":{"type":"integer"}},"required":["id","title","content","authorId"]}}
/>

<APIResponse
  statusCode={"404"}
  description={""}
  contentType={"text/plain"}
  schema={{}}
/>

## Try It

<APIPlayground
  method={"GET"}
  path={"/articles/{id}"}
  parameters={[{"name":"id","in":"path","required":true,"description":null,"schema":{"type":"integer"}}]}
  baseUrl={""}
/>

