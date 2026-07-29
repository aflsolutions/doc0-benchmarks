# GET Get Users

<APIEndpoint
  method={"GET"}
  path={"/api/data/users/{id}"}
  deprecated={false}
  baseUrl={""}
/>

## Parameters

<APIParameters parameters={[{"name":"id","in":"path","required":true,"description":null,"schema":{"type":"string"}}]} />

## Responses

<APIResponse
  statusCode={"200"}
  description={""}
  contentType={"application/json"}
  schema={{"type":"object","properties":{"id":{"type":"string"},"name":{"type":"string"}},"required":["id","name"]}}
/>

<APIResponse
  statusCode={"404"}
  description={""}
/>

## Try It

<APIPlayground
  method={"GET"}
  path={"/api/data/users/{id}"}
  parameters={[{"name":"id","in":"path","required":true,"description":null,"schema":{"type":"string"}}]}
  baseUrl={""}
/>

