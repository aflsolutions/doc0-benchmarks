# PUT Update a post.

<APIEndpoint
  method={"PUT"}
  path={"/posts/{id}"}
  summary={"Update a post."}
  deprecated={false}
  baseUrl={""}
/>

## Parameters

<APIParameters parameters={[{"name":"id","in":"path","required":true,"description":null,"schema":{"type":"integer"}}]} />

## Request Body

<APIRequestBody
  contentType={"application/json"}
  required={false}
  schema={{"type":"object","properties":{"id":{"type":"integer"},"title":{"type":"string"},"content":{"type":"string"},"authorId":{"type":"integer"}},"required":["id","title","content","authorId"]}}
/>

## Responses

<APIResponse
  statusCode={"200"}
  description={""}
  contentType={"text/plain"}
  schema={{}}
/>

## Try It

<APIPlayground
  method={"PUT"}
  path={"/posts/{id}"}
  parameters={[{"name":"id","in":"path","required":true,"description":null,"schema":{"type":"integer"}}]}
  requestBody={{"required":false,"description":null,"contentType":"application/json","schema":{"type":"object","properties":{"id":{"type":"integer"},"title":{"type":"string"},"content":{"type":"string"},"authorId":{"type":"integer"}},"required":["id","title","content","authorId"]}}}
  baseUrl={""}
/>

