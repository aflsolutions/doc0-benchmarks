# GET Get a list of featured articles.

<APIEndpoint
  method={"GET"}
  path={"/articles/featured"}
  summary={"Get a list of featured articles."}
  deprecated={false}
  baseUrl={""}
/>

## Responses

<APIResponse
  statusCode={"200"}
  description={""}
  contentType={"application/json"}
  schema={{"type":"array","items":{"type":"object","properties":{"id":{"type":"integer"},"title":{"type":"string"},"content":{"type":"string"},"authorId":{"type":"integer"}},"required":["id","title","content","authorId"]}}}
/>

## Try It

<APIPlayground
  method={"GET"}
  path={"/articles/featured"}
  parameters={[]}
  baseUrl={""}
/>

