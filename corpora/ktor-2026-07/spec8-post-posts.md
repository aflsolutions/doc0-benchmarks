# POST Create or update a post.

<APIEndpoint
  method={"POST"}
  path={"/posts"}
  summary={"Create or update a post."}
  deprecated={false}
  baseUrl={""}
/>

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
  method={"POST"}
  path={"/posts"}
  parameters={[]}
  requestBody={{"required":false,"description":null,"contentType":"application/json","schema":{"type":"object","properties":{"id":{"type":"integer"},"title":{"type":"string"},"content":{"type":"string"},"authorId":{"type":"integer"}},"required":["id","title","content","authorId"]}}}
  baseUrl={""}
/>

