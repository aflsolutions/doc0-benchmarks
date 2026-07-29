# GET Get a single user

<APIEndpoint
  method={"GET"}
  path={"/api/users/{id}"}
  summary={"Get a single user"}
  deprecated={false}
  baseUrl={""}
/>

## Parameters

<APIParameters parameters={[{"name":"id","in":"path","required":true,"description":"The ID of the user","schema":{"type":"integer"}}]} />

## Responses

<APIResponse
  statusCode={"200"}
  description={""}
  contentType={"application/json"}
  schema={{"type":"object","properties":{"id":{"type":"integer"},"name":{"type":"string"}},"required":["id","name"]}}
/>

<APIResponse
  statusCode={"400"}
  description={"Bad ID argument"}
/>

<APIResponse
  statusCode={"404"}
  description={"The user was not found"}
/>

## Try It

<APIPlayground
  method={"GET"}
  path={"/api/users/{id}"}
  parameters={[{"name":"id","in":"path","required":true,"description":"The ID of the user","schema":{"type":"integer"}}]}
  baseUrl={""}
/>

