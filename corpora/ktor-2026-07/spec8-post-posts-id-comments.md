# POST Add a comment to a post.

<APIEndpoint
  method={"POST"}
  path={"/posts/{id}/comments"}
  summary={"Add a comment to a post."}
  deprecated={false}
  baseUrl={""}
/>

## Parameters

<APIParameters parameters={[{"name":"id","in":"path","required":true,"description":null,"schema":{"type":"integer"}}]} />

## Responses

<APIResponse
  statusCode={"200"}
  description={""}
  contentType={"text/plain"}
  schema={{}}
/>

## Try It

<APIPlayground
  method={"POST"}
  path={"/posts/{id}/comments"}
  parameters={[{"name":"id","in":"path","required":true,"description":null,"schema":{"type":"integer"}}]}
  baseUrl={""}
/>

