# GET Get animal by ID

<APIEndpoint
  method={"GET"}
  path={"/polymorphic/animals/{id}"}
  summary={"Get animal by ID"}
  deprecated={false}
  baseUrl={""}
/>

## Parameters

<APIParameters parameters={[{"name":"id","in":"path","required":true,"description":"Animal ID","schema":{"type":"integer"}}]} />

## Responses

<APIResponse
  statusCode={"200"}
  description={"Animal details (can be Dog or Cat)"}
  contentType={"application/json"}
  schema={{"type":"object"}}
/>

<APIResponse
  statusCode={"400"}
  description={""}
  contentType={"application/json"}
  schema={{"type":"string"}}
/>

<APIResponse
  statusCode={"404"}
  description={"Animal not found"}
  contentType={"application/json"}
  schema={{"type":"string"}}
/>

## Try It

<APIPlayground
  method={"GET"}
  path={"/polymorphic/animals/{id}"}
  parameters={[{"name":"id","in":"path","required":true,"description":"Animal ID","schema":{"type":"integer"}}]}
  baseUrl={""}
/>

