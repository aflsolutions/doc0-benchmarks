# DELETE Delete Pets

<APIEndpoint
  method={"DELETE"}
  path={"/pets/{id}"}
  description={"deletes a single pet based on the ID supplied"}
  deprecated={false}
  baseUrl={"https://petstore.swagger.io/v2"}
/>

## Parameters

<APIParameters parameters={[{"name":"id","in":"path","required":true,"description":"ID of pet to delete","schema":{"type":"integer","format":"int64"}}]} />

## Responses

<APIResponse
  statusCode={"204"}
  description={"pet deleted"}
/>

<APIResponse
  statusCode={"default"}
  description={"unexpected error"}
  contentType={"application/json"}
  schema={{"type":"object","properties":{"code":{"type":"integer","format":"int32"},"message":{"type":"string"}},"required":["code","message"]}}
/>

## Try It

<APIPlayground
  method={"DELETE"}
  path={"/pets/{id}"}
  parameters={[{"name":"id","in":"path","required":true,"description":"ID of pet to delete","schema":{"type":"integer","format":"int64"}}]}
  baseUrl={"https://petstore.swagger.io/v2"}
/>

