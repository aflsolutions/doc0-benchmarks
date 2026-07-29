# GET Get a list of comments for a specific article.

<APIEndpoint
  method={"GET"}
  path={"/articles/{id}/comments"}
  summary={"Get a list of comments for a specific article."}
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
  schema={{"type":"object","properties":{"parent":{"type":"object","properties":{"parent":{"type":"object","properties":{}},"id":{"type":"integer"}},"required":["parent","id"]}},"required":["parent"]}}
/>

## Try It

<APIPlayground
  method={"GET"}
  path={"/articles/{id}/comments"}
  parameters={[{"name":"id","in":"path","required":true,"description":null,"schema":{"type":"integer"}}]}
  baseUrl={""}
/>

