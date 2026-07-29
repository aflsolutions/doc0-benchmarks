# GET Get Pets

<APIEndpoint
  method={"GET"}
  path={"/pets/{id}"}
  description={"Returns a user based on a single ID, if the user does not have access to the pet"}
  deprecated={false}
  baseUrl={"https://petstore.swagger.io/v2"}
/>

## Parameters

<APIParameters parameters={[{"name":"id","in":"path","required":true,"description":"ID of pet to fetch","schema":{"type":"integer","format":"int64"}}]} />

## Responses

<APIResponse
  statusCode={"200"}
  description={"pet response"}
  contentType={"application/json"}
  schema={{}}
/>

<APIResponse
  statusCode={"default"}
  description={"unexpected error"}
  contentType={"application/json"}
  schema={{"type":"object","properties":{"code":{"type":"integer","format":"int32"},"message":{"type":"string"}},"required":["code","message"]}}
/>

## Try It

<APIPlayground
  method={"GET"}
  path={"/pets/{id}"}
  parameters={[{"name":"id","in":"path","required":true,"description":"ID of pet to fetch","schema":{"type":"integer","format":"int64"}}]}
  baseUrl={"https://petstore.swagger.io/v2"}
/>

